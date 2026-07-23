// The finale's signature move: "KEINE ANGST" is not faded in — it CONDENSES.
// Hundreds of light particles rise out of the world and gather into the
// letterforms; once they settle, the real DOM title takes over for crispness.
// The targets are sampled from an offscreen raster of the exact same text in
// the exact same font, so the swap is seamless.

interface AssemblyParticle {
  sx: number
  sy: number
  tx: number
  ty: number
  delay: number
  size: number
  seed: number
}

const easeOutCubic = (q: number): number => 1 - (1 - q) ** 3

export class TextAssembly {
  private particles: AssemblyParticle[] = []
  private ready = false

  /**
   * Samples particle targets from the given text. `font` is a full CSS font
   * shorthand measured off the real DOM title; the box is the title's screen
   * rect so canvas particles land exactly where the DOM text will appear.
   */
  init(text: string, font: string, box: { left: number; top: number; width: number; height: number }, screenW: number, screenH: number): void {
    const off = document.createElement('canvas')
    // Raster at a capped size — targets only need ~2px precision.
    const scale = Math.min(1, 700 / Math.max(box.width, 1))
    off.width = Math.max(Math.round(box.width * scale), 1)
    off.height = Math.max(Math.round(box.height * scale), 1)
    const c = off.getContext('2d')
    if (!c) return
    c.font = font.replace(/(\d+(?:\.\d+)?)px/, (_, n) => `${Number(n) * scale}px`)
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillStyle = '#fff'
    c.fillText(text, off.width / 2, off.height / 2)
    const img = c.getImageData(0, 0, off.width, off.height).data
    const step = 3 // sample grid in raster px — ~800-1400 particles for a title
    this.particles = []
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (img[(y * off.width + x) * 4 + 3] > 128) {
          const tx = box.left + x / scale
          const ty = box.top + y / scale
          // Particles rise from below and drift in from the sides — they come
          // OUT of the world, not from nowhere.
          const fromSide = Math.random() < 0.3
          this.particles.push({
            sx: fromSide ? (Math.random() < 0.5 ? -30 : screenW + 30) : Math.random() * screenW,
            sy: fromSide ? Math.random() * screenH : screenH + 20 + Math.random() * 80,
            tx,
            ty,
            delay: Math.random() * 0.45,
            size: 0.9 + Math.random() * 1.2,
            seed: Math.random() * 7,
          })
        }
      }
    }
    this.ready = true
  }

  isReady(): boolean {
    return this.ready
  }

  /** progress 0→1 gathers, `fade` 0→1 dissolves the particles into the DOM text. */
  draw(c: CanvasRenderingContext2D, progress: number, fade: number, t: number): void {
    if (!this.ready || fade >= 1) return
    c.save()
    c.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      const local = easeOutCubic(Math.min(Math.max((progress - p.delay) / (1 - p.delay), 0), 1))
      if (local <= 0) continue
      const x = p.sx + (p.tx - p.sx) * local
      const y = p.sy + (p.ty - p.sy) * local
      // In flight the particle glows warm; settled it cools toward the ivory of the text.
      const settled = local > 0.98
      const flicker = 0.65 + 0.35 * Math.sin(t * 5 + p.seed)
      c.globalAlpha = (1 - fade) * (settled ? 0.9 : 0.75 * flicker)
      c.fillStyle = settled ? 'rgb(247, 240, 226)' : 'rgb(255, 205, 130)'
      c.beginPath()
      c.arc(x, y, settled ? p.size * 0.85 : p.size, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
  }
}
