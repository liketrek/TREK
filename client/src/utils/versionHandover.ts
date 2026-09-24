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

const VERSION_KEY = 'trek_app_version'
const RELOAD_KEY = 'trek_app_version_reload'

/** The worker controlling this page, or null. Reading it can throw where site data is blocked. */
function currentController(): ServiceWorker | null {
  try {
    return 'serviceWorker' in navigator ? navigator.serviceWorker.controller : null
  } catch {
    return null
  }
}

// The worker that served this page, noted when the app loads. The browser checks
// sw.js on every navigation by itself, and when that check installs the new build
// before the server has told us its version, the takeover is over before anyone
// listens for it. A controller other than this one means the new shell is only a
// reload away. A page served without a worker came from the network, so a worker
// claiming it later is no takeover.
const servedBy = currentController()

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
  window.location.reload()
}

async function handOver(reg: ServiceWorkerRegistration, version: string): Promise<void> {
  // Listening before asking for the update, so a quick takeover is not missed.
  // Giving up disarms the listener: the reload belongs to this launch, and one
  // arriving later in the session would hit the user in the middle of an edit.
  let armed = true
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!armed) return
    markApplied(version)
    reloadOnce(version)
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
    if (currentController() === servedBy) markApplied(version)
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
  // Without a worker the page came from the network and runs the new bundle
  // already, so the reload only confirms it. A controller other than the one
  // that served the page means the browser finished the handover by itself,
  // and the reload is what shows the new build.
  if (!reg || (servedBy && currentController() !== servedBy)) {
    markApplied(version)
    reloadOnce(version)
    return
  }
  await handOver(reg, version)
}
