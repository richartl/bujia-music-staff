export function CatalogsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[
        'Marcas',
        'Colores',
        'Tipos de instrumento',
        'Servicios del taller',
      ].map((name) => (
        <article key={name} className="card p-5">
          <h2 className="section-title">{name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Aquí va la administración rápida de catálogos que sí le sirven al staff del taller.
          </p>
          <button className="btn-secondary mt-4">Abrir</button>
        </article>
      ))}
    </div>
  );
}
