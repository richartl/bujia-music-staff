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
  isActive?: boolean;
};

export type IntakeLookups = {
  brands: LookupOption[];
  colors: LookupOption[];
  instrumentTypes: LookupOption[];
  services: WorkshopServiceLookup[];
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
    phone: string;
    email?: string;
  };
  instrumentId?: string;
  instrument?: {
    instrumentTypeId?: string;
    brandId?: string;
    colorId?: string;
    model?: string;
    stringsCount?: number | null;
    serialNumber?: string;
    notes?: string;
  };
  visit: {
    intakeNotes: string;
    diagnosis?: string;
    receivedAt?: string;
  };
  services: Array<{
    workshopServiceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
    isManual?: boolean;
  }>;
};
