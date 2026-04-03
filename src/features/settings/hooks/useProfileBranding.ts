import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authStore } from '@/stores/auth-store';
import type { Workshop } from '@/types/workshop';
import { getUserWorkshop, getUserWorkshops } from '@/features/settings/api/user-workshops';
import {
  updateUserProfileImage,
  updateWorkshopProfileImage,
  type ProfileImageUpdateResponse,
} from '@/features/settings/api/profile-images';

function patchWorkshopCollection(workshops: Workshop[] | undefined, workshopId: string, profileImageUrl: string | null) {
  if (!Array.isArray(workshops)) return workshops;
  return workshops.map((workshop) =>
    workshop.id === workshopId ? { ...workshop, profileImageUrl } : workshop,
  );
}

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, mediaId }: { userId: string; mediaId: string | null }) =>
      updateUserProfileImage(userId, mediaId),
    onSuccess: (response: ProfileImageUpdateResponse) => {
      const state = authStore.getState();
      if (state.user?.id === response.id) {
        const nextUser = { ...state.user, profileImageUrl: response.profileImageUrl };
        localStorage.setItem('staff-user', JSON.stringify(nextUser));
        authStore.setState({ user: nextUser });
      }
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      queryClient.invalidateQueries({ queryKey: ['workshop-branding'] });
    },
  });
}

export function useUpdateWorkshopProfileImage() {
  const queryClient = useQueryClient();
  const user = authStore((state) => state.user);

  return useMutation({
    mutationFn: async ({ workshopId, mediaId }: { workshopId: string; mediaId: string | null }) =>
      updateWorkshopProfileImage(workshopId, mediaId),
    onSuccess: (response, variables) => {
      queryClient.setQueriesData({ queryKey: ['workshops', user?.id] }, (current: Workshop[] | undefined) =>
        patchWorkshopCollection(current, variables.workshopId, response.profileImageUrl),
      );

      queryClient.setQueryData(['workshop-branding', user?.id, variables.workshopId], (current: Workshop | undefined) =>
        current ? { ...current, profileImageUrl: response.profileImageUrl } : current,
      );

      queryClient.invalidateQueries({ queryKey: ['workshops', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['workshop-branding', user?.id, variables.workshopId] });
      queryClient.invalidateQueries({ queryKey: ['public-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['visit-tracking'] });
    },
  });
}
