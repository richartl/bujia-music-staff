import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useIntakeMediaUpload } from '@/features/intakes/hooks/useIntakeMediaUpload';
import type { LookupOption } from '@/features/intakes/types';
import type { IntakePaymentForm } from '@/features/visits/utils/paymentEvidence';

type AddPaymentSheetProps = {
  open: boolean;
  paymentMethods: LookupOption[];
  visitId: string;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: IntakePaymentForm, evidenceMediaIds: string[]) => Promise<void>;
};

const MAX_EVIDENCE_FILES = 3;

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AddPaymentSheet({
  open,
  paymentMethods,
  visitId,
  isSaving,
  onClose,
  onSubmit,
}: AddPaymentSheetProps) {
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [customMethod, setCustomMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAt, setPaidAt] = useState(toDatetimeLocalValue(new Date()));
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    items,
    addFiles,
    hasBlockingUploads,
    removeFile,
    retryFile,
    uploadedMediaIds,
  } = useIntakeMediaUpload({
    scope: `visit:${visitId}/payment-evidence`,
    onFileError: (item) => setToast(`${item.file.name}: ${item.errorMessage || 'Error al subir archivo.'}`),
  });

  const previewMap = useMemo(() => {
    const entries = items
      .filter((item) => item.file.type.startsWith('image/'))
      .map((item) => [item.localId, URL.createObjectURL(item.file)] as const);
    return new Map(entries);
  }, [items]);

  useEffect(() => () => previewMap.forEach((url) => URL.revokeObjectURL(url)), [previewMap]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setToast('');
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Captura un monto mayor a 0.');
      return;
    }
    if (!paymentMethodId && !customMethod.trim()) {
      setError('Selecciona un método de pago o captura uno manual.');
      return;
    }
    setError('');

    await onSubmit(
      {
        amount: numericAmount,
        paymentMethodId: paymentMethodId || undefined,
        method: customMethod.trim() || undefined,
        notes: notes.trim() || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
      },
      uploadedMediaIds,
    );

    setPaymentMethodId('');
    setCustomMethod('');
    setAmount('');
    setNotes('');
    setPaidAt(toDatetimeLocalValue(new Date()));
    onClose();
  }

  const slotsLeft = Math.max(0, MAX_EVIDENCE_FILES - items.length);

  return (
    <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-y-auto rounded-t-3xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <h4 className="text-base font-semibold text-slate-900">Agregar abono</h4>

        <div className="mt-3 space-y-2">
          <input
            className="input h-12 text-base"
            inputMode="decimal"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select className="input h-12" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
            <option value="">Método de pago</option>
            {paymentMethods.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          {!paymentMethodId ? (
            <input
              className="input h-11"
              placeholder="Método manual (opcional)"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.target.value)}
            />
          ) : null}
          <input className="input h-11" type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          <textarea className="input min-h-20" placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">Evidencia (opcional)</p>
            <p className="text-xs text-slate-500">Máx. {MAX_EVIDENCE_FILES}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []).slice(0, slotsLeft);
              if (files.length) addFiles(files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn-secondary mt-2 h-10 w-full justify-center"
            onClick={() => inputRef.current?.click()}
            disabled={!slotsLeft}
          >
            Adjuntar foto/captura
          </button>
          {!!items.length ? (
            <div className="mt-2 space-y-2">
              {items.map((item) => (
                <div key={item.localId} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center gap-2">
                    {previewMap.get(item.localId) ? (
                      <img src={previewMap.get(item.localId)} alt={item.file.name} className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-slate-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-700">{item.file.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.status === 'done' ? 'Listo' : item.status === 'error' ? 'Error' : 'Subiendo...'}
                      </p>
                    </div>
                    {item.status === 'error' ? (
                      <button type="button" className="rounded p-1 text-slate-500" onClick={() => retryFile(item.localId)}>
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button type="button" className="rounded p-1 text-slate-500" onClick={() => removeFile(item.localId)}>
                      {item.status === 'uploading' || item.status === 'completing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        {toast ? <p className="mt-1 text-xs text-amber-700">{toast}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary h-11 justify-center" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary h-11 justify-center" onClick={() => void handleSubmit()} disabled={!!isSaving || hasBlockingUploads}>
            {isSaving ? 'Guardando...' : 'Guardar abono'}
          </button>
        </div>
      </div>
    </div>
  );
}
