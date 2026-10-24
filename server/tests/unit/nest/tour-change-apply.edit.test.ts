import {
  applyChanges,
  editsOnly,
  refusalText,
  reversedPoints,
  savedPoint,
  turnedLeg,
  type ChangeBasis,
  type DraftPoint,
} from '../../../src/nest/tours/tour-change-apply';
import type { TourChange, TourWaypoint } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// TCHG-EDIT-001 to TCHG-EDIT-012: P8, a city walk's stations edited, the walk reversed and closed to a loop.

const point = (key: string, sequence: number, extra: Partial<TourWaypoint> = {}): TourWaypoint => ({
  lat: 48 + sequence * 0.01,
  lng: 11,
  role: 'via',
  sequence,
  key,
  name: key.replace('stop-', ''),
  ...extra,
});

/** A walk from the gate past the museum to the park. */
const walk = (): TourWaypoint[] => [
  point('stop-gate', 0, { role: 'start', stay_minutes: 5 }),
  point('stop-museum', 1, { stay_minutes: 45, importance: 'must' }),
  point('stop-park', 2, { role: 'end' }),
];

/** The same walk as a loop: the way back stands on the gate again. */
const loop = (): TourWaypoint[] => [
  ...walk().slice(0, 2),
  point('stop-park', 2),
  { lat: 48, lng: 11, role: 'end', sequence: 3, key: 'back-0001' },
];

const basis = (over: Partial<ChangeBasis> = {}): ChangeBasis => ({
  tourType: 'walk',
  recorded: false,
  points: walk(),
  done: new Map(),
  linkable: new Set(),
  ...over,
});

function ready(outcome: ReturnType<typeof applyChanges>) {
  if (outcome.kind !== 'ready') throw new Error(`refused: ${JSON.stringify(outcome.refused)}`);
  return outcome;
}

function refused(outcome: ReturnType<typeof applyChanges>) {
  if (outcome.kind !== 'refused') throw new Error('was laid');
  return outcome.refused;
}

const refs = (points: readonly DraftPoint[]) => points.map((p) => p.ref);

describe('edits of a station (P8)', () => {
  it('TCHG-EDIT-001: an edit writes only the fields it names, null clears one, and the station stays where it is', () => {
    const changes: TourChange[] = [
      { op: 'edit', key: 'stop-museum', name: 'Art museum', stay_minutes: null, importance: null, protected: true },
      { op: 'edit', key: 'stop-park', opening_hours: 'Mo-Su 06:00-22:00' },
    ];
    const { points } = ready(applyChanges(basis(), changes));
    expect(refs(points)).toEqual(['stop-gate', 'stop-museum', 'stop-park']);
    expect(points[1]).toMatchObject({
      name: 'Art museum',
      stay_minutes: null,
      importance: null,
      protected: true,
      origin: 'edited',
      change: 1,
    });
    expect(points[2]).toMatchObject({ name: 'park', opening_hours: 'Mo-Su 06:00-22:00', origin: 'edited', change: 2 });
    expect(points[0]).toMatchObject({ stay_minutes: 5, origin: 'saved' });
  });

  it('TCHG-EDIT-002: a protected or already visited station takes an edit; an unknown key is refused', () => {
    const points = walk().map((one) => (one.key === 'stop-museum' ? { ...one, protected: true } : one));
    const done = new Map([['stop-museum', [{ day_id: 3, status: 'visited' as const }]]]);
    const edited = ready(applyChanges(basis({ points, done }), [{ op: 'edit', key: 'stop-museum', stay_minutes: 60 }]));
    expect(edited.points[1]?.stay_minutes).toBe(60);
    const unknown = refused(applyChanges(basis(), [{ op: 'edit', key: 'stop-nowhere', name: 'X' }]));
    expect(unknown).toEqual([{ change: 1, op: 'edit', key: 'stop-nowhere', reason: 'unknown_station' }]);
  });

  it('TCHG-EDIT-003: editsOnly tells a proposal of edits from one that moves stations', () => {
    expect(editsOnly([{ op: 'edit', key: 'stop-park', name: 'P' }])).toBe(true);
    expect(editsOnly([{ op: 'edit', key: 'stop-park', name: 'P' }, { op: 'reverse' }])).toBe(false);
  });
});

