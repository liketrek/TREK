/**
 * TourSportWritesMcp (P9): the writes a ski or paddle tour has of its own, an
 * import taken back to its recording, and the reads beside them (the trail
 * details along a saved tour, the horse routes in a map view), over MCP with
 * the services and checks of their REST routes. The router, the trail grades
 * and the horse routes stand in for the network. The suite takes its subject
 * from the container over a snapshot test db.
 */
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { TourHorseRoutesService } from '../../../src/nest/tours/tour-horse-routes.service';
import { TourObstacleReviewsService } from '../../../src/nest/tours/tour-obstacle-reviews.service';
import { TourSportWritesMcp } from '../../../src/nest/tours/tour-sport-writes.mcp';
import { TourTrailGradeService } from '../../../src/nest/tours/tour-trail-grade.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { findRow, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { HORSE_ROUTES_ATTRIBUTION } from '@trek/shared';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let mcp: TourSportWritesMcp;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(TourSportWritesMcp);
});
beforeEach(() => resetTestDb(db));
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

/** About 1.1 km north, with heights. */
const LINE = JSON.stringify([
  [47, 11, 600],
  [47.01, 11, 700],
]);

async function fixture() {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const ski = await makePlace(orm(), trip.id, { name: 'Morning run', route_geometry: LINE });
  await makeTour(orm(), ski.id, { tourTypeRef: 'ski', origin: 'gpx', ski_discipline: 'alpine' });
  const paddle = await makePlace(orm(), trip.id, { name: 'River day', route_geometry: LINE });
  await makeTour(orm(), paddle.id, { tourTypeRef: 'kayak', origin: 'gpx', boat_type: 'kayak', water_context: 'river' });
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge', route_geometry: LINE });
  await makeTour(orm(), hike.id);
  await addTourWaypoints(orm(), hike.id, [
    { lat: 47, lng: 11 },
    { lat: 47.01, lng: 11 },
  ]);
  return { user, outsider, trip, ski, paddle, hike };
}

describe('classify_ski_track', () => {
  it('TSPORT-MCP-001: classifies a ski track again and answers the classification before', async () => {
    const { user, trip, ski } = await fixture();
    const result = read(
      await mcp.classifySkiTrack(
        { tripId: trip.id, placeId: ski.id, ski_discipline: 'cross_country', ski_technique: 'skating' },
        ctx(user.id),
      ),
    );
    expect(result.tour).toMatchObject({ ski_discipline: 'cross_country', ski_technique: 'skating', revision: 2 });
    expect(result.previous).toEqual({ revision: 1, ski_discipline: 'alpine', ski_technique: null });
  });

  it('TSPORT-MCP-002: refuses what the REST contract refuses, and a tour that is no ski track', async () => {
    const { user, trip, ski, hike } = await fixture();
    const technique = await mcp.classifySkiTrack(
      { tripId: trip.id, placeId: ski.id, ski_discipline: 'alpine', ski_technique: 'classic' },
      ctx(user.id),
    );
    expect(technique.isError).toBe(true);
    await expect(
      mcp.classifySkiTrack({ tripId: trip.id, placeId: hike.id, ski_discipline: 'alpine' }, ctx(user.id)),
    ).rejects.toThrow('Only a ski track has a ski classification');
    expect((await findRow(orm(), Tours, { place: ski.id }))?.ski_discipline).toBe('alpine');
  });
});

