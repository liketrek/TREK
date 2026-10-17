/**
 * The service worker that answers this page's navigations, and the way out when
 * the app shell it keeps can no longer start.
 *
 * Kept free of React so main.tsx and the error handlers can use it early.
 */

import { isEffectivelyOffline } from '../sync/networkMode'

/** Part of the name of every Workbox precache, and of no other cache the app keeps. */
const PRECACHE = '-precache-'

/** The worker controlling this page, or null. Reading it can throw where site data is blocked. */
export function currentController(): ServiceWorker | null {
  try {
    return 'serviceWorker' in navigator ? navigator.serviceWorker.controller : null
  } catch {
    return null
  }
}

// The worker that served this page, noted when the app loads. The browser checks
// sw.js on every navigation by itself, so a new build can take over while this
// page still runs the previous one. A controller other than this one means the
// new shell is only a reload away. A page served without a worker came from the
// network, so a worker claiming it later is no takeover.
const servedBy = currentController()

/** The worker that served this page when it loaded, or null when it came from the network. */
export function servingWorker(): ServiceWorker | null {
  return servedBy
}

/**
 * True when a reload would be answered by the same worker that served this page,
 * which means with the same app shell.
 */
export function reloadHitsSameWorker(): boolean {
  const worker = currentController()
  return worker !== null && worker === servedBy
}

/**
 * Throws away the app shell this browser keeps: the Workbox precache and the
 * worker that serves it. The next navigation then goes to the server, gets the
 * index.html of the build it runs now, and registers that build's worker, which
 * precaches from scratch instead of reusing an entry of the broken cache.
 *
 * Map tiles, GL styles and cached uploads live in caches of their own and stay.
 * A Web Push subscription does not: it belongs to the registration and ends with
 * it, so the settings card shows push as off on this device until it is switched
 * on again. Only call this while the server answers: offline, the precache is
 * the only way the app can start at all.
 *
 * public/shell-guard.js does the same for a shell whose entry cannot load, before
 * any of this code runs. Keep the two in step.
 */
export async function dropAppShell(): Promise<void> {
  if (typeof caches !== 'undefined') {
    const names = await caches.keys()
    await Promise.all(names.filter(name => name.includes(PRECACHE)).map(name => caches.delete(name)))
  }
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
  if (reg) await reg.unregister()
}

// Workbox keys a file without a hash in its name as url?__WB_REVISION__=<hash>.
const REVISION_PARAM = '__WB_REVISION__'
// A build file asked for under this parameter gets past the precache, whose route
// only knows the plain URL, and past any cache in between that keeps files by URL.
const REPAIR_PARAM = 'trek-repair'
const REPAIR_TIMEOUT_MS = 15_000
// The entries the precache held when it was last found sound, so that an
// unchanged precache is not looked through again on every launch.
const CHECKED_KEY = 'trek:precache-checked'
// What the precache keeps besides index.html (globPatterns in vite.config.js,
// plus the web manifest). None of these may ever be a page.
const BUILD_FILE = /\.(?:js|css|svg|png|woff2?|ttf|webmanifest)$/i

interface Precache { name: string, cache: Cache, keys: readonly Request[] }

function isPage(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').toLowerCase().includes('text/html')
}

/**
 * Which entries the precaches hold, in a few characters. Order does not count:
 * a repaired entry moves to the end of the list.
 */
function fingerprint(precaches: readonly Precache[]): string {
  const urls = precaches.flatMap(({ name, keys }) => keys.map(key => `${name} ${key.url}`)).sort((a, b) => a.localeCompare(b))
  let hash = 0x811c9dc5
  for (const text of urls) {
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193)
  }
  return `${urls.length}.${(hash >>> 0).toString(36)}`
}

/** The last fingerprint found sound, '' for none, or null when storage is blocked. */
function lastChecked(): string | null {
  try {
    return localStorage.getItem(CHECKED_KEY) ?? ''
  } catch {
    return null
  }
}

function noteChecked(print: string): void {
  try {
    localStorage.setItem(CHECKED_KEY, print)
  } catch {
    // The next launch looks through the precache once more.
  }
}

/**
 * The build file behind a precache entry, fetched past every cache. 'gone' when
 * the server says it has no such file. Throws when no usable answer came: no
 * network, a timeout, a redirect to an auth wall, its login page, a server error.
 */
