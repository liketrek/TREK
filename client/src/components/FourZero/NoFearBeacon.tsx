import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Play, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { noFearCopy } from './noFearLines'
import './fourzero.css'

// TREK 4.0.0 release moment — remove together with the FourZero folder.

const NoFearShow = lazy(() => import('./NoFearShow'))

const DISMISS_KEY = 'trek-fourzero-dismissed'

// Abstract night-world for the teaser: light points loosely shaped like the
// inhabited continents (relative coords), between which golden arcs travel.
const TEASER_POINTS: [number, number][] = [
  [0.46, 0.28], [0.5, 0.22], [0.53, 0.3], [0.48, 0.38], [0.55, 0.42], [0.44, 0.5],
  [0.58, 0.55], [0.52, 0.62], [0.62, 0.3], [0.68, 0.4], [0.74, 0.32], [0.8, 0.45],
  [0.84, 0.58], [0.88, 0.36], [0.2, 0.3], [0.14, 0.4], [0.24, 0.52], [0.3, 0.66],
  [0.26, 0.78], [0.34, 0.35], [0.9, 0.72], [0.66, 0.68], [0.1, 0.26], [0.4, 0.72],
]

interface TeaserArc { a: number; b: number; born: number }

/** The living background of the beacon: pulsing lights, traveling golden arcs. */
function TeaserCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const fit = () => {
      cv.width = Math.round(cv.clientWidth * dpr)
      cv.height = Math.round(cv.clientHeight * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    const arcs: TeaserArc[] = []
    let last = 0
    let raf = 0
    const draw = (now: number) => {
      const t = now / 1000
      const w = cv.clientWidth
      const h = cv.clientHeight
      c.clearRect(0, 0, w, h)
      // A new arc every ~1.6s between two far-apart lights.
      if (t - last > 1.6 && arcs.length < 7) {
        last = t
        const a = Math.floor(Math.random() * TEASER_POINTS.length)
        let b = Math.floor(Math.random() * TEASER_POINTS.length)
        for (let tries = 0; tries < 6; tries++) {
          b = Math.floor(Math.random() * TEASER_POINTS.length)
          if (Math.abs(TEASER_POINTS[a][0] - TEASER_POINTS[b][0]) > 0.22) break
        }
        arcs.push({ a, b, born: t })
      }
      c.globalCompositeOperation = 'lighter'
      // Arcs: grow 1.4s, glow, fade until 4.5s.
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i]
        const age = t - arc.born
        if (age > 4.5) { arcs.splice(i, 1); continue }
        const grow = Math.min(age / 1.4, 1)
        const fade = age < 3 ? 1 : 1 - (age - 3) / 1.5
        const [ax, ay] = TEASER_POINTS[arc.a]
        const [bx, by] = TEASER_POINTS[arc.b]
        const x1 = ax * w; const y1 = ay * h
        const x2 = bx * w; const y2 = by * h
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2 - Math.min(Math.abs(x2 - x1) * 0.35, h * 0.34)
        c.beginPath()
        const steps = 22
        const upto = Math.max(2, Math.round(steps * grow))
        for (let s = 0; s <= upto; s++) {
          const q = s / steps
          const ix = (1 - q) * (1 - q) * x1 + 2 * (1 - q) * q * mx + q * q * x2
          const iy = (1 - q) * (1 - q) * y1 + 2 * (1 - q) * q * my + q * q * y2
          if (s === 0) c.moveTo(ix, iy)
          else c.lineTo(ix, iy)
        }
        c.strokeStyle = `rgba(255, 180, 95, ${0.12 * fade})`
        c.lineWidth = 3.4
        c.stroke()
        c.strokeStyle = `rgba(255, 208, 130, ${0.55 * fade})`
        c.lineWidth = 1.1
        c.stroke()
      }
      // Lights: soft breathing points.
      for (let i = 0; i < TEASER_POINTS.length; i++) {
        const [px, py] = TEASER_POINTS[i]
        const breathe = 0.55 + 0.45 * Math.sin(t * 1.4 + i * 1.7)
        c.fillStyle = `rgba(255, 214, 150, ${0.5 * breathe})`
        c.beginPath()
        c.arc(px * w, py * h, 1.4 + breathe * 0.8, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = `rgba(255, 190, 110, ${0.1 * breathe})`
        c.beginPath()
        c.arc(px * w, py * h, 6 + breathe * 3, 0, Math.PI * 2)
        c.fill()
      }
      c.globalCompositeOperation = 'source-over'
      if (!reduced) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} className="fz-beacon-canvas" aria-hidden />
}

/**
 * The dashboard trigger for the 4.0.0 "KEINE ANGST" show: a dark cinematic card
 * with a living web of golden travel arcs (desktop only). One click starts the
 * show; the small × dismisses the beacon for good on this device.
 * Core colors ride inline so no dashboard widget CSS can wash them out.
 */
export default function NoFearBeacon() {
  const { language } = useTranslation()
  const copy = noFearCopy(language)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [open, setOpen] = useState(false)

  if (dismissed) return null

  return (
    <>
      <div className="fz-beacon" style={{ background: '#07080d', color: '#f5f2ea' }}>
        <TeaserCanvas />
        <div className="fz-beacon-glow" aria-hidden />
        <button type="button" className="fz-beacon-play" style={{ background: 'transparent', color: '#f5f2ea' }} onClick={() => setOpen(true)}>
          <p className="fz-beacon-eyebrow">TREK 4.0.0</p>
          <p className="fz-beacon-title" style={{ color: '#f7f3e8' }}>{copy.beaconTitle}</p>
          <p className="fz-beacon-sub" style={{ color: 'rgba(245, 240, 225, 0.72)' }}>{copy.beaconSub}</p>
          <span className="fz-beacon-cta"><Play size={12} fill="currentColor" /> {copy.beaconCta}</span>
        </button>
        <span className="fz-beacon-pulse" aria-hidden />
        <button
          type="button"
          className="fz-beacon-dismiss"
          aria-label={copy.skip}
          onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true) }}
        >
          <X size={12} />
        </button>
      </div>
      {open && (
        <Suspense fallback={null}>
          <NoFearShow onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
