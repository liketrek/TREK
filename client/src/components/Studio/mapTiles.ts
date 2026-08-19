/**
 * Real map imagery for the book's map element.
 *
 * ── Why this is opt-in rather than the default ────────────────────────────
 *
 * The vector map draws country outlines from boundaries the server already
 * bundles: nothing is fetched, nothing is licensed, and it prints sharp at any
 * size because it is geometry. That is the right default for a book.
 *
 * But an outline of Iceland cannot show which road you took, and some books
 * want that. So this exists — with the two costs stated rather than hidden:
 * tiles are fetched when the page renders, and they are raster, cut for one
 * zoom level. Printed much larger than they were fetched, they go soft.
 *
 * ── Attribution ──────────────────────────────────────────────────────────
 *
 * Not optional and not a setting. OpenStreetMap's licence requires credit, and
 * a photo book is a published work — arguably more so than a web page, since
 * nobody can add a footnote to it after it is bound. Every tiled map element
 * carries the line, and it is written into the document when the element is
 * placed so the renderer cannot lose it.
 */

/** A slippy-map tile, in the standard XYZ scheme. */
export interface Tile {
  x: number
  y: number
  z: number
  url: string
}

/** Web Mercator, normalised to 0..1 — the space tile indices are cut from. */
export function toMercatorUnit(lng: number, lat: number): { x: number; y: number } {
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat))
  const rad = (clamped * Math.PI) / 180
  return {
    x: (lng + 180) / 360,
    y: (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2,
  }
}

export interface TileView {
  tiles: Tile[]
  /** Where the tile grid sits, in the element's millimetres. */
  originX: number
  originY: number
  /** One tile's drawn size, in millimetres. */
  size: number
  zoom: number
  /**
   * The grid's top-left tile index.
   *
   * Exposed because the route has to be projected onto *this* grid: the vector
   * map fits itself to country outlines, and a line placed by that fit would
   * sit somewhere other than on the road it followed.
   */
  tileX0: number
  tileY0: number
}

/** Where a coordinate lands inside a tile view, in the element's millimetres. */
export function projectOntoTiles(view: TileView, lng: number, lat: number): { x: number; y: number } {
  const u = toMercatorUnit(lng, lat)
  const scale = 2 ** view.zoom
  return {
    x: view.originX + (u.x * scale - view.tileX0) * view.size,
    y: view.originY + (u.y * scale - view.tileY0) * view.size,
  }
}

/** How many tiles across a printed map may use, before it is not worth it. */
const MAX_TILES = 8 * 8

/**
 * Which tiles cover a set of points, and where to draw them.
 *
 * The zoom is chosen so the route fills the frame rather than so the tiles are
 * a particular size: a map of one city and a map of a continent both want to
 * be the size of the box they are in, and only the zoom differs.
 */
