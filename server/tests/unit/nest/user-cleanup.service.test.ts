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
import { db as testDb } from '../../../src/db/database';
import type { BudgetItemsRepository } from '../../../src/db/repositories/BudgetItems.repository';
import type { JourneyContributorsRepository } from '../../../src/db/repositories/JourneyContributors.repository';
import type { JourneyEntriesRepository } from '../../../src/db/repositories/JourneyEntries.repository';
import type { JourneyShareTokensRepository } from '../../../src/db/repositories/JourneyShareTokens.repository';
import type { JourneysRepository } from '../../../src/db/repositories/Journeys.repository';
import type { TripMembersRepository } from '../../../src/db/repositories/TripMembers.repository';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import { createUser, createTrip } from '../../helpers/factories';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import {
  createTestJourneysRepo,
  createTestJourneyEntriesRepo,
  createTestJourneyContributorsRepo,
} from '../../helpers/journey-repos';
import { createTestJourneyShareTokensRepo } from '../../helpers/journey-share-repos';
import {
  createTestShareTokensRepo,
  createTestPluginsRepo,
  createTestPluginUserErasureQueueRepo,
} from '../../helpers/share-repos';
import { resetTestDb } from '../../helpers/test-db';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestUsersRepo,
  createTestTripMembersRepo,
  sharedTestOrm,
} from '../../helpers/test-uow';
import type { EntityManager } from '@mikro-orm/core';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { dataRootRef } = vi.hoisted(() => ({
  // Points at a directory that does not exist by default, so the orphan scan
  // takes its "no plugin data root yet" branch unless a test says otherwise.
  dataRootRef: { value: '' },
}));

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
});
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../../src/nest/plugins/paths', () => ({ pluginsDataRoot: () => dataRootRef.value }));

