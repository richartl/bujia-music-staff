import axios from 'axios';
import { env } from '@/config/env';

export type PaymentMethod = {
  id: string;
  name: string;
  slug: string;
  details?: string;
  sortOrder?: number;
  isActive: boolean;
};

export type UpsertPaymentMethodPayload = {
  name: string;
  slug: string;
  details?: string;
  sortOrder?: number;
  isActive?: boolean;
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getPaymentMethods(token: string, workshopId: string) {
  const { data } = await axios.get<PaymentMethod[]>(`${env.apiBaseUrl}/workshops/${workshopId}/payment-methods`, {
    headers: authHeader(token),
  });
  return data;
}

export async function getPaymentMethodById(token: string, workshopId: string, id: string) {
  const { data } = await axios.get<PaymentMethod>(`${env.apiBaseUrl}/workshops/${workshopId}/payment-methods/${id}`, {
    headers: authHeader(token),
  });
  return data;
}

export async function createPaymentMethod(token: string, workshopId: string, payload: UpsertPaymentMethodPayload) {
  const { data } = await axios.post<PaymentMethod>(`${env.apiBaseUrl}/workshops/${workshopId}/payment-methods`, payload, {
    headers: authHeader(token),
  });
  return data;
}

export async function updatePaymentMethod(
  token: string,
  workshopId: string,
  id: string,
  payload: Partial<UpsertPaymentMethodPayload>,
) {
  const { data } = await axios.patch<PaymentMethod>(
    `${env.apiBaseUrl}/workshops/${workshopId}/payment-methods/${id}`,
    payload,
    { headers: authHeader(token) },
  );
  return data;
}

export async function deletePaymentMethod(token: string, workshopId: string, id: string) {
  await axios.delete(`${env.apiBaseUrl}/workshops/${workshopId}/payment-methods/${id}`, {
    headers: authHeader(token),
  });
}
