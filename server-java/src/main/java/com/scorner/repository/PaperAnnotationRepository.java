package com.scorner.repository;

import com.scorner.entity.PaperAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaperAnnotationRepository extends JpaRepository<PaperAnnotation, String> {

    List<PaperAnnotation> findByUserIdAndPaperIdOrderByPageIndexAsc(String userId, String paperId);

    List<PaperAnnotation> findByUserIdAndPaperIdAndPageIndexOrderByCreatedAtDesc(
        String userId, String paperId, Integer pageIndex);

    Optional<PaperAnnotation> findByIdAndUserId(String id, String userId);

    void deleteByUserIdAndPaperId(String userId, String paperId);
}
