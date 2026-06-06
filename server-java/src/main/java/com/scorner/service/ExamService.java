package com.scorner.service;

import com.scorner.entity.*;
import com.scorner.repository.*;
import com.scorner.util.MapUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ExamService {

    private final ExamCategoryRepository categoryRepository;
    private final ExamPaperRepository paperRepository;
    private final PaperAnnotationRepository annotationRepository;
    private final PaperProgressRepository progressRepository;
    private final CurrentUserService currentUserService;

    public ExamService(ExamCategoryRepository categoryRepository,
                       ExamPaperRepository paperRepository,
                       PaperAnnotationRepository annotationRepository,
                       PaperProgressRepository progressRepository,
                       CurrentUserService currentUserService) {
        this.categoryRepository = categoryRepository;
        this.paperRepository = paperRepository;
        this.annotationRepository = annotationRepository;
        this.progressRepository = progressRepository;
        this.currentUserService = currentUserService;
    }

    // ── 分类 ──

    public List<ExamCategory> listCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    public Optional<ExamCategory> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }

    // ── 试卷 ──

    /**
     * 获取某分类下按年份分组的试卷列表
     */
    public Map<String, Object> getPapersByCategory(String categorySlug) {
        Optional<ExamCategory> cat = categoryRepository.findBySlug(categorySlug);
        if (cat.isEmpty()) {
            return Map.of("error", "Category not found");
        }

        List<ExamPaper> papers = paperRepository
            .findByCategoryIdAndIsPublishedTrueOrderByYearDescMonthDescSetIdAsc(cat.get().getId());

        // 按年份+上下半年分组
        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();

        for (ExamPaper paper : papers) {
            String halfYear = paper.getMonth() >= 7 ? "下半年" : "上半年";
            String groupKey = paper.getYear() + "年 - " + halfYear;

            grouped.computeIfAbsent(groupKey, k -> new ArrayList<>());

            Map<String, Object> paperMap = new LinkedHashMap<>();
            paperMap.put("id", paper.getId());
            paperMap.put("slug", paper.getSlug());
            paperMap.put("title", paper.getTitle());
            paperMap.put("shortTitle", paper.getShortTitle());
            paperMap.put("coverImage", paper.getCoverImage());
            paperMap.put("year", paper.getYear());
            paperMap.put("month", paper.getMonth());
            paperMap.put("setId", paper.getSetId());

            // 进度（仅登录用户）
            currentUserService.getCurrentUserIdOptional().ifPresent(userId -> {
                progressRepository.findByUserIdAndPaperId(userId, paper.getId()).ifPresent(progress -> {
                    paperMap.put("progress", Map.of(
                        "currentPage", progress.getCurrentPage(),
                        "totalPages", progress.getTotalPages(),
                        "isCompleted", progress.getIsCompleted()
                    ));
                });
            });

            grouped.get(groupKey).add(paperMap);
        }

        // 转为有序列表
        List<Map<String, Object>> sections = new ArrayList<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
            sections.add(Map.of("title", entry.getKey(), "papers", entry.getValue()));
        }

        return Map.of(
            "category", Map.of(
                "id", cat.get().getId(),
                "slug", cat.get().getSlug(),
                "name", cat.get().getName(),
                "description", cat.get().getDescription()
            ),
            "sections", sections,
            "totalPapers", papers.size()
        );
    }

    /**
     * 获取单份试卷详情
     * @param fullSlug 格式为 "categorySlug/paperSlug" 如 "kaoyan/2026-01/01"
     */
    public Optional<Map<String, Object>> getPaperDetail(String fullSlug) {
        // 从 fullSlug 中提取 categorySlug 和 paperSlug
        // fullSlug 格式: "kaoyan/2026-01/01" → categorySlug="kaoyan", paperSlug="2026-01/01"
        String[] parts = fullSlug.split("/", 2);
        if (parts.length < 2) return Optional.empty();

        String categorySlug = parts[0];
        String paperSlug = parts[1];

        // 先查找分类，再按 slug + categoryId 查找试卷
        Optional<ExamCategory> category = categoryRepository.findBySlug(categorySlug);
        if (category.isEmpty()) return Optional.empty();

        Optional<ExamPaper> paper = paperRepository.findBySlugAndCategoryId(paperSlug, category.get().getId());
        if (paper.isEmpty()) return Optional.empty();

        ExamPaper p = paper.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", p.getId());
        result.put("slug", p.getSlug());
        result.put("title", p.getTitle());
        result.put("shortTitle", p.getShortTitle());
        result.put("coverImage", p.getCoverImage());
        result.put("pdfUrl", p.getPdfUrl());
        result.put("audioUrl", p.getAudioUrl());
        result.put("answers", p.getAnswers());
        result.put("transcript", p.getTranscript());
        result.put("audioTimeline", p.getAudioTimeline());
        result.put("year", p.getYear());
        result.put("month", p.getMonth());
        result.put("setId", p.getSetId());
        result.put("categorySlug", categorySlug);

        // 进度（仅登录用户）
        currentUserService.getCurrentUserIdOptional().ifPresent(userId -> {
            progressRepository.findByUserIdAndPaperId(userId, p.getId()).ifPresent(progress -> {
                result.put("progress", Map.of(
                    "currentPage", progress.getCurrentPage(),
                    "totalPages", progress.getTotalPages(),
                    "timeSpent", progress.getTimeSpent(),
                    "isCompleted", progress.getIsCompleted()
                ));
            });
        });

        return Optional.of(result);
    }

    /**
     * 更新试卷答案
     */
    @Transactional
    public void updateAnswers(String paperId, String answers) {
        ExamPaper paper = paperRepository.findById(paperId)
            .orElseThrow(() -> new RuntimeException("Paper not found: " + paperId));
        paper.setAnswers(answers);
        paperRepository.save(paper);
    }

    @Transactional
    public void updatePaperContent(String paperId, Map<String, Object> fields) {
        ExamPaper paper = paperRepository.findById(paperId)
            .orElseThrow(() -> new RuntimeException("Paper not found: " + paperId));
        if (fields.containsKey("answers")) {
            Object answers = fields.get("answers");
            paper.setAnswers(answers instanceof String ? (String) answers : answers.toString());
        }
        if (fields.containsKey("audioUrl")) paper.setAudioUrl((String) fields.get("audioUrl"));
        if (fields.containsKey("transcript")) paper.setTranscript((String) fields.get("transcript"));
        if (fields.containsKey("audioTimeline")) {
            Object timeline = fields.get("audioTimeline");
            paper.setAudioTimeline(timeline instanceof String ? (String) timeline : timeline.toString());
        }
        paperRepository.save(paper);
    }

    @Transactional
    public int importPaperContent(List<Map<String, Object>> papers) {
        int updated = 0;
        for (Map<String, Object> item : papers) {
            String categorySlug = (String) item.get("categorySlug");
            String slug = (String) item.get("slug");
            if (categorySlug == null || slug == null) continue;

            Optional<ExamCategory> category = categoryRepository.findBySlug(categorySlug);
            if (category.isEmpty()) continue;

            Optional<ExamPaper> paper = paperRepository.findBySlugAndCategoryId(slug, category.get().getId());
            if (paper.isEmpty()) continue;

            ExamPaper p = paper.get();
            if (item.containsKey("answers")) {
                Object answers = item.get("answers");
                if (answers instanceof String) {
                    p.setAnswers((String) answers);
                } else {
                    try {
                        p.setAnswers(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(answers));
                    } catch (Exception e) {
                        p.setAnswers(answers.toString());
                    }
                }
            }
            if (item.containsKey("audioUrl")) p.setAudioUrl((String) item.get("audioUrl"));
            if (item.containsKey("transcript")) p.setTranscript((String) item.get("transcript"));
            if (item.containsKey("audioTimeline")) {
                Object timeline = item.get("audioTimeline");
                if (timeline instanceof String) {
                    p.setAudioTimeline((String) timeline);
                } else {
                    try {
                        p.setAudioTimeline(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(timeline));
                    } catch (Exception e) {
                        p.setAudioTimeline(timeline.toString());
                    }
                }
            }
            paperRepository.save(p);
            updated++;
        }
        return updated;
    }

    // ── 标注 ──

    public List<PaperAnnotation> getAnnotations(String paperId) {
        String userId = currentUserService.getCurrentUserId();
        return annotationRepository.findByUserIdAndPaperIdOrderByPageIndexAsc(userId, paperId);
    }

    @Transactional
    public PaperAnnotation createAnnotation(String paperId, Integer pageIndex, String type,
                                             String selectedText, String color, String textContent,
                                             String drawingData, String positionData, String note) {
        String userId = currentUserService.getCurrentUserId();
        PaperAnnotation ann = new PaperAnnotation();
        ann.setUserId(userId);
        ann.setPaperId(paperId);
        ann.setPageIndex(pageIndex);
        ann.setType(type);
        ann.setSelectedText(selectedText);
        ann.setColor(color);
        ann.setTextContent(textContent);
        ann.setDrawingData(drawingData);
        ann.setPositionData(positionData);
        ann.setNote(note);
        return annotationRepository.save(ann);
    }

    @Transactional
    public void deleteAnnotation(String id) {
        String userId = currentUserService.getCurrentUserId();
        PaperAnnotation ann = annotationRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new RuntimeException("Annotation not found: " + id));
        annotationRepository.delete(ann);
    }

    // ── 进度 ──

    @Transactional
    public PaperProgress updateProgress(String paperId, Map<String, Object> fields) {
        String userId = currentUserService.getCurrentUserId();
        Optional<PaperProgress> existing = progressRepository.findByUserIdAndPaperId(userId, paperId);

        PaperProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
            if (fields.containsKey("currentPage")) progress.setCurrentPage(MapUtils.getInt(fields, "currentPage"));
            if (fields.containsKey("totalPages")) progress.setTotalPages(MapUtils.getInt(fields, "totalPages"));
            if (fields.containsKey("timeSpent")) {
                Integer incoming = MapUtils.getInt(fields, "timeSpent");
                if (incoming != null && incoming > 0) {
                    int current = progress.getTimeSpent() != null ? progress.getTimeSpent() : 0;
                    progress.setTimeSpent(current + incoming);
                }
            }
            if (fields.containsKey("isCompleted")) progress.setIsCompleted(MapUtils.getBoolean(fields, "isCompleted"));
            progress.setLastReadAt(LocalDateTime.now());
        } else {
            progress = new PaperProgress();
            progress.setUserId(userId);
            progress.setPaperId(paperId);
            progress.setCurrentPage(fields.containsKey("currentPage") ? MapUtils.getInt(fields, "currentPage") : 0);
            progress.setTotalPages(fields.containsKey("totalPages") ? MapUtils.getInt(fields, "totalPages") : 0);
            progress.setTimeSpent(fields.containsKey("timeSpent") ? MapUtils.getInt(fields, "timeSpent") : 0);
            progress.setIsCompleted(fields.containsKey("isCompleted") ? MapUtils.getBoolean(fields, "isCompleted") : false);
        }

        return progressRepository.save(progress);
    }
}
