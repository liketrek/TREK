import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import {
  AlertTriangle, Clock, Footprints, Fuel, Hourglass, MapPin, Moon, Navigation, Pencil, X,
} from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MIconBtn from '../../../components/MIconBtn'
import MListRow from '../../../components/MListRow'
import MToggle from '../../../components/MToggle'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useTripStore } from '../../../../store/tripStore'
import ChargingInfo from '../../../../components/Roadtrip/ChargingInfo'
import { formatDurationShort } from '../../../../components/Roadtrip/roadtripModel'
import { roadtripRows, stageOf, type StopRow } from '../../../../components/Roadtrip/roadtripRowModel'
import { readStay, shownStay } from '../../../../components/Roadtrip/stayReading'
import { STOP_KIND_BY_KEY } from '../../../../components/Roadtrip/stopKinds'
import { getNavigationTargets, openNavigationTarget } from '../../../../components/Planner/placeNavigation'
import { NavigationMenu } from '../../../../components/shared/NavigationMenu'
import { formatDistance } from '../../../../utils/units'
import { Eyebrow, displayTime } from '../sheets/MTripSheetUi'
import { showStopOnMap } from './useMRoadtrip'
import type { DistanceUnit } from '../../../../types'
import type { RoadtripDay, ScheduleWarning } from '@trek/shared/roadtrip'

/**
 * One stop of the stage, written out.
 *
 * The chain gives a stop a disc, a name, a clock and at most two marks, because that is
 * what a 375px line carries while somebody is driving. Everything the marks stand for is
 * here instead, as sentences: why the clock reads what it reads, how long the stay is,
 * how far the road stops short, and which limit the drive to here went past.
 *
 * Read-mostly on purpose. Deleting a stop, reordering the day, changing what kind of stop
 * it is and how full the tank leaves it are desktop work, done at a table before anybody
 * is in the car, and they are not here at all: not greyed out, not hidden behind a
 * confirmation, simply absent, because a dead control on a phone is a promise the screen
 * cannot keep. What is left are the three things a passenger does decide on the road:
 * navigate there, stay longer, stop for the night here.
 *
 * Editing the place is the one way out of that rule, and it is a hand-over rather than a
 * control of this sheet: the pencil opens the place editor the plan tab opens, with this
 * very visit in context, and this sheet closes behind it. The times somebody fixed for a
 * stop are that editor's Start and End (the chain arrives at the visit's own Start and
 * leaves at its End), so a time control here would be a second writer for one number. A
 * booked night can also be held by its check-in, which belongs to the booking and not to
 * the place.
 */

interface RtStopSheetPayload {
  dayId?: number
  assignmentId?: number
}

/** The stop the sheet is about, and the card it is drawn on. */
interface Located {
  day: RoadtripDay
  row: StopRow
  /** Index into the CARD's stops, which is what every finding is filed under. */
  index: number
}

/**
 * Finds the stop across the routed days.
 *
 * The caller names the day a stop is stored on (`ownerDayId`), which after a night drive
 * is not the card that draws it: a stop set off from on Tuesday and reached on Wednesday
 * appears in Wednesday's `stops`. So the named day is tried first and the rest after it,
 * rather than trusting one lookup that is right most of the time.
 */
function locate(days: readonly RoadtripDay[], dayId: number | null, assignmentId: number | null): Located | null {
  if (assignmentId == null) return null
  const named = stageOf(days, dayId)
  const search = named ? [named, ...days.filter(d => d !== named)] : days
  for (const day of search) {
    const index = day.stops.findIndex(s => s.assignmentId === assignmentId && !s.automaticNight)
    if (index < 0) continue
    const row = roadtripRows(day).find(
      (r): r is StopRow => r.kind === 'stop' && r.stop.assignmentId === assignmentId,
    )
    if (row) return { day, row, index }
  }
  return null
}

