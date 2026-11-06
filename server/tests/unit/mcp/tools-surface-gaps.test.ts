/**
 * The tools that close the gaps between REST and MCP (A7): reads a model had to
 * take from a resource or from get_trip_summary, and writes the app could do and
 * a model could not. Each answers what its route answers, behind the same trip
 * access and permission.
 */
import { ADDON_IDS } from '../../../src/addons';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { TripFiles } from '../../../src/db/entities/TripFiles.entity';
import { makeBudgetItem } from '../../helpers/factories/budget';
import { makeTripFile } from '../../helpers/factories/files';
import { makeDayNote } from '../../helpers/factories/itinerary';
import { makePackingItem } from '../../helpers/factories/packing';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, findRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

type ToolAnswer = { isError?: boolean; content: Array<{ text: string }>; structuredContent?: unknown };

let orm: MikroORM;
let userId: number;
let strangerId: number;
let harness: McpHarness;
let stranger: McpHarness;

beforeAll(async () => {
  orm = (await bootTestApp()).get(MikroORM);
  await Promise.all([ADDON_IDS.BUDGET, ADDON_IDS.PACKING].map((id) => setAddonEnabled(orm, id, true)));
  userId = (await makeUser(orm)).user.id;
  strangerId = (await makeUser(orm)).user.id;
  harness = await createMcpHarness({ userId });
  stranger = await createMcpHarness({ userId: strangerId });
});

afterAll(async () => {
  await harness?.cleanup();
  await stranger?.cleanup();
});

const call = (h: McpHarness, name: string, args: Record<string, unknown>) =>
  h.client.callTool({ name, arguments: args }) as Promise<ToolAnswer>;

describe('read tools', () => {
  it('GAP-001: list_days answers the days with their notes, structured too; a stranger gets nothing', async () => {
    const trip = await makeTrip(orm, userId);
    const day = await makeDay(orm, trip.id, { day_number: 1, title: 'Arrival' });
    await makeDayNote(orm, day.id, trip.id, { text: 'Check in after 3' });
    const answer = await call(harness, 'list_days', { tripId: trip.id });
    const body = parseToolResult(answer) as { days: Array<{ id: number; notes_items?: Array<{ text: string }> }> };
    const listed = body.days.find((d) => d.id === day.id);
    expect(listed?.notes_items?.map((n) => n.text)).toEqual(['Check in after 3']);
    expect(answer.structuredContent).toEqual(body);
    expect((await call(stranger, 'list_days', { tripId: trip.id })).isError).toBe(true);
  });

  it('GAP-002: list_day_notes answers one day, and refuses a day of another trip', async () => {
    const trip = await makeTrip(orm, userId);
    const other = await makeTrip(orm, userId);
    const day = await makeDay(orm, trip.id, { day_number: 1 });
    const foreignDay = await makeDay(orm, other.id, { day_number: 1 });
    await makeDayNote(orm, day.id, trip.id, { text: 'Museum closes at 5' });
    const body = parseToolResult(await call(harness, 'list_day_notes', { tripId: trip.id, dayId: day.id })) as {
      notes: Array<{ text: string }>;
    };
    expect(body.notes.map((n) => n.text)).toEqual(['Museum closes at 5']);
    const refused = await call(harness, 'list_day_notes', { tripId: trip.id, dayId: foreignDay.id });
    expect(refused.isError).toBe(true);
    expect(refused.content[0].text).toBe('Day not found.');
  });

  it('GAP-003: get_place answers one place of the trip, and no place of another', async () => {
    const trip = await makeTrip(orm, userId);
    const other = await makeTrip(orm, userId);
    const place = await makePlace(orm, trip.id, { name: 'Belém Tower' });
    const foreign = await makePlace(orm, other.id);
    const body = parseToolResult(await call(harness, 'get_place', { tripId: trip.id, placeId: place.id })) as {
      place: { id: number; name: string };
    };
    expect(body.place).toMatchObject({ id: place.id, name: 'Belém Tower' });
    expect((await call(harness, 'get_place', { tripId: trip.id, placeId: foreign.id })).isError).toBe(true);
    expect((await call(stranger, 'get_place', { tripId: trip.id, placeId: place.id })).isError).toBe(true);
  });

  it('GAP-004: autocomplete_place is listed with its output schema and refuses an empty input', async () => {
    const tool = (await harness.client.listTools()).tools.find((t) => t.name === 'autocomplete_place');
    expect(tool?.outputSchema).toBeDefined();
    expect(tool?.annotations?.readOnlyHint).toBe(true);
    const refused = await harness.client
      .callTool({ name: 'autocomplete_place', arguments: { input: '' } })
      .then((r) => (r as ToolAnswer).isError)
      .catch(() => true);
    expect(refused).toBe(true);
  });
});

