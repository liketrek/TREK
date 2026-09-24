/**
 * Amap (高德地图) Web Service API as a PlacesProvider.
 *
 * Why this exists: Google Places and Nominatim are both poor inside mainland
 * China. Google is unreachable from most Chinese networks, and OpenStreetMap's
 * coverage of Chinese POIs — restaurants, shops, the things a trip is actually
 * made of — is thin and rarely in Chinese. Amap is what a Chinese user expects
 * their map search to behave like.
 *
 * Two things make this provider different from the Google one:
 *
 *  1. **Datum.** Amap speaks GCJ-02, TREK speaks WGS-84 everywhere else. This
 *     file is one of the two places in the codebase allowed to hold a GCJ-02
 *     coordinate, and it never lets one escape: every outbound coordinate is
 *     converted on the way out, every inbound one on the way back. Nothing
 *     downstream — the database, the map, a GPX export — ever sees GCJ-02.
 *
 *  2. **Errors.** Amap answers HTTP 200 for everything and puts the verdict in
 *     the body (`status: "0"` plus an `infocode`). A quota-exceeded response and
 *     a successful one are the same status line, so the body is checked and
 *     translated into the same `Error & { status }` the Google path throws —
 *     otherwise the controller's error mapping would report every failure as an
 *     empty result.
 *
 * No picture comes out of this provider. Amap's POI photos carry no licence
 * statement we could show a user, and the Wikimedia fallback the place-details
 * column already uses produces a picture *with* its attribution. An
 * unattributable image is worse than no image, so an Amap place gets its picture
 * the same way a place found on OpenStreetMap does.
 */
import { createHash } from 'node:crypto';
import { fromAmapLocation, gcj02ToWgs84, normalizePlaceWebsite, toAmapLocation } from '@trek/shared';
import { readEnv } from '../../../app-config';
import { safeFetchFollow } from '../../../utils/ssrfGuard';
import { discardBody, exceedsDeclaredLength, readCappedJson } from '../../../utils/cappedFetch';
import { UA, parseOpeningHours } from '../maps.helpers';
import type {
  PlacesProvider,
  ProviderCredential,
  ProviderPlace,
  ProviderSuggestion,
  SearchBias,
  ViewportBias,
} from './places-provider';

/** The upstream every Web Service call is written against. */
const AMAP_UPSTREAM = 'https://restapi.amap.com';
/** A search answer is a few dozen POIs; anything past this is not the endpoint we think it is. */
const AMAP_MAX_RESPONSE_BYTES = 1_000_000;

/** An Amap list field, or nothing. The envelope is checked; its arrays never were. */
function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * The prefix that makes an Amap POI id recognisable anywhere in TREK.
 *
 * Amap ids are bare hex-ish strings (`B0FFFAB6J2`), indistinguishable from a
 * Google place id by shape. Without a namespace, an Amap place opened later
 * would be sent to Google, which answers a foreign id with a *billable* 400.
 * The separator is a colon to match the existing `node:`/`way:`/`coords:`
 * convention — see maps.helpers.ts, where this prefix is part of
 * NON_GOOGLE_PLACE_ID for exactly that reason.
 */
export const AMAP_PLACE_ID_PREFIX = 'amap:';
export const AMAP_PLACE_ID = /^amap:(.+)$/i;

export function isAmapPlaceId(placeId: string): boolean {
  return AMAP_PLACE_ID.test(placeId);
}

/** The bare provider id, or null when this is not an Amap place. */
export function amapPoiId(placeId: string): string | null {
  const m = AMAP_PLACE_ID.exec(placeId);
  return m ? m[1] : null;
}

let amapApiCallCount = 0;

/**
 * Amap accepts either `lang=zh_cn` or `lang=en`, and nothing else. Anything we
 * cannot serve is answered in Chinese rather than rejected, which is the right
 * default for a China-only provider.
 */
