#!/usr/bin/env node
/**
 * Country silhouettes for TREK Studio, built from the boundaries the server
 * already bundles for Atlas.
 *
 *   node scripts/build-country-shapes.mjs
 *
 * Writes `src/components/Studio/countryShapes.ts`. Run it when
 * `server/assets/atlas/admin0.geojson.gz` changes; the output is committed, so
 * a normal build never runs this.
 *
 * ── Why a second, tiny copy of the boundaries ─────────────────────────────
 *
 * Atlas's admin-0 file is 4.3MB gzipped and ~30MB parsed, sized for a slippy
 * map you can zoom into. A book page draws a country at 20mm across, where the
 * ten thousand points describing a fjord land inside one printer dot. Shipping
 * the map data to draw a stamp would cost more than the entire Studio bundle.
 *
 * So: project, drop the islands nobody can see at that size, simplify hard, and
 * normalise each country into its own 0..100 box. What comes out is a few
 * hundred bytes per country and prints identically, because at 20mm it *is*
 * identical.
 *
 * ── The three things that are easy to get wrong ───────────────────────────
 *
 * 1. **Project before simplifying.** Simplifying in degrees and projecting
 *    afterwards removes the wrong points: a degree of longitude is 111km at the
 *    equator and 30km at Reykjavík, so a fixed tolerance eats Iceland's coast
 *    while leaving Kenya's untouched.
 * 2. **Countries that cross the antimeridian.** Russia and Fiji have parts at
 *    +179 and -179. Taken literally their bounding box is the whole world and
 *    the silhouette is a horizontal smear. Rings that span more than half the
 *    globe get their negative longitudes lifted by 360 so the country is
 *    contiguous again.
 * 3. **Islands.** Keeping every ring turns Norway into a dust cloud and Greece
 *    into static. Rings below a fraction of the largest one are dropped — the
 *    mainland is what makes a country recognisable at a glance.
 */

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import zlib from 'node:zlib'

const HERE = path.dirname(url.fileURLToPath(import.meta.url))
const SRC = path.join(HERE, '..', '..', 'server', 'assets', 'atlas', 'admin0.geojson.gz')
const OUT = path.join(HERE, '..', 'src', 'components', 'Studio', 'countryShapes.ts')

/** Rings smaller than this share of the biggest one are not drawn. */
const ISLAND_CUTOFF = 0.012
/** Never draw more than this many rings for one country. */
const MAX_RINGS = 14
/** Point budget per country, across every ring it keeps. */
const MAX_POINTS = 190

/** Web Mercator, unscaled. y is flipped so it grows downwards like SVG's. */
function project([lng, lat]) {
  const clamped = Math.max(-85.05, Math.min(85.05, lat))
  const rad = (clamped * Math.PI) / 180
  return [lng, -(Math.log(Math.tan(Math.PI / 4 + rad / 2)) * 180) / Math.PI]
}

function ringArea(ring) {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return Math.abs(a / 2)
}

/** Perpendicular distance from p to the segment ab, squared. */
function segDistSq(p, a, b) {
  let x = a[0], y = a[1]
  let dx = b[0] - x, dy = b[1] - y
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
    if (t > 1) { x = b[0]; y = b[1] } else if (t > 0) { x += dx * t; y += dy * t }
  }
  dx = p[0] - x
  dy = p[1] - y
  return dx * dx + dy * dy
}

/** Douglas-Peucker, iterative so a long coastline cannot blow the stack. */
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const tolSq = tolerance * tolerance
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]

  while (stack.length) {
    const [first, last] = stack.pop()
    let maxSq = 0
    let index = 0
    for (let i = first + 1; i < last; i++) {
      const d = segDistSq(points[i], points[first], points[last])
      if (d > maxSq) { maxSq = d; index = i }
    }
    if (maxSq > tolSq) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

/** Every outer ring of a Polygon or MultiPolygon, holes discarded. */
function outerRings(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return geometry.coordinates.slice(0, 1)
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map(poly => poly[0])
  return []
}

/**
 * Lift a ring that straddles the antimeridian into a continuous longitude
 * range. A ring whose points span more than half the globe is, in practice,
 * always a wrap rather than a genuinely hemisphere-wide landmass.
 */
function unwrap(ring) {
  let min = Infinity
  let max = -Infinity
  for (const [lng] of ring) { if (lng < min) min = lng; if (lng > max) max = lng }
  if (max - min <= 180) return ring
  return ring.map(([lng, lat]) => [lng < 0 ? lng + 360 : lng, lat])
}

function build(feature) {
  const rings = outerRings(feature.geometry)
    .map(unwrap)
    .map(ring => ring.map(project))
    .map(ring => ({ ring, area: ringArea(ring) }))
    .sort((a, b) => b.area - a.area)

  if (!rings.length) return null

  const biggest = rings[0].area
  const kept = rings
    .filter(r => r.area >= biggest * ISLAND_CUTOFF)
    .slice(0, MAX_RINGS)
    .map(r => r.ring)

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const ring of kept) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const spanX = maxX - minX
  const spanY = maxY - minY
  if (!(spanX > 0) || !(spanY > 0)) return null

  // The longer side becomes 100 and the shorter one keeps its proportion, so a
  // country never has to be squashed to fit the box it is drawn in.
  const scale = 100 / Math.max(spanX, spanY)
  const w = spanX * scale
  const h = spanY * scale
  const normalised = kept.map(ring =>
    ring.map(([x, y]) => [(x - minX) * scale, (y - minY) * scale]))

  // Tolerance climbs until the whole country fits its point budget. Starting
  // from the diagonal keeps the loop short for a country of any size.
  let tolerance = 0.14
  let simplified = normalised.map(r => simplify(r, tolerance))
  let guard = 0
  while (simplified.reduce((n, r) => n + r.length, 0) > MAX_POINTS && guard++ < 40) {
    tolerance *= 1.35
    simplified = normalised.map(r => simplify(r, tolerance))
  }

  const d = simplified
    .filter(ring => ring.length >= 3)
    .map(ring => `M${ring.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`)
    .join('')

  // The projected bounds, kept so the same path can be replayed in world
  // coordinates. A country drawn on its own wants its own box; the same country
  // on a route map has to sit where it actually is, next to its neighbours. One
  // normalised path plus these four numbers serves both, where storing two sets
  // of coordinates would be twice the bytes and one more thing to disagree.
  return d ? { d, w: round(w), h: round(h), b: [minX, minY, maxX, maxY].map(v => Math.round(v * 100) / 100) } : null
}

