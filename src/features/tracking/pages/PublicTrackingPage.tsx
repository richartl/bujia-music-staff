import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { currency, cn, dateTime } from '@/lib/utils';
import { getPublicTracking } from '@/features/visits/api/trackingApi';
import { getTimelineEventIcon, getTimelineEventTone } from '@/features/visits/utils/timelineEventIcon';
import { PaymentAttachmentGallery } from '@/features/visits/components/PaymentAttachmentGallery';
import { getTimelinePaymentAttachments } from '@/features/visits/utils/paymentAttachments';
import { WorkshopAvatar } from '@/components/avatars/WorkshopAvatar';
import { UserAvatar } from '@/components/avatars/UserAvatar';
import type { NoteAttachment, TrackingResponse, VisitServiceNote, VisitTimelineEvent } from '@/features/visits/api/types';

export function PublicTrackingPage() {
  const { token = '' } = useParams();
  const [preview, setPreview] = useState<{ url: string; mimeType: string; name: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<VisitTimelineEvent | null>(null);

  const trackingQuery = useQuery({
    queryKey: ['public-tracking', token],
    queryFn: () => getPublicTracking(token),
    enabled: !!token,
  });

  useEffect(() => {
    if (!selectedEvent) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedEvent(null);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [selectedEvent]);

  if (trackingQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (trackingQuery.isError || !trackingQuery.data) {
    return <div className="mx-auto max-w-2xl p-4 text-sm text-red-700">No fue posible cargar este tracking público.</div>;
  }

  const data = trackingQuery.data;
  const timeline = (data.timeline || [])
    .filter((event) => shouldDisplayInPublicTimeline(event))
    .sort((a, b) => new Date(b.occurredAt || 0).getTime() - new Date(a.occurredAt || 0).getTime());

  const clientName =
    data.client?.displayName ||
    data.client?.name ||
    data.visit?.client?.fullName ||
    [data.visit?.client?.firstName, data.visit?.client?.lastName].filter(Boolean).join(' ') ||
    '-';

  const instrumentName = buildInstrumentDisplayName(data) || data.instrument?.name || data.visit?.instrument?.name || '-';
  const currentStatus = data.status?.name || data.visit?.status?.name || '-';
  const statusColors = getStatusColors(data.status?.color || data.visit?.status?.color);
  const heroGradient = getSoftGradient((data.status?.color || data.visit?.status?.color) ?? undefined);
  const totals = getFinancialSummary(data);

  return (
    <main className="mx-auto max-w-3xl space-y-4 bg-slate-950 p-3 pb-8 text-slate-100 sm:rounded-2xl sm:border sm:border-slate-800 sm:shadow-2xl">
      <section className="overflow-hidden rounded-2xl border border-slate-700 shadow-lg">
        <div className="p-4" style={{ background: heroGradient }}>
          <h1 className="text-lg font-bold text-slate-100">Seguimiento de tu instrumento</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
            <WorkshopAvatar name={data.workshop?.name} profileImageUrl={data.workshop?.profileImageUrl} logoUrl={data.workshop?.logoUrl} size="sm" />
            <span className="truncate">{data.workshop?.name} · {data.branch?.name || 'Sucursal'}</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <InfoPill label="Cliente" value={clientName} />
            <InfoPill label="Instrumento" value={instrumentName} />
            <div className="rounded-xl bg-slate-900/80 p-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Estado actual</p>
              <p className="mt-1">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors.badge}`} style={statusColors.customColor ? { backgroundColor: statusColors.customColor, color: '#ffffff' } : undefined}>
                  {currentStatus}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <MoneyPill label="Total servicios" value={totals.servicesTotal} />
            <MoneyPill label="Abonos" value={totals.paymentsTotal} />
            <MoneyPill label="Total orden" value={totals.visitTotal} emphasized />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-100">Historial de movimientos (más reciente primero)</h2>
        {!timeline.length ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 text-center text-sm text-slate-400">
            Aún no hay movimientos públicos para esta orden.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {timeline.map((event) => {
              const eventType = event.eventType || '';
              const paymentData =
                ((event.payment as Record<string, unknown> | undefined) ||
                  ((event.metadata as Record<string, unknown>)?.payment as Record<string, unknown> | undefined)) ||
                {};
              const paymentAmount = toNumberSafe((paymentData as Record<string, unknown>)?.amount);
              const paymentMethod = String((paymentData as Record<string, unknown>)?.method || (event.metadata as Record<string, unknown>)?.method || '');
              const paymentMediaIds = Array.isArray((paymentData as Record<string, unknown>)?.mediaIds)
                ? ((paymentData as Record<string, unknown>).mediaIds as string[])
                : [];
              const paymentAttachments = getTimelinePaymentAttachments(event);
              const eventNote = extractEventNoteContent(event);
              const isPaymentEvent = eventType.toUpperCase().includes('PAYMENT');

              return (
                <article
                  key={`${event.id || event.eventType}-${event.occurredAt}-${event.title}`}
                  className={cn('rounded-xl border p-3 shadow-sm transition hover:border-amber-400/40', getTimelineEventTone(eventType), 'border-slate-700/50 bg-slate-900/95')}
                  onDoubleClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-lg">
                      {getTimelineEventIcon(eventType)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{event.title || event.description || 'Actualización'}</p>
                          <p className="mt-1 text-[11px] font-medium text-slate-400">{event.occurredAt ? dateTime(event.occurredAt) : '-'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200"
                        >
                          Ver detalle
                        </button>
                      </div>

                      {event.description ? <p className="mt-1 text-xs text-slate-300">{event.description}</p> : null}

                      {isPaymentEvent ? (
                        <div className="mt-2 rounded-lg border border-emerald-700/60 bg-emerald-950/40 p-2 text-xs text-slate-200">
                          <p className="text-sm font-semibold text-emerald-300">{currency(paymentAmount || toNumberSafe((event.metadata as Record<string, unknown>)?.amount))}</p>
                          <p className="text-xs text-slate-300">{paymentMethod || 'Método no especificado'}</p>
                          {paymentMediaIds.length ? <p className="mt-1 text-xs text-slate-300">📎 {paymentMediaIds.length} evidencia(s)</p> : null}
                          {paymentAttachments.length ? (
                            <div className="mt-2">
                              <PaymentAttachmentGallery
                                attachments={paymentAttachments}
                                compact
                                onOpen={(attachment) => {
                                  if (!attachment.publicUrl) return;
                                  setPreview({ url: attachment.publicUrl, mimeType: attachment.mimeType || '', name: attachment.originalName });
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {eventNote ? (
                        <button
                          type="button"
                          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-left text-xs text-slate-200"
                          onClick={() => setSelectedEvent(event)}
                          onDoubleClick={() => setSelectedEvent(event)}
                        >
                          <p className="line-clamp-2">{eventNote}</p>
                          <p className="mt-1 text-[11px] text-slate-400">Toca para ver detalle completo</p>
                        </button>
                      ) : null}

                      {event.service?.name ? <p className="mt-1 text-xs text-slate-300">Servicio: {event.service.name}</p> : null}
                      {event.actor?.name ? (
                        <div className="mt-1 flex items-center gap-2">
                          <UserAvatar name={event.actor.name} profileImageUrl={event.actor.profileImageUrl} size="sm" />
                          <p className="text-xs text-slate-400">Actualizado por: {event.actor.name}</p>
                        </div>
                      ) : null}
                      <div className="mt-2 space-y-2">
                        {extractTimelineAttachments(event).map((attachment) => (
                          <div key={attachment.id || `${attachment.publicUrl}-${attachment.originalName}`} className="rounded-lg border border-slate-700 bg-slate-800 p-2">
                            <PublicAttachmentPreview attachment={attachment} onOpen={setPreview} inlinePlayable withName />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-100">Servicios visibles</h2>
        <div className="mt-3 space-y-3">
          {(data.services || []).map((service) => (
            <article key={service.id} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{service.name || 'Servicio'}</p>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: typeof service.status === 'object' && service.status?.color ? service.status.color : '#64748B' }}>
                  {typeof service.status === 'object' && service.status?.name ? service.status.name : 'Sin estado'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Cantidad: {service.quantity || 1}</p>
              {getServiceNotes(service).map((note) => (
                <div key={note.id} className="mt-2 rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-slate-200">
                  <p className="text-sm text-slate-100">{note.note}</p>
                  {(note.attachments || []).filter((a) => !!a.publicUrl || !!a.url).map((attachment) => (
                    <div key={attachment.id} className="mt-2 rounded border border-slate-600 bg-slate-900 p-2">
                      <PublicAttachmentPreview attachment={attachment} onOpen={setPreview} inlinePlayable withName />
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

      {selectedEvent ? (
        <TrackingEventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onOpenAttachment={setPreview} />
      ) : null}
    </main>
  );
}

function TrackingEventDetailModal({
  event,
  onClose,
  onOpenAttachment,
}: {
  event: VisitTimelineEvent;
  onClose: () => void;
  onOpenAttachment: (payload: { url: string; mimeType: string; name: string }) => void;
}) {
  const attachments = useMemo(() => extractTimelineAttachments(event), [event]);
  const content = extractEventNoteContent(event);

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Detalle del evento">
      <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col bg-slate-950 text-slate-100 sm:h-[90vh] sm:rounded-2xl sm:border sm:border-slate-700">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-950/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Detalle del evento</p>
            <h3 className="text-sm font-semibold text-slate-100">{event.title || event.eventType || 'Actualización'}</h3>
          </div>
          <button type="button" className="rounded-xl border border-amber-400 bg-amber-400/15 px-3 py-2 text-sm font-bold text-amber-100" onClick={onClose}>
            ✕ Cerrar
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Fecha y hora</p>
            <p className="mt-1 text-sm text-slate-100">{event.occurredAt ? dateTime(event.occurredAt) : 'Sin fecha'}</p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Descripción</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-100">
              {content || event.description || 'Sin descripción disponible para este movimiento.'}
            </p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Archivos adjuntos</p>
            {!attachments.length ? (
              <p className="mt-2 text-sm text-slate-400">Este evento no tiene archivos adjuntos.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id || `${attachment.publicUrl}-${attachment.originalName}`} className="rounded-lg border border-slate-700 bg-slate-800 p-2">
                    <PublicAttachmentPreview attachment={attachment} onOpen={onOpenAttachment} inlinePlayable withName />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="border-t border-slate-700 bg-slate-950 p-4">
          <button type="button" className="btn-primary h-12 w-full justify-center text-base" onClick={onClose}>Cerrar detalle</button>
        </footer>
      </div>
    </div>
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

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900/80 p-3 backdrop-blur-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function MoneyPill({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  return (
    <div className={`rounded-xl p-3 backdrop-blur-sm ${emphasized ? 'bg-amber-500/15 text-amber-100 border border-amber-500/30' : 'bg-slate-900/80'}`}>
      <p className={`text-[11px] font-medium uppercase tracking-wide ${emphasized ? 'text-amber-200' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-base font-bold ${emphasized ? 'text-amber-100' : 'text-slate-100'}`}>{currency(value)}</p>
    </div>
  );
}

function getStatusColors(statusColor?: string | null) {
  if (!statusColor) return { container: 'border-slate-200 bg-white', badge: 'bg-slate-700 text-slate-100', customColor: null };
  return {
    container: 'border-slate-200 bg-white',
    badge: '',
    customColor: statusColor,
  };
}

function getSoftGradient(color?: string | null) {
  if (!color) return 'linear-gradient(135deg, #111827 0%, #0f172a 50%, #1f2937 100%)';
  return `linear-gradient(135deg, ${color}30 0%, #0f172a 55%, #111827 100%)`;
}

function toNumberSafe(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getFinancialSummary(data: TrackingResponse) {
  const servicesTotal = (data.services || []).reduce((acc, service) => {
    if (isServiceCancelled(service.status)) return acc;
    const qty = toNumberSafe(service.quantity || 1) || 1;
    const price = toNumberSafe(service.price);
    return acc + qty * price;
  }, 0);

  const paymentsSummary = data.payments || {};
  const paymentsItems = Array.isArray(paymentsSummary.items) ? paymentsSummary.items : [];
  const visitAsRecord = (data.visit || {}) as Record<string, unknown>;
  const paymentsTotal =
    toNumberSafe(paymentsSummary.totalPaid) ||
    toNumberSafe(visitAsRecord.totalPaid) ||
    toNumberSafe(visitAsRecord.paidAmount) ||
    toNumberSafe(visitAsRecord.deposit) ||
    toNumberSafe(visitAsRecord.advance) ||
    (paymentsItems.length
      ? paymentsItems.reduce((sum, row) => {
          const item = (row || {}) as Record<string, unknown>;
          return sum + toNumberSafe(item.amount);
        }, 0)
      : Array.isArray(visitAsRecord.payments)
        ? visitAsRecord.payments.reduce((sum, row) => {
            const item = (row || {}) as Record<string, unknown>;
            return sum + toNumberSafe(item.amount);
          }, 0)
        : 0);

  const visitTotal = toNumberSafe(paymentsSummary.visitTotal) || toNumberSafe(data.visit?.total) || servicesTotal;

  return { servicesTotal, paymentsTotal, visitTotal };
}

function isServiceCancelled(status: TrackingService['status']) {
  const raw =
    typeof status === 'string'
      ? status
      : typeof status === 'object' && status
        ? `${status.code || ''} ${status.name || ''}`
        : '';
  const normalized = raw.toUpperCase();
  return normalized.includes('CANCEL');
}

function shouldDisplayInPublicTimeline(event: VisitTimelineEvent) {
  if (event.isPublic === false) return false;
  const normalizedType = (event.eventType || '').toUpperCase();
  if (normalizedType.includes('NOTE')) {
    const metadata = event.metadata || {};
    const fromMetadata =
      (metadata as Record<string, unknown>).isInternal ??
      ((metadata as Record<string, unknown>).current && typeof (metadata as Record<string, unknown>).current === 'object'
        ? ((metadata as Record<string, unknown>).current as Record<string, unknown>).isInternal
        : undefined);
    const fromNote = event.note?.isInternal;
    if (fromMetadata === true || fromNote === true) return false;
  }
  return true;
}

function extractEventNoteContent(event: VisitTimelineEvent) {
  const metadata = event.metadata || {};
  const current =
    (metadata as Record<string, unknown>).current && typeof (metadata as Record<string, unknown>).current === 'object'
      ? ((metadata as Record<string, unknown>).current as Record<string, unknown>).note
      : undefined;
  const directMetaNote = (metadata as Record<string, unknown>).note;
  return event.note?.note || (typeof current === 'string' ? current : '') || (typeof directMetaNote === 'string' ? directMetaNote : '') || event.description || '';
}

type TrackingService = NonNullable<TrackingResponse['services']>[number];

function getServiceNotes(service: TrackingService): Array<VisitServiceNote & { attachments?: NoteAttachment[] }> {
  return service.serviceNotes || service.notes || [];
}

function buildInstrumentDisplayName(data: TrackingResponse) {
  const pieces = [data.instrument?.brand?.name, data.instrument?.model, data.instrument?.nickname, data.instrument?.instrumentType?.name].filter(Boolean);
  return pieces.join(' · ');
}

function extractTimelineAttachments(event: VisitTimelineEvent) {
  const direct = normalizeAttachment(event.attachment, 0);
  const metadata = event.metadata;
  if (!metadata) return direct ? [direct] : [];
  const rawAttachments =
    (Array.isArray(metadata.attachments) ? metadata.attachments : null) ||
    (Array.isArray(metadata.files) ? metadata.files : null) ||
    [];
  const normalized = rawAttachments
    .map((item, index) => normalizeAttachment(item, index))
    .filter((attachment): attachment is NoteAttachment => !!attachment && !!(attachment.publicUrl || attachment.url));
  return direct ? [direct, ...normalized] : normalized;
}

function normalizeAttachment(input: unknown, index: number): NoteAttachment | null {
  if (!input || typeof input !== 'object') return null;
  const item = input as Record<string, unknown>;
  const rawUrl = item.publicUrl || item.url || item.fileUrl || item.signedUrl;
  const url = typeof rawUrl === 'string' ? rawUrl : '';
  if (!url) return null;
  const mimeType = typeof item.mimeType === 'string' ? item.mimeType : undefined;
  const originalName = typeof item.originalName === 'string' ? item.originalName : typeof item.name === 'string' ? item.name : `Adjunto ${index + 1}`;
  return {
    id: typeof item.id === 'string' ? item.id : `${originalName}-${index}`,
    publicUrl: url,
    url,
    mimeType,
    originalName,
  };
}

function PublicAttachmentPreview({
  attachment,
  onOpen,
  inlinePlayable = false,
  withName = false,
}: {
  attachment: NoteAttachment;
  onOpen: (payload: { url: string; mimeType: string; name: string }) => void;
  inlinePlayable?: boolean;
  withName?: boolean;
}) {
  const url = attachment.publicUrl || attachment.url || '';
  const mimeType = detectMimeType(attachment);
  if (!url) return null;
  const label = attachment.originalName || 'Adjunto';
  const open = () => onOpen({ url, mimeType, name: attachment.originalName || 'Adjunto' });

  if (mimeType.startsWith('image/')) {
    return (
      <div className="space-y-1">
        {withName ? <p className="truncate text-xs font-medium text-slate-300">{label}</p> : null}
        <button type="button" onClick={open} className="w-full text-left"><img src={url} alt={attachment.originalName || 'adjunto'} className="h-28 w-full rounded object-cover" /></button>
      </div>
    );
  }

  if (mimeType.startsWith('video/')) {
    return (
      <div className="space-y-1">
        {withName ? <p className="truncate text-xs font-medium text-slate-300">{label}</p> : null}
        {inlinePlayable ? <video src={url} controls className="h-36 w-full rounded object-cover" /> : null}
        <button type="button" onClick={open} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200">Ver video</button>
      </div>
    );
  }

  if (mimeType.startsWith('audio/')) {
    return (
      <div className="space-y-1">
        {withName ? <p className="truncate text-xs font-medium text-slate-300">{label}</p> : null}
        {inlinePlayable ? <audio src={url} controls className="w-full" /> : null}
        <button type="button" onClick={open} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200">Escuchar nota</button>
      </div>
    );
  }

  return (
    <button type="button" onClick={open} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200">
      Abrir archivo: {label}
    </button>
  );
}
