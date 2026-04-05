import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { VisitCard } from '../src/features/visits/components/VisitCard';

describe('VisitCard', () => {
  it('con main image válida muestra foto', () => {
    render(
      <MemoryRouter>
        <VisitCard
          visit={{
            id: 'v1', instrumentId: 'i1', clientId: 'c1', branchId: 'b1', workshopId: 'w1', folio: 'OT-1',
            isActive: true,
            status: { id: 'st1', name: 'Activa', color: '#22c55e' },
            client: { id: 'c1', fullName: 'Juan', phone: '555' },
            instrument: { id: 'i1', model: 'Jazz Bass', brand: { name: 'Fender' }, instrumentType: { name: 'Bajo' } },
            attachments: [{ id: 'a1', isMainAttachment: true, mimeType: 'image/jpeg', publicUrl: 'https://cdn.test/cover.jpg' }],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('sin main image válida no muestra sección de foto', () => {
    render(
      <MemoryRouter>
        <VisitCard
          visit={{
            id: 'v2', instrumentId: 'i1', clientId: 'c1', branchId: 'b1', workshopId: 'w1', folio: 'OT-2',
            isActive: true,
            status: { id: 'st1', name: 'Activa' },
            client: { id: 'c1', fullName: 'Ana', phone: '555' },
            instrument: { id: 'i1', model: 'RG' },
            attachments: [{ id: 'a1', mimeType: 'image/jpeg', publicUrl: 'https://x/image.jpg' }],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('img')).toBeNull();
  });

  it('main attachment no imagen no muestra foto', () => {
    render(
      <MemoryRouter>
        <VisitCard
          visit={{
            id: 'v3', instrumentId: 'i1', clientId: 'c1', branchId: 'b1', workshopId: 'w1', folio: 'OT-3',
            isActive: true,
            status: { id: 'st1', name: 'Activa' },
            client: { id: 'c1', fullName: 'Luis', phone: '555' },
            instrument: { id: 'i1', model: 'Tele' },
            attachments: [{ id: 'a1', isMainAttachment: true, mimeType: 'video/mp4', publicUrl: 'https://cdn.test/video.mp4' }],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('img')).toBeNull();
  });

  it('si falla la imagen, vuelve a layout sin foto', () => {
    render(
      <MemoryRouter>
        <VisitCard
          visit={{
            id: 'v4', instrumentId: 'i1', clientId: 'c1', branchId: 'b1', workshopId: 'w1', folio: 'OT-4',
            isActive: true,
            status: { id: 'st1', name: 'Activa' },
            client: { id: 'c1', fullName: 'Luis', phone: '555' },
            instrument: { id: 'i1', model: 'Tele' },
            attachments: [{ id: 'a1', isMainAttachment: true, mimeType: 'image/jpeg', publicUrl: 'https://cdn.test/cover.jpg' }],
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
  });
});
