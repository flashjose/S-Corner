package com.scorner.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Profile("legacy")
public class SummaryService {

    private static final Set<String> STOP_WORDS = Set.of(
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "can", "to", "of", "in", "for",
        "on", "with", "at", "by", "from", "as", "into", "through", "during",
        "before", "after", "above", "below", "between", "out", "off", "over",
        "under", "again", "further", "then", "once", "and", "but", "or", "nor",
        "not", "so", "if", "than", "too", "very", "just", "about", "also",
        "that", "this", "these", "those", "it", "its", "we", "our", "they",
        "their", "he", "she", "his", "her", "which", "what", "who", "whom",
        "where", "when", "why", "how", "all", "each", "every", "both", "few",
        "more", "most", "other", "some", "such", "no", "only", "own", "same",
        "up", "down", "here", "there", "now"
    );

    private static final Pattern WORD_PATTERN = Pattern.compile("\\b[a-z]{3,}\\b");
    private static final Pattern SENTENCE_PATTERN = Pattern.compile("(?<=[.!?])\\s+");

    /**
     * 基于 TextRank 的简易提取式摘要
     */
    public String extractiveSummary(String text, int maxSentences) {
        maxSentences = Math.min(maxSentences, 10);

        // 分句
        String normalized = text.replaceAll("\n+", " ");
        String[] rawSentences = SENTENCE_PATTERN.split(normalized);
        List<String> sentences = new ArrayList<>();
        for (String s : rawSentences) {
            String trimmed = s.trim();
            if (trimmed.length() > 30 && trimmed.length() < 500) {
                sentences.add(trimmed);
            }
        }

        if (sentences.size() <= maxSentences) {
            return String.join(" ", sentences);
        }

        // 计算词频
        Map<String, Integer> wordFreq = new HashMap<>();
        for (String sentence : sentences) {
            Matcher m = WORD_PATTERN.matcher(sentence.toLowerCase());
            while (m.find()) {
                String word = m.group();
                if (!STOP_WORDS.contains(word)) {
                    wordFreq.merge(word, 1, Integer::sum);
                }
            }
        }

        // 给每个句子打分
        List<double[]> scored = new ArrayList<>(); // [score, index]
        for (int i = 0; i < sentences.size(); i++) {
            String sentence = sentences.get(i);
            Matcher m = WORD_PATTERN.matcher(sentence.toLowerCase());
            List<String> words = new ArrayList<>();
            while (m.find()) words.add(m.group());

            double score = 0;
            for (String word : words) {
                score += wordFreq.getOrDefault(word, 0);
            }

            // 位置权重
            double positionWeight = i < 3 ? 1.5 : (i >= sentences.size() - 2 ? 1.2 : 1.0);
            // 长度权重
            int len = words.size();
            double lengthWeight = len >= 8 && len <= 40 ? 1.2 : 0.8;
            // 数字权重
            double hasNumbers = sentence.matches(".*\\d+.*") ? 1.1 : 1.0;

            score = score * positionWeight * lengthWeight * hasNumbers / Math.max(len, 1);
            scored.add(new double[]{score, i});
        }

        // 按分数排序取前N句，再按原文顺序排列
        scored.sort((a, b) -> Double.compare(b[0], a[0]));
        List<double[]> topN = scored.subList(0, maxSentences);
        topN.sort((a, b) -> Double.compare(a[1], b[1]));

        StringBuilder summary = new StringBuilder();
        for (double[] item : topN) {
            if (summary.length() > 0) summary.append(" ");
            summary.append(sentences.get((int) item[1]));
        }

        return summary.toString();
    }
}
