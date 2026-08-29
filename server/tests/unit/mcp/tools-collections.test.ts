/**
 * Unit tests for the collections MCP surface (CollectionsMcp, DI-discovered):
 * the 25 tools ported 1:1 from the legacy src/mcp/tools/collections.ts
 * registrar. New with the DI fold — the legacy registrar had no tool-level
 * suite — so this is a characterization of the ported behavior: payload
 * shapes, error texts (the service's thrown httpError messages surfaced via
 * fail()), the owner-only available-users gate, demo denial on writes, the
 * collections read/write scope gating, and — since the post-fold quirk pass —
 * the collections-addon `when:` gate (the legacy registrar registered
 * unconditionally while REST and the plugin host gated; the port fixed that).
 */
import { ADDON_IDS } from '../../../src/addons';
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { createUser, createTrip, createPlace, createCategory } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock, broadcastToUser } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const broadcastToUser = vi.fn();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: number | string, userId: number) =>
      db
        .prepare(
          `SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`,
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: number | string, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock, broadcastToUser };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser }));
const { notifSend } = vi.hoisted(() => ({ notifSend: vi.fn().mockResolvedValue(undefined) }));

function clearCollections() {
  testDb.exec(`
    DELETE FROM collection_place_labels;
    DELETE FROM collection_labels;
    DELETE FROM collection_place_tags;
    DELETE FROM collection_place_ratings;
    DELETE FROM collection_places;
    DELETE FROM collection_members;
    DELETE FROM collections;
    DELETE FROM place_tags;
    DELETE FROM places;
    DELETE FROM trip_members;
    DELETE FROM trips;
    DELETE FROM users;
  `);
}

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  // The collections addon is seeded DISABLED by default and every tool rides
  // the `when:` addon gate (post-fold quirk fix) — enable it for the suite.
  testDb.prepare('UPDATE addons SET enabled = 1 WHERE id = ?').run(ADDON_IDS.COLLECTIONS);
});

beforeEach(() => {
  clearCollections();
  broadcastToUser.mockClear();
  notifSend.mockClear();
  delete process.env.DEMO_MODE;
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

function errorText(result: Awaited<ReturnType<McpHarness['client']['callTool']>>): string {
  const text = (result.content as { type: string; text?: string }[]).find((c) => c.type === 'text');
  return text?.text ?? '';
}

/** Seed a collection directly (owner_id row only — no service round trip). */
function seedCollection(ownerId: number, name = 'List'): number {
  return Number(
    testDb.prepare('INSERT INTO collections (owner_id, name, sort_order) VALUES (?, ?, 0)').run(ownerId, name)
      .lastInsertRowid,
  );
}

function addMember(
  colId: number,
  userId: number,
  role: 'viewer' | 'editor' | 'admin' = 'editor',
  status: 'accepted' | 'pending' = 'accepted',
) {
  testDb
    .prepare('INSERT INTO collection_members (collection_id, user_id, status, role) VALUES (?, ?, ?, ?)')
    .run(colId, userId, status, role);
}

function seedPlace(colId: number, ownerId: number, name: string, extra: Record<string, unknown> = {}): number {
  return Number(
    testDb
      .prepare(
        'INSERT INTO collection_places (collection_id, owner_id, saved_by, name, lat, lng, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(colId, ownerId, ownerId, name, extra.lat ?? null, extra.lng ?? null, extra.status ?? 'idea').lastInsertRowid,
  );
}

// ---------------------------------------------------------------------------
// Read tools
// ---------------------------------------------------------------------------

describe('Tool: list_collections', () => {
  it('lists owned collections plus incoming invites', async () => {
    const { user } = createUser(testDb);
    const { user: inviter } = createUser(testDb);
    seedCollection(user.id, 'Mine');
    const invitedTo = seedCollection(inviter.id, 'Theirs');
    addMember(invitedTo, user.id, 'editor', 'pending');
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({ name: 'list_collections', arguments: {} })) as {
        collections: { name: string }[];
        incomingInvites: { collection_id: number }[];
      };
      expect(data.collections.map((c) => c.name)).toEqual(['Mine']);
      expect(data.incomingInvites.map((i) => i.collection_id)).toEqual([invitedTo]);
    });
  });
});

