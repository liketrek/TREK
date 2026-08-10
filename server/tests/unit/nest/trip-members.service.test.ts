/**
 * Unit tests for TripMembersService — MEMBERS-SVC-001 through MEMBERS-SVC-015.
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

const { testDb, dbMock, broadcast, notifySend } = vi.hoisted(() => {
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
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return {
    testDb: db,
    dbMock: mock,
    broadcast: vi.fn(),
    notifySend: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast }));
// notifyInvite reaches the bridge through a dynamic import — keep the send in scope
// but out of the transports.
vi.mock('../../../src/nest/notifications/notifications.bridge', () => ({ send: notifySend }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { NotFoundError, ValidationError } from '../../../src/nest/common/domain-errors';
import type { User } from '../../../src/types';

const dbs = () => new DatabaseService(testDb);
const budgetSvc = new BudgetService(dbs(), new PermissionsService(dbs()), new ExchangeRatesService(), new RealtimeService());
const roster = new TripMembersService(dbs(), budgetSvc, new UserCleanupService(dbs()), new PermissionsService(dbs()), new RealtimeService());

/**
 * A roster whose connection reports "no such row" for the first result of every
 * statement containing `match`. Both fallbacks it serves sit behind a FOREIGN
 * KEY, so the missing row cannot be produced through the real schema — freezing
 * the read is the only way to keep those branches honest. Same Proxy shape as
 * the failingConnection helper in trips.service.test.ts.
 */
function rosterWithMissingRow(match: string) {
  const conn = new Proxy(testDb, {
    get(target, prop) {
      if (prop === 'prepare') {
        return (sql: string) => {
          const stmt = target.prepare(sql);
          if (!sql.includes(match)) return stmt;
          return new Proxy(stmt, {
            get(s, p) {
              if (p === 'get') return () => undefined;
              const v = (s as any)[p];
              return typeof v === 'function' ? v.bind(s) : v;
            },
          });
        };
      }
      const v = (target as any)[prop];
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
  const frozen = { connection: conn, canAccessTrip: dbMock.canAccessTrip, isOwner: dbMock.isOwner } as unknown as DatabaseService;
  return new TripMembersService(frozen, budgetSvc, new UserCleanupService(dbs()), new PermissionsService(dbs()), new RealtimeService());
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
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
  it('MEMBERS-SVC-001: canAccessTrip forwards the db helper — owner and member get the access row, a stranger gets nothing', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // Every member route answers 404 on a falsy result and reads access.user_id as
    // the trip owner, so a delegation that stopped forwarding would lock the whole
    // roster out rather than fail loudly.
    expect(roster.canAccessTrip(String(trip.id), owner.id)).toMatchObject({ user_id: owner.id });
    expect(roster.canAccessTrip(trip.id, member.id)).toMatchObject({ user_id: owner.id });
    expect(roster.canAccessTrip(trip.id, stranger.id)).toBeUndefined();
  });

  it('MEMBERS-SVC-002: can() resolves member_manage at its trip_owner default and lets admins through', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);

    // Inviting and evicting both hang off this single call, so a member must not
    // pass it while the action sits at its default level.
    expect(roster.can('member_manage', 'user', owner.id, owner.id, false)).toBe(true);
    expect(roster.can('member_manage', 'user', owner.id, member.id, true)).toBe(false);
    expect(roster.can('member_manage', 'admin', owner.id, member.id, true)).toBe(true);
  });

  it('MEMBERS-SVC-003: broadcast forwards the socket id so the originating client is not echoed', () => {
    roster.broadcast('9', 'trip:updated', { trip: { id: 9 } } as never, 'sock-1');
    expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { trip: { id: 9 } }, 'sock-1');

    // A request without X-Socket-Id must still reach everybody — dropping the
    // argument here would exclude an arbitrary socket instead of none.
    roster.broadcast('9', 'trip:updated', { trip: { id: 9 } } as never, undefined);
    expect(broadcast).toHaveBeenLastCalledWith('9', 'trip:updated', { trip: { id: 9 } }, undefined);
  });

  it('MEMBERS-SVC-004: getTripForViewer re-reads the trip in list shape, with is_owner per viewer', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Handover' });
    addTripMember(testDb, trip.id, member.id);

    // The handover broadcast hands the raw :id route param straight in, so the
    // named-parameter query has to keep matching a string id against the INTEGER
    // column — and the payload the clients re-read must carry their own is_owner.
    const asOwner = roster.getTripForViewer(String(trip.id), owner.id) as Record<string, unknown>;
    expect(asOwner).toMatchObject({ id: trip.id, title: 'Handover', is_owner: 1, owner_username: owner.username, shared_count: 1 });
    const asMember = roster.getTripForViewer(trip.id, member.id) as Record<string, unknown>;
    expect(asMember.is_owner).toBe(0);
    expect(roster.getTripForViewer(999999, owner.id)).toBeUndefined();
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
  it("MEMBERS-SVC-007: addMember still reports a title when the trip row cannot be read ('Untitled')", () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Readable' });

    // The title only feeds the invite notification, and it is read after the
    // membership is inserted — losing that row must not cost the invitee their
    // access or throw on an undefined title.
    const broken = rosterWithMissingRow('SELECT title FROM trips WHERE id = ?');
    const result = broken.addMember(trip.id, invitee.email, owner.id, owner.id);
    expect(result.tripTitle).toBe('Untitled');
    expect(testDb.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, invitee.id)).toBeDefined();
  });

  it('MEMBERS-SVC-008: addMember resolves a padded identifier and matches on username as well as email', () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // Pasted invites arrive with surrounding whitespace; without the trim the
    // lookup misses and the box answers 'User not found' for a real account.
    expect(roster.addMember(trip.id, `  ${invitee.username}  `, owner.id, owner.id).member.id).toBe(invitee.id);
  });
});

