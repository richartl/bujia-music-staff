import { useState } from 'react';
import { useChangeVisitStatus } from '../hooks/useChangeVisitStatus';
import { useVisitBoardFilters } from '../hooks/useVisitBoardFilters';
import { useVisitsBoard } from '../hooks/useVisitsBoard';
import { useVisitArchive } from '../hooks/useVisitArchive';
import { VisitsViewSwitcher } from '../components/VisitsViewSwitcher';
import { VisitsBoardFilters } from '../components/VisitsBoardFilters';
import { VisitsBoardColumn } from '../components/VisitsBoardColumn';
import { VisitBoardImagePreview } from '../components/VisitBoardImagePreview';
import type { VisitResponse } from '../api/types';
import { normalizeVisitFilters } from '../utils/visitFilters';
import { OverlayPortal } from '@/components/ui/OverlayPortal';

export function VisitsBoardPage() {
  const { filters, setFilters, update, apply, clear, isExpanded, setIsExpanded } = useVisitBoardFilters();
  const { workshopId, visitsQuery, statusesQuery, columns, visitsCount, activeCount } = useVisitsBoard(filters);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [changingVisitId, setChangingVisitId] = useState<string>('');
  const [archiveModal, setArchiveModal] = useState<{ visit: VisitResponse; reason: string } | null>(null);
  const { archiveMutation, unarchiveMutation } = useVisitArchive({ workshopId });
  const isArchiveMode = filters.isArchived === 'true';

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

  function handleArchiveVisit(visit: VisitResponse) {
    setArchiveModal({ visit, reason: '' });
  }

  function handleUnarchiveVisit(visit: VisitResponse) {
    unarchiveMutation.mutate({
      visitId: visit.id,
      instrumentId: visit.instrumentId,
    });
  }

  return (
    <div className="space-y-3 pb-6">
      <VisitsViewSwitcher current="board" />

      <section className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title">Tablero de visitas</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isArchiveMode ? 'Consulta y edición de visitas archivadas.' : 'Flujo diario por estatus para mostrador y taller.'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100">
            {isArchiveMode ? `${visitsCount} archivadas` : `${activeCount} activas · ${visitsCount} totales`}
          </div>
        </div>
      </section>

      <VisitsBoardFilters
        filters={filters}
        statuses={statusesQuery.data || []}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((current) => !current)}
        onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
        onStatusChange={(value) => apply(normalizeVisitFilters({ ...filters, statusId: value }, statusesQuery.data || []))}
        onActiveChange={(value) => apply(normalizeVisitFilters({ ...filters, isActive: value }, statusesQuery.data || []))}
        onArchiveModeChange={(value) => apply({ ...filters, isArchived: value, isActive: value === 'true' ? '' : filters.isActive })}
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
                onArchiveVisit={handleArchiveVisit}
                onUnarchiveVisit={handleUnarchiveVisit}
                isArchivingVisit={(visitId) =>
                  archiveMutation.variables?.visitId === visitId && archiveMutation.isPending
                  || unarchiveMutation.variables?.visitId === visitId && unarchiveMutation.isPending
                }
                isArchiveMode={isArchiveMode}
              />
            ))}
          </section>
        ) : (
          <section className="card p-5 text-sm text-slate-500">
            {isArchiveMode ? 'No hay visitas archivadas con estos filtros.' : 'No encontramos visitas con estos filtros.'}
            <button type="button" className="btn-secondary ml-2 h-9 px-3 py-1 text-xs" onClick={clear}>Limpiar filtros</button>
          </section>
        )
      ) : null}

      <VisitBoardImagePreview image={previewImage} onClose={() => setPreviewImage(null)} />

      {archiveModal ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => !archiveMutation.isPending && setArchiveModal(null)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <h3 className="text-base font-semibold text-slate-900">Archivar visita</h3>
              <p className="mt-1 text-sm text-slate-600">
                Esta acción mueve la visita al archivo administrativo. Puedes agregar un motivo opcional.
              </p>
              <textarea
                className="input mt-3 min-h-24 w-full resize-none py-2"
                placeholder="Motivo (opcional)"
                value={archiveModal.reason}
                onChange={(event) => setArchiveModal((current) => current ? { ...current, reason: event.target.value } : current)}
                disabled={archiveMutation.isPending}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-secondary h-10 justify-center"
                  onClick={() => setArchiveModal(null)}
                  disabled={archiveMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary h-10 justify-center"
                  onClick={() => {
                    if (!archiveModal) return;
                    archiveMutation.mutate(
                      {
                        visitId: archiveModal.visit.id,
                        instrumentId: archiveModal.visit.instrumentId,
                        reason: archiveModal.reason.trim() || undefined,
                      },
                      {
                        onSuccess: () => setArchiveModal(null),
                      },
                    );
                  }}
                  disabled={archiveMutation.isPending}
                >
                  {archiveMutation.isPending ? 'Archivando...' : 'Archivar'}
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
