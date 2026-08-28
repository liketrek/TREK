/**
 * Unit tests for the two link-management MCP surfaces that had no tools at all
 * before: FeedsMcp (the subscribable ICS calendar feed, per trip and for all
 * trips) and TripInviteMcp (the invite link that grants trip membership).
 *
 * Both mirror routes whose payload IS the credential, so the gates are the
 * interesting part: trip access before permission, share_manage on reads as
 * well as writes, and demo mode refused on every write.
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
    canAccessTrip: (tripId: number | string, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: number | string, userId: number) =>
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
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

const BASE = 'https://trek.example';

type ToolResult = Awaited<ReturnType<McpHarness['client']['callTool']>>;

/** Typed view on a successful tool payload. */
function payload<T>(result: ToolResult): T {
  return parseToolResult(result) as T;
}

/** The raw text of a result, for the error sentences that are not JSON. */
function textOf(result: ToolResult): string {
  const { content } = result as { content: { type: string; text?: string }[] };
  return content.find((c) => c.type === 'text')?.text ?? '';
}

function tripToken(tripId: number): string | null {
  const row = testDb.prepare('SELECT feed_token FROM trips WHERE id = ?').get(tripId) as { feed_token: string | null } | undefined;
  return row?.feed_token ?? null;
}

function userToken(userId: number): string | null {
  const row = testDb.prepare('SELECT feed_token FROM users WHERE id = ?').get(userId) as { feed_token: string | null } | undefined;
  return row?.feed_token ?? null;
}

function inviteRow(tripId: number) {
  return testDb.prepare('SELECT token, expires_at, created_by FROM trip_invite_tokens WHERE trip_id = ?').get(tripId) as
    | { token: string; expires_at: string | null; created_by: number }
    | undefined;
}

interface FeedResult { feed_url: string | null }
interface InviteLink { token: string; expires_at: string | null; created_at: string; url: string }
interface InviteResult { invite_link: InviteLink | null }

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  // trip_invite_tokens is not in the shared helper's RESET_TABLES, and trip ids
  // restart after a DELETE-based reset, so a leftover row would attach itself
  // to the next test's trip.
  testDb.exec('DELETE FROM trip_invite_tokens');
  // The permission levels are cached in module state that resetTestDb knows
  // nothing about, so the one test that lowers share_manage would otherwise
  // keep the lowered level alive for every test after it.
  invalidatePermissionsCache();
  delete process.env.DEMO_MODE;
  process.env.APP_URL = BASE;
});

afterAll(() => {
  delete process.env.APP_URL;
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// One trip's calendar feed
// ---------------------------------------------------------------------------

describe('Tool: get_trip_calendar_feed', () => {
  it('answers null while the feed is off and the subscribable URL once it is on', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const off = payload<FeedResult>(await h.client.callTool({ name: 'get_trip_calendar_feed', arguments: { tripId: trip.id } }));
      expect(off.feed_url).toBeNull();

      await h.client.callTool({ name: 'enable_trip_calendar_feed', arguments: { tripId: trip.id } });
      const on = payload<FeedResult>(await h.client.callTool({ name: 'get_trip_calendar_feed', arguments: { tripId: trip.id } }));
      expect(on.feed_url).toBe(`${BASE}/api/feed/trip/${tripToken(trip.id)}.ics`);
    });
  });

  it('reads the feed of a trip the user is a member of once share_manage is lowered to trip_member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('perm_share_manage', 'trip_member')").run();
    await withHarness(owner.id, async (h) => {
      await h.client.callTool({ name: 'enable_trip_calendar_feed', arguments: { tripId: trip.id } });
    });
    await withHarness(member.id, async (h) => {
      const result = payload<FeedResult>(await h.client.callTool({ name: 'get_trip_calendar_feed', arguments: { tripId: trip.id } }));
      expect(result.feed_url).toBe(`${BASE}/api/feed/trip/${tripToken(trip.id)}.ics`);
    });
  });
});

describe('Tool: enable_trip_calendar_feed', () => {
  it('mints one token and hands back the same URL on a second call', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const first = payload<FeedResult>(await h.client.callTool({ name: 'enable_trip_calendar_feed', arguments: { tripId: trip.id } }));
      const minted = tripToken(trip.id);
      expect(minted).toBeTruthy();
      expect(first.feed_url).toBe(`${BASE}/api/feed/trip/${minted}.ics`);

      const second = payload<FeedResult>(await h.client.callTool({ name: 'enable_trip_calendar_feed', arguments: { tripId: trip.id } }));
      expect(second.feed_url).toBe(first.feed_url);
      expect(tripToken(trip.id)).toBe(minted);
    });
  });
});