// ── transferOwnership guard rails (#973) ─────────────────────────────────────

describe('transferOwnership guard rails', () => {
  it('MEMBERS-SVC-009: rejects a trip that no longer exists, before any other check', () => {
    const { user: owner } = createUser(testDb);

    // NotFoundError, not ValidationError: the controller maps the two to 404 and
    // 400. Passing the owner as the new owner too proves the trip lookup runs
    // first — otherwise this would surface as 'You already own this trip'.
    expect(() => roster.transferOwnership(999999, owner.id, owner.id)).toThrow(NotFoundError);
    expect(() => roster.transferOwnership(999999, owner.id, owner.id)).toThrow('Trip not found');
  });

  it('MEMBERS-SVC-010: rejects an id with no user row before it checks membership', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // A stale id from the client must read as a 404 'User not found' rather than
    // the 400 the non-member branch below it would produce, and the trip must keep
    // its owner either way.
    expect(() => roster.transferOwnership(trip.id, 999999, owner.id)).toThrow(NotFoundError);
    expect(() => roster.transferOwnership(trip.id, 999999, owner.id)).toThrow('User not found');
    expect((testDb.prepare('SELECT user_id FROM trips WHERE id = ?').get(trip.id) as { user_id: number }).user_id).toBe(owner.id);
  });

  it('MEMBERS-SVC-011: completes with an empty fromEmail when the former owner cannot be read', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // fromEmail is audit detail only; an unreadable row must not abort the
    // handover halfway, which would leave the owner pointer and the member rows
    // disagreeing about who owns the trip.
    const broken = rosterWithMissingRow('SELECT email FROM users WHERE id = ?');
    const result = broken.transferOwnership(trip.id, member.id, owner.id);
    expect(result.fromEmail).toBe('');
    expect(result.toEmail).toBe(member.email);
    expect((testDb.prepare('SELECT user_id FROM trips WHERE id = ?').get(trip.id) as { user_id: number }).user_id).toBe(member.id);
  });
});

// ── Guest name validation (#1362) ────────────────────────────────────────────

describe('guest name validation', () => {
  it('MEMBERS-SVC-012: createGuest rejects an absent, blank or over-long name and writes nothing', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    expect(() => roster.createGuest(trip.id, undefined as never, owner.id)).toThrow(ValidationError);
    expect(() => roster.createGuest(trip.id, '   ', owner.id)).toThrow('Guest name is required');
    expect(() => roster.createGuest(trip.id, 'x'.repeat(51), owner.id)).toThrow('Guest name must be 50 characters or fewer');

    // The guards run ahead of the transaction, so a rejected name can never leave
    // a credential-less users row behind with no trip to belong to.
    expect((testDb.prepare('SELECT COUNT(*) AS n FROM users WHERE is_guest = 1').get() as { n: number }).n).toBe(0);

    // 50 is the accepted boundary the DTO shares — off by one here and the API
    // starts refusing names the client believes are valid.
    expect(roster.createGuest(trip.id, 'x'.repeat(50), owner.id).member.username).toHaveLength(50);
  });

  it('MEMBERS-SVC-013: renameGuest rejects an absent, blank or over-long name — before the trip-scope check', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member: guest } = roster.createGuest(trip.id, 'Ida', owner.id);

    expect(() => roster.renameGuest(trip.id, guest.id, undefined as never)).toThrow(ValidationError);
    expect(() => roster.renameGuest(trip.id, guest.id, '  ')).toThrow('Guest name is required');
    expect(() => roster.renameGuest(trip.id, guest.id, 'x'.repeat(51))).toThrow('Guest name must be 50 characters or fewer');

    // Order matters for the status code: an unusable name throws (400) even for an
    // id that is not a guest of this trip, where the scope check returns false (404).
    expect(() => roster.renameGuest(trip.id, owner.id, '')).toThrow('Guest name is required');
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(guest.id) as { display_name: string }).display_name).toBe('Ida');

    // A padded name is stored trimmed, so the roster does not render the spaces.
    expect(roster.renameGuest(trip.id, guest.id, '  Ida M.  ')).toBe(true);
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(guest.id) as { display_name: string }).display_name).toBe('Ida M.');
  });

  it("MEMBERS-SVC-014: deleteGuest is trip-scoped — another trip's owner cannot erase this trip's guest", () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const otherTrip = createTrip(testDb, other.id);
    const { member: guest } = roster.createGuest(trip.id, 'Jo', owner.id);

    // The route only proves ownership of the trip in the URL, so this check is the
    // only thing between it and a foreign guest's users row — and the delete
    // cascades every assignment that guest is on.
    expect(roster.deleteGuest(otherTrip.id, guest.id)).toBe(false);
    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(guest.id)).toBeDefined();
  });
});

// ── listMembers shaping ──────────────────────────────────────────────────────

describe('listMembers shaping', () => {
  it('MEMBERS-SVC-015: avatar_url follows the storage form and the inviter is named, not just its id', () => {
    const { user: owner } = createUser(testDb);
    const { user: uploaded } = createUser(testDb);
    const { user: sso } = createUser(testDb);
    const { user: bare } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    testDb.prepare('UPDATE users SET avatar = ?, display_name = ? WHERE id = ?').run('me.png', 'Owner Displayed', owner.id);
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('a.png', uploaded.id);
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('https://idp.example.test/p.jpg', sso.id);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)').run(trip.id, uploaded.id, owner.id);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)').run(trip.id, sso.id, owner.id);
    addTripMember(testDb, trip.id, bare.id);

    const { owner: ownerRow, members } = roster.listMembers(trip.id, owner.id);
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
