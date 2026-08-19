import { describe, it, expect } from 'vitest'
import { BOOK_SHAPES } from '@trek/shared'
import {
  FRAME_SHAPES, HOLED_SHAPES, SHAPE_GROUPS, SHAPE_PATHS, scalePath, unitPath,
} from '../../../src/components/Studio/shapes'

/**
 * The shape library (#1973).
 *
 * The invariant worth guarding is the boring one: `scalePath` scales numbers by
 * position, alternating x and y from the start of the path. That only works if
 * every path is written in the absolute M/L/C/Q/Z subset with an even count of
 * numbers per command. Break that in one hand-drawn path and *that shape alone*
 * comes out sheared — which is exactly the kind of bug nobody notices until it
 * is printed.
 */

/** Commands and their coordinate counts. Anything else is out of the subset. */
const COMMANDS: Record<string, number> = { M: 2, L: 2, C: 6, Q: 4, Z: 0 }

/**
 * Where the outline actually goes.
 *
 * Measuring the raw numbers would measure the control points, which for a curve
 * sit outside the shape by design — a quadratic never reaches its control, and a
 * cubic's two controls are usually well past the ink. Sampling the curves gives
 * the box the shape really occupies, which is the thing "normalised to 0..100"
 * is a claim about.
 */
function drawnBounds(path: string): { minX: number; minY: number; maxX: number; maxY: number } {
  const nums = (path.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const tokens = path.match(/[MLCQZ]/g) ?? []

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

  for (const cmd of tokens) {
    if (cmd === 'Z') continue
    if (cmd === 'M' || cmd === 'L') {
      cx = nums[i++]; cy = nums[i++]
      hit(cx, cy)
      continue
    }
    if (cmd === 'Q') {
      const [qx, qy, x, y] = [nums[i++], nums[i++], nums[i++], nums[i++]]
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const u = 1 - t
        hit(u * u * cx + 2 * u * t * qx + t * t * x, u * u * cy + 2 * u * t * qy + t * t * y)
      }
      cx = x; cy = y
      continue
    }
    // C
    const [c1x, c1y, c2x, c2y, x, y] = [nums[i++], nums[i++], nums[i++], nums[i++], nums[i++], nums[i++]]
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const u = 1 - t
      hit(
        u * u * u * cx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
        u * u * u * cy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
      )
    }
    cx = x; cy = y
  }
  return { minX, minY, maxX, maxY }
}

/** Split a path into its subpaths, one per `M`. */
function subpaths(path: string): string[] {
  return path.split('M').filter(Boolean).map(p => `M${p}`)
}

/**
 * Twice the signed area of a subpath, sampling curves so a bubble's rounded
 * body is measured as the ring it draws rather than as its corner points.
 * Only the sign matters here — it is the winding direction.
 */
function signedArea(path: string): number {
  const { points } = flatten(path)
  let a = 0
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += points[j][0] * points[i][1] - points[i][0] * points[j][1]
  }
  return a / 2
}

/** The subpath as a polyline, curves sampled. */
function flatten(path: string): { points: [number, number][] } {
  const nums = (path.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const cmds = path.match(/[MLCQZ]/g) ?? []
  const points: [number, number][] = []
  let i = 0
  let cx = 0
  let cy = 0
  for (const cmd of cmds) {
    if (cmd === 'Z') continue
    if (cmd === 'M' || cmd === 'L') {
      cx = nums[i++]; cy = nums[i++]
      points.push([cx, cy])
      continue
    }
    if (cmd === 'Q') {
      const [qx, qy, x, y] = [nums[i++], nums[i++], nums[i++], nums[i++]]
      for (let t = 0.25; t <= 1.0001; t += 0.25) {
        const u = 1 - t
        points.push([u * u * cx + 2 * u * t * qx + t * t * x, u * u * cy + 2 * u * t * qy + t * t * y])
      }
      cx = x; cy = y
      continue
    }
    const [ax, ay, bx, by, x, y] = [nums[i++], nums[i++], nums[i++], nums[i++], nums[i++], nums[i++]]
    for (let t = 0.25; t <= 1.0001; t += 0.25) {
      const u = 1 - t
      points.push([
        u * u * u * cx + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * x,
        u * u * u * cy + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * y,
      ])
    }
    cx = x; cy = y
  }
  return { points }
}

function commandsOf(path: string): { cmd: string; nums: number }[] {
  const out: { cmd: string; nums: number }[] = []
  const re = /([MLCQZ])([^MLCQZ]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(path))) {
    const nums = (m[2].match(/-?\d*\.?\d+/g) ?? []).length
    out.push({ cmd: m[1], nums })
  }
  return out
}

