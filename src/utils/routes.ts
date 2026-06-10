const EXAM_SLUGS = new Set(['cet4', 'cet6', 'kaoyan']);

/** 是否在真题 PDF 阅读页（如 /cet4/2025-12/01） */
export function isPaperViewerPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length >= 2 && EXAM_SLUGS.has(parts[0]);
}
