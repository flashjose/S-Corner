// ── 考试分类 ──
export interface ExamCategory {
  id: string;
  slug: string;        // kaoyan, cet4, cet6, tem
  name: string;        // 历年考研英语, 大学英语四级, ...
  description?: string;
  displayOrder: number;
  coverImage?: string;
}

// ── 试卷 ──
export interface ExamPaper {
  id: string;
  slug: string;         // 2025-12/01
  title: string;        // 2025年12月英语四级真题(第1套)
  shortTitle?: string;
  coverImage?: string;
  pdfUrl?: string;
  audioUrl?: string;
  answers?: string;     // JSON string
  transcript?: string;  // 听力原文
  year: number;
  month: number;
  setId: number;
  progress?: PaperProgress;
}

// ── 试卷分组 ──
export interface ExamSection {
  title: string;        // 2025年 - 下半年
  papers: ExamPaper[];
}

export interface ExamCategoryDetail {
  category: ExamCategory;
  sections: ExamSection[];
  totalPapers: number;
}

// ── 试卷标注 ──
export interface PaperAnnotation {
  id: string;
  paperId: string;
  pageIndex: number;
  type: 'highlight' | 'underline' | 'text' | 'drawing' | 'eraser';
  selectedText?: string;
  color?: string;
  textContent?: string;
  drawingData?: string;
  positionData?: string;
  note?: string;
  createdAt: string;
}

// ── 阅读进度 ──
export interface PaperProgress {
  currentPage: number;
  totalPages: number;
  timeSpent: number;
  isCompleted: boolean;
}

// ── 词典结果 ──
export interface DictionaryResult {
  word: string;
  phonetic: string;
  wordZh?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
    definitionsZh?: string[];
  }[];
  message?: string;
}

// ── 标注工具类型 ──
export type AnnotationTool = 'view' | 'highlight' | 'underline' | 'text' | 'drawing' | 'eraser';

// ── 高亮颜色 ──
export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#facc15' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Orange', value: '#fb923c' },
];
