// FE-NOFEAR-ASM-001 to FE-NOFEAR-ASM-017
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TextAssembly } from './noFearAssembly'

interface FillRecord {
  fillStyle: string
  globalAlpha: number
  composite: string
  x: number
  y: number
  r: number
}

interface FakeCtx {
  font: string
  textAlign: string
  textBaseline: string
  fillStyle: string
  globalAlpha: number
  globalCompositeOperation: string
  save: ReturnType<typeof vi.fn>
  restore: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  fillText: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  getImageData: ReturnType<typeof vi.fn>
  fills: FillRecord[]
}

// jsdom has no canvas backend, so every 2d context in these tests is a recorder.
// getImageData replays `alphaAt` so the sampled letterform is fully deterministic.
let alphaAt: (x: number, y: number) => number = () => 0
let contextAvailable = true
let contexts: FakeCtx[] = []
const originalGetContext = HTMLCanvasElement.prototype.getContext

function makeCtx(): FakeCtx {
  let lastArc: { x: number; y: number; r: number } | null = null
  const ctx: FakeCtx = {
    font: '',
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    fillText: vi.fn(),
    arc: vi.fn((x: number, y: number, r: number) => { lastArc = { x, y, r } }),
    fill: vi.fn(() => {
      const a = lastArc ?? { x: NaN, y: NaN, r: NaN }
      ctx.fills.push({
        fillStyle: ctx.fillStyle,
        globalAlpha: ctx.globalAlpha,
        composite: ctx.globalCompositeOperation,
        x: a.x,
        y: a.y,
        r: a.r,
      })
    }),
    getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = alphaAt(x, y)
      }
      return { data }
    }),
    fills: [],
  }
  return ctx
}

/** Math.random replaced by a repeating sequence — init consumes exactly 6 per particle. */
function cycleRandom(values: number[]): void {
  let i = 0
  vi.spyOn(Math, 'random').mockImplementation(() => values[i++ % values.length])
}

const asCtx = (c: FakeCtx) => c as unknown as CanvasRenderingContext2D

beforeEach(() => {
  alphaAt = () => 0
  contextAvailable = true
  contexts = []
  HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    if (!contextAvailable) return null
    const c = makeCtx()
    contexts.push(c)
    return c
  }) as unknown as HTMLCanvasElement['getContext']
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
  vi.restoreAllMocks()
})

const BOX = { left: 100, top: 50, width: 12, height: 12 }