describe('set_paddle_plan', () => {
  const marks = { portages: [{ from_m: 100, to_m: 300, extra_minutes: null }], locks: [] };

  it('TSPORT-MCP-003: lays a portage onto a recorded paddle track and answers the plan before', async () => {
    const { user, trip, paddle } = await fixture();
    const result = read(
      await mcp.setPaddlePlan(
        { tripId: trip.id, placeId: paddle.id, paddle_speed_kmh: 5, portage_speed_kmh: null, track_marks: marks },
        ctx(user.id),
      ),
    );
    expect(result.tour).toMatchObject({ paddle_speed_kmh: 5, track_marks: marks, revision: 2 });
    expect(result.previous).toEqual({
      revision: 1,
      paddle_speed_kmh: null,
      portage_speed_kmh: null,
      track_marks: { portages: [], locks: [] },
    });
  });

  it('TSPORT-MCP-004: a planned tour, a mark past the track and a mark the contract refuses are refused', async () => {
    const { user, trip, paddle, hike } = await fixture();
    await expect(
      mcp.setPaddlePlan(
        { tripId: trip.id, placeId: hike.id, paddle_speed_kmh: null, portage_speed_kmh: null, track_marks: marks },
        ctx(user.id),
      ),
    ).rejects.toThrow('Only a paddle tour has a paddle plan');
    const far = { portages: [{ from_m: 100, to_m: 90_000, extra_minutes: null }], locks: [] };
    await expect(
      mcp.setPaddlePlan(
        { tripId: trip.id, placeId: paddle.id, paddle_speed_kmh: null, portage_speed_kmh: null, track_marks: far },
        ctx(user.id),
      ),
    ).rejects.toThrow('A mark lies beyond the end of the track');
    const backwards = { portages: [{ from_m: 300, to_m: 100, extra_minutes: null }], locks: [] };
    const refused = await mcp.setPaddlePlan(
      { tripId: trip.id, placeId: paddle.id, paddle_speed_kmh: null, portage_speed_kmh: null, track_marks: backwards },
      ctx(user.id),
    );
    expect(read(refused)).toEqual({ error: 'a portage ends after it begins' });
  });
});

describe('decide_paddle_obstacles', () => {
  const op = { key: 'node/12', op: 'note' as const, decision: null, note: 'carry left', basis: null };

  it('TSPORT-MCP-005: saves through the checklist service as the user and answers the checklist', async () => {
    const { user, trip, paddle } = await fixture();
    const detail = await t.get(ToursService).getTour(String(trip.id), String(paddle.id));
    const check = { revision: 'r1', evaluated_at: '2026-10-23T08:00:00Z', entries: [], own: [] };
    const save = vi
      .spyOn(t.get(TourObstacleReviewsService), 'save')
      .mockResolvedValue({ ...detail, obstacle_check: check });
    const result = read(
      await mcp.decidePaddleObstacles({ tripId: trip.id, placeId: paddle.id, ops: [op] }, ctx(user.id)),
    );
    expect(save).toHaveBeenCalledWith(String(trip.id), String(paddle.id), { ops: [op] }, user.id);
    expect(result).toMatchObject({ tour: { place_id: paddle.id }, obstacle_check: check });
  });

  it('TSPORT-MCP-006: one obstacle twice is refused before anything is saved', async () => {
    const { user, trip, paddle } = await fixture();
    const save = vi.spyOn(t.get(TourObstacleReviewsService), 'save');
    const result = await mcp.decidePaddleObstacles(
      { tripId: trip.id, placeId: paddle.id, ops: [op, op] },
      ctx(user.id),
    );
    expect(read(result)).toEqual({ error: 'each obstacle at most once' });
    expect(save).not.toHaveBeenCalled();
  });
});

describe('restore_recorded_track', () => {
  it('TSPORT-MCP-007: takes a planned import back to its recording; one without a recording is refused', async () => {
    const { user, trip, hike, paddle } = await fixture();
    const recorded = JSON.stringify([
      [47, 11, 600],
      [47.005, 11.002, 650],
      [47.01, 11, 700],
    ]);
    await updateRows(orm(), Tours, { place: hike.id }, { recorded_route_geometry: recorded });
    const result = read(await mcp.restoreRecordedTrack({ tripId: trip.id, placeId: hike.id }, ctx(user.id)));
    expect(result.tour).toMatchObject({ place_id: hike.id, has_waypoints: false });
    await expect(mcp.restoreRecordedTrack({ tripId: trip.id, placeId: paddle.id }, ctx(user.id))).rejects.toThrow(
      'This tour keeps no recorded track to go back to',
    );
  });
});