function toAmapLang(lang?: string): string {
  return lang && /^en/i.test(lang) ? 'en' : 'zh_cn';
}

/**
 * Amap's own error text for the codes an operator can actually act on.
 *
 * The raw `info` string is returned for everything else; these three are
 * singled out because they are the ones a misconfigured install hits first, and
 * because Amap's own wording for them ("INVALID_USER_SCODE") does not tell an
 * admin what to change.
 */
const AMAP_INFOCODE_HINTS: Record<string, string> = {
  '10001': 'Amap API key is invalid — check that it is a "Web 服务" (web service) key, not a JS API key',
  '10003': 'Amap daily request quota exhausted',
  '10009': 'Amap key rejected the request: the key is restricted to a different domain or IP',
};

/**
 * The HTTP status TREK should answer with for an Amap failure.
 *
 * Amap's own status line is always 200, and the controller maps a thrown
 * `.status` straight through to the client, so a credential problem has to
 * arrive as 403 and a quota problem as 429 for the client to say anything
 * useful about it.
 */
function statusForInfocode(infocode: string): number {
  if (infocode === '10001' || infocode === '10009') return 403;
  if (infocode === '10003' || infocode === '10004' || infocode === '10019' || infocode === '10020') return 429;
  return 502;
}

interface AmapEnvelope {
  status?: string;
  info?: string;
  infocode?: string;
}

interface AmapTip {
  id?: string;
  name?: string;
  district?: string;
  address?: unknown;
  location?: unknown;
}

/**
 * The tips autocomplete just served, by bare POI id, for ten minutes.
 *
 * inputtips knows places place/detail does not: villages, lanes and other
 * 地名地址 entries (typecode 19xxxx) come back from the completer with an id and
 * a coordinate, and the detail endpoint then answers count=0 for that id. The
 * picker asks for details right after the pick, so the tip is the only place
 * that coordinate survives.
 *
 * One instance lives on MapsService, the DI singleton. A provider is built per
 * request, and the suggestion and the details lookup are two requests.
 */
export class AmapTipStash {
  static readonly TTL_MS = 10 * 60 * 1000;
  static readonly MAX = 500;
  private readonly entries = new Map<string, { tip: AmapTip; expiresAt: number }>();

  remember(tips: AmapTip[], now = Date.now()): void {
    for (const tip of tips) {
      const id = amapText(tip.id);
      // Deleted first, so a tip served again moves to the back of the queue.
      this.entries.delete(id);
      this.entries.set(id, { tip, expiresAt: now + AmapTipStash.TTL_MS });
    }
    // A Map iterates in insertion order: the front is the oldest.
    for (const id of this.entries.keys()) {
      if (this.entries.size <= AmapTipStash.MAX) break;
      this.entries.delete(id);
    }
  }

  recall(poiId: string, now = Date.now()): AmapTip | null {
    const entry = this.entries.get(poiId);
    if (!entry) return null;
    if (entry.expiresAt <= now) {
      this.entries.delete(poiId);
      return null;
    }
    return entry.tip;
  }
}

interface AmapPoi {
  id?: string;
  name?: string;
  address?: unknown;
  location?: unknown;
  pname?: string;
  cityname?: string;
  adname?: string;
  type?: string;
  tel?: unknown;
  website?: unknown;
  biz_ext?: { rating?: unknown; open_time?: unknown };
  business?: { rating?: unknown; tel?: unknown; opentime_week?: unknown; opentime_today?: unknown };
}

/**
 * Amap returns an empty *array* where a string field has no value — `address:
 * []`, `tel: []` — so every optional text field has to be coerced rather than
 * read. A bare `poi.address || ''` yields `[]` in a template and `"[]"` in the
 * database.
 */
function amapText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  // Some fields arrive as a one-element array of the value.
  if (Array.isArray(value) && value.length === 1) return amapText(value[0]);
  return '';
}

function amapNumber(value: unknown): number | null {
  const text = amapText(value);
  if (!text) return null;
  const n = Number.parseFloat(text);
  return Number.isFinite(n) ? n : null;
}

