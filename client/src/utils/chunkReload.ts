/**
 * Recognising — and surviving — a lazy chunk that no longer exists.
 *
 * After a deploy the old index file still references hashed chunks that are gone
 * from the server, so a dynamic import fails for anyone with the tab still open.
 * React.lazy caches the rejected promise on the lazy object, which means retrying
 * the same render fails instantly and forever: the only cure is a reload that
 * fetches the new index.
 *
 * Kept out of the component module so main.tsx can use it without pulling React in.
 */

import { probeNow } from '../sync/connectivity';
import { isEffectivelyOffline } from '../sync/networkMode';
import { dropAppShell, reloadHitsSameWorker } from './serviceWorkerShell';

const RELOAD_MARKER = 'trek:chunk-reload';

/** Vite's own message, plus what Chrome/Firefox/Safari say for a failed module fetch. */
const CHUNK_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'unable to preload css',
  'dynamically imported module',
];

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const haystack = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some(p => haystack.includes(p));
}

/**
 * The query parameter a recovery reload carries. public/shell-guard.js strips it
 * again before the app reads the URL.
 */
export const FRESH_LOAD_PARAM = 'trek-reload';

/**
 * location.reload(), except that the page is asked for under a URL no cache has
 * seen yet. A reverse proxy or CDN that keeps index.html against its headers
 * would answer a plain reload with the shell that just failed, and the page
 * would come back to the same missing chunk every time (#2524).
 */
export function reloadFresh(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(FRESH_LOAD_PARAM, Date.now().toString(36));
    window.location.replace(url.href);
  } catch {
    window.location.reload();
  }
}

/**
 * Reload so that the page comes back on the build the server runs now.
 *
 * Usually a fresh reload is that. The chunk is gone because a newer service
 * worker took over after this page loaded (it drops the previous build's files
 * from its precache as it does), or because there is no worker and the tab
 * outlived a deploy. Either way the reload is answered with the current shell.
 *
 * It is not when the worker that served this page is still the one in charge.
 * That worker would answer the reload with the very shell whose chunk it just
 * failed to deliver, so its precache is what is broken, and the page would come
 * back to the same error on every reload, cleared browser cache or not (#2524).
 * Then the precache and the worker are dropped first, so the reload reaches the
 * server. Only while the server answers and the app is not in offline mode:
 * offline, that precache is the only way the app starts at all, and a failed
 * chunk says nothing about it being broken. The worker is looked at again once
 * the server has answered, since a new one may have taken over in the meantime,
 * and then there is nothing to drop.
 */
export function reloadOntoCurrentBuild(): void {
  if (!reloadHitsSameWorker()) {
    reloadFresh();
    return;
  }
  void (async () => {
    try {
      if (!isEffectivelyOffline() && (await probeNow()) === 'online' && reloadHitsSameWorker()) {
        await dropAppShell();
      }
    } catch {
      // Reload regardless: at worst it shows this screen again.
    }
    reloadFresh();
  })();
}

/**
 * Reload once per session for a given chunk failure, then give up and let the
 * fallback show. Without the marker a chunk that is genuinely missing — a broken
 * deploy, a proxy serving stale assets — would put the tab in a reload loop.
 */
export function reloadOnceForChunk(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_MARKER)) return false;
    sessionStorage.setItem(RELOAD_MARKER, String(Date.now()));
  } catch {
    // Private mode or a blocked storage partition: reloading blind would risk a
    // loop, so prefer showing the fallback with its manual reload button.
    return false;
  }
  reloadOntoCurrentBuild();
  return true;
}

/** Called once the app has rendered successfully, so the next deploy can heal too. */
export function clearChunkReloadMarker(): void {
  try {
    sessionStorage.removeItem(RELOAD_MARKER);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
