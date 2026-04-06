import { useMemo, useState } from 'react';
import type { VisitResponse, VisitStatusCatalog } from '../api/types';

type VisitStatusChangeActionProps = {
  visit: VisitResponse;
  statuses: VisitStatusCatalog[];
  isLoading?: boolean;
  onChange: (statusId: string) => void;
};

export function VisitStatusChangeAction({ visit, statuses, isLoading = false, onChange }: VisitStatusChangeActionProps) {
  const [selectedStatusId, setSelectedStatusId] = useState('');

  const currentStatusId = useMemo(() => visit.statusId || visit.status?.id || '', [visit.status?.id, visit.statusId]);

  const availableStatuses = useMemo(
    () => statuses.filter((status) => status.id !== currentStatusId),
    [currentStatusId, statuses],
  );

  return (
    <div className="flex items-center gap-2">
      <select
        className="input h-10 min-w-0 flex-1 px-3 py-2 text-xs"
        value={selectedStatusId}
        onChange={(event) => setSelectedStatusId(event.target.value)}
        aria-label="Seleccionar estatus"
        disabled={isLoading || availableStatuses.length === 0}
      >
        <option value="">Mover a…</option>
        {availableStatuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-secondary h-10 px-3 py-2 text-xs"
        disabled={!selectedStatusId || isLoading}
        onClick={() => onChange(selectedStatusId)}
      >
        {isLoading ? 'Moviendo…' : 'Mover'}
      </button>
    </div>
  );
}
