import { useId, useState } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import { dayDate } from '../../utils/dayLabel'
import type { DayAddControls } from '../../utils/dayAdd'

interface DayAddFooterProps {
  /** Without it, or on a trip without dates, the footer keeps its single "Add day" button. */
  dayAdd?: DayAddControls
  onAddDay: () => void
  onClose: () => void
  t: (key: string, params?: Record<string, string | number>) => string
  locale: string
}

/** One button size for the whole foot of the reorder dialog, the delete question's included. */
export const FOOTER_BTN =
  'inline-flex min-h-9 flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-body font-medium transition-colors disabled:cursor-default disabled:opacity-40'
/** Cancel, Close and the quiet add: one outline, one text colour, so none of them looks switched off beside another. */
export const SECONDARY_BTN = `${FOOTER_BTN} border border-edge text-content-secondary hover:bg-surface-hover hover:text-content disabled:hover:bg-transparent`
const CLOSE_BTN = `${SECONDARY_BTN} ml-auto`
/** The add that matters most: drawn in the accent, not filled with it, so it leads without weighing on the row. */
const MAIN_BTN = `${FOOTER_BTN} border border-accent-on bg-transparent font-semibold text-accent-on hover:bg-accent-subtle disabled:hover:bg-transparent`

/**
 * The foot of the reorder dialog: close it, or add a day.
 *
 * On a trip with dates there are two ways to add one, in one row with Close. The
 * next calendar day, named on its button, extends the trip by one; a day without
 * a date goes to the end and leaves the trip dates alone. The line above them
 * says what the button in view does, and switches while the pointer or the focus
 * rests on the other one. When no day can be added it says why instead.
 */
export function DayAddFooter({ dayAdd, onAddDay, onClose, t, locale }: DayAddFooterProps) {
  const [aboutUndated, setAboutUndated] = useState(false)
  const hintId = useId()
  const busy = dayAdd?.busy ?? false
  const blocked = dayAdd?.blocked ?? null
  const addOff = busy || !!blocked

  const closeButton = (
    <button type="button" onClick={onClose} className={CLOSE_BTN}>
      {t('common.close')}
    </button>
  )

  if (!dayAdd?.nextDate) {
    return (
      <div className="flex flex-col gap-2.5">
        {blocked && <p className="m-0 text-caption text-content-muted">{blocked}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onAddDay} disabled={addOff} className={MAIN_BTN}>
            <Plus size={15} strokeWidth={2} aria-hidden="true" />
            {t('dayplan.addDay')}
          </button>
          {closeButton}
        </div>
      </div>
    )
  }

  const date = dayDate(dayAdd.nextDate, locale) ?? dayAdd.nextDate
  const hint = blocked
    ?? (aboutUndated ? t('dayplan.addUndatedDayHint') : dayAdd.datedBlocked ?? t('dayplan.addDatedDayHint', { date }))
  const pointAtUndated = {
    onMouseEnter: () => setAboutUndated(true),
    onMouseLeave: () => setAboutUndated(false),
    onFocus: () => setAboutUndated(true),
    onBlur: () => setAboutUndated(false),
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p id={hintId} aria-live="polite" className="m-0 text-caption text-content-muted">
        {hint}
      </p>
      {/* Should a language run long, the row wraps between buttons, never inside one. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={dayAdd.onAddDated}
          disabled={addOff || !!dayAdd.datedBlocked}
          aria-describedby={hintId}
          className={MAIN_BTN}
        >
          <CalendarPlus size={15} strokeWidth={2} aria-hidden="true" />
          {t('dayplan.addDatedDay', { date })}
        </button>
        <button
          type="button"
          onClick={onAddDay}
          disabled={addOff}
          aria-describedby={hintId}
          className={SECONDARY_BTN}
          {...pointAtUndated}
        >
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          {t('dayplan.addUndatedDay')}
        </button>
        {closeButton}
      </div>
    </div>
  )
}
