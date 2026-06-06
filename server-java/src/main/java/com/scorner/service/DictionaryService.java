package com.scorner.service;



import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.scorner.config.DictionaryProperties;

import okhttp3.OkHttpClient;

import okhttp3.Request;

import okhttp3.Response;

import org.springframework.stereotype.Service;



import java.util.*;

import java.util.concurrent.TimeUnit;



@Service

public class DictionaryService {

    private static final int REMOTE_MAX_MEANINGS = 8;
    private static final int REMOTE_MAX_DEFINITIONS = 5;
    /** 中英对照模式：控制篇幅并保证每条都有中文 */
    private static final int REMOTE_MAX_MEANINGS_BILINGUAL = 4;
    private static final int REMOTE_MAX_DEFINITIONS_BILINGUAL = 3;

    private final OkHttpClient httpClient;

    private final ObjectMapper objectMapper;

    private final TranslateService translateService;

    private final LocalDictionaryService localDictionaryService;

    private final DictionaryProperties dictionaryProperties;



    private final java.util.concurrent.ConcurrentHashMap<String, Map<String, Object>> cache =

        new java.util.concurrent.ConcurrentHashMap<>();



    public DictionaryService(

            TranslateService translateService,

            LocalDictionaryService localDictionaryService,

            DictionaryProperties dictionaryProperties) {

        this.httpClient = new OkHttpClient.Builder()

            .connectTimeout(5, TimeUnit.SECONDS)

            .readTimeout(5, TimeUnit.SECONDS)

            .build();

        this.objectMapper = new ObjectMapper();

        this.translateService = translateService;

        this.localDictionaryService = localDictionaryService;

        this.dictionaryProperties = dictionaryProperties;

    }



    /**

     * 查询单词释义（默认快速模式，不含中文翻译）

     * @param includeZh 为 true 时额外返回中文（本地词库直接取 translation，远程走翻译服务）

     */

    public Map<String, Object> lookup(String word, boolean includeZh) {

        String normalizedWord = word.toLowerCase().trim();

        String cacheKey = cacheKey(normalizedWord, includeZh);



        if (cache.containsKey(cacheKey)) {

            return cache.get(cacheKey);

        }



        if (dictionaryProperties.isLocalEnabled()) {

            Optional<Map<String, Object>> local = localDictionaryService.lookup(normalizedWord, includeZh);

            if (local.isPresent()) {

                cache.put(cacheKey, local.get());

                return local.get();

            }

        }



        if (!dictionaryProperties.isRemoteFallback()) {

            Map<String, Object> notFound = Map.of(

                "word", normalizedWord,

                "phonetic", "",

                "meanings", List.of(),

                "message", "Word not found in dictionary"

            );

            cache.put(cacheKey, notFound);

            return notFound;

        }



        return lookupRemote(normalizedWord, includeZh, cacheKey);

    }



    public Map<String, Object> lookup(String word) {

        return lookup(word, false);

    }



    private Map<String, Object> lookupRemote(String normalizedWord, boolean includeZh, String cacheKey) {

        try {

            Request request = new Request.Builder()

                .url("https://api.dictionaryapi.dev/api/v2/entries/en/" + normalizedWord)

                .get()

                .build();



            try (Response response = httpClient.newCall(request).execute()) {

                if (response.code() == 404) {

                    Map<String, Object> notFound = Map.of(

                        "word", normalizedWord,

                        "phonetic", "",

                        "meanings", List.of(),

                        "message", "Word not found in dictionary"

                    );

                    cache.put(cacheKey, notFound);

                    return notFound;

                }



                if (!response.isSuccessful()) {

                    throw new RuntimeException("Dictionary API returned " + response.code());

                }



                JsonNode root = objectMapper.readTree(response.body().string());

                JsonNode data = root.get(0);



                String phonetic = "";

                if (data.has("phonetic")) {

                    phonetic = data.get("phonetic").asText();

                } else if (data.has("phonetics")) {

                    for (JsonNode p : data.get("phonetics")) {

                        if (p.has("text") && !p.get("text").asText().isEmpty()) {

                            phonetic = p.get("text").asText();

                            break;

                        }

                    }

                }



                List<Map<String, Object>> meanings = new ArrayList<>();
                int maxMeanings = includeZh ? REMOTE_MAX_MEANINGS_BILINGUAL : REMOTE_MAX_MEANINGS;
                int maxDefs = includeZh ? REMOTE_MAX_DEFINITIONS_BILINGUAL : REMOTE_MAX_DEFINITIONS;
                int meaningCount = 0;

                for (JsonNode m : data.get("meanings")) {
                    if (meaningCount >= maxMeanings) break;

                    Map<String, Object> meaning = new HashMap<>();

                    meaning.put("partOfSpeech", m.get("partOfSpeech").asText());



                    List<Map<String, Object>> definitions = new ArrayList<>();

                    int count = 0;

                    for (JsonNode d : m.get("definitions")) {

                        if (count >= maxDefs) break;

                        Map<String, Object> def = new HashMap<>();

                        def.put("definition", d.get("definition").asText());

                        if (d.has("example")) def.put("example", d.get("example").asText());

                        if (d.has("synonyms")) {

                            List<String> synonyms = new ArrayList<>();

                            int s = 0;

                            for (JsonNode syn : d.get("synonyms")) {

                                if (s >= 3) break;

                                synonyms.add(syn.asText());

                                s++;

                            }

                            def.put("synonyms", synonyms);

                        }

                        definitions.add(def);

                        count++;

                    }

                    meaning.put("definitions", definitions);

                    meanings.add(meaning);
                    meaningCount++;

                }



                Map<String, Object> result = new LinkedHashMap<>();

                result.put("word", data.get("word").asText());

                result.put("phonetic", phonetic);

                result.put("meanings", meanings);



                if (includeZh) {
                    attachRemoteChinese(meanings, result);
                }



                cache.put(cacheKey, result);

                return result;

            }

        } catch (Exception e) {

            return Map.of(

                "word", normalizedWord,

                "phonetic", "",

                "meanings", List.of(),

                "error", "Dictionary lookup failed"

            );

        }

    }



