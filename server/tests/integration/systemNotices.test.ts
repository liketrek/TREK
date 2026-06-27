/**
 * System Notices API integration tests.
 * Covers GET /api/system-notices/active and POST /api/system-notices/:id/dismiss.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

// ─────────────────────────────────────────────────────────────────────────────
// Bare in-memory DB — schema applied in beforeAll after mocks register
// ─────────────────────────────────────────────────────────────────────────────
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
    canAccessTrip: () => null,
    isOwner: () => false,
  };

  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb } from '../helpers/test-db';
import { createUser, createAdmin } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { SYSTEM_NOTICES } from '../../src/systemNotices/registry';
import type { SystemNotice } from '../../src/systemNotices/types';

let nestApp: INestApplication;
let app: Application;

// Test notice injected into the registry for notice-specific tests
const TEST_NOTICE: SystemNotice = {
  id: 'test-first-login-notice',
  display: 'modal',
  severity: 'info',
  titleKey: 'system_notice.test_first_login_notice.title',
  bodyKey: 'system_notice.test_first_login_notice.body',
  dismissible: true,
  conditions: [{ kind: 'firstLogin' }],
  publishedAt: '2026-01-01T00:00:00Z',
  priority: 0,
};

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/system-notices/active
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/system-notices/active', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/system-notices/active');
    expect(res.status).toBe(401);
  });

  it('returns no login/version-gated notices for an established user', async () => {
    const { user } = createUser(testDb);
    // login_count > 1 means firstLogin does not match; first_seen_version >= 3.0.0 means
    // existingUserBeforeVersion('3.0.0') does not match either. The always-on thank-you
    // notice (no conditions) may still apply, so only filter it out.
    testDb.prepare('UPDATE users SET login_count = 5, first_seen_version = ? WHERE id = ?').run('3.0.0', user.id);
    const res = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.filter((n: { id: string }) => n.id !== 'thank-you-support')).toEqual([]);
  });

  it('returns firstLogin notice for user with login_count <= 1', async () => {
    SYSTEM_NOTICES.push(TEST_NOTICE);
    try {
      const { user } = createUser(testDb);
      // Set login_count to 1 (first login)
      testDb.prepare('UPDATE users SET login_count = 1 WHERE id = ?').run(user.id);

      const res = await request(app)
        .get('/api/system-notices/active')
        .set('Cookie', authCookie(user.id));
      expect(res.status).toBe(200);
      // The always-on thank-you notice may also be present, so just assert TEST_NOTICE is there
      const testNotice = res.body.find((n: { id: string }) => n.id === TEST_NOTICE.id);
      expect(testNotice).toBeDefined();
      // DTO should not expose conditions, publishedAt, minVersion, maxVersion, priority
      expect(testNotice.conditions).toBeUndefined();
      expect(testNotice.publishedAt).toBeUndefined();
      expect(testNotice.minVersion).toBeUndefined();
      expect(testNotice.maxVersion).toBeUndefined();
    } finally {
      const idx = SYSTEM_NOTICES.indexOf(TEST_NOTICE);
      if (idx !== -1) SYSTEM_NOTICES.splice(idx, 1);
    }
  });

  it('does not return firstLogin notice for user with login_count > 1', async () => {
    SYSTEM_NOTICES.push(TEST_NOTICE);
    try {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET login_count = 5, first_seen_version = ? WHERE id = ?').run('3.0.0', user.id);

      const res = await request(app)
        .get('/api/system-notices/active')
        .set('Cookie', authCookie(user.id));
      expect(res.status).toBe(200);
      expect(res.body.find((n: { id: string }) => n.id === TEST_NOTICE.id)).toBeUndefined();
    } finally {
      const idx = SYSTEM_NOTICES.indexOf(TEST_NOTICE);
      if (idx !== -1) SYSTEM_NOTICES.splice(idx, 1);
    }
  });

  it('filters out dismissed notices', async () => {
    SYSTEM_NOTICES.push(TEST_NOTICE);
    try {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET login_count = 1 WHERE id = ?').run(user.id);

      // Dismiss the notice directly in DB
      testDb.prepare(
        'INSERT INTO user_notice_dismissals (user_id, notice_id, dismissed_at) VALUES (?, ?, ?)'
      ).run(user.id, TEST_NOTICE.id, Date.now());

      const res = await request(app)
        .get('/api/system-notices/active')
        .set('Cookie', authCookie(user.id));
      expect(res.status).toBe(200);
      // TEST_NOTICE should be filtered out; the thank-you notice may still appear
      const found = res.body.find((n: { id: string }) => n.id === TEST_NOTICE.id);
      expect(found).toBeUndefined();
    } finally {
      const idx = SYSTEM_NOTICES.indexOf(TEST_NOTICE);
      if (idx !== -1) SYSTEM_NOTICES.splice(idx, 1);
    }
  });

  it('re-surfaces a per-version notice after an upgrade but hides it within the same version', async () => {
    const TY = 'thank-you-support';
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET login_count = 5, first_seen_version = ? WHERE id = ?').run('3.0.0', user.id);

    const shows = async () => {
      const res = await request(app)
        .get('/api/system-notices/active')
        .set('Cookie', authCookie(user.id));
      expect(res.status).toBe(200);
      return res.body.some((n: { id: string }) => n.id === TY);
    };

    // Fresh user with no dismissal: the recurring thank-you shows.
    expect(await shows()).toBe(true);

    // Dismissed at an old version → it returns once the running version is newer.
    testDb.prepare(
      'INSERT INTO user_notice_dismissals (user_id, notice_id, dismissed_at, dismissed_app_version) VALUES (?, ?, ?, ?)'
    ).run(user.id, TY, Date.now(), '0.0.1');
    expect(await shows()).toBe(true);

    // Dismissed at a version >= the running one → stays hidden until the next upgrade.
    testDb.prepare(
      'UPDATE user_notice_dismissals SET dismissed_app_version = ? WHERE user_id = ? AND notice_id = ?'
    ).run('99.0.0', user.id, TY);
    expect(await shows()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/system-notices/:id/dismiss
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/system-notices/:id/dismiss', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/system-notices/test-id/dismiss');
    expect(res.status).toBe(401);
  });

  it('returns 404 for unknown notice id', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/system-notices/nonexistent-id/dismiss')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOTICE_NOT_FOUND');
  });

  it('returns 204 for valid notice id', async () => {
    SYSTEM_NOTICES.push(TEST_NOTICE);
    try {
      const { user } = createUser(testDb);
      const res = await request(app)
        .post(`/api/system-notices/${TEST_NOTICE.id}/dismiss`)
        .set('Cookie', authCookie(user.id));
      expect(res.status).toBe(204);
    } finally {
      const idx = SYSTEM_NOTICES.indexOf(TEST_NOTICE);
      if (idx !== -1) SYSTEM_NOTICES.splice(idx, 1);
    }
  });

  it('is idempotent — second dismiss also returns 204', async () => {
    SYSTEM_NOTICES.push(TEST_NOTICE);
    try {
      const { user } = createUser(testDb);
      const first = await request(app)
        .post(`/api/system-notices/${TEST_NOTICE.id}/dismiss`)
        .set('Cookie', authCookie(user.id));
      expect(first.status).toBe(204);

      const second = await request(app)
        .post(`/api/system-notices/${TEST_NOTICE.id}/dismiss`)
        .set('Cookie', authCookie(user.id));
      expect(second.status).toBe(204);
    } finally {
      const idx = SYSTEM_NOTICES.indexOf(TEST_NOTICE);
      if (idx !== -1) SYSTEM_NOTICES.splice(idx, 1);
    }
  });

  it('dismiss appears in GET /active as filtered out', async () => {
    SYSTEM_NOTICES.push(TEST_NOTICE);
    try {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET login_count = 1 WHERE id = ?').run(user.id);

      // Confirm TEST_NOTICE is visible before dismiss
      const before = await request(app)
        .get('/api/system-notices/active')
        .set('Cookie', authCookie(user.id));
      expect(before.body.find((n: { id: string }) => n.id === TEST_NOTICE.id)).toBeDefined();

      // Dismiss it
      await request(app)
        .post(`/api/system-notices/${TEST_NOTICE.id}/dismiss`)
        .set('Cookie', authCookie(user.id));

      // Confirm TEST_NOTICE is gone; other notices (e.g. welcome-v1) may still appear
      const after = await request(app)
        .get('/api/system-notices/active')
        .set('Cookie', authCookie(user.id));
      expect(after.status).toBe(200);
      expect(after.body.find((n: { id: string }) => n.id === TEST_NOTICE.id)).toBeUndefined();
    } finally {
      const idx = SYSTEM_NOTICES.indexOf(TEST_NOTICE);
      if (idx !== -1) SYSTEM_NOTICES.splice(idx, 1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// v3014-whitespace-collision notice
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper: creates an admin user whose first_seen_version is before 3.0.14
 * (so existingUserBeforeVersion('3.0.14') passes) and whose login_count is
 * high enough to suppress the firstLogin and v3-upgrade notice conditions.
 */
