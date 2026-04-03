import type { NoteAttachment, VisitTimelineEvent } from '@/features/visits/api/types';
import type { VisitPayment, VisitPaymentAttachment } from '@/features/visits/api/visitPaymentsApi';

export type PaymentAttachmentView = {
  id: string;
  mediaId?: string;
  publicUrl?: string;
  mimeType?: string;
  originalName: string;
  isAvailable: boolean;
};

export function normalizePaymentAttachments(payment: VisitPayment) {
  const attachments = payment.attachments || [];
  if (attachments.length) {
    return attachments.map(mapAttachment);
  }

  const legacyMediaIds = extractMediaIdsFromLegacy(payment.notes || '');
  return legacyMediaIds.map((mediaId, index) => ({
    id: `legacy-${mediaId}-${index}`,
    mediaId,
    originalName: `Archivo ${index + 1}`,
    isAvailable: false,
  } satisfies PaymentAttachmentView));
}

export function getTimelinePaymentAttachments(
  event: Pick<VisitTimelineEvent, 'payment' | 'metadata'> & { eventType?: string; type?: string },
) {
  const fromPayment = Array.isArray(event.payment?.attachments) ? event.payment?.attachments : [];
  if (fromPayment.length) {
    return fromPayment.map((attachment, index) =>
      mapAttachment({
        id: attachment.id || `timeline-${index}`,
        mediaId: attachment.mediaId || attachment.id || '',
        publicUrl: attachment.publicUrl || attachment.url || null,
        mimeType: attachment.mimeType || null,
        originalName: attachment.originalName || `Archivo ${index + 1}`,
      }),
    );
  }

  const mediaIds = Array.isArray(event.payment?.mediaIds)
    ? event.payment?.mediaIds || []
    : extractMediaIdsFromLegacy(String((event.metadata as Record<string, unknown>)?.notes || ''));

  return mediaIds.map((mediaId, index) => ({
    id: `timeline-legacy-${mediaId}-${index}`,
    mediaId,
    originalName: `Archivo ${index + 1}`,
    isAvailable: false,
  } satisfies PaymentAttachmentView));
}

function mapAttachment(attachment: VisitPaymentAttachment | NoteAttachment): PaymentAttachmentView {
  const publicUrl = attachment.publicUrl || ('url' in attachment ? attachment.url : undefined) || undefined;

  return {
    id: attachment.id,
    mediaId: attachment.mediaId,
    publicUrl,
    mimeType: attachment.mimeType || undefined,
    originalName: attachment.originalName || 'Archivo',
    isAvailable: !!publicUrl,
  };
}

function extractMediaIdsFromLegacy(notes?: string) {
  const match = String(notes || '').match(/\[evidence_media_ids:\s*([^\]]+)\]/i);
  if (!match?.[1]) return [];

  return match[1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}
