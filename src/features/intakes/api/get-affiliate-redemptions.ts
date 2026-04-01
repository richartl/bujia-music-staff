import axios from 'axios';
import { env } from '@/config/env';

export type AffiliateRedemption = {
  id: string;
  affiliateCode: string;
  visitId: string;
  clientId?: string;
  isEligible?: boolean;
  createdAt?: string;
};

export type AffiliateRedemptionSummary = {
  total: number;
  eligible: number;
  nonEligible: number;
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getAffiliateRedemptions(token: string, workshopId: string) {
  const { data } = await axios.get<AffiliateRedemption[]>(`${env.apiBaseUrl}/workshops/${workshopId}/affiliate-redemptions`, {
    headers: authHeader(token),
  });
  return data;
}

export async function getAffiliateRedemptionsSummary(
  token: string,
  workshopId: string,
  params?: { from?: string; to?: string },
) {
  const { data } = await axios.get<AffiliateRedemptionSummary>(
    `${env.apiBaseUrl}/workshops/${workshopId}/affiliate-redemptions/summary`,
    {
      headers: authHeader(token),
      params,
    },
  );
  return data;
}
