import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createVisitPayment,
  deleteVisitPayment,
  getVisitPayments,
  updateVisitPayment,
  type CreateVisitPaymentRequest,
  type UpdateVisitPaymentRequest,
} from '@/features/visits/api/visitPaymentsApi';

export function useVisitPayments(visitId: string) {
  return useQuery({
    queryKey: ['visit-payments', visitId],
    queryFn: () => getVisitPayments(visitId),
    enabled: !!visitId,
  });
}

export function useCreateVisitPayment(visitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVisitPaymentRequest) => createVisitPayment(visitId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-payments', visitId] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', visitId] });
    },
  });
}

export function useUpdateVisitPayment(visitId: string, paymentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateVisitPaymentRequest) => updateVisitPayment(visitId, paymentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-payments', visitId] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', visitId] });
    },
  });
}

export function useDeleteVisitPayment(visitId: string, paymentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteVisitPayment(visitId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-payments', visitId] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', visitId] });
    },
  });
}
