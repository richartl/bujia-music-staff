import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useCreateVisitPayment,
  useDeleteVisitPayment,
  useVisitPayment,
  useUpdateVisitPayment,
  useVisitPayments,
} from '../src/features/visits/hooks/useVisitPayments';
import * as paymentsApi from '../src/features/visits/api/visitPaymentsApi';

vi.mock('../src/features/visits/api/visitPaymentsApi');

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useVisitPayments hooks', () => {
  it('consulta payments por visita', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(paymentsApi.getVisitPayments).mockResolvedValue({
      items: [],
      totalPaid: 0,
      visitTotal: 1000,
      pendingAmount: 1000,
    });

    const { result } = renderHook(() => useVisitPayments('visit-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.data?.visitTotal).toBe(1000);
    });
  });

  it('consulta un payment puntual', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(paymentsApi.getVisitPayment).mockResolvedValue({
      id: 'payment-10',
      visitId: 'visit-1',
      workshopId: 'w1',
      amount: 500,
      paymentMethodId: null,
      method: 'Efectivo',
      notes: null,
      paidAt: new Date().toISOString(),
      attachments: [],
    });

    const { result } = renderHook(() => useVisitPayment('visit-1', 'payment-10'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.data?.id).toBe('payment-10');
    });
  });

  it('crea payment e invalida queries', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    vi.mocked(paymentsApi.createVisitPayment).mockResolvedValue({
      id: 'payment-1',
      visitId: 'visit-1',
      workshopId: 'w1',
      amount: 250,
      paymentMethodId: 'pm1',
      method: null,
      notes: null,
      paidAt: new Date().toISOString(),
      attachments: [],
    });

    const { result } = renderHook(() => useCreateVisitPayment('visit-1'), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ amount: 250, paymentMethodId: 'pm1' });
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('actualiza y elimina payment', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    vi.mocked(paymentsApi.updateVisitPayment).mockResolvedValue({
      id: 'payment-1',
      visitId: 'visit-1',
      workshopId: 'w1',
      amount: 350,
      paymentMethodId: null,
      method: 'Transferencia',
      notes: 'ok',
      paidAt: new Date().toISOString(),
      attachments: [],
    });
    vi.mocked(paymentsApi.deleteVisitPayment).mockResolvedValue();

    const { result: updateResult } = renderHook(() => useUpdateVisitPayment('visit-1', 'payment-1'), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await updateResult.current.mutateAsync({ amount: 350, method: 'Transferencia' });
    });

    const { result: deleteResult } = renderHook(() => useDeleteVisitPayment('visit-1', 'payment-1'), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await deleteResult.current.mutateAsync();
    });

    expect(paymentsApi.updateVisitPayment).toHaveBeenCalled();
    expect(paymentsApi.deleteVisitPayment).toHaveBeenCalled();
  });
});
