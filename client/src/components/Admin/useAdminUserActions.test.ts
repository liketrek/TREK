import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminUserActions } from './useAdminUserActions';

// FE-HOOK-ADMUSERACT-001 to FE-HOOK-ADMUSERACT-005

const api = vi.hoisted(() => ({ rotateJwtSecret: vi.fn(), resetUserPasskeys: vi.fn() }));
vi.mock('../../api/client', () => ({ adminApi: api }));

const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key);

function host() {
  return {
    toast: { success: vi.fn(), error: vi.fn() },
    setRotatingJwt: vi.fn(),
    setShowRotateJwtModal: vi.fn(),
    logout: vi.fn(),
    navigate: vi.fn(),
  };
}

function mount(admin = host()) {
  return { admin, actions: renderHook(() => useAdminUserActions(admin, t)).result.current };
}

beforeEach(() => {
  api.rotateJwtSecret.mockReset().mockResolvedValue({});
  api.resetUserPasskeys.mockReset().mockResolvedValue({ deleted: 2 });
});

describe('useAdminUserActions', () => {
  it('FE-HOOK-ADMUSERACT-001: rotating the secret closes the dialog, logs out and goes to the login page', async () => {
    const { admin, actions } = mount();
    await act(() => actions.rotateJwt());
    expect(admin.setRotatingJwt).toHaveBeenCalledWith(true);
    expect(admin.setShowRotateJwtModal).toHaveBeenCalledWith(false);
    expect(admin.logout).toHaveBeenCalledTimes(1);
    expect(admin.navigate).toHaveBeenCalledWith('/login', { state: { noRedirect: true } });
    expect(admin.logout.mock.invocationCallOrder[0]).toBeLessThan(admin.navigate.mock.invocationCallOrder[0]);
  });

  it('FE-HOOK-ADMUSERACT-002: a failed rotation toasts, stays signed in and clears the busy state', async () => {
    api.rotateJwtSecret.mockRejectedValue(new Error('x'));
    const { admin, actions } = mount();
    await act(() => actions.rotateJwt());
    expect(admin.toast.error).toHaveBeenCalledWith('common.error');
    expect(admin.setRotatingJwt.mock.calls).toEqual([[true], [false]]);
    expect(admin.logout).not.toHaveBeenCalled();
    expect(admin.setShowRotateJwtModal).not.toHaveBeenCalled();
  });

  it('FE-HOOK-ADMUSERACT-003: a passkey reset toasts the count and reports success', async () => {
    const { admin, actions } = mount();
    let ok: boolean | undefined;
    await act(async () => {
      ok = await actions.resetPasskeys({ id: 7 });
    });
    expect(api.resetUserPasskeys).toHaveBeenCalledWith(7);
    expect(admin.toast.success).toHaveBeenCalledWith('admin.passkey.resetDone {"count":2}');
    expect(ok).toBe(true);
  });

  it('FE-HOOK-ADMUSERACT-004: an answer without a count reads as zero', async () => {
    api.resetUserPasskeys.mockResolvedValue({});
    const { admin, actions } = mount();
    await act(() => actions.resetPasskeys({ id: 7 }));
    expect(admin.toast.success).toHaveBeenCalledWith('admin.passkey.resetDone {"count":0}');
  });

  it('FE-HOOK-ADMUSERACT-005: a failed passkey reset toasts and reports failure', async () => {
    api.resetUserPasskeys.mockRejectedValue(new Error('x'));
    const { admin, actions } = mount();
    let ok: boolean | undefined;
    await act(async () => {
      ok = await actions.resetPasskeys({ id: 7 });
    });
    expect(admin.toast.error).toHaveBeenCalledWith('common.error');
    expect(ok).toBe(false);
  });
});
