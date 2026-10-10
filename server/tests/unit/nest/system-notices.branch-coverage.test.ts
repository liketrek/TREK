/**
 * SystemNoticesService.getActiveFor — M3 branch ratchet (task-7-review.md).
 *
 * A separate, isolated file from `system-notices.service.test.ts` so these
 * fixtures (deliberately shaped to hit specific fallback/tie-break branches)
 * never leak into that file's shared `SYSTEM_NOTICES` mock and its exact
 * `.toEqual([...])` assertions. Covers:
 *   - `addonEnabled`/`settingFlag`'s `?? false` fallback for a key that
 *     never appears in ANY notice's own conditions (so the up-front flag
 *     map, built by scanning every notice's conditions, never populates it)
 *     — only reachable via a registered `case 'custom'` predicate that asks
 *     about a DIFFERENT key than any `addonEnabled`/`settingFlag` condition
 *     names.
 *   - a per-version-recurring notice's dismissal row with a NULL
 *     `dismissed_app_version` (an old dismissal from before the per-version
 *     feature existed).
 *   - the sort comparator's three tie-break levels (priority, severity,
 *     publishedAt), each of which needs at least two notices active in the
 *     SAME call for `.sort()` to ever invoke the comparator at all.
 */
import type { UserNoticeDismissalRow } from '../../../src/db/repositories/UserNoticeDismissals.repository';
import type { UserRow } from '../../../src/db/repositories/Users.repository';
import { SystemNoticesService } from '../../../src/nest/system-notices/system-notices.service';
import { registerPredicate } from '../../../src/systemNotices/conditions';
import { getCurrentAppVersion } from '../../../src/systemNotices/service';
import type { SystemNotice } from '../../../src/systemNotices/types';

import { describe, it, expect, vi } from 'vitest';

const {
  PRIORITY_HI,
  PRIORITY_LO,
  SEVERITY_HI,
  SEVERITY_LO,
  PUBLISHED_NEW,
  PUBLISHED_OLD,
  ADDON_FLAG_MISS,
  SETTING_FLAG_MISS,
  RELEASE,
} = vi.hoisted(() => {
  const base = {
    display: 'toast' as const,
    dismissible: true,
    conditions: [{ kind: 'always' as const }],
    publishedAt: '2020-01-01T00:00:00Z',
  };
  const priorityHi: SystemNotice = {
    ...base,
    id: 'sn-priority-hi',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    priority: 5,
  };
  // No `priority` field at all (not just 0) — exercises the `b.priority ??
  // 0` / `a.priority ?? 0` fallback itself, not just a priority of 0.
  const priorityLo: SystemNotice = { ...base, id: 'sn-priority-lo', severity: 'info', titleKey: 't', bodyKey: 'b' };
  const severityHi: SystemNotice = {
    ...base,
    id: 'sn-severity-hi',
    severity: 'critical',
    titleKey: 't',
    bodyKey: 'b',
    priority: 0,
  };
  const severityLo: SystemNotice = {
    ...base,
    id: 'sn-severity-lo',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    priority: 0,
  };
  const publishedNew: SystemNotice = {
    ...base,
    id: 'sn-published-new',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    priority: 0,
    publishedAt: '2024-06-01T00:00:00Z',
  };
  const publishedOld: SystemNotice = {
    ...base,
    id: 'sn-published-old',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    priority: 0,
    publishedAt: '2020-01-01T00:00:00Z',
  };
  const addonFlagMiss: SystemNotice = {
    id: 'sn-addon-flag-miss',
    display: 'toast',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    dismissible: true,
    conditions: [{ kind: 'custom', id: 'branch-cov-addon-probe' }],
    publishedAt: '2020-01-01T00:00:00Z',
    priority: 0,
  };
  const settingFlagMiss: SystemNotice = {
    id: 'sn-setting-flag-miss',
    display: 'toast',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    dismissible: true,
    conditions: [{ kind: 'custom', id: 'branch-cov-setting-probe' }],
    publishedAt: '2020-01-01T00:00:00Z',
    priority: 0,
  };
  const release: SystemNotice = {
    id: 'sn-release-nullver',
    display: 'modal',
    severity: 'info',
    titleKey: 'system_notice.release_notes.headline',
    bodyKey: 'system_notice.release_notes.intro',
    dismissible: true,
    conditions: [],
    recurring: 'per-version',
    publishedAt: '2020-01-01T00:00:00Z',
    priority: 0,
    release: { version: '4.3.0', headlineKey: 'system_notice.release_notes.headline' } as SystemNotice['release'],
  };
  return {
    PRIORITY_HI: priorityHi,
    PRIORITY_LO: priorityLo,
    SEVERITY_HI: severityHi,
    SEVERITY_LO: severityLo,
    PUBLISHED_NEW: publishedNew,
    PUBLISHED_OLD: publishedOld,
    ADDON_FLAG_MISS: addonFlagMiss,
    SETTING_FLAG_MISS: settingFlagMiss,
    RELEASE: release,
  };
});

vi.mock('../../../src/systemNotices/registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/systemNotices/registry')>();
  return {
    ...actual,
    SYSTEM_NOTICES: [
      PRIORITY_HI,
      PRIORITY_LO,
      SEVERITY_HI,
      SEVERITY_LO,
      PUBLISHED_NEW,
      PUBLISHED_OLD,
      ADDON_FLAG_MISS,
      SETTING_FLAG_MISS,
      RELEASE,
    ],
  };
});

