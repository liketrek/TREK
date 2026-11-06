import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { clearChunkReloadMarker, isChunkLoadError } from './chunkReload';

/**
 * React.lazy with a single second attempt — and the place where a healthy load is
 * acknowledged.
 *
 * A route chunk fails for two very different reasons. Either the file is gone
 * because a deploy happened while the tab was open; nothing but a reload helps, and
 * reloadOnceForChunk() already owns that path through the route boundary. Or the
 * fetch itself went wrong: a blip on hotel wifi, an aborted request, a service
 * worker handing back a truncated entry. That one heals on a second try, and it is
 * the only case this wrapper exists for.
 *
 * The retry cannot reuse the original specifier. Vite rewrites
 * import('./pages/AtlasPage') into a hashed asset URL at build time, so a query
 * appended in source stops it being statically analysable: the build leaves a
 * runtime path that resolves against the wrong directory, while dev — which really
 * does serve the source file — looks perfectly fine. The only usable URL is the one
 * the browser names in the failure message. A fresh query on it misses the HTTP
 * cache and the Workbox precache, both of which key on the full URL.
 */

const retried = new Set<string>();

/** The cache-busted URL for one failed chunk, or null when a retry is pointless. */
export function retryUrlFor(error: unknown): string | null {
  if (!isChunkLoadError(error)) return null;

  const message = error instanceof Error ? error.message : String(error);
  const match = /https?:\/\/[^\s'")]+/.exec(message);
  // Safari says "Importing a module script failed." and names no URL at all, and a
  // relative path gives us nothing to bust. Both belong to the boundary, not here.
  if (!match) return null;

  const url = match[0];
  // The CSS preload wording carries a stylesheet, which is not ours to import.
  if (url.endsWith('.css') || retried.has(url)) return null;
  retried.add(url);

  const busted = new URL(url);
  busted.searchParams.set('t', String(Date.now()));
  return busted.href;
}

export function lazyWithRetry<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(() =>
    load()
      .catch((error: unknown) => {
        const url = retryUrlFor(error);
        // Rethrown on purpose: React.lazy hands the rejection to the nearest
        // boundary, and that one knows how to reload once per session.
        if (!url) throw error;
        return import(/* @vite-ignore */ url) as Promise<{ default: T }>;
      })
      .then(module => {
        // A chunk arrived, so the asset pipeline is intact and a later deploy may
        // spend its own reload. This used to sit in main.tsx right after render(),
        // which runs before React commits and long before any chunk is fetched — the
        // marker was cleared before it was ever needed, and a chunk that is genuinely
        // missing could put the tab in the reload loop the marker exists to prevent.
        clearChunkReloadMarker();
        return module;
      })
  );
}
