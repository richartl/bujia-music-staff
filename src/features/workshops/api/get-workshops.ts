import { http } from '@/lib/http';
import type { Workshop } from '@/types/workshop';

export async function getWorkshops(userId: string) {
  const { data } = await http.get<Workshop[]>(`/users/${userId}/workshops`);
  return data;
}
