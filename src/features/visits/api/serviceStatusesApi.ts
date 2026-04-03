import { http } from '@/lib/http';
import type { ServiceStatusCatalog } from './types';

export async function getWorkshopServiceStatuses(workshopId: string) {
  const { data } = await http.get<ServiceStatusCatalog[]>(`/workshops/${workshopId}/service-statuses`);
  return data;
}
