import { useQuery } from '@tanstack/react-query';
import { examApi } from '@/services/api';

export function useExamCategories() {
  return useQuery({
    queryKey: ['exam-categories'],
    queryFn: () => examApi.categories(),
    staleTime: 60_000,
  });
}

export function useExamPapers(categorySlug: string) {
  return useQuery({
    queryKey: ['exam-papers', categorySlug],
    queryFn: () => examApi.papers(categorySlug),
    enabled: !!categorySlug,
    staleTime: 30_000,
  });
}

export function useExamPaperDetail(slug: string) {
  return useQuery({
    queryKey: ['exam-paper', slug],
    queryFn: () => examApi.paperDetail(slug),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
}

export function usePaperAnnotations(paperId: string) {
  return useQuery({
    queryKey: ['paper-annotations', paperId],
    queryFn: () => examApi.getAnnotations(paperId),
    enabled: !!paperId,
  });
}
