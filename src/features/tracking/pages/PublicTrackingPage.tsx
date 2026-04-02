import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { dateTime } from '@/lib/utils';
import { getPublicTracking } from '@/features/visits/api/trackingApi';
import type { NoteAttachment } from '@/features/visits/api/types';

export function PublicTrackingPage() {
  const { token = '' } = useParams();

  const trackingQuery = useQuery({
    queryKey: ['public-tracking', token],
    queryFn: () => getPublicTracking(token),
    enabled: !!token,
  });

  if (trackingQuery.isLoading) {
    return <div className="mx-auto max-w-2xl p-4 text-sm text-slate-500">Cargando tracking…</div>;
  }

  if (trackingQuery.isError || !trackingQuery.data) {
    return <div className="mx-auto max-w-2xl p-4 text-sm text-red-700">No fue posible cargar este tracking público.</div>;
  }

  const data = trackingQuery.data;
  const timeline = (data.timeline || []).filter((event) => event.isPublic !== false);

  return (
    <main className="mx-auto max-w-2xl space-y-3 p-3">
      <section className="card p-4">
        <h1 className="text-lg font-semibold text-slate-900">Tracking de tu instrumento</h1>
        <p className="mt-1 text-sm text-slate-600">{data.workshop?.name} · {data.branch?.name || 'Sucursal'}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="text-slate-500">Cliente</p>
          <p className="text-right text-slate-800">{data.client?.name || '-'}</p>
          <p className="text-slate-500">Instrumento</p>
          <p className="text-right text-slate-800">{data.instrument?.name || '-'}</p>
          <p className="text-slate-500">Estado</p>
          <p className="text-right text-slate-800">{data.status?.name || '-'}</p>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-800">Timeline público</h2>
        <div className="mt-2 space-y-2">
          {timeline.map((event) => (
            <article key={`${event.eventType}-${event.occurredAt}-${event.title}`} className="rounded-lg border border-slate-200 p-2">
              <p className="text-xs font-semibold text-slate-500">{event.eventType}</p>
              <p className="text-sm text-slate-800">{event.title || event.description || 'Actualización'}</p>
              <p className="text-xs text-slate-500">{event.occurredAt ? dateTime(event.occurredAt) : '-'}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-800">Servicios visibles</h2>
        <div className="mt-2 space-y-2">
          {(data.services || []).map((service) => (
            <article key={service.id} className="rounded-lg border border-slate-200 p-2">
              <p className="text-sm font-medium text-slate-900">{service.name || 'Servicio'}</p>
              {(service.serviceNotes || []).map((note) => (
                <div key={note.id} className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-700">
                  <p>{note.note}</p>
                  {(note.attachments || []).filter((a) => !!a.publicUrl).map((attachment) => (
                    <div key={attachment.id} className="mt-1">
                      <PublicAttachmentPreview attachment={attachment} />
                    </div>
                  ))}
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function PublicAttachmentPreview({ attachment }: { attachment: NoteAttachment }) {
  const url = attachment.publicUrl || attachment.url || '';
  const mimeType = attachment.mimeType || '';
  if (!url) return null;
  if (mimeType.startsWith('image/')) {
    return <img src={url} alt={attachment.originalName || 'adjunto'} className="h-20 w-20 rounded object-cover" />;
  }
  if (mimeType.startsWith('video/')) {
    return <video src={url} controls className="h-24 w-full rounded object-cover" />;
  }
  if (mimeType.startsWith('audio/')) {
    return <audio src={url} controls className="h-8 w-full" />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-sky-700">
      {attachment.originalName || 'Adjunto'}
    </a>
  );
}