describe('TextAssembly.init', () => {
  it('FE-NOFEAR-ASM-001: turns every opaque raster cell into a particle aimed at its screen position', () => {
    alphaAt = (x, y) => (x === 3 && y === 6 ? 200 : 0)
    cycleRandom([0.1, 0.1, 0.1, 0.1, 0.1, 0])

    const a = new TextAssembly()
    a.init('KEINE ANGST', 'bold 64px Inter', BOX, 1000, 600)
    expect(a.isReady()).toBe(true)

    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)
    expect(main.fills).toHaveLength(1)
    expect(main.fills[0].x).toBeCloseTo(103, 6)
    expect(main.fills[0].y).toBeCloseTo(56, 6)
  })

  it('FE-NOFEAR-ASM-002: rasters the text centred in the offscreen box', () => {
    alphaAt = () => 0
    cycleRandom([0.1])

    new TextAssembly().init('KEINE ANGST', 'bold 64px Inter', BOX, 1000, 600)

    const off = contexts[0]
    expect(off.font).toBe('bold 64px Inter')
    expect(off.textAlign).toBe('center')
    expect(off.textBaseline).toBe('middle')
    expect(off.fillStyle).toBe('#fff')
    expect(off.fillText).toHaveBeenCalledWith('KEINE ANGST', 6, 6)
    expect(off.getImageData).toHaveBeenCalledWith(0, 0, 12, 12)
  })

  it('FE-NOFEAR-ASM-003: caps the raster at 700px and scales the font shorthand with it', () => {
    alphaAt = () => 0
    cycleRandom([0.1])

    new TextAssembly().init('KEINE ANGST', 'bold 200px Inter', { left: 0, top: 0, width: 1400, height: 6 }, 1000, 600)

    const off = contexts[0]
    expect(off.font).toBe('bold 100px Inter')
    expect(off.fillText).toHaveBeenCalledWith('KEINE ANGST', 350, 1.5)
    expect(off.getImageData).toHaveBeenCalledWith(0, 0, 700, 3)
  })

  it('FE-NOFEAR-ASM-004: maps raster coordinates back through the scale factor', () => {
    alphaAt = (x, y) => (x === 6 && y === 0 ? 200 : 0)
    cycleRandom([0.1, 0.1, 0.1, 0.1, 0.1, 0])

    const a = new TextAssembly()
    a.init('X', 'bold 200px Inter', { left: 0, top: 0, width: 1400, height: 6 }, 1000, 600)

    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)
    expect(main.fills).toHaveLength(1)
    // raster x 6 at scale 0.5 lands at screen x 12
    expect(main.fills[0].x).toBeCloseTo(12, 6)
    expect(main.fills[0].y).toBeCloseTo(0, 6)
  })

  it('FE-NOFEAR-ASM-005: treats alpha 128 as transparent and 129 as solid', () => {
    alphaAt = (x, y) => (y === 0 && x === 0 ? 128 : y === 0 && x === 3 ? 129 : 0)
    cycleRandom([0.1, 0.1, 0.1, 0.1, 0.1, 0])

    const a = new TextAssembly()
    a.init('X', 'bold 64px Inter', { left: 0, top: 0, width: 12, height: 12 }, 1000, 600)

    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)
    expect(main.fills).toHaveLength(1)
    expect(main.fills[0].x).toBeCloseTo(3, 6)
  })

  it('FE-NOFEAR-ASM-006: samples the raster on a 3px grid', () => {
    alphaAt = () => 255
    cycleRandom([0.1, 0.1, 0.1, 0.1, 0.1, 0])

    const a = new TextAssembly()
    a.init('X', 'bold 64px Inter', { left: 0, top: 0, width: 12, height: 12 }, 1000, 600)

    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)
    // 12x12 raster stepped by 3 → 4x4 sample points
    expect(main.fills).toHaveLength(16)
  })

  it('FE-NOFEAR-ASM-007: is ready but silent when the raster is empty', () => {
    alphaAt = () => 0
    cycleRandom([0.1])

    const a = new TextAssembly()
    a.init('X', 'bold 64px Inter', BOX, 1000, 600)
    expect(a.isReady()).toBe(true)

    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)
    expect(main.save).toHaveBeenCalledTimes(1)
    expect(main.restore).toHaveBeenCalledTimes(1)
    expect(main.fills).toHaveLength(0)
  })

  it('FE-NOFEAR-ASM-008: stays unready when no 2d context is available', () => {
    contextAvailable = false
    alphaAt = () => 255
    cycleRandom([0.1])

    const a = new TextAssembly()
    a.init('X', 'bold 64px Inter', BOX, 1000, 600)
    expect(a.isReady()).toBe(false)

    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)
    expect(main.save).not.toHaveBeenCalled()
    expect(main.fills).toHaveLength(0)
  })

  it('FE-NOFEAR-ASM-009: keeps a degenerate box at one raster pixel', () => {
    alphaAt = () => 255
    cycleRandom([0.1, 0.1, 0.1, 0.1, 0.1, 0])

    const a = new TextAssembly()
    a.init('X', 'bold 64px Inter', { left: 5, top: 7, width: 0, height: 0 }, 1000, 600)

    expect(contexts[0].getImageData).toHaveBeenCalledWith(0, 0, 1, 1)
    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)
    expect(main.fills).toHaveLength(1)
    expect(main.fills[0].x).toBeCloseTo(5, 6)
    expect(main.fills[0].y).toBeCloseTo(7, 6)
  })
})

