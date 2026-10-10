/**
 * Google Places (New) behind the keyed places-provider seam.
 *
 * Two halves. `GooglePlacesClient` is the injectable transport: every request to
 * places.googleapis.com goes through its `fetch`, which counts the call against
 * the admin's daily ceiling (#1582), honours PLACES_API_BASE, sends the Referer
 * an HTTP-referrer-restricted key needs and puts a default deadline on the call.
 * `GooglePlacesProvider` is that transport bound to one credential for one
 * request, the shape AmapPlacesProvider has, and answers in the normalised place
 * shape the rest of TREK reads.
 *
 * MapsService decides WHEN Google is asked (after the index and OpenStreetMap,
 * or alone under the admin's "Google only" switch) and caches what it answers;
 * this file only knows how to ask. It must never import MapsService: the
 * orchestrator depends on its providers, not the other way round
 * (lint:boundaries holds that).
 */
import { Injectable } from '@nestjs/common';
import { normalizePlaceWebsite } from '@trek/shared';
import { readEnv, getAppUrl } from '../../../app-config';
import type { ApiKeySource } from '../../settings/instance-api-keys';
import { GoogleQuotaService } from '../../google-quota/google-quota.service';
import {
  googleFtidFromMapsUrl,
  isGooglePlaceId,
  normalizeOpeningPeriods,
  normalizeSpecialDays,
  toApiLang,
  type GoogleOpeningHours,
} from '../maps.helpers';
import { SEARCH_TEXT_FIELD_MASK } from './google-places.constants';
import type {
  PlacesProvider,
  ProviderCredential,
  ProviderPlace,
  ProviderSuggestion,
  SearchBias,
  ViewportBias,
} from './places-provider';

// ── Google API call counter ───────────────────────────────────────────────────

let googleApiCallCount = 0;

/** The upstream every Places call is written against. */
const PLACES_UPSTREAM = 'https://places.googleapis.com';

/**
 * Sends the call somewhere else when PLACES_API_BASE is set.
 *
 * The Places endpoints below all spell out the upstream host, so an install
 * that wants these calls to leave through something of its own — an egress proxy,
 * a cache, a gateway holding the key — has no way to say so today. One variable,
 * substituted at the one place every call funnels through.
 *
 * Path and query are untouched, so the replacement has to speak the same API.
 * Unset, which is every install today, the string is returned as it came in.
 */
function placesEndpoint(endpoint: string): string {
  const base = readEnv().maps.placesApiBase;
  if (!base || !endpoint.startsWith(PLACES_UPSTREAM)) return endpoint;
  // The character before the run is matched and written straight back. A bare
  // /\/+$/ restarts at every slash of a base that does not end in one, reading
  // the rest of the run again from each of them.
  return base.replace(/([^/]|^)\/+$/, '$1') + endpoint.slice(PLACES_UPSTREAM.length);
}

/**
 * Says which of the three credentials Google rejected, never which value.
 *
 * The response body Google sends ("The caller does not have permission") is
 * identical whichever key was used, so without this line a report of "works for
 * the admin, fails for everyone else" cannot be told apart from a genuinely
 * broken key.
 */
function logKeyFailure(label: string, status: number, userId: number, source: ApiKeySource | null): void {
  console.error(`[Maps] ${label} failed with ${status} userId=${userId} keySource=${source}`);
}

/** Ceiling for one Google Places call. Generous — the photo download is the slow one. */
const GOOGLE_FETCH_TIMEOUT_MS = 20000;

function googleFetch(rawEndpoint: string, label: string, init?: RequestInit): Promise<Response> {
  const endpoint = placesEndpoint(rawEndpoint);
  googleApiCallCount++;
  console.debug(`[Google API] #${googleApiCallCount} ${label} → ${endpoint}`);
  const referer = readEnv().app.appUrl ? getAppUrl() : undefined;
  return fetch(endpoint, {
    ...init,
    // A default ceiling here rather than at each of the call sites, none of
    // which passed one: a hung upstream held the request handler open for as
    // long as it liked. A caller that needs longer still wins, it only has to
    // say so.
    signal: init?.signal ?? AbortSignal.timeout(GOOGLE_FETCH_TIMEOUT_MS),
    headers: { ...(referer ? { Referer: referer } : {}), ...((init?.headers as Record<string, string>) ?? {}) },
  });
}

