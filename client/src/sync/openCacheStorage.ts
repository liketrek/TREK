/**
 * Opens a Cache Storage bucket, or null where it cannot be had: no Cache
 * Storage at all, an open that throws, or one that never settles.
 *
 * The last is the one that hurt. On iPadOS the app's web view can leave
 * caches.open() pending for good instead of refusing it, and everything that
 * awaited it waited with it: "prepare for offline" stood still on its first
 * trip's map tiles, and the offline map protocol never answered MapLibre, so
 * the map stayed blank without an error. An open that has not settled after a
 * few seconds is given up on, and Cache Storage is not tried again for the
 * rest of the session, so no later caller pays the wait again.
 */

const OPEN_TIMEOUT_MS = 4000;

let unusable = false;

export async function openCacheStorage(name: string): Promise<Cache | null> {
  if (unusable || typeof caches === 'undefined') return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const gaveUp = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), OPEN_TIMEOUT_MS);
  });
  try {
    const cache = await Promise.race([caches.open(name), gaveUp]);
    if (!cache) unusable = true;
    return cache;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Whether Cache Storage was given up on this session. */
export function cacheStorageUnusable(): boolean {
  return unusable;
}

/** Tests only: try Cache Storage again. */
export function _resetCacheStorage(): void {
  unusable = false;
}