/** One finding: an icon, a sentence, and the figure it is about when that reads better apart. */
function Finding({ icon, label, value, warn = false }: {
  icon: ReactNode
  label: string
  value?: string
  warn?: boolean
}) {
  return (
    <div
      className="flex min-h-[44px] items-center gap-2.5 rounded-[13px] bg-[color:var(--m-ic)] px-3 py-2.5"
      style={warn ? { color: 'var(--m-st-pending)' } : undefined}
    >
      <span className={`flex-none ${warn ? '' : 'text-m-muted'}`} aria-hidden="true">{icon}</span>
      <span className={`min-w-0 flex-1 text-[0.75rem] font-medium leading-snug ${warn ? '' : 'text-m-muted'}`}>
        {label}
      </span>
      {value && (
        <span className={`flex-none text-[0.8125rem] font-semibold tabular-nums ${warn ? '' : 'text-m-ink'}`}>
          {value}
        </span>
      )}
    </div>
  )
}

/** One 56px action tile. Without a handler it stays a plain box instead of a dead button. */
function ActionTile({ icon, label, value, onClick, tileRef }: {
  icon: ReactNode
  label: string
  value?: string
  onClick?: () => void
  tileRef?: Ref<HTMLButtonElement>
}) {
  const inner = (
    <>
      <span className="flex-none text-m-muted" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{label}</span>
        {value && (
          <span className="mt-px block truncate font-geist text-[0.65625rem] tabular-nums text-m-faint">{value}</span>
        )}
      </span>
    </>
  )
  const box = 'flex h-14 min-w-0 items-center gap-2.5 rounded-[14px] bg-[color:var(--m-ic)] px-3 text-left'
  if (!onClick) return <div className={box}>{inner}</div>
  return <button ref={tileRef} type="button" onClick={onClick} className={`${box} border-0`}>{inner}</button>
}

/**
 * Stop detail sheet ('rtstop', payload { dayId, assignmentId }) of the road trip tab.
 */
