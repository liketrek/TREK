// FE-NOFEAR-SCN-001 to FE-NOFEAR-SCN-028
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import { NoFearScene, type SceneState } from './noFearScene'

const GEO_URL = '/api/addons/atlas/countries/geo'

interface DrawImageRecord { image: unknown; args: number[]; globalAlpha: number; composite: string }
interface FillRectRecord { args: number[]; fillStyle: string; globalAlpha: number; composite: string }
interface StrokeRecord { strokeStyle: string; lineWidth: number; globalAlpha: number }
interface ArcFillRecord { x: number; y: number; r: number; fillStyle: string; globalAlpha: number; composite: string }

interface FakeCtx {
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  globalAlpha: number
  globalCompositeOperation: string
  clearRect: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
  restore: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  closePath: ReturnType<typeof vi.fn>
  moveTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  drawImage: ReturnType<typeof vi.fn>
  fillRect: ReturnType<typeof vi.fn>
  createRadialGradient: ReturnType<typeof vi.fn>
  getImageData: ReturnType<typeof vi.fn>
  images: DrawImageRecord[]
  rects: FillRectRecord[]
  strokes: StrokeRecord[]
  arcFills: ArcFillRecord[]
  rasters: number[][]
  points: number[][]
}

// jsdom ships no canvas backend: every context is a recorder, getImageData
// replays `alphaAt`, and Path2D is a call log so the baked border geometry
// stays observable.
let alphaAt: (x: number, y: number, w: number) => number = () => 0
let contextAvailable = true
let contexts: FakeCtx[] = []
let path2dCount = 0
let pathMoveTo = 0
let pathLineTo = 0
let pathClose = 0
let rafCount = 0
let onFrame: ((n: number) => void) | null = null

const originalGetContext = HTMLCanvasElement.prototype.getContext

function makeCtx(): FakeCtx {
  let lastArc: { x: number; y: number; r: number } | null = null
  const ctx: FakeCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn((x: number, y: number) => { ctx.points.push([x, y]) }),
    lineTo: vi.fn((x: number, y: number) => { ctx.points.push([x, y]) }),
    arc: vi.fn((x: number, y: number, r: number) => { lastArc = { x, y, r } }),
    fill: vi.fn(() => {
      if (!lastArc) return
      ctx.arcFills.push({
        x: lastArc.x, y: lastArc.y, r: lastArc.r,
        fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha, composite: ctx.globalCompositeOperation,
      })
    }),
    stroke: vi.fn(() => {
      ctx.strokes.push({ strokeStyle: ctx.strokeStyle, lineWidth: ctx.lineWidth, globalAlpha: ctx.globalAlpha })
    }),
    drawImage: vi.fn((image: unknown, ...args: number[]) => {
      ctx.images.push({ image, args, globalAlpha: ctx.globalAlpha, composite: ctx.globalCompositeOperation })
    }),
    fillRect: vi.fn((...args: number[]) => {
      ctx.rects.push({ args, fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha, composite: ctx.globalCompositeOperation })
    }),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => {
      ctx.rasters.push([w, h])
      const data = new Uint8ClampedArray(w * h * 4)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = alphaAt(x, y, w)
      }
      return { data }
    }),
    images: [],
    rects: [],
    strokes: [],
    arcFills: [],
    rasters: [],
    points: [],
  }
  return ctx
}

class FakePath2D {
  moveTo(): void { pathMoveTo++ }
  lineTo(): void { pathLineTo++ }
  closePath(): void { pathClose++ }
  constructor() { path2dCount++ }
}

/** mulberry32 — a fixed seed keeps arcs, dots and sparks identical across runs. */
function seedRandom(seed: number): void {
  let a = seed >>> 0
  vi.spyOn(Math, 'random').mockImplementation(() => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  })
}

const asCtx = (c: FakeCtx) => c as unknown as CanvasRenderingContext2D

const state = (over: Partial<SceneState> = {}): SceneState => ({
  land: 0, cityLife: 0, cityDeath: 0, borderHeat: 0, borderBurst: 0,
  web: 0, warmth: 0, personalGlow: 0, particles: 0, opacity: 1, ...over,
})

type Ring = [number, number][]
const ringA: Ring = [[-10, 50], [10, 50], [10, 40], [-10, 40], [-10, 50]]
const ringB: Ring = [[100, -20], [120, -20], [120, -30], [100, -30], [100, -20]]
const sliver: Ring = [[0, 0], [1, 1]]

