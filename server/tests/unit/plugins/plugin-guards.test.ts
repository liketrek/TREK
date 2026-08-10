/**
 * PluginGuards holds the resource gates the decorated *.rpc.ts handlers will use from
 * the first rollout PR onward. Its messages are copied character-for-character from
 * the legacy router, because rpc-host.test.ts asserts them and shipped plugins read
 * them, so these tests pin the exact strings rather than just the refusal.
 */
import { describe, it, expect, vi } from 'vitest';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../../src/nest/plugins/host/rpc-errors';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { PluginRpcContext } from '../../../src/nest/plugins/host/rpc-kit/types';

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

/** Trip 1 belongs to user 42 and only user 42 may reach it, mirroring rpc-host.test.ts. */
function build(overrides: { role?: string | undefined; allow?: boolean; addonOn?: boolean } = {}) {
  const db = {
    canAccessTrip: vi.fn((tripId: number, userId: number) =>
      tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined,
    ),
    prepare: vi.fn(() => ({
      get: () => ('role' in overrides ? (overrides.role === undefined ? undefined : { role: overrides.role }) : { role: 'user' }),
    })),
  } as unknown as DatabaseService;
  const permissions = {
    checkPermission: vi.fn(() => overrides.allow ?? true),
  } as unknown as PermissionsService;
  const addons = {
    isAddonEnabled: vi.fn(() => overrides.addonOn ?? true),
  } as unknown as AddonsService;
  return { guards: new PluginGuards(db, permissions, addons), db, permissions, addons };
}

describe('PluginGuards — tripRead', () => {
  it('PGUARD-001 runs the read for a member and hands it the acting user', () => {
    const { guards } = build();
    const read = vi.fn((userId: number) => ({ seenBy: userId }));
    expect(guards.tripRead({ tripId: 1 }, ctx(42), read)).toEqual({ seenBy: 42 });
    expect(read).toHaveBeenCalledWith(42);
  });

  it('PGUARD-002 a userless context is refused before the read runs', () => {
    const { guards } = build();
    const read = vi.fn();
    expect(() => guards.tripRead({ tripId: 1 }, ctx(undefined), read)).toThrow(
      new ForbiddenResource('trip reads require an authenticated user context'),
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('PGUARD-003 a non-member is refused, naming the trip', () => {
    const { guards } = build();
    const read = vi.fn();
    expect(() => guards.tripRead({ tripId: 2 }, ctx(42), read)).toThrow(
      new ForbiddenResource('no access to trip 2'),
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('PGUARD-004 a missing tripId is BAD_PARAMS, not a refusal', () => {
    const { guards } = build();
    expect(() => guards.tripRead({}, ctx(42), vi.fn())).toThrow(new BadParams('tripId must be a number'));
  });

  it('PGUARD-005 a numeric string tripId is accepted, as the wire contract allows', () => {
    const { guards } = build();
    expect(guards.tripRead({ tripId: '1' }, ctx(42), (u) => u)).toBe(42);
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
  it('PGUARD-008 passes when the user may access and edit', () => {
    const { guards, permissions } = build({ allow: true });
    expect(() => guards.requireTripEdit(1, 42, 'trip_edit')).not.toThrow();
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_edit', 'user', 42, 42, false);
  });

  it('PGUARD-009 no access wins over no permission, and names the trip', () => {
    const { guards } = build({ allow: false });
    expect(() => guards.requireTripEdit(2, 42, 'trip_edit')).toThrow(
      new ForbiddenResource('no access to trip 2'),
    );
  });

  it('PGUARD-010 access without the edit permission is a different message', () => {
    const { guards } = build({ allow: false });
    expect(() => guards.requireTripEdit(1, 42, 'trip_edit')).toThrow(
      new ForbiddenResource('no permission to edit trip 1'),
    );
  });

  it('PGUARD-011 canEditAs returns false rather than throwing when there is no access', () => {
    expect(build().guards.canEditAs('trip_edit', 2, 42)).toBe(false);
  });

  it('PGUARD-012 canEditAs returns false when the user row is gone', () => {
    expect(build({ role: undefined }).guards.canEditAs('trip_edit', 1, 42)).toBe(false);
  });

  it('PGUARD-013 a missing role column falls back to "user"', () => {
    const { guards, permissions } = build({ role: null as unknown as string });
    guards.canEditAs('trip_edit', 1, 42);
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_edit', 'user', 42, 42, false);
  });

  it('PGUARD-014 a non-owner member is flagged as shared', () => {
    const db = {
      canAccessTrip: vi.fn(() => ({ id: 1, user_id: 7 })),
      prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
    } as unknown as DatabaseService;
    const permissions = { checkPermission: vi.fn(() => true) } as unknown as PermissionsService;
    const guards = new PluginGuards(db, permissions, {} as AddonsService);
    guards.canEditAs('trip_edit', 1, 42);
    expect(permissions.checkPermission).toHaveBeenCalledWith('trip_edit', 'user', 7, 42, true);
  });
});

describe('PluginGuards — requireAddon', () => {
  it('PGUARD-015 an enabled addon passes', () => {
    expect(() => build({ addonOn: true }).guards.requireAddon('budget', 'costs')).not.toThrow();
  });

  it('PGUARD-016 a disabled addon is refused with the noun in the message', () => {
    expect(() => build({ addonOn: false }).guards.requireAddon('budget', 'costs')).toThrow(
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