/** 周一 … 周日, and the same after 星期, as the OSM two-letter day. 日 and 天 are both Sunday. */
const AMAP_WEEKDAY: Record<string, string> = { 一: 'Mo', 二: 'Tu', 三: 'We', 四: 'Th', 五: 'Fr', 六: 'Sa', 日: 'Su', 天: 'Su' };

/**
 * A segment parseOpeningHours reads in full: its day grammar, one space, then
 * time ranges and nothing else. Anything looser and the parser takes the days
 * it recognises and silently skips the rest.
 */
const OSM_WEEK_SEGMENT =
  /^(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)* \d{1,2}:\d{2}-\d{1,2}:\d{2}(?:,\d{1,2}:\d{2}-\d{1,2}:\d{2})*$/;

/** "Mo闭馆": a day named only to say it is closed. It gets no period, which is what closed means. */
const AMAP_CLOSED_SEGMENT = /^[A-Za-z,-]+ ?(?:闭馆|休馆|闭店|休息|歇业|不营业|关闭)$/;

/**
 * Amap's Chinese opening hours ("周一至周四,周日 09:30-22:00；周五至周六 09:30-22:30")
 * in the OSM dialect parseOpeningHours reads ("Mo-Th,Su 09:30-22:00; Fr-Sa 09:30-22:30"),
 * or null when any part of it cannot be read.
 *
 * All or nothing, on purpose: a day the parser does not understand ends up
 * without a period, and the client reads a day without a period as closed. No
 * hours is honest; a shop marked closed on the Saturday it is open is not.
 *
 * Remarks in brackets and segments carrying a date (a holiday exception) are
 * dropped: neither is the weekly pattern.
 */
export function amapOpeningToOsm(text: string): string | null {
  const segments = text
    // Amap's own example nests a ； inside a remark: "(延时服务时间:08:30-09:00；12:00-13:30)".
    .replace(/[(（][^()（）]*[)）]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/：/g, ':')
    .replace(/[~～〜－]/g, '-')
    .replace(/次日/g, '')
    .replace(/全天|24小时(?:营业)?/g, '00:00-24:00')
    .replace(/(?:周|星期)([一二三四五六日天])/g, (_, day: string) => AMAP_WEEKDAY[day])
    .replace(/每[天日]/g, 'Mo-Su')
    .replace(/周末/g, 'Sa-Su')
    .replace(/工作日/g, 'Mo-Fr')
    .replace(/[至到]/g, '-')
    // A comma between a time and the next day list ends a segment, it does not join two days.
    .replace(/(\d) ?[,，、] ?(?=[A-Z])/g, '$1;')
    .replace(/ ?[,，、] ?/g, ',')
    .replace(/ ?- ?/g, '-')
    // A split shift written with a gap: "09:00-12:00 14:00-18:00".
    .replace(/(\d) (?=\d)/g, '$1,')
    .split(/[;；]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment && !/\d{4}-\d{1,2}-\d{1,2}/.test(segment) && !AMAP_CLOSED_SEGMENT.test(segment))
    // "Mo-Fr:08:30-17:30" (Amap's documented form) and "Mo-Fr08:30" both become "Mo-Fr 08:30".
    .map((segment) => segment.replace(/^([A-Za-z,-]+)[ :]*(?=\d)/, '$1 '));
  // A bare range as the whole text is every day: "10:00-22:00", "24小时营业".
  if (segments.length === 1 && /^\d/.test(segments[0])) segments[0] = `Mo-Su ${segments[0]}`;
  if (!segments.length || !segments.every((segment) => OSM_WEEK_SEGMENT.test(segment))) return null;
  return segments.join('; ');
}

export class AmapPlacesProvider implements PlacesProvider {
  readonly id = 'amap' as const;

  constructor(
    private readonly credential: ProviderCredential,
    private readonly tips: AmapTipStash,
  ) {}