describe('Tool: get_collection', () => {
  it('returns the detail with places, labels and members', async () => {
    const { user } = createUser(testDb);
    const col = seedCollection(user.id, 'Detail');
    seedPlace(col, user.id, 'Louvre');
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({ name: 'get_collection', arguments: { collectionId: col } }),
      ) as {
        collection: { id: number; labels: unknown[] };
        places: { name: string }[];
      };
      expect(data.collection.id).toBe(col);
      expect(data.places.map((p) => p.name)).toEqual(['Louvre']);
    });
  });

  it('surfaces the 404 error text for an inaccessible collection', async () => {
    const { user } = createUser(testDb);
    const { user: owner } = createUser(testDb);
    const col = seedCollection(owner.id, 'Hidden');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_collection', arguments: { collectionId: col } });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('Collection not found');
    });
  });
});

describe('Tool: available_collection_users', () => {
  it('is owner-only: owner 200, accepted member gets the bespoke error, stranger a 404 text', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { user: invitable } = createUser(testDb);
    const col = seedCollection(owner.id, 'Members');
    addMember(col, member.id);

    await withHarness(owner.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({ name: 'available_collection_users', arguments: { collectionId: col } }),
      ) as { users: { id: number }[] };
      const ids = data.users.map((u) => u.id);
      expect(ids).toContain(invitable.id);
      expect(ids).not.toContain(owner.id);
      expect(ids).not.toContain(member.id);
    });
    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({ name: 'available_collection_users', arguments: { collectionId: col } });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('Only the collection owner can view invitable users.');
    });
    await withHarness(stranger.id, async (h) => {
      const result = await h.client.callTool({ name: 'available_collection_users', arguments: { collectionId: col } });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('Collection not found');
    });
  });
});

// ---------------------------------------------------------------------------
// Collections CRUD
// ---------------------------------------------------------------------------

describe('Tool: create_collection / update_collection / delete_collection / reorder_collections', () => {
  it('create → update → reorder → delete round trip', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(
        await h.client.callTool({ name: 'create_collection', arguments: { name: 'Italy' } }),
      ) as { collection: { id: number; name: string; is_owner: boolean } };
      expect(created.collection.name).toBe('Italy');
      expect(created.collection.is_owner).toBe(true);

      const updated = parseToolResult(
        await h.client.callTool({
          name: 'update_collection',
          arguments: { collectionId: created.collection.id, name: 'Italia' },
        }),
      ) as { collection: { name: string } };
      expect(updated.collection.name).toBe('Italia');

      const second = parseToolResult(
        await h.client.callTool({ name: 'create_collection', arguments: { name: 'France' } }),
      ) as { collection: { id: number } };
      const reordered = parseToolResult(
        await h.client.callTool({
          name: 'reorder_collections',
          arguments: { orderedIds: [second.collection.id, created.collection.id] },
        }),
      );
      expect(reordered).toEqual({ success: true });
      expect(testDb.prepare('SELECT sort_order FROM collections WHERE id = ?').get(second.collection.id)).toEqual({
        sort_order: 0,
      });

      const deleted = parseToolResult(
        await h.client.callTool({ name: 'delete_collection', arguments: { collectionId: created.collection.id } }),
      );
      expect(deleted).toEqual({ success: true });
      expect(testDb.prepare('SELECT COUNT(*) n FROM collections WHERE id = ?').get(created.collection.id)).toEqual({
        n: 0,
      });
    });
  });

  it('delete_collection is owner-only (bespoke 403 text) and update surfaces the viewer 403', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const col = seedCollection(owner.id, 'Guarded');
    addMember(col, viewer.id, 'viewer');
    await withHarness(viewer.id, async (h) => {
      const del = await h.client.callTool({ name: 'delete_collection', arguments: { collectionId: col } });
      expect(del.isError).toBe(true);
      expect(errorText(del)).toBe('Only the owner can delete this list');

      const upd = await h.client.callTool({
        name: 'update_collection',
        arguments: { collectionId: col, name: 'Nope' },
      });
      expect(upd.isError).toBe(true);
      expect(errorText(upd)).toBe('You have read-only access to this list');
    });
  });

  it('blocks demo user on writes', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_collection', arguments: { name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

describe('Tool: save_place_to_collection', () => {
  it('saves a place and returns the duplicate marker on a re-save', async () => {
    const { user } = createUser(testDb);
    const col = seedCollection(user.id, 'Dedup');
    await withHarness(user.id, async (h) => {
      const saved = parseToolResult(
        await h.client.callTool({
          name: 'save_place_to_collection',
          arguments: { collection_id: col, name: 'Eiffel Tower' },
        }),
      ) as { place?: { id: number } };
      expect(saved.place).toBeDefined();

      const dup = parseToolResult(
        await h.client.callTool({
          name: 'save_place_to_collection',
          arguments: { collection_id: col, name: 'eiffel tower' },
        }),
      ) as { duplicate?: boolean; duplicateOf?: { name: string } };
      expect(dup.duplicate).toBe(true);
      expect(dup.duplicateOf?.name).toBe('Eiffel Tower');
    });
  });
});

describe('Tool: save_trip_places_to_collection', () => {
  it('copies trip places, skipping duplicates', async () => {
    const { user } = createUser(testDb);
    createCategory(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id, { name: 'Colosseum' });
    const p2 = createPlace(testDb, trip.id, { name: 'Pantheon' });
    const col = seedCollection(user.id, 'From trip');
    seedPlace(col, user.id, 'Pantheon'); // pre-existing → duplicate
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({
          name: 'save_trip_places_to_collection',
          arguments: { collectionId: col, tripId: trip.id, placeIds: [p1.id, p2.id] },
        }),
      ) as { copied: number; skipped: { name: string }[] };
      expect(data.copied).toBe(1);
      expect(data.skipped.map((s) => s.name)).toEqual(['Pantheon']);
    });
  });
});

