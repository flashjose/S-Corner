package com.scorner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class DictionaryService {

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final TranslateService translateService;

    // 简单内存缓存
    private final java.util.concurrent.ConcurrentHashMap<String, Map<String, Object>> cache =
        new java.util.concurrent.ConcurrentHashMap<>();

    public DictionaryService(TranslateService translateService) {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build();
        this.objectMapper = new ObjectMapper();
        this.translateService = translateService;
    }

    /**
     * 查询单词释义（使用 free dictionary API）
     */
    public Map<String, Object> lookup(String word) {
        String normalizedWord = word.toLowerCase().trim();

        // 缓存命中
        if (cache.containsKey(normalizedWord)) {
            return cache.get(normalizedWord);
        }

        try {
            Request request = new Request.Builder()
                .url("https://api.dictionaryapi.dev/api/v2/entries/en/" + normalizedWord)
                .get()
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.code() == 404) {
                    return Map.of(
                        "word", normalizedWord,
                        "phonetic", "",
                        "meanings", List.of(),
                        "message", "Word not found in dictionary"
                    );
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
                for (JsonNode m : data.get("meanings")) {
                    Map<String, Object> meaning = new HashMap<>();
                    meaning.put("partOfSpeech", m.get("partOfSpeech").asText());

                    List<Map<String, Object>> definitions = new ArrayList<>();
                    int count = 0;
                    for (JsonNode d : m.get("definitions")) {
                        if (count >= 3) break;
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
                }

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("word", data.get("word").asText());
                result.put("phonetic", phonetic);
                result.put("meanings", meanings);

                // 并行翻译：先翻译单词本身，再批量翻译各词性释义
                try {
                    String wordZh = translateService.translate(normalizedWord, "en", "zh-CN");
                    result.put("wordZh", wordZh);

                    // 批量翻译所有定义（一次性请求）
                    List<String> allDefs = new ArrayList<>();
                    for (Map<String, Object> m : meanings) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> defs = (List<Map<String, Object>>) m.get("definitions");
                        for (Map<String, Object> d : defs) {
                            allDefs.add((String) d.get("definition"));
                        }
                    }
                    if (!allDefs.isEmpty()) {
                        List<String> zhDefs = translateService.batchTranslate(allDefs, "en", "zh-CN");
                        int idx = 0;
                        for (Map<String, Object> m : meanings) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> defs = (List<Map<String, Object>>) m.get("definitions");
                            List<String> zhList = new ArrayList<>();
                            for (int j = 0; j < defs.size() && idx < zhDefs.size(); j++, idx++) {
                                zhList.add(zhDefs.get(idx));
                            }
                            m.put("definitionsZh", zhList);
                        }
                    }
                } catch (Exception ignored) {
                    // 翻译失败不影响词典结果
                }

                cache.put(normalizedWord, result);
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
}
