/**
 * The five road-trip MCP tools.
 *
 * They had no test at all, and the shared harness seeds the addon disabled, so
 * `when: roadtripAddonOn` kept them from ever attaching: the handler bodies had
 * never run. What matters here is the same thing the REST e2e pins, because the
 * repo requires the two surfaces to move together: the addon gate, the
 * day-belongs-to-this-trip check, the `day_edit` permission, and the cross-trip
 * track check on the batch tool.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: unknown, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: unknown, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createPlace } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { ADDON_IDS } from '../../../src/addons';
import { addTripMember } from '../../helpers/factories';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { DEMO_EMAIL_PRIMARY } from '../../../src/nest/common/demo';

// The permissions cache is module-scoped, so a write through any instance is
// what the tool's own check reads back.
const savePermissions = new PermissionsService(new DatabaseService(testDb)).savePermissions.bind(
  new PermissionsService(new DatabaseService(testDb)),
);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  // resetTestDb leaves the addons table alone, so each run restates it. The
  // addon ships disabled, which is why the tools were invisible before.
  setAddonEnabled(testDb, ADDON_IDS.ROADTRIP, true);
});

afterAll(() => { testDb.close(); });

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false, scopes: null });
  try { await fn(h); } finally { await h.cleanup(); }
}

/** A trip with one day, plus a place carrying a route geometry to use as a track. */
function scenario() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id, { title: 'Norway' });
  const day = createDay(testDb, trip.id, { day_number: 1 });
  const track = createPlace(testDb, trip.id, { name: 'Scenic' });
  testDb.prepare("UPDATE places SET route_geometry = '[[1,2],[3,4]]' WHERE id = ?").run(track.id);
  return { user, trip, day, track };
}

