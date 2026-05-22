package com.scorner.repository;

import com.scorner.entity.PaperAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperAnnotationRepository extends JpaRepository<PaperAnnotation, String> {

    List<PaperAnnotation> findByPaperIdOrderByPageIndexAsc(String paperId);

    List<PaperAnnotation> findByPaperIdAndPageIndexOrderByCreatedAtDesc(String paperId, Integer pageIndex);

    void deleteByPaperId(String paperId);
}
