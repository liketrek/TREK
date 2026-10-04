import { CalendarMinus } from 'lucide-react'
import type { ImpactLine, ImpactTone } from '../../utils/dayImpactLines'

/** The class names one shell draws the list with. */
export interface ImpactListSkin {
  list: string
  row: string
  /** Between two rows; the desktop card divides them itself. */
  divider: string
  chip: string
  /** One removed day, named in the row above the content rows. */
  dayChip: string
  iconSize: number
  text: string
  hint: string
  chipTone: Record<ImpactTone, string>
  textTone: Record<ImpactTone, string>
  /** The whole row per tone: a cancelled stay is tinted from edge to edge, not only in its text. */
  rowTone: Record<ImpactTone, string>
  /** A day with nothing on it: one quiet line instead of a card. */
  plain: string
  plainIcon: string
}

const DESKTOP: ImpactListSkin = {
  list: 'mt-3 overflow-hidden rounded-xl border border-edge-faint divide-y divide-edge-faint',
  row: 'flex items-start gap-2.5 px-3 py-2',
  divider: '',
  chip: 'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
  dayChip: 'rounded-full border border-edge-faint bg-surface-secondary px-2 py-px text-caption font-medium text-content-secondary',
  iconSize: 14,
  text: 'text-body font-medium leading-snug text-pretty',
  hint: 'mt-px text-caption leading-snug text-content-muted text-pretty',
  chipTone: {
    neutral: 'bg-surface-secondary text-content-muted',
    muted: 'bg-surface-secondary text-content-faint',
    warning: 'bg-warning-soft text-warning',
    // The row itself is tinted already; a card-coloured chip stands out on it in both themes.
    danger: 'bg-surface-card text-danger',
  },
  textTone: { neutral: 'text-content', muted: 'text-content-muted', warning: 'text-content', danger: 'text-danger' },
  rowTone: { neutral: '', muted: '', warning: '', danger: 'bg-danger-soft' },
  plain: 'mt-3 flex items-center gap-2 rounded-xl bg-surface-secondary px-3 py-2.5 text-body text-content-muted',
  plainIcon: 'flex-shrink-0 text-content-faint',
}

interface DayImpactListProps {
  lines: ImpactLine[]
  /**
   * The days themselves, as chips in a first row: when several days go at
   * once, the list names them before it says what is on them.
   */
  days?: string[]
  /** Names the list for assistive tech; the dialog title usually says it already. */
  label?: string
  /** The phone passes its own; the default is the desktop card. */
  skin?: ImpactListSkin
}

/**
 * What goes with the days being removed, one row per kind of content: an icon
 * chip in the row's tone, the count, and a caption saying what happens to it.
 * The rows come ready made from utils/dayImpactLines, and the look comes from a
 * skin, so the desktop dialog and the phone sheet share this markup and differ
 * only in their tokens. A day with nothing on it gets one plain line.
 */
export default function DayImpactList({ lines, days = [], label, skin = DESKTOP }: DayImpactListProps) {
  if (lines.length === 0) return null
  const offset = days.length > 0 ? 1 : 0
  if (offset === 0 && lines.length === 1 && lines[0].tone === 'muted') {
    const { key, icon: Icon, text } = lines[0]
    return (
      <ul aria-label={label} className="m-0 list-none p-0">
        <li data-tone="muted" data-kind={key} className={skin.plain}>
          <Icon size={skin.iconSize + 1} strokeWidth={2} aria-hidden="true" className={skin.plainIcon} />
          <span className="min-w-0">{text}</span>
        </li>
      </ul>
    )
  }
  return (
    <ul aria-label={label} className={skin.list}>
      {offset > 0 && (
        <li data-kind="days" className={skin.row}>
          <span className={`${skin.chip} ${skin.chipTone.warning}`}>
            <CalendarMinus size={skin.iconSize} strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 self-center">
            {days.map((name, i) => <span key={`${i}-${name}`} className={skin.dayChip}>{name}</span>)}
          </div>
        </li>
      )}
      {lines.map(({ key, icon: Icon, text, hint, tone }, i) => (
        <li key={key} data-tone={tone} className={`${skin.row} ${skin.rowTone[tone]} ${i + offset > 0 ? skin.divider : ''}`.trim()}>
          <span className={`${skin.chip} ${skin.chipTone[tone]}`}>
            <Icon size={skin.iconSize} strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 self-center">
            <p className={`${skin.text} ${skin.textTone[tone]}`}>{text}</p>
            {hint && <p className={skin.hint}>{hint}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
