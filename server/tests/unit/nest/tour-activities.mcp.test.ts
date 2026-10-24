/**
 * TourActivitiesMcp (ACT-01): assigning a recorded track to a tour and taking
 * it off over MCP, through the same service and the same checks as REST
 * (trip access, then 'place_edit'), and get_tour_plan reading what the
 * recordings measure. Answers leave the recorded line out. The suite takes its
 * subject from the container over a snapshot test db.
 */
import { TourActivities } from '../../../src/db/entities/TourActivities.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { TourActivitiesMcp } from '../../../src/nest/tours/tour-activities.mcp';
import { ToursMcp } from '../../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows } from '../../helpers/factories/rows';
import { makeTour, makeTourActivity } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let mcp: TourActivitiesMcp;
let toursMcp: ToursMcp;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(TourActivitiesMcp);
  toursMcp = t.get(ToursMcp);
});
beforeEach(() => resetTestDb(db));
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

const LINE = JSON.stringify([
  [47, 11, 600],
  [47.01, 11, 700],
]);

async function fixture() {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const day = await makeDay(orm(), trip.id, { day_number: 1 });
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge', route_geometry: LINE });
  await makeTour(orm(), hike.id);
  const onDay = await makeDayAssignment(orm(), day.id, hike.id);
  const watch = await makePlace(orm(), trip.id, { name: 'Watch export', route_geometry: LINE });
  await makeTour(orm(), watch.id, { origin: 'gpx', origin_file_name: 'morning.gpx' });
  return { user, outsider, trip, day, hike, onDay, watch };
}

describe('TourActivitiesMcp', () => {
  it('ACT-MCP-001: assign_tour_track assigns the chosen recording and answers it without its line', async () => {
    const { user, trip, day, hike, onDay, watch } = await fixture();
    const result = read(
      await mcp.assignTourTrack(
        { tripId: trip.id, placeId: hike.id, track_place_id: watch.id, assignment_id: onDay.id },
        ctx(user.id),
      ),
    );
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toMatchObject({
      assignment_id: onDay.id,
      day_id: day.id,
      track: { place_id: watch.id, file_name: 'morning.gpx' },
      metrics: { elevation_gain_m: 100, elapsed_minutes: null, started_at: null },
    });
    expect(result.activities[0].geometry).toBeUndefined();

    // get_tour_plan reads the same, also without the line.
    const plan = read(await toursMcp.getTourPlan({ tripId: trip.id, placeId: hike.id }, ctx(user.id)));
    expect(plan.activities[0]).toMatchObject({ track: { place_id: watch.id } });
    expect(plan.activities[0].geometry).toBeUndefined();
  });

  it('ACT-MCP-002: unassign_tour_track takes it off again; one that is not there is not found', async () => {
    const { user, trip, hike, watch } = await fixture();
    const activity = await makeTourActivity(orm(), hike.id, watch.id);
    const result = read(
      await mcp.unassignTourTrack({ tripId: trip.id, placeId: hike.id, activityId: activity.id }, ctx(user.id)),
    );
    expect(result.activities).toEqual([]);
    expect(
      read(await mcp.unassignTourTrack({ tripId: trip.id, placeId: hike.id, activityId: activity.id }, ctx(user.id))),
    ).toEqual({ error: 'Recorded track not found.' });
  });

  it('ACT-MCP-003: refuses a trip the user cannot open and a track that is not of the trip, as REST does', async () => {
    const { user, outsider, trip, hike, watch } = await fixture();
    const input = { tripId: trip.id, placeId: hike.id, track_place_id: watch.id, assignment_id: null };
    expect(read(await mcp.assignTourTrack(input, ctx(outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    expect(
      read(await mcp.unassignTourTrack({ tripId: trip.id, placeId: hike.id, activityId: 1 }, ctx(outsider.id))),
    ).toEqual({ error: 'Trip not found or access denied.' });
    expect(read(await mcp.assignTourTrack({ ...input, track_place_id: 999_999 }, ctx(user.id)))).toEqual({
      error: 'Tour or recorded track not found.',
    });
    expect(await countRows(orm(), TourActivities)).toBe(0);
  });

  it('ACT-MCP-004: without place_edit nothing is assigned or taken off', async () => {
    const { user, trip, hike, watch } = await fixture();
    const activity = await makeTourActivity(orm(), hike.id, watch.id);
    const denied = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    const assigned = await mcp.assignTourTrack(
      { tripId: trip.id, placeId: hike.id, track_place_id: watch.id, assignment_id: null },
      ctx(user.id),
    );
    const removed = await mcp.unassignTourTrack(
      { tripId: trip.id, placeId: hike.id, activityId: activity.id },
      ctx(user.id),
    );
    expect(assigned.isError).toBe(true);
    expect(removed.isError).toBe(true);
    expect(denied).toHaveBeenCalledWith('place_edit', trip.id, user.id);
    expect(await countRows(orm(), TourActivities)).toBe(1);
    denied.mockRestore();
  });
});
