export type VisitPaymentFormValues = {
  amount: string;
  paymentMethodId: string;
  method: string;
  paidAt: string;
  notes: string;
};

export type VisitPaymentValidationContext = {
  mode: 'create' | 'update';
};

export function toDatetimeLocalValue(isoDate?: string | null) {
  if (!isoDate) return '';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export function normalizePaymentPayload(values: VisitPaymentFormValues) {
  const amount = Number(values.amount);
  const method = values.method.trim();
  const paymentMethodId = values.paymentMethodId.trim();

  return {
    amount,
    paymentMethodId: paymentMethodId || undefined,
    method: paymentMethodId ? undefined : method || undefined,
    paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : undefined,
    notes: values.notes.trim() || undefined,
  };
}

export function validateVisitPaymentForm(values: VisitPaymentFormValues, context: VisitPaymentValidationContext) {
  const payload = normalizePaymentPayload(values);

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return 'Captura un monto mayor a 0.';
  }

  if (context.mode === 'create' && !payload.paymentMethodId && !payload.method) {
    return 'Selecciona un método de pago o captura uno manual.';
  }

  if (!payload.paymentMethodId && !payload.method) {
    return 'El abono necesita método de pago.';
  }

  return null;
}

export function getFriendlyPaymentError(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error as { response?: { data?: { message?: string | string[] } } };
    const message = response.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }

  return 'No se pudo guardar el abono. Intenta de nuevo.';
}
