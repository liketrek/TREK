/**
 * The read tools that declare an outputSchema, on a trip seeded the way a busy
 * one looks: each answers with `structuredContent` equal to the JSON of its text
 * (the SDK client has already checked it against the advertised schema by the
 * time the call returns), and no answer passes the 60 KB a host is asked to
 * render inline.
 */
import { ADDON_IDS } from '../../src/addons';
import { makeBudgetItem } from '../helpers/factories/budget';
import { makePackingItem } from '../helpers/factories/packing';
import { makePlace } from '../helpers/factories/places';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTodoItem } from '../helpers/factories/todos';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createMcpHarness, type McpHarness } from '../helpers/mcp-harness';
import { bootTestApp } from '../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** The most one structured answer may weigh. */
const MAX_STRUCTURED_BYTES = 60 * 1024;
const PLACES = 60;
const PACKING_ITEMS = 120;
const TODOS = 60;
const BUDGET_ITEMS = 60;

let harness: McpHarness;
let tripId: number;

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

beforeAll(async () => {
  const orm = (await bootTestApp()).get(MikroORM);
  await Promise.all(Object.values(ADDON_IDS).map((id) => setAddonEnabled(orm, id, true)));
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { start_date: '2026-12-01', end_date: '2026-12-10', currency: 'EUR' });
  tripId = trip.id;
  await Promise.all([
    ...range(PLACES).map((i) =>
      makePlace(orm, tripId, { name: `Place ${i}`, lat: 38.7 + i / 1000, lng: -9.1, address: `Rua ${i}, Lisboa` }),
    ),
    ...range(PACKING_ITEMS).map((i) => makePackingItem(orm, tripId, { name: `Item ${i}`, category: `Bag ${i % 8}` })),
    ...range(TODOS).map((i) => makeTodoItem(orm, tripId, { name: `Todo ${i}` })),
    ...range(BUDGET_ITEMS).map((i) => makeBudgetItem(orm, tripId, { name: `Cost ${i}`, total_price: i * 10 })),
  ]);
  harness = await createMcpHarness({ userId: user.id, scopes: null });
}, 120_000);

afterAll(async () => {
  await harness?.cleanup();
});

describe('structured output of the read tools', () => {
  it.each([
    ['list_trips', {}],
    ['list_places', {}],
    ['list_packing_items', {}],
    ['list_todos', {}],
    ['list_budget_items', {}],
    ['get_budget_per_person', {}],
    ['list_collab_polls', {}],
  ] as const)('STRUCT-001 %s answers structuredContent equal to its text, under 60 KB', async (name, args) => {
    const result = (await harness.client.callTool({
      name,
      arguments: name === 'list_trips' ? args : { tripId, ...args },
    })) as { isError?: boolean; content: Array<{ text: string }>; structuredContent?: unknown };
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual(JSON.parse(result.content[0].text));
    expect(Buffer.byteLength(JSON.stringify(result.structuredContent))).toBeLessThan(MAX_STRUCTURED_BYTES);
  });

  it('STRUCT-002: the seeded rows are all in the answers', async () => {
    const places = (await harness.client.callTool({ name: 'list_places', arguments: { tripId } })) as {
      structuredContent: { places: unknown[] };
    };
    const packing = (await harness.client.callTool({ name: 'list_packing_items', arguments: { tripId } })) as {
      structuredContent: { items: unknown[] };
    };
    expect(places.structuredContent.places).toHaveLength(PLACES);
    expect(packing.structuredContent.items).toHaveLength(PACKING_ITEMS);
  });

  it('STRUCT-003: tools/list advertises an output schema for each of them, without a closed object', async () => {
    const tools = (await harness.client.listTools()).tools.filter((t) => t.outputSchema);
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        'autocomplete_place',
        'get_budget_per_person',
        'get_notification_preferences',
        'get_place',
        'get_weather',
        'list_budget_items',
        'list_collab_polls',
        'list_day_notes',
        'list_days',
        'list_packing_items',
        'list_places',
        'list_todos',
        'list_trip_photos',
        'list_trips',
        'propose_paddle_route',
        'propose_ski_route',
        'search_place',
      ].sort(),
    );
    for (const tool of tools) expect(JSON.stringify(tool.outputSchema)).not.toContain('"additionalProperties":false');
  });
});
