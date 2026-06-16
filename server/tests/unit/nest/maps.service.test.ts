import { describe, it, expect, vi, beforeEach } from 'vitest';

const { maps } = vi.hoisted(() => ({
  maps: {
    searchPlaces: vi.fn(),
    autocompletePlaces: vi.fn(),
    getPlaceDetails: vi.fn(),
    getPlaceDetailsExpanded: vi.fn(),
    getPlacePhoto: vi.fn(),
    reverseGeocode: vi.fn(),
    resolveGoogleMapsUrl: vi.fn(),
    searchOverpassPois: vi.fn(),
  },
}));
vi.mock('../../../src/services/mapsService', () => maps);

const { serveFilePath } = vi.hoisted(() => ({ serveFilePath: vi.fn() }));
vi.mock('../../../src/services/placePhotoCache', () => ({ serveFilePath }));

import { MapsService } from '../../../src/nest/maps/maps.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';

/** A DatabaseService stub whose get() returns the row the test wants. */
function makeDb(row?: { value: string }) {
  const get = vi.fn(() => row);
  const db = { get } as unknown as DatabaseService;
  return { db, get };
}

function svc(row?: { value: string }) {
  return new MapsService(makeDb(row).db);
}

beforeEach(() => vi.clearAllMocks());

describe('MapsService', () => {
  describe('kill-switch settings reads', () => {
    it('reports a switch disabled when the stored value is exactly "false"', () => {
      expect(svc({ value: 'false' }).autocompleteDisabled()).toBe(true);
      expect(svc({ value: 'false' }).detailsDisabled()).toBe(true);
      expect(svc({ value: 'false' }).photosDisabled()).toBe(true);
    });

    it('reports enabled when the value is "true"', () => {
      expect(svc({ value: 'true' }).autocompleteDisabled()).toBe(false);
      expect(svc({ value: 'true' }).detailsDisabled()).toBe(false);
      expect(svc({ value: 'true' }).photosDisabled()).toBe(false);
    });

    it('reports enabled when the setting row is absent', () => {
      expect(svc(undefined).autocompleteDisabled()).toBe(false);
      expect(svc(undefined).detailsDisabled()).toBe(false);
      expect(svc(undefined).photosDisabled()).toBe(false);
    });

    it('queries the matching app_settings key', () => {
      const { db, get } = makeDb({ value: 'true' });
      const s = new MapsService(db);
      s.autocompleteDisabled();
      expect(get).toHaveBeenCalledWith(expect.stringContaining('app_settings'), 'places_autocomplete_enabled');
      s.detailsDisabled();
      expect(get).toHaveBeenCalledWith(expect.any(String), 'places_details_enabled');
      s.photosDisabled();
      expect(get).toHaveBeenCalledWith(expect.any(String), 'places_photos_enabled');
    });
  });

  describe('delegation to the legacy maps service', () => {
    it('search forwards userId, query, lang and bias', () => {
      maps.searchPlaces.mockResolvedValue({ places: [], source: 'osm' });
      const bias = { lat: 1, lng: 2, radius: 5 };
      svc().search(3, 'berlin', 'de', bias);
      expect(maps.searchPlaces).toHaveBeenCalledWith(3, 'berlin', 'de', bias);
    });

    it('search works without optional args', () => {
      svc().search(3, 'berlin');
      expect(maps.searchPlaces).toHaveBeenCalledWith(3, 'berlin', undefined, undefined);
    });

    it('autocomplete forwards through', () => {
      const bias = { low: { lat: 1, lng: 2 }, high: { lat: 3, lng: 4 } };
      svc().autocomplete(3, 'be', 'en', bias);
      expect(maps.autocompletePlaces).toHaveBeenCalledWith(3, 'be', 'en', bias);
    });

    it('details forwards through', () => {
      svc().details(3, 'p1', 'de');
      expect(maps.getPlaceDetails).toHaveBeenCalledWith(3, 'p1', 'de');
    });

    it('detailsExpanded forwards refresh through', () => {
      svc().detailsExpanded(3, 'p1', 'de', true);
      expect(maps.getPlaceDetailsExpanded).toHaveBeenCalledWith(3, 'p1', 'de', true);
    });

    it('photo forwards coords and name through', () => {
      svc().photo(3, 'p1', 1.5, 2.5, 'Spot');
      expect(maps.getPlacePhoto).toHaveBeenCalledWith(3, 'p1', 1.5, 2.5, 'Spot');
    });

    it('reverse forwards through', () => {
      svc().reverse('1', '2', 'de');
      expect(maps.reverseGeocode).toHaveBeenCalledWith('1', '2', 'de');
    });

    it('resolveUrl forwards through', () => {
      svc().resolveUrl('https://maps.app.goo.gl/x');
      expect(maps.resolveGoogleMapsUrl).toHaveBeenCalledWith('https://maps.app.goo.gl/x');
    });

    it('pois forwards category and bbox through', () => {
      const bbox = { south: 1, west: 2, north: 3, east: 4 };
      svc().pois('cafe', bbox);
      expect(maps.searchOverpassPois).toHaveBeenCalledWith('cafe', bbox);
    });
  });

  describe('photoBytesPath', () => {
    it('returns the cached file path from placePhotoCache', () => {
      serveFilePath.mockReturnValue('/cache/p1.jpg');
      expect(svc().photoBytesPath('p1')).toBe('/cache/p1.jpg');
      expect(serveFilePath).toHaveBeenCalledWith('p1');
    });

    it('returns null when nothing is cached', () => {
      serveFilePath.mockReturnValue(null);
      expect(svc().photoBytesPath('p1')).toBeNull();
    });
  });
});
