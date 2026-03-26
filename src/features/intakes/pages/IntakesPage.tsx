import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Search,
  Loader2,
  Phone,
  UserPlus2,
  XCircle,
  PlusCircle,
  Wrench,
  PackagePlus,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { authStore } from '@/stores/auth-store';
import { currency, cn } from '@/lib/utils';
import { searchClientByPhone, type ClientSearchItem } from '../api/search-client';
import { createIntake } from '../api/create-intake';
import { getClientInstruments } from '../api/get-client-instruments';
import { getIntakeLookups } from '../api/get-intake-lookups';
import type {
  ClientInstrument,
  CreateIntakePayload,
  IntakeServiceLine,
  WorkshopServiceLookup,
} from '../types';

const EMPTY_CLIENT_FORM = {
  fullName: '',
  phone: '',
  email: '',
};

const EMPTY_INSTRUMENT_FORM = {
  instrumentTypeId: '',
  brandId: '',
  colorId: '',
  model: '',
  stringsCount: '6',
  serialNumber: '',
  notes: '',
};

const PHONE_SEARCH_MIN_LENGTH = 3;
const PHONE_SEARCH_DEBOUNCE_MS = 300;
const PHONE_AUTOSELECT_MIN_LENGTH = 10;

function getClientName(client: ClientSearchItem) {
  if (client.fullName?.trim()) return client.fullName;
  return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre';
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

function normalizePhoneInput(value: string) {
  return value.replace(/[^\d+]/g, '');
}

export function IntakesPage() {
  const workshopId = authStore((state) => state.workshopId);

  const instrumentSectionRef = useRef<HTMLElement | null>(null);
  const liveSearchRequestId = useRef(0);

  const [phone, setPhone] = useState('');
  const [searchingClient, setSearchingClient] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [clients, setClients] = useState<ClientSearchItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchItem | null>(null);
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [isNewInstrumentMode, setIsNewInstrumentMode] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState<ClientInstrument | null>(null);

  const [clientForm, setClientForm] = useState(EMPTY_CLIENT_FORM);
  const [instrumentForm, setInstrumentForm] = useState(EMPTY_INSTRUMENT_FORM);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [serviceLines, setServiceLines] = useState<IntakeServiceLine[]>([]);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const lookupsQuery = useQuery({
    queryKey: ['intake-lookups', workshopId],
    queryFn: () => getIntakeLookups(workshopId!),
    enabled: !!workshopId,
    staleTime: 1000 * 60 * 10,
  });

  const instrumentsQuery = useQuery({
    queryKey: ['client-instruments', workshopId, selectedClient?.id],
    queryFn: () => getClientInstruments(workshopId!, selectedClient!.id),
    enabled: !!workshopId && !!selectedClient?.id,
  });

  useEffect(() => {
    if (selectedClient) {
      setClientForm({
        fullName: getClientName(selectedClient),
        phone: selectedClient.phone || '',
        email: selectedClient.email || '',
      });
      setIsNewClientMode(false);

      // al seleccionar cliente, detenemos búsqueda y limpiamos sugerencias
      setSearchingClient(false);
      setSearchError('');
      setClients([]);
      liveSearchRequestId.current += 1;

      // pasarnos a la sección de instrumentos
      window.setTimeout(() => {
        instrumentSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 120);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedClient) {
      setSelectedInstrument(null);
      setIsNewInstrumentMode(true);
      return;
    }

    const list = instrumentsQuery.data || [];

    if (list.length === 1) {
      setSelectedInstrument(list[0]);
      setIsNewInstrumentMode(false);
      return;
    }

    const currentStillExists =
      !!selectedInstrument && list.some((item) => item.id === selectedInstrument.id);

    if (!currentStillExists) {
      setSelectedInstrument(null);
      setIsNewInstrumentMode(list.length === 0);
    }
  }, [selectedClient, instrumentsQuery.data, selectedInstrument]);

  useEffect(() => {
    if (!workshopId) return;

    // si ya hay cliente seleccionado, ya no buscar
    if (selectedClient) {
      setSearchingClient(false);
      return;
    }

    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      setClients([]);
      setSearchError('');
      setSearchingClient(false);
      setIsNewClientMode(false);
      return;
    }

    if (normalizedPhone.length < PHONE_SEARCH_MIN_LENGTH) {
      setClients([]);
      setSearchError('');
      setSearchingClient(false);
      return;
    }

    const currentRequestId = ++liveSearchRequestId.current;
    setSearchingClient(true);
    setSearchError('');

    const timeout = window.setTimeout(async () => {
      try {
        const result = await searchClientByPhone(workshopId, normalizedPhone);

        if (currentRequestId !== liveSearchRequestId.current) return;

        setClients(result);

        const exactPhoneMatch = result.find(
          (client) => (client.phone || '').replace(/\s+/g, '') === normalizedPhone.replace(/\s+/g, ''),
        );

        if (exactPhoneMatch && normalizedPhone.length >= PHONE_AUTOSELECT_MIN_LENGTH) {
          handleSelectClient(exactPhoneMatch);
          return;
        }

        if (result.length === 0) {
          setSelectedInstrument(null);
          setIsNewClientMode(true);
          setClientForm((current) => ({
            ...current,
            phone: normalizedPhone,
          }));
          setSearchError('No encontré clientes con ese teléfono. Puedes darlo de alta aquí.');
          return;
        }

        if (result.length === 1 && normalizedPhone.length >= PHONE_AUTOSELECT_MIN_LENGTH) {
          handleSelectClient(result[0]);
          return;
        }

        setIsNewClientMode(false);
      } catch {
        if (currentRequestId !== liveSearchRequestId.current) return;

        setClients([]);
        setSearchError('No pude buscar clientes. Revisa el endpoint o el taller activo.');
      } finally {
        if (currentRequestId === liveSearchRequestId.current) {
          setSearchingClient(false);
        }
      }
    }, PHONE_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [phone, workshopId, selectedClient]);

  const total = useMemo(
    () => serviceLines.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [serviceLines],
  );

  const createIntakeMutation = useMutation({
    mutationFn: async () => {
      if (!workshopId) throw new Error('No hay taller activo.');

      const normalizedPhone = clientForm.phone.trim();

      if (!selectedClient && !normalizedPhone) {
        throw new Error('Captura el teléfono del cliente.');
      }

      if (!selectedClient && !clientForm.fullName.trim()) {
        throw new Error('Captura el nombre del cliente.');
      }

      if (!selectedInstrument && !instrumentForm.model.trim()) {
        throw new Error('Captura al menos el modelo del instrumento.');
      }

      if (serviceLines.length === 0) {
        throw new Error('Agrega por lo menos un servicio.');
      }

      const invalidService = serviceLines.find(
        (item) => !item.name.trim() || item.quantity <= 0 || Number.isNaN(item.unitPrice),
      );

      if (invalidService) {
        throw new Error('Revisa los servicios: nombre, cantidad y precio son obligatorios.');
      }

      const payload: CreateIntakePayload = {
        clientId: selectedClient?.id,
        client: selectedClient
          ? undefined
          : {
              ...splitFullName(clientForm.fullName),
              phone: normalizedPhone,
              email: clientForm.email.trim() || undefined,
            },
        instrumentId: selectedInstrument?.id,
        instrument: selectedInstrument
          ? undefined
          : {
              instrumentTypeId: instrumentForm.instrumentTypeId || undefined,
              brandId: instrumentForm.brandId || undefined,
              colorId: instrumentForm.colorId || undefined,
              model: instrumentForm.model.trim(),
              stringsCount: instrumentForm.stringsCount
                ? Number(instrumentForm.stringsCount)
                : null,
              serialNumber: instrumentForm.serialNumber.trim() || undefined,
              notes: instrumentForm.notes.trim() || undefined,
            },
        visit: {
          intakeNotes: intakeNotes.trim(),
          receivedAt: new Date().toISOString(),
        },
        services: serviceLines.map((item) => ({
          workshopServiceId: item.catalogServiceId,
          name: item.name.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes?.trim() || undefined,
          isManual: item.source === 'MANUAL',
        })),
      };

      return createIntake(workshopId, payload);
    },
    onSuccess: () => {
      setSubmitError('');
      setSubmitMessage('Recepción creada correctamente.');
      setPhone('');
      setClients([]);
      setSelectedClient(null);
      setSelectedInstrument(null);
      setIsNewClientMode(false);
      setIsNewInstrumentMode(true);
      setClientForm(EMPTY_CLIENT_FORM);
      setInstrumentForm(EMPTY_INSTRUMENT_FORM);
      setIntakeNotes('');
      setServiceLines([]);
      setSearchError('');
      setSearchingClient(false);
    },
    onError: (error: Error) => {
      setSubmitMessage('');
      setSubmitError(error.message || 'No pude crear la recepción.');
    },
  });

  async function handleSearchClient() {
    if (!workshopId) {
      setSearchError('Primero debes tener un taller activo.');
      return;
    }

    if (!phone.trim()) {
      setSearchError('Escribe un teléfono para buscar.');
      return;
    }

    setSearchingClient(true);
    setSearchError('');
    setSubmitMessage('');
    setSubmitError('');

    try {
      const result = await searchClientByPhone(workshopId, phone.trim());
      setClients(result);

      if (result.length === 1) {
        handleSelectClient(result[0]);
      } else if (result.length === 0) {
        setSearchError('No encontré clientes con ese teléfono. Puedes darlo de alta aquí.');
        setSelectedClient(null);
        setSelectedInstrument(null);
        setIsNewClientMode(true);
        setClientForm((current) => ({
          ...current,
          fullName: '',
          phone: phone.trim(),
        }));
        setIsNewInstrumentMode(true);
      }
    } catch {
      setClients([]);
      setSearchError('No pude buscar clientes. Revisa el endpoint o el taller activo.');
    } finally {
      setSearchingClient(false);
    }
  }

  function handleSelectClient(client: ClientSearchItem) {
    setSelectedClient(client);
    setIsNewClientMode(false);
    setPhone(client.phone || '');
  }

  function handleNewClientMode() {
    liveSearchRequestId.current += 1;
    setSearchingClient(false);
    setSelectedClient(null);
    setClients([]);
    setSelectedInstrument(null);
    setIsNewClientMode(true);
    setIsNewInstrumentMode(true);
    setSearchError('');
    setClientForm({ ...EMPTY_CLIENT_FORM, phone: phone.trim() });
  }

  function handleClearSelectedClient() {
    liveSearchRequestId.current += 1;
    setSearchingClient(false);
    setSelectedClient(null);
    setSelectedInstrument(null);
    setClients([]);
    setIsNewClientMode(false);
    setIsNewInstrumentMode(true);
    setClientForm(EMPTY_CLIENT_FORM);
    setInstrumentForm(EMPTY_INSTRUMENT_FORM);
    setSearchError('');
    setPhone('');
  }

  function addCatalogService(service: WorkshopServiceLookup) {
    setServiceLines((current) => [...current, createCatalogServiceLine(service)]);
  }

  function addManualService() {
    setServiceLines((current) => [...current, createManualServiceLine()]);
  }

  function updateServiceLine(id: string, updates: Partial<IntakeServiceLine>) {
    setServiceLines((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }

  function removeServiceLine(id: string) {
    setServiceLines((current) => current.filter((item) => item.id !== id));
  }

  const instrumentCards = instrumentsQuery.data || [];
  const catalogServices = lookupsQuery.data?.services || [];

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-28 pt-3 sm:px-4 md:px-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          <article className="card p-4">
            <div className="space-y-2">
              <h1 className="section-title text-lg sm:text-xl">Recepción</h1>
              <p className="text-sm text-slate-500">
                Flujo rápido de mostrador: cliente, instrumento, servicios y crear orden.
              </p>
              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Cliente → Instrumento → Servicios → Crear recepción
              </div>
            </div>
          </article>

          <article className="card p-4">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                1
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">Cliente</h2>
                <p className="text-sm text-slate-500">
                  Busca por teléfono en tiempo real o da de alta uno nuevo.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  className="input h-12 w-full pr-12 text-base"
                  placeholder="Teléfono del cliente"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    const value = normalizePhoneInput(e.target.value);

                    if (selectedClient) {
                      setSelectedClient(null);
                      setSelectedInstrument(null);
                      setIsNewInstrumentMode(true);
                    }

                    setPhone(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSearchClient();
                    }
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
                  className="btn-secondary h-12 w-full justify-center gap-2"
                  onClick={() => void handleSearchClient()}
                  disabled={searchingClient || !!selectedClient}
                  type="button"
                >
                  {searchingClient ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Buscar cliente
                    </>
                  )}
                </button>

                <button
                  className="btn-secondary h-12 w-full justify-center gap-2"
                  type="button"
                  onClick={handleNewClientMode}
                >
                  <UserPlus2 className="h-4 w-4" />
                  Cliente nuevo
                </button>
              </div>

              {!selectedClient &&
              phone.trim().length > 0 &&
              phone.trim().length < PHONE_SEARCH_MIN_LENGTH ? (
                <div className="text-xs text-slate-500">
                  Escribe al menos {PHONE_SEARCH_MIN_LENGTH} dígitos para buscar.
                </div>
              ) : null}
            </div>

            {searchError ? (
              <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {searchError}
              </div>
            ) : null}

            {clients.length > 0 && !selectedClient ? (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-slate-700">Coincidencias</div>

                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-slate-900">{getClientName(client)}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{client.phone || 'Sin teléfono'}</span>
                      </div>
                      {client.email ? (
                        <div className="break-all text-sm text-slate-500">{client.email}</div>
                      ) : null}
                      {client.code ? (
                        <div className="pt-1">
                          <span className="chip bg-slate-100 text-slate-700">{client.code}</span>
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {selectedClient ? (
              <div className="mt-4 space-y-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div>
                  Cliente seleccionado:{' '}
                  <span className="font-semibold">{getClientName(selectedClient)}</span>
                </div>

                <button
                  type="button"
                  className="btn-secondary h-11 w-full justify-center gap-2 sm:w-auto"
                  onClick={handleClearSelectedClient}
                >
                  <XCircle className="h-4 w-4" />
                  Limpiar selección
                </button>
              </div>
            ) : null}

            {(isNewClientMode || selectedClient) ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Nombre del cliente</label>
                  <input
                    className="input h-12 w-full"
                    placeholder="Ej. Ricardo Pérez"
                    value={clientForm.fullName}
                    onChange={(e) =>
                      setClientForm((current) => ({
                        ...current,
                        fullName: e.target.value,
                      }))
                    }
                    disabled={!!selectedClient}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Teléfono</label>
                  <input
                    className="input h-12 w-full"
                    placeholder="55..."
                    value={clientForm.phone}
                    onChange={(e) =>
                      setClientForm((current) => ({
                        ...current,
                        phone: e.target.value,
                      }))
                    }
                    disabled={!!selectedClient}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input
                    className="input h-12 w-full"
                    placeholder="correo@ejemplo.com"
                    value={clientForm.email}
                    onChange={(e) =>
                      setClientForm((current) => ({
                        ...current,
                        email: e.target.value,
                      }))
                    }
                    disabled={!!selectedClient}
                  />
                </div>
              </div>
            ) : null}
          </article>

          <article ref={instrumentSectionRef} className="card p-4">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                2
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">Instrumento</h2>
                <p className="text-sm text-slate-500">
                  Selecciona uno existente o registra uno nuevo.
                </p>
              </div>
            </div>

            {!selectedClient && !isNewClientMode ? (
              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Primero selecciona o crea cliente.
              </div>
            ) : (
              <>
                {!!selectedClient && (
                  <>
                    {instrumentsQuery.isLoading ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Cargando instrumentos...
                      </div>
                    ) : instrumentCards.length > 0 ? (
                      <div className="space-y-2">
                        {instrumentCards.map((instrument) => {
                          const isSelected = selectedInstrument?.id === instrument.id;

                          return (
                            <button
                              key={instrument.id}
                              type="button"
                              onClick={() => {
                                setSelectedInstrument(instrument);
                                setIsNewInstrumentMode(false);
                              }}
                              className={cn(
                                'w-full rounded-2xl border p-4 text-left transition',
                                isSelected
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-slate-200 bg-white hover:bg-slate-50',
                              )}
                            >
                              <div className="font-semibold text-slate-900">{instrument.name}</div>
                              <div className="mt-1 text-sm text-slate-500">
                                {[instrument.typeName, instrument.brandName, instrument.model]
                                  .filter(Boolean)
                                  .join(' · ') || 'Sin detalle'}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {instrument.colorName || 'Sin color'}
                                {instrument.stringsCount
                                  ? ` · ${instrument.stringsCount} cuerdas`
                                  : ''}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Este cliente todavía no tiene instrumentos registrados.
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className={cn(
                      'btn-secondary h-11 w-full justify-center gap-2',
                      isNewInstrumentMode && 'border-amber-500 bg-amber-50 text-amber-700',
                    )}
                    onClick={() => {
                      setSelectedInstrument(null);
                      setIsNewInstrumentMode(true);
                    }}
                  >
                    <PackagePlus className="h-4 w-4" />
                    Instrumento nuevo
                  </button>

                  {selectedInstrument ? (
                    <button
                      type="button"
                      className="btn-secondary h-11 w-full justify-center gap-2"
                      onClick={() => setSelectedInstrument(null)}
                    >
                      <XCircle className="h-4 w-4" />
                      Quitar seleccionado
                    </button>
                  ) : null}
                </div>

                {selectedInstrument ? (
                  <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Instrumento seleccionado:{' '}
                    <span className="font-semibold">{selectedInstrument.name}</span>
                  </div>
                ) : null}

                {(isNewInstrumentMode || !selectedClient) && !selectedInstrument ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Tipo</label>
                      <select
                        className="input h-12 w-full"
                        value={instrumentForm.instrumentTypeId}
                        onChange={(e) =>
                          setInstrumentForm((current) => ({
                            ...current,
                            instrumentTypeId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona tipo</option>
                        {(lookupsQuery.data?.instrumentTypes || []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Marca</label>
                      <select
                        className="input h-12 w-full"
                        value={instrumentForm.brandId}
                        onChange={(e) =>
                          setInstrumentForm((current) => ({
                            ...current,
                            brandId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona marca</option>
                        {(lookupsQuery.data?.brands || []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Modelo</label>
                      <input
                        className="input h-12 w-full"
                        placeholder="Ej. Jazz Bass / Strat / Les Paul"
                        value={instrumentForm.model}
                        onChange={(e) =>
                          setInstrumentForm((current) => ({
                            ...current,
                            model: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Color</label>
                      <select
                        className="input h-12 w-full"
                        value={instrumentForm.colorId}
                        onChange={(e) =>
                          setInstrumentForm((current) => ({
                            ...current,
                            colorId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona color</option>
                        {(lookupsQuery.data?.colors || []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Número de cuerdas</label>
                        <input
                          className="input h-12 w-full"
                          inputMode="numeric"
                          value={instrumentForm.stringsCount}
                          onChange={(e) =>
                            setInstrumentForm((current) => ({
                              ...current,
                              stringsCount: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Serie</label>
                        <input
                          className="input h-12 w-full"
                          value={instrumentForm.serialNumber}
                          onChange={(e) =>
                            setInstrumentForm((current) => ({
                              ...current,
                              serialNumber: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Notas del instrumento
                      </label>
                      <textarea
                        className="input min-h-24 w-full"
                        placeholder="Golpes, mods, estado general, etc."
                        value={instrumentForm.notes}
                        onChange={(e) =>
                          setInstrumentForm((current) => ({
                            ...current,
                            notes: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </article>

          <article className="card p-4">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                3
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">Servicios</h2>
                <p className="text-sm text-slate-500">
                  Agrega del catálogo o captura manual.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Falla o solicitud inicial</label>
              <textarea
                className="input min-h-28 w-full"
                placeholder="Ej. ajuste completo, revisar jack, posible cambio de cuerdas..."
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
              />
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Servicios del catálogo</label>
                {lookupsQuery.isLoading ? (
                  <span className="text-xs text-slate-500">Cargando...</span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {catalogServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className="btn-secondary min-h-12 w-full justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => addCatalogService(service)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Wrench className="h-4 w-4 shrink-0" />
                      <span className="truncate">{service.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {currency(service.basePrice)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium">Servicios capturados</label>
                <button
                  className="btn-secondary h-11 w-full justify-center gap-2 sm:w-auto"
                  type="button"
                  onClick={addManualService}
                >
                  <PlusCircle className="h-4 w-4" />
                  Servicio manual
                </button>
              </div>

              {serviceLines.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Todavía no hay servicios.
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceLines.map((service) => (
                    <div key={service.id} className="rounded-2xl border border-slate-200 p-3">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'chip',
                              service.source === 'CATALOG'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-sky-50 text-sky-700',
                            )}
                          >
                            {service.source === 'CATALOG' ? 'Catálogo' : 'Manual'}
                          </span>
                          <span className="text-sm text-slate-500">
                            Subtotal {currency(service.quantity * service.unitPrice)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn-secondary h-11 w-full justify-center gap-2 sm:w-auto"
                          onClick={() => removeServiceLine(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar
                        </button>
                      </div>

                      <div className="space-y-3">
                        <input
                          className="input w-full"
                          placeholder="Servicio"
                          value={service.name}
                          disabled={service.source === 'CATALOG'}
                          onChange={(e) =>
                            updateServiceLine(service.id, { name: e.target.value })
                          }
                        />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input
                            className="input w-full"
                            inputMode="numeric"
                            placeholder="Cantidad"
                            value={service.quantity}
                            onChange={(e) =>
                              updateServiceLine(service.id, {
                                quantity: Number(e.target.value || 0),
                              })
                            }
                          />
                          <input
                            className="input w-full"
                            inputMode="decimal"
                            placeholder="Precio"
                            value={service.unitPrice}
                            onChange={(e) =>
                              updateServiceLine(service.id, {
                                unitPrice: Number(e.target.value || 0),
                              })
                            }
                          />
                        </div>

                        <textarea
                          className="input min-h-20 w-full"
                          placeholder="Notas opcionales"
                          value={service.notes || ''}
                          onChange={(e) =>
                            updateServiceLine(service.id, { notes: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className="card p-4 xl:hidden">
            <h2 className="section-title text-base">Resumen</h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cliente
                </div>
                <div className="font-medium text-slate-900">
                  {selectedClient ? getClientName(selectedClient) : clientForm.fullName || 'Pendiente'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedClient?.phone || clientForm.phone || 'Sin teléfono'}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Instrumento
                </div>
                <div className="font-medium text-slate-900">
                  {selectedInstrument?.name || instrumentForm.model || 'Pendiente'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedInstrument
                    ? [selectedInstrument.typeName, selectedInstrument.brandName, selectedInstrument.model]
                        .filter(Boolean)
                        .join(' · ')
                    : [
                        lookupsQuery.data?.instrumentTypes.find(
                          (item) => item.id === instrumentForm.instrumentTypeId,
                        )?.name,
                        lookupsQuery.data?.brands.find(
                          (item) => item.id === instrumentForm.brandId,
                        )?.name,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Sin detalle'}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Servicios
                </div>
                <div className="font-medium text-slate-900">{serviceLines.length} capturados</div>
                <div className="mt-1 text-sm text-slate-500">
                  Total estimado {currency(total)}
                </div>
              </div>

              {submitMessage ? (
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitMessage}</span>
                </div>
              ) : null}

              {submitError ? (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              ) : null}
            </div>
          </article>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <article className="card p-4">
              <h2 className="section-title">Resumen rápido</h2>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </div>
                  <div className="font-medium text-slate-900">
                    {selectedClient
                      ? getClientName(selectedClient)
                      : clientForm.fullName || 'Pendiente'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {selectedClient?.phone || clientForm.phone || 'Sin teléfono'}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Instrumento
                  </div>
                  <div className="font-medium text-slate-900">
                    {selectedInstrument?.name || instrumentForm.model || 'Pendiente'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {selectedInstrument
                      ? [
                          selectedInstrument.typeName,
                          selectedInstrument.brandName,
                          selectedInstrument.model,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : [
                          lookupsQuery.data?.instrumentTypes.find(
                            (item) => item.id === instrumentForm.instrumentTypeId,
                          )?.name,
                          lookupsQuery.data?.brands.find(
                            (item) => item.id === instrumentForm.brandId,
                          )?.name,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Sin detalle'}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Servicios
                  </div>
                  <div className="font-medium text-slate-900">{serviceLines.length} capturados</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Total estimado {currency(total)}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {submitMessage ? (
                  <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{submitMessage}</span>
                  </div>
                ) : null}

                {submitError ? (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                ) : null}

                <button
                  className="btn-primary h-12 w-full text-base"
                  type="button"
                  disabled={createIntakeMutation.isPending || !workshopId}
                  onClick={() => createIntakeMutation.mutate()}
                >
                  {createIntakeMutation.isPending ? 'Creando recepción...' : 'Crear recepción'}
                </button>
              </div>
            </article>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total estimado</div>
            <div className="truncate text-base font-semibold text-slate-900">
              {currency(total)}
            </div>
            <div className="text-xs text-slate-500">{serviceLines.length} servicios</div>
          </div>

          <button
            className="btn-primary h-12 min-w-[170px] justify-center px-5 text-base"
            type="button"
            disabled={createIntakeMutation.isPending || !workshopId}
            onClick={() => createIntakeMutation.mutate()}
          >
            {createIntakeMutation.isPending ? 'Creando...' : 'Crear recepción'}
          </button>
        </div>
      </div>
    </div>
  );
}
