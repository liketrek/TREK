/**
 * Wikipedia, Wikivoyage, Wikidata and Wikimedia Commons: descriptions,
 * curated pictures and brand logos for a place.
 *
 * Everything here is free and keyless, and every call carries TREK's user
 * agent and a deadline, because the enrichment column and the marker photo
 * answer a live dialog: a slow wiki is dropped rather than waited out. Commons
 * images are mostly CC BY / CC BY-SA, so a picture is only ever handed back
 * with the metadata needed to credit it.
 *
 * MapsService (the marker photo, the brand logo route) and the enrichment
 * column both ask through this client. It never imports MapsService:
 * providers sit below the orchestrator (lint:boundaries holds that).
 */
import { discardBody, exceedsDeclaredLength, readCapped } from '../../../utils/cappedFetch';
import { safeFetchFollow } from '../../../utils/ssrfGuard';
import { UA, stripWikiMarkup, parseWikipediaTag } from '../maps.helpers';
import { Injectable } from '@nestjs/common';

import { Jimp } from 'jimp';

interface WikidataSnak {
  mainsnak?: { datavalue?: { value?: string } };
  rank?: 'preferred' | 'normal' | 'deprecated';
}
type WikidataClaims = Record<string, WikidataSnak[] | undefined>;

/**
 * Wikidata properties that name a picture of a place, in the order we want them.
 *
 * P18 is the representative image. The rest exist because a station or a
 * monument is not one view: asking for the interior, the night shot, the
 * panorama and the aerial gives a picker four genuinely different pictures
 * instead of four frames of the same façade.
 */
const WIKIDATA_IMAGE_PROPERTIES = [
  'P18', // image
  'P5775', // interior view
  'P3451', // night view
  'P8592', // aerial view
  'P4291', // panoramic view
  'P5252', // winter view
  'P948', // Wikivoyage banner
] as const;

