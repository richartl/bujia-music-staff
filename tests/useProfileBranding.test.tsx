import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useUpdateUserProfileImage,
  useWorkshopBranding,
  useUpdateWorkshopProfileImage,
} from '../src/features/settings/hooks/useProfileBranding';
import * as workshopsApi from '../src/features/settings/api/user-workshops';
import * as profileImagesApi from '../src/features/settings/api/profile-images';
import { authStore } from '../src/stores/auth-store';

vi.mock('../src/features/settings/api/user-workshops');
vi.mock('../src/features/settings/api/profile-images');

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

  it('actualiza perfil de usuario en store al mutar imagen', async () => {
    authStore.setState({ user: { id: 'u1', email: 'a@b.com', role: 'ADMIN', profileImageUrl: null }, workshopId: 'w1' });
    vi.mocked(profileImagesApi.updateUserProfileImage).mockResolvedValue({
      id: 'u1',
      profileImageUrl: 'https://cdn/new-user.jpg',
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUpdateUserProfileImage(), { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1', mediaId: 'm1' });
    });

    expect(authStore.getState().user?.profileImageUrl).toBe('https://cdn/new-user.jpg');
  });

  it('actualiza cache de talleres al mutar imagen de taller', async () => {
    authStore.setState({ user: { id: 'u1', email: 'a@b.com', role: 'ADMIN' }, workshopId: 'w1' });
    vi.mocked(profileImagesApi.updateWorkshopProfileImage).mockResolvedValue({
      id: 'w1',
      profileImageUrl: 'https://cdn/new-workshop.jpg',
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['workshops', 'u1'], [{ id: 'w1', name: 'Bujia', profileImageUrl: null }]);

    const { result } = renderHook(() => useUpdateWorkshopProfileImage(), { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.mutateAsync({ workshopId: 'w1', mediaId: 'm1' });
    });

    const workshops = client.getQueryData<Array<{ id: string; profileImageUrl: string | null }>>(['workshops', 'u1']);
    expect(workshops?.[0]?.profileImageUrl).toBe('https://cdn/new-workshop.jpg');
  });
});
