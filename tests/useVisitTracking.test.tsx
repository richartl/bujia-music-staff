import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVisitTracking } from '../src/features/visits/hooks/useVisitTracking';
import * as trackingApi from '../src/features/visits/api/trackingApi';

vi.mock('../src/features/visits/api/trackingApi');

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useVisitTracking', () => {
  it('consulta tracking público por token', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(trackingApi.getVisitTracking).mockResolvedValue({ timeline: [] } as never);

    const { result } = renderHook(() => useVisitTracking({ token: 'abc' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.data).toBeTruthy();
    });
  });

  it('consulta timeline interno por visitId', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(trackingApi.getVisitTracking).mockResolvedValue({ timeline: [] } as never);

    const { result } = renderHook(() => useVisitTracking({ visitId: 'v1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => {
      expect(Array.isArray((result.current.data as { timeline?: unknown[] })?.timeline)).toBe(true);
    });
  });
});
