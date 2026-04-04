import { describe, expect, it } from 'vitest';
import { getVisitCoverImage } from '../src/features/visits/utils/visitAttachments';

describe('getVisitCoverImage', () => {
  it('usa la primera imagen válida', () => {
    const attachment = getVisitCoverImage({
      id: 'v1',
      workshopId: 'w1',
      clientId: 'c1',
      instrumentId: 'i1',
      branchId: 'b1',
      folio: 'OT-1',
      attachments: [
        { id: 'a1', mimeType: 'application/pdf', publicUrl: 'https://x/pdf' },
        { id: 'a2', mimeType: 'image/jpeg', publicUrl: 'https://x/jpg' },
      ],
    } as never);

    expect(attachment?.id).toBe('a2');
  });

  it('ignora attachments sin publicUrl', () => {
    const attachment = getVisitCoverImage({
      id: 'v1',
      workshopId: 'w1',
      clientId: 'c1',
      instrumentId: 'i1',
      branchId: 'b1',
      folio: 'OT-1',
      attachments: [{ id: 'a1', mimeType: 'image/jpeg' }],
    } as never);

    expect(attachment).toBeNull();
  });

  it('regresa null sin imagen válida', () => {
    const attachment = getVisitCoverImage({
      id: 'v1',
      workshopId: 'w1',
      clientId: 'c1',
      instrumentId: 'i1',
      branchId: 'b1',
      folio: 'OT-1',
      attachments: [{ id: 'a1', mimeType: 'application/pdf', publicUrl: 'https://x/pdf' }],
    } as never);

    expect(attachment).toBeNull();
  });

  it('regresa el primer attachment válido en mezcla de inválidos/válidos', () => {
    const attachment = getVisitCoverImage({
      id: 'v1',
      workshopId: 'w1',
      clientId: 'c1',
      instrumentId: 'i1',
      branchId: 'b1',
      folio: 'OT-1',
      attachments: [
        { id: 'a1', mimeType: 'image/jpeg', publicUrl: '' },
        { id: 'a2', mimeType: 'application/pdf', publicUrl: 'https://x/pdf' },
        { id: 'a3', mimeType: 'image/png', publicUrl: 'https://x/image.png' },
      ],
    } as never);

    expect(attachment?.id).toBe('a3');
  });
});
