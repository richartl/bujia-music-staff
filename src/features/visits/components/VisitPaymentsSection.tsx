import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PencilLine, PlusCircle, ReceiptText, Trash2 } from 'lucide-react';
import { currency, dateTime } from '@/lib/utils';
import { filesApi } from '@/features/intakes/api/filesApi';
import type { LookupOption } from '@/features/intakes/types';
import {
  useCreateVisitPayment,
  useDeleteVisitPayment,
  useUpdateVisitPayment,
  useVisitPayments,
} from '@/features/visits/hooks/useVisitPayments';
import { VisitPaymentSheet } from '@/features/visits/components/VisitPaymentSheet';
import type { VisitPayment } from '@/features/visits/api/visitPaymentsApi';
import { getFriendlyPaymentError } from '@/features/visits/utils/visitPayments';

type VisitPaymentsSectionProps = {
  visitId: string;
  paymentMethods: LookupOption[];
  fallbackVisitTotal: number;
};

export function VisitPaymentsSection({ visitId, paymentMethods, fallbackVisitTotal }: VisitPaymentsSectionProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<VisitPayment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisitPayment | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState('');

  const paymentsQuery = useVisitPayments(visitId);
  const createPaymentMutation = useCreateVisitPayment(visitId);
  const updatePaymentMutation = useUpdateVisitPayment(visitId, editingPayment?.id || '');
  const deletePaymentMutation = useDeleteVisitPayment(visitId, deleteTarget?.id || '');

  const sortedPayments = useMemo(() => {
    const items = paymentsQuery.data?.items || [];
    return items
      .slice()
      .sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime());
  }, [paymentsQuery.data?.items]);

  const mediaIds = useMemo(
    () => Array.from(new Set(sortedPayments.flatMap((payment) => payment.attachments.map((attachment) => attachment.mediaId)).filter(Boolean))),
    [sortedPayments],
  );

  const evidenceQuery = useQuery({
    queryKey: ['visit-payments-evidence', mediaIds.join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        mediaIds.map(async (mediaId) => {
          const download = await filesApi.getDownloadUrl(mediaId);
          return [mediaId, download.url] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, string>;
    },
    enabled: mediaIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryTile label="Total abonado" value={currency(summary.totalPaid)} tone="emerald" />
        <SummaryTile label="Total visita" value={currency(summary.visitTotal)} tone="slate" />
        <SummaryTile label="Saldo pendiente" value={currency(summary.pendingAmount)} tone={summary.pendingAmount > 0 ? 'amber' : 'emerald'} />
      </div>

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
        <div className="space-y-2">
          {sortedPayments.map((payment) => {
            const methodName =
              paymentMethods.find((item) => item.id === payment.paymentMethodId)?.name ||
              payment.method ||
              'Método no especificado';

            return (
              <article key={payment.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{currency(payment.amount)}</p>
                    <p className="text-xs text-slate-500">{methodName}</p>
                  </div>
                  <p className="text-xs text-slate-500">{payment.paidAt ? dateTime(payment.paidAt) : 'Sin fecha'}</p>
                </div>

                {payment.notes ? <p className="mt-2 text-xs text-slate-700">{payment.notes}</p> : null}

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <ReceiptText className="h-3.5 w-3.5" />
                    {payment.attachments.length} evidencia(s)
                  </span>
                  {payment.attachments.length ? (
                    <span>{evidenceQuery.isFetching ? 'Sincronizando evidencia...' : 'Evidencia lista'}</span>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn-secondary h-10 justify-center gap-1"
                    onClick={() => {
                      setEditingPayment(payment);
                      setIsSheetOpen(true);
                    }}
                  >
                    <PencilLine className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary h-10 justify-center gap-1 text-rose-700"
                    onClick={() => setDeleteTarget(payment)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
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
    </section>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'amber' | 'slate' }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-800';

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}