describe('Tool: update_collection_place / set_collection_place_status / rate_collection_place', () => {
  it('updates fields, sets status, and stores/clears a rating', async () => {
    const { user } = createUser(testDb);
    const col = seedCollection(user.id, 'P');
    const pid = seedPlace(col, user.id, 'Gate');
    await withHarness(user.id, async (h) => {
      const upd = parseToolResult(
        await h.client.callTool({
          name: 'update_collection_place',
          arguments: { placeId: pid, name: 'Brandenburg Gate' },
        }),
      ) as { place: { name: string } };
      expect(upd.place.name).toBe('Brandenburg Gate');

      const status = parseToolResult(
        await h.client.callTool({ name: 'set_collection_place_status', arguments: { placeId: pid, status: 'want' } }),
      ) as { place: { status: string } };
      expect(status.place.status).toBe('want');

      const rated = parseToolResult(
        await h.client.callTool({ name: 'rate_collection_place', arguments: { placeId: pid, rating: 5 } }),
      ) as { place: { rating_avg: number | null; rating_count: number } };
      expect(rated.place.rating_avg).toBe(5);
      expect(rated.place.rating_count).toBe(1);

      // omitted rating clears the vote (legacy `rating ?? null`)
      const cleared = parseToolResult(
        await h.client.callTool({ name: 'rate_collection_place', arguments: { placeId: pid } }),
      ) as { place: { rating_avg: number | null; rating_count: number } };
      expect(cleared.place.rating_avg).toBeNull();
      expect(cleared.place.rating_count).toBe(0);
    });
  });
});

describe('Tool: delete_collection_place', () => {
  it('deletes a place; an unknown id surfaces the 404 text', async () => {
    const { user } = createUser(testDb);
    const col = seedCollection(user.id, 'D');
    const pid = seedPlace(col, user.id, 'Gone');
    await withHarness(user.id, async (h) => {
      expect(
        parseToolResult(await h.client.callTool({ name: 'delete_collection_place', arguments: { placeId: pid } })),
      ).toEqual({ success: true });
      const missing = await h.client.callTool({ name: 'delete_collection_place', arguments: { placeId: pid } });
      expect(missing.isError).toBe(true);
      expect(errorText(missing)).toBe('Place not found');
    });
  });
});

describe('Tool: copy_collection_places_to_trip', () => {
  it('copies saved places into a trip the user can edit', async () => {
    const { user } = createUser(testDb);
    createCategory(testDb);
    const trip = createTrip(testDb, user.id);
    const col = seedCollection(user.id, 'Plan');
    const pid = seedPlace(col, user.id, 'Trevi Fountain');
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({
          name: 'copy_collection_places_to_trip',
          arguments: { trip_id: trip.id, place_ids: [pid] },
        }),
      ) as { copied: number };
      expect(data.copied).toBe(1);
      expect(
        testDb.prepare("SELECT COUNT(*) n FROM places WHERE trip_id = ? AND name = 'Trevi Fountain'").get(trip.id),
      ).toEqual({ n: 1 });
    });
  });

  it('surfaces the 404 text for a trip the user cannot access', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    createCategory(testDb);
    const trip = createTrip(testDb, other.id);
    const col = seedCollection(user.id, 'C');
    const pid = seedPlace(col, user.id, 'X');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'copy_collection_places_to_trip',
        arguments: { trip_id: trip.id, place_ids: [pid] },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('Trip not found');
    });
  });
});

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

