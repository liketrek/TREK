// FE-COMP-ADDPLACEHOOK-001 to FE-COMP-ADDPLACEHOOK-020: the add-a-place logic behind the
// desktop dialog (variant 'dialog') and the phone sheet ('sheet').
import { act, renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { mapsApi } from '../../api/client';
import { collectionsApi } from '../../api/collections';
import { useAddPlaceToCollection, type AddPlaceToCollectionOptions } from './useAddPlaceToCollection';

type SearchResult = Awaited<ReturnType<typeof mapsApi.search>>;
type SaveResult = Awaited<ReturnType<typeof collectionsApi.savePlace>>;

const t = (key: string, params?: Record<string, string | number | null>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

/** A search hit shaped like the maps proxy: lat arrives as text, website empty. */
const HIT = {
  name: 'Elbphilharmonie',
  address: 'Platz der Deutschen Einheit 1',
  lat: '53.5413',
  lng: 9.9841,
  google_place_id: 'gp-1',
  google_ftid: 'ft-1',
  osm_id: 'osm-1',
  website: '',
  phone: '+49 40 357666',
};

const LISTS = [
  { id: 1, name: 'Hamburg' },
  { id: 2, name: 'Berlin' },
];

let addToast: ReturnType<typeof vi.fn>;

const normalizeLinkUrl = (url: string) => (url.trim() ? `https://${url.trim()}` : '');

function dialog(over: Partial<{ open: boolean; afterAdd: () => void }> = {}) {
  const onClose = vi.fn();
  const onAdded = vi.fn();
  const afterAdd = over.afterAdd ?? vi.fn();
  const hook = renderHook(
    (p: { open: boolean }) =>
      useAddPlaceToCollection({
        variant: 'dialog',
        open: p.open,
        collectionId: 9,
        collectionName: 'Hamburg',
        t,
        onClose,
        onAdded,
        normalizeLinkUrl,
        afterAdd,
      }),
    { initialProps: { open: over.open ?? true } }
  );
  return { ...hook, onClose, onAdded, afterAdd };
}

type SheetProps = Pick<Extract<AddPlaceToCollectionOptions, { variant: 'sheet' }>, 'open' | 'collectionId' | 'lists'>;

function sheet(initial: Partial<SheetProps> = {}) {
  const onClose = vi.fn();
  const onAdded = vi.fn();
  const hook = renderHook(
    (p: SheetProps) =>
      useAddPlaceToCollection({ variant: 'sheet', ...p, collectionName: 'All saved', t, onClose, onAdded }),
    { initialProps: { open: true, collectionId: 1, lists: LISTS, ...initial } }
  );
  return { ...hook, onClose, onAdded };
}

function mockSearch(places: Record<string, unknown>[] = [HIT]) {
  return vi.spyOn(mapsApi, 'search').mockResolvedValue({ places, source: 'osm' } as unknown as SearchResult);
}

function mockSave(result: Partial<SaveResult> = {}) {
  return vi.spyOn(collectionsApi, 'savePlace').mockResolvedValue(result as SaveResult);
}

type Hook = { current: ReturnType<typeof useAddPlaceToCollection> };

async function searchFor(result: Hook, query: string) {
  act(() => result.current.setQuery(query));
  await act(async () => {
    await result.current.search();
  });
}

async function saveNow(result: Hook) {
  await act(async () => {
    await result.current.save();
  });
}

beforeEach(() => {
  resetAllStores();
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('useAddPlaceToCollection: searching', () => {
  it('FE-COMP-ADDPLACEHOOK-001: a blank query searches nothing', async () => {
    const spy = mockSearch();
    const { result } = dialog();
    await searchFor(result, '   ');
    expect(spy).not.toHaveBeenCalled();
  });

  it('FE-COMP-ADDPLACEHOOK-002: the dialog searches in the place language and says when nothing was found', async () => {
    const spy = mockSearch([]);
    const { result } = dialog();
    await searchFor(result, 'Elbphilharmonie');
    expect(spy).toHaveBeenCalledWith('Elbphilharmonie', 'en');
    expect(result.current.results).toEqual([]);
    expect(result.current.noResults).toBe(true);
    expect(result.current.searching).toBe(false);

    spy.mockResolvedValue({ places: [HIT], source: 'osm' } as unknown as SearchResult);
    await searchFor(result, 'Elbphilharmonie');
    expect(result.current.results).toEqual([HIT]);
    expect(result.current.noResults).toBe(false);

    act(() => result.current.dismissResults());
    expect(result.current.results).toEqual([]);
  });

  it('FE-COMP-ADDPLACEHOOK-003: the sheet never reports an empty search', async () => {
    mockSearch([]);
    const { result } = sheet();
    await searchFor(result, 'nowhere');
    expect(result.current.noResults).toBe(false);
  });

  it('FE-COMP-ADDPLACEHOOK-004: a failed search shows the server message on both', async () => {
    vi.spyOn(mapsApi, 'search').mockRejectedValue({ response: { data: { error: 'Quota exceeded' } } });
    const d = dialog();
    await searchFor(d.result, 'Elb');
    expect(addToast).toHaveBeenLastCalledWith('Quota exceeded', 'error', undefined);
    d.unmount();
    const s = sheet();
    await searchFor(s.result, 'Elb');
    expect(addToast).toHaveBeenLastCalledWith('Quota exceeded', 'error', undefined);
  });

  it("FE-COMP-ADDPLACEHOOK-005: without a server message the dialog shows the error's own text, the sheet the fallback", async () => {
    vi.spyOn(mapsApi, 'search').mockRejectedValue(new Error('Network Error'));
    const d = dialog();
    await searchFor(d.result, 'Elb');
    expect(addToast).toHaveBeenLastCalledWith('Network Error', 'error', undefined);
    d.unmount();
    const s = sheet();
    await searchFor(s.result, 'Elb');
    expect(addToast).toHaveBeenLastCalledWith('places.mapsSearchError', 'error', undefined);
  });

  it('FE-COMP-ADDPLACEHOOK-006: the sheet does not start a second search while one runs; the dialog does', async () => {
    const releases: Array<(v: SearchResult) => void> = [];
    const spy = vi.spyOn(mapsApi, 'search').mockImplementation(
      () =>
        new Promise<SearchResult>((resolve) => {
          releases.push(resolve);
        })
    );
    const empty = { places: [], source: 'osm' } as unknown as SearchResult;

    const s = sheet();
    act(() => s.result.current.setQuery('Elb'));
    let first!: Promise<void>;
    act(() => {
      first = s.result.current.search();
    });
    expect(s.result.current.searching).toBe(true);
    await act(async () => {
      await s.result.current.search();
    });
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => {
      releases.forEach((release) => release(empty));
      await first;
    });
    s.unmount();

    const d = dialog();
    act(() => d.result.current.setQuery('Elb'));
    let second!: Promise<void>;
    act(() => {
      first = d.result.current.search();
    });
    expect(d.result.current.searching).toBe(true);
    act(() => {
      second = d.result.current.search();
    });
    expect(spy).toHaveBeenCalledTimes(3);
    await act(async () => {
      releases.forEach((release) => release(empty));
      await Promise.all([first, second]);
    });
    expect(d.result.current.searching).toBe(false);
  });
});

describe('useAddPlaceToCollection: picking', () => {
  it('FE-COMP-ADDPLACEHOOK-007: the dialog takes name, address and coordinates from the hit', () => {
    const { result } = dialog();
    act(() => result.current.setQuery('elb'));
    act(() => result.current.pick(HIT));
    expect(result.current.name).toBe('Elbphilharmonie');
    expect(result.current.address).toBe('Platz der Deutschen Einheit 1');
    expect(result.current.lat).toBe('53.5413');
    expect(result.current.lng).toBe('9.9841');
    expect(result.current.query).toBe('Elbphilharmonie');
    expect(result.current.results).toEqual([]);
  });

  it('FE-COMP-ADDPLACEHOOK-008: a hit without name or coordinates leaves those blank and keeps the query', () => {
    const { result } = dialog();
    act(() => result.current.setQuery('elb'));
    act(() => result.current.pick({ address: 'Somewhere' }));
    expect(result.current.name).toBe('');
    expect(result.current.lat).toBe('');
    expect(result.current.lng).toBe('');
    expect(result.current.query).toBe('elb');
  });

  it('FE-COMP-ADDPLACEHOOK-009: the sheet takes name and address but leaves the coordinates fields alone', () => {
    const { result } = sheet();
    act(() => result.current.pick(HIT));
    expect(result.current.name).toBe('Elbphilharmonie');
    expect(result.current.address).toBe('Platz der Deutschen Einheit 1');
    expect(result.current.lat).toBe('');
    expect(result.current.lng).toBe('');
  });

  it('FE-COMP-ADDPLACEHOOK-010: a pasted coordinate pair fills both fields, anything else is left to the input', () => {
    const { result } = dialog();
    const preventDefault = vi.fn();
    const paste = (text: string) =>
      ({ clipboardData: { getData: () => text }, preventDefault }) as unknown as React.ClipboardEvent<HTMLInputElement>;
    act(() => result.current.coordPaste(paste(' 53.55, 9.99 ')));
    expect(result.current.lat).toBe('53.55');
    expect(result.current.lng).toBe('9.99');
    expect(preventDefault).toHaveBeenCalledTimes(1);
    act(() => result.current.coordPaste(paste('Hamburg')));
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.lat).toBe('53.55');
  });
});

describe('useAddPlaceToCollection: saving from the dialog', () => {
  it('FE-COMP-ADDPLACEHOOK-011: a blank name saves nothing', async () => {
    const save = mockSave();
    const { result } = dialog();
    act(() => result.current.setName('   '));
    await saveNow(result);
    expect(save).not.toHaveBeenCalled();
  });

  it('FE-COMP-ADDPLACEHOOK-012: posts the typed place with its links, then resets for the next one', async () => {
    const save = mockSave({ duplicate: false });
    const { result, onAdded, onClose, afterAdd } = dialog();
    act(() => result.current.pick(HIT));
    act(() => {
      result.current.setName('  Elphi  ');
      result.current.setLat('53.5');
      result.current.setLng('');
      result.current.setCategoryId(4);
      result.current.setDescription('  Concerts  ');
      result.current.setStatus('visited');
      result.current.setLinks([{ url: 'tickets.example' }, { url: '   ', label: 'blank' }]);
    });
    act(() => result.current.setLink(0, { label: ' Tickets ' }));

    await saveNow(result);

    expect(save).toHaveBeenCalledWith({
      collection_id: 9,
      name: 'Elphi',
      address: 'Platz der Deutschen Einheit 1',
      lat: 53.5,
      lng: null,
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      osm_id: 'osm-1',
      website: null,
      phone: '+49 40 357666',
      category_id: 4,
      description: 'Concerts',
      links: [{ label: 'Tickets', url: 'https://tickets.example' }],
      status: 'visited',
      force: true,
    });
    expect(addToast).toHaveBeenCalledWith('collections.addedToList:{"name":"Hamburg"}', 'success', undefined);
    expect(onAdded).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(afterAdd).toHaveBeenCalledTimes(1);
    expect(result.current.name).toBe('');
    expect(result.current.links).toEqual([]);
    expect(result.current.status).toBe('idea');
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-ADDPLACEHOOK-013: a hand-typed place carries no provenance, and an unparsable coordinate goes as null', async () => {
    const save = mockSave();
    const { result } = dialog();
    act(() => {
      result.current.setName('Corner shop');
      result.current.setLat('abc');
      result.current.setLng('10');
    });
    await saveNow(result);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        address: null,
        lat: null,
        lng: 10,
        google_place_id: null,
        osm_id: null,
        description: null,
        links: [],
        status: 'idea',
      })
    );
  });

  it('FE-COMP-ADDPLACEHOOK-014: a duplicate informs without counting as added, and the form still resets', async () => {
    mockSave({ duplicate: true });
    const { result, onAdded, afterAdd } = dialog();
    act(() => result.current.setName('Elphi'));
    await saveNow(result);
    expect(addToast).toHaveBeenCalledWith('collections.duplicateWarning', 'info', undefined);
    expect(onAdded).not.toHaveBeenCalled();
    expect(afterAdd).toHaveBeenCalledTimes(1);
    expect(result.current.name).toBe('');
  });

  it('FE-COMP-ADDPLACEHOOK-015: a failed save keeps the form, and a plain error shows its own text', async () => {
    vi.spyOn(collectionsApi, 'savePlace')
      .mockRejectedValueOnce({ response: { data: { error: 'List is full' } } })
      .mockRejectedValueOnce(new Error('Network Error'));
    const { result, afterAdd } = dialog();
    act(() => result.current.setName('Elphi'));
    await saveNow(result);
    expect(addToast).toHaveBeenLastCalledWith('List is full', 'error', undefined);
    await saveNow(result);
    expect(addToast).toHaveBeenLastCalledWith('Network Error', 'error', undefined);
    expect(result.current.name).toBe('Elphi');
    expect(afterAdd).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-ADDPLACEHOOK-016: closing the dialog resets every field', () => {
    const { result, rerender } = dialog();
    act(() => {
      result.current.setQuery('elb');
      result.current.pick(HIT);
      result.current.setDescription('x');
      result.current.setLinks([{ url: 'a.example' }]);
      result.current.setNoResults(true);
    });
    rerender({ open: false });
    expect(result.current.query).toBe('');
    expect(result.current.name).toBe('');
    expect(result.current.lat).toBe('');
    expect(result.current.description).toBe('');
    expect(result.current.links).toEqual([]);
    expect(result.current.noResults).toBe(false);
  });
});

