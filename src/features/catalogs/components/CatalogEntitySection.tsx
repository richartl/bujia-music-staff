import { type ReactNode, useMemo, useState } from 'react';
import { Loader2, MoreVertical, Pencil, Plus, Power, Trash2, X } from 'lucide-react';
import { OverlayPortal } from '@/components/ui/OverlayPortal';

type FieldType = 'text' | 'number' | 'textarea' | 'checkbox' | 'color' | 'select';

type FieldOption = {
  label: string;
  value: string;
};

export type CatalogFieldDefinition = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  step?: string;
  options?: FieldOption[];
};

export type CatalogEntitySectionProps<TItem extends { id: string }> = {
  title: string;
  description: string;
  fields: CatalogFieldDefinition[];
  items: TItem[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
  saveLabel?: string;
  getItemTitle: (item: TItem) => string;
  getItemMeta?: (item: TItem) => string;
  renderBadges?: (item: TItem) => ReactNode;
  toFormValues: (item?: TItem | null) => Record<string, string | boolean>;
  onCreate: (payload: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (item: TItem, payload: Record<string, unknown>) => Promise<unknown>;
  onDelete?: (item: TItem) => Promise<unknown>;
  onToggleActive?: (item: TItem) => Promise<unknown>;
  canEdit?: (item: TItem) => boolean;
  canDelete?: (item: TItem) => boolean;
  getReadonlyReason?: (item: TItem) => string | null;
  createContextHint?: string;
};

function buildPayloadFromFields(fields: CatalogFieldDefinition[], values: Record<string, string | boolean>) {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    const value = values[field.name];
    if (field.type === 'checkbox') {
      acc[field.name] = Boolean(value);
      return acc;
    }

    const stringValue = String(value ?? '').trim();
    if (!stringValue.length) {
      acc[field.name] = field.type === 'number' ? undefined : '';
      return acc;
    }

    if (field.type === 'number') {
      const numeric = Number(stringValue);
      acc[field.name] = Number.isFinite(numeric) ? numeric : undefined;
      return acc;
    }

    acc[field.name] = stringValue;
    return acc;
  }, {});
}

function CatalogFormModal({
  open,
  title,
  fields,
  values,
  saving,
  error,
  saveLabel,
  onClose,
  onSave,
  onChange,
}: {
  open: boolean;
  title: string;
  fields: CatalogFieldDefinition[];
  values: Record<string, string | boolean>;
  saving: boolean;
  error: string;
  saveLabel: string;
  onClose: () => void;
  onSave: () => void;
  onChange: (name: string, value: string | boolean) => void;
}) {
  if (!open) return null;
  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-[150] flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
        <section
          className="w-full rounded-t-2xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-2xl sm:max-w-lg sm:rounded-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{title}</h3>
            <button type="button" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="mt-3 grid gap-2">
            {fields.map((field) => {
              const value = values[field.name];
              if (field.type === 'textarea') {
                return (
                  <label key={field.name} className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-300">{field.label}</span>
                    <textarea
                      className="input min-h-20 bg-slate-800 text-slate-100"
                      placeholder={field.placeholder}
                      value={String(value ?? '')}
                      onChange={(event) => onChange(field.name, event.target.value)}
                    />
                  </label>
                );
              }

              if (field.type === 'checkbox') {
                return (
                  <label key={field.name} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm">
                    <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(field.name, event.target.checked)} />
                    {field.label}
                  </label>
                );
              }

              if (field.type === 'select') {
                return (
                  <label key={field.name} className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-300">{field.label}</span>
                    <select className="input h-11 bg-slate-800 text-slate-100" value={String(value ?? '')} onChange={(event) => onChange(field.name, event.target.value)}>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              return (
                <label key={field.name} className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-300">{field.label}</span>
                  <input
                    className="input h-11 bg-slate-800 text-slate-100"
                    type={field.type}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={String(value ?? '')}
                    onChange={(event) => onChange(field.name, event.target.value)}
                  />
                </label>
              );
            })}
          </div>

          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary h-10 justify-center" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn-primary h-10 justify-center" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
            </button>
          </div>
        </section>
      </div>
    </OverlayPortal>
  );
}

function ConfirmActionModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  pending,
}: {
  open: boolean;
  title: string;
  message: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-[155] flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4" onClick={onCancel}>
        <section className="w-full rounded-t-2xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-300">{message}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary h-10 justify-center" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="h-10 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white" onClick={onConfirm} disabled={pending}>
              {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Confirmar'}
            </button>
          </div>
        </section>
      </div>
    </OverlayPortal>
  );
}

