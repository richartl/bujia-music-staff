import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogsPage } from '../src/features/catalogs/pages/CatalogsPage';
import { authStore } from '../src/stores/auth-store';

vi.mock('../src/features/catalogs/hooks/useCatalogs', () => {
  const query = (data: unknown[] = []) => ({ data, isLoading: false, isError: false });
  const mutation = () => ({ mutateAsync: vi.fn(async () => ({})) });
  return {
    useWorkshopColors: vi.fn(() => query([{ id: 'c-global', name: 'Rojo Global', slug: 'rojo', hex: '#ff0000', isActive: true, isGlobal: true, workshopId: null, updatedAt: '2026-01-01' }, { id: 'c-local', name: 'Azul Local', slug: 'azul', hex: '#0000ff', isActive: true, isGlobal: false, workshopId: 'w1', updatedAt: '2026-01-02' }])),
    useWorkshopBrands: vi.fn(() => query([])),
    useWorkshopVisitStatuses: vi.fn(() => query([])),
    useWorkshopServiceStatuses: vi.fn(() => query([])),
    useWorkshopParts: vi.fn(() => query([{ id: 'p1', name: 'Cejuela', listPrice: 10, publicPrice: 20, isActive: true, updatedAt: '2026-01-02' }])),
    useWorkshopServices: vi.fn(() => query([])),
    useTunings: vi.fn(() => query([])),
    useStringGauges: vi.fn(() => query([])),
    useAffiliates: vi.fn(() => query([])),
    useCreateWorkshopColor: vi.fn(mutation),
    useUpdateWorkshopColor: vi.fn(mutation),
    useDeleteWorkshopColor: vi.fn(mutation),
    useCreateWorkshopBrand: vi.fn(mutation),
    useUpdateWorkshopBrand: vi.fn(mutation),
    useDeleteWorkshopBrand: vi.fn(mutation),
    useCreateWorkshopVisitStatus: vi.fn(mutation),
    useUpdateWorkshopVisitStatus: vi.fn(mutation),
    useDeleteWorkshopVisitStatus: vi.fn(mutation),
    useCreateWorkshopServiceStatus: vi.fn(mutation),
    useUpdateWorkshopServiceStatus: vi.fn(mutation),
    useDeleteWorkshopServiceStatus: vi.fn(mutation),
    useCreateWorkshopPart: vi.fn(mutation),
    useUpdateWorkshopPart: vi.fn(mutation),
    useCreateWorkshopService: vi.fn(mutation),
    useUpdateWorkshopService: vi.fn(mutation),
    useDeleteWorkshopService: vi.fn(mutation),
    useCreateTuning: vi.fn(mutation),
    useUpdateTuning: vi.fn(mutation),
    useDeleteTuning: vi.fn(mutation),
    useCreateStringGauge: vi.fn(mutation),
    useUpdateStringGauge: vi.fn(mutation),
    useDeleteStringGauge: vi.fn(mutation),
    useCreateAffiliate: vi.fn(mutation),
    useUpdateAffiliate: vi.fn(mutation),
    useDeleteAffiliate: vi.fn(mutation),
  };
});

describe('CatalogsPage UI', () => {
  beforeEach(() => {
    authStore.setState({ workshopId: 'w1' as never });
  });

  it('renderiza el hub principal con todos los catálogos', () => {
    render(<CatalogsPage />);
    expect(screen.getByText('Colores')).toBeTruthy();
    expect(screen.getByText('Marcas')).toBeTruthy();
    expect(screen.getByText('Status de visita')).toBeTruthy();
    expect(screen.getByText('Status de servicio')).toBeTruthy();
    expect(screen.getByText('Refacciones')).toBeTruthy();
    expect(screen.getByText('Servicios')).toBeTruthy();
    expect(screen.getByText('Afinaciones')).toBeTruthy();
    expect(screen.getByText('Calibres de cuerdas')).toBeTruthy();
    expect(screen.getByText('Afiliados')).toBeTruthy();
  });

  it('colors distingue global vs taller y bloquea acciones indebidas para globales', () => {
    render(<CatalogsPage />);
    expect(screen.getByText('Global')).toBeTruthy();
    expect(screen.getByText('Taller')).toBeTruthy();

    const deleteButtons = screen.getAllByRole('button').filter((btn) => btn.className.includes('rose-50'));
    expect(deleteButtons.length).toBe(1);
  });

  it('parts usa toggle isActive y no delete', () => {
    render(<CatalogsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Refacciones' }));
    expect(screen.getByText('Toggle')).toBeTruthy();
    const deleteButtons = screen.getAllByRole('button').filter((btn) => btn.className.includes('rose-50'));
    expect(deleteButtons.length).toBe(0);
  });
});
