/**
 * Unit tests for MCP journey write tools focused on response hydration:
 * create_journey returns the full journey (entries/contributors/trips/stats/my_role),
 * and create_journey_entry returns the enriched entry (parsed tags, photos array).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
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
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
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

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock, broadcastToUser: broadcastMock }));

vi.mock('../../../src/nest/addons/addons.bridge', async (importOriginal) => {
  const original = await importOriginal() as Record<string, unknown>;
  return { ...original, isAddonEnabled: vi.fn().mockReturnValue(true) };
});

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

describe('Tool: create_journey', () => {
  it('returns the fully-hydrated journey, not a bare row', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_journey',
        arguments: { title: 'Eurotrip', subtitle: '2026' },
      });
      const data = parseToolResult(result) as any;
      expect(data.journey.title).toBe('Eurotrip');
      // hydrated shape from getJourneyFull
      expect(Array.isArray(data.journey.entries)).toBe(true);
      expect(Array.isArray(data.journey.contributors)).toBe(true);
      expect(Array.isArray(data.journey.trips)).toBe(true);
      expect(data.journey.stats).toBeDefined();
      expect(data.journey.my_role).toBeDefined();
    });
  });
});

describe('Tool: create_journey_entry', () => {
  it('returns the enriched entry with parsed tags and a photos array', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = (parseToolResult(await h.client.callTool({
        name: 'create_journey', arguments: { title: 'J' },
      })) as any).journey;
      const result = await h.client.callTool({
        name: 'create_journey_entry',
        arguments: { journeyId: journey.id, entry_date: '2026-07-01', title: 'Day 1', story: 'Arrived' },
      });
      const data = parseToolResult(result) as any;
      expect(data.entry.title).toBe('Day 1');
      // listEntries enrichment: tags parsed to an array, photos present
      expect(Array.isArray(data.entry.tags)).toBe(true);
      expect(Array.isArray(data.entry.photos)).toBe(true);
      expect(data.entry).toHaveProperty('source_trip_name');
    });
  });
});

describe('Tool: update_journey_entry', () => {
  it('returns the enriched entry (parsed tags, photos array)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = (parseToolResult(await h.client.callTool({
        name: 'create_journey', arguments: { title: 'J' },
      })) as any).journey;
      const entry = (parseToolResult(await h.client.callTool({
        name: 'create_journey_entry', arguments: { journeyId: journey.id, entry_date: '2026-07-01', title: 'Day 1' },
      })) as any).entry;
      const result = await h.client.callTool({
        name: 'update_journey_entry',
        arguments: { entryId: entry.id, title: 'Day 1 (edited)' },
      });
      const data = parseToolResult(result) as any;
      expect(data.entry.title).toBe('Day 1 (edited)');
      expect(Array.isArray(data.entry.tags)).toBe(true);
      expect(Array.isArray(data.entry.photos)).toBe(true);
    });
  });
});

describe('Tool: update_journey_preferences', () => {
  it('returns the updated preference, not { success }', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = (parseToolResult(await h.client.callTool({
        name: 'create_journey', arguments: { title: 'J' },
      })) as any).journey;
      const result = await h.client.callTool({
        name: 'update_journey_preferences',
        arguments: { journeyId: journey.id, hide_skeletons: true },
      });
      const data = parseToolResult(result) as any;
      expect(data.hide_skeletons).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// The rest of the surface. The legacy registrar had no test file of its own —
// the two hydration cases above were the whole of it — so every tool below is
// covered here for the first time: the happy path, the "not found or access
// denied" branch a non-member hits, and the demo-mode denial on writes.
// ---------------------------------------------------------------------------

/** A journey owned by someone else — every access check must refuse it. */
function foreignJourney() {
  const { user: other } = createUser(testDb);
  const j = testDb.prepare(
    'INSERT INTO journeys (user_id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(other.id, 'Not yours', 'draft', Date.now(), Date.now());
  return { otherId: other.id, journeyId: Number(j.lastInsertRowid) };
}

async function seedJourney(h: McpHarness, title = 'J') {
  return (parseToolResult(await h.client.callTool({
    name: 'create_journey', arguments: { title },
  })) as any).journey;
}

describe('journey read tools', () => {
  it('list_journeys returns the caller-visible journeys', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await seedJourney(h, 'Alpha');
      const data = parseToolResult(await h.client.callTool({ name: 'list_journeys', arguments: {} })) as any;
      expect(data.journeys.map((j: any) => j.title)).toContain('Alpha');
    });
  });

  it('get_journey hydrates entries, contributors and trips', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      const data = parseToolResult(await h.client.callTool({
        name: 'get_journey', arguments: { journeyId: journey.id },
      })) as any;
      expect(data.journey.id).toBe(journey.id);
      expect(Array.isArray(data.journey.entries)).toBe(true);
    });
  });

  it('get_journey refuses a journey the caller cannot see', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_journey', arguments: { journeyId } });
      expect(result.isError).toBe(true);
    });
  });

  it('list_journey_entries returns the entries', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      await h.client.callTool({
        name: 'create_journey_entry', arguments: { journeyId: journey.id, entry_date: '2026-07-01', title: 'D1' },
      });
      const data = parseToolResult(await h.client.callTool({
        name: 'list_journey_entries', arguments: { journeyId: journey.id },
      })) as any;
      expect(data.entries).toHaveLength(1);
    });
  });

  it('list_journey_entries refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_journey_entries', arguments: { journeyId } });
      expect(result.isError).toBe(true);
    });
  });

  it('list_journey_contributors returns the contributor rows', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      const data = parseToolResult(await h.client.callTool({
        name: 'list_journey_contributors', arguments: { journeyId: journey.id },
      })) as any;
      expect(Array.isArray(data.contributors)).toBe(true);
    });
  });

  it('list_journey_contributors refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_journey_contributors', arguments: { journeyId } });
      expect(result.isError).toBe(true);
    });
  });

  it('get_journey_suggestions and list_journey_available_trips answer with arrays', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const s = parseToolResult(await h.client.callTool({ name: 'get_journey_suggestions', arguments: {} })) as any;
      const t = parseToolResult(await h.client.callTool({ name: 'list_journey_available_trips', arguments: {} })) as any;
      expect(Array.isArray(s.trips)).toBe(true);
      expect(Array.isArray(t.trips)).toBe(true);
    });
  });
});