export function CatalogEntitySection<TItem extends { id: string }>(props: CatalogEntitySectionProps<TItem>) {
  const {
    title,
    description,
    fields,
    items,
    isLoading,
    isError,
    emptyMessage,
    saveLabel = 'Guardar',
    getItemTitle,
    getItemMeta,
    renderBadges,
    toFormValues,
    onCreate,
    onUpdate,
    onDelete,
    onToggleActive,
    canEdit,
    canDelete,
    getReadonlyReason,
    createContextHint,
  } = props;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TItem | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => toFormValues(null));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<TItem | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const formTitle = useMemo(() => (editingItem ? `Editar ${title}` : `Agregar ${title}`), [editingItem, title]);

  const openCreate = () => {
    setEditingItem(null);
    setValues(toFormValues(null));
    setError('');
    setIsFormOpen(true);
  };

  const openEdit = (item: TItem) => {
    setEditingItem(item);
    setValues(toFormValues(item));
    setError('');
    setMenuItemId(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const payload = buildPayloadFromFields(fields, values);
      if (editingItem) {
        await onUpdate(editingItem, payload);
      } else {
        await onCreate(payload);
      }
      setIsFormOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (itemId: string, action: () => Promise<unknown>) => {
    setPendingActionId(itemId);
    try {
      await action();
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <section className="card border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <button type="button" className="btn-primary h-10 px-3" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>
      {createContextHint ? <p className="mt-1 text-[11px] font-medium text-sky-700">{createContextHint}</p> : null}

      {isLoading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : null}
      {isError ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">No se pudo cargar el catálogo.</p> : null}
      {!isLoading && !isError && items.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-600">{emptyMessage}</p>
          <button type="button" className="btn-secondary mt-3 h-9 px-3" onClick={openCreate}>
            Agregar primero
          </button>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        {items.map((item) => {
          const editable = canEdit ? canEdit(item) : true;
          const deletable = canDelete ? canDelete(item) : true;
          const readonlyReason = getReadonlyReason ? getReadonlyReason(item) : null;
          const isPending = pendingActionId === item.id;
          return (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{getItemTitle(item)}</p>
                  {getItemMeta ? <p className="mt-1 text-xs text-slate-500">{getItemMeta(item)}</p> : null}
                  {renderBadges ? <div className="mt-2 flex flex-wrap gap-1">{renderBadges(item)}</div> : null}
                  {readonlyReason ? (
                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Solo lectura · {readonlyReason}
                    </p>
                  ) : null}
                </div>

                <div className="relative shrink-0">
                  {readonlyReason ? null : (
                  <button type="button" className="btn-secondary h-8 px-2" onClick={() => setMenuItemId((current) => (current === item.id ? null : item.id))}>
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5" />}
                  </button>
                  )}
                  {menuItemId === item.id && !readonlyReason ? (
                    <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                      {editable ? (
                        <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-slate-100" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                      ) : null}
                      {onToggleActive ? (
                        <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-slate-100" onClick={() => void runAction(item.id, () => onToggleActive(item))}>
                          <Power className="h-3.5 w-3.5" />
                          Activar / desactivar
                        </button>
                      ) : null}
                      {onDelete && deletable ? (
                        <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-rose-700 hover:bg-rose-50" onClick={() => setConfirmDeleteItem(item)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <CatalogFormModal
        open={isFormOpen}
        title={formTitle}
        fields={fields}
        values={values}
        saving={isSaving}
        error={error}
        saveLabel={saveLabel}
        onClose={() => setIsFormOpen(false)}
        onSave={() => void handleSave()}
        onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
      />

      <ConfirmActionModal
        open={!!confirmDeleteItem}
        title={`Eliminar ${title}`}
        message="Esta acción no se puede deshacer."
        pending={!!confirmDeleteItem && pendingActionId === confirmDeleteItem.id}
        onCancel={() => setConfirmDeleteItem(null)}
        onConfirm={() => {
          if (!confirmDeleteItem || !onDelete) return;
          void runAction(confirmDeleteItem.id, async () => {
            await onDelete(confirmDeleteItem);
            setConfirmDeleteItem(null);
            setMenuItemId(null);
          });
        }}
      />
    </section>
  );
}