const round = n => Math.round(n * 10) / 10

const raw = zlib.gunzipSync(fs.readFileSync(SRC))
const collection = JSON.parse(raw.toString('utf8'))

const shapes = new Map()
for (const feature of collection.features) {
  const code = String(feature.properties?.ISO_A2 || '').toUpperCase()
  if (code.length !== 2 || code === '-9') continue
  const built = build(feature)
  if (!built) continue
  // A code appearing twice means two features for one country; keep the one
  // with more outline, which is the mainland rather than a dependency.
  const prev = shapes.get(code)
  if (!prev || built.d.length > prev.d.length) shapes.set(code, built)
}

const codes = [...shapes.keys()].sort()
const body = codes
  .map(code => {
    const s = shapes.get(code)
    return `  ${code}: { d: '${s.d}', w: ${s.w}, h: ${s.h}, b: [${s.b.join(', ')}] },`
  })
  .join('\n')

const file = `/**
 * GENERATED — do not edit. Run \`node scripts/build-country-shapes.mjs\`.
 *
 * Country silhouettes, simplified from the admin-0 boundaries the server
 * bundles for Atlas (geoBoundaries, CC BY 4.0). Each path is Web Mercator,
 * normalised so the longer side is 100 units; \`w\` and \`h\` give the shape's
 * own proportions inside that box so it can be drawn without being squashed.
 *
 * ${codes.length} countries, built for print at postage-stamp size — islands
 * below ${ISLAND_CUTOFF * 100}% of the mainland are dropped and each outline is
 * simplified to at most ${MAX_POINTS} points.
 */

export interface CountryShape {
  /** Path on a 0..100 box, outer rings only. */
  d: string
  /** The shape's own width and height inside that box. */
  w: number
  h: number
  /** Projected bounds \`[minX, minY, maxX, maxY]\`, for drawing it in place. */
  b: [number, number, number, number]
}

/**
 * Web Mercator, matching the projection the paths were built with. Longitude
 * passes through as degrees; latitude is flipped so y grows downwards like
 * SVG's does.
 */
export function projectMercator(lng: number, lat: number): { x: number; y: number } {
  const clamped = Math.max(-85.05, Math.min(85.05, lat))
  const rad = (clamped * Math.PI) / 180
  return { x: lng, y: -(Math.log(Math.tan(Math.PI / 4 + rad / 2)) * 180) / Math.PI }
}

/**
 * The same outline, placed in projected world coordinates.
 *
 * The stored path is normalised into its own box; multiplying by the box's span
 * and shifting by its origin puts it back where the country actually is, which
 * is what a map with more than one country on it needs.
 */
export function countryWorldPath(shape: CountryShape): string {
  const span = Math.max(shape.b[2] - shape.b[0], shape.b[3] - shape.b[1]) / 100
  let axis = 0
  return shape.d.replace(/-?\\d*\\.?\\d+/g, m => {
    const isX = axis++ % 2 === 0
    const v = Number(m) * span + (isX ? shape.b[0] : shape.b[1])
    return String(Math.round(v * 1000) / 1000)
  })
}

export const COUNTRY_SHAPES: Record<string, CountryShape> = {
${body}
}

/** The silhouette for an ISO-3166-1 alpha-2 code, or null if we have none. */
export function countryShape(code: string | null | undefined): CountryShape | null {
  if (!code) return null
  return COUNTRY_SHAPES[code.toUpperCase()] ?? null
}
`

fs.writeFileSync(OUT, file, 'utf8')
const kb = Math.round(Buffer.byteLength(file) / 102.4) / 10
console.log(`[country-shapes] ${codes.length} countries, ${kb} kB → ${path.relative(process.cwd(), OUT)}`)
