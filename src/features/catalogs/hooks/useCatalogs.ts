import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as catalogsApi from '@/features/catalogs/api/catalogsApi';
import { catalogsQueryKeys } from '@/features/catalogs/queryKeys';
import type {
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
  CreateWorkshopUserPayload,
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
  WorkshopUsersListParams,
} from '@/features/catalogs/types/catalogs';

function invalidateWorkshopPartsLists(queryClient: ReturnType<typeof useQueryClient>, workshopId: string) {
  queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopParts.list(workshopId, undefined) });
  queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopParts.list(workshopId, true) });
  queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopParts.list(workshopId, false) });
}

export function useWorkshopColors(workshopId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.colors.workshopList(workshopId || ''),
    queryFn: () => catalogsApi.getWorkshopColors(workshopId!),
    enabled: !!workshopId,
  });
}
export function useWorkshopColor(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.colors.workshopDetail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getWorkshopColorById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateWorkshopColor(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkshopColorPayload) => catalogsApi.createWorkshopColor(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.workshopList(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.workshopDetail(workshopId!, created.id) });
    },
  });
}
export function useUpdateWorkshopColor(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateColorPayload }) => catalogsApi.updateWorkshopColor(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.workshopList(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.workshopDetail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteWorkshopColor(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteWorkshopColor(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.workshopList(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.workshopDetail(workshopId!, vars.id) });
    },
  });
}

export function useGlobalColors() {
  return useQuery({
    queryKey: catalogsQueryKeys.colors.globalList(),
    queryFn: catalogsApi.getGlobalColors,
  });
}
export function useGlobalColor(id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.colors.globalDetail(id || ''),
    queryFn: () => catalogsApi.getGlobalColorById(id!),
    enabled: !!id,
  });
}
export function useCreateGlobalColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGlobalColorPayload) => catalogsApi.createGlobalColor(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.globalList() });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.globalDetail(created.id) });
    },
  });
}
export function useUpdateGlobalColor(id?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateColorPayload) => catalogsApi.updateGlobalColor(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.globalList() });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.globalDetail(id!) });
    },
  });
}
export function useDeleteGlobalColor(id?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => catalogsApi.deleteGlobalColor(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.globalList() });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.colors.globalDetail(id!) });
    },
  });
}

export function useWorkshopBrands(workshopId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.brands.workshopList(workshopId || ''),
    queryFn: () => catalogsApi.getWorkshopBrands(workshopId!),
    enabled: !!workshopId,
  });
}
export function useWorkshopBrand(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.brands.workshopDetail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getWorkshopBrandById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateWorkshopBrand(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkshopBrandPayload) => catalogsApi.createWorkshopBrand(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.workshopList(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.workshopDetail(workshopId!, created.id) });
    },
  });
}
export function useUpdateWorkshopBrand(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBrandPayload }) => catalogsApi.updateWorkshopBrand(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.workshopList(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.workshopDetail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteWorkshopBrand(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteWorkshopBrand(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.workshopList(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.workshopDetail(workshopId!, vars.id) });
    },
  });
}

export function useGlobalBrands() {
  return useQuery({ queryKey: catalogsQueryKeys.brands.globalList(), queryFn: catalogsApi.getGlobalBrands });
}
export function useGlobalBrand(id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.brands.globalDetail(id || ''),
    queryFn: () => catalogsApi.getGlobalBrandById(id!),
    enabled: !!id,
  });
}
export function useCreateGlobalBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGlobalBrandPayload) => catalogsApi.createGlobalBrand(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.globalList() });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.globalDetail(created.id) });
    },
  });
}
export function useUpdateGlobalBrand(id?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBrandPayload) => catalogsApi.updateGlobalBrand(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.globalList() });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.globalDetail(id!) });
    },
  });
}
export function useDeleteGlobalBrand(id?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => catalogsApi.deleteGlobalBrand(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.globalList() });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.brands.globalDetail(id!) });
    },
  });
}

