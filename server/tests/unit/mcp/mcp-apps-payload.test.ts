/**
 * Every tool that draws a view answers with a `structuredContent` a host can
 * take whole: Claude hands the model the structured value in place of the
 * text, and caps a result at about 150 thousand characters. Measured on a
 * seeded trip, every view's result stays under 60 KB.
 */
import { ADDON_IDS } from '../../../src/addons';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { McpAppsService } from '../../../src/nest/mcp-apps/mcp-apps.service';
import { WeatherService } from '../../../src/nest/weather/weather.service';
import { makeBudgetItem } from '../../helpers/factories/budget';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePackingItem } from '../../helpers/factories/packing';
import { makePlace } from '../../helpers/factories/places';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTodoItem } from '../../helpers/factories/todos';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const MAX_STRUCTURED_BYTES = 60 * 1024;
const FORECAST = {
  temp: 21,
  temp_max: 24,
  temp_min: 15,
  main: 'Clouds',
  description: 'broken clouds',
  type: 'forecast',
  hourly: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    temp: 18,
    precipitation: 0,
    precipitation_probability: 10,
    main: 'Clouds',
    wind: 10,
    humidity: 70,
  })),
};
const SEARCH = {
  source: 'openstreetmap',
  places: Array.from({ length: 10 }, (_, i) => ({
    name: `Place ${i}`,
    address: `Rua ${i}, Lisboa`,
    lat: 38.7 + i / 100,
    lng: -9.1,
    osm_id: `node:${i}`,
  })),
};
const SEEDED_TRIPS = 12;

let harness: McpHarness;
let tripId: number;
let dayId: number;

/** The arguments each view's tool is measured with; a tool that draws a view and is missing here fails PAYLOAD-001. */
const argsFor = (): Record<string, Record<string, unknown>> => ({
  list_trips: { include_archived: true },
  get_trip_overview: {},
  list_packing_items: {},
  get_weather: { lat: 38.7, lng: -9.1, date: '2027-05-12' },
  search_place: { query: 'Lisbon cafe' },
  list_budget_items: {},
  get_budget_per_person: {},
  list_todos: {},
  get_trip_map: {},
  get_day_plan: { dayId },
  list_collab_polls: {},
});

/** The trip-scoped tools get the seeded trip on top of their own arguments. */
const TRIP_SCOPED = new Set<string>([
  'get_trip_overview',
  'list_packing_items',
  'list_budget_items',
  'get_budget_per_person',
  'list_todos',
  'get_trip_map',
  'get_day_plan',
  'list_collab_polls',
]);

beforeAll(async () => {
  const app = await bootTestApp();
  const orm = app.get(MikroORM);
  vi.spyOn(app.get(McpAppsService), 'html').mockReturnValue('<!doctype html>');
  // The forecast comes from Open-Meteo; the size is about what TREK sends, so it answers a fixed day here.
  vi.spyOn(app.get(WeatherService), 'get').mockResolvedValue(FORECAST);
  vi.spyOn(app.get(MapsService), 'searchPlaces').mockResolvedValue(SEARCH);
  await Promise.all(Object.values(ADDON_IDS).map((id) => setAddonEnabled(orm, id, true)));
  const userId = (await makeUser(orm)).user.id;
  const trips = await Promise.all(Array.from({ length: SEEDED_TRIPS }, () => makeTrip(orm, userId)));
  tripId = trips[0].id;
  const days = await Promise.all(Array.from({ length: 5 }, (_, i) => makeDay(orm, tripId, { day_number: i + 1 })));
  dayId = days[0].id;
  const places = await Promise.all(
    Array.from({ length: 20 }, (_, i) => makePlace(orm, tripId, { lat: 38.7 + i / 100, lng: -9.1 })),
  );
  await Promise.all(places.slice(0, 8).map((place) => makeDayAssignment(orm, dayId, place.id)));
  await Promise.all(Array.from({ length: 60 }, () => makePackingItem(orm, tripId)));
  await Promise.all(Array.from({ length: 40 }, (_, i) => makeBudgetItem(orm, tripId, { total_price: (i + 1) * 10 })));
  await Promise.all(Array.from({ length: 40 }, () => makeTodoItem(orm, tripId)));
  harness = await createMcpHarness({ userId });
});

afterAll(async () => {
  vi.restoreAllMocks();
  await harness?.cleanup();
});

describe('MCP Apps payloads', () => {
  it('PAYLOAD-001: every tool that draws a view answers under 60 KB of structured content', async () => {
    const tools = (await harness.client.listTools()).tools.filter(
      (t) => (t._meta?.ui as { resourceUri?: string } | undefined)?.resourceUri,
    );
    const args = argsFor();
    expect(tools.map((t) => t.name).sort()).toEqual(Object.keys(args).sort());
    const results = await Promise.all(
      tools.map(async (tool) => ({
        name: tool.name,
        result: await harness.client.callTool({
          name: tool.name,
          arguments: TRIP_SCOPED.has(tool.name) ? { tripId, ...args[tool.name] } : args[tool.name],
        }),
      })),
    );
    for (const { name, result } of results) {
      expect(result.isError, name).toBeFalsy();
      const bytes = Buffer.byteLength(JSON.stringify(result.structuredContent ?? null));
      expect(bytes, name).toBeGreaterThan(2);
      expect(bytes, name).toBeLessThan(MAX_STRUCTURED_BYTES);
    }
  });

  it('PAYLOAD-002: every tool a view calls is open to the app, under ChatGPT’s key too', async () => {
    const tools = new Map<string, Record<string, unknown>>(
      (await harness.client.listTools()).tools.map((t) => [t.name, t._meta ?? {}]),
    );
    for (const name of [
      'toggle_packing_item',
      'toggle_todo',
      'reorder_day_assignments',
      'vote_collab_poll',
      'get_trip_map',
      'list_budget_items',
      'get_budget_per_person',
    ]) {
      const meta = tools.get(name);
      expect(meta, name).toBeDefined();
      expect((meta?.ui as { visibility?: string[] }).visibility, name).toEqual(['model', 'app']);
      expect(meta?.['openai/widgetAccessible'], name).toBe(true);
    }
  });
});
