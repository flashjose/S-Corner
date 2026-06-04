package com.scorner.service;

import com.scorner.entity.DictionaryEntry;
import com.scorner.entity.DictionaryWordForm;
import com.scorner.repository.DictionaryEntryRepository;
import com.scorner.repository.DictionaryWordFormRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class LocalDictionaryServiceTest {

    @Autowired
    private LocalDictionaryService localDictionaryService;

    @Autowired
    private DictionaryEntryRepository entryRepository;

    @Autowired
    private DictionaryWordFormRepository wordFormRepository;

    @BeforeEach
    void seedSampleWord() {
        wordFormRepository.deleteAll();
        entryRepository.deleteAll();

        DictionaryEntry entry = new DictionaryEntry();
        entry.setWord("abandon");
        entry.setPhonetic("ə'bændən");
        entry.setPos("v.");
        entry.setDefinition("vt. to give up completely");
        entry.setTranslation("vt. 放弃；抛弃");
        entry.setExchange("d:abandoned/p:abandoned/i:abandoning/3:abandons");
        entryRepository.save(entry);

        wordFormRepository.save(new DictionaryWordForm("abandoned", "abandon"));
        wordFormRepository.save(new DictionaryWordForm("abandoning", "abandon"));
    }

    @Test
    void lookup_returnsSameShapeAsRemoteApi() {
        Optional<Map<String, Object>> result = localDictionaryService.lookup("abandon", false);
        assertTrue(result.isPresent());

        Map<String, Object> dict = result.get();
        assertEquals("abandon", dict.get("word"));
        assertEquals("ə'bændən", dict.get("phonetic"));
        assertTrue(dict.get("meanings") instanceof java.util.List<?>);

        @SuppressWarnings("unchecked")
        var meanings = (java.util.List<Map<String, Object>>) dict.get("meanings");
        assertFalse(meanings.isEmpty());
        assertEquals("vt", meanings.get(0).get("partOfSpeech"));

        @SuppressWarnings("unchecked")
        var definitions = (java.util.List<Map<String, Object>>) meanings.get(0).get("definitions");
        assertEquals("to give up completely", definitions.get(0).get("definition"));
    }

    @Test
    void lookup_resolvesWordFormViaExchangeTable() {
        Optional<Map<String, Object>> result = localDictionaryService.lookup("abandoned", false);
        assertTrue(result.isPresent());
        assertEquals("abandon", result.get().get("word"));
    }

    @Test
    void lookup_withZh_includesWordZh() {
        Optional<Map<String, Object>> result = localDictionaryService.lookup("abandon", true);
        assertTrue(result.isPresent());
        assertEquals("vt. 放弃；抛弃", result.get().get("wordZh"));

        @SuppressWarnings("unchecked")
        var meanings = (java.util.List<Map<String, Object>>) result.get().get("meanings");
        @SuppressWarnings("unchecked")
        var definitionsZh = (java.util.List<String>) meanings.get(0).get("definitionsZh");
        assertNotNull(definitionsZh);
        assertEquals("放弃；抛弃", definitionsZh.get(0));
    }

    @Test
    void lookup_withZh_splitsMultiLineTranslation() {
        DictionaryEntry study = new DictionaryEntry();
        study.setWord("study");
        study.setPhonetic("'stʌdi");
        study.setPos("n. & v.");
        study.setDefinition("n. the activity of learning\nv. to learn about a subject");
        study.setTranslation("n. 学习；研究\nv. 学习；研究");
        entryRepository.save(study);

        Optional<Map<String, Object>> result = localDictionaryService.lookup("study", true);
        assertTrue(result.isPresent());

        @SuppressWarnings("unchecked")
        var meanings = (java.util.List<Map<String, Object>>) result.get().get("meanings");
        assertEquals(2, meanings.size());
        assertEquals("n", meanings.get(0).get("partOfSpeech"));
        assertEquals("v", meanings.get(1).get("partOfSpeech"));
    }
}
