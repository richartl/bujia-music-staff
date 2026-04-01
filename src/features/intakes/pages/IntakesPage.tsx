import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Phone,
  PlusCircle,
  Search,
  Trash2,
  UserPlus2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { authStore } from '@/stores/auth-store';
import { currency, cn } from '@/lib/utils';
import { searchClientByPhone, type ClientSearchItem } from '../api/search-client';
import { createIntake } from '../api/create-intake';
import { getClientInstruments } from '../api/get-client-instruments';
import { getIntakeLookups } from '../api/get-intake-lookups';
import { CatalogSelectWithCustom } from '../components/CatalogSelectWithCustom';
import type {
  ClientInstrument,
  CreateIntakePayload,
  IntakeServiceLine,
  WorkshopServiceLookup,
} from '../types';

const PHONE_SEARCH_DEBOUNCE_MS = 250;
const PHONE_SEARCH_MIN_LENGTH = 3;

type IntakeStep = 'client' | 'instrument' | 'services' | 'visit';

const STEP_ORDER: IntakeStep[] = ['client', 'instrument', 'services', 'visit'];

const STEP_LABEL: Record<IntakeStep, string> = {
  client: 'Cliente',
  instrument: 'Instrumento',
  services: 'Servicios',
  visit: 'Cuerdas y nota',
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
  hasStrap: false,
  preferredTuningId: '',
  customPreferredTuning: '',
};

