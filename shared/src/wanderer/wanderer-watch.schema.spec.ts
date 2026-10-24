import {
  tourSourceHintResponseSchema,
  tourSourceHintSchema,
  wandererSourceHintItemSchema,
  wandererWatchRequestSchema,
  wandererWatchSchema,
} from './wanderer-watch.schema';

import { describe, expect, it } from 'vitest';

const hint = {
  state: 'possible_change',
  changes: [],
  reason: null,
  externalUpdated: '2026-10-14 08:00:00.000Z',
  checkedAt: '2026-10-20T10:00:00Z',
};

describe('wanderer watch contract (WAN-02)', () => {
  it('tells a possible change, a proven one and a source that could not be judged apart, and nothing else', () => {
    expect(tourSourceHintSchema.parse(hint)).toEqual(hint);
    expect(
      tourSourceHintSchema.safeParse({ ...hint, state: 'changed', changes: ['name', 'description'] }).success,
    ).toBe(true);
    expect(tourSourceHintSchema.safeParse({ ...hint, state: 'unverifiable', reason: 'no_change_time' }).success).toBe(
      true,
    );
    expect(tourSourceHintSchema.safeParse({ ...hint, state: 'unchanged' }).success).toBe(false);
    expect(tourSourceHintSchema.safeParse({ ...hint, changes: ['route'] }).success).toBe(false);
    expect(tourSourceHintSchema.safeParse({ ...hint, reason: 'gone' }).success).toBe(false);
  });

  it('answers a tour with its hint or with none', () => {
    expect(tourSourceHintResponseSchema.parse({ hint: null })).toEqual({ hint: null });
    expect(tourSourceHintResponseSchema.parse({ hint }).hint).toEqual(hint);
  });

  it('lists the hints with their tour and trip, beside the switch and how the last run went', () => {
    const item = { ...hint, placeId: 7, tripId: 3, tripTitle: 'Alps', tourName: 'Ridge' };
    expect(wandererSourceHintItemSchema.parse(item)).toEqual(item);
    expect(wandererSourceHintItemSchema.safeParse({ ...item, placeId: 0 }).success).toBe(false);
    const watch = { enabled: true, connected: true, lastRunAt: null, pausedUntil: null, blocked: false, hints: [item] };
    expect(wandererWatchSchema.parse(watch)).toEqual(watch);
  });

  it('switches with a plain flag', () => {
    expect(wandererWatchRequestSchema.parse({ enabled: true })).toEqual({ enabled: true });
    expect(wandererWatchRequestSchema.safeParse({ enabled: 'yes' }).success).toBe(false);
    expect(wandererWatchRequestSchema.safeParse({}).success).toBe(false);
  });
});
