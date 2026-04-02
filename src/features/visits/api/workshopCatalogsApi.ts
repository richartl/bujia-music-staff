import { http } from '@/lib/http';

type Branch = { id: string; name: string };
type Client = { id: string; fullName?: string; firstName?: string; lastName?: string; phone?: string };
type Instrument = { id: string; name?: string; model?: string };

export async function getWorkshopBranches(workshopId: string, search = '', isActive = true) {
  const { data } = await http.get<Branch[]>(`/workshops/${workshopId}/branches`, {
    params: { search, isActive },
  });
  return data;
}

export async function getWorkshopClients(
  workshopId: string,
  params: { search?: string; page?: number; limit?: number; isActive?: boolean } = {},
) {
  const { data } = await http.get<{ data?: Client[] } | Client[]>(`/workshops/${workshopId}/clients`, {
    params,
  });
  return Array.isArray(data) ? data : data.data || [];
}

export async function getClientInstruments(workshopId: string, clientId: string) {
  const { data } = await http.get<Instrument[]>(`/workshops/${workshopId}/clients/${clientId}/instruments`);
  return data;
}
