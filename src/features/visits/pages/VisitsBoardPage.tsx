import { Link } from 'react-router-dom';
import { currency, dateTime } from '@/lib/utils';
import type { VisitCard } from '@/types/visit';

const visits: VisitCard[] = [
  {
    id: '1',
    folio: 'BUJ-0001',
    clientName: 'Ricardo Pérez',
    instrumentName: 'Fender Jazz Bass',
    status: 'IN_PROGRESS',
    total: 650,
    createdAt: new Date().toISOString(),
    branchName: 'Texcoco Centro',
  },
  {
    id: '2',
    folio: 'BUJ-0002',
    clientName: 'Andrea López',
    instrumentName: 'Squier Telecaster',
    status: 'RECEIVED',
    total: 500,
    createdAt: new Date().toISOString(),
    branchName: 'Texcoco Centro',
  },
  {
    id: '3',
    folio: 'BUJ-0003',
    clientName: 'Luis García',
    instrumentName: 'Ibanez SR305',
    status: 'READY',
    total: 900,
    createdAt: new Date().toISOString(),
    branchName: 'Texcoco Centro',
  },
];

function statusLabel(status: VisitCard['status']) {
  const map = {
    RECEIVED: 'Recibido',
    IN_PROGRESS: 'En proceso',
    PAUSED: 'Pausado',
    READY: 'Listo',
    DELIVERED: 'Entregado',
  };
  return map[status];
}

function statusClass(status: VisitCard['status']) {
  const map = {
    RECEIVED: 'bg-sky-50 text-sky-700',
    IN_PROGRESS: 'bg-amber-50 text-amber-700',
    PAUSED: 'bg-slate-100 text-slate-700',
    READY: 'bg-emerald-50 text-emerald-700',
    DELIVERED: 'bg-violet-50 text-violet-700',
  };
  return map[status];
}

export function VisitsBoardPage() {
  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="section-title">Órdenes activas</h1>
            <p className="mt-1 text-sm text-slate-500">Tablero rápido para mover estatus y entrar a detalle.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="input" placeholder="Buscar por folio, cliente o instrumento" />
            <select className="input">
              <option>Estatus</option>
            </select>
            <select className="input">
              <option>Sucursal</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {visits.map((visit) => (
          <article key={visit.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{visit.folio}</div>
                <h2 className="mt-1 text-lg font-semibold">{visit.instrumentName}</h2>
                <div className="mt-1 text-sm text-slate-500">{visit.clientName}</div>
              </div>
              <span className={`chip ${statusClass(visit.status)}`}>{statusLabel(visit.status)}</span>
            </div>

            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <dt>Sucursal</dt>
                <dd>{visit.branchName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Fecha</dt>
                <dd>{dateTime(visit.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Total</dt>
                <dd className="font-semibold text-slate-900">{currency(visit.total)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              <button className="btn-secondary flex-1">Cambiar estatus</button>
              <Link className="btn-primary flex-1 text-center" to={`/app/visits/${visit.id}`}>
                Ver detalle
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
