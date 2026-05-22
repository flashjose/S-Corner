package com.scorner.repository;

import com.scorner.entity.Annotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, String> {

    List<Annotation> findByArticleIdOrderByCreatedAtDesc(String articleId);

    void deleteByArticleId(String articleId);
}
