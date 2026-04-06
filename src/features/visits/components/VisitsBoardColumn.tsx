import { currency } from '@/lib/utils';
import type { VisitResponse, VisitStatusCatalog } from '../api/types';
import { VisitBoardCard } from './VisitBoardCard';

type VisitsBoardColumnProps = {
  column: {
    statusId: string;
    name: string;
    color?: string | null;
    visits: VisitResponse[];
    totalAmount: number;
  };
  statuses: VisitStatusCatalog[];
  onStatusChange: (visit: VisitResponse, statusId: string) => void;
  onPreviewImage: (image: { url: string; name: string }) => void;
  changingVisitId?: string;
  onArchiveVisit?: (visit: VisitResponse) => void;
  onUnarchiveVisit?: (visit: VisitResponse) => void;
  isArchivingVisit?: (visitId: string) => boolean;
  isArchiveMode?: boolean;
};

export function VisitsBoardColumn({
  column,
  statuses,
  onStatusChange,
  onPreviewImage,
  changingVisitId,
  onArchiveVisit,
  onUnarchiveVisit,
  isArchivingVisit,
  isArchiveMode = false,
}: VisitsBoardColumnProps) {
  return (
    <section className="w-[84vw] shrink-0 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:w-80 lg:w-96">
      <header className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{column.name}</p>
          <p className="text-xs text-slate-400">{column.visits.length} visitas · {currency(column.totalAmount)}</p>
        </div>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color || '#64748b' }} aria-hidden />
      </header>

      {column.visits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-3 py-6 text-center text-xs text-slate-500">
          Sin visitas en este estatus.
        </div>
      ) : (
        <div className="space-y-2">
          {column.visits.map((visit) => (
            <VisitBoardCard
              key={visit.id}
              visit={visit}
              statuses={statuses}
              onStatusChange={onStatusChange}
              onPreviewImage={onPreviewImage}
              isStatusChanging={changingVisitId === visit.id}
              onArchiveVisit={onArchiveVisit}
              onUnarchiveVisit={onUnarchiveVisit}
              isArchiving={isArchivingVisit?.(visit.id)}
              isArchiveMode={isArchiveMode}
            />
          ))}
        </div>
      )}
    </section>
  );
}
