import { BOOK_FRAME_SHAPES, BOOK_SHAPE_GROUPS, type BookShapeId } from '@trek/shared'
import { K, circle, polygon, r2, roundRect, scallop, star } from './shapePrimitives'
import { MORE_SHAPE_PATHS } from './shapes-more'

/**
 * Every shape Studio can draw, as a path on a 0..100 square.
 *
 * ── Why paths and not clip-paths ──────────────────────────────────────────
 *
 * The first four shapes drew as `<div>`s: a rectangle is a box, an ellipse is a
 * box with a radius, a triangle was a `clip-path`. That works for four shapes
 * and stops working at five — a clipped div cannot take a stroke (the clip cuts
 * the border in half, lengthwise), and a heart is not a box with a radius.
 *
 * So everything past the rectangle and the ellipse is an SVG path. Those two
 * keep their old rendering, because a box genuinely is better as a box: exact
 * corner radii, an even border, and no regression on documents that already
 * exist.
 *
 * ── Why 0..100 and not a viewBox ──────────────────────────────────────────
 *
 * The obvious way to fit a path to a frame is `viewBox="0 0 100 100"` with
 * `preserveAspectRatio="none"`, and it is wrong for a book. That scales the
 * coordinate system, and the stroke scales with it — a 0.5mm outline on a frame
 * twice as wide as it is tall comes out 0.7mm on the sides and 0.35mm top and
 * bottom. On screen you might not notice. Printed at 300dpi next to a straight
 * rule, you do.
 *
 * Instead the *points* are scaled and the coordinate system is left in
 * millimetres, so a stroke width means one thing everywhere. That is what
 * `scalePath` does, and it is the reason every path here is written in a
 * deliberately boring subset: absolute `M`, `L`, `C`, `Q`, `Z`, every number an
 * x or a y in strict alternation. No arcs — `A` carries radii and a rotation
 * flag that do not survive a non-uniform scale — and no relative commands.
 *
 * Curves are cubics because a cubic through a quarter circle is exact to within
 * 0.03%, which is far below what a printer resolves.
 */

/**
 * The shape table.
 *
 * `rect` and `ellipse` are here for the panel previews and for masking; the
 * page renderer still draws those two as boxes. Everything else is drawn from
 * exactly this path, in the editor and in the print.
 */
