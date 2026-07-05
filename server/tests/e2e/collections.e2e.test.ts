/**
 * Collections e2e — drives /api/addons/collections through the REAL JwtAuthGuard
 * AND the real collectionsService against a temp SQLite db (full schema). Only the
 * addon flag, websocket and notification send are mocked. Covers: the addon gate
 * (404 before auth), auth, CRUD happy paths, invite/accept/decline, copy-to-trip,
 * cross-user 404s and the non-owner 403 on /:id/available-users (no enumeration).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: () => null,
  canAccessTrip: (tripId: number | string, userId: number) =>
    db.prepare('SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)').get(userId, tripId, userId),
  isOwner: () => false,
}));

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));
vi.mock('../../src/services/adminService', () => ({ isAddonEnabled }));
vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { createUser, createTrip, createCategory } from '../helpers/factories';
import { CollectionsModule } from '../../src/nest/collections/collections.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Collections e2e (real auth guard + real service + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let ownerId: number;
  let otherId: number;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [CollectionsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    createTables(db as never);
    runMigrations(db as never);
    ownerId = createUser(db as never, { username: 'owner', email: 'owner@test.example' }).user.id;
    otherId = createUser(db as never, { username: 'other', email: 'other@test.example' }).user.id;
    createCategory(db as never);
    tripId = createTrip(db as never, ownerId).id;
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    isAddonEnabled.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Addon gate ───────────────────────────────────────────────────────────
  it('COLLECTIONS-E2E-001: addon disabled → 404 before auth (no cookie)', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/addons/collections');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Collections addon is not enabled' });
  });

  it('COLLECTIONS-E2E-002: addon disabled → 404 on a deep route too', async () => {
    isAddonEnabled.mockReturnValue(false);
    expect((await request(server).post('/api/addons/collections').send({ name: 'X' })).status).toBe(404);
    expect((await request(server).get('/api/addons/collections/1')).status).toBe(404);
  });

  it('COLLECTIONS-E2E-003: addon enabled but no cookie → 401', async () => {
    expect((await request(server).get('/api/addons/collections')).status).toBe(401);
  });

  // ── CRUD happy path ──────────────────────────────────────────────────────
  it('COLLECTIONS-E2E-010: create → list → get a collection', async () => {
    const created = await request(server).post('/api/addons/collections')
      .set('Cookie', sessionCookie(ownerId)).send({ name: 'Italy' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Italy');
    const id = created.body.id;

    const list = await request(server).get('/api/addons/collections').set('Cookie', sessionCookie(ownerId));
    expect(list.status).toBe(200);
    expect(list.body.collections.map((c: { id: number }) => c.id)).toContain(id);
    expect(list.body).toHaveProperty('incomingInvites');

    const detail = await request(server).get(`/api/addons/collections/${id}`).set('Cookie', sessionCookie(ownerId));
    expect(detail.status).toBe(200);
    expect(detail.body.collection.id).toBe(id);
    expect(detail.body.places).toEqual([]);
  });

  it('COLLECTIONS-E2E-011: save a place (200) then copy it to a trip', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Trip plan' })).body;
    const saved = await request(server).post('/api/addons/collections/places')
      .set('Cookie', sessionCookie(ownerId)).set('X-Socket-Id', 'sock-1').send({ collection_id: col.id, name: 'Trevi Fountain', lat: 41.9, lng: 12.48 });
    expect(saved.status).toBe(200);
    expect(saved.body.place.name).toBe('Trevi Fountain');

    const copy = await request(server).post('/api/addons/collections/copy-to-trip')
      .set('Cookie', sessionCookie(ownerId)).send({ trip_id: tripId, place_ids: [saved.body.place.id] });
    expect(copy.status).toBe(200);
    expect(copy.body.copied).toBe(1);
    const placed = db.prepare("SELECT reservation_status FROM places WHERE trip_id = ? AND name = 'Trevi Fountain'").get(tripId) as { reservation_status: string };
    expect(placed.reservation_status).toBe('none'); // itinerary defaults
  });

  // Regression for #1437: editing a place (PATCH without a status field) must NOT
  // reset a 'want'/'visited' place back to 'idea'.
  it('COLLECTIONS-E2E-012: PATCH without status leaves the saved status unchanged', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Statuses' })).body;
    const saved = await request(server).post('/api/addons/collections/places')
      .set('Cookie', sessionCookie(ownerId)).send({ collection_id: col.id, name: 'Colosseum', status: 'want' });
    expect(saved.status).toBe(200);
    const placeId = saved.body.place.id;
    expect(db.prepare('SELECT status FROM collection_places WHERE id = ?').get(placeId)).toEqual({ status: 'want' });

    const patched = await request(server).patch(`/api/addons/collections/places/${placeId}`)
      .set('Cookie', sessionCookie(ownerId)).send({ name: 'Colosseo' });
    expect(patched.status).toBe(200);
    expect(db.prepare('SELECT status FROM collection_places WHERE id = ?').get(placeId)).toEqual({ status: 'want' });
  });

  // ── Cross-user isolation ─────────────────────────────────────────────────
  it('COLLECTIONS-E2E-020: a stranger gets 404 on someone else’s collection', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Private' })).body;
    const res = await request(server).get(`/api/addons/collections/${col.id}`).set('Cookie', sessionCookie(otherId));
    expect(res.status).toBe(404);
  });

  // ── Fusion ───────────────────────────────────────────────────────────────
  it('COLLECTIONS-E2E-030: invite → accept → member sees the list → decline path', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Shared' })).body;

    const invite = await request(server).post('/api/addons/collections/invite')
      .set('Cookie', sessionCookie(ownerId)).send({ collection_id: col.id, user_id: otherId });
    expect(invite.status).toBe(200);

    // recipient sees it as an incoming invite
    const inbox = await request(server).get('/api/addons/collections').set('Cookie', sessionCookie(otherId));
    expect(inbox.body.incomingInvites.map((i: { collection_id: number }) => i.collection_id)).toContain(col.id);

    const accept = await request(server).post('/api/addons/collections/invite/accept')
      .set('Cookie', sessionCookie(otherId)).set('X-Socket-Id', 'sock-9').send({ collection_id: col.id });
    expect(accept.status).toBe(200);

    const memberList = await request(server).get('/api/addons/collections').set('Cookie', sessionCookie(otherId));
    expect(memberList.body.collections.map((c: { id: number }) => c.id)).toContain(col.id);

    const leave = await request(server).post('/api/addons/collections/leave')
      .set('Cookie', sessionCookie(otherId)).send({ collection_id: col.id });
    expect(leave.status).toBe(200);
  });

  it('COLLECTIONS-E2E-031: invite is owner-only (non-owner → 403, not 404 leak after access)', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'OwnerOnly' })).body;
    // a complete stranger cannot even see it → 404
    const stranger = await request(server).post('/api/addons/collections/invite')
      .set('Cookie', sessionCookie(otherId)).send({ collection_id: col.id, user_id: ownerId });
    expect(stranger.status).toBe(404);
  });

  // ── available-users owner guard ──────────────────────────────────────────
  it('COLLECTIONS-E2E-040: /:id/available-users — owner 200, stranger 404 (no enumeration)', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Members' })).body;

    const ok = await request(server).get(`/api/addons/collections/${col.id}/available-users`).set('Cookie', sessionCookie(ownerId));
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body.users)).toBe(true);
    expect(ok.body.users.map((u: { id: number }) => u.id)).not.toContain(ownerId);

    const denied = await request(server).get(`/api/addons/collections/${col.id}/available-users`).set('Cookie', sessionCookie(otherId));
    expect(denied.status).toBe(404); // not visible → 404 (never reveals existence to a non-member)
  });

  it('COLLECTIONS-E2E-041: an accepted member (non-owner) hitting available-users gets 403', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Members2' })).body;
    await request(server).post('/api/addons/collections/invite').set('Cookie', sessionCookie(ownerId)).send({ collection_id: col.id, user_id: otherId });
    await request(server).post('/api/addons/collections/invite/accept').set('Cookie', sessionCookie(otherId)).send({ collection_id: col.id });

    const res = await request(server).get(`/api/addons/collections/${col.id}/available-users`).set('Cookie', sessionCookie(otherId));
    expect(res.status).toBe(403); // visible (member) but not owner
  });

  // ── Labels ─────────────────────────────────────────────────────────────────
  it('COLLECTIONS-E2E-060: a label route is addon-gated (404 when disabled)', async () => {
    isAddonEnabled.mockReturnValue(false);
    expect((await request(server).post('/api/addons/collections/labels').send({ collection_id: 1, name: 'X' })).status).toBe(404);
  });

  it('COLLECTIONS-E2E-061: create a label, assign it to a place, read it back on the detail', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Germany' })).body;
    const place = (await request(server).post('/api/addons/collections/places')
      .set('Cookie', sessionCookie(ownerId)).send({ collection_id: col.id, name: 'Gate' })).body.place;

    const label = await request(server).post('/api/addons/collections/labels')
      .set('Cookie', sessionCookie(ownerId)).set('X-Socket-Id', 'sock-2').send({ collection_id: col.id, name: 'Berlin', color: '#ff0000' });
    expect(label.status).toBe(200);
    expect(label.body.name).toBe('Berlin');

    const assign = await request(server).post('/api/addons/collections/labels/assign')
      .set('Cookie', sessionCookie(ownerId)).send({ label_ids: [label.body.id], place_ids: [place.id] });
    expect(assign.status).toBe(200);
    expect(assign.body.changed).toBe(1);

    const detail = await request(server).get(`/api/addons/collections/${col.id}`).set('Cookie', sessionCookie(ownerId));
    expect(detail.body.collection.labels.map((l: { name: string }) => l.name)).toContain('Berlin');
    expect(detail.body.places.find((p: { id: number }) => p.id === place.id).label_ids).toContain(label.body.id);
  });

  it('COLLECTIONS-E2E-062: a stranger cannot create a label on someone else’s list (404)', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Secret' })).body;
    const res = await request(server).post('/api/addons/collections/labels')
      .set('Cookie', sessionCookie(otherId)).send({ collection_id: col.id, name: 'Nope' });
    expect(res.status).toBe(404);
  });

  // ── delete ───────────────────────────────────────────────────────────────
  it('COLLECTIONS-E2E-050: owner deletes; non-owner member cannot (403)', async () => {
    const col = (await request(server).post('/api/addons/collections').set('Cookie', sessionCookie(ownerId)).send({ name: 'Doomed' })).body;
    await request(server).post('/api/addons/collections/invite').set('Cookie', sessionCookie(ownerId)).send({ collection_id: col.id, user_id: otherId });
    await request(server).post('/api/addons/collections/invite/accept').set('Cookie', sessionCookie(otherId)).send({ collection_id: col.id });

    expect((await request(server).delete(`/api/addons/collections/${col.id}`).set('Cookie', sessionCookie(otherId))).status).toBe(403);
    expect((await request(server).delete(`/api/addons/collections/${col.id}`).set('Cookie', sessionCookie(ownerId))).status).toBe(200);
    expect(db.prepare('SELECT COUNT(*) n FROM collections WHERE id = ?').get(col.id)).toEqual({ n: 0 });
  });
});
