import { COUNTRY_SHAPES, countryParts, countryWorldPath, projectMercator } from '../Studio/countryShapes'
import type { TripOverviewDay } from '../Map/tripRouteGeometry'

/**
 * The trip's route as one printable map (#1736).
 *
 * Vector, and drawn from the country silhouettes the app already bundles rather than
 * from tiles. Three reasons, the same ones Studio's map element settles on in
 * `mapSources.ts`: covering a page at print resolution is exactly the bulk fetching the
 * OSM tile policy names as something not to do, Mapbox asks to be contacted before an
 * exported map is printed, and a raster cut for a screen zoom goes soft on paper. The
 * outlines are offline, unlicensed at the point of use and sharp at any size.
 *
 * It also has to be inert: the preview runs in a sandboxed iframe with no
 * `allow-scripts`, and printing starts on the click rather than waiting for anything to
 * load. An inline SVG needs neither.
 */

/** Land, sea and the ink over them. Fixed, not themed — this is a printed page. */
const SEA = '#eef3f7'
const LAND = '#ffffff'
const COAST = '#c9d3dc'
const CASING = '#ffffff'
const STOP_FILL = '#334155'
const SCALE_INK = '#64748b'

const EARTH_CIRCUMFERENCE_M = 40075016.686

/** The palette is fixed, but this goes into an attribute built by concatenation — see
 *  `hexColour` in TripPDF for the same guard on the same reasoning. */
const strokeColour = (value: string): string =>
  /^#[0-9a-f]{6}$/i.test(value) ? value : '#0a84ff'

export interface TripMapSvgOptions {
  width: number
  height: number
  /** Rendered into the scale bar, so it reads in whatever unit the reader uses. */
  formatDistance: (km: number) => string
}

/** A round number to put on a scale bar: 1, 2 or 5 at some power of ten. */
function niceDistanceKm(roughKm: number): number {
  const power = Math.pow(10, Math.floor(Math.log10(roughKm)))
  const mantissa = roughKm / power
  return (mantissa >= 5 ? 5 : mantissa >= 2 ? 2 : 1) * power
}

/**
 * Builds the map, or returns null when there is no route to draw.
 *
 * Null rather than an empty frame on purpose: a trip nobody has planned a day of yet
 * should print without a blank rectangle where a map would be.
 */
export function buildTripMapSvg(days: TripOverviewDay[], opts: TripMapSvgOptions): string | null {
  const { width, height } = opts
  const drawn = days.filter(d => d.lines.some(line => line.length > 1))
  const points = drawn.flatMap(d => d.lines.flat()).map(([lat, lng]) => projectMercator(lng, lat))
  if (points.length < 2) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  // A day spent inside one city spans almost nothing, and fitting tightly to it would
  // magnify GPS noise into a continent. A floor on the span keeps the route a route.
  const MIN_SPAN_DEG = 0.08
  const padded = (lo: number, hi: number) => {
    const span = Math.max(hi - lo, MIN_SPAN_DEG)
    const mid = (lo + hi) / 2
    const half = (span / 2) * 1.18
    return [mid - half, mid + half] as const
  }
  ;[minX, maxX] = padded(minX, maxX)
  ;[minY, maxY] = padded(minY, maxY)

  // One scale for both axes so nothing is squashed; the shorter axis gets the slack.
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY))
  const offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale
  const offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale
  const px = (lat: number, lng: number): [number, number] => {
    const p = projectMercator(lng, lat)
    return [p.x * scale + offsetX, p.y * scale + offsetY]
  }
  const round = (n: number) => Math.round(n * 10) / 10

  // The view in world coordinates, so a country can be tested against it without
  // being drawn: 198 outlines is a lot of path to put in a document that needs four.
  const viewMinX = -offsetX / scale, viewMaxX = (width - offsetX) / scale
  const viewMinY = -offsetY / scale, viewMaxY = (height - offsetY) / scale
  const land: string[] = []
  for (const shape of Object.values(COUNTRY_SHAPES)) {
    const touches = countryParts(shape).some(([a, b, c, d]) =>
      a <= viewMaxX && c >= viewMinX && b <= viewMaxY && d >= viewMinY)
    if (touches) land.push(countryWorldPath(shape))
  }

  // Metres per horizontal pixel at the middle of the view, which is where a scale bar
  // on a Mercator map is honest.
  const midLat = (Math.atan(Math.exp((-((minY + maxY) / 2) * Math.PI) / 180)) - Math.PI / 4) * 2
  const metresPerPx = (EARTH_CIRCUMFERENCE_M * Math.cos(midLat)) / 360 / scale

  return wrapSvg(width, height,
    `<rect width="${width}" height="${height}" fill="${SEA}"/>`
    + `<g transform="translate(${round(offsetX)} ${round(offsetY)}) scale(${scale})"`
    + ` fill="${LAND}" stroke="${COAST}" stroke-width="1" vector-effect="non-scaling-stroke">`
    + land.map(d => `<path d="${d}"/>`).join('')
    + `</g>`
    + buildRouteOverlay(drawn, { project: px, width, height, metresPerPx, formatDistance: opts.formatDistance }))
}