// ── Wire shapes ──────────────────────────────────────────────────────────────

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  /** OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY. Absent on non-business results. */
  businessStatus?: string;
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  types?: string[];
  googleMapsUri?: string;
}

interface GoogleAutocompleteSuggestion {
  placePrediction?: {
    placeId: string;
    structuredFormat?: {
      mainText?: { text: string };
      secondaryText?: { text: string };
    };
  };
}

interface GooglePlaceDetails extends GooglePlaceResult {
  userRatingCount?: number;
  regularOpeningHours?: GoogleOpeningHours;
  editorialSummary?: { text: string };
  reviews?: {
    authorAttribution?: { displayName?: string; photoUri?: string };
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
  }[];
  photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
}

/** A Google place as the record every search answers with. */
function googlePlaceRecord(p: GooglePlaceResult): Record<string, unknown> {
  return {
    google_place_id: p.id,
    google_ftid: googleFtidFromMapsUrl(p.googleMapsUri),
    name: p.displayName?.text || '',
    address: p.formattedAddress || '',
    // `?? null`, not `|| null`: 0 is a real coordinate (equator / prime meridian).
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    rating: p.rating || null,
    website: normalizePlaceWebsite(p.websiteUri),
    phone: p.nationalPhoneNumber || null,
    types: p.types || [],
    source: 'google',
  };
}

/** A place that has shut down for good is never the answer to "where should we go" (#1341). */
const isOpenGooglePlace = (p: GooglePlaceResult) => p.businessStatus !== 'CLOSED_PERMANENTLY';

const DETAILS_FIELD_MASK =
  'id,displayName,formattedAddress,location,rating,userRatingCount,websiteUri,nationalPhoneNumber,regularOpeningHours,googleMapsUri';

/** A Google error answer as the Error the callers have always thrown: Google's message, Google's status. */
function googleError(data: { error?: { message?: string } }, fallback: string, status: number): Error & { status: number } {
  const err = new Error(data.error?.message || fallback) as Error & { status: number };
  err.status = status;
  return err;
}

/** The details record both tiers share; the expanded tier adds the summary and reviews. */
function detailsRecord(data: GooglePlaceDetails): Record<string, unknown> {
  return {
    google_place_id: data.id,
    google_ftid: googleFtidFromMapsUrl(data.googleMapsUri),
    name: data.displayName?.text || '',
    address: data.formattedAddress || '',
    // `?? null`, not `|| null`: 0 is a real coordinate (equator / prime meridian).
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
    rating: data.rating || null,
    rating_count: data.userRatingCount || null,
    website: normalizePlaceWebsite(data.websiteUri),
    phone: data.nationalPhoneNumber || null,
    opening_hours: data.regularOpeningHours?.weekdayDescriptions || null,
    open_now: data.regularOpeningHours?.openNow ?? null,
    // open_now is a snapshot Google took when this payload was fetched and it is cached
    // for days; the periods let the client recompute the state in the place's own
    // timezone, which the localised weekday lines above cannot do. Issue #1680.
    opening_periods: normalizeOpeningPeriods(data.regularOpeningHours?.periods),
    opening_special_days: normalizeSpecialDays(data.regularOpeningHours?.specialDays),
    google_maps_url: data.googleMapsUri || null,
  };
}

/** What a photo lookup for one place came back with. */
export type GooglePhotoOutcome =
  | { kind: 'photo'; bytes: Buffer; attribution: string | null }
  /** The place has no photo at Google: remembered as a plain miss. */
  | { kind: 'none' }
  /** Google refused or the download broke: remembered only briefly. */
  | { kind: 'failed' };

