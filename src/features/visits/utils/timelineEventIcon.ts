export function normalizeTimelineEventType(eventType?: string | null) {
  return String(eventType || '').trim().toUpperCase();
}

export function getTimelineEventIcon(eventType?: string | null) {
  const normalized = normalizeTimelineEventType(eventType);

  if (normalized === 'VISIT_CREATED') return '📥';
  if (normalized === 'SERVICE_CREATED' || normalized === 'SERVICE_UPDATED') return '🔧';
  if (normalized === 'SERVICE_STATUS_CHANGED') return '🔄';
  if (normalized === 'PAYMENT_ADDED' || normalized === 'PAYMENT_UPDATED') return '💵';
  if (normalized === 'PAYMENT_DELETED') return '🗑️';
  if (normalized === 'NOTE_ADDED' || normalized.includes('NOTA')) return '📝';
  if (normalized === 'ATTACHMENT_ADDED') return '📷';

  if (normalized.includes('PAYMENT')) return '💵';
  if (normalized.includes('SERVICE')) return '🔧';
  if (normalized.includes('STATUS')) return '🔄';

  return '📌';
}

export function getTimelineEventTone(eventType?: string | null) {
  const normalized = normalizeTimelineEventType(eventType);

  if (normalized.includes('PAYMENT')) {
    return 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-lime-50';
  }
  if (normalized.includes('INTERNA')) {
    return 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50';
  }
  if (normalized.includes('SERVICE')) {
    return 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50';
  }

  return 'border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100';
}
