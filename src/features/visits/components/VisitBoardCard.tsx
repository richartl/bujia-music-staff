import { useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Guitar, Image as ImageIcon } from 'lucide-react';
import { cn, currency, dateTime } from '@/lib/utils';
import { getVisitMainImageAttachment } from '../utils/visitAttachments';
import { normalizeVisit } from '../utils/visitAdapter';
import type { VisitResponse, VisitStatusCatalog } from '../api/types';
import { VisitStatusBadge } from './VisitStatusBadge';
import { VisitBoardCardActions } from './VisitBoardCardActions';

type VisitBoardCardProps = {
  visit: VisitResponse;
  statuses: VisitStatusCatalog[];
  onStatusChange: (visit: VisitResponse, statusId: string) => void;
  onPreviewImage: (image: { url: string; name: string }) => void;
  isStatusChanging?: boolean;
  onArchiveVisit?: (visit: VisitResponse, reason?: string) => void;
  onUnarchiveVisit?: (visit: VisitResponse) => void;
  isArchiving?: boolean;
  isArchiveMode?: boolean;
};

function getDaysSince(dateValue?: string | null) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function VisitBoardCard({
  visit,
  statuses,
  onStatusChange,
  onPreviewImage,
  isStatusChanging = false,
  onArchiveVisit,
  onUnarchiveVisit,
  isArchiving = false,
  isArchiveMode = false,
}: VisitBoardCardProps) {
  const normalized = useMemo(() => normalizeVisit(visit), [visit]);
  const cover = useMemo(() => getVisitMainImageAttachment(visit), [visit]);
  const [imageError, setImageError] = useState(false);
  const paid = Math.max(normalized.total - normalized.pending, 0);
  const openedDays = getDaysSince(visit.openedAt || visit.closedAt);
  const isUrgent = (openedDays || 0) >= 10 && normalized.pending > 0;

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900 p-3 text-slate-100 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{normalized.folio}</p>
          <h3 className="truncate text-sm font-semibold text-white">{normalized.clientName}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-400">{normalized.instrumentType} · {normalized.instrumentBrand} {normalized.instrumentModel}</p>
        </div>
        <VisitStatusBadge name={normalized.status.name} color={normalized.status.color} isActive={normalized.isActive} />
      </div>
      {visit.isArchived ? (
        <div className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
          <p className="font-semibold">Archivada</p>
          {visit.archivedAt ? <p className="mt-0.5">Desde: {dateTime(visit.archivedAt)}</p> : null}
        </div>
      ) : null}

      <div className="mt-2 flex gap-2 rounded-xl border border-slate-700 bg-slate-950/40 p-2">
        {cover && !imageError ? (
          <button
            type="button"
            className="h-16 w-16 overflow-hidden rounded-lg border border-slate-700"
            onClick={() => onPreviewImage({ url: cover.publicUrl || '', name: cover.originalName || normalized.instrumentName })}
          >
            <img src={cover.publicUrl} alt={cover.originalName || normalized.instrumentName} className="h-full w-full object-cover" loading="lazy" onError={() => setImageError(true)} />
          </button>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900 text-slate-500">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs text-slate-300">{normalized.summary}</p>
          <p className="mt-1 truncate text-[11px] text-slate-400">Color: {normalized.instrumentColor}</p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <MoneyCell label="Total" value={currency(normalized.total)} />
        <MoneyCell label="Abonos" value={currency(paid)} />
        <MoneyCell label="Saldo" value={currency(normalized.pending)} emphasize={normalized.pending > 0} />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{dateTime(visit.openedAt || visit.closedAt)}</span>
        {isUrgent ? <span className="inline-flex items-center gap-1 text-amber-300"><AlertTriangle className="h-3.5 w-3.5" />Atrasada</span> : <span className="inline-flex items-center gap-1 text-slate-500"><Guitar className="h-3.5 w-3.5" />Operativa</span>}
      </div>

      <div className="mt-2">
        <VisitBoardCardActions
          visit={visit}
          statuses={statuses}
          onStatusChange={(statusId) => onStatusChange(visit, statusId)}
          isChangingStatus={isStatusChanging}
          onArchive={() => {
            if (!onArchiveVisit) return;
            const reason = window.prompt('Motivo de archivado (opcional):', '') || '';
            onArchiveVisit(visit, reason.trim() || undefined);
          }}
          onUnarchive={() => onUnarchiveVisit?.(visit)}
          isArchiving={isArchiving}
          isArchiveMode={isArchiveMode}
        />
      </div>
    </article>
  );
}

function MoneyCell({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('truncate text-xs font-semibold', emphasize ? 'text-amber-300' : 'text-slate-100')}>{value}</p>
    </div>
  );
}
