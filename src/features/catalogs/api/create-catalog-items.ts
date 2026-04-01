import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';

export type CatalogOptionResponse = {
  id: string;
  name: string;
  slug?: string;
};

export type CreateBrandPayload = { name: string; slug?: string };
export type CreateColorPayload = { name: string; slug?: string };
export type CreateInstrumentTypePayload = { name: string; slug?: string };
export type CreateTuningPayload = { name: string; slug?: string };
export type CreateStringGaugePayload = {
  name: string;
  value?: string;
  instrumentFamily?: string;
  slug?: string;
};
export type CreateWorkshopServicePayload = {
  name: string;
  description?: string;
  basePrice?: number;
  estimatedTime?: number;
  isAdjust?: boolean;
};
export type CreateVisitStatusPayload = { name: string; slug?: string; order?: number };
export type CreateServiceStatusPayload = { name: string; slug?: string; order?: number };

function resolveHttpError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const status = axiosError.response?.status;
    const apiMessage = axiosError.response?.data?.message || axiosError.response?.data?.error;
    if (apiMessage) return `${apiMessage}${status ? ` (HTTP ${status})` : ''}`;
    if (axiosError.message) return `${fallback}: ${axiosError.message}`;
  }
  return fallback;
}

async function postCatalogItem<TPayload, TResponse>(
  endpoint: string,
  token: string,
  payload: TPayload,
  fallbackError: string,
): Promise<TResponse> {
  try {
    const { data } = await axios.post<TResponse>(`${env.apiBaseUrl}${endpoint}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    throw new Error(resolveHttpError(error, fallbackError));
  }
}

export async function createWorkshopBrand(
  token: string,
  workshopId: string,
  payload: CreateBrandPayload,
) {
  return postCatalogItem<CreateBrandPayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/brands`,
    token,
    payload,
    'No se pudo crear la marca',
  );
}

export async function createWorkshopColor(
  token: string,
  workshopId: string,
  payload: CreateColorPayload,
) {
  return postCatalogItem<CreateColorPayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/colors`,
    token,
    payload,
    'No se pudo crear el color',
  );
}

export async function createWorkshopInstrumentType(
  token: string,
  workshopId: string,
  payload: CreateInstrumentTypePayload,
) {
  return postCatalogItem<CreateInstrumentTypePayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/instrument-types`,
    token,
    payload,
    'No se pudo crear el tipo de instrumento',
  );
}

export async function createWorkshopTuning(
  token: string,
  workshopId: string,
  payload: CreateTuningPayload,
) {
  return postCatalogItem<CreateTuningPayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/tunings`,
    token,
    payload,
    'No se pudo crear la afinación',
  );
}

export async function createWorkshopStringGauge(
  token: string,
  workshopId: string,
  payload: CreateStringGaugePayload,
) {
  return postCatalogItem<CreateStringGaugePayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/string-gauges`,
    token,
    payload,
    'No se pudo crear el calibre',
  );
}

export async function createWorkshopService(
  token: string,
  workshopId: string,
  payload: CreateWorkshopServicePayload,
) {
  return postCatalogItem<CreateWorkshopServicePayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/workshop-services`,
    token,
    payload,
    'No se pudo crear el servicio de taller',
  );
}

export async function createWorkshopVisitStatus(
  token: string,
  workshopId: string,
  payload: CreateVisitStatusPayload,
) {
  return postCatalogItem<CreateVisitStatusPayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/workshop-visit-statuses`,
    token,
    payload,
    'No se pudo crear el estatus de visita',
  );
}

export async function createWorkshopServiceStatus(
  token: string,
  workshopId: string,
  payload: CreateServiceStatusPayload,
) {
  return postCatalogItem<CreateServiceStatusPayload, CatalogOptionResponse>(
    `/workshops/${workshopId}/service-statuses`,
    token,
    payload,
    'No se pudo crear el estatus de servicio',
  );
}

/**
 * Ejemplos de uso:
 *
 * await createWorkshopBrand(token, workshopId, { name: 'Fender' });
 * await createWorkshopColor(token, workshopId, { name: 'Sunburst' });
 * await createWorkshopInstrumentType(token, workshopId, { name: 'Guitarra eléctrica' });
 * await createWorkshopTuning(token, workshopId, { name: 'Drop D' });
 * await createWorkshopStringGauge(token, workshopId, { name: '10-46', value: '10-46' });
 * await createWorkshopService(token, workshopId, { name: 'Ajuste básico', basePrice: 450, isAdjust: true });
 * await createWorkshopVisitStatus(token, workshopId, { name: 'Recibida', order: 1 });
 * await createWorkshopServiceStatus(token, workshopId, { name: 'En proceso', order: 1 });
 */
