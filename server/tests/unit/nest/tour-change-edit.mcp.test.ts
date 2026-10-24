/**
 * prepare_tour_change and save_tour_change with the changes P8 brings: a
 * station edited (its name, stay, importance, protection, opening hours), the
 * walk turned round and closed to a loop. Edits alone keep the walk's saved
 * way and walking time and never ask the router; a reverse or a loop plans
 * the way on foot anew. The road trip's router is a stub; the suite takes its
 * subject from the container over a snapshot test db.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { TourChangeSteps } from '../../../src/db/entities/TourChangeSteps.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { proposalIdOf } from '../../../src/nest/tours/tour-change-proposal';
import { TourChangeMcp } from '../../../src/nest/tours/tour-change.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, findRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import type { TourChange } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// TCHG-EDIT-MCP-001 to TCHG-EDIT-MCP-004

const db = createSnapshotTestDb();
const route = vi.fn();
let t: TestModule;
let mcp: TourChangeMcp;
const orm = () => t.get(MikroORM);

/** Every leg is 500 m and 400 s on foot, along the points asked. */
async function routedOnFoot(_u: number, _t: number, _d: number, points: Array<{ lat: number; lng: number }>) {
  return {
    leg: { line: points.map((point): [number, number] => [point.lat, point.lng]) },
    parts: points.slice(1).map(() => ({ distance: 500, duration: 400 })),
    snapped: points.map(() => ({ meters: 4 })),
    avoidMissed: [],
  };
}

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [{ provide: RoadtripRouterService, useValue: { route } }],
  });
  mcp = t.get(TourChangeMcp);
});
beforeEach(() => {
  resetTestDb(db);
  route.mockReset().mockImplementation(routedOnFoot);
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

/** The walk's saved line, with heights the router on foot never gives. */
const LINE = [
  [48.1, 11.5, 520],
  [48.104, 11.5, 522],
  [48.108, 11.5, 525],
];

async function walk() {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const place = await makePlace(orm(), trip.id, { name: 'Old town', route_geometry: JSON.stringify(LINE) });
  await makeTour(orm(), place.id, { tourTypeRef: 'walk', duration: 25 });
  await addTourWaypoints(orm(), place.id, [
    { lat: 48.1, lng: 11.5, station_key: 'walk-gate', name: 'Gate' },
    { lat: 48.104, lng: 11.5, station_key: 'walk-market', name: 'Market', stay_minutes: 20 },
    { lat: 48.108, lng: 11.5, station_key: 'walk-park', name: 'Park' },
  ]);
  return { user, trip, place };
}

async function saved(f: Awaited<ReturnType<typeof walk>>, changes: TourChange[]) {
  const args = { tripId: f.trip.id, placeId: f.place.id };
  return read(
    await mcp.saveTourChange(
      {
        ...args,
        changes,
        expected_revision: 1,
        proposal_id: proposalIdOf({ ...args, revision: 1, changes }),
        confirmed: true,
      },
      ctx(f.user.id),
    ),
  );
}

describe('P8 changes of a saved city walk', () => {
  it('TCHG-EDIT-MCP-001: an edit is prepared with the router asked once, the station marked edited', async () => {
    const f = await walk();
    const changes: TourChange[] = [{ op: 'edit', key: 'walk-market', stay_minutes: 45, importance: 'must' }];
    const proposal = read(
      await mcp.prepareTourChange({ tripId: f.trip.id, placeId: f.place.id, changes }, ctx(f.user.id)),
    );
    expect(route).toHaveBeenCalledTimes(1);
    expect(proposal.stations_after[1]).toMatchObject({
      key: 'walk-market',
      change: 'edited',
      stay_minutes: 45,
      importance: 'must',
    });
    expect(proposal.effects.stays.change_minutes_known).toBe(25);
  });

  it('TCHG-EDIT-MCP-002: edits alone keep the saved line with its heights and the walking time, and record a step', async () => {
    const f = await walk();
    route.mockClear();
    const answer = await saved(f, [{ op: 'edit', key: 'walk-gate', name: 'Old gate', protected: true }]);
    expect(route).not.toHaveBeenCalled();
    expect(answer).toMatchObject({ saved: true, tour: { revision: 2, walking_minutes: 25, route_pending: false } });
    const place = await findRow(orm(), Places, { id: f.place.id });
    expect(JSON.parse(String(place?.route_geometry))).toEqual(LINE);
    const gate = await findRow(orm(), TourWaypoints, { place: f.place.id, station_key: 'walk-gate' });
    expect(gate?.name).toBe('Old gate');
    expect(Boolean(gate?.protected)).toBe(true);
    expect(await countRows(orm(), TourChangeSteps)).toBe(1);
  });

  it('TCHG-EDIT-MCP-003: a reverse plans the walk anew from its last station, keeping every key', async () => {
    const f = await walk();
    route.mockClear();
    const answer = await saved(f, [{ op: 'reverse' }]);
    expect(route).toHaveBeenCalledTimes(1);
    expect(answer.stations.map((station: { key: string }) => station.key)).toEqual([
      'walk-park',
      'walk-market',
      'walk-gate',
    ]);
  });

  it('TCHG-EDIT-MCP-004: a close_loop adds the way back, which no station counts', async () => {
    const f = await walk();
    const answer = await saved(f, [{ op: 'close_loop' }]);
    expect(answer.stations).toHaveLength(3);
    const points = await findRows(orm(), TourWaypoints, { place: f.place.id });
    expect(points).toHaveLength(4);
    expect(points.find((point) => point.sequence === 3)).toMatchObject({ lat: 48.1, lng: 11.5, role: 'end' });
  });
});
