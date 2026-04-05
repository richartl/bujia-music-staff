const toPartFilterKey = (isActive?: boolean) => {
  if (isActive === true) return 'active';
  if (isActive === false) return 'inactive';
  return 'all';
};

export const catalogsQueryKeys = {
  colors: {
    workshopBase: (workshopId: string) => ['catalogs', 'colors', 'workshop', workshopId] as const,
    workshopList: (workshopId: string) => ['catalogs', 'colors', 'workshop', workshopId, 'list'] as const,
    workshopDetail: (workshopId: string, id: string) => ['catalogs', 'colors', 'workshop', workshopId, 'detail', id] as const,
    globalBase: () => ['catalogs', 'colors', 'global'] as const,
    globalList: () => ['catalogs', 'colors', 'global', 'list'] as const,
    globalDetail: (id: string) => ['catalogs', 'colors', 'global', 'detail', id] as const,
  },
  brands: {
    workshopBase: (workshopId: string) => ['catalogs', 'brands', 'workshop', workshopId] as const,
    workshopList: (workshopId: string) => ['catalogs', 'brands', 'workshop', workshopId, 'list'] as const,
    workshopDetail: (workshopId: string, id: string) => ['catalogs', 'brands', 'workshop', workshopId, 'detail', id] as const,
    globalBase: () => ['catalogs', 'brands', 'global'] as const,
    globalList: () => ['catalogs', 'brands', 'global', 'list'] as const,
    globalDetail: (id: string) => ['catalogs', 'brands', 'global', 'detail', id] as const,
  },
  visitStatuses: {
    base: (workshopId: string) => ['catalogs', 'visit-statuses', workshopId] as const,
    list: (workshopId: string) => ['catalogs', 'visit-statuses', workshopId, 'list'] as const,
    detail: (workshopId: string, id: string) => ['catalogs', 'visit-statuses', workshopId, 'detail', id] as const,
  },
  serviceStatuses: {
    base: (workshopId: string) => ['catalogs', 'service-statuses', workshopId] as const,
    list: (workshopId: string) => ['catalogs', 'service-statuses', workshopId, 'list'] as const,
    detail: (workshopId: string, id: string) => ['catalogs', 'service-statuses', workshopId, 'detail', id] as const,
  },
  workshopParts: {
    base: (workshopId: string) => ['catalogs', 'workshop-parts', workshopId] as const,
    list: (workshopId: string, isActive?: boolean) =>
      ['catalogs', 'workshop-parts', workshopId, 'list', toPartFilterKey(isActive)] as const,
    detail: (workshopId: string, id: string) => ['catalogs', 'workshop-parts', workshopId, 'detail', id] as const,
  },
  workshopServices: {
    base: (workshopId: string) => ['catalogs', 'workshop-services', workshopId] as const,
    list: (workshopId: string) => ['catalogs', 'workshop-services', workshopId, 'list'] as const,
    detail: (workshopId: string, id: string) => ['catalogs', 'workshop-services', workshopId, 'detail', id] as const,
  },
  tunings: {
    base: (workshopId: string) => ['catalogs', 'tunings', workshopId] as const,
    list: (workshopId: string) => ['catalogs', 'tunings', workshopId, 'list'] as const,
    detail: (workshopId: string, id: string) => ['catalogs', 'tunings', workshopId, 'detail', id] as const,
  },
  stringGauges: {
    base: (workshopId: string) => ['catalogs', 'string-gauges', workshopId] as const,
    list: (workshopId: string) => ['catalogs', 'string-gauges', workshopId, 'list'] as const,
    detail: (workshopId: string, id: string) => ['catalogs', 'string-gauges', workshopId, 'detail', id] as const,
  },
  affiliates: {
    base: (workshopId: string) => ['catalogs', 'affiliates', workshopId] as const,
    list: (workshopId: string) => ['catalogs', 'affiliates', workshopId, 'list'] as const,
    detail: (workshopId: string, id: string) => ['catalogs', 'affiliates', workshopId, 'detail', id] as const,
  },
  users: {
    profileImage: (userId: string) => ['catalogs', 'users', userId, 'profile-image'] as const,
  },
} as const;
