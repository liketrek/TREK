import { useState } from 'react'
import { PAGE_MAX_MM, PAGE_MIN_MM } from './pagePresets'

/**
 * One side of the trim size.
 *
 * ── Why it holds a draft ─────────────────────────────────────────────────
 *
 * The value goes through `clampPageSize` on the way in, and it used to do so on
 * every keystroke: typing 500 meant the field saw 5, clamped it to the minimum
 * and wrote that back under the cursor, so the number could not be typed at
 * all — only nudged with the arrows. So while a number is being typed the field
 * keeps what was typed, and the document only hears about values it can use.
 *
 * The arrows still work as before, because a value they produce is already in
 * range and is committed the moment it appears. Leaving the field commits what
 * is there, clamped — someone who typed 5 and clicked away meant the smallest
 * book, not the one they had.
 */
export function TrimField({
  label, value, onCommit,
}: {
  label: string
  value: number
  onCommit: (mm: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(Math.round(value * 10) / 10)

  const settle = () => {
    if (draft === null) return
    const n = Number(draft)
    if (draft.trim() !== '' && Number.isFinite(n)) onCommit(n)
    setDraft(null)
  }

  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={shown}
        min={PAGE_MIN_MM}
        max={PAGE_MAX_MM}
        step={1}
        onChange={e => {
          const raw = e.target.value
          setDraft(raw)
          // Anything already usable goes straight through, so the arrows and a
          // fully typed number both take effect without waiting for a blur.
          const n = Number(raw)
          if (raw !== '' && Number.isFinite(n) && n >= PAGE_MIN_MM && n <= PAGE_MAX_MM) {
            setDraft(null)
            onCommit(n)
          }
        }}
        onBlur={settle}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') setDraft(null)
        }}
      />
    </label>
  )
}
