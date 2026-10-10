import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../api/client';
import { usePermissionsStore } from '../../store/permissionsStore';
import { usePermissionsAdmin } from './usePermissionsAdmin';

// FE-HOOK-PERMADMIN-001 to FE-HOOK-PERMADMIN-007

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const PERMISSIONS = [
  { key: 'trip_create', level: 'admin', defaultLevel: 'everybody', allowedLevels: ['admin', 'everybody'] },
  { key: 'trip_edit', level: 'trip_member', defaultLevel: 'trip_member', allowedLevels: ['trip_owner', 'trip_member'] },
];

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  vi.spyOn(adminApi, 'getPermissions').mockResolvedValue({ permissions: PERMISSIONS });
  vi.spyOn(adminApi, 'updatePermissions').mockResolvedValue({ permissions: { trip_create: 'everybody' } });
});
// A store write replaces the state object, carrying a spy on one of its functions into the
// next test, so every test starts from the store as it was loaded.
const initialPermissions = usePermissionsStore.getState();
afterEach(() => {
  vi.restoreAllMocks();
  usePermissionsStore.setState(initialPermissions, true);
});

async function loaded() {
  const hook = renderHook(() => usePermissionsAdmin());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('usePermissionsAdmin', () => {
  it('FE-HOOK-PERMADMIN-001: loads once on mount into values and a lookup by key, clean', async () => {
    const { result, rerender } = await loaded();
    rerender();
    expect(adminApi.getPermissions).toHaveBeenCalledTimes(1);
    expect(result.current.values).toEqual({ trip_create: 'admin', trip_edit: 'trip_member' });
    expect(result.current.entryMap.get('trip_edit')?.defaultLevel).toBe('trip_member');
    expect(result.current.dirty).toBe(false);
  });

  it('FE-HOOK-PERMADMIN-002: a failed load toasts the generic error and stops loading', async () => {
    vi.mocked(adminApi.getPermissions).mockRejectedValue(new Error('down'));
    const { result } = await loaded();
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.entryMap.size).toBe(0);
  });

  it('FE-HOOK-PERMADMIN-003: a change sets the value and marks the form dirty', async () => {
    const { result } = await loaded();
    act(() => result.current.handleChange('trip_edit', 'trip_owner'));
    expect(result.current.values.trip_edit).toBe('trip_owner');
    expect(result.current.dirty).toBe(true);
  });

  it('FE-HOOK-PERMADMIN-004: reset puts every entry back on its default and stays dirty until saved', async () => {
    const { result } = await loaded();
    act(() => result.current.handleReset());
    expect(result.current.values).toEqual({ trip_create: 'everybody', trip_edit: 'trip_member' });
    expect(result.current.dirty).toBe(true);
  });

  it('FE-HOOK-PERMADMIN-005: save sends the values, updates the permissions store and toasts', async () => {
    const setPermissions = vi.spyOn(usePermissionsStore.getState(), 'setPermissions');
    const { result } = await loaded();
    act(() => result.current.handleChange('trip_create', 'everybody'));
    await act(() => result.current.handleSave());
    expect(adminApi.updatePermissions).toHaveBeenCalledWith({ trip_create: 'everybody', trip_edit: 'trip_member' });
    expect(setPermissions).toHaveBeenCalledWith({ trip_create: 'everybody' });
    expect(toast.success).toHaveBeenCalledWith('perm.saved');
    expect(result.current.dirty).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('FE-HOOK-PERMADMIN-006: a save answer without permissions leaves the store alone', async () => {
    vi.mocked(adminApi.updatePermissions).mockResolvedValue({});
    const setPermissions = vi.spyOn(usePermissionsStore.getState(), 'setPermissions');
    const { result } = await loaded();
    await act(() => result.current.handleSave());
    expect(setPermissions).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('perm.saved');
  });

  it('FE-HOOK-PERMADMIN-007: a failed save toasts the error and keeps the form dirty', async () => {
    vi.mocked(adminApi.updatePermissions).mockRejectedValue(new Error('nope'));
    const { result } = await loaded();
    act(() => result.current.handleChange('trip_create', 'everybody'));
    await act(() => result.current.handleSave());
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.dirty).toBe(true);
    expect(result.current.saving).toBe(false);
  });
});
