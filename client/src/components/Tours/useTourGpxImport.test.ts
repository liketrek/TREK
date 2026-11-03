// The Tours file preview's handling of a file without a line: named in a toast by
// default, handed on when the caller takes such files (the places column does).
// Without a translation provider `t` echoes its key.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { placesApi } from '../../api/client';
import { tourRepo } from '../../repo/tourRepo';
import { useTripStore } from '../../store/tripStore';
import { useTourGpxImport } from './useTourGpxImport';

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
const file = new File(['<kml/>'], 'cafes.kml');

beforeEach(() => {
  resetAllStores();
  addToast.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTourGpxImport without a line in the file', () => {
  it('names the file in a toast when nothing takes such files', async () => {
    vi.spyOn(tourRepo, 'previewGpx').mockRejectedValue({ response: { data: { code: 'no_track' } } });
    const { result } = renderHook(() => useTourGpxImport({ tripId: 2, canEdit: true }));
    await act(() => result.current.importFiles([file]));
    expect(addToast).toHaveBeenCalledWith('tours.import.noTrackIn', 'error', undefined);
    expect(result.current.preview).toBeNull();
  });

  it('reads a GPX answer by its message as well', async () => {
    const onNoTrack = vi.fn();
    vi.spyOn(tourRepo, 'previewGpx').mockRejectedValue({
      response: { data: { error: 'No track or route found in GPX file' } },
    });
    const { result } = renderHook(() => useTourGpxImport({ tripId: 2, canEdit: true, onNoTrack }));
    await act(() => result.current.importFiles([file]));
    expect(onNoTrack).toHaveBeenCalledWith([file]);
    expect(addToast).not.toHaveBeenCalled();
  });

  it('hands such files on, once, and still names any other failure', async () => {
    const onNoTrack = vi.fn();
    const broken = new File(['?'], 'broken.gpx');
    vi.spyOn(tourRepo, 'previewGpx').mockImplementation(async (_tripId, picked) => {
      throw picked === broken
        ? { response: { data: { code: 'malformed' } } }
        : { response: { data: { code: 'no_track' } } };
    });
    const { result } = renderHook(() => useTourGpxImport({ tripId: 2, canEdit: true, onNoTrack }));
    await act(() => result.current.importFiles([file, broken]));
    expect(onNoTrack).toHaveBeenCalledTimes(1);
    expect(onNoTrack).toHaveBeenCalledWith([file]);
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith('tours.import.unreadableIn', 'error', undefined);
  });
});

describe('useTourGpxImport with points beside the lines (#2969)', () => {
  const route = new File(['<gpx/>'], 'sygic.gpx');
  const pins = new File(['<kml/>'], 'pins.kml');
  const line = {
    name: 'Route',
    geometry: [[47, 11] as [number, number], [47.01, 11] as [number, number]],
    point_count: 2,
    distance_km: 1,
    elevation_gain_m: null,
    elevation_loss_m: null,
    duplicate: false,
  };

  beforeEach(() => {
    useTripStore.setState({ refreshPlaces: vi.fn(async () => {}) } as never);
    vi.spyOn(tourRepo, 'importGpx').mockResolvedValue({ tours: [], skipped: 0, caution: false } as never);
  });

  const previewed = async (preview: (picked: File) => object) => {
    vi.spyOn(tourRepo, 'previewGpx').mockImplementation(async (_tripId, picked) => preview(picked as File) as never);
    const hook = renderHook(() => useTourGpxImport({ tripId: 2, canEdit: true }));
    await act(() => hook.result.current.importFiles([route, pins]));
    return hook;
  };

  it('adds the points of each file as places through the places import, waypoints only', async () => {
    const importGpx = vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 3 });
    const importMap = vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 2 });
    const { result } = await previewed((picked) => ({
      tracks: [line],
      left_out: { points: picked === route ? 3 : 2, areas: 0, other: 0 },
    }));
    await act(() => result.current.confirm({ tour_type: 'hike' }, { points: true }));
    expect(importGpx).toHaveBeenCalledWith(2, route, { waypoints: true, routes: false, tracks: false });
    expect(importMap).toHaveBeenCalledWith(2, pins, { points: true, paths: false });
    expect(tourRepo.importGpx).toHaveBeenCalledTimes(2);
    expect(addToast).toHaveBeenCalledWith('tours.import.pointsImported', 'success', undefined);
  });

  it('leaves the points out when they are not asked for, and skips the Tours import for a file of known lines', async () => {
    const importGpx = vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 3 });
    const { result } = await previewed(() => ({
      tracks: [{ ...line, duplicate: true }],
      left_out: { points: 3, areas: 0, other: 0 },
    }));
    await act(() => result.current.confirm({ tour_type: 'hike' }));
    expect(importGpx).not.toHaveBeenCalled();
    expect(tourRepo.importGpx).not.toHaveBeenCalled();
  });

  it('names a file whose points could not be added, and still takes in its tour', async () => {
    vi.spyOn(placesApi, 'importGpx').mockRejectedValue(new Error('offline'));
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 0 });
    const { result } = await previewed((picked) => ({
      tracks: [line],
      ...(picked === route ? { left_out: { points: 1, areas: 0, other: 0 } } : {}),
    }));
    await act(() => result.current.confirm({ tour_type: 'hike' }, { points: true }));
    expect(addToast).toHaveBeenCalledWith('tours.import.pointsFailedIn', 'error', undefined);
    expect(tourRepo.importGpx).toHaveBeenCalledTimes(2);
  });
});
