import type { AxiosRequestConfig } from 'axios';
import { http } from '@/lib/http';

export type ClientSearchItem = {
  id: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  alias?: string;
  phone?: string;
  instagram?: string;
  email?: string;
  isActive?: boolean;
};

export type ClientSearchResponse = {
  data: ClientSearchItem[];
  page?: number;
  limit?: number;
  total?: number;
};

export async function searchClientByPhone(
  workshopId: string,
  search: string,
  config?: AxiosRequestConfig,
) {
  const { data } = await http.get<ClientSearchResponse | ClientSearchItem[]>(
    `/workshops/${workshopId}/clients`,
    {
      ...config,
      params: {
        search,
        page: 1,
        limit: 10,
        isActive: true,
      },
    },
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}
