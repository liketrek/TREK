/**
 * PluginGuards holds the resource gates the decorated *.rpc.ts handlers will use from
 * the first rollout PR onward. Its messages are copied character-for-character from
 * the legacy router, because rpc-host.test.ts asserts them and shipped plugins read
 * them, so these tests pin the exact strings rather than just the refusal.
 */
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../../src/nest/plugins/host/rpc-errors';
import type { PluginRpcContext } from '../../../src/nest/plugins/host/rpc-kit/types';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The guards read `actingUserId` and nothing else off the context, so the two per-host
 * collaborators are inert here. `plugins` gets real no-op functions rather than a cast,
 * so a guard that ever reached for a peer would hit a callable, not undefined.
 */
const ctx = (actingUserId: number | undefined): PluginRpcContext => ({
  pluginId: 'p',
  actingUserId,
  data: {} as PluginRpcContext['data'],
  plugins: {
    call: vi.fn(async () => undefined),
    emit: vi.fn(),
  },
});

/**
 * Trip 1 belongs to user 42 and only user 42 may reach it, mirroring rpc-host.test.ts.
 *
 * `overrides.role` drives the stubbed `UsersRepository.getRole` (PG3/PG4, Plan 3j
 * Task 1) the same way it used to drive `db.prepare(...).get()`: omitted means a
 * normal row with role 'user'; explicitly `undefined` (or `null`) means "no row",
 * which `getRole`'s own `string | null` contract folds into a single `null` — the
 * `users` column is `NOT NULL DEFAULT 'user'`, so a present row can never actually
 * carry a null role, and `getRole` has no way to tell "row absent" from "row present,
 * role null" apart even if it could.
 */
function build(overrides: { role?: string | null; allow?: boolean; addonOn?: boolean } = {}) {
  const db = {
    findAccessible: vi.fn(async (tripId: number, userId: number) =>
      tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined,
    ),
  } as unknown as TripsRepository;
  const users = {
    getRole: vi.fn(async () => ('role' in overrides ? (overrides.role ?? null) : 'user')),
  } as unknown as UsersRepository;
  const permissions = {
    checkPermission: vi.fn(() => overrides.allow ?? true),
  } as unknown as PermissionsService;
  const addons = {
    isAddonEnabled: vi.fn(() => overrides.addonOn ?? true),
  } as unknown as AddonsService;
  return { guards: new PluginGuards(db, permissions, addons, users), db, users, permissions, addons };
}

