import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CatalogEntitySection } from '../src/features/catalogs/components/CatalogEntitySection';

const baseProps = {
  title: 'Colores',
  description: 'desc',
  fields: [
    { name: 'name', label: 'Nombre', type: 'text' as const },
  ],
  getItemTitle: (item: { id: string; name: string }) => item.name,
  toFormValues: (item?: { name: string } | null) => ({ name: item?.name || '' }),
  onCreate: vi.fn(async () => ({})),
  onUpdate: vi.fn(async () => ({})),
};

describe('CatalogEntitySection', () => {
  it('renderiza loading, empty y error states', () => {
    const { rerender } = render(
      <CatalogEntitySection
        {...baseProps}
        items={[]}
        isLoading
        isError={false}
        emptyMessage="Sin datos"
      />,
    );
    expect(document.querySelector('.animate-pulse')).toBeTruthy();

    rerender(
      <CatalogEntitySection
        {...baseProps}
        items={[]}
        isLoading={false}
        isError={false}
        emptyMessage="Sin datos"
      />,
    );
    expect(screen.getByText('Sin datos')).toBeTruthy();

    rerender(
      <CatalogEntitySection
        {...baseProps}
        items={[]}
        isLoading={false}
        isError
        emptyMessage="Sin datos"
      />,
    );
    expect(screen.getByText('No se pudo cargar el catálogo.')).toBeTruthy();
  });

  it('agregar abre modal y editar precarga valores', () => {
    render(
      <CatalogEntitySection
        {...baseProps}
        items={[{ id: '1', name: 'Rojo' }]}
        isLoading={false}
        isError={false}
        emptyMessage="Sin datos"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByText('Agregar Colores')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    fireEvent.click(screen.getAllByRole('button').find((btn) => btn.className.includes('btn-secondary h-8 px-2'))!);
    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByDisplayValue('Rojo')).toBeTruthy();
  });

  it('si item es solo lectura no muestra botón de acciones', () => {
    render(
      <CatalogEntitySection
        {...baseProps}
        items={[{ id: '1', name: 'Global Rojo' }]}
        isLoading={false}
        isError={false}
        emptyMessage="Sin datos"
        getReadonlyReason={() => 'Registro global'}
      />,
    );

    expect(screen.getByText('Solo lectura · Registro global')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });
});
