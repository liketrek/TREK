import React, { useEffect, useId } from 'react'
import { AlertTriangle, Hourglass, Minus, Plus, ArrowRight } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDurationShort } from './roadtripModel'
import { formatClockTime } from '../../utils/formatters'
import { useLeaveMode, type LeaveMode } from './useLeaveMode'
import { STAY_MAX as MAX, STAY_PRESETS as PRESETS, STAY_STEP as STEP, useStayDraft } from './useStayDraft'

/** The stop being given a length. */
export interface StayDraft {
  placeId: number
  name: string
  minutes: number | null
  /** When the drive gets here, so the dialog can show what the stay pushes back. */
  arrival?: string | null
  /** When the schedule has it leave again. */
  departure?: string | null
  /** The time the visit is set to be left at, which makes the stay rather than taking one. */
  leaveAt?: string | null
  /** How many minutes after that time the drive gets here, when the schedule found it cannot make it. */
  missedBy?: number | null
  assignmentId?: number
  /** The day the visit is stored on. */
  dayId?: number
}

interface RoadtripStayModalProps {
  stop: StayDraft | null
  onClose: () => void
  /** Zero clears it: the rail reads "no stay" and "nothing planned" as the same thing. */
  onSave: (placeId: number, minutes: number) => Promise<void> | void
}

/** The round minus and plus beside the number. */
const STEP_BUTTON = 'grid h-9 w-9 place-items-center rounded-full bg-surface-card text-content-secondary shadow-sm transition-colors hover:text-content disabled:opacity-30'

/** The slider's own track and thumb, drawn from tokens so both themes get it right. */
const SLIDER = [
  'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-tertiary',
  '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-card',
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg-card)]',
  '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:border-0',
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent',
].join(' ')

/**
 * How long the traveller stays at one stop.
 *
 * A road-trip idea rather than a property of the place: it is what pushes every later
 * arrival back, so it belongs beside the drive times rather than in the place form, which
 * is why this opens from the rail and nowhere else.
 *
 * Built around the number instead of around a field. The chosen length is the largest
 * thing on screen and updates as the slider moves, and under it the dialog answers the
 * question the number is actually being chosen for: given when the drive arrives, when
 * does it leave again. Typing minutes into a box could never show that.
 *
 * The value is `places.duration_minutes`, which the schedule has read for years and
 * nothing has ever been able to write. Cleared as a zero rather than a null, because the
 * update statement folds a null into "leave it alone" — a null could give a stop a stay
 * but never take one away.
 */
