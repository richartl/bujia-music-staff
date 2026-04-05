import { http } from '@/lib/http';
import type {
  Affiliate,
  Brand,
  Color,
  CreateAffiliatePayload,
  CreateGlobalBrandPayload,
  CreateGlobalColorPayload,
  CreateServiceStatusPayload,
  CreateStringGaugePayload,
  CreateTuningPayload,
  CreateVisitStatusPayload,
  CreateWorkshopBrandPayload,
  CreateWorkshopColorPayload,
  CreateWorkshopPartPayload,
  CreateWorkshopServicePayload,
  ServiceStatus,
  StringGauge,
  Tuning,
  UpdateAffiliatePayload,
  UpdateBrandPayload,
  UpdateColorPayload,
  UpdateServiceStatusPayload,
  UpdateStringGaugePayload,
  UpdateTuningPayload,
  UpdateUserProfileImagePayload,
  UpdateVisitStatusPayload,
  UpdateWorkshopPartPayload,
  UpdateWorkshopServicePayload,
  UpdateWorkshopUserPayload,
  UserProfileImage,
  VisitStatus,
  WorkshopPartCatalog,
  WorkshopPartListFilters,
  WorkshopServiceCatalog,
  WorkshopUser,
  WorkshopUsersListParams,
  WorkshopUsersListResponse,
  CreateWorkshopUserPayload,
} from '@/features/catalogs/types/catalogs';

export async function getWorkshopColors(workshopId: string) {
  const { data } = await http.get<Color[]>(`/workshops/${workshopId}/colors`);
  return data;
}
export async function getWorkshopColorById(workshopId: string, id: string) {
  const { data } = await http.get<Color>(`/workshops/${workshopId}/colors/${id}`);
  return data;
}
export async function createWorkshopColor(workshopId: string, payload: CreateWorkshopColorPayload) {
  const { data } = await http.post<Color>(`/workshops/${workshopId}/colors`, payload);
  return data;
}
export async function updateWorkshopColor(workshopId: string, id: string, payload: UpdateColorPayload) {
  const { data } = await http.patch<Color>(`/workshops/${workshopId}/colors/${id}`, payload);
  return data;
}
export async function deleteWorkshopColor(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/colors/${id}`);
}

export async function getGlobalColors() {
  const { data } = await http.get<Color[]>('/global-colors');
  return data;
}
export async function getGlobalColorById(id: string) {
  const { data } = await http.get<Color>(`/global-colors/${id}`);
  return data;
}
export async function createGlobalColor(payload: CreateGlobalColorPayload) {
  const { data } = await http.post<Color>('/global-colors', payload);
  return data;
}
export async function updateGlobalColor(id: string, payload: UpdateColorPayload) {
  const { data } = await http.patch<Color>(`/global-colors/${id}`, payload);
  return data;
}
export async function deleteGlobalColor(id: string) {
  await http.delete(`/global-colors/${id}`);
}

export async function getWorkshopBrands(workshopId: string) {
  const { data } = await http.get<Brand[]>(`/workshops/${workshopId}/brands`);
  return data;
}
export async function getWorkshopBrandById(workshopId: string, id: string) {
  const { data } = await http.get<Brand>(`/workshops/${workshopId}/brands/${id}`);
  return data;
}
export async function createWorkshopBrand(workshopId: string, payload: CreateWorkshopBrandPayload) {
  const { data } = await http.post<Brand>(`/workshops/${workshopId}/brands`, payload);
  return data;
}
export async function updateWorkshopBrand(workshopId: string, id: string, payload: UpdateBrandPayload) {
  const { data } = await http.patch<Brand>(`/workshops/${workshopId}/brands/${id}`, payload);
  return data;
}
export async function deleteWorkshopBrand(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/brands/${id}`);
}

