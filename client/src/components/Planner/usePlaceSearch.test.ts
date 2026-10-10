// FE-PLANNER-PLSEARCH-001 to FE-PLANNER-PLSEARCH-022: the maps search behind the desktop
// place dialog (variant 'dialog') and the phone sheet's search row ('sheet').
import { act, renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { mapsApi } from '../../api/client';
import { recordPlacePick } from '../../api/placeShadow';
import { usePlaceSearch, type PlaceSearchOptions } from './usePlaceSearch';

vi.mock('../../api/placeShadow', () => ({ recordPlacePick: vi.fn() }));

type SearchResult = Awaited<ReturnType<typeof mapsApi.search>>;
type AutocompleteResult = Awaited<ReturnType<typeof mapsApi.autocomplete>>;
type DetailsResult = Awaited<ReturnType<typeof mapsApi.details>>;
type ResolveResult = Awaited<ReturnType<typeof mapsApi.resolveUrl>>;
type NearbyResult = Awaited<ReturnType<typeof mapsApi.nearby>>;

const t = (key: string) => key;

const BOX = { low: { lat: 48, lng: 2 }, high: { lat: 49, lng: 3 } };

const LOUVRE = { name: 'Louvre', address: 'Rue de Rivoli', lat: 48.86, lng: 2.33, osm_id: 'W1' };
const ORSAY = { name: 'Orsay', address: 'Quai', lat: 48.85, lng: 2.32, google_place_id: 'g-orsay' };
const SUGGESTION = { placeId: 'sug-1', mainText: 'Louvre', secondaryText: 'Paris' };

const makeToast = () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() });

let toast: ReturnType<typeof makeToast>;

function setup(variant: 'dialog' | 'sheet', over: Partial<PlaceSearchOptions> = {}) {
  const onPlace = vi.fn();
  const onSuggestionName = vi.fn();
  const onMapLink = vi.fn();
  const onCoordinates = vi.fn();
  const onResolvingChange = vi.fn();
  const hook = renderHook(
    (p: { open?: boolean }) =>
      usePlaceSearch({
        variant,
        locationBias: BOX,
        t,
        toast,
        open: p.open,
        onPlace,
        onSuggestionName,
        onMapLink,
        onCoordinates,
        onResolvingChange,
        ...over,
      }),
    { initialProps: { open: variant === 'dialog' ? true : undefined } }
  );
  return { ...hook, onPlace, onSuggestionName, onMapLink, onCoordinates, onResolvingChange };
}

type Hook = { current: ReturnType<typeof usePlaceSearch> };

function mockSearch(places: Record<string, unknown>[] = [LOUVRE, ORSAY], source = 'osm') {
  return vi.spyOn(mapsApi, 'search').mockResolvedValue({ places, source } as unknown as SearchResult);
}

function mockAutocomplete(suggestions: Record<string, unknown>[] = [SUGGESTION], source = 'osm') {
  return vi.spyOn(mapsApi, 'autocomplete').mockResolvedValue({ suggestions, source } as unknown as AutocompleteResult);
}

async function searchFor(result: Hook, query: string, provider?: 'google') {
  act(() => result.current.setQuery(query));
  await act(async () => {
    await result.current.runSearch(provider);
  });
}

