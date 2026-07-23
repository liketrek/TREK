// Canvas scene for the 4.0.0 "KEINE ANGST" show: a world of dots whose city
// lights die while its borders burn red — until the travel web returns, the
// user's own places ignite, and the borders shatter into drifting sparks.
//
// Perf model: nothing expensive happens per frame. The Atlas rings are
// decimated to a global vertex budget first; land dots, borders and the
// finished part of the travel web are pre-rendered into offscreen layers
// (rebuilt on resize) and blitted with drawImage. No shadowBlur anywhere in
// the frame path — every glow is baked into a layer or a sprite.
//
// The geometry comes from TREK's own Atlas bundle (/addons/atlas/countries/geo).
// If the Atlas addon is disabled the show degrades gracefully: no map, but the
// city web and typography still carry it.

type Ring = [number, number][]

export interface SceneState {
  /** 0→1: how far the land dots have faded in. */
  land: number
  /** 0→1: the calm city lights of the opening. */
  cityLife: number
  /** 0→1: how far those lights have died during the fear act. */
  cityDeath: number
  /** 0→1: how hot the borders burn (red act). */
  borderHeat: number
  /** 0→1: the borders shattering into sparks at the climax. */
  borderBurst: number
  /** 0→1: how much of the city web has grown. */
  web: number
  /** 0→1: warm ambient glow of the release act. */
  warmth: number
  /** 0→1: the user's own places igniting gold. */
  personalGlow: number
  /** 0→1: rising particles of the anthem. */
  particles: number
  /** Master opacity for the whole scene. */
  opacity: number
}

// Landmark cities on every continent — the web's anchor points.
const CITIES: [number, number][] = [
  [52.52, 13.4], [48.85, 2.35], [51.5, -0.12], [40.4, -3.7], [41.9, 12.5], [37.98, 23.7],
  [41.0, 28.98], [50.45, 30.52], [52.23, 21.01], [59.33, 18.07], [64.15, -21.9], [38.72, -9.14],
  [52.37, 4.9], [48.2, 16.37], [50.08, 14.44], [30.04, 31.24], [6.52, 3.38], [-1.29, 36.82],
  [-33.92, 18.42], [33.57, -7.59], [9.03, 38.74], [5.56, -0.2], [25.2, 55.27], [35.69, 51.39],
  [19.08, 72.88], [28.61, 77.21], [13.76, 100.5], [1.35, 103.82], [-6.21, 106.85], [21.03, 105.85],
  [35.68, 139.69], [37.57, 126.98], [39.9, 116.4], [31.23, 121.47], [25.03, 121.56], [14.6, 120.98],
  [-33.87, 151.21], [-36.85, 174.76], [61.22, -149.9], [49.28, -123.12], [37.77, -122.42],
  [19.43, -99.13], [40.71, -74.01], [43.65, -79.38], [23.11, -82.37], [4.71, -74.07],
  [-12.05, -77.04], [-23.55, -46.63], [-34.6, -58.38], [-33.45, -70.67], [-22.91, -43.17],
]

const LAT_TOP = 78
const LAT_BOT = -58
const TWINKLE_GROUPS = 3
const BORDER_VERTEX_BUDGET = 14000
const BURST_SPARKS = 2200

interface Arc { a: number; b: number; delay: number; baked: boolean }
interface Particle { x: number; y: number; v: number; drift: number; size: number; seed: number }
interface Spark { lon: number; lat: number; vx: number; vy: number; seed: number }

const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()))

export class NoFearScene {
  private rings: Ring[] = []
  private dotLonLat: { x: number; y: number; r: number; g: number }[] = []
  private arcs: Arc[] = []
  private particlesPool: Particle[] = []
  private sparks: Spark[] = []
  private personal: { lat: number; lng: number }[] = []
  private w = 0
  private h = 0

  // Prebaked layers (screen-sized). Rebuilt on resize / when geometry arrives.
  private coldLayers: HTMLCanvasElement[] = []
  private warmLayers: HTMLCanvasElement[] = []
  private borderLayer: HTMLCanvasElement | null = null
  private webLayer: HTMLCanvasElement | null = null
  private webCtx: CanvasRenderingContext2D | null = null
  private citySprite: HTMLCanvasElement | null = null
  private goldSprite: HTMLCanvasElement | null = null
  private lastWeb = 0

  private px = (lon: number): number => lon
  private py = (lat: number): number => lat

