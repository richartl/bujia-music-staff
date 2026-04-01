import { http } from '@/lib/http';
import type {
  IntakeLookups,
  LookupOption,
  StringGaugeLookup,
  WorkshopServiceLookup,
} from '../types';

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

function normalizeOptions(value: unknown): LookupOption[] {
  return normalizeArray<Record<string, unknown>>(value)
    .map((item) => ({
      id: String(item.id ?? item.value ?? item.slug ?? ''),
      name: String(item.name ?? item.label ?? item.description ?? item.slug ?? 'Sin nombre'),
      slug: item.slug ? String(item.slug) : undefined,
    }))
    .filter((item) => item.id && item.name);
}

function normalizeServices(value: unknown): WorkshopServiceLookup[] {
  return normalizeArray<Record<string, unknown>>(value)
    .map((item) => ({
      id: String(item.id ?? item.value ?? item.slug ?? ''),
      name: String(item.name ?? item.label ?? item.description ?? item.slug ?? 'Servicio'),
      slug: item.slug ? String(item.slug) : undefined,
      description: item.description ? String(item.description) : null,
      basePrice: Number(item.basePrice ?? item.price ?? item.unitPrice ?? 0),
      estimatedTime: item.estimatedTime ? Number(item.estimatedTime) : null,
      isAdjust: typeof item.isAdjust === 'boolean' ? item.isAdjust : false,
      isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
    }))
    .filter((item) => item.id && item.name);
}

function normalizeStringGauges(value: unknown): StringGaugeLookup[] {
  return normalizeArray<Record<string, unknown>>(value)
    .map((item) => ({
      id: String(item.id ?? item.value ?? item.slug ?? ''),
      name: String(item.name ?? item.label ?? item.description ?? item.slug ?? 'Sin nombre'),
      slug: item.slug ? String(item.slug) : undefined,
      value: item.value ? String(item.value) : null,
      instrumentFamily: item.instrumentFamily ? String(item.instrumentFamily) : null,
    }))
    .filter((item) => item.id && item.name);
}

export async function getIntakeLookups(workshopId: string): Promise<IntakeLookups> {
  const { data } = await http.get<Record<string, unknown>>(`/workshops/${workshopId}/intakes/lookups`);

  return {
    branches: normalizeOptions(data.branches),
    brands: normalizeOptions(data.brands ?? data.workshopBrands),
    colors: normalizeOptions(data.colors ?? data.workshopColors),
    instrumentTypes: normalizeOptions(data.instrumentTypes ?? data.types ?? data.workshopInstrumentTypes),
    services: normalizeServices(data.services ?? data.workshopServices),
    tunings: normalizeOptions(data.tunings),
    stringGauges: normalizeStringGauges(data.stringGauges),
    visitStatuses: normalizeOptions(data.visitStatuses),
    serviceStatuses: normalizeOptions(data.serviceStatuses),
  };
}
