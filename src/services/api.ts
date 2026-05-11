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

// Articles
export const articlesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/articles${qs}`);
  },
  get: (id: string) => request<any>(`/articles/${id}`),
  create: (data: any) => request<any>('/articles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/articles/${id}`, { method: 'DELETE' }),
  updateParagraphs: (id: string, paragraphs: any[]) =>
    request<any>(`/articles/${id}/paragraphs`, { method: 'POST', body: JSON.stringify({ paragraphs }) }),
};

// Vocabulary
export const vocabularyApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/vocabulary${qs}`);
  },
  create: (data: any) => request<any>('/vocabulary', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/vocabulary/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/vocabulary/${id}`, { method: 'DELETE' }),
};

// Annotations
export const annotationsApi = {
  list: (articleId: string) => request<any[]>(`/annotations/${articleId}`),
  create: (data: any) => request<any>('/annotations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/annotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/annotations/${id}`, { method: 'DELETE' }),
};

// Progress
export const progressApi = {
  get: (articleId: string) => request<any>(`/progress/${articleId}`),
  update: (articleId: string, data: any) => request<any>(`/progress/${articleId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Dictionary
export const dictionaryApi = {
  lookup: (word: string) => request<any>(`/dictionary/${encodeURIComponent(word)}`),
};

// RSS
export const rssApi = {
  listFeeds: () => request<any[]>('/rss/feeds'),
  createFeed: (data: any) => request<any>('/rss/feeds', { method: 'POST', body: JSON.stringify(data) }),
  updateFeed: (id: string, data: any) => request<any>(`/rss/feeds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeed: (id: string) => request<any>(`/rss/feeds/${id}`, { method: 'DELETE' }),
  fetchFeed: (id: string) => request<any>(`/rss/feeds/${id}/fetch`, { method: 'POST' }),
};

// Stats
export const statsApi = {
  get: () => request<any>('/stats'),
};
