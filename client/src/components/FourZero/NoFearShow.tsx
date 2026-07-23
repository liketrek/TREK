import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Volume2, VolumeX, X } from 'lucide-react'
import { placesApi, tripsApi } from '../../api/client'
import apiClient from '../../api/client'
import { useTranslation } from '../../i18n'
import type { Place, Trip } from '../../types'
import { NoFearAudio, type NoFearAct } from './noFearAudio'
import { NoFearScene, type SceneState } from './noFearScene'
import { ANTHEM_CASCADE, noFearCopy } from './noFearLines'
import './fourzero.css'

// TREK 4.0.0 release moment — remove together with the FourZero folder.

type LineKey = keyof ReturnType<typeof noFearCopy>['lines']

interface Cue {
  at: number
  act?: NoFearAct
  line?: LineKey | null
  hard?: boolean
  soft?: boolean
  impact?: number
  swell?: boolean
}

// The script. Times in seconds; the scene ramps below share the same clock.
const CUES: Cue[] = [
  { at: 0.8, act: 'fear', line: 'afraid' },
  { at: 6.0, line: 'ofTheStranger' },
  { at: 12.0, act: 'dread', line: 'fearTool' },
  { at: 18.5, line: 'hateTrade' },
  { at: 26.0, act: 'silence', line: null },
  { at: 28.5, line: 'butYouTraveled', soft: true, swell: true },
  { at: 34.0, act: 'hope', line: 'tables' },
  { at: 42.0, line: 'face' },
  { at: 49.0, line: 'fences' },
  { at: 55.5, line: 'yourPlaces', impact: 0.35 },
  { at: 58.8, line: 'yourStatsCountries' },
  { at: 64.0, line: 'notAnOpinion', hard: true, impact: 1 },
  { at: 71.0, act: 'anthem', line: null, impact: 0.8 },
  { at: 84.0, act: 'end', line: null },
]
const ANTHEM_AT = 71
const CREDITS_AT = 84
// The three staccato words strobe with the late fear act, just before the cut.
const FLASH_WINDOWS: [number, number][] = [[22.2, 22.85], [23.6, 24.25], [25.0, 25.65]]

const ramp = (t: number, from: number, to: number): number =>
  Math.min(Math.max((t - from) / (to - from), 0), 1)

function sceneAt(t: number): SceneState {
  // Hard cut to black at 26s; the pivot line stands alone in the dark, then the
  // world returns WITH the hope act (28→31.5) — that overlap is intentional.
  const blackout = t >= 26 && t < 31.5 ? 1 - ramp(t, 28, 31.5) : 0
  return {
    land: ramp(t, 6, 10),
    cityLife: ramp(t, 6.5, 11),
    cityDeath: ramp(t, 13, 22),
    borderHeat: t < 34 ? ramp(t, 12, 15.5) : 1 - 0.55 * ramp(t, 34, 38),
    borderBurst: ramp(t, 64, 70),
    web: ramp(t, 34, 62),
    warmth: ramp(t, 34, 46),
    personalGlow: ramp(t, 55.5, 60.5),
    particles: ramp(t, ANTHEM_AT, ANTHEM_AT + 4),
    opacity: (1 - blackout) * (t >= CREDITS_AT ? 0.35 : 1),
  }
}

/** Formats "{p} places. {c} countries. …" with the traveler's real numbers. */
function fillStats(template: string, p: number, cOrT: number): string {
  return template.replace('{p}', String(p)).replace('{c}', String(cOrT)).replace('{t}', String(cOrT))
}

