package com.scorner.controller;

import com.scorner.service.SummaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/summary")
public class SummaryController {

    private final SummaryService summaryService;

    public SummaryController(SummaryService summaryService) {
        this.summaryService = summaryService;
    }

    /**
     * POST /api/summary - 生成文章摘要
     */
    @PostMapping
    public ResponseEntity<?> generateSummary(@RequestBody Map<String, Object> body) {
        String text = (String) body.get("text");
        if (text == null || text.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
        }

        int maxSentences = body.containsKey("maxSentences") ? (Integer) body.get("maxSentences") : 5;
        String summary = summaryService.extractiveSummary(text, maxSentences);

        return ResponseEntity.ok(Map.of("summary", summary));
    }
}
