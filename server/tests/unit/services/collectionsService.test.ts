/**
 * Unit tests for collectionsService (COLLECTIONS-SVC-001 … 040).
 * Real in-memory SQLite (full schema + migrations) so the SQL — owner/member
 * visibility, the collection-scoped dedup, the fusion state machine and the
 * widened photo-cache reference check — is exercised faithfully.
 */
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
          'SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)',
        )
        .get(userId, tripId, userId),
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock, broadcastToUser };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcastToUser, broadcast: vi.fn() }));
const notifSend = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../src/services/notificationService', () => ({ send: notifSend }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { createUser, createTrip, createPlace, createCategory, createTag, addTripMember } from '../../helpers/factories';
import * as svc from '../../../src/services/collectionsService';
import { removeIfUnreferenced } from '../../../src/services/placePhotoCache';

function clearCollections() {
  testDb.exec(`
    DELETE FROM collection_place_labels;
    DELETE FROM collection_labels;
    DELETE FROM collection_place_tags;
    DELETE FROM collection_places;
    DELETE FROM collection_members;
    DELETE FROM collections;
    DELETE FROM google_place_photo_meta;
    DELETE FROM place_tags;
    DELETE FROM places;
    DELETE FROM trip_members;
    DELETE FROM trips;
    DELETE FROM users;
  `);
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  clearCollections();
  broadcastToUser.mockClear();
  notifSend.mockClear();
});

afterAll(() => {
  testDb.close();
});

// ── Lists CRUD + visibility ──────────────────────────────────────────────────

describe('collections CRUD + visibility', () => {
  it('COLLECTIONS-SVC-001: createCollection + listCollections is owner-scoped', () => {
    const a = createUser(testDb).user;
    const b = createUser(testDb).user;
    const col = svc.createCollection(a.id, { name: 'Tokyo' });
    expect(col.is_owner).toBe(true);
    expect(col.owner_id).toBe(a.id);

    expect(svc.listCollections(a.id).collections).toHaveLength(1);
    expect(svc.listCollections(b.id).collections).toHaveLength(0);
  });

  it('COLLECTIONS-SVC-002: getCollection 404 for a non-member', () => {
    const a = createUser(testDb).user;
    const b = createUser(testDb).user;
    const col = svc.createCollection(a.id, { name: 'Private' });
    expect(() => svc.getCollection(b.id, col.id)).toThrow();
    try { svc.getCollection(b.id, col.id); } catch (e) { expect((e as { status: number }).status).toBe(404); }
  });

  it('COLLECTIONS-SVC-003: updateCollection renames; reorder only touches visible rows', () => {
    const a = createUser(testDb).user;
    const col = svc.createCollection(a.id, { name: 'Old' });
    const updated = svc.updateCollection(a.id, col.id, { name: 'New' });
    expect(updated.name).toBe('New');

    const b = createUser(testDb).user;
    const other = svc.createCollection(b.id, { name: 'B-list' }); // b's first list → sort_order 0
    svc.reorderCollections(a.id, [other.id, col.id]); // a cannot see other → skipped; col → index 1
    const otherRow = testDb.prepare('SELECT sort_order FROM collections WHERE id = ?').get(other.id) as { sort_order: number };
    const colRow = testDb.prepare('SELECT sort_order FROM collections WHERE id = ?').get(col.id) as { sort_order: number };
    expect(otherRow.sort_order).toBe(0); // untouched — not visible to a
    expect(colRow.sort_order).toBe(1); // reordered to its index in the visible-filtered list
  });
});

// ── Saved places + dedup ─────────────────────────────────────────────────────

