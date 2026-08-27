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

import { withTileApiKey } from '../../utils/tileUrl'

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

/**
 * How many tiles a printed map may use.
 *
 * Sixteen across rather than eight, and the number is chosen by arithmetic
 * rather than by taste. Each zoom level quarters the ground a tile covers, so
 * the grid quadruples: a page-sized map lands at 7x9 tiles, and the step that
 * would make it sharp enough to print needs 13x17 — 221. A budget of 144 stops
 * one level short of a printable page, every time, which is the worst place to
 * stop.
 *
 * What it costs is requests, once, cached by the browser between the editor
 * and the print run. What it buys is the element most likely to fill a whole
 * page, at a resolution a print shop will take.
 */
const MAX_TILES = 16 * 16

/**
 * What a thumbnail is worth fetching.
 *
 * The same map is drawn in three places at three sizes: the page, the sheet the
 * press gets, and a 130px tile in the pages rail or the travel panel. Cutting
 * the small ones to print resolution would mean a couple of hundred requests
 * for a picture the size of a postage stamp, every time the panel opens — and
 * against NASA or OpenStreetMap that is not merely wasteful, it is the bulk
 * fetching their policies ask people not to do.
 *
 * `big` already travels down the render tree for exactly this kind of decision;
 * the photo views use it to pick a thumbnail over a full-size image.
 */
const PREVIEW_TILES = 4 * 4
const PREVIEW_TILE_MM = 90

/**
 * What a tile is worth drawing at, in millimetres.
 *
 * ── The bug this constant exists to fix ──────────────────────────────────
 *
 * The zoom used to be chosen so the route spanned the frame and nothing else,
 * which by construction put about two tiles across the picture whatever its
 * physical size. A route across Iceland on a 210mm page came back as 256x512
 * pixels stretched over the sheet: seventeen dots per inch, on paper that
 * holds three hundred. It looked exactly like what it was — a screenshot of a
 * web map, enlarged.
 *
 * A tile is 256 pixels, or 512 when the source offers `{r}`. Holding one to
 * about 22mm therefore asks for roughly 300dpi, which is what a print shop
 * wants and the point past which more tiles buy nothing a reader can see.
 */
const TILE_MM_AT_PRINT = 22

/** Shard letters for templates that still carry `{s}`. */
const TILE_SHARDS = ['a', 'b', 'c']

/**
 * How far in a source can actually be asked to go.
 *
 * Matched on the host, the same way the attribution is: a template carries no
 * capabilities of its own, and asking a source for a zoom it does not have
 * answers with an error image rather than with a picture. NASA's imagery stops
 * at 8, which is about 600 metres to the pixel — plenty for a country and not
 * enough for a city, which is the honest limit of that source.
 */
export function maxZoomFor(template: string): number {
  const url = template.toLowerCase()
  if (url.includes('gibs.earthdata.nasa.gov')) return 8
  // Sentinel-2 is a ten-metre sensor; past 16 the tiles are enlargements of
  // pixels rather than more picture.
  if (url.includes('tiles.maps.eox.at')) return 16
  if (url.includes('arcgisonline')) return 17
  return 19
}

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
  /**
   * How much this drawing is worth. `preview` is a thumbnail: a handful of
   * tiles, deliberately soft, because nobody prints the pages rail.
   */
  quality: 'print' | 'preview' = 'print',
  /**
   * The instance's CARTO key, for a book still on a CARTO template.
   *
   * Applied here rather than stored: keyless CARTO tiles carry a watermark
   * since 26.08.2026 (#2054), and a key frozen into the document would be
   * printed into every export and would outlive the key itself.
   */
  cartoKey?: string,
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

  layOut()

  /*
   * Up, then down.
   *
   * Up first: while a tile is being drawn larger than it is worth, and the
   * source has a level left, and the extra level still fits inside the grid
   * budget, take it. Each level halves the millimetres a tile covers, so this
   * converges in a handful of steps.
   *
   * Then the old back-off, unchanged, because a fixed zoom or a very long
   * route can still ask for more tiles than are worth fetching.
   */
  const budget = quality === 'preview' ? PREVIEW_TILES : MAX_TILES
  const targetTileMm = quality === 'preview' ? PREVIEW_TILE_MM : TILE_MM_AT_PRINT

  const ceiling = fixedZoom ?? maxZoomFor(template)
  while (zoom < ceiling && size > targetTileMm) {
    const before = { zoom, size, x0, x1, y0, y1 }
    zoom += 1
    layOut()
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > budget) {
      // One level too far: put it back rather than leaving the grid over budget.
      zoom = before.zoom
      size = before.size
      x0 = before.x0; x1 = before.x1; y0 = before.y0; y1 = before.y1
      scale = 2 ** zoom
      break
    }
  }

  while (zoom > 0 && (x1 - x0 + 1) * (y1 - y0 + 1) > budget) {
    zoom -= 1
    layOut()
  }

  // Drawn so the route's centre is the frame's centre.
  const originX = frame.w / 2 - (cx * scale - x0) * size
  const originY = frame.h / 2 - (cy * scale - y0) * size

  const tiles: Tile[] = []
  const source = withTileApiKey(template, cartoKey)
  const wrap = (n: number) => ((n % scale) + scale) % scale
  for (let y = y0; y <= y1; y++) {
    // Past the poles there is no tile — the row simply does not exist.
    if (y < 0 || y >= scale) continue
    for (let x = x0; x <= x1; x++) {
      tiles.push({
        x: x - x0,
        y: y - y0,
        z: zoom,
        url: source
          .replace('{z}', String(zoom))
          // Longitude wraps, so a route across the antimeridian keeps its tiles.
          .replace('{x}', String(wrap(x)))
          .replace('{y}', String(y))
          /*
           * `{r}` is the retina placeholder, and a template only carries it
           * when its source really serves 512px tiles. It used to be replaced
           * with nothing, which threw that away and asked for a quarter of the
           * pixels for the same number of requests.
           */
          .replace('{r}', '@2x')
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
 * How sharp this grid will actually print, in dots per inch.
 *
 * Worth showing rather than hiding. Every raster source has a level past which
 * no more detail exists — NASA's relief stops at about 600 metres to the pixel
 * — and when a map is asked for a smaller area than its source can resolve,
 * the picture does not fail, it just goes soft. On screen that is invisible.
 * On a printed page it is the difference between a map and a smudge, and by
 * then the book is bound.
 *
 * A print shop wants 300. Anything from about 150 is passable on matte stock.
 * Below that, the honest answer is a different source or a wider view.
 */
export function printDpi(view: TileView, template: string): number {
  const px = template.includes('{r}') ? 512 : 256
  return Math.round(px / (view.size / 25.4))
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
  if (url.includes('gibs.earthdata.nasa.gov')) return 'NASA EOSDIS GIBS'
  // The wording CC BY 4.0 asks for: who made it, and what it is made of.
  if (url.includes('tiles.maps.eox.at')) return 'Sentinel-2 cloudless © EOX (CC BY 4.0)'
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