describe('SHAPE_PATHS', () => {
  it('has a path for every shape the document schema allows', () => {
    for (const shape of BOOK_SHAPES) {
      expect(SHAPE_PATHS[shape], shape).toBeTruthy()
    }
  })

  it('uses only absolute M, L, C, Q and Z', () => {
    for (const shape of BOOK_SHAPES) {
      const path = SHAPE_PATHS[shape]
      expect(path, shape).not.toMatch(/[mlcqzahsvtHSVTA]/)
      expect(path, shape).toMatch(/^M/)
    }
  })

  it('gives every command the number of coordinates it takes', () => {
    for (const shape of BOOK_SHAPES) {
      for (const { cmd, nums } of commandsOf(SHAPE_PATHS[shape])) {
        expect(nums, `${shape}: ${cmd}`).toBe(COMMANDS[cmd])
      }
    }
  })

  /*
   * The one that makes scalePath valid: numbers alternate x, y across the whole
   * path, so an odd total anywhere would swap the axes for everything after it.
   */
  it('holds an even number of coordinates, so x/y alternation survives the whole path', () => {
    for (const shape of BOOK_SHAPES) {
      const total = (SHAPE_PATHS[shape].match(/-?\d*\.?\d+/g) ?? []).length
      expect(total % 2, shape).toBe(0)
    }
  })

  it('closes every subpath', () => {
    for (const shape of BOOK_SHAPES) {
      const opens = (SHAPE_PATHS[shape].match(/M/g) ?? []).length
      const closes = (SHAPE_PATHS[shape].match(/Z/g) ?? []).length
      expect(closes, shape).toBe(opens)
    }
  })

  /*
   * The invariant the editor depends on: selection outlines, resize handles and
   * snap targets are all drawn from the element's frame, so a shape that does
   * not fill its frame cannot be aligned to anything visible. `normalise()` in
   * shapes.ts makes this true by construction; this checks it stayed true.
   *
   * Every offender is collected rather than failing on the first — a change to
   * the geometry usually breaks a whole family of shapes at once, and one name
   * at a time is a slow way to find that out.
   */
  it('fills its 0..100 box exactly, on both axes', () => {
    const off: string[] = []
    for (const shape of BOOK_SHAPES) {
      const { minX, minY, maxX, maxY } = drawnBounds(SHAPE_PATHS[shape])
      const flat = shape === 'line' // a rule genuinely has no height
      const wrong = Math.abs(minX) > 0.3 || Math.abs(maxX - 100) > 0.3
        || (!flat && (Math.abs(minY) > 0.3 || Math.abs(maxY - 100) > 0.3))
      if (wrong) {
        off.push(`${shape}: x ${minX.toFixed(1)}..${maxX.toFixed(1)}  y ${minY.toFixed(1)}..${maxY.toFixed(1)}`)
      }
    }
    expect(off).toEqual([])
  })
})

