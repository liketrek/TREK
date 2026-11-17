// FE-ADMIN-SVCMODEL-001 to FE-ADMIN-SVCMODEL-006
import type { ServiceIdentityStatus } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  allowanceNote,
  canRegenerateKey,
  identityHint,
  quotaLevel,
  quotaResetClock,
  quotaShare,
} from './serviceIdentityModel';

const t = (key: string) => key;
const quota = (used: number, limit: number) => ({
  used,
  limit,
  remaining: limit - used,
  resetAt: '2026-11-15T01:30:00',
});
const STATUS: ServiceIdentityStatus = {
  state: 'connected',
  tier: 'std',
  keySource: 'registered',
  services: [
    { service: 'places', inUse: true, quota: quota(10, 100) },
    { service: 'photon', inUse: false, quota: null },
  ],
  lastSeenAt: null,
} as ServiceIdentityStatus;

describe('serviceIdentityModel', () => {
  it('FE-ADMIN-SVCMODEL-001: a day is ok, low below a tenth left, out at nothing left', () => {
    expect(quotaLevel(quota(10, 100))).toBe('ok');
    expect(quotaLevel(quota(95, 100))).toBe('low');
    expect(quotaLevel(quota(100, 100))).toBe('out');
  });

  it('FE-ADMIN-SVCMODEL-002: the bar share is capped at the whole and full without a limit', () => {
    expect(quotaShare(quota(25, 100))).toBe(25);
    expect(quotaShare({ used: 150, limit: 100, remaining: 0, resetAt: '' })).toBe(100);
    expect(quotaShare({ used: 0, limit: 0, remaining: 0, resetAt: '' })).toBe(100);
  });

  it('FE-ADMIN-SVCMODEL-003: the reset reads from the first counted service, in the user format', () => {
    expect(quotaResetClock(STATUS, false)).toBe('01:30');
    expect(quotaResetClock(STATUS, true)).toMatch(/1:30/);
    expect(quotaResetClock(null, false)).toBeNull();
    expect(quotaResetClock({ ...STATUS, services: [] }, false)).toBeNull();
  });

  it('FE-ADMIN-SVCMODEL-004: a service out of use, or without a count, says so', () => {
    expect(allowanceNote(t, STATUS.services[1])).toBe('admin.trekApi.quota.notInUse');
    expect(allowanceNote(t, { service: 'places', inUse: true, quota: null })).toBe('admin.trekApi.quota.unavailable');
    expect(allowanceNote(t, STATUS.services[0])).toBeNull();
  });

  it('FE-ADMIN-SVCMODEL-005: the identity line is quiet when connected', () => {
    expect(identityHint(t, STATUS, false)).toBeNull();
    expect(identityHint(t, { ...STATUS, state: 'revoked' }, false)).toBe('admin.trekApi.quota.hint.revoked');
    expect(identityHint(t, null, true)).toBe('admin.trekApi.quota.unavailable');
    expect(identityHint(t, null, false)).toBeNull();
  });

  it('FE-ADMIN-SVCMODEL-006: a new key only where the admin holds the key', () => {
    expect(canRegenerateKey(STATUS, false)).toBe(true);
    expect(canRegenerateKey(STATUS, true)).toBe(false);
    expect(canRegenerateKey({ ...STATUS, keySource: 'env' }, false)).toBe(false);
    expect(canRegenerateKey({ ...STATUS, state: 'off' }, false)).toBe(false);
    expect(canRegenerateKey(null, false)).toBe(false);
  });
});
