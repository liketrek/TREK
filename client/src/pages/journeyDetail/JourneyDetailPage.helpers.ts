import { PROVIDER_SELECT_ALL_MAX_PAGES } from '@trek/shared';
import { GeoOnceError } from '../../hooks/useGeolocation';
import type { JourneyEntry } from '../../store/journeyStore';
import { localIsoDate } from '../../utils/localDate';
import { GRADIENTS } from './JourneyDetailPage.constants';

// Shared by the desktop entry editor and the mobile entry sheet so a failed
// one-shot position fix surfaces the same translated message everywhere.
export function geoOnceErrorKey(err: unknown): string {
  const code = err instanceof GeoOnceError ? err.code : 'unavailable';
  return code === 'permission-denied'
    ? 'journey.editor.locationPermissionDenied'
    : code === 'timeout'
      ? 'journey.editor.locationTimeout'
      : code === 'insecure-context'
        ? 'journey.editor.locationInsecureContext'
        : 'journey.editor.locationUnavailable';
}

export function pickGradient(id: number): string {
  return GRADIENTS[id % GRADIENTS.length];
}

export function groupByDate(entries: JourneyEntry[]): Map<string, JourneyEntry[]> {
  const groups = new Map<string, JourneyEntry[]>();
  for (const e of entries) {
    const d = e.entry_date;
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(e);
  }
  return groups;
}

/**
 * A blank entry for the editor to open on.
 *
 * `onDate` is what the plus button in a day header hands in. Without it every new
 * entry landed on today no matter where in the journal you started it, so
 * writing up the third day of a trip you got back from last week meant correcting
 * the date by hand every time (discussion #2299). The clock still comes from now:
 * a day has one date but no one obvious hour, and the picker is right there.
 */
export function createDraftJourneyEntry(journeyId: number, now = new Date(), onDate?: string): JourneyEntry {
  const entryDate = onDate
    || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const entryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return {
    id: 0,
    journey_id: journeyId,
    author_id: 0,
    type: 'entry',
    entry_date: entryDate,
    entry_time: entryTime,
    visibility: 'private',
    sort_order: 0,
    photos: [],
    created_at: 0,
    updated_at: 0,
  };
}

export function formatDate(d: string, locale?: string): { weekday: string; month: string; day: number } {
  const date = new Date(d + 'T00:00:00');
  // Pass the app's selected locale so weekday/month follow the UI language
  // instead of the browser's navigator.language.
  return {
    weekday: date.toLocaleDateString(locale, { weekday: 'long' }),
    month: date.toLocaleDateString(locale, { month: 'long' }),
    day: date.getDate(),
  };
}

export function photoUrl(p: { photo_id: number }, size: 'thumbnail' | 'original' = 'thumbnail'): string {
  return `/api/photos/${p.photo_id}/${size}`;
}

/**
 * A clip that came up without a poster frame: the browser could not decode it
 * at upload time, so nothing was grabbed. Its thumbnail route answers 404 on
 * purpose rather than streaming the whole file, and an <img> pointed at it
 * shows the broken-image glyph (#2341). A provider clip is not one of these,
 * its poster comes from the provider whether or not a local path is recorded.
 */
export function posterlessVideo(p: {
  media_type?: string | null;
  provider?: string | null;
  thumbnail_path?: string | null;
}): boolean {
  return p.media_type === 'video' && p.provider === 'local' && !p.thumbnail_path;
}

/**
 * Which calendar day a provider photo belongs to.
 *
 * Providers that keep the photographer's wall clock send it along
 * (`localTakenAt`, Immich's `localDateTime`) and it is already a date, so it is
 * read as one. Everything else only has the capture instant, and the day that
 * instant fell on is the reader's local day, never the UTC one: slicing the
 * instant files a 07:32 photo in Sydney under the day before (#2336).
 *
 * A bare date with no time is passed through — it is a calendar date already,
 * and putting it through a Date would shift it by a zone it never carried.
 */
export function photoLocalDay(asset: { takenAt?: string | null; localTakenAt?: string | null }): string {
  const local = asset.localTakenAt;
  if (typeof local === 'string' && local.length >= 10) return local.slice(0, 10);
  const taken = asset.takenAt;
  if (!taken) return '__unknown__';
  if (taken.length === 10) return taken;
  const parsed = new Date(taken);
  return Number.isNaN(parsed.getTime()) ? taken.slice(0, 10) : localIsoDate(parsed);
}

