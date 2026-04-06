import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { VisitFilters, VisitStatusCatalog } from '../api/types';
import { patchVisit } from '../api/visitsApi';

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const maybe = error as { response?: { status?: number } };
    if (maybe.response?.status === 403) return 'No tienes permisos para actualizar el estado.';
  }
  return 'No se pudo actualizar el estado. Intenta de nuevo.';
}

export function useChangeVisitStatus(params: {
  workshopId?: string | null;
  filters: VisitFilters;
  statuses: VisitStatusCatalog[];
}) {
  const { workshopId, filters, statuses } = params;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { visitId: string; instrumentId: string; statusId: string }) => {
      if (!workshopId) throw new Error('No workshop');
      return patchVisit(workshopId, payload.instrumentId, payload.visitId, { statusId: payload.statusId });
    },
    onMutate: async (payload) => {
      const key = ['workshop-visits', workshopId, filters] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      const nextStatus = statuses.find((item) => item.id === payload.statusId);

      queryClient.setQueryData(key, (current: unknown) => {
        if (!Array.isArray(current)) return current;
        return current.map((visit) => {
          if (!visit || typeof visit !== 'object') return visit;
          const record = visit as Record<string, unknown>;
          if (record.id !== payload.visitId) return visit;
          return {
            ...record,
            statusId: payload.statusId,
            status: nextStatus ? { id: nextStatus.id, name: nextStatus.name, color: nextStatus.color || null } : record.status,
          };
        });
      });

      return { previous, key };
    },
    onSuccess: () => {
      notifySuccess('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['workshop-visits'] });
      queryClient.invalidateQueries({ queryKey: ['visit-detail'] });
    },
    onError: (error, _variables, context) => {
      if (context?.key) queryClient.setQueryData(context.key, context.previous);
      notifyError(getErrorMessage(error));
    },
  });
}
