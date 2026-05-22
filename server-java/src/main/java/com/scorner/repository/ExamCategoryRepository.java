package com.scorner.repository;

import com.scorner.entity.ExamCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamCategoryRepository extends JpaRepository<ExamCategory, String> {

    Optional<ExamCategory> findBySlug(String slug);

    java.util.List<ExamCategory> findAllByOrderByDisplayOrderAsc();
}
