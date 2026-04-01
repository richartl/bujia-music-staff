import axios from 'axios';
import { env } from '@/config/env';

export type Affiliate = {
  id: string;
  name: string;
  type: 'BAND' | 'BUSINESS';
  code: string;
  notes?: string;
  isActive: boolean;
};

export type UpsertAffiliatePayload = {
  name: string;
  type: 'BAND' | 'BUSINESS';
  code: string;
  notes?: string;
  isActive?: boolean;
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getAffiliates(token: string, workshopId: string) {
  const { data } = await axios.get<Affiliate[]>(`${env.apiBaseUrl}/workshops/${workshopId}/affiliates`, {
    headers: authHeader(token),
  });
  return data;
}

export async function getAffiliateById(token: string, workshopId: string, id: string) {
  const { data } = await axios.get<Affiliate>(`${env.apiBaseUrl}/workshops/${workshopId}/affiliates/${id}`, {
    headers: authHeader(token),
  });
  return data;
}

export async function createAffiliate(token: string, workshopId: string, payload: UpsertAffiliatePayload) {
  const { data } = await axios.post<Affiliate>(`${env.apiBaseUrl}/workshops/${workshopId}/affiliates`, payload, {
    headers: authHeader(token),
  });
  return data;
}

export async function updateAffiliate(token: string, workshopId: string, id: string, payload: Partial<UpsertAffiliatePayload>) {
  const { data } = await axios.patch<Affiliate>(`${env.apiBaseUrl}/workshops/${workshopId}/affiliates/${id}`, payload, {
    headers: authHeader(token),
  });
  return data;
}

export async function deleteAffiliate(token: string, workshopId: string, id: string) {
  await axios.delete(`${env.apiBaseUrl}/workshops/${workshopId}/affiliates/${id}`, {
    headers: authHeader(token),
  });
}