describe('file tools', () => {
  it('GAP-005: star_trip_file sets the star, and setting it twice leaves it set', async () => {
    const trip = await makeTrip(orm, userId);
    const file = await makeTripFile(orm, trip.id);
    await call(harness, 'star_trip_file', { tripId: trip.id, fileId: file.id, starred: true });
    await call(harness, 'star_trip_file', { tripId: trip.id, fileId: file.id, starred: true });
    expect((await findRow(orm, TripFiles, { id: file.id }))?.starred).toBe(1);
    await call(harness, 'star_trip_file', { tripId: trip.id, fileId: file.id, starred: false });
    expect((await findRow(orm, TripFiles, { id: file.id }))?.starred).toBe(0);
  });

  it('GAP-006: delete_trip_file trashes, restore_trip_file brings back, permanent removes from the trash only', async () => {
    const trip = await makeTrip(orm, userId);
    const file = await makeTripFile(orm, trip.id);
    // A live file is not in the trash, so it cannot be removed for good yet.
    const early = await call(harness, 'delete_trip_file', { tripId: trip.id, fileId: file.id, permanent: true });
    expect(early.content[0].text).toBe('File not found in trash.');
    await call(harness, 'delete_trip_file', { tripId: trip.id, fileId: file.id });
    expect((await findRow(orm, TripFiles, { id: file.id }))?.deleted_at).not.toBeNull();
    const restored = parseToolResult(
      await call(harness, 'restore_trip_file', { tripId: trip.id, fileId: file.id }),
    ) as {
      file: { id: number };
    };
    expect(restored.file.id).toBe(file.id);
    expect((await findRow(orm, TripFiles, { id: file.id }))?.deleted_at).toBeNull();
    await call(harness, 'delete_trip_file', { tripId: trip.id, fileId: file.id });
    await call(harness, 'delete_trip_file', { tripId: trip.id, fileId: file.id, permanent: true });
    expect(await countRows(orm, TripFiles, { id: file.id })).toBe(0);
  });

  it('GAP-007: a stranger can neither star, delete nor restore', async () => {
    const trip = await makeTrip(orm, userId);
    const file = await makeTripFile(orm, trip.id);
    const answers = await Promise.all(
      [
        ['star_trip_file', { starred: true }],
        ['delete_trip_file', {}],
        ['restore_trip_file', {}],
      ].map(([name, extra]) =>
        call(stranger, name as string, { tripId: trip.id, fileId: file.id, ...(extra as object) }),
      ),
    );
    expect(answers.map((a) => a.isError)).toEqual([true, true, true]);
    expect((await findRow(orm, TripFiles, { id: file.id }))?.starred).toBe(0);
  });
});

describe('budget, packing and notification tools', () => {
  it('GAP-008: reorder_budget_items sets the order list_budget_items answers in', async () => {
    const trip = await makeTrip(orm, userId);
    const a = await makeBudgetItem(orm, trip.id, { name: 'Hotel' });
    const b = await makeBudgetItem(orm, trip.id, { name: 'Ferry' });
    await call(harness, 'reorder_budget_items', { tripId: trip.id, orderedIds: [b.id, a.id] });
    const rows = await findRows(orm, BudgetItems, { trip: trip.id }, { sort_order: 'asc' });
    expect(rows.map((r) => r.id)).toEqual([b.id, a.id]);
    expect((await call(stranger, 'reorder_budget_items', { tripId: trip.id, orderedIds: [a.id] })).isError).toBe(true);
  });

  it('GAP-009: clone_packing_item copies an item for the caller', async () => {
    const trip = await makeTrip(orm, userId);
    const item = await makePackingItem(orm, trip.id, { name: 'Rain jacket' });
    const body = parseToolResult(await call(harness, 'clone_packing_item', { tripId: trip.id, itemId: item.id })) as {
      item: { id: number; name: string };
    };
    expect(body.item.name).toBe('Rain jacket');
    expect(body.item.id).not.toBe(item.id);
    const missing = await call(harness, 'clone_packing_item', { tripId: trip.id, itemId: 999_999 });
    expect(missing.content[0].text).toBe('Item not found.');
  });

  it('GAP-010: set_notification_preferences switches a cell that get_notification_preferences then reads', async () => {
    const before = parseToolResult(await call(harness, 'get_notification_preferences', {})) as {
      preferences: Record<string, Record<string, boolean>>;
      implemented_combos: Record<string, string[]>;
    };
    const [event, channels] = Object.entries(before.implemented_combos).find(([, c]) => c.length > 0) ?? [];
    expect(event).toBeDefined();
    const channel = (channels as string[])[0];
    const flipped = !before.preferences[event as string]?.[channel];
    await call(harness, 'set_notification_preferences', { preferences: { [event as string]: { [channel]: flipped } } });
    const after = parseToolResult(await call(harness, 'get_notification_preferences', {})) as typeof before;
    expect(after.preferences[event as string]?.[channel]).toBe(flipped);
  });
});

describe('trip photos', () => {
  it('GAP-011: the photo tools ride the Journey addon', async () => {
    const names = async () => {
      const session = await createMcpHarness({ userId });
      try {
        return (await session.client.listTools()).tools.map((t) => t.name);
      } finally {
        await session.cleanup();
      }
    };
    await setAddonEnabled(orm, ADDON_IDS.JOURNEY, true);
    expect(await names()).toEqual(expect.arrayContaining(['list_trip_photos', 'add_trip_photos']));
    await setAddonEnabled(orm, ADDON_IDS.JOURNEY, false);
    const without = await names();
    expect(without).not.toContain('list_trip_photos');
    expect(without).not.toContain('add_trip_photos');
  });
});
