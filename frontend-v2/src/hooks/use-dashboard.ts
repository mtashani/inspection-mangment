import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '@/lib/api';

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    refetchOnWindowFocus: true,
  });
}
