/**
 * SystemNoticesService — Plan 3f Task 6 (systemNotices → Nest provider).
 * Absorbed `getActiveNoticesFor`/`dismissNotice` from `../../../src/systemNotices/service.ts`;
 * the pure evaluation logic they call through (`evaluate`/`isNoticeVersionActive`/
 * `severityWeight`, `conditions.ts`) is unchanged and stays proven in
 * `tests/unit/systemNotices/*.test.ts`. `tests/integration/systemNotices.test.ts`
 * is the full-fidelity, unmocked proof (real HTTP → real DI service → real
 * repositories → real seeded rows), unaffected by this task and left as-is.
 *
 * This file is a pure-DI unit suite: it proves the WIRING added/changed by
 * this task — the four injected repositories feed `getActiveNoticesFor`'s SN2-4
 * reads, `addonEnabled` and the new `settingFlag` map are each resolved once
 * per call the same way, `getActiveFor`'s release-layout gating still holds,
 * and `dismiss` still upserts through the composite-PK repository method with
 * `Date.now()`/`getCurrentAppVersion()` — using a small, controlled registry
 * (mocked at the `registry.ts` module boundary, real evaluation logic
 * underneath) rather than a real SQLite DB, since none of what changed here
 * is SQL shape (that is `UserNoticeDismissals.repository.test.ts`'s job).
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type {
  UserNoticeDismissalsRepository,
  UserNoticeDismissalRow,
} from '../../../src/db/repositories/UserNoticeDismissals.repository';
import type { UsersRepository, UserRow } from '../../../src/db/repositories/Users.repository';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { SystemNoticesService } from '../../../src/nest/system-notices/system-notices.service';
import { getCurrentAppVersion } from '../../../src/systemNotices/service';
import type { SystemNotice } from '../../../src/systemNotices/types';

import { describe, it, expect, vi } from 'vitest';

// `vi.mock` factories are hoisted above every other statement in the file
// (including top-level `const`s declared earlier in source order), so the
// fixtures the factory below closes over have to go through `vi.hoisted`.
const { GENERIC_NOTICE, RELEASE_NOTICE, ADDON_NOTICE, CUSTOM_NOTICE } = vi.hoisted(() => {
  const generic: SystemNotice = {
    id: 'sn-test-generic',
    display: 'banner',
    severity: 'warn',
    titleKey: 'system_notice.outage.title',
    bodyKey: 'system_notice.outage.body',
    dismissible: true,
    conditions: [],
    publishedAt: '2020-01-01T00:00:00Z',
    priority: 0,
  };
  const release: SystemNotice = {
    id: 'sn-test-release',
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
  const addon: SystemNotice = {
    id: 'sn-test-addon',
    display: 'toast',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    dismissible: true,
    conditions: [{ kind: 'addonEnabled', addonId: 'journey' }],
    publishedAt: '2020-01-01T00:00:00Z',
    priority: 0,
  };
  const custom: SystemNotice = {
    id: 'sn-test-custom',
    display: 'toast',
    severity: 'info',
    titleKey: 't',
    bodyKey: 'b',
    dismissible: true,
    conditions: [{ kind: 'custom', id: 'whitespace-collision-detected' }],
    publishedAt: '2020-01-01T00:00:00Z',
    priority: 0,
  };
  return { GENERIC_NOTICE: generic, RELEASE_NOTICE: release, ADDON_NOTICE: addon, CUSTOM_NOTICE: custom };
});

// A small, controlled registry — real evaluation logic (`evaluate`/`conditions.ts`,
// untouched by this task) runs against it, so `registerPredicate`'s module-load
// side effect (`registry.ts`'s real top-level call) still fires via `importOriginal`.
vi.mock('../../../src/systemNotices/registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/systemNotices/registry')>();
  return { ...actual, SYSTEM_NOTICES: [RELEASE_NOTICE, GENERIC_NOTICE, ADDON_NOTICE, CUSTOM_NOTICE] };
});

const BASE_USER = { id: 7, login_count: 5, first_seen_version: '3.0.0', role: 'user' } as UserRow;

interface StubOverrides {
  findById?: UserRow | null;
  countForUser?: number;
  listForUser?: UserNoticeDismissalRow[];
  isAddonEnabled?: (id: string) => boolean;
  getValue?: string | null;
  isManaged?: boolean;
}

function makeService(overrides: StubOverrides = {}) {
  const findById = vi.fn(async () => (overrides.findById === undefined ? BASE_USER : overrides.findById));
  const countForUser = vi.fn(async () => overrides.countForUser ?? 0);
  const listForUser = vi.fn(async () => overrides.listForUser ?? []);
  const upsertDismissal = vi.fn(
    async (_userId: number, _noticeId: string, _dismissedAt: number, _dismissedAppVersion: string) => undefined,
  );
  const isAddonEnabled = vi.fn(async (id: string) => (overrides.isAddonEnabled ? overrides.isAddonEnabled(id) : false));
  const getValue = vi.fn(async () => (overrides.getValue === undefined ? null : overrides.getValue));
  const isManaged = vi.fn(() => overrides.isManaged ?? false);

  const addons = { isAddonEnabled } as unknown as AddonsService;
  const env = { isManaged } as unknown as RuntimeEnvService;
  const users = { findById } as unknown as UsersRepository;
  const trips = { countForUser } as unknown as TripsRepository;
  const dismissals = { listForUser, upsertDismissal } as unknown as UserNoticeDismissalsRepository;
  const appSettings = { getValue } as unknown as AppSettingsRepository;

  const svc = new SystemNoticesService(addons, env, users, trips, dismissals, appSettings);
  return { svc, findById, countForUser, listForUser, upsertDismissal, isAddonEnabled, getValue, isManaged };
}

describe('SystemNoticesService (Plan 3f Task 6)', () => {
  describe('getActiveFor — SN2/SN3/SN4 wiring', () => {
    it('SN2 — returns [] immediately when the user is absent, without reading trips/dismissals/settings', async () => {
      const { svc, countForUser, listForUser, getValue } = makeService({ findById: null });
      expect(await svc.getActiveFor(999)).toEqual([]);
      expect(countForUser).not.toHaveBeenCalled();
      expect(listForUser).not.toHaveBeenCalled();
      expect(getValue).not.toHaveBeenCalled();
    });

    it('SN3 — threads noTrips off the injected TripsRepository.countForUser', async () => {
      const { svc, countForUser } = makeService({ countForUser: 0 });
      await svc.getActiveFor(BASE_USER.id);
      expect(countForUser).toHaveBeenCalledWith(BASE_USER.id);
    });

    it('SN4 — a per-version-recurring notice re-shows once the running app version passes the dismissed one, and stays hidden while it has not', async () => {
      const olderDismissal = makeService({
        listForUser: [{ notice_id: 'sn-test-release', dismissed_app_version: '0.0.1' }],
      });
      expect(
        (await olderDismissal.svc.getActiveFor(BASE_USER.id, new Set(['release']), getCurrentAppVersion())).map(
          (n) => n.id,
        ),
      ).toContain('sn-test-release');

      const currentDismissal = makeService({
        listForUser: [{ notice_id: 'sn-test-release', dismissed_app_version: getCurrentAppVersion() }],
      });
      expect(
        (await currentDismissal.svc.getActiveFor(BASE_USER.id, new Set(['release']), getCurrentAppVersion())).map(
          (n) => n.id,
        ),
      ).not.toContain('sn-test-release');
    });

    it('a permanently-dismissed (non-recurring) notice never returns', async () => {
      const { svc } = makeService({ listForUser: [{ notice_id: 'sn-test-generic', dismissed_app_version: null }] });
      expect((await svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).not.toContain('sn-test-generic');
    });
  });

  describe('getActiveFor — addonEnabled threading (over the injected AddonsService)', () => {
    it('resolves the addon flag once per call and gates the notice on it', async () => {
      const on = makeService({ isAddonEnabled: (id) => id === 'journey' });
      expect((await on.svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).toContain('sn-test-addon');
      expect(on.isAddonEnabled).toHaveBeenCalledWith('journey');

      const off = makeService({ isAddonEnabled: () => false });
      expect((await off.svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).not.toContain('sn-test-addon');
    });
  });

  describe('getActiveFor — settingFlag threading (SN1, the ConditionContext addition)', () => {
    it("resolves 'whitespace_migration_collision' off the injected AppSettingsRepository and gates the custom-predicate notice on it, both directions", async () => {
      const flagged = makeService({ getValue: 'true' });
      expect((await flagged.svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).toContain('sn-test-custom');
      expect(flagged.getValue).toHaveBeenCalledWith('whitespace_migration_collision');

      const clear = makeService({ getValue: 'false' });
      expect((await clear.svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).not.toContain('sn-test-custom');

      const absent = makeService({ getValue: null });
      expect((await absent.svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).not.toContain('sn-test-custom');
    });
  });

  // After an update the service worker keeps serving the previous bundle for a while.
  // That bundle would draw a release notice as bare keys and let the reader dismiss it
  // for good, so the release layout is only delivered to a client that says it can
  // draw it. Everything without a release block goes out as before.
  describe('getActiveFor holds the release layout back from a client that does not announce it', () => {
    it('drops a notice with a release block when nothing is announced', async () => {
      const { svc } = makeService();
      expect((await svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).toEqual(['sn-test-generic']);
    });

    it('drops it when other layouts are announced but not release', async () => {
      const { svc } = makeService();
      expect((await svc.getActiveFor(BASE_USER.id, new Set(['banner']))).map((n) => n.id)).toEqual(['sn-test-generic']);
    });

    it('delivers it, in place, once the client announces the release layout for the running version', async () => {
      const { svc } = makeService();
      const ids = (await svc.getActiveFor(BASE_USER.id, new Set(['release']), getCurrentAppVersion())).map((n) => n.id);
      expect(ids).toContain('sn-test-release');
      expect(ids).toContain('sn-test-generic');
    });

    it('drops it for a bundle that announces the layout but was built for another version', async () => {
      const { svc } = makeService();
      expect((await svc.getActiveFor(BASE_USER.id, new Set(['release']), '0.0.1')).map((n) => n.id)).toEqual([
        'sn-test-generic',
      ]);
    });

    it('drops it for a bundle that names no version at all', async () => {
      const { svc } = makeService();
      expect((await svc.getActiveFor(BASE_USER.id, new Set(['release']))).map((n) => n.id)).toEqual([
        'sn-test-generic',
      ]);
      expect((await svc.getActiveFor(BASE_USER.id, new Set(['release']), '')).map((n) => n.id)).toEqual([
        'sn-test-generic',
      ]);
      expect((await svc.getActiveFor(BASE_USER.id, new Set(['release']), 'dev')).map((n) => n.id)).toEqual([
        'sn-test-generic',
      ]);
    });

    // L3 (task-7-review.md): dropped by Task 6, restored — the running app
    // version is read loosely (`semver.coerce`-shaped, tolerating a leading
    // `v`), same as the server reads its own.
    it('reads the version loosely, as the server reads its own', async () => {
      const { svc } = makeService();
      const ids = (await svc.getActiveFor(BASE_USER.id, new Set(['release']), 'v' + getCurrentAppVersion())).map(
        (n) => n.id,
      );
      expect(ids).toContain('sn-test-release');
      expect(ids).toContain('sn-test-generic');
    });

    it('always delivers a notice without a release block', async () => {
      const { svc } = makeService();
      expect((await svc.getActiveFor(BASE_USER.id)).map((n) => n.id)).toEqual(['sn-test-generic']);
      expect(
        (await svc.getActiveFor(BASE_USER.id, new Set(['release']), getCurrentAppVersion())).map((n) => n.id),
      ).toContain('sn-test-generic');
    });
  });

  // L3 (task-7-review.md): dropped by Task 6, restored. The emitted
  // design:paramtypes metadata guards an unresolved class binding with
  // `typeof AddonsService === 'undefined' ? Object : AddonsService`.
  // Simulate that mid-cycle state: the module must still evaluate and the
  // instance must still serve notices.
  it('still loads and works when the AddonsService binding is unresolved (import-cycle fallback)', async () => {
    vi.resetModules();
    vi.doMock('../../../src/nest/addons/addons.service', () => ({ AddonsService: undefined }));
    const { SystemNoticesService: Reloaded } = await import('../../../src/nest/system-notices/system-notices.service');
    const isAddonEnabled = vi.fn(async () => false);
    const inst = new Reloaded(
      { isAddonEnabled } as never,
      { isManaged: () => false } as never,
      { findById: async () => BASE_USER } as never,
      { countForUser: async () => 1 } as never,
      { listForUser: async () => [] } as never,
      { getValue: async () => null } as never,
    );
    const out = await inst.getActiveFor(BASE_USER.id);
    expect(out.map((n) => n.id)).toEqual(['sn-test-generic']);
    vi.doUnmock('../../../src/nest/addons/addons.service');
  });

  describe('dismiss', () => {
    it('SN5 — upserts through the composite-PK repository with Date.now()/getCurrentAppVersion(), and returns true', async () => {
      const { svc, upsertDismissal } = makeService();
      const before = Date.now();
      expect(await svc.dismiss(BASE_USER.id, 'sn-test-generic')).toBe(true);
      expect(upsertDismissal).toHaveBeenCalledTimes(1);
      const [userId, noticeId, dismissedAt, appVersion] = upsertDismissal.mock.calls[0];
      expect(userId).toBe(BASE_USER.id);
      expect(noticeId).toBe('sn-test-generic');
      expect(dismissedAt).toBeGreaterThanOrEqual(before);
      expect(dismissedAt).toBeLessThanOrEqual(Date.now());
      expect(appVersion).toBe(getCurrentAppVersion());
    });

    it('returns false for an unknown notice id, without touching the repository', async () => {
      const { svc, upsertDismissal } = makeService();
      expect(await svc.dismiss(BASE_USER.id, 'does-not-exist')).toBe(false);
      expect(upsertDismissal).not.toHaveBeenCalled();
    });
  });
});
