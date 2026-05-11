import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi } from '@/services/api';

export function useVocabulary(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['vocabulary', params],
    queryFn: () => vocabularyApi.list(params),
  });
}

export function useAddVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vocabularyApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}

export function useUpdateVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vocabularyApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}

export function useDeleteVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vocabularyApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}
