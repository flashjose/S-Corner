package com.scorner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 考试类别 (如：考研英语、CET4、CET6)
 */
@Entity
@Table(name = "exam_categories")
public class ExamCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String slug; // kaoyan, cet4, cet6

    @Column(nullable = false)
    private String name; // 考研英语, 大学英语四级, ...

    private String description;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    private String coverImage;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @OrderBy("year DESC, month DESC, setId ASC")
    @JsonIgnore
    private List<ExamPaper> papers = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<ExamPaper> getPapers() { return papers; }
    public void setPapers(List<ExamPaper> papers) { this.papers = papers; }
}
