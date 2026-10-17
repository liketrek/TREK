/**
 * Trip invite-link e2e — exercises /api/trips/:tripId/invite-link (manage) and
 * /api/trip-invites/:token (preview + accept) through the real JwtAuthGuard
 * against a migrated temp SQLite db (createSnapshotTestDb()), seeded and read
 * through the factories in tests/helpers/factories. TripInviteService is
 * DI-native and runs its real SQL against the temp db; only the permission check, membership join and
 * audit log are mocked. Focuses on auth (401), trip-access 404, the
 * share_manage 403, the login-required join, and invalid-token 404s (#1143).
 */
import { db } from '../../src/db/database';
import { TripInviteTokens } from '../../src/db/entities/TripInviteTokens.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { TripInviteModule } from '../../src/nest/trip-invite/trip-invite.module';
import { TripMembershipService } from '../../src/nest/trip-membership/trip-membership.service';
import { countRows, deleteRows, findRows, insertRow } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return { ...buildDbMock(createSnapshotTestDb()), canAccessTrip, getPlaceWithTags: vi.fn() };
});

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

// The join itself is stubbed out of the container (TRIP-JOIN-* cover what it
// writes); these cases assert the invite route's own decision to call it.
const joinTripAsMember = vi.fn();

// The audit domain is DI-native now: writeAudit runs for real against the temp
// db's audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

let orm: TestOrm;

describe('Trip invite-link e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), TripInviteModule],
    })
      .overrideProvider(TripMembershipService)
      .useValue({ joinTripAsMember })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  async function seedTrip(id: number, title: string, ownerId = 1) {
    await insertRow(orm, Trips, { id, title, user: ownerId });
  }
  async function seedToken(tripId: number, token: string, expiresAt: string | null = null) {
    await insertRow(orm, TripInviteTokens, { trip: tripId, token, createdByRef: 1, expires_at: expiresAt });
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test' });
    await makeUser(orm, { id: 2, username: 'e2e-user-2', email: 'e2e-2@example.test' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, TripInviteTokens);
    await deleteRows(orm, Trips);
    // 0b review L2 / security review F-B7: dead mock scaffolding — see
    // budget.e2e.test.ts's identical comment.
    checkPermission.mockReturnValue(true);
    joinTripAsMember.mockReset();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  // ── manage ──
  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/invite-link')).status).toBe(401);
  });

  it('GET returns the current link for a trip member', async () => {
    await seedTrip(5, 'Lisbon');
    await seedToken(5, 'abc');
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.token).toBe('abc');
    expect(res.body.expires_at).toBeNull();
  });

  it('GET returns { token: null } when no link exists', async () => {
    await seedTrip(5, 'Lisbon');
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: null });
  });

  it('POST creates/rotates the link', async () => {
    await seedTrip(5, 'Lisbon');
    await seedToken(5, 'old-token');
    const res = await request(server).post('/api/trips/5/invite-link').set('Cookie', sessionCookie(1)).send({});
    expect([200, 201]).toContain(res.status);
    expect(res.body.token).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(res.body.token).not.toBe('old-token');
    const rows = await findRows(orm, TripInviteTokens, { trip: 5 });
    expect(rows).toHaveLength(1);
    expect(rows[0].token).toBe(res.body.token);
  });

  it('POST with expires_in_days bounds the link life', async () => {
    await seedTrip(5, 'Lisbon');
    const res = await request(server)
      .post('/api/trips/5/invite-link')
      .set('Cookie', sessionCookie(1))
      .send({ expires_in_days: 7 });
    expect([200, 201]).toContain(res.status);
    const expires = new Date(res.body.expires_at).getTime();
    expect(expires).toBeGreaterThan(Date.now() + 6 * 86400000);
    expect(expires).toBeLessThan(Date.now() + 8 * 86400000);
  });

  it('POST 400 for a non-numeric expires_in_days string', async () => {
    await seedTrip(5, 'Lisbon');
    const res = await request(server)
      .post('/api/trips/5/invite-link')
      .set('Cookie', sessionCookie(1))
      .send({ expires_in_days: '7abc' });
    expect(res.status).toBe(400);
    expect(await countRows(orm, TripInviteTokens)).toBe(0);
  });

  it('403 to create without share_manage', async () => {
    await seedTrip(5, 'Lisbon');
    checkPermission.mockReturnValue(false);
    const res = await request(server).post('/api/trips/5/invite-link').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(403);
  });

  it('403 to READ the link without share_manage (token grants membership)', async () => {
    await seedTrip(5, 'Lisbon');
    checkPermission.mockReturnValue(false);
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(403);
  });

  it('404 when the trip is not accessible', async () => {
    // Plan 3c Task 0b: TripAccessGuard reads TripsRepository.findAccessible
    // directly now, a real query — no trip 5 row exists (nothing in this
    // test seeded one, and `beforeEach` clears the table), so the guard's
    // real 404 fires without a `canAccessTrip` mock to fake it.
    const res = await request(server).get('/api/trips/5/invite-link').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
  });

  // ── preview + accept (login required) ──
  it('401 to preview an invite without a session (login required, never registration)', async () => {
    expect((await request(server).get('/api/trip-invites/tok')).status).toBe(401);
  });

  it('preview resolves the trip title for an authed user', async () => {
    await seedTrip(9, 'Rome 2026');
    await seedToken(9, 'tok');
    const res = await request(server).get('/api/trip-invites/tok').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ trip_id: 9, title: 'Rome 2026' });
  });

  it('preview 404 for an invalid/expired token', async () => {
    await seedTrip(9, 'Rome 2026');
    await seedToken(9, 'tok', new Date(Date.now() - 3600_000).toISOString());
    expect((await request(server).get('/api/trip-invites/bad').set('Cookie', sessionCookie(2))).status).toBe(404);
    expect((await request(server).get('/api/trip-invites/tok').set('Cookie', sessionCookie(2))).status).toBe(404);
  });

  it('accept joins the current user and returns the trip id', async () => {
    await seedTrip(9, 'Rome 2026');
    await seedToken(9, 'tok');
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