describe('Tool: rotate_trip_calendar_feed', () => {
  it('replaces the token so the old URL stops resolving', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'enable_trip_calendar_feed', arguments: { tripId: trip.id } });
      const before = tripToken(trip.id);
      const rotated = payload<FeedResult>(await h.client.callTool({ name: 'rotate_trip_calendar_feed', arguments: { tripId: trip.id } }));
      const after = tripToken(trip.id);
      expect(after).not.toBe(before);
      expect(rotated.feed_url).toBe(`${BASE}/api/feed/trip/${after}.ics`);
    });
  });
});

describe('Tool: disable_trip_calendar_feed', () => {
  it('clears the token and answers a null URL', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'enable_trip_calendar_feed', arguments: { tripId: trip.id } });
      const result = payload<FeedResult>(await h.client.callTool({ name: 'disable_trip_calendar_feed', arguments: { tripId: trip.id } }));
      expect(result.feed_url).toBeNull();
      expect(tripToken(trip.id)).toBeNull();
    });
  });
});

describe('trip calendar feed gates', () => {
  const TRIP_FEED_TOOLS = [
    'get_trip_calendar_feed',
    'enable_trip_calendar_feed',
    'rotate_trip_calendar_feed',
    'disable_trip_calendar_feed',
  ];

  it.each(TRIP_FEED_TOOLS)('%s refuses a trip the user cannot reach', async (name) => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const foreign = createTrip(testDb, other.id);
    testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run('foreign-token', foreign.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: { tripId: foreign.id } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe('Trip not found or access denied.');
      // The service scopes its own UPDATE, but the tool must refuse before it:
      // generate/rotate answer a URL for a token they never wrote.
      expect(tripToken(foreign.id)).toBe('foreign-token');
    });
  });

  it.each(TRIP_FEED_TOOLS)('%s refuses a trip id that does not exist', async (name) => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: { tripId: 987654 } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe('Trip not found or access denied.');
    });
  });

  it.each(TRIP_FEED_TOOLS)('%s refuses a member without share_manage', async (name) => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run('owner-token', trip.id);
    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe('You do not have permission to perform this action on this trip.');
      expect(tripToken(trip.id)).toBe('owner-token');
    });
  });

  it.each(['enable_trip_calendar_feed', 'rotate_trip_calendar_feed', 'disable_trip_calendar_feed'])(
    '%s refuses a demo account',
    async (name) => {
      process.env.DEMO_MODE = 'true';
      const { user: demo } = createUser(testDb, { email: 'demo@trek.app' });
      const trip = createTrip(testDb, demo.id);
      testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run('demo-token', trip.id);
      await withHarness(demo.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: { tripId: trip.id } });
        expect(result.isError).toBe(true);
        expect(textOf(result)).toBe('Write operations are disabled in demo mode.');
        expect(tripToken(trip.id)).toBe('demo-token');
      });
    },
  );
});

// ---------------------------------------------------------------------------
// The all-trips calendar feed
// ---------------------------------------------------------------------------

describe('Tool: get_all_trips_calendar_feed', () => {
  it('answers null while the feed is off and the user URL once it is on', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const off = payload<FeedResult>(await h.client.callTool({ name: 'get_all_trips_calendar_feed', arguments: {} }));
      expect(off.feed_url).toBeNull();

      await h.client.callTool({ name: 'enable_all_trips_calendar_feed', arguments: {} });
      const on = payload<FeedResult>(await h.client.callTool({ name: 'get_all_trips_calendar_feed', arguments: {} }));
      expect(on.feed_url).toBe(`${BASE}/api/feed/user/${userToken(user.id)}.ics`);
    });
  });
});

describe('Tool: enable_all_trips_calendar_feed', () => {
  it('mints the calling user their own token and leaves everybody else alone', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const first = payload<FeedResult>(await h.client.callTool({ name: 'enable_all_trips_calendar_feed', arguments: {} }));
      const minted = userToken(user.id);
      expect(first.feed_url).toBe(`${BASE}/api/feed/user/${minted}.ics`);
      expect(userToken(other.id)).toBeNull();

      const second = payload<FeedResult>(await h.client.callTool({ name: 'enable_all_trips_calendar_feed', arguments: {} }));
      expect(second.feed_url).toBe(first.feed_url);
      expect(userToken(user.id)).toBe(minted);
    });
  });
});

describe('Tool: rotate_all_trips_calendar_feed', () => {
  it('replaces the token so the old URL stops resolving', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'enable_all_trips_calendar_feed', arguments: {} });
      const before = userToken(user.id);
      const rotated = payload<FeedResult>(await h.client.callTool({ name: 'rotate_all_trips_calendar_feed', arguments: {} }));
      const after = userToken(user.id);
      expect(after).not.toBe(before);
      expect(rotated.feed_url).toBe(`${BASE}/api/feed/user/${after}.ics`);
    });
  });
});

