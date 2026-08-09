import { readEnv, getAppUrl } from '../../app-config';

/**
 * Pure maps/geo helpers — no DB, no Nest, no side effects beyond reading env.
 *
 * Moved verbatim from the legacy services/mapsService.ts when the maps domain
 * went DI-native. Kept as plain functions (files.constants.ts / client-ip.ts
 * precedent) because they are consumed both by MapsService and by plain-module
 * code outside the container (transitService's User-Agent, the unit suites'
 * parser cases).
 */

// Overpass, Nominatim and Wikimedia all ask that requests carry a User-Agent that
// uniquely identifies the deploying instance — a shared, generic UA gets rate-limited
// and throttled harder (see #1309). When the instance URL is configured we append it;
// getAppUrl()'s bare http://localhost fallback isn't a useful identifier, so we drop it.
export function buildUserAgent(instanceUrl: string | undefined): string {
  const base = 'TREK Travel Planner (https://github.com/liketrek/TREK)';
  if (instanceUrl && !instanceUrl.startsWith('http://localhost')) return `${base}; ${instanceUrl}`;
  return base;
}
// Computed once at load — getAppUrl() reads only env vars, which don't change at runtime.
export const UA = buildUserAgent(getAppUrl());

// TREK's internal language codes mostly coincide with valid BCP-47 codes, but a
// couple don't: 'br' is Brazilian Portuguese here (BCP-47 'pt-BR'; bare 'br' is
// Breton) and 'gr' is Greek (BCP-47 'el'). Outbound geo APIs (Google Places,
// Nominatim) expect BCP-47, so normalise before sending — otherwise names and
// opening hours come back in the wrong language. Codes not listed here pass
// through unchanged (they are already valid), as do locale forms the client
// sometimes sends (e.g. 'pt-BR').
const API_LANG_OVERRIDES: Record<string, string> = {
  br: 'pt-BR',
  gr: 'el',
  'el-GR': 'el',
};
export function toApiLang(lang: string | undefined, fallback = 'en'): string {
  const code = (lang || '').trim();
  if (!code) return fallback;
  return API_LANG_OVERRIDES[code] ?? code;
}

const GOOGLE_FTID_RE = /^0x[0-9a-f]+:0x[0-9a-f]+$/i;

// Extracts a Google Maps feature id (ftid, 0x..:0x..) from a URL's ?ftid= param.
// The Places API (New) googleMapsUri is usually a cid-style URL (https://maps.google.com/?cid=NNN)
// with no ftid, so this returns null for most API responses — the precise query_place_id link is
// used instead. It does recover an ftid from a /place/?...&ftid= URL, e.g. a pasted share link
// resolved by resolveGoogleMapsUrl or a Google MyMaps list import.
export function googleFtidFromMapsUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const ftid = new URL(url).searchParams.get('ftid')?.trim();
    return ftid && GOOGLE_FTID_RE.test(ftid) ? ftid.toLowerCase() : null;
  } catch {
    return null;
  }
}

// ── Overpass POI categories ──────────────────────────────────────────────────

export interface OverpassPoi {
  osm_id: string; // 'node:123' | 'way:123' | 'relation:123' (matches the placeId format elsewhere)
  name: string;
  lat: number;
  lng: number;
  category: string; // the requested pill category key, e.g. 'restaurant'
  poi_type: string; // the raw OSM tag that matched, e.g. 'amenity=restaurant'
  address: string | null;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
  cuisine: string | null;
  source: 'openstreetmap';
}

