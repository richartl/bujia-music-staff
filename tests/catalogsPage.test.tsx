import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogsPage } from '../src/features/catalogs/pages/CatalogsPage';
import { authStore } from '../src/stores/auth-store';
import * as notify from '../src/lib/notify';

const createColorMutate = vi.fn(async () => ({}));
const createWorkshopUserMutate = vi.fn(async () => ({}));
const updateWorkshopUserMutate = vi.fn(async () => ({}));

const usersQueryState = {
  data: {
    items: [
      {
        id: 'u1',
        name: 'María Pérez',
        email: 'maria@bujia.com',
        role: 'STAFF',
        workshopRole: 'ADMIN',
        profileImageUrl: null,
        createdAt: '2026-04-05T12:00:00.000Z',
        updatedAt: '2026-04-05T12:00:00.000Z',
      },
    ],
    page: 1,
    limit: 20,
    total: 1,
  },
  isLoading: false,
  isError: false,
  isFetching: false,
};

vi.mock('../src/features/catalogs/hooks/useCatalogs', () => {
  const query = (data: unknown[] = []) => ({ data, isLoading: false, isError: false });
  const mutation = () => ({ mutateAsync: vi.fn(async () => ({})), isPending: false });
  return {
    useWorkshopColors: vi.fn(() =>
      query([
        { id: 'c-global', name: 'Rojo Global', slug: 'rojo', hex: '#ff0000', isActive: true, isGlobal: true, workshopId: null, updatedAt: '2026-01-01' },
        { id: 'c-local', name: 'Azul Local', slug: 'azul', hex: '#0000ff', isActive: true, isGlobal: false, workshopId: 'w1', updatedAt: '2026-01-02' },
      ]),
    ),
    useWorkshopBrands: vi.fn(() => query([])),
    useWorkshopVisitStatuses: vi.fn(() => query([])),
    useWorkshopServiceStatuses: vi.fn(() => query([])),
    useWorkshopParts: vi.fn(() => query([{ id: 'p1', name: 'Cejuela', listPrice: 10, publicPrice: 20, isActive: true, updatedAt: '2026-01-02' }])),
    useWorkshopServices: vi.fn(() => query([])),
    useTunings: vi.fn(() => query([])),
    useStringGauges: vi.fn(() => query([])),
    useAffiliates: vi.fn(() => query([])),
    useWorkshopUsers: vi.fn(() => usersQueryState),
    useCreateWorkshopColor: vi.fn(() => ({ mutateAsync: createColorMutate, isPending: false })),
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
    useCreateWorkshopUser: vi.fn(() => ({ mutateAsync: createWorkshopUserMutate, isPending: false })),
    useUpdateWorkshopUser: vi.fn(() => ({ mutateAsync: updateWorkshopUserMutate, isPending: false })),
  };
});