  // ── Outbound plumbing ──────────────────────────────────────────────────────

  /**
   * Build the full URL for one call, key and optional signature attached.
   *
   * `AMAP_API_BASE` mirrors `PLACES_API_BASE`: an install that routes its
   * outbound calls through a proxy or a gateway holding the credential says so
   * once, here.
   */
  private url(path: string, params: Record<string, string>): string {
    const query = new URLSearchParams({ ...params, key: this.credential.key, output: 'JSON' });
    const sig = this.signature(params);
    if (sig) query.set('sig', sig);
    const base = (readEnv().maps.amapApiBase || AMAP_UPSTREAM).replace(/([^/]|^)\/+$/, '$1');
    return `${base}${path}?${query.toString()}`;
  }

  /**
   * Amap's optional 数字签名 (digital signature).
   *
   * A key can be created with a private secret, and such a key rejects every
   * unsigned request. The scheme is an MD5 over every query parameter sorted by
   * name, the key and the output format included, with the secret appended.
   * MD5 because Amap specifies MD5, not because anything here is choosing a
   * hash.
   *
   * Unset, which is the common case, nothing is added.
   */
  private signature(params: Record<string, string>): string | null {
    const secret = readEnv().maps.amapApiSecret;
    if (!secret) return null;
    const signed = { ...params, key: this.credential.key, output: 'JSON' };
    const canonical = Object.keys(signed)
      // Byte order, and it has to stay byte order: Amap computes the same signature over
      // the same sorted names, so a locale-aware comparison would produce a signature the
      // other side rejects.
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .map((k) => `${k}=${signed[k]}`)
      .join('&');
    return createHash('md5').update(`${canonical}${secret}`).digest('hex');
  }

