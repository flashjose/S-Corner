package com.scorner.controller;

import com.scorner.entity.ExamCategory;
import com.scorner.entity.PaperAnnotation;
import com.scorner.entity.PaperProgress;
import com.scorner.service.ExamService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    /**
     * GET /api/exam/categories - 获取所有考试分类
     */
    @GetMapping("/categories")
    public ResponseEntity<List<ExamCategory>> listCategories() {
        return ResponseEntity.ok(examService.listCategories());
    }

    /**
     * GET /api/exam/paper/** - 获取单份试卷详情 (slug: kaoyan/2025-12/01)
     */
    @GetMapping("/paper/**")
    public ResponseEntity<?> getPaperDetail(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String prefix = "/api/exam/paper/";
        String slug = uri.substring(uri.indexOf(prefix) + prefix.length());

        return examService.getPaperDetail(slug)
            .map(p -> ResponseEntity.ok((Object) p))
            .orElse(ResponseEntity.status(404).body(Map.of("error", "Paper not found")));
    }

    /**
     * GET /api/exam/{categorySlug} - 获取分类下试卷列表（按年份分组）
     */
    @GetMapping("/{categorySlug}")
    public ResponseEntity<Map<String, Object>> getPapersByCategory(@PathVariable String categorySlug) {
        Map<String, Object> result = examService.getPapersByCategory(categorySlug);
        if (result.containsKey("error")) {
            return ResponseEntity.status(404).body(result);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/exam/paper/{id}/annotations - 获取试卷标注
     */
    @GetMapping("/annotations/{paperId}")
    public ResponseEntity<List<PaperAnnotation>> getAnnotations(@PathVariable String paperId) {
        return ResponseEntity.ok(examService.getAnnotations(paperId));
    }

    /**
     * PUT /api/exam/paper/{id}/content - 更新试卷内容（答案/音频/原文/时间轴）
     */
    @PutMapping("/paper/{id}/content")
    public ResponseEntity<?> updatePaperContent(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            examService.updatePaperContent(id, body);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/exam/content/import - 批量导入试卷内容
     */
    @PostMapping("/content/import")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> importContent(@RequestBody Map<String, Object> body) {
        List<Map<String, Object>> papers = (List<Map<String, Object>>) body.get("papers");
        if (papers == null || papers.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "papers array is required"));
        }
        int updated = examService.importPaperContent(papers);
        return ResponseEntity.ok(Map.of("success", true, "updated", updated));
    }

    /**
     * PUT /api/exam/paper/{id}/answers - 更新试卷答案
     */
    @PutMapping("/paper/{id}/answers")
    public ResponseEntity<?> updateAnswers(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String answers = (String) body.get("answers");
        if (answers == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "answers field is required"));
        }
        try {
            examService.updateAnswers(id, answers);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/exam/annotations - 创建标注
     */
    @PostMapping("/annotations")
    public ResponseEntity<PaperAnnotation> createAnnotation(@RequestBody Map<String, Object> body) {
        PaperAnnotation ann = examService.createAnnotation(
            (String) body.get("paperId"),
            (Integer) body.get("pageIndex"),
            (String) body.get("type"),
            (String) body.get("selectedText"),
            (String) body.get("color"),
            (String) body.get("textContent"),
            (String) body.get("drawingData"),
            body.get("positionData") != null ? body.get("positionData").toString() : null,
            (String) body.get("note")
        );
        return ResponseEntity.status(201).body(ann);
    }

    /**
     * DELETE /api/exam/annotations/{id} - 删除标注
     */
    @DeleteMapping("/annotations/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteAnnotation(@PathVariable String id) {
        examService.deleteAnnotation(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * PUT /api/exam/progress/{paperId} - 更新阅读进度
     */
    @PutMapping("/progress/{paperId}")
    public ResponseEntity<PaperProgress> updateProgress(
            @PathVariable String paperId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(examService.updateProgress(paperId, body));
    }
}
