/**
 * MCP-T04: what taking back a saved step does and whether it may, worked out
 * without writing: the standing of a step, the reasons taking it back would
 * lose something, and the tour now set against the tour it restores.
 */
import type { TourChangeStepBefore } from '../../../src/db/json-columns';
import type { StationDone } from '../../../src/nest/tours/tour-change-apply';
import {
  describeUndo,
  standingOf,
  undoRefusals,
  undoRefusalText,
  type UndoBasis,
} from '../../../src/nest/tours/tour-change-undo';
import type { TourWaypoint } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// TCHG-UNDO-PURE-001 to TCHG-UNDO-PURE-006

const point = (key: string | undefined, sequence: number, extra: Partial<TourWaypoint> = {}): TourWaypoint => ({
  lat: 48 + sequence * 0.01,
  lng: 11,
  role: 'via',
  sequence,
  ...(key ? { key, name: key.replace('stop-', '') } : {}),
  ...extra,
});

/** The walk before the step: gate, museum (standing for place 7), park. */
const before: TourChangeStepBefore = {
  route_geometry: [
    [48, 11],
    [48.02, 11],
  ],
  waypoints: [
    point('stop-gate', 0, { role: 'start' }),
    point('stop-museum', 1, { linked_place_id: 7 }),
    point('stop-park', 2, { role: 'end' }),
  ],
  distance: 1.2,
  duration: 18,
  elevation_gain: null,
  elevation_loss: null,
};

/** The walk after the step: gate, a new cafe, park and a new end, the museum gone. */
const now: TourWaypoint[] = [
  point('stop-gate', 0, { role: 'start' }),
  point('stop-cafe1', 1),
  point('stop-park', 2),
  point('stop-pier1', 3, { role: 'end' }),
];

const basis = (done: Array<[string, StationDone[]]> = [], linkable: number[] = [7]): UndoBasis => ({
  now,
  before,
  done: new Map(done),
  linkable: new Set(linkable),
});

describe('tour change undo, pure (MCP-T04)', () => {
  it('TCHG-UNDO-PURE-001: a step stands as the latest change only on its own revision, untaken back and with a tour before it', () => {
    const step = { revision: 4, undone_revision: null };
    expect(standingOf(step, before, 4)).toEqual({ kind: 'latest', before });
    expect(standingOf({ revision: 4, undone_revision: 5 }, before, 5)).toEqual({ kind: 'undone' });
    expect(standingOf(step, before, 5)).toEqual({ kind: 'later_change' });
    expect(standingOf(step, before, null)).toEqual({ kind: 'later_change' });
    expect(standingOf(step, null, 4)).toEqual({ kind: 'no_earlier_state' });
  });

  it('TCHG-UNDO-PURE-002: nothing done since and every place still there refuses nothing', () => {
    expect(undoRefusals(basis())).toEqual([]);
    // A station that stays may well have been done: its visit stays with it.
    expect(undoRefusals(basis([['stop-park', [{ day_id: 1, status: 'visited' }]]]))).toEqual([]);
  });

  it('TCHG-UNDO-PURE-003: a station done since that would go, and a place gone, refuse with every reason', () => {
    const refused = undoRefusals(basis([['stop-cafe1', [{ day_id: 2, status: 'skipped' }]]], []));
    expect(refused).toEqual([
      { why: 'station_done', key: 'stop-cafe1', name: 'cafe1', days: [{ day_id: 2, status: 'skipped' }] },
      { why: 'place_gone', key: 'stop-museum', name: 'museum', linked_place_id: 7 },
    ]);
    expect(undoRefusalText(refused)).toBe(
      [
        'Taking this step back would lose what was done since. Nothing changed.',
        'Station stop-cafe1 (cafe1) would be removed, but it was visited or skipped since.',
        'Station stop-museum (museum) stands for place 7, which is no longer a place of the trip.',
      ].join('\n'),
    );
  });

  it('TCHG-UNDO-PURE-004: points without key or name are named as such and never matched by a missing key', () => {
    const keyless: UndoBasis = {
      now: [point('stop-gate', 0), point(undefined, 1)],
      before: { ...before, waypoints: [point('stop-gate', 0), point(undefined, 1, { linked_place_id: 9 })] },
      done: new Map(),
      linkable: new Set(),
    };
    const refused = undoRefusals(keyless);
    expect(refused).toEqual([{ why: 'place_gone', key: null, name: null, linked_place_id: 9 }]);
    expect(undoRefusalText([...refused, { why: 'station_done', key: 'stop-x1', name: null, days: [] }])).toContain(
      'Station without key (no name) stands for place 9',
    );
    const described = describeUndo(keyless, { distance_km: null, walking_minutes: null, route_pending: true });
    expect(described.now.stations[1]).toEqual({ position: 2, key: null, name: null, done: false });
    expect(described.restored.stations[1]).toEqual({
      position: 2,
      key: null,
      name: null,
      change: 'back',
      now_position: null,
    });
    expect(described.removed).toEqual([{ key: null, name: null, position: 2 }]);
  });

  it('TCHG-UNDO-PURE-005: the tour now is set against the tour restored, stations kept, back and removed', () => {
    const gateVisited = basis([['stop-gate', [{ day_id: 1, status: 'visited' }]]]);
    const described = describeUndo(gateVisited, { distance_km: 1.5, walking_minutes: 24, route_pending: false });
    expect(described.now).toEqual({
      distance_km: 1.5,
      walking_minutes: 24,
      route_pending: false,
      stations: [
        { position: 1, key: 'stop-gate', name: 'gate', done: true },
        { position: 2, key: 'stop-cafe1', name: 'cafe1', done: false },
        { position: 3, key: 'stop-park', name: 'park', done: false },
        { position: 4, key: 'stop-pier1', name: 'pier1', done: false },
      ],
    });
    expect(described.restored).toEqual({
      distance_km: 1.2,
      walking_minutes: 18,
      route_pending: false,
      stations: [
        { position: 1, key: 'stop-gate', name: 'gate', change: 'kept', now_position: 1 },
        { position: 2, key: 'stop-museum', name: 'museum', change: 'back', now_position: null },
        { position: 3, key: 'stop-park', name: 'park', change: 'kept', now_position: 3 },
      ],
    });
    expect(described.removed).toEqual([
      { key: 'stop-cafe1', name: 'cafe1', position: 2 },
      { key: 'stop-pier1', name: 'pier1', position: 4 },
    ]);
  });

  it('TCHG-UNDO-PURE-006: a tour that had no line before restores as waiting for its way', () => {
    const pending: UndoBasis = { ...basis(), before: { ...before, route_geometry: null, distance: null } };
    const described = describeUndo(pending, { distance_km: 1.5, walking_minutes: 24, route_pending: false });
    expect(described.restored).toMatchObject({ distance_km: null, walking_minutes: 18, route_pending: true });
  });
});
