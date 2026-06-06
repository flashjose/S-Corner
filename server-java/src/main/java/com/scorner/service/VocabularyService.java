package com.scorner.service;

import com.scorner.entity.Vocabulary;
import com.scorner.repository.VocabularyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class VocabularyService {

    private final VocabularyRepository vocabularyRepository;
    private final CurrentUserService currentUserService;

    public VocabularyService(VocabularyRepository vocabularyRepository,
                             CurrentUserService currentUserService) {
        this.vocabularyRepository = vocabularyRepository;
        this.currentUserService = currentUserService;
    }

    public Map<String, Object> listVocabulary(String search, Integer masteryLevel,
                                               String sourceArticleId, int page, int limit) {
        String userId = currentUserService.getCurrentUserId();
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Vocabulary> vocabPage;

        if (search != null && !search.isEmpty()) {
            vocabPage = vocabularyRepository.searchByUserAndKeyword(userId, search, pageable);
        } else if (masteryLevel != null) {
            vocabPage = vocabularyRepository.findByUserIdAndMasteryLevel(userId, masteryLevel, pageable);
        } else if (sourceArticleId != null && !sourceArticleId.isEmpty()) {
            vocabPage = vocabularyRepository.findByUserIdAndSourceArticleId(userId, sourceArticleId, pageable);
        } else {
            vocabPage = vocabularyRepository.findByUserId(userId, pageable);
        }

        return Map.of(
            "vocabularies", vocabPage.getContent(),
            "total", vocabPage.getTotalElements(),
            "page", page,
            "limit", limit
        );
    }

    @Transactional
    public Vocabulary addVocabulary(String word, String pronunciation, String definition,
                                     String chineseDefinition, String example, String sourceArticleId) {
        String userId = currentUserService.getCurrentUserId();
        String normalizedWord = word.toLowerCase().trim();

        Optional<Vocabulary> existing = vocabularyRepository.findByUserIdAndWord(userId, normalizedWord);
        if (existing.isPresent()) {
            return existing.get();
        }

        Vocabulary vocab = new Vocabulary();
        vocab.setUserId(userId);
        vocab.setWord(normalizedWord);
        vocab.setPronunciation(pronunciation);
        vocab.setDefinition(definition);
        vocab.setChineseDefinition(chineseDefinition);
        vocab.setExample(example);
        vocab.setSourceArticleId(sourceArticleId);

        return vocabularyRepository.save(vocab);
    }

    @Transactional
    public Vocabulary updateVocabulary(String id, Map<String, Object> fields) {
        String userId = currentUserService.getCurrentUserId();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new RuntimeException("Vocabulary not found: " + id));

        if (fields.containsKey("pronunciation")) vocab.setPronunciation((String) fields.get("pronunciation"));
        if (fields.containsKey("definition")) vocab.setDefinition((String) fields.get("definition"));
        if (fields.containsKey("chineseDefinition")) vocab.setChineseDefinition((String) fields.get("chineseDefinition"));
        if (fields.containsKey("example")) vocab.setExample((String) fields.get("example"));
        if (fields.containsKey("masteryLevel")) vocab.setMasteryLevel((Integer) fields.get("masteryLevel"));

        return vocabularyRepository.save(vocab);
    }

    @Transactional
    public void deleteVocabulary(String id) {
        String userId = currentUserService.getCurrentUserId();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new RuntimeException("Vocabulary not found: " + id));
        vocabularyRepository.delete(vocab);
    }
}
