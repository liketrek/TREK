/**
 * Trip invite-link e2e — exercises /api/trips/:tripId/invite-link (manage) and
 * /api/trip-invites/:token (preview + accept) through the real JwtAuthGuard
 * against a temp SQLite db. TripInviteService is DI-native and runs its real
 * SQL against the temp db; only the permission check, membership join and
 * audit log are mocked. Focuses on auth (401), trip-access 404, the
 * share_manage 403, the login-required join, and invalid-token 404s (#1143).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT);');
  // TripInviteService now runs its real SQL (DI-injected, no mock) — mirror of
  // the trip_invite_tokens DDL from migration 153.
  tmp.exec(`CREATE TABLE trip_invite_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    expires_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // AuditService now runs its real INSERT (DI-injected, no mock) — slim
  // audit_log mirror (no FKs), same shape as plugin-runtime.test.ts.
  tmp.exec(`CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER, action TEXT NOT NULL, resource TEXT, details TEXT, ip TEXT);`);
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db, canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

// The join itself is stubbed out of the container (TRIP-JOIN-* cover what it
// writes); these cases assert the invite route's own decision to call it.
const joinTripAsMember = vi.fn();

// The audit domain is DI-native now: writeAudit runs for real against the temp
// db's audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));

import { TripInviteModule } from '../../src/nest/trip-invite/trip-invite.module';
import { TripMembershipService } from '../../src/nest/trip-membership/trip-membership.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Trip invite-link e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, TripInviteModule] })
      .overrideProvider(TripMembershipService).useValue({ joinTripAsMember })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  function seedTrip(id: number, title: string) {
    db.prepare('INSERT INTO trips (id, title) VALUES (?, ?)').run(id, title);
  }
  function seedToken(tripId: number, token: string, expiresAt: string | null = null) {
    db.prepare('INSERT INTO trip_invite_tokens (trip_id, token, created_by, expires_at) VALUES (?, ?, 1, ?)')
      .run(tripId, token, expiresAt);
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    seedUser(db as never, { id: 2, username: 'e2e-user-2', email: 'e2e-2@example.test' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM trip_invite_tokens').run();
    db.prepare('DELETE FROM trips').run();
    canAccessTrip.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
    joinTripAsMember.mockReset();
  });

  afterAll(async () => { await app.close(); });

  // ── manage ──
  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/invite-link')).status).toBe(401);
  });

  it('GET returns the current link for a trip member', async () => {
    seedTrip(5, 'Lisbon');
    seedToken(5, 'abc');
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.token).toBe('abc');
    expect(res.body.expires_at).toBeNull();
  });

  it('GET returns { token: null } when no link exists', async () => {
    seedTrip(5, 'Lisbon');
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: null });
  });

  it('POST creates/rotates the link', async () => {
    seedTrip(5, 'Lisbon');
    seedToken(5, 'old-token');
    const res = await request(server).post('/api/trips/5/invite-link').set('Cookie', sessionCookie(1)).send({});
    expect([200, 201]).toContain(res.status);
    expect(res.body.token).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(res.body.token).not.toBe('old-token');
    const rows = db.prepare('SELECT token FROM trip_invite_tokens WHERE trip_id = 5').all() as { token: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].token).toBe(res.body.token);
  });

  it('POST with expires_in_days bounds the link life', async () => {
    seedTrip(5, 'Lisbon');
    const res = await request(server).post('/api/trips/5/invite-link').set('Cookie', sessionCookie(1))
      .send({ expires_in_days: 7 });
    expect([200, 201]).toContain(res.status);
    const expires = new Date(res.body.expires_at).getTime();
    expect(expires).toBeGreaterThan(Date.now() + 6 * 86400000);
    expect(expires).toBeLessThan(Date.now() + 8 * 86400000);
  });

  it('POST 400 for a non-numeric expires_in_days string', async () => {
    seedTrip(5, 'Lisbon');
    const res = await request(server).post('/api/trips/5/invite-link').set('Cookie', sessionCookie(1))
      .send({ expires_in_days: '7abc' });
    expect(res.status).toBe(400);
    expect(db.prepare('SELECT COUNT(*) AS n FROM trip_invite_tokens').get()).toEqual({ n: 0 });
  });

  it('403 to create without share_manage', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post('/api/trips/5/invite-link').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(403);
  });

  it('403 to READ the link without share_manage (token grants membership)', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(403);
  });

  it('404 when the trip is not accessible', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
  });

  // ── preview + accept (login required) ──
  it('401 to preview an invite without a session (login required, never registration)', async () => {
    expect((await request(server).get('/api/trip-invites/tok')).status).toBe(401);
  });

  it('preview resolves the trip title for an authed user', async () => {
    seedTrip(9, 'Rome 2026');
    seedToken(9, 'tok');
    const res = await request(server).get('/api/trip-invites/tok').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ trip_id: 9, title: 'Rome 2026' });
  });

  it('preview 404 for an invalid/expired token', async () => {
    seedTrip(9, 'Rome 2026');
    seedToken(9, 'tok', new Date(Date.now() - 3600_000).toISOString());
    expect((await request(server).get('/api/trip-invites/bad').set('Cookie', sessionCookie(2))).status).toBe(404);
    expect((await request(server).get('/api/trip-invites/tok').set('Cookie', sessionCookie(2))).status).toBe(404);
  });

  it('accept joins the current user and returns the trip id', async () => {
    seedTrip(9, 'Rome 2026');
    seedToken(9, 'tok');
    joinTripAsMember.mockReturnValueOnce({ joined: true, tripId: 9 });
    const res = await request(server).post('/api/trip-invites/tok/accept').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ trip_id: 9, joined: true });
    expect(joinTripAsMember).toHaveBeenCalledWith(9, 2, null);
  });

  it('accept 404 for an invalid/expired token (no join attempted)', async () => {
    const res = await request(server).post('/api/trip-invites/bad/accept').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(404);
    expect(joinTripAsMember).not.toHaveBeenCalled();
  });

  it('401 to accept without a session', async () => {
    expect((await request(server).post('/api/trip-invites/tok/accept')).status).toBe(401);
  });
});