export const SHAPE_PATHS: Record<BookShapeId, string> = {
  // ── Basics ──────────────────────────────────────────────────────────────
  rect: 'M0 0L100 0L100 100L0 100Z',
  ellipse: circle(),
  line: 'M0 50L100 50Z',
  triangle: 'M50 0L100 100L0 100Z',
  'triangle-down': 'M0 0L100 0L50 100Z',
  diamond: 'M50 0L100 50L50 100L0 50Z',
  parallelogram: 'M22 0L100 0L78 100L0 100Z',
  trapezoid: 'M22 0L78 0L100 100L0 100Z',
  pentagon: polygon(5),
  hexagon: polygon(6),
  'hexagon-flat': polygon(6, 0),
  heptagon: polygon(7),
  octagon: polygon(8, -112.5),
  capsule: roundRect(50),
  squircle: roundRect(26),

  /** A doorway: square-footed, semicircular head. Reads as a portal or a niche. */
  arch: `M0 100L0 50C0 ${r2(50 - 50 * K)} ${r2(50 - 50 * K)} 0 50 0`
    + `C${r2(50 + 50 * K)} 0 100 ${r2(50 - 50 * K)} 100 50L100 100Z`,
  'half-circle': `M0 100C0 ${r2(100 - 100 * K)} ${r2(50 - 50 * K)} 0 50 0`
    + `C${r2(50 + 50 * K)} 0 100 ${r2(100 - 100 * K)} 100 100Z`,
  'quarter-circle': `M0 100L0 0C${r2(100 * K)} 0 100 ${r2(100 - 100 * K)} 100 100Z`,

  // ── Stars ───────────────────────────────────────────────────────────────
  'star-4': star(4, 0.3),
  'star-5': star(5, 0.382),
  'star-6': star(6, 0.5),
  'star-8': star(8, 0.58),
  'star-12': star(12, 0.72),
  burst: star(16, 0.78),
  seal: scallop(12, 0.055),
  /**
   * The four-pointed twinkle. Concave sides, not straight ones — the straight
   * version is a diamond with dents, and only the inward curve reads as light.
   */
  sparkle: 'M50 0Q56 44 100 50Q56 56 50 100Q44 56 0 50Q44 44 50 0Z',

  // ── Arrows ──────────────────────────────────────────────────────────────
  'arrow-right': 'M0 30L58 30L58 5L100 50L58 95L58 70L0 70Z',
  'arrow-left': 'M100 30L42 30L42 5L0 50L42 95L42 70L100 70Z',
  'arrow-up': 'M30 100L30 42L5 42L50 0L95 42L70 42L70 100Z',
  'arrow-down': 'M30 0L30 58L5 58L50 100L95 58L70 58L70 0Z',
  'arrow-both': 'M0 50L28 8L28 32L72 32L72 8L100 50L72 92L72 68L28 68L28 92Z',
  'chevron-right': 'M8 0L58 0L100 50L58 100L8 100L50 50Z',
  'chevron-left': 'M92 0L42 0L0 50L42 100L92 100L50 50Z',
  /** An arrow that turns a corner — a route that changes direction. */
  'arrow-bent': 'M0 62L0 90L62 90L62 100L100 76L62 52L62 62Z',

  // ── Speech ──────────────────────────────────────────────────────────────
  /*
   * A body and a tail, and the tail is wound the *same way round* as the body.
   *
   * Under the default non-zero fill rule two subpaths that overlap cancel where
   * they meet if their windings oppose — which drew the tail as a wedge of hole
   * punched through the bubble, joined to nothing. Nothing about the shape is
   * wrong; the direction the points are listed in is.
   */
  'bubble-round': `${roundRect(22, 0, 0, 100, 74)}M26 74L46 74L26 100Z`,
  'bubble-square': 'M0 0L100 0L100 74L46 74L26 100L26 74L0 74Z',
  'bubble-oval': `${circle(50, 37, 50, 37)}M28 66L48 71L22 96Z`,
  'bubble-think': `${circle(52, 34, 48, 34)}${circle(24, 80, 12, 12)}${circle(8, 95, 6, 5)}`,

  // ── Decoration ──────────────────────────────────────────────────────────
  /**
   * A heart with a real point at the bottom rather than a rounded chin. The two
   * lobes are cubics that meet at the top notch; the tangents at the base are
   * steep, which is what stops it reading as a spade.
   */
  heart: 'M50 100C50 100 0 66 0 30C0 10 16 0 30 0C40 0 46 6 50 14'
    + 'C54 6 60 0 70 0C84 0 100 10 100 30C100 66 50 100 50 100Z',
  cloud: 'M18 90C6 90 0 80 0 70C0 60 8 52 18 52C18 34 32 22 48 22'
    + 'C62 22 74 30 78 44C90 44 100 54 100 66C100 80 90 90 78 90Z',
  'cloud-puffy': 'M14 88C4 88 0 78 4 70C-2 60 6 48 18 50C20 34 34 24 48 28'
    + 'C56 14 78 14 84 30C96 28 104 40 98 52C106 62 100 82 86 88Z',
  drop: 'M50 0C50 0 88 42 88 66C88 86 71 100 50 100C29 100 12 86 12 66C12 42 50 0 50 0Z',
  /** A crescent: one circle with a second bitten out of it, as a single path. */
  moon: `M62 0C28 0 0 22 0 50C0 78 28 100 62 100C72 100 82 98 90 94`
    + `C64 90 44 72 44 50C44 28 64 10 90 6C82 2 72 0 62 0Z`,
  /**
   * A disc with rays. One star with a generous valley radius rather than a
   * circle plus spikes: two overlapping subpaths would need a fill rule to
   * decide whether the middle is a disc or a hole, and this needs no rule.
   */
  sun: star(12, 0.68),
  'flower-5': scallop(5, 0.28),
  'flower-6': scallop(6, 0.24),
  leaf: 'M50 0C82 18 100 44 100 66C100 86 78 100 50 100C22 100 0 86 0 66C0 44 18 18 50 0Z',
  cross: 'M36 0L64 0L64 36L100 36L100 64L64 64L64 100L36 100L36 64L0 64L0 36L36 36Z',
  plus: 'M42 0L58 0L58 42L100 42L100 58L58 58L58 100L42 100L42 58L0 58L0 42L42 42Z',
  shield: 'M50 0L100 16L100 52C100 78 78 94 50 100C22 94 0 78 0 52L0 16Z',
  /**
   * A cog. Twelve teeth cut by a scalloped outer edge with a hole through the
   * middle — the hole is a second subpath wound the same way, which `fill-rule:
   * evenodd` turns into a hole.
   */
  gear: `${star(12, 0.76)}${circle(50, 50, 20, 20)}`,
  /** A torn ticket: notched at both ends, the way a stub is perforated. */
  ticket: 'M0 8L100 8L100 34C93 34 88 41 88 50C88 59 93 66 100 66L100 92L0 92L0 66'
    + 'C7 66 12 59 12 50C12 41 7 34 0 34Z',
  wave: 'M0 30Q25 0 50 30Q75 60 100 30L100 70Q75 100 50 70Q25 40 0 70Z',
  mountain: 'M0 100L34 34L52 62L66 44L100 100Z',
  /** A compass rose — four long points, four short, as one star of eight. */
  compass: star(8, 0.24),
  /** A map pin: round head, drawn tail. */
  pin: 'M50 100C50 100 88 56 88 36C88 16 71 0 50 0C29 0 12 16 12 36C12 56 50 100 50 100Z',

  // ── Organic ─────────────────────────────────────────────────────────────
  //
  // Hand-drawn blobs, four of them, each asymmetric on purpose: a symmetric
  // blob reads as a badly drawn circle. They are the shape a modern travel page
  // uses behind a caption or as a photo frame that is not a rectangle.
  'blob-1': 'M52 2C74 0 96 14 99 36C102 58 88 78 68 90C48 102 22 98 10 82'
    + 'C-2 66 0 42 8 26C16 10 30 4 52 2Z',
  'blob-2': 'M38 0C66 -2 92 16 98 40C104 64 88 88 62 96C36 104 10 92 3 70'
    + 'C-4 48 4 24 18 12C26 5 30 1 38 0Z',
  'blob-3': 'M50 0C78 0 100 20 100 48C100 76 80 100 52 100C24 100 0 82 0 54'
    + 'C0 26 22 0 50 0Z',
  'blob-4': 'M30 4C56 -6 88 6 96 30C104 54 92 82 68 94C44 106 16 96 6 74'
    + 'C-4 52 4 14 30 4Z',

  // ── Banners ─────────────────────────────────────────────────────────────
  'banner-ribbon': 'M0 20L100 20L100 80L0 80L14 50Z',
  'banner-pennant': 'M0 0L100 0L100 62L50 100L0 62Z',
  'banner-bookmark': 'M0 0L100 0L100 100L50 68L0 100Z',
  'banner-flag': 'M0 0L100 0L86 30L100 60L0 60Z',

  // The second shelf (shapes-more.ts): arches, cut-outs, stamps, ribbons,
  // drawn arrows, hearts, frames and ornaments.
  ...MORE_SHAPE_PATHS,
}

