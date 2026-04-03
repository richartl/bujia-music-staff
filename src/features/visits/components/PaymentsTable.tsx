import { PencilLine, Trash2 } from 'lucide-react';
import { currency, dateTime } from '@/lib/utils';
import type { VisitPayment } from '@/features/visits/api/visitPaymentsApi';
import type { LookupOption } from '@/features/intakes/types';
import { normalizePaymentAttachments } from '@/features/visits/utils/paymentAttachments';
import { PaymentAttachmentGallery } from '@/features/visits/components/PaymentAttachmentGallery';

type PaymentsTableProps = {
  payments: VisitPayment[];
  paymentMethods: LookupOption[];
  onOpenDetail: (payment: VisitPayment) => void;
  onEdit: (payment: VisitPayment) => void;
  onDelete: (payment: VisitPayment) => void;
  onOpenAttachment: (payload: { url: string; mimeType: string; name: string }) => void;
};

export function PaymentsTable({ payments, paymentMethods, onOpenDetail, onEdit, onDelete, onOpenAttachment }: PaymentsTableProps) {
  return (
    <div className="space-y-2">
      {payments.map((payment) => {
        const methodName =
          paymentMethods.find((item) => item.id === payment.paymentMethodId)?.name ||
          payment.method ||
          'Método no especificado';
        const attachments = normalizePaymentAttachments(payment);

        return (
          <article key={payment.id} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <button type="button" className="text-left text-sm font-semibold text-slate-900 underline-offset-2 hover:underline" onClick={() => onOpenDetail(payment)}>{currency(payment.amount)}</button>
                <p className="text-xs text-slate-500">{methodName}</p>
              </div>
              <p className="text-xs text-slate-500">{payment.paidAt ? dateTime(payment.paidAt) : 'Sin fecha'}</p>
            </div>

            {payment.notes ? <p className="mt-2 text-xs text-slate-700">{payment.notes}</p> : null}
            <div className="mt-2">
              <PaymentAttachmentGallery
                attachments={attachments}
                compact
                onOpen={(item) => {
                  if (!item.publicUrl) return;
                  onOpenAttachment({
                    url: item.publicUrl,
                    mimeType: item.mimeType || '',
                    name: item.originalName,
                  });
                }}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary h-10 justify-center gap-1" onClick={() => onEdit(payment)}>
                <PencilLine className="h-4 w-4" />
                Editar
              </button>
              <button type="button" className="btn-secondary h-10 justify-center gap-1 text-rose-700" onClick={() => onDelete(payment)}>
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
