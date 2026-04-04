import { useMemo, useState } from 'react';
import { Loader2, Pencil, Plus } from 'lucide-react';
import { authStore } from '@/stores/auth-store';
import { currency, dateTime } from '@/lib/utils';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { WorkshopPart } from '@/features/visits/api/visitPartsApi';
import { useCreateWorkshopPart, useUpdateWorkshopPart, useWorkshopParts } from '@/features/visits/hooks/useVisitParts';
import {
  getFriendlyVisitPartError,
  normalizeWorkshopPartPayload,
  validateWorkshopPartForm,
  type WorkshopPartFormValues,
} from '@/features/visits/utils/visitParts';

type FilterType = 'all' | 'active' | 'inactive';

const EMPTY_FORM: WorkshopPartFormValues = {
  name: '',
  listPrice: '0',
  publicPrice: '0',
  description: '',
  sku: '',
  brand: '',
  isActive: true,
};

export function CatalogsPage() {
  const workshopId = authStore((state) => state.workshopId);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingPart, setEditingPart] = useState<WorkshopPart | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<WorkshopPartFormValues>(EMPTY_FORM);

  const isActiveFilter = filter === 'all' ? undefined : filter === 'active';
  const partsQuery = useWorkshopParts(workshopId, isActiveFilter);
  const createMutation = useCreateWorkshopPart(workshopId);
  const updateMutation = useUpdateWorkshopPart(workshopId, editingPart?.id || '');

  const cards = useMemo(
    () => partsQuery.data || [],
    [partsQuery.data],
  );

  function handleCreate() {
    setEditingPart(null);
    setForm(EMPTY_FORM);
    setError('');
    setOpenForm(true);
  }

  function handleEdit(part: WorkshopPart) {
    setEditingPart(part);
    setForm({
      name: part.name || '',
      listPrice: String(part.listPrice || 0),
      publicPrice: String(part.publicPrice || 0),
      description: part.description || '',
      sku: part.sku || '',
      brand: part.brand || '',
      isActive: part.isActive,
    });
    setError('');
    setOpenForm(true);
  }

  async function handleSave() {
    const validation = validateWorkshopPartForm(form);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      const payload = normalizeWorkshopPartPayload(form);
      if (editingPart) {
        await updateMutation.mutateAsync(payload);
        notifySuccess('Refacción actualizada');
      } else {
        await createMutation.mutateAsync(payload);
        notifySuccess('Refacción creada');
      }
      setOpenForm(false);
    } catch (saveError) {
      const message = getFriendlyVisitPartError(saveError);
      setError(message);
      notifyError('Error de catálogo', message);
    }
  }

  return (
    <div className="space-y-4">
      <article className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="section-title text-lg">Refacciones (catálogo)</h1>
            <p className="text-sm text-slate-500">Administra precios y disponibilidad por taller.</p>
          </div>
          <button type="button" className="btn-primary h-10 px-3" onClick={handleCreate}>
            <Plus className="h-4 w-4" /> Crear
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'Activos' },
            { key: 'inactive', label: 'Inactivos' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={filter === item.key ? 'btn-primary h-8 px-3' : 'btn-secondary h-8 px-3'}
              onClick={() => setFilter(item.key as FilterType)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </article>

      {partsQuery.isLoading ? <div className="card p-4 text-sm text-slate-500">Cargando catálogo...</div> : null}
      {partsQuery.isError ? <div className="card p-4 text-sm text-red-600">No se pudo cargar el catálogo.</div> : null}
      {!partsQuery.isLoading && !cards.length ? (
        <div className="card p-4 text-sm text-slate-500">No hay refacciones en este filtro.</div>
      ) : null}

      <div className="grid gap-3">
        {cards.map((part) => (
          <article key={part.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{part.name}</h3>
                <p className="text-xs text-slate-500">SKU: {part.sku || '—'} · Marca: {part.brand || '—'}</p>
                <p className="mt-1 text-xs text-slate-600">Lista: {currency(part.listPrice)} · Público: {currency(part.publicPrice)}</p>
                <p className="mt-1 text-xs text-slate-500">Activo: {part.isActive ? 'Sí' : 'No'} · Actualizado: {dateTime(part.updatedAt || part.createdAt || '')}</p>
              </div>
              <button type="button" className="btn-secondary h-8 px-2" onClick={() => handleEdit(part)}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {openForm ? (
        <article className="card p-4">
          <h2 className="text-base font-semibold text-slate-900">{editingPart ? 'Editar refacción' : 'Nueva refacción'}</h2>
          <div className="mt-3 grid gap-2">
            <input className="input h-11" placeholder="Nombre" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input h-11" inputMode="decimal" placeholder="Precio lista" value={form.listPrice} onChange={(e) => setForm((c) => ({ ...c, listPrice: e.target.value }))} />
              <input className="input h-11" inputMode="decimal" placeholder="Precio público" value={form.publicPrice} onChange={(e) => setForm((c) => ({ ...c, publicPrice: e.target.value }))} />
            </div>
            <input className="input h-11" placeholder="SKU" value={form.sku} onChange={(e) => setForm((c) => ({ ...c, sku: e.target.value }))} />
            <input className="input h-11" placeholder="Marca" value={form.brand} onChange={(e) => setForm((c) => ({ ...c, brand: e.target.value }))} />
            <textarea className="input min-h-20" placeholder="Descripción" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))} />
              Refacción activa
            </label>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setOpenForm(false)}>Cancelar</button>
            <button type="button" className="btn-primary h-10 justify-center" onClick={() => void handleSave()} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </article>
      ) : null}
    </div>
  );
}
