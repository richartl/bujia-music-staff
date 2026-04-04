import { useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Wrench } from 'lucide-react';
import { currency } from '@/lib/utils';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { VisitService } from '@/features/visits/api/types';
import type { VisitPart } from '@/features/visits/api/visitPartsApi';
import { useCreateVisitPart, useDeleteVisitPart, useUpdateVisitPart, useVisitParts, useWorkshopParts } from '@/features/visits/hooks/useVisitParts';
import {
  getFriendlyVisitPartError,
  normalizeVisitPartPayload,
  validateVisitPartForm,
  type VisitPartFormValues,
} from '@/features/visits/utils/visitParts';

type Props = {
  visitId: string;
  workshopId?: string | null;
  services: VisitService[];
};

const EMPTY_FORM: VisitPartFormValues = {
  workshopPartId: '',
  name: '',
  quantity: '1',
  unitPrice: '0',
  unitCost: '',
  notes: '',
  visitServiceId: '',
};

export function VisitPartsSection({ visitId, workshopId, services }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editingPart, setEditingPart] = useState<VisitPart | null>(null);
  const [form, setForm] = useState<VisitPartFormValues>(EMPTY_FORM);
  const [error, setError] = useState('');

  const partsQuery = useVisitParts(visitId);
  const workshopPartsQuery = useWorkshopParts(workshopId, true);
  const createPartMutation = useCreateVisitPart(visitId);
  const updatePartMutation = useUpdateVisitPart(visitId, editingPart?.id || '');
  const deletePartMutation = useDeleteVisitPart(visitId, editingPart?.id || '');

  const totalParts = useMemo(
    () => (partsQuery.data || []).reduce((sum, item) => sum + Number(item.subtotal || item.quantity * item.unitPrice || 0), 0),
    [partsQuery.data],
  );

  function openCreate() {
    setEditingPart(null);
    setForm(EMPTY_FORM);
    setError('');
    setOpenForm(true);
  }

  function openEdit(part: VisitPart) {
    setEditingPart(part);
    setForm({
      workshopPartId: part.workshopPartId || '',
      name: part.workshopPartId ? '' : part.name || '',
      quantity: String(part.quantity || 1),
      unitPrice: String(part.unitPrice || 0),
      unitCost: part.unitCost == null ? '' : String(part.unitCost),
      notes: part.notes || '',
      visitServiceId: part.visitServiceId || '',
    });
    setError('');
    setOpenForm(true);
  }

  async function handleSave() {
    const validation = validateVisitPartForm(form);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      const payload = normalizeVisitPartPayload(form);
      if (editingPart) {
        await updatePartMutation.mutateAsync(payload);
        notifySuccess('Refacción actualizada');
      } else {
        await createPartMutation.mutateAsync(payload);
        notifySuccess('Refacción agregada');
      }
      setOpenForm(false);
    } catch (submitError) {
      const message = getFriendlyVisitPartError(submitError);
      setError(message);
      notifyError('Error al guardar', message);
    }
  }

  async function handleDelete(part: VisitPart) {
    setEditingPart(part);
    try {
      await deletePartMutation.mutateAsync();
      notifySuccess('Refacción eliminada');
    } catch (submitError) {
      notifyError('No se pudo eliminar', getFriendlyVisitPartError(submitError));
    }
  }

  return (
    <section className="card mt-3 space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">Refacciones</h3>
        <button type="button" className="btn-primary h-9 px-3" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>
      <p className="text-xs text-slate-500">Total de refacciones: {currency(totalParts)}</p>

      {partsQuery.isLoading ? <p className="text-sm text-slate-500">Cargando refacciones...</p> : null}
      {partsQuery.isError ? <p className="text-sm text-red-600">No se pudieron cargar las refacciones.</p> : null}
      {!partsQuery.isLoading && !partsQuery.data?.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">Aún no hay refacciones en esta visita.</div>
      ) : null}

      <div className="space-y-2">
        {(partsQuery.data || []).map((part) => (
          <article key={part.id} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{part.name || 'Refacción'}</p>
                <p className="text-xs text-slate-500">
                  Cant: {part.quantity} · Unitario: {currency(part.unitPrice)} · Subtotal: {currency(Number(part.subtotal || part.quantity * part.unitPrice || 0))}
                </p>
                {part.visitService?.name ? <p className="mt-1 text-xs text-indigo-700">Servicio: {part.visitService.name}</p> : null}
                {part.notes ? <p className="mt-1 text-xs text-slate-600">Notas: {part.notes}</p> : null}
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn-secondary h-8 px-2" onClick={() => openEdit(part)}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="btn-secondary h-8 px-2 text-red-600" onClick={() => void handleDelete(part)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {openForm ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-2">
            <select
              className="input h-11"
              value={form.workshopPartId}
              onChange={(event) => {
                const partId = event.target.value;
                const selected = workshopPartsQuery.data?.find((item) => item.id === partId);
                setForm((current) => ({
                  ...current,
                  workshopPartId: partId,
                  name: partId ? '' : current.name,
                  unitPrice: partId ? String(selected?.publicPrice || 0) : current.unitPrice,
                }));
              }}
            >
              <option value="">Manual</option>
              {(workshopPartsQuery.data || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {!form.workshopPartId ? (
              <input className="input h-11" placeholder="Nombre manual" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <input className="input h-11" inputMode="decimal" placeholder="Cantidad" value={form.quantity} onChange={(e) => setForm((c) => ({ ...c, quantity: e.target.value }))} />
              <input className="input h-11" inputMode="decimal" placeholder="Precio unitario" value={form.unitPrice} onChange={(e) => setForm((c) => ({ ...c, unitPrice: e.target.value }))} />
            </div>
            <input className="input h-11" inputMode="decimal" placeholder="Costo unitario (opcional)" value={form.unitCost} onChange={(e) => setForm((c) => ({ ...c, unitCost: e.target.value }))} />
            <select className="input h-11" value={form.visitServiceId} onChange={(e) => setForm((c) => ({ ...c, visitServiceId: e.target.value }))}>
              <option value="">Sin servicio asociado</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name || 'Servicio'}</option>
              ))}
            </select>
            <textarea className="input min-h-20" placeholder="Notas" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setOpenForm(false)}>Cancelar</button>
            <button type="button" className="btn-primary h-10 justify-center" onClick={() => void handleSave()} disabled={createPartMutation.isPending || updatePartMutation.isPending}>
              {createPartMutation.isPending || updatePartMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
