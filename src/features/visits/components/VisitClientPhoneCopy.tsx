import { Copy } from 'lucide-react';
import { copyTextToClipboard } from '@/lib/clipboard';
import { notifyError, notifySuccess } from '@/lib/notify';

type VisitClientPhoneCopyProps = {
  clientName?: string | null;
  phone?: string | null;
};

export function VisitClientPhoneCopy({ clientName, phone }: VisitClientPhoneCopyProps) {
  const handleCopyPhone = async () => {
    if (!phone) return;

    try {
      await copyTextToClipboard(phone);
      notifySuccess('Teléfono copiado al portapapeles');
    } catch {
      notifyError('No se pudo copiar el teléfono');
    }
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-500">
      <p className="truncate">{clientName || 'Cliente'} ·</p>
      {phone ? (
        <button
          type="button"
          onClick={handleCopyPhone}
          className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 py-1 font-medium text-sky-700 underline underline-offset-2 transition hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 active:scale-[0.99]"
          aria-label={`Copiar teléfono ${phone}`}
        >
          <span>{phone}</span>
          <Copy className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : (
        <span>Sin teléfono</span>
      )}
    </div>
  );
}