export default function RoadtripStayModal({ stop, onClose, onSave }: RoadtripStayModalProps): React.ReactElement | null {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  // What the stay does to the day, worked out live: the arrival is fixed by the drive,
  // the departure is the only thing this dialog moves.
  const { minutes, setMinutes, saving, setSaving, nudge, preview: times } = useStayDraft({
    arrival: stop?.arrival, is12h, initial: 0, wholeMinutes: false,
  })
  const leave = useLeaveMode(stop)
  const labelId = useId()

  // Reopened on a different stop, so it starts from that stop's own value rather than
  // from whatever the last one was left on.
  useEffect(() => { setMinutes(stop?.minutes ?? 0) }, [stop, setMinutes])

  if (!stop) return null
  if (leave.until) return <LeaveTime stop={stop} leave={leave} until={leave.until} is12h={is12h} onClose={onClose} />

  const commit = async (value: number) => {
    if (saving) return
    setSaving(true)
    try {
      await onSave(stop.placeId, value)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      header={<StayHeader labelId={labelId} name={stop.name} onClose={onClose} />}
      footer={(
        <DialogFooter>
          {/* Removing is the same write as setting one, so it sits with the other actions
              rather than behind a confirmation. */}
          <DialogButton disabled={saving || !stop.minutes} onClick={() => void commit(0)}>
            {t('roadtrip.stay.none')}
          </DialogButton>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" disabled={saving} onClick={() => void commit(minutes)}>
            {t('common.save')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      {/* The number, the way a timer shows one. Minus and plus flank it so a value can
          be nudged without hunting for the slider's thumb. */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-edge-faint bg-surface-secondary px-4 pb-4 pt-5">
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => nudge(-STEP)} disabled={minutes === 0} aria-label={`-${STEP}`} className={STEP_BUTTON}>
            <Minus size={15} aria-hidden />
          </button>
          <span
            aria-live="polite"
            className="min-w-[8rem] text-center font-bold tabular-nums tracking-[-0.02em] text-content"
            style={fs(28, 'subtitle')}
          >
            {minutes > 0 ? formatDurationShort(minutes * 60) : t('roadtrip.stay.none')}
          </span>
          <button type="button" onClick={() => nudge(STEP)} disabled={minutes >= MAX} aria-label={`+${STEP}`} className={STEP_BUTTON}>
            <Plus size={15} aria-hidden />
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={MAX}
          step={STEP}
          value={minutes}
          onChange={e => setMinutes(Number(e.target.value))}
          aria-label={t('roadtrip.stay.custom')}
          className={SLIDER}
        />
        <div className="flex flex-wrap justify-center gap-1.5">
          {PRESETS.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setMinutes(value)}
              aria-pressed={minutes === value}
              className={`rounded-full px-3 py-1 font-semibold tabular-nums transition-colors ${
                minutes === value ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-secondary shadow-sm hover:text-content'
              }`}
              style={fs(11.5, 'body')}
            >
              {formatDurationShort(value * 60)}
            </button>
          ))}
        </div>
      </div>

      {/* What the stay costs the rest of the day. The arrival cannot move (the drive
          decides it), so the arrow points at the one end this dialog does move. */}
      {times ? <ArriveLeave arrive={times.arrive} leave={times.leave} carry={times.carry} /> : null}
    </DialogShell>
  )
}

/** The head band both shapes of the dialog share: the hourglass, "Stay", the stop's name. */
function StayHeader({ labelId, name, onClose }: { labelId: string; name: string; onClose: () => void }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <DialogHeader
      tile={<DialogTile><Hourglass size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={labelId}
      onClose={onClose}
      eyebrow={t('roadtrip.stop.stay')}
      title={name}
    />
  )
}

/**
 * The dialog for a stop the traveller leaves at a set time.
 *
 * Nothing to choose: the stay is whatever is left between the arrival and that time, so
 * it is shown rather than offered. The one thing to do here is take the end time off the
 * visit, and the ordinary dialog takes over the moment that lands.
 *
 * The sentence under the number says what the drive actually does. Reached too late it
 * leaves on arrival, which is the case this dialog gets opened to fix; with the travel
 * hours over first it goes on the next morning. Saying "leaves at 14:00" over a box that
 * reads 14:30 gave two departures for one stop.
 */
function LeaveTime({ stop, leave, until: leaveAt, is12h, onClose }: {
  stop: StayDraft
  leave: LeaveMode
  until: string
  is12h: boolean
  onClose: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const until = formatClockTime(leaveAt, is12h)
  const arrive = stop.arrival ? formatClockTime(stop.arrival, is12h) : null
  const departure = stop.departure ? formatClockTime(stop.departure, is12h) : until
  const labelId = useId()
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      header={<StayHeader labelId={labelId} name={stop.name} onClose={onClose} />}
      footer={(
        <DialogFooter>
          {leave.remove ? (
            <DialogButton disabled={leave.removing} onClick={() => void leave.remove?.()}>
              {t('roadtrip.stay.clearLeave')}
            </DialogButton>
          ) : null}
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.close')}</DialogButton>
        </DialogFooter>
      )}
    >
      <div className="flex flex-col items-center gap-2 rounded-[14px] border border-edge-faint bg-surface-secondary px-4 py-5 text-center">
        <span className="font-bold tabular-nums tracking-[-0.02em] text-content" style={fs(28, 'subtitle')}>
          {leave.minutes === null ? t('roadtrip.stay.until', { time: until }) : formatDurationShort(leave.minutes * 60)}
        </span>
        {leave.missedBy !== null ? (
          <p className="m-0 flex items-center justify-center gap-1.5 font-medium text-warning" style={fs(12.5, 'body')}>
            <AlertTriangle size={14} className="shrink-0" aria-hidden />
            {t('roadtrip.warn.missedLeave', { count: leave.missedBy })}
          </p>
        ) : (
          <p className="m-0 text-content-secondary" style={fs(12.5, 'body')}>
            {t(leave.dayEndsFirst ? 'roadtrip.stay.dayEndsFirst' : 'roadtrip.stay.leavesAt', { time: until })}
          </p>
        )}
      </div>
      {/* The day ending first means the row's departure is only where it stops for the
          night, not a time it leaves. */}
      {arrive && !leave.dayEndsFirst ? <ArriveLeave arrive={arrive} leave={departure} /> : null}
    </DialogShell>
  )
}

/** Arrival, arrow, departure: the two ends of the stay as field boxes, with the day the second lands on. */
function ArriveLeave({ arrive, leave, carry = 0 }: { arrive: string; leave: string; carry?: number }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="flex items-stretch gap-2">
      <TimeBox label={t('roadtrip.stay.arrive')} value={arrive} quiet />
      <span className="grid place-items-center text-content-faint" aria-hidden>
        <ArrowRight size={14} className="rtl:rotate-180" />
      </span>
      <TimeBox
        label={t('roadtrip.stay.leave')}
        value={(
          <>
            {leave}
            {carry > 0 ? (
              <span className="ms-0.5">
                {`+${carry}`}
                <span className="sr-only">{` ${t('roadtrip.warn.overnight')}`}</span>
              </span>
            ) : null}
          </>
        )}
      />
    </div>
  )
}

/** One end of the stay: an eyebrow over the clock, in the cards' field box. */
function TimeBox({ label, value, quiet }: { label: string; value: React.ReactNode; quiet?: boolean }): React.ReactElement {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1 rounded-[10px] border border-edge-faint bg-surface-card px-3 py-2">
      <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{label}</span>
      <span dir="ltr" className={`font-semibold tabular-nums ${quiet ? 'text-content-secondary' : 'text-content'}`} style={fs(15, 'body')}>{value}</span>
    </span>
  )
}
