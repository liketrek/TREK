import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/systemNotices/conditions.js';
import type { NoticeCondition, SystemNotice } from '../../../src/systemNotices/types.js';

const baseNotice: SystemNotice = {
  id: 'test',
  display: 'modal',
  severity: 'info',
  titleKey: 'k.title',
  bodyKey: 'k.body',
  dismissible: true,
  conditions: [],
  publishedAt: '2026-01-01T00:00:00Z',
};

// Conditions have to be contextually typed as NoticeCondition, otherwise a literal like
// `roles: ['user']` widens to string[] and no longer matches the union's
// Array<'admin' | 'user'>. Going through this helper types every case at once.
const noticeWith = (...conditions: NoticeCondition[]): SystemNotice => ({ ...baseNotice, conditions });

const baseCtx = {
  // noTrips joined the context when the 'noTrips' condition kind landed. 1 keeps
  // every case below reading as it did: the condition is `noTrips === 0`, so a
  // user WITH trips leaves it false and the other kinds decide on their own.
  user: { login_count: 5, first_seen_version: '1.0.0', role: 'user', noTrips: 1 },
  currentAppVersion: '2.0.0',
  now: new Date('2026-06-01T00:00:00Z'),
  // Threaded in by the caller since the addons.bridge import left this module;
  // false keeps every case below reading as it did.
  addonEnabled: () => false,
  // The ordinary install, so every case below is unaffected by the flag; the
  // managed condition itself is exercised in its own describe block at the end.
  managed: false,
};

describe('firstLogin', () => {
  const notice = noticeWith({ kind: 'firstLogin' });
  it('passes when login_count <= 1', () => {
    expect(evaluate(notice, { ...baseCtx, user: { ...baseCtx.user, login_count: 1 } })).toBe(true);
  });
  it('fails when login_count > 1', () => {
    expect(evaluate(notice, baseCtx)).toBe(false);
  });
});

describe('existingUserBeforeVersion', () => {
  const notice = noticeWith({ kind: 'existingUserBeforeVersion', version: '2.0.0' });
  it('passes for user with first_seen_version < notice version when current >= notice version', () => {
    expect(evaluate(notice, baseCtx)).toBe(true);
  });
  it('fails for new user (first_seen_version >= notice version)', () => {
    expect(evaluate(notice, { ...baseCtx, user: { ...baseCtx.user, first_seen_version: '2.0.0' } })).toBe(false);
  });
  it('fails when current app version < notice version', () => {
    expect(evaluate(notice, { ...baseCtx, currentAppVersion: '1.5.0' })).toBe(false);
  });
  it('passes when current app version is a prerelease of the notice version', () => {
    expect(evaluate(notice, { ...baseCtx, currentAppVersion: '2.0.0-pre.42' })).toBe(true);
  });
  it('passes when current app version is a prerelease beyond the notice version', () => {
    expect(evaluate(notice, { ...baseCtx, currentAppVersion: '2.1.0-pre.1' })).toBe(true);
  });
});

describe('dateWindow', () => {
  it('passes when now is inside window', () => {
    const notice = noticeWith({ kind: 'dateWindow', startsAt: '2026-05-01T00:00:00Z', endsAt: '2026-07-01T00:00:00Z' });
    expect(evaluate(notice, baseCtx)).toBe(true);
  });
  it('fails when now is before start', () => {
    const notice = noticeWith({ kind: 'dateWindow', startsAt: '2026-07-01T00:00:00Z' });
    expect(evaluate(notice, baseCtx)).toBe(false);
  });
  it('passes when no endsAt', () => {
    const notice = noticeWith({ kind: 'dateWindow', startsAt: '2026-01-01T00:00:00Z' });
    expect(evaluate(notice, baseCtx)).toBe(true);
  });
});

describe('role', () => {
  it('passes for matching role', () => {
    const notice = noticeWith({ kind: 'role', roles: ['user'] });
    expect(evaluate(notice, baseCtx)).toBe(true);
  });
  it('fails for non-matching role', () => {
    const notice = noticeWith({ kind: 'role', roles: ['admin'] });
    expect(evaluate(notice, baseCtx)).toBe(false);
  });
});

describe('AND logic', () => {
  it('requires all conditions to pass', () => {
    const notice = noticeWith(
      { kind: 'firstLogin' },
      { kind: 'role', roles: ['user'] },
    );
    // login_count=1 passes firstLogin, role=user passes role → true
    expect(evaluate(notice, { ...baseCtx, user: { ...baseCtx.user, login_count: 1 } })).toBe(true);
    // login_count=2 fails firstLogin → false
    expect(evaluate(notice, baseCtx)).toBe(false);
  });
});

describe('empty conditions', () => {
  it('always passes when conditions array is empty', () => {
    expect(evaluate(baseNotice, baseCtx)).toBe(true);
  });
});

describe('addonEnabled', () => {
  it('asks the threaded-in check with the condition addon id', () => {
    const notice = noticeWith({ kind: 'addonEnabled', addonId: 'journey' });
    expect(evaluate(notice, { ...baseCtx, addonEnabled: (id) => id === 'journey' })).toBe(true);
    expect(evaluate(notice, { ...baseCtx, addonEnabled: (id) => id === 'vacay' })).toBe(false);
    expect(evaluate(notice, baseCtx)).toBe(false);
  });
});

describe('managed', () => {
  it('matches on the value asked for, in both directions', () => {
    // Both directions on purpose: the registry uses `is: false` to keep a notice
    // away from a centrally administered install, and a notice that only ever
    // shows there would use `is: true`.
    const wantsSelfRun = noticeWith({ kind: 'managed', is: false });
    const wantsManaged = noticeWith({ kind: 'managed', is: true });

    expect(evaluate(wantsSelfRun, { ...baseCtx, managed: false })).toBe(true);
    expect(evaluate(wantsSelfRun, { ...baseCtx, managed: true })).toBe(false);
    expect(evaluate(wantsManaged, { ...baseCtx, managed: true })).toBe(true);
    expect(evaluate(wantsManaged, { ...baseCtx, managed: false })).toBe(false);
  });
});
