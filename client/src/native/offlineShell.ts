import { TrekShell } from './trekShell';

/**
 * iOS only. WKWebView runs no service worker for a domain the app does not
 * list at build time, so the app stands in for it: the native side keeps a
 * copy of the start page (TrekShellPlugin.refreshOfflineCopy), and this pulls
 * every chunk of the current build into WebKit's HTTP cache. The server marks
 * them immutable, so a cold start without network can load the stored start
 * page under the server's origin and find all its scripts, including the lazy
 * routes nobody has opened yet.
 */

const MANIFEST_URL = '/asset-manifest.json';
/**
 * Few at a time and at low priority: the warm-up runs while the user already
 * moves through the app, and the page they open must never queue behind it.
 * Measured on a phone: four at normal priority held a first visit to Vacay
 * back by five to seven seconds right after a server update.
 */
const CONCURRENCY = 2;
/** The build whose files are all in the cache; a launch on the same build skips the walk. */
const WARMED_KEY = 'trek.offlineShellBuild';
const LOCALE_KEY = /\/i18n\/([^/]+)\/index\.[cm]?js$/;

interface ManifestChunk {
  file?: string;
  css?: string[];
  assets?: string[];
}

/**
 * Every file of the build, without the translations of other languages: only
 * the user's own and English (the fallback) are needed offline, the other 25
 * would cost several megabytes per build for nothing.
 */
export function manifestFiles(manifest: unknown, language?: string): string[] {
  if (typeof manifest !== 'object' || manifest === null) return [];
  const keep = new Set(['en', language ?? 'en']);
  const files = new Set<string>();
  for (const [key, chunk] of Object.entries(manifest as Record<string, ManifestChunk>)) {
    const locale = LOCALE_KEY.exec(key)?.[1];
    if (locale && !keep.has(locale)) continue;
    if (typeof chunk?.file === 'string') files.add(chunk.file);
    for (const list of [chunk?.css, chunk?.assets]) {
      if (Array.isArray(list)) list.forEach((f) => typeof f === 'string' && files.add(f));
    }
  }
  return [...files];
}

/** True when every file was fetched. */
async function warmCache(files: string[], fetchFile: (path: string) => Promise<unknown>): Promise<boolean> {
  const queue = [...files];
  let complete = true;
  const worker = async (): Promise<void> => {
    for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
      try {
        await fetchFile(`/${path}`);
      } catch {
        // One missing chunk must not stop the rest; the next launch tries again.
        complete = false;
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return complete;
}

function warmedBuild(): string | null {
  try {
    return window.localStorage.getItem(WARMED_KEY);
  } catch {
    return null;
  }
}

function rememberWarmed(build: string): void {
  try {
    window.localStorage.setItem(WARMED_KEY, build);
  } catch {
    // Not remembered: the next launch walks the files again, from the cache.
  }
}

export async function keepOfflineShellFresh(fetchImpl: typeof fetch = fetch, language?: string): Promise<void> {
  await TrekShell.refreshOfflineCopy();
  const response = await fetchImpl(MANIFEST_URL, { cache: 'no-store' });
  if (!response.ok) return;
  const files = manifestFiles(await response.json(), language);
  // The build and the language together: a new language needs its own chunk.
  const build = `${[...files].sort((a, b) => a.localeCompare(b)).find((f) => /index-[^/]+\.js$/.test(f)) ?? files.length}:${language ?? 'en'}`;
  if (warmedBuild() === build) return;
  const complete = await warmCache(files, (path) =>
    fetchImpl(path, { priority: 'low' } as RequestInit).then((r) => r.blob())
  );
  if (complete) rememberWarmed(build);
}