/**
 * The box a path's ink actually occupies.
 *
 * Not the extent of its numbers: a curve never reaches its control points, so
 * measuring those would report a heart as wider than it is drawn. Cubic and
 * quadratic extrema are solved rather than sampled — it is barely more code
 * than stepping along the curve and it is exact, which matters when the answer
 * is used to normalise every shape in the library.
 */
function pathBounds(path: string): { x: number; y: number; w: number; h: number } {
  const nums = (path.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const cmds = path.match(/[MLCQZ]/g) ?? []
  let i = 0
  let cx = 0
  let cy = 0
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const hit = (x: number, y: number) => {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  /** Where a cubic turns on one axis: the roots of its derivative in 0..1. */
  const cubicExtrema = (p0: number, p1: number, p2: number, p3: number): number[] => {
    const a = -p0 + 3 * p1 - 3 * p2 + p3
    const b = 2 * (p0 - 2 * p1 + p2)
    const c = p1 - p0
    if (Math.abs(a) < 1e-9) return Math.abs(b) < 1e-9 ? [] : [-c / b]
    const disc = b * b - 4 * a * c
    if (disc < 0) return []
    const root = Math.sqrt(disc)
    return [(-b + root) / (2 * a), (-b - root) / (2 * a)]
  }
  const cubicAt = (t: number, p0: number, p1: number, p2: number, p3: number) => {
    const u = 1 - t
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
  }

  for (const cmd of cmds) {
    if (cmd === 'Z') continue
    if (cmd === 'M' || cmd === 'L') {
      cx = nums[i++]; cy = nums[i++]
      hit(cx, cy)
      continue
    }
    // A quadratic is a cubic whose controls sit two thirds of the way out.
    let x1: number, y1: number, x2: number, y2: number, x: number, y: number
    if (cmd === 'Q') {
      const qx = nums[i++], qy = nums[i++]
      x = nums[i++]; y = nums[i++]
      x1 = cx + (2 / 3) * (qx - cx); y1 = cy + (2 / 3) * (qy - cy)
      x2 = x + (2 / 3) * (qx - x); y2 = y + (2 / 3) * (qy - y)
    } else {
      x1 = nums[i++]; y1 = nums[i++]
      x2 = nums[i++]; y2 = nums[i++]
      x = nums[i++]; y = nums[i++]
    }
    hit(x, y)
    for (const t of cubicExtrema(cx, x1, x2, x)) {
      if (t > 0 && t < 1) hit(cubicAt(t, cx, x1, x2, x), cubicAt(t, cy, y1, y2, y))
    }
    for (const t of cubicExtrema(cy, y1, y2, y)) {
      if (t > 0 && t < 1) hit(cubicAt(t, cx, x1, x2, x), cubicAt(t, cy, y1, y2, y))
    }
    cx = x; cy = y
  }

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/**
 * Normalise a path so its ink fills the 0..100 box exactly.
 *
 * Applied to every shape in the table, which turns "the paths are normalised"
 * from a rule someone has to remember while hand-drawing a cloud into something
 * true by construction.
 *
 * It has to be true, because the editor draws the selection outline, the resize
 * handles and every snap target from the element's *frame*. A shape that
 * occupies 84% of its frame cannot be aligned against anything you can see: you
 * snap the box to a margin and the drawing sits somewhere inside it. Filling the
 * box costs a little regularity — a hexagon in a square frame is very slightly
 * wide — and buys an editor where what you snap is what you get.
 */
function normalise(path: string): string {
  const b = pathBounds(path)
  // A rule has no height and a shape with no extent has nothing to fit.
  const sx = b.w > 1e-9 ? 100 / b.w : 1
  const sy = b.h > 1e-9 ? 100 / b.h : 1
  const ox = b.w > 1e-9 ? b.x : 0
  const oy = b.h > 1e-9 ? b.y : 0
  let axis = 0
  return path.replace(/-?\d*\.?\d+/g, m => {
    const isX = axis++ % 2 === 0
    const v = isX ? (Number(m) - ox) * sx : (Number(m) - oy) * sy
    return String(Math.round(v * 100) / 100)
  })
}

for (const key of Object.keys(SHAPE_PATHS) as BookShapeId[]) {
  SHAPE_PATHS[key] = normalise(SHAPE_PATHS[key])
}

/**
 * Fit a 0..100 path to a box of `w` × `h`, in the box's own units.
 *
 * Scaling the numbers instead of the coordinate system is the whole point — see
 * the note at the top of this file. Every path in the table is written so that
 * numbers alternate x, y from the start of each command, which makes this a
 * scan rather than a parse.
 */
export function scalePath(path: string, w: number, h: number): string {
  const sx = w / 100
  const sy = h / 100
  let axis = 0
  return path.replace(/-?\d*\.?\d+/g, m => {
    const v = Number(m) * (axis++ % 2 === 0 ? sx : sy)
    return String(Math.round(v * 1000) / 1000)
  })
}

/**
 * The same path on the 0..1 square SVG clip paths use.
 *
 * `clipPathUnits="objectBoundingBox"` is what lets one clip follow a frame as it
 * is resized without re-rendering the path, which is what a photo frame has to
 * do. It *does* stretch the shape with the box — a heart on a wide frame is a
 * wide heart — and that is correct here: a frame you cannot make wide is an
 * ornament, not a frame.
 */
export function unitPath(path: string): string {
  return path.replace(/-?\d*\.?\d+/g, m =>
    String(Math.round((Number(m) / 100) * 100000) / 100000))
}

/**
 * Shapes drawn as two subpaths where the inner one is meant to be a hole.
 *
 * Only these get `fill-rule: evenodd`. Everywhere else the default matters:
 * `bubble-think`'s trailing dots and `bubble-round`'s tail are separate
 * subpaths too, and under `evenodd` any overlap between them and the body
 * would knock a hole in it.
 */
export const HOLED_SHAPES = new Set<BookShapeId>(['gear', 'postmark', 'label-tab'])

/**
 * How the panel is divided and which shapes it offers as picture frames: the
 * one list in @trek/shared (book-shape-catalogue.ts), which the assistant's
 * asset listing reads too.
 */
export const SHAPE_GROUPS = BOOK_SHAPE_GROUPS
export const FRAME_SHAPES = BOOK_FRAME_SHAPES

/** A shape's name in the reader's language, for its tooltip and a screen reader. */
export function shapeName(shape: BookShapeId, t: (k: string) => string): string {
  return t(`journey.studio.shapeName.${shape}`)
}
