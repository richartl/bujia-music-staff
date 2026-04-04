import { FileText, ImageIcon } from 'lucide-react';
import type { PaymentAttachmentView } from '@/features/visits/utils/paymentAttachments';

type PaymentAttachmentGalleryProps = {
  attachments: PaymentAttachmentView[];
  compact?: boolean;
  onOpen?: (attachment: PaymentAttachmentView) => void;
};

export function PaymentAttachmentGallery({ attachments, compact, onOpen }: PaymentAttachmentGalleryProps) {
  if (!attachments.length) {
    return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-xs text-slate-600">Sin evidencia adjunta.</p>;
  }

  return (
    <div className={compact ? 'flex gap-2 overflow-x-auto pb-1' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
      {attachments.map((attachment) => {
        if (!attachment.isAvailable || !attachment.publicUrl) {
          return (
            <div key={attachment.id} className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              <p className="font-medium">{attachment.originalName}</p>
              <p>Archivo no disponible temporalmente</p>
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
            className="rounded-lg border border-slate-300 bg-white p-2 text-left transition hover:border-slate-400 hover:shadow-sm"
          >
            {isImage ? (
              <img src={attachment.publicUrl} alt={attachment.originalName} className="h-20 w-full rounded object-cover" />
            ) : (
              <div className="flex h-20 items-center justify-center gap-2 rounded bg-slate-100 text-xs text-slate-700">
                {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                {isPdf ? 'Documento PDF' : 'Archivo adjunto'}
              </div>
            )}
            <p className="mt-1 truncate text-xs font-semibold text-slate-800">{attachment.originalName}</p>
            <p className="truncate text-[11px] text-slate-600">Toca para abrir</p>
          </button>
        );
      })}
    </div>
  );
}
