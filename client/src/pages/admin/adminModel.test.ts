// FE-ADMMODEL-001 to -005: the invite status both admin user views show; -010 to -012 the users list.
import { describe, expect, it } from 'vitest';

import { formatLastActive, inviteStatus, mergeSavedUser, type AdminUser } from './adminModel';

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

describe('formatLastActive', () => {
  it('FE-ADMMODEL-010: a dash for never, the year only once it is not this one', () => {
    expect(formatLastActive(null, 'en-GB', false, NOW)).toBe('—');
    const thisYear = formatLastActive('2026-03-04T10:30:00Z', 'en-GB', false, NOW);
    const lastYear = formatLastActive('2025-03-04T10:30:00Z', 'en-GB', false, NOW);
    expect(thisYear).not.toContain('2026');
    expect(lastYear).toContain('2025');
  });

  it('FE-ADMMODEL-011: follows the 12 and 24 hour setting', () => {
    expect(formatLastActive('2026-03-04T15:30:00Z', 'en-US', true, NOW)).toMatch(/PM/i);
    expect(formatLastActive('2026-03-04T15:30:00Z', 'en-US', false, NOW)).not.toMatch(/PM/i);
  });
});

describe('mergeSavedUser', () => {
  it('FE-ADMMODEL-012: takes the account fields from the reply and keeps the rest of the row', () => {
    const row: AdminUser = {
      id: 2,
      username: 'old',
      email: 'old@e.com',
      role: 'user',
      created_at: '2026-01-01T00:00:00Z',
      last_login: '2026-10-01T08:00:00Z',
      last_active: '2026-10-08T17:30:00Z',
      online: true,
      avatar_url: '/a.jpg',
    };
    expect(mergeSavedUser(row, { username: 'new', email: 'new@e.com', role: 'admin' })).toEqual({
      ...row,
      username: 'new',
      email: 'new@e.com',
      role: 'admin',
    });
  });
});