describe('saved places + dedup', () => {
  it('COLLECTIONS-SVC-010: savePlace sets owner_id=owner, saved_by=caller, no itinerary cols', () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const col = svc.createCollection(owner.id, { name: 'Shared' });
    testDb.prepare("INSERT INTO collection_members (collection_id, user_id, status) VALUES (?, ?, 'accepted')").run(col.id, member.id);

    const res = svc.savePlace(member.id, { collection_id: col.id, name: 'Senso-ji', lat: 35.71, lng: 139.79 });
    expect(res.place).toBeDefined();
    const row = testDb.prepare('SELECT * FROM collection_places WHERE id = ?').get(res.place!.id) as Record<string, unknown>;
    expect(row.owner_id).toBe(owner.id);
    expect(row.saved_by).toBe(member.id);
    expect('reservation_status' in row).toBe(false);
    expect('place_time' in row).toBe(false);
  });

  it('COLLECTIONS-SVC-011: second identical save is a duplicate; force inserts', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'Dedup' });
    svc.savePlace(u.id, { collection_id: col.id, name: 'Eiffel Tower' });

    const dup = svc.savePlace(u.id, { collection_id: col.id, name: 'eiffel tower' });
    expect(dup.duplicate).toBe(true);
    expect(dup.duplicateOf?.name).toBe('Eiffel Tower');

    const forced = svc.savePlace(u.id, { collection_id: col.id, name: 'eiffel tower', force: true });
    expect(forced.place).toBeDefined();
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_places WHERE collection_id = ?').get(col.id)).toEqual({ n: 2 });
  });

  it('COLLECTIONS-SVC-012: savePlace attaches tags', () => {
    const u = createUser(testDb).user;
    const tag = createTag(testDb, u.id, { name: 'food' });
    const col = svc.createCollection(u.id, { name: 'Tagged' });
    const res = svc.savePlace(u.id, { collection_id: col.id, name: 'Ramen', tag_ids: [tag.id] });
    expect(res.place!.tags?.map((t) => t.name)).toContain('food');
  });

  it('COLLECTIONS-SVC-013: savePlace rejects an inaccessible collection (404)', () => {
    const a = createUser(testDb).user;
    const b = createUser(testDb).user;
    const col = svc.createCollection(a.id, { name: 'Locked' });
    expect(() => svc.savePlace(b.id, { collection_id: col.id, name: 'X' })).toThrow();
  });
});

// ── save-from-trip provenance + IDOR ─────────────────────────────────────────

describe('saveFromTripPlace', () => {
  it('COLLECTIONS-SVC-014: records provenance from a readable trip', () => {
    const u = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    const col = svc.createCollection(u.id, { name: 'From trip' });

    const res = svc.saveFromTripPlace(u.id, col.id, trip.id, place.id);
    expect(res.place!.source_trip_id).toBe(trip.id);
    expect(res.place!.source_place_id).toBe(place.id);
    expect(res.place!.name).toBe('Louvre');
  });

  it('COLLECTIONS-SVC-015: rejects a trip the user cannot read (no IDOR)', () => {
    const owner = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id, { name: 'Secret' });
    const col = svc.createCollection(stranger.id, { name: 'Mine' });

    expect(() => svc.saveFromTripPlace(stranger.id, col.id, trip.id, place.id)).toThrow();
    try { svc.saveFromTripPlace(stranger.id, col.id, trip.id, place.id); } catch (e) { expect((e as { status: number }).status).toBe(404); }
  });
});

// ── status + move ────────────────────────────────────────────────────────────

describe('status + updatePlace move', () => {
  it('COLLECTIONS-SVC-016: setStatus cycles idea→want→visited', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'S' });
    const p = svc.savePlace(u.id, { collection_id: col.id, name: 'Place' }).place!;
    expect(p.status).toBe('idea');
    expect(svc.setStatus(u.id, p.id, 'want').status).toBe('want');
    expect(svc.setStatus(u.id, p.id, 'visited').status).toBe('visited');
  });

  it('COLLECTIONS-SVC-017: updatePlace moves to another list (asserts access on target, resets owner_id)', () => {
    const owner = createUser(testDb).user;
    const a = svc.createCollection(owner.id, { name: 'A' });
    const targetOwner = createUser(testDb).user;
    const b = svc.createCollection(targetOwner.id, { name: 'B' });
    // owner is also an accepted member of b so the move target is visible to them
    testDb.prepare("INSERT INTO collection_members (collection_id, user_id, status) VALUES (?, ?, 'accepted')").run(b.id, owner.id);

    const p = svc.savePlace(owner.id, { collection_id: a.id, name: 'Movable' }).place!;
    const moved = svc.updatePlace(owner.id, p.id, { collection_id: b.id });
    expect(moved.collection_id).toBe(b.id);
    const row = testDb.prepare('SELECT owner_id FROM collection_places WHERE id = ?').get(p.id) as { owner_id: number };
    expect(row.owner_id).toBe(targetOwner.id); // reset to the target collection's owner
  });

  it('COLLECTIONS-SVC-018: updatePlace move to an inaccessible target is rejected', () => {
    const owner = createUser(testDb).user;
    const a = svc.createCollection(owner.id, { name: 'A' });
    const stranger = createUser(testDb).user;
    const b = svc.createCollection(stranger.id, { name: 'B' });
    const p = svc.savePlace(owner.id, { collection_id: a.id, name: 'X' }).place!;
    expect(() => svc.updatePlace(owner.id, p.id, { collection_id: b.id })).toThrow();
  });
});

