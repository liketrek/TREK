// FE-JRN-OPENAT-001 to FE-JRN-OPENAT-005
import { describe, expect, it } from 'vitest';
import { journeyOpenAtEntryId } from './journeyOpenAt';

const entries = [
  { id: 3, entry_date: '2026-05-03' },
  { id: 1, entry_date: '2026-05-01' },
  { id: 2, entry_date: '2026-05-01' },
  { id: 5, entry_date: '2026-05-05' },
];

describe('journeyOpenAtEntryId', () => {
  it('FE-JRN-OPENAT-001: a running journey opens on the first entry of today', () => {
    expect(journeyOpenAtEntryId(entries, { today: '2026-05-03' })).toBe('3');
  });

  it('FE-JRN-OPENAT-002: a rest day lands on the last day written before it', () => {
    expect(journeyOpenAtEntryId(entries, { today: '2026-05-04' })).toBe('3');
  });

  it('FE-JRN-OPENAT-003: a journey that is over, or not begun, opens at its start', () => {
    expect(journeyOpenAtEntryId(entries, { today: '2026-06-01' })).toBeNull();
    expect(journeyOpenAtEntryId(entries, { today: '2026-04-01' })).toBeNull();
  });

  it('FE-JRN-OPENAT-004: newest-first opens on the latest day, also after the trip', () => {
    expect(journeyOpenAtEntryId(entries, { today: '2026-06-01', newestFirst: true })).toBe('5');
    expect(journeyOpenAtEntryId(entries, { today: '2026-05-03', newestFirst: true })).toBe('5');
  });

  it('FE-JRN-OPENAT-005: an empty journey has nothing to open on', () => {
    expect(journeyOpenAtEntryId([], { today: '2026-05-03', newestFirst: true })).toBeNull();
  });
});
