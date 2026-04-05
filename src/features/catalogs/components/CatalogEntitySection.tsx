import { useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

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
  renderBadges?: (item: TItem) => React.ReactNode;
  toFormValues: (item?: TItem | null) => Record<string, string | boolean>;
  onCreate: (payload: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (item: TItem, payload: Record<string, unknown>) => Promise<unknown>;
  onDelete?: (item: TItem) => Promise<unknown>;
  onToggleActive?: (item: TItem) => Promise<unknown>;
  canEdit?: (item: TItem) => boolean;
  canDelete?: (item: TItem) => boolean;
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
  } = props;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TItem | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => toFormValues(null));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const formTitle = useMemo(() => (editingItem ? `Editar ${title}` : `Nuevo ${title}`), [editingItem, title]);

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

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <button type="button" className="btn-primary h-10 px-3" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Crear
        </button>
      </div>

      {isLoading ? <p className="mt-3 text-sm text-slate-500">Cargando…</p> : null}
      {isError ? <p className="mt-3 text-sm text-red-600">No se pudo cargar el catálogo.</p> : null}
      {!isLoading && !isError && items.length === 0 ? <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p> : null}

      <div className="mt-3 grid gap-2">
        {items.map((item) => {
          const editable = canEdit ? canEdit(item) : true;
          const deletable = canDelete ? canDelete(item) : true;
          return (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{getItemTitle(item)}</p>
                  {getItemMeta ? <p className="mt-1 text-xs text-slate-500">{getItemMeta(item)}</p> : null}
                  {renderBadges ? <div className="mt-2 flex flex-wrap gap-1">{renderBadges(item)}</div> : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {onToggleActive ? (
                    <button type="button" className="btn-secondary h-8 px-2 text-xs" onClick={() => void onToggleActive(item)}>
                      Toggle
                    </button>
                  ) : null}
                  {editable ? (
                    <button type="button" className="btn-secondary h-8 px-2" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {onDelete && deletable ? (
                    <button type="button" className="h-8 rounded-lg border border-rose-200 bg-rose-50 px-2 text-rose-700" onClick={() => void onDelete(item)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {isFormOpen ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">{formTitle}</p>
          <div className="mt-2 grid gap-2">
            {fields.map((field) => {
              const value = values[field.name];
              if (field.type === 'textarea') {
                return (
                  <label key={field.name} className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
                    <textarea
                      className="input min-h-20"
                      placeholder={field.placeholder}
                      value={String(value ?? '')}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  </label>
                );
              }

              if (field.type === 'checkbox') {
                return (
                  <label key={field.name} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))}
                    />
                    {field.label}
                  </label>
                );
              }

              if (field.type === 'select') {
                return (
                  <label key={field.name} className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
                    <select
                      className="input h-11"
                      value={String(value ?? '')}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    >
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
                  <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
                  <input
                    className="input h-11"
                    type={field.type}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={String(value ?? '')}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  />
                </label>
              );
            })}
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="btn-primary h-10 justify-center" disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