// ── copy to trip ─────────────────────────────────────────────────────────────

describe('copyToTrip', () => {
  it('COLLECTIONS-SVC-020: reduced INSERT (itinerary defaults), skips dups, copies tags', () => {
    const u = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const tag = createTag(testDb, u.id, { name: 'must-see' });
    const col = svc.createCollection(u.id, { name: 'Plan' });
    const p1 = svc.savePlace(u.id, { collection_id: col.id, name: 'Colosseum', tag_ids: [tag.id] }).place!;

    // pre-existing trip place that should make a duplicate
    createPlace(testDb, trip.id, { name: 'Pantheon' });
    const p2 = svc.savePlace(u.id, { collection_id: col.id, name: 'Pantheon' }).place!;

    const res = svc.copyToTrip(u.id, { trip_id: trip.id, place_ids: [p1.id, p2.id] });
    expect(res.copied).toBe(1);
    expect(res.skipped.map((s) => s.name)).toEqual(['Pantheon']);

    const inserted = testDb.prepare("SELECT * FROM places WHERE trip_id = ? AND name = 'Colosseum'").get(trip.id) as Record<string, unknown>;
    expect(inserted.reservation_status).toBe('none'); // itinerary column took the table default
    expect(inserted.duration_minutes).toBe(60);
    const tagLink = testDb.prepare('SELECT COUNT(*) n FROM place_tags WHERE place_id = ?').get(inserted.id);
    expect(tagLink).toEqual({ n: 1 });
  });

  it('COLLECTIONS-SVC-021: rejects place_ids from a collection the user cannot see', () => {
    const owner = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    createCategory(testDb);
    const hidden = svc.createCollection(owner.id, { name: 'Hidden' });
    const p = svc.savePlace(owner.id, { collection_id: hidden.id, name: 'Secret' }).place!;
    const trip = createTrip(testDb, stranger.id);

    expect(() => svc.copyToTrip(stranger.id, { trip_id: trip.id, place_ids: [p.id] })).toThrow();
  });

  it('COLLECTIONS-SVC-022: rejects a trip the user cannot edit (403/404)', () => {
    const u = createUser(testDb).user;
    const owner2 = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, owner2.id); // u has no access
    const col = svc.createCollection(u.id, { name: 'C' });
    const p = svc.savePlace(u.id, { collection_id: col.id, name: 'X' }).place!;
    expect(() => svc.copyToTrip(u.id, { trip_id: trip.id, place_ids: [p.id] })).toThrow();
  });

  it('COLLECTIONS-SVC-023: a trip MEMBER can copy (place_edit allowed)', () => {
    const owner2 = createUser(testDb).user;
    const member = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, owner2.id);
    addTripMember(testDb, trip.id, member.id);
    const col = svc.createCollection(member.id, { name: 'C' });
    const p = svc.savePlace(member.id, { collection_id: col.id, name: 'Forum' }).place!;
    const res = svc.copyToTrip(member.id, { trip_id: trip.id, place_ids: [p.id] });
    expect(res.copied).toBe(1);
  });
});

// ── delete + delete-many ─────────────────────────────────────────────────────

describe('delete places', () => {
  it('COLLECTIONS-SVC-024: deletePlace + deletePlacesMany assert access', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'D' });
    const p1 = svc.savePlace(u.id, { collection_id: col.id, name: 'A' }).place!;
    const p2 = svc.savePlace(u.id, { collection_id: col.id, name: 'B' }).place!;
    svc.deletePlace(u.id, p1.id);
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_places WHERE collection_id = ?').get(col.id)).toEqual({ n: 1 });
    expect(svc.deletePlacesMany(u.id, [p2.id])).toEqual([p2.id]);
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_places WHERE collection_id = ?').get(col.id)).toEqual({ n: 0 });
  });
});

// ── Fusion state machine ─────────────────────────────────────────────────────

