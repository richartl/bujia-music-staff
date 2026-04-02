import { http } from '@/lib/http';
import type { VisitService, VisitServiceNote } from './types';

export async function getVisitServices(visitId: string) {
  const { data } = await http.get<VisitService[]>(`/visits/${visitId}/services`);
  return data;
}

export async function createVisitService(visitId: string, payload: Record<string, unknown>) {
  const { data } = await http.post<VisitService>(`/visits/${visitId}/services`, payload);
  return data;
}

export async function patchVisitService(visitId: string, serviceId: string, payload: Record<string, unknown>) {
  const { data } = await http.patch<VisitService>(`/visits/${visitId}/services/${serviceId}`, payload);
  return data;
}

export async function deleteVisitService(visitId: string, serviceId: string) {
  await http.delete(`/visits/${visitId}/services/${serviceId}`);
}

export async function getVisitServiceNotes(serviceId: string) {
  const { data } = await http.get<VisitServiceNote[]>(`/visit-services/${serviceId}/notes`);
  return data;
}

export async function createVisitServiceNote(
  serviceId: string,
  payload: { note: string; isInternal: boolean },
) {
  const { data } = await http.post<VisitServiceNote>(`/visit-services/${serviceId}/notes`, payload);
  return data;
}

export async function patchVisitServiceNote(
  serviceId: string,
  noteId: string,
  payload: Partial<{ note: string; isInternal: boolean }>,
) {
  const { data } = await http.patch<VisitServiceNote>(`/visit-services/${serviceId}/notes/${noteId}`, payload);
  return data;
}

export async function deleteVisitServiceNote(serviceId: string, noteId: string) {
  await http.delete(`/visit-services/${serviceId}/notes/${noteId}`);
}
