import { describe, expect, it } from 'vitest';
import { getVisitMainImageAttachment } from '../src/features/visits/utils/visitAttachments';

describe('getVisitMainImageAttachment', () => {
  it('sin attachments regresa null', () => {
    const attachment = getVisitMainImageAttachment({
      id: 'v1', workshopId: 'w1', clientId: 'c1', instrumentId: 'i1', branchId: 'b1', folio: 'OT-1',
    } as never);
    expect(attachment).toBeNull();
  });

  it('sin main regresa null', () => {
    const attachment = getVisitMainImageAttachment({
      id: 'v1', workshopId: 'w1', clientId: 'c1', instrumentId: 'i1', branchId: 'b1', folio: 'OT-1',
      attachments: [{ id: 'a1', mimeType: 'image/jpeg', publicUrl: 'https://x/jpg' }],
    } as never);
    expect(attachment).toBeNull();
  });

  it('main con publicUrl null regresa null', () => {
    const attachment = getVisitMainImageAttachment({
      id: 'v1', workshopId: 'w1', clientId: 'c1', instrumentId: 'i1', branchId: 'b1', folio: 'OT-1',
      attachments: [{ id: 'a1', isMainAttachment: true, mimeType: 'image/jpeg', publicUrl: undefined }],
    } as never);
    expect(attachment).toBeNull();
  });

  it('main no imagen regresa null', () => {
    const attachment = getVisitMainImageAttachment({
      id: 'v1', workshopId: 'w1', clientId: 'c1', instrumentId: 'i1', branchId: 'b1', folio: 'OT-1',
      attachments: [{ id: 'a1', isMainAttachment: true, mimeType: 'video/mp4', publicUrl: 'https://x/mp4' }],
    } as never);
    expect(attachment).toBeNull();
  });

  it('main imagen válida regresa attachment', () => {
    const attachment = getVisitMainImageAttachment({
      id: 'v1', workshopId: 'w1', clientId: 'c1', instrumentId: 'i1', branchId: 'b1', folio: 'OT-1',
      attachments: [{ id: 'a1', isMainAttachment: true, mimeType: 'image/jpeg', publicUrl: 'https://x/jpg' }],
    } as never);
    expect(attachment?.id).toBe('a1');
  });

  it('múltiples main legacy toma el primero válido', () => {
    const attachment = getVisitMainImageAttachment({
      id: 'v1', workshopId: 'w1', clientId: 'c1', instrumentId: 'i1', branchId: 'b1', folio: 'OT-1',
      attachments: [
        { id: 'a1', isMainAttachment: true, mimeType: 'image/png', publicUrl: 'https://x/1.png' },
        { id: 'a2', isMainAttachment: true, mimeType: 'image/jpeg', publicUrl: 'https://x/2.jpg' },
      ],
    } as never);
    expect(attachment?.id).toBe('a1');
  });
});
