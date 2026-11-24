/**
 * Unit tests for the search_places_via_plugins MCP tool (src/nest/plugins/
 * contributions/plugin-search.mcp.ts), the MCP counterpart of GET /api/plugin-search.
 */
import { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';
import { makeUser } from '../../helpers/factories/users';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetDatabase } from '../../helpers/reset-database';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { pluginsEnabled } = vi.hoisted(() => ({
  pluginsEnabled: vi.fn(() => true),
}));

// The admin kill switch reads live env; drive it from the test instead of the process.
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;

const providersOfMock = vi.spyOn(PluginHooks.prototype, 'providersOf');
const searchPlacesMock = vi.spyOn(PluginHooks.prototype, 'searchPlaces');

let orm: MikroORM;

beforeAll(async () => {
  orm = (await bootTestApp(realtime)).get(MikroORM);
});

beforeEach(async () => {
  await resetDatabase(orm);
  broadcastMock.mockClear();
  pluginsEnabled.mockReturnValue(true);
  providersOfMock.mockReset().mockReturnValue([]);
  searchPlacesMock.mockReset().mockResolvedValue([]);
});

afterAll(async () => {
  await (await bootTestApp(realtime)).close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: false, scopes: null });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

interface PlacesPayload {
  places: { osm_id: string; name: string; rating: number | null; pluginId: string; source: string }[];
}

const call = async (h: McpHarness, args: Record<string, unknown>) =>
  h.client.callTool({ name: 'search_places_via_plugins', arguments: args });

describe('Tool: search_places_via_plugins', () => {
  it('returns what the providers found, with the rating open data cannot carry', async () => {
    const { user } = await makeUser(orm);
    providersOfMock.mockReturnValue(['guide']);
    searchPlacesMock.mockResolvedValue([
      { id: 'h1', name: 'Hotel Bellevue', lat: 46.5, lng: 6.6, rating: 4.6, address: 'Lakeside 1' },
    ]);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel lausanne' })) as PlacesPayload;
      expect(payload.places).toHaveLength(1);
      expect(payload.places[0]).toMatchObject({
        osm_id: 'plugin:guide:h1',
        name: 'Hotel Bellevue',
        rating: 4.6,
        pluginId: 'guide',
        source: 'plugin:guide',
      });
      expect(providersOfMock).toHaveBeenCalledWith('searchProvider');
      expect(searchPlacesMock).toHaveBeenCalledWith(
        'guide',
        { query: 'hotel lausanne', limit: 10, lang: undefined, near: undefined },
        user.id,
      );
    });
  });

  it('passes the bias and the limit through, and refuses a coordinate off the globe', async () => {
    const { user } = await makeUser(orm);
    providersOfMock.mockReturnValue(['guide']);

    await withHarness(user.id, async (h) => {
      await call(h, { query: 'hotel', near: { lat: 46.5, lng: 6.6 }, lang: 'fr', limit: 3 });
      expect(searchPlacesMock).toHaveBeenLastCalledWith(
        'guide',
        { query: 'hotel', limit: 3, lang: 'fr', near: { lat: 46.5, lng: 6.6 } },
        user.id,
      );

      // The schema accepts any number, so the range check still has to happen here.
      await call(h, { query: 'hotel', near: { lat: 91, lng: 6.6 } });
      expect(searchPlacesMock).toHaveBeenLastCalledWith(
        'guide',
        { query: 'hotel', limit: 10, lang: undefined, near: undefined },
        user.id,
      );
    });
  });

  it('answers with an empty list when no plugin provides an index, without asking one', async () => {
    const { user } = await makeUser(orm);
    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel' })) as PlacesPayload;
      expect(payload.places).toEqual([]);
      expect(searchPlacesMock).not.toHaveBeenCalled();
    });
  });

  it('answers with an empty list while the plugin runtime is switched off', async () => {
    const { user } = await makeUser(orm);
    pluginsEnabled.mockReturnValue(false);
    providersOfMock.mockReturnValue(['guide']);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel' })) as PlacesPayload;
      expect(payload.places).toEqual([]);
      expect(providersOfMock).not.toHaveBeenCalled();
    });
  });

  it('skips a provider that fails and still returns the other one', async () => {
    const { user } = await makeUser(orm);
    providersOfMock.mockReturnValue(['broken', 'guide']);
    searchPlacesMock.mockImplementation(async (pluginId: string) => {
      if (pluginId === 'broken') throw new Error('timed out');
      return [{ id: 'h1', name: 'Hotel Bellevue', lat: 46.5, lng: 6.6 }];
    });

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel' })) as PlacesPayload;
      expect(payload.places.map((p) => p.pluginId)).toEqual(['guide']);
    });
  });
});
