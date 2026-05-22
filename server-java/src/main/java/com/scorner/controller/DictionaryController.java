package com.scorner.controller;

import com.scorner.service.DictionaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {

    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    /**
     * GET /api/dictionary/:word - 查询单词释义
     */
    @GetMapping("/{word}")
    public ResponseEntity<Map<String, Object>> lookup(@PathVariable String word) {
        return ResponseEntity.ok(dictionaryService.lookup(word));
    }
}
