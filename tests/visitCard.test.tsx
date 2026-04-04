import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { VisitCard } from '../src/features/visits/components/VisitCard';

describe('VisitCard', () => {
  it('muestra cover cuando hay attachment de imagen válido', () => {
    render(
      <MemoryRouter>
        <VisitCard
          visit={{
            id: 'v1',
            instrumentId: 'i1',
            clientId: 'c1',
            branchId: 'b1',
            workshopId: 'w1',
            folio: 'OT-1',
            isActive: true,
            status: { id: 'st1', name: 'Activa', color: '#22c55e' },
            client: { id: 'c1', fullName: 'Juan', phone: '555' },
            instrument: { id: 'i1', model: 'Jazz Bass', brand: { name: 'Fender' }, instrumentType: { name: 'Bajo' } },
            attachments: [{ id: 'a1', mimeType: 'image/jpeg', publicUrl: 'https://cdn.test/cover.jpg' }],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img')).toBeTruthy();
    expect(screen.getByText('OT-1')).toBeTruthy();
    expect(screen.getByText('Juan')).toBeTruthy();
  });

  it('muestra placeholder si no hay imagen', () => {
    render(
      <MemoryRouter>
        <VisitCard
          visit={{
            id: 'v2',
            instrumentId: 'i1',
            clientId: 'c1',
            branchId: 'b1',
            workshopId: 'w1',
            folio: 'OT-2',
            isActive: true,
            status: { id: 'st1', name: 'Activa' },
            client: { id: 'c1', fullName: 'Ana', phone: '555' },
            instrument: { id: 'i1', model: 'RG' },
            attachments: [],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sin foto')).toBeTruthy();
  });

  it('si falla la imagen, vuelve al placeholder', () => {
    render(
      <MemoryRouter>
        <VisitCard
          visit={{
            id: 'v3',
            instrumentId: 'i1',
            clientId: 'c1',
            branchId: 'b1',
            workshopId: 'w1',
            folio: 'OT-3',
            isActive: true,
            status: { id: 'st1', name: 'Activa' },
            client: { id: 'c1', fullName: 'Luis', phone: '555' },
            instrument: { id: 'i1', model: 'Tele' },
            attachments: [{ id: 'a1', mimeType: 'image/jpeg', publicUrl: 'https://cdn.test/cover.jpg' }],
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Sin foto')).toBeTruthy();
  });
});