const GEO = {
  features: [
    { geometry: { type: 'Polygon', coordinates: [ringA] } },
    { geometry: { type: 'MultiPolygon', coordinates: [[ringB], [sliver]] } },
    {},
    { geometry: { type: 'Point', coordinates: [0, 0] } },
  ],
}

function serveGeo(body: unknown): void {
  server.use(http.get(GEO_URL, () => HttpResponse.json(body)))
}

/** The land-dot raster is the only 168-wide getImageData in this module. */
const isDotRaster = (r: number[]) => r[0] === 168 && r[1] === 84
const dotRasters = () => contexts.flatMap(c => c.rasters).filter(isDotRaster)

/** The web layer is the only offscreen context stroked in the arc's amber. */
const webContext = () => contexts.find(c => c.strokes.some(s => s.strokeStyle.startsWith('rgba(255, 176, 90')))

async function loadedScene(width = 800, height = 600): Promise<NoFearScene> {
  serveGeo(GEO)
  const scene = new NoFearScene()
  await scene.load(width, height)
  return scene
}

beforeEach(() => {
  alphaAt = (x, y, w) => (w === 168 && x < 6 && y < 2 ? 255 : 0)
  contextAvailable = true
  contexts = []
  path2dCount = 0
  pathMoveTo = 0
  pathLineTo = 0
  pathClose = 0
  rafCount = 0
  onFrame = null
  seedRandom(12345)

  HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    if (!contextAvailable) return null
    const c = makeCtx()
    contexts.push(c)
    return c
  }) as unknown as HTMLCanvasElement['getContext']

  vi.stubGlobal('Path2D', FakePath2D)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCount += 1
    onFrame?.(rafCount)
    cb(0)
    return rafCount
  })
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('NoFearScene.load', () => {
  it('FE-NOFEAR-SCN-001: bakes border, dot and web layers from the Atlas bundle', async () => {
    const scene = await loadedScene()

    expect(dotRasters()).toHaveLength(1)
    expect(path2dCount).toBe(1)
    // two surviving rings of five points each
    expect(pathMoveTo).toBe(2)
    expect(pathLineTo).toBe(8)
    expect(pathClose).toBe(2)

    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ land: 1, borderHeat: 1 }), 0)
    expect(ctx.images.length).toBeGreaterThan(0)
  })

  it('FE-NOFEAR-SCN-002: decimates rings against the global vertex budget', async () => {
    const dense: Ring = Array.from({ length: 14001 }, (_, i) => [i % 360 - 180, (i % 120) - 50])
    serveGeo({ features: [{ geometry: { type: 'Polygon', coordinates: [dense] } }] })

    await new NoFearScene().load(800, 600)

    // 14001 vertices → step 2 → 7001 kept, one moveTo + 7000 lineTo
    expect(pathMoveTo).toBe(1)
    expect(pathLineTo).toBe(7000)
  })

  it('FE-NOFEAR-SCN-003: drops rings too short to survive decimation', async () => {
    serveGeo({ features: [{ geometry: { type: 'Polygon', coordinates: [sliver] } }] })
    const scene = new NoFearScene()
    await scene.load(800, 600)

    // border layer still baked, but with an empty path and no sparks
    expect(path2dCount).toBe(1)
    expect(pathMoveTo).toBe(0)

    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ borderBurst: 0.5 }), 0)
    expect(ctx.rects).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-004: ignores a bundle without usable geometry', async () => {
    serveGeo({ features: [{}, { geometry: { type: 'Point', coordinates: [0, 0] } }] })
    await new NoFearScene().load(800, 600)

    expect(path2dCount).toBe(0)
    expect(dotRasters()).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-005: ignores a bundle without a features array', async () => {
    serveGeo({})
    await new NoFearScene().load(800, 600)
    expect(path2dCount).toBe(0)
  })

  it('FE-NOFEAR-SCN-006: ignores a non-ok response', async () => {
    server.use(http.get(GEO_URL, () => HttpResponse.json({ error: 'off' }, { status: 404 })))
    await new NoFearScene().load(800, 600)
    expect(path2dCount).toBe(0)
    expect(dotRasters()).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-007: swallows a network failure and keeps the scene usable', async () => {
    server.use(http.get(GEO_URL, () => HttpResponse.error()))
    const scene = new NoFearScene()
    await expect(scene.load(800, 600)).resolves.toBeUndefined()
    expect(path2dCount).toBe(0)

    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ land: 1, borderHeat: 1 }), 0)
    expect(ctx.images).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-008: aborts before the geometry pass', async () => {
    const controller = new AbortController()
    // The abort has to land between the response and the first frame yield,
    // which only a hand-rolled fetch can time precisely.
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => { controller.abort(); return GEO },
    })))

    const scene = new NoFearScene()
    await scene.load(800, 600, controller.signal)

    expect(dotRasters()).toHaveLength(0)
    expect(path2dCount).toBe(0)
    // no rings were stored, so a resize cannot rebake either
    scene.layout(1000, 700)
    expect(path2dCount).toBe(0)
  })

  it('FE-NOFEAR-SCN-009: aborts after the rings are decimated', async () => {
    const controller = new AbortController()
    onFrame = n => { if (n === 1) controller.abort() }
    serveGeo(GEO)

    const scene = new NoFearScene()
    await scene.load(800, 600, controller.signal)

    expect(dotRasters()).toHaveLength(0)
    expect(path2dCount).toBe(0)
    // the decimated rings survived, so a resize bakes them
    onFrame = null
    scene.layout(1000, 700)
    expect(path2dCount).toBe(1)
  })

  it('FE-NOFEAR-SCN-010: aborts after the land dots are sampled', async () => {
    const controller = new AbortController()
    onFrame = n => { if (n === 2) controller.abort() }
    serveGeo(GEO)

    const scene = new NoFearScene()
    await scene.load(800, 600, controller.signal)

    expect(dotRasters()).toHaveLength(1)
    expect(path2dCount).toBe(0)
  })

  it('FE-NOFEAR-SCN-011: survives a browser without a 2d context', async () => {
    contextAvailable = false
    serveGeo(GEO)
    const scene = new NoFearScene()
    await expect(scene.load(800, 600)).resolves.toBeUndefined()

    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ land: 1, borderHeat: 1 }), 0)
    // no dot layers and no border layer were baked
    expect(ctx.images).toHaveLength(0)
  })
})