describe('journey write tools', () => {
  it('update_journey applies the change and refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      const updated = parseToolResult(await h.client.callTool({
        name: 'update_journey', arguments: { journeyId: journey.id, title: 'Renamed', status: 'active' },
      })) as any;
      expect(updated.journey.title).toBe('Renamed');
      const denied = await h.client.callTool({ name: 'update_journey', arguments: { journeyId, title: 'X' } });
      expect(denied.isError).toBe(true);
    });
  });

  it('delete_journey removes it and refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      const gone = parseToolResult(await h.client.callTool({
        name: 'delete_journey', arguments: { journeyId: journey.id },
      })) as any;
      expect(gone.success).toBe(true);
      const denied = await h.client.callTool({ name: 'delete_journey', arguments: { journeyId } });
      expect(denied.isError).toBe(true);
    });
  });

  it('add_journey_trip links a trip, remove_journey_trip unlinks it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      const added = parseToolResult(await h.client.callTool({
        name: 'add_journey_trip', arguments: { journeyId: journey.id, tripId: trip.id },
      })) as any;
      expect(added.success).toBe(true);
      const removed = parseToolResult(await h.client.callTool({
        name: 'remove_journey_trip', arguments: { journeyId: journey.id, tripId: trip.id },
      })) as any;
      expect(removed.success).toBe(true);
    });
  });

  it('add_journey_trip refuses a foreign journey; remove_journey_trip is idempotent but refuses one', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      expect((await h.client.callTool({
        name: 'add_journey_trip', arguments: { journeyId, tripId: trip.id },
      })).isError).toBe(true);
      // Unlinking a trip that was never linked is a no-op, not an error — the
      // gate is journey ownership, not whether the row existed.
      expect((parseToolResult(await h.client.callTool({
        name: 'remove_journey_trip', arguments: { journeyId: journey.id, tripId: trip.id },
      })) as any).success).toBe(true);
      expect((await h.client.callTool({
        name: 'remove_journey_trip', arguments: { journeyId, tripId: trip.id },
      })).isError).toBe(true);
    });
  });

  it('create_journey_entry refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_journey_entry', arguments: { journeyId, entry_date: '2026-07-01' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('update_journey_entry and delete_journey_entry refuse an unknown entry', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      expect((await h.client.callTool({
        name: 'update_journey_entry', arguments: { entryId: 999999, title: 'X' },
      })).isError).toBe(true);
      expect((await h.client.callTool({
        name: 'delete_journey_entry', arguments: { entryId: 999999 },
      })).isError).toBe(true);
    });
  });

  it('delete_journey_entry removes an owned entry', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      const entry = (parseToolResult(await h.client.callTool({
        name: 'create_journey_entry', arguments: { journeyId: journey.id, entry_date: '2026-07-01' },
      })) as any).entry;
      const data = parseToolResult(await h.client.callTool({
        name: 'delete_journey_entry', arguments: { entryId: entry.id },
      })) as any;
      expect(data.success).toBe(true);
    });
  });

  it('reorder_journey_entries reorders, and rejects IDs from outside the journey', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      const a = (parseToolResult(await h.client.callTool({
        name: 'create_journey_entry', arguments: { journeyId: journey.id, entry_date: '2026-07-01', title: 'A' },
      })) as any).entry;
      const b = (parseToolResult(await h.client.callTool({
        name: 'create_journey_entry', arguments: { journeyId: journey.id, entry_date: '2026-07-02', title: 'B' },
      })) as any).entry;
      const reordered = parseToolResult(await h.client.callTool({
        name: 'reorder_journey_entries', arguments: { journeyId: journey.id, orderedIds: [b.id, a.id] },
      })) as any;
      expect(reordered.success).toBe(true);
      expect((await h.client.callTool({
        name: 'reorder_journey_entries', arguments: { journeyId: journey.id, orderedIds: [999999] },
      })).isError).toBe(true);
    });
  });

  it('contributor tools add, re-role and remove; each refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      expect((parseToolResult(await h.client.callTool({
        name: 'add_journey_contributor', arguments: { journeyId: journey.id, targetUserId: guest.id, role: 'editor' },
      })) as any).success).toBe(true);
      expect((parseToolResult(await h.client.callTool({
        name: 'update_journey_contributor_role', arguments: { journeyId: journey.id, targetUserId: guest.id, role: 'viewer' },
      })) as any).success).toBe(true);
      expect((parseToolResult(await h.client.callTool({
        name: 'remove_journey_contributor', arguments: { journeyId: journey.id, targetUserId: guest.id },
      })) as any).success).toBe(true);

      for (const name of ['add_journey_contributor', 'update_journey_contributor_role']) {
        expect((await h.client.callTool({
          name, arguments: { journeyId, targetUserId: guest.id, role: 'editor' },
        })).isError).toBe(true);
      }
      expect((await h.client.callTool({
        name: 'remove_journey_contributor', arguments: { journeyId, targetUserId: guest.id },
      })).isError).toBe(true);
    });
  });

  it('update_journey_preferences refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_journey_preferences', arguments: { journeyId, hide_skeletons: true },
      });
      expect(result.isError).toBe(true);
    });
  });
});

