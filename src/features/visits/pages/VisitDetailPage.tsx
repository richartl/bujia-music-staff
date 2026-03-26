import { useParams } from 'react-router-dom';
import { currency, dateTime } from '@/lib/utils';

const mockVisit = {
  folio: 'BUJ-0001',
  clientName: 'Ricardo Pérez',
  instrumentName: 'Fender Jazz Bass',
  status: 'En proceso',
  total: 650,
  diagnosis: 'Requiere ajuste, limpieza profunda y cambio de cuerdas.',
  services: [
    { id: '1', name: 'Servicio básico', price: 500, quantity: 1, status: 'PENDING' },
    { id: '2', name: 'Cambio de cuerdas', price: 150, quantity: 1, status: 'DONE' },
  ],
  timeline: [
    { id: '1', type: 'RECEIVED', createdAt: new Date().toISOString(), note: 'Instrumento recibido en mostrador.' },
    { id: '2', type: 'NOTE', createdAt: new Date().toISOString(), note: 'Se detectó jack flojo durante revisión.' },
  ],
};

export function VisitDetailPage() {
  const { visitId } = useParams();

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <article className="card p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{mockVisit.folio}</div>
              <h1 className="mt-1 text-2xl font-bold">{mockVisit.instrumentName}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {mockVisit.clientName} · ID interno demo: {visitId}
              </p>
            </div>
            <button className="btn-primary">Cambiar estatus</button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Estatus</div>
              <div className="mt-1 font-semibold">{mockVisit.status}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Total</div>
              <div className="mt-1 font-semibold">{currency(mockVisit.total)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Diagnóstico</div>
              <div className="mt-1 text-sm">{mockVisit.diagnosis}</div>
            </div>
          </div>
        </article>

        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Servicios</h2>
            <button className="btn-secondary">Agregar servicio</button>
          </div>

          <div className="mt-4 space-y-3">
            {mockVisit.services.map((service) => (
              <div key={service.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-slate-500">Cantidad: {service.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{currency(service.price)}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">{service.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <aside className="space-y-4">
        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Timeline</h2>
            <button className="btn-secondary">Agregar nota</button>
          </div>

          <div className="mt-4 space-y-3">
            {mockVisit.timeline.map((event) => (
              <div key={event.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{event.type}</div>
                <div className="mt-2 text-sm text-slate-700">{event.note}</div>
                <div className="mt-2 text-xs text-slate-500">{dateTime(event.createdAt)}</div>
              </div>
            ))}
          </div>
        </article>
      </aside>
    </div>
  );
}
