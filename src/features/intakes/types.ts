export type LookupOption = {
  id: string;
  name: string;
  slug?: string;
};

export type WorkshopServiceLookup = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  basePrice?: number | null;
  estimatedTime?: number | null;
  isAdjust?: boolean;
  isActive?: boolean;
};

export type StringGaugeLookup = LookupOption & {
  value?: string | null;
  instrumentFamily?: string | null;
};

export type IntakeLookups = {
  branches: LookupOption[];
  brands: LookupOption[];
  colors: LookupOption[];
  instrumentTypes: LookupOption[];
  services: WorkshopServiceLookup[];
  tunings: LookupOption[];
  stringGauges: StringGaugeLookup[];
  visitStatuses?: LookupOption[];
  serviceStatuses?: LookupOption[];
};

export type ClientInstrument = {
  id: string;
  name: string;
  brandName?: string;
  model?: string;
  colorName?: string;
  typeName?: string;
  stringsCount?: number | null;
  serialNumber?: string | null;
  notes?: string | null;
};

export type IntakeServiceLine = {
  id: string;
  source: 'CATALOG' | 'MANUAL';
  catalogServiceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

export type CreateIntakePayload = {
  clientId?: string;
  client?: {
    firstName: string;
    lastName?: string;
    alias?: string;
    phone: string;
    email?: string;
    notes?: string;
  };
  instrumentId?: string;
  instrument?: {
    instrumentTypeId: string;
    brandId?: string;
    colorId?: string;
    model?: string;
    numberOfStrings?: number | null;
    serialNumber?: string;
    observations?: string;
  };
  visit: {
    branchId: string;
    intakeNotes?: string;
    diagnosis?: string;
    wantsStringChange?: boolean;
    desiredTuningId?: string;
    stringGaugeId?: string;
    discount?: number;
  };
  initialNote?: {
    note?: string;
    isInternal?: boolean;
  };
  services: Array<{
    workshopServiceId?: string;
    serviceCatalogId?: string;
    name?: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
};