/**
 * The reader's own UTC offset where a given calendar day starts, in minutes east
 * of UTC.
 *
 * Read on the day being searched rather than at "now", so a summer day looked up
 * in winter is not an hour off, and where that day starts rather than at its
 * midday, because the start is what the server derives from it: `from` becomes
 * exactly that instant. It needs the offset at all because a date-only bound is
 * otherwise a UTC day, which is the wrong 24 hours for everyone outside UTC
 * (#2336).
 *
 * One number cannot describe both ends of a window, and the server closes its
 * own at the start of `to` plus twenty-four hours. So a range whose ends sit on
 * either side of a daylight-saving change is an hour out at the far end, and the
 * twenty-five-hour day a zone gets when its clocks go back loses its last hour
 * even when `from` and `to` name that one day. Both are an hour of a listing
 * rather than the wrong day, and closing them means giving each bound its own
 * offset.
 */
export function utcOffsetMinutesForDay(day?: string): number {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return -new Date().getTimezoneOffset() || 0;
  // An offset can only be read at an instant, and the instant this day starts on
  // is the thing being looked for. So: read the offset half a day into the UTC
  // day, which for every real zone lands inside the local day; use it to step
  // back to roughly local midnight; read the offset there. Parsing
  // `${day}T00:00:00` as a local time instead would be guesswork on the day a
  // zone moves its clocks across midnight, where that wall clock is unreal or
  // happens twice.
  const utcDayStart = Date.parse(`${day}T00:00:00.000Z`);
  const midDay = -new Date(utcDayStart + 43200000).getTimezoneOffset();
  // `|| 0` catches both an unreal date, which gives NaN, and the negative zero
  // that negating a zero offset would otherwise hand to the server.
  return -new Date(utcDayStart - midDay * 60000).getTimezoneOffset() || 0;
}

export function groupPhotosByDate(photos: any[]): { date: string; label: string; assets: any[] }[] {
  const map = new Map<string, any[]>();
  for (const asset of photos) {
    const key = photoLocalDay(asset);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(asset);
  }
  // Group order must not depend on the order of `photos`. Once the caller sorts by
  // distance to the entry, first-seen order would put the day holding the nearest
  // photo first and the date headings would stop reading chronologically. Order
  // within a day is left as handed in, so the distance sort still applies there.
  return [...map.entries()]
    .sort((a, b) => {
      if (a[0] === '__unknown__') return 1;
      if (b[0] === '__unknown__') return -1;
      return b[0].localeCompare(a[0]);
    })
    .map(([date, assets]) => ({
      date,
      label:
        date === '__unknown__'
          ? 'Unknown date'
          : new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
      assets,
    }));
}

export interface ProviderPhotoAsset {
  id: string;
  takenAt?: string | null;
  /** The photographer's wall clock, when the provider knows it. Immich only. */
  localTakenAt?: string | null;
  lat?: number | null;
  lng?: number | null;
  [key: string]: unknown;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export function isValidGeoPoint(point: Partial<GeoPoint> | null | undefined): point is GeoPoint {
  return (
    !!point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

/** Return the great-circle distance in metres between two coordinates. */
export function distanceBetweenGeoPoints(a: GeoPoint, b: GeoPoint): number {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const latA = toRadians(a.lat);
  const latB = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(Math.min(1, h)));
}

/**
 * Keep every asset, but put assets with usable GPS nearest to the selected
 * Journey location. Without a usable location, fall back to newest-taken-first
 * (provider search order isn't guaranteed chronological), with a stable index
 * tiebreak so photos missing `takenAt` keep a deterministic relative order.
 */
export function sortProviderPhotos<T extends ProviderPhotoAsset>(photos: T[], location?: GeoPoint | null): T[] {
  if (!isValidGeoPoint(location)) {
    return photos
      .map((photo, index) => ({ photo, index }))
      .sort((a, b) => {
        const at = a.photo.takenAt;
        const bt = b.photo.takenAt;
        if (!at && !bt) return a.index - b.index;
        if (!at) return 1;
        if (!bt) return -1;
        return bt.localeCompare(at) || a.index - b.index;
      })
      .map((item) => item.photo);
  }

  return photos
    .map((photo, index) => ({
      photo,
      index,
      distance: isValidGeoPoint({ lat: photo.lat ?? Number.NaN, lng: photo.lng ?? Number.NaN })
        ? distanceBetweenGeoPoints(location, { lat: photo.lat!, lng: photo.lng! })
        : null,
    }))
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return a.index - b.index;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance || a.index - b.index;
    })
    .map((item) => item.photo);
}

/**
 * How many photos the picker asks a provider for per page (#1587).
 *
 * The search routes accept up to 200. Every date-filtered Immich page restarts
 * its scan at the first raw page on the server, so a smaller page makes loading
 * a whole trip cost quadratically more round trips; 200 is a quarter of what 50
 * cost, and still a grid the browser lays out without a stall.
 */