function renderCatalogs(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/app/catalogs" element={<CatalogsPage />} />
        <Route path="/app/catalogs/:catalogKey" element={<CatalogsPage />} />
        <Route path="/app/settings" element={<div>Ajustes</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CatalogsPage UI', () => {
  beforeEach(() => {
    authStore.setState({ workshopId: 'w1' as never });
    createColorMutate.mockClear();
    createWorkshopUserMutate.mockClear();
    updateWorkshopUserMutate.mockClear();
    usersQueryState.isLoading = false;
    usersQueryState.isError = false;
    usersQueryState.data = {
      items: [
        {
          id: 'u1',
          name: 'María Pérez',
          email: 'maria@bujia.com',
          role: 'STAFF',
          workshopRole: 'ADMIN',
          profileImageUrl: null,
          createdAt: '2026-04-05T12:00:00.000Z',
          updatedAt: '2026-04-05T12:00:00.000Z',
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    };
  });

  it('hub navega a páginas dedicadas por catálogo', () => {
    renderCatalogs('/app/catalogs');
    expect(screen.getByText('Selecciona un catálogo para abrir su pantalla dedicada.')).toBeTruthy();
    const colorsLink = screen.getByRole('link', { name: /Colores/i });
    expect(colorsLink.getAttribute('href')).toBe('/app/catalogs/colors');
  });

  it('página dedicada muestra buscador y filtra resultados', () => {
    renderCatalogs('/app/catalogs/colors');
    const search = screen.getByPlaceholderText('Buscar en Colores');
    expect(search).toBeTruthy();
    expect(screen.getByText('Rojo Global')).toBeTruthy();
    expect(screen.getByText('Azul Local')).toBeTruthy();

    fireEvent.change(search, { target: { value: 'global' } });
    expect(screen.getByText('Rojo Global')).toBeTruthy();
    expect(screen.queryByText('Azul Local')).toBeNull();
  });

  it('globales quedan en solo lectura y taller muestra acciones', () => {
    renderCatalogs('/app/catalogs/colors');
    expect(screen.getByText('Solo lectura · Registro global')).toBeTruthy();
    const actionButtons = screen.getAllByRole('button').filter((btn) => btn.className.includes('btn-secondary h-8 px-2'));
    expect(actionButtons.length).toBe(1);
  });

  it('agregar abre modal y crear usa contexto del taller', () => {
    const successSpy = vi.spyOn(notify, 'notifySuccess');
    renderCatalogs('/app/catalogs/colors');
    expect(screen.getByText('Los nuevos colores se agregan al catálogo del taller activo.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo color' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'nuevo-color' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(createColorMutate).toHaveBeenCalled();
    expect(successSpy).toHaveBeenCalled();
  });

  it('refacciones usa toggle y no delete', () => {
    renderCatalogs('/app/catalogs/parts');
    fireEvent.click(screen.getAllByRole('button').find((btn) => btn.className.includes('btn-secondary h-8 px-2'))!);
    expect(screen.getByText('Activar / desactivar')).toBeTruthy();
    expect(screen.queryByText('Eliminar')).toBeNull();
  });

  it('usuarios renderiza listado con avatar fallback y roles', () => {
    renderCatalogs('/app/catalogs/users');
    expect(screen.getByText('Usuarios del taller')).toBeTruthy();
    expect(screen.getByText('María Pérez')).toBeTruthy();
    expect(screen.getByText('maria@bujia.com')).toBeTruthy();
    expect(screen.getByText('STAFF')).toBeTruthy();
    expect(screen.getByText('ADMIN')).toBeTruthy();
    expect(screen.queryByText('Eliminar')).toBeNull();
  });

  it('usuarios create llama POST con payload exacto', async () => {
    renderCatalogs('/app/catalogs/users');

    fireEvent.click(screen.getByRole('button', { name: 'Agregar usuario' }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Luis V' } });
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'luis@bujia.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'ADMIN' } });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(createWorkshopUserMutate).toHaveBeenCalledWith({
        name: 'Luis V',
        email: 'luis@bujia.com',
        password: '12345678',
        role: 'ADMIN',
      });
    });
  });

  it('usuarios edit precarga datos y password opcional en PATCH', async () => {
    renderCatalogs('/app/catalogs/users');

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByLabelText('Nombre') as HTMLInputElement;
    expect(nameInput.value).toBe('María Pérez');

    fireEvent.change(nameInput, { target: { value: 'María P.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(updateWorkshopUserMutate).toHaveBeenCalledWith({
        userId: 'u1',
        payload: { name: 'María P.' },
      });
    });
  });

  it('usuarios soporta estados loading/empty/error', () => {
    usersQueryState.isLoading = true;
    const { container, rerender } = renderCatalogs('/app/catalogs/users');
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    usersQueryState.isLoading = false;
    usersQueryState.data = { items: [], page: 1, limit: 20, total: 0 };
    rerender(
      <MemoryRouter initialEntries={['/app/catalogs/users']}>
        <Routes>
          <Route path="/app/catalogs" element={<CatalogsPage />} />
          <Route path="/app/catalogs/:catalogKey" element={<CatalogsPage />} />
          <Route path="/app/settings" element={<div>Ajustes</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('No hay usuarios en esta página.')).toBeTruthy();

    usersQueryState.isError = true;
    rerender(
      <MemoryRouter initialEntries={['/app/catalogs/users']}>
        <Routes>
          <Route path="/app/catalogs" element={<CatalogsPage />} />
          <Route path="/app/catalogs/:catalogKey" element={<CatalogsPage />} />
          <Route path="/app/settings" element={<div>Ajustes</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('No se pudo cargar usuarios del taller.')).toBeTruthy();
  });
});
