// FE-FILES-TRASH-001 to FE-FILES-TRASH-010: the trash logic behind the desktop file
// manager's trash view (load on demand) and the phone's trash sheet (load while open).
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import { filesApi } from '../../api/client';
import { useFileTrash, type FileTrashOptions } from './useFileTrash';

const t = (key: string) => key;
const TRASHED = [buildTripFile({ id: 31 }), buildTripFile({ id: 32 })];

function setup(over: Partial<FileTrashOptions> = {}) {
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  const onRestored = vi.fn();
  const hook = renderHook(
    (props: Partial<FileTrashOptions>) => useFileTrash({ tripId: 1, t, toast, onRestored, ...over, ...props }),
    { initialProps: {} }
  );
  return { ...hook, toast, onRestored };
}

beforeEach(() => {
  vi.spyOn(filesApi, 'list').mockResolvedValue({ files: TRASHED });
  vi.spyOn(filesApi, 'restore').mockResolvedValue({});
  vi.spyOn(filesApi, 'permanentDelete').mockResolvedValue({});
  vi.spyOn(filesApi, 'emptyTrash').mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useFileTrash', () => {
  it('FE-FILES-TRASH-001: without `open` nothing loads until load() is called', async () => {
    const { result } = setup();
    expect(filesApi.list).not.toHaveBeenCalled();
    expect(result.current.files).toEqual([]);

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.load();
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await pending;
    });
    expect(filesApi.list).toHaveBeenCalledWith(1, true);
    expect(result.current.files.map((f) => f.id)).toEqual([31, 32]);
    expect(result.current.loading).toBe(false);
  });

  it('FE-FILES-TRASH-002: a failing load() leaves the trash empty and stops loading', async () => {
    vi.mocked(filesApi.list).mockRejectedValue(new Error('offline'));
    const { result } = setup();
    await act(async () => {
      await result.current.load();
    });
    expect(result.current.files).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('FE-FILES-TRASH-003: with `open` the trash loads on open and not while closed', async () => {
    const { result, rerender } = setup({ open: false });
    expect(filesApi.list).not.toHaveBeenCalled();

    rerender({ open: true });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(filesApi.list).toHaveBeenCalledWith(1, true);
    expect(result.current.files.map((f) => f.id)).toEqual([31, 32]);
  });

  it('FE-FILES-TRASH-004: a load answered after the sheet closed is dropped', async () => {
    let resolve: (v: { files: typeof TRASHED }) => void = () => {};
    vi.mocked(filesApi.list).mockReturnValue(new Promise((r) => (resolve = r)));
    const { result, rerender } = setup({ open: true });
    rerender({ open: false });
    await act(async () => {
      resolve({ files: TRASHED });
    });
    expect(result.current.files).toEqual([]);
    // The cancelled load also leaves the spinner as it was.
    expect(result.current.loading).toBe(true);
  });

  it('FE-FILES-TRASH-005: a response without a files array reads as an empty trash', async () => {
    vi.mocked(filesApi.list).mockResolvedValue({});
    const { result } = setup({ open: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.files).toEqual([]);
  });

  it('FE-FILES-TRASH-006: restore drops the row, reloads the live files and toasts', async () => {
    const { result, toast, onRestored } = setup({ open: true });
    await waitFor(() => expect(result.current.files).toHaveLength(2));
    await act(async () => {
      await result.current.restore(31);
    });
    expect(filesApi.restore).toHaveBeenCalledWith(1, 31);
    expect(result.current.files.map((f) => f.id)).toEqual([32]);
    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('files.toast.restored');
  });

  it('FE-FILES-TRASH-007: a failed restore keeps the row and toasts the error', async () => {
    vi.mocked(filesApi.restore).mockRejectedValue(new Error('nope'));
    const { result, toast, onRestored } = setup({ open: true });
    await waitFor(() => expect(result.current.files).toHaveLength(2));
    await act(async () => {
      await result.current.restore(31);
    });
    expect(result.current.files).toHaveLength(2);
    expect(onRestored).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('files.toast.restoreError');
  });

  it('FE-FILES-TRASH-008: permanent delete drops the row and toasts, or toasts the error', async () => {
    const { result, toast, onRestored } = setup({ open: true });
    await waitFor(() => expect(result.current.files).toHaveLength(2));
    await act(async () => {
      await result.current.permanentDelete(32);
    });
    expect(filesApi.permanentDelete).toHaveBeenCalledWith(1, 32);
    expect(result.current.files.map((f) => f.id)).toEqual([31]);
    expect(toast.success).toHaveBeenCalledWith('files.toast.deleted');
    expect(onRestored).not.toHaveBeenCalled();

    vi.mocked(filesApi.permanentDelete).mockRejectedValue(new Error('nope'));
    await act(async () => {
      await result.current.permanentDelete(31);
    });
    expect(result.current.files.map((f) => f.id)).toEqual([31]);
    expect(toast.error).toHaveBeenCalledWith('files.toast.deleteError');
  });

  it('FE-FILES-TRASH-009: emptying clears the list and toasts', async () => {
    const { result, toast } = setup({ open: true });
    await waitFor(() => expect(result.current.files).toHaveLength(2));
    await act(async () => {
      await result.current.emptyTrash();
    });
    expect(filesApi.emptyTrash).toHaveBeenCalledWith(1);
    expect(result.current.files).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith('files.toast.trashEmptied');
  });

  it('FE-FILES-TRASH-010: a failed empty keeps the list and toasts the error', async () => {
    vi.mocked(filesApi.emptyTrash).mockRejectedValue(new Error('nope'));
    const { result, toast } = setup({ open: true });
    await waitFor(() => expect(result.current.files).toHaveLength(2));
    await act(async () => {
      await result.current.emptyTrash();
    });
    expect(result.current.files).toHaveLength(2);
    expect(toast.error).toHaveBeenCalledWith('files.toast.deleteError');
  });
});
