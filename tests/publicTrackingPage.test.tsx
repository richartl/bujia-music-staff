import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PublicTrackingPage, getFinancialSummary } from '../src/features/tracking/pages/PublicTrackingPage';

vi.mock('../src/features/visits/api/trackingApi', () => ({
  getPublicTracking: vi.fn(async () => ({
    workshop: { name: 'Taller' },
    branch: { id: 'b1', name: 'Centro' },
    status: { name: 'En proceso', color: '#0ea5e9' },
    visit: { total: 1000, discount: 100, partsTotal: 250, client: { fullName: 'Juan' }, instrument: { name: 'Strat' } },
    payments: { totalPaid: 400, pendingAmount: 600 },
    services: [{ id: 's1', name: 'Setup', quantity: 1, price: 750, status: { name: 'Ok', code: 'OK' } }],
    timeline: [
      { eventType: 'A', title: '1', isPublic: true, occurredAt: '2026-01-01T10:00:00.000Z' },
      { eventType: 'B', title: '2', isPublic: true, occurredAt: '2026-01-02T10:00:00.000Z' },
      { eventType: 'C', title: '3', isPublic: true, occurredAt: '2026-01-03T10:00:00.000Z' },
      { eventType: 'D', title: '4', isPublic: true, occurredAt: '2026-01-04T10:00:00.000Z' },
    ],
  })),
}));

describe('PublicTrackingPage', () => {
  it('incluye refacciones en resumen', () => {
    const summary = getFinancialSummary({
      visit: { total: 1000, discount: 100 } as never,
      services: [{ id: 's1', quantity: 1, price: 750, status: { name: 'ok', code: 'OK' } } as never],
      payments: { totalPaid: 400, pendingAmount: 600 } as never,
    });

    expect(summary.servicesTotal).toBe(750);
    expect(summary.discountTotal).toBe(100);
    expect(summary.pendingTotal).toBe(600);
  });

  it('muestra 3 eventos inicialmente y permite ver todos', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/tracking/token-1']}>
          <Routes>
            <Route path="/tracking/:token" element={<PublicTrackingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('4')).toBeTruthy();
    expect(screen.getByText('Ver todos los eventos')).toBeTruthy();

    fireEvent.click(screen.getByText('Ver todos los eventos'));
    expect(screen.getByText('Ver solo los recientes')).toBeTruthy();
  });
});