  /**
   * One call, with the body-carried verdict turned into a real error.
   *
   * Through safeFetchFollow like every other outbound URL in the maps domain, so
   * a proxied base cannot be pointed at something internal.
   */
  private async call<T extends AmapEnvelope>(path: string, params: Record<string, string>, label: string): Promise<T> {
    const url = this.url(path, params);
    amapApiCallCount++;
    // The key rides in the query string, so the label is logged without the URL —
    // unlike the Google path, where the credential sits in a header.
    console.debug(`[Amap API] #${amapApiCallCount} ${label} → ${path}`);

    const response = await safeFetchFollow(
      url,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) },
      { bypassInternalIpAllowed: true },
    );

    if (!response.ok) {
      // A transport-level failure, i.e. the proxy in front of Amap rather than
      // Amap itself: Amap's own answers are always 200.
      this.fail(label, response.status, `Amap ${label} failed with HTTP ${response.status}`);
    }

    // Capped, like the places index client next door: the base URL is
    // configurable (AMAP_API_BASE points at an operator's own gateway), and an
    // answer of arbitrary size was buffered into the heap in full before
    // anything looked at it.
    if (exceedsDeclaredLength(response, AMAP_MAX_RESPONSE_BYTES)) {
      discardBody(response);
      this.fail(label, 502, `Amap ${label} answered with more than ${AMAP_MAX_RESPONSE_BYTES} bytes`);
    }
    const data = await readCappedJson<T>(response, AMAP_MAX_RESPONSE_BYTES);
    if (!data || typeof data !== 'object') {
      this.fail(label, 502, `Amap ${label} answered with something that is not a JSON object`);
    }
    if (data.status !== '1') {
      const infocode = data.infocode ?? '';
      const hint = AMAP_INFOCODE_HINTS[infocode] || data.info || 'Amap API error';
      this.fail(label, statusForInfocode(infocode), `${hint} (infocode ${infocode || 'none'})`);
    }
    return data;
  }

  private fail(label: string, status: number, message: string): never {
    console.error(`[Maps] amap/${label} failed with ${status} userId=${this.credential.userId} keySource=${this.credential.source}`);
    const err = new Error(message) as Error & { status: number };
    err.status = status;
    throw err;
  }

  // ── Normalisation ──────────────────────────────────────────────────────────

  /**
   * One POI in the shape the rest of TREK consumes, coordinates back in WGS-84.
   *
   * `address` is assembled rather than taken as-is: Amap's `address` field is
   * the street line alone ("三里屯路19号"), which on its own is not enough to
   * tell two identically named branches apart in the place picker. Province,
   * city and district come as separate fields for exactly this purpose.
   */
  private toPlace(poi: AmapPoi): ProviderPlace {
    const coords = fromAmapLocation(poi.location);
    const business = poi.business ?? {};
    const bizExt = poi.biz_ext ?? {};
    const street = amapText(poi.address);
    const region = [amapText(poi.pname), amapText(poi.cityname), amapText(poi.adname)]
      // A municipality repeats itself — pname and cityname are both "北京市".
      .filter((part, i, all) => part && all.indexOf(part) === i);
    const address = [...region, street].filter(Boolean).join('');
    const openText = amapText(business.opentime_week) || amapText(bizExt.open_time);
    // Amap phrases hours in Chinese. Translated, the shared OSM-dialect parser
    // reads them; text the translation cannot fully read gives no hours at all,
    // so the enrichment can fall back to OpenStreetMap's.
    const osmHours = openText ? amapOpeningToOsm(openText) : null;
    const hours = osmHours ? parseOpeningHours(osmHours) : null;

    return {
      amap_poi_id: poi.id ? `${AMAP_PLACE_ID_PREFIX}${poi.id}` : null,
      name: amapText(poi.name),
      address,
      // Null rather than dropped: a POI with no geometry still answers "which
      // one did I mean" in the picker, and the caller decides whether it is
      // usable. `?? null` because 0 is a real coordinate.
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      rating: amapNumber(business.rating ?? bizExt.rating),
      rating_count: null,
      // Free text, often a bare host: it gains https here like any other source's.
      website: normalizePlaceWebsite(amapText(poi.website)),
      phone: amapText(business.tel ?? poi.tel) || null,
      // Amap's type is a slash-separated taxonomy ("餐饮服务;中餐厅;川菜"); split so
      // it reads like the string array every other provider returns.
      types: amapText(poi.type).split(/[;|]/).map((t) => t.trim()).filter(Boolean),
      opening_hours: hours ? hours.weekdayDescriptions : null,
      open_now: hours ? hours.openNow : null,
      opening_periods: hours ? hours.periods : null,
      opening_special_days: null,
      summary: null,
      reviews: [],
      source: 'amap' as const,
    };
  }

  // ── PlacesProvider ─────────────────────────────────────────────────────────

  async searchText(query: string, lang?: string, bias?: SearchBias): Promise<ProviderPlace[]> {
    const common = {
      keywords: query,
      offset: '10',
      page: '1',
      extensions: 'all',
      language: toAmapLang(lang),
    };

    // `place/around` rather than `place/text` when we know where the user is
    // looking: Amap's text search has no bias parameter at all, so without this
    // a search for "咖啡" from a Shanghai viewport returns Beijing.
    if (bias) {
      const around = await this.call<AmapEnvelope & { pois?: AmapPoi[] }>(
        '/v3/place/around',
        {
          ...common,
          location: toAmapLocation(bias.lat, bias.lng),
          // Amap caps the radius at 50 km, which is also the default the
          // Google path uses for an unspecified bias.
          radius: String(Math.min(Math.round(bias.radius ?? 50000), 50000)),
        },
        'place/around',
      );
      const pois = asArray(around.pois);
      // place/around matches the keyword literally against POI names only: a
      // comma-joined "name, region" query (which the client's details-miss
      // fallback sends) matches nothing even when the place exists. place/text
      // reads the region out of the keywords, so an empty around falls through
      // to it before the caller gives up.
      if (pois.length) return pois.map((poi) => this.toPlace(poi));
    }

    const data = await this.call<AmapEnvelope & { pois?: AmapPoi[] }>('/v3/place/text', common, 'place/text');

    // The envelope is validated, its arrays are not: `as T` only ever said what
    // the answer was meant to look like. A `pois` object rather than an array
    // threw a TypeError nobody caught between here and the controller, so the
    // user got a 500 instead of the OpenStreetMap answer.
    return asArray(data.pois).map((poi) => this.toPlace(poi));
  }

  // Amap does not bill per keystroke and has no session concept, so the token
  // the Google path uses to group a search has nothing to attach to here.
  async autocomplete(input: string, lang?: string, bias?: ViewportBias): Promise<ProviderSuggestion[]> {
    const params: Record<string, string> = {
      keywords: input,
      // Without this, inputtips also returns bus stops and road names, which
      // cannot be turned into a place with coordinates.
      datatype: 'poi',
      language: toAmapLang(lang),
    };
    // inputtips biases around a point, not a rectangle: the viewport centre is
    // the closest thing we can give it.
    if (bias) {
      const lat = (bias.low.lat + bias.high.lat) / 2;
      const lng = (bias.low.lng + bias.high.lng) / 2;
      params.location = toAmapLocation(lat, lng);
    }

    const data = await this.call<AmapEnvelope & { tips?: AmapTip[] }>(
      '/v3/assistant/inputtips',
      params,
      'inputtips',
    );

    // A tip without an id cannot be looked up afterwards, and inputtips does
    // return those (a district name, a road).
    const served = asArray(data.tips).filter((tip) => amapText(tip.id)).slice(0, 5);
    this.tips.remember(served);

    return served.map((tip) => ({
      placeId: `${AMAP_PLACE_ID_PREFIX}${amapText(tip.id)}`,
      mainText: amapText(tip.name),
      secondaryText: [amapText(tip.district), amapText(tip.address)].filter(Boolean).join(' '),
    }));
  }

  async placeDetails(placeId: string, lang?: string): Promise<ProviderPlace | null> {
    const poiId = amapPoiId(placeId);
    if (!poiId) return null;

    // v5 rather than v3: v3's place/detail is deprecated and does not return the
    // business block (rating, phone, opening hours) that makes a details lookup
    // worth making. `show_fields` is v5's field mask — asking for everything
    // costs no more, but photos are left out on purpose (see the file header).
    const data = await this.call<AmapEnvelope & { pois?: AmapPoi[] }>(
      '/v5/place/detail',
      {
        id: poiId,
        show_fields: 'business,indoor',
        language: toAmapLang(lang),
      },
      `place/detail(${poiId})`,
    );

    const poi = asArray(data.pois)[0];
    if (poi) return { ...this.toPlace(poi), cached_at: Date.now() };

    // place/detail indexes fewer places than inputtips: a village (typecode
    // 190108) can be suggested, picked, and then answer count=0 here. The tip
    // autocomplete served still holds its name and coordinate, so it answers as
    // a plain name-and-pin place. Without a coordinate there is nothing to pin,
    // and null lets the client fall back to its text search.
    const tip = this.tips.recall(poiId);
    if (!tip) return null;
    const place = this.toPlace({
      id: poiId,
      name: tip.name,
      adname: amapText(tip.district),
      address: tip.address,
      location: tip.location,
    });
    return place.lat == null ? null : { ...place, cached_at: Date.now() };
  }

  /**
   * Reverse geocoding via `geocode/regeo`.
   *
   * Worth having beyond the datum: the OSM path funnels through a single
   * process-wide Nominatim throttle of one request every 1.1 s (Nominatim's
   * usage policy), so a booking import that geocodes thirty stops takes half a
   * minute of wall clock. Amap has no such rule, so an install on Amap gets its
   * imports back at network speed.
   */
  async reverse(lat: number, lng: number, lang?: string): Promise<{ name: string | null; address: string | null } | null> {
    const data = await this.call<
      AmapEnvelope & {
        regeocode?: {
          formatted_address?: unknown;
          addressComponent?: { building?: { name?: unknown }; neighborhood?: { name?: unknown } };
          pois?: { name?: unknown }[];
          aois?: { name?: unknown }[];
        };
      }
    >(
      '/v3/geocode/regeo',
      {
        location: toAmapLocation(lat, lng),
        extensions: 'all',
        // Metres around the point that count as "here", roughly the block the
        // Nominatim path's zoom 18 resolves to.
        radius: '200',
        language: toAmapLang(lang),
      },
      'geocode/regeo',
    );

    const regeocode = data.regeocode;
    if (!regeocode) return null;

    // Same precedence as the Nominatim path: the most specific name Amap knows,
    // falling back through the containing area. An AOI ("故宫博物院") beats a POI
    // here because the click landed inside it rather than on it.
    const name =
      amapText(regeocode.aois?.[0]?.name) ||
      amapText(regeocode.pois?.[0]?.name) ||
      amapText(regeocode.addressComponent?.building?.name) ||
      amapText(regeocode.addressComponent?.neighborhood?.name) ||
      null;

    return { name, address: amapText(regeocode.formatted_address) || null };
  }
}

