/**
 * Unit tests for TripMembersService — MEMBERS-SVC-001 through MEMBERS-SVC-018
 * (016-018 added by the Task 6 review's M1/L2 items: transferOwnership/
 * createGuest transaction-rollback proofs and an addMember concurrency case).
 *
 * The roster cases that came over with the split still run in
 * tests/unit/nest/trips.service.test.ts (TRIP-SVC-020…023, 030…034, 049, 052,
 * 053) against this same service; they were left there so the diff shows the
 * move rather than a rewrite. This file adds only what that set never reached:
 * the five helpers the controller talks through, and the fallbacks each
 * mutation takes when a row is missing or a name is unusable. Same in-memory
 * SQLite harness, so the SQL is exercised for real.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

const { broadcast, notifySend } = vi.hoisted(() => ({
  broadcast: vi.fn(),
  notifySend: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  // Trip access reads through TripsRepository now; the module only hands out the handle.
  return { db, closeDb: () => {}, reinitialize: () => {} };
});

import { db as testDb } from '../../../src/db/database';
vi.mock('../../../src/websocket', () => ({ broadcast }));
// notifyInvite reaches the bridge through a dynamic import — keep the send in scope
// but out of the transports.

import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { NotFoundError, ValidationError } from '../../../src/nest/common/domain-errors';
import type { User } from '../../../src/types';
import { notificationsStub } from '../../helpers/notifications';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestUsersRepo, createTestTripsRepo, createTestTripMembersRepo, sharedTestOrm } from '../../helpers/test-uow';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import { countRows, deleteRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { readUser } from '../../helpers/factories/users';
import { makePlugin, setPluginUserConfig } from '../../helpers/factories/plugins';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { PluginUserErasureQueue } from '../../../src/db/entities/PluginUserErasureQueue.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';

const orm = () => sharedTestOrm(testDb);

/** The trip_members row for the pair, or null. */
async function memberRow(tripId: number, userId: number) {
  return findRow(await orm(), TripMembers, { trip: tripId, user: userId });
}

/** The trip's owner as stored. */
async function ownerOf(tripId: number): Promise<number | undefined> {
  return (await findRow(await orm(), Trips, { id: tripId }))?.user_id;
}
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { createTestJourneysRepo, createTestJourneyEntriesRepo, createTestJourneyContributorsRepo } from '../../helpers/journey-repos';
import { createTestJourneyShareTokensRepo } from '../../helpers/journey-share-repos';
import { createTestShareTokensRepo, createTestPluginsRepo, createTestPluginUserErasureQueueRepo } from '../../helpers/share-repos';
import type { EntityManager } from '@mikro-orm/core';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { TripMembersRepository } from '../../../src/db/repositories/TripMembers.repository';
import { createTestBudgetSettlementsRepo } from '../../helpers/budget-repos';
import { MaintenanceRepository } from '../../../src/db/repositories/MaintenanceRepository';

// Plan 3c Task 0b: `dbsEm` is resolved once, at the top of the `beforeAll`
// below — `canAccessTrip`/`isOwner`/`rosterUserIds`/`getPlaceWithTags`
// resolve `TripsRepository`/`TripMembersRepository`/`PlacesRepository`
// through it. Plan 4 Task 4: `DatabaseService` itself is gone —
// `UserCleanupService` now takes this `EntityManager` directly.
let dbsEm: EntityManager | undefined;

