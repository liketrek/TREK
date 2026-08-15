/**
 * SystemNoticesService — the DI wrapper over the plain systemNotices service.
 * What's under test is the threading added when conditions.ts lost its
 * addons.bridge import: getActiveFor must hand the evaluator a live
 * addonEnabled callback over the INJECTED AddonsService. The upstream plain
 * service is mocked; its own behavior is pinned in tests/unit/systemNotices/
 * and the integration suite.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetActive, mockDismiss } = vi.hoisted(() => ({ mockGetActive: vi.fn(), mockDismiss: vi.fn() }));
vi.mock('../../../src/systemNotices/service', () => ({
  getActiveNoticesFor: mockGetActive,
  dismissNotice: mockDismiss,
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