  constructor() {
    // Every city connects to a couple of far-away peers — long lines across
    // many borders are the whole point.
    const d2 = (i: number, j: number) => {
      const [la, lo] = CITIES[i]
      const [lb, lob] = CITIES[j]
      return (la - lb) ** 2 + (lo - lob) ** 2
    }
    const seen = new Set<string>()
    CITIES.forEach((_, i) => {
      const peers = CITIES.map((_, j) => j).filter(j => j !== i && d2(i, j) > 900)
      for (let k = 0; k < 2 && peers.length > 0; k++) {
        const j = peers.splice(Math.floor(Math.random() * peers.length), 1)[0]
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (seen.has(key)) continue
        seen.add(key)
        this.arcs.push({ a: i, b: j, delay: Math.random(), baked: false })
      }
    })
    this.arcs.sort((x, y) => x.delay - y.delay)
    for (let i = 0; i < 90; i++) {
      this.particlesPool.push({
        x: Math.random(), y: 1 + Math.random(), v: 0.02 + Math.random() * 0.05,
        drift: (Math.random() - 0.5) * 0.02, size: 0.7 + Math.random() * 1.7, seed: Math.random() * 7,
      })
    }
  }

  /** The user's own visited places — they ignite gold in the release act. */
  setPersonalPlaces(points: { lat: number; lng: number }[]): void {
    this.personal = points.slice(0, 400)
  }

  /** Fetches the Atlas country bundle and builds all static layers. Safe to fail. */
  async load(width: number, height: number, signal?: AbortSignal): Promise<void> {
    this.layout(width, height)
    try {
      const res = await fetch('/api/addons/atlas/countries/geo', { credentials: 'include', signal })
      if (!res.ok) return
      const geo = await res.json() as { features?: { geometry?: { type: string; coordinates: unknown } }[] }
      if (signal?.aborted) return
      await nextFrame() // let the parse frame paint before the geometry pass
      const raw: Ring[] = []
      for (const f of geo.features ?? []) {
        const g = f.geometry
        if (!g) continue
        if (g.type === 'Polygon') for (const r of g.coordinates as Ring[]) raw.push(r)
        else if (g.type === 'MultiPolygon') for (const p of g.coordinates as Ring[][]) for (const r of p) raw.push(r)
      }
      if (raw.length === 0) return
      // Decimate against a global vertex budget BEFORE any rasterizing — the
      // Atlas bundle carries ~2M points, the show needs a fraction of that.
      const total = raw.reduce((n, r) => n + r.length, 0)
      const step = Math.max(1, Math.ceil(total / BORDER_VERTEX_BUDGET))
      const rings: Ring[] = []
      for (const r of raw) {
        if (r.length < step * 4) continue // rings too small to survive decimation are visual noise
        const thin: Ring = []
        for (let i = 0; i < r.length; i += step) thin.push(r[i])
        if (thin.length >= 4) rings.push(thin)
      }
      this.rings = rings
      if (signal?.aborted) return
      await nextFrame()
      this.sampleDots(rings)
      if (signal?.aborted) return
      await nextFrame()
      this.bake()
    } catch {
      // Atlas addon off / offline / aborted — the show runs without the map.
    }
  }

  layout(width: number, height: number): void {
    const changed = width !== this.w || height !== this.h
    this.w = width
    this.h = height
    // Equirectangular, latitude clamped (no empty Antarctica band), "cover" fit.
    const scale = Math.max(width / 360, height / (LAT_TOP - LAT_BOT))
    const mapW = 360 * scale
    const mapH = (LAT_TOP - LAT_BOT) * scale
    const ox = (width - mapW) / 2
    const oy = (height - mapH) / 2
    this.px = (lon: number) => ox + (lon + 180) * scale
    this.py = (lat: number) => oy + (LAT_TOP - lat) * scale
    // Layers bake in pixel space — a resize invalidates them all.
    if (changed && this.rings.length > 0) this.bake()
  }

