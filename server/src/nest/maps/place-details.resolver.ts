/**
 * Place details by id, from whichever source the id belongs to: the TREK index
 * (`gers:`), Amap (`amap:`), OpenStreetMap (`node:` / `way:` / `relation:`) or
 * Google (everything else that is a Google place id), with the lean and the
 * expanded details cache in front of the keyed providers.
 *
 * MapsService.getPlaceDetails / getPlaceDetailsExpanded delegate here and hand
 * in whether the index is switched on, which is a deployment property they own.
 */
import { PlaceDetailsCache } from '../../db/entities/PlaceDetailsCache.entity';
import type { PlaceDetailsCacheRepository } from '../../db/repositories/PlaceDetailsCache.repository';
import { indexPlaceDetails } from './maps-index.helpers';
import { toApiLang, isGooglePlaceId, OSM_PLACE_ID } from './maps.helpers';
import { PlacesProviderSelector } from './places-provider.selector';
import { isAmapPlaceId } from './providers/amap.provider';
import { GooglePlacesClient } from './providers/google-places.provider';
import { OsmClient } from './providers/osm.client';
import { trekPlacesById } from './trek-places.client';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { normalizePlaceWebsite } from '@trek/shared';

/**
 * A details row as the cache holds it. A row written before #2483 still has a
 * source's website as it came, `www.hotel.cn` from Amap for one, and keeps for a
 * week (an expanded one until a refresh), so the website is normalized on the
 * way out of the cache as well as on the way in.
 */
function cachedDetails(payload: string): Record<string, unknown> | null {
  const place = JSON.parse(payload) as Record<string, unknown> | null;
  return place && 'website' in place ? { ...place, website: normalizePlaceWebsite(place.website) } : place;
}

