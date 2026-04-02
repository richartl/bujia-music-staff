import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { dateTime } from '@/lib/utils';
import { getPublicTracking } from '@/features/visits/api/trackingApi';
import type { NoteAttachment } from '@/features/visits/api/types';

export function PublicTrackingPage() {
  const { token = '' } = useParams();
  const [preview, setPreview] = useState<{ url: string; mimeType: string; name: string } | null>(null);

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
  const timeline = (data.timeline || [])
    .filter((event) => event.isPublic !== false)
    .sort((a, b) => new Date(b.occurredAt || 0).getTime() - new Date(a.occurredAt || 0).getTime());
  const clientName = data.client?.name || data.visit?.client?.fullName || [data.visit?.client?.firstName, data.visit?.client?.lastName].filter(Boolean).join(' ') || '-';
  const instrumentName = data.instrument?.name || data.visit?.instrument?.name || '-';
  const currentStatus = data.status?.name || data.visit?.status?.name || '-';
  const statusColors = getStatusColors(data.status?.color || data.visit?.status?.color);

  return (
    <main className="mx-auto max-w-2xl space-y-3 p-3">
      <section className={`card border p-4 ${statusColors.container}`}>
        <h1 className="text-lg font-semibold text-slate-900">Tracking de tu instrumento</h1>
        <p className="mt-1 text-sm text-slate-600">{data.workshop?.name} · {data.branch?.name || 'Sucursal'}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="text-slate-500">Cliente</p>
          <p className="text-right font-medium text-slate-800">{clientName}</p>
          <p className="text-slate-500">Instrumento</p>
          <p className="text-right font-medium text-slate-800">{instrumentName}</p>
          <p className="text-slate-500">Estado</p>
          <p className="text-right">
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors.badge}`}
              style={statusColors.customColor ? { backgroundColor: statusColors.customColor, color: '#ffffff' } : undefined}
            >
              {currentStatus}
            </span>
          </p>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-800">Timeline público (más reciente primero)</h2>
        <div className="mt-2 space-y-2">
          {timeline.map((event) => (
            <article key={`${event.eventType}-${event.occurredAt}-${event.title}`} className={`rounded-lg border p-2 ${getEventColors(event.eventType)}`}>
              <p className="text-xs font-semibold text-slate-600">{event.eventType}</p>
              <p className="text-sm text-slate-800">{event.title || event.description || 'Actualización'}</p>
              <p className="text-xs text-slate-500">{event.occurredAt ? dateTime(event.occurredAt) : '-'}</p>
              <div className="mt-2 space-y-1">
                {extractTimelineAttachments(event.metadata).map((attachment) => (
                  <div key={attachment.id || `${attachment.publicUrl}-${attachment.originalName}`} className="rounded bg-white/70 p-2">
                    <PublicAttachmentPreview attachment={attachment} onOpen={setPreview} inlinePlayable />
                  </div>
                ))}
              </div>
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
                  {(note.attachments || []).filter((a) => !!a.publicUrl || !!a.url).map((attachment) => (
                    <div key={attachment.id} className="mt-1">
                      <PublicAttachmentPreview attachment={attachment} onOpen={setPreview} inlinePlayable />
                    </div>
                  ))}
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-3">
            <p className="truncate text-sm font-medium text-slate-800">{preview.name}</p>
            <div className="mt-2">
              {preview.mimeType.startsWith('image/') ? (
                <img src={preview.url} alt={preview.name} className="max-h-[70vh] w-full rounded object-contain" />
              ) : preview.mimeType.startsWith('video/') ? (
                <video src={preview.url} controls className="max-h-[70vh] w-full rounded object-contain" />
              ) : preview.mimeType.startsWith('audio/') ? (
                <audio src={preview.url} controls className="w-full" />
              ) : (
                <a href={preview.url} target="_blank" rel="noreferrer" className="text-sky-700">Abrir archivo</a>
              )}
            </div>
            <button type="button" className="btn-secondary mt-3 h-10 w-full justify-center" onClick={() => setPreview(null)}>Cerrar</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function detectMimeType(attachment: NoteAttachment) {
  if (attachment.mimeType) return attachment.mimeType;
  const name = (attachment.originalName || '').toLowerCase();
  if (/(png|jpg|jpeg|gif|webp)$/.test(name)) return 'image/*';
  if (/(mp4|mov|webm|m4v)$/.test(name)) return 'video/*';
  if (/(mp3|wav|ogg|m4a|aac)$/.test(name)) return 'audio/*';
  return '';
}

function getStatusColors(statusColor?: string | null) {
  if (!statusColor) return { container: 'border-slate-200 bg-white', badge: 'bg-slate-100 text-slate-700', customColor: null };
  return {
    container: 'border-slate-200 bg-white',
    badge: '',
    customColor: statusColor,
  };
}

function getEventColors(eventType: string) {
  const normalized = eventType.toUpperCase();
  if (normalized.includes('ENTRADA') || normalized.includes('RECEPCION')) return 'border-cyan-200 bg-cyan-50/70';
  if (normalized.includes('DIAGNOST')) return 'border-violet-200 bg-violet-50/70';
  if (normalized.includes('PROCESO') || normalized.includes('SERVICIO')) return 'border-sky-200 bg-sky-50/70';
  if (normalized.includes('LISTO') || normalized.includes('FINALIZ')) return 'border-emerald-200 bg-emerald-50/70';
  if (normalized.includes('ENTREGA') || normalized.includes('CERR')) return 'border-green-200 bg-green-50/70';
  if (normalized.includes('CANCEL')) return 'border-rose-200 bg-rose-50/70';
  return 'border-slate-200 bg-slate-50/70';
}

function extractTimelineAttachments(metadata?: Record<string, unknown>) {
  if (!metadata) return [];
  const rawAttachments =
    (Array.isArray(metadata.attachments) ? metadata.attachments : null) ||
    (Array.isArray(metadata.files) ? metadata.files : null) ||
    [];
  return rawAttachments
    .map((item, index) => normalizeAttachment(item, index))
    .filter((attachment): attachment is NoteAttachment => !!attachment && !!(attachment.publicUrl || attachment.url));
}

function normalizeAttachment(input: unknown, index: number): NoteAttachment | null {
  if (!input || typeof input !== 'object') return null;
  const item = input as Record<string, unknown>;
  const rawUrl = item.publicUrl || item.url || item.fileUrl || item.signedUrl;
  const url = typeof rawUrl === 'string' ? rawUrl : '';
  if (!url) return null;
  const mimeType = typeof item.mimeType === 'string' ? item.mimeType : undefined;
  const originalName = typeof item.originalName === 'string'
    ? item.originalName
    : typeof item.name === 'string'
      ? item.name
      : `Adjunto ${index + 1}`;
  return {
    id: typeof item.id === 'string' ? item.id : `${originalName}-${index}`,
    publicUrl: url,
    url,
    mimeType,
    originalName,
  };
}

function PublicAttachmentPreview({ attachment, onOpen, inlinePlayable = false }: { attachment: NoteAttachment; onOpen: (payload: { url: string; mimeType: string; name: string }) => void; inlinePlayable?: boolean }) {
  const url = attachment.publicUrl || attachment.url || '';
  const mimeType = detectMimeType(attachment);
  if (!url) return null;
  const open = () => onOpen({ url, mimeType, name: attachment.originalName || 'Adjunto' });
  if (mimeType.startsWith('image/')) {
    return <button type="button" onClick={open}><img src={url} alt={attachment.originalName || 'adjunto'} className="h-20 w-20 rounded object-cover" /></button>;
  }
  if (mimeType.startsWith('video/')) {
    return (
      <div className="space-y-1">
        {inlinePlayable ? <video src={url} controls className="h-32 w-full rounded object-cover" /> : null}
        <button type="button" onClick={open}><video src={url} className="h-24 w-full rounded object-cover" /></button>
      </div>
    );
  }
  if (mimeType.startsWith('audio/')) {
    return (
      <div className="space-y-1">
        {inlinePlayable ? <audio src={url} controls className="w-full" /> : null}
        <button type="button" onClick={open} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">🎤 Escuchar nota</button>
      </div>
    );
  }
  return (
    <button type="button" onClick={open} className="text-sky-700">{attachment.originalName || 'Adjunto'}</button>
  );
}
