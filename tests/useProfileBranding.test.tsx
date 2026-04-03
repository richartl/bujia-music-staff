import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWorkshopBranding } from '../src/features/settings/hooks/useProfileBranding';
import * as workshopsApi from '../src/features/settings/api/user-workshops';
import { authStore } from '../src/stores/auth-store';

vi.mock('../src/features/settings/api/user-workshops');

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useWorkshopBranding', () => {
  it('selecciona workshop activo y branding', async () => {
    authStore.setState({ user: { id: 'u1', email: 'a@b.com', role: 'ADMIN' }, workshopId: 'w1' });
    vi.mocked(workshopsApi.getUserWorkshops).mockResolvedValue([
      { id: 'w1', name: 'Bujia', profileImageUrl: 'https://cdn/profile.jpg', logoUrl: 'https://cdn/logo.jpg' },
    ] as never);
    vi.mocked(workshopsApi.getUserWorkshop).mockResolvedValue({
      id: 'w1',
      name: 'Bujia',
      profileImageUrl: 'https://cdn/profile.jpg',
      logoUrl: 'https://cdn/logo.jpg',
    } as never);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useWorkshopBranding(), { wrapper: createWrapper(client) });

    await waitFor(() => {
      expect(result.current.activeWorkshop?.id).toBe('w1');
    });
  });
});
