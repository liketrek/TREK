// FE-JRN-ENTRYFORM-001 to FE-JRN-ENTRYFORM-021: the journey entry form logic behind both
// the desktop editor dialog and the phone entry sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { journeyApi, mapsApi, weatherApi } from '../../api/client';
import { getCurrentPositionOnce } from '../../hooks/useGeolocation';
import type { GalleryPhoto, JourneyEntry, JourneyPhoto } from '../../store/journeyStore';
import { useJourneyEntryForm, type JourneyEntryFormOptions } from './useJourneyEntryForm';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (k: string, p?: Record<string, unknown>) => (p ? `${k}:${JSON.stringify(p)}` : k),
    language: 'en',
  }),
}));
vi.mock('../../hooks/usePlaceLanguage', () => ({ usePlaceLanguage: () => 'en' }));
vi.mock('../../hooks/useGeolocation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../hooks/useGeolocation')>()),
  getCurrentPositionOnce: vi.fn(),
}));
vi.mock('../../utils/convertHeic', () => ({ normalizeImageFiles: (files: File[]) => Promise.resolve([...files]) }));
vi.mock('./useJourneyTripSuggestion', () => ({
  useJourneyTripSuggestion: () => ({ trip: null, link: vi.fn(), linking: false, dismiss: vi.fn() }),
}));
vi.mock('./useEntryPhotoOrder', () => ({ useEntryPhotoOrder: () => ({ makeFirst: vi.fn() }) }));

const locate = getCurrentPositionOnce as unknown as Mock;
let addToast: Mock<NonNullable<Window['__addToast']>>;

function entry(over: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 4,
    journey_id: 3,
    title: 'Colosseum',
    story: 'Old stones',
    entry_date: '2026-05-01',
    entry_time: '10:30:00',
    location_name: 'Rome',
    location_lat: 41.89,
    location_lng: 12.49,
    mood: 'good',
    weather: 'sunny',
    tags: ['rome'],
    pros_cons: { pros: ['Big'], cons: [] },
    photos: [],
    ...over,
  } as JourneyEntry;
}

function setup(over: Partial<JourneyEntryFormOptions> = {}) {
  const props: JourneyEntryFormOptions = {
    entry: entry(),
    journeyId: 3,
    trips: [],
    galleryPhotos: [],
    onSave: vi.fn().mockResolvedValue(4),
    onUploadPhotos: vi.fn().mockResolvedValue({ ok: [], failed: [] }),
    onDone: vi.fn(),
    ...over,
  };
  const hook = renderHook((p: JourneyEntryFormOptions) => useJourneyEntryForm(p), { initialProps: props });
  return { ...hook, props };
}

const photo = (id: number, over: Record<string, unknown> = {}) =>
  ({ id, photo_id: id, ...over }) as unknown as JourneyPhoto;

beforeEach(() => {
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  locate.mockReset();
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
});

const { createObjectURL, revokeObjectURL } = URL;

