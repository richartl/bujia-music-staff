import { useQuery } from '@tanstack/react-query';
import { getVisitTracking } from '@/features/visits/api/trackingApi';

export function useVisitTracking(params: { visitId?: string; token?: string }) {
  const { visitId, token } = params;

  return useQuery({
    queryKey: ['visit-tracking-unified', visitId || '', token || ''],
    queryFn: () => getVisitTracking({ visitId, token }),
    enabled: !!visitId || !!token,
  });
}
