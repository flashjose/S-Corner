package com.scorner.service;

import com.scorner.entity.ReadingProgress;
import com.scorner.repository.ReadingProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class ProgressService {

    private final ReadingProgressRepository progressRepository;

    public ProgressService(ReadingProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }

    /**
     * 获取阅读进度
     */
    public Optional<ReadingProgress> getProgress(String articleId) {
        return progressRepository.findByArticleId(articleId);
    }

    /**
     * 更新阅读进度（upsert 语义）
     */
    @Transactional
    public ReadingProgress updateProgress(String articleId, Map<String, Object> fields) {
        Optional<ReadingProgress> existing = progressRepository.findByArticleId(articleId);

        ReadingProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
            if (fields.containsKey("lastParagraph")) progress.setLastParagraph((Integer) fields.get("lastParagraph"));
            if (fields.containsKey("totalParagraphs")) progress.setTotalParagraphs((Integer) fields.get("totalParagraphs"));
            if (fields.containsKey("timeSpent")) progress.setTimeSpent((Integer) fields.get("timeSpent"));
            if (fields.containsKey("isCompleted")) progress.setIsCompleted((Boolean) fields.get("isCompleted"));
            progress.setLastReadAt(LocalDateTime.now());
        } else {
            progress = new ReadingProgress();
            progress.setArticleId(articleId);
            progress.setLastParagraph(fields.containsKey("lastParagraph") ? (Integer) fields.get("lastParagraph") : 0);
            progress.setTotalParagraphs(fields.containsKey("totalParagraphs") ? (Integer) fields.get("totalParagraphs") : 0);
            progress.setTimeSpent(fields.containsKey("timeSpent") ? (Integer) fields.get("timeSpent") : 0);
            progress.setIsCompleted(fields.containsKey("isCompleted") ? (Boolean) fields.get("isCompleted") : false);
        }

        return progressRepository.save(progress);
    }
}
