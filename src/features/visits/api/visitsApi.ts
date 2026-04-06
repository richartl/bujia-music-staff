import { http } from '@/lib/http';
import type { ArchiveVisitPayload, UpdateVisitPayload, VisitFilters, VisitResponse, VisitStatusCatalog } from './types';

export async function getVisitsByInstrument(workshopId: string, instrumentId: string) {
  const { data } = await http.get<VisitResponse[]>(
    `/workshops/${workshopId}/instruments/${instrumentId}/visits`,
  );
  return data;
}

export async function getWorkshopVisits(workshopId: string) {
  const { data } = await http.get<VisitResponse[]>(`/workshops/${workshopId}/visits`);
  return data;
}

export async function getWorkshopVisitsWithFilters(workshopId: string, filters: VisitFilters) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  );
  const { data } = await http.get<VisitResponse[]>(`/workshops/${workshopId}/visits`, { params });
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

export async function archiveVisit(
  workshopId: string,
  instrumentId: string,
  visitId: string,
  payload?: ArchiveVisitPayload,
) {
  const { data } = await http.patch<VisitResponse>(
    `/workshops/${workshopId}/instruments/${instrumentId}/visits/${visitId}/archive`,
    payload,
  );
  return data;
}

export async function unarchiveVisit(workshopId: string, instrumentId: string, visitId: string) {
  const { data } = await http.patch<VisitResponse>(
    `/workshops/${workshopId}/instruments/${instrumentId}/visits/${visitId}/unarchive`,
  );
  return data;
}

export async function getWorkshopVisitStatuses(workshopId: string) {
  const { data } = await http.get<VisitStatusCatalog[]>(`/workshops/${workshopId}/workshop-visit-statuses`);
  return data;
}