// Each pill category → the OSM tag selectors it searches. Keys here are the
// contract with the client's POI_CATEGORIES (same keys, label/icon/colour live
// client-side).
export const CATEGORY_OSM_FILTERS: Record<string, string[]> = {
  restaurant: ['amenity=restaurant', 'amenity=fast_food'],
  cafe: ['amenity=cafe'],
  bar: ['amenity=bar', 'amenity=pub', 'amenity=nightclub'],
  hotel: ['tourism=hotel', 'tourism=hostel', 'tourism=guest_house', 'tourism=apartment', 'tourism=motel'],
  sights: [
    'tourism=attraction',
    'tourism=viewpoint',
    'historic=monument',
    'historic=castle',
    'historic=memorial',
    'historic=ruins',
  ],
  museum: ['tourism=museum', 'tourism=gallery', 'tourism=artwork', 'amenity=theatre'],
  nature: ['leisure=park', 'leisure=garden', 'natural=beach', 'natural=peak'],
  activity: ['tourism=theme_park', 'tourism=zoo', 'tourism=aquarium', 'leisure=water_park'],
  shopping: ['shop=mall', 'shop=department_store', 'amenity=marketplace'],
  supermarket: ['shop=supermarket', 'shop=convenience'],
};

export const POI_CATEGORY_KEYS = Object.keys(CATEGORY_OSM_FILTERS);

// Public Overpass mirrors, queried in PARALLEL (first valid response wins).
// Reachability and load vary a lot by network/region — the canonical instance is
// frequently overloaded (504s) and some community mirrors are unreachable from
// certain networks. Racing them means whichever mirror is fastest-reachable for
// this user answers, and an overloaded or blocked one never blocks the others.
const DEFAULT_OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// Operators behind locked-down egress — or running their own Overpass — can point TREK
// at one or more custom endpoints via OVERPASS_URL (comma-separated). When set it
// REPLACES the public mirrors, so a firewalled cluster never reaches out to them and a
// self-hosted instance is used exclusively (see #1309). Non-http(s) entries are dropped.
export function resolveOverpassEndpoints(raw: string | undefined = readEnv().integrations.overpassUrl): string[] {
  const custom = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => {
      try {
        const u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    });
  return custom.length ? custom : DEFAULT_OVERPASS_MIRRORS;
}

// Per-mirror fetch cap. Because mirrors race in parallel this is also the worst-case
// wait before every mirror is given up on and a 502 is returned. Public mirrors answer
// in 1–2s when reachable, so the cap mainly bounds dead/blocked ones; operators with a
// slow self-hosted endpoint can raise it via OVERPASS_TIMEOUT_MS. A non-positive or
// non-numeric value falls back to the default — a 0/negative cap would abort every
// request immediately and 502 the search.
export function resolveOverpassTimeoutMs(raw?: string): number {
  if (raw === undefined) return readEnv().integrations.overpassTimeoutMs;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 12000;
}

// ── Opening hours parsing ────────────────────────────────────────────────────

export interface GoogleTimePoint {
  day?: number;
  hour?: number;
  minute?: number;
}

export interface GoogleOpeningHours {
  weekdayDescriptions?: string[];
  openNow?: boolean;
  periods?: { open?: GoogleTimePoint; close?: GoogleTimePoint }[];
  specialDays?: { date?: { year?: number; month?: number; day?: number } }[];
}

// Machine-readable opening hours, in Google's numbering: day 0 = Sunday … 6 = Saturday.
// The weekday descriptions next to them are display text in the requested language and
// cannot be parsed reliably; these can. A period without `close` is Google's way of
// saying the place never closes.
export interface OpeningTimePoint {
  day: number;
  hour: number;
  minute: number;
}
export interface OpeningPeriod {
  open: OpeningTimePoint;
  close: OpeningTimePoint | null;
}

