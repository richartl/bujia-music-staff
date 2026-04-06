import type { VisitFilters, VisitStatusCatalog } from '../api/types';

const TERMINAL_WORDS = ['termin', 'entreg', 'cancel', 'closed', 'done', 'finish', 'final'];

function normalizeText(value?: string | null) {
  return String(value || '').toLowerCase();
}

export function isTerminalVisitStatus(status?: Pick<VisitStatusCatalog, 'name' | 'slug'> & { code?: string } | null) {
  if (!status) return false;
  const haystack = [status.name, status.slug, status.code].map(normalizeText).join(' ');
  return TERMINAL_WORDS.some((keyword) => haystack.includes(keyword));
}

export function normalizeVisitFilters(filters: VisitFilters, statuses: VisitStatusCatalog[] = []): VisitFilters {
  const next = { ...filters };
  const selectedStatus = statuses.find((status) => status.id === next.statusId);

  if (selectedStatus && isTerminalVisitStatus(selectedStatus) && next.isActive === 'true') {
    next.isActive = '';
  }

  return next;
}
