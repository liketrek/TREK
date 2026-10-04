import React from 'react'
import { Hourglass } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { formatDurationShort } from './roadtripModel'
import { STOP_KINDS } from './stopKinds'
import type { RoadtripStopType } from '@trek/shared'

/**
 * The two questions every stop on a drive answers: what kind it is, and how long it
 * takes. One row of pills each, wherever they are asked.
 *
 * The corridor popup asked them first, and the place form asks the same two for a stop
 * added by hand. Two copies of the markup would drift exactly the way the six stop kinds
 * drifted before `stopKinds.ts` gathered them into one table: a pill in one dialog and a
 * disc in the other is the reader's problem, not a detail. So the table is read once and
 * the pills are drawn once.
 */

/** How long to stand still, offered as the few answers anyone actually gives. */
const DWELL_CHOICES = [5, 10, 20, 30, 45, 60]

const CHOSEN = 'border-transparent bg-accent font-semibold text-accent-text'
const UNCHOSEN = 'border-edge text-content-secondary hover:border-content-faint hover:text-content'
/** Unchosen on a grey panel: a white pill on a hairline, like every other pill there. */
const UNCHOSEN_WHITE = 'border-transparent bg-surface-card text-content-secondary shadow-sm ring-1 ring-edge-faint hover:text-content'

/** What both rows take besides their value. */
interface RowOptions {
  className?: string
  /** The id of the caption over the row, which then names it as a group. */
  labelledBy?: string
  /** Unchosen pills white, for a row that sits on a grey panel (the place form's). */
  white?: boolean
}

const groupProps = (labelledBy?: string) => (labelledBy ? { role: 'group', 'aria-labelledby': labelledBy } : {})

/** The row itself. Overridable so a caller whose own label already spaces it can say so. */
const ROW = 'mt-1.5 flex flex-wrap gap-1.5'

export function StopKindChips({ value, onPick, className = ROW, labelledBy, white = false }: RowOptions & {
  value: RoadtripStopType | null
  /** Called with the kind clicked, including the one already chosen. */
  onPick: (kind: RoadtripStopType, wasChosen: boolean) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const unchosen = white ? UNCHOSEN_WHITE : UNCHOSEN
  return (
    <div className={className} {...groupProps(labelledBy)}>
      {STOP_KINDS.map(({ key, labelKey, Icon }) => {
        const on = value === key
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(key, on)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption transition-colors ${
              on ? CHOSEN : unchosen
            }`}
          >
            <Icon size={12} aria-hidden />
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}

export function StopStayChips({ value, onPick, className = ROW, labelledBy, white = false }: RowOptions & {
  value: number
  onPick: (minutes: number) => void
}): React.ReactElement {
  const unchosen = white ? UNCHOSEN_WHITE : UNCHOSEN
  return (
    <div className={className} {...groupProps(labelledBy)}>
      {DWELL_CHOICES.map(minutes => (
        <button
          key={minutes}
          type="button"
          aria-pressed={value === minutes}
          onClick={() => onPick(minutes)}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption tabular-nums transition-colors ${
            value === minutes ? CHOSEN : unchosen
          }`}
        >
          <Hourglass size={11} aria-hidden />
          {formatDurationShort(minutes * 60)}
        </button>
      ))}
    </div>
  )
}
