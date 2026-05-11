import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/services/api';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.get(),
  });
}