describe('Tool: disable_all_trips_calendar_feed', () => {
  it('clears the token and answers a null URL', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'enable_all_trips_calendar_feed', arguments: {} });
      const result = payload<FeedResult>(await h.client.callTool({ name: 'disable_all_trips_calendar_feed', arguments: {} }));
      expect(result.feed_url).toBeNull();
      expect(userToken(user.id)).toBeNull();
    });
  });
});

describe('all-trips calendar feed gates', () => {
  it.each(['enable_all_trips_calendar_feed', 'rotate_all_trips_calendar_feed', 'disable_all_trips_calendar_feed'])(
    '%s refuses a demo account',
    async (name) => {
      process.env.DEMO_MODE = 'true';
      const { user: demo } = createUser(testDb, { email: 'demo@trek.app' });
      testDb.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run('demo-user-token', demo.id);
      await withHarness(demo.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: {} });
        expect(result.isError).toBe(true);
        expect(textOf(result)).toBe('Write operations are disabled in demo mode.');
        expect(userToken(demo.id)).toBe('demo-user-token');
      });
    },
  );
});

// ---------------------------------------------------------------------------
// Trip invite link
// ---------------------------------------------------------------------------

describe('Tool: get_trip_invite_link', () => {
  it('answers null without a link, then the token and the join URL', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const none = payload<InviteResult>(await h.client.callTool({ name: 'get_trip_invite_link', arguments: { tripId: trip.id } }));
      expect(none.invite_link).toBeNull();

      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: trip.id } });
      const link = payload<InviteResult>(await h.client.callTool({ name: 'get_trip_invite_link', arguments: { tripId: trip.id } }));
      expect(link.invite_link?.token).toBe(inviteRow(trip.id)?.token);
      expect(link.invite_link?.url).toBe(`${BASE}/join/${inviteRow(trip.id)?.token}`);
      expect(link.invite_link?.expires_at).toBeNull();
    });
  });
});

describe('Tool: create_trip_invite_link', () => {
  it('stores the token against the trip and audits who minted it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = payload<InviteResult>(await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: trip.id } }));
      const row = inviteRow(trip.id);
      expect(row?.token).toBe(created.invite_link?.token);
      expect(row?.created_by).toBe(user.id);
      expect(row?.expires_at).toBeNull();

      const audit = testDb.prepare("SELECT user_id, resource, details FROM audit_log WHERE action = 'trip.invite_link_create'").get() as
        | { user_id: number; resource: string; details: string | null }
        | undefined;
      expect(audit?.user_id).toBe(user.id);
      expect(audit?.resource).toBe(String(trip.id));
    });
  });

  it('takes an expiry as a number or as the digits-only string the contract allows', async () => {
    const { user } = createUser(testDb);
    const numeric = createTrip(testDb, user.id);
    const stringy = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: numeric.id, expires_in_days: 7 } });
      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: stringy.id, expires_in_days: '7' } });
    });
    const expected = Date.now() + 7 * 86400000;
    for (const trip of [numeric, stringy]) {
      const at = inviteRow(trip.id)?.expires_at;
      expect(at).toBeTruthy();
      expect(Math.abs(new Date(at as string).getTime() - expected)).toBeLessThan(60_000);
    }
  });

  it('reads a non-positive or empty expiry as no expiry at all', async () => {
    const { user } = createUser(testDb);
    const zero = createTrip(testDb, user.id);
    const blank = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: zero.id, expires_in_days: 0 } });
      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: blank.id, expires_in_days: '' } });
    });
    expect(inviteRow(zero.id)?.expires_at).toBeNull();
    expect(inviteRow(blank.id)?.expires_at).toBeNull();
  });

  it('rejects an expiry the shared contract does not admit', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: trip.id, expires_in_days: '7 days' } });
      expect(result.isError).toBe(true);
      expect(inviteRow(trip.id)).toBeUndefined();
    });
  });

  it('rotates in place: a second call replaces the token and keeps one row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const first = payload<InviteResult>(await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: trip.id } }));
      const second = payload<InviteResult>(await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: trip.id } }));
      expect(second.invite_link?.token).not.toBe(first.invite_link?.token);
      const count = testDb.prepare('SELECT COUNT(*) AS n FROM trip_invite_tokens WHERE trip_id = ?').get(trip.id) as { n: number };
      expect(count.n).toBe(1);
      expect(inviteRow(trip.id)?.token).toBe(second.invite_link?.token);
    });
  });
});

