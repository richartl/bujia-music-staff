import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Phone,
  PlusCircle,
  Trash2,
  UserPlus2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { authStore } from '@/stores/auth-store';
import { currency, cn } from '@/lib/utils';
import { notifyError, notifySuccess } from '@/lib/notify';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SearchInput } from '@/components/ui/SearchInput';
import { InputField } from '@/components/ui/InputField';
import { BaseCard } from '@/components/ui/BaseCard';
import { StepProgress } from '@/components/ui/StepProgress';
import { OverlayPortal } from '@/components/ui/OverlayPortal';
import { searchClientByPhone, type ClientSearchItem } from '../api/search-client';
import { createIntake } from '../api/create-intake';
import { getClientInstruments } from '../api/get-client-instruments';
import { getIntakeLookups } from '../api/get-intake-lookups';
import { CatalogSelectWithCustom } from '../components/CatalogSelectWithCustom';
import { IntakeMediaUploader } from '../components/IntakeMediaUploader';
import {
  createWorkshopBrand,
  createWorkshopColor,
  createWorkshopTuning,
} from '@/features/catalogs/api/create-catalog-items';
import { useWorkshopParts } from '@/features/visits/hooks/useVisitParts';
import type {
  ClientInstrument,
  CreateIntakePayload,
  IntakePartLine,
  IntakeServiceLine,
  WorkshopServiceLookup,
} from '../types';

const PHONE_SEARCH_DEBOUNCE_MS = 250;
const PHONE_SEARCH_MIN_LENGTH = 3;

type IntakeStep = 'client' | 'instrument' | 'services' | 'visit';
type CatalogKind = 'brand' | 'color' | 'desiredTuning';
type IntakePaymentLine = {
  id: string;
  paymentMethodId: string;
  amount: string;
  notes: string;
  paidAt: string;
};

const STEP_ORDER: IntakeStep[] = ['client', 'instrument', 'services', 'visit'];

const STEP_LABEL: Record<IntakeStep, string> = {
  client: 'Cliente',
  instrument: 'Instrumento',
  services: 'Servicios',
  visit: 'Cierre',
};

const EMPTY_CLIENT_FORM = {
  fullName: '',
  phone: '',
  instagram: '',
};

const EMPTY_INSTRUMENT_FORM = {
  instrumentTypeId: '',
  brandId: '',
  customBrand: '',
  colorId: '',
  customColor: '',
  model: '',
  serialNumber: '',
};

function normalizePhoneInput(value: string) {
  return value.replace(/[^\d+]/g, '');
}

function capitalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function toIsoDateFromDisplay(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function splitFullName(fullName: string) {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return { firstName: '', lastName: '' };
  const parts = cleaned.split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

function getClientDisplayName(client: ClientSearchItem) {
  if (client.fullName?.trim()) return client.fullName.trim();
  return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre';
}

function createCatalogServiceLine(service: WorkshopServiceLookup): IntakeServiceLine {
  return {
    id: crypto.randomUUID(),
    source: 'CATALOG',
    catalogServiceId: service.id,
    name: service.name,
    quantity: 1,
    unitPrice: Number(service.basePrice || 0),
    notes: '',
  };
}

function createManualServiceLine(): IntakeServiceLine {
  return {
    id: crypto.randomUUID(),
    source: 'MANUAL',
    name: '',
    quantity: 1,
    unitPrice: 0,
    notes: '',
  };
}

function createManualPartLine(): IntakePartLine {
  return {
    id: crypto.randomUUID(),
    source: 'MANUAL',
    name: '',
    quantity: 1,
    unitPrice: 0,
    unitCost: 0,
    notes: '',
    visitServiceId: '',
  };
}

function createEmptyPaymentLine(): IntakePaymentLine {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return {
    id: crypto.randomUUID(),
    paymentMethodId: '',
    amount: '',
    notes: '',
    paidAt: `${day}/${month}/${year}`,
  };
}

export function IntakesPage() {
  const workshopId = authStore((state) => state.workshopId);
  const token = authStore((state) => state.token);

  const [activeStep, setActiveStep] = useState<IntakeStep>('client');
  const [searchPhone, setSearchPhone] = useState('');
  const debouncedSearchPhone = useDebouncedValue(searchPhone.trim(), PHONE_SEARCH_DEBOUNCE_MS);
  const [searchingClient, setSearchingClient] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<ClientSearchItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchItem | null>(null);
  const [isNewClientMode, setIsNewClientMode] = useState(false);

  const [selectedInstrument, setSelectedInstrument] = useState<ClientInstrument | null>(null);
  const [isNewInstrumentMode, setIsNewInstrumentMode] = useState(false);

  const [clientForm, setClientForm] = useState(EMPTY_CLIENT_FORM);
  const [instrumentForm, setInstrumentForm] = useState(EMPTY_INSTRUMENT_FORM);
  const [serviceLines, setServiceLines] = useState<IntakeServiceLine[]>([]);
  const [isManualServiceModalOpen, setIsManualServiceModalOpen] = useState(false);
  const [manualServiceDraft, setManualServiceDraft] = useState({ name: '', quantity: '1', unitPrice: '0', notes: '' });
  const [partLines, setPartLines] = useState<IntakePartLine[]>([]);

  const [branchId, setBranchId] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');
  const [wantsStringChange, setWantsStringChange] = useState(false);
  const [desiredTuningId, setDesiredTuningId] = useState('');
  const [stringGaugeId, setStringGaugeId] = useState('');
  const [cuerdaMediaNote, setCuerdaMediaNote] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [estimatedDiscount, setEstimatedDiscount] = useState('');
  const [customDesiredTuning, setCustomDesiredTuning] = useState('');
  const [hasStrap, setHasStrap] = useState(false);
  const [hasCase, setHasCase] = useState(false);
  const [expandedServiceIds, setExpandedServiceIds] = useState<string[]>([]);
  const [serviceToast, setServiceToast] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showConfirmIntakeModal, setShowConfirmIntakeModal] = useState(false);
  const [customCatalogModal, setCustomCatalogModal] = useState<{
    kind: CatalogKind;
    title: string;
    placeholder: string;
  } | null>(null);
  const [customCatalogName, setCustomCatalogName] = useState('');
  const [localBrands, setLocalBrands] = useState<{ id: string; name: string }[]>([]);
  const [localColors, setLocalColors] = useState<{ id: string; name: string }[]>([]);
  const [localTunings, setLocalTunings] = useState<{ id: string; name: string }[]>([]);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [paymentLines, setPaymentLines] = useState<IntakePaymentLine[]>([]);
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);
  const [hasBlockingMediaUploads, setHasBlockingMediaUploads] = useState(false);
  const [mediaToast, setMediaToast] = useState('');

  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const lookupsQuery = useQuery({
    queryKey: ['intake-lookups', workshopId],
    queryFn: () => getIntakeLookups(workshopId!),
    enabled: !!workshopId,
    staleTime: 1000 * 60 * 10,
  });

  const instrumentsQuery = useQuery({
    queryKey: ['intake-client-instruments', workshopId, selectedClient?.id],
    queryFn: () => getClientInstruments(workshopId!, selectedClient!.id),
    enabled: !!workshopId && !!selectedClient?.id,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!lookupsQuery.data?.branches?.length) return;
    if (branchId) return;
    setBranchId(lookupsQuery.data.branches[0].id);
  }, [lookupsQuery.data?.branches, branchId]);

  useEffect(() => {
    if (!selectedClient) {
      setSelectedInstrument(null);
      setIsNewInstrumentMode(false);
      return;
    }
    const instruments = instrumentsQuery.data || [];
    if (instruments.length === 1) {
      setSelectedInstrument(instruments[0]);
      setIsNewInstrumentMode(false);
    } else if (!instruments.length) {
      setSelectedInstrument(null);
      setIsNewInstrumentMode(true);
    }
  }, [selectedClient, instrumentsQuery.data]);

  const clientSearchQuery = useQuery({
    queryKey: ['intake-client-search', workshopId, debouncedSearchPhone],
    queryFn: ({ signal }) =>
      searchClientByPhone(workshopId!, debouncedSearchPhone, { signal }),
    enabled:
      !!workshopId &&
      !selectedClient &&
      debouncedSearchPhone.length >= PHONE_SEARCH_MIN_LENGTH,
    staleTime: 1000 * 15,
    retry: 1,
  });

  useEffect(() => {
    const normalizedPhone = debouncedSearchPhone;
    if (normalizedPhone.length < PHONE_SEARCH_MIN_LENGTH || selectedClient) {
      setSearchResults([]);
      setSearchError('');
      setSearchingClient(false);
      return;
    }

    setSearchingClient(clientSearchQuery.isFetching);
    if (clientSearchQuery.isError) {
      setSearchError('No se pudo buscar cliente. Revisa conexión/API.');
      setSearchResults([]);
      return;
    }

    const result = clientSearchQuery.data || [];
    setSearchResults(result);
    setSearchError('');
    if (!clientSearchQuery.isFetching) {
      if (result.length === 0) {
        setIsNewClientMode(true);
        setClientForm((current) => ({ ...current, phone: normalizedPhone }));
      } else if (!selectedClient) {
        setIsNewClientMode(false);
      }
    }
  }, [clientSearchQuery.data, clientSearchQuery.isError, clientSearchQuery.isFetching, debouncedSearchPhone, selectedClient]);

  const catalogServices = lookupsQuery.data?.services || [];
  const adjustServices = catalogServices.filter((service) => service.isAdjust);
  const regularServices = catalogServices.filter((service) => !service.isAdjust);
  const brandsOptions = [...(lookupsQuery.data?.brands || []), ...localBrands];
  const colorsOptions = [...(lookupsQuery.data?.colors || []), ...localColors];
  const tuningOptions = [...(lookupsQuery.data?.tunings || []), ...localTunings];
  const instruments = instrumentsQuery.data || [];

  const adjustServiceIds = useMemo(
    () => new Set(catalogServices.filter((item) => item.isAdjust).map((item) => item.id)),
    [catalogServices],
  );
  const selectedAdjustLine = useMemo(
    () =>
      serviceLines.find((line) => line.catalogServiceId && adjustServiceIds.has(line.catalogServiceId)) ||
      null,
    [adjustServiceIds, serviceLines],
  );

  const total = useMemo(
    () => serviceLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [serviceLines],
  );
  const partsCatalogQuery = useWorkshopParts(workshopId, true);

  const canMoveToInstrument =
    !!selectedClient || (isNewClientMode && !!clientForm.fullName.trim() && !!clientForm.phone.trim());
  const canMoveToServices =
    canMoveToInstrument &&
    (!!selectedInstrument ||
      ((isNewInstrumentMode || !selectedClient) &&
        !!instrumentForm.instrumentTypeId &&
        (!!instrumentForm.brandId || !!instrumentForm.customBrand.trim()) &&
        !!instrumentForm.model.trim()));
  const canMoveToVisit = canMoveToServices && serviceLines.length > 0 && !!desiredTuningId;
  const hasVisitDetails =
    !!intakeNotes.trim() ||
    !!visitNote.trim() ||
    !!estimatedDiscount.trim() ||
    hasStrap ||
    hasCase ||
    !!affiliateCode.trim() ||
    paymentLines.some((line) => Number(line.amount || 0) > 0);
  const canSubmitIntake = canMoveToVisit && !!branchId && hasVisitDetails && !hasBlockingMediaUploads;
  const filteredRegularServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return regularServices;
    return regularServices.filter((service) => service.name.toLowerCase().includes(query));
  }, [regularServices, serviceSearch]);

  useEffect(() => {
    if (!serviceToast) return;
    const timer = window.setTimeout(() => setServiceToast(''), 1200);
    return () => window.clearTimeout(timer);
  }, [serviceToast]);

  useEffect(() => {
    if (!mediaToast) return;
    notifyError('Error al subir archivo', mediaToast);
  }, [mediaToast]);

  useEffect(() => {
    if (!mediaToast) return;
    const timer = window.setTimeout(() => setMediaToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [mediaToast]);

  useEffect(() => {
    if (!showSuccessOverlay) return;
    const timer = window.setTimeout(() => setShowSuccessOverlay(false), 1600);
    return () => window.clearTimeout(timer);
  }, [showSuccessOverlay]);

  function goNextStep() {
    const idx = STEP_ORDER.indexOf(activeStep);
    if (idx >= STEP_ORDER.length - 1) return;
    const next = STEP_ORDER[idx + 1];
    if (next === 'instrument' && !canMoveToInstrument) return;
    if (next === 'services' && !canMoveToServices) return;
    if (next === 'visit' && !canMoveToVisit) return;
    setActiveStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goPrevStep() {
    const idx = STEP_ORDER.indexOf(activeStep);
    if (idx <= 0) return;
    setActiveStep(STEP_ORDER[idx - 1]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetClientSelection() {
    setSelectedClient(null);
    setSelectedInstrument(null);
    setIsNewClientMode(false);
    setIsNewInstrumentMode(false);
    setSearchResults([]);
    setSearchError('');
    setClientForm(EMPTY_CLIENT_FORM);
  }

  function resetInstrumentSelection() {
    setSelectedInstrument(null);
    setInstrumentForm(EMPTY_INSTRUMENT_FORM);
    setIsNewInstrumentMode(!selectedClient);
  }

  function onSelectClient(client: ClientSearchItem) {
    setSelectedClient(client);
    setIsNewClientMode(false);
    setSearchError('');
    setClientForm({
      fullName: getClientDisplayName(client),
      phone: client.phone || '',
      instagram: client.instagram || '',
    });
    setSearchPhone(client.phone || '');
    setSearchResults([]);
    setActiveStep('instrument');
  }

  function onAddCatalogService(service: WorkshopServiceLookup) {
    setSubmitError('');
    setServiceLines((current) => {
      if (service.isAdjust) {
        if (selectedAdjustLine?.catalogServiceId === service.id) return current;
        const nextAdjustLine = createCatalogServiceLine(service);
        const withoutAdjust = current.filter(
          (line) => !(line.catalogServiceId && adjustServiceIds.has(line.catalogServiceId)),
        );
        return [...withoutAdjust, nextAdjustLine];
      }
      return [...current, createCatalogServiceLine(service)];
    });
    setServiceToast(`Servicio agregado: ${service.name}`);
  }

  function onAddManualService() {
    setManualServiceDraft({ name: '', quantity: '1', unitPrice: '0', notes: '' });
    setIsManualServiceModalOpen(true);
  }

  function confirmManualServiceFromModal() {
    const name = manualServiceDraft.name.trim();
    const quantity = Number(manualServiceDraft.quantity);
    const unitPrice = Number(manualServiceDraft.unitPrice);
    if (!name) {
      setSubmitError('El nombre del servicio manual es obligatorio.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setSubmitError('La cantidad del servicio manual debe ser mayor a 0.');
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setSubmitError('El precio del servicio manual debe ser mayor o igual a 0.');
      return;
    }
    const newLine = createManualServiceLine();
    setServiceLines((current) => [
      ...current,
      {
        ...newLine,
        name,
        quantity,
        unitPrice,
        notes: manualServiceDraft.notes.trim(),
      },
    ]);
    setExpandedServiceIds((current) => [...current, newLine.id]);
    setServiceToast('Servicio manual agregado');
    setIsManualServiceModalOpen(false);
  }

  function onUpdateServiceLine(id: string, updates: Partial<IntakeServiceLine>) {
    setServiceLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...updates } : line)),
    );
  }

  function onRemoveServiceLine(id: string) {
    setServiceLines((current) => current.filter((line) => line.id !== id));
    setExpandedServiceIds((current) => current.filter((item) => item !== id));
  }

  function toggleServiceLine(id: string) {
    setExpandedServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function addPaymentLine() {
    setPaymentLines((current) => [...current, createEmptyPaymentLine()]);
  }

  function updatePaymentLine(id: string, updates: Partial<IntakePaymentLine>) {
    setPaymentLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...updates } : line)),
    );
  }

  function removePaymentLine(id: string) {
    setPaymentLines((current) => current.filter((line) => line.id !== id));
  }

  function openCustomCatalogModal(kind: CatalogKind) {
    const modalByKind = {
      brand: { title: 'Nueva marca', placeholder: 'Ej. Fender' },
      color: { title: 'Nuevo color', placeholder: 'Ej. Sunburst' },
      desiredTuning: { title: 'Nueva afinación deseada', placeholder: 'Ej. Drop C' },
    } as const;
    setCustomCatalogName('');
    setCustomCatalogModal({ kind, ...modalByKind[kind] });
  }

  async function saveCustomCatalogOption() {
    if (!customCatalogModal) return;
    const cleanName = customCatalogName.trim();
    if (!cleanName) return;
    const normalizedName = capitalizeWords(cleanName);
    const normalizedSlug = toSlug(cleanName);
    if (!workshopId || !token) {
      setSubmitError('No se pudo guardar opción de catálogo: falta sesión activa.');
      return;
    }

    setSubmitError('');
    try {
      if (customCatalogModal.kind === 'brand') {
        const created = await createWorkshopBrand(token, workshopId, {
          name: normalizedName,
          slug: normalizedSlug,
        });
        const newOption = { id: created.id, name: created.name };
        setLocalBrands((current) => [...current, newOption]);
        setInstrumentForm((current) => ({ ...current, brandId: newOption.id, customBrand: normalizedName }));
      }
      if (customCatalogModal.kind === 'color') {
        const created = await createWorkshopColor(token, workshopId, {
          name: normalizedName,
          slug: normalizedSlug,
        });
        const newOption = { id: created.id, name: created.name };
        setLocalColors((current) => [...current, newOption]);
        setInstrumentForm((current) => ({ ...current, colorId: newOption.id, customColor: normalizedName }));
      }
      if (customCatalogModal.kind === 'desiredTuning') {
        const created = await createWorkshopTuning(token, workshopId, {
          name: normalizedName,
          slug: normalizedSlug,
        });
        const newOption = { id: created.id, name: created.name };
        setLocalTunings((current) => [...current, newOption]);
        if (customCatalogModal.kind === 'desiredTuning') {
          setDesiredTuningId(newOption.id);
          setCustomDesiredTuning(normalizedName);
        }
      }

      setCustomCatalogModal(null);
      setServiceToast('Opción de catálogo agregada');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar la opción.');
    }
  }

  const createIntakeMutation = useMutation({
    mutationFn: async () => {
      if (!workshopId) throw new Error('No hay taller activo.');
      if (!branchId) throw new Error('Selecciona sucursal.');
      if (!canMoveToInstrument) {
        throw new Error('Completa cliente (nombre y teléfono).');
      }
      if (!canMoveToServices) {
        throw new Error('Completa instrumento (tipo, marca y modelo).');
      }
      if (!serviceLines.length) {
        throw new Error('Agrega al menos un servicio.');
      }
      if (!desiredTuningId) {
        throw new Error('Selecciona la afinación deseada.');
      }
      const invalidPayment = paymentLines.find(
        (line) => !!line.amount.trim() && (!Number.isFinite(Number(line.amount)) || Number(line.amount) <= 0),
      );
      if (invalidPayment) {
        throw new Error('Revisa abonos: el monto debe ser mayor a 0.');
      }

      const invalidService = serviceLines.find(
        (line) =>
          (!line.catalogServiceId && !line.name.trim()) ||
          line.quantity <= 0 ||
          Number.isNaN(line.unitPrice) ||
          line.unitPrice < 0,
      );
      if (invalidService) {
        throw new Error('Revisa servicios: nombre, cantidad y precio son obligatorios.');
      }
      const invalidPart = partLines.find(
        (line) =>
          (!line.workshopPartId && !line.name.trim()) ||
          line.quantity <= 0 ||
          Number.isNaN(line.unitPrice) ||
          line.unitPrice < 0 ||
          (line.unitCost != null && line.unitCost < 0),
      );
      if (invalidPart) {
        throw new Error('Revisa refacciones: nombre/catálogo, cantidad y precios son obligatorios.');
      }

      const discountNumber = Number(estimatedDiscount || 0);
      const payload: CreateIntakePayload = {
        clientId: selectedClient?.id,
        client: selectedClient
          ? undefined
          : {
              ...splitFullName(clientForm.fullName),
              alias: clientForm.fullName.trim() || undefined,
              phone: clientForm.phone.trim(),
              notes: clientForm.instagram.trim()
                ? `Instagram: ${clientForm.instagram.trim()}`
                : undefined,
            },
        instrumentId: selectedInstrument?.id,
        instrument: selectedInstrument
          ? undefined
          : {
              instrumentTypeId: instrumentForm.instrumentTypeId,
              brandId: instrumentForm.brandId || undefined,
              colorId: instrumentForm.colorId || undefined,
              model: instrumentForm.model.trim(),
              serialNumber: instrumentForm.serialNumber.trim() || undefined,
              observations: [
                instrumentForm.customBrand.trim()
                  ? `Marca capturada en intake: ${instrumentForm.customBrand.trim()}`
                  : '',
                instrumentForm.customColor.trim()
                  ? `Color capturado en intake: ${instrumentForm.customColor.trim()}`
                  : '',
              ]
                .filter(Boolean)
                .join(' | '),
            },
        visit: {
          branchId,
          affiliateCode: affiliateCode.trim() || undefined,
          intakeNotes: intakeNotes.trim() || undefined,
          wantsStringChange,
          desiredTuningId: desiredTuningId || undefined,
          stringGaugeId: stringGaugeId || undefined,
          discount: Number.isFinite(discountNumber) ? discountNumber : 0,
          diagnosis: [
            customDesiredTuning.trim()
              ? `Afinación deseada manual: ${customDesiredTuning.trim()}`
              : '',
            `¿Incluye strap?: ${hasStrap ? 'Sí' : 'No'}`,
            `¿Incluye funda?: ${hasCase ? 'Sí' : 'No'}`,
          ]
            .filter(Boolean)
            .join(' | '),
        },
        payments: paymentLines
          .filter((line) => Number(line.amount || 0) > 0)
          .map((line) => ({
            paymentMethodId: line.paymentMethodId || undefined,
            amount: Number(line.amount),
            notes: line.notes.trim() || undefined,
            paidAt: toIsoDateFromDisplay(line.paidAt),
          })),
        initialNote: visitNote.trim()
          ? {
              note: visitNote.trim(),
              isInternal: false,
            }
          : undefined,
        services: serviceLines.map((line) => ({
          workshopServiceId: line.catalogServiceId,
          serviceCatalogId: line.catalogServiceId,
          name: line.catalogServiceId ? undefined : line.name.trim(),
          quantity: line.quantity,
          price: line.unitPrice,
          notes: line.notes?.trim() || undefined,
        })),
        visitMediaIds: uploadedMediaIds.length ? uploadedMediaIds : undefined,
        parts: partLines.length
          ? partLines.map((line) => ({
              workshopPartId: line.workshopPartId || undefined,
              name: line.workshopPartId ? undefined : line.name.trim() || undefined,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              unitCost: line.unitCost,
              notes: line.notes?.trim() || undefined,
              visitServiceId: undefined,
            }))
          : undefined,
      };

      return createIntake(workshopId, payload);
    },
    onSuccess: () => {
      setSubmitError('');
      setSubmitMessage('Visita creada correctamente.');
      notifySuccess('Visita creada', 'La orden se guardó correctamente.');
      setSearchPhone('');
      setSearchResults([]);
      setSelectedClient(null);
      setSelectedInstrument(null);
      setIsNewClientMode(false);
      setIsNewInstrumentMode(false);
      setClientForm(EMPTY_CLIENT_FORM);
      setInstrumentForm(EMPTY_INSTRUMENT_FORM);
      setServiceLines([]);
      setIntakeNotes('');
      setWantsStringChange(false);
      setDesiredTuningId('');
      setStringGaugeId('');
      setCuerdaMediaNote('');
      setVisitNote('');
      setEstimatedDiscount('');
      setCustomDesiredTuning('');
      setHasStrap(false);
      setHasCase(false);
      setAffiliateCode('');
      setPaymentLines([]);
      setUploadedMediaIds([]);
      setHasBlockingMediaUploads(false);
      setExpandedServiceIds([]);
      setPartLines([]);
      setShowConfirmIntakeModal(false);
      setActiveStep('client');
      setShowSuccessOverlay(true);
    },
    onError: (error: Error) => {
      setSubmitMessage('');
      setSubmitError(error.message || 'No se pudo crear la visita.');
      notifyError('No se pudo crear la visita', error.message || 'Revisa la información e inténtalo de nuevo.');
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-44 pt-3 sm:px-4">
      <BaseCard>
        <h1 className="section-title text-lg">Intake rápido (mobile-first)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Flujo optimizado para mostrador: mínimo de toques, máximo contexto.
        </p>
        <StepProgress
          steps={STEP_ORDER}
          labels={STEP_LABEL}
          activeStep={activeStep}
          onStepClick={setActiveStep}
        />
      </BaseCard>

      {activeStep === 'client' ? (
        <article className="card mt-3 p-4">
          <h2 className="text-base font-semibold text-slate-900">1) Cliente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Busca por teléfono o crea uno nuevo con nombre, teléfono e instagram.
          </p>

          <div className="mt-4 space-y-3">
            <SearchInput
              placeholder="Teléfono"
              inputMode="tel"
              autoFocus
              value={searchPhone}
              loading={searchingClient}
              onChange={(rawValue) => {
                const value = normalizePhoneInput(rawValue);
                if (selectedClient) resetClientSelection();
                setSearchPhone(value);
                setClientForm((current) => ({ ...current, phone: value }));
              }}
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="btn-secondary h-12 justify-center gap-2"
                onClick={() => {
                  setIsNewClientMode(true);
                  setSearchError('');
                }}
              >
                <UserPlus2 className="h-4 w-4" />
                Cliente nuevo
              </button>
              {selectedClient ? (
                <button
                  type="button"
                  className="btn-secondary h-12 justify-center gap-2"
                  onClick={resetClientSelection}
                >
                  <XCircle className="h-4 w-4" />
                  Limpiar selección
                </button>
              ) : null}
            </div>

            {searchError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {searchError}
              </div>
            ) : null}

            {!!searchResults.length && !selectedClient ? (
              <div className="space-y-2">
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelectClient(client)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >
                    <div className="font-medium text-slate-900">{getClientDisplayName(client)}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone || 'Sin teléfono'}</span>
                    </div>
                    {client.instagram ? (
                      <div className="mt-1 text-xs text-slate-500">@{client.instagram}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {(isNewClientMode || selectedClient) && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                <InputField
                  placeholder="Nombre completo"
                  value={clientForm.fullName}
                  disabled={!!selectedClient}
                  onChange={(e) =>
                    setClientForm((current) => ({
                      ...current,
                      fullName: e.target.value,
                    }))
                  }
                />
                <InputField
                  placeholder="Instagram (opcional)"
                  value={clientForm.instagram}
                  disabled={!!selectedClient}
                  onChange={(e) =>
                    setClientForm((current) => ({
                      ...current,
                      instagram: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </article>
      ) : null}

      {activeStep === 'instrument' ? (
        <article className="card mt-3 p-4">
          <h2 className="text-base font-semibold text-slate-900">2) Instrumento</h2>
          <p className="mt-1 text-sm text-slate-500">
            Marca y tipo obligatorios; serie opcional.
          </p>

          {!canMoveToInstrument ? (
            <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
              Primero completa cliente.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {!!selectedClient ? (
                <>
                  {instrumentsQuery.isLoading ? (
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      Cargando instrumentos...
                    </div>
                  ) : (
                    <>
                      {!!instruments.length && (
                        <div className="space-y-2">
                          {instruments.map((instrument) => (
                            <button
                              key={instrument.id}
                              type="button"
                              onClick={() => {
                                setSelectedInstrument(instrument);
                                setIsNewInstrumentMode(false);
                              }}
                              className={cn(
                                'w-full rounded-xl border p-3 text-left',
                                selectedInstrument?.id === instrument.id
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-slate-200 bg-white hover:bg-slate-50',
                              )}
                            >
                              <div className="font-medium text-slate-900">{instrument.name}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {[instrument.typeName, instrument.brandName, instrument.model]
                                  .filter(Boolean)
                                  .join(' · ') || 'Sin detalle'}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn-secondary h-11 w-full justify-center gap-2"
                        onClick={() => {
                          setSelectedInstrument(null);
                          setIsNewInstrumentMode(true);
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Instrumento nuevo
                      </button>
                      {(selectedInstrument ||
                        instrumentForm.model ||
                        instrumentForm.serialNumber ||
                        instrumentForm.brandId ||
                        instrumentForm.customBrand) && (
                        <button
                          type="button"
                          className="btn-secondary h-11 w-full justify-center gap-2"
                          onClick={resetInstrumentSelection}
                        >
                          <XCircle className="h-4 w-4" />
                          Limpiar instrumento
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : null}

              {(isNewInstrumentMode || !selectedClient || !selectedInstrument) && (
                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <select
                    className="input h-14 text-base"
                    value={instrumentForm.instrumentTypeId}
                    onChange={(e) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        instrumentTypeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Tipo de instrumento</option>
                    {(lookupsQuery.data?.instrumentTypes || []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <CatalogSelectWithCustom
                    value={instrumentForm.brandId}
                    options={brandsOptions}
                    placeholder="Marca"
                    onValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        brandId: value,
                        customBrand: value.startsWith('manual-brand-') ? current.customBrand : '',
                      }))
                    }
                    onCreateOption={() => openCustomCatalogModal('brand')}
                  />

                  <CatalogSelectWithCustom
                    value={instrumentForm.colorId}
                    options={colorsOptions}
                    placeholder="Color"
                    onValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        colorId: value,
                        customColor: value.startsWith('manual-color-') ? current.customColor : '',
                      }))
                    }
                    onCreateOption={() => openCustomCatalogModal('color')}
                  />

                  <input
                    className="input h-12"
                    placeholder="Modelo"
                    value={instrumentForm.model}
                    onChange={(e) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        model: e.target.value,
                      }))
                    }
                  />

                  <input
                    className="input h-12"
                    placeholder="Número de serie (opcional)"
                    value={instrumentForm.serialNumber}
                    onChange={(e) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        serialNumber: e.target.value,
                      }))
                    }
                  />

                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={hasStrap}
                      onChange={(e) => setHasStrap(e.target.checked)}
                    />
                    ¿Viene con strap?
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={hasCase}
                      onChange={(e) => setHasCase(e.target.checked)}
                    />
                    ¿Viene con funda?
                  </label>

                </div>
              )}
            </div>
          )}
        </article>
      ) : null}

      {activeStep === 'services' ? (
        <article className="card mt-3 p-4">
          <h2 className="text-base font-semibold text-slate-900">3) Servicios</h2>
          <p className="mt-1 text-sm text-slate-500">
            Puedes seleccionar varios. De tipo ajuste (`isAdjust`) solo uno por visita.
          </p>

          {!canMoveToServices ? (
            <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
              Completa cliente e instrumento primero.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {!!adjustServices.length && (
                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                  <h3 className="text-sm font-semibold text-amber-800">Ajuste (elige solo uno)</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {adjustServices.map((service) => {
                      const isSelected = selectedAdjustLine?.catalogServiceId === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => onAddCatalogService(service)}
                          className={cn(
                            'min-h-14 w-full rounded-xl border px-3 py-2 text-left',
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-amber-200 bg-white hover:bg-amber-50',
                          )}
                        >
                          <span className="flex min-w-0 items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2">
                              <Wrench className="h-4 w-4 shrink-0" />
                              <span className="truncate">{service.name}</span>
                            </span>
                            <span className="chip bg-amber-100 text-amber-700">
                              {isSelected ? 'Seleccionado ✓' : 'Elegir'}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <input
                  className="input h-12"
                  placeholder="Buscar servicio..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                {filteredRegularServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => onAddCatalogService(service)}
                    className="min-h-14 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Wrench className="h-4 w-4 shrink-0" />
                      <span className="truncate">{service.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{currency(service.basePrice)}</span>
                  </button>
                ))}
                {!filteredRegularServices.length ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No se encontraron servicios con ese nombre.
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-700">Afinación deseada (siempre requerida)</p>
                <CatalogSelectWithCustom
                  value={desiredTuningId}
                  options={tuningOptions}
                  placeholder="Afinación deseada"
                  onValueChange={(value) => {
                    setDesiredTuningId(value);
                    setCustomDesiredTuning('');
                  }}
                  onCreateOption={() => openCustomCatalogModal('desiredTuning')}
                />
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={wantsStringChange}
                  onChange={(e) => setWantsStringChange(e.target.checked)}
                />
                ¿Lleva cambio de cuerdas?
              </label>

              {wantsStringChange ? (
                <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <select
                    className="input h-14 text-base"
                    value={stringGaugeId}
                    onChange={(e) => setStringGaugeId(e.target.value)}
                  >
                    <option value="">Calibre</option>
                    {(lookupsQuery.data?.stringGauges || []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.value ? ` (${item.value})` : ''}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="input min-h-20"
                    placeholder="Si el cliente trae cuerdas propias, agrega detalle/foto de referencia"
                    value={cuerdaMediaNote}
                    onChange={(e) => setCuerdaMediaNote(e.target.value)}
                  />
                </div>
              ) : null}

              <button
                type="button"
                className="btn-secondary h-11 w-full justify-center gap-2"
                onClick={onAddManualService}
              >
                <PlusCircle className="h-4 w-4" />
                Agregar servicio fuera de catálogo
              </button>

              {!serviceLines.length ? (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Aún no agregas servicios.
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceLines.map((line) => (
                    <div key={line.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => toggleServiceLine(line.id)}
                        >
                          <div className="font-medium text-slate-900">{line.name || 'Servicio manual'}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {line.source === 'CATALOG' ? 'Catálogo' : 'Manual'} ·{' '}
                            {expandedServiceIds.includes(line.id) ? 'Ocultar detalle' : 'Ver detalle'}
                          </div>
                        </button>
                        <button
                          type="button"
                          className="btn-secondary h-9 px-3"
                          onClick={() => onRemoveServiceLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {expandedServiceIds.includes(line.id) ? (
                        <div className="space-y-2">
                        <input
                          className="input h-11"
                          placeholder="Nombre del servicio"
                          disabled={line.source === 'CATALOG'}
                          value={line.name}
                          onChange={(e) =>
                            onUpdateServiceLine(line.id, { name: e.target.value })
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="input h-11"
                            inputMode="numeric"
                            placeholder="Cantidad"
                            value={line.quantity}
                            onChange={(e) =>
                              onUpdateServiceLine(line.id, {
                                quantity: Number(e.target.value || 0),
                              })
                            }
                          />
                          <input
                            className="input h-11"
                            inputMode="decimal"
                            placeholder="Precio"
                            value={line.unitPrice}
                            onChange={(e) =>
                              onUpdateServiceLine(line.id, {
                                unitPrice: Number(e.target.value || 0),
                              })
                            }
                          />
                        </div>
                        <textarea
                          className="input min-h-20"
                          placeholder="Notas del servicio (opcional)"
                          value={line.notes || ''}
                          onChange={(e) =>
                            onUpdateServiceLine(line.id, { notes: e.target.value })
                          }
                        />
                        <div className="text-right text-xs text-slate-500">
                          Subtotal: {currency(line.quantity * line.unitPrice)}
                        </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </article>
      ) : null}

      {activeStep === 'visit' ? (
        <article className="card mt-3 p-4">
          <h2 className="text-base font-semibold text-slate-900">4) Cierre</h2>
          <p className="mt-1 text-sm text-slate-500">
            Aquí documentas el contexto final de la visita para estimar y compartir tracking.
          </p>

          {!canMoveToVisit ? (
            <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
              Completa servicios primero.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <select
                className="input h-14 text-base"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                <option value="">Sucursal</option>
                {(lookupsQuery.data?.branches || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <textarea
                className="input min-h-24"
                placeholder="Falla/solicitud inicial de la visita"
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
              />

              <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Abonos</p>
                  <button
                    type="button"
                    className="btn-secondary h-9 px-3"
                    onClick={addPaymentLine}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>
                </div>
                {!paymentLines.length ? (
                  <p className="text-sm text-slate-500">Aún no registras abonos.</p>
              ) : (
                <div className="space-y-2">
                    {paymentLines.map((line) => (
                      <div key={line.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <select
                            className="input h-11"
                            value={line.paymentMethodId}
                            onChange={(e) =>
                              updatePaymentLine(line.id, { paymentMethodId: e.target.value })
                            }
                          >
                            <option value="">Método de pago</option>
                            {(lookupsQuery.data?.paymentMethods || []).map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="input h-11"
                            inputMode="decimal"
                            placeholder="Monto"
                            value={line.amount}
                            onChange={(e) => updatePaymentLine(line.id, { amount: e.target.value })}
                          />
                          <input
                            className="input h-11"
                            placeholder="Fecha (dd/mm/yyyy)"
                            value={line.paidAt}
                            onChange={(e) => updatePaymentLine(line.id, { paidAt: e.target.value })}
                          />
                        </div>
                        <textarea
                          className="input mt-2 min-h-16"
                          placeholder="Notas del abono (opcional)"
                          value={line.notes}
                          onChange={(e) => updatePaymentLine(line.id, { notes: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn-secondary mt-2 h-9 px-3"
                          onClick={() => removePaymentLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                className="input min-h-24"
                placeholder="Nota general de la visita (puede ser contexto de voz/video/fotos)"
                value={visitNote}
                onChange={(e) => setVisitNote(e.target.value)}
              />

              <input
                className="input h-12"
                inputMode="decimal"
                placeholder="Descuento (opcional)"
                value={estimatedDiscount}
                onChange={(e) => setEstimatedDiscount(e.target.value)}
              />

              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-700">Código de redención (afiliado)</p>
                <select
                  className="input h-12"
                  value={affiliateCode}
                  onChange={(e) => setAffiliateCode(e.target.value)}
                >
                  <option value="">Sin afiliado</option>
                  {(lookupsQuery.data?.affiliates || []).map((item) => (
                    <option key={item.id} value={item.code || item.slug || item.name}>
                      {item.name} {item.code ? `(${item.code})` : ''}
                    </option>
                  ))}
                </select>
                <input
                  className="input h-12"
                  placeholder="O captura código manual"
                  value={affiliateCode}
                  onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                />
              </div>

              {workshopId ? (
                <IntakeMediaUploader
                  workshopId={workshopId}
                  onUploadedMediaIdsChange={setUploadedMediaIds}
                  onBlockingUploadsChange={setHasBlockingMediaUploads}
                  onFileErrorToast={setMediaToast}
                />
              ) : null}
            </div>
          )}
        </article>
      ) : null}

      <article className="card mt-3 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Resumen rápido</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-600">
          <div className="rounded-xl bg-slate-50 p-3">
            Cliente: {selectedClient ? getClientDisplayName(selectedClient) : clientForm.fullName || 'Pendiente'}
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            Instrumento: {selectedInstrument?.name || instrumentForm.model || 'Pendiente'}
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            Servicios: {serviceLines.length} · Total estimado {currency(total)}
          </div>
        </div>
      </article>

      {submitMessage ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitMessage}</span>
        </div>
      ) : null}
      {submitError ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      ) : null}

      {serviceToast ? (
        <div className="fixed right-3 top-4 z-40 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white shadow-lg">
          {serviceToast}
        </div>
      ) : null}
      {mediaToast ? (
        <div className="fixed right-3 top-16 z-40 rounded-xl bg-red-600 px-3 py-2 text-sm text-white shadow-lg">
          {mediaToast}
        </div>
      ) : null}

      {showSuccessOverlay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-600/95 px-6 text-center text-white">
          <div>
            <CheckCircle2 className="mx-auto h-14 w-14" />
            <p className="mt-3 text-2xl font-semibold">¡Intake guardado!</p>
            <p className="mt-1 text-sm text-emerald-100">Registro creado correctamente.</p>
          </div>
        </div>
      ) : null}

      {showConfirmIntakeModal ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full overflow-y-auto px-4 pb-40 pt-4">
            <h3 className="text-xl font-semibold text-slate-900">Confirmar intake</h3>
            <p className="mt-1 text-sm text-slate-500">Revisa la información antes de confirmar.</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Cliente</p>
                <p className="font-medium text-slate-900">
                  {selectedClient ? getClientDisplayName(selectedClient) : clientForm.fullName || 'Pendiente'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Instrumento</p>
                <p className="font-medium text-slate-900">{selectedInstrument?.name || instrumentForm.model || 'Pendiente'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Afinación deseada</p>
                <p className="font-medium text-slate-900">
                  {tuningOptions.find((item) => item.id === desiredTuningId)?.name || 'Pendiente'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Afiliado</p>
                <p className="font-medium text-slate-900">{affiliateCode || 'Sin afiliado'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Servicios</p>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {serviceLines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{line.name || 'Servicio manual'}</span>
                      <span>{currency(line.quantity * line.unitPrice)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-right text-sm font-semibold text-slate-900">Total: {currency(total)}</p>
              </div>
              {!!paymentLines.length && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">Abonos</p>
                  {paymentLines.map((line) => (
                    <div key={line.id} className="mt-1 flex items-center justify-between text-sm">
                      <span>
                        {(lookupsQuery.data?.paymentMethods || []).find((item) => item.id === line.paymentMethodId)
                          ?.name || 'Método sin especificar'}
                      </span>
                      <span>{currency(Number(line.amount || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Refacciones iniciales (opcional)</h3>
                  <button type="button" className="btn-secondary h-8 px-3" onClick={() => setPartLines((current) => [...current, createManualPartLine()])}>
                    <PlusCircle className="h-4 w-4" />
                    Agregar
                  </button>
                </div>
                {!partLines.length ? <p className="mt-2 text-xs text-slate-500">Sin refacciones iniciales.</p> : null}
                <div className="mt-2 space-y-2">
                  {partLines.map((line) => (
                    <article key={line.id} className="rounded-lg border border-slate-200 p-2">
                      <select
                        className="input h-10"
                        value={line.workshopPartId || ''}
                        onChange={(event) => {
                          const selected = partsCatalogQuery.data?.find((part) => part.id === event.target.value);
                          setPartLines((current) =>
                            current.map((item) =>
                              item.id === line.id
                                ? {
                                    ...item,
                                    workshopPartId: event.target.value || undefined,
                                    source: event.target.value ? 'CATALOG' : 'MANUAL',
                                    name: event.target.value ? '' : item.name,
                                    unitPrice: event.target.value ? Number(selected?.publicPrice || 0) : item.unitPrice,
                                  }
                                : item,
                            ),
                          );
                        }}
                      >
                        <option value="">Manual</option>
                        {(partsCatalogQuery.data || []).map((part) => (
                          <option key={part.id} value={part.id}>{part.name}</option>
                        ))}
                      </select>
                      {!line.workshopPartId ? (
                        <input
                          className="input mt-2 h-10"
                          placeholder="Nombre de refacción"
                          value={line.name}
                          onChange={(event) =>
                            setPartLines((current) =>
                              current.map((item) => (item.id === line.id ? { ...item, name: event.target.value } : item)),
                            )
                          }
                        />
                      ) : null}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <InputField label="Cantidad" inputMode="decimal" value={String(line.quantity)} onChange={(event) => setPartLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: Number(event.target.value || 0) } : item))} />
                        <InputField label="Precio unitario" inputMode="decimal" value={String(line.unitPrice)} onChange={(event) => setPartLines((current) => current.map((item) => item.id === line.id ? { ...item, unitPrice: Number(event.target.value || 0) } : item))} />
                      </div>
                      <InputField label="Costo unitario" inputMode="decimal" value={String(line.unitCost ?? 0)} onChange={(event) => setPartLines((current) => current.map((item) => item.id === line.id ? { ...item, unitCost: Number(event.target.value || 0) } : item))} />
                      <select className="input mt-2 h-10" value={line.visitServiceId || ''} onChange={(event) => setPartLines((current) => current.map((item) => item.id === line.id ? { ...item, visitServiceId: event.target.value } : item))}>
                        <option value="">Sin servicio asociado</option>
                        {serviceLines.filter((service) => service.catalogServiceId).map((service) => (
                          <option key={service.id} value={service.catalogServiceId}>{service.name || 'Servicio manual'}</option>
                        ))}
                      </select>
                      <textarea className="input mt-2 min-h-16" placeholder="Notas" value={line.notes || ''} onChange={(event) => setPartLines((current) => current.map((item) => item.id === line.id ? { ...item, notes: event.target.value } : item))} />
                      <button type="button" className="btn-secondary mt-2 h-8 w-full justify-center text-red-600" onClick={() => setPartLines((current) => current.filter((item) => item.id !== line.id))}>
                        <Trash2 className="h-4 w-4" />
                        Quitar
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-3xl gap-2">
              <button
                type="button"
                className="btn-secondary h-12 flex-1 justify-center"
                onClick={() => setShowConfirmIntakeModal(false)}
              >
                Cancelar y editar
              </button>
              <button
                type="button"
                className="btn-primary h-12 flex-1 justify-center"
                onClick={() => createIntakeMutation.mutate()}
                disabled={createIntakeMutation.isPending}
              >
                Confirmar intake
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isManualServiceModalOpen ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[145] flex items-end bg-black/45 p-3 sm:items-center sm:justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
              <h3 className="text-base font-semibold text-slate-900">Agregar servicio manual</h3>
              <p className="mt-1 text-sm text-slate-500">Captura el servicio fuera de catálogo y confirma para agregarlo.</p>
              <div className="mt-3 space-y-2">
                <InputField
                  autoFocus
                  label="Nombre"
                  value={manualServiceDraft.name}
                  onChange={(event) => setManualServiceDraft((current) => ({ ...current, name: event.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <InputField
                    label="Cantidad"
                    inputMode="numeric"
                    value={manualServiceDraft.quantity}
                    onChange={(event) => setManualServiceDraft((current) => ({ ...current, quantity: event.target.value }))}
                  />
                  <InputField
                    label="Precio"
                    inputMode="decimal"
                    value={manualServiceDraft.unitPrice}
                    onChange={(event) => setManualServiceDraft((current) => ({ ...current, unitPrice: event.target.value }))}
                  />
                </div>
                <InputField
                  as="textarea"
                  label="Notas (opcional)"
                  value={manualServiceDraft.notes}
                  onChange={(event) => setManualServiceDraft((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-secondary h-11 justify-center"
                  onClick={() => setIsManualServiceModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary h-11 justify-center"
                  onClick={confirmManualServiceFromModal}
                >
                  Agregar servicio
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}

      {customCatalogModal ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[145] flex items-end bg-black/40 p-3 sm:items-center sm:justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
              <h3 className="text-base font-semibold text-slate-900">{customCatalogModal.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Esta opción se agrega para este intake y queda seleccionada.
              </p>
              <input
                className="input mt-3 h-12 text-base"
                placeholder={customCatalogModal.placeholder}
                value={customCatalogName}
                onChange={(e) => setCustomCatalogName(capitalizeWords(e.target.value))}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-secondary h-11 flex-1 justify-center"
                  onClick={() => setCustomCatalogModal(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary h-11 flex-1 justify-center"
                  onClick={saveCustomCatalogOption}
                  disabled={!customCatalogName.trim()}
                >
                  Guardar opción
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}

      <div className="mobile-safe-bottom fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm">
            <span className="font-medium text-emerald-800">Resumen rápido</span>
            <span className="font-semibold text-emerald-900">
              {serviceLines.length} servicio(s) · {currency(total)}
            </span>
          </div>
          <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary h-12 min-w-[90px] justify-center"
            onClick={goPrevStep}
            disabled={activeStep === 'client'}
          >
            Atrás
          </button>

          {activeStep !== 'visit' ? (
            <button
              type="button"
              className="btn-primary h-12 flex-1 justify-center gap-2"
              onClick={goNextStep}
              disabled={
                (activeStep === 'client' && !canMoveToInstrument) ||
                (activeStep === 'instrument' && !canMoveToServices) ||
                (activeStep === 'services' && !canMoveToVisit)
              }
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary h-12 flex-1 justify-center gap-2 text-base"
              onClick={() => setShowConfirmIntakeModal(true)}
              disabled={createIntakeMutation.isPending || !workshopId || !canSubmitIntake}
            >
              {createIntakeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar intake y enviar tracking'
              )}
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
