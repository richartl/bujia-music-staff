import type { VisitResponse } from '@/features/visits/api/types';

type VisitAttachment = NonNullable<VisitResponse['attachments']>[number];

function isImageMime(mimeType?: string) {
  return typeof mimeType === 'string' && mimeType.toLowerCase().startsWith('image/');
}

function isImageByExtension(fileName?: string) {
  if (!fileName) return false;
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName);
}

export function getVisitCoverAttachment(visit: VisitResponse): VisitAttachment | null {
  const attachments = Array.isArray(visit.attachments) ? visit.attachments : [];
  const candidate = attachments.find(
    (attachment) =>
      !!attachment.publicUrl &&
      (isImageMime(attachment.mimeType) || isImageByExtension(attachment.originalName)),
  );
  return candidate || null;
}

export function getImageAttachments(visit: VisitResponse): VisitAttachment[] {
  const attachments = Array.isArray(visit.attachments) ? visit.attachments : [];
  return attachments.filter(
    (attachment) =>
      !!attachment.publicUrl &&
      (isImageMime(attachment.mimeType) || isImageByExtension(attachment.originalName)),
  );
}
