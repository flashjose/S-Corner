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

// ── Exam API ──
export const examApi = {
  categories: () => request<any[]>('/exam/categories'),
  papers: (categorySlug: string) => request<any>(`/exam/${categorySlug}`),
  paperDetail: (slug: string) => request<any>(`/exam/paper/${slug}`),
  getAnnotations: (paperId: string) => request<any[]>(`/exam/annotations/${paperId}`),
  createAnnotation: (data: any) => request<any>('/exam/annotations', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnotation: (id: string) => request<any>(`/exam/annotations/${id}`, { method: 'DELETE' }),
  updateProgress: (paperId: string, data: any) => request<any>(`/exam/progress/${paperId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Dictionary API ──
export const dictionaryApi = {
  lookup: (word: string) => request<any>(`/dictionary/${encodeURIComponent(word)}`),
};

// ── Translation API ──
export const translateApi = {
  translate: (text: string, from = 'en', to = 'zh-CN') =>
    request<{ translated: string; original: string }>('/translate', {
      method: 'POST',
      body: JSON.stringify({ text, from, to }),
    }),
  batch: (texts: string[], from = 'en', to = 'zh-CN') =>
    request<{ translations: string[] }>('/translate/batch', {
      method: 'POST',
      body: JSON.stringify({ texts, from, to }),
    }),
};

// ── Vocabulary API ──
export const vocabularyApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/vocabulary${qs}`);
  },
  create: (data: any) => request<any>('/vocabulary', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/vocabulary/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/vocabulary/${id}`, { method: 'DELETE' }),
};