describe('journey share-link tools', () => {
  it('creates, reads and revokes the link', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = await seedJourney(h);
      // No link yet — the tool answers with a null shareLink, not an error.
      const empty = parseToolResult(await h.client.callTool({
        name: 'get_journey_share_link', arguments: { journeyId: journey.id },
      })) as any;
      expect(empty.shareLink ?? null).toBeNull();

      const created = parseToolResult(await h.client.callTool({
        name: 'create_journey_share_link', arguments: { journeyId: journey.id },
      })) as any;
      expect(created.shareLink).toBeTruthy();

      const read = parseToolResult(await h.client.callTool({
        name: 'get_journey_share_link', arguments: { journeyId: journey.id },
      })) as any;
      expect(read.shareLink).toBeTruthy();

      const revoked = parseToolResult(await h.client.callTool({
        name: 'delete_journey_share_link', arguments: { journeyId: journey.id },
      })) as any;
      expect(revoked.success).toBe(true);
    });
  });

  it('every share tool refuses a foreign journey', async () => {
    const { user } = createUser(testDb);
    const { journeyId } = foreignJourney();
    await withHarness(user.id, async (h) => {
      for (const name of ['get_journey_share_link', 'create_journey_share_link', 'delete_journey_share_link']) {
        expect((await h.client.callTool({ name, arguments: { journeyId } })).isError).toBe(true);
      }
    });
  });
});

describe('demo mode', () => {
  // The read tools are deliberately NOT demo-gated, matching the legacy
  // registrar: only the writes and the share-link mutations refuse.
  const WRITES: Array<[string, Record<string, unknown>]> = [
    ['create_journey', { title: 'X' }],
    ['update_journey', { journeyId: 1, title: 'X' }],
    ['delete_journey', { journeyId: 1 }],
    ['add_journey_trip', { journeyId: 1, tripId: 1 }],
    ['remove_journey_trip', { journeyId: 1, tripId: 1 }],
    ['create_journey_entry', { journeyId: 1, entry_date: '2026-07-01' }],
    ['update_journey_entry', { entryId: 1, title: 'X' }],
    ['delete_journey_entry', { entryId: 1 }],
    ['reorder_journey_entries', { journeyId: 1, orderedIds: [1] }],
    ['add_journey_contributor', { journeyId: 1, targetUserId: 2, role: 'editor' }],
    ['update_journey_contributor_role', { journeyId: 1, targetUserId: 2, role: 'viewer' }],
    ['remove_journey_contributor', { journeyId: 1, targetUserId: 2 }],
    ['update_journey_preferences', { journeyId: 1, hide_skeletons: true }],
    ['create_journey_share_link', { journeyId: 1 }],
    ['delete_journey_share_link', { journeyId: 1 }],
  ];

  it.each(WRITES)('%s is blocked for a demo user', async (name, args) => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: args });
      expect(result.isError).toBe(true);
    });
  });

  it('list_journeys still answers for a demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({ name: 'list_journeys', arguments: {} })) as any;
      expect(Array.isArray(data.journeys)).toBe(true);
    });
  });
});
