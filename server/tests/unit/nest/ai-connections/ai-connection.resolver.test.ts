/**
 * pickConnection: which connection a user's assistant runs on under each
 * policy, and who pays. A connection the user signed out of counts as none;
 * one that needs a new sign-in is still picked, so the user sees why.
 */
import { pickConnection } from '../../../../src/nest/ai-connections/ai-connection.resolver';
import type { AiPolicy } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const own = { name: 'own', status: 'ok' };
const instance = { name: 'instance', status: 'ok' };

function pick(policy: AiPolicy, mine: typeof own | null, theirs: typeof instance | null) {
  const picked = pickConnection(policy, mine, theirs);
  return picked ? `${picked.connection.name}/${picked.paidBy}` : null;
}

describe('pickConnection', () => {
  it.each([
    // policy, own, instance, expected
    ['instance', own, instance, 'instance/instance'],
    ['instance', own, null, null],
    ['instance', null, instance, 'instance/instance'],
    ['instance', null, null, null],
    ['instance_or_user', own, instance, 'own/user'],
    ['instance_or_user', own, null, 'own/user'],
    ['instance_or_user', null, instance, 'instance/instance'],
    ['instance_or_user', null, null, null],
    ['user', own, instance, 'own/user'],
    ['user', own, null, 'own/user'],
    ['user', null, instance, null],
    ['user', null, null, null],
  ] as const)('AIRES-001: %s with own=%o and instance=%o picks %s', (policy, mine, theirs, expected) => {
    expect(pick(policy, mine, theirs)).toBe(expected);
  });

  it('AIRES-002: a signed-out own connection counts as none, so the instance takes over where allowed', () => {
    const signedOut = { name: 'own', status: 'signed_out' };
    expect(pick('instance_or_user', signedOut, instance)).toBe('instance/instance');
    expect(pick('user', signedOut, instance)).toBeNull();
  });

  it('AIRES-003: an own connection that needs a new sign-in is still the one picked', () => {
    const expired = { name: 'own', status: 'needs_reauth' };
    expect(pick('instance_or_user', expired, instance)).toBe('own/user');
    expect(pick('user', expired, null)).toBe('own/user');
  });

  it('AIRES-004: an instance connection is picked whatever its status; the turn reports it', () => {
    expect(pick('instance', null, { name: 'instance', status: 'error' })).toBe('instance/instance');
  });
});
