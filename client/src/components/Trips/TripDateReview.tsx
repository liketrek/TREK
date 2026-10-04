import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n'
import DayImpactList from '../shared/DayImpactList'
import { dayChips, shrinkTripLines, type ShiftMode } from '../../utils/dayImpactLines'
import type { RangeCheck } from '../../hooks/useTripRangeGuard'

interface TripDateReviewProps {
  /** The start of a dated trip moved: ask how bookings follow (#1288). */
  askShift: boolean
  shiftMode: ShiftMode
  onShiftMode: (mode: ShiftMode) => void
  /** What the new dates remove, if anything worth a word. */
  removal: RangeCheck
  error?: string
}

/**
 * Whether the step shows both of its parts. Then they stand side by side in a wide
 * dialog, the question on the left and the removed days on the right, instead of one
 * long column that has to be scrolled through before the buttons.
 */
export function dateReviewIsWide(askShift: boolean, removal: RangeCheck): boolean {
  return askShift && !!removal && removal !== 'unknown'
}

/**
 * The step the trip dialog puts between a change of dates and the save: how
 * bookings follow a moved start, and which days the new range removes with what
 * is on them. Either part can stand alone. The list's booking hint follows the
 * shift mode picked beside it, because the two modes leave those bookings in
 * different places.
 */
export default function TripDateReview({ askShift, shiftMode, onShiftMode, removal, error }: TripDateReviewProps) {
  const { t } = useTranslation()
  const modes: { mode: ShiftMode; label: string; desc: string }[] = [
    { mode: 'keep_bookings', label: t('dashboard.dateShiftKeepBookings'), desc: t('dashboard.dateShiftKeepBookingsDesc') },
    { mode: 'shift_all', label: t('dashboard.dateShiftAll'), desc: t('dashboard.dateShiftAllDesc') },
  ]

  const wide = dateReviewIsWide(askShift, removal)

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-danger-soft border border-danger/30 rounded-xl text-body text-danger">{error}</div>
      )}
      <div className={wide ? 'grid gap-5 md:grid-cols-2' : 'space-y-3'}>
      {askShift && (
        <div className="space-y-3">
          <p className="text-body text-content-secondary">{t('dashboard.dateShiftIntro')}</p>
          {modes.map(({ mode, label, desc }) => (
            <label key={mode}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${shiftMode === mode ? 'border-accent bg-surface-selected' : 'border-edge hover:bg-surface-hover'}`}>
              <input type="radio" name="date_shift_mode" value={mode} checked={shiftMode === mode}
                onChange={() => onShiftMode(mode)} className="mt-1 accent-[var(--accent)]" />
              <span className="block text-body font-medium leading-snug text-content">
                {label}
                <span className="mt-0.5 block text-caption font-normal text-content-muted text-pretty">{desc}</span>
              </span>
            </label>
          ))}
          <p className="text-caption text-content-muted">{t('dashboard.dateShiftHint')}</p>
        </div>
      )}
      {removal === 'unknown' && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-edge-faint bg-surface-secondary p-3">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" />
          </span>
          <p className="text-body text-content">{t('dashboard.shrinkUnknown')}</p>
        </div>
      )}
      {removal && removal !== 'unknown' && (
        // Beside the question on a wide screen, below it on a narrow one.
        <div className={wide ? 'border-t border-edge-faint pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0' : ''}>
          <p className="text-body text-content-secondary">{t('dashboard.shrinkIntro')}</p>
          <DayImpactList
            lines={shrinkTripLines(removal, t, shiftMode)}
            days={dayChips(removal.dayLabels, t)}
            label={t('dashboard.shrinkTitle')}
          />
        </div>
      )}
      </div>
    </div>
  )
}