// Neither key is asked about by any `addonEnabled`/`settingFlag` condition
// anywhere in the fixtures above, so the up-front flag map never populates
// them — the only way to reach them is a `case 'custom'` predicate calling
// `ctx.addonEnabled`/`ctx.settingFlag` with a key of its own choosing.
const addonProbe = vi.fn(
  (ctx: { addonEnabled: (id: string) => boolean }) => ctx.addonEnabled('addon-nobody-asks-about') === false,
);
const settingProbe = vi.fn(
  (ctx: { settingFlag: (key: string) => boolean }) => ctx.settingFlag('setting-nobody-asks-about') === false,
);
registerPredicate('branch-cov-addon-probe', addonProbe);
registerPredicate('branch-cov-setting-probe', settingProbe);

const BASE_USER = { id: 7, login_count: 5, first_seen_version: '3.0.0', role: 'user' } as UserRow;

function makeService(overrides: { listForUser?: UserNoticeDismissalRow[] } = {}) {
  const findById = vi.fn(async () => BASE_USER);
  const countForUser = vi.fn(async () => 0);
  const listForUser = vi.fn(async () => overrides.listForUser ?? []);
  const upsertDismissal = vi.fn(async () => undefined);
  const isAddonEnabled = vi.fn(async () => false);
  const getValue = vi.fn(async () => null);
  const isManaged = vi.fn(() => false);
  const svc = new SystemNoticesService(
    { isAddonEnabled } as never,
    { isManaged } as never,
    { findById } as never,
    { countForUser } as never,
    { listForUser, upsertDismissal } as never,
    { getValue } as never,
  );
  return { svc, isAddonEnabled };
}

describe('SystemNoticesService.getActiveFor — M3 branch coverage', () => {
  it('addonEnabled resolves false (not undefined/throw) for a key no condition ever names, never calling the injected AddonsService for it', async () => {
    const { svc, isAddonEnabled } = makeService();
    const ids = (await svc.getActiveFor(BASE_USER.id)).map((n) => n.id);
    expect(ids).toContain('sn-addon-flag-miss');
    expect(addonProbe).toHaveReturnedWith(true);
    expect(isAddonEnabled).not.toHaveBeenCalledWith('addon-nobody-asks-about');
  });

  it('settingFlag resolves false (not undefined/throw) for a key no condition ever names', async () => {
    const { svc } = makeService();
    const ids = (await svc.getActiveFor(BASE_USER.id)).map((n) => n.id);
    expect(ids).toContain('sn-setting-flag-miss');
    expect(settingProbe).toHaveReturnedWith(true);
  });

  it('a per-version notice dismissed by a row with a NULL dismissed_app_version (a pre-per-version dismissal) re-shows, same as an empty-string version', async () => {
    const { svc } = makeService({ listForUser: [{ notice_id: 'sn-release-nullver', dismissed_app_version: null }] });
    const ids = (await svc.getActiveFor(BASE_USER.id, new Set(['release']), getCurrentAppVersion())).map((n) => n.id);
    expect(ids).toContain('sn-release-nullver');
  });

  it('a per-version notice dismissed by a row whose dismissed_app_version semver cannot coerce falls back to 0.0.0, same as re-showing', async () => {
    const { svc } = makeService({
      listForUser: [{ notice_id: 'sn-release-nullver', dismissed_app_version: 'not-a-semver-string' }],
    });
    const ids = (await svc.getActiveFor(BASE_USER.id, new Set(['release']), getCurrentAppVersion())).map((n) => n.id);
    expect(ids).toContain('sn-release-nullver');
  });

  it('sorts by priority first: a higher-priority notice comes before a same-severity, same-date, lower-priority one', async () => {
    const { svc } = makeService();
    const order = (await svc.getActiveFor(BASE_USER.id))
      .map((n) => n.id)
      .filter((id) => id === 'sn-priority-hi' || id === 'sn-priority-lo');
    expect(order).toEqual(['sn-priority-hi', 'sn-priority-lo']);
  });

  it('falls through to severity when priority ties: a critical notice comes before a same-priority, same-date info one', async () => {
    const { svc } = makeService();
    const order = (await svc.getActiveFor(BASE_USER.id))
      .map((n) => n.id)
      .filter((id) => id === 'sn-severity-hi' || id === 'sn-severity-lo');
    expect(order).toEqual(['sn-severity-hi', 'sn-severity-lo']);
  });

  it('falls through to publishedAt when priority AND severity tie: the newer notice comes first', async () => {
    const { svc } = makeService();
    const order = (await svc.getActiveFor(BASE_USER.id))
      .map((n) => n.id)
      .filter((id) => id === 'sn-published-new' || id === 'sn-published-old');
    expect(order).toEqual(['sn-published-new', 'sn-published-old']);
  });

  // The running app version is only ever the real getCurrentAppVersion() in
  // every other test in this file, which semver.coerce always parses — this
  // is the one case that forces the '0.0.0' fallback used for the
  // dismissal-recency comparison.
  it('a running app version semver cannot coerce falls back to 0.0.0 instead of throwing', async () => {
    vi.resetModules();
    vi.doMock('../../../src/systemNotices/service', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../src/systemNotices/service')>();
      return { ...actual, getCurrentAppVersion: () => 'not-a-semver-string' };
    });
    try {
      const { SystemNoticesService: Reloaded } =
        await import('../../../src/nest/system-notices/system-notices.service');
      const inst = new Reloaded(
        { isAddonEnabled: async () => false } as never,
        { isManaged: () => false } as never,
        { findById: async () => BASE_USER } as never,
        { countForUser: async () => 0 } as never,
        { listForUser: async () => [{ notice_id: 'sn-release-nullver', dismissed_app_version: '1.0.0' }] } as never,
        { getValue: async () => null } as never,
      );
      await expect(inst.getActiveFor(BASE_USER.id)).resolves.toEqual(expect.any(Array));
    } finally {
      vi.doUnmock('../../../src/systemNotices/service');
    }
  });
});
