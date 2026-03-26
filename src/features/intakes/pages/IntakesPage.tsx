import { useEffect, useMemo, useState } from 'react';
import { Search, PlusCircle, Loader2, Phone, UserRound, UserPlus2, XCircle } from 'lucide-react';
import { authStore } from '@/stores/auth-store';
import { searchClientByPhone, type ClientSearchItem } from '../api/search-client';

type ManualService = {
  name: string;
  price: string;
};

export function IntakesPage() {
  const workshopId = authStore((state) => state.workshopId);

  const [phone, setPhone] = useState('');
  const [searchingClient, setSearchingClient] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [clients, setClients] = useState<ClientSearchItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchItem | null>(null);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [manualServices, setManualServices] = useState<ManualService[]>([
    { name: 'Servicio básico', price: '500' },
  ]);

  const total = useMemo(
    () => manualServices.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [manualServices],
  );

  useEffect(() => {
    if (selectedClient) {
      setClientName(getClientName(selectedClient));
      setClientPhone(selectedClient.phone || '');
    }
  }, [selectedClient]);

  function updateService(index: number, key: keyof ManualService, value: string) {
    setManualServices((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function addService() {
    setManualServices((current) => [...current, { name: '', price: '' }]);
  }

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
    setSelectedClient(null);

    try {
      const result = await searchClientByPhone(workshopId, phone.trim());
      setClients(result);

      if (result.length === 1) {
        setSelectedClient(result[0]);
      }

      if (result.length === 0) {
        setSearchError('No encontré clientes con ese teléfono.');
        setClientPhone(phone.trim());
        setClientName('');
      }
    } catch (error) {
      setClients([]);
      setSearchError('No pude buscar clientes. Revisa el endpoint o el workshop activo.');
    } finally {
      setSearchingClient(false);
    }
  }

  function getClientName(client: ClientSearchItem) {
    if (client.fullName?.trim()) return client.fullName;
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre';
  }

  function handleNewClientMode() {
    setSelectedClient(null);
    setClients([]);
    setSearchError('');
    setClientName('');
    setClientPhone(phone.trim());
  }

  function handleClearSelectedClient() {
    setSelectedClient(null);
    setClientName('');
    setClientPhone('');
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="section-title">Recepción rápida</h1>
            <p className="mt-1 text-sm text-slate-500">
              Buscar cliente por teléfono, registrar instrumento y capturar servicios iniciales.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              className="input"
              placeholder="Buscar cliente por teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSearchClient();
                }
              }}
            />

            <button
              className="btn-secondary gap-2"
              onClick={() => void handleSearchClient()}
              disabled={searchingClient}
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
                  Buscar
                </>
              )}
            </button>

            <button className="btn-secondary gap-2" type="button" onClick={handleNewClientMode}>
              <UserPlus2 className="h-4 w-4" />
              Cliente nuevo
            </button>
          </div>

          {searchError ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {searchError}
            </div>
          ) : null}

          {clients.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                Clientes encontrados
              </div>

              <div className="space-y-2">
                {clients.map((client) => {
                  const isSelected = selectedClient?.id === client.id;

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClient(client)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {getClientName(client)}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="h-4 w-4" />
                            <span>{client.phone || 'Sin teléfono'}</span>
                          </div>
                          {client.email ? (
                            <div className="mt-1 text-sm text-slate-500">{client.email}</div>
                          ) : null}
                        </div>

                        {client.code ? (
                          <span className="chip bg-slate-100 text-slate-700">{client.code}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Nombre del cliente</label>
              <input
                className="input"
                placeholder="Ej. Ricardo Pérez"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Teléfono</label>
              <input
                className="input"
                placeholder="55..."
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Instrumento</label>
              <input className="input" placeholder="Ej. Jazz Bass" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Modelo</label>
              <input className="input" placeholder="Ej. Affinity / Player / etc." />
            </div>
          </div>

          {selectedClient ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 md:flex-row md:items-center md:justify-between">
              <div>
                Cliente seleccionado: <span className="font-semibold">{getClientName(selectedClient)}</span>
              </div>

              <button
                type="button"
                className="btn-secondary gap-2"
                onClick={handleClearSelectedClient}
              >
                <XCircle className="h-4 w-4" />
                Limpiar selección
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Si no aparece el cliente, aquí mismo lo damos de alta y seguimos con la recepción.
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Falla / solicitud del cliente</label>
            <textarea
              className="input min-h-28"
              placeholder="Ej. ajuste completo y cambio de cuerdas..."
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium">Servicios iniciales</label>
              <button className="btn-secondary gap-2" type="button" onClick={addService}>
                <PlusCircle className="h-4 w-4" />
                Agregar servicio
              </button>
            </div>

            <div className="space-y-3">
              {manualServices.map((service, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl border border-slate-200 p-3 md:grid-cols-[1fr_160px]"
                >
                  <input
                    className="input"
                    placeholder="Servicio"
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Precio"
                    value={service.price}
                    onChange={(e) => updateService(index, 'price', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-slate-500">Total estimado</div>
              <div className="text-2xl font-bold">${total.toFixed(2)}</div>
            </div>
            <button className="btn-primary" type="button">
              Crear recepción
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <article className="card p-5">
          <h2 className="section-title">Cliente actual</h2>

          {selectedClient ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <UserRound className="h-4 w-4" />
                  <span className="font-medium">{getClientName(selectedClient)}</span>
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Tel: {selectedClient.phone || '—'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Email: {selectedClient.email || '—'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Código: {selectedClient.code || '—'}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Busca por teléfono para seleccionar cliente existente o captura uno nuevo.
            </p>
          )}
        </article>

        <article className="card p-5">
          <h2 className="section-title">Siguiente paso</h2>
          <p className="mt-3 text-sm text-slate-600">
            Ya que quede bien esta búsqueda, seguimos con listar instrumentos del cliente y crear el intake real.
          </p>
        </article>
      </aside>
    </div>
  );
}
