import {
  PERMISSION_ACTIONS,
  PERMISSION_LEVELS,
  evaluatePermission,
  isPermissionKey,
  type PermissionLevel,
  type PermissionSubject,
} from './permissions';

import { describe, expect, it } from 'vitest';

const stranger: PermissionSubject = { isAdmin: false, isOwner: false, isMember: false };
const member: PermissionSubject = { isAdmin: false, isOwner: false, isMember: true };
const owner: PermissionSubject = { isAdmin: false, isOwner: true, isMember: false };
const admin: PermissionSubject = { isAdmin: true, isOwner: false, isMember: false };

describe('PERMISSION_ACTIONS', () => {
  it('lists every key once', () => {
    const keys = PERMISSION_ACTIONS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('allows the default level of every action', () => {
    for (const action of PERMISSION_ACTIONS) {
      expect(action.allowedLevels as readonly PermissionLevel[]).toContain(action.defaultLevel);
    }
  });

  it('only uses known levels', () => {
    for (const action of PERMISSION_ACTIONS) {
      for (const level of action.allowedLevels) expect(PERMISSION_LEVELS).toContain(level);
    }
  });
});

describe('isPermissionKey', () => {
  it('knows the catalog and nothing else', () => {
    expect(isPermissionKey('day_edit')).toBe(true);
    expect(isPermissionKey('share_manage')).toBe(true);
    expect(isPermissionKey('nonexistent_action')).toBe(false);
    expect(isPermissionKey('')).toBe(false);
  });
});

describe('evaluatePermission', () => {
  it.each([
    ['admin', [false, false, false, true]],
    ['trip_owner', [false, false, true, true]],
    ['trip_member', [false, true, true, true]],
    ['everybody', [true, true, true, true]],
  ] as const)('%s: stranger, member, owner, admin', (level, expected) => {
    expect([stranger, member, owner, admin].map((s) => evaluatePermission(level, s))).toEqual(expected);
  });

  it('refuses a level it does not know, unless the caller is an admin', () => {
    const bogus = 'root' as unknown as PermissionLevel;
    expect(evaluatePermission(bogus, owner)).toBe(false);
    expect(evaluatePermission(bogus, admin)).toBe(true);
  });
});
