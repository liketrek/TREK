/**
 * WAN-02: the pure half of the wanderer watch: what a look at a trail's record
 * says about a snapshot, when a hint is new, and how long a failing instance
 * is left alone.
 */
import type { WatchedSourceRow } from '../../../src/db/repositories/TourSourceHints.repository';
import { contentHashOf, recordChangedParts } from '../../../src/nest/tours/tours.helpers';
import {
  backoffMs,
  isNewHint,
  verdictOf,
  WATCH_BACKOFF_BASE_MS,
  WATCH_BACKOFF_MAX_MS,
} from '../../../src/nest/tours/wanderer-watch.helpers';

import { describe, expect, it } from 'vitest';

const ROUTE: [number, number][] = [
  [47.45, 11.1],
  [47.46, 11.11],
];
const HASH = contentHashOf('Ridge', 'Up the ridge', ROUTE);

function source(over: Partial<WatchedSourceRow> = {}): WatchedSourceRow {
  return {
    place_id: 3,
    external_id: 'trail1',
    content_hash: HASH,
    external_updated: '2026-10-01 10:00:00.000Z',
    seen_hash: null,
    seen_updated: null,
    state: null,
    ...over,
  };
}

const record = (over: Partial<{ name: string; description: string | null; updated: string | null }> = {}) => ({
  kind: 'record' as const,
  name: 'Ridge',
  description: 'Up the ridge',
  updated: '2026-10-01 10:00:00.000Z',
  ...over,
});

describe('recordChangedParts', () => {
  it('WWH-001: names the texts a record proves different, never the route', () => {
    expect(recordChangedParts(HASH, ' Ridge ', 'Up the ridge')).toEqual([]);
    expect(recordChangedParts(HASH, 'Ridge (new)', null)).toEqual(['name', 'description']);
    expect(recordChangedParts(contentHashOf('Ridge', null, ROUTE), 'Ridge', '')).toEqual([]);
  });
});

describe('verdictOf', () => {
  it('WWH-002: the same texts and change time say nothing, least of all unchanged', () => {
    expect(verdictOf(source(), record())).toEqual({ state: null, changes: [], reason: null });
    expect(verdictOf(source(), record({ updated: '2026-10-01T10:00:00Z' }))).toEqual({
      state: null,
      changes: [],
      reason: null,
    });
  });

  it('WWH-003: a moved change time is only a possible change', () => {
    expect(verdictOf(source(), record({ updated: '2026-10-14 08:00:00.000Z' }))).toEqual({
      state: 'possible_change',
      changes: [],
      reason: null,
    });
  });

  it('WWH-004: a different name or description is a proven change', () => {
    expect(verdictOf(source(), record({ name: 'Ridge (new)', updated: '2026-10-14' }))).toEqual({
      state: 'changed',
      changes: ['name'],
      reason: null,
    });
  });

  it('WWH-005: a trail that is gone, or a change time missing on either side, cannot be judged', () => {
    const unavailable = { state: 'unverifiable', changes: [], reason: 'unavailable' };
    expect(verdictOf(source(), { kind: 'gone' })).toEqual(unavailable);
    expect(verdictOf(source(), undefined)).toEqual(unavailable);
    const noTime = { state: 'unverifiable', changes: [], reason: 'no_change_time' };
    expect(verdictOf(source({ external_updated: null }), record())).toEqual(noTime);
    expect(verdictOf(source(), record({ updated: null }))).toEqual(noTime);
    expect(verdictOf(source(), record({ updated: 'not a date' }))).toMatchObject({ state: 'possible_change' });
  });

  it('WWH-006: after a manual check the look compares with what the user saw there', () => {
    const seen = source({
      seen_hash: contentHashOf('Ridge (new)', 'Up the ridge', ROUTE),
      seen_updated: '2026-10-14 08:00:00.000Z',
    });
    expect(verdictOf(seen, record({ name: 'Ridge (new)', updated: '2026-10-14 08:00:00.000Z' }))).toEqual({
      state: null,
      changes: [],
      reason: null,
    });
    expect(verdictOf(seen, record({ name: 'Ridge (new)', updated: '2026-10-20 08:00:00.000Z' }))).toMatchObject({
      state: 'possible_change',
    });
    expect(verdictOf(source({ seen_hash: HASH, seen_updated: null }), record())).toMatchObject({
      reason: 'no_change_time',
    });
  });
});

describe('isNewHint and backoffMs', () => {
  it('WWH-007: a hint is new when there is something to say that the last look did not say', () => {
    const possible = { state: 'possible_change' as const, changes: [], reason: null };
    expect(isNewHint(source(), possible)).toBe(true);
    expect(isNewHint(source({ state: 'possible_change' }), possible)).toBe(false);
    expect(isNewHint(source({ state: 'possible_change' }), { ...possible, state: 'changed' })).toBe(true);
    expect(isNewHint(source({ state: 'changed' }), { state: null, changes: [], reason: null })).toBe(false);
  });

  it('WWH-008: each failure in a row doubles the wait, up to its ceiling', () => {
    expect(backoffMs(1)).toBe(WATCH_BACKOFF_BASE_MS);
    expect(backoffMs(2)).toBe(2 * WATCH_BACKOFF_BASE_MS);
    expect(backoffMs(4)).toBe(8 * WATCH_BACKOFF_BASE_MS);
    expect(backoffMs(30)).toBe(WATCH_BACKOFF_MAX_MS);
    expect(backoffMs(0)).toBe(WATCH_BACKOFF_BASE_MS);
  });
});
