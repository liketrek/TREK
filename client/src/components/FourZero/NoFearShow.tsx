import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Volume2, VolumeX, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { NoFearAudio, type NoFearAct } from './noFearAudio'
import { NoFearScene, type SceneState } from './noFearScene'
import { ANTHEM_CASCADE, INSPIRED_URL, noFearCopy } from './noFearLines'
import './fourzero.css'

// TREK 4.0.0 release moment — remove together with the FourZero folder.

type LineKey = keyof ReturnType<typeof noFearCopy>['lines']

interface Cue {
  at: number
  act?: NoFearAct
  line?: LineKey | null
  hard?: boolean
}

// The script. Times in seconds; the scene ramps below are keyed to the same clock.
const CUES: Cue[] = [
  { at: 0.8, act: 'fear', line: 'afraid' },
  { at: 6.0, line: 'ofTheStranger' },
  { at: 12.0, act: 'dread', line: 'fearTool' },
  { at: 18.5, line: 'hateTrade' },
  { at: 25.0, act: 'silence', line: null },
  { at: 27.5, line: 'butYouTraveled' },
  { at: 33.0, act: 'hope', line: 'tables' },
  { at: 41.0, line: 'face' },
  { at: 48.0, line: 'fences' },
  { at: 54.5, line: 'notAnOpinion', hard: true },
  { at: 62.0, act: 'anthem', line: null },
  { at: 74.0, act: 'end', line: null },
]
const ANTHEM_AT = 62
const CREDITS_AT = 74

const ramp = (t: number, from: number, to: number): number =>
  Math.min(Math.max((t - from) / (to - from), 0), 1)

function sceneAt(t: number): SceneState {
  // The blackout (25→27.4s) is the show's held breath; everything else is ramps.
  const blackout = t >= 25 && t < 31 ? 1 - ramp(t, 30, 31) : 0
  return {
    land: ramp(t, 5.5, 9.5),
    borderHeat: t < 33 ? ramp(t, 12, 15.5) : 0.45,
    borderGone: ramp(t, 54.5, 61.5),
    web: ramp(t, 33, 58),
    warmth: ramp(t, 33, 45),
    particles: ramp(t, ANTHEM_AT, ANTHEM_AT + 4),
    opacity: (1 - blackout) * (t >= CREDITS_AT ? 0.35 : 1),
  }
}

export default function NoFearShow({ onClose }: { onClose: () => void }) {
  const { language } = useTranslation()
  const copy = useMemo(() => noFearCopy(language), [language])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<NoFearAudio | null>(null)
  const sceneRef = useRef<NoFearScene | null>(null)
  const startRef = useRef<number>(performance.now())
  const [cueIdx, setCueIdx] = useState(-1)
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

  // Boot: audio (user gesture already happened — the beacon click), scene, clock.
  useEffect(() => {
    const audio = new NoFearAudio()
    audioRef.current = audio
    if (!reducedMotion) audio.start()
    const scene = new NoFearScene()
    sceneRef.current = scene
    const cv = canvasRef.current
    if (cv) {
      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        cv.width = Math.round(cv.clientWidth * dpr)
        cv.height = Math.round(cv.clientHeight * dpr)
        cv.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
        scene.layout(cv.clientWidth, cv.clientHeight)
      }
      fit()
      void scene.load(cv.clientWidth, cv.clientHeight)
      window.addEventListener('resize', fit)
      if (reducedMotion) skipToEnd()
      return () => {
        window.removeEventListener('resize', fit)
        audio.dispose()
      }
    }
    return () => audio.dispose()
  }, [reducedMotion, skipToEnd])

  // The clock: one rAF loop drives the canvas directly and only touches React
  // state on discrete cue changes.
  useEffect(() => {
    let raf = 0
    let lastCue = -1
    const cv = canvasRef.current
    const ctx = cv?.getContext('2d')
    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000
      let idx = -1
      for (let i = 0; i < CUES.length; i++) if (t >= CUES[i].at) idx = i
      if (idx !== lastCue && idx >= 0) {
        lastCue = idx
        const cue = CUES[idx]
        if (cue.act) audioRef.current?.setAct(cue.act)
        setCueIdx(idx)
        if (t >= ANTHEM_AT) setAnthem(true)
        if (t >= CREDITS_AT) setCredits(true)
      }
      if (ctx && cv) sceneRef.current?.draw(ctx, sceneAt(t), t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ESC closes, any key after the credits too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const cue = cueIdx >= 0 ? CUES[cueIdx] : null
  const lineKey = cue?.line ?? null
  const lineText = lineKey ? copy.lines[lineKey] : null
  const hard = !!cue?.hard

  return (
    <div className="fz-overlay" role="dialog" aria-label={copy.beaconTitle}>
      <canvas ref={canvasRef} className="fz-canvas" />

      {/* Red vignette while the borders burn. */}
      {!anthem && cueIdx >= 2 && cueIdx <= 3 && <div className="fz-vignette" aria-hidden />}

      {/* The lines. */}
      {!anthem && lineText && (
        <div className="fz-line-wrap">
          <p key={lineKey} className={`fz-line ${hard ? 'fz-line-hard' : ''}`}>{lineText}</p>
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
          <p className="fz-credit-title">{copy.creditTitle}</p>
          <p className="fz-credit-body">{copy.creditBody}</p>
          <a className="fz-credit-link" href={INSPIRED_URL} target="_blank" rel="noopener noreferrer">
            {copy.inspiredBy}
          </a>
          <button type="button" className="fz-close-btn" onClick={onClose}>{copy.close}</button>
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
