// Canvas scene for the 4.0.0 "KEINE ANGST" show: a world of dots whose borders
// first burn red, then dissolve under a growing web of travel connections.
//
// The landmass and border geometry come from TREK's own Atlas bundle
// (/addons/atlas/countries/geo). The polygons are rasterized once onto a small
// offscreen canvas (the browser does the point-in-polygon work natively), then
// sampled into a dot grid. If the Atlas addon is disabled the show degrades
// gracefully: no map, but the city web and typography still carry it.

type Ring = [number, number][]

export interface SceneState {
  /** 0→1: how far the land dots have faded in. */
  land: number
  /** 0→1: how hot the borders burn (red act). */
  borderHeat: number
  /** 0→1: how far the borders have dissolved (0 = solid, 1 = gone). */
  borderGone: number
  /** 0→1: how much of the city web has grown. */
  web: number
  /** 0→1: warm ambient glow of the release act. */
  warmth: number
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

interface Arc { a: number; b: number; delay: number }
interface Dot { x: number; y: number; r: number; tw: number }
interface Particle { x: number; y: number; v: number; drift: number; size: number; seed: number }

export class NoFearScene {
  private dots: Dot[] = []
  private borders: Path2D | null = null
  private arcs: Arc[] = []
  private particlesPool: Particle[] = []
  private w = 0
  private h = 0
  private ready = false

  /** Maps lon/lat to scene pixels. Set up in layout(). */
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
      const peers = CITIES
        .map((_, j) => j)
        .filter(j => j !== i && d2(i, j) > 900)
      for (let k = 0; k < 2 && peers.length > 0; k++) {
        const j = peers.splice(Math.floor(Math.random() * peers.length), 1)[0]
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (seen.has(key)) continue
        seen.add(key)
        this.arcs.push({ a: i, b: j, delay: Math.random() })
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

  /** Fetches the Atlas country bundle and builds dots + border paths. Safe to fail. */
  async load(width: number, height: number): Promise<void> {
    this.layout(width, height)
    try {
      const res = await fetch('/api/addons/atlas/countries/geo', { credentials: 'include' })
      if (!res.ok) return
      const geo = await res.json() as { features?: { geometry?: { type: string; coordinates: unknown } }[] }
      const rings: Ring[] = []
      for (const f of geo.features ?? []) {
        const g = f.geometry
        if (!g) continue
        if (g.type === 'Polygon') for (const r of g.coordinates as Ring[]) rings.push(r)
        else if (g.type === 'MultiPolygon') for (const p of g.coordinates as Ring[][]) for (const r of p) rings.push(r)
      }
      if (rings.length === 0) return
      this.buildDots(rings)
      this.buildBorders(rings)
      this.ready = true
    } catch {
      // Atlas addon off / offline — the show runs without the map.
    }
  }

  layout(width: number, height: number): void {
    this.w = width
    this.h = height
    // Equirectangular, latitude clamped to [-58, 78] (no empty Antarctica band),
    // fit as "cover" so the map always fills the screen width.
    const latTop = 78
    const latBot = -58
    const scale = Math.max(width / 360, height / (latTop - latBot))
    const mapW = 360 * scale
    const mapH = (latTop - latBot) * scale
    const ox = (width - mapW) / 2
    const oy = (height - mapH) / 2
    this.px = (lon: number) => ox + (lon + 180) * scale
    this.py = (lat: number) => oy + (latTop - lat) * scale
  }

  private buildDots(rings: Ring[]): void {
    // Rasterize the filled polygons at low resolution; the alpha channel then
    // tells us where land is. ~160 columns keeps this a one-off few-ms job.
    const cols = 168
    const rows = 84
    const off = document.createElement('canvas')
    off.width = cols
    off.height = rows
    const c = off.getContext('2d')
    if (!c) return
    const sx = (lon: number) => ((lon + 180) / 360) * cols
    const sy = (lat: number) => ((78 - lat) / (78 - -58)) * rows
    c.fillStyle = '#fff'
    c.beginPath()
    for (const ring of rings) {
      if (ring.length < 3) continue
      c.moveTo(sx(ring[0][0]), sy(ring[0][1]))
      for (let i = 1; i < ring.length; i++) c.lineTo(sx(ring[i][0]), sy(ring[i][1]))
      c.closePath()
    }
    c.fill('evenodd')
    const img = c.getImageData(0, 0, cols, rows).data
    this.dots = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (img[(y * cols + x) * 4 + 3] > 96) {
          const lon = (x / cols) * 360 - 180
          const lat = 78 - (y / rows) * (78 - -58)
          this.dots.push({
            x: lon, y: lat,
            r: 0.8 + Math.random() * 0.9,
            tw: Math.random() * Math.PI * 2,
          })
        }
      }
    }
  }

  private buildBorders(rings: Ring[]): void {
    const path = new Path2D()
    for (const ring of rings) {
      if (ring.length < 8) continue // skip islets — visual noise at this scale
      // Decimate: the show projection is far coarser than the Atlas zoom levels.
      const step = Math.max(1, Math.floor(ring.length / 240))
      path.moveTo(this.px(ring[0][0]), this.py(ring[0][1]))
      for (let i = step; i < ring.length; i += step) {
        path.lineTo(this.px(ring[i][0]), this.py(ring[i][1]))
      }
      path.closePath()
    }
    this.borders = path
  }

