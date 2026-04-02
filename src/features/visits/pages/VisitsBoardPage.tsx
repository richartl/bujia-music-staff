import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { currency, dateTime } from '@/lib/utils';
import { getWorkshopVisitStatuses, getWorkshopVisitsWithFilters } from '../api/visitsApi';
import { getClientInstruments, getWorkshopBranches, getWorkshopClients } from '../api/workshopCatalogsApi';
import type { VisitFilters } from '../api/types';

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

function statusColor(color?: string | null) {
  return color || '#0f172a';
}

function toInputDate(iso?: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
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

  const filteredVisits = useMemo(() => visitsQuery.data || [], [visitsQuery.data]);

  function applyFilters() {
    const entries = Object.entries(draftFilters).filter(([, value]) => value !== '');
    setSearchParams(new URLSearchParams(entries as Array<[string, string]>));
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setSearchParams(new URLSearchParams({ isActive: 'true' }));
  }

  return (
    <div className="space-y-3">
      <section className="card p-4">
        <h1 className="section-title">Visitas del taller</h1>
        <p className="mt-1 text-sm text-slate-500">Listado global activo, pensado para operación diaria rápida.</p>

        <div className="mt-3 space-y-2">
          <input className="input h-11" value={draftFilters.search} placeholder="Buscar folio / cliente / teléfono / modelo / color" onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <select className="input h-11" value={draftFilters.statusId} onChange={(event) => setDraftFilters((current) => ({ ...current, statusId: event.target.value }))}>
              <option value="">Status</option>
              {(statusesQuery.data || []).map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
            </select>
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
            <select className="input h-11" value={draftFilters.isActive} onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as VisitFilters['isActive'] }))}>
              <option value="true">Solo activas</option>
              <option value="false">Solo inactivas</option>
              <option value="">Todas</option>
            </select>
            <input className="input h-11" type="date" value={toInputDate(draftFilters.openedFrom)} onChange={(event) => setDraftFilters((current) => ({ ...current, openedFrom: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' }))} />
            <input className="input h-11" type="date" value={toInputDate(draftFilters.openedTo)} onChange={(event) => setDraftFilters((current) => ({ ...current, openedTo: event.target.value ? `${event.target.value}T23:59:59.999Z` : '' }))} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-primary h-11 justify-center" onClick={applyFilters}>Aplicar</button>
            <button type="button" className="btn-secondary h-11 justify-center" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>
      </section>

      {visitsQuery.isLoading ? <section className="card p-4 text-sm text-slate-500">Cargando visitas…</section> : null}
      {visitsQuery.isError ? <section className="card p-4 text-sm text-red-700">No se pudo cargar visitas. Reintenta.</section> : null}
      {!filteredVisits.length && !visitsQuery.isLoading ? <section className="card p-4 text-sm text-slate-500">No hay visitas para estos filtros.</section> : null}

      <section className="grid gap-3">
        {filteredVisits.map((visit) => (
          <Link key={visit.id} to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`} className="card block p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{visit.folio}</p>
                <h3 className="text-base font-semibold text-slate-900">{visit.instrument?.name || 'Instrumento'}</h3>
                <p className="text-sm text-slate-500">{visit.client?.fullName || 'Cliente sin nombre'} {visit.client?.phone ? `· ${visit.client.phone}` : ''}</p>
              </div>
              <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: `${statusColor(visit.status?.color)}22`, color: statusColor(visit.status?.color) }}>
                {visit.status?.name || 'Sin estatus'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <p className="text-slate-500">Total</p>
              <p className="text-right font-semibold text-slate-900">{currency(Number(visit.total || 0))}</p>
              <p className="text-slate-500">Apertura</p>
              <p className="text-right text-slate-700">{visit.openedAt ? dateTime(visit.openedAt) : '-'}</p>
              <p className="text-slate-500">Modelo / Color</p>
              <p className="text-right text-slate-700">{visit.instrument?.model || '-'} {visit.instrument?.colorName ? `· ${visit.instrument.colorName}` : ''}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
