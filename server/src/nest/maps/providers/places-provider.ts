/**
 * The keyed places-provider seam.
 *
 * Search, autocomplete and details ask the TREK index and OpenStreetMap first;
 * neither needs a credential, and together they answer on every install.
 * Behind them sits one keyed provider, the one an admin configures and that
 * bills somebody: Google, which MapsService still calls inline, or Amap,
 * which comes through this interface. The `places_provider` row in
 * app_settings says which of the two holds that slot, and `auto` keeps
 * whatever the install already used.
 *
 * OpenStreetMap deliberately does NOT implement this interface. It is the
 * keyless floor every install falls back to, it has no credential to resolve,
 * and its details path is a Nominatim/Overpass merge that answers a different
 * question from a single provider lookup. Dressing it up as a provider would
 * mean either a fake key or an interface full of optionals.
 *
 * Every method returns the same normalised place shape regardless of provider:
 * `name/address/lat/lng` in WGS-84, plus the provider's own id under the column
 * the client persists it in (`amap_poi_id`). Coordinates are WGS-84 by
 * contract: a provider that speaks another datum converts at its own boundary
 * (see amap.provider.ts) so nothing downstream has to care.
 */
import type { ApiKeySource } from '../../settings/instance-api-keys';

/** The keyed providers. OpenStreetMap is absent on purpose, see the file header. */
export type PlacesProviderId = 'google' | 'amap';

/**
 * What an admin can choose. `auto` keeps whatever the install already used:
 * Google when a Google key is configured, Amap when only an Amap key is, and
 * the OSM stack when neither is. Existing installs must not change provider
 * because a new one became available, so `auto` prefers the incumbent.
 */
export type PlacesProviderChoice = 'auto' | PlacesProviderId | 'openstreetmap';

export const PLACES_PROVIDER_CHOICES: readonly PlacesProviderChoice[] = [
  'auto',
  'google',
  'amap',
  'openstreetmap',
];

export function isPlacesProviderChoice(value: unknown): value is PlacesProviderChoice {
  return typeof value === 'string' && (PLACES_PROVIDER_CHOICES as readonly string[]).includes(value);
}

/** A place as the rest of TREK consumes it. Open by design, see maps.schema.ts. */
export type ProviderPlace = Record<string, unknown>;

export interface ProviderSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

/** Bias a text search toward a point. Radius in metres; WGS-84. */
export interface SearchBias {
  lat: number;
  lng: number;
  radius?: number;
}

/** Bias autocomplete toward a viewport rectangle. WGS-84. */
export interface ViewportBias {
  low: { lat: number; lng: number };
  high: { lat: number; lng: number };
}

/**
 * The credential and its provenance, carried so an error can say WHICH of the
 * three places a key can come from was used, without ever logging the key.
 * This is the #1939 breadcrumb, kept when the code moved out of the service.
 */
export interface ProviderCredential {
  key: string;
  source: ApiKeySource | null;
  /** Whose request this is; 0 for an unauthenticated read. */
  userId: number;
}

export interface PlacesProvider {
  readonly id: PlacesProviderId;

  searchText(query: string, lang?: string, bias?: SearchBias): Promise<ProviderPlace[]>;

  autocomplete(input: string, lang?: string, bias?: ViewportBias): Promise<ProviderSuggestion[]>;

  /** Null when the provider has no such place: a miss, not an error. */
  placeDetails(placeId: string, lang?: string): Promise<ProviderPlace | null>;

  /** Reverse geocoding. Null means the provider had nothing for this point. */
  reverse(lat: number, lng: number, lang?: string): Promise<{ name: string | null; address: string | null } | null>;
}
