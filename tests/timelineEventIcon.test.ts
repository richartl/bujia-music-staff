import { describe, expect, it } from 'vitest';
import { getTimelineEventIcon } from '../src/features/visits/utils/timelineEventIcon';

describe('getTimelineEventIcon', () => {
  it('mapea tipos conocidos', () => {
    expect(getTimelineEventIcon('VISIT_CREATED')).toBe('📥');
    expect(getTimelineEventIcon('SERVICE_CREATED')).toBe('🔧');
    expect(getTimelineEventIcon('SERVICE_STATUS_CHANGED')).toBe('🔄');
    expect(getTimelineEventIcon('PAYMENT_ADDED')).toBe('💵');
    expect(getTimelineEventIcon('PAYMENT_DELETED')).toBe('🗑️');
    expect(getTimelineEventIcon('NOTE_ADDED')).toBe('📝');
    expect(getTimelineEventIcon('ATTACHMENT_ADDED')).toBe('📷');
  });

  it('usa fallback para desconocidos o vacíos', () => {
    expect(getTimelineEventIcon('ANYTHING_ELSE')).toBe('📌');
    expect(getTimelineEventIcon(undefined)).toBe('📌');
    expect(getTimelineEventIcon(null)).toBe('📌');
  });
});
