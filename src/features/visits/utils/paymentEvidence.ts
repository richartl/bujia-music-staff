export const EVIDENCE_MARKER_REGEX = /^\s*\[evidence_media_ids:\s*([^\]]*)\]\s*/i;

export type IntakePaymentForm = {
  paymentMethodId?: string;
  method?: string;
  amount: number;
  notes?: string;
  paidAt?: string;
  evidenceFiles?: File[];
};

export type VisitPaymentPayloadInput = {
  form: IntakePaymentForm;
  evidenceMediaIds: string[];
  existingVisitMediaIds?: string[];
};

export function parseEvidenceMarkerFromNotes(notes?: string | null) {
  const raw = String(notes || '');
  const match = raw.match(EVIDENCE_MARKER_REGEX);
  if (!match) {
    return { cleanNotes: raw.trim(), evidenceMediaIds: [] as string[] };
  }
  const ids = match[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const cleanNotes = raw.replace(EVIDENCE_MARKER_REGEX, '').trim();
  return { cleanNotes, evidenceMediaIds: Array.from(new Set(ids)) };
}

function withEvidenceMarker(notes: string | undefined, evidenceMediaIds: string[]) {
  if (!evidenceMediaIds.length) return notes?.trim() || undefined;
  const marker = `[evidence_media_ids: ${evidenceMediaIds.join(',')}]`;
  const tail = notes?.trim() || 'Evidencia de abono';
  return `${marker} ${tail}`.trim();
}

export function buildVisitPaymentPayload({ form, evidenceMediaIds, existingVisitMediaIds }: VisitPaymentPayloadInput) {
  const noteWithMarker = withEvidenceMarker(form.notes, evidenceMediaIds);
  const mergedVisitMediaIds = Array.from(new Set([...(existingVisitMediaIds || []), ...evidenceMediaIds]));

  return {
    payments: [
      {
        paymentMethodId: form.paymentMethodId || undefined,
        method: form.method?.trim() || undefined,
        amount: Number(form.amount),
        notes: noteWithMarker,
        paidAt: form.paidAt || new Date().toISOString(),
      },
    ],
    visitMediaIds: mergedVisitMediaIds.length ? mergedVisitMediaIds : undefined,
  };
}
