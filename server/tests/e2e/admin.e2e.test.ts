/**
 * Admin e2e — exercises the migrated /api/admin endpoints through the real
 * JwtAuthGuard + AdminGuard against a migrated temp SQLite db
 * (createSnapshotTestDb()), DI-native: no services/adminService path mock, so
 * every route below runs its real SQL (trips.e2e.test.ts pattern). Only the
 * shared db module is mocked; rows are seeded and read through the factories
 * in tests/helpers/factories. Covers auth (401), the admin gate (403), create-201,
 * validation 400, the dev-only 404, and real read/write round trips.
 */
import { db } from '../../src/db/database';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { InviteTokens } from '../../src/db/entities/InviteTokens.entity';
import { PackingTemplates } from '../../src/db/entities/PackingTemplates.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { AdminModule } from '../../src/nest/admin/admin.module';
import { DatabaseBackupModule } from '../../src/nest/backup/database-backup.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
// The admin surface is no longer one module: oidc, the account defaults and the admin
// preference matrix moved to the domains that own them, so the app has to assemble
// them too or those routes 404 here while working in production.
import { OidcModule } from '../../src/nest/oidc/oidc.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { SettingsModule } from '../../src/nest/settings/settings.module';
import { countRows, findRow, insertRow } from '../helpers/factories/rows';
import { readAppSetting } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
// The audit domain is DI-native: writeAudit runs for real against the temp db's
// audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
vi.mock('../../src/mcp', () => ({ invalidateMcpSessions: vi.fn() }));
vi.mock('../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn(), revokeUserSessionsForClient: vi.fn() }));
// Preferences are a provider since the notifications fold; stub the two methods
// the admin surface calls on the prototype, so AdminService still resolves it
// through DI.
vi.mock('../../src/nest/notifications/notification-preferences.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/notifications/notification-preferences.service')>();
  actual.NotificationPreferencesService.prototype.getPreferencesMatrix = vi.fn(() => ({}) as never);
  actual.NotificationPreferencesService.prototype.setAdminPreferences = vi.fn();
  return actual;
});

let orm: TestOrm;