beforeEach(() => {
  resetAllStores();
  toast = makeToast();
  vi.mocked(recordPlacePick).mockClear();
  // A typed query fires a debounced request; tests that do not look at it get an empty list.
  mockAutocomplete([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlaceSearch: typed-ahead suggestions', () => {
  it('FE-PLANNER-PLSEARCH-001: asks after the debounce with the language, the bias box and a session token', async () => {
    const spy = mockAutocomplete();
    const { result } = setup('dialog');
    act(() => result.current.setQuery(' Lo '));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith('Lo', 'en', BOX, expect.any(AbortSignal), expect.any(String));
    await waitFor(() => expect(result.current.suggestions).toEqual([SUGGESTION]));
    expect(result.current.acSource).toBe('osm');
    expect(result.current.highlight).toBe(-1);
  });

  it('FE-PLANNER-PLSEARCH-002: stays quiet below two characters and for a map link', async () => {
    const spy = mockAutocomplete();
    const { result } = setup('dialog');
    act(() => result.current.setQuery('L'));
    act(() => result.current.setQuery('https://maps.app.goo.gl/abc'));
    await new Promise((r) => setTimeout(r, 400));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('FE-PLANNER-PLSEARCH-003: a coordinate pair gets suggestions on the desktop but not on the phone', async () => {
    const spy = mockAutocomplete();
    const desktop = setup('dialog');
    act(() => desktop.result.current.setQuery('48.85, 2.35'));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    desktop.unmount();

    spy.mockClear();
    const phone = setup('sheet');
    act(() => phone.result.current.setQuery('48.85, 2.35'));
    await new Promise((r) => setTimeout(r, 400));
    expect(spy).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLSEARCH-004: a failed list is logged on the desktop only and empties the list on both', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(mapsApi, 'autocomplete').mockRejectedValue(new Error('boom'));
    const desktop = setup('dialog');
    await act(async () => {
      await desktop.result.current.fetchSuggestions('Louvre');
    });
    expect(error).toHaveBeenCalledWith('Autocomplete failed:', expect.any(Error));
    expect(desktop.result.current.suggestions).toEqual([]);
    desktop.unmount();

    error.mockClear();
    const phone = setup('sheet');
    await act(async () => {
      await phone.result.current.fetchSuggestions('Louvre');
    });
    expect(error).not.toHaveBeenCalled();
    expect(phone.result.current.suggestions).toEqual([]);
  });

  it('FE-PLANNER-PLSEARCH-005: an aborted request leaves the desktop list alone but empties the phone list', async () => {
    const aborted = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const spy = mockAutocomplete();
    const desktop = setup('dialog');
    await act(async () => {
      await desktop.result.current.fetchSuggestions('Louvre');
    });
    spy.mockRejectedValue(aborted);
    await act(async () => {
      await desktop.result.current.fetchSuggestions('Louvre M');
    });
    expect(desktop.result.current.suggestions).toEqual([SUGGESTION]);
    desktop.unmount();

    spy.mockResolvedValue({ suggestions: [SUGGESTION], source: 'osm' } as unknown as AutocompleteResult);
    const phone = setup('sheet');
    await act(async () => {
      await phone.result.current.fetchSuggestions('Louvre');
    });
    spy.mockRejectedValue(aborted);
    await act(async () => {
      await phone.result.current.fetchSuggestions('Louvre M');
    });
    expect(phone.result.current.suggestions).toEqual([]);
  });
});

describe('usePlaceSearch: full search', () => {
  it('FE-PLANNER-PLSEARCH-006: searches the trimmed query biased to the centre of the box', async () => {
    const spy = mockSearch();
    const { result, onResolvingChange } = setup('dialog');
    await searchFor(result, '  Louvre  ');
    expect(spy).toHaveBeenCalledWith('Louvre', 'en', expect.objectContaining({ lat: 48.5, lng: 2.5 }), undefined);
    expect(result.current.results).toEqual([LOUVRE, ORSAY]);
    expect(result.current.searchSource).toBe('osm');
    expect(result.current.nearbyList).toBe(false);
    expect(result.current.emptySearch).toBeNull();
    expect(result.current.searching).toBe(false);
    expect(onResolvingChange.mock.calls).toEqual([[true], [false]]);
  });

  it('FE-PLANNER-PLSEARCH-007: an empty answer names the query on the desktop only', async () => {
    mockSearch([]);
    const desktop = setup('dialog');
    await searchFor(desktop.result, 'Nowhere');
    expect(desktop.result.current.emptySearch).toBe('Nowhere');
    desktop.unmount();

    const phone = setup('sheet');
    await searchFor(phone.result, 'Nowhere');
    expect(phone.result.current.emptySearch).toBeNull();
  });

  it('FE-PLANNER-PLSEARCH-008: the Google retry sends the query the list came from', async () => {
    const spy = mockSearch();
    const { result } = setup('dialog');
    await searchFor(result, 'Louvre');
    act(() => result.current.setQuery('something else'));
    await act(async () => {
      await result.current.runSearch('google');
    });
    expect(spy).toHaveBeenLastCalledWith('Louvre', 'en', expect.anything(), 'google');
  });

  it('FE-PLANNER-PLSEARCH-009: the phone takes a typed coordinate pair as the position, without a request', async () => {
    const spy = mockSearch();
    const { result, onCoordinates } = setup('sheet');
    await searchFor(result, '48.85, 2.35');
    expect(spy).not.toHaveBeenCalled();
    expect(onCoordinates).toHaveBeenCalledWith('48.85', '2.35');
    expect(result.current.query).toBe('');
  });

  it('FE-PLANNER-PLSEARCH-010: the desktop searches a coordinate pair like any other text', async () => {
    const spy = mockSearch();
    const { result, onCoordinates } = setup('dialog');
    await searchFor(result, '48.85, 2.35');
    expect(spy).toHaveBeenCalledWith('48.85, 2.35', 'en', expect.anything(), undefined);
    expect(onCoordinates).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLSEARCH-011: a map link resolves into a position; only the desktop clears its list', async () => {
    const resolved = { name: 'Louvre', address: 'Paris', lat: 48.86, lng: 2.33, google_ftid: 'ft' };
    vi.spyOn(mapsApi, 'resolveUrl').mockResolvedValue(resolved as unknown as ResolveResult);
    mockSearch();
    const link = 'https://maps.app.goo.gl/abc';

    const desktop = setup('dialog');
    await searchFor(desktop.result, 'Louvre');
    await searchFor(desktop.result, link);
    expect(desktop.onMapLink).toHaveBeenCalledWith(resolved);
    expect(toast.success).toHaveBeenCalledWith('places.urlResolved');
    expect(desktop.result.current.results).toEqual([]);
    expect(desktop.result.current.query).toBe('');
    desktop.unmount();

    const phone = setup('sheet');
    await searchFor(phone.result, 'Louvre');
    await searchFor(phone.result, link);
    expect(phone.onMapLink).toHaveBeenCalledWith(resolved);
    expect(phone.result.current.results).toEqual([LOUVRE, ORSAY]);
    expect(phone.result.current.query).toBe('');
  });

  it('FE-PLANNER-PLSEARCH-012: a failed search toasts the server message or the fallback', async () => {
    vi.spyOn(mapsApi, 'search').mockRejectedValue(new Error('down'));
    const { result } = setup('sheet');
    await searchFor(result, 'Louvre');
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(result.current.searching).toBe(false);
  });

  it('FE-PLANNER-PLSEARCH-013: the phone ends the billing session after a full search, the desktop keeps it', async () => {
    const auto = mockAutocomplete();
    mockSearch();
    const tokensAround = async (variant: 'dialog' | 'sheet') => {
      auto.mockClear();
      const { result, unmount } = setup(variant);
      await act(async () => {
        await result.current.fetchSuggestions('Louvre');
      });
      await searchFor(result, 'Louvre');
      await act(async () => {
        await result.current.fetchSuggestions('Louvre M');
      });
      unmount();
      return auto.mock.calls.map((call) => call[4]);
    };
    const [desktopFirst, desktopSecond] = await tokensAround('dialog');
    expect(desktopSecond).toBe(desktopFirst);
    const [phoneFirst, phoneSecond] = await tokensAround('sheet');
    expect(phoneSecond).not.toBe(phoneFirst);
  });
});

describe('usePlaceSearch: picking', () => {
  it('FE-PLANNER-PLSEARCH-014: a search row goes to the form with its mark and is logged with its rank', async () => {
    mockSearch();
    const { result, onPlace } = setup('dialog');
    await searchFor(result, 'Louvre');
    act(() => result.current.pickPlace(ORSAY, { mode: 'search', rank: 1, count: 2 }));
    expect(onPlace.mock.calls[0][0]).toBe(ORSAY);
    expect(recordPlacePick).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'Louvre',
        lang: 'en',
        biasLat: 48.5,
        biasLng: 2.5,
        source: 'search:osm',
        liveRank: 1,
        liveCount: 2,
        pickedName: 'Orsay',
        pickedLat: 48.85,
        pickedLng: 2.32,
        pickedPlaceId: 'g-orsay',
      })
    );
    expect(result.current.results).toEqual([]);
    expect(result.current.query).toBe('');
  });

  it('FE-PLANNER-PLSEARCH-015: a place from elsewhere carries no mark and is not logged', () => {
    const { result, onPlace } = setup('dialog');
    act(() => result.current.pickPlace(LOUVRE));
    expect(onPlace).toHaveBeenCalledWith(LOUVRE, null);
    expect(recordPlacePick).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLSEARCH-016: the phone clears the typed-ahead list on a pick, the desktop leaves it', async () => {
    mockAutocomplete();
    const desktop = setup('dialog');
    await act(async () => {
      await desktop.result.current.fetchSuggestions('Louvre');
    });
    act(() => desktop.result.current.pickPlace(LOUVRE));
    expect(desktop.result.current.suggestions).toEqual([SUGGESTION]);
    desktop.unmount();

    const phone = setup('sheet');
    await act(async () => {
      await phone.result.current.fetchSuggestions('Louvre');
    });
    act(() => phone.result.current.pickPlace(LOUVRE));
    expect(phone.result.current.suggestions).toEqual([]);
  });

  it('FE-PLANNER-PLSEARCH-017: a suggestion fills the name first, then its looked up place', async () => {
    mockAutocomplete();
    const details = vi.spyOn(mapsApi, 'details').mockResolvedValue({ place: LOUVRE } as unknown as DetailsResult);
    const { result, onSuggestionName, onPlace } = setup('sheet');
    await act(async () => {
      await result.current.fetchSuggestions('Louvre');
    });
    await act(async () => {
      await result.current.selectSuggestion(SUGGESTION);
    });
    expect(onSuggestionName).toHaveBeenCalledWith('Louvre');
    expect(details).toHaveBeenCalledWith('sug-1', 'en', expect.any(String));
    expect(onPlace.mock.calls[0][0]).toBe(LOUVRE);
    expect(recordPlacePick).toHaveBeenCalledWith(expect.objectContaining({ source: 'autocomplete:osm', liveRank: 0 }));
    expect(result.current.searching).toBe(false);
  });

  it('FE-PLANNER-PLSEARCH-018: an OpenStreetMap row without details uses its own position, never a text search', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(mapsApi, 'details').mockRejectedValue(new Error('no details'));
    const search = mockSearch();
    const row = {
      placeId: 'N5',
      mainText: 'Tokyo Station',
      secondaryText: '東京駅',
      source: 'openstreetmap',
      lat: 35.68,
      lng: 139.77,
    };
    const { result, onPlace } = setup('dialog');
    await act(async () => {
      await result.current.selectSuggestion(row);
    });
    expect(search).not.toHaveBeenCalled();
    expect(onPlace.mock.calls[0][0]).toEqual({
      name: 'Tokyo Station',
      address: '',
      lat: 35.68,
      lng: 139.77,
      osm_id: 'N5',
      source: 'openstreetmap',
    });
  });

  it('FE-PLANNER-PLSEARCH-019: a suggestion nothing answers for puts the query back and says so', async () => {
    vi.spyOn(mapsApi, 'details').mockResolvedValue({ place: null } as unknown as DetailsResult);
    const search = mockSearch([]);
    const { result, onPlace } = setup('sheet');
    act(() => result.current.setQuery('Louvre'));
    await act(async () => {
      await result.current.selectSuggestion(SUGGESTION);
    });
    expect(search).toHaveBeenCalledWith('Louvre, Paris', 'en', expect.anything());
    expect(onPlace).not.toHaveBeenCalled();
    expect(result.current.query).toBe('Louvre');
    expect(toast.error).toHaveBeenCalledWith('places.mapsSearchError');
  });
});

