/**
 * get_trip_map and get_day_plan, the two tools the B4 views draw: the trip's
 * located places a page at a time with the tiles the user's map settings name,
 * and one day's stops in their order. The map view's resource lets its sandbox
 * load exactly those tiles.
 */
import { ADDON_IDS } from '../../../src/addons';
import { Days } from '../../../src/db/entities/Days.entity';
import { McpAppsService } from '../../../src/nest/mcp-apps/mcp-apps.service';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { findRows } from '../../helpers/factories/rows';
import { setAddonEnabled, setUserSetting } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';
import { mcpAppUri, type DayPlanOutput, type TripMapOutput } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let orm: MikroORM;
let userId: number;
let harness: McpHarness;

beforeAll(async () => {
  const app = await bootTestApp();
  orm = app.get(MikroORM);
  vi.spyOn(app.get(McpAppsService), 'html').mockReturnValue('<!doctype html>');
  // The views are part of the MCP addon; the map's resource is served only while it is on.
  await setAddonEnabled(orm, ADDON_IDS.MCP, true);
  userId = (await makeUser(orm)).user.id;
  harness = await createMcpHarness({ userId });
});

afterAll(async () => {
  vi.restoreAllMocks();
  await harness?.cleanup();
});

const call = (name: string, args: Record<string, unknown>) => harness.client.callTool({ name, arguments: args });

describe('Tool: get_trip_map', () => {
  it('TMAP-001: pages through the located places and counts them all', async () => {
    const trip = await makeTrip(orm, userId);
    await Promise.all([0, 1, 2].map((i) => makePlace(orm, trip.id, { name: `P${i}`, lat: 38.7 + i / 100, lng: -9.1 })));
    await makePlace(orm, trip.id, { name: 'Nowhere', lat: null, lng: null });
    const first = parseToolResult(await call('get_trip_map', { tripId: trip.id, limit: 2 })) as TripMapOutput;
    expect(first).toMatchObject({ trip_id: trip.id, place_count: 3, offset: 0, next_offset: 2 });
    expect(first.places.map((p) => p.name)).toHaveLength(2);
    const rest = parseToolResult(await call('get_trip_map', { tripId: trip.id, offset: 2 })) as TripMapOutput;
    expect(rest).toMatchObject({ offset: 2, next_offset: null });
    expect([...first.places, ...rest.places].map((p) => p.name).sort()).toEqual(['P0', 'P1', 'P2']);
    expect(first.tiles.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  });

  it('TMAP-002: draws with the user’s own tiles and refuses a trip they cannot see', async () => {
    const trip = await makeTrip(orm, userId);
    await setUserSetting(
      orm,
      userId,
      'map_tile_url',
      JSON.stringify('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'),
    );
    const result = parseToolResult(await call('get_trip_map', { tripId: trip.id })) as TripMapOutput;
    expect(result.tiles).toEqual({
      url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors © CARTO',
      max_zoom: 19,
    });
    const view = await harness.client.readResource({ uri: mcpAppUri('trip-map') });
    expect(view.contents[0]._meta).toMatchObject({
      ui: { csp: { resourceDomains: [expect.any(String), 'https://a.basemaps.cartocdn.com'] } },
    });
    const stranger = await makeUser(orm);
    const theirs = await makeTrip(orm, stranger.user.id);
    expect((await call('get_trip_map', { tripId: theirs.id })).isError).toBe(true);
  });
});

describe('Tool: get_day_plan', () => {
  it('TDAY-001: lists the day’s stops in their order with their times', async () => {
    const trip = await makeTrip(orm, userId, { start_date: '2099-05-12', end_date: '2099-05-13' });
    const [day] = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' });
    const late = await makePlace(orm, trip.id, { name: 'Late', place_time: '18:00' });
    const early = await makePlace(orm, trip.id, {
      name: 'Early',
      place_time: '09:00',
      end_time: '10:00',
      address: 'Rua 1',
    });
    await makeDayAssignment(orm, day.id, early.id, { order_index: 0 });
    await makeDayAssignment(orm, day.id, late.id, { order_index: 1 });
    const result = parseToolResult(await call('get_day_plan', { tripId: trip.id, dayId: day.id })) as DayPlanOutput;
    expect(result.day).toEqual({ id: day.id, day_number: 1, date: '2099-05-12', title: null });
    expect(result.stops.map((s) => [s.name, s.time, s.end_time, s.address])).toEqual([
      ['Early', '09:00', '10:00', 'Rua 1'],
      ['Late', '18:00', null, null],
    ]);
  });

  it('TDAY-002: refuses a day of another trip and a trip the user cannot see', async () => {
    const dated = { start_date: '2099-06-01', end_date: '2099-06-02' };
    const trip = await makeTrip(orm, userId, dated);
    const other = await makeTrip(orm, userId, dated);
    const [otherDay] = await findRows(orm, Days, { trip: other.id });
    const wrong = await call('get_day_plan', { tripId: trip.id, dayId: otherDay.id });
    expect(wrong.isError).toBe(true);
    const stranger = await makeUser(orm);
    const theirs = await makeTrip(orm, stranger.user.id, dated);
    const [theirDay] = await findRows(orm, Days, { trip: theirs.id });
    expect((await call('get_day_plan', { tripId: theirs.id, dayId: theirDay.id })).isError).toBe(true);
  });
});
