package com.scorner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "article_images", indexes = {
    @Index(name = "idx_article_image_article_id", columnList = "article_id")
})
public class ArticleImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String articleId;

    @Column(nullable = false)
    private String url;

    private String alt;

    private String caption;

    @Column(nullable = false)
    private Integer imageIndex = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "articleId", insertable = false, updatable = false)
    private Article article;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getArticleId() { return articleId; }
    public void setArticleId(String articleId) { this.articleId = articleId; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getAlt() { return alt; }
    public void setAlt(String alt) { this.alt = alt; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public Integer getImageIndex() { return imageIndex; }
    public void setImageIndex(Integer imageIndex) { this.imageIndex = imageIndex; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public Article getArticle() { return article; }
    public void setArticle(Article article) { this.article = article; }
}