describe('Admin e2e (real auth + admin guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    // DatabaseBackupModule is global and lives in the backup domain, which the
    // app imports through BackupModule; the admin surface injects its port for
    // the demo baseline and reset, so a harness without BackupModule adds it.
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        DatabaseBackupModule,
        RealtimeModule,
        AdminModule,
        OidcModule,
        SettingsModule,
        NotificationsModule,
      ],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // against their @trek/shared schemas.
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeAdmin(orm, { id: 1, email: 'admin@example.test', username: 'admin' });
    await makeUser(orm, { id: 2, email: 'member@example.test', username: 'member' });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session', async () => {
    expect((await request(server).get('/api/admin/users')).status).toBe(401);
  });

  it('403 for a non-admin', async () => {
    const res = await request(server).get('/api/admin/users').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });

  it('200 list for an admin — real rows, guests excluded', async () => {
    const res = await request(server).get('/api/admin/users').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.users.map((u: { email: string }) => u.email).sort()).toEqual([
      'admin@example.test',
      'member@example.test',
    ]);
    expect(res.body.users[0]).toHaveProperty('avatar_url');
  });

  it('201 on user create — persists the row and writes an audit entry', async () => {
    const res = await request(server)
      .post('/api/admin/users')
      .set('Cookie', sessionCookie(1))
      .send({ username: 'created', email: 'new@x.y', password: 'Str0ng!Pass', role: 'user' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: 'created', email: 'new@x.y', role: 'user' });

    const created = await findRow(orm, Users, { email: 'new@x.y' });
    expect(created && { username: created.username, role: created.role }).toEqual({
      username: 'created',
      role: 'user',
    });
    const audit = await findRow(orm, AuditLog, { action: 'admin.user_create' });
    expect(audit).not.toBeNull();
  });

  it('400 on user create with a weak password', async () => {
    const res = await request(server)
      .post('/api/admin/users')
      .set('Cookie', sessionCookie(1))
      .send({ username: 'weak', email: 'weak@x.y', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Password must be at least 8 characters' });
  });

  it('409 on a duplicate email', async () => {
    const res = await request(server)
      .post('/api/admin/users')
      .set('Cookie', sessionCookie(1))
      .send({ username: 'dupe', email: 'admin@example.test', password: 'Str0ng!Pass' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Email already taken' });
  });

  it('400 on a non-boolean feature toggle', async () => {
    // Post-ratchet: the inline typeof check is gone, so this is the pipe's
    // standard { error: 'field: message' } envelope.
    const res = await request(server)
      .put('/api/admin/places-photos')
      .set('Cookie', sessionCookie(1))
      .send({ enabled: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'enabled: Invalid input: expected boolean, received string' });
  });

  it('places-photos toggle round-trips through app_settings', async () => {
    const off = await request(server)
      .put('/api/admin/places-photos')
      .set('Cookie', sessionCookie(1))
      .send({ enabled: false });
    expect(off.status).toBe(200);
    expect(await readAppSetting(orm, 'places_photos_enabled')).toBe('false');
    expect((await request(server).get('/api/admin/places-photos').set('Cookie', sessionCookie(1))).body).toEqual({
      enabled: false,
    });

    await request(server).put('/api/admin/places-photos').set('Cookie', sessionCookie(1)).send({ enabled: true });
    expect((await request(server).get('/api/admin/places-photos').set('Cookie', sessionCookie(1))).body).toEqual({
      enabled: true,
    });
  });

  it('GET /stats counts real rows', async () => {
    const trip = await makeTrip(orm, 1, { title: 'T' });
    await insertRow(orm, Places, { trip: trip.id, name: 'P' });
    const res = await request(server).get('/api/admin/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ totalTrips: 1, totalPlaces: 1, totalFiles: 0 });
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
  });

  it('invite create → list → delete round trip', async () => {
    const created = await request(server)
      .post('/api/admin/invites')
      .set('Cookie', sessionCookie(1))
      .send({ max_uses: 3 });
    expect(created.status).toBe(201);
    expect(created.body.invite.max_uses).toBe(3);
    expect(created.body.invite.created_by_name).toBe('admin');

    const listed = await request(server).get('/api/admin/invites').set('Cookie', sessionCookie(1));
    expect(listed.body.invites).toHaveLength(1);

    const del = await request(server)
      .delete(`/api/admin/invites/${created.body.invite.id}`)
      .set('Cookie', sessionCookie(1));
    expect(del.status).toBe(200);
    expect(await countRows(orm, InviteTokens)).toBe(0);
  });

  it('404 deleting an unknown invite', async () => {
    const res = await request(server).delete('/api/admin/invites/9999').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Invite not found' });
  });

  it('packing-template create → get → delete round trip', async () => {
    const created = await request(server)
      .post('/api/admin/packing-templates')
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Beach' });
    expect(created.status).toBe(201);
    const id = created.body.template.id;

    const fetched = await request(server).get(`/api/admin/packing-templates/${id}`).set('Cookie', sessionCookie(1));
    expect(fetched.body.template.name).toBe('Beach');
    expect(fetched.body.categories).toEqual([]);

    expect(
      (await request(server).delete(`/api/admin/packing-templates/${id}`).set('Cookie', sessionCookie(1))).status,
    ).toBe(200);
    expect(await countRows(orm, PackingTemplates)).toBe(0);
  });

  it('GET /oidc reads app_settings defaults', async () => {
    const res = await request(server).get('/api/admin/oidc').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ issuer: '', client_id: '', client_secret_set: false });
  });

  it('GET /mcp-tokens and /oauth-sessions return empty lists', async () => {
    expect((await request(server).get('/api/admin/mcp-tokens').set('Cookie', sessionCookie(1))).body).toEqual({
      tokens: [],
    });
    expect((await request(server).get('/api/admin/oauth-sessions').set('Cookie', sessionCookie(1))).body).toEqual({
      sessions: [],
    });
  });

  it('404 on the dev-only test-notification outside development', async () => {
    const res = await request(server).post('/api/admin/dev/test-notification').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(404);
  });
});
