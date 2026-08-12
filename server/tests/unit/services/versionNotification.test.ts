/**
 * Unit tests for checkAndNotifyVersion() in adminService.
 * Covers VNOTIF-001 to VNOTIF-007.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { checkAndNotifyVersion, __clearVersionCacheForTests } from '../../../src/services/adminService';
import { createAdmin } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
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

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));
// Mock MCP to avoid session side-effects
vi.mock('../../../src/mcp', () => ({ revokeUserSessions: vi.fn() }));

// Helper: mock the GitHub releases/latest endpoint
function mockGitHubLatest(tagName: string, ok = true): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () => ({ tag_name: tagName, html_url: `https://github.com/liketrek/TREK/releases/tag/${tagName}` }),
    }),
  );
}

function mockGitHubFetchFailure(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

function getLastNotifiedVersion(): string | undefined {
  return (
    testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get('last_notified_version') as
      | { value: string }
      | undefined
  )?.value;
}

function getNotificationCount(): number {
  return (testDb.prepare('SELECT COUNT(*) as c FROM notifications').get() as { c: number }).c;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  __clearVersionCacheForTests();
  vi.unstubAllGlobals();
});

afterAll(() => {
  testDb.close();
  vi.unstubAllGlobals();
});

// ─────────────────────────────────────────────────────────────────────────────
// checkAndNotifyVersion
// ─────────────────────────────────────────────────────────────────────────────

describe('checkAndNotifyVersion', () => {
  it('VNOTIF-001 — does nothing when no update is available', async () => {
    createAdmin(testDb);
    // GitHub reports same version as package.json (or older) → update_available: false
    const { version } = require('../../../package.json');
    mockGitHubLatest(`v${version}`);

    await checkAndNotifyVersion();

    expect(getNotificationCount()).toBe(0);
    expect(getLastNotifiedVersion()).toBeUndefined();
  });

  it('VNOTIF-002 — creates a navigate notification for all admins when update available', async () => {
    const { user: admin1 } = createAdmin(testDb);
    const { user: admin2 } = createAdmin(testDb);
    mockGitHubLatest('v99.0.0');

    await checkAndNotifyVersion();

    const notifications = testDb.prepare('SELECT * FROM notifications ORDER BY id').all() as Array<{
      recipient_id: number;
      type: string;
      scope: string;
    }>;
    expect(notifications.length).toBe(2);
    const recipientIds = notifications.map((n) => n.recipient_id);
    expect(recipientIds).toContain(admin1.id);
    expect(recipientIds).toContain(admin2.id);
    expect(notifications[0].type).toBe('navigate');
    expect(notifications[0].scope).toBe('admin');
  });

  it('VNOTIF-003 — sets last_notified_version in app_settings after notifying', async () => {
    createAdmin(testDb);
    mockGitHubLatest('v99.1.0');

    await checkAndNotifyVersion();

    expect(getLastNotifiedVersion()).toBe('99.1.0');
  });

  it('VNOTIF-004 — does NOT create duplicate notification if last_notified_version matches', async () => {
    createAdmin(testDb);
    mockGitHubLatest('v99.2.0');

    // First call notifies
    await checkAndNotifyVersion();
    const countAfterFirst = getNotificationCount();
    expect(countAfterFirst).toBe(1);

    // Second call with same version — should not create another
    await checkAndNotifyVersion();
    expect(getNotificationCount()).toBe(countAfterFirst);
  });

  it('VNOTIF-005 — creates new notification when last_notified_version is an older version', async () => {
    createAdmin(testDb);
    // Simulate having been notified about an older version
    testDb
      .prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
      .run('last_notified_version', '98.0.0');
    mockGitHubLatest('v99.3.0');

    await checkAndNotifyVersion();

    expect(getNotificationCount()).toBe(1);
    expect(getLastNotifiedVersion()).toBe('99.3.0');
  });

  it('VNOTIF-006 — notification has correct type, scope, and navigate_target', async () => {
    createAdmin(testDb);
    mockGitHubLatest('v99.4.0');

    await checkAndNotifyVersion();

    const notif = testDb.prepare('SELECT * FROM notifications LIMIT 1').get() as {
      type: string;
      scope: string;
      navigate_target: string;
      title_key: string;
      text_key: string;
      navigate_text_key: string;
    };
    expect(notif.type).toBe('navigate');
    expect(notif.scope).toBe('admin');
    expect(notif.navigate_target).toBe('/admin');
    expect(notif.title_key).toBe('notif.version_available.title');
    expect(notif.text_key).toBe('notif.version_available.text');
    expect(notif.navigate_text_key).toBe('notif.action.view_admin');
  });

  it('VNOTIF-007 — silently handles GitHub API fetch failure (no crash, no notification)', async () => {
    createAdmin(testDb);
    mockGitHubFetchFailure();

    // Should not throw
    await expect(checkAndNotifyVersion()).resolves.toBeUndefined();
    expect(getNotificationCount()).toBe(0);
    expect(getLastNotifiedVersion()).toBeUndefined();
  });
});