// Places (New) speaks proto3 JSON, which leaves out fields that hold the default
// value — a period starting Sunday midnight arrives as `{}`, not as three zeroes.
function toTimePoint(point: GoogleTimePoint | undefined): OpeningTimePoint | null {
  if (!point || typeof point !== 'object') return null;
  const field = (value: unknown): number | null => {
    if (value === undefined || value === null) return 0;
    return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : null;
  };
  const day = field(point.day);
  const hour = field(point.hour);
  const minute = field(point.minute);
  if (day === null || hour === null || minute === null) return null;
  if (day < 0 || day > 6 || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { day, hour, minute };
}

export function normalizeOpeningPeriods(periods: GoogleOpeningHours['periods']): OpeningPeriod[] | null {
  if (!Array.isArray(periods) || periods.length === 0) return null;
  const result: OpeningPeriod[] = [];
  for (const period of periods) {
    const open = toTimePoint(period?.open);
    if (!open) continue;
    // A missing close means "never closes"; a close that is there but unusable makes
    // the whole period a guess, so it is dropped rather than read as round-the-clock.
    const close = period?.close == null ? null : toTimePoint(period.close);
    if (period?.close != null && !close) continue;
    result.push({ open, close });
  }
  return result.length > 0 ? result : null;
}

// Holidays and other exceptional days that the weekly periods do not describe. Google
// reports them as calendar dates; they travel to the client as YYYY-MM-DD so it can
// compare them against the place's own local date.
export function normalizeSpecialDays(specialDays: GoogleOpeningHours['specialDays']): string[] | null {
  if (!Array.isArray(specialDays) || specialDays.length === 0) return null;
  const dates: string[] = [];
  for (const entry of specialDays) {
    const date = entry?.date;
    if (!date) continue;
    const { year, month, day } = date;
    if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') continue;
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!dates.includes(iso)) dates.push(iso);
  }
  return dates.length > 0 ? dates : null;
}

// "09:00-18:00", also the "20:00-02:00" and "00:00-24:00" spellings OSM uses.
const OSM_TIME_RANGE = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;

/** Periods for one OSM weekday line. `dayIdx` is Monday-based, the output is not. */
function osmPeriods(dayIdx: number, timePart: string): OpeningPeriod[] {
  const day = (dayIdx + 1) % 7;
  const periods: OpeningPeriod[] = [];
  for (const match of timePart.matchAll(OSM_TIME_RANGE)) {
    const openHour = parseInt(match[1], 10);
    const openMinute = parseInt(match[2], 10);
    let closeHour = parseInt(match[3], 10);
    const closeMinute = parseInt(match[4], 10);
    if (openHour > 23 || openMinute > 59 || closeHour > 24 || closeMinute > 59) continue;
    // OSM writes the end of a day as 24:00, a clock reading Google's numbering has no
    // hour 24 — that is midnight of the following day, same as any range that wraps.
    let nextDay = closeHour * 60 + closeMinute <= openHour * 60 + openMinute;
    if (closeHour === 24) {
      if (closeMinute !== 0) continue;
      closeHour = 0;
      nextDay = true;
    }
    periods.push({
      open: { day, hour: openHour, minute: openMinute },
      close: { day: nextDay ? (day + 1) % 7 : day, hour: closeHour, minute: closeMinute },
    });
  }
  return periods;
}

export function parseOpeningHours(ohString: string): {
  weekdayDescriptions: string[];
  openNow: boolean | null;
  periods: OpeningPeriod[];
} {
  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const result: string[] = LONG.map((d) => `${d}: ?`);
  const periods: OpeningPeriod[] = [];

  // Parse segments like "Mo-Fr 09:00-18:00; Sa 10:00-14:00"
  for (const segment of ohString.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const match = trimmed.match(
      /^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\s*,\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)\s+(.+)$/i,
    );
    if (!match) continue;
    const [, daysPart, timePart] = match;
    const dayIndices = new Set<number>();
    for (const range of daysPart.split(',')) {
      const parts = range
        .trim()
        .split('-')
        .map((d) => DAYS.indexOf(d.trim()));
      if (parts.length === 2 && parts[0] >= 0 && parts[1] >= 0) {
        for (let i = parts[0]; i !== (parts[1] + 1) % 7; i = (i + 1) % 7) dayIndices.add(i);
        dayIndices.add(parts[1]);
      } else if (parts[0] >= 0) {
        dayIndices.add(parts[0]);
      }
    }
    for (const idx of dayIndices) {
      result[idx] = `${LONG[idx]}: ${timePart.trim()}`;
      periods.push(...osmPeriods(idx, timePart));
    }
  }

  // Compute openNow
  let openNow: boolean | null = null;
  try {
    const now = new Date();
    const jsDay = now.getDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    const todayLine = result[dayIdx];
    const timeRanges = [...todayLine.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];
    if (timeRanges.length > 0) {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      openNow = timeRanges.some((m) => {
        const start = parseInt(m[1]) * 60 + parseInt(m[2]);
        const end = parseInt(m[3]) * 60 + parseInt(m[4]);
        return end > start ? nowMins >= start && nowMins < end : nowMins >= start || nowMins < end;
      });
    }
  } catch {
    /* best effort */
  }

  return { weekdayDescriptions: result, openNow, periods };
}

