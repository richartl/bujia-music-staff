import { ClipboardList, Clock3, Guitar, Wrench } from 'lucide-react';

const stats = [
  { label: 'Recepciones hoy', value: '12', icon: ClipboardList },
  { label: 'En proceso', value: '18', icon: Wrench },
  { label: 'Listos para entregar', value: '4', icon: Guitar },
  { label: 'Pendientes de nota', value: '7', icon: Clock3 },
];

export function DashboardPage() {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <article key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{label}</div>
                <div className="mt-2 text-3xl font-bold">{value}</div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article className="card p-5">
          <h2 className="section-title">Cola rápida de mostrador</h2>
          <div className="mt-4 grid gap-3">
            {[
              'Recepción nueva',
              'Buscar cliente por teléfono',
              'Actualizar estatus',
              'Agregar nota interna',
            ].map((item) => (
              <button key={item} className="btn-secondary justify-start">
                {item}
              </button>
            ))}
          </div>
        </article>

        <article className="card p-5">
          <h2 className="section-title">Pendientes importantes</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-4">5 instrumentos llevan más de 7 días sin movimiento.</div>
            <div className="rounded-xl bg-slate-50 p-4">2 órdenes requieren autorización de refacciones.</div>
            <div className="rounded-xl bg-slate-50 p-4">3 entregas programadas para hoy.</div>
          </div>
        </article>
      </section>
    </div>
  );
}
