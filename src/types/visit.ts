export type VisitStatus = 'RECEIVED' | 'IN_PROGRESS' | 'PAUSED' | 'READY' | 'DELIVERED';

export type VisitCard = {
  id: string;
  folio: string;
  clientName: string;
  instrumentName: string;
  status: VisitStatus;
  total: number;
  createdAt: string;
  branchName: string;
};

export type VisitDetail = VisitCard & {
  diagnosis?: string;
  intakeNotes?: string;
  internalNotes?: string;
  services: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    status?: string;
    notes?: string;
  }>;
  timeline: Array<{
    id: string;
    type: string;
    createdAt: string;
    note?: string;
  }>;
};