describe('get_tour_trail_details', () => {
  it('TSPORT-MCP-008: lays the grades of the ways under the saved line onto it', async () => {
    const { user, trip, hike } = await fixture();
    const ways = vi.spyOn(t.get(RoadtripRouterService), 'wayIds').mockResolvedValue([
      { wayId: 1, metres: 600 },
      { wayId: 2, metres: 400 },
    ]);
    vi.spyOn(t.get(TourTrailGradeService), 'grades').mockResolvedValue({
      ways: [
        {
          id: 1,
          mtb_scale: '1',
          mtb_scale_uphill: null,
          mtb_scale_imba: null,
          sac_scale: 'mountain_hiking',
          sac_scale_unclear: null,
          surface: 'gravel',
          highway: 'track',
        },
      ],
      unanswered: [2],
    });
    const result = read(await mcp.getTourTrailDetails({ tripId: trip.id, placeId: hike.id }, ctx(user.id)));
    expect(ways).toHaveBeenCalledWith(user.id, [
      [47, 11],
      [47.01, 11],
    ]);
    expect(result).toMatchObject({
      place_id: hike.id,
      tour_type: 'hike',
      sac: { highest: 2 },
      mtb: { highest: '1' },
      surface: [{ value: 'gravel', share: 0.6 }],
      highway: [{ value: 'track', share: 0.6 }],
      unknown_share: 0.4,
      ways_unanswered: 1,
      truncated: false,
    });
  });

  it('TSPORT-MCP-009: a router that does not answer is said so; reading needs only the trip', async () => {
    const { user, outsider, trip, hike } = await fixture();
    vi.spyOn(t.get(RoadtripRouterService), 'wayIds').mockRejectedValue(new Error('down'));
    await expect(mcp.getTourTrailDetails({ tripId: trip.id, placeId: hike.id }, ctx(user.id))).rejects.toThrow(
      'The ways under this tour cannot be read right now',
    );
    expect(read(await mcp.getTourTrailDetails({ tripId: trip.id, placeId: hike.id }, ctx(outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
  });
});

describe('find_horse_routes', () => {
  it('TSPORT-MCP-010: answers each section without its line, its ends instead; a box too large is refused', async () => {
    const { user, trip } = await fixture();
    const list = vi.spyOn(t.get(TourHorseRoutesService), 'list').mockResolvedValue({
      routes: [
        {
          id: 'relation/5',
          name: 'Reitweg',
          ref: null,
          osmUrl: 'https://www.openstreetmap.org/relation/5',
          continues: false,
          sections: [
            {
              number: 1,
              geometry: [
                [47.5, 11.2],
                [47.51, 11.21],
                [47.52, 11.22],
              ],
              length_m: 2600,
              access: [{ value: 'designated', length_m: 2600 }],
              signposted: null,
            },
          ],
        },
      ],
      truncated: false,
      source: 'openstreetmap',
      attribution: HORSE_ROUTES_ATTRIBUTION,
    });
    const result = read(await mcp.findHorseRoutes({ tripId: trip.id, bbox: '47.5,11.2,47.6,11.3' }, ctx(user.id)));
    expect(list).toHaveBeenCalledWith({ south: 47.5, west: 11.2, north: 47.6, east: 11.3 });
    expect(result.routes[0].sections[0]).toEqual({
      number: 1,
      length_m: 2600,
      access: [{ value: 'designated', length_m: 2600 }],
      signposted: null,
      from: [47.5, 11.2],
      to: [47.52, 11.22],
    });
    await expect(mcp.findHorseRoutes({ tripId: trip.id, bbox: '40,0,50,20' }, ctx(user.id))).rejects.toThrow();
  });
});

describe('the checks of the REST routes', () => {
  it('TSPORT-MCP-011: without place_edit no write runs', async () => {
    const { user, trip, ski, paddle, hike } = await fixture();
    const denied = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    const results = [
      await mcp.classifySkiTrack({ tripId: trip.id, placeId: ski.id, ski_discipline: 'snowshoe' }, ctx(user.id)),
      await mcp.setPaddlePlan(
        {
          tripId: trip.id,
          placeId: paddle.id,
          paddle_speed_kmh: 5,
          portage_speed_kmh: null,
          track_marks: { portages: [], locks: [] },
        },
        ctx(user.id),
      ),
      await mcp.decidePaddleObstacles(
        {
          tripId: trip.id,
          placeId: paddle.id,
          ops: [{ key: 'node/1', op: 'clear', decision: null, note: null, basis: null }],
        },
        ctx(user.id),
      ),
      await mcp.restoreRecordedTrack({ tripId: trip.id, placeId: hike.id }, ctx(user.id)),
    ];
    expect(results.every((result) => result.isError === true)).toBe(true);
    expect(denied).toHaveBeenCalledWith('place_edit', trip.id, user.id);
    expect((await findRow(orm(), Tours, { place: ski.id }))?.ski_discipline).toBe('alpine');
  });
});
