import type {
  ExamCategory,
  ExamCategoryDetail,
  ExamPaper,
  PaperAnnotation,
  PaperProgress,
  DictionaryResult,
} from '@/types/exam';
import type { VocabularyItem, VocabularyListResponse } from '@/types/vocabulary';

const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface CreateAnnotationPayload {
  paperId: string;
  pageIndex: number;
  type: string;
  selectedText?: string;
  color?: string;
  textContent?: string;
  drawingData?: string;
  positionData?: unknown;
  note?: string;
}

export interface UpdateProgressPayload {
  currentPage?: number;
  totalPages?: number;
  timeSpent?: number;
  isCompleted?: boolean;
}

export const examApi = {
  categories: () => request<ExamCategory[]>('/exam/categories'),
  papers: (categorySlug: string) => request<ExamCategoryDetail | { error: string }>(`/exam/${categorySlug}`),
  paperDetail: (slug: string) => request<ExamPaper & { categorySlug?: string }>(`/exam/paper/${slug}`),
  getAnnotations: (paperId: string) => request<PaperAnnotation[]>(`/exam/annotations/${paperId}`),
  createAnnotation: (data: CreateAnnotationPayload) =>
    request<PaperAnnotation>('/exam/annotations', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnotation: (id: string) => request<{ success: boolean }>(`/exam/annotations/${id}`, { method: 'DELETE' }),
  updateProgress: (paperId: string, data: UpdateProgressPayload) =>
    request<PaperProgress>(`/exam/progress/${paperId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const dictionaryApi = {
  lookup: (word: string, zh = false) =>
    request<DictionaryResult>(`/dictionary/${encodeURIComponent(word)}${zh ? '?zh=true' : ''}`),
};

export const translateApi = {
  translate: (text: string, from = 'en', to = 'zh-CN') =>
    request<{ translated: string; original: string }>('/translate', {
      method: 'POST',
      body: JSON.stringify({ text, from, to }),
    }),
};

export const vocabularyApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<VocabularyListResponse>(`/vocabulary${qs}`);
  },
  create: (data: Partial<VocabularyItem>) =>
    request<VocabularyItem>('/vocabulary', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<VocabularyItem>) =>
    request<VocabularyItem>(`/vocabulary/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ success: boolean }>(`/vocabulary/${id}`, { method: 'DELETE' }),
};
