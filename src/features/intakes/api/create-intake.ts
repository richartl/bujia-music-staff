import { http } from '@/lib/http';

export async function createIntake(workshopId: string, payload: unknown) {
  const { data } = await http.post(`/workshops/${workshopId}/intakes`, payload);
  return data;
}
