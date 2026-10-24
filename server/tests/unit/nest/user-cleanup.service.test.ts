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
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { BudgetSettlements } from '../../../src/db/entities/BudgetSettlements.entity';
import { JourneyContributors } from '../../../src/db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { JourneyShareTokens } from '../../../src/db/entities/JourneyShareTokens.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { PluginUserErasureQueue } from '../../../src/db/entities/PluginUserErasureQueue.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { ShareTokens } from '../../../src/db/entities/ShareTokens.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { BudgetItemsRepository } from '../../../src/db/repositories/BudgetItems.repository';
import type { BudgetSettlementsRepository } from '../../../src/db/repositories/BudgetSettlements.repository';
import type { JourneyContributorsRepository } from '../../../src/db/repositories/JourneyContributors.repository';
import type { JourneyEntriesRepository } from '../../../src/db/repositories/JourneyEntries.repository';
import type { JourneyShareTokensRepository } from '../../../src/db/repositories/JourneyShareTokens.repository';
import type { JourneysRepository } from '../../../src/db/repositories/Journeys.repository';
import { MaintenanceRepository } from '../../../src/db/repositories/MaintenanceRepository';
import type { TripMembersRepository } from '../../../src/db/repositories/TripMembers.repository';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import { createTestBudgetSettlementsRepo } from '../../helpers/budget-repos';
import { createUser, createTrip } from '../../helpers/factories';
import { countRows, deleteRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { makeShareToken } from '../../helpers/factories/trips';
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
import type { TestOrm } from '../../helpers/test-orm';
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
vi.mock('../../../src/nest/plugins/paths', () => ({ pluginsDataRoot: () => dataRootRef.value }));

let em: EntityManager;
let budget: BudgetService;
let svc: UserCleanupService;
beforeAll(async () => {
  // Plan 4 Task 4: UserCleanupService's own DatabaseService param is gone.
  // UC1 goes through MaintenanceRepository, which Nest injects (built here
  // over the test ORM's EntityManager, as MaintenanceModule's factory does).
  orm = await sharedTestOrm(testDb);
  em = orm.em;
  budget = new BudgetService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new ExchangeRatesService(),
    new RealtimeService(),
    await createTestUnitOfWork(testDb),
    ...(await budgetRepoArgs(testDb)),
  );
  svc = new UserCleanupService(
    new MaintenanceRepository(em),
    budget,
    await createTestUnitOfWork(testDb),
    await createTestUsersRepo(testDb),
    // Plan 4 Task 1 constructor-ripple: UC4's repository.
    await createTestTripMembersRepo(testDb),
    await createTestBudgetItemsRepo(testDb),
    await createTestBudgetSettlementsRepo(testDb),
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

let orm: TestOrm;

const installPlugin = async (id: string, permissions: string[] | null) => {
  await insertRow(orm, Plugins, {
    id,
    name: id,
    version: '1.0.0',
    permissions: permissions === null ? null : JSON.stringify(permissions),
  });
};

const createJourney = (userId: number, title: string): Promise<number> =>
  insertRow(orm, Journeys, { user: userId, title, status: 'draft', created_at: 0, updated_at: 0 });

const queuedFor = async (userId: number): Promise<string[]> =>
  (await findRows(orm, PluginUserErasureQueue, { user_id: userId }, { plugin_id: 'asc' })).map((r) => r.plugin_id);

/** A journey entry by the author, as the journal writes it. */
const addEntry = (journeyId: number, authorId: number, type: string, title: string, entryDate: string) =>
  insertRow(orm, JourneyEntries, {
    journey: journeyId,
    author: authorId,
    type,
    title,
    entry_date: entryDate,
    created_at: 0,
    updated_at: 0,
  });

beforeEach(async () => {
  resetTestDb(testDb);
  // The plugin tables are not user data, so resetTestDb leaves them alone —
  // these tests own them and must not leak rows into each other.
  await deleteRows(orm, PluginUserErasureQueue);
  await deleteRows(orm, PluginUserConfig);
  await deleteRows(orm, Plugins);
  dataRootRef.value = path.join(os.tmpdir(), 'trek-user-cleanup-absent');
});

afterAll(() => {
  testDb.close();
});

describe('erasePluginUserData', () => {
  it('USER-CLEANUP-001: deletes the host-side per-user plugin rows', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    await installPlugin('demo', []);
    await insertRow(orm, PluginUserConfig, { plugin_id: 'demo', user_id: user.id, config: '{"token":"secret"}' });
    await insertRow(orm, PluginUserConfig, { plugin_id: 'demo', user_id: other.id, config: '{"token":"keep-me"}' });

    await svc.erasePluginUserData(user.id);

    const rows = await findRows(orm, PluginUserConfig);
    expect(rows.map((r) => r.user_id)).toEqual([other.id]);
  });

  it('USER-CLEANUP-002: enqueues an erasure only for plugins holding hook:user-data', async () => {
    const { user } = createUser(testDb);
    await installPlugin('with-hook', ['hook:user-data', 'trips:read']);
    await installPlugin('without-hook', ['trips:read']);
    await installPlugin('no-permissions', null);

    await svc.erasePluginUserData(user.id);

    expect(await queuedFor(user.id)).toEqual(['with-hook']);
  });

  it('USER-CLEANUP-003: treats an unparseable permissions column as no permissions', async () => {
    const { user } = createUser(testDb);
    await insertRow(orm, Plugins, { id: 'broken', name: 'broken', version: '1.0.0', permissions: '{not json' });

    await svc.erasePluginUserData(user.id);

    expect(await queuedFor(user.id)).toEqual([]);
  });

  it('USER-CLEANUP-004: enqueues every orphan data dir — an uninstall keeps no permissions row', async () => {
    const { user } = createUser(testDb);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-plugins-data-'));
    dataRootRef.value = root;
    fs.mkdirSync(path.join(root, 'uninstalled-but-retained'));
    fs.writeFileSync(path.join(root, 'stray-file'), ''); // not a directory → ignored
    await installPlugin('installed', ['hook:user-data']);
    fs.mkdirSync(path.join(root, 'installed'));

    try {
      await svc.erasePluginUserData(user.id);
      // 'installed' comes from the permissions scan, not the orphan scan, and the
      // INSERT OR IGNORE keeps it single.
      expect(await queuedFor(user.id)).toEqual(['installed', 'uninstalled-but-retained']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('USER-CLEANUP-005: survives a slim schema without the plugin tables', async () => {
    const slim = new (require('better-sqlite3'))(':memory:');
    slim.exec('CREATE TABLE users (id INTEGER PRIMARY KEY)');
    // test-sql-allow: the slim database is hand-rolled without the migrated schema, so no entity can write its users row.
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
      new MaintenanceRepository((await sharedTestOrm(slim)).em),
      budget,
      await createTestUnitOfWork(slim),
      await createTestUsersRepo(slim),
      {} as unknown as TripMembersRepository,
      {} as unknown as BudgetItemsRepository,
      {} as unknown as BudgetSettlementsRepository,
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
    await insertRow(orm, TripMembers, { trip: trip.id, user: owner.id, invitedByRef: victim.id });
    await makeShareToken(orm, trip.id, victim.id, { token: 'tok' });

    await svc.deleteUserCompletely(victim.id);

    expect(await findRow(orm, Users, { id: victim.id })).toBeNull();
    expect((await findRow(orm, TripMembers, { user: owner.id }))?.invited_by).toBeNull();
    expect(await countRows(orm, ShareTokens)).toBe(0);
  });

  it('USER-CLEANUP-011: deletes a user who recorded a payment between two other members, and keeps the payment', async () => {
    const { user: owner } = createUser(testDb);
    const { user: payer } = createUser(testDb, { username: 'payer' });
    const { user: recorder } = createUser(testDb, { username: 'recorder' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, BudgetSettlements, {
      trip: trip.id,
      fromUser: payer.id,
      toUser: owner.id,
      amount: 12.5,
      createdByUser: recorder.id,
    });

    await svc.deleteUserCompletely(recorder.id);

    expect(await findRow(orm, Users, { id: recorder.id })).toBeNull();
    const settlement = await findRow(orm, BudgetSettlements, {});
    expect({
      from_user_id: settlement?.from_user_id,
      to_user_id: settlement?.to_user_id,
      amount: settlement?.amount,
      created_by_user_id: settlement?.created_by_user_id,
    }).toEqual({ from_user_id: payer.id, to_user_id: owner.id, amount: 12.5, created_by_user_id: null });
  });

  it('USER-CLEANUP-007: deletes their journeys and the entries they authored elsewhere', async () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const ownJourney = await createJourney(victim.id, 'Mine');
    const foreignJourney = await createJourney(owner.id, 'Theirs');
    await addEntry(foreignJourney, victim.id, 'note', 'Guest post', '2026-08-08');

    await svc.deleteUserCompletely(victim.id);

    expect(await findRow(orm, Journeys, { id: ownJourney })).toBeNull();
    expect(await findRow(orm, Journeys, { id: foreignJourney })).not.toBeNull();
    expect(await countRows(orm, JourneyEntries)).toBe(0);
  });

  it('USER-CLEANUP-010: GDPR erasure — UC6-10 remove every journey/share-table row the departing user reaches, and only those', async () => {
    const { user: victim } = createUser(testDb, { username: 'gdpr-victim' });
    const { user: second } = createUser(testDb, { username: 'gdpr-second' });
    const { user: third } = createUser(testDb, { username: 'gdpr-third' });

    // Victim owns a journey with an entry, a gallery photo and a share token
    // they created — every one of these is reached by UC8's FK cascade.
    const ownJourney = await createJourney(victim.id, 'Mine');
    await addEntry(ownJourney, victim.id, 'entry', 'Own entry', '2026-01-01');
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'local', owner: victim.id });
    await insertRow(orm, JourneyPhotos, { journey: ownJourney, photo: photoId, created_at: 0 });
    await insertRow(orm, JourneyShareTokens, { journey: ownJourney, token: 'own-tok', createdByRef: victim.id });

    // Victim contributes (editor) to a SECOND user's journey — not owned, so UC8's cascade never reaches it; UC10 must.
    const secondJourney = await createJourney(second.id, 'Theirs');
    await insertRow(orm, JourneyContributors, { journey: secondJourney, user: victim.id, role: 'editor', added_at: 0 });

    // Victim authored an entry, and separately created a share link, on a THIRD user's journey — UC9/UC7 must catch these.
    const thirdJourney = await createJourney(third.id, 'Elsewhere');
    await addEntry(thirdJourney, victim.id, 'entry', 'Guest entry', '2026-01-02');
    await insertRow(orm, JourneyShareTokens, { journey: thirdJourney, token: 'third-tok', createdByRef: victim.id });

    // R10/UC6, full-key: `share_tokens` (trip-level, `nest/share`) — a
    // GENUINELY DIFFERENT table from `journey_share_tokens` above, on the
    // SAME fixture per the ruling's own instruction. Victim creates a share
    // link on a trip they OWN, and — `created_by` need not equal the trip's
    // owner — a SECOND share link on a trip owned by `second` (not the
    // victim). A THIRD share link, on that same foreign trip but created by
    // `third` (not the victim), is the control row UC6 must NOT touch.
    const ownTrip = createTrip(testDb, victim.id);
    const foreignTrip = createTrip(testDb, second.id);
    await makeShareToken(orm, ownTrip.id, victim.id, { token: 'own-trip-tok' });
    await makeShareToken(orm, foreignTrip.id, victim.id, { token: 'foreign-trip-tok' });
    await makeShareToken(orm, foreignTrip.id, third.id, { token: 'control-tok' });

    await svc.deleteUserCompletely(victim.id);

    // Everything the departing user owned is gone (UC8 + cascade).
    expect(await findRow(orm, Journeys, { id: ownJourney })).toBeNull();
    expect(await countRows(orm, JourneyEntries, { journey: ownJourney })).toBe(0);
    expect(await countRows(orm, JourneyPhotos, { journey: ownJourney })).toBe(0);
    expect(await countRows(orm, JourneyShareTokens, { journey: ownJourney })).toBe(0);
    // Everything the departing user merely touched on OTHER users' journeys is gone too (UC7/UC9/UC10).
    expect(await findRow(orm, JourneyEntries, { journey: thirdJourney, author: victim.id })).toBeNull();
    expect(await findRow(orm, JourneyContributors, { journey: secondJourney, user: victim.id })).toBeNull();
    expect(await findRow(orm, JourneyShareTokens, { journey: thirdJourney, createdByRef: victim.id })).toBeNull();
    // Nothing extra removed: the other two users' own journeys survive.
    expect(await findRow(orm, Journeys, { id: secondJourney })).not.toBeNull();
    expect(await findRow(orm, Journeys, { id: thirdJourney })).not.toBeNull();

    // UC6/R10: every `share_tokens` row `created_by` the departing user is
    // gone, on BOTH their own trip and a trip they don't own — and the
    // control row (same foreign trip, created by someone else) survives
    // untouched. `ownTrip` itself cascades away with the user's cleanup
    // elsewhere (not this test's concern); the assertion is on `created_by`.
    expect(await findRow(orm, ShareTokens, { createdByRef: victim.id })).toBeNull();
    expect((await findRow(orm, ShareTokens, { trip: foreignTrip.id }))?.token).toBe('control-tok');
  });

  it('USER-CLEANUP-008: re-derives the expense divisor before the member rows cascade away', async () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: victim.id });
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      total_price: 80,
      member_ids: [owner.id, victim.id],
    });
    await updateRows(orm, BudgetItems, { id: item.id }, { paidByUser: victim.id });

    await svc.deleteUserCompletely(victim.id);

    const stored = await findRow(orm, BudgetItems, { id: item.id });
    const row = { persons: stored?.persons, paid_by_user_id: stored?.paid_by_user_id };
    expect(row).toEqual({ persons: 1, paid_by_user_id: null });
  });

  it('USER-CLEANUP-009: is atomic — a failing users DELETE rolls the reference cleanup back', async () => {
    const { user: owner } = createUser(testDb);
    const { user: victim } = createUser(testDb, { username: 'victim' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: owner.id, invitedByRef: victim.id });

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
          new MaintenanceRepository(em),
          budget,
          await createTestUnitOfWork(testDb),
          usersRepo,
          await createTestTripMembersRepo(testDb),
          await createTestBudgetItemsRepo(testDb),
          await createTestBudgetSettlementsRepo(testDb),
          await createTestJourneyShareTokensRepo(testDb),
          await createTestJourneysRepo(testDb),
          await createTestJourneyEntriesRepo(testDb),
          await createTestJourneyContributorsRepo(testDb),
          await createTestShareTokensRepo(testDb),
          await createTestPluginsRepo(testDb),
          await createTestPluginUserErasureQueueRepo(testDb),
        ).deleteUserCompletely(victim.id),
      ).rejects.toThrow('boom');

      expect(await findRow(orm, Users, { id: victim.id })).not.toBeNull();
      expect((await findRow(orm, TripMembers, { user: owner.id }))?.invited_by).toBe(victim.id);
    } finally {
      deleteByIdSpy.mockRestore();
    }
  });
});
