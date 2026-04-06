import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { dateTime } from '@/lib/utils';
import { authStore } from '@/stores/auth-store';
import { QuickFilterChips } from '../components/QuickFilterChips';
import { VisitsViewSwitcher } from '../components/VisitsViewSwitcher';
import { VisitCard } from '../components/VisitCard';
import { getWorkshopVisitStatuses, getWorkshopVisitsWithFilters } from '../api/visitsApi';
import { getClientInstruments, getWorkshopBranches, getWorkshopClients } from '../api/workshopCatalogsApi';
import type { VisitFilters, VisitStatusCatalog } from '../api/types';

const EMPTY_FILTERS: VisitFilters = {
  search: '',
  statusId: '',
  statusCode: '',
  createdByUserId: '',
  branchId: '',
  clientId: '',
  instrumentId: '',
  isActive: 'true',
  isArchived: '',
  page: '',
  limit: '',
  openedFrom: '',
  openedTo: '',
};

const BASE_QUICK_FILTERS = [
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

function toUrlSearchParams(filters: VisitFilters) {
  const entries = Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null);
  return new URLSearchParams(entries as Array<[string, string]>);
}

function detectQuickFilter(filters: VisitFilters, statuses: VisitStatusCatalog[]) {
  if (filters.isActive === 'true' && !filters.statusId && !filters.openedFrom && !filters.openedTo) return 'active';
  if (!filters.isActive && !filters.statusId && !filters.openedFrom && !filters.openedTo) return 'all';

  const selectedStatus = statuses.find((status) => status.id === filters.statusId);
  if (selectedStatus) {
    const lowered = selectedStatus.name.toLowerCase();
    if (lowered.includes('entreg')) return 'delivered';
    if (lowered.includes('pend')) return 'pending';
    return `status:${selectedStatus.id}`;
  }

  const todayStart = getStartOfTodayIso().slice(0, 10);
  const todayEnd = getEndOfTodayIso().slice(0, 10);
  if (filters.openedFrom.slice(0, 10) === todayStart && filters.openedTo.slice(0, 10) === todayEnd) return 'today';

  return 'all';
}

