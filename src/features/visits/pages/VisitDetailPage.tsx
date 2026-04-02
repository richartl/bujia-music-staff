import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { currency, dateTime } from '@/lib/utils';
import { getIntakeLookups } from '@/features/intakes/api/get-intake-lookups';
import type { WorkshopServiceLookup } from '@/features/intakes/types';
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
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showManualServiceForm, setShowManualServiceForm] = useState(false);
  const [manualService, setManualService] = useState({ name: '', quantity: '1', price: '0', notes: '' });
  const [isAdjustSwitchModalOpen, setIsAdjustSwitchModalOpen] = useState(false);
  const [noteModalServiceId, setNoteModalServiceId] = useState<string | null>(null);
  const [noteModalText, setNoteModalText] = useState('');
  const [noteModalIsInternal, setNoteModalIsInternal] = useState(false);
  const [noteModalFile, setNoteModalFile] = useState<File | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    action: () => Promise<void> | void;
  } | null>(null);
  const [deleteServiceModal, setDeleteServiceModal] = useState<{ serviceId: string; reason: string } | null>(null);
  const [serviceDetailModalId, setServiceDetailModalId] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; mimeType: string; name: string } | null>(null);
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

  const lookupsQuery = useQuery({
    queryKey: ['intake-lookups-services', workshopId],
    queryFn: () => getIntakeLookups(workshopId!),
    enabled: !!workshopId,
    staleTime: 1000 * 60 * 10,
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

  const createServiceMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createVisitService(visitId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-services', visitId] });
      setIsServiceModalOpen(false);
      setShowManualServiceForm(false);
      setManualService({ name: '', quantity: '1', price: '0', notes: '' });
      setServiceSearch('');
    },
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

  const serviceCatalog = useMemo<WorkshopServiceLookup[]>(
    () => lookupsQuery.data?.services || [],
    [lookupsQuery.data?.services],
  );
  const catalogAdjustServices = useMemo(
    () => serviceCatalog.filter((service) => service.isAdjust),
    [serviceCatalog],
  );
  const filteredCatalogServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return serviceCatalog;
    return serviceCatalog.filter((service) => service.name.toLowerCase().includes(query));
  }, [serviceCatalog, serviceSearch]);
  const activeServices = useMemo(
    () =>
      (servicesQuery.data || []).filter((service) => {
        const normalized = (service.status || '').toUpperCase();
        return !['CANCELLED', 'CANCELED', 'CANCELADO'].includes(normalized);
      }),
    [servicesQuery.data],
  );
  const existingAdjustService = useMemo(
    () => activeServices.find((service) => service.isAdjust),
    [activeServices],
  );
  const selectedServiceDetail = useMemo(
    () => activeServices.find((service) => service.id === serviceDetailModalId) || null,
    [activeServices, serviceDetailModalId],
  );

  async function addCatalogService(service: WorkshopServiceLookup) {
    if (
      service.isAdjust &&
      existingAdjustService &&
      existingAdjustService.workshopServiceId !== service.id
    ) {
      window.alert('Ya existe un servicio de ajuste. Usa el botón Modificar ajuste.');
      return;
    }
    setConfirmModal({
      title: 'Confirmar servicio',
      message: `¿Agregar servicio "${service.name}"?`,
      action: async () => {
        await createServiceMutation.mutateAsync({
          workshopServiceId: service.id,
          quantity: 1,
          price: Number(service.basePrice || 0),
          notes: '',
          isAdjust: !!service.isAdjust,
        });
      },
    });
  }

  async function addManualService() {
    setConfirmModal({
      title: 'Confirmar servicio manual',
      message: `¿Agregar servicio manual "${manualService.name}"?`,
      action: async () => {
        await createServiceMutation.mutateAsync({
          name: manualService.name,
          quantity: Number(manualService.quantity || 1),
          price: Number(manualService.price || 0),
          notes: manualService.notes || undefined,
        });
      },
    });
  }

  async function swapAdjustService(nextAdjustService: WorkshopServiceLookup) {
    if (!existingAdjustService) return;
    setConfirmModal({
      title: 'Cambiar servicio de ajuste',
      message: `¿Cambiar ajuste a "${nextAdjustService.name}"?`,
      action: async () => {
        await patchVisitService(visitId, existingAdjustService.id, {
          workshopServiceId: nextAdjustService.id,
          quantity: existingAdjustService.quantity || 1,
          price: Number(nextAdjustService.basePrice || existingAdjustService.price || 0),
          notes: existingAdjustService.notes || undefined,
          isAdjust: true,
        });
        await queryClient.invalidateQueries({ queryKey: ['visit-services', visitId] });
        setIsAdjustSwitchModalOpen(false);
      },
    });
  }

  async function confirmDeleteService() {
    if (!deleteServiceModal) return;
    const targetService = activeServices.find((item) => item.id === deleteServiceModal.serviceId);
    if (deleteServiceModal.reason.trim() && targetService) {
      await createVisitServiceNote(targetService.id, {
        note: `Servicio eliminado: ${deleteServiceModal.reason.trim()}`,
        isInternal: true,
      });
    }
    await deleteVisitService(visitId, deleteServiceModal.serviceId);
    await queryClient.invalidateQueries({ queryKey: ['visit-services', visitId] });
    setDeleteServiceModal(null);
  }

  async function submitServiceNoteModal() {
    if (!noteModalServiceId || !noteModalText.trim()) return;
    const createdNote = await createVisitServiceNote(noteModalServiceId, {
      note: noteModalText.trim(),
      isInternal: noteModalIsInternal,
    });
    if (noteModalFile) {
      await uploadVisitServiceNoteAttachment(createdNote.id, noteModalFile);
    }
    await queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] });
    await queryClient.invalidateQueries({ queryKey: ['service-note-attachments-batch'] });
    setNoteModalServiceId(null);
    setNoteModalText('');
    setNoteModalIsInternal(false);
    setNoteModalFile(null);
  }

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
                <MediaQuickAttach onSelect={(file) => uploadVisitNoteAttachment(note.id, file).then(() => queryClient.invalidateQueries({ queryKey: ['visit-note-attachments'] }))} />
              </div>

              <div className="mt-2 space-y-1">
                {(noteAttachmentsQueries.data?.[note.id] || []).map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs">
                    <AttachmentPreview attachment={attachment} onOpen={setMediaPreview} />
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
          <button
            type="button"
            className="btn-primary h-10 w-full justify-center"
            onClick={() => setIsServiceModalOpen(true)}
          >
            Agregar servicio
          </button>
          {activeServices.map((service) => (
            <article key={service.id} className="rounded-xl border border-slate-200 p-3">
              <div className="rounded-lg bg-slate-50 p-2">
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
                  onDoubleClick={() => setServiceDetailModalId(service.id)}
                >
                  {service.name || 'Servicio'}
                </button>
                <p className="text-xs text-slate-500">
                  Cantidad: {service.quantity || 1} · Precio: {currency(Number(service.price || 0))}
                  {service.isAdjust ? ' · Ajuste' : ''}
                </p>
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-secondary h-8 px-3" onClick={() => setNoteModalServiceId(service.id)}>Agregar nota</button>
                <button type="button" className="btn-secondary h-8 px-3" onClick={() => setIsServiceModalOpen(true)}>Modificar</button>
                {service.isAdjust ? (
                  <button type="button" className="btn-secondary h-8 px-3" onClick={() => setIsAdjustSwitchModalOpen(true)}>Modificar ajuste</button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary h-8 px-3"
                  onClick={() => setDeleteServiceModal({ serviceId: service.id, reason: '' })}
                >
                  Eliminar servicio
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {(serviceNotesQuery.data?.[service.id] || []).map((note) => (
                  <div key={note.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                    <p>{note.note}</p>
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        className={`rounded-full px-2 py-1 text-xs ${note.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                        onClick={() =>
                          patchVisitServiceNote(service.id, note.id, { isInternal: !note.isInternal }).then(() =>
                            queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] }),
                          )
                        }
                      >
                        {note.isInternal ? 'Interna' : 'Pública'}
                      </button>
                      <button type="button" className="text-xs text-red-600" onClick={() => deleteVisitServiceNote(service.id, note.id).then(() => queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] }))}>Eliminar</button>
                      <MediaQuickAttach onSelect={(file) => uploadVisitServiceNoteAttachment(note.id, file).then(() => queryClient.invalidateQueries({ queryKey: ['service-note-attachments-batch'] }))} />
                    </div>
                    {(serviceAttachmentsQuery.data?.[note.id] || []).map((attachment) => (
                      <div key={attachment.id} className="mt-1 flex items-center justify-between text-xs">
                        <AttachmentPreview attachment={attachment} onOpen={setMediaPreview} />
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
            <div
              key={`${event.type}-${event.occurredAt}-${event.title}`}
              className={`rounded-lg border p-2 ${
                event.type.includes('INTERNA')
                  ? 'border-amber-200 bg-amber-50/40'
                  : event.type.includes('SERVICIO')
                    ? 'border-sky-200 bg-sky-50/40'
                    : 'border-emerald-200 bg-emerald-50/40'
              }`}
            >
              <p className="text-xs font-semibold text-slate-500">{event.type}</p>
              <p className="text-sm text-slate-800">{event.title}</p>
              <p className="text-xs text-slate-500">{event.occurredAt ? dateTime(event.occurredAt) : '-'}</p>
              {(event.attachments || []).length ? (
                <div className="mt-2 space-y-1">
                  {(event.attachments || []).map((attachment) => (
                    <div key={attachment.id} className="rounded bg-slate-50 p-1">
                      <AttachmentPreview attachment={attachment} onOpen={setMediaPreview} />
                    </div>
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

      {isServiceModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Agregar servicio</h4>
            <input
              className="input mt-2 h-11"
              placeholder="Buscar servicio de catálogo"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
            />
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
              {filteredCatalogServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className="w-full rounded-lg border border-slate-200 p-2 text-left text-sm"
                  onClick={() => void addCatalogService(service)}
                >
                  <p className="font-medium text-slate-800">{service.name}</p>
                  <p className="text-xs text-slate-500">{currency(Number(service.basePrice || 0))} {service.isAdjust ? '· Ajuste' : ''}</p>
                </button>
              ))}
            </div>

            <button type="button" className="btn-secondary mt-3 h-9 w-full justify-center" onClick={() => setShowManualServiceForm((v) => !v)}>
              {showManualServiceForm ? 'Ocultar manual' : 'Agregar manual'}
            </button>
            {showManualServiceForm ? (
              <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-2">
                <input className="input h-10" placeholder="Nombre servicio" value={manualService.name} onChange={(e) => setManualService((c) => ({ ...c, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input h-10" inputMode="numeric" placeholder="Cantidad" value={manualService.quantity} onChange={(e) => setManualService((c) => ({ ...c, quantity: e.target.value }))} />
                  <input className="input h-10" inputMode="decimal" placeholder="Precio" value={manualService.price} onChange={(e) => setManualService((c) => ({ ...c, price: e.target.value }))} />
                </div>
                <textarea className="input min-h-16" placeholder="Notas" value={manualService.notes} onChange={(e) => setManualService((c) => ({ ...c, notes: e.target.value }))} />
                <button type="button" className="btn-primary h-10 w-full justify-center" onClick={() => void addManualService()} disabled={!manualService.name.trim()}>
                  Confirmar manual
                </button>
              </div>
            ) : null}

            <button type="button" className="btn-secondary mt-3 h-10 w-full justify-center" onClick={() => setIsServiceModalOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {isAdjustSwitchModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Modificar ajuste</h4>
            <div className="mt-2 space-y-2">
              {catalogAdjustServices.map((service) => (
                <button key={service.id} type="button" className="w-full rounded-lg border border-slate-200 p-2 text-left" onClick={() => void swapAdjustService(service)}>
                  {service.name}
                </button>
              ))}
            </div>
            <button type="button" className="btn-secondary mt-3 h-10 w-full justify-center" onClick={() => setIsAdjustSwitchModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {noteModalServiceId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Nueva nota de servicio</h4>
            <textarea className="input mt-2 min-h-20" placeholder="Descripción de la nota" value={noteModalText} onChange={(e) => setNoteModalText(e.target.value)} />
            <button
              type="button"
              className={`mt-2 flex h-10 w-full items-center justify-center rounded-xl text-sm ${noteModalIsInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
              onClick={() => setNoteModalIsInternal((value) => !value)}
            >
              {noteModalIsInternal ? 'Interna (oculta en tracking)' : 'Pública (visible en tracking)'}
            </button>
            <MediaQuickAttach onSelect={(file) => setNoteModalFile(file)} />
            {noteModalFile ? <p className="mt-1 text-xs text-slate-500">{noteModalFile.name}</p> : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setNoteModalServiceId(null)}>Cancelar</button>
              <button type="button" className="btn-primary h-10 justify-center" onClick={() => void submitServiceNoteModal()} disabled={!noteModalText.trim()}>Guardar</button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteServiceModal ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Eliminar servicio</h4>
            <p className="mt-1 text-xs text-slate-600">Puedes agregar motivo para historial interno (opcional).</p>
            <textarea
              className="input mt-2 min-h-20"
              placeholder="Motivo de eliminación"
              value={deleteServiceModal.reason}
              onChange={(e) =>
                setDeleteServiceModal((current) => (current ? { ...current, reason: e.target.value } : current))
              }
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setDeleteServiceModal(null)}>Cancelar</button>
              <button type="button" className="btn-primary h-10 justify-center" onClick={() => void confirmDeleteService()}>Confirmar</button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmModal ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">{confirmModal.title}</h4>
            <p className="mt-1 text-sm text-slate-700">{confirmModal.message}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setConfirmModal(null)}>Cancelar</button>
              <button
                type="button"
                className="btn-primary h-10 justify-center"
                onClick={async () => {
                  await confirmModal.action();
                  setConfirmModal(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedServiceDetail ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">{selectedServiceDetail.name || 'Detalle de servicio'}</h4>
            <p className="mt-1 text-xs text-slate-500">
              Cantidad: {selectedServiceDetail.quantity || 1} · Precio: {currency(Number(selectedServiceDetail.price || 0))}
            </p>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {(serviceNotesQuery.data?.[selectedServiceDetail.id] || []).map((note) => (
                <div key={note.id} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-800">{note.note}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${note.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {note.isInternal ? 'Interna' : 'Pública'}
                    </span>
                  </div>
                  {(serviceAttachmentsQuery.data?.[note.id] || []).map((attachment) => (
                    <div key={attachment.id} className="mt-1">
                      <AttachmentPreview attachment={attachment} onOpen={setMediaPreview} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary mt-3 h-10 w-full justify-center" onClick={() => setServiceDetailModalId(null)}>
              Cerrar detalle
            </button>
          </div>
        </div>
      ) : null}

      {mediaPreview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-3">
            <p className="truncate text-sm font-medium text-slate-800">{mediaPreview.name}</p>
            <div className="mt-2">
              {mediaPreview.mimeType.startsWith('image/') ? (
                <img src={mediaPreview.url} alt={mediaPreview.name} className="max-h-[70vh] w-full rounded object-contain" />
              ) : mediaPreview.mimeType.startsWith('video/') ? (
                <video src={mediaPreview.url} controls className="max-h-[70vh] w-full rounded object-contain" />
              ) : mediaPreview.mimeType.startsWith('audio/') ? (
                <audio src={mediaPreview.url} controls className="w-full" />
              ) : (
                <a href={mediaPreview.url} target="_blank" rel="noreferrer" className="text-sky-700">Abrir archivo</a>
              )}
            </div>
            <button type="button" className="btn-secondary mt-3 h-10 w-full justify-center" onClick={() => setMediaPreview(null)}>
              Cerrar
            </button>
          </div>
        </div>
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

function detectMimeType(attachment: NoteAttachment) {
  if (attachment.mimeType) return attachment.mimeType;
  const name = (attachment.originalName || '').toLowerCase();
  if (/(png|jpg|jpeg|gif|webp)$/.test(name)) return 'image/*';
  if (/(mp4|mov|webm|m4v)$/.test(name)) return 'video/*';
  if (/(mp3|wav|ogg|m4a|aac)$/.test(name)) return 'audio/*';
  return '';
}

function AttachmentPreview({ attachment, onOpen }: { attachment: NoteAttachment; onOpen: (payload: { url: string; mimeType: string; name: string }) => void }) {
  const url = attachment.url || attachment.publicUrl || '';
  const mimeType = detectMimeType(attachment);
  if (!url) return <span className="truncate text-sky-700">{attachment.originalName || attachment.id}</span>;

  const open = () => onOpen({ url, mimeType, name: attachment.originalName || attachment.id });

  if (mimeType.startsWith('image/')) {
    return <button type="button" onClick={open}><img src={url} alt={attachment.originalName || 'image'} className="h-12 w-12 rounded object-cover" /></button>;
  }
  if (mimeType.startsWith('video/')) {
    return <button type="button" onClick={open}><video src={url} className="h-12 w-20 rounded object-cover" /></button>;
  }
  if (mimeType.startsWith('audio/')) {
    return <button type="button" onClick={open} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">🎤 Escuchar nota</button>;
  }
  return (
    <button type="button" onClick={open} className="truncate text-sky-700">{attachment.originalName || attachment.id}</button>
  );
}

function MediaQuickAttach({ onSelect }: { onSelect: (file: File) => void }) {
  const photoId = `photo-${crypto.randomUUID()}`;
  const videoId = `video-${crypto.randomUUID()}`;
  const audioId = `audio-${crypto.randomUUID()}`;
  return (
    <div className="grid grid-cols-3 gap-1">
      <label htmlFor={photoId} className="btn-secondary h-8 cursor-pointer px-2 text-[11px]">Foto</label>
      <label htmlFor={videoId} className="btn-secondary h-8 cursor-pointer px-2 text-[11px]">Video</label>
      <label htmlFor={audioId} className="btn-secondary h-8 cursor-pointer px-2 text-[11px]">Voz</label>
      <input id={photoId} type="file" className="hidden" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; onSelect(file); event.target.value = ''; }} />
      <input id={videoId} type="file" className="hidden" accept="video/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; onSelect(file); event.target.value = ''; }} />
      <input id={audioId} type="file" className="hidden" accept="audio/*" capture="user" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; onSelect(file); event.target.value = ''; }} />
    </div>
  );
}