export const PROVIDER_SEARCH_PAGE_SIZE = 200;

/**
 * The deepest page the picker asks a date-bounded search for (#1587): its first
 * page and the PROVIDER_SELECT_ALL_MAX_PAGES after it, photos 50,001 to 50,200.
 *
 * Absolute, however the page would be reached: by "Select all", by pressing it
 * again after it stopped here, or by scrolling. Every such page restarts the
 * server's Immich scan at its first raw page, and the server stops that scan at
 * a ceiling sized for exactly this page. One past it could come back empty with
 * `hasMore: false`, and the picker would drop the "+" and call a cut-off search
 * complete. Stopping here keeps the "+".
 */
export const PROVIDER_SEARCH_LAST_PAGE = PROVIDER_SELECT_ALL_MAX_PAGES + 1;

export interface ProviderPhotoPage<T> {
  assets?: T[];
  hasMore?: boolean;
}

/**
 * Load the pages of a provider search that are still missing, one after the
 * other, until the provider says there are no more (#1587).
 *
 * "Select all" used to mean the pages already scrolled into view, so a trip of
 * a thousand photos selected fifty. Sequential on purpose: whether there is a
 * next page is only known once this one has answered. `onPage` hands each page
 * over as it lands so the grid can grow while the button is busy.
 *
 * Stops quietly once `signal` is aborted, which is how closing the picker or
 * switching its tab cancels the run: the caller then discards what came back.
 *
 * `lastPage` is the deepest page asked for, whichever page the run starts at, so
 * a provider that keeps answering `hasMore` cannot hold the button busy for
 * ever. Running into it leaves `hasMore` true, so the count keeps its "+", and a
 * run that starts past it asks for nothing.
 */
export async function fetchRemainingProviderPages<T>(
  fetchPage: (page: number) => Promise<ProviderPhotoPage<T>>,
  firstPage: number,
  signal: AbortSignal,
  onPage: (assets: T[], page: number, hasMore: boolean) => void,
  lastPage: number = PROVIDER_SEARCH_LAST_PAGE,
): Promise<{ assets: T[]; hasMore: boolean }> {
  const assets: T[] = [];
  let hasMore = true;
  for (let page = firstPage; hasMore && page <= lastPage; page++) {
    if (signal.aborted) break;
    const data = await fetchPage(page);
    if (signal.aborted) break;
    const pageAssets = data.assets ?? [];
    hasMore = !!data.hasMore;
    assets.push(...pageAssets);
    onPage(pageAssets, page, hasMore);
  }
  return { assets, hasMore };
}

/** A capture time as milliseconds, or null when it is missing or unreadable. */
function captureMillis(value?: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Items in the order their photos were taken, oldest first (#1587).
 *
 * An entry keeps its photos in the order they were added, and the picker used
 * to add them in grid order, newest first, so a bulk import landed backwards.
 * The key is the photographer's wall clock (`localTakenAt`) where the provider
 * has it, the capture instant otherwise. Ties and photos without either keep
 * the order they came in, the undated ones after the rest.
 *
 * Only the order of the ids sent changes. The capture time itself is still
 * fetched by the server (#1614), never taken from here.
 */
export function sortByCaptureTimeAsc<T extends { takenAt?: string | null; localTakenAt?: string | null }>(
  items: T[],
): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      key: captureMillis(item.localTakenAt) ?? captureMillis(item.takenAt),
      instant: captureMillis(item.takenAt),
    }))
    .sort((a, b) => {
      if (a.key === null && b.key === null) return a.index - b.index;
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      return a.key - b.key || (a.instant ?? 0) - (b.instant ?? 0) || a.index - b.index;
    })
    .map((entry) => entry.item);
}

/**
 * The entries a search box's text still lets through.
 *
 * A journey kept over months is a long scroll with no way in but the wheel: the
 * only handle on "where was that meal in Lisbon" was remembering roughly which
 * week it was (discussion #2299). Matching runs over the words the reader would
 * actually remember — the title, the story, the place and the tags — and is
 * accent- and case-blind, so `cafe` finds `Café`.
 *
 * An empty query is not a filter: it returns the list untouched, same reference.
 */
export function matchJourneyEntries<T extends {
  title?: string | null;
  story?: string | null;
  location_name?: string | null;
  tags?: string[];
}>(entries: T[], query: string): T[] {
  const needle = query ? foldForSearch(query) : '';
  if (!needle) return entries;
  return entries.filter((entry) => {
    const haystack = [entry.title, entry.story, entry.location_name, ...(entry.tags ?? [])];
    return haystack.some((part) => part && foldForSearch(part).includes(needle));
  });
}

/** Lowercase and strip diacritics, so a query typed without accents still matches. */
function foldForSearch(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
