import { http } from '@/lib/http';
import { apiClient } from '@/lib/apiClient';
import type { TrackingLinkResponse, TrackingResponse, VisitTimelineEvent } from './types';

export async function getVisitTimeline(visitId: string) {
  const { data } = await http.get<VisitTimelineEvent[] | { timeline?: VisitTimelineEvent[] }>(
    `/visits/${visitId}/timeline`,
  );
  if (Array.isArray(data)) return data;
  return data.timeline || [];
}

export async function getVisitTrackingLink(visitId: string) {
  const { data } = await http.get<TrackingLinkResponse>(`/visits/${visitId}/tracking-link`);
  return data;
}

export async function regenerateVisitTrackingLink(visitId: string) {
  const { data } = await http.post<TrackingLinkResponse>(`/visits/${visitId}/tracking-link/regenerate`);
  return data;
}

export async function getPublicTracking(token: string) {
  const { data } = await apiClient.get<TrackingResponse>(`/tracking/visits/${token}`, {
    headers: { Authorization: undefined },
  });
  return data;
}
