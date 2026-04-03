import { Link } from 'react-router-dom';
import { cn, currency, dateTime } from '@/lib/utils';
import type { VisitResponse } from '../api/types';
import { VisitStatusBadge } from './VisitStatusBadge';

type VisitCardProps = {
  visit: VisitResponse;
};

function getClientName(visit: VisitResponse) {
  return visit.client?.fullName || `${visit.client?.firstName || ''} ${visit.client?.lastName || ''}`.trim() || 'Cliente sin nombre';
}

function serviceSummary(visit: VisitResponse) {
  if (visit.diagnosis) return visit.diagnosis;
  if (visit.customerComplaint) return visit.customerComplaint;
  if (visit.intakeNotes) return visit.intakeNotes;
  return 'Sin descripción del trabajo';
}

export function VisitCard({ visit }: VisitCardProps) {
  const total = Number(visit.total || 0);
  const totalPaid = (visit.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pending = Math.max(total - totalPaid, 0);

  return (
    <Link
      to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`}
      className={cn(
        'card block border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-md',
        visit.isActive && 'border-l-4 border-l-violet-500',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{visit.folio || `Visita ${visit.id.slice(0, 8)}`}</p>
          <p className="mt-1 text-xs text-slate-500">Ingreso: {visit.openedAt ? dateTime(visit.openedAt) : 'Sin fecha'}</p>
        </div>
        <VisitStatusBadge name={visit.status?.name} color={visit.status?.color} isActive={visit.isActive} />
      </div>

      <div className="mt-3 space-y-2">
        <h3 className="text-base font-semibold leading-tight text-slate-900">{getClientName(visit)}</h3>
        <p className="text-sm text-slate-600">{visit.client?.phone || 'Sin teléfono'}</p>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-900">{visit.instrument?.name || 'Instrumento sin nombre'}</p>
        <p className="text-xs text-slate-600">
          {visit.instrument?.model || 'Modelo s/d'}
          {visit.instrument?.colorName ? ` · ${visit.instrument.colorName}` : ''}
        </p>
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-slate-600">{serviceSummary(visit)}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Total</p>
          <p className="font-semibold text-slate-900">{currency(total)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Saldo</p>
          <p className={cn('font-semibold', pending > 0 ? 'text-amber-700' : 'text-emerald-700')}>
            {currency(pending)}
          </p>
        </div>
      </div>
    </Link>
  );
}
