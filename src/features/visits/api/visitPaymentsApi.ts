import { http } from '@/lib/http';

export type VisitPaymentAttachment = {
  id: string;
  mediaId: string;
  sortOrder?: number;
  createdAt?: string;
  publicUrl?: string | null;
  mimeType?: string | null;
  originalName?: string | null;
  status?: string | null;
};

export type VisitPayment = {
  id: string;
  visitId: string;
  workshopId: string;
  amount: number;
  paymentMethodId?: string | null;
  method?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  attachments: VisitPaymentAttachment[];
};

export type VisitPaymentsResponse = {
  items: VisitPayment[];
  totalPaid: number;
  visitTotal: number;
  pendingAmount: number;
};

export type CreateVisitPaymentRequest = {
  amount: number;
  paymentMethodId?: string;
  method?: string;
  paidAt?: string;
  notes?: string;
  mediaIds?: string[];
};

export type UpdateVisitPaymentRequest = Partial<CreateVisitPaymentRequest>;

function normalizePayment(payment: VisitPayment): VisitPayment {
  return {
    ...payment,
    amount: Number(payment.amount || 0),
    attachments: Array.isArray(payment.attachments)
      ? payment.attachments.map((item) => ({
          ...item,
          mediaId: item.mediaId || '',
          publicUrl: item.publicUrl || null,
          mimeType: item.mimeType || null,
          originalName: item.originalName || null,
          status: item.status || null,
        }))
      : [],
  };
}

function normalizeSummary(payload: VisitPaymentsResponse): VisitPaymentsResponse {
  return {
    ...payload,
    items: Array.isArray(payload.items) ? payload.items.map(normalizePayment) : [],
    totalPaid: Number(payload.totalPaid || 0),
    visitTotal: Number(payload.visitTotal || 0),
    pendingAmount: Number(payload.pendingAmount || 0),
  };
}

export async function getVisitPayments(visitId: string) {
  const { data } = await http.get<VisitPaymentsResponse>(`/visits/${visitId}/payments`);
  return normalizeSummary(data);
}

export async function createVisitPayment(visitId: string, payload: CreateVisitPaymentRequest) {
  const { data } = await http.post<VisitPayment>(`/visits/${visitId}/payments`, payload);
  return normalizePayment(data);
}

export async function getVisitPayment(visitId: string, paymentId: string) {
  const { data } = await http.get<VisitPayment>(`/visits/${visitId}/payments/${paymentId}`);
  return normalizePayment(data);
}

export async function updateVisitPayment(visitId: string, paymentId: string, payload: UpdateVisitPaymentRequest) {
  const { data } = await http.patch<VisitPayment>(`/visits/${visitId}/payments/${paymentId}`, payload);
  return normalizePayment(data);
}

export async function deleteVisitPayment(visitId: string, paymentId: string) {
  await http.delete(`/visits/${visitId}/payments/${paymentId}`);
}