describe('useAddPlaceToCollection: saving from the sheet', () => {
  it('FE-COMP-ADDPLACEHOOK-017: posts the picked place without links and closes, naming the target list', async () => {
    const save = mockSave({ duplicate: false });
    const { result, onAdded, onClose } = sheet({ collectionId: null, lists: LISTS });
    act(() => result.current.setTargetId(2));
    act(() => result.current.pick(HIT));
    await saveNow(result);
    expect(save).toHaveBeenCalledWith({
      collection_id: 2,
      name: 'Elbphilharmonie',
      address: 'Platz der Deutschen Einheit 1',
      lat: 53.5413,
      lng: 9.9841,
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      osm_id: 'osm-1',
      website: null,
      phone: '+49 40 357666',
      category_id: null,
      description: null,
      status: 'idea',
      force: true,
    });
    expect(addToast).toHaveBeenCalledWith('collections.addedToList:{"name":"Berlin"}', 'success', undefined);
    expect(onAdded).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-ADDPLACEHOOK-018: without a target, or while saving, nothing is sent; a duplicate still closes', async () => {
    let release: (v: SaveResult) => void = () => {};
    const save = vi.spyOn(collectionsApi, 'savePlace').mockImplementation(
      () =>
        new Promise<SaveResult>((resolve) => {
          release = resolve;
        })
    );
    const { result, onClose, onAdded } = sheet({ collectionId: null, lists: LISTS });
    act(() => result.current.setName('Elphi'));
    await saveNow(result);
    expect(save).not.toHaveBeenCalled();

    act(() => result.current.setTargetId(1));
    let first!: Promise<void>;
    act(() => {
      first = result.current.save();
    });
    expect(result.current.saving).toBe(true);
    await saveNow(result);
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => {
      release({ duplicate: true } as SaveResult);
      await first;
    });
    expect(onAdded).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    // The sheet closes rather than resetting: the form is cleared when it closes.
    expect(result.current.name).toBe('Elphi');
  });

  it('FE-COMP-ADDPLACEHOOK-019: a failed save shows the fallback for a plain error and stays open', async () => {
    vi.spyOn(collectionsApi, 'savePlace').mockRejectedValue(new Error('Network Error'));
    const { result, onClose } = sheet();
    act(() => result.current.setName('Elphi'));
    await saveNow(result);
    expect(addToast).toHaveBeenCalledWith('common.error', 'error', undefined);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-COMP-ADDPLACEHOOK-020: the target follows a fixed list, defaults to a sole list, keeps a pick and clears on close', async () => {
    const fixed = sheet({ collectionId: 2, lists: LISTS });
    expect(fixed.result.current.targetId).toBe(2);
    fixed.unmount();

    const { result, rerender } = sheet({ collectionId: null, lists: [] });
    expect(result.current.targetId).toBeNull();
    // The lists arrive after the opening: the sole one becomes the default.
    rerender({ open: true, collectionId: null, lists: [LISTS[0]] });
    expect(result.current.targetId).toBe(1);
    // A pick that is still among the lists stands when they change.
    act(() => result.current.setTargetId(2));
    rerender({ open: true, collectionId: null, lists: [...LISTS] });
    expect(result.current.targetId).toBe(2);
    // Several lists and no valid pick: the sheet waits for one.
    rerender({
      open: true,
      collectionId: null,
      lists: [
        { id: 5, name: 'Rome' },
        { id: 6, name: 'Paris' },
      ],
    });
    expect(result.current.targetId).toBeNull();

    act(() => result.current.setName('Elphi'));
    rerender({ open: false, collectionId: null, lists: LISTS });
    await waitFor(() => expect(result.current.name).toBe(''));
    expect(result.current.targetId).toBeNull();
  });
});
