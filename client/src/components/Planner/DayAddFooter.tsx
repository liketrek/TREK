import { useId, useState } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import { DialogButton, FooterSpacer, fs } from '../shared/DialogShell'
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

/**
 * The bar of a dialog with a line over its buttons. DialogFooter is one row;
 * this is the same bar (border, inset) holding the line and the row under it.
 */
const FOOTER_COLUMN = 'flex flex-none flex-col gap-2.5 border-t border-edge-faint px-6 py-3.5'
const HINT = 'm-0 text-content-muted'
/** Should a language run long, the row wraps between buttons, never inside one. */
const ROW = 'flex flex-wrap items-center gap-2'

/**
 * The foot of the reorder dialog: close it, or add a day.
 *
 * On a trip with dates there are two ways to add one. The next calendar day,
 * named on its button, extends the trip by one; a day without a date goes to
 * the end and leaves the trip dates alone. The line above them says what the
 * button in view does, and switches while the pointer or the focus rests on
 * the other one. When no day can be added it says why instead.
 */
export function DayAddFooter({ dayAdd, onAddDay, onClose, t, locale }: DayAddFooterProps) {
  const [aboutUndated, setAboutUndated] = useState(false)
  const hintId = useId()
  const busy = dayAdd?.busy ?? false
  const blocked = dayAdd?.blocked ?? null
  const addOff = busy || !!blocked

  const closeButton = <DialogButton onClick={onClose}>{t('common.close')}</DialogButton>

  if (!dayAdd?.nextDate) {
    return (
      <footer className={FOOTER_COLUMN}>
        {blocked && <p className={HINT} style={fs(12)}>{blocked}</p>}
        <div className={ROW}>
          <FooterSpacer />
          {closeButton}
          <DialogButton variant="primary" onClick={onAddDay} disabled={addOff} icon={<Plus size={14} strokeWidth={2} aria-hidden="true" />}>
            {t('dayplan.addDay')}
          </DialogButton>
        </div>
      </footer>
    )
  }

  const date = dayDate(dayAdd.nextDate, locale) ?? dayAdd.nextDate
  const hint = blocked
    ?? (aboutUndated ? t('dayplan.addUndatedDayHint') : dayAdd.datedBlocked ?? t('dayplan.addDatedDayHint', { date }))

  return (
    <footer className={FOOTER_COLUMN}>
      <p id={hintId} aria-live="polite" className={HINT} style={fs(12)}>
        {hint}
      </p>
      <div className={ROW}>
        <DialogButton
          onClick={onAddDay}
          disabled={addOff}
          aria-describedby={hintId}
          icon={<Plus size={14} strokeWidth={2} aria-hidden="true" />}
          onMouseEnter={() => setAboutUndated(true)}
          onMouseLeave={() => setAboutUndated(false)}
          onFocus={() => setAboutUndated(true)}
          onBlur={() => setAboutUndated(false)}
        >
          {t('dayplan.addUndatedDay')}
        </DialogButton>
        <FooterSpacer />
        {closeButton}
        <DialogButton
          variant="primary"
          onClick={dayAdd.onAddDated}
          disabled={addOff || !!dayAdd.datedBlocked}
          aria-describedby={hintId}
          icon={<CalendarPlus size={14} strokeWidth={2} aria-hidden="true" />}
        >
          {t('dayplan.addDatedDay', { date })}
        </DialogButton>
      </div>
    </footer>
  )
}
