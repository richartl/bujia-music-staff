import { http } from '@/lib/http';
import type { VisitCard } from '@/types/visit';

export async function getVisits(workshopId: string) {
  const { data } = await http.get<VisitCard[]>(`/workshops/${workshopId}/visits`);
  return data;
}
