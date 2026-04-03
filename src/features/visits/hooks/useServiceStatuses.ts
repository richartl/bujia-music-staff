import { useQuery } from '@tanstack/react-query';
import { getWorkshopServiceStatuses } from '@/features/visits/api/serviceStatusesApi';

export function useServiceStatuses(workshopId?: string | null) {
  return useQuery({
    queryKey: ['service-statuses', workshopId],
    queryFn: async () => {
      const statuses = await getWorkshopServiceStatuses(workshopId!);
      return statuses
        .filter((status) => status.isActive !== false)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    },
    enabled: !!workshopId,
    staleTime: 1000 * 60 * 10,
  });
}
