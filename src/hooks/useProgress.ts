import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '@/services/api';

export function useProgress(articleId: string) {
  return useQuery({
    queryKey: ['progress', articleId],
    queryFn: () => progressApi.get(articleId),
    enabled: !!articleId,
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, data }: { articleId: string; data: any }) =>
      progressApi.update(articleId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['progress', variables.articleId] });
    },
  });
}