describe('fusion invitations', () => {
  function setup() {
    const owner = createUser(testDb).user;
    const target = createUser(testDb).user;
    const col = svc.createCollection(owner.id, { name: 'Fusion' });
    return { owner, target, col };
  }

  it('COLLECTIONS-SVC-030: sendInvite — self 400, unknown 404, non-owner 403, happy path', async () => {
    const { owner, target, col } = setup();
    expect(svc.sendInvite(col.id, owner.id, owner.username, owner.email, owner.id).status).toBe(400);
    expect(svc.sendInvite(col.id, owner.id, owner.username, owner.email, 99999).status).toBe(404);
    expect(svc.sendInvite(col.id, target.id, target.username, target.email, owner.id).status).toBe(403); // non-owner inviter

    const ok = svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    expect(ok.error).toBeUndefined();
    expect(broadcastToUser).toHaveBeenCalledWith(target.id, expect.objectContaining({ type: 'collections:invite' }));
    // the notification send is fire-and-forget via a dynamic import — flush microtasks.
    await vi.waitFor(() => expect(notifSend).toHaveBeenCalledWith(expect.objectContaining({ event: 'collection_invite', targetId: target.id })));
  });

  it('COLLECTIONS-SVC-031: double-invite while pending → 400; existing member → 400', () => {
    const { owner, target, col } = setup();
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    expect(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id).status).toBe(400);
    svc.acceptInvite(target.id, col.id, undefined);
    expect(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id).error).toBe('Already a member');
  });

  it('COLLECTIONS-SVC-032: acceptInvite — 404 with no pending; flips to accepted → member now sees list', () => {
    const { owner, target, col } = setup();
    expect(svc.acceptInvite(target.id, col.id, undefined).status).toBe(404);
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    expect(svc.acceptInvite(target.id, col.id, undefined).error).toBeUndefined();
    expect(svc.listCollections(target.id).collections.map((c) => c.id)).toContain(col.id);
  });

  it('COLLECTIONS-SVC-033: accept-after-cancel → 404 (no orphan accept)', () => {
    const { owner, target, col } = setup();
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    svc.cancelInvite(col.id, owner.id, target.id);
    expect(svc.acceptInvite(target.id, col.id, undefined).status).toBe(404);
  });

  it('COLLECTIONS-SVC-034: declineInvite removes the pending row', () => {
    const { owner, target, col } = setup();
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    svc.declineInvite(target.id, col.id, undefined);
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_members WHERE collection_id = ?').get(col.id)).toEqual({ n: 0 });
  });

  it('COLLECTIONS-SVC-035: cancelInvite is owner-only', () => {
    const { owner, target, col } = setup();
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    expect(() => svc.cancelInvite(col.id, target.id, target.id)).toThrow(); // non-owner
    svc.cancelInvite(col.id, owner.id, target.id); // owner ok
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_members WHERE collection_id = ?').get(col.id)).toEqual({ n: 0 });
  });

  it('COLLECTIONS-SVC-036: leaveCollection — member ok, owner blocked (400)', () => {
    const { owner, target, col } = setup();
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    svc.acceptInvite(target.id, col.id, undefined);
    svc.leaveCollection(target.id, col.id, undefined);
    expect(svc.listCollections(target.id).collections.map((c) => c.id)).not.toContain(col.id);

    expect(() => svc.leaveCollection(owner.id, col.id, undefined)).toThrow();
    try { svc.leaveCollection(owner.id, col.id, undefined); } catch (e) { expect((e as { status: number }).status).toBe(400); }
  });

  it('COLLECTIONS-SVC-037: availableUsers is scoped to THIS collection only (no one-fusion bug)', () => {
    const owner = createUser(testDb).user;
    const target = createUser(testDb).user;
    const colA = svc.createCollection(owner.id, { name: 'A' });
    const colB = svc.createCollection(owner.id, { name: 'B' });
    // target is accepted in A; must still be invitable to B
    svc.sendInvite(colA.id, owner.id, owner.username, owner.email, target.id);
    svc.acceptInvite(target.id, colA.id, undefined);

    const forB = svc.availableUsers(owner.id, colB.id).map((u) => u.id);
    expect(forB).toContain(target.id);
    const forA = svc.availableUsers(owner.id, colA.id).map((u) => u.id);
    expect(forA).not.toContain(target.id); // already a member of A
  });

  it('COLLECTIONS-SVC-038: availableUsers excludes self + guests', () => {
    const owner = createUser(testDb).user;
    const normal = createUser(testDb).user;
    const guest = createUser(testDb).user;
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
    const col = svc.createCollection(owner.id, { name: 'C' });
    const ids = svc.availableUsers(owner.id, col.id).map((u) => u.id);
    expect(ids).toContain(normal.id);
    expect(ids).not.toContain(owner.id);
    expect(ids).not.toContain(guest.id);
  });

  it('COLLECTIONS-SVC-039: visibility = owner OR accepted member (pending does NOT grant access)', () => {
    const { owner, target, col } = setup();
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id);
    expect(() => svc.getCollection(target.id, col.id)).toThrow(); // pending, no access yet
    svc.acceptInvite(target.id, col.id, undefined);
    expect(svc.getCollection(target.id, col.id).collection.id).toBe(col.id);
  });
});

