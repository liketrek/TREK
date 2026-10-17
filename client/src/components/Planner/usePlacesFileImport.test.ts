// FE-PLANNER-FILEIMPHOOK-001 to FE-PLANNER-FILEIMPHOOK-018: the GPX/KML/KMZ import logic
// behind the desktop dialog (variant 'dialog') and the phone's import step ('sheet').
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { placesApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { usePlacesFileImport, type PlacesFileImportOptions } from './usePlacesFileImport';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

const gpx = (name = 'route.gpx') => new File(['<gpx/>'], name, { type: 'application/gpx+xml' });
const kml = (name = 'places.kml') => new File(['<kml/>'], name, { type: 'application/vnd.google-earth.kml+xml' });

function oversized(name = 'big.gpx') {
  const f = gpx(name);
  Object.defineProperty(f, 'size', { value: 11 * 1024 * 1024 });
  return f;
}

const summary = (over: Partial<{ total: number; created: number; skipped: number; warnings: string[] }> = {}) => ({
  totalPlacemarks: over.total ?? 3,
  createdCount: over.created ?? 2,
  skippedCount: over.skipped ?? 1,
  warnings: over.warnings ?? [],
  errors: [],
});

type HookProps = Pick<PlacesFileImportOptions, 'open' | 'initialFile'>;

function setup(over: Partial<PlacesFileImportOptions> = {}) {
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  const loadTrip = vi.fn(async (_tripId: number) => undefined);
  const pushUndo = vi.fn((_label: string, _undo: () => Promise<void> | void) => {});
  const onDone = vi.fn();
  const base: PlacesFileImportOptions = { tripId: 3, t, toast, loadTrip, pushUndo, onDone, variant: 'sheet', ...over };
  const hook = renderHook((p: HookProps) => usePlacesFileImport({ ...base, ...p }), {
    initialProps: { open: over.open, initialFile: over.initialFile },
  });
  return { ...hook, toast, loadTrip, pushUndo, onDone };
}

function choose(result: { current: ReturnType<typeof usePlacesFileImport> }, files: File[]) {
  const target = { files, value: 'C:\\fakepath\\x' };
  act(() => result.current.handleInputChange({ target } as unknown as React.ChangeEvent<HTMLInputElement>));
  return target;
}

async function runImport(result: { current: ReturnType<typeof usePlacesFileImport> }) {
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

describe('usePlacesFileImport: choosing files', () => {
  it('FE-PLANNER-FILEIMPHOOK-001: keeps the valid files, reports the first problem and clears the input', () => {
    const { result } = setup();
    const target = choose(result, [gpx('a.gpx'), new File(['x'], 'notes.txt'), oversized(), kml('b.kmz')]);
    expect(target.value).toBe('');
    expect(result.current.files.map((f) => f.name)).toEqual(['a.gpx', 'b.kmz']);
    expect(result.current.error).toBe('places.importFileUnsupported');
    expect(result.current.isGpx).toBe(true);
    expect(result.current.isKml).toBe(true);
    expect(result.current.canImport).toBe(true);
  });

  it('FE-PLANNER-FILEIMPHOOK-002: an oversized file is refused with the size limit, an empty pick changes nothing', () => {
    const { result } = setup();
    choose(result, [oversized()]);
    expect(result.current.files).toEqual([]);
    expect(result.current.error).toBe('places.importFileTooLarge:10');
    choose(result, []);
    expect(result.current.error).toBe('places.importFileTooLarge:10');
  });

  it('FE-PLANNER-FILEIMPHOOK-003: unticking every kind of content blocks the import, re-ticking lifts it', () => {
    const { result } = setup();
    choose(result, [gpx(), kml()]);
    act(() => {
      result.current.toggleGpxOpt('waypoints');
      result.current.toggleGpxOpt('routes');
      result.current.toggleGpxOpt('tracks');
    });
    expect(result.current.gpxOpts).toEqual({ waypoints: false, routes: false, tracks: false });
    expect(result.current.gpxNoneSelected).toBe(true);
    expect(result.current.canImport).toBe(false);
    act(() => result.current.toggleGpxOpt('routes'));
    expect(result.current.canImport).toBe(true);
    act(() => {
      result.current.toggleKmlOpt('points');
      result.current.toggleKmlOpt('paths');
    });
    expect(result.current.kmlNoneSelected).toBe(true);
    expect(result.current.canImport).toBe(false);
  });

  it('FE-PLANNER-FILEIMPHOOK-004: dragging lights the zone, leaving it from a child does not, a drop selects', () => {
    const { result } = setup({ variant: 'dialog' });
    const preventDefault = vi.fn();
    act(() => result.current.handleDragOver({ preventDefault } as unknown as React.DragEvent));
    expect(result.current.isDragOver).toBe(true);
    const zone = {};
    act(() => result.current.handleDragLeave({ target: {}, currentTarget: zone } as unknown as React.DragEvent));
    expect(result.current.isDragOver).toBe(true);
    act(() => result.current.handleDragLeave({ target: zone, currentTarget: zone } as unknown as React.DragEvent));
    expect(result.current.isDragOver).toBe(false);

    act(() => result.current.handleDragOver({ preventDefault } as unknown as React.DragEvent));
    act(() =>
      result.current.handleDrop({
        preventDefault,
        dataTransfer: { files: [gpx('dropped.gpx')] },
      } as unknown as React.DragEvent)
    );
    expect(result.current.isDragOver).toBe(false);
    expect(result.current.files.map((f) => f.name)).toEqual(['dropped.gpx']);
    expect(preventDefault).toHaveBeenCalledTimes(3);
  });
});

describe('usePlacesFileImport: the desktop dialog opening', () => {
  it('FE-PLANNER-FILEIMPHOOK-005: an opening takes the dropped file, or refuses it, and starts clean otherwise', () => {
    const { result, rerender } = setup({ variant: 'dialog', open: false, initialFile: gpx('dropped.gpx') });
    expect(result.current.files).toEqual([]);

    rerender({ open: true, initialFile: gpx('dropped.gpx') });
    expect(result.current.files.map((f) => f.name)).toEqual(['dropped.gpx']);
    expect(result.current.error).toBe('');

    rerender({ open: true, initialFile: new File(['x'], 'photo.jpg') });
    expect(result.current.files).toEqual([]);
    expect(result.current.error).toBe('places.importFileUnsupported');

    rerender({ open: true, initialFile: null });
    expect(result.current.files).toEqual([]);
    expect(result.current.error).toBe('');
  });

  it('FE-PLANNER-FILEIMPHOOK-006: without an opening flag (the phone) nothing is preloaded', () => {
    const { result } = setup({ variant: 'sheet', initialFile: gpx() });
    expect(result.current.files).toEqual([]);
  });

  it('FE-PLANNER-FILEIMPHOOK-007: close resets the dialog and calls onDone', () => {
    const { result, onDone } = setup({ variant: 'dialog' });
    choose(result, [gpx()]);
    act(() => result.current.close());
    expect(result.current.files).toEqual([]);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('usePlacesFileImport: importing', () => {
  it('FE-PLANNER-FILEIMPHOOK-008: a GPX import sends the ticked kinds, reloads, toasts, offers the undo and finishes', async () => {
    const importGpx = vi
      .spyOn(placesApi, 'importGpx')
      .mockResolvedValue({ count: 2, skipped: 0, places: [{ id: 21 }, { id: 22 }] });
    const bulkDelete = vi.spyOn(placesApi, 'bulkDelete').mockRejectedValue(new Error('gone'));
    const { result, toast, loadTrip, pushUndo, onDone } = setup();
    const file = gpx();
    choose(result, [file]);
    act(() => result.current.toggleGpxOpt('routes'));

    await runImport(result);

    expect(importGpx).toHaveBeenCalledWith(3, file, { waypoints: true, routes: false, tracks: true, enrich: false });
    expect(loadTrip).toHaveBeenCalledWith(3);
    expect(toast.success).toHaveBeenCalledWith('places.gpxImported:2');
    expect(pushUndo).toHaveBeenCalledWith('undo.importGpx', expect.any(Function));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);

    await pushUndo.mock.calls[0][1]();
    expect(bulkDelete).toHaveBeenCalledWith(3, [21, 22]);
    expect(loadTrip).toHaveBeenCalledTimes(2);
  });

  it('FE-PLANNER-FILEIMPHOOK-009: enrichment goes out only when asked for and a maps key exists', async () => {
    seedStore(useAuthStore, { hasMapsKey: true });
    const importMapFile = vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 1, places: [] });
    const { result } = setup();
    expect(result.current.canEnrich).toBe(true);
    const file = kml();
    choose(result, [file]);
    act(() => result.current.setEnrich(true));
    await runImport(result);
    expect(importMapFile).toHaveBeenCalledWith(3, file, { points: true, paths: true, enrich: true });
  });

  it('FE-PLANNER-FILEIMPHOOK-010: the phone counts a mixed selection per format and names the undo for both', async () => {
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 2, places: [{ id: 31 }, { id: 32 }] });
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 1, skipped: 0, places: [{ id: 21 }] });
    const bulkDelete = vi.spyOn(placesApi, 'bulkDelete').mockResolvedValue({ deleted: 3 });
    const { result, toast, pushUndo, onDone } = setup({ variant: 'sheet' });
    choose(result, [kml(), gpx()]);

    await runImport(result);

    expect(toast.success).toHaveBeenCalledWith('places.gpxImported:1');
    expect(toast.success).toHaveBeenCalledWith('places.kmlKmzImported:2');
    expect(pushUndo).toHaveBeenCalledWith('undo.importFiles', expect.any(Function));
    await pushUndo.mock.calls[0][1]();
    // GPX ids first, whatever order the files came in.
    expect(bulkDelete).toHaveBeenCalledWith(3, [21, 31, 32]);
    expect(onDone).toHaveBeenCalledTimes(1);
    // The phone hands back without resetting: its sheet fades out with the files still shown.
    expect(result.current.files).toHaveLength(2);
  });

  it('FE-PLANNER-FILEIMPHOOK-011: the dialog counts a mixed selection as one and resets before it closes', async () => {
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 2, places: [{ id: 31 }, { id: 32 }] });
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 1, skipped: 0, places: [{ id: 21 }] });
    const bulkDelete = vi.spyOn(placesApi, 'bulkDelete').mockResolvedValue({ deleted: 3 });
    const { result, toast, pushUndo, onDone } = setup({ variant: 'dialog' });
    choose(result, [kml(), gpx()]);

    await runImport(result);

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('places.gpxImported:3');
    expect(pushUndo).toHaveBeenCalledWith('undo.importKeyholeMarkup', expect.any(Function));
    await pushUndo.mock.calls[0][1]();
    // In the order the files were sent.
    expect(bulkDelete).toHaveBeenCalledWith(3, [31, 32, 21]);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.files).toEqual([]);
  });

  it('FE-PLANNER-FILEIMPHOOK-012: the dialog names a KML-only import by its own key', async () => {
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 4, places: [{ id: 1 }] });
    const { result, toast, pushUndo } = setup({ variant: 'dialog' });
    choose(result, [kml()]);
    await runImport(result);
    expect(toast.success).toHaveBeenCalledWith('places.kmlKmzImported:4');
    expect(pushUndo).toHaveBeenCalledWith('undo.importKeyholeMarkup', expect.any(Function));
  });

  it('FE-PLANNER-FILEIMPHOOK-013: a KML summary is merged across files and keeps the import open', async () => {
    vi.spyOn(placesApi, 'importMapFile')
      .mockResolvedValueOnce({ count: 2, places: [], summary: summary({ warnings: ['a'] }) })
      .mockResolvedValueOnce({
        count: 1,
        places: [],
        summary: summary({ total: 2, created: 1, skipped: 1, warnings: ['b'] }),
      });
    const { result, onDone } = setup({ variant: 'dialog' });
    choose(result, [kml('a.kml'), kml('b.kml')]);
    await runImport(result);
    expect(result.current.summary).toEqual({
      totalPlacemarks: 5,
      createdCount: 3,
      skippedCount: 2,
      warnings: ['a', 'b'],
      errors: [],
    });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-FILEIMPHOOK-014: a KML answer without a summary counts its skips on the phone only', async () => {
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 0, skipped: 3, places: [] });

    const sheet = setup({ variant: 'sheet' });
    choose(sheet.result, [kml()]);
    await runImport(sheet.result);
    expect(sheet.toast.warning).toHaveBeenCalledWith('places.importAllSkipped');
    sheet.unmount();

    const dialog = setup({ variant: 'dialog' });
    choose(dialog.result, [kml()]);
    await runImport(dialog.result);
    expect(dialog.toast.warning).not.toHaveBeenCalled();
    expect(dialog.onDone).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-FILEIMPHOOK-015: an all-skipped GPX import warns on both and offers no undo', async () => {
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 0, skipped: 2, places: [] });
    for (const variant of ['dialog', 'sheet'] as const) {
      const { result, toast, pushUndo, unmount } = setup({ variant });
      choose(result, [gpx()]);
      await runImport(result);
      expect(toast.warning).toHaveBeenCalledWith('places.importAllSkipped');
      expect(toast.success).not.toHaveBeenCalled();
      expect(pushUndo).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('FE-PLANNER-FILEIMPHOOK-016: a failing file shows its error, prefixed by name when there are several, and stays open', async () => {
    vi.spyOn(placesApi, 'importGpx').mockRejectedValue({ response: { data: { error: 'Broken GPX' } } });
    vi.spyOn(placesApi, 'importMapFile').mockRejectedValue(new Error('network'));
    const single = setup({ variant: 'dialog' });
    choose(single.result, [gpx()]);
    await runImport(single.result);
    expect(single.result.current.error).toBe('Broken GPX');
    expect(single.toast.error).toHaveBeenCalledWith('Broken GPX');
    expect(single.onDone).not.toHaveBeenCalled();
    expect(single.result.current.loading).toBe(false);
    single.unmount();

    const several = setup({ variant: 'sheet' });
    choose(several.result, [gpx('a.gpx'), kml('b.kml')]);
    await runImport(several.result);
    expect(several.result.current.error).toBe('a.gpx: Broken GPX\nb.kml: places.importFileError');
    expect(several.toast.error).toHaveBeenCalledWith('a.gpx: Broken GPX');
    expect(several.toast.warning).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-FILEIMPHOOK-017: a pick of nothing usable keeps the summary in the dialog and clears it on the phone', async () => {
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 2, places: [], summary: summary() });
    for (const variant of ['dialog', 'sheet'] as const) {
      const { result, unmount } = setup({ variant });
      choose(result, [kml()]);
      await runImport(result);
      expect(result.current.summary).not.toBeNull();
      choose(result, [new File(['x'], 'notes.txt')]);
      expect(result.current.files).toEqual([]);
      expect(result.current.error).toBe('places.importFileUnsupported');
      if (variant === 'dialog') expect(result.current.summary).not.toBeNull();
      else expect(result.current.summary).toBeNull();
      unmount();
    }
  });

  it('FE-PLANNER-FILEIMPHOOK-018: a second import while one runs, or one with no file, is refused', async () => {
    let release: (value: unknown) => void = () => {};
    const importGpx = vi.spyOn(placesApi, 'importGpx').mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    const { result, loadTrip } = setup();
    await runImport(result);
    expect(importGpx).not.toHaveBeenCalled();
    expect(loadTrip).not.toHaveBeenCalled();

    choose(result, [gpx()]);
    let first!: Promise<void>;
    act(() => {
      first = result.current.handleImport();
    });
    expect(result.current.loading).toBe(true);
    await runImport(result);
    expect(importGpx).toHaveBeenCalledTimes(1);

    await act(async () => {
      release({ count: 1, skipped: 0, places: [] });
      await first;
    });
    expect(result.current.loading).toBe(false);
  });
});
