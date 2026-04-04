import { Link } from 'react-router-dom';
import { cn, currency, dateTime } from '@/lib/utils';
import { normalizeVisit } from '../utils/visitAdapter';
import type { VisitResponse } from '../api/types';
import { resolveStatusTone, VisitStatusBadge } from './VisitStatusBadge';

type VisitCardProps = {
  visit: VisitResponse;
};

export function VisitCard({ visit }: VisitCardProps) {
  const normalized = normalizeVisit(visit);
  const tone = resolveStatusTone(normalized.status.name, normalized.isActive);
  const accent = normalized.status.color || tone.accent;

  return (
    <Link
      to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`}
      className="card block border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderLeftWidth: 5,
        borderLeftColor: accent,
        background: `linear-gradient(180deg, ${accent}12 0%, #ffffff 22%)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{normalized.folio}</p>
          <p className="mt-1 text-xs text-slate-500">Ingreso: {normalized.openedAt ? dateTime(normalized.openedAt) : 'Sin fecha'}</p>
        </div>

        <div className="text-right">
          <VisitStatusBadge name={normalized.status.name} color={normalized.status.color} isActive={normalized.isActive} />
          <p className={cn('mt-1 text-[11px] font-semibold uppercase tracking-wide', normalized.isActive ? 'text-emerald-700' : 'text-slate-500')}>
            {normalized.isActive ? 'Activa' : 'Inactiva'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-base font-semibold leading-tight text-slate-900">{normalized.clientName}</h3>
        <p className="text-sm text-slate-600">{normalized.clientPhone}</p>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/95 p-3">
        <p className="text-sm font-semibold text-slate-900">{normalized.instrumentName}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
          <p><span className="font-medium text-slate-700">Modelo:</span> {normalized.instrumentModel}</p>
          <p><span className="font-medium text-slate-700">Marca:</span> {normalized.instrumentBrand}</p>
          <p><span className="font-medium text-slate-700">Color:</span> {normalized.instrumentColor}</p>
          <p><span className="font-medium text-slate-700">Tipo:</span> {normalized.instrumentType}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-slate-600">{normalized.summary}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Total</p>
          <p className="font-semibold text-slate-900">{currency(normalized.total)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Saldo</p>
          <p className={cn('font-semibold', normalized.pending > 0 ? 'text-amber-700' : 'text-emerald-700')}>
            {currency(normalized.pending)}
          </p>
        </div>
      </div>
    </Link>
  );
}
