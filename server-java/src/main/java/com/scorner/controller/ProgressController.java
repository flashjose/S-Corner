package com.scorner.controller;

import com.scorner.entity.ReadingProgress;
import com.scorner.service.ProgressService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Profile("legacy")
@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    /**
     * GET /api/progress/:articleId - 获取阅读进度
     */
    @GetMapping("/{articleId}")
    public ResponseEntity<?> getProgress(@PathVariable String articleId) {
        return progressService.getProgress(articleId)
            .map(p -> ResponseEntity.ok((Object) p))
            .orElse(ResponseEntity.ok().body(null));
    }

    /**
     * PUT /api/progress/:articleId - 更新阅读进度
     */
    @PutMapping("/{articleId}")
    public ResponseEntity<ReadingProgress> updateProgress(
            @PathVariable String articleId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(progressService.updateProgress(articleId, body));
    }
}
