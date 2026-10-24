import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../../api/client';
import { cycleMapAdminApi, hikingMapAdminApi, skiRoutingAdminApi } from '../../../api/tourBaseMaps';
import { wandererAdminApi } from '../../../api/wanderer';
import { useAddonStore } from '../../../store/addonStore';
import type { Addon } from './addonModel';
import { useAddonManager } from './useAddonManager';

// FE-HOOK-ADDONMGR-001 to FE-HOOK-ADDONMGR-008

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
  addon('airtrail', 'integration', false),
  addon('mcp', 'integration'),
];

let loadAddons: ReturnType<typeof vi.fn<() => Promise<void>>>;

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  loadAddons = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  useAddonStore.setState({ loadAddons });
  vi.spyOn(adminApi, 'addons').mockResolvedValue({ addons: ADDONS });
  vi.spyOn(adminApi, 'updateAddon').mockResolvedValue({});
  vi.spyOn(wandererAdminApi, 'get').mockResolvedValue({ enabled: false });
  vi.spyOn(hikingMapAdminApi, 'get').mockResolvedValue({ enabled: true });
  vi.spyOn(cycleMapAdminApi, 'get').mockResolvedValue({ enabled: true });
  vi.spyOn(skiRoutingAdminApi, 'get').mockResolvedValue({ enabled: true });
});
afterEach(() => vi.restoreAllMocks());

async function loaded() {
  const hook = renderHook(() => useAddonManager());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

const enabledOf = (addons: Addon[], id: string) => addons.find((a) => a.id === id)?.enabled;

/** One of the map switches under Tours, by its key. */
function mapSwitch(manager: ReturnType<typeof useAddonManager>, key: 'hiking' | 'cycle' | 'ski') {
  const found = manager.mapSwitches.find((entry) => entry.key === key);
  if (!found) throw new Error(`no ${key} map switch`);
  return found;
}

describe('useAddonManager', () => {
  it('FE-HOOK-ADDONMGR-001: loads once and sorts addons into trip, global, integration, AI and the two shelves', async () => {
    const { result, rerender } = await loaded();
    rerender();
    expect(adminApi.addons).toHaveBeenCalledTimes(1);
    const ids = (list: { id?: string; key?: string }[]) => list.map((a) => a.id ?? a.key);
    expect(ids(result.current.tripAddons)).toEqual(['todo', 'documents']);
    expect(ids(result.current.globalAddons)).toEqual(['journey']);
    // The AI addons leave the integration list for their own tile, in its order.
    expect(ids(result.current.integrationAddons)).toEqual(['airtrail']);
    expect(ids(result.current.aiAddons)).toEqual(['llm_parsing', 'mcp']);
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

  it('FE-HOOK-ADDONMGR-007: the hiking map switch under Tours loads, flips, saves and refreshes the store (MAP-01)', async () => {
    const update = vi.spyOn(hikingMapAdminApi, 'update').mockResolvedValue({ enabled: false });
    const { result } = await loaded();
    await waitFor(() => expect(mapSwitch(result.current, 'hiking').enabled).toBe(true));
    await act(() => mapSwitch(result.current, 'hiking').toggle());
    expect(update).toHaveBeenCalledWith(false);
    expect(mapSwitch(result.current, 'hiking').enabled).toBe(false);
    expect(loadAddons).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('admin.addons.toast.updated');
  });

  it('FE-HOOK-ADDONMGR-009: the cycling map switch under Tours loads, flips and saves on its own (BIK-06)', async () => {
    const update = vi.spyOn(cycleMapAdminApi, 'update').mockResolvedValue({ enabled: false });
    const { result } = await loaded();
    await waitFor(() => expect(mapSwitch(result.current, 'cycle').enabled).toBe(true));
    await act(() => mapSwitch(result.current, 'cycle').toggle());
    expect(update).toHaveBeenCalledWith(false);
    expect(mapSwitch(result.current, 'cycle').enabled).toBe(false);
    expect(mapSwitch(result.current, 'hiking').enabled).toBe(true);
  });

  it('FE-HOOK-ADDONMGR-010: the piste router switch under Tours loads on, flips and saves on its own (SKI-02)', async () => {
    const update = vi.spyOn(skiRoutingAdminApi, 'update').mockResolvedValue({ enabled: false });
    const { result } = await loaded();
    await waitFor(() => expect(mapSwitch(result.current, 'ski').enabled).toBe(true));
    await act(() => mapSwitch(result.current, 'ski').toggle());
    expect(update).toHaveBeenCalledWith(false);
    expect(mapSwitch(result.current, 'ski').enabled).toBe(false);
    expect(mapSwitch(result.current, 'cycle').enabled).toBe(true);
  });

  it('FE-HOOK-ADDONMGR-008: a failed save puts the switch under Tours back and says so', async () => {
    vi.spyOn(wandererAdminApi, 'update').mockRejectedValue(new Error('500'));
    const { result } = await loaded();
    await act(() => result.current.toggleToursWanderer());
    expect(result.current.toursWanderer).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('admin.addons.toast.error');
  });
});
