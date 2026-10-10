// FE-ADMMODEL-001 to -005: the invite status both admin user views show.
import { describe, expect, it } from 'vitest';

import { inviteStatus } from './adminModel';

const NOW = new Date('2026-10-09T12:00:00Z');

describe('inviteStatus', () => {
  it('FE-ADMMODEL-001: an unexpired invite with uses left is active', () => {
    expect(inviteStatus({ expires_at: '2026-10-10T00:00:00Z', max_uses: 3, used_count: 2 }, NOW)).toEqual({
      isExpired: false,
      isUsedUp: false,
      isActive: true,
      labelKey: 'admin.invite.active',
    });
  });

  it('FE-ADMMODEL-002: no expiry and unlimited uses (max_uses 0) stays active', () => {
    expect(inviteStatus({ expires_at: null, max_uses: 0, used_count: 99 }, NOW).isActive).toBe(true);
    expect(inviteStatus({ max_uses: 0, used_count: 0 }, NOW).labelKey).toBe('admin.invite.active');
    expect(inviteStatus({ expires_at: '', max_uses: 1, used_count: 0 }, NOW).isExpired).toBe(false);
  });

  it('FE-ADMMODEL-003: a past expiry is expired', () => {
    expect(inviteStatus({ expires_at: '2026-10-09T11:59:59Z', max_uses: 5, used_count: 0 }, NOW)).toEqual({
      isExpired: true,
      isUsedUp: false,
      isActive: false,
      labelKey: 'admin.invite.expired',
    });
  });

  it('FE-ADMMODEL-004: reaching max_uses is used up, and used up wins over expired in the label', () => {
    expect(inviteStatus({ expires_at: null, max_uses: 2, used_count: 2 }, NOW)).toEqual({
      isExpired: false,
      isUsedUp: true,
      isActive: false,
      labelKey: 'admin.invite.usedUp',
    });
    const both = inviteStatus({ expires_at: '2026-01-01T00:00:00Z', max_uses: 1, used_count: 1 }, NOW);
    expect(both.isExpired).toBe(true);
    expect(both.labelKey).toBe('admin.invite.usedUp');
  });

  it('FE-ADMMODEL-005: defaults to the current time', () => {
    expect(inviteStatus({ expires_at: '2000-01-01T00:00:00Z', max_uses: 0, used_count: 0 }).isExpired).toBe(true);
    expect(inviteStatus({ expires_at: '2999-01-01T00:00:00Z', max_uses: 0, used_count: 0 }).isActive).toBe(true);
  });
});
