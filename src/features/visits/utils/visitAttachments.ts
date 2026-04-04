import type { VisitResponse } from '@/features/visits/api/types';

type VisitAttachment = NonNullable<VisitResponse['attachments']>[number];

function isImageMime(mimeType?: string) {
  return typeof mimeType === 'string' && mimeType.toLowerCase().startsWith('image/');
}

function isImageByExtension(fileName?: string) {
  if (!fileName) return false;
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName);
}

function hasValidPublicUrl(publicUrl?: string) {
  return typeof publicUrl === 'string' && publicUrl.trim().length > 0;
}

export function getVisitCoverImage(visit: VisitResponse): VisitAttachment | null {
  const attachments = Array.isArray(visit.attachments) ? visit.attachments : [];
  const candidate = attachments.find(
    (attachment) =>
      hasValidPublicUrl(attachment.publicUrl) &&
      (isImageMime(attachment.mimeType) || isImageByExtension(attachment.originalName)),
  );
  return candidate || null;
}

export const getVisitCoverAttachment = getVisitCoverImage;

export function getImageAttachments(visit: VisitResponse): VisitAttachment[] {
  const attachments = Array.isArray(visit.attachments) ? visit.attachments : [];
  return attachments.filter(
    (attachment) =>
      hasValidPublicUrl(attachment.publicUrl) &&
      (isImageMime(attachment.mimeType) || isImageByExtension(attachment.originalName)),
  );
}