  /** Border paths bake in pixel coordinates, so a resize needs a rebuild — cheap enough to redo on demand. */
  hasMap(): boolean {
    return this.ready
  }

  draw(c: CanvasRenderingContext2D, s: SceneState, t: number): void {
    const { w, h } = this
    c.clearRect(0, 0, w, h)
    if (s.opacity <= 0) return
    c.save()
    c.globalAlpha = s.opacity

    // Land dots — cold blue-grey in the fear act, warming with s.warmth.
    if (s.land > 0 && this.dots.length > 0) {
      for (const d of this.dots) {
        const twinkle = 0.75 + 0.25 * Math.sin(t * 0.7 + d.tw)
        const a = s.land * 0.55 * twinkle
        const warm = s.warmth
        c.fillStyle = `rgba(${Math.round(110 + warm * 105)}, ${Math.round(130 + warm * 60)}, ${Math.round(165 - warm * 25)}, ${a})`
        c.beginPath()
        c.arc(this.px(d.x), this.py(d.y), d.r, 0, Math.PI * 2)
        c.fill()
      }
    }

    // Borders — a hot red web that later dissolves to nothing.
    if (this.borders && s.borderHeat > 0 && s.borderGone < 1) {
      const alive = 1 - s.borderGone
      const pulse = 0.72 + 0.28 * Math.sin(t * 2.4)
      c.save()
      c.globalAlpha = s.opacity * alive * s.borderHeat * pulse
      c.strokeStyle = `rgba(235, 60, 55, 0.9)`
      c.lineWidth = 1 + s.borderHeat * 0.6
      c.shadowColor = 'rgba(235, 50, 45, 0.85)'
      c.shadowBlur = 6 + s.borderHeat * 10 + s.borderGone * 22
      c.stroke(this.borders)
      c.restore()
    }

    // The web: city lights and great arcs across everything that just burned.
    if (s.web > 0) {
      c.save()
      c.globalCompositeOperation = 'lighter'
      const grow = s.web
      for (const arc of this.arcs) {
        // Each arc gets its own window inside the act so the web cascades.
        const local = Math.min(Math.max((grow - arc.delay * 0.72) / 0.28, 0), 1)
        if (local <= 0) continue
        const [alat, alon] = CITIES[arc.a]
        const [blat, blon] = CITIES[arc.b]
        const x1 = this.px(alon); const y1 = this.py(alat)
        const x2 = this.px(blon); const y2 = this.py(blat)
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2 - Math.min(Math.hypot(x2 - x1, y2 - y1) * 0.22, h * 0.2)
        c.strokeStyle = `rgba(255, 196, 110, ${0.34 * local})`
        c.lineWidth = 1.1
        c.shadowColor = 'rgba(255, 180, 90, 0.9)'
        c.shadowBlur = 7
        c.beginPath()
        // Draw the quadratic curve only up to `local` by subdividing.
        const steps = 26
        const upto = Math.max(2, Math.floor(steps * local))
        for (let i = 0; i <= upto; i++) {
          const q = (i / steps)
          const ix = (1 - q) * (1 - q) * x1 + 2 * (1 - q) * q * mx + q * q * x2
          const iy = (1 - q) * (1 - q) * y1 + 2 * (1 - q) * q * my + q * q * y2
          if (i === 0) c.moveTo(ix, iy)
          else c.lineTo(ix, iy)
        }
        c.stroke()
      }
      // City lights on top of the arcs.
      for (let i = 0; i < CITIES.length; i++) {
        const local = Math.min(Math.max((grow - (i / CITIES.length) * 0.5) / 0.2, 0), 1)
        if (local <= 0) continue
        const [lat, lon] = CITIES[i]
        const px = this.px(lon); const py = this.py(lat)
        const halo = 2.6 + Math.sin(t * 1.8 + i) * 0.7
        c.fillStyle = `rgba(255, 214, 140, ${0.85 * local})`
        c.shadowColor = 'rgba(255, 200, 120, 1)'
        c.shadowBlur = 10
        c.beginPath()
        c.arc(px, py, 1.6 + local * 1.1, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = `rgba(255, 190, 100, ${0.12 * local})`
        c.beginPath()
        c.arc(px, py, halo * 2.4, 0, Math.PI * 2)
        c.fill()
      }
      c.restore()
    }

    // Rising particles for the anthem.
    if (s.particles > 0) {
      c.save()
      c.globalCompositeOperation = 'lighter'
      for (const p of this.particlesPool) {
        const y = ((p.y - t * p.v * 0.13) % 1.15)
        const x = p.x + Math.sin(t * 0.4 + p.seed) * p.drift
        c.fillStyle = `rgba(255, 210, 150, ${0.28 * s.particles * (0.4 + 0.6 * Math.sin(t + p.seed))})`
        c.beginPath()
        c.arc(x * w, y * h, p.size, 0, Math.PI * 2)
        c.fill()
      }
      c.restore()
    }

    c.restore()
  }
}
