import { Ban } from 'lucide-react'
import { NOTE_COLORS } from '@trek/shared'
import { useTranslation } from '../../i18n'

interface Props {
  /** The picked colour, or null for the neutral card. */
  value: string | null
  onChange: (color: string | null) => void
}

/**
 * Swatch row for a note's colour (#1629).
 *
 * The palette is deliberately short and lives in @trek/shared, so the picker,
 * the card and the PDF cannot drift apart. The first cell clears the colour
 * rather than being a colour of its own — "no colour" is the default state, not
 * an eighth option.
 */
export default function NoteColorPicker({ value, onChange }: Props) {
  const { t } = useTranslation()
  const selected = 'outline outline-2 outline-[var(--accent)] outline-offset-2 scale-110'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        aria-label={t('notes.color.none')}
        title={t('notes.color.none')}
        className={`w-7 h-7 rounded-full grid place-items-center border-2 border-dashed transition-transform duration-150 hover:scale-110 motion-reduce:hover:scale-100 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
          value === null ? `border-solid border-transparent bg-surface-hover ${selected}` : 'border-edge-secondary hover:border-edge'
        }`}
      >
        <Ban size={12} className="text-content-faint" />
      </button>

      {NOTE_COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-pressed={value === color}
          aria-label={t(`notes.color.${COLOR_NAMES[color]}`)}
          title={t(`notes.color.${COLOR_NAMES[color]}`)}
          className={`w-7 h-7 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15 transition-transform duration-150 hover:scale-110 motion-reduce:hover:scale-100 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
            value === color ? selected : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

/** Names rather than hex codes in the label, so a screen reader says something useful. */
const COLOR_NAMES: Record<string, string> = {
  '#dc2626': 'red',
  '#ea580c': 'orange',
  '#d97706': 'amber',
  '#16a34a': 'green',
  '#0891b2': 'cyan',
  '#2563eb': 'blue',
  '#9333ea': 'purple',
}
