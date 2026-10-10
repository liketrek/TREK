/**
 * The marker photo of a place: Google's first photo for a Google id, otherwise
 * (and as the fallback) a Wikipedia or Commons picture near its coordinates,
 * cached on disk and served through /api/maps/place-photo/:id/bytes.
 *
 * Everything the cache needs to stay cheap lives here: the disk hit, the
 * negative cache that tells "no photo anywhere" (a day) from "the provider
 * failed" (minutes), the in-flight dedupe of concurrent requests for one place
 * and the shared photo-fetch slots. MapsService.getPlacePhoto delegates to it.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import { GooglePlacesClient } from './providers/google-places.provider';
import { WikimediaClient } from './providers/wikimedia.client';
import { PlacesProviderSelector } from './places-provider.selector';
import { withPhotoFetchSlot } from './photo-fetch-slot';
import { isGooglePlaceId } from './maps.helpers';

@Injectable()
export class PlacePhotoResolver {
  constructor(
    private readonly photoCache: PlacePhotoCacheService,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    private readonly googlePlaces: GooglePlacesClient,
    private readonly wiki: WikimediaClient,
    private readonly selector: PlacesProviderSelector,
  ) {}

  async resolve(
    userId: number,
    placeId: string,
    lat: number,
    lng: number,
    name?: string,
  ): Promise<{ photoUrl: string | null; attribution: string | null }> {
    // Disk cache hit — serve immediately, no Google call
    const diskHit = await this.photoCache.get(placeId);
    if (diskHit) return { photoUrl: diskHit.photoUrl, attribution: diskHit.attribution };

    // "No photo for this place" is an empty result, not a missing resource: a trip
    // view asks for one photo per place, so answering each miss with a 404 makes a
    // normal itinerary render look like a 404 scan to fail2ban/CrowdSec and gets
    // the user's IP banned. Every miss below returns photoUrl: null instead — the
    // same shape the photos kill-switch already returns.
    const noPhoto = { photoUrl: null, attribution: null };

    // Recent miss — don't hammer the API
    if (await this.photoCache.getErrored(placeId)) return noPhoto;

    // Deduplicate concurrent requests for the same placeId
    const existing = this.photoCache.getInFlight(placeId);
    if (existing !== undefined) {
      const result = await existing;
      if (!result) return noPhoto;
      return { photoUrl: `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`, attribution: result.attribution };
    }

    // Tells the two empty outcomes apart for the negative cache below: a place that
    // has no photo anywhere is worth remembering for a day, a provider that refused
    // or timed out only for a few minutes.
    let providerFailed = false;

    const fetchPromise = (async (): Promise<{ attribution: string | null } | null> => {
      return withPhotoFetchSlot(async () => {
        const apiKey = await this.selector.getMapsKey(userId);

        // Coordinate-based Wikipedia/Wikimedia lookup. Used for coordinate-only
        // (right-click) places and as a fallback when a Google place yields no photo,
        // so a place added via search still gets a marker image when Google returns
        // nothing. Returns null (without marking an error) so the caller decides.
        const fetchWikimediaFallback = async (): Promise<{ attribution: string | null } | null> => {
          const outcome = await this.wiki.downloadPhoto(lat, lng, name);
          if (outcome.kind === 'failed') providerFailed = true;
          if (outcome.kind !== 'photo') return null;
          try {
            const cached = await this.photoCache.put(placeId, outcome.bytes, outcome.attribution);
            return { attribution: cached.attribution };
          } catch {
            providerFailed = true;
            return null;
          }
        };

        // Google Places photo for a Google place_id. Returns null on any miss — no
        // key, request rejected, no photos, or a failed media download — so the
        // caller can fall back to Wikimedia; the misses that were Google's fault
        // flag providerFailed on the way out.
        const fetchGooglePhoto = async (): Promise<{ attribution: string | null } | null> => {
          if (!apiKey) return null;
          const outcome = await this.googlePlaces.firstPhoto(placeId, apiKey);
          if (outcome.kind === 'failed') providerFailed = true;
          if (outcome.kind !== 'photo') return null;

          const cached = await this.photoCache.put(placeId, outcome.bytes, outcome.attribution);

          // Persist stable proxy URL to database
          try {
            await this.placesRepo.setImageUrlIfUnset(placeId, cached.photoUrl);
          } catch (dbErr) {
            console.error('Failed to persist photo URL to database:', dbErr);
          }

          return { attribution: outcome.attribution };
        };

        // Prefer the Google photo (higher quality); if Google yields nothing, fall
        // back to the same coordinate-based Wikipedia/OSM lookup that right-click
        // places use. Ids Google cannot resolve skip it entirely.
        if (isGooglePlaceId(placeId)) {
          const googlePhoto = await fetchGooglePhoto();
          if (googlePhoto) return googlePhoto;
        }

        const fallback = await fetchWikimediaFallback();
        if (fallback) return fallback;

        await this.photoCache.markError(placeId, providerFailed ? 'provider-error' : 'no-photo');
        return null;
      });
    })();

    this.photoCache.setInFlight(placeId, fetchPromise);

    const result = await fetchPromise;
    if (!result) return noPhoto;
    return { photoUrl: `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`, attribution: result.attribution };
  }
}
