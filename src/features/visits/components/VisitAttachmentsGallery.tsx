import type { VisitResponse } from '@/features/visits/api/types';
import { getImageAttachments } from '@/features/visits/utils/visitAttachments';

type Props = {
  visit: VisitResponse;
  onOpen: (payload: { url: string; mimeType: string; name: string }) => void;
};

export function VisitAttachmentsGallery({ visit, onOpen }: Props) {
  const allAttachments = Array.isArray(visit.attachments) ? visit.attachments : [];
  const imageAttachments = getImageAttachments(visit);

  if (!allAttachments.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
        Esta visita no tiene attachments.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Attachments de visita ({allAttachments.length})
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {allAttachments.map((attachment) => {
          const isImage = imageAttachments.some((item) => item.id === attachment.id);
          if (isImage && attachment.publicUrl) {
            return (
              <button
                key={attachment.id}
                type="button"
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900"
                onClick={() => onOpen({ url: attachment.publicUrl || '', mimeType: attachment.mimeType || 'image/*', name: attachment.originalName || 'Imagen' })}
              >
                <img src={attachment.publicUrl} alt={attachment.originalName || 'Attachment'} className="h-24 w-full object-cover" loading="lazy" />
              </button>
            );
          }

          return (
            <div key={attachment.id} className="rounded-xl border border-slate-200 bg-white p-2">
              <p className="truncate text-xs font-medium text-slate-700">{attachment.originalName || 'Archivo'}</p>
              <p className="mt-1 text-[11px] text-slate-500">{attachment.mimeType || 'Sin tipo'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
