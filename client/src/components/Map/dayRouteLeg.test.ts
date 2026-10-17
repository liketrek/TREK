import type { RoadtripVia } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildPlace } from '../../../tests/helpers/factories';
import type { AssignmentsMap, RouteSegment } from '../../types';
import { dayViaLookup } from '../../utils/dayRouteVias';
import { routeLeg } from './dayRouteLeg';

vi.mock('./RouteCalculator', async (importActual) => {
  const actual = await importActual<typeof import('./RouteCalculator')>();
  return { ...actual, calculateRouteWithLegs: vi.fn() };
});

const { calculateRouteWithLegs } = await import('./RouteCalculator');

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

beforeEach(() => {
  vi.mocked(calculateRouteWithLegs).mockReset();
});

describe('dayRouteLeg (#2580)', () => {
  it('FE-MAP-DRV-009: one leg is routed through its vias and read back as one leg in its mode', async () => {
    vi.mocked(calculateRouteWithLegs).mockResolvedValue({
      coordinates: [],
      distance: 0,
      duration: 0,
      legs: [leg(1000), leg(2000)],
    });
    const lookup = dayViaLookup(STORED, { 1: [via(1, 1, 49.3)] });
    const options = { profile: 'driving', tripId: 7, dayId: 1 };

    const seg = await routeLeg(
      { lat: 49, lng: 2, assignmentId: 11 },
      { lat: 50.5, lng: 2, assignmentId: 13 },
      lookup,
      options,
      'metric'
    );

    expect(vi.mocked(calculateRouteWithLegs).mock.calls[0][0]).toEqual([
      { lat: 49, lng: 2 },
      { lat: 49.3, lng: 0 },
      { lat: 50.5, lng: 2 },
    ]);
    expect(seg?.distance).toBe(3000);
    expect(seg?.mode).toBe('driving');
  });

  it('FE-MAP-DRV-010: a leg the router cannot answer is undefined', async () => {
    vi.mocked(calculateRouteWithLegs).mockRejectedValueOnce(new Error('down'));
    expect(
      await routeLeg({ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, null, { profile: 'driving', dayId: 1 }, 'metric')
    ).toBeUndefined();
    vi.mocked(calculateRouteWithLegs).mockResolvedValueOnce({ coordinates: [], distance: 0, duration: 0, legs: [] });
    expect(
      await routeLeg({ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, null, { profile: 'driving', dayId: 1 }, 'metric')
    ).toBeUndefined();
  });
});
