package com.scorner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vocabulary", indexes = {
    @Index(name = "idx_vocab_word", columnList = "word"),
    @Index(name = "idx_vocab_mastery", columnList = "masteryLevel")
})
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String word;

    private String pronunciation;

    @Column(nullable = false)
    private String definition;

    @Column(nullable = false)
    private String chineseDefinition;

    @Column(columnDefinition = "TEXT")
    private String example;

    private String sourceArticleId;

    @Column(nullable = false)
    private Integer masteryLevel = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

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

    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }

    public String getPronunciation() { return pronunciation; }
    public void setPronunciation(String pronunciation) { this.pronunciation = pronunciation; }

    public String getDefinition() { return definition; }
    public void setDefinition(String definition) { this.definition = definition; }

    public String getChineseDefinition() { return chineseDefinition; }
    public void setChineseDefinition(String chineseDefinition) { this.chineseDefinition = chineseDefinition; }

    public String getExample() { return example; }
    public void setExample(String example) { this.example = example; }

    public String getSourceArticleId() { return sourceArticleId; }
    public void setSourceArticleId(String sourceArticleId) { this.sourceArticleId = sourceArticleId; }

    public Integer getMasteryLevel() { return masteryLevel; }
    public void setMasteryLevel(Integer masteryLevel) { this.masteryLevel = masteryLevel; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
