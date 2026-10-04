/**
 * Bringing an installed app onto the build the server runs now.
 *
 * Every launch asks the server for its version and compares it with a marker
 * this device keeps. A different version means a release was deployed while
 * this page may still run the previous bundle, answered from the service
 * worker's precache. The worker is asked to fetch the new build; Workbox
 * ('autoUpdate' with skipWaiting and clientsClaim) installs the new precache
 * and only then drops the old one, and the page reloads once the new worker
 * has taken over.
 *
 * The marker only moves once that handover is done or turned out to be
 * unnecessary. A handover that failed (sw.js unreachable, a precache install
 * that broke off on a flaky connection) is simply tried again on the next
 * launch. That retry cannot loop: a failure never reloads, since the same old
 * worker would answer the reload, and every reload here is limited to one per
 * version and session.
 */

import { reloadFresh } from './chunkReload'
import { currentController, servingWorker } from './serviceWorkerShell'

const VERSION_KEY = 'trek_app_version'
const RELOAD_KEY = 'trek_app_version_reload'

// The version this bundle was built as (vite.config.js). A bare tsc run has none,
// and then no version counts as this bundle's own.
const BUNDLE_VERSION: string = typeof __TREK_UI_VERSION__ === 'string' ? __TREK_UI_VERSION__ : ''

// The worker that served this page, noted when the app loads (serviceWorkerShell).
// When the browser's own check of sw.js installs the new build before the server
// has told us its version, the takeover is over before anyone listens for it.
const servedBy = servingWorker()

function markApplied(version: string): void {
  try { localStorage.setItem(VERSION_KEY, version) } catch { /* site data blocked */ }
}

/**
 * One reload per server version and session. When the marker cannot be written,
 * every load sees the new version again, and a page without a worker would
 * otherwise reload forever. Without session storage there is no such guard, so
 * the page stays as it is rather than risking the loop.
 */
function reloadOnce(version: string): void {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === version) return
    sessionStorage.setItem(RELOAD_KEY, version)
  } catch {
    return
  }
  // Under a URL no cache has seen yet: without a worker, a proxy that keeps
  // index.html against its headers would answer a plain reload with the very
  // shell this page runs, and the marker has moved on already (#2524).
  reloadFresh()
}

/**
 * Asks the worker for the new build and moves the marker once it has taken over.
 * `runsIt` is a page that already runs the new bundle, so the takeover needs no
 * reload to show it.
 */
async function handOver(reg: ServiceWorkerRegistration, version: string, runsIt: boolean): Promise<void> {
  // Listening before asking for the update, so a quick takeover is not missed.
  // Giving up disarms the listener: the reload belongs to this launch, and one
  // arriving later in the session would hit the user in the middle of an edit.
  let armed = true
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!armed) return
    markApplied(version)
    if (!runsIt) reloadOnce(version)
  }, { once: true })

  try {
    await reg.update()
  } catch {
    armed = false
    return
  }

  const incoming = reg.installing ?? reg.waiting
  if (!incoming) {
    // sw.js is unchanged, so the release changed nothing the precache holds and
    // the bundle this page runs is the current one.
    armed = false
    if (runsIt || currentController() === servedBy) markApplied(version)
    return
  }
  // Precaching is all or nothing: one failed request out of several hundred and
  // the new worker is thrown away while the old one stays in charge. The marker
  // has not moved, so the next launch comes back here.
  incoming.addEventListener('statechange', () => {
    if (incoming.state === 'redundant') armed = false
  })
}

/**
 * Compares the version the server reports with the one this device last ran
 * and, when they differ, moves the app onto the new build. It never deletes a
 * cache or unregisters a worker. That used to leave the device without an app
 * shell until a fresh ~22 MB precache finished, so anyone who closed the app or
 * lost signal in that window could no longer start it offline, and it threw
 * away the map tiles and files the user had downloaded on purpose.
 */
export async function reconcileAppVersion(reported: unknown): Promise<void> {
  // A version is a short release tag and nothing else. It arrives over the
  // wire and is written to this device's storage, so only a value made of
  // the characters a tag may contain is taken, as the match itself. Anything
  // else is ignored, which also keeps a malformed value from being compared
  // against the stored marker and starting an update on every launch.
  const releaseTag = /^[\w.+-]{1,64}$/.exec(typeof reported === 'string' ? reported : '')
  if (!releaseTag) return
  const version = releaseTag[0]

  let storedVersion: string | null
  try {
    storedVersion = localStorage.getItem(VERSION_KEY)
  } catch {
    return
  }
  if (!storedVersion) {
    // The first launch on this device runs whatever the server just served.
    markApplied(version)
    return
  }
  if (storedVersion === version) return

  let reg: ServiceWorkerRegistration | undefined
  try {
    reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
  } catch {
    // Left for the next launch. A reload now would only reach the old worker again.
    return
  }

  // A page that came from the network and was built as this version runs it
  // already. That is where the way out of a broken app shell lands, before the
  // new app could move the marker (#2524): the old worker is gone, and the one
  // registered since is this build. Reloading once it has taken over would only
  // interrupt the user a few seconds in, with nothing new to show. An older
  // worker still in charge (this page was loaded past it, as a hard reload
  // does) would serve its own build to the next tab or launch, so it is handed
  // over like any other, just without the reload.
  const runsIt = !servedBy && version === BUNDLE_VERSION
  if (runsIt && (!reg?.active || reg.active === currentController())) {
    markApplied(version)
    return
  }

  // Without a worker the page came from the network, yet was not built as this
  // version: a proxy or CDN handed out an index.html it kept, or the server
  // reports a version its bundle was not built as, and then the reload only
  // confirms what runs. A controller other than the one that served the page
  // means the browser finished the handover by itself, and the reload is what
  // shows the new build.
  if (!reg || (servedBy && currentController() !== servedBy)) {
    markApplied(version)
    reloadOnce(version)
    return
  }
  await handOver(reg, version, runsIt)
}
