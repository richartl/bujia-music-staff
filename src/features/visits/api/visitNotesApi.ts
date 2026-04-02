import { http } from '@/lib/http';
import type { VisitNote } from './types';

export async function getVisitNotes(visitId: string) {
  const { data } = await http.get<VisitNote[]>(`/visits/${visitId}/notes`);
  return data;
}

export async function createVisitNote(visitId: string, payload: { note: string; isInternal: boolean }) {
  const { data } = await http.post<VisitNote>(`/visits/${visitId}/notes`, payload);
  return data;
}

export async function updateVisitNote(
  visitId: string,
  noteId: string,
  payload: Partial<{ note: string; isInternal: boolean }>,
) {
  const { data } = await http.patch<VisitNote>(`/visits/${visitId}/notes/${noteId}`, payload);
  return data;
}
