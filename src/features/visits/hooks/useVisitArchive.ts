import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyError, notifySuccess } from '@/lib/notify';
import { archiveVisit, unarchiveVisit } from '../api/visitsApi';

function resolveErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const maybe = error as { response?: { data?: { message?: string }; status?: number } };
    if (typeof maybe.response?.data?.message === 'string' && maybe.response.data.message.trim()) {
      return maybe.response.data.message;
    }
    if (maybe.response?.status === 403) return 'No tienes permisos para esta operación.';
  }
  return fallback;
}

type UseVisitArchiveParams = {
  workshopId?: string | null;
};

export function useVisitArchive({ workshopId }: UseVisitArchiveParams) {
  const queryClient = useQueryClient();

  const refreshVisitCaches = async (instrumentId: string, visitId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workshop-visits'] }),
      queryClient.invalidateQueries({ queryKey: ['visit-detail', workshopId, instrumentId, visitId] }),
      queryClient.invalidateQueries({ queryKey: ['public-tracking'] }),
    ]);
  };

  const archiveMutation = useMutation({
    mutationFn: async (payload: { instrumentId: string; visitId: string; reason?: string }) => {
      if (!workshopId) throw new Error('No hay taller activo');
      return archiveVisit(workshopId, payload.instrumentId, payload.visitId, payload.reason ? { reason: payload.reason } : undefined);
    },
    onSuccess: async (_data, variables) => {
      await refreshVisitCaches(variables.instrumentId, variables.visitId);
      notifySuccess('Visita archivada');
    },
    onError: (error) => {
      notifyError(resolveErrorMessage(error, 'No se pudo archivar la visita'));
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (payload: { instrumentId: string; visitId: string }) => {
      if (!workshopId) throw new Error('No hay taller activo');
      return unarchiveVisit(workshopId, payload.instrumentId, payload.visitId);
    },
    onSuccess: async (_data, variables) => {
      await refreshVisitCaches(variables.instrumentId, variables.visitId);
      notifySuccess('Visita desarchivada');
    },
    onError: (error) => {
      notifyError(resolveErrorMessage(error, 'No se pudo desarchivar la visita'));
    },
  });

  return {
    archiveMutation,
    unarchiveMutation,
  };
}
