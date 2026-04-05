import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn, currency, dateTime } from '@/lib/utils';
import { normalizeVisit } from '../utils/visitAdapter';
import { getVisitMainImageAttachment } from '../utils/visitAttachments';
import type { VisitResponse } from '../api/types';
import { resolveStatusTone, VisitStatusBadge } from './VisitStatusBadge';

type VisitCardProps = {
  visit: VisitResponse;
};

export function VisitCard({ visit }: VisitCardProps) {
  const normalized = normalizeVisit(visit);
  const tone = resolveStatusTone(normalized.status.name, normalized.isActive);
  const accent = normalized.status.color || tone.accent;
  const cover = useMemo(() => getVisitMainImageAttachment(visit), [visit]);
  const [imageError, setImageError] = useState(false);
  const servicesCount = Array.isArray((visit as Record<string, unknown>).services)
    ? ((visit as Record<string, unknown>).services as unknown[]).length
    : 0;
  const attachmentsCount = Array.isArray(visit.attachments) ? visit.attachments.length : 0;

  return (
    <Link
      to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`}
      className="group card block overflow-hidden border p-0 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      style={{ borderLeftWidth: 5, borderLeftColor: accent }}
    >
      {cover && !imageError ? (
        <div className="relative h-36 w-full bg-slate-900 sm:h-40">
          <img
            src={cover.publicUrl}
            alt={cover.originalName || normalized.instrumentName}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-2">
            <span className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">{normalized.folio}</span>
            <VisitStatusBadge name={normalized.status.name} color={normalized.status.color} isActive={normalized.isActive} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 pt-3">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">{normalized.folio}</span>
          <VisitStatusBadge name={normalized.status.name} color={normalized.status.color} isActive={normalized.isActive} />
        </div>
      )}

      <div className="space-y-3 p-3">
        <div>
          <h3 className="truncate text-base font-semibold text-slate-900">{normalized.clientName}</h3>
          <p className="truncate text-xs text-slate-500">{normalized.clientPhone}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
          <p className="truncate text-sm font-semibold text-slate-900">{normalized.instrumentBrand} · {normalized.instrumentModel}</p>
          <p className="mt-1 text-xs text-slate-600">Tipo: {normalized.instrumentType} · Color: {normalized.instrumentColor}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <InfoChip label="Total" value={currency(normalized.total)} />
          <InfoChip label="Servicios" value={String(servicesCount)} />
          <InfoChip label="Adjuntos" value={String(attachmentsCount)} />
          <InfoChip label="Ingreso" value={normalized.openedAt ? dateTime(normalized.openedAt) : 'Sin fecha'} />
        </div>

        <p className={cn('line-clamp-2 text-xs', normalized.pending > 0 ? 'text-amber-700' : 'text-emerald-700')}>
          {normalized.pending > 0 ? `Saldo pendiente: ${currency(normalized.pending)}` : 'Sin saldo pendiente'}
        </p>
      </div>
    </Link>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-xs font-semibold text-slate-800">{value}</p>
    </div>
  );
}
