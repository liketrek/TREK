import { Injectable } from '@nestjs/common';
import type {
  MapsPlaceEnrichmentRequest,
  MapsPlaceEnrichmentResult,
  PlaceDescription,
  PlacePhotoCandidate,
} from '@trek/shared';
import { safeFetchFollow } from '../../utils/ssrfGuard';
import { DatabaseService } from '../database/database.service';
import { MapsService, withPhotoFetchSlot } from '../maps/maps.service';
import { isGooglePlaceId } from '../maps/maps.helpers';
import { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';

/**
 * How many pictures each source may contribute.
 *
 * Commons is generous because geosearch returns the whole strip in one request
 * either way. Google is not: the reference list is one billed call, but every
 * picture we actually show costs a second billed /media call, on the key of an
 * admin who may not be watching the bill. Three is enough to choose from.
 */
const COMMONS_CAP = 5;
const GOOGLE_CAP = 3;

/**
 * Enrichment results live in the same table as the plain details cache, under a
 * third `expanded` value. Descriptions and the set of pictures near a place
 * change on the order of months, so a week is short enough to pick up edits and
 * long enough that a re-opened planner never pays for the same place twice.
 */
const CACHE_KIND = 2;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Cache key for one candidate picture. Deliberately not a bare place id. */
function candidateKey(placeId: string, index: number): string {
  return `${placeId}~p${index}`;
}

/**
 * The credit line stored alongside a cached picture.
 *
 * `google_place_photo_meta` has one TEXT column for this, so author and licence
 * go in together rather than the author alone. A picture chosen here can end up
 * on the map, in the PDF and behind a share link long after the dialog is gone,
 * and at that point this string is the only record of who made it.
 */
export function creditLine(attribution: string | null, license: string | null): string | null {
  if (attribution && license) return `${attribution} · ${license}`;
  return attribution || license || null;
}

interface CachedEnrichment {
  photos: PlacePhotoCandidate[];
  description: PlaceDescription | null;
}

/**
 * Photos and a description for a place the user is looking at but has not saved
 * yet — the detail column next to the search field in the add-place dialog.
 *
 * Two things shape this service. First, most TREK instances have no Google key,
 * so the free path (OpenStreetMap tags, Wikimedia Commons, Wikipedia) is the
 * normal case and has to stand on its own; Google is an addition an admin opts
 * into, not the design centre. Second, every picture shown here is somebody
 * else's work, so a candidate carries its author and licence from the start
 * rather than having attribution bolted on later.
 */
@Injectable()
export class PlaceEnrichmentService {
  constructor(
    private readonly database: DatabaseService,
    private readonly maps: MapsService,
    private readonly photoCache: PlacePhotoCacheService,
  ) {}

  /**
   * Fail-open, unlike the three older places_* switches: an instance that has
   * never seen this setting gets the feature. Reading it the other way round
   * would mean backfilling a row for every existing install just to keep them
   * working, and there is nothing here that warrants a migration.
   */
  enrichDisabled(): boolean {
    const row = this.database.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', 'places_enrich_enabled');
    return row?.value === 'false';
  }

  async enrich(userId: number, req: MapsPlaceEnrichmentRequest): Promise<MapsPlaceEnrichmentResult> {
    if (this.enrichDisabled()) return { photos: [], description: null, disabled: true };

    const placeId = req.placeId?.trim() || `coords:${req.lat}:${req.lng}`;
    const lang = req.lang;

    const cached = this.readCache(placeId, lang);
    if (cached) return cached;

    // Both halves are independent provider fan-outs; running them in sequence
    // would make the column wait for the slower one twice over.
    const [photos, description] = await Promise.all([
      this.collectPhotos(userId, placeId, req),
      this.collectDescription(userId, placeId, req),
    ]);

    const result: CachedEnrichment = { photos, description };
    this.writeCache(placeId, lang, result);
    return result;
  }

  /**
   * The stored credit for a cached picture, looked up by its cache key.
   *
   * The picker shows author and licence at the moment of choosing, but the
   * obligation does not end there — the place inspector reads this so a picture
   * that was chosen weeks ago still names whoever made it.
   */
  credit(key: string): { credit: string | null } {
    return { credit: this.photoCache.get(key)?.attribution ?? null };
  }

  // ── Photos ─────────────────────────────────────────────────────────────────

  private async collectPhotos(
    userId: number,
    placeId: string,
    req: MapsPlaceEnrichmentRequest,
  ): Promise<PlacePhotoCandidate[]> {
    const out: PlacePhotoCandidate[] = [];

    // Google first when it is available at all — its pictures are of the place
    // itself, while Commons geosearch finds whatever was photographed nearby.
    const apiKey = this.maps.getMapsKey(userId);
    if (apiKey && !this.maps.photosDisabled() && isGooglePlaceId(placeId)) {
      const refs = await this.maps.fetchGooglePhotoRefs(placeId, apiKey, GOOGLE_CAP);
      for (const ref of refs) {
        const key = candidateKey(placeId, out.length);
        const url = await this.storeCandidate(key, creditLine(ref.attribution, null), () =>
          this.maps.fetchGooglePhotoBytes(ref.name, apiKey),
        );
        if (!url) continue;
        out.push({
          key,
          url,
          attribution: ref.attribution,
          // Google grants no reusable licence for these; the author line it
          // hands back is all we may show, so the rest stays honestly empty.
          license: null,
          licenseUrl: null,
          sourceUrl: null,
          source: 'google',
        });
      }
    }

    const commons = await this.maps.fetchCommonsCandidates(req.lat, req.lng, COMMONS_CAP);
    for (const candidate of commons) {
      const key = candidateKey(placeId, out.length);
      const url = await this.storeCandidate(key, creditLine(candidate.attribution, candidate.license), () =>
        this.fetchRemoteBytes(candidate.photoUrl),
      );
      if (!url) continue;
      out.push({
        key,
        url,
        attribution: candidate.attribution,
        license: candidate.license,
        licenseUrl: candidate.licenseUrl,
        sourceUrl: candidate.sourceUrl,
        source: 'wikimedia',
      });
    }

    return out;
  }

  /**
   * Puts one picture in the shared photo cache and returns its proxy URL.
   *
   * Candidates are never hotlinked. A provider URL in the strip would send the
   * IP of everyone who opens the dialog to Google or Wikimedia, and Google's
   * photo URLs expire — which is exactly the bug migration 107 had to repair
   * for the pictures already stored. Whatever nobody picks is unreferenced and
   * the nightly sweep removes it.
   */
  private async storeCandidate(
    key: string,
    credit: string | null,
    fetchBytes: () => Promise<Buffer | null>,
  ): Promise<string | null> {
    const hit = this.photoCache.get(key);
    if (hit) return hit.photoUrl;

    const bytes = await withPhotoFetchSlot(fetchBytes);
    if (!bytes?.length) return null;

    try {
      const stored = await this.photoCache.put(key, bytes, credit);
      return stored.photoUrl;
    } catch (err) {
      console.error('Failed to cache place enrichment photo:', err);
      return null;
    }
  }

  /** Downloads a non-Google image, re-checking every redirect hop against the SSRF guard. */
  private async fetchRemoteBytes(url: string): Promise<Buffer | null> {
    try {
      const res = await safeFetchFollow(url, undefined, { bypassInternalIpAllowed: true });
      if (!res.ok) return null;
      const bytes = Buffer.from(await res.arrayBuffer());
      return bytes.length ? bytes : null;
    } catch {
      return null;
    }
  }

  // ── Description ────────────────────────────────────────────────────────────

  private async collectDescription(
    userId: number,
    placeId: string,
    req: MapsPlaceEnrichmentRequest,
  ): Promise<PlaceDescription | null> {
    const details = await this.readDetails(userId, placeId, req.lang);

    // OpenStreetMap first: it costs nothing, it is already fetched, and a
    // description someone wrote into the map data beats a generated blurb.
    const osmSummary = typeof details?.summary === 'string' ? details.summary.trim() : '';
    if (osmSummary && details?.source === 'openstreetmap') {
      return {
        text: osmSummary,
        source: 'osm',
        sourceUrl: typeof details.osm_url === 'string' ? details.osm_url : null,
        license: 'ODbL 1.0',
      };
    }

    const apiKey = this.maps.getMapsKey(userId);
    if (apiKey && !this.maps.detailsDisabled() && isGooglePlaceId(placeId)) {
      const summary = await this.maps.fetchEditorialSummary(placeId, apiKey, req.lang);
      if (summary) {
        return {
          text: summary,
          source: 'google',
          sourceUrl: typeof details?.google_maps_url === 'string' ? details.google_maps_url : null,
          license: null,
        };
      }
    }

    // Wikipedia last, and only when the place carries a wiki tag. Looking the
    // article up by name lands on the wrong one for anything ambiguous, and a
    // confident description of somewhere else is worse than none.
    const wikipediaTag = typeof details?.wikipedia === 'string' ? details.wikipedia : null;
    const extract = await this.maps.fetchWikipediaExtract(wikipediaTag);
    if (extract) {
      return { text: extract.text, source: 'wikipedia', sourceUrl: extract.sourceUrl, license: 'CC BY-SA 4.0' };
    }

    return null;
  }

  /**
   * The place's own details, for the OSM tags and the Maps URL.
   *
   * This is the same lookup the dialog already made when the user picked the
   * search result, and it is row-cached, so in practice it is a cache read
   * rather than a second provider call.
   */
  private async readDetails(
    userId: number,
    placeId: string,
    lang: string | undefined,
  ): Promise<Record<string, unknown> | null> {
    try {
      const { place } = await this.maps.details(userId, placeId, lang);
      return place ?? null;
    } catch {
      return null;
    }
  }

  // ── Result cache ───────────────────────────────────────────────────────────

  private readCache(placeId: string, lang: string | undefined): CachedEnrichment | null {
    try {
      const row = this.database.get<{ payload_json: string; fetched_at: number }>(
        'SELECT payload_json, fetched_at FROM place_details_cache WHERE place_id = ? AND lang = ? AND expanded = ?',
        placeId,
        lang ?? '',
        CACHE_KIND,
      );
      if (!row || Date.now() - row.fetched_at >= CACHE_TTL_MS) return null;
      const parsed = JSON.parse(row.payload_json) as CachedEnrichment;

      // A cached candidate is only usable while its bytes are still on disk —
      // the nightly sweep removes pictures nobody picked, and serving their
      // proxy URLs afterwards would fill the strip with broken images.
      const photos = parsed.photos.filter((photo) => this.photoCache.get(photo.key));
      return { photos, description: parsed.description ?? null };
    } catch {
      return null;
    }
  }

  private writeCache(placeId: string, lang: string | undefined, value: CachedEnrichment): void {
    try {
      this.database.run(
        'INSERT OR REPLACE INTO place_details_cache (place_id, lang, expanded, payload_json, fetched_at) VALUES (?, ?, ?, ?, ?)',
        placeId,
        lang ?? '',
        CACHE_KIND,
        JSON.stringify(value),
        Date.now(),
      );
    } catch (err) {
      console.error('Failed to cache place enrichment:', err);
    }
  }
}
