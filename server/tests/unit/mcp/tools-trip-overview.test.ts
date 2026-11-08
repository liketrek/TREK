/**
 * get_trip_overview: a trip in a few lines for the overview view. The trip,
 * how much it holds, and a week of days from today on (or from the first).
 */
import { Days } from '../../../src/db/entities/Days.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { TripReadModelService } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { nextDays } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { makeReservation } from '../../helpers/factories/reservations';
import { findRows, updateRows } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';
import { TRIP_OVERVIEW_DAY_LIMIT, type TripOverviewOutput } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let orm: MikroORM;
let overviews: TripReadModelService;
let userId: number;
let harness: McpHarness;

beforeAll(async () => {
  const app = await bootTestApp();
  orm = app.get(MikroORM);
  overviews = app.get(TripReadModelService);
  userId = (await makeUser(orm)).user.id;
  harness = await createMcpHarness({ userId });
});

afterAll(async () => {
  await harness?.cleanup();
});

const call = (tripId: number) => harness.client.callTool({ name: 'get_trip_overview', arguments: { tripId } });

describe('nextDays', () => {
  const days = Array.from({ length: 10 }, (_, i) => ({ id: i, date: `2027-05-${String(10 + i).padStart(2, '0')}` }));

  it('TOVER-001: starts at today while the trip is under way, a week of days', () => {
    expect(nextDays(days, '2027-05-12').map((d) => d.id)).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it('TOVER-002: starts at the first day for a trip ahead, behind, or without dates', () => {
    expect(nextDays(days, '2027-01-01')[0].id).toBe(0);
    expect(nextDays(days, '2030-01-01')[0].id).toBe(0);
    expect(nextDays([{ id: 1, date: null }], '2027-01-01').map((d) => d.id)).toEqual([1]);
    expect(nextDays(days, '2027-01-01')).toHaveLength(TRIP_OVERVIEW_DAY_LIMIT);
  });
});

describe('Tool: get_trip_overview', () => {
  it('TOVER-003: counts what the trip holds and the stops of each day', async () => {
    const trip = await makeTrip(orm, userId, { title: 'Azores', start_date: '2099-05-12', end_date: '2099-05-14' });
    const [first] = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' });
    const place = await makePlace(orm, trip.id);
    await makePlace(orm, trip.id);
    await makeDayAssignment(orm, first.id, place.id);
    await makeReservation(orm, trip.id);
    const result = await call(trip.id);
    expect(result.isError).toBeFalsy();
    const overview = parseToolResult(result) as TripOverviewOutput;
    expect(overview.trip).toMatchObject({ id: trip.id, title: 'Azores', start_date: '2099-05-12', is_archived: 0 });
    expect(overview.counts).toEqual({ days: 3, places: 2, reservations: 1, members: 1 });
    expect(overview.days.map((d) => d.stops)).toEqual([1, 0, 0]);
    expect(result.structuredContent).toEqual(overview);
    expect(result._meta).toEqual({ 'trek/appUrl': expect.stringMatching(/^https?:\/\//) });
  });

  it('TOVER-004: refuses a trip the caller cannot see', async () => {
    const other = await makeTrip(orm, (await makeUser(orm)).user.id);
    expect((await call(other.id)).isError).toBe(true);
  });

  it('TOVER-005: reads an archived trip without dates or currency as archived, undated and in euros', async () => {
    const trip = await makeTrip(orm, userId, { start_date: null, end_date: null });
    await updateRows(orm, Trips, { id: trip.id }, { is_archived: 1, currency: '' });
    const overview = parseToolResult(await call(trip.id)) as TripOverviewOutput;
    expect(overview.trip).toMatchObject({ start_date: null, end_date: null, currency: 'EUR', is_archived: 1 });
    expect(overview.days).toEqual([]);
  });

  it('TOVER-006: has no overview of a trip that is gone', async () => {
    expect(await withRequestContext(orm, () => overviews.getTripOverview(987654321))).toBeNull();
  });
});