describe('a walk turned round (PR1-02)', () => {
  it('TCHG-EDIT-004: the last station starts it, every station is marked moved but one that keeps its place', () => {
    const { points } = ready(applyChanges(basis(), [{ op: 'reverse' }]));
    expect(refs(points)).toEqual(['stop-park', 'stop-museum', 'stop-gate']);
    expect(points.map((p) => [p.role, p.sequence])).toEqual([
      ['start', 0],
      ['via', 1],
      ['end', 2],
    ]);
    expect(points.map((p) => p.origin)).toEqual(['moved', 'saved', 'moved']);
  });

  it('TCHG-EDIT-005: a loop stays a loop from the same start, which keeps its key and stay', () => {
    const { points } = ready(applyChanges(basis({ points: loop() }), [{ op: 'reverse' }]));
    expect(points.map((p) => p.key)).toEqual(['stop-gate', 'stop-park', 'stop-museum', 'back-0001']);
    expect(points[0]).toMatchObject({ lat: 48, lng: 11, stay_minutes: 5, role: 'start' });
    expect(points[3]).toMatchObject({ lat: 48, lng: 11, role: 'end' });
    expect(points[3]?.name).toBeUndefined();
  });

  it('TCHG-EDIT-006: a walk under way or with a protected station is not turned round', () => {
    const done = new Map([['stop-gate', [{ day_id: 2, status: 'skipped' as const }]]]);
    expect(refused(applyChanges(basis({ done }), [{ op: 'reverse' }]))).toEqual([
      { change: 1, op: 'reverse', key: null, reason: 'walk_under_way' },
    ]);
    const points = walk().map((one) => (one.key === 'stop-museum' ? { ...one, protected: true } : one));
    expect(refused(applyChanges(basis({ points }), [{ op: 'reverse' }]))).toEqual([
      { change: 1, op: 'reverse', key: 'stop-museum', reason: 'protected' },
    ]);
  });

  it('TCHG-EDIT-007: a reverse goes with edits only, and only once', () => {
    const withMove = refused(
      applyChanges(basis(), [{ op: 'reverse' }, { op: 'move', key: 'stop-gate', after_key: 'stop-museum' }]),
    );
    expect(withMove).toEqual([{ change: null, op: null, key: null, reason: 'reshape_not_alone' }]);
    expect(refused(applyChanges(basis(), [{ op: 'reverse' }, { op: 'close_loop' }]))[0]?.reason).toBe(
      'reshape_not_alone',
    );
    const withEdit = ready(applyChanges(basis(), [{ op: 'reverse' }, { op: 'edit', key: 'stop-park', name: 'Park' }]));
    expect(withEdit.points[0]).toMatchObject({ key: 'stop-park', name: 'Park' });
  });

  it('TCHG-EDIT-008: a leg drawn by hand stays on its stretch, its line turned; a crossing by boat keeps its points', () => {
    const free = { kind: 'free' as const, geometry: [[48, 11] as [number, number], [48.01, 11] as [number, number]] };
    const ferry = {
      kind: 'ferry' as const,
      geometry: [
        [48.01, 11],
        [48.012, 11],
        [48.016, 11],
        [48.02, 11],
      ] as Array<[number, number]>,
      crossings: [[1, 2]] as Array<[number, number]>,
      minutes: 10,
      walk_minutes: 4,
    };
    const points = [
      point('stop-gate', 0, { role: 'start', fixed_leg: free }),
      point('stop-museum', 1, { fixed_leg: ferry }),
      point('stop-park', 2, { role: 'end' }),
    ];
    const turned = reversedPoints(points.map(savedPoint));
    expect(turned.map((p) => p.fixed_leg?.kind ?? null)).toEqual(['ferry', 'free', null]);
    expect(turned[0]?.fixed_leg).toMatchObject({ geometry: [...ferry.geometry].reverse(), crossings: [[1, 2]] });
    expect(turned[1]?.fixed_leg?.geometry).toEqual([...free.geometry].reverse());
    expect(turnedLeg({ ...ferry, crossings: [[0, 1]] })).toMatchObject({ crossings: [[2, 3]] });
  });
});

describe('a walk taken back to its start (PR1-01)', () => {
  it('TCHG-EDIT-009: a way back on the start is added, no station of its own and nothing to keep as a place', () => {
    const { points } = ready(applyChanges(basis(), [{ op: 'close_loop' }]));
    expect(points).toHaveLength(4);
    expect(points[3]).toMatchObject({ lat: 48, lng: 11, role: 'end', origin: 'loop', ref: 'new:1' });
    expect(points[3]?.key).toBeUndefined();
    expect(points[2]).toMatchObject({ key: 'stop-park', role: 'via' });
  });

  it('TCHG-EDIT-010: a walk that already ends at its start is refused, with the reason in words', () => {
    const outcome = refused(applyChanges(basis({ points: loop() }), [{ op: 'close_loop' }]));
    expect(outcome).toEqual([{ change: 1, op: 'close_loop', key: null, reason: 'already_loop' }]);
    expect(refusalText(outcome, 'prepared')).toBe(
      'Nothing was prepared and nothing changed.\nChange 1 (close_loop): this walk already ends where it starts.',
    );
  });

  it('TCHG-EDIT-011: the refusal names a reverse without a station and an edit with its key', () => {
    const text = refusalText(
      [
        { change: 1, op: 'reverse', key: null, reason: 'walk_under_way' },
        { change: 2, op: 'edit', key: 'stop-x', reason: 'unknown_station' },
      ],
      'saved',
    );
    expect(text).toContain('Change 1 (reverse): the travellers already visited or skipped stations');
    expect(text).toContain('Change 2 (edit stop-x): no station');
  });

  it('TCHG-EDIT-012: a hike still takes no prepared change at all', () => {
    expect(refused(applyChanges(basis({ tourType: 'hike' }), [{ op: 'close_loop' }]))[0]?.reason).toBe(
      'type_not_supported',
    );
  });
});
