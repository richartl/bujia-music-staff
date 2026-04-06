import { useState } from 'react';
import { useChangeVisitStatus } from '../hooks/useChangeVisitStatus';
import { useVisitBoardFilters } from '../hooks/useVisitBoardFilters';
import { useVisitsBoard } from '../hooks/useVisitsBoard';
import { VisitsViewSwitcher } from '../components/VisitsViewSwitcher';
import { VisitsBoardFilters } from '../components/VisitsBoardFilters';
import { VisitsBoardColumn } from '../components/VisitsBoardColumn';
import { VisitBoardImagePreview } from '../components/VisitBoardImagePreview';
import type { VisitResponse } from '../api/types';

export function VisitsBoardPage() {
  const { filters, setFilters, update, clear, isExpanded, setIsExpanded } = useVisitBoardFilters();
  const { workshopId, visitsQuery, statusesQuery, columns, visitsCount, activeCount } = useVisitsBoard(filters);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [changingVisitId, setChangingVisitId] = useState<string>('');

  const changeStatusMutation = useChangeVisitStatus({
    workshopId,
    filters,
    statuses: statusesQuery.data || [],
  });

  function handleStatusChange(visit: VisitResponse, statusId: string) {
    setChangingVisitId(visit.id);
    changeStatusMutation.mutate(
      { visitId: visit.id, instrumentId: visit.instrumentId, statusId },
      { onSettled: () => setChangingVisitId('') },
    );
  }

  return (
    <div className="space-y-3 pb-6">
      <VisitsViewSwitcher current="board" />

      <section className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title">Tablero de visitas</h1>
            <p className="mt-1 text-sm text-slate-500">Flujo diario por estatus para mostrador y taller.</p>
          </div>
          <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100">
            {activeCount} activas · {visitsCount} totales
          </div>
        </div>
      </section>

      <VisitsBoardFilters
        filters={filters}
        statuses={statusesQuery.data || []}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((current) => !current)}
        onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
        onStatusChange={(value) => update('statusId', value)}
        onActiveChange={(value) => update('isActive', value)}
        onClear={clear}
      />

      {visitsQuery.isLoading ? (
        <section className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-80 w-[84vw] shrink-0 animate-pulse rounded-2xl border border-slate-800 bg-slate-900 sm:w-80" />
          ))}
        </section>
      ) : null}

      {visitsQuery.isError ? (
        <section className="card p-4 text-sm text-rose-700">
          No se pudieron cargar las visitas.
          <button type="button" className="btn-secondary ml-2 h-9 px-3 py-1 text-xs" onClick={() => visitsQuery.refetch()}>Reintentar</button>
        </section>
      ) : null}

      {!visitsQuery.isLoading && !visitsQuery.isError ? (
        columns.length ? (
          <section className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0 lg:gap-4">
            {columns.map((column) => (
              <VisitsBoardColumn
                key={column.statusId || column.name}
                column={column}
                statuses={statusesQuery.data || []}
                onStatusChange={handleStatusChange}
                onPreviewImage={(image) => setPreviewImage(image)}
                changingVisitId={changingVisitId}
              />
            ))}
          </section>
        ) : (
          <section className="card p-5 text-sm text-slate-500">
            No encontramos visitas con estos filtros.
            <button type="button" className="btn-secondary ml-2 h-9 px-3 py-1 text-xs" onClick={clear}>Limpiar filtros</button>
          </section>
        )
      ) : null}

      <VisitBoardImagePreview image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
