import { act, renderHook, waitFor } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPackingItem } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { packingApi } from '../../api/client';
import { useTripStore } from '../../store/tripStore';
import { parseImportLines } from './packingListPanel.helpers';
import { usePackingImport } from './usePackingImport';

// FE-PACK-IMPORT-001 to FE-PACK-IMPORT-008

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;
const EXISTING = buildPackingItem({ id: 1, name: 'Tent' });
const LIST = 'Gear, Rope\nClothes, Socks';

function setup(options: { reportEmpty?: boolean; oneAtATime?: boolean } = {}) {
  const toast = { success: vi.fn(), error: vi.fn() };
  const onImported = vi.fn();
  const rendered = renderHook(() => usePackingImport({ tripId: 7, t, toast, onImported, ...options }));
  return { ...rendered, toast, onImported };
}

const fileEvent = (target: { files: File[] | null; value: string }) =>
  ({ target }) as unknown as ChangeEvent<HTMLInputElement>;

beforeEach(() => {
  resetAllStores();
  seedStore(useTripStore, { packingItems: [EXISTING] });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('usePackingImport', () => {
  it('FE-PACK-IMPORT-001: parses the text as it is typed', () => {
    const { result } = setup();
    expect(result.current.parsed).toEqual([]);
    act(() => result.current.setText(LIST));
    expect(result.current.parsed).toEqual(parseImportLines(LIST));
    expect(result.current.parsed).toHaveLength(2);
  });

  it('FE-PACK-IMPORT-002: a picked file fills the text box and frees the picker for the same file', async () => {
    const { result } = setup();
    const target = { files: [new File(['Gear, Rope'], 'list.csv', { type: 'text/plain' })], value: 'list.csv' };
    act(() => result.current.readFile(fileEvent(target)));
    await waitFor(() => expect(result.current.text).toBe('Gear, Rope'));
    expect(target.value).toBe('');
  });

  it('FE-PACK-IMPORT-003: no file picked, or a result that is not text, leaves the box alone', async () => {
    class BinaryReader {
      result: unknown = new ArrayBuffer(4);
      onload: (() => void) | null = null;
      readAsText() {
        this.onload?.();
      }
    }
    const { result } = setup();
    const none = { files: null, value: 'x' };
    act(() => result.current.readFile(fileEvent(none)));
    expect(none.value).toBe('x');
    vi.stubGlobal('FileReader', BinaryReader);
    act(() => result.current.readFile(fileEvent({ files: [new File(['x'], 'list.csv')], value: 'list.csv' })));
    expect(result.current.text).toBe('');
  });

  it('FE-PACK-IMPORT-004: an import appends the items to the store, reports the count, clears and closes', async () => {
    const added = buildPackingItem({ id: 2, name: 'Rope', category: 'Gear' });
    const bulk = vi.spyOn(packingApi, 'bulkImport').mockResolvedValue({ items: [added], count: 2 });
    const { result, toast, onImported } = setup({ oneAtATime: true });
    act(() => result.current.setText(LIST));
    await act(async () => {
      await result.current.runImport();
    });
    expect(bulk).toHaveBeenCalledWith(7, parseImportLines(LIST));
    expect(useTripStore.getState().packingItems).toEqual([EXISTING, added]);
    expect(toast.success).toHaveBeenCalledWith('packing.importSuccess:2');
    expect(result.current.text).toBe('');
    expect(onImported).toHaveBeenCalledTimes(1);
    expect(result.current.importing).toBe(false);
  });

  it('FE-PACK-IMPORT-005: a failed import is reported, keeps the text and stays open', async () => {
    vi.spyOn(packingApi, 'bulkImport').mockRejectedValue(new Error('x'));
    const { result, toast, onImported } = setup({ reportEmpty: true });
    act(() => result.current.setText(LIST));
    await act(async () => {
      await result.current.runImport();
    });
    expect(toast.error).toHaveBeenCalledWith('packing.importError');
    expect(result.current.text).toBe(LIST);
    expect(onImported).not.toHaveBeenCalled();
    expect(useTripStore.getState().packingItems).toEqual([EXISTING]);
  });

  it('FE-PACK-IMPORT-006: nothing to import: the desktop says so, the phone stays quiet, neither sends', async () => {
    const bulk = vi.spyOn(packingApi, 'bulkImport');
    const desktop = setup({ reportEmpty: true });
    act(() => desktop.result.current.setText(','));
    await act(async () => {
      await desktop.result.current.runImport();
    });
    expect(desktop.toast.error).toHaveBeenCalledWith('packing.importEmpty');

    const phone = setup({ oneAtATime: true });
    act(() => phone.result.current.setText(','));
    await act(async () => {
      await phone.result.current.runImport();
    });
    expect(phone.toast.error).not.toHaveBeenCalled();
    expect(bulk).not.toHaveBeenCalled();
  });

  it('FE-PACK-IMPORT-007: one import at a time on the phone: a second tap while it runs is ignored', async () => {
    let finish: () => void = () => {};
    const bulk = vi.spyOn(packingApi, 'bulkImport').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ items: [], count: 2 });
        })
    );
    const { result } = setup({ oneAtATime: true });
    act(() => result.current.setText(LIST));
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.runImport();
    });
    expect(result.current.importing).toBe(true);
    await act(async () => {
      await result.current.runImport();
    });
    expect(bulk).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await first;
    });
    expect(result.current.importing).toBe(false);
  });

  it('FE-PACK-IMPORT-008: the desktop sends a second import while one runs, as it always has', async () => {
    const bulk = vi.spyOn(packingApi, 'bulkImport').mockImplementation(() => new Promise(() => {}));
    const { result } = setup({ reportEmpty: true });
    act(() => result.current.setText(LIST));
    act(() => {
      void result.current.runImport();
    });
    act(() => {
      void result.current.runImport();
    });
    expect(bulk).toHaveBeenCalledTimes(2);
    expect(result.current.importing).toBe(false);
  });
});
