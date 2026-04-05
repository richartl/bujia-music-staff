import { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useIntakeMediaUpload } from '@/features/intakes/hooks/useIntakeMediaUpload';
import type { LookupOption } from '@/features/intakes/types';
import type { VisitPayment } from '@/features/visits/api/visitPaymentsApi';
import { PaymentAttachmentGallery } from '@/features/visits/components/PaymentAttachmentGallery';
import { EvidenceUploader } from '@/features/visits/components/EvidenceUploader';
import { normalizePaymentAttachments } from '@/features/visits/utils/paymentAttachments';
import {
  getFriendlyPaymentError,
  normalizePaymentPayload,
  toDatetimeLocalValue,
  validateVisitPaymentForm,
  type VisitPaymentFormValues,
} from '@/features/visits/utils/visitPayments';

type VisitPaymentSheetProps = {
  open: boolean;
  visitId: string;
  paymentMethods: LookupOption[];
  editingPayment?: VisitPayment | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: ReturnType<typeof normalizePaymentPayload> & { mediaIds?: string[] }) => Promise<void>;
};

const MAX_EVIDENCE_FILES = 4;

const EMPTY_FORM: VisitPaymentFormValues = {
  amount: '',
  paymentMethodId: '',
  method: '',
  paidAt: toDatetimeLocalValue(new Date().toISOString()),
  notes: '',
};

export function VisitPaymentSheet({
  open,
  visitId,
  paymentMethods,
  editingPayment,
  isSaving,
  onClose,
  onSubmit,
}: VisitPaymentSheetProps) {
  const [formValues, setFormValues] = useState<VisitPaymentFormValues>(EMPTY_FORM);
  const [keptExistingMediaIds, setKeptExistingMediaIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const isEditMode = !!editingPayment;
  const normalizedExistingAttachments = useMemo(
    () => (editingPayment ? normalizePaymentAttachments(editingPayment) : []),
    [editingPayment],
  );

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

  useEffect(() => {
    if (!open) return;
    const initialValues = editingPayment
      ? {
          amount: String(editingPayment.amount || ''),
          paymentMethodId: editingPayment.paymentMethodId || '',
          method: editingPayment.paymentMethodId ? '' : editingPayment.method || '',
          paidAt: toDatetimeLocalValue(editingPayment.paidAt),
          notes: editingPayment.notes || '',
        }
      : EMPTY_FORM;

    setFormValues(initialValues);
    setKeptExistingMediaIds(editingPayment?.attachments?.map((item) => item.mediaId).filter(Boolean) || []);
    setError('');
    setToast('');
  }, [editingPayment, open]);

  if (!open) return null;

  const currentMediaIds = Array.from(new Set([...keptExistingMediaIds, ...uploadedMediaIds]));

  async function handleSubmit() {
    const validationError = validateVisitPaymentForm(formValues, {
      mode: isEditMode ? 'update' : 'create',
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    try {
      await onSubmit({
        ...normalizePaymentPayload(formValues),
        mediaIds: currentMediaIds.length ? currentMediaIds : [],
      });
      onClose();
    } catch (submitError) {
      setError(getFriendlyPaymentError(submitError));
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-slate-900">{isEditMode ? 'Editar abono' : 'Registrar abono'}</h4>
          <button type="button" className="rounded-full p-2 text-slate-500" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <input
            className="input h-12 text-base"
            inputMode="decimal"
            placeholder="Monto"
            value={formValues.amount}
            onChange={(event) => setFormValues((current) => ({ ...current, amount: event.target.value }))}
          />

          <select
            className="input h-12"
            value={formValues.paymentMethodId}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                paymentMethodId: event.target.value,
                method: event.target.value ? '' : current.method,
              }))
            }
          >
            <option value="">Método de catálogo</option>
            {paymentMethods.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {!formValues.paymentMethodId ? (
            <input
              className="input h-12"
              placeholder="Método manual (ej. Transferencia)"
              value={formValues.method}
              onChange={(event) => setFormValues((current) => ({ ...current, method: event.target.value }))}
            />
          ) : null}

          <input
            className="input h-12"
            type="datetime-local"
            value={formValues.paidAt}
            onChange={(event) => setFormValues((current) => ({ ...current, paidAt: event.target.value }))}
          />

          <textarea
            className="input min-h-20"
            placeholder="Notas (opcional)"
            value={formValues.notes}
            onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">Evidencia (opcional)</p>
            <p className="text-xs text-slate-500">Máx. {MAX_EVIDENCE_FILES}</p>
          </div>
          {isEditMode ? (
            <p className="mt-1 text-xs text-amber-700">Al guardar, mediaIds reemplaza las evidencias actuales del backend.</p>
          ) : null}

          {!!keptExistingMediaIds.length ? (
            <div className="mt-2 space-y-2">
              <PaymentAttachmentGallery
                attachments={normalizedExistingAttachments.filter((item) =>
                  item.mediaId ? keptExistingMediaIds.includes(item.mediaId) : false,
                )}
              />
              {keptExistingMediaIds.map((mediaId) => (
                <button
                  key={mediaId}
                  type="button"
                  className="btn-secondary h-8 w-full justify-center gap-1 text-xs"
                  onClick={() => setKeptExistingMediaIds((current) => current.filter((item) => item !== mediaId))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar evidencia {mediaId.slice(0, 8)}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Sin evidencia seleccionada.</p>
          )}

          <EvidenceUploader
            items={items.map((item) => ({
              id: item.localId,
              file: item.file,
              status: item.status,
              errorMessage: item.errorMessage,
            }))}
            maxFiles={MAX_EVIDENCE_FILES}
            existingCount={keptExistingMediaIds.length}
            onAddFiles={(files) => addFiles(files)}
            onRetry={retryFile}
            onRemove={removeFile}
          />
        </div>

        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        {toast ? <p className="mt-1 text-xs text-amber-700">{toast}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary h-11 justify-center" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary h-11 justify-center"
            onClick={() => void handleSubmit()}
            disabled={isSaving || hasBlockingUploads}
          >
            {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Guardar abono'}
          </button>
        </div>
      </div>
    </div>
  );
}