/** First non-empty string value of a claim list. */
function claimValue(snaks: WikidataSnak[] | undefined): string | null {
  for (const snak of snaks ?? []) {
    const value = snak.mainsnak?.datavalue?.value;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/**
 * File names from an item's picture properties, best first.
 *
 * Within P18 the statement rank decides: an item with several images marks one
 * `preferred`, and that is the one an editor considers representative. The API
 * returns statements in edit order, not rank order, so taking `[0]` picks
 * whichever was added first — for the Brandenburg Gate that is a coin toss
 * between the morning shot and a wide overview.
 */
function wikidataImageClaims(claims: WikidataClaims, limit: number): string[] {
  const rankOrder = { preferred: 0, normal: 1, deprecated: 2 } as const;
  const names: string[] = [];
  const seen = new Set<string>();

  for (const property of WIKIDATA_IMAGE_PROPERTIES) {
    const snaks = [...(claims[property] ?? [])]
      .filter((snak) => snak.rank !== 'deprecated')
      .sort((a, b) => (rankOrder[a.rank ?? 'normal'] ?? 1) - (rankOrder[b.rank ?? 'normal'] ?? 1));
    for (const snak of snaks) {
      const value = snak.mainsnak?.datavalue?.value;
      if (typeof value !== 'string' || !value.trim()) continue;
      const key = normalizeFileTitle(value);
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(value.trim());
      if (names.length >= limit) return names;
    }
  }
  return names;
}

/** `File:` prefix off, underscores and case normalised — Commons treats these as one title. */
function normalizeFileTitle(title: string): string {
  return title
    .replace(/^File:/i, '')
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase();
}

/**
 * A bare Commons category name out of whatever an OSM `wikimedia_commons` tag
 * holds.
 *
 * The tag is free text and mappers put three different things in it: a bare
 * name, a prefixed `Category:…`, or — against the wiki's own advice — a single
 * `File:…`. Prefixing blindly turned the last one into `Category:File:X.jpg`,
 * which matches nothing and fell through to the coordinate search without a
 * word. Localised prefixes (`Kategorie:`) appear too.
 */
function normalizeCategoryName(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  // A file name is not a category, and there is nothing sensible to derive.
  if (/^(file|datei|image|bild)\s*:/i.test(value)) return null;
  return value.replace(/^(category|kategorie|categorie|categoría|categoria)\s*:/i, '').trim() || null;
}

interface WikiCommonsPage {
  pageid?: number;
  title?: string;
  imageinfo?: {
    url?: string;
    thumburl?: string;
    mime?: string;
    width?: number;
    height?: number;
    /** The file description page — where the full licence terms live. */
    descriptionurl?: string;
    extmetadata?: {
      Artist?: { value?: string };
      LicenseShortName?: { value?: string };
      LicenseUrl?: { value?: string };
      UsageTerms?: { value?: string };
      /** Used to spot survey imagery and diagrams, which are not pictures of a place. */
      Categories?: { value?: string };
      ObjectName?: { value?: string };
      ImageDescription?: { value?: string };
    };
  }[];
}

/**
 * One Commons image with everything needed to credit it. Commons is mostly
 * CC BY / CC BY-SA, so a candidate that cannot be attributed is not usable in a
 * picker — the fields are nullable because Commons metadata is user-maintained
 * and genuinely incomplete on some files, not because they are optional to show.
 */
export interface CommonsCandidate {
  photoUrl: string;
  attribution: string | null;
  license: string | null;
  licenseUrl: string | null;
  sourceUrl: string | null;
  /**
   * Commons page id — the only stable identity a file has across the four ways
   * we reach it. The thumbnail URL is not: the same file comes back from
   * commons.wikimedia.org and from a language Wikipedia with different query
   * strings, so deduplicating on the URL silently lets the same picture through
   * twice. It is also what keys the cached bytes, so it must survive.
   */
  pageId: number | null;
  /** File page title, e.g. `File:Brandenburger Tor morgens.jpg`. */
  title: string | null;
  width: number | null;
  height: number | null;
  /** Free text used to reject survey imagery, floor plans and logos. */
  descriptors: string | null;
}

/** Wikimedia is normally well under a second, but a cold TLS handshake from a
 *  fresh container has been seen at eight. Enrichment answers a live dialog, so
 *  a slow provider is dropped rather than waited out. */
const WIKI_TIMEOUT_MS = 6000;

/**
 * The sitelinks call sits at the front of the description chain (identity,
 * then sitelinks, then the extract), so it gets the same tight deadline the
 * OSM identity lookup in front of it has.
 */
const SITELINKS_TIMEOUT_MS = 2500;

// ── Brand logos ──────────────────────────────────────────────────────────────
//
// A road trip corridor is mostly chains — Shell, Aral, JET — and the brand is the
// fastest thing to recognise on a map. OSM carries `brand:wikidata` on most of them,
// Wikidata carries the logo (P154), and Commons serves it.
//
// The bytes are proxied rather than linked so the browser never talks to Wikimedia:
// one self-hosted instance asking for a handful of logos is a very different egress
// profile from every visitor's browser announcing which petrol stations they are
// looking at. The cache is in memory on purpose — a GET must not write to the DB, and
// there are only so many fuel brands.
const BRAND_LOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BRAND_LOGO_CACHE_MAX = 300;
/** Well past any logo; a Commons original can be a multi-megabyte SVG or print-res PNG. */
const BRAND_LOGO_MAX_BYTES = 512 * 1024;
/** A place photo is a full-size image rather than a 128px mark, so its own ceiling. */
const WIKIMEDIA_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
const BRAND_LOGO_WIDTH = 128;
/** The square the logo is centred in, and the breathing room around it. */
const BRAND_LOGO_CANVAS = 96;
const BRAND_LOGO_PADDING = 8;
const WIKIDATA_ID_RE = /^Q[1-9][0-9]{0,11}$/;

export interface BrandLogo {
  bytes: Buffer;
  contentType: string;
}

/** What a marker-photo download from Wikimedia came back with. */
export type WikimediaPhotoOutcome =
  | { kind: 'photo'; bytes: Buffer; attribution: string | null }
  /** Nothing photographed here (or no coordinates to look with): a plain miss. */
  | { kind: 'none' }
  /** Wikimedia refused, timed out or sent something unusable: remembered only briefly. */
  | { kind: 'failed' };

/**
 * Puts a logo on a background it can actually be seen against.
 *
 * Half the fuel brands ship a white wordmark with a transparent background —
 * TotalEnergies, Esso and JET among them — and on the white pill the marker used to
 * draw they were invisible. Which background is right is a property of the image, not
 * of the brand, so it is measured: the mean brightness of the pixels that are actually
 * opaque decides between a white and a near-black backdrop.
 *
 * Returns the flattened PNG, or null when the bytes cannot be read at all — the pin
 * then keeps its category icon, which is a fine outcome.
 */
async function flattenBrandLogo(bytes: Buffer): Promise<BrandLogo | null> {
  try {
    const image = await Jimp.read(bytes);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    if (!width || !height) return null;

    let sum = 0;
    let opaque = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = image.bitmap.data[idx + 3];
        // Half-transparent pixels are anti-aliasing, not the mark itself.
        if (alpha < 128) continue;
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        opaque++;
      }
    }
    // A logo with nothing opaque in it is not a logo.
    if (opaque === 0) return null;

    // Square, with the logo scaled to fit inside it. Most brand marks are wide wordmarks
    // — TotalEnergies is three times as wide as it is tall — and a round pin showing the
    // middle of one is unreadable. Fitting it into a square means the pin can crop to a
    // circle without ever cutting the mark itself.
    const scale = Math.min(
      (BRAND_LOGO_CANVAS - 2 * BRAND_LOGO_PADDING) / width,
      (BRAND_LOGO_CANVAS - 2 * BRAND_LOGO_PADDING) / height,
    );
    // Never upscale: a 16-pixel favicon blown up to 96 looks worse than a small one.
    if (scale < 1) image.scale(scale);

    const light = sum / opaque > 150;
    const canvas = new Jimp({
      width: BRAND_LOGO_CANVAS,
      height: BRAND_LOGO_CANVAS,
      color: light ? 0x111827ff : 0xffffffff,
    });
    canvas.composite(
      image,
      Math.round((BRAND_LOGO_CANVAS - image.bitmap.width) / 2),
      Math.round((BRAND_LOGO_CANVAS - image.bitmap.height) / 2),
    );
    const out = await canvas.getBuffer('image/png');
    return { bytes: Buffer.from(out), contentType: 'image/png' };
  } catch {
    return null;
  }
}

