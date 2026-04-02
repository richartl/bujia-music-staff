import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { currency, dateTime } from '@/lib/utils';
import { 
  createVisitNote,
  getVisitNotes,
  updateVisitNote,
} from '../api/visitNotesApi';
import {
  createVisitService,
  createVisitServiceNote,
  deleteVisitService,
  deleteVisitServiceNote,
  getVisitServiceNotes,
  getVisitServices,
  patchVisitService,
  patchVisitServiceNote,
} from '../api/visitServicesApi';
import {
  deleteVisitNoteAttachment,
  deleteVisitServiceNoteAttachment,
  getVisitNoteAttachments,
  getVisitServiceNoteAttachments,
  uploadVisitNoteAttachment,
  uploadVisitServiceNoteAttachment,
} from '../api/attachmentsApi';
import { getVisitTimeline, getVisitTrackingLink, regenerateVisitTrackingLink } from '../api/trackingApi';
import { getVisitDetail, getWorkshopVisitStatuses, patchVisit } from '../api/visitsApi';
import type { NoteAttachment, UpdateVisitPayload, VisitNote } from '../api/types';

type TabKey = 'summary' | 'services' | 'notes' | 'tracking' | 'attachments';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'summary', label: 'Resumen' },
  { key: 'services', label: 'Servicios' },
  { key: 'notes', label: 'Notas' },
  { key: 'tracking', label: 'Tracking' },
  { key: 'attachments', label: 'Adjuntos' },
];

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const maybe = error as { response?: { status?: number } };
    if (maybe.response?.status === 403) return 'No tienes permisos para esta operación.';
    if (maybe.response?.status === 404) return 'No encontramos el recurso solicitado.';
  }
  return 'Ocurrió un error en la operación.';
}

