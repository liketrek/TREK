import { useRef, useState, type MouseEvent } from 'react'
import {
  ArrowRight, BedDouble, CalendarDays, CalendarRange, ChevronRight, Compass, LogIn, LogOut,
  MapPin, Pencil, PencilLine, Route, Ticket, TrainFront, Undo2,
  Car, Footprints, Zap, RotateCcw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useContextMenu, ContextMenu } from '../../../../components/shared/ContextMenu'
import { fmtTransitDuration } from '../../../../components/Planner/transitDisplay'
import { formatTime } from '../../../../utils/formatters'
import { useMPlanTimeline, type MPlanTimelineController } from './useMPlanTimeline'
import { cityPillsForDay, weatherIconFor } from './planTimelineModel'
import type { PlanRow } from './planTimelineModel'
import { useMPlanDragReorder } from './useMPlanDragReorder'
import { useTouchDragBridge } from '../../../../hooks/useTouchDragBridge'
import { useIsTouch } from '../../../../hooks/useIsTouch'
import { ConnRow, HotelConnRow, NoteRow, PlaceRow, PlanScheduleRow, ReorderStack, TransitRow, TransportRow } from './MPlanTimelineRows'
import type { RowDrag } from './MPlanTimelineRows'
import { usePluginDaySchedule } from '../../../../components/Plugins/PluginDaySchedule'
import { Fragment } from 'react'
import MDancingTrek from '../../../components/MDancingTrek'
import type { MPlanTimelineProps } from '../MTripShell'
import type { MergedItem } from '../../../../utils/dayMerge'
import type { Assignment } from '../../../../types'
import type { ComponentType, ReactNode } from 'react'
import GoogleMapsIcon from '../../../../components/shared/GoogleMapsIcon'
import { isRtlLanguage } from '../../../../i18n'
import { useMPlanDaySwipe } from './useMPlanDaySwipe'

/**
 * Plan-tab timeline of the mobile trip screen: the UP-NEXT card in go mode,
 * city pills + rename + named undo in edit mode, and the frosted timeline card
 * (hotel/weather header, the five row types, the dashed add bars). Layout
 * follows the demo's absolute geometry, re-anchored to the shell's safe-top.
 */

const GLASS_PILL = 'rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)]'