@Injectable()
export class WikimediaClient {
  /** Brand id → logo bytes, or null for "asked, has none". Insertion-ordered, so the
   *  oldest entry is the one evicted when it fills up. */
  private readonly brandLogoCache = new Map<string, { at: number; logo: BrandLogo | null }>();

  /**
   * The logo of a brand, by its Wikidata id, as bytes.
   *
   * Two hops: Wikidata says which Commons file is the logo (property P154), Commons
   * serves a thumbnail of it. Both answers are cached, including "this brand has no
   * logo" — otherwise every map pan would ask Wikidata about the same supermarket
   * chain again. Returns null whenever anything is missing or unreadable; a marker
   * without a logo falls back to its category icon, which is a fine outcome.
   */
  async brandLogo(wikidataId: string): Promise<BrandLogo | null> {
    if (!WIKIDATA_ID_RE.test(wikidataId)) return null;

    const cached = this.brandLogoCache.get(wikidataId);
    if (cached && Date.now() - cached.at < BRAND_LOGO_CACHE_TTL_MS) return cached.logo;

    const remember = (logo: BrandLogo | null): BrandLogo | null => {
      if (this.brandLogoCache.size >= BRAND_LOGO_CACHE_MAX) {
        const oldest = this.brandLogoCache.keys().next().value;
        if (oldest !== undefined) this.brandLogoCache.delete(oldest);
      }
      this.brandLogoCache.set(wikidataId, { at: Date.now(), logo });
      return logo;
    };

    try {
      const params = new URLSearchParams({
        action: 'wbgetclaims',
        entity: wikidataId,
        property: 'P154',
        format: 'json',
      });
      const claimRes = await fetch(`https://www.wikidata.org/w/api.php?${params}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
      });
      if (!claimRes.ok) return remember(null);
      const claims = (await claimRes.json()) as {
        claims?: { P154?: { mainsnak?: { datavalue?: { value?: unknown } } }[] };
      };
      const file = claims.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
      if (typeof file !== 'string' || !file.trim()) return remember(null);

      // Special:FilePath renders a thumbnail at the width asked for and redirects to
      // the CDN, so each hop is re-checked by the guard rather than trusted.
      const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${BRAND_LOGO_WIDTH}`;
      // The same six seconds the Wikidata hop above allows. Without a deadline
      // this waited on undici's five-minute default, holding a request context
      // and a socket per stalled logo while the pin sat on its fallback icon.
      const imgRes = await safeFetchFollow(
        url,
        { signal: AbortSignal.timeout(WIKI_TIMEOUT_MS) },
        { bypassInternalIpAllowed: true },
      );
      if (!imgRes.ok) return remember(null);

      if (exceedsDeclaredLength(imgRes, BRAND_LOGO_MAX_BYTES)) {
        discardBody(imgRes);
        return remember(null);
      }
      // Streamed rather than buffered whole: a chunked answer declares no length,
      // so the post-check only ever ran after the bytes were already in memory.
      const { bytes, truncated } = await readCapped(imgRes, BRAND_LOGO_MAX_BYTES);
      if (truncated || bytes.byteLength === 0) return remember(null);

      const contentType = imgRes.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) return remember(null);

      return remember(await flattenBrandLogo(bytes));
    } catch {
      // An SSRF refusal on a redirect hop and a network failure end the same
      // way: no logo, remembered, and the pin keeps its category icon.
      return remember(null);
    }
  }