describe('PluginGuards — tripRead', () => {
  it('PGUARD-001 runs the read for a member and hands it the acting user', async () => {
    const { guards } = build();
    const read = vi.fn((userId: number) => ({ seenBy: userId }));
    expect(await guards.tripRead({ tripId: 1 }, ctx(42), read)).toEqual({ seenBy: 42 });
    expect(read).toHaveBeenCalledWith(42);
  });

  it('PGUARD-002 a userless context is refused before the read runs', async () => {
    const { guards } = build();
    const read = vi.fn();
    await expect(guards.tripRead({ tripId: 1 }, ctx(undefined), read)).rejects.toThrow(
      new ForbiddenResource('trip reads require an authenticated user context'),
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('PGUARD-003 a non-member is refused, naming the trip', async () => {
    const { guards } = build();
    const read = vi.fn();
    await expect(guards.tripRead({ tripId: 2 }, ctx(42), read)).rejects.toThrow(
      new ForbiddenResource('no access to trip 2'),
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('PGUARD-004 a missing tripId is BAD_PARAMS, not a refusal', async () => {
    const { guards } = build();
    await expect(guards.tripRead({}, ctx(42), vi.fn())).rejects.toThrow(new BadParams('tripId must be a number'));
  });

  it('PGUARD-005 a numeric string tripId is accepted, as the wire contract allows', async () => {
    const { guards } = build();
    expect(await guards.tripRead({ tripId: '1' }, ctx(42), (u) => u)).toBe(42);
  });
});

describe('PluginGuards — requireActor', () => {
  it('PGUARD-006 returns the acting user', () => {
    expect(build().guards.requireActor(ctx(42), 'tag')).toBe(42);
  });

  it('PGUARD-007 appends the word "writes" to the noun, verbatim as the router did', () => {
    expect(() => build().guards.requireActor(ctx(undefined), 'tag')).toThrow(
      new ForbiddenResource('tag writes require an authenticated user context'),
    );
  });
});

describe('PluginGuards — requireTripEdit and canEditAs', () => {
  it('PGUARD-008 passes when the user may access and edit', async () => {
    const { guards, permissions } = build({ allow: true });
    await expect(guards.requireTripEdit(1, 42, 'trip_edit')).resolves.not.toThrow();
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_edit', 'user', 42, 42, false);
  });

  it('PGUARD-009 no access wins over no permission, and names the trip', async () => {
    const { guards } = build({ allow: false });
    await expect(guards.requireTripEdit(2, 42, 'trip_edit')).rejects.toThrow(
      new ForbiddenResource('no access to trip 2'),
    );
  });

  it('PGUARD-010 access without the edit permission is a different message', async () => {
    const { guards } = build({ allow: false });
    await expect(guards.requireTripEdit(1, 42, 'trip_edit')).rejects.toThrow(
      new ForbiddenResource('no permission to edit trip 1'),
    );
  });

  it('PGUARD-011 canEditAs returns false rather than throwing when there is no access', async () => {
    expect(await build().guards.canEditAs('trip_edit', 2, 42)).toBe(false);
  });

  it('PGUARD-012 canEditAs returns false when the user row is gone', async () => {
    expect(await build({ role: undefined }).guards.canEditAs('trip_edit', 1, 42)).toBe(false);
  });

  it('PGUARD-013 the repository role read actually drives the permission check — mutation proof: flipping the returned role flips the argument checkPermission sees', async () => {
    const { guards, permissions } = build({ role: 'admin' });
    await guards.canEditAs('trip_edit', 1, 42);
    // Seeded row is 'user' by default (see build()'s docstring); forcing the
    // double to return 'admin' and seeing THAT value reach checkPermission
    // proves canEditAs is reading through PluginGuards' own UsersRepository
    // call, not a cached or hard-coded role.
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_edit', 'admin', 42, 42, false);
  });

  it('PGUARD-014 a non-owner member is flagged as shared', async () => {
    const db = {
      findAccessible: vi.fn(async () => ({ id: 1, user_id: 7 })),
    } as unknown as TripsRepository;
    const users = { getRole: vi.fn(async () => 'user') } as unknown as UsersRepository;
    const permissions = { checkPermission: vi.fn(() => true) } as unknown as PermissionsService;
    const guards = new PluginGuards(db, permissions, {} as AddonsService, users);
    await guards.canEditAs('trip_edit', 1, 42);
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_edit', 'user', 7, 42, true);
  });
});

describe('PluginGuards — canCreateAs', () => {
  it('PGUARD-021 passes the looked-up role through with no trip-access check at all', async () => {
    const { guards, permissions } = build({ role: 'admin', allow: true });
    expect(await guards.canCreateAs('trip_create', 42)).toBe(true);
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_create', 'admin', null, 42, false);
  });

  it('PGUARD-022 a user id with no matching row never throws and falls back to role "user", unchanged from the legacy user?.role ?? "user" branch (no early refusal exists here, unlike canEditAs)', async () => {
    const { guards, permissions } = build({ role: undefined });
    await expect(guards.canCreateAs('trip_create', 999)).resolves.not.toThrow();
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_create', 'user', null, 999, false);
  });

  it('PGUARD-023 mutation proof: flipping the returned role flips the argument checkPermission sees', async () => {
    const { guards, permissions } = build({ role: 'admin' });
    await guards.canCreateAs('trip_create', 42);
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_create', 'admin', null, 42, false);
  });
});

/**
 * The role×action×ownership matrix the sql-inventory calls for (§3), run through the
 * REAL UsersRepository (a real MikroORM repository, default allowGlobalContext: true —
 * these are direct, unwrapped calls, same TRAP-list allowance test-orm.ts documents)
 * and the REAL PermissionsService (default in-memory permission levels, no stored
 * overrides), not the stubbed doubles `build()` uses above. This is what actually
 * proves PG3/PG4's conversion didn't change plugin-write authorization: a role that
 * should fail a check still fails it, a role that should pass still passes, and
 * physically changing the STORED row (not a test double) flips the result.
 */
describe('PluginGuards — canEditAs/canCreateAs against a real UsersRepository + PermissionsService', () => {
  let testDb: ReturnType<typeof createSnapshotTestDb>;
  let orm: TestOrm;
  let guards: PluginGuards;
  let memberId: number;
  const ownerId = 1;

  beforeEach(async () => {
    testDb = createSnapshotTestDb();
    orm = await createTestOrm(testDb);
    const permissions = new PermissionsService(orm.repo(AppSettings), new UnitOfWork(orm.em));
    const db = {
      findAccessible: vi.fn(async (tripId: number) => (tripId === 1 ? { id: 1, user_id: ownerId } : undefined)),
    } as unknown as TripsRepository;
    // The permissions cache is module-scoped (permissions-cache.ts), not
    // per-instance — invalidate before every case so a stored override from
    // another describe block in this same worker can't leak in.
    permissions.invalidatePermissionsCache();
    guards = new PluginGuards(db, permissions, {} as AddonsService, orm.repo(Users));
    createUser(testDb, { role: 'user' }); // id 1, the trip owner — unused by these cases directly
    memberId = createUser(testDb, { role: 'user' }).user.id; // id 2, a non-owner trip member
  });

  afterEach(async () => {
    await orm.close();
    testDb.close();
  });

  it('PGUARD-024 a member whose role lacks trip_delete (trip_owner-only by default) is refused', async () => {
    expect(await guards.canEditAs('trip_delete', 1, memberId)).toBe(false);
  });

  it('PGUARD-025 mutation proof: promoting that SAME member to admin in the real users table flips PGUARD-024 to pass', async () => {
    testDb.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', memberId);
    expect(await guards.canEditAs('trip_delete', 1, memberId)).toBe(true);
  });

  it('PGUARD-026 a non-member is refused regardless of role (trip access is checked first)', async () => {
    expect(await guards.canEditAs('trip_delete', 999, memberId)).toBe(false);
  });

  it('PGUARD-027 canCreateAs: a real user id with no matching row never throws, and trip_create\'s "everybody" default lets it through — the legacy fallback preserved, not a new refusal', async () => {
    const vanishedId = memberId + 1000;
    await expect(guards.canCreateAs('trip_create', vanishedId)).resolves.toBe(true);
  });
});

describe('PluginGuards — requireAddon', () => {
  it('PGUARD-015 an enabled addon passes', async () => {
    await expect(build({ addonOn: true }).guards.requireAddon('budget', 'costs')).resolves.not.toThrow();
  });

  it('PGUARD-016 a disabled addon is refused with the noun in the message', async () => {
    await expect(build({ addonOn: false }).guards.requireAddon('budget', 'costs')).rejects.toThrow(
      new ForbiddenResource('the costs addon is disabled'),
    );
  });
});

describe('PluginGuards — capStrings', () => {
  it('PGUARD-017 a field within the cap passes', () => {
    expect(() => build().guards.capStrings({ name: 'ok' }, { name: 200 })).not.toThrow();
  });

  it('PGUARD-018 an oversized field is BAD_PARAMS, naming field and cap', () => {
    expect(() => build().guards.capStrings({ name: 'x'.repeat(201) }, { name: 200 })).toThrow(
      new BadParams('name must be 200 characters or fewer'),
    );
  });

  it('PGUARD-019 a non-string value is left alone', () => {
    expect(() => build().guards.capStrings({ name: 12345 }, { name: 2 })).not.toThrow();
  });

  it('PGUARD-020 an absent field is left alone', () => {
    expect(() => build().guards.capStrings({}, { name: 1 })).not.toThrow();
  });
});
