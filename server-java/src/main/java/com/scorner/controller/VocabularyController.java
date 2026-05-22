package com.scorner.controller;

import com.scorner.entity.Vocabulary;
import com.scorner.service.VocabularyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private final VocabularyService vocabularyService;

    public VocabularyController(VocabularyService vocabularyService) {
        this.vocabularyService = vocabularyService;
    }

    /**
     * GET /api/vocabulary - 查询词汇列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listVocabulary(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer masteryLevel,
            @RequestParam(required = false) String sourceArticleId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(vocabularyService.listVocabulary(search, masteryLevel, sourceArticleId, page, limit));
    }

    /**
     * POST /api/vocabulary - 添加词汇
     */
    @PostMapping
    public ResponseEntity<?> addVocabulary(@RequestBody Map<String, Object> body) {
        Vocabulary vocab = vocabularyService.addVocabulary(
            (String) body.get("word"),
            (String) body.get("pronunciation"),
            (String) body.get("definition"),
            (String) body.get("chineseDefinition"),
            (String) body.get("example"),
            (String) body.get("sourceArticleId")
        );
        return ResponseEntity.status(201).body(vocab);
    }

    /**
     * PUT /api/vocabulary/:id - 更新词汇
     */
    @PutMapping("/{id}")
    public ResponseEntity<Vocabulary> updateVocabulary(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(vocabularyService.updateVocabulary(id, body));
    }

    /**
     * DELETE /api/vocabulary/:id - 删除词汇
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteVocabulary(@PathVariable String id) {
        vocabularyService.deleteVocabulary(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