describe('Tool: delete_trip_invite_link', () => {
  it('removes the link and audits the revocation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: trip.id } });
      const result = payload<{ success: boolean }>(await h.client.callTool({ name: 'delete_trip_invite_link', arguments: { tripId: trip.id } }));
      expect(result.success).toBe(true);
      expect(inviteRow(trip.id)).toBeUndefined();
      const audit = testDb.prepare("SELECT resource FROM audit_log WHERE action = 'trip.invite_link_delete'").get() as { resource: string } | undefined;
      expect(audit?.resource).toBe(String(trip.id));
    });
  });
});

describe('trip invite link gates', () => {
  const INVITE_TOOLS = ['get_trip_invite_link', 'create_trip_invite_link', 'delete_trip_invite_link'];

  it.each(INVITE_TOOLS)('%s refuses a trip the user cannot reach', async (name) => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const foreign = createTrip(testDb, other.id);
    await withHarness(other.id, async (h) => {
      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: foreign.id } });
    });
    const existing = inviteRow(foreign.id)?.token;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: { tripId: foreign.id } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe('Trip not found or access denied.');
    });
    expect(inviteRow(foreign.id)?.token).toBe(existing);
  });

  it.each(INVITE_TOOLS)('%s refuses a trip id that does not exist', async (name) => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: { tripId: 987654 } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe('Trip not found or access denied.');
    });
  });

  it.each(INVITE_TOOLS)('%s refuses a member without share_manage', async (name) => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    await withHarness(owner.id, async (h) => {
      await h.client.callTool({ name: 'create_trip_invite_link', arguments: { tripId: trip.id } });
    });
    const existing = inviteRow(trip.id)?.token;
    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe('You do not have permission to perform this action on this trip.');
    });
    expect(inviteRow(trip.id)?.token).toBe(existing);
  });

  it.each(['create_trip_invite_link', 'delete_trip_invite_link'])('%s refuses a demo account', async (name) => {
    process.env.DEMO_MODE = 'true';
    const { user: demo } = createUser(testDb, { email: 'demo@trek.app' });
    const trip = createTrip(testDb, demo.id);
    testDb.prepare('INSERT INTO trip_invite_tokens (trip_id, token, created_by) VALUES (?, ?, ?)').run(trip.id, 'seeded-token', demo.id);
    await withHarness(demo.id, async (h) => {
      const result = await h.client.callTool({ name, arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe('Write operations are disabled in demo mode.');
    });
    expect(inviteRow(trip.id)?.token).toBe('seeded-token');
  });
});

// ---------------------------------------------------------------------------
// Scope gating: the feed tools ride trips:share, the invite tools need
// trips:share AND trips:write because the link grants membership.
// ---------------------------------------------------------------------------

describe('scope gating', () => {
  const FEED_TOOLS = [
    'get_trip_calendar_feed', 'enable_trip_calendar_feed', 'rotate_trip_calendar_feed', 'disable_trip_calendar_feed',
    'get_all_trips_calendar_feed', 'enable_all_trips_calendar_feed', 'rotate_all_trips_calendar_feed', 'disable_all_trips_calendar_feed',
  ];
  const INVITE_TOOLS = ['get_trip_invite_link', 'create_trip_invite_link', 'delete_trip_invite_link'];

  async function toolNames(scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId: 1, withResources: false, scopes });
    try {
      const { tools } = await h.client.listTools();
      return tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('a static token (null scopes) sees all eleven', async () => {
    const names = await toolNames(null);
    for (const tool of [...FEED_TOOLS, ...INVITE_TOOLS]) expect(names).toContain(tool);
  });

  it('trips:read alone sees none of them', async () => {
    const names = await toolNames(['trips:read']);
    for (const tool of [...FEED_TOOLS, ...INVITE_TOOLS]) expect(names).not.toContain(tool);
  });

  it('trips:share carries the feed tools but not the membership-granting invite link', async () => {
    const names = await toolNames(['trips:share']);
    for (const tool of FEED_TOOLS) expect(names).toContain(tool);
    for (const tool of INVITE_TOOLS) expect(names).not.toContain(tool);
  });

  it('trips:write alone carries neither', async () => {
    const names = await toolNames(['trips:write']);
    for (const tool of [...FEED_TOOLS, ...INVITE_TOOLS]) expect(names).not.toContain(tool);
  });

  it('trips:share plus trips:write unlocks the invite link', async () => {
    const names = await toolNames(['trips:share', 'trips:write']);
    for (const tool of INVITE_TOOLS) expect(names).toContain(tool);
  });
});
