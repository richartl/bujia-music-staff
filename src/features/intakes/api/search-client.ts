import { http } from '@/lib/http';

export type ClientSearchItem = {
  id: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
};

export type ClientSearchResponse = {
  data: ClientSearchItem[];
  page?: number;
  limit?: number;
  total?: number;
};

export async function searchClientByPhone(workshopId: string, search: string) {
  const { data } = await http.get<ClientSearchResponse | ClientSearchItem[]>(
    `/workshops/${workshopId}/clients`,
    {
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