let budgetSvc: BudgetService;
let roster: TripMembersService;
let tripsRepo: TripsRepository;
let usersRepo: UsersRepository;
// Task 6 review, M1: hoisted (was constructed inline) so the mutation-rollback
// tests below can `vi.spyOn` the SAME instance the service holds — the shared
// EM caches repositories, so a fresh `createTestTripMembersRepo(testDb)` call
// returns this identical object (Task 6 review's own confirmation for `tripsRepo`/
// `usersRepo`'s existing spies applies here too).
let tripMembersRepo: TripMembersRepository;
beforeAll(async () => {
  dbsEm = (await sharedTestOrm(testDb)).em;
  tripsRepo = await createTestTripsRepo(testDb);
  usersRepo = await createTestUsersRepo(testDb);
  tripMembersRepo = await createTestTripMembersRepo(testDb);
  budgetSvc = new BudgetService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new ExchangeRatesService(), new RealtimeService(), await createTestUnitOfWork(testDb), ...(await budgetRepoArgs(testDb)));
  roster = new TripMembersService(
    budgetSvc,
    new UserCleanupService(new MaintenanceRepository(dbsEm!), budgetSvc, await createTestUnitOfWork(testDb), usersRepo, await createTestTripMembersRepo(testDb), await createTestBudgetItemsRepo(testDb), await createTestBudgetSettlementsRepo(testDb), await createTestJourneyShareTokensRepo(testDb), await createTestJourneysRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestJourneyContributorsRepo(testDb), await createTestShareTokensRepo(testDb), await createTestPluginsRepo(testDb), await createTestPluginUserErasureQueueRepo(testDb)),
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(), notificationsStub(notifySend), await createTestUnitOfWork(testDb),
    tripsRepo, tripMembersRepo, usersRepo,
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcast.mockClear();
  notifySend.mockClear();
});

afterAll(() => {
  testDb.close();
});

// ── Delegating helpers (what the controller calls around the mutations) ───────

describe('TripMembersService delegation', () => {
  it('MEMBERS-SVC-001: canAccessTrip forwards the db helper — owner and member get the access row, a stranger gets nothing', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // Every member route answers 404 on a falsy result and reads access.user_id as
    // the trip owner, so a delegation that stopped forwarding would lock the whole
    // roster out rather than fail loudly.
    expect(await roster.canAccessTrip(String(trip.id), owner.id)).toMatchObject({ user_id: owner.id });
    expect(await roster.canAccessTrip(trip.id, member.id)).toMatchObject({ user_id: owner.id });
    expect(await roster.canAccessTrip(trip.id, stranger.id)).toBeUndefined();
  });

  it('MEMBERS-SVC-002: can() resolves member_manage at its trip_owner default and lets admins through', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);

    // Inviting and evicting both hang off this single call, so a member must not
    // pass it while the action sits at its default level.
    expect(await roster.can('member_manage', 'user', owner.id, owner.id, false)).toBe(true);
    expect(await roster.can('member_manage', 'user', owner.id, member.id, true)).toBe(false);
    expect(await roster.can('member_manage', 'admin', owner.id, member.id, true)).toBe(true);
  });

  it('MEMBERS-SVC-003: broadcast forwards the socket id so the originating client is not echoed', async () => {
    roster.broadcast('9', 'trip:updated', { trip: { id: 9 } } as never, 'sock-1');
    expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { trip: { id: 9 } }, 'sock-1');

    // A request without X-Socket-Id must still reach everybody — dropping the
    // argument here would exclude an arbitrary socket instead of none.
    roster.broadcast('9', 'trip:updated', { trip: { id: 9 } } as never, undefined);
    expect(broadcast).toHaveBeenLastCalledWith('9', 'trip:updated', { trip: { id: 9 } }, undefined);
  });

  it('MEMBERS-SVC-004: getTripForViewer re-reads the trip in list shape, with is_owner per viewer', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Handover' });
    addTripMember(testDb, trip.id, member.id);

    // The handover broadcast hands the raw :id route param straight in, so the
    // named-parameter query has to keep matching a string id against the INTEGER
    // column — and the payload the clients re-read must carry their own is_owner.
    const asOwner = await roster.getTripForViewer(String(trip.id), owner.id) as unknown as Record<string, unknown>;
    expect(asOwner).toMatchObject({ id: trip.id, title: 'Handover', is_owner: 1, owner_username: owner.username, shared_count: 1 });
    const asMember = await roster.getTripForViewer(trip.id, member.id) as unknown as Record<string, unknown>;
    expect(asMember.is_owner).toBe(0);
    expect(await roster.getTripForViewer(999999, owner.id)).toBeUndefined();
  });

  it('MEMBERS-SVC-005: notifyInvite sends a user-scoped trip_invite carrying the actor, invitee and trip', async () => {
    const actor = { id: 4, email: 'actor@example.test' } as User;
    roster.notifyInvite('9', actor, 12, 'Roadtrip', 'invitee@example.test');

    // The bridge is imported lazily inside the call, so the send lands a microtask later.
    await vi.waitFor(() => expect(notifySend).toHaveBeenCalledTimes(1));
    expect(notifySend).toHaveBeenCalledWith({
      event: 'trip_invite',
      actorId: 4,
      scope: 'user',
      targetId: 12,
      params: { trip: 'Roadtrip', actor: 'actor@example.test', invitee: 'invitee@example.test', tripId: '9' },
    });
  });

  it('MEMBERS-SVC-006: a rejected notification never reaches the invite request', async () => {
    notifySend.mockRejectedValueOnce(new Error('bridge down'));
    const actor = { id: 4, email: 'actor@example.test' } as User;

    // The membership row is already committed when this fires — an unhandled
    // rejection would turn a successful invite into a 500 (and crash the process
    // on an unhandled promise rejection).
    expect(() => roster.notifyInvite('9', actor, 12, 'Roadtrip', 'invitee@example.test')).not.toThrow();
    await vi.waitFor(() => expect(notifySend).toHaveBeenCalledTimes(1));
  });
});

