import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchVisitService, patchVisitServiceStatus } from '@/features/visits/api/visitServicesApi';

type Params = {
  visitId: string;
  serviceId: string;
  statusId: string;
};

export function useUpdateVisitServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ visitId, serviceId, statusId }: Params) => {
      try {
        return await patchVisitServiceStatus(visitId, serviceId, statusId);
      } catch {
        return patchVisitService(visitId, serviceId, { statusId });
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['visit-services', vars.visitId] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', vars.visitId] });
    },
  });
}
