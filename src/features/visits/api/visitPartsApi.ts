import { http } from '@/lib/http';

export type WorkshopPart = {
  id: string;
  workshopId: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  brand?: string | null;
  listPrice: number;
  publicPrice: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type VisitPart = {
  id: string;
  visitId: string;
  workshopPartId?: string | null;
  visitServiceId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number | null;
  notes?: string | null;
  subtotal?: number;
  workshopPart?: WorkshopPart | null;
  visitService?: { id: string; name?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateWorkshopPartDto = {
  name: string;
  description?: string;
  sku?: string;
  brand?: string;
  listPrice: number;
  publicPrice: number;
  isActive?: boolean;
};

export type UpdateWorkshopPartDto = Partial<CreateWorkshopPartDto>;

export type CreateVisitPartDto = {
  workshopPartId?: string;
  visitServiceId?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  notes?: string;
};

export type UpdateVisitPartDto = Partial<CreateVisitPartDto>;

function toNumber(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeWorkshopPart(part: WorkshopPart): WorkshopPart {
  return {
    ...part,
    listPrice: toNumber(part.listPrice),
    publicPrice: toNumber(part.publicPrice),
    isActive: Boolean(part.isActive),
  };
}

function normalizeVisitPart(part: VisitPart): VisitPart {
  const quantity = toNumber(part.quantity);
  const unitPrice = toNumber(part.unitPrice);
  return {
    ...part,
    quantity,
    unitPrice,
    unitCost: part.unitCost == null ? null : toNumber(part.unitCost),
    subtotal: toNumber(part.subtotal ?? quantity * unitPrice),
    workshopPart: part.workshopPart ? normalizeWorkshopPart(part.workshopPart) : null,
  };
}

export async function createWorkshopPart(workshopId: string, payload: CreateWorkshopPartDto) {
  const { data } = await http.post<WorkshopPart>(`/workshops/${workshopId}/parts`, payload);
  return normalizeWorkshopPart(data);
}

export async function getWorkshopParts(workshopId: string, params?: { isActive?: boolean }) {
  const { data } = await http.get<WorkshopPart[]>(`/workshops/${workshopId}/parts`, { params });
  return Array.isArray(data) ? data.map(normalizeWorkshopPart) : [];
}

export async function getWorkshopPartById(workshopId: string, partId: string) {
  const { data } = await http.get<WorkshopPart>(`/workshops/${workshopId}/parts/${partId}`);
  return normalizeWorkshopPart(data);
}

export async function updateWorkshopPart(workshopId: string, partId: string, payload: UpdateWorkshopPartDto) {
  const { data } = await http.patch<WorkshopPart>(`/workshops/${workshopId}/parts/${partId}`, payload);
  return normalizeWorkshopPart(data);
}

export async function getVisitParts(visitId: string) {
  const { data } = await http.get<VisitPart[]>(`/visits/${visitId}/parts`);
  return Array.isArray(data) ? data.map(normalizeVisitPart) : [];
}

export async function createVisitPart(visitId: string, payload: CreateVisitPartDto) {
  const { data } = await http.post<VisitPart>(`/visits/${visitId}/parts`, payload);
  return normalizeVisitPart(data);
}

export async function updateVisitPart(visitId: string, visitPartId: string, payload: UpdateVisitPartDto) {
  const { data } = await http.patch<VisitPart>(`/visits/${visitId}/parts/${visitPartId}`, payload);
  return normalizeVisitPart(data);
}

export async function deleteVisitPart(visitId: string, visitPartId: string) {
  await http.delete(`/visits/${visitId}/parts/${visitPartId}`);
}
