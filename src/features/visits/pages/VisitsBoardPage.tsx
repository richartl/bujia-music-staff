import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { dateTime } from '@/lib/utils';
import { getWorkshopVisitStatuses, getWorkshopVisitsWithFilters } from '../api/visitsApi';
import { getClientInstruments, getWorkshopBranches, getWorkshopClients } from '../api/workshopCatalogsApi';
import type { VisitFilters, VisitResponse } from '../api/types';
import { QuickFilterChips } from '../components/QuickFilterChips';
import { VisitCard } from '../components/VisitCard';

const EMPTY_FILTERS: VisitFilters = {
  search: '',
  statusId: '',
  createdByUserId: '',
  branchId: '',
  clientId: '',
  instrumentId: '',
  isActive: 'true',
  openedFrom: '',
  openedTo: '',
};

const QUICK_FILTERS = [
  { label: 'Activas', value: 'active' },
  { label: 'Hoy', value: 'today' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Entregadas', value: 'delivered' },
  { label: 'Todas', value: 'all' },
];

function toInputDate(iso?: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function getStartOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function getEndOfTodayIso() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today.toISOString();
}

function resolveQuickFilter(filters: VisitFilters, visits: VisitResponse[]) {
  if (filters.isActive === 'true') return 'active';
  if (!filters.isActive && !filters.statusId && !filters.openedFrom && !filters.openedTo) return 'all';

  const selectedStatus = visits.find((visit) => visit.statusId === filters.statusId)?.status?.name?.toLowerCase();
  if (selectedStatus?.includes('entreg')) return 'delivered';
  if (selectedStatus?.includes('pend')) return 'pending';

  const todayStart = getStartOfTodayIso().slice(0, 10);
  const todayEnd = getEndOfTodayIso().slice(0, 10);
  if (filters.openedFrom.slice(0, 10) === todayStart && filters.openedTo.slice(0, 10) === todayEnd) return 'today';

  return 'all';
}

export function VisitsBoardPage() {
  const workshopId = authStore((state) => state.workshopId);
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFilters: VisitFilters = {
    search: searchParams.get('search') || '',
    statusId: searchParams.get('statusId') || '',
    createdByUserId: searchParams.get('createdByUserId') || '',
    branchId: searchParams.get('branchId') || '',
    clientId: searchParams.get('clientId') || '',
    instrumentId: searchParams.get('instrumentId') || '',
    isActive: (searchParams.get('isActive') as VisitFilters['isActive']) || 'true',
    openedFrom: searchParams.get('openedFrom') || '',
    openedTo: searchParams.get('openedTo') || '',
  };

  const [draftFilters, setDraftFilters] = useState<VisitFilters>(urlFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    setDraftFilters(urlFilters);
  }, [searchParams]);

  const visitsQuery = useQuery({
    queryKey: ['workshop-visits', workshopId, urlFilters],
    queryFn: () => getWorkshopVisitsWithFilters(workshopId!, urlFilters),
    enabled: !!workshopId,
  });

  const statusesQuery = useQuery({
    queryKey: ['visit-statuses', workshopId],
    queryFn: () => getWorkshopVisitStatuses(workshopId!),
    enabled: !!workshopId,
  });

  const branchesQuery = useQuery({
    queryKey: ['visit-branches', workshopId],
    queryFn: () => getWorkshopBranches(workshopId!),
    enabled: !!workshopId,
  });

  const clientsQuery = useQuery({
    queryKey: ['visit-clients', workshopId, draftFilters.search],
    queryFn: () => getWorkshopClients(workshopId!, { search: draftFilters.search, page: 1, limit: 30, isActive: true }),
    enabled: !!workshopId,
  });

  const instrumentsQuery = useQuery({
    queryKey: ['visit-client-instruments-filter', workshopId, draftFilters.clientId],
    queryFn: () => getClientInstruments(workshopId!, draftFilters.clientId),
    enabled: !!workshopId && !!draftFilters.clientId,
  });

  const sortedVisits = useMemo(() => {
    const visits = visitsQuery.data || [];

    return [...visits].sort((a, b) => {
      if (!!a.isActive !== !!b.isActive) {
        return a.isActive ? -1 : 1;
      }

      const aDate = new Date(a.openedAt || a.closedAt || 0).getTime();
      const bDate = new Date(b.openedAt || b.closedAt || 0).getTime();
      return bDate - aDate;
    });
  }, [visitsQuery.data]);

  const quickFilter = useMemo(() => resolveQuickFilter(urlFilters, visitsQuery.data || []), [urlFilters, visitsQuery.data]);

  const activeVisitsCount = useMemo(() => (visitsQuery.data || []).filter((visit) => visit.isActive).length, [visitsQuery.data]);

  function applyFilters(nextFilters = draftFilters) {
    const withDefaultActive = { ...nextFilters, isActive: nextFilters.isActive || 'true' };
    const entries = Object.entries(withDefaultActive).filter(([, value]) => value !== '');
    setSearchParams(new URLSearchParams(entries as Array<[string, string]>));
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setSearchParams(new URLSearchParams({ isActive: 'true' }));
  }

  function handleQuickFilter(value: string) {
    const next = { ...draftFilters };

    if (value === 'active') {
      next.isActive = 'true';
      next.statusId = '';
      next.openedFrom = '';
      next.openedTo = '';
    }

    if (value === 'all') {
      next.isActive = '';
      next.statusId = '';
      next.openedFrom = '';
      next.openedTo = '';
    }

    if (value === 'today') {
      next.isActive = '';
      next.openedFrom = getStartOfTodayIso();
      next.openedTo = getEndOfTodayIso();
    }

    if (value === 'pending' || value === 'delivered') {
      const target = (statusesQuery.data || []).find((status) => status.name.toLowerCase().includes(value === 'pending' ? 'pend' : 'entreg'));
      next.isActive = value === 'delivered' ? 'false' : '';
      next.statusId = target?.id || '';
      next.openedFrom = '';
      next.openedTo = '';
    }

    setDraftFilters(next);
    applyFilters(next);
  }

  return (
    <div className="space-y-3 pb-6">
      <section className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title">Intakes / Órdenes de trabajo</h1>
            <p className="mt-1 text-sm text-slate-500">Vista operativa para priorizar trabajos activos y detectar atención inmediata.</p>
          </div>
          <div className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
            {activeVisitsCount} activas · {sortedVisits.length} totales
          </div>
        </div>

        <div className="mt-3">
          <QuickFilterChips items={QUICK_FILTERS} selected={quickFilter} onChange={handleQuickFilter} />
        </div>

        <div className="mt-3 space-y-2">
          <input className="input h-11" value={draftFilters.search} placeholder="Buscar folio / cliente / teléfono / instrumento" onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} />

          <div className="grid grid-cols-2 gap-2">
            <select className="input h-11" value={draftFilters.statusId} onChange={(event) => setDraftFilters((current) => ({ ...current, statusId: event.target.value }))}>
              <option value="">Estatus</option>
              {(statusesQuery.data || []).map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
            </select>
            <select className="input h-11" value={draftFilters.isActive} onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as VisitFilters['isActive'] }))}>
              <option value="true">Activas</option>
              <option value="">Todas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>

          <button type="button" className="btn-secondary h-10 w-full justify-center text-xs" onClick={() => setShowAdvancedFilters((current) => !current)}>
            {showAdvancedFilters ? 'Ocultar filtros avanzados' : 'Más filtros'}
          </button>

          {showAdvancedFilters ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select className="input h-11" value={draftFilters.branchId} onChange={(event) => setDraftFilters((current) => ({ ...current, branchId: event.target.value }))}>
                <option value="">Sucursal</option>
                {(branchesQuery.data || []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>

              <select className="input h-11" value={draftFilters.clientId} onChange={(event) => setDraftFilters((current) => ({ ...current, clientId: event.target.value, instrumentId: '' }))}>
                <option value="">Cliente</option>
                {(clientsQuery.data || []).map((client) => <option key={client.id} value={client.id}>{client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.phone || client.id}</option>)}
              </select>

              <select className="input h-11" value={draftFilters.instrumentId} onChange={(event) => setDraftFilters((current) => ({ ...current, instrumentId: event.target.value }))}>
                <option value="">Instrumento</option>
                {(instrumentsQuery.data || []).map((instrument) => <option key={instrument.id} value={instrument.id}>{instrument.name || instrument.model || instrument.id}</option>)}
              </select>

              <input className="input h-11" placeholder="Creado por userId" value={draftFilters.createdByUserId} onChange={(event) => setDraftFilters((current) => ({ ...current, createdByUserId: event.target.value }))} />

              <input className="input h-11" type="date" value={toInputDate(draftFilters.openedFrom)} onChange={(event) => setDraftFilters((current) => ({ ...current, openedFrom: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' }))} />

              <input className="input h-11" type="date" value={toInputDate(draftFilters.openedTo)} onChange={(event) => setDraftFilters((current) => ({ ...current, openedTo: event.target.value ? `${event.target.value}T23:59:59.999Z` : '' }))} />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-primary h-11 justify-center" onClick={() => applyFilters()}>Aplicar</button>
            <button type="button" className="btn-secondary h-11 justify-center" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>
      </section>

      {visitsQuery.isLoading ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="card animate-pulse p-4">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-5 w-40 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-32 rounded bg-slate-100" />
              <div className="mt-4 h-14 rounded bg-slate-100" />
            </div>
          ))}
        </section>
      ) : null}
      {visitsQuery.isError ? <section className="card p-4 text-sm text-red-700">No se pudieron cargar las visitas. Reintenta.</section> : null}
      {!sortedVisits.length && !visitsQuery.isLoading ? <section className="card p-4 text-sm text-slate-500">No hay órdenes para estos filtros. Prueba “Todas” o cambia la fecha.</section> : null}

      {!!sortedVisits.length ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedVisits.map((visit) => <VisitCard key={visit.id} visit={visit} />)}
        </section>
      ) : null}

      {!visitsQuery.isLoading && sortedVisits.length > 0 ? (
        <p className="px-1 text-xs text-slate-500">Última actualización de datos: {dateTime(new Date())}</p>
      ) : null}
    </div>
  );
}
