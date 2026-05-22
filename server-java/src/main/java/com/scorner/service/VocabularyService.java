package com.scorner.service;

import com.scorner.entity.Vocabulary;
import com.scorner.repository.VocabularyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class VocabularyService {

    private final VocabularyRepository vocabularyRepository;

    public VocabularyService(VocabularyRepository vocabularyRepository) {
        this.vocabularyRepository = vocabularyRepository;
    }

    /**
     * 查询词汇列表（支持搜索 + 分页）
     */
    public Map<String, Object> listVocabulary(String search, Integer masteryLevel,
                                               String sourceArticleId, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Vocabulary> vocabPage;

        if (search != null && !search.isEmpty()) {
            vocabPage = vocabularyRepository.searchByKeyword(search, pageable);
        } else if (masteryLevel != null) {
            vocabPage = vocabularyRepository.findByMasteryLevel(masteryLevel, pageable);
        } else if (sourceArticleId != null && !sourceArticleId.isEmpty()) {
            vocabPage = vocabularyRepository.findBySourceArticleId(sourceArticleId, pageable);
        } else {
            vocabPage = vocabularyRepository.findAll(pageable);
        }

        return Map.of(
            "vocabularies", vocabPage.getContent(),
            "total", vocabPage.getTotalElements(),
            "page", page,
            "limit", limit
        );
    }

    /**
     * 添加词汇（如果已存在则返回已有记录）
     */
    @Transactional
    public Vocabulary addVocabulary(String word, String pronunciation, String definition,
                                     String chineseDefinition, String example, String sourceArticleId) {
        String normalizedWord = word.toLowerCase().trim();

        Optional<Vocabulary> existing = vocabularyRepository.findByWord(normalizedWord);
        if (existing.isPresent()) {
            return existing.get();
        }

        Vocabulary vocab = new Vocabulary();
        vocab.setWord(normalizedWord);
        vocab.setPronunciation(pronunciation);
        vocab.setDefinition(definition);
        vocab.setChineseDefinition(chineseDefinition);
        vocab.setExample(example);
        vocab.setSourceArticleId(sourceArticleId);

        return vocabularyRepository.save(vocab);
    }

    /**
     * 更新词汇
     */
    @Transactional
    public Vocabulary updateVocabulary(String id, Map<String, Object> fields) {
        Vocabulary vocab = vocabularyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vocabulary not found: " + id));

        if (fields.containsKey("pronunciation")) vocab.setPronunciation((String) fields.get("pronunciation"));
        if (fields.containsKey("definition")) vocab.setDefinition((String) fields.get("definition"));
        if (fields.containsKey("chineseDefinition")) vocab.setChineseDefinition((String) fields.get("chineseDefinition"));
        if (fields.containsKey("example")) vocab.setExample((String) fields.get("example"));
        if (fields.containsKey("masteryLevel")) vocab.setMasteryLevel((Integer) fields.get("masteryLevel"));

        return vocabularyRepository.save(vocab);
    }

    /**
     * 删除词汇
     */
    @Transactional
    public void deleteVocabulary(String id) {
        vocabularyRepository.deleteById(id);
    }
}
