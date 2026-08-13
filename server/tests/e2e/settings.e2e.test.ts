/**
 * Settings e2e — exercises the migrated /api/settings endpoints through the real
 * JwtAuthGuard against a temp SQLite db. DI-native: SettingsService runs its
 * real SQL over the temp db (no service mock); this covers auth, the DTO 400s
 * (ZodValidationPipe), the masked-sentinel no-op, status codes and the actual
 * persisted rows.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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
  tmp.exec(`CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    key TEXT NOT NULL, value TEXT, UNIQUE(user_id, key));`);
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

import { SettingsModule } from '../../src/nest/settings/settings.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Settings e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, SettingsModule] }).compile();
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
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.exec('DELETE FROM settings');
    db.exec('DELETE FROM app_settings');
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/settings')).status).toBe(401);
  });

  it('200 list with a session', async () => {
    db.prepare("INSERT INTO settings (user_id, key, value) VALUES (1, 'theme', 'dark')").run();
    const res = await request(server).get('/api/settings').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ settings: { theme: 'dark' } });
  });

  it('PUT 400 without a key (pipe envelope via SettingUpsertDto)', async () => {
    const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1)).send({ value: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^key: /);
    expect(db.prepare('SELECT COUNT(*) AS n FROM settings').get()).toEqual({ n: 0 });
  });

  it('POST /bulk 400 without a settings object (pipe envelope via SettingsBulkDto)', async () => {
    const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(1)).send({ settings: null });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^settings: /);
  });

  it('PUT persists the setting', async () => {
    const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1)).send({ key: 'language', value: 'fr' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, key: 'language', value: 'fr' });
    const row = db.prepare("SELECT value FROM settings WHERE user_id = 1 AND key = 'language'").get() as { value: string };
    expect(row.value).toBe('fr');
  });

  it('PUT no-ops on the masked sentinel', async () => {
    const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1)).send({ key: 'secret', value: '••••••••' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, key: 'secret', unchanged: true });
    expect(db.prepare("SELECT COUNT(*) AS n FROM settings WHERE user_id = 1 AND key = 'secret'").get()).toEqual({ n: 0 });
  });

  it('POST /bulk 200', async () => {
    const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(1)).send({ settings: { a: 1, b: 2 } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, updated: 2 });
    const rows = db.prepare('SELECT key, value FROM settings WHERE user_id = 1 ORDER BY key').all();
    expect(rows).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ]);
  });

  it('POST /bulk skips masked-sentinel values (a stored secret survives)', async () => {
    db.prepare("INSERT INTO settings (user_id, key, value) VALUES (1, 'ntfy_token', 'tok-real')").run();
    const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(1))
      .send({ settings: { ntfy_topic: 'trek', ntfy_token: '••••••••' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, updated: 1 });
    expect(db.prepare("SELECT value FROM settings WHERE user_id = 1 AND key = 'ntfy_token'").get()).toEqual({ value: 'tok-real' });
  });

  // #1772: a free-form LLM endpoint is admin-only. The resolver ignores such a
  // row for a non-admin either way; these routes refuse it so the user is told.
  describe('LLM endpoint settings are admin-only (#1772)', () => {
    const countRows = () => (db.prepare('SELECT COUNT(*) AS n FROM settings').get() as { n: number }).n;

    it('PUT 403 for a non-admin naming a base URL', async () => {
      const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1))
        .send({ key: 'llm_base_url', value: 'http://192.168.1.5:11434' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(countRows()).toBe(0);
    });

    it('PUT 403 for a non-admin picking the local provider', async () => {
      const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1))
        .send({ key: 'llm_provider', value: 'local' });
      expect(res.status).toBe(403);
      expect(countRows()).toBe(0);
    });

    it('PUT lets a non-admin clear the base URL and pick a hosted provider', async () => {
      expect((await request(server).put('/api/settings').set('Cookie', sessionCookie(1))
        .send({ key: 'llm_base_url', value: '  ' })).status).toBe(200);
      expect((await request(server).put('/api/settings').set('Cookie', sessionCookie(1))
        .send({ key: 'llm_provider', value: 'anthropic' })).status).toBe(200);
      expect(db.prepare("SELECT value FROM settings WHERE user_id = 1 AND key = 'llm_provider'").get())
        .toEqual({ value: 'anthropic' });
    });

    it('PUT is unaffected for a non-LLM key with the same value', async () => {
      const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1))
        .send({ key: 'start_page', value: 'local' });
      expect(res.status).toBe(200);
    });

    it('POST /bulk 403 for a non-admin, and nothing in the payload is written', async () => {
      const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(1))
        .send({ settings: { llm_provider: 'local', llm_base_url: 'http://192.168.1.5:11434', llm_model: 'nuextract' } });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(countRows()).toBe(0);
    });

    it('POST /bulk 200 for a non-admin bringing their own hosted key', async () => {
      const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(1))
        .send({ settings: { llm_provider: 'anthropic', llm_base_url: '', llm_model: 'claude-sonnet' } });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, updated: 3 });
    });

    it('POST /bulk 403 for an admin too, since this is not where the endpoint lives', async () => {
      // An instance has one endpoint and it is set on the addon, or through
      // PUT /api/admin/default-user-settings. A personal row would be a second,
      // invisible place for the same value, so the route refuses it for everyone.
      const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(2))
        .send({ settings: { llm_provider: 'local', llm_base_url: 'http://192.168.1.5:11434' } });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
      expect(countRows()).toBe(0);
    });

    it('POST /bulk 200 for an admin bringing their own hosted key', async () => {
      const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(2))
        .send({ settings: { llm_provider: 'openai', llm_base_url: '', llm_model: 'gpt-4o-mini' } });
      expect(res.status).toBe(200);
      expect(db.prepare("SELECT value FROM settings WHERE user_id = 2 AND key = 'llm_provider'").get())
        .toEqual({ value: 'openai' });
    });
  });
});