// ── Transport ────────────────────────────────────────────────────────────────

@Injectable()
export class GooglePlacesClient {
  constructor(private readonly googleQuota: GoogleQuotaService) {}

  /** Every call to Google goes through here, so the admin's daily ceiling sees it (#1582). */
  async fetch(endpoint: string, label: string, init?: RequestInit): Promise<Response> {
    await this.googleQuota.record();
    return googleFetch(endpoint, label, init);
  }

  /** The provider for one request's credential. Cheap: it holds the key and this client. */
  provider(credential: ProviderCredential): GooglePlacesProvider {
    return new GooglePlacesProvider(credential, this);
  }

  /**
   * Photo references for a Google place, capped by the caller.
   *
   * Split out from the bytes download on purpose: this is one billed Details
   * call for the whole strip, while every reference turned into an image is a
   * separate billed /media call. Callers fetch bytes only for what they show.
   */
  async fetchGooglePhotoRefs(placeId: string, apiKey: string, cap: number): Promise<{ name: string; attribution: string | null }[]> {
    if (!isGooglePlaceId(placeId) || cap < 1) return [];
    try {
      const res = await this.fetch(`https://places.googleapis.com/v1/places/${placeId}`, `fetchGooglePhotoRefs(${placeId})`, {
        headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos' },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as GooglePlaceDetails;
      return (data.photos ?? []).slice(0, cap).map((photo) => ({
        name: photo.name,
        attribution: photo.authorAttributions?.[0]?.displayName || null,
      }));
    } catch {
      return [];
    }
  }

  /** Image bytes for one photo reference. Null on any miss; the caller skips it. */
  async fetchGooglePhotoBytes(photoName: string, apiKey: string, maxHeightPx = 400): Promise<Buffer | null> {
    try {
      const res = await this.fetch(
        `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeightPx}`,
        `fetchGooglePhotoBytes(${photoName})`,
        { headers: { 'X-Goog-Api-Key': apiKey } },
      );
      if (!res.ok) return null;
      const bytes = Buffer.from(await res.arrayBuffer());
      return bytes.length ? bytes : null;
    } catch {
      return null;
    }
  }

  /**
   * Google's editorial summary, on its own.
   *
   * The expanded details would also return this, but that field mask includes
   * `reviews`, which moves the call into the Enterprise SKU. Enrichment only
   * wants the sentence, so it asks for the sentence.
   */
  async fetchEditorialSummary(placeId: string, apiKey: string, lang?: string): Promise<string | null> {
    if (!isGooglePlaceId(placeId)) return null;
    try {
      const res = await this.fetch(
        `https://places.googleapis.com/v1/places/${placeId}?languageCode=${toApiLang(lang)}`,
        `fetchEditorialSummary(${placeId})`,
        { headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'editorialSummary' } },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as GooglePlaceDetails;
      return data.editorialSummary?.text?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * The first photo of a place, bytes and credit, for the marker image.
   *
   * Two billed calls: the details call that names the photo and the media
   * download. The outcome tells a place with no photo apart from a call that
   * went wrong, because the negative cache keeps the first for a day and the
   * second for minutes. Throws only when the transport itself does.
   *
   * @txIndependent two billed calls with network I/O between them: each counts
   * against the daily ceiling on its own, as it is made.
   */
  async firstPhoto(placeId: string, apiKey: string): Promise<GooglePhotoOutcome> {
    // Fetch details to get the photo name
    const detailsRes = await this.fetch(`https://places.googleapis.com/v1/places/${placeId}`, `getPlacePhoto/details(${placeId})`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'photos',
      },
    });
    const body = await detailsRes.text();
    if (!detailsRes.ok) {
      console.error('Google Places photo details error:', detailsRes.status, body.slice(0, 200));
      return { kind: 'failed' };
    }
    let details: GooglePlaceDetails & { error?: { message?: string } };
    try {
      details = body ? JSON.parse(body) : { photos: [] };
    } catch {
      return { kind: 'failed' };
    }
    if (!details.photos?.length) return { kind: 'none' };

    const photo = details.photos[0];
    const photoName = photo.name;
    const attribution = photo.authorAttributions?.[0]?.displayName || null;

    // Fetch actual image bytes
    const mediaRes = await this.fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400`,
      `getPlacePhoto/media(${placeId})`,
      { headers: { 'X-Goog-Api-Key': apiKey } },
    );
    // The place does have a photo — only the download for it went wrong.
    if (!mediaRes.ok) return { kind: 'failed' };

    const bytes = Buffer.from(await mediaRes.arrayBuffer());
    if (!bytes.length) return { kind: 'failed' };
    return { kind: 'photo', bytes, attribution };
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export class GooglePlacesProvider implements PlacesProvider {
  readonly id = 'google' as const;

  constructor(
    private readonly credential: ProviderCredential,
    private readonly client: GooglePlacesClient,
  ) {}

  async searchText(query: string, lang?: string, bias?: SearchBias): Promise<ProviderPlace[]> {
    const searchBody: Record<string, unknown> = { textQuery: query, languageCode: toApiLang(lang) };
    // Bias results toward the caller's area when supplied — without it Google Text
    // Search falls back to the API key's billing region, which skews foreign-region queries.
    //
    // Clamped, like the nearby path: Google caps the circle at 50 km and answers
    // a wider one with a 400 that this method throws, so a trip spread across a
    // hundred kilometres would turn an ordinary search into an error toast. The
    // client keeps its own ceiling; this one is here because the radius arrives
    // over the wire and the schema cannot know Google's limit.
    if (bias) {
      searchBody.locationBias = {
        circle: {
          center: { latitude: bias.lat, longitude: bias.lng },
          radius: Math.min(50000, Math.max(1, bias.radius ?? 50000)),
        },
      };
    }

    const response = await this.client.fetch('https://places.googleapis.com/v1/places:searchText', 'searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.credential.key,
        'X-Goog-FieldMask': SEARCH_TEXT_FIELD_MASK,
      },
      body: JSON.stringify(searchBody),
    });

    const data = (await response.json()) as { places?: GooglePlaceResult[]; error?: { message?: string } };

    if (!response.ok) {
      logKeyFailure('searchText', response.status, this.credential.userId, this.credential.source);
      throw googleError(data, 'Google Places API error', response.status);
    }

    // A place that has shut down for good is never the answer to "where should we
    // go" (#1341). Temporarily closed stays: a restaurant on holiday next month is
    // still worth planning around. Anything without the field is a non-business
    // result (a park, a viewpoint) and is kept.
    return (data.places || []).filter(isOpenGooglePlace).map(googlePlaceRecord);
  }

  /** Places of any kind around a point, nearest first by Google's own ranking (#976). */
  async searchNearby(origin: { lat: number; lng: number }, radius: number, limit: number, lang: string): Promise<ProviderPlace[]> {
    const response = await this.client.fetch('https://places.googleapis.com/v1/places:searchNearby', 'searchNearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': this.credential.key, 'X-Goog-FieldMask': SEARCH_TEXT_FIELD_MASK },
      body: JSON.stringify({
        maxResultCount: limit,
        rankPreference: 'DISTANCE',
        languageCode: lang,
        locationRestriction: { circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius } },
      }),
    });
    const data = (await response.json()) as { places?: GooglePlaceResult[]; error?: { message?: string } };
    if (!response.ok) {
      logKeyFailure('searchNearby', response.status, this.credential.userId, this.credential.source);
      throw Object.assign(new Error(data.error?.message || 'Google Places API error'), { status: response.status });
    }
    return (data.places || []).filter(isOpenGooglePlace).map(googlePlaceRecord);
  }

  async autocomplete(input: string, lang?: string, bias?: ViewportBias, sessionToken?: string): Promise<ProviderSuggestion[]> {
    const body: Record<string, unknown> = {
      input,
      languageCode: toApiLang(lang),
    };
    // With a session token Google bills the whole search as one autocomplete
    // session instead of charging each keystroke; the details call that closes
    // the session carries the same token.
    if (sessionToken) body.sessionToken = sessionToken;
    if (bias) {
      body.locationBias = {
        rectangle: {
          low: { latitude: bias.low.lat, longitude: bias.low.lng },
          high: { latitude: bias.high.lat, longitude: bias.high.lng },
        },
      };
    }

    const response = await this.client.fetch('https://places.googleapis.com/v1/places:autocomplete', 'autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.credential.key,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      suggestions?: GoogleAutocompleteSuggestion[];
      error?: { message?: string };
    };

    if (!response.ok) {
      logKeyFailure('autocomplete', response.status, this.credential.userId, this.credential.source);
      throw googleError(data, 'Google Places Autocomplete error', response.status);
    }

    return (data.suggestions || [])
      .filter((s) => s.placePrediction)
      .slice(0, 5)
      .map((s) => ({
        placeId: s.placePrediction!.placeId,
        mainText: s.placePrediction!.structuredFormat?.mainText?.text || '',
        secondaryText: s.placePrediction!.structuredFormat?.secondaryText?.text || '',
      }));
  }

  /**
   * The lean details record. A Google error is thrown with Google's message and
   * status, never answered as a miss: unlike search, a details call names one
   * place the caller already holds.
   */
  async placeDetails(placeId: string, lang?: string, sessionToken?: string): Promise<ProviderPlace | null> {
    const langKey = toApiLang(lang);
    // Closes the autocomplete session this lookup belongs to, so Google bills
    // the search once instead of per keystroke.
    const sessionParam = sessionToken ? `&sessionToken=${encodeURIComponent(sessionToken)}` : '';
    const response = await this.client.fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=${langKey}${sessionParam}`,
      `getPlaceDetails(${placeId})`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.credential.key,
          'X-Goog-FieldMask': DETAILS_FIELD_MASK,
        },
      },
    );

