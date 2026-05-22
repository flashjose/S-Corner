package com.scorner.repository;

import com.scorner.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, String>, JpaSpecificationExecutor<Article> {

    Page<Article> findByStatus(String status, Pageable pageable);

    Page<Article> findByCategory(String category, Pageable pageable);

    Page<Article> findByStatusAndCategory(String status, String category, Pageable pageable);

    Optional<Article> findBySourceUrl(String sourceUrl);

    @Query("SELECT a FROM Article a LEFT JOIN FETCH a.paragraphs WHERE a.id = :id")
    Optional<Article> findByIdWithParagraphs(@Param("id") String id);

    @Query("SELECT a FROM Article a LEFT JOIN FETCH a.paragraphs LEFT JOIN FETCH a.annotations LEFT JOIN FETCH a.images WHERE a.id = :id")
    Optional<Article> findByIdWithDetails(@Param("id") String id);

    long countByStatus(String status);
}
