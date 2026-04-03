import type { ServiceStatusCatalog } from '@/features/visits/api/types';

type VisitServiceStatusSheetProps = {
  open: boolean;
  title: string;
  statuses: ServiceStatusCatalog[];
  currentStatusId?: string;
  loading?: boolean;
  onClose: () => void;
  onSelect: (status: ServiceStatusCatalog) => void;
};

export function VisitServiceStatusSheet({
  open,
  title,
  statuses,
  currentStatusId,
  loading,
  onClose,
  onSelect,
}: VisitServiceStatusSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <div className="mt-3 space-y-2">
          {statuses.map((status) => {
            const isCurrent = status.id === currentStatusId;
            return (
              <button
                key={status.id}
                type="button"
                className={`w-full rounded-xl border p-3 text-left ${isCurrent ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'}`}
                onClick={() => onSelect(status)}
                disabled={loading}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: status.color || '#94A3B8' }} />
                    <p className="text-sm font-semibold text-slate-900">{status.name}</p>
                  </div>
                  {isCurrent ? <span className="text-xs font-semibold text-slate-700">Actual</span> : null}
                </div>
                {status.description ? <p className="mt-1 text-xs text-slate-500">{status.description}</p> : null}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn-secondary mt-4 h-11 w-full justify-center" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
