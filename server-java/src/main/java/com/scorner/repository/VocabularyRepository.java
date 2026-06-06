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

    Optional<Vocabulary> findByUserIdAndWord(String userId, String word);

    @Query("SELECT v FROM Vocabulary v WHERE v.userId = :userId AND (v.word LIKE %:keyword% OR v.chineseDefinition LIKE %:keyword%)")
    Page<Vocabulary> searchByUserAndKeyword(@Param("userId") String userId, @Param("keyword") String keyword, Pageable pageable);

    Page<Vocabulary> findByUserIdAndMasteryLevel(String userId, Integer masteryLevel, Pageable pageable);

    Page<Vocabulary> findByUserIdAndSourceArticleId(String userId, String sourceArticleId, Pageable pageable);

    Page<Vocabulary> findByUserId(String userId, Pageable pageable);

    Optional<Vocabulary> findByIdAndUserId(String id, String userId);

    @Query("SELECT v.masteryLevel, COUNT(v) FROM Vocabulary v GROUP BY v.masteryLevel")
    List<Object[]> countByMasteryLevel();

    @Query("SELECT v.masteryLevel, COUNT(v) FROM Vocabulary v WHERE v.userId = :userId GROUP BY v.masteryLevel")
    List<Object[]> countByMasteryLevelForUser(@Param("userId") String userId);
}
