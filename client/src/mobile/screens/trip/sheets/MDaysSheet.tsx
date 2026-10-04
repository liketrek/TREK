import { CalendarPlus, CalendarRange, Plus, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { ReorderStack } from '../plan/MPlanTimelineRows'
import { INNER_CLS, TileHeader } from './MTripSheetUi'
import { useTranslation } from '../../../../i18n'
import { dayDate, dayLabel } from '../../../../utils/dayLabel'
import type { MTripSheetsProps } from '../MTripShell'

/** A 44px pill, the tap size of the sheet's other actions; the label never wraps, the row does. */
const PILL = 'inline-flex h-11 flex-1 basis-auto items-center justify-center gap-[6px] whitespace-nowrap rounded-full px-4 text-[0.8125rem] font-semibold disabled:opacity-40'
const PILL_MAIN = `${PILL} bg-m-act text-m-actfg`
const PILL_QUIET = `${PILL} border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink`

/**
 * Day management sheet ('days'): move whole days up/down, add a day or delete
 * one, the mobile counterpart of the desktop DayReorderPopup and button-based
 * like the rest of the touch reordering (#1432). A day's places, notes and
 * bookings move with it (store handles that optimistically). Delete only asks;
 * the confirm sheet with what goes with the day is MTripSheets'.
 *
 * Adding sits under the list and stays in reach while the list scrolls: on a
 * trip with dates the next date, which extends the trip, and a day without a
 * date, with one line above them saying what the dated one does. The dated
 * pill shows only its date beside the calendar icon, so both pills stand side
 * by side in every language; its accessible name keeps the whole action.
 */
export default function MDaysSheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'days'
  const canEditDays = planner.can('day_edit', planner.trip)
  const ordered = [...planner.days].sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
  const deleteBlocked = planner.deleteDayBlocked
  const { dayAdd } = planner
  const addOff = dayAdd.busy || !!dayAdd.blocked
  const date = dayAdd.nextDate ? dayDate(dayAdd.nextDate, locale) ?? dayAdd.nextDate : null
  // The lines above the buttons: why a day cannot be deleted, and what the
  // dated button does or why adding is off. Offline both say the same
  // sentence; it is shown once.
  const addLine = dayAdd.blocked ?? (date ? dayAdd.datedBlocked ?? t('dayplan.addDatedDayHint', { date }) : null)
  const captions = [deleteBlocked, addLine].filter((n, i, all): n is string => !!n && all.indexOf(n) === i)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ordered.length || from === to) return
    const ids = ordered.map(d => d.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    planner.handleReorderDays(ids)
  }

  return (
    <MSheet open={open} onClose={shell.closeSheet} variant="card" material="glass" ariaLabel={t('dayplan.reorderTitle')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<CalendarRange size={19} strokeWidth={1.8} />}
          title={t('dayplan.reorderTitle')}
          sub={t('dayplan.reorderHint')}
          subWrap
          onClose={shell.closeSheet}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[14px] pt-[14px]">
        <div className="flex flex-col gap-[6px]">
          {ordered.map((day, i) => (
            <div key={day.id} className={`flex items-center gap-[10px] rounded-[13px] px-[11px] py-[7px] ${INNER_CLS}`}>
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] font-geist text-[0.65625rem] font-bold text-m-muted">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold">{dayLabel(day, i, t, locale)}</span>
              {canEditDays && (
                <ReorderStack
                  onUp={() => move(i, i - 1)}
                  onDown={() => move(i, i + 1)}
                  canUp={i > 0}
                  canDown={i < ordered.length - 1}
                  t={t}
                />
              )}
              {canEditDays && (
                <button
                  type="button"
                  onClick={() => planner.handleDeleteDay(day.id)}
                  disabled={!!deleteBlocked}
                  aria-label={t('dayplan.deleteDay')}
                  title={deleteBlocked ?? undefined}
                  // 30px to the eye, 44px to the finger: the pseudo-element widens the hit area to the row's height.
                  className="relative flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted after:absolute after:-inset-[7px] active:text-[color:var(--m-st-danger)] disabled:opacity-30"
                >
                  <Trash2 size={13} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {canEditDays && (
        <div className="flex-none border-t border-[color:var(--m-rowbr)] px-[18px] pb-[16px] pt-[10px]">
          {captions.map(line => (
            <p key={line} className="mb-[8px] text-[0.6875rem] leading-snug text-m-muted">{line}</p>
          ))}
          <div className="flex flex-wrap gap-[8px]">
            {date ? (
              <>
                <button
                  type="button"
                  onClick={dayAdd.onAddDated}
                  disabled={addOff || !!dayAdd.datedBlocked}
                  aria-label={t('dayplan.addDatedDay', { date })}
                  className={PILL_MAIN}
                >
                  <CalendarPlus size={15} strokeWidth={2.2} aria-hidden="true" />
                  {date}
                </button>
                <button type="button" onClick={() => planner.handleAddDay()} disabled={addOff} className={PILL_QUIET}>
                  <Plus size={15} strokeWidth={2.2} />
                  {t('dayplan.addUndatedDay')}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => planner.handleAddDay()} disabled={addOff} className={PILL_MAIN}>
                <Plus size={15} strokeWidth={2.2} />
                {t('dayplan.addDay')}
              </button>
            )}
          </div>
        </div>
      )}
    </MSheet>
  )
}