/**
 * Coordinates and a name out of a shared Amap link.
 *
 * The formats people paste, in the order they are tried:
 *   - `uri.amap.com/marker?position=<lng>,<lat>&name=…` — what our own "open in
 *     Amap" links look like, and what the mobile app's share sheet produces
 *   - `amap.com/place/<id>` or `…/detail?id=<id>`: a POI page carries an id and
 *     no coordinate, so it comes back with the id and NaN. Turning that id into
 *     a location needs a keyed detail lookup, and the URL resolver has no user
 *     to resolve a key for, so it answers 400 instead
 *   - `?p=…` / `#…` viewport fragments carrying a bare `lng,lat`
 *
 * Returned coordinates are WGS-84; the link carries GCJ-02.
 */
export function parseAmapUrl(rawUrl: string): { lat: number; lng: number; name: string | null; poiId: string | null } | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!isAmapHost(parsed.hostname)) return null;

  const name = parsed.searchParams.get('name')?.trim() || null;
  const poiId = parsed.searchParams.get('id')?.trim() || parsed.pathname.match(/\/place\/([A-Za-z0-9]+)/)?.[1] || null;

  // `position=lng,lat` (uri.amap.com) and `p=…,lng,lat,…` (the web viewport) both
  // spell longitude first, like every other Amap coordinate.
  const position = parsed.searchParams.get('position') || parsed.searchParams.get('location');
  const fromPosition = position ? fromAmapLocation(position) : null;
  if (fromPosition) return { ...fromPosition, name, poiId };

  const anywhere = /(\d{2,3}\.\d+),(\d{1,2}\.\d+)/.exec(`${parsed.search}${parsed.hash}`);
  if (anywhere) {
    const converted = gcj02ToWgs84(Number.parseFloat(anywhere[2]), Number.parseFloat(anywhere[1]));
    return { ...converted, name, poiId };
  }

  return poiId ? { lat: Number.NaN, lng: Number.NaN, name, poiId } : null;
}

/**
 * Amap's own hosts, including the short-link one.
 *
 * Matched by exact suffix rather than by shape: unlike Google, Amap has no
 * ccTLD family, so a pattern would only widen what counts as trusted.
 */
const AMAP_HOSTS = new Set([
  'amap.com',
  'www.amap.com',
  'uri.amap.com',
  'wb.amap.com',
  'surl.amap.com',
  'gaode.com',
  'www.gaode.com',
]);

export function isAmapHost(hostname: string): boolean {
  return AMAP_HOSTS.has(hostname.toLowerCase());
}

/** The short links that have to be followed before anything can be parsed out. */
export const AMAP_SHORT_HOSTS = ['surl.amap.com'];
