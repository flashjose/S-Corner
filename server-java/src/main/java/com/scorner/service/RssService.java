package com.scorner.service;

import com.scorner.entity.Article;
import com.scorner.entity.ArticleImage;
import com.scorner.entity.Paragraph;
import com.scorner.entity.RssFeed;
import com.scorner.repository.ArticleImageRepository;
import com.scorner.repository.ArticleRepository;
import com.scorner.repository.ParagraphRepository;
import com.scorner.repository.RssFeedRepository;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.springframework.data.domain.Sort;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URL;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Profile("legacy")
public class RssService {

    private static final Logger log = LoggerFactory.getLogger(RssService.class);

    private final RssFeedRepository rssFeedRepository;
    private final ArticleRepository articleRepository;
    private final ParagraphRepository paragraphRepository;
    private final ArticleImageRepository articleImageRepository;

    // 站点正文选择器
    private static final Map<String, String> SITE_SELECTORS = Map.ofEntries(
        Map.entry("nature.com", "article .c-article-body"),
        Map.entry("science.org", "article .article-body"),
        Map.entry("bbc.co.uk", "article [data-component=\"text-block\"]"),
        Map.entry("bbc.com", "article [data-component=\"text-block\"]"),
        Map.entry("theguardian.com", "article .article-body-commercial-selector"),
        Map.entry("technologyreview.com", "div[class*=body]"),
        Map.entry("theatlantic.com", "div[class*=ArticleBody]"),
        Map.entry("scientificamerican.com", "div[class*=article-body]"),
        Map.entry("aeon.co", "div[class*=article-body]"),
        Map.entry("arxiv.org", ".ltx_document"),
        Map.entry("wikipedia.org", "#mw-content-text .mw-parser-output")
    );

    // 噪声选择器
    private static final String[] NOISE_SELECTORS = {
        "[class*=references]", "[class*=biblio]", "[id*=references]", "[id*=biblio]",
        "[class*=Reference]", ".c-article-references", "#references",
        "[class*=author]", "[class*=affiliation]", "[class*=contributor]",
        ".c-article-author-affiliation", ".c-author-list",
        "[class*=acknowledgement]", "[class*=acknowledgment]",
        "[class*=data-availability]", "[class*=competing]",
        "[class*=ethics]", "[class*=additional-information]",
        "[class*=change-history]", "[class*=peer-review]",
        "nav", "header", "footer", "aside",
        "[role=navigation]", "[role=banner]", "[role=complementary]",
        "[class*=sidebar]", "[class*=advert]", "[class*=social]",
        "[class*=share]", "[class*=newsletter]", "[class*=subscribe]",
        "[class*=cookie]", "[class*=popup]", "[class*=modal]",
        "[class*=citation]", "[class*=doi]", "[class*=publisher]",
        "[class*=copyright]", "[class*=licence]", "[class*=license]",
        "[class*=search]", "[class*=recommendation]",
        "[class*=related-articles]", "[class*=related-content]",
        "script", "style", "noscript", "iframe",
        "[class*=toolbar]", "[class*=toolbox]",
        "[class*=figure-caption]"
    };

