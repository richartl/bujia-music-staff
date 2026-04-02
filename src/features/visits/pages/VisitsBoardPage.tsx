import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { currency, dateTime } from '@/lib/utils';
import { getVisitsByInstrument, getWorkshopVisitStatuses } from '../api/visitsApi';

function statusColor(color?: string | null) {
  if (!color) return '#0f172a';
  return color;
}

export function VisitsBoardPage() {
  const workshopId = authStore((state) => state.workshopId);
  const [instrumentId, setInstrumentId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [onlyActive, setOnlyActive] = useState(true);

  const visitsQuery = useQuery({
    queryKey: ['visits-by-instrument', workshopId, instrumentId],
    queryFn: () => getVisitsByInstrument(workshopId!, instrumentId),
    enabled: !!workshopId && !!instrumentId,
  });

  const statusesQuery = useQuery({
    queryKey: ['visit-statuses', workshopId],
    queryFn: () => getWorkshopVisitStatuses(workshopId!),
    enabled: !!workshopId,
  });

  const filteredVisits = useMemo(() => {
    const items = visitsQuery.data || [];
    return items.filter((visit) => {
      if (onlyActive && !visit.isActive) return false;
      if (statusFilter !== 'ALL' && (visit.statusId || visit.status?.id) !== statusFilter) return false;
      const haystack = `${visit.folio} ${visit.client?.fullName || ''} ${visit.instrument?.name || ''}`.toLowerCase();
      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [onlyActive, search, statusFilter, visitsQuery.data]);

  return (
    <div className="space-y-3">
      <section className="card p-4">
        <h1 className="section-title">Visitas activas</h1>
        <p className="mt-1 text-sm text-slate-500">Mobile first: busca por instrumento y filtra rápidamente.</p>

        <div className="mt-3 space-y-2">
          <input
            className="input h-11"
            value={instrumentId}
            placeholder="Instrument ID (requerido para backend)"
            onChange={(event) => setInstrumentId(event.target.value)}
          />
          <input
            className="input h-11"
            value={search}
            placeholder="Buscar por folio / cliente / instrumento"
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="input h-11" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Todos los estatus</option>
            {(statusesQuery.data || []).map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)} />
            Solo activas (`isActive === true`)
          </label>
        </div>
      </section>

      {visitsQuery.isLoading ? (
        <section className="card p-4 text-sm text-slate-500">Cargando visitas activas…</section>
      ) : null}

      {visitsQuery.isError ? (
        <section className="card p-4 text-sm text-red-700">No se pudo cargar visitas (403/404 o error de red).</section>
      ) : null}

      {!filteredVisits.length && !visitsQuery.isLoading ? (
        <section className="card p-4 text-sm text-slate-500">Sin resultados. Ajusta filtros o instrumentId.</section>
      ) : null}

      <section className="grid gap-3">
        {filteredVisits.map((visit) => (
          <article key={visit.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{visit.folio}</p>
                <h3 className="text-base font-semibold text-slate-900">{visit.instrument?.name || 'Instrumento'}</h3>
                <p className="text-sm text-slate-500">{visit.client?.fullName || 'Cliente sin nombre'}</p>
              </div>
              <span
                className="rounded-full px-2 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${statusColor(visit.status?.color)}22`, color: statusColor(visit.status?.color) }}
              >
                {visit.status?.name || 'Sin estatus'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <p className="text-slate-500">Total</p>
              <p className="text-right font-semibold text-slate-900">{currency(Number(visit.total || 0))}</p>
              <p className="text-slate-500">Apertura</p>
              <p className="text-right text-slate-700">{visit.openedAt ? dateTime(visit.openedAt) : '-'}</p>
            </div>
            <Link
              to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`}
              className="btn-primary mt-3 w-full justify-center"
            >
              Ver detalle
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
