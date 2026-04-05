import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisitAttachmentsGallery } from '../src/features/visits/components/VisitAttachmentsGallery';

describe('VisitAttachmentsGallery', () => {
  it('renderiza attachments y abre preview al click', () => {
    const onOpen = vi.fn();
    render(
      <VisitAttachmentsGallery
        visit={{
          id: 'v1',
          workshopId: 'w1',
          clientId: 'c1',
          instrumentId: 'i1',
          branchId: 'b1',
          folio: 'OT-1',
          attachments: [
            { id: 'a1', mimeType: 'image/jpeg', publicUrl: 'https://cdn.test/1.jpg', originalName: 'uno.jpg' },
            { id: 'a2', mimeType: 'application/pdf', publicUrl: 'https://cdn.test/2.pdf', originalName: 'dos.pdf' },
          ],
        }}
        onOpen={onOpen}
      />, 
    );

    expect(screen.getByText('Attachments de visita (2)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalled();
  });

  it('muestra empty state si no hay attachments', () => {
    render(
      <VisitAttachmentsGallery
        visit={{
          id: 'v1',
          workshopId: 'w1',
          clientId: 'c1',
          instrumentId: 'i1',
          branchId: 'b1',
          folio: 'OT-1',
          attachments: [],
        }}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('Esta visita no tiene attachments.')).toBeTruthy();
  });
});