export async function getGlobalBrands() {
  const { data } = await http.get<Brand[]>('/global-brands');
  return data;
}
export async function getGlobalBrandById(id: string) {
  const { data } = await http.get<Brand>(`/global-brands/${id}`);
  return data;
}
export async function createGlobalBrand(payload: CreateGlobalBrandPayload) {
  const { data } = await http.post<Brand>('/global-brands', payload);
  return data;
}
export async function updateGlobalBrand(id: string, payload: UpdateBrandPayload) {
  const { data } = await http.patch<Brand>(`/global-brands/${id}`, payload);
  return data;
}
export async function deleteGlobalBrand(id: string) {
  await http.delete(`/global-brands/${id}`);
}

export async function getWorkshopVisitStatuses(workshopId: string) {
  const { data } = await http.get<VisitStatus[]>(`/workshops/${workshopId}/workshop-visit-statuses`);
  return data;
}
export async function getWorkshopVisitStatusById(workshopId: string, id: string) {
  const { data } = await http.get<VisitStatus>(`/workshops/${workshopId}/workshop-visit-statuses/${id}`);
  return data;
}
export async function createWorkshopVisitStatus(workshopId: string, payload: CreateVisitStatusPayload) {
  const { data } = await http.post<VisitStatus>(`/workshops/${workshopId}/workshop-visit-statuses`, payload);
  return data;
}
export async function updateWorkshopVisitStatus(workshopId: string, id: string, payload: UpdateVisitStatusPayload) {
  const { data } = await http.patch<VisitStatus>(`/workshops/${workshopId}/workshop-visit-statuses/${id}`, payload);
  return data;
}
export async function deleteWorkshopVisitStatus(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/workshop-visit-statuses/${id}`);
}

export async function getWorkshopServiceStatuses(workshopId: string) {
  const { data } = await http.get<ServiceStatus[]>(`/workshops/${workshopId}/service-statuses`);
  return data;
}
export async function getWorkshopServiceStatusById(workshopId: string, id: string) {
  const { data } = await http.get<ServiceStatus>(`/workshops/${workshopId}/service-statuses/${id}`);
  return data;
}
export async function createWorkshopServiceStatus(workshopId: string, payload: CreateServiceStatusPayload) {
  const { data } = await http.post<ServiceStatus>(`/workshops/${workshopId}/service-statuses`, payload);
  return data;
}
export async function updateWorkshopServiceStatus(workshopId: string, id: string, payload: UpdateServiceStatusPayload) {
  const { data } = await http.patch<ServiceStatus>(`/workshops/${workshopId}/service-statuses/${id}`, payload);
  return data;
}
export async function deleteWorkshopServiceStatus(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/service-statuses/${id}`);
}

export async function getWorkshopParts(workshopId: string, filters?: WorkshopPartListFilters) {
  const { data } = await http.get<WorkshopPartCatalog[]>(`/workshops/${workshopId}/parts`, {
    params: filters,
  });
  return data;
}
export async function getWorkshopPartById(workshopId: string, partId: string) {
  const { data } = await http.get<WorkshopPartCatalog>(`/workshops/${workshopId}/parts/${partId}`);
  return data;
}
export async function createWorkshopPart(workshopId: string, payload: CreateWorkshopPartPayload) {
  const { data } = await http.post<WorkshopPartCatalog>(`/workshops/${workshopId}/parts`, payload);
  return data;
}
export async function updateWorkshopPart(workshopId: string, partId: string, payload: UpdateWorkshopPartPayload) {
  const { data } = await http.patch<WorkshopPartCatalog>(`/workshops/${workshopId}/parts/${partId}`, payload);
  return data;
}

