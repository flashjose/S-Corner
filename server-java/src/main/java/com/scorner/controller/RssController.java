package com.scorner.controller;

import com.scorner.entity.RssFeed;
import com.scorner.service.RssService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Profile("legacy")
@RestController
@RequestMapping("/api/rss")
public class RssController {

    private final RssService rssService;

    public RssController(RssService rssService) {
        this.rssService = rssService;
    }

    /**
     * GET /api/rss/feeds - 获取所有 RSS 订阅源
     */
    @GetMapping("/feeds")
    public ResponseEntity<List<RssFeed>> listFeeds() {
        return ResponseEntity.ok(rssService.listFeeds());
    }

    /**
     * POST /api/rss/feeds - 添加 RSS 订阅源
     */
    @PostMapping("/feeds")
    public ResponseEntity<?> createFeed(@RequestBody Map<String, Object> body) {
        try {
            RssFeed feed = rssService.createFeed(
                (String) body.get("name"),
                (String) body.get("url"),
                (String) body.get("category")
            );
            return ResponseEntity.status(201).body(feed);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
            }
            throw e;
        }
    }

    /**
     * PUT /api/rss/feeds/:id - 更新 RSS 订阅源
     */
    @PutMapping("/feeds/{id}")
    public ResponseEntity<RssFeed> updateFeed(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(rssService.updateFeed(id, body));
    }

    /**
     * DELETE /api/rss/feeds/:id - 删除 RSS 订阅源
     */
    @DeleteMapping("/feeds/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteFeed(@PathVariable String id) {
        rssService.deleteFeed(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * POST /api/rss/feeds/:id/fetch - 手动抓取单个订阅源
     */
    @PostMapping("/feeds/{id}/fetch")
    public ResponseEntity<Map<String, Integer>> fetchFeed(@PathVariable String id) {
        return ResponseEntity.ok(rssService.fetchFeed(id));
    }

    /**
     * POST /api/rss/fetch-all - 抓取所有活跃订阅源
     */
    @PostMapping("/fetch-all")
    public ResponseEntity<Map<String, Object>> fetchAllFeeds() {
        return ResponseEntity.ok(rssService.fetchAllFeeds());
    }
}