// ── addMember fallbacks ──────────────────────────────────────────────────────

describe('addMember fallbacks', () => {
  // R8 (Plan 3c program brief item 8): the SQL-text-keyed Proxy fault
  // injection this test used to build (`rosterWithMissingRow`, keyed on the
  // literal `'SELECT title FROM trips WHERE id = ?'` fragment) is rewritten
  // onto a repository-level fault — `TripsRepository.getTitle` resolving
  // `null`, the shape it already returns on a genuine miss.
  it("MEMBERS-SVC-007: addMember still reports a title when the trip row cannot be read ('Untitled')", async () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Readable' });

    // The title only feeds the invite notification, and it is read after the
    // membership is inserted — losing that row must not cost the invitee their
    // access or throw on an undefined title.
    const spy = vi.spyOn(tripsRepo, 'getTitle').mockResolvedValueOnce(null);
    let result;
    try {
      result = await roster.addMember(trip.id, invitee.email, owner.id, owner.id);
    } finally {
      spy.mockRestore();
    }
    expect(result.tripTitle).toBe('Untitled');
    expect(await memberRow(trip.id, invitee.id)).not.toBeNull();
  });

  it('MEMBERS-SVC-008: addMember resolves a padded identifier and matches on username as well as email', async () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // Pasted invites arrive with surrounding whitespace; without the trim the
    // lookup misses and the box answers 'User not found' for a real account.
    expect((await roster.addMember(trip.id, `  ${invitee.username}  `, owner.id, owner.id)).member.id).toBe(invitee.id);
  });
});

// ── transferOwnership guard rails (#973) ─────────────────────────────────────