function normalizePhoneInput(value: string) {
  return value.replace(/[^\d+]/g, '');
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

export function IntakesPage() {
  const workshopId = authStore((state) => state.workshopId);

  const [activeStep, setActiveStep] = useState<IntakeStep>('client');
  const [searchPhone, setSearchPhone] = useState('');
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

  const [branchId, setBranchId] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');
  const [wantsStringChange, setWantsStringChange] = useState(false);
  const [desiredTuningId, setDesiredTuningId] = useState('');
  const [stringGaugeId, setStringGaugeId] = useState('');
  const [cuerdaMediaNote, setCuerdaMediaNote] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [estimatedDiscount, setEstimatedDiscount] = useState('');
  const [customDesiredTuning, setCustomDesiredTuning] = useState('');

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

  useEffect(() => {
    if (!workshopId) return;
    if (selectedClient) return;
    const normalizedPhone = searchPhone.trim();
    if (normalizedPhone.length < PHONE_SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      setSearchError('');
      setSearchingClient(false);
      return;
    }

    let cancelled = false;
    setSearchingClient(true);
    setSearchError('');
    const timer = window.setTimeout(async () => {
      try {
        const result = await searchClientByPhone(workshopId, normalizedPhone);
        if (cancelled) return;
        setSearchResults(result);
        setSearchError('');
        if (result.length === 0) {
          setIsNewClientMode(true);
          setClientForm((current) => ({
            ...current,
            phone: normalizedPhone,
          }));
        } else {
          setIsNewClientMode(false);
        }
      } catch {
        if (cancelled) return;
        setSearchError('No se pudo buscar cliente. Revisa conexión/API.');
        setSearchResults([]);
      } finally {
        if (!cancelled) setSearchingClient(false);
      }
    }, PHONE_SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchPhone, selectedClient, workshopId]);

  const catalogServices = lookupsQuery.data?.services || [];
  const instruments = instrumentsQuery.data || [];

  const selectedAdjustCount = useMemo(() => {
    const adjustIds = new Set(
      catalogServices.filter((item) => item.isAdjust).map((item) => item.id),
    );
    return serviceLines.filter(
      (line) => line.catalogServiceId && adjustIds.has(line.catalogServiceId),
    ).length;
  }, [catalogServices, serviceLines]);

  const total = useMemo(
    () => serviceLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [serviceLines],
  );

  const canMoveToInstrument =
    !!selectedClient || (isNewClientMode && !!clientForm.fullName.trim() && !!clientForm.phone.trim());
  const canMoveToServices =
    canMoveToInstrument &&
    (!!selectedInstrument ||
      ((isNewInstrumentMode || !selectedClient) &&
        !!instrumentForm.instrumentTypeId &&
        (!!instrumentForm.brandId || !!instrumentForm.customBrand.trim()) &&
        !!instrumentForm.model.trim()));
  const canMoveToVisit = canMoveToServices && serviceLines.length > 0;

  function goNextStep() {
    const idx = STEP_ORDER.indexOf(activeStep);
    if (idx >= STEP_ORDER.length - 1) return;
    const next = STEP_ORDER[idx + 1];
    if (next === 'instrument' && !canMoveToInstrument) return;
    if (next === 'services' && !canMoveToServices) return;
    if (next === 'visit' && !canMoveToVisit) return;
    setActiveStep(next);
  }

  function goPrevStep() {
    const idx = STEP_ORDER.indexOf(activeStep);
    if (idx <= 0) return;
    setActiveStep(STEP_ORDER[idx - 1]);
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
    if (service.isAdjust && selectedAdjustCount >= 1) {
      setSubmitError('Solo puedes agregar un servicio de ajuste por visita.');
      return;
    }
    setSubmitError('');
    setServiceLines((current) => [...current, createCatalogServiceLine(service)]);
  }

  function onAddManualService() {
    setServiceLines((current) => [...current, createManualServiceLine()]);
  }

  function onUpdateServiceLine(id: string, updates: Partial<IntakeServiceLine>) {
    setServiceLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...updates } : line)),
    );
  }

  function onRemoveServiceLine(id: string) {
    setServiceLines((current) => current.filter((line) => line.id !== id));
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
                `¿Incluye strap?: ${instrumentForm.hasStrap ? 'Sí' : 'No'}`,
                instrumentForm.customPreferredTuning.trim()
                  ? `Afinación preferida (manual): ${instrumentForm.customPreferredTuning.trim()}`
                  : '',
                instrumentForm.preferredTuningId
                  ? `Afinación preferida (catálogo): ${instrumentForm.preferredTuningId}`
                  : '',
              ]
                .filter(Boolean)
                .join(' | '),
            },
        visit: {
          branchId,
          intakeNotes: intakeNotes.trim() || undefined,
          wantsStringChange,
          desiredTuningId: desiredTuningId || undefined,
          stringGaugeId: stringGaugeId || undefined,
          discount: Number.isFinite(discountNumber) ? discountNumber : 0,
          diagnosis: customDesiredTuning.trim()
            ? `Afinación deseada manual: ${customDesiredTuning.trim()}`
            : undefined,
        },
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
      };

      return createIntake(workshopId, payload);
    },
    onSuccess: (result) => {
      setSubmitError('');
      setSubmitMessage('Visita creada correctamente.');
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
      setActiveStep('client');

      const token = (result as { tracking?: { token?: string } })?.tracking?.token;
      if (token) {
        const msg =
          `Hola, te compartimos el tracking de tu visita.\n` +
          `https://bujia.mx/tracking/visits/${token}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    },
    onError: (error: Error) => {
      setSubmitMessage('');
      setSubmitError(error.message || 'No se pudo crear la visita.');
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-28 pt-3 sm:px-4">
      <article className="card p-4">
        <h1 className="section-title text-lg">Intake rápido (mobile-first)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Flujo optimizado para mostrador: mínimo de toques, máximo contexto.
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {STEP_ORDER.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => setActiveStep(step)}
              className={cn(
                'rounded-xl border px-2 py-2 text-[11px] font-medium',
                activeStep === step
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600',
              )}
            >
              {index + 1}. {STEP_LABEL[step]}
            </button>
          ))}
        </div>
      </article>

      {activeStep === 'client' ? (
        <article className="card mt-3 p-4">
          <h2 className="text-base font-semibold text-slate-900">1) Cliente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Busca por teléfono o crea uno nuevo con nombre, teléfono e instagram.
          </p>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <input
                className="input h-12 w-full pr-10"
                placeholder="Teléfono"
                inputMode="tel"
                value={searchPhone}
                onChange={(e) => {
                  const value = normalizePhoneInput(e.target.value);
                  if (selectedClient) resetClientSelection();
                  setSearchPhone(value);
                  setClientForm((current) => ({ ...current, phone: value }));
                }}
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {searchingClient ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <Search className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

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
                <input
                  className="input h-12"
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
                <input
                  className="input h-12"
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
                    className="input h-12"
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
                    customValue={instrumentForm.customBrand}
                    options={lookupsQuery.data?.brands || []}
                    placeholder="Marca"
                    customPlaceholder="Escribe marca"
                    onValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        brandId: value,
                      }))
                    }
                    onCustomValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        customBrand: value,
                      }))
                    }
                  />

                  <CatalogSelectWithCustom
                    value={instrumentForm.colorId}
                    customValue={instrumentForm.customColor}
                    options={lookupsQuery.data?.colors || []}
                    placeholder="Color"
                    customPlaceholder="Escribe color"
                    onValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        colorId: value,
                      }))
                    }
                    onCustomValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        customColor: value,
                      }))
                    }
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
                      checked={instrumentForm.hasStrap}
                      onChange={(e) =>
                        setInstrumentForm((current) => ({
                          ...current,
                          hasStrap: e.target.checked,
                        }))
                      }
                    />
                    ¿Viene con strap?
                  </label>

                  <CatalogSelectWithCustom
                    value={instrumentForm.preferredTuningId}
                    customValue={instrumentForm.customPreferredTuning}
                    options={lookupsQuery.data?.tunings || []}
                    placeholder="Afinación preferida"
                    customPlaceholder="Escribe afinación preferida"
                    onValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        preferredTuningId: value,
                      }))
                    }
                    onCustomValueChange={(value) =>
                      setInstrumentForm((current) => ({
                        ...current,
                        customPreferredTuning: value,
                      }))
                    }
                  />
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
              <div className="grid grid-cols-1 gap-2">
                {catalogServices.map((service) => {
                  const isAdjust = !!service.isAdjust;
                  const disabled = isAdjust && selectedAdjustCount >= 1;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onAddCatalogService(service)}
                      className={cn(
                        'btn-secondary min-h-12 w-full justify-between gap-2 px-3 py-2 text-left',
                        disabled && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Wrench className="h-4 w-4 shrink-0" />
                        <span className="truncate">{service.name}</span>
                        {isAdjust ? (
                          <span className="chip bg-amber-100 text-amber-700">Ajuste</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {currency(service.basePrice)}
                      </span>
                    </button>
                  );
                })}
              </div>

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
                        <span
                          className={cn(
                            'chip',
                            line.source === 'CATALOG'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-sky-50 text-sky-700',
                          )}
                        >
                          {line.source === 'CATALOG' ? 'Catálogo' : 'Manual'}
                        </span>
                        <button
                          type="button"
                          className="btn-secondary h-9 px-3"
                          onClick={() => onRemoveServiceLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

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
          <h2 className="text-base font-semibold text-slate-900">4) Cuerdas, nota y cierre</h2>
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
                className="input h-12"
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
                  <CatalogSelectWithCustom
                    value={desiredTuningId}
                    customValue={customDesiredTuning}
                    options={lookupsQuery.data?.tunings || []}
                    placeholder="Afinación deseada"
                    customPlaceholder="Escribe afinación deseada"
                    onValueChange={setDesiredTuningId}
                    onCustomValueChange={setCustomDesiredTuning}
                  />
                  <select
                    className="input h-12"
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

              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-medium text-slate-900">Media y notas (pendiente siguiente iteración)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip bg-white text-slate-700">
                    <Paperclip className="mr-1 h-3 w-3" />
                    Foto/Video/Doc
                  </span>
                  <span className="chip bg-white text-slate-700">
                    <Mic className="mr-1 h-3 w-3" />
                    Nota de voz
                  </span>
                  <span className="chip bg-white text-slate-700">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Notas
                  </span>
                </div>
              </div>
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

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
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
              onClick={() => createIntakeMutation.mutate()}
              disabled={createIntakeMutation.isPending || !workshopId}
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
  );
}
