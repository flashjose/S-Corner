package com.scorner.service;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class TranslateService {

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public TranslateService() {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 翻译文本 — 使用 MyMemory API（国内可访问，免费）
     * 备用: Google Translate
     */
    public String translate(String text, String from, String to) {
        // Try MyMemory first (works in China)
        try {
            return translateWithMyMemory(text, from, to);
        } catch (Exception e) {
            // Fallback to Google Translate
            return translateWithGoogle(text, from, to);
        }
    }

    private String translateWithMyMemory(String text, String from, String to) {
        try {
            String langpair = mapLangCode(from) + "|" + mapLangCode(to);
            String url = String.format(
                "https://api.mymemory.translated.net/get?q=%s&langpair=%s",
                java.net.URLEncoder.encode(text, "UTF-8"),
                java.net.URLEncoder.encode(langpair, "UTF-8")
            );

            Request request = new Request.Builder().url(url).get().build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("MyMemory returned " + response.code());
                }

                JsonNode root = objectMapper.readTree(response.body().string());
                JsonNode responseData = root.get("responseData");
                if (responseData != null && responseData.has("translatedText")) {
                    String result = responseData.get("translatedText").asText();
                    // MyMemory returns "MYMEMORY WARNING..." on quota exceeded
                    if (result.startsWith("MYMEMORY")) {
                        throw new RuntimeException("MyMemory quota exceeded");
                    }
                    return result;
                }
                return text;
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("MyMemory unavailable: " + e.getMessage());
        }
    }

    private String mapLangCode(String code) {
        if (code == null) return "en";
        return switch (code.toLowerCase()) {
            case "zh", "zh-cn", "zh_cn", "chinese" -> "zh-CN";
            case "en", "english" -> "en";
            default -> code;
        };
    }

    private String translateWithGoogle(String text, String from, String to) {
        try {
            String url = String.format(
                "https://translate.googleapis.com/translate_a/single?client=gtx&sl=%s&tl=%s&dt=t&q=%s",
                from, to, java.net.URLEncoder.encode(text, "UTF-8")
            );

            Request request = new Request.Builder().url(url).get().build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("Google Translate returned " + response.code());
                }

                JsonNode root = objectMapper.readTree(response.body().string());
                JsonNode result = root.get(0);

                if (result != null && result.isArray()) {
                    StringBuilder sb = new StringBuilder();
                    for (JsonNode item : result) {
                        if (item.isArray() && item.size() > 0) {
                            sb.append(item.get(0).asText());
                        }
                    }
                    return sb.toString();
                }
                return text;
            }
        } catch (Exception e) {
            throw new RuntimeException("Translation service unavailable: " + e.getMessage());
        }
    }

    /**
     * 批量翻译段落
     */
    public List<String> batchTranslate(List<String> texts, String from, String to) {
        List<String> results = new ArrayList<>();

        for (String text : texts.subList(0, Math.min(texts.size(), 50))) {
            if (text == null || text.trim().isEmpty()) {
                results.add("");
                continue;
            }
            try {
                String translated = translate(text.substring(0, Math.min(text.length(), 2000)), from, to);
                results.add(translated);
                // 简单限速
                Thread.sleep(120);
            } catch (Exception e) {
                results.add(text); // 翻译失败返回原文
            }
        }

        return results;
    }
}