describe('NoFearScene.layout', () => {
  it('FE-NOFEAR-SCN-012: rebakes the layers on resize but not on a no-op layout', async () => {
    const scene = await loadedScene(800, 600)
    expect(path2dCount).toBe(1)

    scene.layout(1000, 700)
    expect(path2dCount).toBe(2)
    scene.layout(1000, 700)
    expect(path2dCount).toBe(2)
  })

  it('FE-NOFEAR-SCN-031: draws in raw lon/lat until the first layout', () => {
    const raw = makeCtx()
    new NoFearScene().draw(asCtx(raw), state({ web: 0.5 }), 0)

    expect(raw.points.length).toBeGreaterThan(0)
    expect(raw.points.every(([x, y]) => x >= -180 && x <= 180 && y >= -90 && y <= 90)).toBe(true)

    const scene = new NoFearScene()
    scene.layout(800, 600)
    const projected = makeCtx()
    scene.draw(asCtx(projected), state({ web: 0.5 }), 0)
    expect(projected.points.some(([x]) => x < -180 || x > 180)).toBe(true)
  })

  it('FE-NOFEAR-SCN-013: projects longitude and latitude into a cover-fitted equirectangular frame', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ cityLife: 1 }), 0)

    // scale = max(800/360, 600/136) ≈ 4.41; Berlin (13.4E) sits right of centre
    const scale = Math.max(800 / 360, 600 / 136)
    const ox = (800 - 360 * scale) / 2
    const oy = (600 - 136 * scale) / 2
    const berlin = ctx.images[0]
    expect(berlin.args[0]).toBeCloseTo(ox + (13.4 + 180) * scale - 8, 6)
    expect(berlin.args[1]).toBeCloseTo(oy + (78 - 52.52) * scale - 8, 6)
  })
})

