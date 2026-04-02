import { http } from '@/lib/http';
import type { UpdateVisitPayload, VisitResponse, VisitStatusCatalog } from './types';

export async function getVisitsByInstrument(workshopId: string, instrumentId: string) {
  const { data } = await http.get<VisitResponse[]>(
    `/workshops/${workshopId}/instruments/${instrumentId}/visits`,
  );
  return data;
}

export async function getVisitDetail(workshopId: string, instrumentId: string, visitId: string) {
  const { data } = await http.get<VisitResponse>(
    `/workshops/${workshopId}/instruments/${instrumentId}/visits/${visitId}`,
  );
  return data;
}

export async function patchVisit(
  workshopId: string,
  instrumentId: string,
  visitId: string,
  payload: UpdateVisitPayload,
) {
  const { data } = await http.patch<VisitResponse>(
    `/workshops/${workshopId}/instruments/${instrumentId}/visits/${visitId}`,
    payload,
  );
  return data;
}

export async function getWorkshopVisitStatuses(workshopId: string) {
  const { data } = await http.get<VisitStatusCatalog[]>(`/workshops/${workshopId}/workshop-visit-statuses`);
  return data;
}
