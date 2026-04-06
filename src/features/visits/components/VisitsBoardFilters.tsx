import { Search, SlidersHorizontal } from 'lucide-react';
import type { VisitFilters, VisitStatusCatalog } from '../api/types';

type VisitsBoardFiltersProps = {
  filters: VisitFilters;
  statuses: VisitStatusCatalog[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onActiveChange: (value: VisitFilters['isActive']) => void;
  onClear: () => void;
};

export function VisitsBoardFilters({
  filters,
  statuses,
  isExpanded,
  onToggleExpanded,
  onSearchChange,
  onStatusChange,
  onActiveChange,
  onClear,
}: VisitsBoardFiltersProps) {
  return (
    <section className="card p-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input h-11 pl-9"
            value={filters.search}
            placeholder="Cliente, folio, instrumento, color"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <button type="button" className="btn-secondary h-11 px-3" onClick={onToggleExpanded}>
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select className="input h-11" value={filters.statusId} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="">Todos los estatus</option>
            {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>

          <select className="input h-11" value={filters.isActive} onChange={(event) => onActiveChange(event.target.value as VisitFilters['isActive'])}>
            <option value="true">Solo activas</option>
            <option value="">Todas</option>
            <option value="false">Solo inactivas</option>
          </select>

          <button type="button" className="btn-secondary h-11 justify-center" onClick={onClear}>Limpiar filtros</button>
        </div>
      ) : null}
    </section>
  );
}