describe('NoFearScene.draw', () => {
  it('FE-NOFEAR-SCN-014: clears the canvas and stops at zero opacity', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ land: 1, opacity: 0 }), 0)

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    expect(ctx.save).not.toHaveBeenCalled()
    expect(ctx.images).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-015: blits one cold dot layer per twinkle group', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ land: 1 }), 0)

    expect(ctx.images).toHaveLength(3)
    // twinkle at t=0, g=0 sits at its 0.72 floor
    expect(ctx.images[0].globalAlpha).toBeCloseTo(0.6 * 0.72, 6)
    expect(ctx.images[1].globalAlpha).toBeCloseTo(0.6 * (0.72 + 0.28 * Math.sin(2.1)), 6)
    expect(ctx.globalAlpha).toBe(1)
    expect(ctx.restore).toHaveBeenCalledTimes(1)
  })

  it('FE-NOFEAR-SCN-016: crossfades the cold dot layers into the warm ones', async () => {
    const scene = await loadedScene(800, 600)

    const cold = makeCtx()
    scene.draw(asCtx(cold), state({ land: 1, warmth: 0 }), 0)
    const warm = makeCtx()
    scene.draw(asCtx(warm), state({ land: 1, warmth: 1 }), 0)
    const both = makeCtx()
    scene.draw(asCtx(both), state({ land: 1, warmth: 0.5 }), 0)

    expect(warm.images).toHaveLength(3)
    expect(both.images).toHaveLength(6)
    const coldLayers = cold.images.map(i => i.image)
    expect(warm.images.some(i => coldLayers.includes(i.image))).toBe(false)
    expect(both.images[0].globalAlpha).toBeCloseTo(0.6 * 0.72 * 0.5, 6)
  })

  it('FE-NOFEAR-SCN-017: lights every city in the opening act', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ cityLife: 1 }), 0)

    expect(ctx.images).toHaveLength(51)
    expect(ctx.images[0].args.slice(2)).toEqual([16, 16])
    expect(ctx.images[0].composite).toBe('lighter')
    expect(ctx.images[0].globalAlpha).toBeCloseTo(0.5, 6)
    expect(ctx.globalCompositeOperation).toBe('source-over')
  })

  it('FE-NOFEAR-SCN-018: kills the city lights one by one during the fear act', async () => {
    const scene = await loadedScene(800, 600)

    const half = makeCtx()
    scene.draw(asCtx(half), state({ cityLife: 1, cityDeath: 0.5 }), 0)
    expect(half.images.length).toBeGreaterThan(0)
    expect(half.images.length).toBeLessThan(51)

    const dead = makeCtx()
    scene.draw(asCtx(dead), state({ cityLife: 1, cityDeath: 1 }), 0)
    expect(dead.images).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-019: hands the cities over to the web layer once the web grows', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ cityLife: 1, web: 0.01 }), 0)

    // no 16x16 opening sprites — the web block owns the cities from here
    expect(ctx.images.filter(i => i.args[2] === 16)).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-020: pulses the baked border layer', async () => {
    const scene = await loadedScene(800, 600)

    const hot = makeCtx()
    scene.draw(asCtx(hot), state({ borderHeat: 1 }), 0)
    expect(hot.images).toHaveLength(1)
    expect(hot.images[0].args).toEqual([0, 0])
    expect(hot.images[0].globalAlpha).toBeCloseTo(0.72, 6)

    const halfLit = makeCtx()
    scene.draw(asCtx(halfLit), state({ borderHeat: 1, borderBurst: 0.5 }), 0)
    expect(halfLit.images[0].globalAlpha).toBeCloseTo(0.5 * 0.72, 6)

    const gone = makeCtx()
    scene.draw(asCtx(gone), state({ borderHeat: 1, borderBurst: 1 }), 0)
    expect(gone.images).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-021: shatters the borders into drifting sparks', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ borderBurst: 0.5 }), 0)

    expect(ctx.rects.length).toBeGreaterThan(0)
    expect(ctx.rects.length).toBeLessThanOrEqual(10)
    for (const r of ctx.rects) {
      expect(r.args.slice(2)).toEqual([1.6, 1.6])
      expect(['rgb(255, 150, 95)', 'rgb(255, 205, 130)']).toContain(r.fillStyle)
      expect(r.composite).toBe('lighter')
    }
  })

  it('FE-NOFEAR-SCN-022: drops sparks once they have burned out', async () => {
    const scene = await loadedScene(800, 600)

    const spent = makeCtx()
    scene.draw(asCtx(spent), state({ borderBurst: 0.99 }), 0)
    expect(spent.rects).toHaveLength(0)

    const over = makeCtx()
    scene.draw(asCtx(over), state({ borderBurst: 1 }), 0)
    expect(over.rects).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-023: bakes finished arcs once and strokes only the growing ones', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ web: 0.5 }), 0)

    const web = webContext()
    expect(web).toBeDefined()
    const bakedStrokes = web!.strokes.length
    expect(bakedStrokes).toBeGreaterThan(0)
    // two passes (glow + core) per baked arc
    expect(bakedStrokes % 2).toBe(0)
    expect(web!.strokes[0].lineWidth).toBe(4.2)
    expect(web!.strokes[1].lineWidth).toBe(1.2)

    // arcs still in flight are stroked on the live context instead
    expect(ctx.strokes.length).toBeGreaterThan(0)
    expect(ctx.images.some(i => i.args.length === 2)).toBe(true)

    // a second frame at the same progress must not re-bake anything
    const again = makeCtx()
    scene.draw(asCtx(again), state({ web: 0.5 }), 0)
    expect(web!.strokes).toHaveLength(bakedStrokes)
  })

  it('FE-NOFEAR-SCN-024: strokes a full arc with a fractional tip while it grows', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ web: 0.5 }), 0)

    const growing = ctx.strokes.length / 2
    expect(growing).toBeGreaterThan(0)
    // per growing arc: one moveTo, floor(48*local) segments plus the tip
    expect(ctx.moveTo).toHaveBeenCalledTimes(growing)
    expect(ctx.lineTo.mock.calls.length).toBeGreaterThan(growing)
    expect(ctx.strokes[0].strokeStyle).toMatch(/^rgba\(255, 176, 90, /)
    expect(ctx.strokes[1].strokeStyle).toMatch(/^rgba\(255, 202, 122, /)
  })

  it('FE-NOFEAR-SCN-025: a fully grown web lives entirely in the baked layer', async () => {
    const scene = await loadedScene(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ web: 1 }), 0)

    expect(ctx.strokes).toHaveLength(0)
    // one web-layer blit plus a halo and a core per city
    expect(ctx.images).toHaveLength(1 + 51 * 2)
    expect(ctx.images[0].args).toEqual([0, 0])
    expect(ctx.images[2].args.slice(2)).toEqual([6.4, 6.4])
  })

  it('FE-NOFEAR-SCN-026: grows the web without any Atlas geometry', () => {
    const scene = new NoFearScene()
    scene.layout(800, 600)
    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ web: 0.5 }), 0)

    expect(ctx.strokes.length).toBeGreaterThan(0)
    expect(ctx.images).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-027: ignites the user places in order with an overshoot pulse', async () => {
    const scene = await loadedScene(800, 600)
    scene.setPersonalPlaces([
      { lat: 52.5, lng: 13.4 }, { lat: 48.8, lng: 2.3 },
      { lat: -33.9, lng: 151.2 }, { lat: 40.7, lng: -74 },
    ])

    const full = makeCtx()
    scene.draw(asCtx(full), state({ personalGlow: 1 }), 0)
    expect(full.images).toHaveLength(8)
    expect(full.images[1].args.slice(2)).toEqual([5.2, 5.2])
    // fully lit → no overshoot left on the halo
    expect(full.images[0].args[2]).toBeCloseTo(14, 6)

    const early = makeCtx()
    scene.draw(asCtx(early), state({ personalGlow: 0.1 }), 0)
    expect(early.images).toHaveLength(2)
    expect(early.images[0].args[2]).toBeGreaterThan(14)
  })

  it('FE-NOFEAR-SCN-028: caps the personal places at 400', async () => {
    const scene = await loadedScene(800, 600)
    scene.setPersonalPlaces(Array.from({ length: 450 }, (_, i) => ({ lat: (i % 80) - 40, lng: (i % 300) - 150 })))

    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ personalGlow: 1 }), 0)
    expect(ctx.images).toHaveLength(800)
  })

  it('FE-NOFEAR-SCN-029: skips the personal glow before the sprites are baked', () => {
    const scene = new NoFearScene()
    scene.layout(800, 600)
    scene.setPersonalPlaces([{ lat: 10, lng: 10 }])

    const ctx = makeCtx()
    scene.draw(asCtx(ctx), state({ personalGlow: 1 }), 0)
    expect(ctx.images).toHaveLength(0)
  })

  it('FE-NOFEAR-SCN-030: raises the anthem particles and wraps them around the viewport', () => {
    const scene = new NoFearScene()
    scene.layout(800, 600)

    const start = makeCtx()
    scene.draw(asCtx(start), state({ particles: 1 }), 0)
    expect(start.arcFills).toHaveLength(90)
    for (const f of start.arcFills) {
      expect(f.fillStyle).toBe('rgb(255, 210, 150)')
      expect(f.composite).toBe('lighter')
      expect(f.y).toBeGreaterThanOrEqual(0)
      expect(f.y).toBeLessThanOrEqual(1.15 * 600)
    }

    const later = makeCtx()
    scene.draw(asCtx(later), state({ particles: 1 }), 12)
    expect(later.arcFills.map(f => f.y)).not.toEqual(start.arcFills.map(f => f.y))
    expect(later.arcFills.every(f => f.y >= 0 && f.y <= 1.15 * 600)).toBe(true)
  })
})
