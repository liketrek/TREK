import { buildRouteOverlay, wrapSvg } from './tripMapSvg'
import { hasWebGL } from '../../utils/webgl'
import { normalizeStyleForProvider } from '../Map/glProviders'
import type { TripOverviewDay } from '../Map/tripRouteGeometry'

/**
 * The trip's route over a real basemap, for the PDF (#1736).
 *
 * The bundled country outlines this falls back to are built for a journey across a
 * region; at the two-kilometre scale of a city trip the only outline in view is the
 * country itself, which fills the frame and says nothing. A real basemap is the only
 * thing that carries context at that size.
 *
 * Rendered offscreen through MapLibre rather than fetched as a picture: it is the
 * renderer the app already ships, it reads the instance's own style, and OpenFreeMap —
 * the default — needs no token and no account. The result is a PNG baked into the
 * document, which matters because the preview iframe runs with no `allow-scripts` and
 * printing starts on the click: nothing may still be loading by then.
 *
 * Everything here is best-effort. No WebGL, a style that will not load, a slow tile
 * server — each returns null and leaves the caller on the vector fallback.
 */

/** Beyond this the export stops waiting and prints the outline map instead. */
const RENDER_TIMEOUT_MS = 6000

export interface TripMapImageOptions {
  width: number
  height: number
  /** The instance's MapLibre style, as the planner resolves it. */
  style?: string | null
  formatDistance: (km: number) => string
}

const EARTH_CIRCUMFERENCE_M = 40075016.686

export async function renderTripMapImage(
  days: TripOverviewDay[],
  opts: TripMapImageOptions,
): Promise<string | null> {
  const { width, height } = opts
  const drawn = days.filter(d => d.lines.some(line => line.length > 1))
  const points = drawn.flatMap(d => d.lines.flat())
  if (points.length < 2 || !hasWebGL()) return null

  let container: HTMLDivElement | null = null
  let map: { remove: () => void } | null = null
  try {
    const gl = (await import('../Map/engines/maplibre')).default

    container = document.createElement('div')
    // Off-screen rather than hidden: MapLibre needs a laid-out box with real
    // dimensions, and `display:none` gives it a zero-sized canvas.
    container.style.cssText =
      `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;pointer-events:none;`
    document.body.appendChild(container)

    const bounds = new gl.LngLatBounds()
    for (const [lat, lng] of points) bounds.extend([lng, lat])

    const instance = new gl.Map({
      container,
      style: normalizeStyleForProvider('maplibre-gl', opts.style),
      bounds,
      fitBoundsOptions: { padding: 42, animate: false },
      interactive: false,
      attributionControl: false,
      // Without this the canvas is cleared before anything can read it back.
      // MapLibre 5 moved the WebGL flags off the top level into this bag.
      canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
      fadeDuration: 0,
    })
    map = instance

    const ready = await new Promise<boolean>(resolve => {
      const timer = setTimeout(() => resolve(false), RENDER_TIMEOUT_MS)
      const done = (ok: boolean) => { clearTimeout(timer); resolve(ok) }
      // `idle` rather than `load`: load fires with tiles still arriving, and a
      // half-drawn basemap is worse than none.
      instance.once('idle', () => done(true))
      instance.once('error', () => done(false))
    })
    if (!ready) return null

    // Projected by the map itself, so the lines land exactly where the roads under
    // them do — a second projection of our own would drift at the edges.
    const project = (lat: number, lng: number): [number, number] => {
      const p = instance.project([lng, lat])
      return [p.x, p.y]
    }
    const metresPerPx =
      (EARTH_CIRCUMFERENCE_M * Math.cos((instance.getCenter().lat * Math.PI) / 180))
      / (512 * Math.pow(2, instance.getZoom()))

    const png = instance.getCanvas().toDataURL('image/png')
    if (!png.startsWith('data:image/png')) return null

    return wrapSvg(width, height,
      `<image href="${png}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"/>`
      + buildRouteOverlay(drawn, { project, width, height, metresPerPx, formatDistance: opts.formatDistance }))
  } catch (err) {
    console.warn('[tripPdfMap] the basemap could not be rendered; falling back to outlines', err)
    return null
  } finally {
    map?.remove()
    container?.remove()
  }
}