export function useWorkshopVisitStatuses(workshopId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.visitStatuses.list(workshopId || ''),
    queryFn: () => catalogsApi.getWorkshopVisitStatuses(workshopId!),
    enabled: !!workshopId,
  });
}
export function useWorkshopVisitStatus(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.visitStatuses.detail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getWorkshopVisitStatusById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateWorkshopVisitStatus(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVisitStatusPayload) => catalogsApi.createWorkshopVisitStatus(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.visitStatuses.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.visitStatuses.detail(workshopId!, created.id) });
    },
  });
}
export function useUpdateWorkshopVisitStatus(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVisitStatusPayload }) => catalogsApi.updateWorkshopVisitStatus(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.visitStatuses.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.visitStatuses.detail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteWorkshopVisitStatus(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteWorkshopVisitStatus(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.visitStatuses.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.visitStatuses.detail(workshopId!, vars.id) });
    },
  });
}

export function useWorkshopServiceStatuses(workshopId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.serviceStatuses.list(workshopId || ''),
    queryFn: () => catalogsApi.getWorkshopServiceStatuses(workshopId!),
    enabled: !!workshopId,
  });
}
export function useWorkshopServiceStatus(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.serviceStatuses.detail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getWorkshopServiceStatusById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateWorkshopServiceStatus(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateServiceStatusPayload) => catalogsApi.createWorkshopServiceStatus(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.serviceStatuses.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.serviceStatuses.detail(workshopId!, created.id) });
    },
  });
}
export function useUpdateWorkshopServiceStatus(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceStatusPayload }) => catalogsApi.updateWorkshopServiceStatus(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.serviceStatuses.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.serviceStatuses.detail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteWorkshopServiceStatus(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteWorkshopServiceStatus(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.serviceStatuses.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.serviceStatuses.detail(workshopId!, vars.id) });
    },
  });
}

export function useWorkshopParts(workshopId?: string | null, isActive?: boolean) {
  return useQuery({
    queryKey: catalogsQueryKeys.workshopParts.list(workshopId || '', isActive),
    queryFn: () => catalogsApi.getWorkshopParts(workshopId!, isActive === undefined ? undefined : { isActive }),
    enabled: !!workshopId,
  });
}
export function useWorkshopPart(workshopId?: string | null, partId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.workshopParts.detail(workshopId || '', partId || ''),
    queryFn: () => catalogsApi.getWorkshopPartById(workshopId!, partId!),
    enabled: !!workshopId && !!partId,
  });
}
export function useCreateWorkshopPart(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkshopPartPayload) => catalogsApi.createWorkshopPart(workshopId!, payload),
    onSuccess: (created) => {
      invalidateWorkshopPartsLists(queryClient, workshopId!);
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopParts.detail(workshopId!, created.id) });
    },
  });
}
export function useUpdateWorkshopPart(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partId, payload }: { partId: string; payload: UpdateWorkshopPartPayload }) => catalogsApi.updateWorkshopPart(workshopId!, partId, payload),
    onSuccess: (_data, vars) => {
      invalidateWorkshopPartsLists(queryClient, workshopId!);
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopParts.detail(workshopId!, vars.partId) });
    },
  });
}

export function useWorkshopServices(workshopId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.workshopServices.list(workshopId || ''),
    queryFn: () => catalogsApi.getWorkshopServices(workshopId!),
    enabled: !!workshopId,
  });
}
export function useWorkshopService(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.workshopServices.detail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getWorkshopServiceById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateWorkshopService(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkshopServicePayload) => catalogsApi.createWorkshopService(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopServices.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopServices.detail(workshopId!, created.id) });
    },
  });
}
export function useUpdateWorkshopService(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWorkshopServicePayload }) => catalogsApi.updateWorkshopService(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopServices.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopServices.detail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteWorkshopService(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteWorkshopService(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopServices.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.workshopServices.detail(workshopId!, vars.id) });
    },
  });
}