describe('Label tools', () => {
  it('create → assign → update → unassign → delete a label', async () => {
    const { user } = createUser(testDb);
    const col = seedCollection(user.id, 'DE');
    const pid = seedPlace(col, user.id, 'Gate');
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(
        await h.client.callTool({
          name: 'create_collection_label',
          arguments: { collection_id: col, name: 'Berlin', color: '#ff0000' },
        }),
      ) as { label: { id: number; name: string } };
      expect(created.label.name).toBe('Berlin');

      const assigned = parseToolResult(
        await h.client.callTool({
          name: 'assign_collection_labels',
          arguments: { label_ids: [created.label.id], place_ids: [pid] },
        }),
      ) as { changed: number };
      expect(assigned.changed).toBe(1);

      const renamed = parseToolResult(
        await h.client.callTool({
          name: 'update_collection_label',
          arguments: { labelId: created.label.id, name: 'Museums' },
        }),
      ) as { label: { name: string } };
      expect(renamed.label.name).toBe('Museums');

      const removed = parseToolResult(
        await h.client.callTool({
          name: 'assign_collection_labels',
          arguments: { label_ids: [created.label.id], place_ids: [pid], remove: true },
        }),
      ) as { changed: number };
      expect(removed.changed).toBe(1);

      expect(
        parseToolResult(
          await h.client.callTool({ name: 'delete_collection_label', arguments: { labelId: created.label.id } }),
        ),
      ).toEqual({ success: true });
      expect(testDb.prepare('SELECT COUNT(*) n FROM collection_labels WHERE collection_id = ?').get(col)).toEqual({
        n: 0,
      });
    });
  });

  it('duplicate label name surfaces the 409 text', async () => {
    const { user } = createUser(testDb);
    const col = seedCollection(user.id, 'DE');
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_collection_label', arguments: { collection_id: col, name: 'Berlin' } });
      const dup = await h.client.callTool({
        name: 'create_collection_label',
        arguments: { collection_id: col, name: 'berlin' },
      });
      expect(dup.isError).toBe(true);
      expect(errorText(dup)).toBe('A label with this name already exists');
    });
  });
});

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

