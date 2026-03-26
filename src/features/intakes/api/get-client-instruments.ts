import { http } from '@/lib/http';
import type { ClientInstrument } from '../types';

function normalizeName(item: Record<string, unknown>) {
  const brand =
    item.brandName ??
    (item.brand && typeof item.brand === 'object'
      ? (item.brand as { name?: string }).name
      : undefined);

  const model = item.model;

  const type =
    item.typeName ??
    (item.instrumentType && typeof item.instrumentType === 'object'
      ? (item.instrumentType as { name?: string }).name
      : undefined);

  return [brand, model, type]
    .filter(Boolean)
    .map((value) => String(value))
    .join(' ')
    .trim();
}

export async function getClientInstruments(
  workshopId: string,
  clientId: string,
): Promise<ClientInstrument[]> {
  const { data } = await http.get<unknown>(
    `/workshops/${workshopId}/clients/${clientId}/instruments`,
  );

  const raw = Array.isArray(data)
    ? data
    : data &&
        typeof data === 'object' &&
        Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: unknown[] }).data
      : [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const normalizedName = normalizeName(item);

      return {
        id: String(item.id ?? ''),
        name: String(item.name ?? (normalizedName || 'Instrumento')),
        brandName: item.brandName
          ? String(item.brandName)
          : item.brand &&
              typeof item.brand === 'object' &&
              (item.brand as { name?: string }).name
            ? String((item.brand as { name?: string }).name)
            : undefined,
        model: item.model ? String(item.model) : undefined,
        colorName: item.colorName
          ? String(item.colorName)
          : item.color &&
              typeof item.color === 'object' &&
              (item.color as { name?: string }).name
            ? String((item.color as { name?: string }).name)
            : undefined,
        typeName: item.typeName
          ? String(item.typeName)
          : item.instrumentType &&
              typeof item.instrumentType === 'object' &&
              (item.instrumentType as { name?: string }).name
            ? String((item.instrumentType as { name?: string }).name)
            : undefined,
        stringsCount: item.stringsCount != null ? Number(item.stringsCount) : null,
        serialNumber: item.serialNumber ? String(item.serialNumber) : null,
        notes: item.notes ? String(item.notes) : null,
      };
    })
    .filter((item) => item.id);
}
