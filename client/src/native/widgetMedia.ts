import { fetchWeather } from '../services/weatherQueue';
import { temperature } from './widgetExtras';
import type { WidgetWeather } from './widgets';

/**
 * The two things the widget snapshot needs from the network: the weather where
 * the trip is, and the trip's cover as a small JPEG the widget can draw without
 * a session of its own. Both are best effort: offline or failing, the widget
 * simply goes without them, and both are kept so a quarter-hourly sync does not
 * fetch them again.
 */

const WEATHER_TTL_MS = 60 * 60 * 1000;
const weatherCache = new Map<string, { at: number; value: WidgetWeather | null }>();

export async function widgetWeather(
  { lat, lng }: { lat: number; lng: number },
  { date, lang, unit, place }: { date: string; lang: string; unit: string | undefined; place?: string | null }
): Promise<WidgetWeather | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${date},${lang},${unit ?? ''}`;
  const hit = weatherCache.get(key);
  if (hit && Date.now() - hit.at < WEATHER_TTL_MS) return hit.value;
  let value: WidgetWeather | null = null;
  try {
    const w = await fetchWeather(lat, lng, date, lang);
    if (!w.error && Number.isFinite(w.temp)) {
      value = {
        temp: temperature(w.temp, unit),
        ...(w.temp_max != null ? { high: temperature(w.temp_max, unit) } : {}),
        ...(w.temp_min != null ? { low: temperature(w.temp_min, unit) } : {}),
        main: w.main,
        label: w.description,
        ...(place ? { place } : {}),
        ...(w.precipitation_probability_max != null ? { rain: Math.round(w.precipitation_probability_max) } : {}),
      };
    }
  } catch {
    // Offline or the provider failed: the widget shows no weather until the next sync.
    value = null;
  }
  weatherCache.set(key, { at: Date.now(), value });
  return value;
}

const COVER_KEY = 'trek.widgetCovers';
/** Covers kept, one per trip a widget can show (widgetTripChoices). */
const COVER_KEEP = 6;
const COVER_MAX_PX = 720;
const COVER_MAX_BYTES = 15 * 1024 * 1024;
/** Kept under this so the keychain item the widget reads stays small. */
const COVER_MAX_BASE64 = 160_000;

function storedCovers(): { url: string; data: string }[] {
  try {
    const raw = localStorage.getItem(COVER_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as { url: string; data: string }[]) : [];
  } catch {
    return [];
  }
}

function storedCover(url: string): string | null {
  return storedCovers().find((c) => c.url === url)?.data ?? null;
}

/** Newest first, the oldest dropped past COVER_KEEP. */
function storeCover(url: string, data: string): void {
  try {
    const rest = storedCovers().filter((c) => c.url !== url);
    localStorage.setItem(COVER_KEY, JSON.stringify([{ url, data }, ...rest].slice(0, COVER_KEEP)));
  } catch {
    // Storage full: the cover is fetched again next time, nothing else depends on it.
  }
}

/**
 * The cover at `url` scaled to fit COVER_MAX_PX, as base64 JPEG without the
 * data: prefix. Null without a cover, offline, or for anything not an image.
 */
export async function widgetCover(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const stored = storedCover(url);
  if (stored) return stored;
  try {
    const res = await fetch(url, { credentials: 'include', signal: AbortSignal.timeout(10_000) });
    const length = Number(res.headers.get('content-length') ?? 0);
    if (!res.ok || length > COVER_MAX_BYTES) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size > COVER_MAX_BYTES) return null;
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, COVER_MAX_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    let data = canvas.toDataURL('image/jpeg', 0.74).split(',')[1] ?? '';
    if (data.length > COVER_MAX_BASE64) data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1] ?? '';
    if (!data || data.length > COVER_MAX_BASE64) return null;
    storeCover(url, data);
    return data;
  } catch {
    // Offline, a timeout or an image the WebView cannot decode: no cover this time.
    return null;
  }
}
