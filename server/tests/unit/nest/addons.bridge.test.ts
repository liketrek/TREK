/**
 * addons.bridge delegation — one case per bridged export (the permissions
 * bridge-test precedent). The bridge constructs a module-level AddonsService
 * over the reinitialize-proof db Proxy, so a real in-memory SQLite exercises
 * the byte-identical SQL relocated from services/adminService (`admin-1`),
 * including the polarity quirks: isAddonEnabled reads the addons integer
 * column, bag tracking is opt-in (=== 'true'), collab flags opt-out
 * (!== 'false').
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────
// The db/database mock builds a real in-memory SQLite; the test body reaches it
// straight through the mocked `db` export (no hoisted require needed).

vi.mock('../../../src/db/database', async () => {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return { db, closeDb: () => {}, reinitialize: () => {} };
});

import { db as testDb } from '../../../src/db/database';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { isAddonEnabled, getBagTracking, getCollabFeatures } from '../../../src/nest/addons/addons.bridge';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  testDb.prepare("DELETE FROM app_settings WHERE key IN ('bag_tracking_enabled', 'collab_chat_enabled', 'collab_notes_enabled', 'collab_polls_enabled', 'collab_whatsnext_enabled')").run();
});

describe('addons.bridge', () => {
  it('isAddonEnabled reflects the addons row and is false for an unknown id', () => {
    testDb
      .prepare("INSERT OR REPLACE INTO addons (id, name, type, icon, enabled, sort_order) VALUES ('test-addon', 'Test', 'page', 'star', 1, 99)")
      .run();
    expect(isAddonEnabled('test-addon')).toBe(true);
    testDb.prepare('UPDATE addons SET enabled = 0 WHERE id = ?').run('test-addon');
    expect(isAddonEnabled('test-addon')).toBe(false);
    expect(isAddonEnabled('no-such-addon')).toBe(false);
  });

  it('getBagTracking is opt-in: absent row is OFF, only the string true enables', () => {
    expect(getBagTracking()).toEqual({ enabled: false });
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('bag_tracking_enabled', 'true')").run();
    expect(getBagTracking()).toEqual({ enabled: true });
  });

  it('getCollabFeatures is opt-out: absent rows are ON, only the string false disables', () => {
    expect(getCollabFeatures()).toEqual({ chat: true, notes: true, polls: true, whatsnext: true });
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('collab_polls_enabled', 'false')").run();
    expect(getCollabFeatures()).toEqual({ chat: true, notes: true, polls: false, whatsnext: true });
  });
});
