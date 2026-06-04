package com.scorner.service;

import com.scorner.entity.DictionaryEntry;
import com.scorner.repository.DictionaryEntryRepository;
import com.scorner.repository.DictionaryWordFormRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LocalDictionaryService {

    private static final int MAX_SENSES = 6;
    private static final Pattern ANNOTATED_LINE = Pattern.compile(
        "^([a-z&\\.\\s]+?)\\.\\s*(.+)$",
        Pattern.CASE_INSENSITIVE
    );

    private final DictionaryEntryRepository entryRepository;
    private final DictionaryWordFormRepository wordFormRepository;

    public LocalDictionaryService(
            DictionaryEntryRepository entryRepository,
            DictionaryWordFormRepository wordFormRepository) {
        this.entryRepository = entryRepository;
        this.wordFormRepository = wordFormRepository;
    }

    public Optional<Map<String, Object>> lookup(String normalizedWord, boolean includeZh) {
        Optional<DictionaryEntry> entry = resolveEntry(normalizedWord);
        if (entry.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(toApiResult(entry.get(), includeZh));
    }

    private Optional<DictionaryEntry> resolveEntry(String word) {
        Optional<DictionaryEntry> direct = entryRepository.findByWord(word);
        if (direct.isPresent()) {
            return direct;
        }
        return wordFormRepository.findByForm(word)
            .flatMap(form -> entryRepository.findByWord(form.getLemma()));
    }

    Map<String, Object> toApiResult(DictionaryEntry entry, boolean includeZh) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("word", entry.getWord());
        result.put("phonetic", entry.getPhonetic() != null ? entry.getPhonetic() : "");

        List<AnnotatedLine> enLines = parseAnnotatedLines(entry.getDefinition());
        List<AnnotatedLine> zhLines = includeZh ? parseAnnotatedLines(entry.getTranslation()) : List.of();

        result.put("meanings", buildMeanings(entry, enLines, zhLines, includeZh));

        if (includeZh) {
            String wordZh = buildWordZh(zhLines, entry.getTranslation());
            if (!wordZh.isEmpty()) {
                result.put("wordZh", wordZh);
            }
        }

        return result;
    }

    private List<Map<String, Object>> buildMeanings(
            DictionaryEntry entry,
            List<AnnotatedLine> enLines,
            List<AnnotatedLine> zhLines,
            boolean includeZh) {

        if (enLines.isEmpty() && !zhLines.isEmpty()) {
            enLines = zhLines.stream()
                .map(z -> new AnnotatedLine(z.pos, ""))
                .toList();
        }

        if (enLines.isEmpty()) {
            return List.of();
        }

        boolean pairedByLine = includeZh
            && !zhLines.isEmpty()
            && enLines.size() == zhLines.size()
            && enLines.size() > 1;

        if (pairedByLine) {
            List<Map<String, Object>> meanings = new ArrayList<>();
            int limit = Math.min(enLines.size(), MAX_SENSES);
            for (int i = 0; i < limit; i++) {
                meanings.add(buildOneMeaning(enLines.get(i), zhLines.get(i), includeZh, entry.getPos()));
            }
            return meanings;
        }

        Map<String, Object> meaning = new LinkedHashMap<>();
        String pos = entry.getPos() != null ? entry.getPos() : "";
        if (!enLines.isEmpty() && !enLines.get(0).pos.isEmpty()) {
            pos = enLines.get(0).pos;
        }
        meaning.put("partOfSpeech", pos);

        List<Map<String, Object>> definitions = new ArrayList<>();
        List<String> definitionsZh = includeZh ? new ArrayList<>() : null;

        int limit = Math.min(enLines.size(), MAX_SENSES);
        for (int i = 0; i < limit; i++) {
            String en = enLines.get(i).text;
            if (en.isEmpty() && i < zhLines.size()) {
                en = zhLines.get(i).text;
            }
            if (!en.isEmpty()) {
                definitions.add(Map.of("definition", en));
            }
            if (definitionsZh != null) {
                String zh = i < zhLines.size() ? zhLines.get(i).text : "";
                definitionsZh.add(zh);
            }
        }

        if (definitions.isEmpty() && includeZh && !zhLines.isEmpty()) {
            for (int i = 0; i < Math.min(zhLines.size(), MAX_SENSES); i++) {
                definitions.add(Map.of("definition", ""));
                definitionsZh.add(zhLines.get(i).text);
            }
        }

        meaning.put("definitions", definitions);
        if (definitionsZh != null && definitionsZh.stream().anyMatch(s -> !s.isEmpty())) {
            meaning.put("definitionsZh", definitionsZh);
        }

        return List.of(meaning);
    }

    private Map<String, Object> buildOneMeaning(
            AnnotatedLine en,
            AnnotatedLine zh,
            boolean includeZh,
            String fallbackPos) {
        Map<String, Object> meaning = new LinkedHashMap<>();
        String pos = !en.pos.isEmpty() ? en.pos : (!zh.pos.isEmpty() ? zh.pos : fallbackPos != null ? fallbackPos : "");
        meaning.put("partOfSpeech", pos);

        String enText = en.text.isEmpty() ? zh.text : en.text;
        meaning.put("definitions", List.of(Map.of("definition", enText)));

        if (includeZh && !zh.text.isEmpty()) {
            meaning.put("definitionsZh", List.of(zh.text));
        }
        return meaning;
    }

    private static String buildWordZh(List<AnnotatedLine> zhLines, String rawTranslation) {
        if (!zhLines.isEmpty()) {
            if (zhLines.size() == 1) {
                AnnotatedLine line = zhLines.get(0);
                return line.pos.isEmpty() ? line.text : line.pos + ". " + line.text;
            }
            return zhLines.stream()
                .limit(3)
                .map(l -> l.pos.isEmpty() ? l.text : l.pos + ". " + l.text)
                .reduce((a, b) -> a + " · " + b)
                .orElse("");
        }
        return firstLine(rawTranslation);
    }

    static List<AnnotatedLine> parseAnnotatedLines(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        List<AnnotatedLine> lines = new ArrayList<>();
        for (String part : raw.split("\\n")) {
            String line = part.trim();
            if (line.isEmpty()) continue;
            Matcher m = ANNOTATED_LINE.matcher(line);
            if (m.matches()) {
                lines.add(new AnnotatedLine(normalizePos(m.group(1)), m.group(2).trim()));
            } else {
                lines.add(new AnnotatedLine("", line));
            }
        }
        return lines;
    }

    private static String normalizePos(String pos) {
        return pos == null ? "" : pos.trim().replaceAll("\\s+", " ");
    }

    private static String firstLine(String text) {
        if (text == null || text.isBlank()) return "";
        return text.split("\\n")[0].trim();
    }

    record AnnotatedLine(String pos, String text) {}
}
