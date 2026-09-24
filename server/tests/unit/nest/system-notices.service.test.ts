/**
 * SystemNoticesService — the DI wrapper over the plain systemNotices service.
 * What's under test is the threading added when conditions.ts lost its
 * addons.bridge import: getActiveFor must hand the evaluator a live
 * addonEnabled callback over the INJECTED AddonsService. The upstream plain
 * service is mocked; its own behavior is pinned in tests/unit/systemNotices/
 * and the integration suite.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetActive, mockDismiss, mockAppVersion } = vi.hoisted(() => ({ mockGetActive: vi.fn(), mockDismiss: vi.fn(), mockAppVersion: vi.fn(() => '4.3.0') }));
vi.mock('../../../src/systemNotices/service', () => ({
  getActiveNoticesFor: mockGetActive,
  dismissNotice: mockDismiss,
  getCurrentAppVersion: mockAppVersion,
}));

import { SystemNoticesService } from '../../../src/nest/system-notices/system-notices.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';

const isAddonEnabled = vi.fn((id: string) => id === 'journey');
const svc = new SystemNoticesService({ isAddonEnabled } as unknown as AddonsService, { isManaged: () => false } as unknown as RuntimeEnvService);

beforeEach(() => {
  mockGetActive.mockReset();
  mockDismiss.mockReset();
  isAddonEnabled.mockClear();
});

describe('SystemNoticesService', () => {
  it('getActiveFor threads a live addonEnabled check over the injected AddonsService', () => {
    mockGetActive.mockReturnValue([]);
    svc.getActiveFor(7);
    expect(mockGetActive).toHaveBeenCalledWith(7, expect.any(Function), false);
    const addonEnabled = mockGetActive.mock.calls[0][1] as (id: string) => boolean;
    expect(addonEnabled('journey')).toBe(true);
    expect(addonEnabled('vacay')).toBe(false);
    expect(isAddonEnabled).toHaveBeenLastCalledWith('vacay');
  });

  it('dismiss passes through to the upstream service', () => {
    mockDismiss.mockReturnValue(true);
    expect(svc.dismiss(7, 'welcome')).toBe(true);
    expect(mockDismiss).toHaveBeenCalledWith(7, 'welcome');
  });

  // After an update the service worker keeps serving the previous bundle for a while.
  // That bundle would draw a release notice as bare keys and let the reader dismiss it
  // for good, so the release layout is only delivered to a client that says it can
  // draw it. Everything without a release block goes out as before.
  describe('getActiveFor holds the release layout back from a client that does not announce it', () => {
    const generic = {
      id: 'outage', display: 'banner', severity: 'warn',
      titleKey: 'system_notice.outage.title', bodyKey: 'system_notice.outage.body', dismissible: true,
    };
    const release = {
      id: 'release-notes', display: 'modal', severity: 'info',
      titleKey: 'system_notice.release_notes.headline', bodyKey: 'system_notice.release_notes.intro',
      dismissible: true,
      release: { version: '4.3.0', headlineKey: 'system_notice.release_notes.headline' },
    };

    it('drops a notice with a release block when nothing is announced', () => {
      mockGetActive.mockReturnValue([release, generic]);
      expect(svc.getActiveFor(7).map(n => n.id)).toEqual(['outage']);
    });

    it('drops it when other layouts are announced but not release', () => {
      mockGetActive.mockReturnValue([release, generic]);
      expect(svc.getActiveFor(7, new Set(['banner'])).map(n => n.id)).toEqual(['outage']);
    });

    it('delivers it, in place, once the client announces the release layout for the running version', () => {
      mockGetActive.mockReturnValue([release, generic]);
      expect(svc.getActiveFor(7, new Set(['release']), '4.3.0').map(n => n.id)).toEqual(['release-notes', 'outage']);
    });

    it('drops it for a bundle that announces the layout but was built for another version', () => {
      // The shell the service worker serves right after an update: it can draw the
      // layout, but with the texts of the version it was built for, and its X would
      // use the notice up for the version now running.
      mockGetActive.mockReturnValue([release, generic]);
      expect(svc.getActiveFor(7, new Set(['release']), '4.2.1').map(n => n.id)).toEqual(['outage']);
      mockAppVersion.mockReturnValueOnce('4.3.1');
      expect(svc.getActiveFor(7, new Set(['release']), '4.3.0').map(n => n.id)).toEqual(['outage']);
    });

    it('drops it for a bundle that names no version at all', () => {
      mockGetActive.mockReturnValue([release, generic]);
      expect(svc.getActiveFor(7, new Set(['release'])).map(n => n.id)).toEqual(['outage']);
      expect(svc.getActiveFor(7, new Set(['release']), '').map(n => n.id)).toEqual(['outage']);
      expect(svc.getActiveFor(7, new Set(['release']), 'dev').map(n => n.id)).toEqual(['outage']);
    });

    it('reads the version loosely, as the server reads its own', () => {
      mockGetActive.mockReturnValue([release, generic]);
      expect(svc.getActiveFor(7, new Set(['release']), 'v4.3.0').map(n => n.id)).toEqual(['release-notes', 'outage']);
    });

    it('always delivers a notice without a release block', () => {
      mockGetActive.mockReturnValue([generic]);
      expect(svc.getActiveFor(7).map(n => n.id)).toEqual(['outage']);
      expect(svc.getActiveFor(7, new Set(['release']), '4.3.0').map(n => n.id)).toEqual(['outage']);
    });
  });

  it('still loads and works when the AddonsService binding is unresolved (import-cycle fallback)', async () => {
    // The emitted design:paramtypes metadata guards an unresolved class binding
    // with `typeof AddonsService === 'undefined' ? Object : AddonsService`.
    // Simulate that mid-cycle state: the module must still evaluate and the
    // instance must still thread the callback.
    vi.resetModules();
    vi.doMock('../../../src/nest/addons/addons.service', () => ({ AddonsService: undefined }));
    const { SystemNoticesService: Reloaded } = await import('../../../src/nest/system-notices/system-notices.service');
    const inst = new Reloaded({ isAddonEnabled } as unknown as AddonsService, { isManaged: () => false } as unknown as RuntimeEnvService);
    mockGetActive.mockReturnValue([]);
    inst.getActiveFor(1);
    expect(mockGetActive).toHaveBeenCalledWith(1, expect.any(Function), false);
    vi.doUnmock('../../../src/nest/addons/addons.service');
  });
});
