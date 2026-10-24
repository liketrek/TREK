import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../api/client';
import {
  type AdminPreferenceMatrix,
  useAdminNotificationMatrix,
  visibleAdminChannels,
} from './useAdminNotificationMatrix';

// FE-HOOK-ADMMATRIX-001 to FE-HOOK-ADMMATRIX-007

const t = (k: string) => k;
const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

function matrix(over: Partial<AdminPreferenceMatrix> = {}): AdminPreferenceMatrix {
  return {
    event_types: ['version_available', 'trip_reminder'],
    channels: [
      { id: 'inapp', active: true },
      { id: 'email', active: true },
      { id: 'webhook', active: false },
      { id: 'ntfy', active: true },
    ],
    implemented_combos: { version_available: ['inapp', 'email'], trip_reminder: ['inapp'] },
    preferences: { version_available: { inapp: true, email: false } },
    ...over,
  };
}

beforeEach(() => {
  toast.error.mockReset();
  vi.spyOn(adminApi, 'getNotificationPreferences').mockResolvedValue(matrix());
  vi.spyOn(adminApi, 'updateNotificationPreferences').mockResolvedValue({ success: true });
});
afterEach(() => vi.restoreAllMocks());

async function loaded() {
  const hook = renderHook(() => useAdminNotificationMatrix(t, toast));
  await waitFor(() => expect(hook.result.current.matrix).not.toBeNull());
  return hook;
}

describe('useAdminNotificationMatrix', () => {
  it('FE-HOOK-ADMMATRIX-001: stays empty until the matrix arrives and when the load fails', async () => {
    vi.mocked(adminApi.getNotificationPreferences).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useAdminNotificationMatrix(t, toast));
    await waitFor(() => expect(adminApi.getNotificationPreferences).toHaveBeenCalledTimes(1));
    expect(result.current.matrix).toBeNull();
    expect(result.current.visibleChannels).toEqual([]);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-HOOK-ADMMATRIX-002: shows only built-in channels that are active and implemented somewhere', async () => {
    const { result } = await loaded();
    expect(result.current.visibleChannels).toEqual(['inapp', 'email']);
    expect(visibleAdminChannels(matrix({ channels: undefined }))).toEqual([]);
  });

  it('FE-HOOK-ADMMATRIX-003: a toggle flips the cell, saves the whole map and clears saving', async () => {
    const { result } = await loaded();
    await act(() => result.current.toggle('version_available', 'email'));
    expect(adminApi.updateNotificationPreferences).toHaveBeenCalledWith({
      version_available: { inapp: true, email: true },
    });
    expect(result.current.matrix?.preferences.version_available.email).toBe(true);
    expect(result.current.saving).toBe(false);
  });

  it('FE-HOOK-ADMMATRIX-004: a cell without a stored value counts as on', async () => {
    const { result } = await loaded();
    await act(() => result.current.toggle('trip_reminder', 'inapp'));
    expect(adminApi.updateNotificationPreferences).toHaveBeenCalledWith({
      version_available: { inapp: true, email: false },
      trip_reminder: { inapp: false },
    });
  });

  it('FE-HOOK-ADMMATRIX-005: saving is set while the request runs', async () => {
    let finish!: (v: unknown) => void;
    vi.mocked(adminApi.updateNotificationPreferences).mockReturnValue(new Promise((r) => (finish = r)));
    const { result } = await loaded();
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.toggle('version_available', 'inapp');
    });
    expect(result.current.saving).toBe(true);
    await act(async () => {
      finish({ success: true });
      await pending;
    });
    expect(result.current.saving).toBe(false);
  });

  it('FE-HOOK-ADMMATRIX-006: a failed save reverts the cell and toasts', async () => {
    vi.mocked(adminApi.updateNotificationPreferences).mockRejectedValue(new Error('x'));
    const { result } = await loaded();
    await act(() => result.current.toggle('version_available', 'inapp'));
    expect(result.current.matrix?.preferences.version_available.inapp).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-HOOK-ADMMATRIX-007: two toggles in one render keep each other; a failure reverts only its cell', async () => {
    vi.mocked(adminApi.updateNotificationPreferences)
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('x'));
    const { result } = await loaded();
    const { toggle } = result.current;
    await act(async () => {
      await Promise.all([toggle('version_available', 'inapp'), toggle('version_available', 'email')]);
    });
    expect(vi.mocked(adminApi.updateNotificationPreferences).mock.calls[1][0]).toEqual({
      version_available: { inapp: false, email: true },
    });
    expect(result.current.matrix?.preferences.version_available).toEqual({ inapp: false, email: false });
  });
});