export default function NoFearShow({ onClose }: { onClose: () => void }) {
  const { language } = useTranslation()
  const copy = useMemo(() => noFearCopy(language), [language])
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<NoFearAudio | null>(null)
  const sceneRef = useRef<NoFearScene | null>(null)
  const startRef = useRef<number>(performance.now())
  const statsRef = useRef<{ line: string } | null>(null)
  const [cueIdx, setCueIdx] = useState(-1)
  const [flashIdx, setFlashIdx] = useState(-1)
  const [muted, setMuted] = useState(false)
  const [credits, setCredits] = useState(false)
  const [anthem, setAnthem] = useState(false)
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  const skipToEnd = useCallback(() => {
    startRef.current = performance.now() - CREDITS_AT * 1000
    setAnthem(true)
    setCredits(true)
    audioRef.current?.setAct('end')
  }, [])

  // Boot: audio, scene, personal places, chrome side effects.
  useEffect(() => {
    document.body.classList.add('fz-show-open') // hides the dashboard FAB + locks scroll
    const audio = new NoFearAudio()
    audioRef.current = audio
    if (!reducedMotion) audio.start()
    const scene = new NoFearScene()
    sceneRef.current = scene
    const aborter = new AbortController()
    const cv = canvasRef.current
    const fit = () => {
      if (!cv) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      cv.width = Math.round(cv.clientWidth * dpr)
      cv.height = Math.round(cv.clientHeight * dpr)
      cv.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene.layout(cv.clientWidth, cv.clientHeight)
    }
    fit()
    if (cv) void scene.load(cv.clientWidth, cv.clientHeight, aborter.signal)
    window.addEventListener('resize', fit)
    // The traveler's own places, gathered quietly during the fear act. Fail-soft:
    // without them the show falls back to its generic lines.
    void (async () => {
      try {
        const trips = await tripsApi.list() as Trip[]
        if (aborter.signal.aborted || !Array.isArray(trips)) return
        const lists = await Promise.all(trips.slice(0, 12).map(t => placesApi.list(t.id).catch(() => [] as Place[])))
        if (aborter.signal.aborted) return
        const pts = lists.flat().filter((p: Place) => p.lat != null && p.lng != null).map((p: Place) => ({ lat: p.lat as number, lng: p.lng as number }))
        if (pts.length >= 3) {
          sceneRef.current?.setPersonalPlaces(pts)
          // Prefer real country counts from Atlas; fall back to trip counts.
          try {
            const { data } = await apiClient.get('/addons/atlas/stats', { signal: aborter.signal })
            const countries = data?.stats?.totalCountries
            statsRef.current = countries > 0
              ? { line: fillStats(copy.lines.yourStatsCountries, pts.length, countries) }
              : { line: fillStats(copy.lines.yourStatsTrips, pts.length, trips.length) }
          } catch {
            statsRef.current = { line: fillStats(copy.lines.yourStatsTrips, pts.length, trips.length) }
          }
        }
      } catch { /* not signed-in edge / API down — generic show */ }
    })()
    // Pause the whole show (clock + audio) while the tab is hidden.
    let hiddenAt: number | null = null
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = performance.now()
        audio.setSuspended(true)
      } else {
        if (hiddenAt !== null) startRef.current += performance.now() - hiddenAt
        hiddenAt = null
        audio.setSuspended(false)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    // Any real gesture inside the overlay doubles as an audio-resume recovery
    // for browsers that refused the post-lazy-load AudioContext start.
    const onPointer = () => audio.resume()
    window.addEventListener('pointerdown', onPointer)
    overlayRef.current?.focus()
    if (reducedMotion) skipToEnd()
    return () => {
      document.body.classList.remove('fz-show-open')
      window.removeEventListener('resize', fit)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointerdown', onPointer)
      aborter.abort()
      audio.dispose()
    }
  }, [reducedMotion, skipToEnd, copy])

  // The clock: one rAF loop drives the canvas directly and only touches React
  // state on discrete cue/flash changes. Reduced motion renders one static frame.
  useEffect(() => {
    const cv = canvasRef.current
    const ctx = cv?.getContext('2d')
    if (reducedMotion) {
      setCueIdx(CUES.length - 1)
      if (ctx) sceneRef.current?.draw(ctx, { ...sceneAt(CREDITS_AT), particles: 0 }, CREDITS_AT)
      return
    }
    let raf = 0
    let lastCue = -1
    let lastFlash = -1
    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000
      let idx = -1
      for (let i = 0; i < CUES.length; i++) if (t >= CUES[i].at) idx = i
      if (idx !== lastCue && idx >= 0) {
        lastCue = idx
        const cue = CUES[idx]
        if (cue.act) audioRef.current?.setAct(cue.act)
        if (cue.impact) audioRef.current?.impact(cue.impact)
        if (cue.swell) audioRef.current?.swell()
        setCueIdx(idx)
        if (t >= ANTHEM_AT) setAnthem(true)
        if (t >= CREDITS_AT) setCredits(true)
      }
      let flash = -1
      for (let i = 0; i < FLASH_WINDOWS.length; i++) {
        if (t >= FLASH_WINDOWS[i][0] && t < FLASH_WINDOWS[i][1]) flash = i
      }
      if (flash !== lastFlash) {
        lastFlash = flash
        setFlashIdx(flash)
      }
      if (ctx) sceneRef.current?.draw(ctx, sceneAt(t), t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])

  // ESC closes the show at any point.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const cue = cueIdx >= 0 ? CUES[cueIdx] : null
  const lineKey = cue?.line ?? null
  // The personal-stats line only exists when the traveler's data arrived; the
  // yourPlaces line falls back to the generic "every light" line without it,
  // and that line simply stays up through the stats slot (same text = no remount).
  let lineText: string | null = null
  if (lineKey === 'yourStatsCountries') lineText = statsRef.current?.line ?? copy.lines.everyDot
  else if (lineKey === 'yourPlaces') lineText = statsRef.current ? copy.lines.yourPlaces : copy.lines.everyDot
  else if (lineKey) lineText = copy.lines[lineKey]
  const hard = !!cue?.hard

  return (
    <div ref={overlayRef} className="fz-overlay" role="dialog" aria-modal="true" aria-label={copy.beaconTitle} tabIndex={-1}>
      <canvas ref={canvasRef} className="fz-canvas" />

      {/* Red vignette while the borders burn. */}
      {!anthem && cueIdx >= 2 && cueIdx <= 3 && <div className="fz-vignette" aria-hidden />}

      {/* Staccato words strobing to the heartbeat, right before the cut. */}
      {flashIdx >= 0 && !anthem && (
        <div className="fz-flash-wrap" aria-hidden>
          <span key={flashIdx} className="fz-flash">{copy.flashes[flashIdx]}</span>
        </div>
      )}

      {/* The lines. */}
      {!anthem && lineText && flashIdx < 0 && (
        <div className="fz-line-wrap" aria-live="polite">
          <p key={lineText} className={`fz-line ${hard ? 'fz-line-hard' : ''} ${cue?.soft ? 'fz-line-soft' : ''}`}>{lineText}</p>
        </div>
      )}

      {/* Anthem: the big words + the cascade through every TREK language. */}
      {anthem && !credits && (
        <div className="fz-anthem">
          <h1 className="fz-anthem-word">{copy.anthem}</h1>
          <div className="fz-cascade">
            {ANTHEM_CASCADE.filter(c => c.lang !== language).map((c, i) => (
              <span key={c.lang} className="fz-cascade-item" style={{ animationDelay: `${0.6 + i * 0.42}s` }}>
                {c.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Credits — stays until dismissed. */}
      {credits && (
        <div className="fz-credits">
          <h1 className="fz-anthem-word fz-anthem-word-small">{copy.anthem}</h1>
          <p className="fz-credit-lead">{copy.tooBeautiful}</p>
          <p className="fz-credit-title">{copy.creditTitle}</p>
          <p className="fz-credit-body">{copy.creditBody}</p>
        </div>
      )}

      {/* Chrome: mute, skip, close. */}
      <div className="fz-chrome">
        <button
          type="button"
          className="fz-chrome-btn"
          onClick={() => { const m = !muted; setMuted(m); audioRef.current?.setMuted(m) }}
          aria-label={muted ? copy.soundOn : copy.soundOff}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        {!credits && (
          <button type="button" className="fz-chrome-btn fz-chrome-skip" onClick={skipToEnd}>
            {copy.skip}
          </button>
        )}
        <button type="button" className="fz-chrome-btn" onClick={onClose} aria-label={copy.close}>
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
