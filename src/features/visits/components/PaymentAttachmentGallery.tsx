import type { PaymentAttachmentView } from '@/features/visits/utils/paymentAttachments';

type PaymentAttachmentGalleryProps = {
  attachments: PaymentAttachmentView[];
  compact?: boolean;
  onOpen?: (attachment: PaymentAttachmentView) => void;
};

export function PaymentAttachmentGallery({ attachments, compact, onOpen }: PaymentAttachmentGalleryProps) {
  if (!attachments.length) {
    return <p className="text-xs text-slate-500">Sin evidencia.</p>;
  }

  return (
    <div className={compact ? 'flex gap-2 overflow-x-auto' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
      {attachments.map((attachment) => {
        if (!attachment.isAvailable || !attachment.publicUrl) {
          return (
            <div key={attachment.id} className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
              <p className="font-medium">{attachment.originalName}</p>
              <p>Archivo no disponible</p>
            </div>
          );
        }

        const isImage = attachment.mimeType?.startsWith('image/');
        const isPdf = attachment.mimeType?.includes('pdf');

        return (
          <button
            key={attachment.id}
            type="button"
            onClick={() => onOpen?.(attachment)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-left"
          >
            {isImage ? (
              <img src={attachment.publicUrl} alt={attachment.originalName} className="h-20 w-full rounded object-cover" />
            ) : (
              <div className="flex h-20 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                {isPdf ? 'PDF' : 'Archivo'}
              </div>
            )}
            <p className="mt-1 truncate text-xs font-medium text-slate-700">{attachment.originalName}</p>
            <p className="truncate text-[11px] text-slate-500">{attachment.mimeType || 'Sin mimeType'}</p>
          </button>
        );
      })}
    </div>
  );
}
