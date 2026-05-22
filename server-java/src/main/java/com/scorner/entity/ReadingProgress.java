package com.scorner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_progress", indexes = {
    @Index(name = "idx_progress_article_id", columnList = "article_id")
})
public class ReadingProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String articleId;

    @Column(nullable = false)
    private Integer lastParagraph = 0;

    @Column(nullable = false)
    private Integer totalParagraphs = 0;

    @Column(nullable = false)
    private Integer timeSpent = 0;

    @Column(nullable = false)
    private Boolean isCompleted = false;

    @Column(nullable = false)
    private LocalDateTime lastReadAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "articleId", insertable = false, updatable = false)
    private Article article;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.lastReadAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getArticleId() { return articleId; }
    public void setArticleId(String articleId) { this.articleId = articleId; }

    public Integer getLastParagraph() { return lastParagraph; }
    public void setLastParagraph(Integer lastParagraph) { this.lastParagraph = lastParagraph; }

    public Integer getTotalParagraphs() { return totalParagraphs; }
    public void setTotalParagraphs(Integer totalParagraphs) { this.totalParagraphs = totalParagraphs; }

    public Integer getTimeSpent() { return timeSpent; }
    public void setTimeSpent(Integer timeSpent) { this.timeSpent = timeSpent; }

    public Boolean getIsCompleted() { return isCompleted; }
    public void setIsCompleted(Boolean isCompleted) { this.isCompleted = isCompleted; }

    public LocalDateTime getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(LocalDateTime lastReadAt) { this.lastReadAt = lastReadAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public Article getArticle() { return article; }
    public void setArticle(Article article) { this.article = article; }
}