    @SuppressWarnings("unchecked")
    private void attachRemoteChinese(
            List<Map<String, Object>> meanings,
            Map<String, Object> result) {
        List<String> texts = new ArrayList<>();
        List<ZhSlot> slots = new ArrayList<>();

        int defCount = 0;
        for (Map<String, Object> meaning : meanings) {
            List<Map<String, Object>> definitions =
                (List<Map<String, Object>>) meaning.get("definitions");
            if (definitions != null) {
                defCount += definitions.size();
            }
        }
        boolean translateExamples = defCount <= 10;

        for (Map<String, Object> meaning : meanings) {
            List<Map<String, Object>> definitions =
                (List<Map<String, Object>>) meaning.get("definitions");
            if (definitions == null) continue;

            for (Map<String, Object> def : definitions) {
                String en = (String) def.get("definition");
                if (en != null && !en.isBlank()) {
                    texts.add(en);
                    slots.add(ZhSlot.definition(meaning, def));
                }
                if (translateExamples) {
                    String example = (String) def.get("example");
                    if (example != null && !example.isBlank()) {
                        texts.add(example);
                        slots.add(ZhSlot.example(meaning, def));
                    }
                }
            }
        }

        if (texts.isEmpty()) {
            return;
        }

        List<String> translated;
        try {
            translated = translateService.batchTranslate(texts, "en", "zh-CN");
        } catch (Exception e) {
            return;
        }

        if (translated.isEmpty()) return;

        for (Map<String, Object> meaning : meanings) {
            List<Map<String, Object>> definitions =
                (List<Map<String, Object>>) meaning.get("definitions");
            if (definitions == null || definitions.isEmpty()) continue;
            List<String> definitionsZh = new ArrayList<>();
            for (int i = 0; i < definitions.size(); i++) {
                definitionsZh.add("");
            }
            meaning.put("definitionsZh", definitionsZh);
        }

        for (int i = 0; i < slots.size(); i++) {
            String zh = i < translated.size() ? translated.get(i) : "";
            zh = zh != null ? zh.trim() : "";
            ZhSlot slot = slots.get(i);
            if (slot.kind == ZhSlot.KIND_DEFINITION) {
                List<String> definitionsZh = (List<String>) slot.meaning.get("definitionsZh");
                int defIndex = indexOfDef(slot.meaning, slot.def);
                if (definitionsZh != null && defIndex >= 0 && defIndex < definitionsZh.size()) {
                    definitionsZh.set(defIndex, zh);
                }
            } else if (slot.kind == ZhSlot.KIND_EXAMPLE && !zh.isEmpty()) {
                slot.def.put("exampleZh", zh);
            }
        }

        String wordZh = pickWordZhFromMeanings(meanings);
        if (!wordZh.isEmpty()) {
            result.put("wordZh", wordZh);
        }
    }

    @SuppressWarnings("unchecked")
    private static String pickWordZhFromMeanings(List<Map<String, Object>> meanings) {
        for (Map<String, Object> meaning : meanings) {
            List<String> definitionsZh = (List<String>) meaning.get("definitionsZh");
            if (definitionsZh == null) continue;
            for (String zh : definitionsZh) {
                if (zh == null || zh.isBlank()) continue;
                String cleaned = sanitizeChineseGloss(zh);
                if (!cleaned.isEmpty() && !looksLikePromptEcho(cleaned)) {
                    return cleaned;
                }
            }
        }
        return "";
    }

    private static boolean looksLikePromptEcho(String text) {
        return text.contains("请用简体中文") || text.contains("英语单词");
    }

    @SuppressWarnings("unchecked")
    private static int indexOfDef(Map<String, Object> meaning, Map<String, Object> def) {
        List<Map<String, Object>> definitions = (List<Map<String, Object>>) meaning.get("definitions");
        if (definitions == null) return 0;
        return definitions.indexOf(def);
    }

    /** 去掉 MyMemory 返回的 up/ap/上涨 这类混杂音标 */
    private static String sanitizeChineseGloss(String raw) {
        if (raw == null || raw.isBlank()) return "";
        java.util.regex.Matcher m = java.util.regex.Pattern
            .compile("[\u4e00-\u9fff][\u4e00-\u9fff\\s·；，、：:（）()\\-]*")
            .matcher(raw);
        if (m.find()) {
            return m.group().trim();
        }
        return raw.trim();
    }

    private static final class ZhSlot {
        static final int KIND_DEFINITION = 1;
        static final int KIND_EXAMPLE = 2;

        final int kind;
        final Map<String, Object> meaning;
        final Map<String, Object> def;

        private ZhSlot(int kind, Map<String, Object> meaning, Map<String, Object> def) {
            this.kind = kind;
            this.meaning = meaning;
            this.def = def;
        }

        static ZhSlot definition(Map<String, Object> meaning, Map<String, Object> def) {
            return new ZhSlot(KIND_DEFINITION, meaning, def);
        }

        static ZhSlot example(Map<String, Object> meaning, Map<String, Object> def) {
            return new ZhSlot(KIND_EXAMPLE, meaning, def);
        }
    }

    private static String cacheKey(String word, boolean includeZh) {

        return word + (includeZh ? ":zh" : "");

    }

}