    // 噪声段落匹配
    private static final Pattern[] NOISE_PATTERNS = {
        Pattern.compile("^\\[\\d+\\]\\s"),
        Pattern.compile("Article\\s+(Google Scholar|ADS|CAS|PubMed)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("Search author on:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^DOI:\\s*https?://", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^Preprint at\\s+https?://", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^https?://doi\\.org/", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^(Department|Institute|School|University|Observatory|Laboratory|Center|Centre)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^(We thank|We are grateful|This work is supported|This paper is supported)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^(Acknowledgement|Acknowledgment|Data availability|Competing interests|Correspondence)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^(Springer Nature|Publisher|The authors declare)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^(Copyright|©)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^(Article|ADS|CAS|PubMed|Google Scholar|\\s)+$", Pattern.CASE_INSENSITIVE)
    };

    public RssService(RssFeedRepository rssFeedRepository,
                      ArticleRepository articleRepository,
                      ParagraphRepository paragraphRepository,
                      ArticleImageRepository articleImageRepository) {
        this.rssFeedRepository = rssFeedRepository;
        this.articleRepository = articleRepository;
        this.paragraphRepository = paragraphRepository;
        this.articleImageRepository = articleImageRepository;
    }

    // ── CRUD ──

    public List<RssFeed> listFeeds() {
        return rssFeedRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Transactional
    public RssFeed createFeed(String name, String url, String category) {
        if (rssFeedRepository.findByUrl(url).isPresent()) {
            throw new RuntimeException("Feed URL already exists");
        }
        RssFeed feed = new RssFeed();
        feed.setName(name);
        feed.setUrl(url);
        feed.setCategory(category != null ? category : "news");
        return rssFeedRepository.save(feed);
    }

    @Transactional
    public RssFeed updateFeed(String id, Map<String, Object> fields) {
        RssFeed feed = rssFeedRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Feed not found: " + id));

        if (fields.containsKey("name")) feed.setName((String) fields.get("name"));
        if (fields.containsKey("url")) feed.setUrl((String) fields.get("url"));
        if (fields.containsKey("category")) feed.setCategory((String) fields.get("category"));
        if (fields.containsKey("isActive")) feed.setIsActive((Boolean) fields.get("isActive"));
        if (fields.containsKey("fetchHour")) feed.setFetchHour((Integer) fields.get("fetchHour"));
        if (fields.containsKey("fetchMinute")) feed.setFetchMinute((Integer) fields.get("fetchMinute"));

        return rssFeedRepository.save(feed);
    }

    @Transactional
    public void deleteFeed(String id) {
        rssFeedRepository.deleteById(id);
    }

    // ── Fetch Logic ──

    @Transactional
    public Map<String, Integer> fetchFeed(String feedId) {
        RssFeed feed = rssFeedRepository.findById(feedId)
            .orElseThrow(() -> new RuntimeException("Feed not found: " + feedId));

        Map<String, Integer> result = doFetch(feed);
        feed.setLastFetchedAt(LocalDateTime.now());
        rssFeedRepository.save(feed);
        return result;
    }

    @Transactional
    public Map<String, Object> fetchAllFeeds() {
        List<RssFeed> feeds = rssFeedRepository.findByIsActiveTrue();
        int totalFetched = 0;
        int totalSkipped = 0;

        for (RssFeed feed : feeds) {
            try {
                Map<String, Integer> result = doFetch(feed);
                feed.setLastFetchedAt(LocalDateTime.now());
                rssFeedRepository.save(feed);
                totalFetched += result.getOrDefault("fetched", 0);
                totalSkipped += result.getOrDefault("skipped", 0);
            } catch (Exception e) {
                log.error("Failed to fetch {}: {}", feed.getName(), e.getMessage());
            }
        }

        return Map.of("feeds", feeds.size(), "fetched", totalFetched, "skipped", totalSkipped);
    }

    private Map<String, Integer> doFetch(RssFeed feed) {
        int fetched = 0;
        int skipped = 0;

        try {
            URL feedUrl = new URL(feed.getUrl());
            SyndFeedInput input = new SyndFeedInput();
            SyndFeed syndFeed = input.build(new XmlReader(feedUrl));

            List<SyndEntry> entries = syndFeed.getEntries().subList(0, Math.min(syndFeed.getEntries().size(), 10));

            for (SyndEntry entry : entries) {
                if (entry.getTitle() == null || entry.getLink() == null) {
                    skipped++;
                    continue;
                }

                if (articleRepository.findBySourceUrl(entry.getLink()).isPresent()) {
                    skipped++;
                    continue;
                }

                try {
                    Map<String, Object> extracted = extractArticleContent(entry.getLink());
                    String content = (String) extracted.get("text");
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> images = (List<Map<String, String>>) extracted.get("images");

                    List<String> paragraphTexts = splitIntoParagraphs(content);

                    String coverImage = images != null && !images.isEmpty() ? images.get(0).get("url") : null;

                    Article article = new Article();
                    article.setTitle(entry.getTitle());
                    article.setContent(content != null && !content.isEmpty() ? content : entry.getDescription() != null ? entry.getDescription().getValue() : "");
                    article.setSource(feed.getName());
                    article.setSourceUrl(entry.getLink());
                    article.setAuthor(entry.getAuthor());
                    article.setCategory(feed.getCategory());
                    article.setDifficulty("medium");
                    article.setTags("[]");
                    article.setIsFromRss(true);
                    article.setRssFeedId(feed.getId());
                    article.setImageUrl(coverImage);
                    article.setStatus("published");
                    if (entry.getPublishedDate() != null) {
                        article.setPublishedAt(entry.getPublishedDate().toInstant()
                            .atZone(ZoneId.systemDefault()).toLocalDateTime());
                    }

                    article = articleRepository.save(article);

                    for (int i = 0; i < paragraphTexts.size(); i++) {
                        Paragraph para = new Paragraph();
                        para.setArticleId(article.getId());
                        para.setIndex(i);
                        para.setOriginalText(paragraphTexts.get(i));
                        paragraphRepository.save(para);
                    }

                    if (images != null) {
                        for (int i = 0; i < images.size(); i++) {
                            Map<String, String> img = images.get(i);
                            ArticleImage image = new ArticleImage();
                            image.setArticleId(article.getId());
                            image.setUrl(img.get("url"));
                            image.setAlt(img.get("alt"));
                            image.setCaption(img.get("caption"));
                            image.setImageIndex(i);
                            articleImageRepository.save(image);
                        }
                    }

                    fetched++;
                    log.info("Fetched: {} ({} images)", article.getTitle(), images != null ? images.size() : 0);
                } catch (Exception e) {
                    log.error("Failed to process: {}", entry.getTitle(), e);
                    skipped++;
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse feed {}: {}", feed.getName(), e.getMessage());
        }

        return Map.of("fetched", fetched, "skipped", skipped);
    }

    private Map<String, Object> extractArticleContent(String url) {
        try {
            Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .timeout(20000)
                .get();

            // 移除噪声元素
            for (String selector : NOISE_SELECTORS) {
                doc.select(selector).remove();
            }

            // 获取正文容器
            String siteSelector = getSiteSelector(url);
            Element container = null;

            if (siteSelector != null) {
                container = doc.selectFirst(siteSelector);
            }

            // 回退：尝试通用容器
            if (container == null) {
                String[] fallbacks = {
                    "article .c-article-body", "article [itemprop=articleBody]",
                    "article", "main article", "[role=main] article",
                    "main", "[role=main]",
                    ".post-content", ".entry-content", ".article-content",
                    ".content-body", ".story-body"
                };
                for (String sel : fallbacks) {
                    Element el = doc.selectFirst(sel);
                    if (el != null && el.select("p").size() >= 2) {
                        container = el;
                        break;
                    }
                }
            }

            if (container == null) container = doc.body();

            // 提取段落
            List<String> paragraphs = new ArrayList<>();
            for (Element el : container.select("p, h2, h3, blockquote")) {
                String text = el.text().trim();
                if (!isNoiseParagraph(text)) {
                    paragraphs.add(text);
                }
            }

            // 提取图片
            List<Map<String, String>> images = new ArrayList<>();
            Set<String> seenUrls = new HashSet<>();
            for (Element img : container.select("figure img, .c-article-body img, article img")) {
                String src = img.attr("src");
                if (src.isEmpty()) src = img.attr("data-src");
                if (src.isEmpty()) continue;
                if (src.startsWith("data:")) continue;
                String lower = src.toLowerCase();
                if (lower.matches(".*(icon|logo|avatar|spinner|loading|placeholder|pixel|spacer|badge).*")) continue;

                try {
                    String resolvedUrl = new URL(new URL(url), src).toString();
                    if (seenUrls.contains(resolvedUrl)) continue;
                    seenUrls.add(resolvedUrl);

                    String alt = img.attr("alt");
                    Element figcaption = img.parent() != null ? img.parent().selectFirst("figcaption") : null;
                    String caption = figcaption != null ? figcaption.text().trim() : null;

                    Map<String, String> imgMap = new HashMap<>();
                    imgMap.put("url", resolvedUrl);
                    if (!alt.isEmpty()) imgMap.put("alt", alt);
                    if (caption != null && !caption.isEmpty()) imgMap.put("caption", caption);
                    images.add(imgMap);
                } catch (Exception ignored) {}
            }

            String text = String.join("\n\n", paragraphs);
            log.info("Extracted {} paragraphs, {} images from {}", paragraphs.size(), images.size(), url);

            return Map.of("text", text, "images", images);
        } catch (Exception e) {
            log.error("Failed to extract content from {}: {}", url, e.getMessage());
            return Map.of("text", "", "images", List.of());
        }
    }

    private String getSiteSelector(String url) {
        try {
            String hostname = new URL(url).getHost().replace("www.", "");
            for (Map.Entry<String, String> entry : SITE_SELECTORS.entrySet()) {
                if (hostname.contains(entry.getKey())) return entry.getValue();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private boolean isNoiseParagraph(String text) {
        String t = text.trim();
        if (t.length() < 20) return true;
        for (Pattern p : NOISE_PATTERNS) {
            if (p.matcher(t).find()) return true;
        }
        // 长段落但没有动词（可能是作者列表）
        if (t.length() > 100 && t.startsWith("A.") && t.split(",").length > 5) return true;
        // 图表说明
        if (t.matches("^(Fig\\.|Figure|Extended Data|Supplementary|Table)\\s+\\d.*") && t.length() > 200) return true;
        return false;
    }

    private List<String> splitIntoParagraphs(String text) {
        List<String> result = new ArrayList<>();
        if (text == null || text.isEmpty()) return result;
        for (String p : text.split("\n\n+")) {
            String trimmed = p.trim();
            if (trimmed.length() > 20) result.add(trimmed);
        }
        return result;
    }
}
