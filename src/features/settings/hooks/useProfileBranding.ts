import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authStore } from '@/stores/auth-store';
import { env } from '@/config/env';
import { getUserWorkshop, getUserWorkshops } from '@/features/settings/api/user-workshops';

export function useCurrentUserProfileImage() {
  const user = authStore((state) => state.user);

  return {
    profileImageUrl: user?.profileImageUrl || null,
    user,
  };
}

export function useWorkshopBranding() {
  const user = authStore((state) => state.user);
  const workshopId = authStore((state) => state.workshopId);

  const workshopsQuery = useQuery({
    queryKey: ['workshops', user?.id],
    queryFn: () => getUserWorkshops(user!.id),
    enabled: !!user?.id,
  });

  const workshopQuery = useQuery({
    queryKey: ['workshop-branding', user?.id, workshopId],
    queryFn: () => getUserWorkshop(user!.id, workshopId!),
    enabled: !!user?.id && !!workshopId,
  });

  const activeWorkshop = useMemo(() => {
    if (workshopQuery.data) return workshopQuery.data;
    return (workshopsQuery.data || []).find((workshop) => workshop.id === workshopId) || null;
  }, [workshopId, workshopQuery.data, workshopsQuery.data]);

  return {
    activeWorkshop,
    workshops: workshopsQuery.data || [],
    isLoading: workshopsQuery.isLoading || workshopQuery.isLoading,
    isError: workshopsQuery.isError || workshopQuery.isError,
  };
}

export function useUpdateUserProfileImage() {
  return useMutation({
    mutationFn: async (_payload: { mediaId: string | null }) => {
      if (!env.enableProfileImageEditing) {
        throw new Error('Edición de imagen deshabilitada por feature flag.');
      }
      throw new Error('Backend de actualización de imagen de usuario no disponible todavía.');
    },
  });
}

export function useUpdateWorkshopProfileImage() {
  return useMutation({
    mutationFn: async (_payload: { workshopId: string; mediaId: string | null }) => {
      if (!env.enableProfileImageEditing) {
        throw new Error('Edición de imagen deshabilitada por feature flag.');
      }
      throw new Error('Backend de actualización de imagen de taller no disponible todavía.');
    },
  });
}