describe('road-trip MCP tools', () => {
  it('MCP-ROADTRIP-001: the five tools are gone while the addon is off', async () => {
    const { user } = createUser(testDb);
    setAddonEnabled(testDb, ADDON_IDS.ROADTRIP, false);

    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      for (const tool of ['list_route_vias', 'add_route_via', 'add_route_vias', 'reanchor_route_vias', 'remove_route_via']) {
        expect(names, tool).not.toContain(tool);
      }
    });
  });

  it('MCP-ROADTRIP-002: and there while it is on', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      for (const tool of ['list_route_vias', 'add_route_via', 'add_route_vias', 'reanchor_route_vias', 'remove_route_via']) {
        expect(names, tool).toContain(tool);
      }
    });
  });

  it('MCP-ROADTRIP-003: adding a via, then reading it back for the day and for the trip', async () => {
    const { user, trip, day } = scenario();

    await withHarness(user.id, async (h) => {
      const added = await h.client.callTool({
        name: 'add_route_via',
        arguments: { tripId: trip.id, dayId: day.id, after_order_index: 0, lat: 53, lng: 10 },
      });
      expect(added.isError).toBeFalsy();
      expect((parseToolResult(added) as { via: { day_id: number } }).via).toMatchObject({ day_id: day.id, lat: 53 });

      const forDay = parseToolResult(await h.client.callTool({
        name: 'list_route_vias',
        arguments: { tripId: trip.id, dayId: day.id },
      })) as { vias: unknown[] };
      expect(forDay.vias).toHaveLength(1);

      // Without a day, the answer covers the whole trip and carries the tracks
      // alongside, which is the shape the client reads on every load.
      const forTrip = parseToolResult(await h.client.callTool({
        name: 'list_route_vias',
        arguments: { tripId: trip.id },
      })) as { vias: unknown[]; tracks: unknown[] };
      expect(forTrip.vias).toHaveLength(1);
      expect(forTrip.tracks).toEqual([]);
    });
  });

  it('MCP-ROADTRIP-004: a day from another trip is refused on every tool', async () => {
    // The same check the REST routes make, which is what the repo means by the
    // two surfaces moving together.
    const { user, trip } = scenario();
    const other = createTrip(testDb, user.id, { title: 'Elsewhere' });
    const otherDay = createDay(testDb, other.id, { day_number: 1 });

    await withHarness(user.id, async (h) => {
      const calls: [string, Record<string, unknown>][] = [
        ['list_route_vias', { tripId: trip.id, dayId: otherDay.id }],
        ['add_route_via', { tripId: trip.id, dayId: otherDay.id, after_order_index: 0, lat: 53, lng: 10 }],
        ['add_route_vias', { tripId: trip.id, dayId: otherDay.id, vias: [{ after_order_index: 0, lat: 53, lng: 10 }] }],
        ['reanchor_route_vias', { tripId: trip.id, dayId: otherDay.id, vias: [] }],
        ['remove_route_via', { tripId: trip.id, dayId: otherDay.id, viaId: 1 }],
      ];
      for (const [name, args] of calls) {
        const res = await h.client.callTool({ name, arguments: args });
        expect(res.isError, name).toBeTruthy();
      }
      expect(testDb.prepare('SELECT COUNT(*) c FROM roadtrip_vias').get()).toEqual({ c: 0 });
    });
  });

  it('MCP-ROADTRIP-005: a trip the caller cannot reach is refused', async () => {
    const { user } = createUser(testDb);
    const stranger = createUser(testDb, { email: 'other@example.test' });
    const theirs = createTrip(testDb, stranger.user.id, { title: 'Theirs' });
    const theirDay = createDay(testDb, theirs.id, { day_number: 1 });

    await withHarness(user.id, async (h) => {
      const res = await h.client.callTool({
        name: 'add_route_via',
        arguments: { tripId: theirs.id, dayId: theirDay.id, after_order_index: 0, lat: 53, lng: 10 },
      });
      expect(res.isError).toBeTruthy();
    });
  });

  it('MCP-ROADTRIP-006: a chain lands in one call and records its track', async () => {
    const { user, trip, day, track } = scenario();

    await withHarness(user.id, async (h) => {
      const res = await h.client.callTool({
        name: 'add_route_vias',
        arguments: {
          tripId: trip.id,
          dayId: day.id,
          vias: [{ after_order_index: 0, lat: 53, lng: 10 }, { after_order_index: 0, lat: 53.5, lng: 10.5 }],
          track: { place_id: track.id, stray_km: 1.5 },
        },
      });
      expect(res.isError).toBeFalsy();
      expect((parseToolResult(res) as { vias: unknown[] }).vias).toHaveLength(2);

      const all = parseToolResult(await h.client.callTool({
        name: 'list_route_vias',
        arguments: { tripId: trip.id },
      })) as { tracks: { day_id: number; place_id: number; stray_km: number }[] };
      expect(all.tracks).toEqual([{ day_id: day.id, place_id: track.id, stray_km: 1.5 }]);
    });
  });

  it('MCP-ROADTRIP-007: a track from another trip cannot label this day', async () => {
    const { user, trip, day } = scenario();
    const stranger = createUser(testDb, { email: 'other2@example.test' });
    const theirs = createTrip(testDb, stranger.user.id, { title: 'Theirs' });
    const theirTrack = createPlace(testDb, theirs.id, { name: 'Not yours' });
    testDb.prepare("UPDATE places SET route_geometry = '[[1,2]]' WHERE id = ?").run(theirTrack.id);

    await withHarness(user.id, async (h) => {
      const res = await h.client.callTool({
        name: 'add_route_vias',
        arguments: {
          tripId: trip.id,
          dayId: day.id,
          vias: [{ after_order_index: 0, lat: 53, lng: 10 }],
          track: { place_id: theirTrack.id },
        },
      });
      expect(res.isError).toBeTruthy();
      expect(testDb.prepare('SELECT COUNT(*) c FROM roadtrip_vias').get()).toEqual({ c: 0 });
    });
  });

  it('MCP-ROADTRIP-008: re-anchoring moves what it names and removes what it lists', async () => {
    const { user, trip, day } = scenario();

    await withHarness(user.id, async (h) => {
      const first = parseToolResult(await h.client.callTool({
        name: 'add_route_via',
        arguments: { tripId: trip.id, dayId: day.id, after_order_index: 0, lat: 53, lng: 10 },
      })) as { via: { id: number } };
      const second = parseToolResult(await h.client.callTool({
        name: 'add_route_via',
        arguments: { tripId: trip.id, dayId: day.id, after_order_index: 1, lat: 54, lng: 11 },
      })) as { via: { id: number } };

      const res = parseToolResult(await h.client.callTool({
        name: 'reanchor_route_vias',
        arguments: {
          tripId: trip.id,
          dayId: day.id,
          vias: [{ id: second.via.id, after_order_index: 0 }],
          remove: [first.via.id],
        },
      })) as { vias: { id: number; after_order_index: number }[] };

      expect(res.vias).toHaveLength(1);
      expect(res.vias[0]).toMatchObject({ id: second.via.id, after_order_index: 0 });
    });
  });

  it('MCP-ROADTRIP-010: a member without day_edit may read but not write', async () => {
    // The permission the controller demands is the permission the tool demands:
    // an assistant must never be able to do through a tool what the person it
    // is acting for cannot do through the UI.
    const { user, trip, day } = scenario();
    const member = createUser(testDb, { email: 'member@example.test' });
    addTripMember(testDb, trip.id, member.user.id);
    savePermissions({ day_edit: 'trip_owner' });

    try {
      await withHarness(member.user.id, async (h) => {
        const read = await h.client.callTool({
          name: 'list_route_vias',
          arguments: { tripId: trip.id, dayId: day.id },
        });
        expect(read.isError).toBeFalsy();

        for (const name of ['add_route_via', 'add_route_vias', 'reanchor_route_vias', 'remove_route_via']) {
          const args: Record<string, unknown> = { tripId: trip.id, dayId: day.id };
          if (name === 'add_route_via') Object.assign(args, { after_order_index: 0, lat: 53, lng: 10 });
          if (name === 'add_route_vias') args.vias = [{ after_order_index: 0, lat: 53, lng: 10 }];
          if (name === 'reanchor_route_vias') args.vias = [];
          if (name === 'remove_route_via') args.viaId = 1;
          const res = await h.client.callTool({ name, arguments: args });
          expect(res.isError, name).toBeTruthy();
        }
      });
      expect(testDb.prepare('SELECT COUNT(*) c FROM roadtrip_vias').get()).toEqual({ c: 0 });
    } finally {
      savePermissions({ day_edit: 'trip_member' });
    }
    // The owner is unaffected.
    await withHarness(user.id, async (h) => {
      const res = await h.client.callTool({
        name: 'add_route_via',
        arguments: { tripId: trip.id, dayId: day.id, after_order_index: 0, lat: 53, lng: 10 },
      });
      expect(res.isError).toBeFalsy();
    });
  });

  it('MCP-ROADTRIP-011: the demo account may look but never write', async () => {
    const { trip, day } = scenario();
    const demo = createUser(testDb, { email: DEMO_EMAIL_PRIMARY });
    addTripMember(testDb, trip.id, demo.user.id);

    process.env.DEMO_MODE = 'true';
    try {
      await withHarness(demo.user.id, async (h) => {
        const read = await h.client.callTool({
          name: 'list_route_vias',
          arguments: { tripId: trip.id, dayId: day.id },
        });
        expect(read.isError).toBeFalsy();

        const write = await h.client.callTool({
          name: 'add_route_via',
          arguments: { tripId: trip.id, dayId: day.id, after_order_index: 0, lat: 53, lng: 10 },
        });
        expect(write.isError).toBeTruthy();
        expect((write.content as { text: string }[])[0].text).toContain('demo');
      });
    } finally {
      delete process.env.DEMO_MODE;
    }
    expect(testDb.prepare('SELECT COUNT(*) c FROM roadtrip_vias').get()).toEqual({ c: 0 });
  });

  it('MCP-ROADTRIP-009: removing one that is not on the day is refused, not silently ignored', async () => {
    const { user, trip, day } = scenario();

    await withHarness(user.id, async (h) => {
      const res = await h.client.callTool({
        name: 'remove_route_via',
        arguments: { tripId: trip.id, dayId: day.id, viaId: 9999 },
      });
      expect(res.isError).toBeTruthy();
    });
  });
});
