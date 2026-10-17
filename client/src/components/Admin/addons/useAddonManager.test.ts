import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../../api/client';
import { useAddonStore } from '../../../store/addonStore';
import type { Addon } from './addonModel';
import { useAddonManager } from './useAddonManager';

// FE-HOOK-ADDONMGR-001 to FE-HOOK-ADDONMGR-006

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

function addon(id: string, type: string, enabled = true, over: Partial<Addon> = {}): Addon {
  return { id, name: id, description: `${id} addon`, icon: 'Puzzle', type, enabled, ...over };
}

const ADDONS = [
  addon('todo', 'trip'),
  addon('memories', 'trip', true, { icon: 'Image' }),
  addon('journey', 'global'),
  addon('documents', 'trip'),
  addon('llm_parsing', 'integration', false),
  addon('immich', 'photo_provider', false),
  addon('gdrive', 'document_provider'),
];

let loadAddons: ReturnType<typeof vi.fn<() => Promise<void>>>;

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  loadAddons = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  useAddonStore.setState({ loadAddons });
  vi.spyOn(adminApi, 'addons').mockResolvedValue({ addons: ADDONS });
  vi.spyOn(adminApi, 'updateAddon').mockResolvedValue({});
});
afterEach(() => vi.restoreAllMocks());

async function loaded() {
  const hook = renderHook(() => useAddonManager());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

const enabledOf = (addons: Addon[], id: string) => addons.find((a) => a.id === id)?.enabled;

describe('useAddonManager', () => {
  it('FE-HOOK-ADDONMGR-001: loads once and sorts addons into trip, global, integration and the two shelves', async () => {
    const { result, rerender } = await loaded();
    rerender();
    expect(adminApi.addons).toHaveBeenCalledTimes(1);
    const ids = (list: { id?: string; key?: string }[]) => list.map((a) => a.id ?? a.key);
    expect(ids(result.current.tripAddons)).toEqual(['todo', 'documents']);
    expect(ids(result.current.globalAddons)).toEqual(['journey']);
    expect(ids(result.current.integrationAddons)).toEqual(['llm_parsing']);
    expect(result.current.providerOptions).toEqual([
      expect.objectContaining({ key: 'immich', label: 'immich', description: 'immich addon', enabled: false }),
    ]);
    expect(result.current.documentProviderOptions.map((o) => o.key)).toEqual(['gdrive']);
  });

  it('FE-HOOK-ADDONMGR-002: a failed load toasts the addon error and ends loading', async () => {
    vi.mocked(adminApi.addons).mockRejectedValue(new Error('down'));
    const { result } = await loaded();
    expect(toast.error).toHaveBeenCalledWith('admin.addons.toast.error');
    expect(result.current.addons).toEqual([]);
  });

  it('FE-HOOK-ADDONMGR-003: a toggle flips at once, saves, refreshes the store and toasts', async () => {
    const { result } = await loaded();
    await act(() => result.current.handleToggle(ADDONS[0]));
    expect(adminApi.updateAddon).toHaveBeenCalledWith('todo', { enabled: false });
    expect(enabledOf(result.current.addons, 'todo')).toBe(false);
    expect(loadAddons).toHaveBeenCalledTimes(1);
    expect(adminApi.addons).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('admin.addons.toast.updated');
  });

  it('FE-HOOK-ADDONMGR-004: a failed toggle rolls back only its own row', async () => {
    let fail!: (e: unknown) => void;
    vi.mocked(adminApi.updateAddon)
      .mockReturnValueOnce(new Promise((_, reject) => (fail = reject)))
      .mockResolvedValueOnce({});
    const { result } = await loaded();
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handleToggle(ADDONS[0]);
    });
    await act(() => result.current.handleToggle(ADDONS[5]));
    await act(async () => {
      fail(new Error('x'));
      await pending;
    });
    expect(enabledOf(result.current.addons, 'todo')).toBe(true);
    expect(enabledOf(result.current.addons, 'immich')).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('admin.addons.toast.error');
    expect(loadAddons).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-ADDONMGR-005: toggling Journey or Documents reads the list again for the cascaded providers', async () => {
    const { result } = await loaded();
    await act(() => result.current.handleToggle(ADDONS[2]));
    expect(adminApi.addons).toHaveBeenCalledTimes(2);
    await act(() => result.current.handleToggle(ADDONS[3]));
    expect(adminApi.addons).toHaveBeenCalledTimes(3);
  });

  it('FE-HOOK-ADDONMGR-006: a provider option toggles its provider like any addon', async () => {
    const { result } = await loaded();
    await act(() => result.current.providerOptions[0].toggle());
    expect(adminApi.updateAddon).toHaveBeenCalledWith('immich', { enabled: true });
    expect(result.current.providerOptions[0].enabled).toBe(true);
    await act(() => result.current.documentProviderOptions[0].toggle());
    expect(adminApi.updateAddon).toHaveBeenLastCalledWith('gdrive', { enabled: false });
  });
});