afterEach(() => {
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('useJourneyEntryForm', () => {
  it('FE-JRN-ENTRYFORM-001: seeds every field from the entry', () => {
    const { result } = setup();
    expect(result.current.title).toBe('Colosseum');
    expect(result.current.entryTime).toBe('10:30');
    expect(result.current.locationLat).toBe(41.89);
    expect(result.current.pros).toEqual(['Big']);
    expect(result.current.cons).toEqual([]);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.offersStatsToggle).toBe(true);
    expect(result.current.contextLocation).toEqual({ lat: 41.89, lng: 12.49, name: 'Rome' });
  });

  it('FE-JRN-ENTRYFORM-002: the desktop dialog starts an empty verdict list with one blank row', () => {
    const { result } = setup({ blankVerdictRow: true });
    expect(result.current.pros).toEqual(['Big']);
    expect(result.current.cons).toEqual(['']);
    expect(result.current.isDirty).toBe(false);
  });

  it('FE-JRN-ENTRYFORM-003: a moved point is dirty only for the desktop dialog, tags only for the sheet', () => {
    const desktop = setup({ dirtyOnCoordinates: true });
    act(() => desktop.result.current.pickLocation({ name: 'Rome', lat: 1, lng: 2 }));
    expect(desktop.result.current.isDirty).toBe(true);
    const sheet = setup();
    act(() => sheet.result.current.pickLocation({ name: 'Rome', lat: 1, lng: 2 }));
    expect(sheet.result.current.isDirty).toBe(false);

    act(() => sheet.result.current.setTags(['rome', 'food']));
    expect(sheet.result.current.isDirty).toBe(false);
    const tagged = setup({ withTags: true });
    act(() => tagged.result.current.setTags(['rome', 'food']));
    expect(tagged.result.current.isDirty).toBe(true);
  });

  it('FE-JRN-ENTRYFORM-004: saves the fields, with tags only for the sheet, and turns a suggestion into an entry', async () => {
    const plain = setup({ entry: entry({ type: 'skeleton' } as Partial<JourneyEntry>) });
    await act(() => plain.result.current.handleSave());
    expect(plain.props.onSave).toHaveBeenCalledWith(
      {
        title: 'Colosseum',
        story: 'Old stones',
        entry_date: '2026-05-01',
        entry_time: '10:30',
        location_name: 'Rome',
        location_lat: 41.89,
        location_lng: 12.49,
        stats_excluded: false,
        is_draft: false,
        mood: 'good',
        weather: 'sunny',
        pros_cons: { pros: ['Big'], cons: [] },
        type: 'entry',
      },
      4
    );
    expect(plain.props.onDone).toHaveBeenCalledTimes(1);

    const tagged = setup({ withTags: true });
    act(() => tagged.result.current.setTags(['rome', ' ']));
    await act(() => tagged.result.current.handleSave());
    expect((tagged.props.onSave as Mock).mock.calls[0][0]).toMatchObject({ tags: ['rome'], type: undefined });
  });

  it('FE-JRN-ENTRYFORM-005: a new entry keeps the id its first save created for the retry', async () => {
    const onSave = vi.fn().mockResolvedValue(77);
    const onAddProviderPhotos = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
    const { result, props } = setup({ entry: entry({ id: 0 }), onSave, onAddProviderPhotos });
    act(() => result.current.setPendingProviderGroups([{ provider: 'immich', assetIds: ['a'] } as never]));
    await act(() => result.current.handleSave());
    expect(onSave).toHaveBeenLastCalledWith(expect.any(Object), undefined);
    expect(addToast).toHaveBeenCalledWith(
      'journey.editor.externalPhotosPartialFailed:{"failed":"1","total":"1"}',
      'error',
      undefined
    );
    expect(props.onDone).not.toHaveBeenCalled();
    expect(result.current.pendingProviderGroups).toHaveLength(1);

    await act(() => result.current.handleSave());
    expect(onSave).toHaveBeenLastCalledWith(expect.any(Object), 77);
    expect(result.current.pendingProviderGroups).toEqual([]);
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-ENTRYFORM-006: uploads the queued files after the save and keeps the failed ones', async () => {
    const a = new File(['a'], 'a.jpg');
    const b = new File(['b'], 'b.jpg');
    const onUploadPhotos = vi.fn(
      async (_id: number, _files: File[], cbs?: { onProgress?: (p: { done: number; total: number }) => void }) => {
        cbs?.onProgress?.({ done: 1, total: 2 });
        return { ok: [], failed: [b] };
      }
    );
    const { result } = setup({
      onUploadPhotos: onUploadPhotos as unknown as JourneyEntryFormOptions['onUploadPhotos'],
    });
    await act(() =>
      result.current.handleFileChange({ target: { files: [a, b] } } as unknown as React.ChangeEvent<HTMLInputElement>)
    );
    expect(result.current.pendingFiles).toEqual([a, b]);
    expect(result.current.pendingPreviews).toEqual(['blob:x', 'blob:x']);
    await act(() => result.current.handleSave());
    expect(onUploadPhotos.mock.calls[0][1]).toEqual([a, b]);
    expect(result.current.pendingFiles).toEqual([b]);
    expect(result.current.uploadProgress).toBeNull();
    expect(addToast).toHaveBeenCalledWith(
      'journey.editor.uploadPartialFailed:{"failed":"1","total":"2"}',
      'error',
      undefined
    );
  });

  it('FE-JRN-ENTRYFORM-007: a failed save toasts for the desktop dialog and the sheet alike', async () => {
    const onSave = vi.fn().mockRejectedValue({ response: { data: { error: 'Locked' } } });
    const desktop = setup({ onSave, blankVerdictRow: true, dirtyOnCoordinates: true });
    await act(() => desktop.result.current.handleSave());
    expect(addToast).toHaveBeenCalledWith('Locked', 'error', undefined);
    expect(desktop.result.current.saving).toBe(false);

    const sheet = setup({ onSave });
    let rejected = false;
    await act(() => sheet.result.current.handleSave().catch(() => void (rejected = true)));
    expect(rejected).toBe(false);
    expect(sheet.result.current.saving).toBe(false);
    expect(addToast).toHaveBeenCalledTimes(2);
  });

  it('FE-JRN-ENTRYFORM-008: links gallery photos picked before the first save', async () => {
    const link = vi.spyOn(journeyApi, 'linkPhoto').mockResolvedValue({});
    const gp = photo(9) as unknown as GalleryPhoto;
    const { result } = setup({ entry: entry({ id: 0 }), galleryPhotos: [gp] });
    expect(result.current.availableGalleryPhotos).toEqual([gp]);
    await act(() => result.current.pickGalleryPhoto(gp));
    expect(link).not.toHaveBeenCalled();
    expect(result.current.availableGalleryPhotos).toEqual([]);
    await act(() => result.current.handleSave());
    expect(link).toHaveBeenCalledWith(4, 9);
  });

  it('FE-JRN-ENTRYFORM-009: a saved entry links and unlinks gallery photos at once', async () => {
    const link = vi.spyOn(journeyApi, 'linkPhoto').mockResolvedValue(photo(20));
    const unlink = vi.spyOn(journeyApi, 'unlinkPhoto').mockResolvedValue({});
    const { result } = setup();
    await act(() => result.current.pickGalleryPhoto(photo(9) as unknown as GalleryPhoto));
    expect(link).toHaveBeenCalledWith(4, 9);
    expect(result.current.photos.map((p) => p.id)).toEqual([20]);
    await act(() => result.current.removePhoto(photo(20)));
    expect(unlink).toHaveBeenCalledWith(4, 20);
    expect(result.current.photos).toEqual([]);
  });

  it('FE-JRN-ENTRYFORM-010: knows which provider assets are already on the entry or queued', () => {
    const { result } = setup({
      entry: entry({
        photos: [photo(1, { provider: 'immich', asset_id: 'a' }), photo(2, { provider: 'synology', asset_id: 'b' })],
      }),
    });
    act(() => result.current.setPendingProviderGroups([{ provider: 'immich', assetIds: ['c', 'd'] } as never]));
    expect([...result.current.providerAssetIds('immich')].sort()).toEqual(['a', 'c', 'd']);
    expect(result.current.providerAssetIds(null).size).toBe(0);
    expect(result.current.queuedProviderPhotos).toBe(2);
  });

  it('FE-JRN-ENTRYFORM-011: Enter in a verdict row opens the next one below it and hands it the caret', () => {
    const { result, rerender, props } = setup({ entry: entry({ pros_cons: { pros: ['A', 'B'], cons: [] } }) });
    act(() => result.current.addVerdictRow('pros', 0));
    expect(result.current.pros).toEqual(['A', '', 'B']);
    rerender(props);
    const input = { focus: vi.fn() } as unknown as HTMLInputElement;
    result.current.verdictRowRef('pros-2')(input);
    expect(input.focus).not.toHaveBeenCalled();
    result.current.verdictRowRef('pros-1')(input);
    expect(input.focus).toHaveBeenCalledTimes(1);
    result.current.verdictRowRef('pros-1')(input);
    expect(input.focus).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-ENTRYFORM-012: a tag drops trailing commas and is added once', () => {
    const { result } = setup({ withTags: true });
    act(() => result.current.setTagInput(' food,,, '));
    act(() => result.current.addTag());
    expect(result.current.tags).toEqual(['rome', 'food']);
    expect(result.current.tagInput).toBe('');
    act(() => result.current.setTagInput('food'));
    act(() => result.current.addTag());
    expect(result.current.tags).toEqual(['rome', 'food']);
    act(() => result.current.setTagInput(',,'));
    act(() => result.current.addTag());
    expect(result.current.tagInput).toBe(',,');
  });

  it('FE-JRN-ENTRYFORM-013: the location search waits 400 ms, needs two letters and keeps six results', async () => {
    vi.useFakeTimers();
    const places = Array.from({ length: 8 }, (_, i) => ({ name: `P${i}`, lat: String(i), lng: '1' }));
    const search = vi.spyOn(mapsApi, 'search').mockResolvedValue({ places } as never);
    const { result } = setup();
    act(() => result.current.searchLocation('R'));
    expect(result.current.showLocationResults).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(search).not.toHaveBeenCalled();

    act(() => result.current.searchLocation('Ro'));
    act(() => result.current.searchLocation('Rom'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('Rom', 'en');
    expect(result.current.locationResults).toHaveLength(6);
    expect(result.current.locationResults[1]).toEqual({ name: 'P1', address: undefined, lat: 1, lng: 1 });
    expect(result.current.locationSearching).toBe(false);

    act(() => result.current.pickLocation(result.current.locationResults[1]));
    expect(result.current.locationName).toBe('P1');
    expect(result.current.locationResults).toEqual([]);
    expect(result.current.showLocationResults).toBe(false);
  });

  it('FE-JRN-ENTRYFORM-014: "use my location" fills the point, then the place name', async () => {
    locate.mockResolvedValue({ lat: 1.234567, lng: 2.345678 });
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: 'Here' } as never);
    const { result } = setup();
    await act(() => result.current.handleUseCurrentLocation());
    expect(result.current.locationLat).toBe(1.234567);
    expect(result.current.locationName).toBe('Here');
    expect(result.current.locating).toBe(false);
  });

  it('FE-JRN-ENTRYFORM-015: a refused location shows under the field on the phone and as a toast on desktop', async () => {
    locate.mockRejectedValue(new Error('denied'));
    const sheet = setup({ inlineLocateError: true });
    await act(() => sheet.result.current.handleUseCurrentLocation());
    expect(sheet.result.current.locationError).not.toBe('');
    expect(addToast).not.toHaveBeenCalled();

    const desktop = setup();
    await act(() => desktop.result.current.handleUseCurrentLocation());
    expect(desktop.result.current.locationError).toBe('');
    expect(addToast).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-ENTRYFORM-016: the desktop dialog fills an empty weather from the forecast once per place and day', async () => {
    const get = vi.spyOn(weatherApi, 'get').mockResolvedValue({ main: 'Rain', description: 'light rain' } as never);
    const { result } = setup({ entry: entry({ weather: '' }), autoFillWeather: true });
    await waitFor(() => expect(result.current.weather).toBe('rainy'));
    expect(get).toHaveBeenCalledWith(41.89, 12.49, '2026-05-01', 'en');
    act(() => result.current.setWeather(''));
    expect(get).toHaveBeenCalledTimes(1);

    setup({ entry: entry({ weather: '' }) });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-ENTRYFORM-017: quick capture locates the traveller and names the place and the weather', async () => {
    locate.mockResolvedValue({ lat: 5, lng: 6 });
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: '', address: 'Main St' } as never);
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({ main: 'Clear', description: 'clear sky' } as never);
    const { result } = setup({
      quickCapture: true,
      entry: entry({ id: 0, location_lat: null, location_lng: null, location_name: '', weather: '' }),
    });
    await waitFor(() => expect(result.current.locating).toBe(false));
    expect(result.current.locationLat).toBe(5);
    expect(result.current.locationName).toBe('Main St');
    expect(result.current.weather).toBe('sunny');
  });

  it('FE-JRN-ENTRYFORM-018: quick capture leaves a located entry and a reader alone', () => {
    setup({ quickCapture: true });
    setup({ quickCapture: true, readOnly: true, entry: entry({ location_lat: null, location_lng: null }) });
    expect(locate).not.toHaveBeenCalled();
  });

  it('FE-JRN-ENTRYFORM-019: a quick capture without a position says why', async () => {
    locate.mockRejectedValue(new Error('timeout'));
    const { result } = setup({ quickCapture: true, entry: entry({ location_lat: null, location_lng: null }) });
    await waitFor(() => expect(result.current.locating).toBe(false));
    expect(result.current.locationError).not.toBe('');
  });

  it('FE-JRN-ENTRYFORM-020: no route switch for a new entry or one that never had a point', () => {
    expect(setup({ entry: entry({ id: 0 }) }).result.current.offersStatsToggle).toBe(false);
    expect(setup({ entry: entry({ location_lat: null, location_lng: null }) }).result.current.offersStatsToggle).toBe(
      false
    );
    expect(
      setup({ entry: entry({ location_lat: null, location_lng: null, stats_excluded: true }) }).result.current
        .offersStatsToggle
    ).toBe(true);
  });

  it('FE-JRN-ENTRYFORM-021: a failed save on the phone sheet toasts and keeps the form open', async () => {
    const onSave = vi.fn().mockRejectedValue({ response: { data: { error: 'Locked' } } });
    const onDone = vi.fn();
    const sheet = setup({ onSave, onDone, withTags: true });
    await act(() => sheet.result.current.handleSave());
    expect(addToast).toHaveBeenCalledWith('Locked', 'error', undefined);
    expect(onDone).not.toHaveBeenCalled();
    expect(sheet.result.current.saving).toBe(false);
  });
});
