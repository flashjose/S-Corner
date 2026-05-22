package com.scorner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 试卷上的标注（高亮、下划线、手写等）
 */
@Entity
@Table(name = "paper_annotations", indexes = {
    @Index(name = "idx_pa_paper", columnList = "paper_id"),
    @Index(name = "idx_pa_page", columnList = "page_index")
})
public class PaperAnnotation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String paperId;

    @Column(nullable = false)
    private Integer pageIndex; // PDF 页码

    @Column(nullable = false)
    private String type; // highlight, underline, text, drawing, eraser

    // 高亮/下划线：选中的文本
    private String selectedText;

    // 高亮/下划线：颜色
    private String color;

    // 文本输入：内容和位置
    @Column(columnDefinition = "TEXT")
    private String textContent;

    // 手绘：SVG path 数据
    @Column(columnDefinition = "LONGTEXT")
    private String drawingData;

    // 坐标信息 (相对于页面的百分比或像素)
    @Column(columnDefinition = "JSON")
    private String positionData;

    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paperId", insertable = false, updatable = false)
    @JsonIgnore
    private ExamPaper paper;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPaperId() { return paperId; }
    public void setPaperId(String paperId) { this.paperId = paperId; }
    public Integer getPageIndex() { return pageIndex; }
    public void setPageIndex(Integer pageIndex) { this.pageIndex = pageIndex; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSelectedText() { return selectedText; }
    public void setSelectedText(String selectedText) { this.selectedText = selectedText; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getTextContent() { return textContent; }
    public void setTextContent(String textContent) { this.textContent = textContent; }
    public String getDrawingData() { return drawingData; }
    public void setDrawingData(String drawingData) { this.drawingData = drawingData; }
    public String getPositionData() { return positionData; }
    public void setPositionData(String positionData) { this.positionData = positionData; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public ExamPaper getPaper() { return paper; }
    public void setPaper(ExamPaper paper) { this.paper = paper; }
}
