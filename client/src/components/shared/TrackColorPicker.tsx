import { useEffect, useRef } from 'react'
import { Pipette, RotateCcw } from 'lucide-react'
import { TRACK_COLORS } from '@trek/shared'
import { useTranslation } from '../../i18n'

interface TrackColorPickerProps {
  /** The picked colour, or null while the track still inherits one. */
  value: string | null
  /** What the track is drawn in when nothing is picked — shown in the auto cell. */
  inheritedColor: string
  onChange: (color: string | null) => void
}

/**
 * Swatch row for a GPX track's line colour (#776).
 *
 * First cell resets to the inherited colour, then the shared palette, then a
 * native picker for anything else. Selection is drawn with `--accent` so the
 * row follows whatever accent the user runs rather than pinning one hue.
 */
export default function TrackColorPicker({ value, inheritedColor, onChange }: TrackColorPickerProps) {
  const { t } = useTranslation()
  const customInputRef = useRef<HTMLInputElement>(null)
  const isPreset = value !== null && (TRACK_COLORS as readonly string[]).includes(value)
  const selected = 'outline outline-2 outline-[var(--accent)] outline-offset-2 scale-110'

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Native `change`, deliberately not React's onChange — see the input below.
  useEffect(() => {
    const input = customInputRef.current
    if (!input) return
    const commit = () => onChangeRef.current(input.value)
    input.addEventListener('change', commit)
    return () => input.removeEventListener('change', commit)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        aria-label={t('inspector.trackColorAuto')}
        title={t('inspector.trackColorAuto')}
        className={`w-7 h-7 rounded-full grid place-items-center border-2 border-dashed transition-transform duration-150 hover:scale-110 motion-reduce:hover:scale-100 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
          value === null ? `border-solid border-transparent ${selected}` : 'border-edge-secondary hover:border-edge'
        }`}
        // A tint of the inherited colour so it is obvious what "auto" would give you.
        style={{ backgroundColor: `color-mix(in srgb, ${inheritedColor} 25%, transparent)` }}
      >
        <RotateCcw size={12} className="text-content-muted" />
      </button>

      {TRACK_COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-pressed={value === color}
          aria-label={color}
          title={color}
          className={`w-7 h-7 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15 transition-transform duration-150 hover:scale-110 motion-reduce:hover:scale-100 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
            value === color ? selected : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}

      {/* No React onChange here: for a colour input React maps it to the native
          `input` event, which fires on every drag inside the OS picker — dozens
          of PUTs, each one a 409 candidate against the base-version header. The
          native `change` event fires once, when the picker closes. */}
      <input
        ref={customInputRef}
        type="color"
        defaultValue={value ?? inheritedColor}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => {
          const input = customInputRef.current
          if (!input) return
          // Uncontrolled input, so seed it with the current colour before opening
          // — otherwise the OS picker starts from whatever it was last mounted with.
          input.value = value ?? inheritedColor
          input.click()
        }}
        aria-label={t('inspector.trackColorCustom')}
        title={t('inspector.trackColorCustom')}
        className={`w-7 h-7 rounded-full grid place-items-center border-2 transition-transform duration-150 hover:scale-110 motion-reduce:hover:scale-100 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
          value !== null && !isPreset ? `border-transparent ${selected}` : 'border-dashed border-edge-secondary hover:border-edge'
        }`}
        style={value !== null && !isPreset ? { backgroundColor: value } : undefined}
      >
        {(value === null || isPreset) && <Pipette size={12} className="text-content-muted" />}
      </button>
    </div>
  )
}