export async function getWorkshopServices(workshopId: string) {
  const { data } = await http.get<WorkshopServiceCatalog[]>(`/workshops/${workshopId}/workshop-services`);
  return data;
}
export async function getWorkshopServiceById(workshopId: string, id: string) {
  const { data } = await http.get<WorkshopServiceCatalog>(`/workshops/${workshopId}/workshop-services/${id}`);
  return data;
}
export async function createWorkshopService(workshopId: string, payload: CreateWorkshopServicePayload) {
  const { data } = await http.post<WorkshopServiceCatalog>(`/workshops/${workshopId}/workshop-services`, payload);
  return data;
}
export async function updateWorkshopService(workshopId: string, id: string, payload: UpdateWorkshopServicePayload) {
  const { data } = await http.patch<WorkshopServiceCatalog>(`/workshops/${workshopId}/workshop-services/${id}`, payload);
  return data;
}
export async function deleteWorkshopService(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/workshop-services/${id}`);
}

export async function getTunings(workshopId: string) {
  const { data } = await http.get<Tuning[]>(`/workshops/${workshopId}/tunings`);
  return data;
}
export async function getTuningById(workshopId: string, id: string) {
  const { data } = await http.get<Tuning>(`/workshops/${workshopId}/tunings/${id}`);
  return data;
}
export async function createTuning(workshopId: string, payload: CreateTuningPayload) {
  const { data } = await http.post<Tuning>(`/workshops/${workshopId}/tunings`, payload);
  return data;
}
export async function updateTuning(workshopId: string, id: string, payload: UpdateTuningPayload) {
  const { data } = await http.patch<Tuning>(`/workshops/${workshopId}/tunings/${id}`, payload);
  return data;
}
export async function deleteTuning(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/tunings/${id}`);
}

export async function getStringGauges(workshopId: string) {
  const { data } = await http.get<StringGauge[]>(`/workshops/${workshopId}/string-gauges`);
  return data;
}
export async function getStringGaugeById(workshopId: string, id: string) {
  const { data } = await http.get<StringGauge>(`/workshops/${workshopId}/string-gauges/${id}`);
  return data;
}
export async function createStringGauge(workshopId: string, payload: CreateStringGaugePayload) {
  const { data } = await http.post<StringGauge>(`/workshops/${workshopId}/string-gauges`, payload);
  return data;
}
export async function updateStringGauge(workshopId: string, id: string, payload: UpdateStringGaugePayload) {
  const { data } = await http.patch<StringGauge>(`/workshops/${workshopId}/string-gauges/${id}`, payload);
  return data;
}
export async function deleteStringGauge(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/string-gauges/${id}`);
}

export async function getAffiliates(workshopId: string) {
  const { data } = await http.get<Affiliate[]>(`/workshops/${workshopId}/affiliates`);
  return data;
}
export async function getAffiliateById(workshopId: string, id: string) {
  const { data } = await http.get<Affiliate>(`/workshops/${workshopId}/affiliates/${id}`);
  return data;
}
export async function createAffiliate(workshopId: string, payload: CreateAffiliatePayload) {
  const { data } = await http.post<Affiliate>(`/workshops/${workshopId}/affiliates`, payload);
  return data;
}
export async function updateAffiliate(workshopId: string, id: string, payload: UpdateAffiliatePayload) {
  const { data } = await http.patch<Affiliate>(`/workshops/${workshopId}/affiliates/${id}`, payload);
  return data;
}
export async function deleteAffiliate(workshopId: string, id: string) {
  await http.delete(`/workshops/${workshopId}/affiliates/${id}`);
}

export async function updateUserProfileImage(userId: string, payload: UpdateUserProfileImagePayload) {
  const { data } = await http.patch<UserProfileImage>(`/users/${userId}/profile-image`, payload);
  return data;
}

export async function getWorkshopUsers(workshopId: string, params?: WorkshopUsersListParams) {
  const { data } = await http.get<WorkshopUsersListResponse>(`/workshops/${workshopId}/users`, {
    params,
  });
  return data;
}
export async function getWorkshopUserById(workshopId: string, userId: string) {
  const { data } = await http.get<WorkshopUser>(`/workshops/${workshopId}/users/${userId}`);
  return data;
}
export async function createWorkshopUser(workshopId: string, payload: CreateWorkshopUserPayload) {
  const { data } = await http.post<WorkshopUser>(`/workshops/${workshopId}/users`, payload);
  return data;
}
export async function updateWorkshopUser(workshopId: string, userId: string, payload: UpdateWorkshopUserPayload) {
  const { data } = await http.patch<WorkshopUser>(`/workshops/${workshopId}/users/${userId}`, payload);
  return data;
}