export function useTunings(workshopId?: string | null) {
  return useQuery({ queryKey: catalogsQueryKeys.tunings.list(workshopId || ''), queryFn: () => catalogsApi.getTunings(workshopId!), enabled: !!workshopId });
}
export function useTuning(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.tunings.detail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getTuningById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateTuning(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTuningPayload) => catalogsApi.createTuning(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.tunings.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.tunings.detail(workshopId!, created.id) });
    },
  });
}
export function useUpdateTuning(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTuningPayload }) => catalogsApi.updateTuning(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.tunings.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.tunings.detail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteTuning(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteTuning(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.tunings.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.tunings.detail(workshopId!, vars.id) });
    },
  });
}

export function useStringGauges(workshopId?: string | null) {
  return useQuery({ queryKey: catalogsQueryKeys.stringGauges.list(workshopId || ''), queryFn: () => catalogsApi.getStringGauges(workshopId!), enabled: !!workshopId });
}
export function useStringGauge(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.stringGauges.detail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getStringGaugeById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateStringGauge(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStringGaugePayload) => catalogsApi.createStringGauge(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.stringGauges.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.stringGauges.detail(workshopId!, created.id) });
    },
  });
}
export function useUpdateStringGauge(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStringGaugePayload }) => catalogsApi.updateStringGauge(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.stringGauges.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.stringGauges.detail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteStringGauge(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteStringGauge(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.stringGauges.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.stringGauges.detail(workshopId!, vars.id) });
    },
  });
}

export function useAffiliates(workshopId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.affiliates.list(workshopId || ''),
    queryFn: () => catalogsApi.getAffiliates(workshopId!),
    enabled: !!workshopId,
  });
}
export function useAffiliate(workshopId?: string | null, id?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.affiliates.detail(workshopId || '', id || ''),
    queryFn: () => catalogsApi.getAffiliateById(workshopId!, id!),
    enabled: !!workshopId && !!id,
  });
}
export function useCreateAffiliate(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAffiliatePayload) => catalogsApi.createAffiliate(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.affiliates.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.affiliates.detail(workshopId!, created.id) });
    },
  });
}
export function useUpdateAffiliate(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAffiliatePayload }) => catalogsApi.updateAffiliate(workshopId!, id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.affiliates.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.affiliates.detail(workshopId!, vars.id) });
    },
  });
}
export function useDeleteAffiliate(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => catalogsApi.deleteAffiliate(workshopId!, id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.affiliates.list(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.affiliates.detail(workshopId!, vars.id) });
    },
  });
}

export function useWorkshopUsers(workshopId?: string | null, params?: WorkshopUsersListParams) {
  return useQuery({
    queryKey: catalogsQueryKeys.users.workshopList(workshopId || '', params),
    queryFn: () => catalogsApi.getWorkshopUsers(workshopId!, params),
    enabled: !!workshopId,
  });
}
export function useWorkshopUser(workshopId?: string | null, userId?: string | null) {
  return useQuery({
    queryKey: catalogsQueryKeys.users.workshopDetail(workshopId || '', userId || ''),
    queryFn: () => catalogsApi.getWorkshopUserById(workshopId!, userId!),
    enabled: !!workshopId && !!userId,
  });
}
export function useCreateWorkshopUser(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkshopUserPayload) => catalogsApi.createWorkshopUser(workshopId!, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.users.workshopBase(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.users.workshopDetail(workshopId!, created.id) });
    },
  });
}
export function useUpdateWorkshopUser(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateWorkshopUserPayload }) => catalogsApi.updateWorkshopUser(workshopId!, userId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.users.workshopBase(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.users.workshopDetail(workshopId!, vars.userId) });
    },
  });
}
export function useDeleteWorkshopUser(workshopId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => catalogsApi.deleteWorkshopUser(workshopId!, userId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.users.workshopBase(workshopId!) });
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.users.workshopDetail(workshopId!, vars.userId) });
    },
  });
}

export function useUpdateUserProfileImage(userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserProfileImagePayload) => catalogsApi.updateUserProfileImage(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogsQueryKeys.users.profileImage(userId!) });
    },
  });
}