// ── Build standardized OSM details ───────────────────────────────────────────

export function buildOsmDetails(tags: Record<string, string>, osmType: string, osmId: string) {
  let opening_hours: string[] | null = null;
  let open_now: boolean | null = null;
  let opening_periods: OpeningPeriod[] | null = null;
  if (tags.opening_hours) {
    const parsed = parseOpeningHours(tags.opening_hours);
    const hasData = parsed.weekdayDescriptions.some((line) => !line.endsWith('?'));
    if (hasData) {
      opening_hours = parsed.weekdayDescriptions;
      open_now = parsed.openNow;
      opening_periods = parsed.periods.length > 0 ? parsed.periods : null;
    }
  }
  return {
    website: tags['contact:website'] || tags.website || null,
    phone: tags['contact:phone'] || tags.phone || null,
    opening_hours,
    open_now,
    opening_periods,
    osm_url: `https://www.openstreetmap.org/${osmType}/${osmId}`,
    summary: tags.description || null,
    // Kept so enrichment can resolve the right Wikipedia article instead of
    // guessing one from the place name, which picks the wrong article whenever
    // the name is ambiguous ("Bahnhofstraße", "Rathaus", any chain restaurant).
    wikipedia: tags.wikipedia || null,
    wikidata: tags.wikidata || null,
    source: 'openstreetmap' as const,
  };
}

// ── Wiki metadata ────────────────────────────────────────────────────────────

/**
 * Commons extmetadata values arrive as HTML fragments — an author is typically
 * an <a> to the uploader's user page, a licence can carry <span> wrappers. We
 * show these as plain text next to a thumbnail, so the markup has to go.
 */
export function stripWikiMarkup(value: string | undefined | null): string | null {
  if (!value) return null;
  const text = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

/**
 * Splits an OSM `wikipedia` tag ("de:Museum Ludwig") into host language and
 * article title. Returns null for the bare-title spelling, which has no language
 * and would send us to the wrong wiki.
 */
export function parseWikipediaTag(tag: string | undefined | null): { lang: string; title: string } | null {
  if (!tag) return null;
  const match = /^([a-z-]{2,12}):(.+)$/i.exec(tag.trim());
  if (!match) return null;
  const title = match[2].trim();
  return title ? { lang: match[1].toLowerCase(), title } : null;
}

// ── Place-id classification ──────────────────────────────────────────────────

// Ids that can never resolve against the Google Places API: coordinate pseudo-ids
// (right-click places, in both the coords: and the bare "lat,lng" spelling the
// collection views send), OSM ids the client sends when a place has no
// google_place_id, the raw photo URLs legacy rows keep in image_url, and photo
// cache keys of the form "<placeId>~p3" that enrichment mints for the picker.
// Google answers those with a billable 400 INVALID_ARGUMENT, so every lookup
// sorts them out before the call and uses the OSM/Wikimedia path instead.
const NON_GOOGLE_PLACE_ID =
  /^(?:coords|node|way|relation):|^https?:\/\/|^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$|~p\d+$/i;
// The subset that still has a provider behind it — Overpass for details,
// Wikimedia for photos.
export const OSM_PLACE_ID = /^(?:node|way|relation):/i;

export function isGooglePlaceId(placeId: string): boolean {
  return !NON_GOOGLE_PLACE_ID.test(placeId);
}
