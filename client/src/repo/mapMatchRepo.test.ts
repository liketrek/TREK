import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mapsApi } from '../api/client';
import { isEffectivelyOffline } from '../sync/networkMode';
import { findOnMap, stayQueries } from './mapMatchRepo';

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/client', () => ({ mapsApi: { search: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  vi.mocked(mapsApi.search).mockResolvedValue({ places: [] } as never);
});

describe('finding a stay on the map', () => {
  it('FE-MAP-MATCH-001: asks name and address together, then the name, then the address, each once', () => {
    expect(stayQueries('Hotel Gracery', '1-19-1 Kabukicho, Shinjuku')).toEqual([
      'Hotel Gracery 1-19-1 Kabukicho, Shinjuku',
      'Hotel Gracery',
      '1-19-1 Kabukicho, Shinjuku',
    ]);
    expect(stayQueries('  Hut ', null)).toEqual(['Hut']);
    expect(stayQueries('', 'Main 1')).toEqual(['Main 1']);
    expect(stayQueries('Inn', 'Inn')).toEqual(['Inn Inn', 'Inn']);
    expect(stayQueries('', '  ')).toEqual([]);
  });

  it('FE-MAP-MATCH-002: a romanized address that finds nothing falls back to the hotel name', async () => {
    vi.mocked(mapsApi.search).mockImplementation(async (query: string) =>
      query === 'Hotel Gracery'
        ? ({
            places: [{ name: 'Hotel Gracery Shinjuku', address: 'Kabukicho, Tokyo', lat: 35.69, lng: 139.7 }],
          } as never)
        : ({ places: [] } as never)
    );
    await expect(findOnMap(stayQueries('Hotel Gracery', '1-19-1 Kabukicho'), 'en')).resolves.toEqual({
      lat: 35.69,
      lng: 139.7,
      label: 'Hotel Gracery Shinjuku, Kabukicho, Tokyo',
      address: 'Kabukicho, Tokyo',
    });
    expect(vi.mocked(mapsApi.search).mock.calls.map(([q]) => q)).toEqual([
      'Hotel Gracery 1-19-1 Kabukicho',
      'Hotel Gracery',
    ]);
    expect(mapsApi.search).toHaveBeenLastCalledWith('Hotel Gracery', 'en');
  });

  it('FE-MAP-MATCH-003: a row without coordinates is no match, and without a language the search is asked as before', async () => {
    vi.mocked(mapsApi.search).mockResolvedValueOnce({
      places: [
        { name: 'Nowhere', lat: null, lng: 2 },
        { name: 'Inn', lat: 1, lng: 2 },
      ],
    } as never);
    await expect(findOnMap(['Inn'])).resolves.toEqual({ lat: 1, lng: 2, label: 'Inn' });
    expect(mapsApi.search).toHaveBeenCalledWith('Inn');

    vi.mocked(mapsApi.search).mockResolvedValueOnce(undefined as never);
    await expect(findOnMap(['Gone'])).resolves.toBeNull();
  });

  it('FE-MAP-MATCH-004: offline there is nothing to ask', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    await expect(findOnMap(['Hotel'])).resolves.toBeNull();
    expect(mapsApi.search).not.toHaveBeenCalled();
  });
});
