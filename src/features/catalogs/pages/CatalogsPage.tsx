import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { notifyError, notifySuccess } from '@/lib/notify';
import { currency, dateTime } from '@/lib/utils';
import { SearchInput } from '@/components/ui/SearchInput';
import { CatalogEntitySection, type CatalogFieldDefinition } from '@/features/catalogs/components/CatalogEntitySection';
import {
  useAffiliates,
  useCreateAffiliate,
  useCreateStringGauge,
  useCreateTuning,
  useCreateWorkshopBrand,
  useCreateWorkshopColor,
  useCreateWorkshopPart,
  useCreateWorkshopService,
  useCreateWorkshopServiceStatus,
  useCreateWorkshopVisitStatus,
  useDeleteAffiliate,
  useDeleteStringGauge,
  useDeleteTuning,
  useDeleteWorkshopBrand,
  useDeleteWorkshopColor,
  useDeleteWorkshopService,
  useDeleteWorkshopServiceStatus,
  useDeleteWorkshopVisitStatus,
  useStringGauges,
  useTunings,
  useUpdateAffiliate,
  useUpdateStringGauge,
  useUpdateTuning,
  useUpdateWorkshopBrand,
  useUpdateWorkshopColor,
  useUpdateWorkshopPart,
  useUpdateWorkshopService,
  useUpdateWorkshopServiceStatus,
  useUpdateWorkshopVisitStatus,
  useWorkshopBrands,
  useWorkshopColors,
  useWorkshopParts,
  useWorkshopServiceStatuses,
  useWorkshopServices,
  useWorkshopVisitStatuses,
} from '@/features/catalogs/hooks/useCatalogs';
import type {
  Affiliate,
  Brand,
  Color,
  ServiceStatus,
  StringGauge,
  Tuning,
  VisitStatus,
  WorkshopPartCatalog,
  WorkshopServiceCatalog,
} from '@/features/catalogs/types/catalogs';

type CatalogSectionKey =
  | 'colors'
  | 'brands'
  | 'visit-statuses'
  | 'service-statuses'
  | 'parts'
  | 'services'
  | 'tunings'
  | 'string-gauges'
  | 'affiliates'
  | 'users';

const HUB_ITEMS: Array<{ key: CatalogSectionKey; label: string; description: string }> = [
  { key: 'colors', label: 'Colores', description: 'Paleta para acabados y apariencia.' },
  { key: 'brands', label: 'Marcas', description: 'Marcas globales y propias del taller.' },
  { key: 'visit-statuses', label: 'Status de visita', description: 'Flujo operativo de la orden.' },
  { key: 'service-statuses', label: 'Status de servicio', description: 'Estados internos por servicio.' },
  { key: 'parts', label: 'Refacciones', description: 'Precios y disponibilidad por taller.' },
  { key: 'services', label: 'Servicios', description: 'Servicios de taller y ajustes.' },
  { key: 'tunings', label: 'Afinaciones', description: 'Afinaciones disponibles en intake.' },
  { key: 'string-gauges', label: 'Calibres de cuerdas', description: 'Calibres por familia de instrumento.' },
  { key: 'affiliates', label: 'Afiliados', description: 'Convenios bandas y negocios.' },
  { key: 'users', label: 'Usuarios', description: 'Gestión de imagen de perfil desde Ajustes.' },
];