let em: EntityManager;
let budget: BudgetService;
let svc: UserCleanupService;
beforeAll(async () => {
  // Plan 4 Task 4: UserCleanupService's own DatabaseService param is gone —
  // UC1 goes through MaintenanceRepository, built from a directly-injected
  // EntityManager instead.
  em = (await sharedTestOrm(testDb)).em;
  budget = new BudgetService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new ExchangeRatesService(),
    new RealtimeService(),
    await createTestUnitOfWork(testDb),
    ...(await budgetRepoArgs(testDb)),
  );
  svc = new UserCleanupService(
    em,
    budget,
    await createTestUnitOfWork(testDb),
    await createTestUsersRepo(testDb),
    // Plan 4 Task 1 constructor-ripple: UC4's repository.
    await createTestTripMembersRepo(testDb),
    await createTestBudgetItemsRepo(testDb),
    // Plan 3g Task 4 constructor-ripple: UC7-10's repositories.
    await createTestJourneyShareTokensRepo(testDb),
    await createTestJourneysRepo(testDb),
    await createTestJourneyEntriesRepo(testDb),
    await createTestJourneyContributorsRepo(testDb),
    // Plan 3h Task 6 constructor-ripple: UC6's repository.
    await createTestShareTokensRepo(testDb),
    // Plan 4 Task 8a constructor-ripple: UC2/UC3's repositories.
    await createTestPluginsRepo(testDb),
    await createTestPluginUserErasureQueueRepo(testDb),
  );
});

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
  it('USER-CLEANUP-001: deletes the host-side per-user plugin rows', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    installPlugin('demo', []);
    testDb
      .prepare('INSERT INTO plugin_user_config (plugin_id, user_id, config) VALUES (?, ?, ?)')
      .run('demo', user.id, '{"token":"secret"}');
    testDb
      .prepare('INSERT INTO plugin_user_config (plugin_id, user_id, config) VALUES (?, ?, ?)')
      .run('demo', other.id, '{"token":"keep-me"}');

    await svc.erasePluginUserData(user.id);

    const rows = testDb.prepare('SELECT user_id FROM plugin_user_config').all() as Array<{ user_id: number }>;
    expect(rows.map((r) => r.user_id)).toEqual([other.id]);
  });

  it('USER-CLEANUP-002: enqueues an erasure only for plugins holding hook:user-data', async () => {
    const { user } = createUser(testDb);
    installPlugin('with-hook', ['hook:user-data', 'trips:read']);
    installPlugin('without-hook', ['trips:read']);
    installPlugin('no-permissions', null);

    await svc.erasePluginUserData(user.id);

    expect(queuedFor(user.id)).toEqual(['with-hook']);
  });

  it('USER-CLEANUP-003: treats an unparseable permissions column as no permissions', async () => {
    const { user } = createUser(testDb);
    testDb
      .prepare('INSERT INTO plugins (id, name, version, permissions) VALUES (?, ?, ?, ?)')
      .run('broken', 'broken', '1.0.0', '{not json');

    await svc.erasePluginUserData(user.id);

    expect(queuedFor(user.id)).toEqual([]);
  });

  it('USER-CLEANUP-004: enqueues every orphan data dir — an uninstall keeps no permissions row', async () => {
    const { user } = createUser(testDb);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-plugins-data-'));
    dataRootRef.value = root;
    fs.mkdirSync(path.join(root, 'uninstalled-but-retained'));
    fs.writeFileSync(path.join(root, 'stray-file'), ''); // not a directory → ignored
    installPlugin('installed', ['hook:user-data']);
    fs.mkdirSync(path.join(root, 'installed'));

    try {
      await svc.erasePluginUserData(user.id);
      // 'installed' comes from the permissions scan, not the orphan scan, and the
      // INSERT OR IGNORE keeps it single.
      expect(queuedFor(user.id)).toEqual(['installed', 'uninstalled-but-retained']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('USER-CLEANUP-005: survives a slim schema without the plugin tables', async () => {
    const slim = new (require('better-sqlite3'))(':memory:');
    slim.exec('CREATE TABLE users (id INTEGER PRIMARY KEY)');
    slim.prepare('INSERT INTO users (id) VALUES (1)').run();
    // `erasePluginUserData`'s UC1 (this test's only call) DOES reach
    // `MaintenanceRepository` now (Plan 4 Task 4) — it needs a real
    // EntityManager bound to `slim` (MikroORM binds fine against a table-less
    // connection; only the per-statement query against the missing
    // plugin_user_config/plugin_oauth_tokens/plugin_oauth_state tables fails,
    // caught by `deletePluginUserData`'s own try/catch). `tripMembersRepo`
    // (UC4), `budgetItemsRepo` (UC5's own method) and the Plan 3g Task 4
    // journey repositories (UC7-10) still never reach their tables from this
    // call — stubs are enough for those.
    const slimSvc = new UserCleanupService(
      (await sharedTestOrm(slim)).em,
      budget,
      await createTestUnitOfWork(slim),
      await createTestUsersRepo(slim),
      {} as unknown as TripMembersRepository,
      {} as unknown as BudgetItemsRepository,
      {} as unknown as JourneyShareTokensRepository,
      {} as unknown as JourneysRepository,
      {} as unknown as JourneyEntriesRepository,
      {} as unknown as JourneyContributorsRepository,
      // Plan 3h Task 6: a real repository (never a stub cast — `erasePluginUserData`
      // never touches it, but MikroORM's entity metadata does not require the
      // physical table to exist to construct the repository object itself).
      await createTestShareTokensRepo(slim),
      // Plan 4 Task 8a: also real repositories, not stubs — `erasePluginUserData`
      // DOES call into these two (UC2/UC3), and this test's whole point is that
      // the query against the missing table throws and is caught, the same
      // "table absent (slim schema)" outer try/catch as before, not a
      // constructor-time failure.
      await createTestPluginsRepo(slim),
      await createTestPluginUserErasureQueueRepo(slim),
    );

    await expect(slimSvc.erasePluginUserData(1)).resolves.toBeUndefined();

    slim.close();
  });
});

describe('deleteUserCompletely', () => {
  it('USER-CLEANUP-006: removes the user and nulls the references that have no cascade', async () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(trip.id, owner.id, victim.id);
    testDb
      .prepare("INSERT INTO share_tokens (trip_id, token, created_by) VALUES (?, 'tok', ?)")
      .run(trip.id, victim.id);

    await svc.deleteUserCompletely(victim.id);

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

  it('USER-CLEANUP-007: deletes their journeys and the entries they authored elsewhere', async () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const ownJourney = createJourney(victim.id, 'Mine');
    const foreignJourney = createJourney(owner.id, 'Theirs');
    testDb
      .prepare(
        "INSERT INTO journey_entries (journey_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, 'note', 'Guest post', '2026-08-08', 0, 0)",
      )
      .run(foreignJourney, victim.id);

    await svc.deleteUserCompletely(victim.id);

    expect(testDb.prepare('SELECT id FROM journeys WHERE id = ?').get(ownJourney)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM journeys WHERE id = ?').get(foreignJourney)).toBeDefined();
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM journey_entries').get()).toEqual({ c: 0 });
  });

  it('USER-CLEANUP-010: GDPR erasure — UC6-10 remove every journey/share-table row the departing user reaches, and only those', async () => {
    const { user: victim } = createUser(testDb, { username: 'gdpr-victim' });
    const { user: second } = createUser(testDb, { username: 'gdpr-second' });
    const { user: third } = createUser(testDb, { username: 'gdpr-third' });

    // Victim owns a journey with an entry, a gallery photo and a share token
    // they created — every one of these is reached by UC8's FK cascade.
    const ownJourney = createJourney(victim.id, 'Mine');
    testDb
      .prepare(
        "INSERT INTO journey_entries (journey_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, 'entry', 'Own entry', '2026-01-01', 0, 0)",
      )
      .run(ownJourney, victim.id);
    const photoId = Number(
      testDb.prepare("INSERT INTO trek_photos (provider, owner_id, created_at) VALUES ('local', ?, 0)").run(victim.id)
        .lastInsertRowid,
    );
    testDb
      .prepare('INSERT INTO journey_photos (journey_id, photo_id, created_at) VALUES (?, ?, 0)')
      .run(ownJourney, photoId);
    testDb
      .prepare("INSERT INTO journey_share_tokens (journey_id, token, created_by) VALUES (?, 'own-tok', ?)")
      .run(ownJourney, victim.id);

    // Victim contributes (editor) to a SECOND user's journey — not owned, so UC8's cascade never reaches it; UC10 must.
    const secondJourney = createJourney(second.id, 'Theirs');
    testDb
      .prepare("INSERT INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, 'editor', 0)")
      .run(secondJourney, victim.id);

    // Victim authored an entry, and separately created a share link, on a THIRD user's journey — UC9/UC7 must catch these.
    const thirdJourney = createJourney(third.id, 'Elsewhere');
    testDb
      .prepare(
        "INSERT INTO journey_entries (journey_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, 'entry', 'Guest entry', '2026-01-02', 0, 0)",
      )
      .run(thirdJourney, victim.id);
    testDb
      .prepare("INSERT INTO journey_share_tokens (journey_id, token, created_by) VALUES (?, 'third-tok', ?)")
      .run(thirdJourney, victim.id);

    // R10/UC6, full-key: `share_tokens` (trip-level, `nest/share`) — a
    // GENUINELY DIFFERENT table from `journey_share_tokens` above, on the
    // SAME fixture per the ruling's own instruction. Victim creates a share
    // link on a trip they OWN, and — `created_by` need not equal the trip's
    // owner — a SECOND share link on a trip owned by `second` (not the
    // victim). A THIRD share link, on that same foreign trip but created by
    // `third` (not the victim), is the control row UC6 must NOT touch.
    const ownTrip = createTrip(testDb, victim.id);
    const foreignTrip = createTrip(testDb, second.id);
    testDb
      .prepare("INSERT INTO share_tokens (trip_id, token, created_by) VALUES (?, 'own-trip-tok', ?)")
      .run(ownTrip.id, victim.id);
    testDb
      .prepare("INSERT INTO share_tokens (trip_id, token, created_by) VALUES (?, 'foreign-trip-tok', ?)")
      .run(foreignTrip.id, victim.id);
    testDb
      .prepare("INSERT INTO share_tokens (trip_id, token, created_by) VALUES (?, 'control-tok', ?)")
      .run(foreignTrip.id, third.id);

    await svc.deleteUserCompletely(victim.id);

    // Everything the departing user owned is gone (UC8 + cascade).
    expect(testDb.prepare('SELECT id FROM journeys WHERE id = ?').get(ownJourney)).toBeUndefined();
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM journey_entries WHERE journey_id = ?').get(ownJourney)).toEqual({
      c: 0,
    });
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM journey_photos WHERE journey_id = ?').get(ownJourney)).toEqual({
      c: 0,
    });
    expect(
      testDb.prepare('SELECT COUNT(*) AS c FROM journey_share_tokens WHERE journey_id = ?').get(ownJourney),
    ).toEqual({ c: 0 });
    // Everything the departing user merely touched on OTHER users' journeys is gone too (UC7/UC9/UC10).
    expect(
      testDb
        .prepare('SELECT id FROM journey_entries WHERE journey_id = ? AND author_id = ?')
        .get(thirdJourney, victim.id),
    ).toBeUndefined();
    expect(
      testDb
        .prepare('SELECT user_id FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
        .get(secondJourney, victim.id),
    ).toBeUndefined();
    expect(
      testDb
        .prepare('SELECT id FROM journey_share_tokens WHERE journey_id = ? AND created_by = ?')
        .get(thirdJourney, victim.id),
    ).toBeUndefined();
    // Nothing extra removed: the other two users' own journeys survive.
    expect(testDb.prepare('SELECT id FROM journeys WHERE id = ?').get(secondJourney)).toBeDefined();
    expect(testDb.prepare('SELECT id FROM journeys WHERE id = ?').get(thirdJourney)).toBeDefined();

    // UC6/R10: every `share_tokens` row `created_by` the departing user is
    // gone, on BOTH their own trip and a trip they don't own — and the
    // control row (same foreign trip, created by someone else) survives
    // untouched. `ownTrip` itself cascades away with the user's cleanup
    // elsewhere (not this test's concern); the assertion is on `created_by`.
    expect(testDb.prepare('SELECT id FROM share_tokens WHERE created_by = ?').get(victim.id)).toBeUndefined();
    expect(testDb.prepare('SELECT token FROM share_tokens WHERE trip_id = ?').get(foreignTrip.id)).toEqual({
      token: 'control-tok',
    });
  });

  it('USER-CLEANUP-008: re-derives the expense divisor before the member rows cascade away', async () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(trip.id, victim.id);
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      total_price: 80,
      member_ids: [owner.id, victim.id],
    });
    testDb.prepare('UPDATE budget_items SET paid_by_user_id = ? WHERE id = ?').run(victim.id, item.id);

    await svc.deleteUserCompletely(victim.id);

    const row = testDb.prepare('SELECT persons, paid_by_user_id FROM budget_items WHERE id = ?').get(item.id) as {
      persons: number | null;
      paid_by_user_id: number | null;
    };
    expect(row).toEqual({ persons: 1, paid_by_user_id: null });
  });

  it('USER-CLEANUP-009: is atomic — a failing users DELETE rolls the reference cleanup back', async () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(trip.id, owner.id, victim.id);

    // Fail on the final statement only (UC11, `UsersRepository.deleteById`),
    // after the reference cleanup (UC1-UC10, still raw and unaffected by this
    // spy) has written. UC11 is a repository call now, not `this.db.run`, so
    // this spies on the repository method instead of the legacy SQL-text
    // sniff (`sql.startsWith('DELETE FROM users')`) that check replaced.
    const usersRepo = await createTestUsersRepo(testDb);
    const deleteByIdSpy = vi.spyOn(usersRepo, 'deleteById').mockRejectedValue(new Error('boom'));
    try {
      await expect(
        new UserCleanupService(
          em,
          budget,
          await createTestUnitOfWork(testDb),
          usersRepo,
          await createTestTripMembersRepo(testDb),
          await createTestBudgetItemsRepo(testDb),
          await createTestJourneyShareTokensRepo(testDb),
          await createTestJourneysRepo(testDb),
          await createTestJourneyEntriesRepo(testDb),
          await createTestJourneyContributorsRepo(testDb),
          await createTestShareTokensRepo(testDb),
          await createTestPluginsRepo(testDb),
          await createTestPluginUserErasureQueueRepo(testDb),
        ).deleteUserCompletely(victim.id),
      ).rejects.toThrow('boom');

      expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(victim.id)).toBeDefined();
      expect(
        (
          testDb.prepare('SELECT invited_by FROM trip_members WHERE user_id = ?').get(owner.id) as {
            invited_by: number | null;
          }
        ).invited_by,
      ).toBe(victim.id);
    } finally {
      deleteByIdSpy.mockRestore();
    }
  });
});
