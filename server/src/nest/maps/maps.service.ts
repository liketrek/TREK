import { Injectable } from '@nestjs/common';
import type {
  MapsSearchResult,
  MapsAutocompleteResult,
  MapsPlaceDetailsResult,
  MapsPlacePhotoResult,
  MapsReverseResult,
  MapsResolveUrlResult,
} from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import {
  searchPlaces,
  autocompletePlaces,
  getPlaceDetails,
  getPlaceDetailsExpanded,
  getPlacePhoto,
  reverseGeocode,
  resolveGoogleMapsUrl,
  searchOverpassPois,
} from '../../services/mapsService';
import { serveFilePath } from '../../services/placePhotoCache';

type LocationBias = { low: { lat: number; lng: number }; high: { lat: number; lng: number } };

/**
 * Thin Nest wrapper around the existing maps service. All geocoding, the
 * provider fan-out (Nominatim/Overpass/Google) and — importantly — the SSRF
 * guard live in mapsService and are reused unchanged, so behaviour and the
 * outbound-URL protection are identical.
 *
 * The per-endpoint kill-switches are settings reads the legacy route does
 * inline; they're encapsulated here as `*Disabled()` helpers over the same
 * `app_settings` rows.
 */
@Injectable()
export class MapsService {
  constructor(private readonly database: DatabaseService) {}

  private isSettingDisabled(key: string): boolean {
    const row = this.database.get<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      key,
    );
    return row?.value === 'false';
  }

  autocompleteDisabled(): boolean {
    return this.isSettingDisabled('places_autocomplete_enabled');
  }

  detailsDisabled(): boolean {
    return this.isSettingDisabled('places_details_enabled');
  }

  photosDisabled(): boolean {
    return this.isSettingDisabled('places_photos_enabled');
  }

  search(userId: number, query: string, lang?: string, locationBias?: { lat: number; lng: number; radius?: number }): Promise<MapsSearchResult> {
    return searchPlaces(userId, query, lang, locationBias) as Promise<MapsSearchResult>;
  }

  autocomplete(userId: number, input: string, lang?: string, locationBias?: LocationBias): Promise<MapsAutocompleteResult> {
    return autocompletePlaces(userId, input, lang, locationBias) as Promise<MapsAutocompleteResult>;
  }

  details(userId: number, placeId: string, lang?: string): Promise<MapsPlaceDetailsResult> {
    return getPlaceDetails(userId, placeId, lang) as Promise<MapsPlaceDetailsResult>;
  }

  detailsExpanded(userId: number, placeId: string, lang: string | undefined, refresh: boolean): Promise<MapsPlaceDetailsResult> {
    return getPlaceDetailsExpanded(userId, placeId, lang, refresh) as Promise<MapsPlaceDetailsResult>;
  }

  photo(userId: number, placeId: string, lat: number, lng: number, name?: string): Promise<MapsPlacePhotoResult> {
    return getPlacePhoto(userId, placeId, lat, lng, name) as Promise<MapsPlacePhotoResult>;
  }

  photoBytesPath(placeId: string): string | null {
    return serveFilePath(placeId);
  }

  reverse(lat: string, lng: string, lang?: string): Promise<MapsReverseResult> {
    return reverseGeocode(lat, lng, lang) as Promise<MapsReverseResult>;
  }

  resolveUrl(url: string): Promise<MapsResolveUrlResult> {
    return resolveGoogleMapsUrl(url) as Promise<MapsResolveUrlResult>;
  }

  // OSM-only POI search by category within a viewport bbox (never calls Google).
  pois(category: string, bbox: { south: number; west: number; north: number; east: number }) {
    return searchOverpassPois(category, bbox);
  }
}