describe('scalePath', () => {
  it('leaves a path alone at 100 by 100', () => {
    expect(scalePath('M0 0L100 0L100 100Z', 100, 100)).toBe('M0 0L100 0L100 100Z')
  })

  it('scales x and y independently', () => {
    expect(scalePath('M0 0L100 50Z', 50, 20)).toBe('M0 0L50 10Z')
  })

  it('keeps alternating across commands with different arities', () => {
    // C takes six numbers: three x/y pairs. The pair after it must still start
    // on x.
    expect(scalePath('M0 0C10 20 30 40 50 60L100 100Z', 10, 100))
      .toBe('M0 0C1 20 3 40 5 60L10 100Z')
  })

  it('carries negative coordinates through with their sign', () => {
    expect(scalePath('M-10 -20L100 100Z', 50, 50)).toBe('M-5 -10L50 50Z')
  })

  it('rounds to three decimals rather than emitting float noise', () => {
    const out = scalePath('M33 33Z', 7, 7)
    expect(out).toBe('M2.31 2.31Z')
    expect(out).not.toMatch(/\d{5}/)
  })

  it('produces a drawable path for every shape at an extreme aspect ratio', () => {
    for (const shape of BOOK_SHAPES) {
      const wide = scalePath(SHAPE_PATHS[shape], 300, 4)
      expect(wide, shape).not.toMatch(/NaN|Infinity|undefined/)
      const nums = (wide.match(/-?\d*\.?\d+/g) ?? []).map(Number)
      expect(nums.every(Number.isFinite), shape).toBe(true)
    }
  })
})

describe('unitPath', () => {
  it('maps the 0..100 box onto 0..1 for an objectBoundingBox clip', () => {
    expect(unitPath('M0 0L100 50Z')).toBe('M0 0L1 0.5Z')
  })

  it('scales both axes by the same factor, unlike scalePath', () => {
    expect(unitPath('M25 75Z')).toBe('M0.25 0.75Z')
  })

  it('keeps every shape within the unit box, allowing for the blobs slack', () => {
    for (const shape of BOOK_SHAPES) {
      const { minX, minY, maxX, maxY } = drawnBounds(unitPath(SHAPE_PATHS[shape]))
      expect(Math.min(minX, minY), shape).toBeGreaterThanOrEqual(-0.06)
      expect(Math.max(maxX, maxY), shape).toBeLessThanOrEqual(1.06)
    }
  })
})

describe('the panel groupings', () => {
  it('offers every shape in exactly one group', () => {
    const grouped = SHAPE_GROUPS.flatMap(g => g.shapes)
    expect(new Set(grouped).size).toBe(grouped.length)
  })

  it('groups every shape the schema allows, so none is unreachable in the UI', () => {
    const grouped = new Set(SHAPE_GROUPS.flatMap(g => g.shapes))
    // 'line' is offered as its own tile in the Lines section rather than as a
    // shape you pick from a grid, since a hairline is invisible at tile size.
    const missing = BOOK_SHAPES.filter(s => s !== 'line' && !grouped.has(s))
    expect(missing).toEqual([])
  })

  it('only offers frames that actually exist as shapes', () => {
    for (const shape of FRAME_SHAPES) {
      expect(SHAPE_PATHS[shape], shape).toBeTruthy()
    }
  })

  it('keeps thin and hollow shapes out of the frame list, since a photo cut to one is unreadable', () => {
    for (const thin of ['line', 'gear', 'bubble-think', 'sparkle', 'cross', 'plus'] as const) {
      expect(FRAME_SHAPES, thin).not.toContain(thin)
    }
  })

  /*
   * The bug this catches: a speech bubble's tail was listed anticlockwise while
   * its body ran clockwise, and under the default non-zero fill rule the two
   * cancelled where they met — the tail came out as a wedge of hole punched
   * through the bubble. Nothing about the geometry was wrong; only the order
   * the points were written in.
   *
   * So every subpath of a shape has to wind the same way as the first, except
   * where a hole is the point.
   */
  it('winds every subpath the same way, so overlapping parts join rather than cancel', () => {
    const wrong: string[] = []
    for (const shape of BOOK_SHAPES) {
      if (HOLED_SHAPES.has(shape)) continue
      const windings = subpaths(SHAPE_PATHS[shape]).map(signedArea)
      if (windings.length < 2) continue
      const first = Math.sign(windings[0])
      if (windings.some(a => Math.sign(a) !== first)) {
        wrong.push(`${shape}: ${windings.map(a => a.toFixed(0)).join(', ')}`)
      }
    }
    expect(wrong).toEqual([])
  })

  it('marks only the shapes drawn as an outer ring plus an inner hole', () => {
    for (const shape of HOLED_SHAPES) {
      const subpaths = (SHAPE_PATHS[shape].match(/M/g) ?? []).length
      expect(subpaths, shape).toBeGreaterThan(1)
    }
  })
})