function setupCollisionAdmin() {
  const { user } = createAdmin(testDb);
  testDb.prepare('UPDATE users SET login_count = 5, first_seen_version = ? WHERE id = ?').run('3.0.0', user.id);
  return user;
}

describe('v3014-whitespace-collision notice', () => {
  const NOTICE_ID = 'v3014-whitespace-collision';
  const originalAppVersion = process.env.APP_VERSION;

  beforeEach(() => {
    process.env.APP_VERSION = '3.0.14';
  });

  afterEach(() => {
    if (originalAppVersion === undefined) {
      delete process.env.APP_VERSION;
    } else {
      process.env.APP_VERSION = originalAppVersion;
    }
  });

  it('SN-COLLISION-1 — shown to admin when collision flag is set and user predates 3.0.14', async () => {
    const user = setupCollisionAdmin();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('whitespace_migration_collision', 'true')").run();

    const res = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeDefined();
  });

  it('SN-COLLISION-2 — hidden when collision flag is absent', async () => {
    const user = setupCollisionAdmin();

    const res = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeUndefined();
  });

  it('SN-COLLISION-3 — hidden when collision flag is explicitly false', async () => {
    const user = setupCollisionAdmin();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('whitespace_migration_collision', 'false')").run();

    const res = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeUndefined();
  });

  it('SN-COLLISION-4 — hidden for non-admin user even when collision flag is set', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET login_count = 5, first_seen_version = ? WHERE id = ?').run('3.0.0', user.id);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('whitespace_migration_collision', 'true')").run();

    const res = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeUndefined();
  });

  it('SN-COLLISION-5 — hidden for user whose first_seen_version is >= 3.0.14 (new account)', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET login_count = 5, first_seen_version = ? WHERE id = ?').run('3.0.14', user.id);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('whitespace_migration_collision', 'true')").run();

    const res = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeUndefined();
  });

  it('SN-COLLISION-6 — hidden when app version is below 3.0.14', async () => {
    process.env.APP_VERSION = '3.0.13';
    const user = setupCollisionAdmin();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('whitespace_migration_collision', 'true')").run();

    const res = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeUndefined();
  });

  it('SN-COLLISION-7 — hidden after admin dismisses it', async () => {
    const user = setupCollisionAdmin();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('whitespace_migration_collision', 'true')").run();

    const before = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));
    expect(before.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeDefined();

    const dismiss = await request(app)
      .post(`/api/system-notices/${NOTICE_ID}/dismiss`)
      .set('Cookie', authCookie(user.id));
    expect(dismiss.status).toBe(204);

    const after = await request(app)
      .get('/api/system-notices/active')
      .set('Cookie', authCookie(user.id));
    expect(after.body.find((n: { id: string }) => n.id === NOTICE_ID)).toBeUndefined();
  });
});
