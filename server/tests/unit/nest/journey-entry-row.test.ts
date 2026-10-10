import { decodeEntryRow } from '../../../src/nest/journey/journey-entry-row';
import type { JourneyEntry } from '../../../src/types';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

const row = (over: Partial<JourneyEntry> = {}): JourneyEntry =>
  ({
    id: 5,
    journey_id: 1,
    author_id: 1,
    type: 'entry',
    entry_date: '2026-01-01',
    visibility: 'private',
    sort_order: 0,
    tags: null,
    pros_cons: null,
    stats_excluded: 0,
    dismissed: 0,
    is_draft: 1,
    ...over,
  }) as JourneyEntry;

describe('decodeEntryRow', () => {
  it('JENTRYROW-001: decodes the JSON columns and turns the flags into booleans', () => {
    const wire = decodeEntryRow(row({ tags: '["beach","food"]', pros_cons: '{"pros":["sun"],"cons":["crowds"]}' }));
    expect(wire.tags).toEqual(['beach', 'food']);
    expect(wire.pros_cons).toEqual({ pros: ['sun'], cons: ['crowds'] });
    expect(wire.stats_excluded).toBe(false);
    expect(wire.dismissed).toBe(false);
    expect(wire.is_draft).toBe(true);
  });

  it('JENTRYROW-002: empty columns are an empty tag list and no pros/cons', () => {
    const wire = decodeEntryRow(row());
    expect(wire.tags).toEqual([]);
    expect(wire.pros_cons).toBeNull();
    expect(logMock.logWarn).not.toHaveBeenCalled();
  });

  it('JENTRYROW-003: unreadable JSON no longer throws: it reads as empty and is logged', () => {
    const wire = decodeEntryRow(row({ tags: '{oops', pros_cons: 'not json' }));
    expect(wire.tags).toEqual([]);
    expect(wire.pros_cons).toBeNull();
    expect(logMock.logWarn).toHaveBeenCalledWith(
      '[json] journey_entries.tags (journey entry 5): stored value is not valid JSON, using the fallback',
    );
  });
});