const COLOR_FIELDS: CatalogFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  { name: 'hex', label: 'Hex', type: 'color' },
  { name: 'isActive', label: 'Activo', type: 'checkbox' },
];
const BRAND_FIELDS: CatalogFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  { name: 'isActive', label: 'Activa', type: 'checkbox' },
];
const STATUS_FIELDS: CatalogFieldDefinition[] = [
  { name: 'code', label: 'Código', type: 'text', required: true },
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'color', label: 'Color', type: 'color' },
  { name: 'sortOrder', label: 'Orden', type: 'number', step: '1' },
  { name: 'isActive', label: 'Activo', type: 'checkbox' },
  { name: 'isTerminal', label: 'Terminal', type: 'checkbox' },
];
const PART_FIELDS: CatalogFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'listPrice', label: 'Precio lista', type: 'number', step: '0.01', required: true },
  { name: 'publicPrice', label: 'Precio público', type: 'number', step: '0.01', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'sku', label: 'SKU', type: 'text' },
  { name: 'brand', label: 'Marca', type: 'text' },
  { name: 'isActive', label: 'Activa', type: 'checkbox' },
];
const SERVICE_FIELDS: CatalogFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'basePrice', label: 'Precio base', type: 'number', step: '0.01' },
  { name: 'estimatedTime', label: 'Tiempo estimado (min)', type: 'number', step: '1' },
  { name: 'isActive', label: 'Activo', type: 'checkbox' },
  { name: 'isAdjust', label: 'Es ajuste', type: 'checkbox' },
];
const TUNING_FIELDS: CatalogFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  { name: 'notes', label: 'Notas', type: 'textarea' },
  { name: 'sortOrder', label: 'Orden', type: 'number', step: '1' },
  { name: 'isActive', label: 'Activa', type: 'checkbox' },
];
const STRING_GAUGE_FIELDS: CatalogFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  { name: 'value', label: 'Valor', type: 'text' },
  { name: 'instrumentFamily', label: 'Familia de instrumento', type: 'text' },
  { name: 'sortOrder', label: 'Orden', type: 'number', step: '1' },
  { name: 'isActive', label: 'Activo', type: 'checkbox' },
];
const AFFILIATE_FIELDS: CatalogFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'type', label: 'Tipo', type: 'select', options: [{ label: 'Banda', value: 'BAND' }, { label: 'Negocio', value: 'BUSINESS' }] },
  { name: 'code', label: 'Código', type: 'text', required: true },
  { name: 'notes', label: 'Notas', type: 'textarea' },
  { name: 'isActive', label: 'Activo', type: 'checkbox' },
];