export default function MPlanTimeline({ planner, shell }: MPlanTimelineProps) {
  const tl = useMPlanTimeline(planner)
  const { t, trip, can } = planner
  const canEdit = can('day_edit', trip)
  const editing = shell.mode === 'edit' && canEdit
  // Per-segment travel mode (#1281): tap a connector → pick the leg's mode.
  const legMenu = useContextMenu()
  const modeIcon = (key: string) => (key === 'walking' ? Footprints : key.startsWith('plugin:') ? Zap : Car)
  const openLegMenu = (e: MouseEvent, assignmentId: number) => {
    legMenu.open(e, [
      ...tl.routeModeOptions.map(o => ({ label: o.label, icon: modeIcon(o.key), onClick: () => tl.setLegMode(assignmentId, o.key) })),
      { divider: true },
      { label: t('dayplan.transportMode.useDefault'), icon: RotateCcw, onClick: () => tl.setLegMode(assignmentId, null) },
    ])
  }
  // Plugin time contributions in the day plan (dayScheduleProvider hook) —
  // slotted under their anchor rows, same as the desktop sidebar.
  const daySchedule = usePluginDaySchedule(planner.tripId)
  const day = tl.day
  const dayId = day?.id
  // Mirrors MDaySheet's own label so the pill and the sheet it opens agree.
  const dayLabel = day
    ? day.title || t('planner.dayN', { n: day.day_number || planner.days.indexOf(day) + 1 })
    : ''
  const dayScheduleFor = (anchor: 'assignment' | 'reservation', id: number) =>
    (dayId != null
      ? (anchor === 'assignment' ? daySchedule.byAssignment[dayId]?.[id] : daySchedule.byReservation[dayId]?.[id])
      : undefined
    )?.map(si => <PlanScheduleRow key={`${si.pluginId}:${si.id}`} item={si} />)

  // Selecting the place is enough — the place inspector sheet opens off the
  // planner's selection, same contract as map marker taps.
  const openPlace = (assignment: Assignment) => {
    planner.handlePlaceClick(assignment.place?.id ?? null, assignment.id)
  }

  // Long-press drag reordering (#1997). Armed only in edit mode, so go-mode taps,
  // map pans and plain list scrolling keep the gesture — which is what kept
  // #1432/#1440 from coming back when the old document-wide polyfill was dropped.
  // Coarse pointers only: a hybrid laptop narrow enough to land in the phone
  // shell already loads drag-drop-touch (utils/touchDragPolyfill), and two
  // bridges would fight over one gesture. The rows' native drag props serve
  // both, so nothing is lost there.
  const isTouch = useIsTouch()
  useTouchDragBridge(editing && isTouch)
  const dnd = useMPlanDragReorder({
    merged: tl.merged,
    dayId,
    onMove: tl.moveRowTo,
    enabled: editing,
  })
  // Swipe the whole panel left/right to step days (#2051) — the one-handed way
  // to the next day, since the chip rail is pinned to the top of the screen.
  const panelRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const daySwipe = useMPlanDaySwipe({
    days: planner.days,
    selectedDayId: planner.selectedDayId,
    // skipFit, exactly like the chip tap in plan view: the map underneath stays
    // mounted, and re-framing it here would move it somewhere nobody asked for.
    onSelectDay: dayId => planner.handleSelectDay(dayId, true),
    panelRef,
    cardRef,
    editing,
    dragging: dnd.draggingKey != null,
    menuOpen: legMenu.menu != null,
    rtl: isRtlLanguage(planner.language),
    describeDay: (i, n) => t('mobileTrip.dayAnnounce', { current: i + 1, total: n }),
  })

  const dragFor = (row: PlanRow): RowDrag | undefined => {
    const props = dnd.dragPropsFor(row)
    if (!props) return undefined
    return { ...props, dragging: dnd.draggingKey === row.key, dropTarget: dnd.dropBeforeKey === row.key }
  }

  const reorderFor = (item: MergedItem): ReactNode => {
    const idx = tl.merged.indexOf(item)
    return (
      <ReorderStack
        onUp={() => tl.moveRow(item, 'up')}
        onDown={() => tl.moveRow(item, 'down')}
        canUp={idx > 0}
        canDown={idx >= 0 && idx < tl.merged.length - 1}
        t={t}
      />
    )
  }

  const chrome = { editing, t, language: tl.language, timeFormat: tl.timeFormat }

  return (
    <div ref={panelRef} className="absolute inset-0" {...daySwipe.handlers}>
      <ContextMenu menu={legMenu.menu} onClose={legMenu.close} />
      {/* Swipe-committed day changes only — a chip tap already speaks its own
          button label plus the aria-current flip, so announcing there would say
          the day twice. */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{daySwipe.announcement}</span>
      {!editing && <UpNextCard tl={tl} t={t} onOpen={openPlace} />}
      {editing && <EditHeader tl={tl} planner={planner} shell={shell} />}

      {/* Timeline card — go mode leaves room for the UP-NEXT card above, but
          collapses that reserved space up to the day chips when the day has no
          up-next (no places), so an empty day shows no gap. */}
      <div
        ref={cardRef}
        data-touch-drag={editing ? '' : undefined}
        className="absolute left-4 right-4 overflow-y-auto overscroll-contain rounded-[22px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)] px-3.5 pb-2 pt-1 backdrop-blur-[24px] backdrop-saturate-[1.6] bottom-[calc(env(safe-area-inset-bottom,0px)+90px)]"
        style={{ top: `calc(var(--m-safe-top, 12px) + ${editing ? 140 : tl.upNext ? 216 : 102}px)` }}
      >
        {day && (
          <TimelineHeader
            tl={tl}
            // Edit mode already names the day in its own header a row above, so
            // the pill drops to icon-only there rather than saying it twice.
            dayLabel={editing ? '' : dayLabel}
            openLabel={t('day.overview')}
            onOpenDay={() => shell.openSheet('day', { dayId: day.id })}
          />
        )}

        {tl.hotelLegs.top && (
          <HotelConnRow seg={tl.hotelLegs.top.seg} name={tl.hotelLegs.top.name} placement="top" />
        )}
        {dayId != null && daySchedule.byPosition[dayId]?.start.map(si => <PlanScheduleRow key={`${si.pluginId}:${si.id}`} item={si} />)}

        {day && tl.rows.map(row => {
          switch (row.kind) {
            case 'place':
              return (
                <Fragment key={row.key}>
                  <PlaceRow
                    assignment={row.assignment}
                    fullPlace={tl.fullPlaceOf(row.assignment)}
                    linkedRes={row.linkedRes}
                    chrome={chrome}
                    reorder={reorderFor(row.item)}
                    drag={dragFor(row)}
                    onOpen={() => openPlace(row.assignment)}
                    onEdit={() => tl.editAssignment(row.assignment)}
                    onRemove={() => tl.removeAssignment(row.assignment)}
                  />
                  {dayScheduleFor('assignment', row.assignment.id)}
                </Fragment>
              )
            case 'transport':
              return (
                <Fragment key={row.key}>
                  <TransportRow
                    res={row.res}
                    dayId={day.id}
                    chrome={chrome}
                    reorder={reorderFor(row.item)}
                    drag={dragFor(row)}
                    onOpen={() => {
                      if (editing) tl.editTransport(row.res)
                      else shell.openSheet('transport', { reservationId: row.res.id })
                    }}
                  />
                  {dayScheduleFor('reservation', row.res.id)}
                </Fragment>
              )
            case 'transit':
              return (
                <Fragment key={row.key}>
                  <TransitRow
                    res={row.res}
                    transit={row.transit}
                    dayId={day.id}
                    open={tl.openTransitKeys.has(row.key)}
                    chrome={chrome}
                    reorder={reorderFor(row.item)}
                    drag={dragFor(row)}
                    onToggle={() => tl.toggleTransit(row.key)}
                    onOpenJourney={() => tl.openTransitJourney(row.res)}
                  />
                  {dayScheduleFor('reservation', row.res.id)}
                </Fragment>
              )
            case 'note':
              return (
                <NoteRow
                  key={row.key}
                  note={row.note}
                  chrome={chrome}
                  reorder={reorderFor(row.item)}
                  drag={dragFor(row)}
                  onEdit={() => shell.openSheet('note', { dayId: day.id, note: row.note })}
                />
              )
            case 'conn':
              return <ConnRow key={row.key} seg={row.seg} onTap={editing && row.assignmentId != null ? e => openLegMenu(e, row.assignmentId!) : undefined} />
          }
        })}

        {dayId != null && daySchedule.byPosition[dayId]?.end.map(si => <PlanScheduleRow key={`${si.pluginId}:${si.id}`} item={si} />)}
        {tl.hotelLegs.bottom && (
          <HotelConnRow seg={tl.hotelLegs.bottom.seg} name={tl.hotelLegs.bottom.name} placement="bottom" />
        )}

        {tl.rows.length === 0 && !editing && (
          <div className="flex min-h-full flex-1 flex-col items-center justify-center py-8 text-center">
            <MDancingTrek scene="guide" className="mb-2" />
            <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('dayplan.emptyDay')}</p>
          </div>
        )}

        {editing && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <PlanAction icon={MapPin} label={t('mobileTrip.addPlaceShort')} onClick={tl.addPlace} />
            <PlanAction
              icon={PencilLine}
              label={t('mobileTrip.addNoteShort')}
              onClick={() => day && shell.openSheet('note', { dayId: day.id })}
            />
            <PlanAction icon={Ticket} label={t('mobileTrip.addBookingShort')} onClick={tl.addBooking} />
            <PlanAction icon={TrainFront} label={t('mobileTrip.addTransportShort')} onClick={tl.addTransport} />
            <PlanAction icon={Route} label={t('dayplan.optimize')} onClick={() => void tl.optimize()} />
            <PlanAction icon={GoogleMapsIcon} label={t('mobileTrip.googleMaps')} onClick={tl.exportGoogleMaps} />
            <PlanAction icon={Compass} label={t('mobileTrip.coMaps')} onClick={tl.exportCoMaps} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Go mode: the next stop with a live countdown (only counting down on today's day). */
function UpNextCard({ tl, t, onOpen }: {
  tl: MPlanTimelineController
  t: MPlanTimelineProps['planner']['t']
  onOpen: (assignment: Assignment) => void
}) {
  const upNext = tl.upNext
  if (!upNext) return null
  const place = upNext.assignment.place
  const time = place?.place_time ? formatTime(place.place_time.slice(0, 5), tl.language, tl.timeFormat) : ''
  const sub = place?.address || place?.description || ''

  return (
    <button
      type="button"
      onClick={() => onOpen(upNext.assignment)}
      className="absolute left-4 right-4 cursor-pointer rounded-[22px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-4 py-3.5 text-left shadow-[0_18px_44px_-18px_rgba(0,0,0,.3)] backdrop-blur-[28px] backdrop-saturate-[1.8] top-[calc(var(--m-safe-top,12px)+102px)]"
    >
      <div className="flex items-center justify-between">
        <span className="whitespace-nowrap font-geist text-[0.65625rem] font-bold uppercase tracking-[.08em] text-m-muted">
          {t('mobileTrip.upNext')}
        </span>
        {upNext.minutesUntil != null && (
          <span className="whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] text-[0.6875rem] font-semibold">
            {t('mobileTrip.inCountdown', { time: fmtTransitDuration(upNext.minutesUntil * 60, t) })}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {time && (
              <span className="flex-none whitespace-nowrap rounded-[6px] bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.71875rem] font-semibold">
                {time}
              </span>
            )}
            <span className="min-w-0 truncate text-[1.125rem] font-bold">{place?.name}</span>
          </div>
          {sub && <div className="mt-[2px] truncate font-geist text-[0.75rem] text-m-muted">{sub}</div>}
        </div>
        <span className="ml-2 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg">
          <ChevronRight size={16} strokeWidth={2.4} />
        </span>
      </div>
    </button>
  )
}

/** Edit mode: city pills (day title), inline rename via the pencil, day management, named undo. */
function EditHeader({ tl, planner, shell }: {
  tl: MPlanTimelineController
  planner: MPlanTimelineProps['planner']
  shell: MPlanTimelineProps['shell']
}) {
  const { t, canUndo, handleUndo, lastActionLabel } = planner
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState('')
  const pills = cityPillsForDay(tl.day, t)

  const commitRename = () => {
    setRenaming(false)
    if (draft.trim() !== (tl.day?.title ?? '').trim()) tl.renameDay(draft)
  }

  return (
    <div className="absolute left-4 right-4 flex items-center gap-2 top-[calc(var(--m-safe-top,12px)+102px)]">
      {renaming ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setRenaming(false)
          }}
          placeholder={t('mobileTrip.dayTitlePlaceholder')}
          className={`min-w-0 flex-1 px-[11px] py-1 text-[0.75rem] font-semibold text-m-ink outline-none placeholder:text-m-faint ${GLASS_PILL}`}
        />
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            {pills.map((pill, i) => (
              <span key={`${pill}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <ArrowRight size={13} strokeWidth={2.2} className="flex-none text-m-faint" />}
                <span className={`inline-flex min-w-0 items-center truncate px-[11px] py-1 text-[0.75rem] font-semibold ${GLASS_PILL}`}>
                  {pill}
                </span>
              </span>
            ))}
          </span>
          <button
            type="button"
            aria-label={t('mobileTrip.renameDay')}
            onClick={() => { setDraft(tl.day?.title ?? ''); setRenaming(true) }}
            className="flex-none text-m-faint"
          >
            <Pencil size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={t('dayplan.reorderDays')}
            onClick={() => shell.openSheet('days')}
            className="flex-none text-m-faint"
          >
            <CalendarRange size={14} strokeWidth={2} />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => void handleUndo()}
        disabled={!canUndo}
        title={lastActionLabel ? t('undo.tooltip', { action: lastActionLabel }) : undefined}
        className={`ml-auto flex flex-none items-center gap-[5px] px-3 py-1.5 text-[0.75rem] font-semibold disabled:opacity-40 ${GLASS_PILL}`}
      >
        <Undo2 size={14} strokeWidth={2} />
        {t('undo.button')}
      </button>
    </div>
  )
}

/**
 * Card header: the day pill that opens the day sheet, the accommodation chips
 * (check-out / check-in / stay) and the weather chip.
 *
 * The day pill leads unconditionally. It used to be the accommodation chip that
 * carried this, which left a day without a stay — and, with no weather either,
 * the whole header — with no way into the day sheet at all (#2004).
 */
function TimelineHeader({ tl, dayLabel, openLabel, onOpenDay }: {
  tl: MPlanTimelineController
  dayLabel: string
  openLabel: string
  onOpenDay: () => void
}) {
  const WeatherIcon = weatherIconFor(tl.weather?.main)
  return (
    <div className="flex items-center gap-1.5 border-b border-[color:var(--m-rowbr)] px-0.5 py-[9px]">
      {/* The one horizontal scroller inside the swipe zone, marked so a swipe
          that starts here is handed back to it — but only while it really
          overflows, so a short day title still swipes. */}
      <span data-hswipe-ignore className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={onOpenDay}
          aria-label={openLabel}
          className="flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2.5 py-1 font-geist text-[0.6875rem] font-semibold"
        >
          <CalendarDays size={12} strokeWidth={2.2} className="text-m-muted" />
          {dayLabel}
          <ChevronRight size={11} strokeWidth={2.4} aria-hidden="true" className="text-m-faint" />
        </button>
        {tl.hotelChips.map(chip => (
          <button
            key={chip.key}
            type="button"
            onClick={onOpenDay}
            className="flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2.5 py-1 font-geist text-[0.6875rem] font-semibold"
          >
            <HotelChipIcon variant={chip.variant} />
            {chip.name}
            {chip.time ? ` · ${chip.time.slice(0, 5)}` : ''}
          </button>
        ))}
      </span>
      {tl.weatherTemp != null && (
        <button
          type="button"
          onClick={onOpenDay}
          aria-label={openLabel}
          className="ml-auto flex flex-none items-center gap-1 whitespace-nowrap px-1.5 py-1 text-[0.71875rem] font-semibold"
        >
          <WeatherIcon size={13} strokeWidth={2} />
          {tl.weatherTemp}°
        </button>
      )}
    </div>
  )
}

/** Icon-coded like the demo, colour-tinted per the audit (green in / red out). */
function HotelChipIcon({ variant }: { variant: 'checkout' | 'checkin' | 'stay' }) {
  if (variant === 'checkout') return <LogOut size={12} strokeWidth={2.2} className="text-[color:var(--m-st-danger)]" />
  if (variant === 'checkin') return <LogIn size={12} strokeWidth={2.2} className="text-[color:var(--m-st-confirmed)]" />
  return <BedDouble size={12} strokeWidth={2.2} className="text-m-muted" />
}

/** Edit-mode action tile — Place · Note · Booking · Transport · Optimize · Google Maps, three per row. */
function PlanAction({ icon: Icon, label, onClick }: {
  // Google Maps hands in its own brand mark, which is not a lucide icon (#2005).
  icon: LucideIcon | ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-1 py-2.5 transition-transform active:scale-[.97]"
    >
      <Icon size={17} strokeWidth={2} className="text-m-muted" />
      <span className="max-w-full text-center font-geist text-[0.625rem] font-semibold leading-tight text-m-ink">{label}</span>
    </button>
  )
}
