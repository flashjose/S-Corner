package com.scorner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 真题试卷 (如：2025年12月英语四级真题 第1套)
 */
@Entity
@Table(name = "exam_papers", indexes = {
    @Index(name = "idx_paper_category", columnList = "category_id"),
    @Index(name = "idx_paper_year", columnList = "year"),
    @Index(name = "idx_paper_slug", columnList = "slug")
})
public class ExamPaper {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String categoryId;

    @Column(nullable = false)
    private Integer year; // 2025

    @Column(nullable = false)
    private Integer month; // 6 或 12

    @Column(nullable = false)
    private Integer setId; // 第几套: 1, 2, 3

    @Column(nullable = false)
    private String slug; // 2025-12/01

    @Column(nullable = false)
    private String title; // 2025年12月英语四级真题(第1套)

    private String shortTitle; // 2025年12月四级真题(第1套)

    private String coverImage; // 封面缩略图 URL

    private String pdfUrl; // PDF 文件 URL

    private String audioUrl; // 听力音频 URL

    @Column(columnDefinition = "JSON")
    private String answers; // 答案解析 JSON

    @Column(columnDefinition = "TEXT")
    private String transcript; // 听力原文

    @Column(columnDefinition = "JSON")
    private String audioTimeline; // 听力分段时间轴 JSON

    @Column(nullable = false)
    private Boolean isPublished = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryId", insertable = false, updatable = false)
    @JsonIgnore
    private ExamCategory category;

    @OneToMany(mappedBy = "paper", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("pageIndex ASC")
    @JsonIgnore
    private List<PaperAnnotation> annotations = new ArrayList<>();

    @OneToMany(mappedBy = "paper", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<PaperProgress> progressList = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getSetId() { return setId; }
    public void setSetId(Integer setId) { this.setId = setId; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getShortTitle() { return shortTitle; }
    public void setShortTitle(String shortTitle) { this.shortTitle = shortTitle; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }
    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }
    public String getAudioTimeline() { return audioTimeline; }
    public void setAudioTimeline(String audioTimeline) { this.audioTimeline = audioTimeline; }
    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public ExamCategory getCategory() { return category; }
    public List<PaperAnnotation> getAnnotations() { return annotations; }
    public void setAnnotations(List<PaperAnnotation> annotations) { this.annotations = annotations; }
    public List<PaperProgress> getProgressList() { return progressList; }
    public void setProgressList(List<PaperProgress> progressList) { this.progressList = progressList; }
}
