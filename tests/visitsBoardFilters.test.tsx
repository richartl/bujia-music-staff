import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { VisitsBoardPage } from '../src/features/visits/pages/VisitsBoardPage';

const getWorkshopVisitsWithFilters = vi.fn();
const getWorkshopVisitStatuses = vi.fn();
const getWorkshopBranches = vi.fn();
const getWorkshopClients = vi.fn();
const getClientInstruments = vi.fn();

vi.mock('../src/stores/auth-store', () => ({
  authStore: (selector: (state: { workshopId: string }) => unknown) => selector({ workshopId: 'w1' }),
}));

vi.mock('../src/features/visits/api/visitsApi', () => ({
  getWorkshopVisitsWithFilters: (...args: unknown[]) => getWorkshopVisitsWithFilters(...args),
  getWorkshopVisitStatuses: (...args: unknown[]) => getWorkshopVisitStatuses(...args),
}));

vi.mock('../src/features/visits/api/workshopCatalogsApi', () => ({
  getWorkshopBranches: (...args: unknown[]) => getWorkshopBranches(...args),
  getWorkshopClients: (...args: unknown[]) => getWorkshopClients(...args),
  getClientInstruments: (...args: unknown[]) => getClientInstruments(...args),
}));

vi.mock('../src/features/visits/components/VisitCard', () => ({
  VisitCard: ({ visit }: { visit: { id: string } }) => <div>{visit.id}</div>,
}));

describe('VisitsBoardPage filters UX', () => {
  beforeEach(() => {
    getWorkshopVisitsWithFilters.mockResolvedValue([{ id: 'v1', isActive: true, openedAt: '2026-01-01T10:00:00.000Z', closedAt: null }]);
    getWorkshopVisitStatuses.mockResolvedValue([
      { id: 's1', workshopId: 'w1', code: 'PEND', name: 'Pendiente', color: '#f59e0b' },
      { id: 's2', workshopId: 'w1', code: 'PROC', name: 'En proceso', color: '#3b82f6' },
    ]);
    getWorkshopBranches.mockResolvedValue([]);
    getWorkshopClients.mockResolvedValue([]);
    getClientInstruments.mockResolvedValue([]);
  });

  it('aplica filtros automáticamente y no muestra botón de aplicar', async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <VisitsBoardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(getWorkshopVisitsWithFilters).toHaveBeenCalled();
    });

    expect(screen.queryByText('Aplicar filtros')).toBeNull();

    const statusSelect = screen.getByDisplayValue('Estatus');
    fireEvent.change(statusSelect, { target: { value: 's2' } });

    await waitFor(() => {
      expect(getWorkshopVisitsWithFilters).toHaveBeenLastCalledWith('w1', expect.objectContaining({ statusId: 's2' }));
    });
  });

  it('muestra filtros rápidos por status real además de activas/hoy', async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <VisitsBoardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Activas')).toBeTruthy();
      expect(screen.getByText('Hoy')).toBeTruthy();
      expect(screen.getByText('Pendiente')).toBeTruthy();
      expect(screen.getByText('En proceso')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('En proceso'));

    await waitFor(() => {
      expect(getWorkshopVisitsWithFilters).toHaveBeenLastCalledWith('w1', expect.objectContaining({ statusId: 's2' }));
    });
  });
});
