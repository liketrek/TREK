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

/** Shard letters for templates that still carry `{s}`. */
const TILE_SHARDS = ['a', 'b', 'c']

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
  /**
   * The exact window to cover, when the caller has already worked one out.
   *
   * The map element fits its own view — to the stops, to the countries, with
   * whatever padding it was given — and the tiles have to be cut to *that*, not
   * to a second fit computed here from the same points by different rules. Two
   * fits meant the picture and the route were of slightly different places, and
   * on a map cut to a country's outline it meant the country was full of the
   * wrong towns.
   */
  extent?: { minLng: number; minLat: number; maxLng: number; maxLat: number },
): TileView | null {
  if (!template || (!points.length && !extent)) return null

  const corners = extent
    ? [
      { lat: extent.maxLat, lng: extent.minLng },
      { lat: extent.minLat, lng: extent.maxLng },
    ]
    : points
  const unit = corners.map(p => toMercatorUnit(p.lng, p.lat))
  let minX = Math.min(...unit.map(u => u.x))
  let maxX = Math.max(...unit.map(u => u.x))
  let minY = Math.min(...unit.map(u => u.y))
  let maxY = Math.max(...unit.map(u => u.y))

  // A single stop has no extent, and a route along one line has none on one
  // axis. Both need a window rather than a point.
  const PAD = 0.012
  if (maxX - minX < PAD) { const c = (minX + maxX) / 2; minX = c - PAD / 2; maxX = c + PAD / 2 }
  if (maxY - minY < PAD) { const c = (minY + maxY) / 2; minY = c - PAD / 2; maxY = c + PAD / 2 }

  // A given extent is already the window the caller wants; only a fit worked
  // out from bare points needs air added around it.
  const AIR = extent ? 1 : 1.12
  const spanX = (maxX - minX) * AIR
  const spanY = (maxY - minY) * AIR
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

  /*
   * ── Which tiles, and how big ──────────────────────────────────────────
   *
   * The old sum went the wrong way round: it took the tiles the route happens
   * to sit on, and then sized them to the frame. Whenever the route's own box
   * did not line up with the tile grid — which is nearly always — the grid was
   * narrower than the frame on one side and the map ran out with paper showing
   * beside it.
   *
   * So the frame decides. First how large a tile has to be drawn for the route
   * to span the frame, then which tiles are inside the frame at that size,
   * with the edges rounded outwards so the last row and column overhang rather
   * than stop short. The result covers the frame by construction.
   */
  let scale = 2 ** zoom
  let size = 0
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0

  const layOut = () => {
    scale = 2 ** zoom
    // Cover, not contain: a map with a margin of paper down one side is not a
    // map, it is a mistake. Padding belongs to the fit, not to the grid.
    size = Math.max(
      frame.w / Math.max(spanX * scale, 1e-9),
      frame.h / Math.max(spanY * scale, 1e-9),
    )
    const halfW = frame.w / 2 / size
    const halfH = frame.h / 2 / size
    x0 = Math.floor(cx * scale - halfW)
    x1 = Math.ceil(cx * scale + halfW) - 1
    y0 = Math.floor(cy * scale - halfH)
    y1 = Math.ceil(cy * scale + halfH) - 1
  }

  // Back off until the grid is a size worth printing. A 12x12 grid is 144
  // requests for a picture 60mm across.
  layOut()
  while (zoom > 0 && (x1 - x0 + 1) * (y1 - y0 + 1) > MAX_TILES) {
    zoom -= 1
    layOut()
  }

  // Drawn so the route's centre is the frame's centre.
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
          .replace('{r}', '')
          /*
           * The shard letter, chosen from the tile's own coordinates.
           *
           * Left in the template it is not a placeholder, it is a hostname that
           * does not resolve, and the map draws as a blank frame with a route
           * across it. Derived from x and y rather than picked at random so a
           * given tile always comes from the same host: the editor and the
           * print run then hit the same cache instead of fetching the picture
           * twice.
           */
          .replace('{s}', TILE_SHARDS[Math.abs(x + y) % TILE_SHARDS.length]),
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
/**
 * Styles the Static Images API cannot draw, and what to use instead.
 *
 * Mapbox's newer styles are 3D GL styles: they are assembled in the browser
 * from vector tiles, lighting and model layers, and the static renderer simply
 * refuses them — `standard` answers 400 with "Unsupported rasterarray tileset
 * format", which arrives as a picture that never loads and no explanation
 * anywhere.
 *
 * An instance configured for the planner's map is therefore usually configured
 * with a style this cannot use, through no fault of whoever set it up. Falling
 * back to the classic equivalent gives them a map that looks like the one they
 * chose, rather than an empty frame.
 */
const STATIC_STYLE: Record<string, string> = {
  'mapbox/standard': 'mapbox/streets-v12',
  'mapbox/standard-satellite': 'mapbox/satellite-streets-v12',
}

/**
 * Repair a static URL that was frozen into a document before the fallback
 * above existed.
 *
 * The URL is stored rather than rebuilt at render time, on purpose, so a map
 * placed last week keeps looking the way it did. That also means a map placed
 * with a style the static renderer refuses stays broken for good unless it is
 * fixed on the way out — and "delete it and place it again" is not a repair
 * anyone should have to be told about.
 */
export function usableStaticUrl(url: string): string {
  for (const [gl, classic] of Object.entries(STATIC_STYLE)) {
    if (url.includes(`/styles/v1/${gl}/static/`)) {
      return url.replace(`/styles/v1/${gl}/static/`, `/styles/v1/${classic}/static/`)
    }
  }
  return url
}

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
  const asked = opts.style.replace(/^mapbox:\/\/styles\//, '') || 'mapbox/streets-v12'
  const style = STATIC_STYLE[asked] ?? asked

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
