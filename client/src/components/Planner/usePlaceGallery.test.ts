// FE-PLANNER-PLGALLERY-001 to FE-PLANNER-PLGALLERY-011: the pictures of one place for the
// view's full screen gallery: its own picture first, the sources' photos asked for on
// open, the shared session cache, and an answer that comes back for a place already left.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { MapsPlaceEnrichmentResult, PlacePhotoCandidate } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPlace } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import type { Place } from '../../types';
import { __clearEnrichmentCacheForTests, readCachedEnrichment, storeEnrichment } from './placeEnrichment';
import { usePlaceGallery } from './usePlaceGallery';

const placeEnrichment = vi.fn();
vi.mock('../../repo/placePictureRepo', () => ({
  placePictureRepo: { enrichment: (...a: unknown[]) => placeEnrichment(...a) },
}));
// One toast for every render, the way the real hook memoises it.
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const CUSTOM = '/uploads/places/own.jpg';

const PHOTO: PlacePhotoCandidate = {
  key: 'gp~p0',
  url: '/api/maps/place-photo/gp~p0/bytes',
  attribution: 'Alice',
  license: 'CC BY 4.0',
  licenseUrl: null,
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg',
  source: 'wikimedia',
} as PlacePhotoCandidate;

const GOOGLE: PlacePhotoCandidate = {
  key: 'gp~p1',
  url: '/api/maps/place-photo/gp~p1/bytes',
  attribution: null,
  license: null,
  licenseUrl: null,
  sourceUrl: null,
  source: 'google',
} as PlacePhotoCandidate;

const result = (photos: PlacePhotoCandidate[]) =>
  ({ photos, facts: [], description: null }) as unknown as MapsPlaceEnrichmentResult;

const LAKE = buildPlace({ id: 1, name: 'Lake', lat: 47.5, lng: 11.2, google_place_id: 'gp-lake' });
const CASTLE = buildPlace({ id: 2, name: 'Castle', lat: 48.1, lng: 11.6, osm_id: 'way:2' });

function deferred<T>() {
  let resolve: (v: T) => void = () => {};
  let reject: (e: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(place: Place, language = 'de') {
  return renderHook(({ p, lang }) => usePlaceGallery(p, lang), { initialProps: { p: place, lang: language } });
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { placesEnrichEnabled: true });
  placeEnrichment.mockReset();
  placeEnrichment.mockResolvedValue(result([PHOTO]));
  sessionStorage.clear();
  __clearEnrichmentCacheForTests();
  Object.values(toast).forEach((fn) => fn.mockClear());
});