describe('transferOwnership guard rails', () => {
  it('MEMBERS-SVC-009: rejects a trip that no longer exists, before any other check', async () => {
    const { user: owner } = createUser(testDb);

    // NotFoundError, not ValidationError: the controller maps the two to 404 and
    // 400. Passing the owner as the new owner too proves the trip lookup runs
    // first — otherwise this would surface as 'You already own this trip'.
    await expect(roster.transferOwnership(999999, owner.id, owner.id)).rejects.toThrow(NotFoundError);
    await expect(roster.transferOwnership(999999, owner.id, owner.id)).rejects.toThrow('Trip not found');
  });

  it('MEMBERS-SVC-010: rejects an id with no user row before it checks membership', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // A stale id from the client must read as a 404 'User not found' rather than
    // the 400 the non-member branch below it would produce, and the trip must keep
    // its owner either way.
    await expect(roster.transferOwnership(trip.id, 999999, owner.id)).rejects.toThrow(NotFoundError);
    await expect(roster.transferOwnership(trip.id, 999999, owner.id)).rejects.toThrow('User not found');
    expect(await ownerOf(trip.id)).toBe(owner.id);
  });

  // R8: the same rewrite as MEMBERS-SVC-007 above, on `UsersRepository.getEmail`
  // (TM12) instead of `TripsRepository.getTitle` — `findIdEmailGuest`'s own
  // read for the new owner (TM10) is untouched, so only the fromEmail leg fails.
  it('MEMBERS-SVC-011: completes with an empty fromEmail when the former owner cannot be read', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // fromEmail is audit detail only; an unreadable row must not abort the
    // handover halfway, which would leave the owner pointer and the member rows
    // disagreeing about who owns the trip.
    const spy = vi.spyOn(usersRepo, 'getEmail').mockResolvedValueOnce(null);
    let result;
    try {
      result = await roster.transferOwnership(trip.id, member.id, owner.id);
    } finally {
      spy.mockRestore();
    }
    expect(result.fromEmail).toBe('');
    expect(result.toEmail).toBe(member.email);
    expect(await ownerOf(trip.id)).toBe(member.id);
  });
});

// ── Guest name validation (#1362) ────────────────────────────────────────────

describe('guest name validation', () => {
  it('MEMBERS-SVC-012: createGuest rejects an absent, blank or over-long name and writes nothing', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    await expect(roster.createGuest(trip.id, undefined as never, owner.id)).rejects.toThrow(ValidationError);
    await expect(roster.createGuest(trip.id, '   ', owner.id)).rejects.toThrow('Guest name is required');
    await expect(roster.createGuest(trip.id, 'x'.repeat(51), owner.id)).rejects.toThrow('Guest name must be 50 characters or fewer');

    // The guards run ahead of the transaction, so a rejected name can never leave
    // a credential-less users row behind with no trip to belong to.
    expect(await countRows(await orm(), Users, { is_guest: 1 })).toBe(0);

    // 50 is the accepted boundary the DTO shares — off by one here and the API
    // starts refusing names the client believes are valid.
    expect((await roster.createGuest(trip.id, 'x'.repeat(50), owner.id)).member.username).toHaveLength(50);
  });

  it('MEMBERS-SVC-013: renameGuest rejects an absent, blank or over-long name — before the trip-scope check', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member: guest } = await roster.createGuest(trip.id, 'Ida', owner.id);

    await expect(roster.renameGuest(trip.id, guest.id, undefined as never)).rejects.toThrow(ValidationError);
    await expect(roster.renameGuest(trip.id, guest.id, '  ')).rejects.toThrow('Guest name is required');
    await expect(roster.renameGuest(trip.id, guest.id, 'x'.repeat(51))).rejects.toThrow('Guest name must be 50 characters or fewer');

    // Order matters for the status code: an unusable name throws (400) even for an
    // id that is not a guest of this trip, where the scope check returns false (404).
    await expect(roster.renameGuest(trip.id, owner.id, '')).rejects.toThrow('Guest name is required');
    expect((await readUser(await orm(), guest.id)).display_name).toBe('Ida');

    // A padded name is stored trimmed, so the roster does not render the spaces.
    expect(await roster.renameGuest(trip.id, guest.id, '  Ida M.  ')).toBe(true);
    expect((await readUser(await orm(), guest.id)).display_name).toBe('Ida M.');
  });

  it("MEMBERS-SVC-014: deleteGuest is trip-scoped — another trip's owner cannot erase this trip's guest", async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const otherTrip = createTrip(testDb, other.id);
    const { member: guest } = await roster.createGuest(trip.id, 'Jo', owner.id);

    // The route only proves ownership of the trip in the URL, so this check is the
    // only thing between it and a foreign guest's users row — and the delete
    // cascades every assignment that guest is on.
    expect(await roster.deleteGuest(otherTrip.id, guest.id)).toBe(false);
    expect(await findRow(await orm(), Users, { id: guest.id })).not.toBeNull();
  });
});