describe('usePlaceSearch: the desktop dialog', () => {
  it('FE-PLANNER-PLSEARCH-020: closing clears the search, and an answer arriving after it is dropped', async () => {
    let answer: (value: SearchResult) => void = () => {};
    vi.spyOn(mapsApi, 'search').mockReturnValue(new Promise<SearchResult>((resolve) => (answer = resolve)));
    const { result, rerender } = setup('dialog');
    act(() => result.current.setQuery('Louvre'));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.runSearch();
    });
    expect(result.current.searching).toBe(true);
    rerender({ open: false });
    expect(result.current.query).toBe('');
    expect(result.current.searching).toBe(false);
    await act(async () => {
      answer({ places: [LOUVRE], source: 'osm' } as unknown as SearchResult);
      await pending;
    });
    expect(result.current.results).toEqual([]);
  });

  it('FE-PLANNER-PLSEARCH-021: places near the pin replace the list and say when there are none', async () => {
    const nearby = vi
      .spyOn(mapsApi, 'nearby')
      .mockResolvedValue({ places: [], source: 'osm' } as unknown as NearbyResult);
    const { result } = setup('dialog');
    await act(async () => {
      await result.current.searchNearby(null);
    });
    expect(nearby).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.searchNearby({ lat: 48.8, lng: 2.3 });
    });
    expect(nearby).toHaveBeenCalledWith(48.8, 2.3, 'en');
    expect(result.current.nearbyList).toBe(true);
    expect(toast.info).toHaveBeenCalledWith('places.nearbyNone');
  });

  it('FE-PLANNER-PLSEARCH-022: arrows walk the list, Enter picks the highlighted row, Escape closes the list', async () => {
    mockAutocomplete([SUGGESTION, { placeId: 'sug-2', mainText: 'Orsay', secondaryText: '' }]);
    vi.spyOn(mapsApi, 'details').mockResolvedValue({ place: ORSAY } as unknown as DetailsResult);
    const { result, onPlace } = setup('dialog');
    const key = (k: string) => ({ key: k, preventDefault: vi.fn() }) as unknown as React.KeyboardEvent;
    await act(async () => {
      await result.current.fetchSuggestions('Lou');
    });
    act(() => result.current.handleKeyDown(key('ArrowDown')));
    act(() => result.current.handleKeyDown(key('ArrowDown')));
    expect(result.current.highlight).toBe(1);
    act(() => result.current.handleKeyDown(key('ArrowUp')));
    expect(result.current.highlight).toBe(0);
    act(() => result.current.handleKeyDown(key('Escape')));
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.highlight).toBe(-1);

    await act(async () => {
      await result.current.fetchSuggestions('Lou');
    });
    act(() => result.current.handleKeyDown(key('ArrowUp')));
    await act(async () => {
      result.current.handleKeyDown(key('Enter'));
    });
    await waitFor(() => expect(onPlace).toHaveBeenCalledTimes(1));
    expect(onPlace.mock.calls[0][0]).toBe(ORSAY);
  });
});
