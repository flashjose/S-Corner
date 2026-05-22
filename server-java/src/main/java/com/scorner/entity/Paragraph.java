package com.scorner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "paragraphs", indexes = {
    @Index(name = "idx_paragraph_article_id", columnList = "article_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"article_id", "paragraph_index"})
})
public class Paragraph {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String articleId;

    @Column(name = "paragraph_index", nullable = false)
    private Integer index;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String originalText;

    @Column(columnDefinition = "TEXT")
    private String chineseTranslation;

    @Column(columnDefinition = "TEXT")
    private String grammaticalAnalysis;

    @Column(columnDefinition = "TEXT")
    private String expressionTips;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "articleId", insertable = false, updatable = false)
    private Article article;

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getArticleId() { return articleId; }
    public void setArticleId(String articleId) { this.articleId = articleId; }

    public Integer getIndex() { return index; }
    public void setIndex(Integer index) { this.index = index; }

    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getChineseTranslation() { return chineseTranslation; }
    public void setChineseTranslation(String chineseTranslation) { this.chineseTranslation = chineseTranslation; }

    public String getGrammaticalAnalysis() { return grammaticalAnalysis; }
    public void setGrammaticalAnalysis(String grammaticalAnalysis) { this.grammaticalAnalysis = grammaticalAnalysis; }

    public String getExpressionTips() { return expressionTips; }
    public void setExpressionTips(String expressionTips) { this.expressionTips = expressionTips; }

    public Article getArticle() { return article; }
    public void setArticle(Article article) { this.article = article; }
}
