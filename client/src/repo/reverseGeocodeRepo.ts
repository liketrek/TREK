import { mapsApi } from '../api/client';
import { isEffectivelyOffline } from '../sync/networkMode';

/** How many coordinates the cache remembers before it starts over. */
const CACHE_LIMIT = 500;
/** How many answered names outlive a reload; the oldest give way first. */
const STORED_LIMIT = 2000;
/** Where the answered names are kept between visits: a convenience, rebuilt from the geocoder when gone. */
const STORAGE_KEY = 'trek-place-names-v1';
/** How many lookups may be in flight at once, so a long tour does not flood the geocoder. */
const CONCURRENCY = 2;

const cache = new Map<string, Promise<string | null>>();
const queue: Array<() => void> = [];
let running = 0;

/**
 * Five decimals are about a metre: a point nudged by less than that is the same
 * place, and a point moved further is asked for again.
 */
function keyOf(lat: number, lng: number, lang: string): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}|${lang}`;
}

function runQueued<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      running += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          running -= 1;
          queue.shift()?.();
        });
    };
    if (running < CONCURRENCY) start();
    else queue.push(start);
  });
}

/** The names answered on earlier visits, read once; an unreadable store is an empty one. */
let stored: Map<string, string> | null = null;

function storedNames(): Map<string, string> {
  if (stored) return stored;
  stored = new Map();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string')
          stored.set(entry[0], entry[1]);
      }
    }
  } catch {
    // Blocked or broken storage: names are simply asked for again.
  }
  return stored;
}

/** Keeps an answered name for later visits, dropping the oldest past the limit. */
function storeName(key: string, name: string): void {
  const names = storedNames();
  names.delete(key);
  names.set(key, name);
  while (names.size > STORED_LIMIT) names.delete(names.keys().next().value as string);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...names]));
  } catch {
    // Full or blocked storage: the name still serves this visit from memory.
  }
}

/** The name a reverse lookup gives, or the first part of its address when it has no name. */
function placeLabel(result: { name: string | null; address: string | null }): string | null {
  const name = result.name?.trim();
  if (name) return name;
  const first = result.address?.split(',')[0]?.trim();
  return first || null;
}

export const reverseGeocodeRepo = {
  /**
   * A short place name for a coordinate, or null when the geocoder knows none.
   * Rejects offline and on a failed lookup; a failure is not cached, so the
   * same point is asked again the next time it is shown.
   */
  placeName(lat: number, lng: number, lang: string): Promise<string | null> {
    const key = keyOf(lat, lng, lang);
    const known = storedNames().get(key);
    if (known !== undefined) return Promise.resolve(known);
    if (isEffectivelyOffline()) return Promise.reject(new Error('Offline'));
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    if (cache.size >= CACHE_LIMIT) cache.clear();
    const value = runQueued(() => mapsApi.reverse(lat, lng, lang)).then((result) => {
      const label = placeLabel(result);
      if (label) storeName(key, label);
      return label;
    });
    cache.set(key, value);
    void value.catch(() => {
      if (cache.get(key) === value) cache.delete(key);
    });
    return value;
  },
  /**
   * A name answered before, on this visit or an earlier one, without asking;
   * undefined when the coordinate has not been answered with a name yet.
   */
  knownName(lat: number, lng: number, lang: string): string | undefined {
    return storedNames().get(keyOf(lat, lng, lang));
  },
  /** Forgets every remembered name, kept ones included; for tests. */
  clear() {
    cache.clear();
    stored = new Map();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing kept to forget.
    }
  },
};
