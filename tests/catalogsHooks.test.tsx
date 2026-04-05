import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalogsApi from '../src/features/catalogs/api/catalogsApi';
import {
  useCreateWorkshopUser,
  useDeleteWorkshopUser,
  useCreateWorkshopPart,
  useCreateWorkshopService,
  useUpdateWorkshopUser,
  useUpdateUserProfileImage,
  useWorkshopColors,
  useWorkshopUsers,
} from '../src/features/catalogs/hooks/useCatalogs';
import { catalogsQueryKeys } from '../src/features/catalogs/queryKeys';

vi.mock('../src/features/catalogs/api/catalogsApi');

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('catalogs hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useWorkshopColors consulta con contrato correcto', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(catalogsApi.getWorkshopColors).mockResolvedValue([{ id: 'c1', workshopId: 'w1', name: 'Rojo' } as never]);

    const { result } = renderHook(() => useWorkshopColors('w1'), { wrapper: createWrapper(client) });

    await waitFor(() => {
      expect(result.current.data?.[0]?.id).toBe('c1');
    });

    expect(catalogsApi.getWorkshopColors).toHaveBeenCalledWith('w1');
  });

  it('mutaciones invalidan list + detail del recurso', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(catalogsApi.createWorkshopService).mockResolvedValue({ id: 'svc1' } as never);

    const { result } = renderHook(() => useCreateWorkshopService('w1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Setup', slug: 'setup' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.workshopServices.list('w1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.workshopServices.detail('w1', 'svc1') });
  });

  it('workshop parts invalida listas con y sin isActive', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(catalogsApi.createWorkshopPart).mockResolvedValue({ id: 'p1' } as never);

    const { result } = renderHook(() => useCreateWorkshopPart('w1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Part', listPrice: 10, publicPrice: 20 });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.workshopParts.list('w1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.workshopParts.list('w1', true) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.workshopParts.list('w1', false) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.workshopParts.detail('w1', 'p1') });
  });

  it('users solo expone PATCH profile-image', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(catalogsApi.updateUserProfileImage).mockResolvedValue({ id: 'u1', profileImageUrl: 'x' } as never);
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateUserProfileImage('u1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ mediaId: 'media-1' });
    });

    expect(catalogsApi.updateUserProfileImage).toHaveBeenCalledWith('u1', { mediaId: 'media-1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.users.profileImage('u1') });
  });

  it('users hooks consultan lista y mutan invalidando list + detail', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(catalogsApi.getWorkshopUsers).mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 } as never);
    vi.mocked(catalogsApi.createWorkshopUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(catalogsApi.updateWorkshopUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(catalogsApi.deleteWorkshopUser).mockResolvedValue(undefined as never);

    const listHook = renderHook(() => useWorkshopUsers('w1', { page: 1, limit: 20, search: 'maria', role: 'STAFF' }), { wrapper: createWrapper(client) });
    await waitFor(() => {
      expect(listHook.result.current.data?.page).toBe(1);
    });
    expect(catalogsApi.getWorkshopUsers).toHaveBeenCalledWith('w1', { page: 1, limit: 20, search: 'maria', role: 'STAFF' });

    const createHook = renderHook(() => useCreateWorkshopUser('w1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await createHook.result.current.mutateAsync({ name: 'María', email: 'maria@bujia.com', password: '12345678', role: 'STAFF' });
    });

    const updateHook = renderHook(() => useUpdateWorkshopUser('w1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await updateHook.result.current.mutateAsync({ userId: 'u1', payload: { role: 'ADMIN' } });
    });
    const deleteHook = renderHook(() => useDeleteWorkshopUser('w1'), { wrapper: createWrapper(client) });
    await act(async () => {
      await deleteHook.result.current.mutateAsync({ userId: 'u1' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.users.workshopBase('w1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: catalogsQueryKeys.users.workshopDetail('w1', 'u1') });
  });
});
