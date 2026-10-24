// FE-PLANNER-COLIMP-001 to FE-PLANNER-COLIMP-009: where a file picked or dropped on the places
// column goes, for the desktop column and the phone's import sheet alike. Without a
// translation provider `t` echoes its key, so the toasts are asserted by key.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TourGpxPreviewTrack } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { tourRepo } from '../../repo/tourRepo';
import { usePlacesColumnFileImport, type PlacesColumnFileImportOptions } from './usePlacesColumnFileImport';

const gpx = (name = 'ridge.gpx') => new File(['<gpx/>'], name, { type: 'application/gpx+xml' });
const kml = (name = 'cafes.kml') => new File(['<kml/>'], name);
const noTrack = { response: { data: { code: 'no_track' } } };
const track: TourGpxPreviewTrack = {
  name: 'Ridge',
  geometry: [[47.1, 11.2]],
  point_count: 1,
  distance_km: 1.2,
  elevation_gain_m: null,
  elevation_loss_m: null,
  duplicate: false,
};

// The toasts are caught at useToast, so no window global has to be set for them.
const { addToast, toast } = vi.hoisted(() => {
  const addToast = vi.fn((_message: string, _type?: string, _duration?: number) => 0);
  const show = (type: string) => (message: string, duration?: number) => {
    addToast(message, type, duration);
  };
  return {
    addToast,
    toast: { success: show('success'), error: show('error'), warning: show('warning'), info: show('info') },
  };
});
vi.mock('../shared/Toast', () => ({ useToast: () => toast, default: () => toast }));

function setup(over: Partial<PlacesColumnFileImportOptions> = {}) {
  const onToursChanged = vi.fn();
  return {
    onToursChanged,
    ...renderHook(() =>
      usePlacesColumnFileImport({ tripId: 4, toursEnabled: true, canEdit: true, onToursChanged, ...over })
    ),
  };
}

beforeEach(() => {
  resetAllStores();
  addToast.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlacesColumnFileImport with Tours off', () => {
  it('FE-PLANNER-COLIMP-001: a drop opens the places import with its first file, as it always has', () => {
    const preview = vi.spyOn(tourRepo, 'previewGpx');
    const { result } = setup({ toursEnabled: false });
    const first = gpx('a.gpx');
    act(() => result.current.takeFiles([first, gpx('b.gpx')]));
    expect(result.current.placesImportOpen).toBe(true);
    expect(result.current.placesImportFiles).toEqual([first]);
    expect(preview).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-COLIMP-002: the import entry opens the places import with nothing chosen, and closing it clears it', () => {
    const { result } = setup({ toursEnabled: false });
    act(() => result.current.pickFile());
    expect(result.current.placesImportOpen).toBe(true);
    expect(result.current.placesImportFiles).toEqual([]);
    act(() => result.current.closePlacesImport());
    expect(result.current.placesImportOpen).toBe(false);
  });

  it('FE-PLANNER-COLIMP-003: an unsupported file still goes to the places import, which names it there', () => {
    const { result } = setup({ toursEnabled: false });
    const photo = new File(['x'], 'photo.jpg');
    act(() => result.current.takeFiles([photo]));
    expect(result.current.placesImportFiles).toEqual([photo]);
    expect(addToast).not.toHaveBeenCalled();
  });
});

describe('usePlacesColumnFileImport with Tours on', () => {
  it('FE-PLANNER-COLIMP-004: a route file goes into the Tours preview, not the places import', async () => {
    const preview = vi.spyOn(tourRepo, 'previewGpx').mockResolvedValue({ tracks: [track] });
    const { result } = setup();
    const file = gpx();
    act(() => result.current.takeFiles([file]));
    await waitFor(() => expect(result.current.tourImport.preview).not.toBeNull());
    expect(preview).toHaveBeenCalledWith(4, file);
    expect(result.current.tourImport.preview?.[0].file).toBe(file);
    expect(result.current.placesImportOpen).toBe(false);
  });

  it('FE-PLANNER-COLIMP-005: a file neither import reads is named in a toast, and the rest still goes on', async () => {
    const preview = vi.spyOn(tourRepo, 'previewGpx').mockResolvedValue({ tracks: [track] });
    const { result } = setup();
    const file = gpx();
    act(() => result.current.takeFiles([new File(['x'], 'notes.txt'), file]));
    expect(addToast).toHaveBeenCalledWith('places.importFileUnsupported', 'error', undefined);
    await waitFor(() => expect(result.current.tourImport.preview).not.toBeNull());
    expect(preview).toHaveBeenCalledTimes(1);
    expect(preview).toHaveBeenCalledWith(4, file);
  });

  it('FE-PLANNER-COLIMP-006: only unreadable files: one toast, no preview, no places import', () => {
    const preview = vi.spyOn(tourRepo, 'previewGpx');
    const { result } = setup();
    act(() => result.current.takeFiles([new File(['x'], 'photo.jpg')]));
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith('places.importFileUnsupported', 'error', undefined);
    expect(preview).not.toHaveBeenCalled();
    expect(result.current.placesImportOpen).toBe(false);
  });

  it('FE-PLANNER-COLIMP-007: a file of points only opens the places import with it chosen, without a no-track toast', async () => {
    vi.spyOn(tourRepo, 'previewGpx').mockRejectedValue(noTrack);
    const { result } = setup();
    const points = kml();
    act(() => result.current.takeFiles([points]));
    await waitFor(() => expect(result.current.placesImportOpen).toBe(true));
    expect(result.current.placesImportFiles).toEqual([points]);
    expect(result.current.tourImport.preview).toBeNull();
    expect(addToast).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-COLIMP-008: in a mixed drop the points wait until the Tours preview is closed', async () => {
    const route = gpx();
    const points = kml();
    vi.spyOn(tourRepo, 'previewGpx').mockImplementation(async (_tripId, file) => {
      if (file === points) throw noTrack;
      return { tracks: [track] };
    });
    const { result } = setup();
    act(() => result.current.takeFiles([route, points]));
    await waitFor(() => expect(result.current.tourImport.preview).not.toBeNull());
    expect(result.current.tourImport.preview?.map((entry) => entry.file)).toEqual([route]);
    expect(result.current.placesImportOpen).toBe(false);
    act(() => result.current.tourImport.cancel());
    expect(result.current.placesImportOpen).toBe(true);
    expect(result.current.placesImportFiles).toEqual([points]);
  });

  it('FE-PLANNER-COLIMP-009: the import entry opens the Tours file picker; without the right to edit nothing opens', () => {
    const picked: HTMLInputElement[] = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      picked.push(this);
    });
    const preview = vi.spyOn(tourRepo, 'previewGpx');
    const { result } = setup();
    act(() => result.current.pickFile());
    expect(picked.map((input) => [input.accept, input.multiple])).toEqual([['.gpx,.kml,.kmz', true]]);
    expect(result.current.placesImportOpen).toBe(false);

    const readOnly = setup({ canEdit: false });
    act(() => readOnly.result.current.pickFile());
    act(() => readOnly.result.current.takeFiles([gpx()]));
    expect(picked).toHaveLength(1);
    expect(preview).not.toHaveBeenCalled();
    expect(readOnly.result.current.placesImportOpen).toBe(false);
  });
});