export function VisitsListPage() {
  const workshopId = authStore((state) => state.workshopId);
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFilters: VisitFilters = {
    search: searchParams.get('search') || '',
    statusId: searchParams.get('statusId') || '',
    statusCode: searchParams.get('statusCode') || '',
    createdByUserId: searchParams.get('createdByUserId') || '',
    branchId: searchParams.get('branchId') || '',
    clientId: searchParams.get('clientId') || '',
    instrumentId: searchParams.get('instrumentId') || '',
    isActive: (searchParams.get('isActive') as VisitFilters['isActive']) || 'true',
    isArchived: (searchParams.get('isArchived') as VisitFilters['isArchived']) || '',
    page: searchParams.get('page') || '',
    limit: searchParams.get('limit') || '',
    openedFrom: searchParams.get('openedFrom') || '',
    openedTo: searchParams.get('openedTo') || '',
  };

  const [filters, setFilters] = useState<VisitFilters>(urlFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  useEffect(() => {
    setFilters(urlFilters);
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
    queryKey: ['visit-clients', workshopId, filters.search],
    queryFn: () => getWorkshopClients(workshopId!, { search: filters.search, page: 1, limit: 30, isActive: true }),
    enabled: !!workshopId,
  });

  const instrumentsQuery = useQuery({
    queryKey: ['visit-client-instruments-filter', workshopId, filters.clientId],
    queryFn: () => getClientInstruments(workshopId!, filters.clientId),
    enabled: !!workshopId && !!filters.clientId,
  });

  const quickFilterItems = useMemo(
    () => [
      ...BASE_QUICK_FILTERS,
      ...(statusesQuery.data || []).map((status) => ({
        label: status.name,
        value: `status:${status.id}`,
      })),
    ],
    [statusesQuery.data],
  );

  const sortedVisits = useMemo(() => {
    const visits = visitsQuery.data || [];
    return [...visits].sort((a, b) => {
      if (Boolean(a.isActive) !== Boolean(b.isActive)) {
        return a.isActive ? -1 : 1;
      }
      const aDate = new Date(a.openedAt || a.closedAt || 0).getTime();
      const bDate = new Date(b.openedAt || b.closedAt || 0).getTime();
      return aDate - bDate;
    });
  }, [visitsQuery.data]);

  const quickFilter = useMemo(
    () => detectQuickFilter(urlFilters, statusesQuery.data || []),
    [urlFilters, statusesQuery.data],
  );

  const activeVisitsCount = useMemo(
    () => (visitsQuery.data || []).filter((visit) => visit.isActive).length,
    [visitsQuery.data],
  );

  function applyImmediate(next: VisitFilters) {
    setFilters(next);
    setSearchParams(toUrlSearchParams(next));
  }

  function updateImmediate<K extends keyof VisitFilters>(key: K, value: VisitFilters[K]) {
    const next = { ...filters, [key]: value };
    applyImmediate(next);
  }

  useEffect(() => {
    const current = (urlFilters.search || '').trim();
    if (debouncedSearch === current) return;
    const next = { ...filters, search: debouncedSearch };
    setSearchParams(toUrlSearchParams(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function clearFilters() {
    const next = { ...EMPTY_FILTERS, isActive: 'true' as const };
    applyImmediate(next);
  }

  function findStatusIdByKeyword(keyword: 'pend' | 'entreg') {
    return (statusesQuery.data || []).find((status) => status.name.toLowerCase().includes(keyword))?.id || '';
  }

  function handleQuickFilter(value: string) {
    const next = { ...filters };

    if (value === 'active') {
      next.isActive = 'true';
      next.statusId = '';
      next.openedFrom = '';
      next.openedTo = '';
    } else if (value === 'all') {
      next.isActive = '';
      next.statusId = '';
      next.openedFrom = '';
      next.openedTo = '';
    } else if (value === 'today') {
      next.isActive = '';
      next.statusId = '';
      next.openedFrom = getStartOfTodayIso();
      next.openedTo = getEndOfTodayIso();
    } else if (value === 'pending') {
      next.isActive = '';
      next.statusId = findStatusIdByKeyword('pend');
      next.openedFrom = '';
      next.openedTo = '';
    } else if (value === 'delivered') {
      next.isActive = 'false';
      next.statusId = findStatusIdByKeyword('entreg');
      next.openedFrom = '';
      next.openedTo = '';
    } else if (value.startsWith('status:')) {
      next.isActive = '';
      next.statusId = value.replace('status:', '');
      next.openedFrom = '';
      next.openedTo = '';
    }

    applyImmediate(next);
  }

  return (
    <div className="space-y-3 pb-6">
      <VisitsViewSwitcher current="list" />

      <section className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title">Intakes / órdenes de trabajo</h1>
            <p className="mt-1 text-sm text-slate-500">Lista operativa para revisar rápido qué visita sigue activa y qué ya está lista.</p>
          </div>
          <div className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
            {activeVisitsCount} activas · {sortedVisits.length} totales
          </div>
        </div>

        <div className="mt-3">
          <QuickFilterChips items={quickFilterItems} selected={quickFilter} onChange={handleQuickFilter} />
        </div>

        <div className="mt-3 space-y-2">
          <input
            className="input h-11"
            value={filters.search}
            placeholder="Buscar folio, cliente, teléfono, modelo o color"
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <select className="input h-11" value={filters.statusId} onChange={(event) => updateImmediate('statusId', event.target.value)}>
              <option value="">Estatus</option>
              {(statusesQuery.data || []).map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
            </select>
            <select className="input h-11" value={filters.isActive} onChange={(event) => updateImmediate('isActive', event.target.value as VisitFilters['isActive'])}>
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
              <select className="input h-11" value={filters.branchId} onChange={(event) => updateImmediate('branchId', event.target.value)}>
                <option value="">Sucursal</option>
                {(branchesQuery.data || []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>

              <select className="input h-11" value={filters.clientId} onChange={(event) => applyImmediate({ ...filters, clientId: event.target.value, instrumentId: '' })}>
                <option value="">Cliente</option>
                {(clientsQuery.data || []).map((client) => <option key={client.id} value={client.id}>{client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.phone || client.id}</option>)}
              </select>

              <select className="input h-11" value={filters.instrumentId} onChange={(event) => updateImmediate('instrumentId', event.target.value)}>
                <option value="">Instrumento</option>
                {(instrumentsQuery.data || []).map((instrument) => <option key={instrument.id} value={instrument.id}>{instrument.name || instrument.model || instrument.id}</option>)}
              </select>

              <input className="input h-11" placeholder="Creado por userId" value={filters.createdByUserId} onChange={(event) => updateImmediate('createdByUserId', event.target.value)} />

              <input className="input h-11" type="date" value={toInputDate(filters.openedFrom)} onChange={(event) => updateImmediate('openedFrom', event.target.value ? `${event.target.value}T00:00:00.000Z` : '')} />

              <input className="input h-11" type="date" value={toInputDate(filters.openedTo)} onChange={(event) => updateImmediate('openedTo', event.target.value ? `${event.target.value}T23:59:59.999Z` : '')} />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2">
            <button type="button" className="btn-secondary h-11 justify-center" onClick={clearFilters}>Limpiar filtros</button>
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
      {!sortedVisits.length && !visitsQuery.isLoading ? <section className="card p-4 text-sm text-slate-500">No hay órdenes para estos filtros. Prueba “Todas” o ajusta la búsqueda.</section> : null}

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
