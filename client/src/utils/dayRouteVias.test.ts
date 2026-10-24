import type { RoadtripVia } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { buildAssignment, buildPlace } from '../../tests/helpers/factories';
import type { AssignmentsMap, RouteSegment } from '../types';
import { dayViaLookup, foldViaLegs, roadtripStopList, threadVias, viaKeyOf, viasOnDayLeg } from './dayRouteVias';

const leg = (distance: number): RouteSegment => ({
  mid: [0, 0],
  from: [distance, 0],
  to: [distance + 1, 0],
  distance,
  duration: distance / 10,
  distanceText: '',
  durationText: '',
  walkingText: '',
  drivingText: '',
});

const via = (dayId: number, afterOrderIndex: number, lat: number, sequence = 0): RoadtripVia =>
  ({
    id: lat,
    day_id: dayId,
    after_order_index: afterOrderIndex,
    sequence,
    lat,
    lng: 0,
    created_at: '',
  }) as RoadtripVia;

const stop = (id: number, order: number, extra: Record<string, unknown> = {}) =>
  buildAssignment({ id, day_id: 1, order_index: order, place: buildPlace({ lat: 48 + order, lng: 2 }), ...extra });

// Stored order: hotel row, Paris, a place without coordinates, Lille, Brussels.
const STORED: AssignmentsMap = {
  '1': [
    stop(14, 3),
    stop(11, 1),
    stop(10, 0, { accommodation_id: 5 }),
    buildAssignment({
      id: 12,
      day_id: 1,
      order_index: 2,
      place: buildPlace({ lat: null as unknown as number, lng: null as unknown as number }),
    }),
    stop(13, 2.5),
  ],
};

/** The lookup of a trip that has vias, which is never null. */
function lookupFor(viasByDay: Record<number, RoadtripVia[]>) {
  const lookup = dayViaLookup(STORED, viasByDay);
  if (!lookup) throw new Error('expected a lookup');
  return lookup;
}

describe('dayRouteVias (#2580)', () => {
  it('FE-MAP-DRV-001: the stop list is the stored order with coordinates, hidden rows included', () => {
    expect(roadtripStopList(STORED['1']).map((a) => a.id)).toEqual([10, 11, 13, 14]);
    expect(roadtripStopList(undefined)).toEqual([]);
  });

  it('FE-MAP-DRV-002: a leg gets the vias filed behind its first stop, in sequence', () => {
    const lookup = lookupFor({ 1: [via(1, 1, 49.6, 1), via(1, 1, 49.3, 0), via(1, 2, 50.5)] });
    expect(lookup(1, 11, 13).map((v) => v.lat)).toEqual([49.3, 49.6]);
    expect(lookup(1, 13, 14).map((v) => v.lat)).toEqual([50.5]);
  });

  it('FE-MAP-DRV-003: two stops that do not follow each other in the stored list get none', () => {
    const lookup = lookupFor({ 1: [via(1, 1, 49.3)] });
    // Paris to Brussels skips Lille: the via belongs to the leg to Lille.
    expect(lookup(1, 11, 14)).toEqual([]);
    expect(lookup(1, 13, 11)).toEqual([]);
    expect(lookup(1, 999, 13)).toEqual([]);
    expect(lookup(2, 11, 13)).toEqual([]);
  });

  it('FE-MAP-DRV-004: a trip without vias routes as before', () => {
    expect(dayViaLookup(STORED, undefined)).toBeNull();
    expect(dayViaLookup(STORED, {})).toBeNull();
    expect(dayViaLookup(STORED, { 1: [] })).toBeNull();
  });

  it('FE-MAP-DRV-005: a ride, a hotel bookend or a missing lookup bends nothing', () => {
    const lookup = dayViaLookup(STORED, { 1: [via(1, 1, 49.3)] });
    expect(viasOnDayLeg(lookup, 1, 'driving', { assignmentId: 11 }, { assignmentId: 13 })).toHaveLength(1);
    expect(viasOnDayLeg(lookup, 1, 'walking', { assignmentId: 11 }, { assignmentId: 13 })).toHaveLength(1);
    expect(viasOnDayLeg(lookup, 1, 'train', { assignmentId: 11 }, { assignmentId: 13 })).toEqual([]);
    expect(viasOnDayLeg(lookup, 1, 'driving', { assignmentId: 11 }, {})).toEqual([]);
    expect(viasOnDayLeg(null, 1, 'driving', { assignmentId: 11 }, { assignmentId: 13 })).toEqual([]);
  });

  it('FE-MAP-DRV-006: threading remembers where each stop went, folding gives one leg per stop pair', () => {
    const points = [
      { lat: 1, lng: 0, k: 'a' },
      { lat: 2, lng: 0, k: 'b' },
      { lat: 3, lng: 0, k: 'c' },
    ];
    const { waypoints, stopAt } = threadVias(points, (from) =>
      from.k === 'a'
        ? [
            { lat: 1.5, lng: 0 },
            { lat: 1.7, lng: 0 },
          ]
        : []
    );
    expect(waypoints.map((w) => w.lat)).toEqual([1, 1.5, 1.7, 2, 3]);
    expect(stopAt).toEqual([0, 3, 4]);

    const folded = foldViaLegs([leg(1000), leg(2000), leg(3000), leg(4000)], stopAt, 'imperial');
    expect(folded.map((l) => l.distance)).toEqual([6000, 4000]);
    expect(folded[0].from).toEqual([1000, 0]);
    expect(folded[0].to).toEqual([3001, 0]);
    expect(folded[0].distanceText).toMatch(/mi/);
  });

  it('FE-MAP-DRV-007: legs are left alone when nothing was threaded or the answer does not line up', () => {
    const legs = [leg(1000), leg(2000)];
    expect(foldViaLegs(legs, [0, 1, 2], 'metric')).toBe(legs);
    expect(foldViaLegs(legs, [0, 2, 3], 'metric')).toBe(legs);
  });

  it('FE-MAP-DRV-008: the via key changes with the road and not with the order of the list', () => {
    const a = { 1: [via(1, 0, 49.3)], 2: [via(2, 0, 50.1)] };
    expect(viaKeyOf({ 2: a[2], 1: a[1] })).toBe(viaKeyOf(a));
    expect(viaKeyOf({ ...a, 1: [via(1, 0, 49.4)] })).not.toBe(viaKeyOf(a));
    expect(viaKeyOf(undefined)).toBe('');
  });
});