export const wrapSvg = (width: number, height: number, inner: string): string =>
  `<svg class="trip-map-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"`
  + ` xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`

export interface RouteOverlayOptions {
  /** Latitude and longitude to a pixel in the frame. Whatever drew the ground supplies it. */
  project: (lat: number, lng: number) => [number, number]
  width: number
  height: number
  /** Ground metres per horizontal pixel at the middle of the view, for the scale bar. */
  metresPerPx: number
  formatDistance: (km: number) => string
}

/**
 * The routes, their stops and the scale bar — everything drawn *over* the ground.
 *
 * Split out because the ground has two implementations (a real basemap rendered offscreen,
 * and the bundled country outlines it falls back to) and the route on top has to look
 * identical either way.
 */
export function buildRouteOverlay(days: TripOverviewDay[], opts: RouteOverlayOptions): string {
  const { project, width, height, metresPerPx } = opts
  const round = (n: number) => Math.round(n * 10) / 10
  const drawn = days.filter(d => d.lines.some(line => line.length > 1))

  const routes = drawn.flatMap(day => day.lines.filter(l => l.length > 1).map(line => {
    const pts = line.map(([lat, lng]) => project(lat, lng).map(round).join(',')).join(' ')
    // The day's own darkened casing rather than a flat white one: it is what keeps a
    // warm colour readable over water and forest, and it matches what the map draws.
    return `<polyline points="${pts}" fill="none" stroke="${strokeColour(day.color.casing)}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<polyline points="${pts}" fill="none" stroke="${strokeColour(day.color.line)}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
  }))

  // Where each run starts and ends — the stops, rather than every vertex of the road.
  const stops = drawn.flatMap(day => day.lines.filter(l => l.length > 1).flatMap(line => {
    const ends = [line[0], line[line.length - 1]]
    return ends.map(([lat, lng]) => {
      const [x, y] = project(lat, lng).map(round)
      return `<circle cx="${x}" cy="${y}" r="2.6" fill="${STOP_FILL}" stroke="${CASING}" stroke-width="1.2"/>`
    })
  }))

  const barKm = niceDistanceKm((width * 0.25 * metresPerPx) / 1000)
  const barPx = round((barKm * 1000) / metresPerPx)
  const barY = height - 16
  // A bar that would run off the frame, or be too short to read, is worse than none.
  const scaleBar = barPx > 8 && barPx < width * 0.6
    ? `<g stroke="${SCALE_INK}" stroke-width="1.2" fill="none">`
      + `<path d="M16 ${barY - 4}V${barY}H${16 + barPx}V${barY - 4}"/></g>`
      + `<text x="${16 + barPx + 6}" y="${barY + 1}" font-size="9" fill="${SCALE_INK}"`
      + ` font-family="Poppins, system-ui, sans-serif">${escapeText(opts.formatDistance(barKm))}</text>`
    : ''

  return routes.join('') + stops.join('') + scaleBar
}

/** The scale label is the only text here, and it is a number and a unit — but it comes
 *  through a formatter a caller supplies, so it is escaped like anything else. */
function escapeText(s: string): string {
  return String(s).replace(/[&<>]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}
