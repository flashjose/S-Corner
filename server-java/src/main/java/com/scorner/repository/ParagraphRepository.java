package com.scorner.repository;

import com.scorner.entity.Paragraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParagraphRepository extends JpaRepository<Paragraph, String> {

    List<Paragraph> findByArticleIdOrderByIndexAsc(String articleId);

    void deleteByArticleId(String articleId);
}
