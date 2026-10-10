// FE-COMP-COLPLACEHOOK-001 to FE-COMP-COLPLACEHOOK-013: the saved place detail logic
// behind both the desktop detail sheet and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { CollectionLabel, CollectionPlace } from '@trek/shared';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from 'vitest';

import { mapsApi } from '../../api/client';
import { normalizeLinkUrl } from '../../pages/collections/collectionsModel';
import {
  parseCoordinate,
  placePhotoLookupId,
  useCollectionPlaceForm,
  type CollectionPlaceFormOptions,
} from './useCollectionPlaceForm';

vi.mock('../../utils/convertHeic', () => ({
  normalizeImageFile: (f: File) => Promise.resolve(f),
}));

const t = (k: string) => k;

function place(over: Partial<CollectionPlace> = {}): CollectionPlace {
  return {
    id: 1,
    name: 'Louvre',
    description: 'Museum',
    links: [{ label: 'Site', url: 'https://louvre.example' }],
    category_id: 3,
    label_ids: [10],
    address: 'Rue de Rivoli',
    lat: 48.86,
    lng: 2.33,
    image_url: null,
    google_place_id: 'g-1',
    osm_id: null,
    ...over,
  } as CollectionPlace;
}

const LABELS = [
  { id: 10, name: 'Art' },
  { id: 11, name: 'Food' },
] as CollectionLabel[];

let addToast: Mock<NonNullable<Window['__addToast']>>;
let placePhoto: MockInstance<typeof mapsApi.placePhoto>;

function setup(over: Partial<CollectionPlaceFormOptions> = {}) {
  const props: CollectionPlaceFormOptions = {
    place: place(),
    labels: LABELS,
    onSave: vi.fn().mockResolvedValue(undefined),
    onUploadImage: vi.fn().mockResolvedValue(undefined),
    t,
    normalizeLinkUrl,
    ...over,
  };
  const hook = renderHook((p: CollectionPlaceFormOptions) => useCollectionPlaceForm(p), { initialProps: props });
  return { ...hook, props };
}

function fileEvent(file: File | undefined) {
  const target = { files: file ? [file] : [], value: 'C:\\fake\\a.png' };
  return { event: { target } as unknown as React.ChangeEvent<HTMLInputElement>, target };
}

