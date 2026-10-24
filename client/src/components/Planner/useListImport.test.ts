// FE-PLANNER-LISTIMP-001 to FE-PLANNER-LISTIMP-014: the shared-list import logic behind
// the desktop dialog (no onDone) and the phone's import step (onDone).
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { placesApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useListImport, type ListImportOptions } from './useListImport';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

function setup(over: Partial<ListImportOptions> = {}) {
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  const loadTrip = vi.fn(async (_tripId: number) => undefined);
  const pushUndo = vi.fn((_label: string, _undo: () => Promise<void> | void) => {});
  const options: ListImportOptions = { tripId: 1, t, toast, loadTrip, pushUndo, ...over };
  const hook = renderHook(() => useListImport(options));
  return { ...hook, toast, loadTrip, pushUndo };
}

async function importUrl(result: { current: ReturnType<typeof useListImport> }, url: string) {
  act(() => result.current.setUrl(url));
  await act(async () => {
    await result.current.handleImport();
  });
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useListImport', () => {
  it('FE-PLANNER-LISTIMP-001: starts closed, on Google, with an empty link and enrichment off', () => {
    const { result } = setup();
    expect(result.current.open).toBe(false);
    expect(result.current.provider).toBe('google');
    expect(result.current.url).toBe('');
    expect(result.current.enrich).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.canEnrich).toBe(false);
  });

  it('FE-PLANNER-LISTIMP-002: an empty or blank link starts nothing', async () => {
    const google = vi.spyOn(placesApi, 'importGoogleList');
    const { result, loadTrip } = setup();
    await importUrl(result, '   ');
    expect(google).not.toHaveBeenCalled();
    expect(loadTrip).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('FE-PLANNER-LISTIMP-003: the desktop dialog imports the trimmed link, reloads, toasts, closes and clears', async () => {
    const google = vi
      .spyOn(placesApi, 'importGoogleList')
      .mockResolvedValue({ count: 2, skipped: 0, listName: 'Tokyo', places: [{ id: 20 }, { id: 21 }] });
    const { result, toast, loadTrip, pushUndo } = setup();
    act(() => result.current.setOpen(true));

    await importUrl(result, ' https://maps.app.goo.gl/abc ');

    expect(google).toHaveBeenCalledWith(1, 'https://maps.app.goo.gl/abc', false);
    expect(loadTrip).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalledWith('places.googleListImported:2,Tokyo');
    expect(pushUndo).toHaveBeenCalledWith('undo.importGoogleList', expect.any(Function));
    expect(result.current.open).toBe(false);
    expect(result.current.url).toBe('');
    expect(result.current.loading).toBe(false);
  });

  it('FE-PLANNER-LISTIMP-004: the desktop dialog is closed before the undo step goes in', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({
      count: 1,
      skipped: 0,
      listName: 'L',
      places: [{ id: 7 }],
    });
    const { result, toast, pushUndo } = setup();
    pushUndo.mockImplementation(() => {
      throw new Error('history full');
    });
    act(() => result.current.setOpen(true));

    await importUrl(result, 'https://maps.app.goo.gl/abc');

    // The close ran before the throwing undo step, so it stands.
    expect(result.current.open).toBe(false);
    expect(result.current.url).toBe('');
    expect(toast.error).toHaveBeenCalledWith('places.googleListError');
  });

  it('FE-PLANNER-LISTIMP-005: the phone step hands over through onDone after the undo step and keeps its link', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({
      count: 1,
      skipped: 0,
      listName: 'L',
      places: [{ id: 7 }],
    });
    const onDone = vi.fn();
    const { result, pushUndo } = setup({ onDone });
    act(() => result.current.setOpen(true));

    await importUrl(result, 'https://maps.app.goo.gl/abc');

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(pushUndo.mock.invocationCallOrder[0]).toBeLessThan(onDone.mock.invocationCallOrder[0]);
    expect(result.current.url).toBe('https://maps.app.goo.gl/abc');
    expect(result.current.open).toBe(true);
  });

  it('FE-PLANNER-LISTIMP-006: the undo step bulk-deletes the imported places and reloads, even when the delete fails', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({
      count: 2,
      skipped: 0,
      listName: 'L',
      places: [{ id: 71 }, { id: 72 }],
    });
    const bulkDelete = vi
      .spyOn(placesApi, 'bulkDelete')
      .mockResolvedValueOnce({ deleted: 2 })
      .mockRejectedValueOnce(new Error('gone'));
    const { result, loadTrip, pushUndo } = setup();
    await importUrl(result, 'https://maps.app.goo.gl/abc');

    const revert = pushUndo.mock.calls[0][1] as () => Promise<void>;
    await revert();
    expect(bulkDelete).toHaveBeenCalledWith(1, [71, 72]);
    expect(loadTrip).toHaveBeenCalledTimes(2);

    await expect(revert()).resolves.toBeUndefined();
    expect(loadTrip).toHaveBeenCalledTimes(3);
  });

  it('FE-PLANNER-LISTIMP-007: nothing created means no undo step, and an all-skipped import warns', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({ count: 0, skipped: 4, listName: 'L', places: [] });
    const { result, toast, pushUndo } = setup();
    await importUrl(result, 'https://maps.app.goo.gl/abc');
    expect(toast.warning).toHaveBeenCalledWith('places.importAllSkipped');
    expect(toast.success).not.toHaveBeenCalled();
    expect(pushUndo).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-LISTIMP-008: Naver goes to its own endpoint with its own toast and undo label', async () => {
    const naver = vi
      .spyOn(placesApi, 'importNaverList')
      .mockResolvedValue({ count: 2, skipped: 0, listName: 'Seoul', places: [{ id: 81 }] });
    const { result, toast, pushUndo } = setup();
    act(() => result.current.setProvider('naver'));
    await importUrl(result, 'https://naver.me/xyz');
    expect(naver).toHaveBeenCalledWith(1, 'https://naver.me/xyz', false);
    expect(toast.success).toHaveBeenCalledWith('places.naverListImported:2,Seoul');
    expect(pushUndo).toHaveBeenCalledWith('undo.importNaverList', expect.any(Function));
  });

  it('FE-PLANNER-LISTIMP-009: enrichment is sent only when asked for and a maps key exists', async () => {
    const google = vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({ count: 1, skipped: 0, places: [] });
    const first = setup();
    act(() => first.result.current.setEnrich(true));
    await importUrl(first.result, 'https://maps.app.goo.gl/a');
    expect(google).toHaveBeenLastCalledWith(1, 'https://maps.app.goo.gl/a', false);
    first.unmount();

    seedStore(useAuthStore, { hasMapsKey: true });
    const second = setup();
    expect(second.result.current.canEnrich).toBe(true);
    await importUrl(second.result, 'https://maps.app.goo.gl/b');
    expect(google).toHaveBeenLastCalledWith(1, 'https://maps.app.goo.gl/b', false);
    act(() => second.result.current.setEnrich(true));
    await importUrl(second.result, 'https://maps.app.goo.gl/c');
    expect(google).toHaveBeenLastCalledWith(1, 'https://maps.app.goo.gl/c', true);
  });

  it('FE-PLANNER-LISTIMP-010: a failure shows the server message and leaves the dialog open with its link', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockRejectedValue({ response: { data: { error: 'List is private' } } });
    const onDone = vi.fn();
    const { result, toast, loadTrip } = setup({ onDone });
    act(() => result.current.setOpen(true));
    await importUrl(result, 'https://maps.app.goo.gl/abc');
    expect(toast.error).toHaveBeenCalledWith('List is private');
    expect(onDone).not.toHaveBeenCalled();
    expect(loadTrip).not.toHaveBeenCalled();
    expect(result.current.open).toBe(true);
    expect(result.current.url).toBe('https://maps.app.goo.gl/abc');
    expect(result.current.loading).toBe(false);
  });

  it('FE-PLANNER-LISTIMP-011: without a server message the provider error key is shown', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockRejectedValue(new Error('network'));
    vi.spyOn(placesApi, 'importNaverList').mockRejectedValue(new Error('network'));
    const { result, toast } = setup();
    await importUrl(result, 'https://maps.app.goo.gl/abc');
    expect(toast.error).toHaveBeenLastCalledWith('places.googleListError');
    act(() => result.current.setProvider('naver'));
    await importUrl(result, 'https://naver.me/xyz');
    expect(toast.error).toHaveBeenLastCalledWith('places.naverListError');
  });

  it('FE-PLANNER-LISTIMP-012: on the phone a second import while one is in flight is refused', async () => {
    let release: (value: unknown) => void = () => {};
    const google = vi.spyOn(placesApi, 'importGoogleList').mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    const onDone = vi.fn();
    const { result } = setup({ onDone });
    act(() => result.current.setUrl('https://maps.app.goo.gl/abc'));

    let first!: Promise<void>;
    act(() => {
      first = result.current.handleImport();
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await result.current.handleImport();
    });
    expect(google).toHaveBeenCalledTimes(1);

    await act(async () => {
      release({ count: 1, skipped: 0, listName: 'L', places: [] });
      await first;
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it('FE-PLANNER-LISTIMP-013: works without a pushUndo', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({
      count: 1,
      skipped: 0,
      listName: 'L',
      places: [{ id: 1 }],
    });
    const { result, toast } = setup({ pushUndo: undefined });
    await importUrl(result, 'https://maps.app.goo.gl/abc');
    expect(toast.success).toHaveBeenCalledWith('places.googleListImported:1,L');
    expect(result.current.open).toBe(false);
  });

  it('FE-PLANNER-LISTIMP-014: the desktop dialog leaves the in-flight guard to its button', async () => {
    const releases: ((value: unknown) => void)[] = [];
    const google = vi.spyOn(placesApi, 'importGoogleList').mockImplementation(
      () =>
        new Promise((resolve) => {
          releases.push(resolve);
        })
    );
    const { result } = setup();
    act(() => result.current.setUrl('https://maps.app.goo.gl/abc'));

    let first!: Promise<void>;
    act(() => {
      first = result.current.handleImport();
    });
    expect(result.current.loading).toBe(true);
    let second!: Promise<void>;
    act(() => {
      second = result.current.handleImport();
    });
    expect(google).toHaveBeenCalledTimes(2);

    await act(async () => {
      releases.forEach((release) => release({ count: 1, skipped: 0, listName: 'L', places: [] }));
      await Promise.all([first, second]);
    });
    expect(result.current.loading).toBe(false);
  });
});
