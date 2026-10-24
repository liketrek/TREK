import { useRef } from 'react'
import { BookOpen, History, Image } from 'lucide-react'
import { useStudioPalette } from './paint/paletteModel'
import '../../styles/studio-paint.css'

/**
 * The colour picker, shared by everything in the inspector that has a colour.
 *
 * Its own file because both the plain elements and the travel elements need it,
 * and the second copy of a swatch row is how two parts of one panel end up
 * offering different palettes.
 *
 * The palette is print ink rather than app chrome — it does not follow the
 * user's theme, because a book is printed once and read on paper, where an
 * accent chosen for a dark interface means nothing.
 *
 * Under the fixed inks sit up to three short rows from the open book
 * (paint/StudioPalette.tsx): the colours the book already uses, the colours
 * of the photos on this page, and what this person picked lately. Each row
 * is there only when it has something in it, so a new book shows the inks
 * alone, as before.
 */

const SWATCHES = [
  '#111111', '#ffffff', '#8a8578',
  '#c2410c', '#b45309', '#0f766e',
  '#1e3a8a', '#9f1239', '#4c1d95',
]

function Swatch({ color, on, onPick }: { color: string; on: boolean; onPick: (c: string) => void }) {
  return (
    <button type="button"
      className={`st-swatch ${on ? 'is-on' : ''}`}
      style={{ background: color }} // theme-lint-disable: a colour picker shows the colours themselves
      onClick={() => onPick(color)}
      aria-label={color}
      aria-pressed={on}
    />
  )
}

export function Swatches({ value, onPick, alpha, onAlpha, rows = true }: {
  value: string
  onPick: (c: string) => void
  /** With `onAlpha`, an opacity slider under the swatches, 0 to 1. */
  alpha?: number
  /** `done` is false while the slider is dragged and true when it is let go. */
  onAlpha?: (a: number, done: boolean) => void
  /** The book, photo and recent rows; off where only the fixed inks make sense. */
  rows?: boolean
}) {
  const palette = useStudioPalette()
  const current = value.toLowerCase()
  // The wheel reports every colour it passes through; only the one it stops on is worth remembering.
  const wheel = useRef<string | null>(null)
  const pick = (c: string) => {
    palette?.remember(c)
    onPick(c)
  }

  const groups = rows && palette
    ? ([
        ['book', BookOpen, palette.book],
        ['photos', Image, palette.photos],
        ['recent', History, palette.recent],
      ] as const).filter(([, , list]) => list.length > 0)
    : []

  return (
    <div className="st-swatch-stack">
      <div className="st-swatches">
        {SWATCHES.map(c => <Swatch key={c} color={c} on={current === c} onPick={pick} />)}
        {/* Anything at all, for a book that has to match a cover or a brand. */}
        <label className="st-swatch st-swatch-custom">
          {/* Named by the colour it holds, the way the preset swatches above are. */}
          <input
            type="color"
            aria-label={value}
            value={value}
            onChange={e => { wheel.current = e.target.value; onPick(e.target.value) }}
            onBlur={() => { if (wheel.current) palette?.remember(wheel.current); wheel.current = null }}
          />
        </label>
      </div>

      {groups.map(([key, Icon, list]) => (
        <div key={key} className="st-swatch-row" role="group" aria-label={palette?.labels[key]}>
          <span className="st-swatch-row-icon" title={palette?.labels[key]} aria-hidden>
            <Icon size={12} strokeWidth={2} />
          </span>
          <div className="st-swatches">
            {list.map(c => <Swatch key={c} color={c} on={current === c} onPick={pick} />)}
          </div>
        </div>
      ))}

      {onAlpha && <AlphaSlider color={value} value={alpha ?? 1} onChange={onAlpha} label={palette?.labels.opacity} />}
    </div>
  )
}

/**
 * How opaque the colour is, as a slider over the colour itself.
 *
 * The track runs from nothing to the full colour over a chequerboard, so the
 * slider shows what it does rather than needing a label to explain it, and
 * the figure beside it says the exact value for anyone matching a reference.
 */
export function AlphaSlider({ color, value, onChange, label }: {
  color: string
  value: number
  onChange: (a: number, done: boolean) => void
  /** The slider's accessible name, in the reader's language. */
  label?: string
}) {
  const pct = Math.round(value * 100)
  // What the slider was last moved to: a controlled input may still show the old value when it is let go.
  const moved = useRef(value)
  // Whether it moved since the last commit: a key let go on it (the Tab that brought the focus) is no change.
  const dirty = useRef(false)
  const move = (raw: string) => {
    moved.current = Math.max(0, Math.min(100, Number(raw))) / 100
    dirty.current = true
    onChange(moved.current, false)
  }
  const finish = () => {
    if (!dirty.current) return
    dirty.current = false
    onChange(moved.current, true)
  }
  return (
    <div className="st-alpha">
      <div className="st-alpha-track" style={{ ['--st-alpha-colour' as string]: color }}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          aria-label={label}
          onPointerDown={() => { moved.current = value }}
          onKeyDown={() => { moved.current = value }}
          onChange={e => move(e.target.value)}
          onPointerUp={finish}
          onKeyUp={finish}
          onBlur={finish}
        />
      </div>
      <span className="st-alpha-value">{pct}%</span>
    </div>
  )
}
