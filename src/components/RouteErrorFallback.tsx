import { useRouteError, Link } from 'react-router-dom';

export function RouteErrorFallback() {
  const error = useRouteError() as { message?: string } | null;
  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="card p-5">
        <h1 className="text-lg font-semibold text-slate-900">Ups, ocurrió un error</h1>
        <p className="mt-2 text-sm text-slate-600">{error?.message || 'No pudimos cargar esta vista.'}</p>
        <Link to="/app/visits" className="btn-primary mt-4 inline-flex">Volver a visitas</Link>
      </div>
    </main>
  );
}
