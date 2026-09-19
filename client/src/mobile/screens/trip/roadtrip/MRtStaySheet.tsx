import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Minus, Plus } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MChip from '../../../components/MChip'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'
import { useSettingsStore } from '../../../../store/settingsStore'
import { formatClock, formatDurationShort, parseClock } from '../../../../components/Roadtrip/roadtripModel'
import { stageOf } from '../../../../components/Roadtrip/roadtripRowModel'
import { locateStop, missedLeaveOf } from '../../../../components/Roadtrip/stayReading'
import { useLeaveMode, type LeaveMode } from '../../../../components/Roadtrip/useLeaveMode'
import { formatClockTime } from '../../../../utils/formatters'
import { FormSheetHeader } from '../sheets/PlSheetChrome'
import { INNER_CLS, displayTime } from '../sheets/MTripSheetUi'

/** What the chain hands over when a stop's stay is tapped. */
interface RtStaySheetPayload {
  placeId?: number
  /** The stay the place carries right now; absent and zero mean the same thing. */
  minutes?: number | null
  name?: string
  /** Where the stop sheet was standing, so saving can hand the traveller back to it. */
  dayId?: number
  assignmentId?: number
}

/** The step the two buttons move in. Same five minutes as the desktop dialog. */
const STEP = 5

const DAY_MINUTES = 24 * 60

/**
 * As far as a stay goes, in minutes: a full day, like the desktop slider.
 *
 * Kept even though there is no slider here: the plus button has to stop somewhere, and
 * a stay longer than a day is a second day rather than a longer stop.
 */
const MAX = DAY_MINUTES

/**
 * The lengths a stop usually takes, so the common answer is one tap.
 *
 * The same eight the desktop offers. They are the whole of the coarse control here: the
 * desktop's slider runs 0 to 1440, which on a 343px phone row is four minutes a pixel,
 * and a control that cannot hit the value it is dragged to is worse than no control.
 */
const PRESETS = [15, 30, 45, 60, 90, 120, 480, 720]

const clampMinutes = (value: number): number => Math.min(MAX, Math.max(0, Math.round(value)))

/**
 * How long the traveller stays at one stop, on the phone ('rtstay', payload
 * { placeId, minutes, name }).
 *
 * Writes `places.duration_minutes` through `planner.setRoadtripStay`, which is the same
 * single write the desktop dialog makes. Zero rather than null clears it: the update
 * statement folds a null into "leave it alone", so a null could give a stop a stay but
 * never take one away.
 *
 * Two things this sheet deliberately does not do:
 *
 * 1. The two buttons do not auto-repeat on hold. Five-minute steps under a repeat land
 *    forty minutes past the intended value about as often as they land on it, and the
 *    eight presets already cover every length anybody holds a button for.
 * 2. The preview moves this stop's own departure and nothing else. Every later arrival
 *    shifts too, but that is the routing round's answer after the write, and computing
 *    second time here would be two sources for one number, and they would disagree the
 *    first time a rule changed.
 */