  /**
   * The marker photo for a place without a Google one, as bytes and a credit.
   *
   * Used for coordinate-only (right-click) places and as the fallback when a
   * Google place yields no photo. The image URL can 3xx to a CDN host, so the
   * download follows redirects through the SSRF guard, every hop re-validated.
   */
  async downloadPhoto(lat: number, lng: number, name?: string): Promise<WikimediaPhotoOutcome> {
    if (Number.isNaN(lat) || Number.isNaN(lng)) return { kind: 'none' };
    try {
      const wiki = await this.fetchWikimediaPhoto(lat, lng, name);
      if (!wiki) return { kind: 'none' };
      const imgRes = await safeFetchFollow(
        wiki.photoUrl,
        { signal: AbortSignal.timeout(WIKI_TIMEOUT_MS) },
        { bypassInternalIpAllowed: true },
      );
      if (!imgRes.ok) return { kind: 'failed' };
      if (exceedsDeclaredLength(imgRes, WIKIMEDIA_PHOTO_MAX_BYTES)) {
        discardBody(imgRes);
        return { kind: 'failed' };
      }
      const { bytes, truncated } = await readCapped(imgRes, WIKIMEDIA_PHOTO_MAX_BYTES);
      if (truncated || bytes.byteLength === 0) return { kind: 'failed' };
      return { kind: 'photo', bytes, attribution: wiki.attribution };
    } catch {
      return { kind: 'failed' };
    }
  }

  // ── Wikimedia Commons photo lookup ─────────────────────────────────────────