async function fetchBuildFile(key: Request): Promise<Response | 'gone'> {
  const url = new URL(key.url)
  url.searchParams.delete(REVISION_PARAM)
  url.searchParams.set(REPAIR_PARAM, Date.now().toString(36))
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REPAIR_TIMEOUT_MS)
  try {
    const res = await fetch(url.href, { cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: ctrl.signal })
    if (res.status === 404 || res.status === 410) return 'gone'
    if (res.status !== 200 || isPage(res)) throw new Error(`${res.status} for ${url.pathname}`)
    // A response of its own, without the one-off URL it was fetched from: a
    // module is known by its response URL. The body streams into the cache.
    return new Response(res.body, { status: 200, statusText: res.statusText, headers: res.headers })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Puts right precache entries that hold a page instead of the build file their
 * URL names, and returns the paths of the ones it put right (#2524).
 *
 * A precache install keeps whatever answered with a 200. A server that answered
 * a missing build file with index.html, as 4.3.2 and older did, or a proxy that
 * answered with its login page, left a page under the name of a script, a
 * stylesheet or a font. Workbox reuses an entry for as long as a later release
 * lists its URL, without fetching it again, and every hashed file under
 * /assets/ keeps its URL until its content changes. So the broken entry is
 * carried from release to release. A broken script at least fails its import,
 * and the app recovers from that (chunkReload, shell-guard.js). A broken
 * stylesheet, font or icon raises no error at all: the app just loses its
 * layout or its typeface, on every launch, and offline too.
 *
 * Each such entry is fetched from the server again and put back in its place.
 * One the server does not have is removed, so the file is asked for on the
 * network and the next install stores it. When a fetch fails, the rest is left
 * for the next launch. A precache found sound is not looked at again until its
 * entries change, and without storage to note that in, nothing is done.
 */
export async function repairPrecache(): Promise<string[]> {
  const checked = lastChecked()
  if (checked === null || typeof caches === 'undefined') return []
  const names = (await caches.keys()).filter(name => name.includes(PRECACHE))
  const precaches = await Promise.all(names.map(async (name): Promise<Precache> => {
    const cache = await caches.open(name)
    return { name, cache, keys: await cache.keys() }
  }))
  const print = fingerprint(precaches)
  if (checked === print) return []

  const repaired: string[] = []
  for (const { cache, keys } of precaches) {
    // Only the headers are read here, never a body.
    const broken = (await Promise.all(keys.map(async key => {
      if (!BUILD_FILE.test(new URL(key.url).pathname)) return null
      const response = await cache.match(key)
      return response && isPage(response) ? key : null
    }))).filter((key): key is Request => key !== null)

    // One at a time: this is a way out, not a race, and a big chunk is not held
    // in memory next to another.
    for (const key of broken) {
      let fresh: Response | 'gone'
      try {
        fresh = await fetchBuildFile(key)
      } catch {
        return repaired
      }
      if (fresh === 'gone') {
        await cache.delete(key)
      } else {
        await cache.put(key, fresh)
        repaired.push(new URL(key.url).pathname)
      }
    }
  }
  noteChecked(print)
  return repaired
}

const FONT_FILE = /\.(?:woff2?|ttf)$/i

/**
 * Loads the stylesheets this page took from a broken precache entry again, now
 * that the entry holds the stylesheet. The old link goes once the new one has
 * loaded, so the page keeps what styles it has until then.
 *
 * A font face that failed is not tried again in the same document. When a font
 * was put right, the app's own stylesheets, which declare every face it uses,
 * are loaded again too, and the faces they declare anew load the repaired file.
 */
export function restyle(paths: readonly string[]): void {
  if (paths.length === 0) return
  const fontRepaired = paths.some(path => FONT_FILE.test(path))
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')) {
    const url = new URL(link.href, document.baseURI)
    const declaresFonts = fontRepaired && url.origin === location.origin && url.pathname.startsWith('/assets/')
    if (!declaresFonts && !paths.includes(url.pathname)) continue
    const fresh = link.cloneNode() as HTMLLinkElement
    fresh.addEventListener('load', () => link.remove(), { once: true })
    fresh.addEventListener('error', () => fresh.remove(), { once: true })
    link.after(fresh)
  }
}

/**
 * Runs {@link repairPrecache} once the page has loaded and the browser is idle,
 * and only while the app is online: offline there is nothing to fetch the files
 * from.
 */
export function schedulePrecacheRepair(): void {
  const run = () => {
    if (isEffectivelyOffline()) return
    repairPrecache().then(restyle, () => {
      // Cache Storage refused, so the next launch tries again.
    })
  }
  const whenIdle = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 10_000 })
    else setTimeout(run, 2_000)
  }
  if (document.readyState === 'complete') whenIdle()
  else window.addEventListener('load', whenIdle, { once: true })
}
