package com.scorner.service;

import com.scorner.entity.Annotation;
import com.scorner.repository.AnnotationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AnnotationService {

    private final AnnotationRepository annotationRepository;

    public AnnotationService(AnnotationRepository annotationRepository) {
        this.annotationRepository = annotationRepository;
    }

    /**
     * 获取文章的所有标注
     */
    public List<Annotation> getAnnotationsByArticleId(String articleId) {
        return annotationRepository.findByArticleIdOrderByCreatedAtDesc(articleId);
    }

    /**
     * 创建标注
     */
    @Transactional
    public Annotation createAnnotation(String articleId, String paragraphId,
                                        Integer startOffset, Integer endOffset,
                                        String selectedText, String translation,
                                        String note, String color) {
        Annotation annotation = new Annotation();
        annotation.setArticleId(articleId);
        annotation.setParagraphId(paragraphId);
        annotation.setStartOffset(startOffset);
        annotation.setEndOffset(endOffset);
        annotation.setSelectedText(selectedText);
        annotation.setTranslation(translation);
        annotation.setNote(note);
        annotation.setColor(color);

        return annotationRepository.save(annotation);
    }

    /**
     * 更新标注
     */
    @Transactional
    public Annotation updateAnnotation(String id, Map<String, Object> fields) {
        Annotation annotation = annotationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Annotation not found: " + id));

        if (fields.containsKey("translation")) annotation.setTranslation((String) fields.get("translation"));
        if (fields.containsKey("note")) annotation.setNote((String) fields.get("note"));
        if (fields.containsKey("color")) annotation.setColor((String) fields.get("color"));

        return annotationRepository.save(annotation);
    }

    /**
     * 删除标注
     */
    @Transactional
    public void deleteAnnotation(String id) {
        annotationRepository.deleteById(id);
    }
}
