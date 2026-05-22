package com.scorner.repository;

import com.scorner.entity.ExamPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamPaperRepository extends JpaRepository<ExamPaper, String> {

    List<ExamPaper> findByCategoryIdAndIsPublishedTrueOrderByYearDescMonthDescSetIdAsc(String categoryId);

    Optional<ExamPaper> findBySlug(String slug);

    Optional<ExamPaper> findBySlugAndCategoryId(String slug, String categoryId);

    @Query("SELECT DISTINCT p.year FROM ExamPaper p WHERE p.categoryId = :catId AND p.isPublished = true ORDER BY p.year DESC")
    List<Integer> findDistinctYearsByCategoryId(@Param("catId") String categoryId);

    List<ExamPaper> findByCategoryIdAndYearOrderByMonthDescSetIdAsc(String categoryId, Integer year);
}
