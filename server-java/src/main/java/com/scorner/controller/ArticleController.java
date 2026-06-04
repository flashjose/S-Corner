package com.scorner.controller;

import com.scorner.entity.Article;
import com.scorner.service.ArticleService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Profile("legacy")
@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    /**
     * GET /api/articles - 查询文章列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listArticles(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Boolean isFromRss,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(articleService.listArticles(category, difficulty, status, source, isFromRss, page, limit));
    }

    /**
     * GET /api/articles/:id - 获取单篇文章详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getArticle(@PathVariable String id) {
        return articleService.getArticleById(id)
            .map(a -> ResponseEntity.ok((Object) a))
            .orElse(ResponseEntity.status(404).body(Map.of("error", "Article not found")));
    }

    /**
     * POST /api/articles - 创建文章
     */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<Article> createArticle(@RequestBody Map<String, Object> body) {
        Article article = articleService.createArticle(
            (String) body.get("title"),
            (String) body.get("content"),
            (String) body.get("source"),
            (String) body.get("sourceUrl"),
            (String) body.get("author"),
            (String) body.get("category"),
            (String) body.get("difficulty"),
            body.containsKey("tags") ? body.get("tags").toString() : null,
            (List<Map<String, Object>>) body.get("paragraphs")
        );
        return ResponseEntity.status(201).body(article);
    }

    /**
     * PUT /api/articles/:id - 更新文章
     */
    @PutMapping("/{id}")
    public ResponseEntity<Article> updateArticle(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(articleService.updateArticle(id, body));
    }

    /**
     * DELETE /api/articles/:id - 删除文章
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteArticle(@PathVariable String id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * POST /api/articles/:id/paragraphs - 更新文章段落
     */
    @PostMapping("/{id}/paragraphs")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Integer>> updateParagraphs(
            @PathVariable String id, @RequestBody Map<String, Object> body) {
        List<Map<String, Object>> paragraphs = (List<Map<String, Object>>) body.get("paragraphs");
        int count = articleService.updateParagraphs(id, paragraphs);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
