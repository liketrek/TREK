import { readEnv } from '../../app-config';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type { GeoLane } from '../geo/nominatim.client';
import { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import type { ApiKeySource } from '../settings/instance-api-keys';
import { indexPoiAnswer, indexPoiPlan, indexSuggestions } from './maps-index.helpers';
import { NEARBY_DEFAULT_LIMIT, NEARBY_DEFAULT_RADIUS_M, nearbyCacheKey, nearestFirst } from './maps-nearby.helpers';
import { MapsUrlResolver, type ResolvedMapsUrl } from './maps-url.resolver';
import { toApiLang, mergeSearchResults } from './maps.helpers';
import { PlaceDetailsResolver } from './place-details.resolver';
import { PlacePhotoResolver } from './place-photo.resolver';
import { PlacesProviderSelector, type KeyedProvider } from './places-provider.selector';
import type { AmapPlacesProvider } from './providers/amap.provider';
import { GooglePlacesClient } from './providers/google-places.provider';
import { OsmClient, type PoiSearchResult } from './providers/osm.client';
import type { PlacesProviderChoice } from './providers/places-provider';
import { WikimediaClient, type BrandLogo } from './providers/wikimedia.client';
import {
  trekPlacesSearch,
  indexHitsOnly,
  trekPlacesArea,
  trekPlacesNearby,
  toPlaceRecord,
  type TrekPlace,
} from './trek-places.client';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { isOutsideChina } from '@trek/shared';
import type { MapsSearchResult, MapsAutocompleteResult, MapsPlaceDetailsResult } from '@trek/shared';
import type { MapsPlacePhotoResult, MapsReverseResult, MapsResolveUrlResult } from '@trek/shared';

// What the other domains have always imported from here.
export { readBrandIdentity, readWikiIdentity, type WikiIdentity } from './providers/wiki-identity';
export { withPhotoFetchSlot } from './photo-fetch-slot';
export type { BrandLogo, CommonsCandidate } from './providers/wikimedia.client';
export { GOOGLE_SHORT_HOSTS, isGoogleMapsHost } from '../common/google-maps-hosts';
export { PLACES_PROVIDER_SETTING, PLACES_GOOGLE_ONLY_SETTING, type KeyedProvider } from './places-provider.selector';

// Places near a point (#976): cached longer than the POI boxes, because the
// likely caller is an import asking the same photo location again, and Google
// bills every one of those.
const NEARBY_CACHE = new Map<string, { at: number; value: { places: Record<string, unknown>[]; source: string } }>();
const NEARBY_CACHE_TTL_MS = 30 * 60 * 1000;
const NEARBY_CACHE_MAX = 500;

type LocationBias = { low: { lat: number; lng: number }; high: { lat: number; lng: number } };

/**
 * /api/maps domain service: the orchestrator. It decides, per request, which
 * source answers and in what order (the TREK index first, OpenStreetMap beside
 * it, the keyed provider once both are empty or alone under "Google only"),
 * holds the place-details cache and the nearby cache, and answers every
 * controller, MCP tool and in-container consumer.
 *
 * How to ask each source lives in its own provider and is injected here:
 * GooglePlacesClient (Google Places, quota-counted), OsmClient (Nominatim and
 * Overpass), WikimediaClient (Wikipedia, Wikidata, Commons), the Amap provider
 * through PlacesProviderSelector (which also resolves every key), and the two
 * resolvers for the marker photo and pasted links. None of them imports this
 * class; lint:boundaries holds that.
 *
 * The per-endpoint kill-switches are `*Disabled()` reads over the same
 * `app_settings` rows the legacy route read inline.
 */
@Injectable()
export class MapsService {
  constructor(
    private readonly photoCache: PlacePhotoCacheService,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    private readonly googlePlaces: GooglePlacesClient,
    private readonly osm: OsmClient,
    private readonly wiki: WikimediaClient,
    private readonly selector: PlacesProviderSelector,
    private readonly photos: PlacePhotoResolver,
    private readonly links: MapsUrlResolver,
    private readonly placeDetails: PlaceDetailsResolver,
  ) {}

  private async isSettingDisabled(key: string): Promise<boolean> {
    const value = await this.appSettings.getValue(key);
    return value === 'false';
  }

  /**
   * Whether the index answers on this instance.
   *
   * On unless TREK_PLACES_ENABLED says otherwise, because the index is the path
   * we want people on and an upgrade must not quietly drop back to Nominatim,
   * whose usage policy forbids what TREK was doing with it.
   *
   * An environment variable rather than an admin switch on purpose. This decides
   * whether a search leaves the instance at all, which is a property of the
   * deployment: an operator pins it in their compose file, and it cannot be
   * turned off from a browser by whoever holds an admin account that day.
   */
  trekPlacesEnabled(): boolean {
    return readEnv().maps.trekPlacesEnabled;
  }

  /**
   * The places in a trip's area, for the offline cache.
   *
   * The one call TREK makes that is not driven by something a user just typed.
   * It runs when a trip is prepared for offline use, alongside the map tiles,
   * and it is the reason searching a trip works on a plane: without it the
   * offline instance has the trip's own places and nothing else, so "find a
   * pharmacy near the hotel" has nothing to answer from.
   *
   * Returns null rather than throwing when the index is switched off or the
   * service is unreachable, because this is a nice-to-have running in the
   * background of a sync — a failure here must not fail the sync.
   */
  async placesInArea(
    bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
    limit?: number,
  ): Promise<{ results: Record<string, unknown>[]; truncated: boolean } | null> {
    if (!this.trekPlacesEnabled()) return null;
    try {
      const area = await trekPlacesArea(bbox, limit);
      return { results: area.results.map(toPlaceRecord), truncated: area.truncated };
    } catch (err) {
      console.warn('TREK Places area lookup failed:', (err as Error).message);
      return null;
    }
  }

  autocompleteDisabled(): Promise<boolean> {
    return this.isSettingDisabled('places_autocomplete_enabled');
  }

  detailsDisabled(): Promise<boolean> {
    return this.isSettingDisabled('places_details_enabled');
  }

  photosDisabled(): Promise<boolean> {
    return this.isSettingDisabled('places_photos_enabled');
  }

  // ── Controller-facing surface ──────────────────────────────────────────────

  search(
    userId: number,
    query: string,
    lang?: string,
    locationBias?: { lat: number; lng: number; radius?: number },
    provider?: 'google',
  ): Promise<MapsSearchResult> {
    return this.searchPlaces(userId, query, lang, locationBias, {
      googleOnly: provider === 'google',
    }) as Promise<MapsSearchResult>;
  }

  autocomplete(
    userId: number,
    input: string,
    lang?: string,
    locationBias?: LocationBias,
    sessionToken?: string,
  ): Promise<MapsAutocompleteResult> {
    return this.autocompletePlaces(userId, input, lang, locationBias, sessionToken) as Promise<MapsAutocompleteResult>;
  }

  details(userId: number, placeId: string, lang?: string, sessionToken?: string): Promise<MapsPlaceDetailsResult> {
    return this.getPlaceDetails(userId, placeId, lang, sessionToken) as Promise<MapsPlaceDetailsResult>;
  }

  detailsExpanded(
    userId: number,
    placeId: string,
    lang: string | undefined,
    refresh: boolean,
  ): Promise<MapsPlaceDetailsResult> {
    return this.getPlaceDetailsExpanded(userId, placeId, lang, refresh) as Promise<MapsPlaceDetailsResult>;
  }

  photo(userId: number, placeId: string, lat: number, lng: number, name?: string): Promise<MapsPlacePhotoResult> {
    return this.getPlacePhoto(userId, placeId, lat, lng, name) as Promise<MapsPlacePhotoResult>;
  }

  photoBytesKey(placeId: string): Promise<string | null> {
    return this.photoCache.serveKey(placeId);
  }

  reverse(lat: string, lng: string, lang?: string): Promise<MapsReverseResult> {
    return this.reverseGeocode(lat, lng, lang) as Promise<MapsReverseResult>;
  }

  resolveUrl(url: string): Promise<MapsResolveUrlResult> {
    return this.resolveGoogleMapsUrl(url) as Promise<MapsResolveUrlResult>;
  }

  /** The logo of a brand, by its Wikidata id, as bytes (null: the pin keeps its category icon). */
  brandLogo(wikidataId: string): Promise<BrandLogo | null> {
    return this.wiki.brandLogo(wikidataId);
  }

  // POI search by category within a viewport. Never calls Google.
  //
  // The index answers first: it holds the same places, indexed in an R-Tree, and
  // the public Overpass mirrors this used to depend on are regularly overloaded.
  // A miss or a failure drops through to Overpass exactly as before.
  async pois(
    category: string,
    bbox: { south: number; west: number; north: number; east: number },
    lang?: string,
    limit = 60,
  ): Promise<PoiSearchResult> {
    const plan = indexPoiPlan(category, bbox, limit);
    if (this.trekPlacesEnabled() && plan) {
      try {
        const found = await trekPlacesNearby(plan.lat, plan.lng, {
          radius: plan.radius,
          limit: plan.cap,
          category: plan.terms.join(','),
        });
        if (found.length > 0) return indexPoiAnswer(found, plan);
      } catch (err: unknown) {
        console.warn('TREK Places nearby failed, falling back:', (err as Error).message);
      }
    }
    return this.osm.searchOverpassPois(category, bbox, lang, limit);
  }

  // ── Keys and the keyed provider (resolved by PlacesProviderSelector) ─────

  /** The Places credential for this request and where it came from (#1939). */
  resolveMapsKey(userId: number): Promise<{ key: string | null; source: ApiKeySource | null }> {
    return this.selector.resolveMapsKey(userId);
  }

  /** The Google key to spend, or null (none, or today's ceiling reached, #1582). */
  getMapsKey(userId: number): Promise<string | null> {
    return this.selector.getMapsKey(userId);
  }

  resolveAmapKey(userId: number): Promise<{ key: string | null; source: ApiKeySource | null }> {
    return this.selector.resolveAmapKey(userId);
  }

  placesProviderChoice(): Promise<PlacesProviderChoice> {
    return this.selector.placesProviderChoice();
  }

  /** Who holds the keyed slot for this request, or null for the OpenStreetMap stack alone. */
  keyedProvider(userId: number): Promise<KeyedProvider | null> {
    return this.selector.keyedProvider(userId);
  }

  /** The Amap provider, when Amap holds the keyed slot; null otherwise. */
  resolvePlacesProvider(userId: number): Promise<AmapPlacesProvider | null> {
    return this.selector.resolvePlacesProvider(userId);
  }

  /**
   * A coordinate for a name that came out of an import, from whichever source
   * has it.
   *
   * Booking imports geocode every venue and every uncoordinated endpoint in one
   * request loop, up to thirty sequential lookups. Every one of those used to be
   * a Nominatim call on the background lane, waiting out its throttle. The index
   * answers most of them without leaving our own infrastructure and without a
   * throttle at all; a street address it does not know still falls through to
   * Nominatim, which is the source that resolves addresses.
   *
   * Never throws: an import that cannot place a hotel still imports the hotel.
   */
  async geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
    if (this.trekPlacesEnabled()) {
      try {
        const found = await trekPlacesSearch(query, { limit: 1 });
        const hit = found[0];
        if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
          return { lat: hit.lat, lng: hit.lng };
        }
      } catch (err: unknown) {
        console.warn('TREK Places geocode failed, falling back:', (err as Error).message);
      }
    }
    const hit = (await this.osm.searchNominatim(query, undefined, 'background'))[0];
    return hit?.lat != null && hit?.lng != null ? { lat: hit.lat, lng: hit.lng } : null;
  }

  // ── Search places (Google or Nominatim fallback) ───────────────────────────

  async searchPlaces(
    userId: number,
    query: string,
    lang?: string,
    locationBias?: { lat: number; lng: number; radius?: number },
    opts: { googleIdentityOnly?: boolean; googleOnly?: boolean } = {},
  ): Promise<{ places: Record<string, unknown>[]; source: string }> {
    const keyed = await this.keyedProvider(userId);
    const { key: apiKey, source: keySource } = keyed?.id === 'google' ? keyed : { key: null, source: null };

    // The TREK index answers first, whether or not a Google key exists. It is
    // the only source here that may be stored, works offline as a country
    // package, and costs the caller nothing; a key buys ratings and photos on
    // top of it, not a better search.
    //
    // It never throws upward. A search that used to work must keep working when
    // the service is slow or down, so a failure drops through to exactly what
    // this method did before.
    //
    // `googleIdentityOnly` skips it. One caller does not want the best answer,
    // it wants a Google id: list-import enrichment (#886) exists to attach a
    // `google_place_id` to a bare imported pin, and `pickEnrichmentMatch`
    // discards every candidate that has none. Index and OpenStreetMap records
    // both carry `google_place_id: null`, so answering that caller from them
    // returns matches it must throw away, and the import silently stays
    // unenriched on an instance that pays for a key. It changes nothing for an
    // instance without one: enrichment could never resolve anything there
    // either, before this branch existed or after.
    // Set once the OpenStreetMap half below has run, so the fallback does not ask
    // the same question twice. `null` means it never ran.
    let osmAnswer: Record<string, unknown>[] | null = null;

    // Amap first where the admin picked it and the search is about China (#1636):
    // there the index and OpenStreetMap are thin and Amap is the map people use.
    // Its answer is kept, so the Amap slot further down never pays for the same
    // question twice. A failure drops through to the usual order.
    let amapAnswer: Record<string, unknown>[] | null = null;
    if (keyed?.id === 'amap' && (await this.selector.amapAnswersFirst(locationBias))) {
      amapAnswer = await keyed.provider.searchText(query, lang, locationBias).catch((err: unknown) => {
        console.warn('Amap search failed, falling back:', (err as Error).message);
        return null;
      });
      if (amapAnswer && amapAnswer.length > 0) return { places: amapAnswer, source: 'amap' };
    }

    // A search sent to Google on purpose, or the admin's "Google only" switch,
    // skips the pair the same way: the search then reads exactly as it did
    // before 4.3.0 on an install with a key.
    if (
      this.trekPlacesEnabled() &&
      !(opts.googleIdentityOnly && apiKey) &&
      !(await this.selector.googleOnly(keyed, opts.googleOnly))
    ) {
      // Both at once. The index is a dataset of businesses and is very good
      // at those; OpenStreetMap is where the temples, bridges, riverside
      // walks and viewpoints are, and a travel search asks for those
      // constantly. Concurrently, so the pair costs the slower one rather
      // than the sum. This is the explicit search, not the keystroke path
      // Nominatim's policy rules out.
      //
      // Each side catches its own failure. A rejection reaching Promise.all
      // would throw away the answer the other side had already produced — and
      // the index refusing a query is ordinary traffic, not an outage: a common
      // single word without coordinates is turned down upstream as too
      // expensive. That used to discard ten good OpenStreetMap results and ask
      // Nominatim the same question a second time, behind its own 1.1 s
      // process-wide throttle.
      const [found, osm] = await Promise.all([
        trekPlacesSearch(query, {
          lat: locationBias?.lat,
          lng: locationBias?.lng,
          limit: 10,
        })
          .then(indexHitsOnly)
          .catch((err: unknown) => {
            console.warn('TREK Places search failed, falling back:', (err as Error).message);
            return [] as TrekPlace[];
          }),
        this.osm.searchNominatim(query, lang, 'interactive', locationBias).catch((err: unknown) => {
          console.warn('OpenStreetMap search failed, index only:', (err as Error).message);
          return [] as Record<string, unknown>[];
        }),
      ]);
      osmAnswer = osm;
      const places = mergeSearchResults(found.map(toPlaceRecord), osm);
      if (places.length > 0) {
        // Names the sources that actually contributed, not the ones that were
        // asked. Either side can come back empty — the index turns down a common
        // single word without coordinates, and OpenStreetMap can be down — and
        // the search log writes this into the corpus a candidate index is later
        // scored against, so a list that is entirely OpenStreetMap must not be
        // recorded as though the index had a hand in it.
        const source =
          found.length > 0 ? (osm.length > 0 ? 'trek-places+openstreetmap' : 'trek-places') : 'openstreetmap';
        return { places, source };
      }
    }

    // Amap in the slot Google otherwise holds: asked only once the index and
    // OpenStreetMap came back empty, exactly like the Google call below.
    if (keyed?.id === 'amap') {
      const places = amapAnswer ?? (await keyed.provider.searchText(query, lang, locationBias));
      return { places, source: 'amap' };
    }

    if (!apiKey) {
      // Reuse what OpenStreetMap already said rather than asking again. The
      // first call carried a viewbox with bounded=0, which orders results
      // without changing which ones exist, so a second call can only return the
      // same empty list a throttle-interval later.
      const places = osmAnswer ?? (await this.osm.searchNominatim(query, lang));
      return { places, source: 'openstreetmap' };
    }

    // Google in its slot: the index and OpenStreetMap came back empty, or this
    // search was sent to Google alone. Its errors carry Google's own status.
    const places = await this.googlePlaces
      .provider({ key: apiKey, source: keySource, userId })
      .searchText(query, lang, locationBias);
    return { places, source: 'google' };
  }

  // ── Places near a point (#976) ─────────────────────────────────────────────

  /**
   * Places of any kind around a coordinate, nearest first, in the shape a search
   * answers with plus `distance_m`. For "what is here" where no name was typed:
   * a photo's location, a pin on the map.
   *
   * Same order as the search: the TREK index first, free and storable; Google
   * only with a key and only when the index has nothing (or the admin set Google
   * only); OpenStreetMap otherwise. Google bills per call, so every answer is
   * cached for a while and the circle and count are capped by the contract.
   */
  async nearbyPlaces(
    userId: number,
    lat: number,
    lng: number,
    opts: { radius?: number; limit?: number; lang?: string } = {},
  ): Promise<{ places: Record<string, unknown>[]; source: string }> {
    const radius = opts.radius ?? NEARBY_DEFAULT_RADIUS_M;
    const limit = opts.limit ?? NEARBY_DEFAULT_LIMIT;
    const lang = toApiLang(opts.lang);
    const key = nearbyCacheKey(lat, lng, radius, limit, lang);
    const cached = NEARBY_CACHE.get(key);
    if (cached && Date.now() - cached.at < NEARBY_CACHE_TTL_MS) return cached.value;

    const value = await this.lookUpNearby(userId, { lat, lng }, radius, limit, lang);
    if (NEARBY_CACHE.size >= NEARBY_CACHE_MAX) NEARBY_CACHE.delete(NEARBY_CACHE.keys().next().value as string);
    NEARBY_CACHE.set(key, { at: Date.now(), value });
    return value;
  }

  private async lookUpNearby(
    userId: number,
    origin: { lat: number; lng: number },
    radius: number,
    limit: number,
    lang: string,
  ): Promise<{ places: Record<string, unknown>[]; source: string }> {
    const keyed = await this.keyedProvider(userId);
    if (this.trekPlacesEnabled() && !(await this.selector.googleOnly(keyed))) {
      // Never throws upward, like the search: a slow index drops to the next source.
      const found = await trekPlacesNearby(origin.lat, origin.lng, { radius, limit }).catch((err: unknown) => {
        console.warn('TREK Places nearby failed, falling back:', (err as Error).message);
        return [];
      });
      if (found.length > 0)
        return { places: nearestFirst(found.map(toPlaceRecord), origin, limit), source: 'trek-places' };
    }

    if (keyed?.id === 'google') {
      const google = this.googlePlaces.provider({ key: keyed.key, source: keyed.source, userId });
      const places = await google.searchNearby(origin, radius, limit, lang);
      return { places: nearestFirst(places, origin, limit), source: 'google' };
    }

    const osmLang = lang.split('-')[0].toLowerCase();
    return { places: await this.osm.nearby(origin, radius, limit, osmLang), source: 'openstreetmap' };
  }

  // ── Autocomplete (Google or Nominatim fallback) ────────────────────────────

  async autocompletePlaces(
    userId: number,
    input: string,
    lang?: string,
    locationBias?: { low: { lat: number; lng: number }; high: { lat: number; lng: number } },
    sessionToken?: string,
  ): Promise<MapsAutocompleteResult> {
    const keyed = await this.keyedProvider(userId);
    const { key: apiKey, source: keySource } = keyed?.id === 'google' ? keyed : { key: null, source: null };

    // This is the path that mattered most. Nominatim's usage policy names
    // autocomplete as unacceptable use in its own words, regardless of rate,
    // and the whole TREK fleet shares one User-Agent there: one abusive install
    // could get every instance blocked at once. The index removes that.
    //
    // Same contract as search: never throws upward, falls through to what this
    // method did before. The admin's "Google only" switch skips the index here
    // too, so the suggestions and the search agree on where they come from.
    // Amap first inside China when the admin picked it, as in the search (#1636).
    let amapTips: MapsAutocompleteResult['suggestions'] | null = null;
    const boxCentre = locationBias
      ? {
          lat: (locationBias.low.lat + locationBias.high.lat) / 2,
          lng: (locationBias.low.lng + locationBias.high.lng) / 2,
        }
      : undefined;
    if (keyed?.id === 'amap' && (await this.selector.amapAnswersFirst(boxCentre))) {
      amapTips = await keyed.provider.autocomplete(input, lang, locationBias).catch((err: unknown) => {
        console.warn('Amap autocomplete failed, falling back:', (err as Error).message);
        return null;
      });
      if (amapTips && amapTips.length > 0) return { suggestions: amapTips, source: 'amap' };
    }

    if (this.trekPlacesEnabled() && !(await this.selector.googleOnly(keyed))) {
      try {
        const centre = boxCentre;
        // Both layers here, unlike the explicit search above. That path asks
        // Nominatim in parallel and would get the same OpenStreetMap places
        // twice; this one asks nobody else, because Nominatim's usage policy
        // names autocomplete as unacceptable use. So the layer is not a second
        // opinion here, it is the only place the missing names live.
        //
        // Measured on the case that surfaced it: "Tokio station" typed from
        // Tokyo returned a weigh station in Ritzville and a station in Mexico
        // from the index alone, and "Tokio Hauptbahnhof" in second place with
        // the layer. The index holds businesses; stations, temples and bridges
        // are in OpenStreetMap, and so is every exonym a traveller types.
        const found = await trekPlacesSearch(input, {
          lat: centre?.lat,
          lng: centre?.lng,
          limit: 8,
          sources: 'index,osm',
        });
        if (found.length > 0) return { suggestions: indexSuggestions(found), source: 'trek-places' };
      } catch (err: unknown) {
        console.warn('TREK Places autocomplete failed, falling back:', (err as Error).message);
      }
    }

    if (keyed?.id === 'amap') {
      const suggestions = amapTips ?? (await keyed.provider.autocomplete(input, lang, locationBias));
      return { suggestions, source: 'amap' };
    }

    if (!apiKey) {
      return this.osm.autocompleteNominatim(input, lang);
    }

    const google = this.googlePlaces.provider({ key: apiKey, source: keySource, userId });
    const suggestions = await google.autocomplete(input, lang, locationBias, sessionToken);
    return { suggestions, source: 'google' };
  }

  // ── Place details (see PlaceDetailsResolver) ────────────────────────────

  getPlaceDetails(
    userId: number,
    placeId: string,
    lang?: string,
    sessionToken?: string,
  ): Promise<{ place: Record<string, unknown> | null }> {
    return this.placeDetails.lookup(userId, placeId, lang, sessionToken, this.trekPlacesEnabled());
  }

  getPlaceDetailsExpanded(
    userId: number,
    placeId: string,
    lang?: string,
    refresh = false,
  ): Promise<{ place: Record<string, unknown> | null }> {
    return this.placeDetails.lookupExpanded(userId, placeId, lang, refresh, this.trekPlacesEnabled());
  }

  /** The marker photo of a place, disk-cached (see PlacePhotoResolver). A miss is `photoUrl: null`, never a 404. */
  getPlacePhoto(
    userId: number,
    placeId: string,
    lat: number,
    lng: number,
    name?: string,
  ): Promise<{ photoUrl: string | null; attribution: string | null }> {
    return this.photos.resolve(userId, placeId, lat, lng, name);
  }

  // ── Reverse geocoding ──────────────────────────────────────────────────────

  async reverseGeocode(
    lat: string,
    lng: string,
    lang?: string,
    opts?: { lane?: GeoLane; timeoutMs?: number; locality?: boolean },
  ): Promise<{ name: string | null; address: string | null }> {
    // Amap answers first when it holds the keyed slot, and only for a point it
    // can possibly know: outside its box the call would cost a round trip to
    // come back empty before Nominatim is asked anyway. Resolved at userId 0,
    // because most callers here have no person behind them (a booking import,
    // an Atlas tile, a right-click on a shared map): the chain stops at the
    // operator env var and the instance-wide row, and nobody's personal key is
    // read on somebody else's behalf (#1939). Nominatim stays the fallback, so
    // an Amap outage does not take a right-click down with it.
    const amap = await this.resolvePlacesProvider(0);
    if (amap) {
      const latNum = Number.parseFloat(lat);
      const lngNum = Number.parseFloat(lng);
      if (Number.isFinite(latNum) && Number.isFinite(lngNum) && !isOutsideChina(latNum, lngNum)) {
        try {
          const answer = await amap.reverse(latNum, lngNum, lang);
          if (answer) return answer;
        } catch (err) {
          console.error('[Maps] amap reverse geocode failed, falling back to Nominatim:', (err as Error).message);
        }
      }
    }

    return this.osm.reverse(lat, lng, lang, opts);
  }

  // ── Resolve Google Maps URL ────────────────────────────────────────────────

  async resolveGoogleMapsUrl(url: string): Promise<ResolvedMapsUrl> {
    const link = await this.links.resolve(url);
    if (link.kind === 'resolved') return link.result;
    // An Amap point is named the way a right-click is, Amap first inside China.
    const reverse = await this.reverseGeocode(String(link.lat), String(link.lng), undefined, { timeoutMs: 8000 });
    return {
      lat: link.lat,
      lng: link.lng,
      name: link.name || reverse.name,
      address: reverse.address,
      google_ftid: null,
    };
  }
}