    const data = (await response.json()) as GooglePlaceDetails & { error?: { message?: string } };
    if (!response.ok) throw googleError(data, 'Google Places API error', response.status);

    return {
      ...detailsRecord(data),
      summary: null,
      reviews: [],
      source: 'google' as const,
      cached_at: Date.now(),
    };
  }

  /** The details record with the editorial summary and up to five reviews (the Enterprise SKU). */
  async placeDetailsExpanded(placeId: string, lang?: string): Promise<ProviderPlace> {
    const langKey = toApiLang(lang);
    const response = await this.client.fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=${langKey}`,
      `getPlaceDetailsExpanded(${placeId})`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.credential.key,
          'X-Goog-FieldMask': `${DETAILS_FIELD_MASK},reviews,editorialSummary`,
        },
      },
    );

    const data = (await response.json()) as GooglePlaceDetails & { error?: { message?: string } };
    if (!response.ok) throw googleError(data, 'Google Places API error', response.status);

    return {
      ...detailsRecord(data),
      summary: data.editorialSummary?.text || null,
      reviews: (data.reviews || []).slice(0, 5).map((r: NonNullable<GooglePlaceDetails['reviews']>[number]) => ({
        author: r.authorAttribution?.displayName || null,
        rating: r.rating || null,
        text: r.text?.text || null,
        time: r.relativePublishTimeDescription || null,
        photo: r.authorAttribution?.photoUri || null,
      })),
      source: 'google' as const,
      cached_at: Date.now(),
    };
  }

  /**
   * Google is never asked to reverse-geocode: the Places API bills for it and
   * Nominatim (or Amap inside China) answers the question for free. Null is the
   * interface's "nothing for this point", which sends the caller on.
   */
  async reverse(): Promise<{ name: string | null; address: string | null } | null> {
    return null;
  }
}
