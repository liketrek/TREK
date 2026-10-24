/**
 * update_tour with reshape (P8, PR1-01 and PR1-02 for a saved hike): the saved
 * points turned round or taken back to their start, then planned anew as new
 * points are. The way is planned by a stub of HikeRoutingService; the write
 * is the real one over a snapshot test db.
 */
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { HikePlanMcp } from '../../../src/nest/tours/hike-plan.mcp';
import { HikeRoutingService, type PlannedHike } from '../../../src/nest/tours/hike-routing.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import type { GeometryPoint, HikePlanRequest } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// HIKE-RESHAPE-001 to HIKE-RESHAPE-005

const db = createSnapshotTestDb();
const plan = vi.fn<HikeRoutingService['plan']>();
let t: TestModule;
let mcp: HikePlanMcp;
const orm = () => t.get(MikroORM);

/** The stub's plan: a straight way through the points asked for, with heights. */
function routed(request: HikePlanRequest): PlannedHike {
  const line: GeometryPoint[] = request.waypoints.map(({ lat, lng }, index) => [lat, lng, 800 + index * 50]);
  return {
    plan: {
      kind: 'routed',
      max_hiking_difficulty: request.max_hiking_difficulty ?? 2,
      hiking_preferences: request.hiking_preferences ?? null,
      distance_m: 2000,
      ascent_m: 100,
      descent_m: 0,
      duration_minutes: 40,
      duration_basis: 'din33466',
      has_heights: true,
      line,
      profile: [],
      grades: null,
    },
    line,
    snapped: line.map(() => 0),
    legs: line.slice(1).map(() => 1000),
  };
}

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [{ provide: HikeRoutingService, useValue: { plan } }],
  });
  mcp = t.get(HikePlanMcp);
});
beforeEach(() => {
  resetTestDb(db);
  plan.mockReset().mockImplementation(async (_userId, _tripId, request) => routed(request));
});
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

const POINTS = [
  { lat: 47.5, lng: 11.1, station_key: 'stop-carpark', name: 'Car park' },
  { lat: 47.51, lng: 11.1, station_key: 'stop-hut0001', name: 'Hut' },
  { lat: 47.52, lng: 11.1, station_key: 'stop-summit1', name: 'Summit' },
];

async function hike(points = POINTS, type: 'hike' | 'walk' = 'hike') {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const place = await makePlace(orm(), trip.id, {
    name: 'Herzogstand',
    route_geometry: JSON.stringify(points.map(({ lat, lng }) => [lat, lng, 800])),
  });
  await makeTour(orm(), place.id, { tourTypeRef: type, max_hiking_difficulty: type === 'hike' ? 2 : null });
  await addTourWaypoints(orm(), place.id, points);
  return { user, trip, place };
}

describe('update_tour with reshape', () => {
  it('HIKE-RESHAPE-001: reverse plans the saved points the other way round, each keeping its name and key', async () => {
    const { user, trip, place } = await hike();
    const changed = read(
      await mcp.updateTour(
        { tripId: trip.id, placeId: place.id, expected_revision: 1, reshape: 'reverse' },
        ctx(user.id),
      ),
    );
    expect(plan.mock.calls[0]?.[2].waypoints.map(({ lat }) => lat)).toEqual([47.52, 47.51, 47.5]);
    expect(changed).toMatchObject({ replanned: true, tour: { revision: 2 } });
    expect(changed.waypoints.map((point: { name: string; key: string }) => [point.name, point.key])).toEqual([
      ['Summit', 'stop-summit1'],
      ['Hut', 'stop-hut0001'],
      ['Car park', 'stop-carpark'],
    ]);
  });

  it('HIKE-RESHAPE-002: close_loop adds the way back to the start, and a second one is refused', async () => {
    const { user, trip, place } = await hike();
    const closed = read(
      await mcp.updateTour(
        { tripId: trip.id, placeId: place.id, expected_revision: 1, reshape: 'close_loop' },
        ctx(user.id),
      ),
    );
    expect(closed.waypoints).toHaveLength(4);
    expect(closed.waypoints[3]).toMatchObject({ lat: 47.5, lng: 11.1, role: 'end' });
    await expect(
      mcp.updateTour({ tripId: trip.id, placeId: place.id, expected_revision: 2, reshape: 'close_loop' }, ctx(user.id)),
    ).rejects.toThrow('This hike already ends where it starts.');
  });

  it('HIKE-RESHAPE-003: a hike split into stages is not turned round, and nothing is planned', async () => {
    const staged = [POINTS[0], { ...POINTS[1], stage_end: 1 }, POINTS[2]] as typeof POINTS;
    const { user, trip, place } = await hike(staged);
    await expect(
      mcp.updateTour({ tripId: trip.id, placeId: place.id, expected_revision: 1, reshape: 'reverse' }, ctx(user.id)),
    ).rejects.toThrow('split into stages over several days');
    expect(plan).not.toHaveBeenCalled();
  });

  it('HIKE-RESHAPE-004: any other type keeps being refused here', async () => {
    const { user, trip, place } = await hike(POINTS, 'walk');
    await expect(
      mcp.updateTour({ tripId: trip.id, placeId: place.id, expected_revision: 1, reshape: 'reverse' }, ctx(user.id)),
    ).rejects.toThrow('Only a hike is changed here');
  });

  it('HIKE-RESHAPE-005: a recorded track is neither turned round nor closed, and nothing is planned or saved', async () => {
    const { user } = await makeUser(orm());
    const trip = await makeTrip(orm(), user.id);
    // A GPX import from A to B: its line only, and no points of its own (its read makes up the two ends).
    const place = await makePlace(orm(), trip.id, {
      name: 'Recorded',
      route_geometry: JSON.stringify([
        [47.5, 11.1, 800],
        [47.51, 11.12, 900],
        [47.52, 11.1, 850],
      ]),
    });
    await makeTour(orm(), place.id, { origin: 'gpx' });
    const reshaped = (reshape: 'reverse' | 'close_loop') =>
      mcp.updateTour({ tripId: trip.id, placeId: place.id, expected_revision: 1, reshape }, ctx(user.id));
    await expect(reshaped('reverse')).rejects.toThrow('recorded track without points of its own');
    await expect(reshaped('close_loop')).rejects.toThrow('recorded track without points of its own');
    expect(plan).not.toHaveBeenCalled();
    expect(await countRows(orm(), TourWaypoints, { place: place.id })).toBe(0);
    expect((await findRow(orm(), Tours, { place: place.id }))?.revision).toBe(1);
  });
});
