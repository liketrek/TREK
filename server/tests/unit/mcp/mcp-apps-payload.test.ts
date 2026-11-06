/**
 * Every tool that draws a view answers with a `structuredContent` a host can
 * take whole: Claude hands the model the structured value in place of the
 * text, and caps a result at about 150 thousand characters. Measured on a
 * seeded trip, every view's result stays under 60 KB.
 */
import { ADDON_IDS } from '../../../src/addons';
import { McpAppsService } from '../../../src/nest/mcp-apps/mcp-apps.service';
import { makePlace } from '../../helpers/factories/places';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const MAX_STRUCTURED_BYTES = 60 * 1024;
const SEEDED_TRIPS = 12;

let harness: McpHarness;
let tripId: number;

/** The arguments each view's tool is measured with; a tool that draws a view and is missing here fails PAYLOAD-001. */
const argsFor = (): Record<string, Record<string, unknown>> => ({
  list_trips: { include_archived: true },
});

/** The trip-scoped tools get the seeded trip on top of their own arguments. */
const TRIP_SCOPED = new Set<string>([]);

beforeAll(async () => {
  const app = await bootTestApp();
  const orm = app.get(MikroORM);
  vi.spyOn(app.get(McpAppsService), 'html').mockReturnValue('<!doctype html>');
  await Promise.all(Object.values(ADDON_IDS).map((id) => setAddonEnabled(orm, id, true)));
  const userId = (await makeUser(orm)).user.id;
  const trips = await Promise.all(Array.from({ length: SEEDED_TRIPS }, () => makeTrip(orm, userId)));
  tripId = trips[0].id;
  await Promise.all(Array.from({ length: 5 }, (_, i) => makeDay(orm, tripId, { day_number: i + 1 })));
  await Promise.all(Array.from({ length: 20 }, () => makePlace(orm, tripId)));
  harness = await createMcpHarness({ userId });
});

afterAll(async () => {
  vi.restoreAllMocks();
  await harness?.cleanup();
});

describe('MCP Apps payloads', () => {
  it('PAYLOAD-001: every tool that draws a view answers under 60 KB of structured content', async () => {
    const tools = (await harness.client.listTools()).tools.filter((t) => t._meta?.ui);
    const args = argsFor();
    expect(tools.map((t) => t.name).sort()).toEqual(Object.keys(args).sort());
    const results = await Promise.all(
      tools.map(async (tool) => ({
        name: tool.name,
        result: await harness.client.callTool({ name: tool.name, arguments: TRIP_SCOPED.has(tool.name) ? { tripId, ...args[tool.name] } : args[tool.name] }),
      })),
    );
    for (const { name, result } of results) {
      expect(result.isError, name).toBeFalsy();
      const bytes = Buffer.byteLength(JSON.stringify(result.structuredContent ?? null));
      expect(bytes, name).toBeGreaterThan(2);
      expect(bytes, name).toBeLessThan(MAX_STRUCTURED_BYTES);
    }
  });
});