// ── deleteCollection snapshot + broadcast + cascade ──────────────────────────

describe('deleteCollection', () => {
  it('COLLECTIONS-SVC-040: owner-only; snapshots accepted+pending, broadcasts collections:deleted, cascades', () => {
    const owner = createUser(testDb).user;
    const accepted = createUser(testDb).user;
    const pending = createUser(testDb).user;
    const col = svc.createCollection(owner.id, { name: 'Doomed' });
    svc.savePlace(owner.id, { collection_id: col.id, name: 'P' });
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, accepted.id);
    svc.acceptInvite(accepted.id, col.id, undefined);
    svc.sendInvite(col.id, owner.id, owner.username, owner.email, pending.id);

    // a non-owner member cannot delete
    expect(() => svc.deleteCollection(accepted.id, col.id)).toThrow();

    broadcastToUser.mockClear();
    svc.deleteCollection(owner.id, col.id);

    const targets = broadcastToUser.mock.calls.map((c) => c[0]);
    expect(targets).toEqual(expect.arrayContaining([accepted.id, pending.id]));
    expect(targets).not.toContain(owner.id);
    expect(broadcastToUser.mock.calls.every((c) => (c[1] as { type: string }).type === 'collections:deleted')).toBe(true);

    expect(testDb.prepare('SELECT COUNT(*) n FROM collections WHERE id = ?').get(col.id)).toEqual({ n: 0 });
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_places WHERE collection_id = ?').get(col.id)).toEqual({ n: 0 });
    expect(testDb.prepare('SELECT COUNT(*) n FROM collection_members WHERE collection_id = ?').get(col.id)).toEqual({ n: 0 });
  });
});

// ── owner_id semantics: member account deletion keeps shared content ─────────

describe('owner_id semantics', () => {
  it('COLLECTIONS-SVC-041: deleting a MEMBER account nulls saved_by but keeps the place', () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const col = svc.createCollection(owner.id, { name: 'Shared' });
    testDb.prepare("INSERT INTO collection_members (collection_id, user_id, status) VALUES (?, ?, 'accepted')").run(col.id, member.id);
    const p = svc.savePlace(member.id, { collection_id: col.id, name: 'Kept' }).place!;

    testDb.prepare('DELETE FROM users WHERE id = ?').run(member.id);

    const row = testDb.prepare('SELECT owner_id, saved_by FROM collection_places WHERE id = ?').get(p.id) as { owner_id: number; saved_by: number | null };
    expect(row).toBeDefined();
    expect(row.owner_id).toBe(owner.id);
    expect(row.saved_by).toBeNull(); // ON DELETE SET NULL
  });
});

// ── Photo-cache guard ────────────────────────────────────────────────────────

describe('photo-cache widening', () => {
  it('COLLECTIONS-SVC-042: a collection_places row keeps a photo no places row references', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'Photos' });
    // cache meta for place_id 'gp-x', referenced ONLY by a collection_places row.
    testDb.prepare('INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at) VALUES (?, ?, ?)').run('gp-x', null, Date.now());
    svc.savePlace(u.id, { collection_id: col.id, name: 'Cached', google_place_id: 'gp-x' });

    removeIfUnreferenced('gp-x'); // would evict if isReferenced ignored collection_places

    const meta = testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('gp-x');
    expect(meta).toBeDefined();
  });

  it('COLLECTIONS-SVC-043: an unreferenced photo is still reclaimable', () => {
    testDb.prepare('INSERT INTO google_place_photo_meta (place_id, attribution, fetched_at) VALUES (?, ?, ?)').run('gp-orphan', null, Date.now());
    removeIfUnreferenced('gp-orphan');
    const meta = testDb.prepare('SELECT 1 FROM google_place_photo_meta WHERE place_id = ?').get('gp-orphan');
    expect(meta).toBeUndefined();
  });
});

// ── Labels ───────────────────────────────────────────────────────────────────

function addMember(colId: number, userId: number, role: 'viewer' | 'editor' | 'admin') {
  testDb.prepare("INSERT INTO collection_members (collection_id, user_id, status, role) VALUES (?, ?, 'accepted', ?)").run(colId, userId, role);
}

