/**
 * DB-backed unit tests for UserCleanupService (USER-CLEANUP-001+).
 *
 * The legacy services/userCleanupService had no tests of its own; the erasure
 * path only ever ran incidentally through AdminService.deleteUser and
 * TripsService.deleteGuest. Both halves are pinned here directly: the plugin
 * erasure (host-side tables + the durable per-plugin queue, including the
 * orphan-data-dir case that no permissions row can describe) and the
 * account-deletion transaction (reference cleanup + budget re-split + the
 * users row, all or nothing).
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createUser, createTrip } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock, dataRootRef } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      getPlaceWithTags: () => null,
      canAccessTrip: () => null,
      isOwner: () => false,
    },
    // Points at a directory that does not exist by default, so the orphan scan
    // takes its "no plugin data root yet" branch unless a test says otherwise.
    dataRootRef: { value: '' },
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../../src/nest/plugins/paths', () => ({ pluginsDataRoot: () => dataRootRef.value }));

const dbs = new DatabaseService(testDb);
const budget = new BudgetService(
  dbs,
  new PermissionsService(dbs),
  new ExchangeRatesService(dbs),
  new RealtimeService(),
);
const svc = new UserCleanupService(dbs, budget);

const installPlugin = (id: string, permissions: string[] | null) => {
  testDb
    .prepare('INSERT INTO plugins (id, name, version, permissions) VALUES (?, ?, ?, ?)')
    .run(id, id, '1.0.0', permissions === null ? null : JSON.stringify(permissions));
};

const createJourney = (userId: number, title: string): number =>
  Number(
    testDb
      .prepare("INSERT INTO journeys (user_id, title, status, created_at, updated_at) VALUES (?, ?, 'draft', 0, 0)")
      .run(userId, title).lastInsertRowid,
  );

const queuedFor = (userId: number): string[] =>
  (
    testDb
      .prepare('SELECT plugin_id FROM plugin_user_erasure_queue WHERE user_id = ? ORDER BY plugin_id')
      .all(userId) as Array<{ plugin_id: string }>
  ).map((r) => r.plugin_id);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  // The plugin tables are not user data, so resetTestDb leaves them alone —
  // these tests own them and must not leak rows into each other.
  for (const t of ['plugin_user_erasure_queue', 'plugin_user_config', 'plugins']) {
    testDb.prepare(`DELETE FROM ${t}`).run();
  }
  dataRootRef.value = path.join(os.tmpdir(), 'trek-user-cleanup-absent');
});

afterAll(() => {
  testDb.close();
});

describe('erasePluginUserData', () => {
  it('USER-CLEANUP-001: deletes the host-side per-user plugin rows', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    installPlugin('demo', []);
    testDb
      .prepare('INSERT INTO plugin_user_config (plugin_id, user_id, config) VALUES (?, ?, ?)')
      .run('demo', user.id, '{"token":"secret"}');
    testDb
      .prepare('INSERT INTO plugin_user_config (plugin_id, user_id, config) VALUES (?, ?, ?)')
      .run('demo', other.id, '{"token":"keep-me"}');

    svc.erasePluginUserData(user.id);

    const rows = testDb.prepare('SELECT user_id FROM plugin_user_config').all() as Array<{ user_id: number }>;
    expect(rows.map((r) => r.user_id)).toEqual([other.id]);
  });

  it('USER-CLEANUP-002: enqueues an erasure only for plugins holding hook:user-data', () => {
    const { user } = createUser(testDb);
    installPlugin('with-hook', ['hook:user-data', 'trips:read']);
    installPlugin('without-hook', ['trips:read']);
    installPlugin('no-permissions', null);

    svc.erasePluginUserData(user.id);

    expect(queuedFor(user.id)).toEqual(['with-hook']);
  });

  it('USER-CLEANUP-003: treats an unparseable permissions column as no permissions', () => {
    const { user } = createUser(testDb);
    testDb
      .prepare('INSERT INTO plugins (id, name, version, permissions) VALUES (?, ?, ?, ?)')
      .run('broken', 'broken', '1.0.0', '{not json');

    svc.erasePluginUserData(user.id);

    expect(queuedFor(user.id)).toEqual([]);
  });

  it('USER-CLEANUP-004: enqueues every orphan data dir — an uninstall keeps no permissions row', () => {
    const { user } = createUser(testDb);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-plugins-data-'));
    dataRootRef.value = root;
    fs.mkdirSync(path.join(root, 'uninstalled-but-retained'));
    fs.writeFileSync(path.join(root, 'stray-file'), ''); // not a directory → ignored
    installPlugin('installed', ['hook:user-data']);
    fs.mkdirSync(path.join(root, 'installed'));

    try {
      svc.erasePluginUserData(user.id);
      // 'installed' comes from the permissions scan, not the orphan scan, and the
      // INSERT OR IGNORE keeps it single.
      expect(queuedFor(user.id)).toEqual(['installed', 'uninstalled-but-retained']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('USER-CLEANUP-005: survives a slim schema without the plugin tables', () => {
    const slim = new (require('better-sqlite3'))(':memory:');
    slim.exec('CREATE TABLE users (id INTEGER PRIMARY KEY)');
    slim.prepare('INSERT INTO users (id) VALUES (1)').run();
    const slimSvc = new UserCleanupService(new DatabaseService(slim), budget);

    expect(() => slimSvc.erasePluginUserData(1)).not.toThrow();

    slim.close();
  });
});

describe('deleteUserCompletely', () => {
  it('USER-CLEANUP-006: removes the user and nulls the references that have no cascade', () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(trip.id, owner.id, victim.id);
    testDb
      .prepare("INSERT INTO share_tokens (trip_id, token, created_by) VALUES (?, 'tok', ?)")
      .run(trip.id, victim.id);

    svc.deleteUserCompletely(victim.id);

    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(victim.id)).toBeUndefined();
    expect(
      (
        testDb.prepare('SELECT invited_by FROM trip_members WHERE user_id = ?').get(owner.id) as {
          invited_by: number | null;
        }
      ).invited_by,
    ).toBeNull();
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM share_tokens').get()).toEqual({ c: 0 });
  });

  it('USER-CLEANUP-007: deletes their journeys and the entries they authored elsewhere', () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const ownJourney = createJourney(victim.id, 'Mine');
    const foreignJourney = createJourney(owner.id, 'Theirs');
    testDb
      .prepare(
        "INSERT INTO journey_entries (journey_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, 'note', 'Guest post', '2026-08-08', 0, 0)",
      )
      .run(foreignJourney, victim.id);

    svc.deleteUserCompletely(victim.id);

    expect(testDb.prepare('SELECT id FROM journeys WHERE id = ?').get(ownJourney)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM journeys WHERE id = ?').get(foreignJourney)).toBeDefined();
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM journey_entries').get()).toEqual({ c: 0 });
  });

  it('USER-CLEANUP-008: re-derives the expense divisor before the member rows cascade away', () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(trip.id, victim.id);
    const item = budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      total_price: 80,
      member_ids: [owner.id, victim.id],
    });
    testDb.prepare('UPDATE budget_items SET paid_by_user_id = ? WHERE id = ?').run(victim.id, item.id);

    svc.deleteUserCompletely(victim.id);

    const row = testDb.prepare('SELECT persons, paid_by_user_id FROM budget_items WHERE id = ?').get(item.id) as {
      persons: number | null;
      paid_by_user_id: number | null;
    };
    expect(row).toEqual({ persons: 1, paid_by_user_id: null });
  });

  it('USER-CLEANUP-009: is atomic — a failing users DELETE rolls the reference cleanup back', () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(trip.id, owner.id, victim.id);

    // Fail on the final statement only, after the reference cleanup has written.
    const failing = new DatabaseService(testDb);
    const realRun = failing.run.bind(failing);
    vi.spyOn(failing, 'run').mockImplementation((sql: string, ...params: unknown[]) => {
      if (sql.startsWith('DELETE FROM users')) throw new Error('boom');
      return realRun(sql, ...params);
    });

    expect(() => new UserCleanupService(failing, budget).deleteUserCompletely(victim.id)).toThrow('boom');

    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(victim.id)).toBeDefined();
    expect(
      (
        testDb.prepare('SELECT invited_by FROM trip_members WHERE user_id = ?').get(owner.id) as {
          invited_by: number | null;
        }
      ).invited_by,
    ).toBe(victim.id);
  });
});
