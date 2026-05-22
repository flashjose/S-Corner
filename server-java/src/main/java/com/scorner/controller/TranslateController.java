package com.scorner.controller;

import com.scorner.service.TranslateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/translate")
public class TranslateController {

    private final TranslateService translateService;

    public TranslateController(TranslateService translateService) {
        this.translateService = translateService;
    }

    /**
     * POST /api/translate - 翻译文本
     */
    @PostMapping
    public ResponseEntity<?> translate(@RequestBody Map<String, Object> body) {
        String text = (String) body.get("text");
        if (text == null || text.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
        }

        String from = body.containsKey("from") ? (String) body.get("from") : "en";
        String to = body.containsKey("to") ? (String) body.get("to") : "zh-CN";

        String truncated = text.substring(0, Math.min(text.length(), 5000));
        String translated = translateService.translate(truncated, from, to);

        return ResponseEntity.ok(Map.of("translated", translated, "original", truncated));
    }

    /**
     * POST /api/translate/batch - 批量翻译段落
     */
    @PostMapping("/batch")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> batchTranslate(@RequestBody Map<String, Object> body) {
        List<String> texts = (List<String>) body.get("texts");
        if (texts == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "texts must be an array"));
        }

        String from = body.containsKey("from") ? (String) body.get("from") : "en";
        String to = body.containsKey("to") ? (String) body.get("to") : "zh-CN";

        List<String> translations = translateService.batchTranslate(texts, from, to);
        return ResponseEntity.ok(Map.of("translations", translations));
    }
}