export default function MRtStaySheet({ planner, shell }: MTripSheetsProps) {
  const { t } = useTranslation()
  const open = shell.sheet?.id === 'rtstay'
  const payload = (shell.sheet?.payload ?? {}) as RtStaySheetPayload
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const canEdit = planner.can('place_edit', planner.trip)

  // Hold the last payload so the name and the number survive the exit animation
  // instead of blinking out while the sheet slides away.
  const heldRef = useRef<RtStaySheetPayload | null>(null)
  if (open && typeof payload.placeId === 'number') heldRef.current = payload
  const stop = open && typeof payload.placeId === 'number' ? payload : heldRef.current

  /** What the place carries now: the value the draft starts from and falls back to. */
  const stored = clampMinutes(stop?.minutes ?? 0)

  const [minutes, setMinutes] = useState(stored)
  const [saving, setSaving] = useState(false)

  // Reopened on a different stop, so it starts from that stop's own value rather than
  // from whatever the last one was left on.
  useEffect(() => {
    if (!open) return
    setMinutes(clampMinutes(payload.minutes ?? 0))
    setSaving(false)
  }, [open, payload.placeId, payload.minutes])

  /**
   * When the drive gets here.
   *
   * Read off the stage (the one day both halves of the road trip tab show) rather than
   * passed in, so the arrival on screen is the arrival the chain drew, from the same
   * routing round, for the same day. A place planned on several days has an arrival per
   * day, and the stage is the day the tap came from.
   */
  const stage = stageOf(planner.roadtripRoutes.days, planner.selectedDayId)
  const stopPlaceId = stop?.placeId
  // The visit itself when the stop sheet named it, read off the same stage: its end time
  // decides whether there is a stay to choose here at all.
  const located = stage && stop?.assignmentId != null ? locateStop([stage], stop.assignmentId) : null
  const arrival = useMemo(() => {
    if (located) return located.entry?.arrival ?? null
    if (!stage || stopPlaceId == null) return null
    const index = stage.stops.findIndex(s => s.placeId === stopPlaceId)
    if (index === -1) return null
    return stage.schedule.entries[index]?.arrival ?? null
  }, [located, stage, stopPlaceId])
  const leave = useLeaveMode(located && {
    leaveAt: located.stop.leaveAt,
    arrival: located.entry?.arrival,
    departure: located.entry?.departure,
    missedBy: missedLeaveOf(located.day, located.index),
    assignmentId: located.stop.assignmentId,
    dayId: located.stop.ownerDayId,
  })

  // What the stay does to this stop: the arrival is fixed by the drive, the departure is
  // the one end this sheet moves.
  const preview = useMemo(() => {
    const at = parseClock(arrival)
    if (at === null) return null
    return {
      arrive: formatClockTime(formatClock(at), is12h),
      leave: formatClockTime(formatClock(at + minutes), is12h),
      // `formatClock` wraps modulo 24 h, so a stay running past midnight reads as a small
      // number again. Without the carry the sheet would quietly promise "leave 01:00" for
      // a departure the chain places on the next day.
      carry: Math.floor((at + minutes) / DAY_MINUTES) - Math.floor(at / DAY_MINUTES),
    }
  }, [arrival, minutes, is12h])

  const nudge = (delta: number) => setMinutes(m => clampMinutes(m + delta))

  /**
   * Writes the draft, then hands the traveller back to the stop they came from.
   *
   * Reopening 'rtstop' is the point of the save: the times that just moved are shown
   * there, in the chain's own reading, so the change lands where it was asked for.
   * Closing without saving deliberately does not reopen it: nothing moved.
   *
   * `setRoadtripStay` reports its own failures and resolves either way, so the catch is
   * the second line rather than the first: what it guards is the sheet being left showing
   * a number the place does not have.
   */
  const save = async () => {
    const placeId = stop?.placeId
    if (!canEdit || saving || placeId == null) return
    const value = minutes
    setSaving(true)
    try {
      await planner.setRoadtripStay(placeId, value)
      // 'rtstop' is located by day and assignment, not by place: spreading this sheet's own
      // payload into it opened a sheet that resolved to nothing, drew nothing, and still
      // counted as open, which blocks the day swipe until something else closes it.
      if (stop?.dayId != null && stop.assignmentId != null) {
        shell.openSheet('rtstop', { dayId: stop.dayId, assignmentId: stop.assignmentId })
      } else {
        shell.closeSheet()
      }
    } catch {
      setMinutes(stored)
      planner.toast.error(t('common.unknownError'))
    } finally {
      setSaving(false)
    }
  }

  const stepCls =
    'flex h-11 w-11 flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink disabled:opacity-35'
  const captionCls = 'font-geist text-[0.5625rem] font-bold uppercase tracking-[.09em] text-m-faint'

  return (
    <MSheet
      open={open && !!stop}
      onClose={shell.closeSheet}
      variant="bottom"
      material="opaque"
      // Named for what it holds: a stop left at a set time has no stay to add.
      ariaLabel={leave.until ? t('roadtrip.stop.stay') : t('roadtrip.stay.add')}
    >
      {stop && leave.until && (
        <RtLeaveTime name={stop.name} leave={leave} arrival={arrival} departure={located?.entry?.departure ?? null} onClose={shell.closeSheet} />
      )}
      {stop && !leave.until && (
        <>
          <FormSheetHeader
            title={t('roadtrip.stay.add')}
            onClose={shell.closeSheet}
            closeLabel={t('common.close')}
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-1">
            {/* Which stop, and what the number actually attaches to. The stay is a column
                on the place, not on the day's assignment, so a place planned twice keeps
                one stay for both, and saying so here is cheaper than the surprise. */}
            {stop.name && (
              <div className="truncate text-[0.875rem] font-semibold text-m-ink">{stop.name}</div>
            )}
            <div className="mt-[3px] font-geist text-[0.65625rem] leading-snug text-m-faint">
              {t('mobileTrip.rtStayScope')}
            </div>

            {/* The number, the way a timer shows one, with minus and plus either side so a
                value can be nudged without a control to aim at. */}
            <div className="mt-[18px] flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => nudge(-STEP)}
                disabled={!canEdit || saving || minutes <= 0}
                aria-label={t('mobileTrip.rtStayLess', { count: STEP })}
                className={stepCls}
              >
                <Minus size={17} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <div className="flex min-w-[6rem] flex-col items-center">
                <span
                  aria-live="polite"
                  className="text-[2.5rem] font-extrabold leading-none tabular-nums text-m-ink"
                >
                  {minutes}
                </span>
                <span className="mt-[7px] font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
                  {t('roadtrip.stay.custom')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => nudge(STEP)}
                disabled={!canEdit || saving || minutes >= MAX}
                aria-label={t('mobileTrip.rtStayMore', { count: STEP })}
                className={stepCls}
              >
                <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            {/* The eight usual answers. Read as durations rather than as raw minutes: a
                tile saying 480 is a number to work out, one saying 8 h is an answer. */}
            {canEdit && (
              <div className="mt-[18px] grid grid-cols-4 gap-[7px]">
                {PRESETS.map(value => (
                  <MChip
                    key={value}
                    active={minutes === value}
                    onClick={() => setMinutes(value)}
                    className="h-11 w-full justify-center tabular-nums"
                  >
                    {formatDurationShort(value * 60)}
                  </MChip>
                ))}
              </div>
            )}

            {/* Arrival, arrow, new departure. Only this stop's own two ends. */}
            {preview && (
              <div className={`mt-[18px] flex items-center justify-center gap-4 rounded-[16px] px-3 py-[11px] ${INNER_CLS}`}>
                <span className="flex flex-col items-center gap-[2px]">
                  <span className={captionCls}>{t('roadtrip.stay.arrive')}</span>
                  <span dir="ltr" className="text-[0.875rem] font-bold tabular-nums text-m-muted">
                    {preview.arrive}
                  </span>
                </span>
                <ArrowRight size={14} strokeWidth={2} className="mt-[11px] flex-none text-m-faint" aria-hidden="true" />
                <span className="flex flex-col items-center gap-[2px]">
                  <span className={captionCls}>{t('roadtrip.stay.leave')}</span>
                  <span dir="ltr" className="text-[0.875rem] font-bold tabular-nums text-m-ink">
                    {preview.leave}
                    {preview.carry > 0 && (
                      <span className="ms-[3px]">
                        {`+${preview.carry}`}
                        <span className="sr-only">{` ${t('roadtrip.warn.overnight')}`}</span>
                      </span>
                    )}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
            {/* Clearing is the same write as setting one, so it only fills the number in;
                the save below is still the one way anything is written. */}
            <button
              type="button"
              onClick={() => setMinutes(0)}
              disabled={!canEdit || saving || minutes === 0}
              className="inline-flex h-11 items-center rounded-full px-3 text-[0.8125rem] font-semibold text-[color:var(--m-st-danger)] disabled:opacity-40"
            >
              {t('roadtrip.stay.none')}
            </button>
            <button
              type="button"
              onClick={() => { void save() }}
              disabled={!canEdit || saving}
              className="ml-auto inline-flex h-11 items-center rounded-full bg-m-act px-[18px] text-[0.8125rem] font-semibold text-m-actfg disabled:opacity-40"
            >
              {t('common.save')}
            </button>
          </div>
        </>
      )}
    </MSheet>
  )
}

/**
 * The sheet for a stop the traveller leaves at a set time, where there is no stay to pick.
 *
 * It says when the drive leaves and what stay that makes, and offers the one thing there
 * is to do: take the end time off the visit, after which the stay is a choice again.
 */
function RtLeaveTime({ name, leave, arrival, departure, onClose }: {
  name?: string
  leave: LeaveMode
  arrival: string | null
  departure: string | null
  onClose: () => void
}) {
  const { t, locale } = useTranslation()
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const until = displayTime(leave.until, locale, timeFormat)
  const captionCls = 'font-geist text-[0.5625rem] font-bold uppercase tracking-[.09em] text-m-faint'
  return (
    <>
      <FormSheetHeader title={t('roadtrip.stop.stay')} onClose={onClose} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-1">
        {name && <div className="truncate text-[0.875rem] font-semibold text-m-ink">{name}</div>}
        <div className="mt-[18px] text-center text-[2.5rem] font-extrabold leading-none tabular-nums text-m-ink">
          {leave.minutes === null ? t('roadtrip.stay.until', { time: until }) : formatDurationShort(leave.minutes * 60)}
        </div>
        {/* What the drive actually does, as the desktop dialog says it: reached too late it
            leaves on arrival, with the travel hours over first it goes on in the morning. */}
        {leave.missedBy !== null ? (
          <div className="mt-[10px] flex items-center justify-center gap-1.5 text-center text-[0.8125rem] font-medium leading-snug text-[color:var(--m-st-pending)]">
            <AlertTriangle size={14} strokeWidth={2} className="flex-none" aria-hidden="true" />
            {t('roadtrip.warn.missedLeave', { minutes: leave.missedBy })}
          </div>
        ) : (
          <div className="mt-[10px] text-center text-[0.8125rem] leading-snug text-m-muted">
            {t(leave.dayEndsFirst ? 'roadtrip.stay.dayEndsFirst' : 'roadtrip.stay.leavesAt', { time: until })}
          </div>
        )}
        {arrival && !leave.dayEndsFirst && (
          <div className={`mt-[18px] flex items-center justify-center gap-4 rounded-[16px] px-3 py-[11px] ${INNER_CLS}`}>
            <span className="flex flex-col items-center gap-[2px]">
              <span className={captionCls}>{t('roadtrip.stay.arrive')}</span>
              <span dir="ltr" className="text-[0.875rem] font-bold tabular-nums text-m-muted">
                {displayTime(arrival, locale, timeFormat)}
              </span>
            </span>
            <ArrowRight size={14} strokeWidth={2} className="mt-[11px] flex-none text-m-faint" aria-hidden="true" />
            <span className="flex flex-col items-center gap-[2px]">
              <span className={captionCls}>{t('roadtrip.stay.leave')}</span>
              <span dir="ltr" className="text-[0.875rem] font-bold tabular-nums text-m-ink">
                {displayTime(departure ?? leave.until, locale, timeFormat)}
              </span>
            </span>
          </div>
        )}
      </div>
      {leave.remove && (
        <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
          <button
            type="button"
            onClick={() => { void leave.remove?.() }}
            disabled={leave.removing}
            className="ml-auto inline-flex h-11 items-center rounded-full bg-m-act px-[18px] text-[0.8125rem] font-semibold text-m-actfg disabled:opacity-40"
          >
            {t('roadtrip.stay.clearLeave')}
          </button>
        </div>
      )}
    </>
  )
}
