import { Injectable } from '@nestjs/common';
import type {
  MapsPlaceEnrichmentRequest,
  MapsPlaceEnrichmentResult,
  PlaceDescription,
  PlaceFact,
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
/**
 * Bumped whenever the shape or the sources change. Without it a release that
 * adds a field or swaps a provider keeps serving the previous week's answers
 * from before the change — which is exactly what happened when the facts and
 * Wikivoyage landed.
 */
const CACHE_VERSION = 2;

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
  facts: PlaceFact[];
}

interface CachePayload extends CachedEnrichment {
  v?: number;
}

/** OSM yes/no tags; anything else (limited, only, designated) is shown verbatim. */
function yesNo(value: unknown): 'yes' | 'no' | string | null {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}

/**
 * Turns the place's OpenStreetMap tags into the short facts the column shows.
 *
 * This is the part that makes the column useful for a restaurant. No wiki will
 * ever describe one and Commons rarely has a picture of it, but its cuisine,
 * its opening hours and a link to its menu are usually right there in the tags
 * — and they arrive with a lookup that has already happened, so they are free.
 *
 * Only positive facts are listed. "No outdoor seating" is noise; a missing tag
 * and a deliberate `no` are indistinguishable to a reader either way.
 */
export function collectFacts(details: Record<string, unknown> | null): PlaceFact[] {
  if (!details) return [];

  const facts: PlaceFact[] = [];
  const push = (kind: PlaceFact['kind'], value: string | null, url: string | null = null) =>
    facts.push({ kind, value, url });

  // Google supplies a rating and hours as well; both come back from the same
  // details lookup and were simply going unused.
  const rating = typeof details.rating === 'number' ? details.rating : null;
  if (rating) {
    const count = typeof details.rating_count === 'number' ? details.rating_count : null;
    push('rating', count ? `${rating} (${count})` : String(rating));
  }

  const hours = Array.isArray(details.opening_hours) ? (details.opening_hours as string[]) : null;
  if (hours?.length) push('openingHours', hours.join(' · '));

  // Everything below is OpenStreetMap tagging and has no Google equivalent.
  if (details.source !== 'openstreetmap') return facts;

  const cuisine = typeof details.cuisine === 'string' ? details.cuisine : null;
  // OSM writes several cuisines semicolon-separated and underscored.
  if (cuisine) push('cuisine', cuisine.split(';').map((c) => c.replace(/_/g, ' ').trim()).filter(Boolean).join(', '));

  const menu = typeof details.menu_url === 'string' ? details.menu_url : null;
  if (menu) push('menu', null, menu);

  if (yesNo(details.outdoor_seating) === 'yes') push('outdoorSeating', null);
  if (yesNo(details.takeaway) === 'yes') push('takeaway', null);
  if (yesNo(details.delivery) === 'yes') push('delivery', null);

  const wheelchair = yesNo(details.wheelchair);
  if (wheelchair === 'yes' || wheelchair === 'limited') push('wheelchair', wheelchair);

  if (yesNo(details.diet_vegetarian) === 'yes' || yesNo(details.diet_vegetarian) === 'only') push('vegetarian', null);
  if (yesNo(details.diet_vegan) === 'yes' || yesNo(details.diet_vegan) === 'only') push('vegan', null);

  const internet = yesNo(details.internet_access);
  if (internet && internet !== 'no') push('internetAccess', null);

  return facts;
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
    if (this.enrichDisabled()) return { photos: [], description: null, facts: [], disabled: true };

    const placeId = req.placeId?.trim() || `coords:${req.lat}:${req.lng}`;
    const lang = req.lang;

    const cached = this.readCache(placeId, lang);
    if (cached) return cached;

    // One details lookup feeds all three halves: the pictures need its Commons
    // category, the description needs its wiki tag, and the facts are its tags.
    // It is row-cached and the dialog just made the same call, so in practice
    // this is a cache read.
    // The dialog already fetched this when the user picked the result, so it
    // comes along with the request. Refetching cost 12.8 seconds on a large
    // OSM relation, and it ran in parallel with the client's own lookup.
    const details = req.details ?? (await this.readDetails(userId, placeId, lang));

    const [photos, description] = await Promise.all([
      this.collectPhotos(userId, placeId, req, details),
      this.collectDescription(userId, placeId, req, details),
    ]);

    const result: CachedEnrichment = { photos, description, facts: collectFacts(details) };
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
    details: Record<string, unknown> | null,
  ): Promise<PlacePhotoCandidate[]> {
    const apiKey = this.maps.getMapsKey(userId);
    const wantsGoogle = !!apiKey && !this.maps.photosDisabled() && isGooglePlaceId(placeId);

    // Ask both providers at once — one listing call each, and they know nothing
    // about one another.
    // Accuracy, best first. Wikidata's P18 is one picture somebody chose to
    // represent this exact object. A Commons category is pictures of it. The
    // coordinate search is only pictures NEAR it, which around a city centre
    // means statues and passers-by — it is the last resort, not the plan.
    const category = typeof details?.wikimedia_commons === 'string' ? details.wikimedia_commons : null;
    const wikidata = typeof details?.wikidata === 'string' ? details.wikidata : null;

    const [googleRefs, wikidataImage, commons] = await Promise.all([
      wantsGoogle ? this.maps.fetchGooglePhotoRefs(placeId, apiKey!, GOOGLE_CAP) : Promise.resolve([]),
      wikidata ? this.maps.fetchWikidataImage(wikidata) : Promise.resolve(null),
      category
        ? this.maps
            .fetchCommonsCategoryCandidates(category, COMMONS_CAP)
            .then((hits) => (hits.length ? hits : this.maps.fetchCommonsCandidates(req.lat, req.lng, COMMONS_CAP)))
        : this.maps.fetchCommonsCandidates(req.lat, req.lng, COMMONS_CAP),
    ]);

    // The Wikidata picture leads, and is dropped from the rest of the list when
    // a category happens to contain it too.
    const commonsList = wikidataImage
      ? [wikidataImage, ...commons.filter((c) => c.photoUrl !== wikidataImage.photoUrl)].slice(0, COMMONS_CAP)
      : commons;

    // Google first — its pictures are of the place itself, while Commons
    // geosearch finds whatever happens to have been photographed nearby.
    const pending: PlacePhotoCandidate[] = [
      ...googleRefs.map((ref) => ({
        key: '',
        url: '',
        attribution: ref.attribution,
        // Google grants no reusable licence for these; the author line it hands
        // back is all we may show, so the rest stays honestly empty.
        license: null,
        licenseUrl: null,
        sourceUrl: null,
        source: 'google' as const,
      })),
      ...commonsList.map((candidate) => ({
        key: '',
        url: '',
        attribution: candidate.attribution,
        license: candidate.license,
        licenseUrl: candidate.licenseUrl,
        sourceUrl: candidate.sourceUrl,
        source: 'wikimedia' as const,
      })),
    ];

    // Download the bytes concurrently. Doing this in a loop meant a place with
    // five Commons hits spent five round trips plus five decodes in sequence,
    // which pushed the whole request past the client's request timeout. The
    // shared slot limiter still caps how many run at once.
    const results = await Promise.all(
      pending.map(async (candidate, index) => {
        const key = candidateKey(placeId, index);
        const fetchBytes =
          candidate.source === 'google'
            ? () => this.maps.fetchGooglePhotoBytes(googleRefs[index].name, apiKey!)
            : () => this.fetchRemoteBytes(commonsList[index - googleRefs.length].photoUrl);
        const url = await this.storeCandidate(key, creditLine(candidate.attribution, candidate.license), fetchBytes);
        // The index is fixed before any download, so a picture that fails to
        // load leaves a gap rather than renumbering the ones after it — the key
        // has to keep pointing at the same file across requests.
        return url ? { ...candidate, key, url } : null;
      }),
    );

    return results.filter((candidate): candidate is PlacePhotoCandidate => candidate !== null);
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
    details: Record<string, unknown> | null,
  ): Promise<PlaceDescription | null> {
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
    const extract = await this.maps.fetchWikiExtract(wikipediaTag);
    if (extract) {
      return { text: extract.text, source: extract.source, sourceUrl: extract.sourceUrl, license: 'CC BY-SA 4.0' };
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
      const parsed = JSON.parse(row.payload_json) as CachePayload;
      if (parsed.v !== CACHE_VERSION) return null;

      // A cached candidate is only usable while its bytes are still on disk, and
      // the nightly sweep deletes every picture nobody picked — which is most of
      // them. Treat any loss as a stale entry and rebuild, rather than serving
      // the survivors: filtering alone would leave the column empty for the rest
      // of the week for a place that has pictures perfectly available.
      const photos = parsed.photos.filter((photo) => this.photoCache.get(photo.key));
      if (photos.length !== parsed.photos.length) return null;
      return { photos, description: parsed.description ?? null, facts: parsed.facts ?? [] };
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
        JSON.stringify({ ...value, v: CACHE_VERSION } satisfies CachePayload),
        Date.now(),
      );
    } catch (err) {
      console.error('Failed to cache place enrichment:', err);
    }
  }
}
