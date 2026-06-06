package com.scorner.repository;

import com.scorner.entity.PaperProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaperProgressRepository extends JpaRepository<PaperProgress, String> {

    Optional<PaperProgress> findByUserIdAndPaperId(String userId, String paperId);
}
