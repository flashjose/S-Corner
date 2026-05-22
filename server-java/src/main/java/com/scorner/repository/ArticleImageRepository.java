package com.scorner.repository;

import com.scorner.entity.ArticleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleImageRepository extends JpaRepository<ArticleImage, String> {

    List<ArticleImage> findByArticleIdOrderByImageIndexAsc(String articleId);

    void deleteByArticleId(String articleId);
}
