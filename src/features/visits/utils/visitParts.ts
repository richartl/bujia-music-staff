import type { CreateVisitPartDto, CreateWorkshopPartDto } from '@/features/visits/api/visitPartsApi';

export type VisitPartFormValues = {
  workshopPartId: string;
  name: string;
  quantity: string;
  unitPrice: string;
  unitCost: string;
  notes: string;
  visitServiceId: string;
};

export type WorkshopPartFormValues = {
  name: string;
  listPrice: string;
  publicPrice: string;
  description: string;
  sku: string;
  brand: string;
  isActive: boolean;
};

export function normalizeVisitPartPayload(values: VisitPartFormValues): CreateVisitPartDto {
  return {
    workshopPartId: values.workshopPartId || undefined,
    name: values.workshopPartId ? undefined : values.name.trim() || undefined,
    quantity: Number(values.quantity),
    unitPrice: Number(values.unitPrice),
    unitCost: values.unitCost.trim() ? Number(values.unitCost) : undefined,
    notes: values.notes.trim() || undefined,
    visitServiceId: values.visitServiceId || undefined,
  };
}

export function validateVisitPartForm(values: VisitPartFormValues) {
  const payload = normalizeVisitPartPayload(values);
  if (!payload.workshopPartId && !payload.name) return 'Debes enviar refacción de catálogo o nombre manual';
  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) return 'La cantidad debe ser mayor a 0';
  if (!Number.isFinite(payload.unitPrice) || payload.unitPrice < 0) return 'El precio unitario debe ser mayor o igual a 0';
  if (payload.unitCost != null && (!Number.isFinite(payload.unitCost) || payload.unitCost < 0)) {
    return 'El costo unitario debe ser mayor o igual a 0';
  }
  return null;
}

export function normalizeWorkshopPartPayload(values: WorkshopPartFormValues): CreateWorkshopPartDto {
  return {
    name: values.name.trim(),
    listPrice: Number(values.listPrice),
    publicPrice: Number(values.publicPrice),
    description: values.description.trim() || undefined,
    sku: values.sku.trim() || undefined,
    brand: values.brand.trim() || undefined,
    isActive: values.isActive,
  };
}

export function validateWorkshopPartForm(values: WorkshopPartFormValues) {
  const payload = normalizeWorkshopPartPayload(values);
  if (!payload.name) return 'El nombre es obligatorio';
  if (!Number.isFinite(payload.listPrice) || payload.listPrice < 0) return 'El precio de lista debe ser mayor o igual a 0';
  if (!Number.isFinite(payload.publicPrice) || payload.publicPrice < 0) return 'El precio público debe ser mayor o igual a 0';
  return null;
}

export function getFriendlyVisitPartError(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error as { response?: { data?: { message?: string | string[] } } };
    const message = response.response?.data?.message;
    const normalized = Array.isArray(message) ? message.join(', ') : message;
    if (typeof normalized === 'string') {
      if (normalized.includes('workshopPartId') || normalized.includes('name')) return 'Debes enviar refacción de catálogo o nombre manual';
      if (normalized.includes('visitService')) return 'El servicio seleccionado no pertenece a la visita';
      if (normalized.includes('not found')) return 'Refacción no encontrada';
      return normalized;
    }
  }
  return 'No se pudo guardar la refacción';
}
