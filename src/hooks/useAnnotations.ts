import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { annotationsApi } from '@/services/api';

export function useAnnotations(articleId: string) {
  return useQuery({
    queryKey: ['annotations', articleId],
    queryFn: () => annotationsApi.list(articleId),
    enabled: !!articleId,
  });
}

export function useCreateAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => annotationsApi.create(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['annotations', variables.articleId] });
    },
  });
}

export function useDeleteAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => annotationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['annotations'] }),
  });
}
