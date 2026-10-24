// The Tours file preview's handling of a file without a line: named in a toast by
// default, handed on when the caller takes such files (the places column does).
// Without a translation provider `t` echoes its key.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { tourRepo } from '../../repo/tourRepo';
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
