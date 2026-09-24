/**
 * Unit tests for the get_trip_warnings MCP tool (src/nest/plugins/contributions/
 * trip-warnings.mcp.ts), the MCP counterpart of GET /api/trip-warnings/:tripId.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: number, userId: number) =>
      db
        .prepare(
          'SELECT t.id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)',
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: number, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

const { broadcastMock, pluginsEnabled } = vi.hoisted(() => ({
  broadcastMock: vi.fn(),
  pluginsEnabled: vi.fn(() => true),
}));

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
// The admin kill switch reads live env; drive it from the test instead of the process.
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { addTripMember, createTrip, createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';

// The harness builds the registry itself, so the fan-out is played on the prototype
// (the tools-transit.test.ts pattern). vitest is not configured to auto-restore, so
// every case restates what it wants in beforeEach.
const providersOfMock = vi.spyOn(PluginHooks.prototype, 'providersOf');
const tripWarningsMock = vi.spyOn(PluginHooks.prototype, 'tripWarnings');

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  pluginsEnabled.mockReturnValue(true);
  providersOfMock.mockReset().mockReturnValue([]);
  tripWarningsMock.mockReset().mockResolvedValue([]);
});

afterAll(() => {
  testDb.close();
});

async function withHarness(
  userId: number,
  fn: (h: McpHarness) => Promise<void>,
  scopes?: string[] | null,
) {
  const h = await createMcpHarness({ userId, withResources: false, scopes: scopes ?? null });
  try { await fn(h); } finally { await h.cleanup(); }
}

interface WarningsPayload {
  warnings: { pluginId: string; level: string; message: string; dayId?: number; placeId?: number }[];
}

const call = async (h: McpHarness, tripId: number) =>
  h.client.callTool({ name: 'get_trip_warnings', arguments: { tripId } });

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('Tool: get_trip_warnings', () => {
  it('merges every provider, tags each warning with the plugin that raised it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Kyoto' });
    providersOfMock.mockReturnValue(['seasons', 'logistics']);
    tripWarningsMock.mockImplementation(async (pluginId: string) =>
      pluginId === 'seasons'
        ? [{ level: 'info', message: 'Rainy week ahead' }]
        : [{ level: 'error', message: 'Day 3 has no way back', dayId: 31 }],
    );

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload.warnings).toEqual([
        { pluginId: 'seasons', level: 'info', message: 'Rainy week ahead' },
        { pluginId: 'logistics', level: 'error', message: 'Day 3 has no way back', dayId: 31 },
      ]);
      expect(providersOfMock).toHaveBeenCalledWith('warningProvider');
      expect(tripWarningsMock).toHaveBeenCalledWith('seasons', trip.id, user.id);
    });
  });

  it('carries the place link through and defaults an unknown level to warning', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['opening-hours']);
    tripWarningsMock.mockResolvedValue([{ level: 'catastrophe', message: 'Museum closed Mondays', placeId: 7 }]);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload.warnings).toEqual([
        { pluginId: 'opening-hours', level: 'warning', message: 'Museum closed Mondays', placeId: 7 },
      ]);
    });
  });

  it('answers with an empty list when no plugin provides warnings', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload).toEqual({ warnings: [] });
      expect(tripWarningsMock).not.toHaveBeenCalled();
    });
  });

  it('is readable by a collaborator, not just the owner', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    providersOfMock.mockReturnValue(['logistics']);
    tripWarningsMock.mockResolvedValue([{ level: 'warning', message: 'Tight connection' }]);

    await withHarness(member.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload.warnings).toHaveLength(1);
      expect(tripWarningsMock).toHaveBeenCalledWith('logistics', trip.id, member.id);
    });
  });
});

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

describe('get_trip_warnings access', () => {
  it('refuses a trip the caller is not on, without asking any provider', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    providersOfMock.mockReturnValue(['logistics']);

    await withHarness(stranger.id, async (h) => {
      const result = await call(h, trip.id);
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Trip not found or access denied.');
      expect(tripWarningsMock).not.toHaveBeenCalled();
    });
  });

  it('refuses a trip that does not exist', async () => {
    const { user } = createUser(testDb);

    await withHarness(user.id, async (h) => {
      const result = await call(h, 999999);
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Trip not found or access denied.');
    });
  });

  it('checks trip access before the kill switch, so a stranger never learns the switch is off', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    pluginsEnabled.mockReturnValue(false);

    await withHarness(stranger.id, async (h) => {
      const result = await call(h, trip.id);
      expect(result.isError).toBe(true);
    });
  });

  it('rides trips:read: present with it, absent without it', async () => {
    const { user } = createUser(testDb);

    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      expect(names).toContain('get_trip_warnings');
    }, ['trips:read']);

    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      expect(names).not.toContain('get_trip_warnings');
    }, ['places:read']);
  });
});

// ---------------------------------------------------------------------------
// Degrading rather than failing
// ---------------------------------------------------------------------------

describe('get_trip_warnings resilience', () => {
  it('answers empty when an admin has the plugin system switched off', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    pluginsEnabled.mockReturnValue(false);
    providersOfMock.mockReturnValue(['logistics']);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload).toEqual({ warnings: [] });
      expect(providersOfMock).not.toHaveBeenCalled();
    });
  });

  it('drops a provider that throws or times out and keeps the rest', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['broken', 'healthy']);
    tripWarningsMock.mockImplementation(async (pluginId: string) => {
      if (pluginId === 'broken') throw new Error('hook timed out after 5000ms');
      return [{ level: 'warning', message: 'Still here' }];
    });

    await withHarness(user.id, async (h) => {
      const result = await call(h, trip.id);
      expect(result.isError).toBeFalsy();
      const payload = parseToolResult(result) as WarningsPayload;
      expect(payload.warnings).toEqual([{ pluginId: 'healthy', level: 'warning', message: 'Still here' }]);
    });
  });

  it('ignores a provider that answers with something other than an array', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['confused']);
    tripWarningsMock.mockResolvedValue({ warnings: 'lots' });

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload).toEqual({ warnings: [] });
    });
  });

  it('skips null entries instead of losing the whole provider to them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['sloppy']);
    tripWarningsMock.mockResolvedValue([null, { level: 'info', message: 'Survives' }, 'nope']);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload.warnings).toEqual([{ pluginId: 'sloppy', level: 'info', message: 'Survives' }]);
    });
  });

  it('drops a warning with no message rather than emitting a blank line', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['sloppy']);
    tripWarningsMock.mockResolvedValue([{ level: 'error' }, { level: 'error', message: '' }]);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload).toEqual({ warnings: [] });
    });
  });
});

// ---------------------------------------------------------------------------
// Caps
// ---------------------------------------------------------------------------

describe('get_trip_warnings caps', () => {
  it('caps a flooding provider at 20 warnings and truncates an oversized message', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['flood']);
    tripWarningsMock.mockResolvedValue([
      { level: 'warning', message: 'z'.repeat(1000) },
      ...Array.from({ length: 50 }, (_v, i) => ({ level: 'info', message: `w${i}` })),
    ]);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload.warnings).toHaveLength(20);
      expect(payload.warnings[0].message).toHaveLength(300);
    });
  });

  it('caps each provider separately, so two providers can contribute 40', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['a', 'b']);
    tripWarningsMock.mockResolvedValue(
      Array.from({ length: 50 }, (_v, i) => ({ level: 'info', message: `w${i}` })),
    );

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload.warnings).toHaveLength(40);
    });
  });

  it('strips emojis, because the assistant relays this text as TREK chrome', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    providersOfMock.mockReturnValue(['loud']);
    tripWarningsMock.mockResolvedValue([{ level: 'error', message: '🔥 Overbooked!' }]);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, trip.id)) as WarningsPayload;
      expect(payload.warnings[0].message).toBe('Overbooked!');
    });
  });
});