/** How long a lean details answer is served from the cache. */
const DETAILS_TTL = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class PlaceDetailsResolver {
  constructor(
    @InjectRepository(PlaceDetailsCache) private readonly placeDetailsCache: PlaceDetailsCacheRepository,
    private readonly googlePlaces: GooglePlacesClient,
    private readonly osm: OsmClient,
    private readonly selector: PlacesProviderSelector,
  ) {}

  async lookup(
    userId: number,
    placeId: string,
    lang: string | undefined,
    sessionToken: string | undefined,
    indexEnabled: boolean,
  ): Promise<{ place: Record<string, unknown> | null }> {
    // A place picked out of the TREK index. Checked BEFORE the generic
    // colon branch below, which would otherwise read "gers" as an OSM type
    // and ask Overpass for an element that does not exist.
    if (placeId.startsWith('gers:')) {
      // The switch is a deployment property, and off means nothing leaves for
      // the index: a place saved while it was on is still opened from what the
      // trip holds, not looked up again.
      if (!indexEnabled) return { place: null };
      const found = await trekPlacesById(placeId.slice('gers:'.length)).catch(() => null);
      if (!found) return { place: null };

      // What the index lacks, OpenStreetMap often has for the same building
      // (see indexPlaceDetails). Matched by name and coordinate, with the same two gates
      // resolveOsmIdentity applies everywhere: within range, and sharing a
      // substantial word of the name. A confident description of the building
      // next door is worse than none.
      const osm = await this.osm
        .resolveOsmIdentity(found.name, found.lat, found.lng, {
          lang,
          maxDistanceM: 150,
        })
        .catch(() => null);

      return { place: indexPlaceDetails(found, osm?.tags ?? null, placeId) };
    }

    // An Amap id is `amap:<poiid>` and so carries a colon too. Before the OSM
    // branch, which would otherwise send "amap" to Overpass as an element type
    // and answer every Chinese place with an empty record.
    if (isAmapPlaceId(placeId)) return this.amapDetails(userId, placeId, lang);

    // OSM details: placeId is "node:123456" or "way:123456" etc.
    if (placeId.includes(':')) return { place: await this.osm.elementDetails(placeId, lang) };

    // Google details
    // 'en' default, aligned with search/autocomplete and the MCP tools' ?? 'en'
    // (the 'de' the legacy service defaulted to was a development leftover;
    // cache rows keyed 'de' for lang-less callers go cold once — 7-day TTL).
    const langKey = toApiLang(lang);
    const apiKey = await this.selector.getMapsKey(userId);
    // No key means no way to resolve a Google id: they have no OpenStreetMap
    // equivalent to fall back to. That is an empty result, not a client error.
    // Search and autocomplete already answer their keyless case with the OSM
    // stack; this used to be the one place that threw instead, which turned an
    // instance without a key into a stream of 400s whenever an older Google
    // place was opened. Callers already treat a null place as a miss.
    if (!apiKey) return { place: null };

    // The details call closes the autocomplete session this lookup belongs to,
    // so Google bills the search once instead of per keystroke. A cache hit
    // never reaches it, which is billing-neutral: an unclosed session is
    // charged as a plain autocomplete session.
    const google = this.googlePlaces.provider({ key: apiKey, source: null, userId });
    return this.detailsThroughCache(placeId, langKey, () => google.placeDetails(placeId, lang, sessionToken));
  }

  /**
   * The lean details cache (expanded=0, seven days) in front of one provider
   * lookup. Keyed by place_id, and an Amap id carries its `amap:` prefix, so the
   * providers' rows cannot collide. A failed cache write costs the cache, not
   * the answer.
   */
  private async detailsThroughCache(
    placeId: string,
    langKey: string,
    lookup: () => Promise<Record<string, unknown> | null>,
  ): Promise<{ place: Record<string, unknown> | null }> {
    const cached = await this.placeDetailsCache.findEntry(placeId, langKey, 0);
    if (cached && Date.now() - cached.fetched_at < DETAILS_TTL) return { place: cachedDetails(cached.payload_json) };

    const place = await lookup();
    if (!place) return { place: null };

    try {
      await this.placeDetailsCache.upsertEntry({
        place_id: placeId,
        lang: langKey,
        expanded: 0,
        payload_json: JSON.stringify(place),
        fetched_at: Date.now(),
      });
    } catch (dbErr) {
      console.error('Failed to cache place details:', dbErr);
    }

    return { place };
  }

  /**
   * The Amap half of getPlaceDetails, behind the same cache the Google half
   * uses.
   *
   * No key for the id is an empty result, not a client error, for the same
   * reason the Google half answers its keyless case that way: an Amap place
   * opened on an install that has since dropped its Amap key is a miss.
   */
  private async amapDetails(
    userId: number,
    placeId: string,
    lang?: string,
  ): Promise<{ place: Record<string, unknown> | null }> {
    const provider = await this.selector.providerForPlaceId(userId, placeId);
    if (!provider) return { place: null };
    return this.detailsThroughCache(placeId, toApiLang(lang), () => provider.placeDetails(placeId, lang));
  }

  async lookupExpanded(
    userId: number,
    placeId: string,
    lang: string | undefined,
    refresh: boolean,
    indexEnabled: boolean,
  ): Promise<{ place: Record<string, unknown> | null }> {
    // Reviews and the editorial summary only exist at Google, but the id does not
    // have to be a Google one — the client sends whatever the place carries. OSM ids
    // keep the details they do have (Overpass, via the plain lookup); coordinate
    // pseudo-ids and legacy image URLs have no details source at all. Neither may be
    // forwarded to Google, which bills the 400 INVALID_ARGUMENT it answers with.
    //
    // Index ids degrade the same way, for the same reason: the plain lookup has a
    // whole record for them — name, address, contact, hours — and only the reviews
    // and the editorial summary are Google's to add. Answering `expand=1` with a
    // null while `expand=0` answers in full would make the richer request the
    // poorer one. An Amap id has no richer tier either, so it takes the plain
    // lookup as well.
    if (!isGooglePlaceId(placeId)) {
      return OSM_PLACE_ID.test(placeId) || placeId.startsWith('gers:') || isAmapPlaceId(placeId)
        ? this.lookup(userId, placeId, lang, undefined, indexEnabled)
        : { place: null };
    }

    const langKey = toApiLang(lang); // 'en' default — see lookup
    const apiKey = await this.selector.getMapsKey(userId);
    // Same as the lean lookup above: an empty result, not a client error.
    if (!apiKey) return { place: null };

    // Check DB cache for expanded result
    if (!refresh) {
      const cached = await this.placeDetailsCache.findEntry(placeId, langKey, 1);
      if (cached) return { place: cachedDetails(cached.payload_json) };
    }

    const place = await this.googlePlaces
      .provider({ key: apiKey, source: null, userId })
      .placeDetailsExpanded(placeId, lang);

    try {
      await this.placeDetailsCache.upsertEntry({
        place_id: placeId,
        lang: langKey,
        expanded: 1,
        payload_json: JSON.stringify(place),
        fetched_at: Date.now(),
      });
    } catch (dbErr) {
      console.error('Failed to cache expanded place details:', dbErr);
    }

    return { place };
  }
}