describe('TextAssembly.draw', () => {
  function seeded(values: number[], box = BOX): TextAssembly {
    alphaAt = (x, y) => (x === 0 && y === 0 ? 200 : 0)
    cycleRandom(values)
    const a = new TextAssembly()
    a.init('X', 'bold 64px Inter', box, 1000, 600)
    return a
  }

  it('FE-NOFEAR-ASM-010: does nothing before init', () => {
    const main = makeCtx()
    new TextAssembly().draw(asCtx(main), 0.5, 0, 0)
    expect(main.save).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-ASM-011: bails out once the DOM title has fully taken over', () => {
    const a = seeded([0.1, 0.1, 0.1, 0.1, 0.1, 0])
    const main = makeCtx()
    a.draw(asCtx(main), 1, 1, 0)
    expect(main.save).not.toHaveBeenCalled()
    expect(main.fills).toHaveLength(0)
  })

  it('FE-NOFEAR-ASM-012: skips particles whose delay has not elapsed', () => {
    const a = seeded([0.1, 0.1, 0.1, 0.1, 0.1, 0]) // delay 0.045
    const main = makeCtx()
    a.draw(asCtx(main), 0.04, 0, 0)
    expect(main.save).toHaveBeenCalledTimes(1)
    expect(main.restore).toHaveBeenCalledTimes(1)
    expect(main.fills).toHaveLength(0)
  })

  it('FE-NOFEAR-ASM-013: settled particles cool to ivory, shrink and additively blend', () => {
    const a = seeded([0.1, 0.1, 0.1, 0.1, 0.1, 0]) // size 1.02
    const main = makeCtx()
    a.draw(asCtx(main), 1, 0, 0)

    expect(main.fills).toEqual([
      expect.objectContaining({ fillStyle: 'rgb(247, 240, 226)', composite: 'lighter' }),
    ])
    expect(main.fills[0].globalAlpha).toBeCloseTo(0.9, 6)
    expect(main.fills[0].r).toBeCloseTo(1.02 * 0.85, 6)
  })

  it('FE-NOFEAR-ASM-014: in-flight particles glow warm and flicker with t', () => {
    const a = seeded([0.1, 0.1, 0.1, 0.1, 0.1, 0]) // delay 0.045, size 1.02, seed 0
    const main = makeCtx()
    a.draw(asCtx(main), 0.5, 0, 0)

    const local = 1 - (1 - (0.5 - 0.045) / 0.955) ** 3
    expect(main.fills).toHaveLength(1)
    expect(main.fills[0].fillStyle).toBe('rgb(255, 205, 130)')
    expect(main.fills[0].r).toBeCloseTo(1.02, 6)
    // sin(0) → flicker sits at its 0.65 floor
    expect(main.fills[0].globalAlpha).toBeCloseTo(0.75 * 0.65, 6)
    expect(main.fills[0].x).toBeCloseTo(-30 + (100 + 30) * local, 6)
    expect(main.fills[0].y).toBeCloseTo(60 + (50 - 60) * local, 6)
  })

  it('FE-NOFEAR-ASM-015: the flicker peaks a quarter period into the sine', () => {
    const a = seeded([0.1, 0.1, 0.1, 0.1, 0.1, 0])
    const main = makeCtx()
    a.draw(asCtx(main), 0.5, 0, Math.PI / 10)
    expect(main.fills[0].globalAlpha).toBeCloseTo(0.75, 6)
  })

  it('FE-NOFEAR-ASM-016: fade dissolves the particle layer', () => {
    const a = seeded([0.1, 0.1, 0.1, 0.1, 0.1, 0])
    const main = makeCtx()
    a.draw(asCtx(main), 1, 0.5, 0)
    expect(main.fills[0].globalAlpha).toBeCloseTo(0.45, 6)
  })

  it('FE-NOFEAR-ASM-017: side entries start beyond the right edge and fly in', () => {
    // fromSide true, second draw >= 0.5 → spawn at screenW + 30
    const a = seeded([0.1, 0.9, 0.2, 0.4, 0.5, 0.3], { left: 0, top: 0, width: 12, height: 12 })
    const main = makeCtx()
    a.draw(asCtx(main), 0.18, 0, 0)
    expect(main.fills).toHaveLength(0)

    a.draw(asCtx(main), 0.59, 0, 0)
    expect(main.fills).toHaveLength(1)
    expect(main.fills[0].x).toBeCloseTo(128.75, 6)
    expect(main.fills[0].y).toBeCloseTo(15, 6)
    expect(main.fills[0].r).toBeCloseTo(1.5, 6)
    expect(main.fills[0].globalAlpha).toBeCloseTo(0.75 * (0.65 + 0.35 * Math.sin(2.1)), 6)
  })

  it('FE-NOFEAR-ASM-018: ground entries rise from below the viewport', () => {
    // fromSide false → sx inside the viewport, sy below screenH
    const a = seeded([0.5, 0.5, 0.5, 0.5, 0.5, 0.5], { left: 0, top: 0, width: 12, height: 12 })
    const main = makeCtx()
    a.draw(asCtx(main), 0.6125, 0, 0)
    expect(main.fills).toHaveLength(1)
    expect(main.fills[0].x).toBeCloseTo(62.5, 6)
    expect(main.fills[0].y).toBeCloseTo(82.5, 6)
  })
})
