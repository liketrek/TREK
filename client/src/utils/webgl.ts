/**
 * Whether this browser will hand MapLibre a WebGL context.
 *
 * The default basemap has been a vector style since 4.1.0, and maplibre-gl builds
 * its GL context inside the Map constructor: no context, no map, and the throw
 * lands in a place no error boundary was ever meant to see (#2288). Asking a
 * one-pixel probe first is cheaper and quieter than finding out from a stack
 * trace, and it keeps the maplibre chunk, about a megabyte, off the wire for a
 * browser that could never have used it.
 *
 * "Cannot" is a bigger group than broken hardware: hardware acceleration turned
 * off in Chrome or Firefox, webgl.disabled in about:config, a driver on the
 * browser's blocklist, a VM or remote desktop with no GL at all, and privacy
 * builds that switch it off against fingerprinting.
 */

/**
 * Probed once per page load, then remembered.
 *
 * A repeat probe costs a live WebGL context each time, and every browser caps how
 * many it keeps: Chrome evicts the oldest at around sixteen. On a planner with a
 * map and a settings preview open, a chatty probe is a map going blank.
 */
let probed: boolean | null = null

export function hasWebGL(): boolean {
  if (probed === null) probed = probe()
  return probed
}

/** Test seam. Nothing in the app clears this: the answer cannot change mid-session. */
export function resetWebGLProbe(): void {
  probed = null
}

function probe(): boolean {
  // jsdom and anything SSR-ish have no canvas implementation, and "no WebGL" is
  // the honest answer for them rather than a special case.
  if (typeof document === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    // One pixel. The probe never draws, and a full backing store would allocate
    // megabytes for an answer that is one bit wide.
    canvas.width = 1
    canvas.height = 1

    // Exactly the order maplibre-gl asks in (Map._setupPainter): webgl2 first,
    // webgl1 second. A stricter probe would black out maps that would in fact
    // have drawn; a looser one would let the throw through anyway.
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) {
      console.warn('[basemap] this browser refuses a WebGL context, vector basemaps are unavailable')
      return false
    }

    // Hand the context back now instead of waiting for the canvas to be
    // collected. Contexts are a capped resource and the GC is under no obligation
    // to hurry, so a probe that keeps one is a context the map behind it may not
    // get.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    // A few locked-down builds throw out of getContext rather than returning
    // null, and an answer is never worth an exception.
    return false
  }
}