beforeEach(() => {
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  placePhoto = vi.spyOn(mapsApi, 'placePhoto').mockResolvedValue({ photoUrl: 'https://photo.example/p.jpg' });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('collection place helpers', () => {
  it('FE-COMP-COLPLACEHOOK-001: looks a photo up by Google id, OSM id, then coordinates', () => {
    expect(placePhotoLookupId(place())).toBe('g-1');
    expect(placePhotoLookupId(place({ google_place_id: null, osm_id: 'node/5' }))).toBe('node/5');
    expect(placePhotoLookupId(place({ google_place_id: null }))).toBe('48.86,2.33');
    expect(placePhotoLookupId(place({ google_place_id: null, lat: null }))).toBeNull();
  });

  it('FE-COMP-COLPLACEHOOK-002: a coordinate is a finite number or null', () => {
    expect(parseCoordinate(' 12.5 ')).toBe(12.5);
    expect(parseCoordinate('  ')).toBeNull();
    expect(parseCoordinate('abc')).toBeNull();
  });
});

describe('useCollectionPlaceForm', () => {
  it('FE-COMP-COLPLACEHOOK-003: seeds the form from the place and fetches a cover when it has none', async () => {
    const { result } = setup();
    expect(result.current.name).toBe('Louvre');
    expect(result.current.lat).toBe('48.86');
    expect(result.current.assignedLabels).toEqual([LABELS[0]]);
    await waitFor(() => expect(result.current.cover).toBe('https://photo.example/p.jpg'));
    expect(placePhoto).toHaveBeenCalledWith('g-1', 48.86, 2.33, 'Louvre');
  });

  it('FE-COMP-COLPLACEHOOK-013: the strict mode remount asks for the cover again and shows it', async () => {
    const { result } = renderHook((p: CollectionPlaceFormOptions) => useCollectionPlaceForm(p), {
      initialProps: { place: place(), labels: LABELS, onSave: vi.fn(), t, normalizeLinkUrl },
      reactStrictMode: true,
    });
    await waitFor(() => expect(result.current.cover).toBe('https://photo.example/p.jpg'));
    expect(placePhoto).toHaveBeenCalledTimes(2);
  });

  it('FE-COMP-COLPLACEHOOK-004: a place with its own image needs no lookup', () => {
    const { result } = setup({ place: place({ image_url: '/uploads/places/own.jpg' }) });
    expect(result.current.cover).toBe('/uploads/places/own.jpg');
    expect(placePhoto).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLPLACEHOOK-005: an update of the same place keeps the edits, a different place reseeds them', () => {
    const { result, rerender, props } = setup();
    act(() => {
      result.current.setEditing(true);
      result.current.setName('Changed');
    });
    rerender({ ...props, place: place({ description: 'Updated elsewhere' }) });
    expect(result.current.name).toBe('Changed');
    expect(result.current.editing).toBe(true);
    rerender({ ...props, place: place({ id: 2, name: 'Orsay' }) });
    expect(result.current.name).toBe('Orsay');
    expect(result.current.editing).toBe(false);
    expect(placePhoto).toHaveBeenCalledTimes(2);
  });

  it('FE-COMP-COLPLACEHOOK-006: the detail keeps a late photo across an update of the same place', async () => {
    let answer: (v: { photoUrl: string }) => void = () => {};
    placePhoto.mockReturnValueOnce(new Promise<{ photoUrl: string }>((r) => (answer = r)));
    const { result, rerender, props } = setup();
    rerender({ ...props, place: place({ status: 'visited' } as Partial<CollectionPlace>) });
    await act(async () => answer({ photoUrl: 'https://photo.example/late.jpg' }));
    expect(result.current.cover).toBe('https://photo.example/late.jpg');
  });

  it('FE-COMP-COLPLACEHOOK-007: the sheet drops a late photo once the place object changes', async () => {
    let answer: (v: { photoUrl: string }) => void = () => {};
    placePhoto.mockReturnValueOnce(new Promise<{ photoUrl: string }>((r) => (answer = r)));
    const { result, rerender, props } = setup({ dropPhotoOnPlaceUpdate: true });
    rerender({ ...props, place: place({ status: 'visited' } as Partial<CollectionPlace>) });
    await act(async () => answer({ photoUrl: 'https://photo.example/late.jpg' }));
    expect(result.current.cover).toBeNull();
  });

  it('FE-COMP-COLPLACEHOOK-008: the sheet holds the last place once it clears, the detail does not', () => {
    const sheet = setup({ holdLastPlace: true });
    sheet.rerender({ ...sheet.props, place: null });
    expect(sheet.result.current.shown?.id).toBe(1);

    const detail = setup();
    detail.rerender({ ...detail.props, place: null });
    expect(detail.result.current.shown).toBeNull();
  });

  it('FE-COMP-COLPLACEHOOK-009: saves the edits, with the coordinates only for the detail', async () => {
    const detail = setup({ withCoordinates: true });
    act(() => {
      detail.result.current.setEditing(true);
      detail.result.current.setName('  ');
      detail.result.current.setLinks([{ label: ' Map ', url: 'maps.example' }, { url: '' }]);
      detail.result.current.toggleLabel(10);
      detail.result.current.setLat('abc');
    });
    // toggleLabel reads the rendered selection, so each pick gets its own render.
    act(() => detail.result.current.toggleLabel(11));
    await act(async () => {
      await detail.result.current.save();
    });
    expect(detail.props.onSave).toHaveBeenCalledWith({
      name: 'Louvre',
      description: 'Museum',
      links: [{ label: 'Map', url: 'https://maps.example' }],
      category_id: 3,
      label_ids: [11],
      address: 'Rue de Rivoli',
      lat: null,
      lng: 2.33,
    });
    expect(detail.result.current.editing).toBe(false);

    const sheet = setup();
    await act(async () => {
      await sheet.result.current.save();
    });
    expect(sheet.props.onSave).toHaveBeenCalledWith({
      name: 'Louvre',
      description: 'Museum',
      links: [{ label: 'Site', url: 'https://louvre.example' }],
      category_id: 3,
      label_ids: [10],
      address: 'Rue de Rivoli',
    });
  });

  it('FE-COMP-COLPLACEHOOK-010: a failed save stays in edit mode and toasts', async () => {
    const onSave = vi.fn().mockRejectedValue({ response: { data: { error: 'Locked' } } });
    const { result } = setup({ onSave });
    act(() => result.current.setEditing(true));
    await act(async () => {
      await result.current.save();
    });
    expect(addToast).toHaveBeenCalledWith('Locked', 'error', undefined);
    expect(result.current.editing).toBe(true);
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-COLPLACEHOOK-011: cancel puts the place back into the form', () => {
    const { result } = setup();
    act(() => {
      result.current.setEditing(true);
      result.current.setDescription('scratch');
      result.current.setLink(0, { label: 'Other' });
    });
    expect(result.current.links[0].label).toBe('Other');
    act(() => result.current.cancelEdit());
    expect(result.current.description).toBe('Museum');
    expect(result.current.links).toEqual([{ label: 'Site', url: 'https://louvre.example' }]);
    expect(result.current.editing).toBe(false);
  });

  it('FE-COMP-COLPLACEHOOK-012: uploads a picked cover, removes one, and toasts either failure', async () => {
    const onUploadImage = vi.fn().mockRejectedValueOnce(new Error('too big')).mockResolvedValue(undefined);
    const onSave = vi.fn().mockRejectedValueOnce(new Error('nope'));
    const { result } = setup({ onUploadImage, onSave });
    const file = new File(['x'], 'a.png');

    const picked = fileEvent(file);
    await act(async () => {
      await result.current.handleImagePick(picked.event);
    });
    expect(picked.target.value).toBe('');
    expect(onUploadImage).toHaveBeenCalledWith(file);
    expect(addToast).toHaveBeenCalledWith('places.imageUploadError', 'error', undefined);
    expect(result.current.imgBusy).toBe(false);

    await act(async () => {
      await result.current.handleImagePick(fileEvent(undefined).event);
    });
    expect(onUploadImage).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.handleImageRemove();
    });
    expect(onSave).toHaveBeenCalledWith({ image_url: null });
    expect(addToast).toHaveBeenCalledTimes(2);
  });
});