function SectionBadge({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'amber' | 'emerald' | 'sky' }) {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorMap[tone]}`}>{children}</span>;
}

export function CatalogsPage() {
  const navigate = useNavigate();
  const { catalogKey } = useParams<{ catalogKey?: CatalogSectionKey }>();
  const workshopId = authStore((state) => state.workshopId);
  const [search, setSearch] = useState('');
  const activeSection = (catalogKey || '') as CatalogSectionKey;
  const isHub = !catalogKey;

  const colorsQuery = useWorkshopColors(activeSection === 'colors' ? workshopId : null);
  const brandsQuery = useWorkshopBrands(activeSection === 'brands' ? workshopId : null);
  const visitStatusesQuery = useWorkshopVisitStatuses(activeSection === 'visit-statuses' ? workshopId : null);
  const serviceStatusesQuery = useWorkshopServiceStatuses(activeSection === 'service-statuses' ? workshopId : null);
  const partsQuery = useWorkshopParts(activeSection === 'parts' ? workshopId : null);
  const servicesQuery = useWorkshopServices(activeSection === 'services' ? workshopId : null);
  const tuningsQuery = useTunings(activeSection === 'tunings' ? workshopId : null);
  const gaugesQuery = useStringGauges(activeSection === 'string-gauges' ? workshopId : null);
  const affiliatesQuery = useAffiliates(activeSection === 'affiliates' ? workshopId : null);

  const createColor = useCreateWorkshopColor(workshopId);
  const updateColor = useUpdateWorkshopColor(workshopId);
  const deleteColor = useDeleteWorkshopColor(workshopId);
  const createBrand = useCreateWorkshopBrand(workshopId);
  const updateBrand = useUpdateWorkshopBrand(workshopId);
  const deleteBrand = useDeleteWorkshopBrand(workshopId);
  const createVisitStatus = useCreateWorkshopVisitStatus(workshopId);
  const updateVisitStatus = useUpdateWorkshopVisitStatus(workshopId);
  const deleteVisitStatus = useDeleteWorkshopVisitStatus(workshopId);
  const createServiceStatus = useCreateWorkshopServiceStatus(workshopId);
  const updateServiceStatus = useUpdateWorkshopServiceStatus(workshopId);
  const deleteServiceStatus = useDeleteWorkshopServiceStatus(workshopId);
  const createPart = useCreateWorkshopPart(workshopId);
  const updatePart = useUpdateWorkshopPart(workshopId);
  const createService = useCreateWorkshopService(workshopId);
  const updateService = useUpdateWorkshopService(workshopId);
  const deleteService = useDeleteWorkshopService(workshopId);
  const createTuning = useCreateTuning(workshopId);
  const updateTuning = useUpdateTuning(workshopId);
  const deleteTuning = useDeleteTuning(workshopId);
  const createGauge = useCreateStringGauge(workshopId);
  const updateGauge = useUpdateStringGauge(workshopId);
  const deleteGauge = useDeleteStringGauge(workshopId);
  const createAffiliate = useCreateAffiliate(workshopId);
  const updateAffiliate = useUpdateAffiliate(workshopId);
  const deleteAffiliate = useDeleteAffiliate(workshopId);

  const canMutateCatalogItem = (item: { isGlobal?: boolean; workshopId?: string | null }) => !item.isGlobal && item.workshopId === workshopId;

  const handleMutation = async (action: () => Promise<unknown>, successTitle: string, errorTitle: string) => {
    try {
      await action();
      notifySuccess(successTitle);
    } catch {
      notifyError(errorTitle);
    }
  };

  const headerSubtitle = useMemo(() => HUB_ITEMS.find((item) => item.key === activeSection)?.description || '', [activeSection]);
  const filteredItems = <T extends object>(items: T[]) => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
  };

  if (!workshopId) {
    return <section className="card p-4 text-sm text-amber-700">Selecciona un taller para gestionar catálogos.</section>;
  }

  if (isHub) {
    return (
      <div className="space-y-4">
        <section className="card p-4">
          <h1 className="text-lg font-semibold text-slate-900">Catálogos</h1>
          <p className="mt-1 text-sm text-slate-500">Selecciona un catálogo para abrir su pantalla dedicada.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {HUB_ITEMS.map((item) => (
              <Link
                key={item.key}
                to={`/app/catalogs/${item.key}`}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-amber-400 hover:bg-amber-50"
              >
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (!HUB_ITEMS.some((item) => item.key === activeSection)) {
    return (
      <section className="card p-4 text-sm text-amber-700">
        Catálogo no encontrado.
      </section>
    );
  }

  if (activeSection === 'users') {
    return (
      <section className="card p-4 space-y-3">
        <button type="button" className="btn-secondary h-9 px-3" onClick={() => navigate('/app/catalogs')}>← Volver</button>
        <h1 className="text-lg font-semibold text-slate-900">Usuarios del taller</h1>
        <p className="text-sm text-slate-500">No hay CRUD de usuarios en Catálogos. Gestiona la imagen de perfil desde Ajustes.</p>
        <Link to="/app/settings" className="btn-primary h-10 px-3 inline-flex items-center">Ir a Ajustes</Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <button type="button" className="btn-secondary h-9 px-3" onClick={() => navigate('/app/catalogs')}>← Catálogos</button>
        <h1 className="mt-3 text-lg font-semibold text-slate-900">{HUB_ITEMS.find((item) => item.key === activeSection)?.label || 'Catálogo'}</h1>
        <p className="mt-1 text-sm text-slate-500">{headerSubtitle || 'Configuración operativa del taller.'}</p>
        <div className="mt-3">
          <SearchInput value={search} onChange={setSearch} placeholder={`Buscar en ${HUB_ITEMS.find((item) => item.key === activeSection)?.label || 'catálogo'}`} />
        </div>
      </section>

      {activeSection === 'colors' ? (
        <CatalogEntitySection<Color>
          title="Colores"
          description="Lista combinada (global + taller)."
          createContextHint="Los nuevos colores se agregan al catálogo del taller activo."
          fields={COLOR_FIELDS}
          items={filteredItems(colorsQuery.data || [])}
          isLoading={colorsQuery.isLoading}
          isError={colorsQuery.isError}
          emptyMessage="Aún no hay colores."
          getItemTitle={(item) => item.name}
          getItemMeta={(item) => `${item.slug} · ${item.hex || 'Sin HEX'} · Actualizado ${dateTime(item.updatedAt)}`}
          renderBadges={(item) => (
            <>
              <SectionBadge tone={item.isGlobal ? 'amber' : 'sky'}>{item.isGlobal ? 'Global' : 'Taller'}</SectionBadge>
              <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activo' : 'Inactivo'}</SectionBadge>
            </>
          )}
          canEdit={canMutateCatalogItem}
          canDelete={canMutateCatalogItem}
          getReadonlyReason={(item) => (canMutateCatalogItem(item) ? null : 'Registro global')}
          toFormValues={(item) => ({ name: item?.name || '', slug: item?.slug || '', hex: item?.hex || '#000000', isActive: item?.isActive ?? true })}
          onCreate={(payload) => handleMutation(() => createColor.mutateAsync(payload as never), 'Color creado', 'No se pudo crear el color')}
          onUpdate={(item, payload) =>
            canMutateCatalogItem(item)
              ? handleMutation(() => updateColor.mutateAsync({ id: item.id, payload: payload as never }), 'Color actualizado', 'No se pudo actualizar el color')
              : Promise.resolve()
          }
          onDelete={(item) =>
            canMutateCatalogItem(item)
              ? handleMutation(() => deleteColor.mutateAsync({ id: item.id } as never), 'Color eliminado', 'No se pudo eliminar el color')
              : Promise.resolve()
          }
        />
      ) : null}

      {activeSection === 'brands' ? (
        <CatalogEntitySection<Brand>
          title="Marcas"
          description="Lista combinada (global + taller)."
          createContextHint="Las nuevas marcas se agregan al catálogo del taller activo."
          fields={BRAND_FIELDS}
          items={filteredItems(brandsQuery.data || [])}
          isLoading={brandsQuery.isLoading}
          isError={brandsQuery.isError}
          emptyMessage="Aún no hay marcas."
          getItemTitle={(item) => item.name}
          getItemMeta={(item) => `${item.slug} · Actualizado ${dateTime(item.updatedAt)}`}
          renderBadges={(item) => (
            <>
              <SectionBadge tone={item.isGlobal ? 'amber' : 'sky'}>{item.isGlobal ? 'Global' : 'Taller'}</SectionBadge>
              <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activa' : 'Inactiva'}</SectionBadge>
            </>
          )}
          canEdit={canMutateCatalogItem}
          canDelete={canMutateCatalogItem}
          getReadonlyReason={(item) => (canMutateCatalogItem(item) ? null : 'Registro global')}
          toFormValues={(item) => ({ name: item?.name || '', slug: item?.slug || '', isActive: item?.isActive ?? true })}
          onCreate={(payload) => handleMutation(() => createBrand.mutateAsync(payload as never), 'Marca creada', 'No se pudo crear la marca')}
          onUpdate={(item, payload) =>
            canMutateCatalogItem(item)
              ? handleMutation(() => updateBrand.mutateAsync({ id: item.id, payload: payload as never }), 'Marca actualizada', 'No se pudo actualizar la marca')
              : Promise.resolve()
          }
          onDelete={(item) =>
            canMutateCatalogItem(item)
              ? handleMutation(() => deleteBrand.mutateAsync({ id: item.id } as never), 'Marca eliminada', 'No se pudo eliminar la marca')
              : Promise.resolve()
          }
        />
      ) : null}

      {activeSection === 'visit-statuses' ? (
        <CatalogEntitySection<VisitStatus>
          title="Status de visita"
          description="Orden y control de flujo de visitas."
          createContextHint="Los nuevos status de visita se agregan al catálogo del taller activo."
          fields={STATUS_FIELDS}
          items={filteredItems(visitStatusesQuery.data || [])}
          isLoading={visitStatusesQuery.isLoading}
          isError={visitStatusesQuery.isError}
          emptyMessage="Aún no hay status de visita."
          getItemTitle={(item) => `${item.code} · ${item.name}`}
          getItemMeta={(item) => `Orden ${item.sortOrder ?? 0} · Actualizado ${dateTime(item.updatedAt)}`}
          renderBadges={(item) => (
            <>
              <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activo' : 'Inactivo'}</SectionBadge>
              <SectionBadge tone={item.isTerminal ? 'amber' : 'sky'}>{item.isTerminal ? 'Terminal' : 'Intermedio'}</SectionBadge>
            </>
          )}
          toFormValues={(item) => ({
            code: item?.code || '',
            name: item?.name || '',
            description: item?.description || '',
            color: item?.color || '#334155',
            sortOrder: String(item?.sortOrder ?? 0),
            isActive: item?.isActive ?? true,
            isTerminal: item?.isTerminal ?? false,
          })}
          onCreate={(payload) => handleMutation(() => createVisitStatus.mutateAsync(payload as never), 'Status de visita creado', 'No se pudo crear el status de visita')}
          onUpdate={(item, payload) => handleMutation(() => updateVisitStatus.mutateAsync({ id: item.id, payload: payload as never }), 'Status de visita actualizado', 'No se pudo actualizar el status de visita')}
          onDelete={(item) => handleMutation(() => deleteVisitStatus.mutateAsync({ id: item.id } as never), 'Status de visita eliminado', 'No se pudo eliminar el status de visita')}
        />
      ) : null}

      {activeSection === 'service-statuses' ? (
        <CatalogEntitySection<ServiceStatus>
          title="Status de servicio"
          description="Estado operacional por servicio."
          createContextHint="Los nuevos status de servicio se agregan al catálogo del taller activo."
          fields={STATUS_FIELDS}
          items={filteredItems(serviceStatusesQuery.data || [])}
          isLoading={serviceStatusesQuery.isLoading}
          isError={serviceStatusesQuery.isError}
          emptyMessage="Aún no hay status de servicio."
          getItemTitle={(item) => `${item.code} · ${item.name}`}
          getItemMeta={(item) => `Orden ${item.sortOrder ?? 0} · Actualizado ${dateTime(item.updatedAt)}`}
          renderBadges={(item) => (
            <>
              <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activo' : 'Inactivo'}</SectionBadge>
              <SectionBadge tone={item.isTerminal ? 'amber' : 'sky'}>{item.isTerminal ? 'Terminal' : 'Intermedio'}</SectionBadge>
            </>
          )}
          toFormValues={(item) => ({
            code: item?.code || '',
            name: item?.name || '',
            description: item?.description || '',
            color: item?.color || '#334155',
            sortOrder: String(item?.sortOrder ?? 0),
            isActive: item?.isActive ?? true,
            isTerminal: item?.isTerminal ?? false,
          })}
          onCreate={(payload) => handleMutation(() => createServiceStatus.mutateAsync(payload as never), 'Status de servicio creado', 'No se pudo crear el status de servicio')}
          onUpdate={(item, payload) => handleMutation(() => updateServiceStatus.mutateAsync({ id: item.id, payload: payload as never }), 'Status de servicio actualizado', 'No se pudo actualizar el status de servicio')}
          onDelete={(item) => handleMutation(() => deleteServiceStatus.mutateAsync({ id: item.id } as never), 'Status de servicio eliminado', 'No se pudo eliminar el status de servicio')}
        />
      ) : null}

      {activeSection === 'parts' ? (
        <CatalogEntitySection<WorkshopPartCatalog>
          title="Refacciones"
          description="Sin delete: activar/desactivar vía toggle."
          createContextHint="Las nuevas refacciones se agregan al catálogo del taller activo."
          fields={PART_FIELDS}
          items={filteredItems(partsQuery.data || [])}
          isLoading={partsQuery.isLoading}
          isError={partsQuery.isError}
          emptyMessage="Aún no hay refacciones."
          getItemTitle={(item) => item.name}
          getItemMeta={(item) => `${currency(item.listPrice)} lista · ${currency(item.publicPrice)} público · ${dateTime(item.updatedAt)}`}
          renderBadges={(item) => <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activa' : 'Inactiva'}</SectionBadge>}
          toFormValues={(item) => ({
            name: item?.name || '',
            listPrice: String(item?.listPrice ?? 0),
            publicPrice: String(item?.publicPrice ?? 0),
            description: item?.description || '',
            sku: item?.sku || '',
            brand: item?.brand || '',
            isActive: item?.isActive ?? true,
          })}
          onCreate={(payload) => handleMutation(() => createPart.mutateAsync(payload as never), 'Refacción creada', 'No se pudo crear la refacción')}
          onUpdate={(item, payload) => handleMutation(() => updatePart.mutateAsync({ partId: item.id, payload: payload as never }), 'Refacción actualizada', 'No se pudo actualizar la refacción')}
          onToggleActive={(item) =>
            handleMutation(
              () => updatePart.mutateAsync({ partId: item.id, payload: { isActive: !item.isActive } }),
              item.isActive ? 'Refacción desactivada' : 'Refacción activada',
              'No se pudo cambiar estado de la refacción',
            )
          }
        />
      ) : null}

      {activeSection === 'services' ? (
        <CatalogEntitySection<WorkshopServiceCatalog>
          title="Servicios"
          description="Catálogo de servicios del taller."
          createContextHint="Los nuevos servicios se agregan al catálogo del taller activo."
          fields={SERVICE_FIELDS}
          items={filteredItems(servicesQuery.data || [])}
          isLoading={servicesQuery.isLoading}
          isError={servicesQuery.isError}
          emptyMessage="Aún no hay servicios."
          getItemTitle={(item) => item.name}
          getItemMeta={(item) => `${item.slug} · ${currency(item.basePrice || 0)} · ${item.estimatedTime || 0} min · ${dateTime(item.updatedAt)}`}
          renderBadges={(item) => (
            <>
              <SectionBadge tone={item.isAdjust ? 'amber' : 'sky'}>{item.isAdjust ? 'Ajuste' : 'Servicio'}</SectionBadge>
              <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activo' : 'Inactivo'}</SectionBadge>
            </>
          )}
          toFormValues={(item) => ({
            name: item?.name || '',
            slug: item?.slug || '',
            description: item?.description || '',
            basePrice: String(item?.basePrice ?? 0),
            estimatedTime: String(item?.estimatedTime ?? 0),
            isActive: item?.isActive ?? true,
            isAdjust: item?.isAdjust ?? false,
          })}
          onCreate={(payload) => handleMutation(() => createService.mutateAsync(payload as never), 'Servicio creado', 'No se pudo crear el servicio')}
          onUpdate={(item, payload) => handleMutation(() => updateService.mutateAsync({ id: item.id, payload: payload as never }), 'Servicio actualizado', 'No se pudo actualizar el servicio')}
          onDelete={(item) => handleMutation(() => deleteService.mutateAsync({ id: item.id } as never), 'Servicio eliminado', 'No se pudo eliminar el servicio')}
        />
      ) : null}

      {activeSection === 'tunings' ? (
        <CatalogEntitySection<Tuning>
          title="Afinaciones"
          description="Afinaciones disponibles."
          createContextHint="Las nuevas afinaciones se agregan al catálogo del taller activo."
          fields={TUNING_FIELDS}
          items={filteredItems(tuningsQuery.data || [])}
          isLoading={tuningsQuery.isLoading}
          isError={tuningsQuery.isError}
          emptyMessage="Aún no hay afinaciones."
          getItemTitle={(item) => item.name}
          getItemMeta={(item) => `${item.slug} · Orden ${item.sortOrder ?? 0}`}
          renderBadges={(item) => <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activa' : 'Inactiva'}</SectionBadge>}
          toFormValues={(item) => ({ name: item?.name || '', slug: item?.slug || '', notes: item?.notes || '', sortOrder: String(item?.sortOrder ?? 0), isActive: item?.isActive ?? true })}
          onCreate={(payload) => handleMutation(() => createTuning.mutateAsync(payload as never), 'Afinación creada', 'No se pudo crear la afinación')}
          onUpdate={(item, payload) => handleMutation(() => updateTuning.mutateAsync({ id: item.id, payload: payload as never }), 'Afinación actualizada', 'No se pudo actualizar la afinación')}
          onDelete={(item) => handleMutation(() => deleteTuning.mutateAsync({ id: item.id } as never), 'Afinación eliminada', 'No se pudo eliminar la afinación')}
        />
      ) : null}

      {activeSection === 'string-gauges' ? (
        <CatalogEntitySection<StringGauge>
          title="Calibres de cuerdas"
          description="Calibres por familia de instrumento."
          createContextHint="Los nuevos calibres se agregan al catálogo del taller activo."
          fields={STRING_GAUGE_FIELDS}
          items={filteredItems(gaugesQuery.data || [])}
          isLoading={gaugesQuery.isLoading}
          isError={gaugesQuery.isError}
          emptyMessage="Aún no hay calibres."
          getItemTitle={(item) => item.name}
          getItemMeta={(item) => `${item.value || '-'} · ${item.instrumentFamily || '-'} · Orden ${item.sortOrder ?? 0}`}
          renderBadges={(item) => <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activo' : 'Inactivo'}</SectionBadge>}
          toFormValues={(item) => ({
            name: item?.name || '',
            slug: item?.slug || '',
            value: item?.value || '',
            instrumentFamily: item?.instrumentFamily || '',
            sortOrder: String(item?.sortOrder ?? 0),
            isActive: item?.isActive ?? true,
          })}
          onCreate={(payload) => handleMutation(() => createGauge.mutateAsync(payload as never), 'Calibre creado', 'No se pudo crear el calibre')}
          onUpdate={(item, payload) => handleMutation(() => updateGauge.mutateAsync({ id: item.id, payload: payload as never }), 'Calibre actualizado', 'No se pudo actualizar el calibre')}
          onDelete={(item) => handleMutation(() => deleteGauge.mutateAsync({ id: item.id } as never), 'Calibre eliminado', 'No se pudo eliminar el calibre')}
        />
      ) : null}

      {activeSection === 'affiliates' ? (
        <CatalogEntitySection<Affiliate>
          title="Afiliados"
          description="Convenios de taller (BAND/BUSINESS)."
          createContextHint="Los nuevos afiliados se agregan al catálogo del taller activo."
          fields={AFFILIATE_FIELDS}
          items={filteredItems(affiliatesQuery.data || [])}
          isLoading={affiliatesQuery.isLoading}
          isError={affiliatesQuery.isError}
          emptyMessage="Aún no hay afiliados."
          getItemTitle={(item) => item.name}
          getItemMeta={(item) => `${item.code.toUpperCase()} · ${dateTime(item.updatedAt)}`}
          renderBadges={(item) => (
            <>
              <SectionBadge tone="sky">{item.type}</SectionBadge>
              <SectionBadge tone={item.isActive ? 'emerald' : 'slate'}>{item.isActive ? 'Activo' : 'Inactivo'}</SectionBadge>
            </>
          )}
          toFormValues={(item) => ({ name: item?.name || '', type: item?.type || 'BAND', code: item?.code || '', notes: item?.notes || '', isActive: item?.isActive ?? true })}
          onCreate={(payload) =>
            handleMutation(
              () => createAffiliate.mutateAsync({ ...(payload as object), code: String(payload.code || '').toUpperCase() } as never),
              'Afiliado creado',
              'No se pudo crear el afiliado',
            )
          }
          onUpdate={(item, payload) =>
            handleMutation(
              () => updateAffiliate.mutateAsync({ id: item.id, payload: { ...(payload as object), code: String(payload.code || '').toUpperCase() } as never }),
              'Afiliado actualizado',
              'No se pudo actualizar el afiliado',
            )
          }
          onDelete={(item) => handleMutation(() => deleteAffiliate.mutateAsync({ id: item.id } as never), 'Afiliado eliminado', 'No se pudo eliminar el afiliado')}
        />
      ) : null}
    </div>
  );
}
