import { http } from '@/lib/http';
import type { Workshop } from '@/types/workshop';

function normalizeWorkshop(workshop: Workshop): Workshop {
  return {
    ...workshop,
    profileImageUrl: workshop.profileImageUrl || null,
    logoUrl: workshop.logoUrl || null,
  };
}

export async function getUserWorkshops(userId: string) {
  const { data } = await http.get<Workshop[]>(`/users/${userId}/workshops`);
  return (Array.isArray(data) ? data : []).map(normalizeWorkshop);
}

export async function getUserWorkshop(userId: string, workshopId: string) {
  const { data } = await http.get<Workshop>(`/users/${userId}/workshops/${workshopId}`);
  return normalizeWorkshop(data);
}
