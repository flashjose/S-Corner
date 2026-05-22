package com.scorner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rss_feeds", indexes = {
    @Index(name = "idx_rss_feed_is_active", columnList = "isActive")
})
public class RssFeed {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String url;

    @Column(nullable = false)
    private String category = "news";

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Integer fetchHour = 8;

    @Column(nullable = false)
    private Integer fetchMinute = 0;

    private LocalDateTime lastFetchedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getFetchHour() { return fetchHour; }
    public void setFetchHour(Integer fetchHour) { this.fetchHour = fetchHour; }

    public Integer getFetchMinute() { return fetchMinute; }
    public void setFetchMinute(Integer fetchMinute) { this.fetchMinute = fetchMinute; }

    public LocalDateTime getLastFetchedAt() { return lastFetchedAt; }
    public void setLastFetchedAt(LocalDateTime lastFetchedAt) { this.lastFetchedAt = lastFetchedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