  async fetchWikimediaPhoto(
    lat: number,
    lng: number,
    name?: string,
  ): Promise<{ photoUrl: string; attribution: string | null } | null> {
    // Strategy 1: Search Wikipedia for the place name -> get the article image
    if (name) {
      try {
        const searchParams = new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: name,
          prop: 'pageimages',
          piprop: 'thumbnail',
          pithumbsize: '400',
          pilimit: '1',
          redirects: '1',
        });
        const res = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`, {
          headers: { 'User-Agent': UA },
          // This runs inside one of the few shared photo-fetch slots; a stalled
          // answer would hold it for everyone.
          signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
          };
          const pages = data.query?.pages;
          if (pages) {
            for (const page of Object.values(pages)) {
              if (page.thumbnail?.source) {
                return { photoUrl: page.thumbnail.source, attribution: 'Wikipedia' };
              }
            }
          }
        }
      } catch {
        /* fall through to geosearch */
      }
    }

    // Strategy 2: Wikimedia Commons geosearch by coordinates
    const candidates = await this.fetchCommonsCandidates(lat, lng, 5);
    const first = candidates[0];
    return first ? { photoUrl: first.photoUrl, attribution: first.attribution } : null;
  }

  /**
   * Anything photographed near a coordinate, licence metadata included. The
   * bottom rung of the picture ladder, and the only one with no claim on the
   * subject at all.
   *
   * geosearch already returns up to `limit` files in a single request, so asking
   * for a whole strip costs the same as asking for one picture. Callers that only
   * want a single image (fetchWikimediaPhoto, and through it the marker photo)
   * take the first entry.
   *
   * 60 metres rather than the 300 it used to be. Three hundred metres in a city
   * centre is a whole block: the town hall, the church and the underground
   * entrance are all inside it, and every one of them outranks the doner shop
   * we were actually asked about. Sixty is roughly "the same building and its
   * neighbours", which is the widest a picture can be taken and still plausibly
   * show the place. It does not fix the real problem, which is that nobody
   * photographed the shop, but it stops the wrong answer from being confident.
   */
  async fetchCommonsCandidates(lat: number, lng: number, limit = 5): Promise<CommonsCandidate[]> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'geosearch',
      ggsprimary: 'all',
      ggsnamespace: '6',
      ggsradius: '60',
      ggscoord: `${lat}|${lng}`,
      // Deliberately more than the caller asked for. Around anything worth
      // visiting the first few hits are survey tiles, passers-by and the
      // building next door; the ranker needs a pool to reject from, and
      // geosearch charges the same for one result as for twenty.
      ggslimit: String(Math.max(1, Math.min(Math.max(limit * 4, 8), 20))),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '400',
    });
    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { 'User-Agent': UA },
        // A hanging provider must not hold the whole enrichment request open;
        // no pictures is a fine answer, a request that never returns is not.
        signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { query?: { pages?: Record<string, WikiCommonsPage> } };
      // Hand back the whole pool. fetchWikimediaPhoto still takes [0] and gets
      // what it always got; the enrichment column ranks before it cuts.
      return this.toCommonsCandidates(data.query?.pages, Number(params.get('ggslimit')));
    } catch {
      return [];
    }
  }

  /** Shared shaping for every Commons query (coordinate, category, Wikidata, batch). */
  private toCommonsCandidates(pages: Record<string, WikiCommonsPage> | undefined, limit: number): CommonsCandidate[] {
    if (!pages) return [];
    const out: CommonsCandidate[] = [];
    // entries(), not values(): the map key is the page id, and for the queries
    // that reach a file by title it is the only place the id appears.
    for (const [key, page] of Object.entries(pages)) {
      const info = page.imageinfo?.[0];
      // Only use actual photos (JPEG/PNG), skip SVGs and PDFs
      const mime = info?.mime || '';
      if (!info?.url || !(mime.startsWith('image/jpeg') || mime.startsWith('image/png'))) continue;
      const meta = info.extmetadata;
      const pageId = page.pageid ?? (Number.isInteger(Number(key)) ? Number(key) : null);
      out.push({
        // iiurlwidth=400 makes Commons also return a scaled thumburl. Prefer it —
        // info.url is the full-resolution original (multi-megapixel camera exports).
        photoUrl: info.thumburl ?? info.url,
        attribution: stripWikiMarkup(meta?.Artist?.value),
        license: stripWikiMarkup(meta?.LicenseShortName?.value) ?? stripWikiMarkup(meta?.UsageTerms?.value),
        licenseUrl: meta?.LicenseUrl?.value?.trim() || null,
        sourceUrl: info.descriptionurl || null,
        pageId: pageId && pageId > 0 ? pageId : null,
        title: page.title ?? null,
        width: info.width ?? null,
        height: info.height ?? null,
        descriptors:
          [
            stripWikiMarkup(meta?.ObjectName?.value),
            stripWikiMarkup(meta?.ImageDescription?.value),
            stripWikiMarkup(meta?.Categories?.value),
          ]
            .filter(Boolean)
            .join(' | ') || null,
      });
      if (out.length >= limit) break;
    }
    return out;
  }

  /**
   * Lead paragraph of a wiki article, from Wikivoyage first and Wikipedia after.
   *
   * Wikivoyage is the travel sibling: same MediaWiki API, same CC BY-SA, but it
   * describes a place for someone about to go there, where Wikipedia opens with
   * area in square kilometres and pronunciation. Both are resolved from the OSM
   * `wikipedia` tag — guessing the article from the place name lands on the
   * wrong one for every ambiguous name, so no tag means no description rather
   * than a confident description of somewhere else.
   */
  async fetchWikiExtract(
    wikipediaTag: string | null | undefined,
  ): Promise<{ text: string; sourceUrl: string; source: 'wikivoyage' | 'wikipedia' } | null> {
    const parsed = parseWikipediaTag(wikipediaTag);
    if (!parsed) return null;
    for (const host of ['wikivoyage', 'wikipedia'] as const) {
      const hit = await this.fetchWikiExtractFor(host, parsed.lang, parsed.title);
      if (hit) return hit;
    }
    return null;
  }

  /**
   * The lead paragraph of one named article on one named wiki.
   *
   * Split out from `fetchWikiExtract` because the article is not always found
   * through an OSM tag: a place can carry a Wikidata id and no `wikipedia` tag
   * at all (Berlin Hauptbahnhof is exactly that), and then the title comes from
   * the item's sitelinks instead.
   */
  async fetchWikiExtractFor(
    host: 'wikivoyage' | 'wikipedia',
    lang: string,
    title: string,
    signal?: AbortSignal,
  ): Promise<{ text: string; sourceUrl: string; source: 'wikivoyage' | 'wikipedia' } | null> {
    if (!lang || !title) return null;
    // Two sentences, not three: this sits next to a form, and a fourth line of
    // prose pushes the pictures out of view.
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'extracts',
      exintro: '1',
      explaintext: '1',
      exsentences: '2',
      redirects: '1',
    });
    try {
      const res = await fetch(`https://${lang}.${host}.org/w/api.php?${params}`, {
        headers: { 'User-Agent': UA },
        signal: signal ?? AbortSignal.timeout(WIKI_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        query?: { pages?: Record<string, { title?: string; extract?: string }> };
      };
      for (const page of Object.values(data.query?.pages ?? {})) {
        const text = page.extract?.trim();
        // A missing article comes back as a page with no extract, not a 404.
        if (!text) continue;
        const resolved = page.title ?? title;
        return {
          text,
          sourceUrl: `https://${lang}.${host}.org/wiki/${encodeURIComponent(resolved)}`,
          source: host,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Which articles a Wikidata item is linked to, for the wikis we care about.
   *
   * The way to an article when a place has a Wikidata id but no `wikipedia`
   * tag — which is most of them, because mappers add one or the other. One
   * request, a few hundred bytes.
   */
  async fetchWikidataSitelinks(
    wikidataId: string,
    sites: string[],
    signal?: AbortSignal,
  ): Promise<Record<string, string>> {
    const qid = wikidataId.trim();
    if (!/^Q\d+$/.test(qid) || sites.length === 0) return {};
    const params = new URLSearchParams({
      action: 'wbgetentities',
      props: 'sitelinks',
      ids: qid,
      sitefilter: sites.join('|'),
      format: 'json',
    });
    try {
      const res = await fetch(`https://www.wikidata.org/w/api.php?${params}`, {
        headers: { 'User-Agent': UA },
        signal: signal ?? AbortSignal.timeout(SITELINKS_TIMEOUT_MS),
      });
      if (!res.ok) return {};
      const data = (await res.json()) as {
        entities?: Record<string, { sitelinks?: Record<string, { title?: string }> }>;
      };
      const out: Record<string, string> = {};
      for (const [site, link] of Object.entries(data.entities?.[qid]?.sitelinks ?? {})) {
        if (link?.title) out[site] = link.title;
      }
      return out;
    } catch {
      return {};
    }
  }

  /**
   * The pictures Wikidata records for a place, best first.
   *
   * By far the most accurate source there is: a person chose each of these to
   * represent this exact object, where a coordinate search only knows what was
   * photographed nearby. Wikidata also keeps them apart by what they show, so
   * asking for more than P18 buys genuine variety rather than another frame of
   * the same burst — Berlin Hauptbahnhof has an exterior, two interiors, a
   * night shot, a panorama and a winter view, all curated.
   *
   * Two calls total whatever the item holds: one for the claims, one batch for
   * the file metadata.
   */
  async fetchWikidataCandidates(
    wikidataId: string,
    limit = 5,
  ): Promise<{ candidates: CommonsCandidate[]; commonsCategory: string | null }> {
    const empty = { candidates: [], commonsCategory: null };
    const qid = wikidataId.trim();
    if (!/^Q\d+$/.test(qid)) return empty;
    try {
      const res = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=${qid}&format=json`,
        {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
        },
      );
      if (!res.ok) return empty;
      const data = (await res.json()) as { entities?: Record<string, { claims?: WikidataClaims }> };
      const claims = data.entities?.[qid]?.claims;
      if (!claims) return empty;

      const fileNames = wikidataImageClaims(claims, limit);
      const commonsCategory = claimValue(claims.P373) ?? null;
      if (fileNames.length === 0) return { candidates: [], commonsCategory };

      const byTitle = await this.fetchCommonsFilesByName(fileNames);
      // Back into the order Wikidata implied, which the batch response loses.
      const candidates = fileNames
        .map((name) => byTitle.get(normalizeFileTitle(name)))
        .filter((c): c is CommonsCandidate => !!c);
      return { candidates, commonsCategory };
    } catch {
      return empty;
    }
  }

  /**
   * Metadata for a list of Commons files, in one request.
   *
   * `redirects=1` matters more than it looks: a Wikidata claim or a Wikipedia
   * lead image often names a file that has since been renamed, and without it
   * the API answers with a `missing` page and the picture disappears silently.
   * Keyed by normalised title so callers can restore their own ordering.
   */
  async fetchCommonsFilesByName(fileNames: string[]): Promise<Map<string, CommonsCandidate>> {
    const out = new Map<string, CommonsCandidate>();
    const titles = fileNames.map((name) => (/^File:/i.test(name) ? name : `File:${name}`));
    if (titles.length === 0) return out;

    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: titles.join('|'),
      redirects: '1',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '400',
    });
    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
      });
      if (!res.ok) return out;
      const data = (await res.json()) as {
        query?: {
          pages?: Record<string, WikiCommonsPage>;
          normalized?: { from: string; to: string }[];
          redirects?: { from: string; to: string }[];
        };
      };
      // The API renames titles twice on the way in (normalisation, then
      // redirects), so walk the chain back to what the caller asked for.
      const aliases = new Map<string, string>();
      for (const hop of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) {
        aliases.set(normalizeFileTitle(hop.to), normalizeFileTitle(hop.from));
      }
      const resolveOriginal = (title: string): string => {
        let key = normalizeFileTitle(title);
        for (let hop = 0; hop < 4; hop++) {
          const previous = aliases.get(key);
          if (!previous || previous === key) break;
          key = previous;
        }
        return key;
      };

      for (const candidate of this.toCommonsCandidates(data.query?.pages, titles.length)) {
        if (!candidate.title) continue;
        out.set(resolveOriginal(candidate.title), candidate);
        // Also reachable under its own name, for callers that already resolved.
        out.set(normalizeFileTitle(candidate.title), candidate);
      }
      return out;
    } catch {
      return out;
    }
  }

  /**
   * The lead image a wiki article picked for a place.
   *
   * Only the file NAME is taken from here; the bytes and the licence come from
   * the same Commons batch as everything else. The thumbnail URL the API offers
   * alongside it carries no attribution, and a picture we cannot credit is a
   * picture we cannot show.
   */
  async fetchWikiLeadImageName(wikipediaTag: string | null | undefined): Promise<string | null> {
    const parsed = parseWikipediaTag(wikipediaTag);
    if (!parsed) return null;
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: parsed.title,
      prop: 'pageimages',
      piprop: 'name',
      redirects: '1',
    });
    for (const host of ['wikivoyage', 'wikipedia'] as const) {
      try {
        const res = await fetch(`https://${parsed.lang}.${host}.org/w/api.php?${params}`, {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as {
          query?: { pages?: Record<string, { pageimage?: string }> };
        };
        for (const page of Object.values(data.query?.pages ?? {})) {
          if (page.pageimage) return page.pageimage;
        }
      } catch {
        /* try the next wiki */
      }
    }
    return null;
  }

  /**
   * Commons images from a category, which is the set of pictures OF a place.
   *
   * Preferred over the coordinate search wherever a place carries a
   * `wikimedia_commons` tag: geosearch around a city centre returns statues and
   * passers-by, while the category of a restaurant returns the restaurant.
   */
  async fetchCommonsCategoryCandidates(category: string, limit = 5): Promise<CommonsCandidate[]> {
    const name = normalizeCategoryName(category);
    if (!name) return [];
    // Overfetch: the ranker throws away survey imagery, diagrams and repeats,
    // and it can only do that from a pool bigger than the strip.
    const poolSize = String(Math.max(1, Math.min(limit * 3, 20)));

    // `generator=search` first. `categorymembers` orders by sort key, i.e.
    // alphabetically by file name, which is not a quality signal in any
    // direction: "Category:Brandenburg Gate" opens with an .ogg pronunciation,
    // a marathon photo and six near-identical press shots, and
    // "Category:Hamburg Airport" with a noise map and a terminal layout. The
    // search index at least ranks by how well a file matches its category.
    const search = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: `incategory:"${name}" filetype:bitmap`,
      gsrnamespace: '6',
      gsrlimit: poolSize,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '400',
    });
    const members = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'categorymembers',
      gcmtitle: `Category:${name}`,
      gcmtype: 'file',
      gcmlimit: poolSize,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '400',
    });

    for (const params of [search, members]) {
      try {
        const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as { query?: { pages?: Record<string, WikiCommonsPage> } };
        const hits = this.toCommonsCandidates(data.query?.pages, Number(poolSize));
        if (hits.length) return hits;
      } catch {
        /* fall through to the second strategy */
      }
    }
    return [];
  }
}