export function tileView(
  points: { lat: number; lng: number }[],
  frame: { w: number; h: number },
  template: string,
  fixedZoom: number | null,
): TileView | null {
  if (!template || !points.length) return null

  const unit = points.map(p => toMercatorUnit(p.lng, p.lat))
  let minX = Math.min(...unit.map(u => u.x))
  let maxX = Math.max(...unit.map(u => u.x))
  let minY = Math.min(...unit.map(u => u.y))
  let maxY = Math.max(...unit.map(u => u.y))

  // A single stop has no extent, and a route along one line has none on one
  // axis. Both need a window rather than a point.
  const PAD = 0.012
  if (maxX - minX < PAD) { const c = (minX + maxX) / 2; minX = c - PAD / 2; maxX = c + PAD / 2 }
  if (maxY - minY < PAD) { const c = (minY + maxY) / 2; minY = c - PAD / 2; maxY = c + PAD / 2 }

  const spanX = (maxX - minX) * 1.12
  const spanY = (maxY - minY) * 1.12
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  /*
   * The zoom at which the route spans the frame.
   *
   * At zoom z the world is 2^z tiles across, so the span in tiles is
   * `span * 2^z`; solving for the zoom where that equals the frame measured in
   * tiles gives the fit. Floor rather than round, so the route is inside the
   * frame rather than just outside it.
   */
  const fitZoom = () => {
    const wanted = Math.min(
      Math.log2(1 / Math.max(spanX, 1e-9)),
      Math.log2(1 / Math.max(spanY, 1e-9)),
    ) + 1
    return Math.max(0, Math.min(19, Math.floor(wanted)))
  }

  let zoom = fixedZoom ?? fitZoom()

  // Back off until the grid is a size worth printing. A 12x12 grid is 144
  // requests for a picture 60mm across.
  let scale = 2 ** zoom
  let x0 = Math.floor(minX * scale)
  let x1 = Math.floor(maxX * scale)
  let y0 = Math.floor(minY * scale)
  let y1 = Math.floor(maxY * scale)
  while (zoom > 0 && (x1 - x0 + 1) * (y1 - y0 + 1) > MAX_TILES) {
    zoom -= 1
    scale = 2 ** zoom
    x0 = Math.floor(minX * scale)
    x1 = Math.floor(maxX * scale)
    y0 = Math.floor(minY * scale)
    y1 = Math.floor(maxY * scale)
  }

  // Drawn so the route's centre is the frame's centre.
  const size = Math.max(frame.w / ((x1 - x0 + 1) || 1), frame.h / ((y1 - y0 + 1) || 1))
  const originX = frame.w / 2 - (cx * scale - x0) * size
  const originY = frame.h / 2 - (cy * scale - y0) * size

  const tiles: Tile[] = []
  const wrap = (n: number) => ((n % scale) + scale) % scale
  for (let y = y0; y <= y1; y++) {
    // Past the poles there is no tile — the row simply does not exist.
    if (y < 0 || y >= scale) continue
    for (let x = x0; x <= x1; x++) {
      tiles.push({
        x: x - x0,
        y: y - y0,
        z: zoom,
        url: template
          .replace('{z}', String(zoom))
          // Longitude wraps, so a route across the antimeridian keeps its tiles.
          .replace('{x}', String(wrap(x)))
          .replace('{y}', String(y))
          .replace('{r}', ''),
      })
    }
  }

  return { tiles, originX, originY, size, zoom, tileX0: x0, tileY0: y0 }
}

/**
 * The credit a tile source requires.
 *
 * Matched on the host rather than configured, so an instance pointing at its
 * own OSM mirror still credits OpenStreetMap — and anything unrecognised gets
 * no invented attribution, since a wrong credit is worse than none.
 */
export function attributionFor(template: string): string {
  const url = template.toLowerCase()
  if (url.includes('openstreetmap')) return '© OpenStreetMap contributors'
  if (url.includes('mapbox')) return '© Mapbox © OpenStreetMap'
  if (url.includes('maptiler')) return '© MapTiler © OpenStreetMap'
  if (url.includes('stadiamaps')) return '© Stadia Maps © OpenStreetMap'
  if (url.includes('carto')) return '© CARTO © OpenStreetMap'
  if (url.includes('esri') || url.includes('arcgisonline')) return '© Esri'
  return ''
}

/**
 * A whole map as one image, from Mapbox's static API.
 *
 * The alternative to a tile grid for the styles that only exist as GL styles:
 * one request, one picture, and the route can be drawn into it as an overlay.
 * Needs the token the instance is already configured with.
 */
export function staticMapUrl(opts: {
  points: { lat: number; lng: number }[]
  style: string
  token: string
  /** Pixels. The API caps each side at 1280. */
  width: number
  height: number
}): string | null {
  if (!opts.token || !opts.points.length) return null

  // mapbox://styles/mapbox/standard -> mapbox/standard
  const style = opts.style.replace(/^mapbox:\/\/styles\//, '') || 'mapbox/streets-v12'

  const lats = opts.points.map(p => p.lat)
  const lngs = opts.points.map(p => p.lng)
  const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]

  const w = Math.max(64, Math.min(1280, Math.round(opts.width)))
  const h = Math.max(64, Math.min(1280, Math.round(opts.height)))

  // @2x because this is going into print: a 1x static image at book size is
  // roughly 96dpi, which is visibly soft on paper.
  return `https://api.mapbox.com/styles/v1/${style}/static/`
    + `[${bbox.map(n => n.toFixed(5)).join(',')}]/${w}x${h}@2x`
    + `?padding=24&access_token=${encodeURIComponent(opts.token)}`
}
