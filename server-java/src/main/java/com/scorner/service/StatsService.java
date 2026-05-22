package com.scorner.service;

import com.scorner.entity.ReadingProgress;
import com.scorner.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class StatsService {

    private final ArticleRepository articleRepository;
    private final VocabularyRepository vocabularyRepository;
    private final AnnotationRepository annotationRepository;
    private final ReadingProgressRepository progressRepository;

    public StatsService(ArticleRepository articleRepository,
                        VocabularyRepository vocabularyRepository,
                        AnnotationRepository annotationRepository,
                        ReadingProgressRepository progressRepository) {
        this.articleRepository = articleRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.annotationRepository = annotationRepository;
        this.progressRepository = progressRepository;
    }

    /**
     * 获取学习统计概览
     */
    public Map<String, Object> getStats() {
        long totalArticles = articleRepository.count();
        long publishedArticles = articleRepository.countByStatus("published");
        long totalVocabulary = vocabularyRepository.count();
        long totalAnnotations = annotationRepository.count();

        List<ReadingProgress> allProgress = progressRepository.findAll();

        int totalTimeSpent = allProgress.stream().mapToInt(ReadingProgress::getTimeSpent).sum();
        long completedArticles = allProgress.stream().filter(ReadingProgress::getIsCompleted).count();

        // 最近30天的学习活动
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        Map<String, Integer> activityByDate = new TreeMap<>();

        for (ReadingProgress p : allProgress) {
            if (p.getLastReadAt() != null && p.getLastReadAt().isAfter(thirtyDaysAgo)) {
                String date = p.getLastReadAt().format(DateTimeFormatter.ISO_LOCAL_DATE);
                activityByDate.merge(date, p.getTimeSpent(), Integer::sum);
            }
        }

        // 词汇掌握度分布
        List<Object[]> vocabDistribution = vocabularyRepository.countByMasteryLevel();
        List<Map<String, Object>> vocabularyMastery = new ArrayList<>();
        for (Object[] row : vocabDistribution) {
            Map<String, Object> item = new HashMap<>();
            item.put("level", row[0]);
            item.put("count", row[1]);
            vocabularyMastery.add(item);
        }

        return Map.of(
            "totalArticles", totalArticles,
            "publishedArticles", publishedArticles,
            "totalVocabulary", totalVocabulary,
            "totalAnnotations", totalAnnotations,
            "totalTimeSpent", totalTimeSpent,
            "completedArticles", completedArticles,
            "activityByDate", activityByDate,
            "vocabularyMastery", vocabularyMastery
        );
    }
}