describe('Sharing tools', () => {
  it('invite → accept → set role → remove member round trip', async () => {
    const { user: owner } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const col = seedCollection(owner.id, 'Shared');

    await withHarness(owner.id, async (h) => {
      const invited = parseToolResult(
        await h.client.callTool({
          name: 'invite_to_collection',
          arguments: { collection_id: col, user_id: target.id },
        }),
      );
      expect(invited).toEqual({ success: true });
      expect(broadcastToUser).toHaveBeenCalledWith(target.id, expect.objectContaining({ type: 'collections:invite' }));
    });
    await withHarness(target.id, async (h) => {
      expect(
        parseToolResult(
          await h.client.callTool({ name: 'accept_collection_invite', arguments: { collectionId: col } }),
        ),
      ).toEqual({ success: true });
    });
    await withHarness(owner.id, async (h) => {
      expect(
        parseToolResult(
          await h.client.callTool({
            name: 'set_collection_member_role',
            arguments: { collectionId: col, userId: target.id, role: 'admin' },
          }),
        ),
      ).toEqual({ success: true });
      expect(
        testDb
          .prepare('SELECT role FROM collection_members WHERE collection_id = ? AND user_id = ?')
          .get(col, target.id),
      ).toEqual({ role: 'admin' });
      expect(
        parseToolResult(
          await h.client.callTool({
            name: 'remove_collection_member',
            arguments: { collectionId: col, userId: target.id },
          }),
        ),
      ).toEqual({ success: true });
      expect(testDb.prepare('SELECT COUNT(*) n FROM collection_members WHERE collection_id = ?').get(col)).toEqual({
        n: 0,
      });
    });
  });

  it('invite errors come back as isError text (self-invite / not owner)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const col = seedCollection(owner.id, 'OwnerOnly');
    await withHarness(owner.id, async (h) => {
      const self = await h.client.callTool({
        name: 'invite_to_collection',
        arguments: { collection_id: col, user_id: owner.id },
      });
      expect(self.isError).toBe(true);
      expect(errorText(self)).toBe('Cannot invite yourself');
    });
    await withHarness(other.id, async (h) => {
      const notOwner = await h.client.callTool({
        name: 'invite_to_collection',
        arguments: { collection_id: col, user_id: owner.id },
      });
      expect(notOwner.isError).toBe(true);
      expect(errorText(notOwner)).toBe('Not allowed');
    });
  });

  it('accept without a pending invite → error text; decline and cancel clear the pending row', async () => {
    const { user: owner } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const col = seedCollection(owner.id, 'Pending');

    await withHarness(target.id, async (h) => {
      const noInvite = await h.client.callTool({ name: 'accept_collection_invite', arguments: { collectionId: col } });
      expect(noInvite.isError).toBe(true);
      expect(errorText(noInvite)).toBe('No pending invite');
    });

    addMember(col, target.id, 'editor', 'pending');
    await withHarness(target.id, async (h) => {
      expect(
        parseToolResult(
          await h.client.callTool({ name: 'decline_collection_invite', arguments: { collectionId: col } }),
        ),
      ).toEqual({ success: true });
    });
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_members WHERE collection_id = ?').get(col)).toEqual({
      n: 0,
    });

    addMember(col, target.id, 'editor', 'pending');
    await withHarness(owner.id, async (h) => {
      expect(
        parseToolResult(
          await h.client.callTool({
            name: 'cancel_collection_invite',
            arguments: { collectionId: col, userId: target.id },
          }),
        ),
      ).toEqual({ success: true });
    });
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_members WHERE collection_id = ?').get(col)).toEqual({
      n: 0,
    });
  });

  it('leave_collection: member leaves; the owner gets the bespoke 400 text', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const col = seedCollection(owner.id, 'Leavable');
    addMember(col, member.id);
    await withHarness(member.id, async (h) => {
      expect(
        parseToolResult(await h.client.callTool({ name: 'leave_collection', arguments: { collectionId: col } })),
      ).toEqual({ success: true });
    });
    await withHarness(owner.id, async (h) => {
      const blocked = await h.client.callTool({ name: 'leave_collection', arguments: { collectionId: col } });
      expect(blocked.isError).toBe(true);
      expect(errorText(blocked)).toBe('Owner cannot leave; delete the list');
    });
  });
});

// ---------------------------------------------------------------------------
// Scope gating (collections read/write, registration-time)
// ---------------------------------------------------------------------------

const READ_TOOLS = ['list_collections', 'get_collection', 'available_collection_users'];
const WRITE_TOOLS = [
  'create_collection',
  'update_collection',
  'delete_collection',
  'reorder_collections',
  'save_place_to_collection',
  'save_trip_places_to_collection',
  'update_collection_place',
  'set_collection_place_status',
  'rate_collection_place',
  'delete_collection_place',
  'copy_collection_places_to_trip',
  'create_collection_label',
  'update_collection_label',
  'delete_collection_label',
  'assign_collection_labels',
  'invite_to_collection',
  'set_collection_member_role',
  'remove_collection_member',
  'cancel_collection_invite',
  'accept_collection_invite',
  'decline_collection_invite',
  'leave_collection',
];

describe('Collection tools — scope gating', () => {
  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers all 25 tools with null scopes (full access)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).toContain(tool);
  });

  it('registers only the read tools with collections:read', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['collections:read']);
    for (const tool of READ_TOOLS) expect(names).toContain(tool);
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });

  it('registers no collection tools for an unrelated scope', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['budget:read']);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).not.toContain(tool);
  });
});

// ---------------------------------------------------------------------------
// Addon gating — added with the post-fold quirk pass: the legacy registrar
// registered unconditionally (unlike the REST CollectionsAddonGuard and the
// plugin host's requireAddon); every entry now rides the collections addon
// via the `when:` predicate.
// ---------------------------------------------------------------------------

describe('Collection tools — collections addon gating', () => {
  it('registers nothing when the collections addon is disabled', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE addons SET enabled = 0 WHERE id = ?').run(ADDON_IDS.COLLECTIONS);
    try {
      await withHarness(user.id, async (h) => {
        const names = (await h.client.listTools()).tools.map((t) => t.name);
        for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).not.toContain(tool);
      });
    } finally {
      testDb.prepare('UPDATE addons SET enabled = 1 WHERE id = ?').run(ADDON_IDS.COLLECTIONS);
    }
  });
});
