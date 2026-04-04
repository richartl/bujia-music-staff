import type { VisitResponse } from '../api/types';

type NormalizedVisitStatus = {
  id?: string;
  name: string;
  color?: string;
};

export type NormalizedVisit = {
  id: string;
  folio: string;
  openedAt?: string | null;
  isActive: boolean;
  clientName: string;
  clientPhone: string;
  instrumentName: string;
  instrumentModel: string;
  instrumentBrand: string;
  instrumentColor: string;
  instrumentType: string;
  total: number;
  pending: number;
  summary: string;
  status: NormalizedVisitStatus;
  raw: VisitResponse;
};

function coerceNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function fullName(visit: VisitResponse) {
  return visit.client?.fullName || `${visit.client?.firstName || ''} ${visit.client?.lastName || ''}`.trim() || 'Cliente sin nombre';
}

export function normalizeVisit(visit: VisitResponse): NormalizedVisit {
  const total = coerceNumber(visit.total);
  const paid = (visit.payments || []).reduce((sum, payment) => sum + coerceNumber(payment.amount), 0);

  const instrumentBrand = visit.instrument?.brand?.name || 'Marca no especificada';
  const instrumentColor = visit.instrument?.color?.name || visit.instrument?.colorName || 'Color no especificado';
  const instrumentType = visit.instrument?.instrumentType?.name || 'Tipo no especificado';

  return {
    id: visit.id,
    folio: visit.folio || `Visita ${visit.id.slice(0, 8)}`,
    openedAt: visit.openedAt,
    isActive: Boolean(visit.isActive),
    clientName: fullName(visit),
    clientPhone: visit.client?.phone || 'Teléfono no registrado',
    instrumentName: visit.instrument?.name || visit.instrument?.model || 'Instrumento',
    instrumentModel: visit.instrument?.model || 'Modelo no especificado',
    instrumentBrand,
    instrumentColor,
    instrumentType,
    total,
    pending: Math.max(total - paid, 0),
    summary: visit.diagnosis || visit.customerComplaint || visit.intakeNotes || 'Sin descripción del servicio',
    status: {
      id: visit.statusId,
      name: visit.status?.name || 'Sin estatus',
      color: visit.status?.color || undefined,
    },
    raw: visit,
  };
}
