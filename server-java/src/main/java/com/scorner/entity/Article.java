package com.scorner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "articles", indexes = {
    @Index(name = "idx_article_status", columnList = "status"),
    @Index(name = "idx_article_category", columnList = "category"),
    @Index(name = "idx_article_is_from_rss", columnList = "isFromRss")
})
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private String source;

    private String sourceUrl;

    private String author;

    @Column(nullable = false)
    private String category = "news";

    @Column(nullable = false)
    private String difficulty = "medium";

    @Column(columnDefinition = "JSON")
    private String tags = "[]";

    @Column(nullable = false)
    private Boolean isFromRss = false;

    private String rssFeedId;

    private String imageUrl;

    @Column(nullable = false)
    private String status = "draft";

    private LocalDateTime publishedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("index ASC")
    private List<Paragraph> paragraphs = new ArrayList<>();

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Annotation> annotations = new ArrayList<>();

    @OneToOne(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    private ReadingProgress progress;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("index ASC")
    private List<ArticleImage> images = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public Boolean getIsFromRss() { return isFromRss; }
    public void setIsFromRss(Boolean isFromRss) { this.isFromRss = isFromRss; }

    public String getRssFeedId() { return rssFeedId; }
    public void setRssFeedId(String rssFeedId) { this.rssFeedId = rssFeedId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<Paragraph> getParagraphs() { return paragraphs; }
    public void setParagraphs(List<Paragraph> paragraphs) { this.paragraphs = paragraphs; }

    public List<Annotation> getAnnotations() { return annotations; }
    public void setAnnotations(List<Annotation> annotations) { this.annotations = annotations; }

    public ReadingProgress getProgress() { return progress; }
    public void setProgress(ReadingProgress progress) { this.progress = progress; }

    public List<ArticleImage> getImages() { return images; }
    public void setImages(List<ArticleImage> images) { this.images = images; }
}
