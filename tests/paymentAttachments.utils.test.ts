import { describe, expect, it } from 'vitest';
import { getTimelinePaymentAttachments, normalizePaymentAttachments } from '../src/features/visits/utils/paymentAttachments';

describe('payment attachments helpers', () => {
  it('prioriza attachments[] cuando existen', () => {
    const items = normalizePaymentAttachments({
      id: 'p1',
      visitId: 'v1',
      workshopId: 'w1',
      amount: 100,
      attachments: [
        {
          id: 'a1',
          mediaId: 'm1',
          publicUrl: 'https://cdn/image.jpg',
          mimeType: 'image/jpeg',
          originalName: 'image.jpg',
        },
      ],
    } as never);

    expect(items).toHaveLength(1);
    expect(items[0].isAvailable).toBe(true);
    expect(items[0].publicUrl).toContain('cdn');
  });

  it('fallback cuando no hay publicUrl', () => {
    const timelineItems = getTimelinePaymentAttachments({
      eventType: 'PAYMENT_ADDED',
      payment: {
        mediaIds: ['legacy-1'],
      },
    } as never);

    expect(timelineItems[0].isAvailable).toBe(false);
  });
});
