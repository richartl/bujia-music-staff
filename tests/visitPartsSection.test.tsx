import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisitPartsSection } from '../src/features/visits/components/VisitPartsSection';

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('../src/features/visits/hooks/useVisitParts', () => ({
  useVisitParts: vi.fn(() => ({ isLoading: false, isError: false, data: [{ id: 'vp1', visitId: 'v1', name: 'Cejuela', quantity: 1, unitPrice: 100, subtotal: 100 }] })),
  useWorkshopParts: vi.fn(() => ({ data: [{ id: 'p1', name: 'Cejuela', publicPrice: 100 }] })),
  useCreateVisitPart: vi.fn(() => ({ mutateAsync: mockCreateMutate, isPending: false })),
  useUpdateVisitPart: vi.fn(() => ({ mutateAsync: mockUpdateMutate, isPending: false })),
  useDeleteVisitPart: vi.fn(() => ({ mutateAsync: mockDeleteMutate })),
}));

describe('VisitPartsSection', () => {
  it('permite agregar, editar y eliminar', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <VisitPartsSection
          visitId="v1"
          workshopId="w1"
          services={[{ id: 's1', name: 'Setup completo' }]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText('Agregar'));
    fireEvent.change(screen.getByPlaceholderText('Nombre manual'), { target: { value: 'Tornillo' } });
    fireEvent.change(screen.getByPlaceholderText('Cantidad'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Precio unitario'), { target: { value: '25' } });
    fireEvent.click(screen.getByText('Guardar'));

    expect(mockCreateMutate).toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button')[2]);
    fireEvent.click(screen.getByText('Guardar'));
    expect(mockUpdateMutate).toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(mockDeleteMutate).toHaveBeenCalled();
  });
});
