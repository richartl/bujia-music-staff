import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useCreateVisitPart,
  useDeleteVisitPart,
  useVisitParts,
  useWorkshopParts,
} from '../src/features/visits/hooks/useVisitParts';
import * as partsApi from '../src/features/visits/api/visitPartsApi';

vi.mock('../src/features/visits/api/visitPartsApi');

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useVisitParts hooks', () => {
  it('consulta catálogo y partes de visita', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(partsApi.getWorkshopParts).mockResolvedValue([{ id: 'p1', workshopId: 'w1', name: 'Cejuela', listPrice: 10, publicPrice: 20, isActive: true } as never]);
    vi.mocked(partsApi.getVisitParts).mockResolvedValue([{ id: 'vp1', visitId: 'v1', name: 'Cejuela', quantity: 1, unitPrice: 20 } as never]);

    const { result: workshopResult } = renderHook(() => useWorkshopParts('w1'), { wrapper: createWrapper(client) });
    const { result: visitResult } = renderHook(() => useVisitParts('v1'), { wrapper: createWrapper(client) });

    await waitFor(() => {
      expect(workshopResult.current.data?.[0]?.id).toBe('p1');
      expect(visitResult.current.data?.[0]?.id).toBe('vp1');
    });
  });

  it('crea y elimina refacciones de visita', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(partsApi.createVisitPart).mockResolvedValue({ id: 'vp1', visitId: 'v1', name: 'Cejuela', quantity: 1, unitPrice: 20 } as never);
    vi.mocked(partsApi.deleteVisitPart).mockResolvedValue();

    const { result: createResult } = renderHook(() => useCreateVisitPart('v1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await createResult.current.mutateAsync({ name: 'Manual', quantity: 1, unitPrice: 10 });
    });

    const { result: deleteResult } = renderHook(() => useDeleteVisitPart('v1', 'vp1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await deleteResult.current.mutateAsync();
    });

    expect(partsApi.createVisitPart).toHaveBeenCalled();
    expect(partsApi.deleteVisitPart).toHaveBeenCalled();
  });
});