// ── listMembers shaping ──────────────────────────────────────────────────────

describe('listMembers shaping', () => {
  it('MEMBERS-SVC-015: avatar_url follows the storage form and the inviter is named, not just its id', async () => {
    const { user: owner } = createUser(testDb);
    const { user: uploaded } = createUser(testDb);
    const { user: sso } = createUser(testDb);
    const { user: bare } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await updateRows(await orm(), Users, { id: owner.id }, { avatar: 'me.png', display_name: 'Owner Displayed' });
    await updateRows(await orm(), Users, { id: uploaded.id }, { avatar: 'a.png' });
    await updateRows(await orm(), Users, { id: sso.id }, { avatar: 'https://idp.example.test/p.jpg' });
    await insertRow(await orm(), TripMembers, { trip: trip.id, user: uploaded.id, invitedByRef: owner.id });
    await insertRow(await orm(), TripMembers, { trip: trip.id, user: sso.id, invitedByRef: owner.id });
    addTripMember(testDb, trip.id, bare.id);

    const { owner: ownerRow, members } = await roster.listMembers(trip.id, owner.id);
    // added_at has second resolution, so rows created in one test are tied — index
    // by id rather than asserting the ORDER BY.
    const byId = new Map(members.map(m => [m.id, m]));

    // An uploaded file name becomes a /uploads/avatars path; an OIDC picture claim
    // (#1399) is an absolute URL and must pass through untouched; a member without
    // one must stay null instead of rendering '/uploads/avatars/null'.
    expect(ownerRow.avatar_url).toBe('/uploads/avatars/me.png');
    expect(byId.get(uploaded.id)!.avatar_url).toBe('/uploads/avatars/a.png');
    expect(byId.get(sso.id)!.avatar_url).toBe('https://idp.example.test/p.jpg');
    expect(byId.get(bare.id)!.avatar_url).toBeNull();

    // The inviter is resolved through a LEFT JOIN that prefers display_name; a row
    // with no inviter reports null rather than dropping out of the list.
    expect(byId.get(uploaded.id)!.invited_by_username).toBe('Owner Displayed');
    expect(byId.get(bare.id)!.invited_by_username).toBeNull();

    // is_guest is a SQLite integer on the way out and a boolean on the wire.
    expect(byId.get(bare.id)!.is_guest).toBe(false);
    expect(ownerRow.is_guest).toBe(false);
  });
});

// ── Task 6 review items (M1, L2) ─────────────────────────────────────────────
//
// task-6-review.md M1: neither `transferOwnership` nor `createGuest` had a
// test proving their `uow.transactional` block actually rolls back when its
// LAST statement fails — a mutation moving `addIgnoringConflict`/`addMember`
// outside the transaction survived the whole suite. Shaped like TRIP-SVC-052
// (`vi.spyOn` the repository the shared EM caches, not a hand-rolled fault
// injection). L2: `addMember`'s TM5→TM6 check-then-act (§18.4) had no
// concurrency test of its own — `joinTripAsMember`'s TRIP-JOIN-005 covers the
// identical shape one method over; this copies it.

