import { useEffect, useMemo, useState } from 'react';
import { useIsFetching, useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { currency, dateTime } from '@/lib/utils';
import { copyTextToClipboard } from '@/lib/clipboard';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notify';
import { VisitClientPhoneCopy } from '@/features/visits/components/VisitClientPhoneCopy';
import { getIntakeLookups } from '@/features/intakes/api/get-intake-lookups';
import { filesApi } from '@/features/intakes/api/filesApi';
import type { LookupOption } from '@/features/intakes/types';
import { useServiceStatuses } from '@/features/visits/hooks/useServiceStatuses';
import { useUpdateVisitServiceStatus } from '@/features/visits/hooks/useUpdateVisitServiceStatus';
import { VisitServiceStatusChip } from '@/features/visits/components/VisitServiceStatusChip';
import { VisitServiceStatusSheet } from '@/features/visits/components/VisitServiceStatusSheet';
import { VisitPaymentsSection } from '@/features/visits/components/VisitPaymentsSection';
import { VisitPartsSection } from '@/features/visits/components/VisitPartsSection';
import { useVisitParts } from '@/features/visits/hooks/useVisitParts';
import { parseEvidenceMarkerFromNotes } from '@/features/visits/utils/paymentEvidence';
import { getTimelineEventIcon, getTimelineEventTone } from '@/features/visits/utils/timelineEventIcon';
import { PaymentAttachmentGallery } from '@/features/visits/components/PaymentAttachmentGallery';
import { EvidenceUploader, type EvidenceUploaderItem } from '@/features/visits/components/EvidenceUploader';
import { getTimelinePaymentAttachments } from '@/features/visits/utils/paymentAttachments';
import { VisitAttachmentsGallery } from '@/features/visits/components/VisitAttachmentsGallery';
import { useIntakeMediaUpload } from '@/features/intakes/hooks/useIntakeMediaUpload';
import { getVisitMainImageAttachment } from '@/features/visits/utils/visitAttachments';
import { OverlayPortal } from '@/components/ui/OverlayPortal';
import type { WorkshopServiceLookup } from '@/features/intakes/types';
import { useVisitArchive } from '@/features/visits/hooks/useVisitArchive';
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

type TabKey = 'summary' | 'services' | 'finance' | 'tracking';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'summary', label: 'Resumen' },
  { key: 'services', label: 'Servicios' },
  { key: 'finance', label: 'Finanzas' },
  { key: 'tracking', label: 'Tracking' },
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
  const [catalogServiceNote, setCatalogServiceNote] = useState('');
  const [initialServiceNote, setInitialServiceNote] = useState('');
  const [initialServiceNoteIsInternal, setInitialServiceNoteIsInternal] = useState(false);
  const [initialServiceNoteFiles, setInitialServiceNoteFiles] = useState<File[]>([]);
  const [showManualServiceForm, setShowManualServiceForm] = useState(false);
  const [manualService, setManualService] = useState({ name: '', quantity: '1', price: '0', notes: '' });
  const [isAdjustSwitchModalOpen, setIsAdjustSwitchModalOpen] = useState(false);
  const [noteModalServiceId, setNoteModalServiceId] = useState<string | null>(null);
  const [noteModalText, setNoteModalText] = useState('');
  const [noteModalIsInternal, setNoteModalIsInternal] = useState(true);
  const [noteModalFiles, setNoteModalFiles] = useState<EvidenceUploaderItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    action: () => Promise<void> | void;
  } | null>(null);
  const [deleteServiceModal, setDeleteServiceModal] = useState<{ serviceId: string; reason: string } | null>(null);
  const [serviceDetailModalId, setServiceDetailModalId] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; mimeType: string; name: string } | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState('');
  const [isCancelVisitModalOpen, setIsCancelVisitModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [statusSheetServiceId, setStatusSheetServiceId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [apiPendingCount, setApiPendingCount] = useState(0);
  const queryClient = useQueryClient();
  const activeQueries = useIsFetching();
  const activeMutations = useIsMutating();

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
  const partsQuery = useVisitParts(visitId);

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

  useEffect(() => {
    if (!mediaPreview) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMediaPreview(null);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [mediaPreview]);

  const [editPayload, setEditPayload] = useState<UpdateVisitPayload>({});
  const serviceStatusesQuery = useServiceStatuses(workshopId);
  const updateServiceStatusMutation = useUpdateVisitServiceStatus();
  const { archiveMutation, unarchiveMutation } = useVisitArchive({ workshopId });
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
      notifySuccess('Visita actualizada', 'Los cambios se guardaron correctamente.');
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
      queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] });
      queryClient.invalidateQueries({ queryKey: ['service-note-attachments-batch'] });
      queryClient.invalidateQueries({ queryKey: ['visit-timeline', visitId] });
      setIsServiceModalOpen(false);
      setShowManualServiceForm(false);
      setManualService({ name: '', quantity: '1', price: '0', notes: '' });
      setServiceSearch('');
      setCatalogServiceNote('');
      setInitialServiceNote('');
      setInitialServiceNoteIsInternal(false);
      setInitialServiceNoteFiles([]);
      notifySuccess('Servicio agregado');
    },
  });

  const saveTrackingLinkMutation = useMutation({
    mutationFn: () => regenerateVisitTrackingLink(visitId),
    onSuccess: () => {
      setIsRegenerateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['visit-tracking-link', visitId] });
    },
  });
  const changeVisitStatusMutation = useMutation({
    mutationFn: (payload: { statusId: string; visitMediaIds?: string[] }) => patchVisit(workshopId!, instrumentId, visitId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-detail', workshopId, instrumentId, visitId] });
      queryClient.invalidateQueries({ queryKey: ['workshop-visits'] });
      queryClient.invalidateQueries({ queryKey: ['public-tracking'] });
      notifySuccess('Estado actualizado');
      setIsStatusModalOpen(false);
      setSelectedStatusId('');
    },
    onError: (error) => {
      notifyError(getErrorMessage(error));
    },
  });
  const statusUpload = useIntakeMediaUpload({
    scope: `visit:${visitId}/status-change`,
    onFileError: (item) => notifyError(`${item.file.name}: ${item.errorMessage || 'Error al subir archivo.'}`),
  });
  const visitAttachmentsUpload = useIntakeMediaUpload({
    scope: `visit:${visitId}/attachments`,
    onFileError: (item) => notifyError(`${item.file.name}: ${item.errorMessage || 'Error al subir archivo.'}`),
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
  const mainVisitImage = useMemo(() => (visit ? getVisitMainImageAttachment(visit) : null), [visit]);

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
      description: event.description || '',
      occurredAt: event.occurredAt || '',
      attachments: [] as NoteAttachment[],
      metadata: event.metadata || {},
      payment: event.payment || null,
      actor: event.actor || null,
    }));
    const visitNotes = (notesQuery.data || []).map((note) => ({
      type: note.isInternal ? 'NOTA_INTERNA' : 'NOTA_CLIENTE',
      title: note.note,
      description: '',
      occurredAt: note.createdAt || note.updatedAt || '',
      attachments: noteAttachmentsQueries.data?.[note.id] || [],
      metadata: {},
      payment: null,
      actor: note.author || note.createdByUser || null,
    }));
    const serviceNotes = Object.values(serviceNotesQuery.data || {})
      .flat()
      .map((note) => ({
        type: note.isInternal ? 'NOTA_SERVICIO_INTERNA' : 'NOTA_SERVICIO_CLIENTE',
        title: note.note,
        description: '',
        occurredAt: note.createdAt || note.updatedAt || '',
        attachments: serviceAttachmentsQuery.data?.[note.id] || [],
        metadata: {},
        payment: null,
        actor: null,
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
        const rawStatus =
          typeof service.status === 'string'
            ? service.status
            : typeof service.status === 'object' && service.status && 'name' in service.status
              ? String((service.status as { name?: string }).name || '')
              : '';
        const normalized = rawStatus.toUpperCase();
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
  const selectedServiceForStatus = useMemo(
    () => activeServices.find((service) => service.id === statusSheetServiceId) || null,
    [activeServices, statusSheetServiceId],
  );
  const adjustService = useMemo(
    () => activeServices.find((service) => service.isAdjust) || null,
    [activeServices],
  );
  const regularServices = useMemo(
    () => activeServices.filter((service) => !service.isAdjust),
    [activeServices],
  );
  const serviceStatusOptions = useMemo(
    () => serviceStatusesQuery.data || [],
    [serviceStatusesQuery.data],
  );
  const paymentMethods = useMemo<LookupOption[]>(
    () => lookupsQuery.data?.paymentMethods || [],
    [lookupsQuery.data?.paymentMethods],
  );
  const servicesTotal = useMemo(
    () =>
      (servicesQuery.data || []).reduce(
        (sum, service) => sum + Number(service.price || 0) * Number(service.quantity || 1),
        0,
      ),
    [servicesQuery.data],
  );
  const partsTotal = useMemo(
    () =>
      (partsQuery.data || []).reduce(
        (sum, part) => sum + Number(part.subtotal || Number(part.quantity || 0) * Number(part.unitPrice || 0)),
        0,
      ),
    [partsQuery.data],
  );
  const totalVisit = Number(visit?.total || servicesTotal + partsTotal);
  const discountValue = Number(visit?.discount || 0);
  const paidTotal = Number(
    (((visit as unknown as Record<string, unknown> | undefined)?.paidAmount as number | string | undefined) ||
      (Array.isArray(visit?.payments)
        ? visit.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
        : 0)),
  );
  const pendingBalance = Math.max(0, totalVisit - paidTotal);
  const selectedStatus = useMemo(
    () => (statusesQuery.data || []).find((status) => status.id === selectedStatusId) || null,
    [selectedStatusId, statusesQuery.data],
  );
  const isTerminatedSelection = useMemo(() => {
    if (!selectedStatus) return false;
    const raw = `${selectedStatus.name || ''} ${selectedStatus.slug || ''}`.toLowerCase();
    return raw.includes('termin') || raw.includes('entreg');
  }, [selectedStatus]);
  const canArchiveVisit = Boolean(!visit?.isArchived && visit && visit.isActive === false);
  async function addCatalogService(service: WorkshopServiceLookup) {
    if (
      service.isAdjust &&
      existingAdjustService &&
      existingAdjustService.workshopServiceId !== service.id
    ) {
      notifyInfo('Ya existe un servicio de ajuste', 'Usa el botón Modificar ajuste.');
      return;
    }
    setConfirmModal({
      title: 'Confirmar servicio',
      message: `¿Agregar servicio "${service.name}"?`,
      action: async () => {
        await runApi(async () => {
          const initialNoteMediaIds = await uploadInitialNoteMediaIds();
          await createServiceMutation.mutateAsync({
            workshopServiceId: service.id,
            serviceCatalogId: service.id,
            quantity: 1,
            price: Number(service.basePrice || 0),
            notes: catalogServiceNote.trim() || undefined,
            initialNote: initialServiceNote.trim() || undefined,
            initialNoteIsInternal: initialServiceNoteIsInternal,
            initialNoteMediaIds: initialNoteMediaIds.length ? initialNoteMediaIds : undefined,
          });
        });
      },
    });
  }

  async function addManualService() {
    setConfirmModal({
      title: 'Confirmar servicio manual',
      message: `¿Agregar servicio manual "${manualService.name}"?`,
      action: async () => {
        await runApi(async () => {
          const initialNoteMediaIds = await uploadInitialNoteMediaIds();
          await createServiceMutation.mutateAsync({
            name: manualService.name,
            description: manualService.notes || undefined,
            quantity: Number(manualService.quantity || 1),
            price: Number(manualService.price || 0),
            notes: manualService.notes || undefined,
            initialNote: initialServiceNote.trim() || undefined,
            initialNoteIsInternal: initialServiceNoteIsInternal,
            initialNoteMediaIds: initialNoteMediaIds.length ? initialNoteMediaIds : undefined,
          });
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
        });
        await queryClient.invalidateQueries({ queryKey: ['visit-services', visitId] });
        notifySuccess('Ajuste actualizado', 'Se cambió el servicio de ajuste.');
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
    notifySuccess('Servicio eliminado');
    setDeleteServiceModal(null);
  }

  async function submitServiceNoteModal() {
    if (!noteModalServiceId || !noteModalText.trim()) return;
    try {
      const createdNote = await createVisitServiceNote(noteModalServiceId, {
        note: noteModalText.trim(),
        isInternal: noteModalIsInternal,
      });
      if (noteModalFiles.length) {
        for (const item of noteModalFiles) {
          setNoteModalFiles((current) =>
            current.map((entry) => (entry.id === item.id ? { ...entry, status: 'uploading', errorMessage: null } : entry)),
          );
          try {
            await withUploading(async () => {
              await uploadVisitServiceNoteAttachment(createdNote.id, item.file);
            });
            setNoteModalFiles((current) =>
              current.map((entry) => (entry.id === item.id ? { ...entry, status: 'done', errorMessage: null } : entry)),
            );
          } catch (error) {
            const message = getErrorMessage(error);
            setNoteModalFiles((current) =>
              current.map((entry) => (entry.id === item.id ? { ...entry, status: 'error', errorMessage: message } : entry)),
            );
            notifyError(message);
            return;
          }
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] });
      await queryClient.invalidateQueries({ queryKey: ['service-note-attachments-batch'] });
      notifySuccess('Nota guardada');
      setNoteModalServiceId(null);
      setNoteModalText('');
      setNoteModalIsInternal(true);
      setNoteModalFiles([]);
    } catch (error) {
      notifyError(getErrorMessage(error));
    }
  }

  async function submitVisitStatusChange() {
    if (!selectedStatusId) return;
    const payload = {
      statusId: selectedStatusId,
      visitMediaIds: statusUpload.uploadedMediaIds.length ? statusUpload.uploadedMediaIds : undefined,
    };
    await changeVisitStatusMutation.mutateAsync(payload);
    statusUpload.items.forEach((item) => statusUpload.removeFile(item.localId));
  }

  async function submitVisitAttachments() {
    if (!visit) return;
    const newMediaIds = visitAttachmentsUpload.uploadedMediaIds;
    if (!newMediaIds.length) {
      notifyInfo('Aún no hay archivos listos para adjuntar.');
      return;
    }

    const existingMediaIds = [
      ...(Array.isArray((visit as unknown as Record<string, unknown>)?.visitMediaIds)
        ? (((visit as unknown as Record<string, unknown>).visitMediaIds as unknown[])
            .filter((value): value is string => typeof value === 'string')
          )
        : []),
      ...((visit.attachments || [])
        .map((attachment) => attachment.mediaId)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)),
    ];

    const visitMediaIds = Array.from(new Set([...existingMediaIds, ...newMediaIds]));
    if (!visitMediaIds.length) return;

    await runApi(async () => {
      await patchVisit(workshopId!, instrumentId, visitId, { visitMediaIds });
      await queryClient.invalidateQueries({ queryKey: ['visit-detail', workshopId, instrumentId, visitId] });
      await queryClient.invalidateQueries({ queryKey: ['workshop-visits'] });
      await queryClient.invalidateQueries({ queryKey: ['public-tracking'] });
      visitAttachmentsUpload.items.forEach((item) => visitAttachmentsUpload.removeFile(item.localId));
      notifySuccess('Attachments agregados a la visita');
    });
  }

  async function runApi(task: () => Promise<void>) {
    setApiPendingCount((value) => value + 1);
    try {
      await task();
    } finally {
      setApiPendingCount((value) => Math.max(0, value - 1));
    }
  }

  async function withUploading(task: () => Promise<void>) {
    setUploadingCount((value) => value + 1);
    try {
      await runApi(task);
    } finally {
      setUploadingCount((value) => Math.max(0, value - 1));
    }
  }

  async function uploadInitialNoteMediaIds() {
    if (!initialServiceNoteFiles.length) return [] as string[];
    const scope = `visit:${visitId}/service-initial-note`;
    const mediaIds: string[] = [];
    for (const file of initialServiceNoteFiles) {
      const init = await filesApi.initUpload(file, scope);
      await filesApi.putBinaryToSignedUrl(init.uploadUrl, file, init.requiredHeaders);
      await filesApi.completeUpload(init.mediaId, {
        sizeBytes: file.size,
        metadata: {
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
        },
      });
      mediaIds.push(init.mediaId);
    }
    return mediaIds;
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

  const isBusy =
    uploadingCount > 0 ||
    apiPendingCount > 0 ||
    activeQueries > 0 ||
    activeMutations > 0 ||
    createNoteMutation.isPending ||
    createServiceMutation.isPending ||
    updateVisitMutation.isPending ||
    archiveMutation.isPending ||
    unarchiveMutation.isPending ||
    saveTrackingLinkMutation.isPending ||
    notesQuery.isFetching ||
    servicesQuery.isFetching ||
    timelineQuery.isFetching ||
    serviceStatusesQuery.isFetching;

  const copyWithToast = async (text: string, successMessage: string, errorMessage: string) => {
    try {
      await copyTextToClipboard(text);
      notifySuccess(successMessage);
    } catch {
      notifyError(errorMessage);
    }
  };

  const handleCopyTrackingUrl = async () => {
    if (!resolvedTrackingUrl) return;
    await copyWithToast(resolvedTrackingUrl, 'Liga de seguimiento copiada', 'No se pudo copiar la liga');
  };

  return (
    <div className="space-y-3">
      {isBusy ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/25 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
            <Spinner />
            Cargando...
          </div>
        </div>
      ) : null}
      <section className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{visit.folio}</p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">{visit.instrument?.name || 'Detalle de visita'}</h1>
            <VisitClientPhoneCopy clientName={visit.client?.fullName} phone={visit.client?.phone} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: visit.status?.color || '#334155' }}
            >
              {currentStatus}
            </span>
            {mainVisitImage?.publicUrl ? (
              <button
                type="button"
                className="overflow-hidden rounded-lg border border-slate-200"
                onClick={() =>
                  setMediaPreview({
                    url: mainVisitImage.publicUrl || '',
                    mimeType: mainVisitImage.mimeType || 'image/*',
                    name: mainVisitImage.originalName || 'Portada de visita',
                  })
                }
              >
                <img src={mainVisitImage.publicUrl} alt="Portada principal" className="h-14 w-14 object-cover" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary h-8 px-3 text-xs"
            onClick={() => {
              setSelectedStatusId(visit.statusId || '');
              setIsStatusModalOpen(true);
            }}
          >
            Cambiar estado
          </button>
          <button type="button" className="h-8 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700" onClick={() => setIsCancelVisitModalOpen(true)}>
            Cancelar visita
          </button>
          {canArchiveVisit ? (
            <button
              type="button"
              className="btn-secondary h-8 px-3 text-xs"
              onClick={() => setIsArchiveModalOpen(true)}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Archivando...' : 'Archivar'}
            </button>
          ) : null}
          {visit.isArchived ? (
            <button
              type="button"
              className="btn-secondary h-8 px-3 text-xs"
              onClick={() => unarchiveMutation.mutate({ instrumentId, visitId })}
              disabled={unarchiveMutation.isPending}
            >
              {unarchiveMutation.isPending ? 'Desarchivando...' : 'Desarchivar'}
            </button>
          ) : null}
        </div>
        {visit.isArchived ? (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            <p className="font-semibold">Visita archivada</p>
            {visit.archivedAt ? <p className="mt-1">Fecha: {dateTime(visit.archivedAt)}</p> : null}
            {visit.archiveReason ? <p className="mt-1">Motivo: {visit.archiveReason}</p> : null}
          </div>
        ) : null}
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Tracking público</p>
          <p className="mt-1 break-all text-xs text-sky-700">{resolvedTrackingUrl || 'No disponible'}</p>
          <button
            type="button"
            className="btn-secondary mt-2 h-8 px-3"
            onClick={handleCopyTrackingUrl}
            disabled={!resolvedTrackingUrl}
          >
            Copiar URL completa
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <MetricHeader label="Servicios" value={currency(servicesTotal)} />
          <MetricHeader label="Refacciones" value={currency(partsTotal)} />
          <MetricHeader label="Descuento" value={currency(discountValue)} />
          <MetricHeader label="Total visita" value={currency(totalVisit)} emphasized />
          <MetricHeader label="Abonos" value={currency(paidTotal)} />
          <MetricHeader label="Saldo pendiente" value={currency(pendingBalance)} emphasized />
        </div>
      </section>

      <section className="card p-2">
        <div className="grid grid-cols-4 gap-1">
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
          <h3 className="text-sm font-semibold text-slate-800">Resumen de visita (solo lectura)</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-slate-500">Afinación deseada</p>
            <p className="text-right text-slate-800">{((visit as unknown as Record<string, unknown>).desiredTuning as { name?: string } | undefined)?.name || '-'}</p>
            <p className="text-slate-500">Calibre de cuerdas</p>
            <p className="text-right text-slate-800">{((visit as unknown as Record<string, unknown>).stringGauge as { name?: string } | undefined)?.name || '-'}</p>
            <p className="text-slate-500">Trae funda</p>
            <p className="text-right text-slate-800">{visit.hasCase ? 'Sí' : 'No'}</p>
            <p className="text-slate-500">Trae strap</p>
            <p className="text-right text-slate-800">{visit.hasStrap ? 'Sí' : 'No'}</p>
            <p className="text-slate-500">Cambio de cuerdas</p>
            <p className="text-right text-slate-800">{visit.wantsStringChange ? 'Sí' : 'No'}</p>
            <p className="text-slate-500">Registró</p>
            <p className="text-right text-slate-800">{((visit as unknown as Record<string, unknown>).createdByUser as { name?: string } | undefined)?.name || '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Resumen del instrumento</p>
            <p className="mt-1 text-sm text-slate-700">
              {visit.instrument?.name || '-'} {visit.instrument?.model ? `· ${visit.instrument.model}` : ''}
              {visit.instrument?.colorName ? `· ${visit.instrument.colorName}` : ''}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Subir attachments de la visita</p>
              <p className="mt-1 text-xs text-slate-500">Fotos, video y documentos. Se agregan a esta orden sin reemplazar los actuales.</p>
              <input
                id="visit-attachments-upload-input"
                type="file"
                multiple
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (files.length) {
                    visitAttachmentsUpload.addFiles(files);
                    notifyInfo(`${files.length} archivo(s) en subida…`);
                  }
                  event.target.value = '';
                }}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label htmlFor="visit-attachments-upload-input" className="btn-secondary h-11 cursor-pointer justify-center text-xs font-semibold">
                  Agregar archivo
                </label>
                <button
                  type="button"
                  className="btn-primary h-11 justify-center text-xs"
                  disabled={visitAttachmentsUpload.hasBlockingUploads || !visitAttachmentsUpload.uploadedMediaIds.length}
                  onClick={() => void withUploading(submitVisitAttachments)}
                >
                  {visitAttachmentsUpload.hasBlockingUploads ? 'Subiendo…' : 'Guardar en visita'}
                </button>
              </div>
              {visitAttachmentsUpload.items.length ? (
                <div className="mt-2 space-y-2">
                  {visitAttachmentsUpload.items.map((item) => (
                    <div key={item.localId} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-slate-700">{item.file.name}</p>
                        <span className="text-[11px] text-slate-500">
                          {item.status === 'done' ? 'Listo' : item.status === 'error' ? 'Error' : 'Subiendo'}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className={`h-1.5 rounded-full ${item.status === 'error' ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${Math.min(Math.max(item.progress, 6), 100)}%` }} />
                      </div>
                      {item.errorMessage ? <p className="mt-1 text-[11px] text-rose-600">{item.errorMessage}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-2">
              <VisitAttachmentsGallery
                visit={visit}
                onOpen={setMediaPreview}
              />
            </div>
          </div>
          <h3 className="pt-2 text-sm font-semibold text-slate-800">Notas generales de la visita</h3>
          <QuickNoteForm onSubmit={(payload) => createNoteMutation.mutate(payload)} isPending={createNoteMutation.isPending} />
          {(notesQuery.data || []).map((note) => (
            <article key={note.id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <AvatarImage
                  imageUrl={note.author?.profileImageUrl || note.createdByUser?.profileImageUrl || null}
                  fallback={note.author?.name || note.createdByUser?.name || 'U'}
                  sizeClassName="h-7 w-7"
                />
                <p className="text-xs text-slate-500">{note.author?.name || note.createdByUser?.name || 'Usuario'}</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-800">{note.note}</p>
                <span className={`chip ${note.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {note.isInternal ? 'Interna' : 'Pública'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{note.createdAt ? dateTime(note.createdAt) : 'Sin fecha'}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="btn-secondary h-9 px-3"
                  onClick={() =>
                    runApi(async () => {
                      await updateVisitNote(visitId, note.id, { isInternal: !note.isInternal });
                      await queryClient.invalidateQueries({ queryKey: ['visit-notes', visitId] });
                    })
                  }
                >
                  Cambiar visibilidad
                </button>
                <MediaQuickAttach
                  onSelect={(file) =>
                    withUploading(async () => {
                      await uploadVisitNoteAttachment(note.id, file);
                      await queryClient.invalidateQueries({ queryKey: ['visit-note-attachments'] });
                    })
                  }
                />
              </div>
              <div className="mt-2 space-y-1">
                {(noteAttachmentsQueries.data?.[note.id] || []).map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs">
                    <AttachmentPreview attachment={attachment} onOpen={setMediaPreview} />
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() =>
                        runApi(async () => {
                          await deleteVisitNoteAttachment(note.id, attachment.id);
                          await queryClient.invalidateQueries({ queryKey: ['visit-note-attachments'] });
                        })
                      }
                    >
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Agregados</h3>
              <button
                type="button"
                className="btn-primary h-10 px-3"
                onClick={() => setIsServiceModalOpen(true)}
              >
                Agregar servicio
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Aquí administras servicios y refacciones de la visita.</p>
          </div>
          {adjustService ? (
            <article className="rounded-xl border border-indigo-300 bg-indigo-50 p-3" onDoubleClick={() => setServiceDetailModalId(adjustService.id)}>
              <p className="text-xs font-semibold uppercase text-indigo-700">Servicio de ajuste</p>
              <button
                type="button"
                className="mt-1 text-left text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
                onClick={() => setServiceDetailModalId(adjustService.id)}
              >
                {adjustService.name || 'Servicio ajuste'}
              </button>
              <p className="text-xs text-slate-600">
                Cantidad: {adjustService.quantity || 1} · Precio: {currency(Number(adjustService.price || 0))}
              </p>
              <div className="mt-1">
                <VisitServiceStatusChip
                  label={typeof adjustService.status === 'object' ? adjustService.status?.name || 'Sin estatus' : 'Sin estatus'}
                  color={typeof adjustService.status === 'object' ? adjustService.status?.color : undefined}
                  disabled={!serviceStatusOptions.length}
                  loading={updateServiceStatusMutation.isPending && statusSheetServiceId === adjustService.id}
                  onClick={() => setStatusSheetServiceId(adjustService.id)}
                />
              </div>
              <p className="mt-1 text-xs text-indigo-700">
                Notas: {(serviceNotesQuery.data?.[adjustService.id] || []).length} (doble click para detalle)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary h-8 px-3"
                  onClick={() => {
                    setNoteModalServiceId(adjustService.id);
                    setNoteModalIsInternal(true);
                    setNoteModalText('');
                    setNoteModalFiles([]);
                  }}
                >
                  Agregar nota
                </button>
                <button type="button" className="btn-secondary h-8 px-3" onClick={() => setIsAdjustSwitchModalOpen(true)}>Modificar ajuste</button>
                <button type="button" className="btn-secondary h-8 px-3" onClick={() => setDeleteServiceModal({ serviceId: adjustService.id, reason: '' })}>Eliminar</button>
              </div>
            </article>
          ) : null}
          {regularServices.map((service) => (
            <article key={service.id} className="rounded-xl border border-slate-200 p-3" onDoubleClick={() => setServiceDetailModalId(service.id)}>
              <div className="rounded-lg bg-slate-50 p-2">
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
                  onClick={() => setServiceDetailModalId(service.id)}
                >
                  {service.name || 'Servicio'}
                </button>
                <p className="text-xs text-slate-500">
                  Cantidad: {service.quantity || 1} · Precio: {currency(Number(service.price || 0))}
                </p>
                <div className="mt-1">
                  <VisitServiceStatusChip
                    label={typeof service.status === 'object' ? service.status?.name || 'Sin estatus' : 'Sin estatus'}
                    color={typeof service.status === 'object' ? service.status?.color : undefined}
                    disabled={!serviceStatusOptions.length}
                    loading={updateServiceStatusMutation.isPending && statusSheetServiceId === service.id}
                    onClick={() => setStatusSheetServiceId(service.id)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-600">Notas: {(serviceNotesQuery.data?.[service.id] || []).length} (doble click para detalle)</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary h-8 px-3"
                  onClick={() => {
                    setNoteModalServiceId(service.id);
                    setNoteModalIsInternal(true);
                    setNoteModalText('');
                    setNoteModalFiles([]);
                  }}
                >
                  Agregar nota
                </button>
                <button type="button" className="btn-secondary h-8 px-3" onClick={() => setIsServiceModalOpen(true)}>Modificar</button>
                <button
                  type="button"
                  className="btn-secondary h-8 px-3"
                  onClick={() => setDeleteServiceModal({ serviceId: service.id, reason: '' })}
                >
                  Eliminar servicio
                </button>
              </div>
            </article>
          ))}
          <VisitPartsSection
            visitId={visitId}
            workshopId={workshopId}
            services={servicesQuery.data || []}
          />
        </section>
      ) : null}

      {tab === 'finance' ? (
        <>
          <VisitPaymentsSection
            visitId={visitId}
            paymentMethods={paymentMethods}
            fallbackVisitTotal={Number(visit.total || 0)}
          />
        </>
      ) : null}

      {tab === 'tracking' ? (
        <section className="card space-y-3 p-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-800">Tracking interno</h3>
            <p className="mt-1 break-all text-xs text-sky-700">{resolvedTrackingUrl || 'No disponible'}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="btn-secondary h-9 px-3"
                onClick={handleCopyTrackingUrl}
                disabled={!resolvedTrackingUrl}
              >
                Copiar
              </button>
              <button type="button" className="btn-primary h-9 px-3" onClick={() => setIsRegenerateModalOpen(true)}>Regenerar</button>
            </div>
          </div>
          {timelineQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : !normalizedTrackingItems.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
              Aún no hay eventos en el timeline.
            </div>
          ) : (
            <div className="space-y-2">
              {normalizedTrackingItems.map((event) => {
                const isPaymentEvent = event.type.includes('PAYMENT');
                const paymentMetadata = event.metadata as Record<string, unknown>;
                const parsedNotes = parseEvidenceMarkerFromNotes(String(paymentMetadata?.notes || ''));
                const paymentAttachments = getTimelinePaymentAttachments({
                  ...event,
                  payment: event.payment || (paymentMetadata?.payment as { attachments?: NoteAttachment[]; mediaIds?: string[] } | null) || null,
                });
                return (
                  <article
                    key={`${event.type}-${event.occurredAt}-${event.title}`}
                    className={`rounded-xl border p-3 ${getTimelineEventTone(event.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-lg">
                        {getTimelineEventIcon(event.type)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          {event.actor?.name ? (
                            <div className="flex items-center gap-2">
                              <AvatarImage
                                imageUrl={event.actor.profileImageUrl || null}
                                fallback={event.actor.name}
                                sizeClassName="h-7 w-7"
                              />
                              <p className="text-xs text-slate-600">{event.actor.name}</p>
                            </div>
                          ) : <span />}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{event.type === 'PAYMENT_ADDED' ? 'Se registró un abono' : event.title}</p>
                        {event.description ? <p className="mt-0.5 text-xs text-slate-600">{event.description}</p> : null}
                        <p className="mt-1 text-xs text-slate-500">{event.occurredAt ? dateTime(event.occurredAt) : '-'}</p>

                        {isPaymentEvent ? (
                          <div className="mt-2 rounded-lg border border-emerald-200 bg-white/90 p-2 text-xs text-slate-700">
                            <p className="text-sm font-semibold text-emerald-800">
                              {currency(Number(paymentMetadata?.amount || 0))}
                              <span className="ml-2 text-xs font-medium text-slate-600">
                                • {String(paymentMetadata?.method || 'Método no especificado')}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {paymentMetadata?.paidAt ? dateTime(String(paymentMetadata.paidAt)) : 'Sin fecha de pago'}
                            </p>
                            {parsedNotes.cleanNotes ? <p className="mt-1">{parsedNotes.cleanNotes}</p> : null}
                            {paymentAttachments.length ? (
                              <div className="mt-2">
                                <PaymentAttachmentGallery
                                  attachments={paymentAttachments}
                                  compact
                                  onOpen={(item) => {
                                    if (!item.publicUrl) return;
                                    setMediaPreview({
                                      url: item.publicUrl,
                                      mimeType: item.mimeType || '',
                                      name: item.originalName,
                                    });
                                  }}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {(event.attachments || []).length ? (
                          <div className="mt-2 space-y-1">
                            {(event.attachments || []).map((attachment) => (
                              <div key={attachment.id} className="rounded bg-white/70 p-1">
                                <AttachmentPreview attachment={attachment} onOpen={setMediaPreview} />
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      <VisitServiceStatusSheet
        open={!!statusSheetServiceId}
        title={selectedServiceForStatus?.name ? `Cambiar estatus · ${selectedServiceForStatus.name}` : 'Cambiar estatus'}
        statuses={serviceStatusOptions}
        currentStatusId={typeof selectedServiceForStatus?.status === 'object' ? selectedServiceForStatus.status?.id : undefined}
        loading={updateServiceStatusMutation.isPending}
        onClose={() => setStatusSheetServiceId(null)}
        onSelect={(status) => {
          if (!selectedServiceForStatus) return;
          const applyStatus = () =>
            runApi(async () => {
              await updateServiceStatusMutation.mutateAsync({
                visitId,
                serviceId: selectedServiceForStatus.id,
                statusId: status.id,
              });
              setStatusSheetServiceId(null);
            }).catch((error) => {
              const fallback = getErrorMessage(error);
              if (error && typeof error === 'object' && 'response' in error) {
                const maybe = error as { response?: { data?: { message?: string | string[] } } };
                const msg = maybe.response?.data?.message;
                if (msg) notifyError(Array.isArray(msg) ? msg.join(', ') : msg);
                else notifyError(fallback);
              } else {
                notifyError(fallback);
              }
            });

          if (status.isTerminal) {
            setConfirmModal({
              title: 'Confirmar estatus terminal',
              message: `¿Cambiar a "${status.name}"?`,
              action: applyStatus,
            });
            return;
          }
          void applyStatus();
        }}
      />

      {isStatusModalOpen ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[140] flex items-end bg-black/40 p-3">
            <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Cambiar estado de la visita</h4>
            <p className="mt-1 text-xs text-slate-500">Estado actual: <span className="font-semibold">{currentStatus}</span></p>
            <div className="mt-2 space-y-2">
              {(statusesQuery.data || []).map((status) => (
                <button
                  key={status.id}
                  type="button"
                  className={`w-full rounded-lg border p-2 text-left ${status.id === selectedStatusId ? 'border-sky-300 bg-sky-50' : 'border-slate-200'}`}
                  onClick={() => {
                    setSelectedStatusId(status.id);
                  }}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color || '#64748B' }} />
                    {status.name}
                  </span>
                </button>
              ))}
            </div>
            {isTerminatedSelection ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">Archivo opcional al terminar</p>
                <p className="mt-1 text-xs text-slate-500">Si subes una imagen, backend la marcará como portada principal.</p>
                <label className="btn-secondary mt-2 h-9 w-full cursor-pointer justify-center text-xs">
                  Subir foto/archivo
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf"
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      if (files.length) statusUpload.addFiles(files);
                      event.target.value = '';
                    }}
                  />
                </label>
                {!!statusUpload.items.length ? (
                  <div className="mt-2 space-y-1">
                    {statusUpload.items.map((item) => (
                      <div key={item.localId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1">
                        <p className="truncate text-xs text-slate-700">{item.file.name}</p>
                        <p className="text-[11px] text-slate-500">{item.status === 'done' ? 'Listo' : item.status === 'error' ? 'Error' : 'Subiendo...'}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className="btn-secondary mt-3 h-10 w-full justify-center"
              onClick={() => {
                setIsStatusModalOpen(false);
                setSelectedStatusId('');
                statusUpload.items.forEach((item) => statusUpload.removeFile(item.localId));
              }}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn-primary mt-2 h-10 w-full justify-center"
              disabled={!selectedStatusId || statusUpload.hasBlockingUploads || changeVisitStatusMutation.isPending}
              onClick={() => void submitVisitStatusChange()}
            >
              {changeVisitStatusMutation.isPending ? 'Guardando...' : 'Guardar estado'}
            </button>
            </div>
          </div>
        </OverlayPortal>
      ) : null}

      {isCancelVisitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3">
          <div className="w-full rounded-2xl bg-white p-4">
            <h4 className="text-sm font-semibold text-rose-700">Cancelar visita</h4>
            <p className="mt-1 text-sm text-slate-600">Esta acción cambiará el estatus de la visita a cancelado.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setIsCancelVisitModalOpen(false)}>No</button>
              <button
                type="button"
                className="h-10 rounded-xl bg-rose-600 px-3 text-sm font-semibold text-white"
                onClick={() => {
                  const cancelled = (statusesQuery.data || []).find((status) =>
                    (status.slug || '').toLowerCase().includes('cancel') || status.name.toLowerCase().includes('cancel'),
                  );
                  if (cancelled) {
                    setEditPayload((current) => ({ ...current, statusId: cancelled.id }));
                    updateVisitMutation.mutate();
                  }
                  setIsCancelVisitModalOpen(false);
                }}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
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
            <textarea
              className="input mt-2 min-h-16"
              placeholder="Nota para el servicio (opcional)"
              value={catalogServiceNote}
              onChange={(event) => setCatalogServiceNote(event.target.value)}
            />
            <textarea
              className="input mt-2 min-h-16"
              placeholder="Nota inicial del servicio (opcional)"
              value={initialServiceNote}
              onChange={(event) => setInitialServiceNote(event.target.value)}
            />
            <button
              type="button"
              className={`mt-2 flex h-9 w-full items-center justify-center rounded-xl text-xs font-semibold ${initialServiceNoteIsInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
              onClick={() => setInitialServiceNoteIsInternal((value) => !value)}
            >
              {initialServiceNoteIsInternal ? '🔒 Nota inicial interna' : '🌍 Nota inicial pública'}
            </button>
            <label className="btn-secondary mt-2 h-9 w-full cursor-pointer justify-center text-xs">
              Adjuntar archivos a nota inicial
              <input
                type="file"
                multiple
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  setInitialServiceNoteFiles(files);
                  event.target.value = '';
                }}
              />
            </label>
            {initialServiceNoteFiles.length ? (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                {initialServiceNoteFiles.map((file) => (
                  <p key={`${file.name}-${file.size}`} className="truncate text-xs text-slate-600">{file.name}</p>
                ))}
              </div>
            ) : null}

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

            <button
              type="button"
              className="btn-secondary mt-3 h-10 w-full justify-center"
              onClick={() => {
                setCatalogServiceNote('');
                setInitialServiceNote('');
                setInitialServiceNoteIsInternal(false);
                setInitialServiceNoteFiles([]);
                setIsServiceModalOpen(false);
              }}
            >
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
              className={`mt-2 flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold ${noteModalIsInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
              onClick={() => setNoteModalIsInternal((value) => !value)}
            >
              {noteModalIsInternal ? '🔒 Interna (oculta en tracking)' : '🌍 Pública (visible en tracking)'}
            </button>
            <EvidenceUploader
              items={noteModalFiles}
              maxFiles={4}
              onAddFiles={(files) =>
                setNoteModalFiles((current) => {
                  const slotsLeft = Math.max(0, 4 - current.length);
                  if (!slotsLeft) return current;
                  const nextFiles = files.slice(0, slotsLeft).map((file) => ({
                    id: crypto.randomUUID(),
                    file,
                    status: 'queued' as const,
                    errorMessage: null,
                  }));
                  return [...current, ...nextFiles];
                })
              }
              onRetry={(itemId) =>
                setNoteModalFiles((current) =>
                  current.map((item) => (item.id === itemId ? { ...item, status: 'queued', errorMessage: null } : item)),
                )
              }
              onRemove={(itemId) => setNoteModalFiles((current) => current.filter((item) => item.id !== itemId))}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-secondary h-10 justify-center"
                onClick={() => {
                  setNoteModalServiceId(null);
                  setNoteModalFiles([]);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary h-10 justify-center"
                onClick={() => void submitServiceNoteModal()}
                disabled={!noteModalText.trim() || noteModalFiles.some((item) => item.status === 'uploading' || item.status === 'completing')}
              >
                Guardar
              </button>
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
        <OverlayPortal>
          <div className="fixed inset-0 z-[170] flex items-end bg-black/55 p-3 sm:items-center sm:justify-center">
            <div className="w-full rounded-2xl bg-white p-4 shadow-2xl sm:max-w-md">
              <h4 className="text-sm font-semibold text-slate-900">{confirmModal.title}</h4>
              <p className="mt-1 text-sm text-slate-700">{confirmModal.message}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setConfirmModal(null)}>Cancelar</button>
                <button
                  type="button"
                  className="btn-primary h-10 justify-center"
                  onClick={async () => {
                    try {
                      await confirmModal.action();
                      setConfirmModal(null);
                    } catch (error) {
                      const fallback = getErrorMessage(error);
                      if (error && typeof error === 'object' && 'response' in error) {
                        const maybe = error as { response?: { data?: { message?: string | string[] } } };
                        const message = maybe.response?.data?.message;
                        if (message) {
                          notifyError(Array.isArray(message) ? message.join(', ') : message);
                          return;
                        }
                      }
                      notifyError(fallback);
                    }
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}

      {isArchiveModalOpen ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-3 sm:items-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900">Archivar visita</h3>
              <p className="mt-1 text-sm text-slate-600">Puedes agregar un motivo opcional antes de archivar.</p>
              <textarea
                className="input mt-3 min-h-24 w-full resize-none py-2"
                placeholder="Motivo (opcional)"
                value={archiveReason}
                onChange={(event) => setArchiveReason(event.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-secondary h-10 flex-1 justify-center"
                  onClick={() => {
                    setIsArchiveModalOpen(false);
                    setArchiveReason('');
                  }}
                  disabled={archiveMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary h-10 flex-1 justify-center"
                  onClick={() => {
                    archiveMutation.mutate(
                      { instrumentId, visitId, reason: archiveReason.trim() || undefined },
                      {
                        onSuccess: () => {
                          setIsArchiveModalOpen(false);
                          setArchiveReason('');
                        },
                      },
                    );
                  }}
                  disabled={archiveMutation.isPending}
                >
                  {archiveMutation.isPending ? 'Archivando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}

      {selectedServiceDetail ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[145] bg-slate-950/50 p-0 sm:p-4">
            <div className="h-full w-full overflow-y-auto bg-white sm:mx-auto sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">{selectedServiceDetail.name || 'Detalle de servicio'}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Cantidad: {selectedServiceDetail.quantity || 1} · Precio: {currency(Number(selectedServiceDetail.price || 0))}
                  </p>
                </div>
                <button type="button" className="btn-secondary h-9 px-3" onClick={() => setServiceDetailModalId(null)}>
                  Cerrar
                </button>
              </div>
            </header>
            <div className="space-y-3 p-4">
              {(serviceNotesQuery.data?.[selectedServiceDetail.id] || [])
                .slice()
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .map((note) => (
                <div key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${note.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {note.isInternal ? 'Interna' : 'Pública'}
                    </span>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${note.isInternal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                      onClick={() =>
                        runApi(async () => {
                          await patchVisitServiceNote(selectedServiceDetail.id, note.id, { isInternal: !note.isInternal });
                          await queryClient.invalidateQueries({ queryKey: ['service-notes-batch'] });
                        })
                      }
                    >
                      {note.isInternal ? 'Hacer pública' : 'Hacer interna'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {note.createdAt ? dateTime(note.createdAt) : 'Sin fecha'}
                  </p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                    <p className="text-sm text-slate-800">{note.note || 'Sin mensaje'}</p>
                  </div>
                  {(serviceAttachmentsQuery.data?.[note.id] || []).length ? (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {(serviceAttachmentsQuery.data?.[note.id] || []).map((attachment) => (
                        <div key={attachment.id} className="rounded-lg border border-slate-200 bg-white p-2">
                          <AttachmentInlinePreview attachment={attachment} onOpen={setMediaPreview} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Sin adjuntos en esta nota.</p>
                  )}
                </div>
              ))}
            </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}

      {mediaPreview ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-3" onClick={() => setMediaPreview(null)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-3" onClick={(event) => event.stopPropagation()}>
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
        </OverlayPortal>
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

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}

function MetricHeader({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 ${emphasized ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${emphasized ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function AvatarImage({ imageUrl, fallback, sizeClassName = 'h-8 w-8' }: { imageUrl?: string | null; fallback: string; sizeClassName?: string }) {
  const initials = fallback
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  if (imageUrl) {
    return <img src={imageUrl} alt={fallback} className={`${sizeClassName} rounded-full object-cover`} />;
  }
  return (
    <span className={`${sizeClassName} inline-flex items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700`}>
      {initials || 'US'}
    </span>
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

function AttachmentInlinePreview({ attachment, onOpen }: { attachment: NoteAttachment; onOpen: (payload: { url: string; mimeType: string; name: string }) => void }) {
  const url = attachment.url || attachment.publicUrl || '';
  const mimeType = detectMimeType(attachment);
  const label = attachment.originalName || attachment.id;
  if (!url) return <p className="truncate text-xs text-slate-500">{label}</p>;
  const open = () => onOpen({ url, mimeType, name: label });

  if (mimeType.startsWith('image/')) {
    return (
      <button type="button" onClick={open} className="space-y-1 text-left">
        <img src={url} alt={label} className="h-24 w-full rounded object-cover" />
        <p className="truncate text-[11px] text-slate-600">{label}</p>
      </button>
    );
  }
  if (mimeType.startsWith('video/')) {
    return (
      <div className="space-y-1">
        <video src={url} controls className="h-28 w-full rounded object-cover" />
        <button type="button" onClick={open} className="text-xs text-sky-700">Abrir video</button>
      </div>
    );
  }
  if (mimeType.startsWith('audio/')) {
    return (
      <div className="space-y-1">
        <audio src={url} controls className="w-full" />
        <button type="button" onClick={open} className="text-xs text-sky-700">Abrir audio</button>
      </div>
    );
  }
  return (
    <button type="button" onClick={open} className="truncate text-xs text-sky-700">{label}</button>
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
