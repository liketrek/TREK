/**
 * Settings e2e — exercises the migrated /api/settings endpoints through the real
 * JwtAuthGuard against a temp SQLite db. DI-native: SettingsService runs its
 * real SQL over the temp db (no service mock); this covers auth, the DTO 400s
 * (ZodValidationPipe), the masked-sentinel no-op, status codes and the actual
 * persisted rows.
 */
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { Settings } from '../../src/db/entities/Settings.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { SettingsModule } from '../../src/nest/settings/settings.module';
import { countRows, deleteRows, findRow, findRows, insertRow } from '../helpers/factories/rows';
import { readUserSetting } from '../helpers/factories/settings';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  tmp.exec(`CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    key TEXT NOT NULL, value TEXT, UNIQUE(user_id, key));`);
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

describe('Settings e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let orm: TestOrm;

  /** The stored value of one of `userId`'s settings, or null. */
  const userSetting = (userId: number, key: string) => readUserSetting(orm, userId, key);

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), SettingsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    seedUser(db as never, { id: 2, role: 'admin', email: 'e2e-admin@example.test' });
    orm = await createTestOrm(db);
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, Settings);
    await deleteRows(orm, AppSettings);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/settings')).status).toBe(401);
  });

  it('200 list with a session', async () => {
    await insertRow(orm, Settings, { user: 1, key: 'theme', value: 'dark' });
    const res = await request(server).get('/api/settings').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ settings: { theme: 'dark' } });
  });

  it('PUT 400 without a key (pipe envelope via SettingUpsertDto)', async () => {
    const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1)).send({ value: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^key: /);
    expect(await countRows(orm, Settings)).toBe(0);
  });

  it('POST /bulk 400 without a settings object (pipe envelope via SettingsBulkDto)', async () => {
    const res = await request(server)
      .post('/api/settings/bulk')
      .set('Cookie', sessionCookie(1))
      .send({ settings: null });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^settings: /);
  });

  it('PUT persists the setting', async () => {
    const res = await request(server)
      .put('/api/settings')
      .set('Cookie', sessionCookie(1))
      .send({ key: 'language', value: 'fr' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, key: 'language', value: 'fr' });
    expect(await userSetting(1, 'language')).toBe('fr');
  });

  it('PUT no-ops on the masked sentinel', async () => {
    const res = await request(server)
      .put('/api/settings')
      .set('Cookie', sessionCookie(1))
      .send({ key: 'secret', value: '••••••••' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, key: 'secret', unchanged: true });
    expect(await countRows(orm, Settings, { user: 1, key: 'secret' })).toBe(0);
  });

  it('POST /bulk 200', async () => {
    const res = await request(server)
      .post('/api/settings/bulk')
      .set('Cookie', sessionCookie(1))
      .send({ settings: { a: 1, b: 2 } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, updated: 2 });
    const rows = (await findRows(orm, Settings, { user: 1 }, { key: 'asc' })).map((r) => ({
      key: r.key,
      value: r.value,
    }));
    expect(rows).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ]);
  });

  it('POST /bulk skips masked-sentinel values (a stored secret survives)', async () => {
    await insertRow(orm, Settings, { user: 1, key: 'ntfy_token', value: 'tok-real' });
    const res = await request(server)
      .post('/api/settings/bulk')
      .set('Cookie', sessionCookie(1))
      .send({ settings: { ntfy_topic: 'trek', ntfy_token: '••••••••' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, updated: 1 });
    expect(await userSetting(1, 'ntfy_token')).toBe('tok-real');
  });

  // #1772: a free-form LLM endpoint is admin-only. The resolver ignores such a
  // row for a non-admin either way; these routes refuse it so the user is told.
  describe('LLM endpoint settings are admin-only (#1772)', () => {
    const settingsCount = () => countRows(orm, Settings);

    it('PUT 403 for a non-admin naming a base URL', async () => {
      const res = await request(server)
        .put('/api/settings')
        .set('Cookie', sessionCookie(1))
        .send({ key: 'llm_base_url', value: 'http://192.168.1.5:11434' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(await settingsCount()).toBe(0);
    });

    it('PUT 403 for a non-admin picking the local provider', async () => {
      const res = await request(server)
        .put('/api/settings')
        .set('Cookie', sessionCookie(1))
        .send({ key: 'llm_provider', value: 'local' });
      expect(res.status).toBe(403);
      expect(await settingsCount()).toBe(0);
    });

    it('PUT lets a non-admin clear the base URL and pick a hosted provider', async () => {
      expect(
        (
          await request(server)
            .put('/api/settings')
            .set('Cookie', sessionCookie(1))
            .send({ key: 'llm_base_url', value: '  ' })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(server)
            .put('/api/settings')
            .set('Cookie', sessionCookie(1))
            .send({ key: 'llm_provider', value: 'anthropic' })
        ).status,
      ).toBe(200);
      expect(await userSetting(1, 'llm_provider')).toBe('anthropic');
    });

    it('PUT 403 for a non-admin naming a routing engine (#1797)', async () => {
      // Same class for a different reason: this origin has to appear in the CSP
      // connect-src the server emits at boot, and that list is built from the
      // admin default. A value on a personal row is read by the route
      // calculator and then refused by the browser, so the app stops routing
      // with no error it could report. Refusing tells the caller instead.
      const res = await request(server)
        .put('/api/settings')
        .set('Cookie', sessionCookie(1))
        .send({ key: 'routing_base_url', value: 'https://osrm.example.org' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(await settingsCount()).toBe(0);
    });

    it('PUT lets a non-admin clear a routing engine somebody set before the rule', async () => {
      expect(
        (
          await request(server)
            .put('/api/settings')
            .set('Cookie', sessionCookie(1))
            .send({ key: 'routing_base_url', value: '' })
        ).status,
      ).toBe(200);
    });

    it('POST bulk refuses a routing engine from a non-admin', async () => {
      const res = await request(server)
        .post('/api/settings/bulk')
        .set('Cookie', sessionCookie(1))
        .send({ settings: { routing_base_url: 'https://osrm.example.org' } });
      expect(res.status).toBe(403);
      expect(await settingsCount()).toBe(0);
    });

    it('PUT 403 for a non-admin naming the second routing engine', async () => {
      // The Valhalla is the same class as the OSRM above and fails the same way: its
      // origin has to be in the boot-time connect-src, which is assembled from the
      // admin default alone. A personal row would be read by the route calculator and
      // then refused by the browser, so "other ways" would quietly stop offering any.
      const res = await request(server)
        .put('/api/settings')
        .set('Cookie', sessionCookie(1))
        .send({ key: 'valhalla_base_url', value: 'https://valhalla.example.org' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(await settingsCount()).toBe(0);
    });

    it('PUT lets a non-admin clear the second routing engine', async () => {
      expect(
        (
          await request(server)
            .put('/api/settings')
            .set('Cookie', sessionCookie(1))
            .send({ key: 'valhalla_base_url', value: '' })
        ).status,
      ).toBe(200);
    });

    it('PUT is unaffected for a non-LLM key with the same value', async () => {
      const res = await request(server)
        .put('/api/settings')
        .set('Cookie', sessionCookie(1))
        .send({ key: 'start_page', value: 'local' });
      expect(res.status).toBe(200);
    });

    it('POST /bulk 403 for a non-admin, and nothing in the payload is written', async () => {
      const res = await request(server)
        .post('/api/settings/bulk')
        .set('Cookie', sessionCookie(1))
        .send({
          settings: { llm_provider: 'local', llm_base_url: 'http://192.168.1.5:11434', llm_model: 'nuextract' },
        });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(await settingsCount()).toBe(0);
    });

    it('POST /bulk 200 for a non-admin bringing their own hosted key', async () => {
      const res = await request(server)
        .post('/api/settings/bulk')
        .set('Cookie', sessionCookie(1))
        .send({ settings: { llm_provider: 'anthropic', llm_base_url: '', llm_model: 'claude-sonnet' } });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, updated: 3 });
    });

    it('POST /bulk 403 for an admin too, since this is not where the endpoint lives', async () => {
      // An instance has one endpoint and it is set on the addon, or through
      // PUT /api/admin/default-user-settings. A personal row would be a second,
      // invisible place for the same value, so the route refuses it for everyone.
      const res = await request(server)
        .post('/api/settings/bulk')
        .set('Cookie', sessionCookie(2))
        .send({ settings: { llm_provider: 'local', llm_base_url: 'http://192.168.1.5:11434' } });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(await settingsCount()).toBe(0);
    });

    it('POST /bulk 200 for an admin bringing their own hosted key', async () => {
      const res = await request(server)
        .post('/api/settings/bulk')
        .set('Cookie', sessionCookie(2))
        .send({ settings: { llm_provider: 'openai', llm_base_url: '', llm_model: 'gpt-4o-mini' } });
      expect(res.status).toBe(200);
      expect(await userSetting(2, 'llm_provider')).toBe('openai');
    });
  });

  describe('week_start (#2029)', () => {
    it('an admin default reaches a user who never picked a first weekday', async () => {
      const put = await request(server)
        .put('/api/admin/default-user-settings')
        .set('Cookie', sessionCookie(2))
        .send({ week_start: 'sunday' });
      expect(put.status).toBe(200);
      const res = await request(server).get('/api/settings').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body.settings.week_start).toBe('sunday');
    });

    it('PUT /api/admin/default-user-settings 400 for a weekday the pickers do not offer', async () => {
      const res = await request(server)
        .put('/api/admin/default-user-settings')
        .set('Cookie', sessionCookie(2))
        .send({ week_start: 'friday' });
      expect(res.status).toBe(400);
      expect(await findRow(orm, AppSettings, { key: 'default_user_setting_week_start' })).toBeNull();
    });
  });
});
