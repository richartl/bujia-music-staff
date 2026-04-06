import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPublicTrackingUrl, getTrackingUrlFromVisit } from '../src/features/visits/utils/publicTrackingUrl';
import type { VisitResponse } from '../src/features/visits/api/types';

describe('publicTrackingUrl utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('convierte rutas relativas en URL absoluta con host actual', () => {
    vi.stubGlobal('window', { location: { origin: 'https://midominio.com' } });

    expect(buildPublicTrackingUrl({ directUrl: '/tracking/abc123' })).toBe('https://midominio.com/tracking/abc123');
  });

  it('construye URL con token cuando no llega publicUrl', () => {
    vi.stubGlobal('window', { location: { origin: 'https://midominio.com' } });

    expect(buildPublicTrackingUrl({ token: 'tok_1' })).toBe('https://midominio.com/tracking/tok_1');
  });

  it('resuelve tracking desde datos anidados de visita', () => {
    vi.stubGlobal('window', { location: { origin: 'https://midominio.com' } });
    const visit = {
      id: 'v1',
      workshopId: 'w1',
      clientId: 'c1',
      instrumentId: 'i1',
      branchId: 'b1',
      folio: 'OT-1',
      tracking: { publicUrl: '/tracking/v1-token' },
    } as VisitResponse;

    expect(getTrackingUrlFromVisit(visit)).toBe('https://midominio.com/tracking/v1-token');
  });
});