export default function MRtStopSheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'rtstop'
  const payload = (shell.sheet?.payload ?? {}) as RtStopSheetPayload

  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const unitSetting = useSettingsStore(s => s.settings.distance_unit)
  const unit: DistanceUnit = unitSetting === 'imperial' ? 'imperial' : 'metric'
  const tripPlaces = useTripStore(s => s.places)

  const days = planner.roadtripRoutes.days
  const live = useMemo(
    () => locate(days, payload.dayId ?? null, payload.assignmentId ?? null),
    [days, payload.dayId, payload.assignmentId],
  )

  // Hold the last stop so the card keeps its content through the 280ms exit.
  const heldRef = useRef<Located | null>(null)
  if (live) heldRef.current = live
  const located = live ?? heldRef.current

  const [navOpen, setNavOpen] = useState(false)
  const navBtnRef = useRef<HTMLButtonElement>(null)
  const [saving, setSaving] = useState(false)
  // The end-day switch, as it should read while the write is in the air.
  const [pending, setPending] = useState<{ from: boolean; to: boolean } | null>(null)
  useEffect(() => {
    if (!open) { setNavOpen(false); setPending(null) }
  }, [open])
  useEffect(() => { setPending(null) }, [payload.assignmentId])

  const stop = located?.row.stop ?? null
  // From the whole trip store, not planner.places: with service stops hidden from the day
  // lists the phone filters them out of that list, while the stage still draws them, and
  // both the pencil and the directions have to reach the row the chain drew.
  const place = tripPlaces.find(p => p.id === stop?.placeId) ?? null

  /**
   * Addressed by stop, not by selection.
   *
   * `planner.roadtripEndDay` derives itself from the place selection, which is what the
   * desktop inspector needs. Here that would mean moving the selection to open a sheet,
   * and the place inspector hangs off the same value and would come up underneath. So
   * the stage sheet calls the stop-addressed writer directly.
   */
  const canEndDay = stop != null && planner.dailyTimesActive && planner.can('day_edit', planner.trip)
  // Both things that can end a day, not just the flag: a manual boundary filed against
  // this stop closes the day too, and reading only the flag showed the switch as off for a
  // stop that already ends it. Worse, the tap meant to switch it on then ran through the
  // writer's boundary branch and deleted that day end.
  const endDayTruth = stop != null && planner.roadtripEndsDayAt(stop)
  // The optimistic value is released the moment the planner's own answer moves off what
  // it was taken from, so a landed write shows the real state rather than a copy of it.
  const endDayActive = pending && pending.from === endDayTruth ? pending.to : endDayTruth

  if (!located || !stop) {
    return <MSheet open={false} onClose={shell.closeSheet} variant="bottom" />
  }

  const { day, row, index } = located
  const kind = stop.stopType ? STOP_KIND_BY_KEY[stop.stopType] : undefined
  const KindIcon = kind?.Icon

  const entry = row.entry
  const arrive = displayTime(entry?.arrival, locale, timeFormat)
  const leave = displayTime(entry?.departure, locale, timeFormat)

  // Every finding filed at this stop, not just the one the chain had room for: being late
  // and driving too far are separate answers and the sheet is where both fit.
  const warnings: ScheduleWarning[] = [
    ...day.schedule.warnings.filter(w => w.index === index && (w.code === 'late' || w.code === 'missedLeave')),
    ...day.driveWarnings.filter(w => w.index === index && (w.code === 'leg' || w.code === 'range')),
  ]
  const warningText = (w: ScheduleWarning): string => {
    if (w.code === 'late') return t('roadtrip.warn.late', { minutes: w.minutes ?? 0 })
    if (w.code === 'missedLeave') return t('roadtrip.warn.missedLeave', { minutes: w.minutes ?? 0 })
    if (w.code === 'range') return t('roadtrip.limit.range', { distance: formatDistance(w.sinceKm ?? 0, unit) })
    return t('roadtrip.limit.legOver', { time: formatDurationShort((w.overMinutes ?? 0) * 60) })
  }
  const warningIcon = (w: ScheduleWarning): ReactNode => {
    if (w.code === 'late' || w.code === 'missedLeave') return <AlertTriangle size={15} strokeWidth={2} />
    if (w.code === 'range') return <Fuel size={15} strokeWidth={2} />
    return <Hourglass size={15} strokeWidth={2} />
  }

  // One app offered means no picker: the tap opens it, exactly as the place sheet does.
  // The stop's own name and position stand in when the place row is not to hand, so the
  // one control a driver actually needs is there whatever else the device is missing.
  const navTargets = getNavigationTargets(place ?? { name: stop.name, lat: stop.lat, lng: stop.lng })
  const openDirections = () => {
    if (navTargets.length === 1) openNavigationTarget(navTargets[0])
    else if (navTargets.length > 1) setNavOpen(true)
  }

  // A stop left at a set time is stood at until then: the stay is what that time leaves
  // of it, and the sheet says until when.
  const stay = readStay(stop, entry)
  const missed = warnings.some(w => w.code === 'missedLeave')
  const shown = shownStay(stay)
  const until = stay.until ? t('roadtrip.stay.until', { time: displayTime(stay.until, locale, timeFormat) }) : null
  const stayText = [shown === null ? null : formatDurationShort(shown * 60), until].filter(Boolean).join(' ')
  const canEditPlace = planner.can('place_edit', planner.trip)
  const editStay = () => {
    // The row this sheet is on rides along, because the stay sheet comes back here when it
    // saves and 'rtstop' is located by day and assignment. Without them it reopened on a
    // payload it could not resolve, drew nothing, and left shell.sheet pointing at a sheet
    // that is not on screen, which is what the day swipe reads to decide it is blocked.
    shell.openSheet('rtstay', {
      placeId: stop.placeId,
      minutes: stop.dwellMinutes,
      name: stop.name,
      dayId: located.day.dayId,
      assignmentId: stop.assignmentId,
    })
  }

  // A negative id is the optimistic row of a stop still being saved. The editor would
  // write the time against an id the server never issued, and handing it null instead is
  // no way round that: the planner then falls back to the place's only visit, which can be
  // that same row. So the pencil waits until the stop carries the id the server gave it.
  const canOpenEditor = canEditPlace && place != null && stop.assignmentId > 0
  const editPlace = () => {
    if (!place) return
    planner.openPlaceEditor(place, stop.assignmentId)
    shell.closeSheet()
  }

  const toggleEndDay = async (next: boolean) => {
    if (!canEndDay || saving) return
    setPending({ from: endDayTruth, to: next })
    setSaving(true)
    try {
      // The writer reports rather than throws, and shows its own toast, so the catch below
      // could never fire: a refused write left the switch standing at the state the trip
      // never reached, with only a toast to say otherwise.
      if (!await planner.setRoadtripEndDay(stop)) setPending(null)
    } catch (err: unknown) {
      setPending(null)
      planner.toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    } finally {
      setSaving(false)
    }
  }

  // The camera rather than the place selection, for the reason the end-day switch above
  // stays off it: the place inspector would come up over the map. `day` is the card the
  // stop is drawn on, so a stop reached after a night drive shows on the stage that has it.
  const showOnMap = () => {
    showStopOnMap(planner, shell, stop, day.dayId)
    shell.closeSheet()
  }

  const tiles = (navTargets.length > 0 ? 1 : 0) + 1

  return (
    <MSheet open={open && !!live} onClose={shell.closeSheet} variant="bottom" material="opaque" ariaLabel={stop.name}>
      {/* ── Header: the disc the chain draws, the name, the way to the editor and the way out ── */}
      <div className="flex-none px-[18px] pt-4">
        {/* Centred, not top-aligned: one line of the name is shorter than the 34px disc, so
            hung from the top it sat high beside it. A name that wraps to its two lines grows
            the row, and the disc and the buttons centre on both, as they do in the chain row. */}
        <div className="flex items-center gap-3">
          {row.service ? (
            kind && KindIcon ? (
              <span
                className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-white"
                // theme-lint-disable: the stop kinds share their colour with the map
                // markers, which sit on tiles rather than on one of the app's surfaces.
                style={{ background: kind.color }}
              >
                <KindIcon size={16} strokeWidth={2.1} aria-hidden="true" />
              </span>
            ) : (
              <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-[color:var(--m-ic)] text-m-muted">
                <MapPin size={16} strokeWidth={2} aria-hidden="true" />
              </span>
            )
          ) : (
            // Deliberately not font-geist: that tier caps the weight at Medium and would
            // quietly undo the bold on a number that has to read at 13px.
            <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-[color:var(--m-ic)] text-[0.8125rem] font-bold tabular-nums text-m-ink">
              {row.number}
            </span>
          )}
          <h2 className="min-w-0 flex-1 line-clamp-2 text-[1.0625rem] font-bold leading-tight text-m-ink">
            {stop.name}
          </h2>
          <div className="flex flex-none items-center gap-2">
            {canOpenEditor && (
              <MIconBtn variant="neutral" size={34} onClick={editPlace} ariaLabel={t('common.edit')}>
                <Pencil size={15} strokeWidth={2.2} />
              </MIconBtn>
            )}
            <MIconBtn variant="neutral" size={34} onClick={shell.closeSheet} ariaLabel={t('common.close')}>
              <X size={15} strokeWidth={2.2} />
            </MIconBtn>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
        {/* ── The two clock readings, and where they come from ── */}
        {(arrive || leave) && (
          <div className="mt-[14px] rounded-[16px] bg-[color:var(--m-inner)] px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              {arrive && (
                <div className="min-w-0">
                  <Eyebrow>{t('roadtrip.stay.arrive')}</Eyebrow>
                  {/* dir=ltr so a clock reads the same way round in an RTL locale. */}
                  <div dir="ltr" className="mt-1 text-[1.375rem] font-extrabold leading-none tabular-nums text-m-ink">
                    {arrive}
                  </div>
                </div>
              )}
              {leave && (
                <div className="min-w-0 ms-auto text-end">
                  <Eyebrow>{t('roadtrip.stay.leave')}</Eyebrow>
                  <div dir="ltr" className="mt-1 text-[1.375rem] font-extrabold leading-none tabular-nums text-m-ink">
                    {leave}
                  </div>
                </div>
              )}
            </div>
            {/* The desktop says this in a tooltip, which a phone has nowhere to put. */}
            <div className="mt-2 font-geist text-[0.65625rem] leading-snug text-m-faint">
              {entry?.anchored ? t('roadtrip.stop.pinned') : t('roadtrip.stop.computed')}
            </div>
            {/* Only where it is true. Reached too late the stop is left on arrival, which
                the finding below says; with the travel hours over first the drive goes on
                in the morning, not at the time or at the Leave shown above. */}
            {stay.until && !missed && (
              <div className="mt-1 font-geist text-[0.65625rem] leading-snug text-m-faint">
                {t(stay.dayEndsFirst ? 'roadtrip.stay.dayEndsFirst' : 'roadtrip.stay.leavesAt', {
                  time: displayTime(stay.until, locale, timeFormat),
                })}
              </div>
            )}
          </div>
        )}

        {/* ── What this stop costs, and what the drive to it went past ── */}
        {(!!stayText || !!row.offRoadMeters || warnings.length > 0) && (
          <div className="mt-2.5 flex flex-col gap-2">
            {!!stayText && (
              <Finding
                icon={<Hourglass size={15} strokeWidth={2} />}
                label={t('roadtrip.stop.stayShort')}
                value={stayText}
              />
            )}
            {!!row.offRoadMeters && (
              <Finding
                icon={<Footprints size={15} strokeWidth={2} />}
                label={t('roadtrip.stop.offRoad', { distance: formatDistance(row.offRoadMeters / 1000, unit) })}
              />
            )}
            {warnings.map(w => (
              <Finding key={`${w.code}-${w.index}`} icon={warningIcon(w)} label={warningText(w)} warn />
            ))}
          </div>
        )}

        {/* ── Charging: availability and price, polled only while the sheet is up ── */}
        {open && stop.stopType === 'charging' && (
          <div className="mt-2.5">
            <ChargingInfo placeId={stop.placeId} />
          </div>
        )}

        {/* ── The two decisions a passenger makes on the road ── */}
        <div className={`mt-2.5 grid gap-2 ${tiles > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {navTargets.length > 0 && (
            <ActionTile
              tileRef={navBtnRef}
              icon={<Navigation size={16} strokeWidth={2} />}
              label={t('inspector.navigation')}
              value={navTargets.length === 1 ? navTargets[0].label : undefined}
              onClick={openDirections}
            />
          )}
          <ActionTile
            icon={<Clock size={16} strokeWidth={2} />}
            label={t('roadtrip.stop.stayShort')}
            value={stayText || t('roadtrip.stay.none')}
            onClick={canEditPlace ? editStay : undefined}
          />
        </div>
        {navOpen && (
          <NavigationMenu
            targets={navTargets}
            anchor={navBtnRef.current}
            onClose={() => setNavOpen(false)}
            title={t('inspector.openWith')}
          />
        )}

        {/* ── Stopping here for the night. Offline too: it is a plan, not a lookup. ── */}
        {canEndDay && (
          <div className="mt-2.5 flex min-h-[44px] items-center gap-2.5 rounded-[13px] bg-[color:var(--m-ic)] px-3 py-2">
            <Moon
              size={16}
              strokeWidth={2}
              className={`flex-none ${endDayActive ? 'text-m-ink' : 'text-m-muted'}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-[0.8125rem] font-semibold text-m-ink">
              {t('roadtrip.window.endHere')}
            </span>
            <MToggle
              checked={endDayActive}
              onChange={next => { void toggleEndDay(next) }}
              ariaLabel={t('roadtrip.window.endHere')}
              disabled={saving}
            />
          </div>
        )}

        {/* ── Out to the map, with the stop marked on it ── */}
        <div className="mt-2 border-t border-[color:var(--m-rowbr)] pt-2">
          <MListRow
            icon={MapPin}
            label={t('mobileTrip.showOnMap')}
            onClick={showOnMap}
            className="min-h-[44px]"
          />
        </div>
      </div>
    </MSheet>
  )
}
