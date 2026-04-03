export type VisitStatusCatalog = {
  id: string;
  name: string;
  color?: string | null;
  slug?: string | null;
  isActive?: boolean;
};

export type VisitFilters = {
  search: string;
  statusId: string;
  createdByUserId: string;
  branchId: string;
  clientId: string;
  instrumentId: string;
  isActive: '' | 'true' | 'false';
  openedFrom: string;
  openedTo: string;
};

export type VisitResponse = {
  id: string;
  workshopId: string;
  clientId: string;
  instrumentId: string;
  branchId: string;
  folio: string;
  statusId?: string;
  status?: { id: string; name: string; color?: string | null } | null;
  openedAt?: string | null;
  closedAt?: string | null;
  dueDate?: string | null;
  intakeNotes?: string | null;
  diagnosis?: string | null;
  internalNotes?: string | null;
  customerComplaint?: string | null;
  subtotal?: number | null;
  discount?: number | null;
  total?: number | null;
  isActive?: boolean;
  wantsStringChange?: boolean;
  hasCase?: boolean;
  hasStrap?: boolean;
  desiredTuningId?: string | null;
  stringGaugeId?: string | null;
  branch?: { id: string; name: string } | null;
  client?: { id: string; fullName?: string; firstName?: string; lastName?: string; phone?: string } | null;
  instrument?: { id: string; name?: string; model?: string; colorName?: string } | null;
};

export type UpdateVisitPayload = Partial<{
  branchId: string;
  intakeNotes: string;
  diagnosis: string;
  internalNotes: string;
  customerComplaint: string;
  discount: number;
  wantsStringChange: boolean;
  hasCase: boolean;
  hasStrap: boolean;
  statusId: string;
  desiredTuningId: string;
  stringGaugeId: string;
}>;

export type VisitNote = {
  id: string;
  note: string;
  isInternal: boolean;
  createdAt?: string;
  updatedAt?: string;
  author?: { id: string; name?: string; email?: string; profileImageUrl?: string | null } | null;
  createdByUser?: { id?: string; name?: string; profileImageUrl?: string | null } | null;
};

export type NoteAttachment = {
  id: string;
  noteId?: string;
  mediaId?: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  publicUrl?: string;
  url?: string;
  createdAt?: string;
};

export type VisitService = {
  id: string;
  workshopServiceId?: string;
  name?: string;
  status?: string | { id?: string; name?: string };
  quantity?: number;
  price?: number;
  notes?: string;
  isAdjust?: boolean;
};

export type VisitServiceNote = {
  id: string;
  note: string;
  isInternal: boolean;
  createdAt?: string;
};

export type VisitTimelineEvent = {
  id?: string;
  eventType: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  occurredAt?: string;
  actor?: { id?: string; name?: string; profileImageUrl?: string | null } | null;
  service?: {
    id?: string;
    name?: string;
    status?: { id?: string; code?: string; name?: string; color?: string } | null;
  } | null;
  attachment?: NoteAttachment | null;
  metadata?: Record<string, unknown>;
};

export type TrackingLinkResponse = {
  token: string;
  publicUrl: string;
  expiresAt?: string;
};

export type TrackingResponse = {
  tracking?: {
    token?: string;
    isActive?: boolean;
    expiresAt?: string | null;
    lastAccessedAt?: string | null;
    url?: string;
  };
  workshop?: { id: string; name: string; logoUrl?: string | null; profileImageUrl?: string | null };
  client?: { id?: string; name?: string; displayName?: string; code?: string };
  instrument?: {
    id?: string;
    name?: string;
    nickname?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    brand?: { name?: string } | null;
    instrumentType?: { name?: string } | null;
  };
  branch?: { id: string; name?: string };
  status?: { id?: string; code?: string; name?: string; color?: string };
  visit?: VisitResponse;
  services?: Array<VisitService & {
    status?: string | { id?: string; code?: string; name?: string; color?: string };
    serviceNotes?: Array<VisitServiceNote & { attachments?: NoteAttachment[] }>;
    notes?: Array<VisitServiceNote & { attachments?: NoteAttachment[] }>;
  }>;
  trackingLinks?: TrackingLinkResponse[];
  timeline?: VisitTimelineEvent[];
};

export type InitAttachmentUploadV2Response = {
  attachmentId?: string;
  mediaId?: string;
  uploadUrl?: string;
  signedUrl?: string;
  attachment?: { id: string };
  upload?: { uploadUrl?: string; signedUrl?: string; url?: string };
  requiredHeaders?: Record<string, string>;
};

export type PrepareUploadResponse = {
  uploadUrl?: string;
  signedUrl?: string;
  attachment?: { id: string };
  upload?: { uploadUrl?: string; signedUrl?: string; url?: string };
  requiredHeaders?: Record<string, string>;
  attachmentId?: string;
};
