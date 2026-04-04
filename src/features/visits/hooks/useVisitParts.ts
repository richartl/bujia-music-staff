import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createVisitPart,
  createWorkshopPart,
  deleteVisitPart,
  getVisitParts,
  getWorkshopPartById,
  getWorkshopParts,
  updateVisitPart,
  updateWorkshopPart,
  type CreateVisitPartDto,
  type CreateWorkshopPartDto,
  type UpdateVisitPartDto,
  type UpdateWorkshopPartDto,
} from '@/features/visits/api/visitPartsApi';

export function useWorkshopParts(workshopId?: string | null, isActive?: boolean) {
  return useQuery({
    queryKey: ['workshop-parts', workshopId, isActive],
    queryFn: () => getWorkshopParts(workshopId!, isActive === undefined ? undefined : { isActive }),
    enabled: !!workshopId,
  });
}

export function useWorkshopPart(workshopId?: string | null, partId?: string | null) {
  return useQuery({
    queryKey: ['workshop-part', workshopId, partId],
    queryFn: () => getWorkshopPartById(workshopId!, partId!),
    enabled: !!workshopId && !!partId,
  });
}

export function useCreateWorkshopPart(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkshopPartDto) => createWorkshopPart(workshopId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-parts', workshopId] });
    },
  });
}

export function useUpdateWorkshopPart(workshopId?: string | null, partId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWorkshopPartDto) => updateWorkshopPart(workshopId!, partId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-parts', workshopId] });
      queryClient.invalidateQueries({ queryKey: ['workshop-part', workshopId, partId] });
    },
  });
}

export function useVisitParts(visitId: string) {
  return useQuery({
    queryKey: ['visit-parts', visitId],
    queryFn: () => getVisitParts(visitId),
    enabled: !!visitId,
  });
}

export function useCreateVisitPart(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVisitPartDto) => createVisitPart(visitId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-parts', visitId] });
      queryClient.invalidateQueries({ queryKey: ['visit-detail'] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', visitId] });
    },
  });
}

export function useUpdateVisitPart(visitId: string, visitPartId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVisitPartDto) => updateVisitPart(visitId, visitPartId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-parts', visitId] });
      queryClient.invalidateQueries({ queryKey: ['visit-detail'] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', visitId] });
    },
  });
}

export function useDeleteVisitPart(visitId: string, visitPartId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteVisitPart(visitId, visitPartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-parts', visitId] });
      queryClient.invalidateQueries({ queryKey: ['visit-detail'] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', visitId] });
    },
  });
}