  private sampleDots(rings: Ring[]): void {
    const cols = 168
    const rows = 84
    const off = document.createElement('canvas')
    off.width = cols
    off.height = rows
    const c = off.getContext('2d')
    if (!c) return
    const sx = (lon: number) => ((lon + 180) / 360) * cols
    const sy = (lat: number) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * rows
    c.fillStyle = '#fff'
    c.beginPath()
    for (const ring of rings) {
      c.moveTo(sx(ring[0][0]), sy(ring[0][1]))
      for (let i = 1; i < ring.length; i++) c.lineTo(sx(ring[i][0]), sy(ring[i][1]))
      c.closePath()
    }
    c.fill('evenodd')
    const img = c.getImageData(0, 0, cols, rows).data
    this.dotLonLat = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (img[(y * cols + x) * 4 + 3] > 96) {
          this.dotLonLat.push({
            x: (x / cols) * 360 - 180,
            y: LAT_TOP - (y / rows) * (LAT_TOP - LAT_BOT),
            r: 0.8 + Math.random() * 0.9,
            g: Math.floor(Math.random() * TWINKLE_GROUPS),
          })
        }
      }
    }
  }

  /** (Re)builds every static layer in current screen coordinates. */
  private bake(): void {
    const mk = () => {
      const cv = document.createElement('canvas')
      cv.width = Math.max(this.w, 1)
      cv.height = Math.max(this.h, 1)
      return cv
    }
    // Dot layers: one cold + one warm canvas per twinkle group.
    this.coldLayers = []
    this.warmLayers = []
    for (let g = 0; g < TWINKLE_GROUPS; g++) {
      const cold = mk(); const warm = mk()
      const cc = cold.getContext('2d'); const wc = warm.getContext('2d')
      if (!cc || !wc) continue
      cc.fillStyle = 'rgb(112, 132, 168)'
      wc.fillStyle = 'rgb(214, 189, 141)'
      for (const d of this.dotLonLat) {
        if (d.g !== g) continue
        const x = this.px(d.x); const y = this.py(d.y)
        cc.beginPath(); cc.arc(x, y, d.r, 0, Math.PI * 2); cc.fill()
        wc.beginPath(); wc.arc(x, y, d.r, 0, Math.PI * 2); wc.fill()
      }
      this.coldLayers.push(cold)
      this.warmLayers.push(warm)
    }
    // Border layer: glow baked once via a wide soft stroke under a hot core.
    const borders = mk()
    const bc = borders.getContext('2d')
    if (bc) {
      const path = new Path2D()
      for (const ring of this.rings) {
        path.moveTo(this.px(ring[0][0]), this.py(ring[0][1]))
        for (let i = 1; i < ring.length; i++) path.lineTo(this.px(ring[i][0]), this.py(ring[i][1]))
        path.closePath()
      }
      bc.strokeStyle = 'rgba(210, 40, 35, 0.16)'
      bc.lineWidth = 6
      bc.stroke(path)
      bc.strokeStyle = 'rgba(235, 62, 52, 0.55)'
      bc.lineWidth = 2.6
      bc.stroke(path)
      bc.strokeStyle = 'rgba(255, 120, 95, 0.9)'
      bc.lineWidth = 1.1
      bc.stroke(path)
      this.borderLayer = borders
    }
    // Sparks for the shatter: sampled along the borders, each with a drift vector.
    this.sparks = []
    const every = Math.max(1, Math.floor(this.rings.reduce((n, r) => n + r.length, 0) / BURST_SPARKS))
    let idx = 0
    for (const ring of this.rings) {
      for (const [lon, lat] of ring) {
        if (idx++ % every !== 0) continue
        const ang = Math.random() * Math.PI * 2
        const sp = 0.4 + Math.random() * 0.6
        this.sparks.push({ lon, lat, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.55, seed: Math.random() })
      }
    }
    // Web layer: finished arcs + lit cities accumulate here.
    this.webLayer = mk()
    this.webCtx = this.webLayer.getContext('2d')
    for (const a of this.arcs) a.baked = false
    this.lastWeb = 0
    // Glow sprites: one warm (cities), one gold (the user's own places).
    this.citySprite = this.makeSprite('rgba(255, 216, 140, 0.95)', 'rgba(255, 190, 110, 0.45)', 'rgba(255, 180, 100, 0)')
    this.goldSprite = this.makeSprite('rgba(255, 232, 170, 1)', 'rgba(255, 205, 120, 0.55)', 'rgba(255, 195, 105, 0)')
  }

  private makeSprite(inner: string, mid: string, outer: string): HTMLCanvasElement {
    const sprite = document.createElement('canvas')
    sprite.width = 64
    sprite.height = 64
    const sc = sprite.getContext('2d')
    if (sc) {
      const grad = sc.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, inner)
      grad.addColorStop(0.25, mid)
      grad.addColorStop(1, outer)
      sc.fillStyle = grad
      sc.fillRect(0, 0, 64, 64)
    }
    return sprite
  }

  private arcPoint(arc: Arc, q: number): [number, number] {
    const [alat, alon] = CITIES[arc.a]
    const [blat, blon] = CITIES[arc.b]
    const x1 = this.px(alon); const y1 = this.py(alat)
    const x2 = this.px(blon); const y2 = this.py(blat)
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - Math.min(Math.hypot(x2 - x1, y2 - y1) * 0.22, this.h * 0.2)
    return [
      (1 - q) * (1 - q) * x1 + 2 * (1 - q) * q * mx + q * q * x2,
      (1 - q) * (1 - q) * y1 + 2 * (1 - q) * q * my + q * q * y2,
    ]
  }

  private strokeArc(c: CanvasRenderingContext2D, arc: Arc, upTo: number, alpha: number): void {
    // The tip interpolates FRACTIONALLY along the curve — quantizing growth to
    // whole segments made the heads visibly step forward instead of glide.
    const steps = 48
    const n = Math.floor(steps * upTo)
    c.beginPath()
    for (let i = 0; i <= n; i++) {
      const [ix, iy] = this.arcPoint(arc, (i / steps))
      if (i === 0) c.moveTo(ix, iy)
      else c.lineTo(ix, iy)
    }
    if (upTo < 1) {
      const [tx, ty] = this.arcPoint(arc, upTo)
      c.lineTo(tx, ty)
    }
    c.strokeStyle = `rgba(255, 176, 90, ${0.10 * alpha})`
    c.lineWidth = 4.2
    c.stroke()
    c.strokeStyle = `rgba(255, 202, 122, ${0.4 * alpha})`
    c.lineWidth = 1.2
    c.stroke()
  }

  private arcLocal(arc: Arc, web: number): number {
    // A tighter growth window + ease-out: each arc shoots off and settles,
    // rather than crawling for a third of the act.
    const q = Math.min(Math.max((web - arc.delay * 0.84) / 0.16, 0), 1)
    return 1 - (1 - q) ** 3
  }

  draw(c: CanvasRenderingContext2D, s: SceneState, t: number): void {
    const { w, h } = this
    c.clearRect(0, 0, w, h)
    if (s.opacity <= 0) return
    c.save()

    // Land: TWINKLE_GROUPS×2 drawImages, alpha does the twinkle and the warmth mix.
    if (s.land > 0 && this.coldLayers.length > 0) {
      for (let g = 0; g < this.coldLayers.length; g++) {
        const twinkle = 0.72 + 0.28 * Math.sin(t * 0.8 + g * 2.1)
        const a = s.opacity * s.land * 0.6 * twinkle
        if (s.warmth < 1) {
          c.globalAlpha = a * (1 - s.warmth)
          c.drawImage(this.coldLayers[g], 0, 0)
        }
        if (s.warmth > 0) {
          c.globalAlpha = a * s.warmth
          c.drawImage(this.warmLayers[g], 0, 0)
        }
      }
    }

    // The opening's calm city lights — and their death in the fear act. Each city
    // dies at its own pseudo-random moment while the borders heat up.
    if (this.citySprite && s.cityLife > 0 && s.cityDeath < 1 && s.web <= 0) {
      c.globalCompositeOperation = 'lighter'
      for (let i = 0; i < CITIES.length; i++) {
        const on = Math.min(Math.max(s.cityLife * 1.5 - ((i * 29) % 100) / 100 * 0.5, 0), 1)
        const deathAt = ((i * 37) % 100) / 100 * 0.8
        const dead = Math.min(Math.max((s.cityDeath * 1.25 - deathAt) / 0.2, 0), 1)
        const a = on * (1 - dead)
        if (a <= 0) continue
        // A light flickers just before it dies.
        const flicker = dead > 0 && dead < 1 ? 0.5 + 0.5 * Math.sin(t * 26 + i * 3) : 1
        const [lat, lon] = CITIES[i]
        const x = this.px(lon); const y = this.py(lat)
        c.globalAlpha = s.opacity * 0.5 * a * flicker
        c.drawImage(this.citySprite, x - 8, y - 8, 16, 16)
      }
      c.globalCompositeOperation = 'source-over'
    }

    // Borders: one blit; pulse via alpha. The climax shatter replaces the layer
    // with sparks that drift off and burn out.
    if (this.borderLayer && s.borderHeat > 0 && s.borderBurst < 1) {
      const alive = 1 - s.borderBurst
      const pulse = 0.72 + 0.28 * Math.sin(t * 2.4)
      c.globalAlpha = s.opacity * alive * s.borderHeat * pulse
      c.drawImage(this.borderLayer, 0, 0)
    }
    if (s.borderBurst > 0 && s.borderBurst < 1 && this.sparks.length > 0) {
      c.globalCompositeOperation = 'lighter'
      const prog = s.borderBurst
      const ease = 1 - (1 - prog) * (1 - prog)
      for (const sp of this.sparks) {
        const a = (1 - prog) * (0.5 + 0.5 * Math.sin(sp.seed * 9 + t * 7))
        if (a <= 0.02) continue
        const x = this.px(sp.lon) + sp.vx * ease * 46
        const y = this.py(sp.lat) + sp.vy * ease * 46
        c.globalAlpha = s.opacity * a
        c.fillStyle = sp.seed > 0.5 ? 'rgb(255, 150, 95)' : 'rgb(255, 205, 130)'
        c.fillRect(x, y, 1.6, 1.6)
      }
      c.globalCompositeOperation = 'source-over'
    }

    // Web: finished arcs live in the baked layer; only growing arcs are stroked.
    if (s.web > 0) {
      c.globalCompositeOperation = 'lighter'
      if (this.webCtx && s.web > this.lastWeb) {
        for (const arc of this.arcs) {
          if (!arc.baked && this.arcLocal(arc, s.web) >= 1) {
            this.strokeArc(this.webCtx, arc, 1, 1)
            arc.baked = true
          }
        }
        this.lastWeb = s.web
      }
      if (this.webLayer) {
        c.globalAlpha = s.opacity
        c.drawImage(this.webLayer, 0, 0)
      }
      c.globalAlpha = s.opacity
      for (const arc of this.arcs) {
        if (arc.baked) continue
        const local = this.arcLocal(arc, s.web)
        if (local <= 0) continue
        this.strokeArc(c, arc, local, local)
      }
      if (this.citySprite) {
        for (let i = 0; i < CITIES.length; i++) {
          const local = Math.min(Math.max((s.web - (i / CITIES.length) * 0.5) / 0.2, 0), 1)
          if (local <= 0) continue
          const [lat, lon] = CITIES[i]
          const x = this.px(lon); const y = this.py(lat)
          const halo = (11 + Math.sin(t * 1.8 + i) * 3) * (0.6 + 0.4 * local)
          c.globalAlpha = s.opacity * 0.55 * local
          c.drawImage(this.citySprite, x - halo, y - halo, halo * 2, halo * 2)
          c.globalAlpha = s.opacity * local
          c.drawImage(this.citySprite, x - 3.2, y - 3.2, 6.4, 6.4)
        }
      }
      c.globalCompositeOperation = 'source-over'
    }

    // The user's own places igniting gold — each with a small overshoot pulse.
    if (this.goldSprite && s.personalGlow > 0 && this.personal.length > 0) {
      c.globalCompositeOperation = 'lighter'
      const n = this.personal.length
      for (let i = 0; i < n; i++) {
        const local = Math.min(Math.max((s.personalGlow - (i / n) * 0.6) / 0.25, 0), 1)
        if (local <= 0) continue
        const p = this.personal[i]
        const x = this.px(p.lng); const y = this.py(p.lat)
        const overshoot = 1 + (1 - local) * 2.2
        const halo = 7 * overshoot
        c.globalAlpha = s.opacity * 0.85 * local
        c.drawImage(this.goldSprite, x - halo, y - halo, halo * 2, halo * 2)
        c.globalAlpha = s.opacity * local
        c.drawImage(this.goldSprite, x - 2.6, y - 2.6, 5.2, 5.2)
      }
      c.globalCompositeOperation = 'source-over'
    }

    // Rising particles for the anthem.
    if (s.particles > 0) {
      c.globalCompositeOperation = 'lighter'
      for (const p of this.particlesPool) {
        const y = ((((p.y - t * p.v * 0.13) % 1.15) + 1.15) % 1.15)
        const x = p.x + Math.sin(t * 0.4 + p.seed) * p.drift
        c.globalAlpha = s.opacity * 0.28 * s.particles * (0.4 + 0.6 * Math.abs(Math.sin(t + p.seed)))
        c.fillStyle = 'rgb(255, 210, 150)'
        c.beginPath()
        c.arc(x * w, y * h, p.size, 0, Math.PI * 2)
        c.fill()
      }
      c.globalCompositeOperation = 'source-over'
    }

    c.globalAlpha = 1
    c.restore()
  }
}