describe('usePlaceGallery', () => {
  it('FE-PLANNER-PLGALLERY-001: it can open with a picture of its own, or with coordinates the sources can be asked about', () => {
    expect(setup({ ...LAKE, image_url: CUSTOM }).result.current.canOpen).toBe(true);
    expect(setup(LAKE).result.current.canOpen).toBe(true);
    expect(setup({ ...LAKE, lat: null, lng: null } as unknown as Place).result.current.canOpen).toBe(false);
    expect(setup({ ...LAKE, lat: 'north' as unknown as number }).result.current.canOpen).toBe(false);

    seedStore(useAuthStore, { placesEnrichEnabled: false });
    expect(setup(LAKE).result.current.canOpen).toBe(false);
    expect(setup({ ...LAKE, image_url: CUSTOM }).result.current.canOpen).toBe(true);
  });

  it('FE-PLANNER-PLGALLERY-002: with the sources switched off its own picture opens at once, alone', () => {
    seedStore(useAuthStore, { placesEnrichEnabled: false });
    const { result: r } = setup({ ...LAKE, image_url: CUSTOM });
    expect(r.current.photos).toEqual([{ id: 'custom', src: CUSTOM, caption: null, captionHref: null }]);

    act(() => r.current.open());
    expect(r.current.isOpen).toBe(true);
    expect(placeEnrichment).not.toHaveBeenCalled();
    act(() => r.current.close());
    expect(r.current.isOpen).toBe(false);
  });

  it('FE-PLANNER-PLGALLERY-003: nothing of its own and nobody to ask says so instead of opening', () => {
    seedStore(useAuthStore, { placesEnrichEnabled: false });
    const { result: r } = setup(LAKE);
    act(() => r.current.open());
    expect(r.current.isOpen).toBe(false);
    expect(toast.info).toHaveBeenCalledWith('places.details.noPhotos');
  });

  it('FE-PLANNER-PLGALLERY-004: the sources are asked on open, and their photos join with a linked credit', async () => {
    const pending = deferred<MapsPlaceEnrichmentResult>();
    placeEnrichment.mockReturnValue(pending.promise);
    const { result: r } = setup(LAKE);
    expect(placeEnrichment).not.toHaveBeenCalled();

    act(() => r.current.open());
    expect(r.current.loading).toBe(true);
    expect(r.current.isOpen).toBe(false);
    expect(placeEnrichment).toHaveBeenCalledWith({
      placeId: 'gp-lake',
      lat: 47.5,
      lng: 11.2,
      name: 'Lake',
      lang: 'de',
    });

    await act(async () => pending.resolve(result([PHOTO, GOOGLE])));
    expect(r.current.loading).toBe(false);
    expect(r.current.isOpen).toBe(true);
    expect(r.current.photos).toEqual([
      { id: 'gp~p0', src: PHOTO.url, caption: 'Alice, CC BY 4.0', captionHref: PHOTO.sourceUrl },
      { id: 'gp~p1', src: GOOGLE.url, caption: 'Google', captionHref: null },
    ]);
    // Kept for the editor's details column and the next open.
    expect(readCachedEnrichment({ placeId: 'gp-lake', lat: 47.5, lng: 11.2, name: 'Lake' }, 'de')).toBeTruthy();
  });

  it('FE-PLANNER-PLGALLERY-005: a second open uses the answer it already has', async () => {
    const { result: r } = setup(LAKE);
    act(() => r.current.open());
    await waitFor(() => expect(r.current.isOpen).toBe(true));
    act(() => r.current.close());

    act(() => r.current.open());
    expect(r.current.isOpen).toBe(true);
    expect(placeEnrichment).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLGALLERY-006: its own picture leads, and a source photo of the same picture is not shown twice', async () => {
    placeEnrichment.mockResolvedValue(result([PHOTO, GOOGLE]));
    const { result: r } = setup({ ...LAKE, image_url: PHOTO.url });
    act(() => r.current.open());
    // Open at once on its own picture, while the sources are still asked.
    expect(r.current.isOpen).toBe(true);
    expect(r.current.loading).toBe(true);
    await waitFor(() => expect(r.current.loading).toBe(false));
    expect(r.current.photos.map((p) => p.id)).toEqual(['custom', 'gp~p1']);
  });

  it('FE-PLANNER-PLGALLERY-007: when the sources have nothing either, it says so, the second time too', async () => {
    placeEnrichment.mockResolvedValue(result([]));
    const { result: r } = setup(CASTLE);
    act(() => r.current.open());
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('places.details.noPhotos'));
    expect(r.current.isOpen).toBe(false);
    // The OSM id is what the server is asked about when there is no Google one.
    expect(placeEnrichment.mock.calls[0][0]).toMatchObject({ placeId: 'way:2' });

    act(() => r.current.open());
    expect(toast.info).toHaveBeenCalledTimes(2);
    expect(placeEnrichment).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLGALLERY-008: an answer this session already holds opens without asking', () => {
    storeEnrichment({ placeId: 'gp-lake', lat: 47.5, lng: 11.2, name: 'Lake' }, 'de', result([PHOTO]));
    const { result: r } = setup(LAKE);
    act(() => r.current.open());
    expect(r.current.isOpen).toBe(true);
    expect(r.current.loading).toBe(false);
    expect(placeEnrichment).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLGALLERY-009: a failed request is reported, unless its own picture is already on screen', async () => {
    placeEnrichment.mockRejectedValue(new Error('network'));
    const bare = setup(LAKE);
    act(() => bare.result.current.open());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('places.details.error'));
    expect(bare.result.current.loading).toBe(false);
    bare.unmount();

    toast.error.mockClear();
    const pictured = setup({ ...CASTLE, image_url: CUSTOM });
    act(() => pictured.result.current.open());
    await waitFor(() => expect(pictured.result.current.loading).toBe(false));
    expect(pictured.result.current.isOpen).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLGALLERY-010: switching place while the sources answer drops that answer: nothing opens, nothing joins', async () => {
    const pending = deferred<MapsPlaceEnrichmentResult>();
    placeEnrichment.mockReturnValue(pending.promise);
    const { result: r, rerender } = setup(LAKE);
    act(() => r.current.open());
    expect(r.current.loading).toBe(true);

    rerender({ p: CASTLE, lang: 'de' });
    expect(r.current.loading).toBe(false);

    await act(async () => pending.resolve(result([PHOTO])));
    expect(r.current.isOpen).toBe(false);
    expect(r.current.loading).toBe(false);
    expect(r.current.photos).toEqual([]);
    expect(toast.error).not.toHaveBeenCalled();
    // The answer still belongs to the first place, so it is kept for it.
    expect(readCachedEnrichment({ placeId: 'gp-lake', lat: 47.5, lng: 11.2, name: 'Lake' }, 'de')).toBeTruthy();
  });

  it('FE-PLANNER-PLGALLERY-011: a failure that arrives after the switch is not reported over the next place', async () => {
    const pending = deferred<MapsPlaceEnrichmentResult>();
    placeEnrichment.mockReturnValue(pending.promise);
    const { result: r, rerender } = setup(LAKE);
    act(() => r.current.open());
    act(() => r.current.close());

    rerender({ p: CASTLE, lang: 'de' });
    await act(async () => pending.reject(new Error('network')));
    expect(toast.error).not.toHaveBeenCalled();
    expect(r.current.isOpen).toBe(false);
  });
});
