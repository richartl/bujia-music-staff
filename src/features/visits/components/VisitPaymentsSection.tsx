import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import type { LookupOption } from '@/features/intakes/types';
import {
  useCreateVisitPayment,
  useDeleteVisitPayment,
  useUpdateVisitPayment,
  useVisitPayment,
  useVisitPayments,
} from '@/features/visits/hooks/useVisitPayments';
import { VisitPaymentSheet } from '@/features/visits/components/VisitPaymentSheet';
import { PaymentAttachmentGallery } from '@/features/visits/components/PaymentAttachmentGallery';
import { PaymentsSummaryCard } from '@/features/visits/components/PaymentsSummaryCard';
import { PaymentsTable } from '@/features/visits/components/PaymentsTable';
import type { VisitPayment } from '@/features/visits/api/visitPaymentsApi';
import { getFriendlyPaymentError } from '@/features/visits/utils/visitPayments';
import { normalizePaymentAttachments } from '@/features/visits/utils/paymentAttachments';

type VisitPaymentsSectionProps = {
  visitId: string;
  paymentMethods: LookupOption[];
  fallbackVisitTotal: number;
};

export function VisitPaymentsSection({ visitId, paymentMethods, fallbackVisitTotal }: VisitPaymentsSectionProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<VisitPayment | null>(null);
  const [detailPaymentId, setDetailPaymentId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VisitPayment | null>(null);
  const [preview, setPreview] = useState<{ url: string; mimeType: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState('');

  const paymentsQuery = useVisitPayments(visitId);
  const detailPaymentQuery = useVisitPayment(visitId, detailPaymentId);
  const createPaymentMutation = useCreateVisitPayment(visitId);
  const updatePaymentMutation = useUpdateVisitPayment(visitId, editingPayment?.id || '');
  const deletePaymentMutation = useDeleteVisitPayment(visitId, deleteTarget?.id || '');

  const sortedPayments = useMemo(() => {
    const items = paymentsQuery.data?.items || [];
    return items
      .slice()
      .sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime());
  }, [paymentsQuery.data?.items]);

  const summary = {
    totalPaid: paymentsQuery.data?.totalPaid || 0,
    visitTotal: paymentsQuery.data?.visitTotal ?? fallbackVisitTotal,
    pendingAmount: paymentsQuery.data?.pendingAmount ?? Math.max(0, fallbackVisitTotal - (paymentsQuery.data?.totalPaid || 0)),
  };

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deletePaymentMutation.mutateAsync();
      setToastError('');
      setToastMessage('Abono eliminado.');
      setDeleteTarget(null);
    } catch (error) {
      setToastError(getFriendlyPaymentError(error));
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <PaymentsSummaryCard
        totalPaid={summary.totalPaid}
        visitTotal={summary.visitTotal}
        pendingAmount={summary.pendingAmount}
      />

      <button
        type="button"
        className="btn-primary h-11 w-full justify-center gap-2"
        onClick={() => {
          setEditingPayment(null);
          setIsSheetOpen(true);
        }}
      >
        <PlusCircle className="h-4 w-4" />
        Registrar abono
      </button>

      {paymentsQuery.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : paymentsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudieron cargar los abonos. Intenta recargar la visita.
        </div>
      ) : !sortedPayments.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Aún no hay abonos registrados para esta visita.
        </div>
      ) : (
        <PaymentsTable
          payments={sortedPayments}
          paymentMethods={paymentMethods}
          onOpenDetail={(payment) => setDetailPaymentId(payment.id)}
          onEdit={(payment) => {
            setEditingPayment(payment);
            setIsSheetOpen(true);
          }}
          onDelete={setDeleteTarget}
          onOpenAttachment={(item) => setPreview(item)}
        />
      )}

      {toastMessage ? <p className="text-xs text-emerald-700">{toastMessage}</p> : null}
      {toastError ? <p className="text-xs text-red-700">{toastError}</p> : null}

      <VisitPaymentSheet
        open={isSheetOpen}
        visitId={visitId}
        paymentMethods={paymentMethods}
        editingPayment={editingPayment}
        isSaving={createPaymentMutation.isPending || updatePaymentMutation.isPending}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingPayment(null);
        }}
        onSubmit={async (payload) => {
          if (editingPayment) {
            await updatePaymentMutation.mutateAsync(payload);
            setToastError('');
            setToastMessage('Abono actualizado.');
            setEditingPayment(null);
            return;
          }

          await createPaymentMutation.mutateAsync(payload);
          setToastError('');
          setToastMessage('Abono registrado.');
        }}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-[75] flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4 sm:mx-auto sm:max-w-md">
            <h4 className="text-sm font-semibold text-slate-900">Eliminar abono</h4>
            <p className="mt-1 text-sm text-slate-600">Esta acción quitará el registro del historial de pagos.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary h-10 justify-center" onClick={() => void handleDelete()} disabled={deletePaymentMutation.isPending}>
                {deletePaymentMutation.isPending ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailPaymentId ? (
        <div className="fixed inset-0 z-[76] flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4 sm:mx-auto sm:max-w-lg">
            <h4 className="text-sm font-semibold text-slate-900">Detalle de abono</h4>
            {detailPaymentQuery.isLoading ? (
              <p className="mt-2 text-sm text-slate-500">Cargando detalle...</p>
            ) : detailPaymentQuery.data ? (
              <div className="mt-2 space-y-2">
                <PaymentAttachmentGallery
                  attachments={normalizePaymentAttachments(detailPaymentQuery.data)}
                  onOpen={(item) => {
                    if (!item.publicUrl) return;
                    setPreview({ url: item.publicUrl, mimeType: item.mimeType || '', name: item.originalName });
                  }}
                />
              </div>
            ) : null}
            <button type="button" className="btn-secondary mt-3 h-10 w-full justify-center" onClick={() => setDetailPaymentId('')}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-3">
            <p className="truncate text-sm font-medium text-slate-800">{preview.name}</p>
            <div className="mt-2">
              {preview.mimeType.startsWith('image/') ? (
                <img src={preview.url} alt={preview.name} className="max-h-[70vh] w-full rounded object-contain" />
              ) : preview.mimeType.includes('pdf') ? (
                <a href={preview.url} target="_blank" rel="noreferrer" className="text-sky-700">Abrir PDF</a>
              ) : (
                <a href={preview.url} target="_blank" rel="noreferrer" className="text-sky-700">Abrir archivo</a>
              )}
            </div>
            <button type="button" className="btn-secondary mt-3 h-10 w-full justify-center" onClick={() => setPreview(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
