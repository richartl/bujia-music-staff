import type { VisitResponse } from '../api/types';

function pickFirstString(values: Array<unknown>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined;
}

function getWindowOrigin() {
  if (typeof window === 'undefined' || !window.location?.origin) return '';
  return window.location.origin;
}

function extractTokenFromUrl(url?: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url, 'https://tracking.local');
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  } catch {
    return '';
  }
}

export function buildPublicTrackingUrl(params: { directUrl?: string; token?: string }) {
  const directUrl = params.directUrl?.trim();
  const token = params.token?.trim() || extractTokenFromUrl(directUrl);
  if (!token) return '';

  const origin = getWindowOrigin();
  if (!origin) return `/tracking/${token}`;
  return `${origin}/tracking/${token}`;
}

export function getTrackingUrlFromVisit(visit: VisitResponse) {
  const visitAsRecord = visit as Record<string, unknown>;
  const tracking = visitAsRecord.tracking as Record<string, unknown> | undefined;
  const trackingLink = visitAsRecord.trackingLink as Record<string, unknown> | undefined;

  const directUrl = pickFirstString([
    tracking?.url,
    tracking?.publicUrl,
    trackingLink?.publicUrl,
    visitAsRecord.publicTrackingUrl,
    visitAsRecord.trackingUrl,
  ]);

  const token = pickFirstString([
    tracking?.token,
    trackingLink?.token,
    visitAsRecord.publicTrackingToken,
    extractTokenFromUrl(directUrl),
  ]);

  return buildPublicTrackingUrl({ directUrl, token });
}
