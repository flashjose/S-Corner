package com.scorner.controller;

import com.scorner.entity.Annotation;
import com.scorner.service.AnnotationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/annotations")
public class AnnotationController {

    private final AnnotationService annotationService;

    public AnnotationController(AnnotationService annotationService) {
        this.annotationService = annotationService;
    }

    /**
     * GET /api/annotations/:articleId - 获取文章标注
     */
    @GetMapping("/{articleId}")
    public ResponseEntity<List<Annotation>> getAnnotations(@PathVariable String articleId) {
        return ResponseEntity.ok(annotationService.getAnnotationsByArticleId(articleId));
    }

    /**
     * POST /api/annotations - 创建标注
     */
    @PostMapping
    public ResponseEntity<Annotation> createAnnotation(@RequestBody Map<String, Object> body) {
        Annotation annotation = annotationService.createAnnotation(
            (String) body.get("articleId"),
            (String) body.get("paragraphId"),
            (Integer) body.get("startOffset"),
            (Integer) body.get("endOffset"),
            (String) body.get("selectedText"),
            (String) body.get("translation"),
            (String) body.get("note"),
            (String) body.get("color")
        );
        return ResponseEntity.status(201).body(annotation);
    }

    /**
     * PUT /api/annotations/:id - 更新标注
     */
    @PutMapping("/{id}")
    public ResponseEntity<Annotation> updateAnnotation(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(annotationService.updateAnnotation(id, body));
    }

    /**
     * DELETE /api/annotations/:id - 删除标注
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteAnnotation(@PathVariable String id) {
        annotationService.deleteAnnotation(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
