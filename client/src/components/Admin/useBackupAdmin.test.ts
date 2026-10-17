import { act, renderHook, waitFor } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { backupApi } from '../../api/client';
import { useSettingsStore } from '../../store/settingsStore';
import { formatBackupSize, isAutoBackup, useBackupAdmin } from './useBackupAdmin';

// FE-HOOK-BACKUPADMIN-001 to FE-HOOK-BACKUPADMIN-014

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k, locale: 'en-US' }) }));

const SETTINGS = { enabled: true, interval: 'weekly', keep_days: 14, hour: 3, day_of_week: 1, day_of_month: 1 };
const B1 = { filename: 'backup-1.zip', created_at: '2025-06-01T10:00:00Z', size: 2048 };
const B2 = { filename: 'auto-backup-2.zip', created_at: null, size: null };

const reload = vi.fn();

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  reload.mockReset();
  vi.spyOn(backupApi, 'list').mockResolvedValue({ backups: [B1, B2] });
  vi.spyOn(backupApi, 'getAutoSettings').mockResolvedValue({ settings: SETTINGS, timezone: 'Europe/Berlin' });
  vi.spyOn(backupApi, 'create').mockResolvedValue({});
  vi.spyOn(backupApi, 'delete').mockResolvedValue({});
  vi.spyOn(backupApi, 'restore').mockResolvedValue({});
  vi.spyOn(backupApi, 'uploadRestore').mockResolvedValue({});
  vi.spyOn(backupApi, 'download').mockResolvedValue(undefined);
  vi.spyOn(backupApi, 'setAutoSettings').mockResolvedValue({ settings: { ...SETTINGS, hour: 4 } });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function loaded(keepSettingsWhenMissing?: boolean) {
  const hook = renderHook(() =>
    useBackupAdmin(keepSettingsWhenMissing === undefined ? undefined : { keepSettingsWhenMissing })
  );
  await waitFor(() => expect(hook.result.current.serverTimezone).toBe('Europe/Berlin'));
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

/** Stubbed after the initial load, so the setup never runs against a fake location. */
function stubReload() {
  vi.stubGlobal('location', { ...window.location, reload });
}

function uploadEvent(file: File | undefined) {
  const target = { files: file ? [file] : [], value: 'C:\\fakepath\\x.zip' };
  return { event: { target } as unknown as ChangeEvent<HTMLInputElement>, target };
}

describe('useBackupAdmin', () => {
  it('FE-HOOK-BACKUPADMIN-001: loads the backups and the schedule once on mount', async () => {
    const { result, rerender } = await loaded();
    rerender();
    expect(backupApi.list).toHaveBeenCalledTimes(1);
    expect(backupApi.getAutoSettings).toHaveBeenCalledTimes(1);
    expect(result.current.backups).toEqual([B1, B2]);
    expect(result.current.autoSettings).toEqual(SETTINGS);
  });

  it('FE-HOOK-BACKUPADMIN-002: a failed list toasts; a failed schedule load keeps the defaults quietly', async () => {
    vi.mocked(backupApi.list).mockRejectedValue(new Error('down'));
    vi.mocked(backupApi.getAutoSettings).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useBackupAdmin());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('backup.toast.loadError'));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(result.current.autoSettings.interval).toBe('daily');
  });

  it('FE-HOOK-BACKUPADMIN-003: a schedule answer without settings is kept on the phone and taken on desktop', async () => {
    vi.mocked(backupApi.getAutoSettings).mockResolvedValue({ timezone: 'Europe/Berlin' });
    const phone = await loaded(true);
    expect(phone.result.current.autoSettings.interval).toBe('daily');
    const desktop = await loaded();
    expect(desktop.result.current.autoSettings).toBeUndefined();
  });

  it('FE-HOOK-BACKUPADMIN-004: create toasts and reloads the list; a failure toasts the create error', async () => {
    const { result } = await loaded();
    await act(() => result.current.handleCreate());
    expect(toast.success).toHaveBeenCalledWith('backup.toast.created');
    expect(backupApi.list).toHaveBeenCalledTimes(2);
    expect(result.current.isCreating).toBe(false);
    vi.mocked(backupApi.create).mockRejectedValue(new Error('x'));
    await act(() => result.current.handleCreate());
    expect(toast.error).toHaveBeenCalledWith('backup.toast.createError');
  });

  it('FE-HOOK-BACKUPADMIN-005: a failed download toasts the download error', async () => {
    vi.mocked(backupApi.download).mockRejectedValue(new Error('x'));
    const { result } = await loaded();
    await act(async () => {
      await result.current.handleDownload('backup-1.zip');
    });
    expect(backupApi.download).toHaveBeenCalledWith('backup-1.zip');
    expect(toast.error).toHaveBeenCalledWith('backup.toast.downloadError');
  });

  it('FE-HOOK-BACKUPADMIN-006: delete waits for the confirm, then drops the row', async () => {
    const { result } = await loaded();
    act(() => result.current.handleDelete('backup-1.zip'));
    expect(result.current.deleteTarget).toBe('backup-1.zip');
    expect(backupApi.delete).not.toHaveBeenCalled();
    await act(() => result.current.executeDelete());
    expect(backupApi.delete).toHaveBeenCalledWith('backup-1.zip');
    expect(result.current.deleteTarget).toBeNull();
    expect(result.current.backups).toEqual([B2]);
    expect(toast.success).toHaveBeenCalledWith('backup.toast.deleted');
  });

  it('FE-HOOK-BACKUPADMIN-007: executing a delete with nothing pending does nothing; a failure toasts', async () => {
    const { result } = await loaded();
    await act(() => result.current.executeDelete());
    expect(backupApi.delete).not.toHaveBeenCalled();
    vi.mocked(backupApi.delete).mockRejectedValue(new Error('x'));
    act(() => result.current.setDeleteTarget('backup-1.zip'));
    await act(() => result.current.executeDelete());
    expect(toast.error).toHaveBeenCalledWith('backup.toast.deleteError');
    expect(result.current.backups).toEqual([B1, B2]);
  });

  it('FE-HOOK-BACKUPADMIN-008: restoring a stored file marks it, toasts and reloads the page after 1.5 s', async () => {
    const { result } = await loaded();
    stubReload();
    vi.useFakeTimers();
    act(() => result.current.handleRestore('backup-1.zip'));
    expect(result.current.restoreConfirm).toEqual({ type: 'file', filename: 'backup-1.zip' });
    await act(() => result.current.executeRestore());
    expect(backupApi.restore).toHaveBeenCalledWith('backup-1.zip');
    expect(result.current.restoreConfirm).toBeNull();
    expect(result.current.restoringFile).toBe('backup-1.zip');
    expect(toast.success).toHaveBeenCalledWith('backup.toast.restored');
    expect(reload).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1500));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-BACKUPADMIN-009: a failed restore shows the server message and clears the marker', async () => {
    vi.mocked(backupApi.restore).mockRejectedValue({ response: { data: { error: 'Corrupt' } } });
    const { result } = await loaded();
    act(() => result.current.handleRestore('backup-1.zip'));
    await act(() => result.current.executeRestore());
    expect(toast.error).toHaveBeenCalledWith('Corrupt');
    expect(result.current.restoringFile).toBeNull();
  });

  it('FE-HOOK-BACKUPADMIN-010: picking an upload clears the input and asks before restoring it', async () => {
    const { result } = await loaded();
    stubReload();
    vi.useFakeTimers();
    const file = new File(['x'], 'mine.zip');
    const { event, target } = uploadEvent(file);
    act(() => result.current.handleUploadRestore(event));
    expect(target.value).toBe('');
    expect(result.current.restoreConfirm).toEqual({ type: 'upload', filename: 'mine.zip', file });
    await act(() => result.current.executeRestore());
    expect(backupApi.uploadRestore).toHaveBeenCalledWith(file);
    expect(result.current.isUploading).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('backup.toast.restored');
    act(() => vi.advanceTimersByTime(1500));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-BACKUPADMIN-011: an empty pick does nothing; a failed upload restore toasts and stops', async () => {
    const { result } = await loaded();
    const empty = uploadEvent(undefined);
    act(() => result.current.handleUploadRestore(empty.event));
    expect(result.current.restoreConfirm).toBeNull();
    expect(empty.target.value).not.toBe('');
    vi.mocked(backupApi.uploadRestore).mockRejectedValue(new Error('x'));
    act(() => result.current.handleUploadRestore(uploadEvent(new File(['x'], 'mine.zip')).event));
    await act(() => result.current.executeRestore());
    expect(toast.error).toHaveBeenCalledWith('x');
    expect(result.current.isUploading).toBe(false);
  });

  it('FE-HOOK-BACKUPADMIN-012: editing the schedule marks it dirty; saving takes the answer and toasts', async () => {
    const { result } = await loaded();
    act(() => result.current.handleAutoSettingsChange('hour', 4));
    expect(result.current.autoSettings.hour).toBe(4);
    expect(result.current.autoSettingsDirty).toBe(true);
    await act(() => result.current.handleSaveAutoSettings());
    expect(backupApi.setAutoSettings).toHaveBeenCalledWith({ ...SETTINGS, hour: 4 });
    expect(result.current.autoSettingsDirty).toBe(false);
    expect(result.current.autoSettingsSaving).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('backup.toast.settingsSaved');
  });

  it('FE-HOOK-BACKUPADMIN-013: a save answer without settings keeps the form on the phone only; a failure toasts', async () => {
    vi.mocked(backupApi.setAutoSettings).mockResolvedValue({});
    const phone = await loaded(true);
    await act(() => phone.result.current.handleSaveAutoSettings());
    expect(phone.result.current.autoSettings).toEqual(SETTINGS);
    const desktop = await loaded();
    await act(() => desktop.result.current.handleSaveAutoSettings());
    expect(desktop.result.current.autoSettings).toBeUndefined();
    vi.mocked(backupApi.setAutoSettings).mockRejectedValue(new Error('x'));
    await act(() => phone.result.current.handleSaveAutoSettings());
    expect(toast.error).toHaveBeenCalledWith('backup.toast.settingsError');
  });

  it('FE-HOOK-BACKUPADMIN-014: formats sizes, dates in the server zone, auto names and the 12h setting', async () => {
    useSettingsStore.setState((s) => ({ settings: { ...s.settings, time_format: '12h' } }));
    const { result } = await loaded();
    expect(result.current.is12h).toBe(true);
    expect(formatBackupSize(null)).toBe('-');
    expect(formatBackupSize(2048)).toBe('2.0 KB');
    expect(formatBackupSize(3 * 1024 * 1024)).toBe('3.0 MB');
    expect(isAutoBackup('auto-backup-2.zip')).toBe(true);
    expect(isAutoBackup('backup-1.zip')).toBe(false);
    expect(result.current.formatDate(null)).toBe('-');
    expect(result.current.formatDate('2025-06-01T10:00:00Z')).toBe(
      new Date('2025-06-01T10:00:00Z').toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Berlin',
      })
    );
  });
});
