export type CatalogTimestampFields = {
  createdAt: string;
  updatedAt: string;
};

export type Color = CatalogTimestampFields & {
  id: string;
  workshopId: string | null;
  name: string;
  slug: string;
  hex: string | null;
  isActive: boolean;
  isGlobal: boolean;
};

export type Brand = CatalogTimestampFields & {
  id: string;
  workshopId: string | null;
  name: string;
  slug: string;
  isActive: boolean;
  isGlobal: boolean;
};

export type VisitStatus = CatalogTimestampFields & {
  id: string;
  workshopId: string;
  code: string;
  name: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
  isTerminal: boolean;
};

export type ServiceStatus = VisitStatus;

export type WorkshopPartCatalog = CatalogTimestampFields & {
  id: string;
  workshopId: string;
  name: string;
  listPrice: number;
  publicPrice: number;
  description?: string | null;
  sku?: string | null;
  brand?: string | null;
  isActive: boolean;
};

export type WorkshopServiceCatalog = CatalogTimestampFields & {
  id: string;
  workshopId: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice?: number | null;
  estimatedTime?: number | null;
  isActive: boolean;
  isAdjust: boolean;
};

export type WorkshopInstrumentType = CatalogTimestampFields & {
  id: string;
  workshopId: string;
  code: string;
  name: string;
  slug: string;
  family: string;
  isActive: boolean;
  isGlobal: boolean;
};

export type Tuning = CatalogTimestampFields & {
  id: string;
  workshopId: string;
  name: string;
  slug: string;
  notes?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
};

export type StringGauge = CatalogTimestampFields & {
  id: string;
  workshopId: string;
  name: string;
  slug: string;
  value?: string | null;
  instrumentFamily?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
};

export type AffiliateType = 'BAND' | 'BUSINESS';

export type Affiliate = CatalogTimestampFields & {
  id: string;
  workshopId: string;
  name: string;
  type: AffiliateType;
  code: string;
  notes?: string | null;
  isActive: boolean;
};

export type UserProfileImage = {
  id: string;
  profileImageUrl: string | null;
};

export type WorkshopUserRole = 'ADMIN' | 'STAFF';

export type WorkshopUser = CatalogTimestampFields & {
  id: string;
  name: string;
  email: string;
  role: WorkshopUserRole;
  workshopRole: string;
  profileImageUrl: string | null;
};

export type WorkshopUsersListParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: WorkshopUserRole;
};

export type WorkshopUsersListResponse = {
  items: WorkshopUser[];
  page: number;
  limit: number;
  total: number;
};

export type WorkshopPartListFilters = {
  isActive?: boolean;
};

export type CreateWorkshopColorPayload = {
  name: string;
  slug: string;
  hex?: string;
  isActive?: boolean;
};
export type CreateGlobalColorPayload = CreateWorkshopColorPayload & { isGlobal?: boolean };
export type UpdateColorPayload = Partial<CreateGlobalColorPayload>;

export type CreateWorkshopBrandPayload = {
  name: string;
  slug: string;
  isActive?: boolean;
};
export type CreateGlobalBrandPayload = CreateWorkshopBrandPayload & { isGlobal?: boolean };
export type UpdateBrandPayload = Partial<CreateGlobalBrandPayload>;

export type CreateVisitStatusPayload = {
  code: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  isTerminal?: boolean;
};
export type UpdateVisitStatusPayload = Partial<CreateVisitStatusPayload>;

export type CreateServiceStatusPayload = CreateVisitStatusPayload;
export type UpdateServiceStatusPayload = Partial<CreateServiceStatusPayload>;

export type CreateWorkshopPartPayload = {
  name: string;
  listPrice: number;
  publicPrice: number;
  description?: string;
  sku?: string;
  brand?: string;
  isActive?: boolean;
};
export type UpdateWorkshopPartPayload = Partial<CreateWorkshopPartPayload>;

export type CreateWorkshopServicePayload = {
  name: string;
  slug: string;
  description?: string;
  basePrice?: number;
  estimatedTime?: number;
  isActive?: boolean;
  isAdjust?: boolean;
};
export type UpdateWorkshopServicePayload = Partial<CreateWorkshopServicePayload>;

export type CreateWorkshopInstrumentTypePayload = {
  code: string;
  name: string;
  slug: string;
  family: string;
  isActive?: boolean;
};
export type UpdateWorkshopInstrumentTypePayload = Partial<CreateWorkshopInstrumentTypePayload>;

export type CreateTuningPayload = {
  name: string;
  slug: string;
  notes?: string;
  sortOrder?: number;
  isActive?: boolean;
};
export type UpdateTuningPayload = Partial<CreateTuningPayload>;

export type CreateStringGaugePayload = {
  name: string;
  slug: string;
  value?: string;
  instrumentFamily?: string;
  sortOrder?: number;
  isActive?: boolean;
};
export type UpdateStringGaugePayload = Partial<CreateStringGaugePayload>;

export type CreateAffiliatePayload = {
  name: string;
  type: AffiliateType;
  code: string;
  notes?: string;
  isActive?: boolean;
};
export type UpdateAffiliatePayload = Partial<CreateAffiliatePayload>;

export type UpdateUserProfileImagePayload = {
  mediaId: string;
};

export type CreateWorkshopUserPayload = {
  name: string;
  email: string;
  password: string;
  role: WorkshopUserRole;
};

export type UpdateWorkshopUserPayload = Partial<CreateWorkshopUserPayload>;
