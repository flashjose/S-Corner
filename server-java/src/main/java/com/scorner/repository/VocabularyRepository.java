package com.scorner.repository;

import com.scorner.entity.Vocabulary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, String> {

    Optional<Vocabulary> findByWord(String word);

    @Query("SELECT v FROM Vocabulary v WHERE v.word LIKE %:keyword% OR v.chineseDefinition LIKE %:keyword%")
    Page<Vocabulary> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    Page<Vocabulary> findByMasteryLevel(Integer masteryLevel, Pageable pageable);

    Page<Vocabulary> findBySourceArticleId(String sourceArticleId, Pageable pageable);

    @Query("SELECT v.masteryLevel, COUNT(v) FROM Vocabulary v GROUP BY v.masteryLevel")
    List<Object[]> countByMasteryLevel();
}