describe('Task 6 review items — rollback and concurrency', () => {
  it('MEMBERS-SVC-016 (mutation-proved): transferOwnership rolls back when the final INSERT rejects — the owner pointer and the new owner\'s membership both survive', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await roster.addMember(trip.id, member.email, owner.id, owner.id);

    const spy = vi.spyOn(tripMembersRepo, 'addIgnoringConflict').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(roster.transferOwnership(trip.id, member.id, owner.id)).rejects.toThrow('boom');
    } finally {
      spy.mockRestore();
    }

    // setOwner (TM13) ran, then remove (TM14) ran, then addIgnoringConflict (TM15)
    // rejected — a fix that moved TM15 outside the transaction would leave TM13/TM14
    // committed while this assertion still expects them rolled back.
    expect(await ownerOf(trip.id)).toBe(owner.id);
    expect(await memberRow(trip.id, member.id)).not.toBeNull();
  });

  it('MEMBERS-SVC-017 (mutation-proved): createGuest rolls back when the membership INSERT rejects — no orphan guest user row', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const before = await countRows(await orm(), Users);

    const spy = vi.spyOn(tripMembersRepo, 'addMember').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(roster.createGuest(trip.id, 'Rollback Rae', owner.id)).rejects.toThrow('boom');
    } finally {
      spy.mockRestore();
    }

    // insertGuest (TM16) ran, then addMember (TM17) rejected — a fix that moved
    // TM17 outside the transaction would leave the guest's `users` row behind.
    const after = await countRows(await orm(), Users);
    expect(after).toBe(before);
  });

  it('MEMBERS-SVC-019: deleteGuest rolls the plugin erasure back with the user delete, so a guest that survives keeps its plugin rows and no erasure is queued', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member: guest } = await roster.createGuest(trip.id, 'Rollback Ray', owner.id);
    await makePlugin(await orm(), 'members-svc-019', { permissions: JSON.stringify(['hook:user-data']) });
    await setPluginUserConfig(await orm(), 'members-svc-019', guest.id, { token: 'keep-me' });

    const spy = vi.spyOn(usersRepo, 'deleteGuest').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(roster.deleteGuest(trip.id, guest.id)).rejects.toThrow('boom');

      // The erasure ran first, then the users delete rejected. Erasing outside the
      // transaction would have left the host rows deleted and an erasure queued for
      // a guest that still exists.
      expect(await findRow(await orm(), Users, { id: guest.id })).not.toBeNull();
      expect(await findRow(await orm(), PluginUserConfig, { user_id: guest.id })).not.toBeNull();
      expect(await findRows(await orm(), PluginUserErasureQueue, { user_id: guest.id })).toEqual([]);
    } finally {
      spy.mockRestore();
      // resetTestDb leaves the plugin tables alone, so this test cleans up its own rows.
      await deleteRows(await orm(), PluginUserErasureQueue, { plugin_id: 'members-svc-019' });
      await deleteRows(await orm(), PluginUserConfig, { plugin_id: 'members-svc-019' });
      await deleteRows(await orm(), Plugins, { id: 'members-svc-019' });
    }
  });

  it('MEMBERS-SVC-018 (concurrency, §18.4, copies TRIP-JOIN-005): two concurrent addMember calls for the same (trip, user) race the TM5→TM6 check-then-act window', async () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const results = await Promise.allSettled([
      roster.addMember(trip.id, invitee.email, owner.id, owner.id),
      roster.addMember(trip.id, invitee.email, owner.id, owner.id),
    ]);
    // Today's actual outcome, run under real concurrency, not assumed: the
    // method performs no locking/serialization of its own (TM5 `exists` →
    // TM6 `addMember`, unchanged by this conversion, §18.4). Whichever call
    // loses the race either throws the app-level 'User already has access'
    // (TM5 caught it) or rejects on the table's own UNIQUE(trip_id, user_id)
    // constraint (TM6 raced past TM5) — both are acceptable, unchanged
    // outcomes; what must hold is exactly one winner and one loser, and at
    // most one membership row (Task 7 review L6: pin the exact 1/1 split,
    // not merely "at least one" — a `>= 1` assertion would also pass if the
    // race somehow let both calls through, which is precisely the bug this
    // test exists to catch).
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    // L-1 (Task 9 fix round 2): pin the loser's actual reason too, not just
    // the 1/1 split — measured 3/3 under real concurrency: TM6 races past
    // TM5's own `exists` check and the loser rejects on the table's own
    // UNIQUE(trip_id, user_id) constraint, never the app-level 'User already
    // has access' the TM5-catches-it branch above describes as possible.
    // Without this the test stayed green against a mutation that serializes
    // `addMember` (forcing the TM5-catch branch instead) — not load-bearing.
    expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(/UNIQUE constraint failed: trip_members/);
    expect(await countRows(await orm(), TripMembers, { trip: trip.id, user: invitee.id })).toBe(1);
  });
});
