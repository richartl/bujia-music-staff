import { describe, expect, it } from 'vitest';
import { getVisitCoverAttachment } from '../src/features/visits/utils/visitAttachments';

describe('getVisitCoverAttachment', () => {
  it('usa la primera imagen válida', () => {
    const attachment = getVisitCoverAttachment({
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
    const attachment = getVisitCoverAttachment({
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
    const attachment = getVisitCoverAttachment({
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
});
