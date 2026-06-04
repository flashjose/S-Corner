package com.scorner.service;

import com.scorner.entity.Article;
import com.scorner.entity.ArticleImage;
import com.scorner.entity.Paragraph;
import com.scorner.repository.ArticleImageRepository;
import com.scorner.repository.ArticleRepository;
import com.scorner.repository.ParagraphRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Profile("legacy")
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final ParagraphRepository paragraphRepository;
    private final ArticleImageRepository articleImageRepository;

    public ArticleService(ArticleRepository articleRepository,
                          ParagraphRepository paragraphRepository,
                          ArticleImageRepository articleImageRepository) {
        this.articleRepository = articleRepository;
        this.paragraphRepository = paragraphRepository;
        this.articleImageRepository = articleImageRepository;
    }

    /**
     * 查询文章列表（支持筛选 + 分页）
     */
    public Map<String, Object> listArticles(String category, String difficulty,
                                             String status, String source,
                                             Boolean isFromRss, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Article> spec = Specification.where(null);

        if (category != null && !category.isEmpty()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("category"), category));
        }
        if (difficulty != null && !difficulty.isEmpty()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("difficulty"), difficulty));
        }
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (source != null && !source.isEmpty()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("source"), source));
        }
        if (isFromRss != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("isFromRss"), isFromRss));
        }

        Page<Article> articlePage = articleRepository.findAll(spec, pageable);

        return Map.of(
            "articles", articlePage.getContent(),
            "total", articlePage.getTotalElements(),
            "page", page,
            "limit", limit
        );
    }

    /**
     * 获取单篇文章详情（含段落、标注、图片）
     */
    public Optional<Article> getArticleById(String id) {
        return articleRepository.findByIdWithDetails(id);
    }

    /**
     * 创建文章
     */
    @Transactional
    public Article createArticle(String title, String content, String source,
                                  String sourceUrl, String author, String category,
                                  String difficulty, String tags, List<Map<String, Object>> paragraphs) {
        Article article = new Article();
        article.setTitle(title);
        article.setContent(content);
        article.setSource(source);
        article.setSourceUrl(sourceUrl);
        article.setAuthor(author);
        article.setCategory(category != null ? category : "news");
        article.setDifficulty(difficulty != null ? difficulty : "medium");
        article.setTags(tags != null ? tags : "[]");
        article.setStatus("published");

        article = articleRepository.save(article);

        if (paragraphs != null) {
            for (int i = 0; i < paragraphs.size(); i++) {
                Map<String, Object> p = paragraphs.get(i);
                Paragraph para = new Paragraph();
                para.setArticleId(article.getId());
                para.setIndex(i);
                para.setOriginalText((String) p.get("originalText"));
                para.setChineseTranslation((String) p.get("chineseTranslation"));
                para.setGrammaticalAnalysis((String) p.get("grammaticalAnalysis"));
                para.setExpressionTips((String) p.get("expressionTips"));
                paragraphRepository.save(para);
            }
        }

        return articleRepository.findByIdWithDetails(article.getId()).orElse(article);
    }

    /**
     * 更新文章
     */
    @Transactional
    public Article updateArticle(String id, Map<String, Object> fields) {
        Article article = articleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Article not found: " + id));

        if (fields.containsKey("title")) article.setTitle((String) fields.get("title"));
        if (fields.containsKey("content")) article.setContent((String) fields.get("content"));
        if (fields.containsKey("source")) article.setSource((String) fields.get("source"));
        if (fields.containsKey("sourceUrl")) article.setSourceUrl((String) fields.get("sourceUrl"));
        if (fields.containsKey("author")) article.setAuthor((String) fields.get("author"));
        if (fields.containsKey("category")) article.setCategory((String) fields.get("category"));
        if (fields.containsKey("difficulty")) article.setDifficulty((String) fields.get("difficulty"));
        if (fields.containsKey("tags")) {
            Object tags = fields.get("tags");
            article.setTags(tags instanceof List ? tags.toString() : (String) tags);
        }
        if (fields.containsKey("status")) article.setStatus((String) fields.get("status"));

        return articleRepository.save(article);
    }

    /**
     * 删除文章
     */
    @Transactional
    public void deleteArticle(String id) {
        articleRepository.deleteById(id);
    }

    /**
     * 更新文章段落
     */
    @Transactional
    public int updateParagraphs(String articleId, List<Map<String, Object>> paragraphs) {
        paragraphRepository.deleteByArticleId(articleId);

        for (int i = 0; i < paragraphs.size(); i++) {
            Map<String, Object> p = paragraphs.get(i);
            Paragraph para = new Paragraph();
            para.setArticleId(articleId);
            para.setIndex(i);
            para.setOriginalText((String) p.get("originalText"));
            para.setChineseTranslation((String) p.get("chineseTranslation"));
            para.setGrammaticalAnalysis((String) p.get("grammaticalAnalysis"));
            para.setExpressionTips((String) p.get("expressionTips"));
            paragraphRepository.save(para);
        }

        return paragraphs.size();
    }
}