export function VisitDetailPage() {
  const { visitId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const instrumentId = searchParams.get('instrumentId') || '';
  const workshopId = authStore((state) => state.workshopId);
  const [tab, setTab] = useState<TabKey>('summary');
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const visitQuery = useQuery({
    queryKey: ['visit-detail', workshopId, instrumentId, visitId],
    queryFn: () => getVisitDetail(workshopId!, instrumentId, visitId),
    enabled: !!workshopId && !!instrumentId && !!visitId,
  });

  const statusesQuery = useQuery({
    queryKey: ['visit-statuses', workshopId],
    queryFn: () => getWorkshopVisitStatuses(workshopId!),
    enabled: !!workshopId,
  });

  const notesQuery = useQuery({
    queryKey: ['visit-notes', visitId],
    queryFn: () => getVisitNotes(visitId),
    enabled: !!visitId,
  });

  const servicesQuery = useQuery({
    queryKey: ['visit-services', visitId],
    queryFn: () => getVisitServices(visitId),
    enabled: !!visitId,
  });

  const timelineQuery = useQuery({
    queryKey: ['visit-timeline', visitId],
    queryFn: () => getVisitTimeline(visitId),
    enabled: !!visitId,
  });

  const trackingLinkQuery = useQuery({
    queryKey: ['visit-tracking-link', visitId],
    queryFn: () => getVisitTrackingLink(visitId),
    enabled: !!visitId,
  });

  const [editPayload, setEditPayload] = useState<UpdateVisitPayload>({});
  const updateVisitMutation = useMutation({
    mutationFn: async () => {
      if (!workshopId) throw new Error('No hay workshop activo');
      return patchVisit(workshopId, instrumentId, visitId, editPayload);
    },
    onMutate: async () => {
      const key = ['visit-detail', workshopId, instrumentId, visitId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: unknown) => ({ ...(current as object), ...editPayload }));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      const key = ['visit-detail', workshopId, instrumentId, visitId];
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-detail', workshopId, instrumentId, visitId] });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (payload: { note: string; isInternal: boolean }) => createVisitNote(visitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visit-notes', visitId] }),
  });

  const saveTrackingLinkMutation = useMutation({
    mutationFn: () => regenerateVisitTrackingLink(visitId),
    onSuccess: () => {
      setIsRegenerateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['visit-tracking-link', visitId] });
    },
  });

  const noteAttachmentsQueries = useQuery({
    queryKey: ['visit-note-attachments', notesQuery.data?.map((note) => note.id).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        (notesQuery.data || []).map(async (note) => {
          const attachments = await getVisitNoteAttachments(note.id);
          return [note.id, attachments] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, NoteAttachment[]>;
    },
    enabled: !!notesQuery.data?.length,
  });

  const serviceNotesQuery = useQuery({
    queryKey: ['service-notes-batch', servicesQuery.data?.map((service) => service.id).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        (servicesQuery.data || []).map(async (service) => {
          const notes = await getVisitServiceNotes(service.id);
          return [service.id, notes] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, VisitNote[]>;
    },
    enabled: !!servicesQuery.data?.length,
  });

  const serviceAttachmentsQuery = useQuery({
    queryKey: ['service-note-attachments-batch', JSON.stringify(serviceNotesQuery.data || {})],
    queryFn: async () => {
      const noteIds = Object.values(serviceNotesQuery.data || {}).flat().map((note) => note.id);
      const entries = await Promise.all(
        noteIds.map(async (noteId) => {
          const attachments = await getVisitServiceNoteAttachments(noteId);
          return [noteId, attachments] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, NoteAttachment[]>;
    },
    enabled: !!serviceNotesQuery.data,
  });

  const visit = visitQuery.data;
  const currentStatus = useMemo(() => {
    const fromVisit = visit?.status?.name;
    if (fromVisit) return fromVisit;
    return statusesQuery.data?.find((status) => status.id === visit?.statusId)?.name || 'Sin estatus';
  }, [statusesQuery.data, visit?.status?.name, visit?.statusId]);

  const resolvedTrackingUrl = useMemo(() => {
    const payloadUrl = trackingLinkQuery.data?.publicUrl;
    const token = trackingLinkQuery.data?.token || payloadUrl?.split('/').filter(Boolean).slice(-1)[0];
    if (!token) return '';
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/tracking/${token}`;
  }, [trackingLinkQuery.data?.publicUrl, trackingLinkQuery.data?.token]);

  const normalizedTrackingItems = useMemo(() => {
    const internalTimeline = (Array.isArray(timelineQuery.data) ? timelineQuery.data : []).map((event) => ({
      type: event.eventType,
      title: event.title || event.description || event.eventType,
      occurredAt: event.occurredAt || '',
      attachments: [] as NoteAttachment[],
    }));
    const visitNotes = (notesQuery.data || []).map((note) => ({
      type: note.isInternal ? 'NOTA_INTERNA' : 'NOTA_CLIENTE',
      title: note.note,
      occurredAt: note.createdAt || note.updatedAt || '',
      attachments: noteAttachmentsQueries.data?.[note.id] || [],
    }));
    const serviceNotes = Object.values(serviceNotesQuery.data || {})
      .flat()
      .map((note) => ({
        type: note.isInternal ? 'NOTA_SERVICIO_INTERNA' : 'NOTA_SERVICIO_CLIENTE',
        title: note.note,
        occurredAt: note.createdAt || note.updatedAt || '',
        attachments: serviceAttachmentsQuery.data?.[note.id] || [],
      }));

    return [...internalTimeline, ...visitNotes, ...serviceNotes]
      .sort((a, b) => new Date(b.occurredAt || 0).getTime() - new Date(a.occurredAt || 0).getTime());
  }, [
    noteAttachmentsQueries.data,
    notesQuery.data,
    serviceAttachmentsQuery.data,
    serviceNotesQuery.data,
    timelineQuery.data,
  ]);

  if (!instrumentId) {
    return <section className="card p-4 text-sm text-amber-700">Falta `instrumentId` en la URL.</section>;
  }

  if (visitQuery.isLoading) {
    return <section className="card p-4 text-sm text-slate-500">Cargando detalle de visita…</section>;
  }

  if (visitQuery.isError || !visit) {
    return <section className="card p-4 text-sm text-red-700">{getErrorMessage(visitQuery.error)}</section>;
  }

  return (
    <div className="space-y-3">
      <section className="card p-4">
        <p className="text-xs font-semibold text-slate-500">{visit.folio}</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">{visit.instrument?.name || 'Detalle de visita'}</h1>
        <p className="text-sm text-slate-500">{visit.client?.fullName || 'Cliente'} · {currentStatus}</p>
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Tracking público</p>
          <p className="mt-1 break-all text-xs text-sky-700">{resolvedTrackingUrl || 'No disponible'}</p>
          <button
            type="button"
            className="btn-secondary mt-2 h-8 px-3"
            onClick={() => navigator.clipboard.writeText(resolvedTrackingUrl)}
            disabled={!resolvedTrackingUrl}
          >
            Copiar URL completa
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="text-slate-500">Total</p>
          <p className="text-right font-semibold text-slate-900">{currency(Number(visit.total || 0))}</p>
          <p className="text-slate-500">Abierta</p>
          <p className="text-right text-slate-700">{visit.openedAt ? dateTime(visit.openedAt) : '-'}</p>
        </div>
      </section>

      <section className="card p-2">
        <div className="grid grid-cols-5 gap-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`rounded-lg px-2 py-2 text-[11px] ${tab === item.key ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'summary' ? (
        <section className="card space-y-2 p-4">
          <textarea className="input min-h-20" placeholder="Intake notes" defaultValue={visit.intakeNotes || ''} onChange={(e) => setEditPayload((current) => ({ ...current, intakeNotes: e.target.value }))} />
          <textarea className="input min-h-20" placeholder="Diagnosis" defaultValue={visit.diagnosis || ''} onChange={(e) => setEditPayload((current) => ({ ...current, diagnosis: e.target.value }))} />
          <textarea className="input min-h-20" placeholder="Notas internas" defaultValue={visit.internalNotes || ''} onChange={(e) => setEditPayload((current) => ({ ...current, internalNotes: e.target.value }))} />
          <select className="input h-11" defaultValue={visit.statusId || ''} onChange={(e) => setEditPayload((current) => ({ ...current, statusId: e.target.value }))}>
            <option value="">Estatus</option>
            {(statusesQuery.data || []).map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>
          <button type="button" className="btn-primary h-11 w-full justify-center" onClick={() => updateVisitMutation.mutate()} disabled={updateVisitMutation.isPending}>
            Guardar cambios
          </button>
          {updateVisitMutation.isError ? <p className="text-sm text-red-700">{getErrorMessage(updateVisitMutation.error)}</p> : null}
        </section>
      ) : null}

      {tab === 'notes' ? (
        <section className="card space-y-3 p-4">
          <QuickNoteForm onSubmit={(payload) => createNoteMutation.mutate(payload)} isPending={createNoteMutation.isPending} />
          {(notesQuery.data || []).map((note) => (
            <article key={note.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-800">{note.note}</p>
                <span className={`chip ${note.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {note.isInternal ? 'Interna' : 'Pública'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{note.createdAt ? dateTime(note.createdAt) : 'Sin fecha'}</p>

              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-secondary h-9 px-3" onClick={() => updateVisitNote(visitId, note.id, { isInternal: !note.isInternal }).then(() => queryClient.invalidateQueries({ queryKey: ['visit-notes', visitId] }))}>
                  Cambiar visibilidad
                </button>
                <UploadButton onSelect={(file) => uploadVisitNoteAttachment(note.id, file).then(() => queryClient.invalidateQueries({ queryKey: ['visit-note-attachments'] }))} />
              </div>

              <div className="mt-2 space-y-1">
                {(noteAttachmentsQueries.data?.[note.id] || []).map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs">
                    <a href={attachment.url || attachment.publicUrl || '#'} target="_blank" rel="noreferrer" className="truncate text-sky-700">
                      {attachment.originalName || attachment.id}
                    </a>
                    <button type="button" className="text-red-600" onClick={() => deleteVisitNoteAttachment(note.id, attachment.id).then(() => queryClient.invalidateQueries({ queryKey: ['visit-note-attachments'] }))}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'services' ? (
        <section className="card space-y-3 p-4">
          <button type="button" className="btn-secondary h-10 w-full justify-center" onClick={() => createVisitService(visitId, { name: 'Servicio rápido', quantity: 1, price: 0 }).then(() => queryClient.invalidateQueries({ queryKey: ['visit-services', visitId] }))}>
            Agregar servicio rápido
          </button>
          {(servicesQuery.data || []).map((service) => (
            <article key={service.id} className="rounded-xl border border-slate-200 p-3">
              <input className="input h-10" defaultValue={service.name || ''} onBlur={(e) => patchVisitService(visitId, service.id, { name: e.target.value }).then(() => queryClient.invalidateQueries({ queryKey: ['visit-services', visitId] }))} />
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-secondary h-8 px-3" onClick={() => createVisitServiceNote(service.id, { note: 'Nueva nota de servicio', isInternal: false }).then(() => queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] }))}>Agregar nota</button>
                <button type="button" className="btn-secondary h-8 px-3" onClick={() => deleteVisitService(visitId, service.id).then(() => queryClient.invalidateQueries({ queryKey: ['visit-services', visitId] }))}>Eliminar servicio</button>
              </div>
              <div className="mt-2 space-y-1">
                {(serviceNotesQuery.data?.[service.id] || []).map((note) => (
                  <div key={note.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                    <p>{note.note}</p>
                    <div className="mt-1 flex gap-2">
                      <button type="button" className="text-xs text-slate-600" onClick={() => patchVisitServiceNote(service.id, note.id, { isInternal: !note.isInternal }).then(() => queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] }))}>Toggle interna</button>
                      <button type="button" className="text-xs text-red-600" onClick={() => deleteVisitServiceNote(service.id, note.id).then(() => queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] }))}>Eliminar</button>
                      <UploadButton onSelect={(file) => uploadVisitServiceNoteAttachment(note.id, file).then(() => queryClient.invalidateQueries({ queryKey: ['service-note-attachments-batch'] }))} />
                    </div>
                    {(serviceAttachmentsQuery.data?.[note.id] || []).map((attachment) => (
                      <div key={attachment.id} className="mt-1 flex items-center justify-between text-xs">
                        <a href={attachment.url || attachment.publicUrl || '#'} target="_blank" rel="noreferrer" className="truncate text-sky-700">{attachment.originalName || attachment.id}</a>
                        <button type="button" className="text-red-600" onClick={() => deleteVisitServiceNoteAttachment(note.id, attachment.id).then(() => queryClient.invalidateQueries({ queryKey: ['service-note-attachments-batch'] }))}>Eliminar</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'tracking' ? (
        <section className="card space-y-3 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Timeline interno (histórico completo)</h3>
          {timelineQuery.isLoading ? <p className="text-sm text-slate-500">Cargando timeline…</p> : null}
          {normalizedTrackingItems.map((event) => (
            <div key={`${event.type}-${event.occurredAt}-${event.title}`} className="rounded-lg border border-slate-200 p-2">
              <p className="text-xs font-semibold text-slate-500">{event.type}</p>
              <p className="text-sm text-slate-800">{event.title}</p>
              <p className="text-xs text-slate-500">{event.occurredAt ? dateTime(event.occurredAt) : '-'}</p>
              {(event.attachments || []).length ? (
                <div className="mt-2 space-y-1">
                  {(event.attachments || []).map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url || attachment.publicUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-sky-700"
                    >
                      📎 {attachment.originalName || attachment.id}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          <div className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-sm font-semibold text-slate-800">Link público</h4>
            <p className="mt-1 break-all text-xs text-sky-700">{resolvedTrackingUrl || 'No disponible'}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-secondary h-9 px-3" onClick={() => navigator.clipboard.writeText(resolvedTrackingUrl)} disabled={!resolvedTrackingUrl}>Copiar</button>
              <button type="button" className="btn-primary h-9 px-3" onClick={() => setIsRegenerateModalOpen(true)}>Regenerar</button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'attachments' ? (
        <section className="card p-4 text-sm text-slate-600">Gestiona adjuntos desde tabs de Notas y Servicios (mobile-first).</section>
      ) : null}

      {isRegenerateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <p className="text-sm text-slate-700">¿Seguro que deseas regenerar el link público?</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-secondary h-10 flex-1 justify-center" onClick={() => setIsRegenerateModalOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary h-10 flex-1 justify-center" onClick={() => saveTrackingLinkMutation.mutate()} disabled={saveTrackingLinkMutation.isPending}>Confirmar</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuickNoteForm({ onSubmit, isPending }: { onSubmit: (payload: { note: string; isInternal: boolean }) => void; isPending: boolean; }) {
  const [note, setNote] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <textarea className="input min-h-20" placeholder="Escribe nota de visita" value={note} onChange={(e) => setNote(e.target.value)} />
      <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
        Nota interna
      </label>
      <button
        type="button"
        className="btn-primary mt-2 h-10 w-full justify-center"
        disabled={!note.trim() || isPending}
        onClick={() => {
          onSubmit({ note: note.trim(), isInternal });
          setNote('');
          setIsInternal(false);
        }}
      >
        Agregar nota
      </button>
    </div>
  );
}

function UploadButton({ onSelect }: { onSelect: (file: File) => void }) {
  return (
    <label className="btn-secondary h-8 cursor-pointer px-3 text-xs">
      Adjuntar
      <input
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onSelect(file);
          event.target.value = '';
        }}
      />
    </label>
  );
}