describe('collection labels', () => {
  it('COLLECTIONS-SVC-050: createLabel is returned by getCollection; duplicate name is 409', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'Germany' });
    const label = svc.createLabel(u.id, col.id, 'Berlin', '#ff0000');
    expect(label.name).toBe('Berlin');
    expect(label.collection_id).toBe(col.id);
    expect(svc.getCollection(u.id, col.id).collection.labels).toHaveLength(1);

    expect(() => svc.createLabel(u.id, col.id, 'berlin')).toThrow(); // case-insensitive dup
    try { svc.createLabel(u.id, col.id, 'berlin'); } catch (e) { expect((e as { status: number }).status).toBe(409); }
  });

  it('COLLECTIONS-SVC-051: a viewer cannot manage labels (403); an editor can', () => {
    const owner = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    const col = svc.createCollection(owner.id, { name: 'Trip' });
    addMember(col.id, viewer.id, 'viewer');
    try { svc.createLabel(viewer.id, col.id, 'X'); } catch (e) { expect((e as { status: number }).status).toBe(403); }

    const editor = createUser(testDb).user;
    addMember(col.id, editor.id, 'editor');
    expect(svc.createLabel(editor.id, col.id, 'Museums').id).toBeGreaterThan(0);
  });

  it('COLLECTIONS-SVC-052: updatePlace label_ids sets labels; a label from another list is ignored', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'DE' });
    const other = svc.createCollection(u.id, { name: 'Other' });
    const l1 = svc.createLabel(u.id, col.id, 'Berlin');
    const foreign = svc.createLabel(u.id, other.id, 'Paris');
    const place = svc.savePlace(u.id, { collection_id: col.id, name: 'Gate' }).place!;
    svc.updatePlace(u.id, place.id, { label_ids: [l1.id, foreign.id] });
    const stored = svc.getCollection(u.id, col.id).places.find(p => p.id === place.id)!;
    expect(stored.label_ids).toEqual([l1.id]);
  });

  it('COLLECTIONS-SVC-053: assignLabels bulk-adds then unassigns across places', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'DE' });
    const l = svc.createLabel(u.id, col.id, 'Coast');
    const p1 = svc.savePlace(u.id, { collection_id: col.id, name: 'A' }).place!;
    const p2 = svc.savePlace(u.id, { collection_id: col.id, name: 'B' }).place!;

    expect(svc.assignLabels(u.id, [l.id], [p1.id, p2.id], false).changed).toBe(2);
    expect(svc.getCollection(u.id, col.id).places.every(p => p.label_ids?.includes(l.id))).toBe(true);

    svc.assignLabels(u.id, [l.id], [p1.id], true);
    const after = svc.getCollection(u.id, col.id).places;
    expect(after.find(p => p.id === p1.id)!.label_ids).toEqual([]);
    expect(after.find(p => p.id === p2.id)!.label_ids).toEqual([l.id]);
  });

  it('COLLECTIONS-SVC-054: deleteLabel removes it and cascades its place assignments', () => {
    const u = createUser(testDb).user;
    const col = svc.createCollection(u.id, { name: 'DE' });
    const l = svc.createLabel(u.id, col.id, 'Berlin');
    const p = svc.savePlace(u.id, { collection_id: col.id, name: 'Gate' }).place!;
    svc.updatePlace(u.id, p.id, { label_ids: [l.id] });

    svc.deleteLabel(u.id, l.id);
    expect(svc.getCollection(u.id, col.id).collection.labels).toHaveLength(0);
    expect(svc.getCollection(u.id, col.id).places.find(x => x.id === p.id)!.label_ids).toEqual([]);
  });

  it('COLLECTIONS-SVC-055: moving a place to another list drops its labels', () => {
    const u = createUser(testDb).user;
    const a = svc.createCollection(u.id, { name: 'A' });
    const b = svc.createCollection(u.id, { name: 'B' });
    const l = svc.createLabel(u.id, a.id, 'Berlin');
    const p = svc.savePlace(u.id, { collection_id: a.id, name: 'Gate' }).place!;
    svc.updatePlace(u.id, p.id, { label_ids: [l.id] });

    svc.updatePlace(u.id, p.id, { collection_id: b.id });
    expect(svc.getCollection(u.id, b.id).places.find(x => x.id === p.id)!.label_ids).toEqual([]);
  });
});
