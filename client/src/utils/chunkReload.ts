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
  window.location.reload();
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
