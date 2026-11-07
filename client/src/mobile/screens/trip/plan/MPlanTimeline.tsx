import { useEffect, useState, type MouseEvent } from 'react'
import { ArrowRight, BedDouble, CalendarDays, CalendarRange, ChevronRight, LogIn, LogOut, Map as MapIcon, MapPin, Pencil, PencilLine, Route, Ticket, TrainFront, Undo2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useContextMenu, ContextMenu } from '../../../../components/shared/ContextMenu'
import MarkdownText from '../../../../components/shared/MarkdownText'
import { fmtTransitDuration } from '../../../../components/Planner/transitDisplay'
import { legModeMenuItems } from '../../../../components/Planner/useLegModeActions'
import { formatTime } from '../../../../utils/formatters'
import { useMPlanTimeline, type MPlanTimelineController } from './useMPlanTimeline'
import { cityPillsForDay } from './planTimelineModel'
import { weatherIconFor } from '../../../../components/Weather/weatherIcons'
import type { HotelChip, PlanRow } from './planTimelineModel'
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
import type { RouteSegment } from '../../../../types'
import type { Assignment } from '../../../../types'
import type { ReactNode } from 'react'
import { useSettingsStore } from '../../../../store/settingsStore'
import MRouteAppsSheet from './MRouteAppsSheet'
import { openRouteTarget } from './openRouteTarget'
import MDayPager from '../../../components/MDayPager'
import { edgeFadeClass, useEdgeFade } from '../../../components/useEdgeFade'
import { useDayPreviewStore } from '../../../dayPreviewStore'

/**
 * Plan-tab timeline of the mobile trip screen: the UP-NEXT card in go mode,
 * city pills + rename + named undo in edit mode, and the frosted timeline card
 * (hotel/weather header, the five row types, the dashed add bars). Layout
 * follows the demo's absolute geometry, re-anchored to the shell's safe-top.
 */

const GLASS_PILL = 'rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)]'
/** A tappable pill in the same glass, 28px tall like GLASS_ROUND, for a label. */
const GLASS_CHIP = `relative flex h-7 flex-none items-center whitespace-nowrap font-geist text-[0.6875rem] font-semibold text-m-ink transition-transform active:scale-95 ${GLASS_PILL}`
/** A round control the size of a GLASS_PILL row, with a 44px hit area around it. */
const GLASS_ROUND = `relative flex h-7 w-7 flex-none items-center justify-center text-m-muted transition-transform active:scale-95 before:absolute before:-inset-2 before:content-[''] ${GLASS_PILL}`

export default function MPlanTimeline({ planner, shell }: MPlanTimelineProps) {
  const { t, trip, can } = planner
  const editing = shell.mode === 'edit' && can('day_edit', trip)
  // Per-segment travel mode (#1281): one menu for the whole pager, opened from
  // whichever day is current.
  const legMenu = useContextMenu()
  // Plugin time contributions in the day plan (dayScheduleProvider hook) —
  // slotted under their anchor rows, same as the desktop sidebar.
  const daySchedule = usePluginDaySchedule(planner.tripId)
  // Long-press drag reordering (#1997). Armed only in edit mode, so go-mode taps,
  // map pans and plain list scrolling keep the gesture — which is what kept
  // #1432/#1440 from coming back when the old document-wide polyfill was dropped.
  // Coarse pointers only: a hybrid laptop narrow enough to land in the phone
  // shell already loads drag-drop-touch (utils/touchDragPolyfill), and two
  // bridges would fight over one gesture. The rows' native drag props serve
  // both, so nothing is lost there. One bridge for the pager: it listens on
  // the document, and only the current day arms its rows.
  const isTouch = useIsTouch()
  useTouchDragBridge(editing && isTouch)
  const [dragging, setDragging] = useState(false)
  const setDayPreview = useDayPreviewStore(s => s.setDayId)

  return (
    <div className="absolute inset-0">
      <ContextMenu menu={legMenu.menu} onClose={legMenu.close} />
      {/* Swipe the days like pages (#2051): the one-handed way to the next day,
          since the chip rail is pinned to the top of the screen. */}
      <MDayPager
        days={planner.days}
        selectedDayId={planner.selectedDayId}
        // skipFit, exactly like the chip tap in plan view: the map underneath stays
        // mounted, and re-framing it here would move it somewhere nobody asked for.
        onSelectDay={dayId => planner.handleSelectDay(dayId, true)}
        onPreview={setDayPreview}
        locked={dragging || legMenu.menu != null}
        describeDay={(i, n) => t('mobileTrip.dayAnnounce', { current: i + 1, total: n })}
        renderDay={(dayId, active) => (
          <PlanDayPage
            planner={planner}
            shell={shell}
            dayId={dayId}
            active={active}
            editing={editing}
            legMenu={legMenu}
            daySchedule={daySchedule}
            onDragging={active ? setDragging : undefined}
          />
        )}
      />
    </div>
  )
}

/**
 * One day of the timeline: the UP-NEXT card or the edit header, and the frosted
 * card. The pager draws the current day and its two neighbours with this; only
 * the current one is live, the others are inert previews of the same markup so
 * the page that slides in is exactly what lands.
 */
function PlanDayPage({ planner, shell, dayId: pageDayId, active, editing, legMenu, daySchedule, onDragging }: MPlanTimelineProps & {
  dayId: number | null
  active: boolean
  editing: boolean
  legMenu: ReturnType<typeof useContextMenu>
  daySchedule: ReturnType<typeof usePluginDaySchedule>
  onDragging?: (dragging: boolean) => void
}) {
  const tl = useMPlanTimeline(planner, pageDayId)
  const { t, trip, can } = planner
  const canEdit = can('day_edit', trip)
  const canEditPlaces = can('place_edit', trip)
  const openLegMenu = (e: MouseEvent, assignmentId: number, seg: RouteSegment) => {
    // Public transit sits under the road profiles, as on the desktop (#2398).
    const transitLeg = tl.transitLegFor(seg)
    legMenu.open(e, legModeMenuItems(
      tl.routeModeOptions,
      mode => tl.setLegMode(assignmentId, mode),
      t,
      transitLeg ? () => tl.planTransitLeg(transitLeg, assignmentId) : undefined,
    ))
  }
  const day = tl.day
  const dayId = day?.id
  // A stay chip shows the stay before anything can be changed, as on the
  // desktop: its booking's overview (dates, nights, status, Edit) where one is
  // booked, else the hotel's place. Only a stay with neither opens the editor
  // for members who may edit days, or the day sheet, so the chip never goes
  // dead (#2210).
  const openStay = (chip: HotelChip) => {
    if (!day) return
    const booking = planner.reservations.find(r => r.accommodation_id != null && String(r.accommodation_id) === String(chip.accId))
    if (booking) shell.openSheet('transport', { reservationId: booking.id })
    else if (chip.placeId != null) planner.handlePlaceClick(chip.placeId)
    else if (canEdit) shell.openSheet('accommodation', { dayId: day.id, accId: chip.accId, from: 'timeline' })
    else shell.openSheet('day', { dayId: day.id })
  }
  // The icon alone tells check-out from check-in; the accessible name says it.
  const stayLabel = (chip: HotelChip) => {
    const kind = chip.variant === 'checkin' ? t('day.checkIn') : chip.variant === 'checkout' ? t('day.checkOut') : t('mobileTrip.stay')
    return `${kind} · ${chip.name}${chip.time ? ` · ${chip.time.slice(0, 5)}` : ''}`
  }
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

  const dnd = useMPlanDragReorder({
    merged: tl.merged,
    dayId,
    onMove: tl.moveRowTo,
    enabled: editing && active,
  })
  const draggingNow = dnd.draggingKey != null
  useEffect(() => { onDragging?.(draggingNow) }, [onDragging, draggingNow])

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
  const [cardScroll, setCardScroll] = useState<HTMLDivElement | null>(null)
  const cardFade = useEdgeFade(cardScroll, 'y')

  // One Maps button for every app the day can be opened in: the preferred app
  // from settings (#2423) opens straight away, otherwise the sheet asks.
  const [mapsOpen, setMapsOpen] = useState(false)
  const preferredNavApp = useSettingsStore(s => s.settings.preferred_nav_app)
  const openMaps = () => {
    const preferred = preferredNavApp ? tl.routeTargets.find(target => target.id === preferredNavApp) : undefined
    if (preferred) openRouteTarget(preferred)
    else setMapsOpen(true)
  }

  return (
    <>
    <MRouteAppsSheet open={mapsOpen} onClose={() => setMapsOpen(false)} targets={tl.routeTargets} t={t} />
    {/* One column under the day chips: the UP-NEXT card (go mode) or the edit
        header, then the timeline card filling the rest, 12px apart whatever height
        the card above it has. A day without an up-next starts the timeline right
        under the chips. On a wide window the column ends where the rail does.
        Beside the map the card is the pane and runs down to that line, as the
        places list does; across the page it is as tall as its day, so a short
        day leaves no empty card under it. */}
    <div className="absolute inset-x-4 flex flex-col gap-3 top-[calc(var(--m-safe-top,12px)+102px)] bottom-[calc(env(safe-area-inset-bottom,0px)+90px)] wide:bottom-[calc(env(safe-area-inset-bottom,0px)+12px)]">
      {!editing && <UpNextCard tl={tl} t={t} onOpen={openPlace} />}
      {editing && <EditHeader tl={tl} planner={planner} shell={shell} />}

      {/* The frame and the scroller are two boxes, so the fade where a row runs on
          past the card's edge takes the rows and leaves the card's own edge whole. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)] backdrop-blur-[24px] backdrop-saturate-[1.6] wide:flex-initial split:flex-1">
      <div
        ref={setCardScroll}
        data-touch-drag={editing && active ? '' : undefined}
        data-timeline-card=""
        className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3.5 pb-2 pt-1 ${edgeFadeClass(cardFade, 'y')}`}
      >
        {planner.toursEnabled && tl.rows.some(row => row.kind === 'place' && row.invalidTour) && (
          <div role="status" className="border-b border-[color:var(--warning)] p-2 text-sm text-[color:var(--warning)]">
            {t('tours.dayRoute.endpointUnknown')}
          </div>
        )}
        {day && (
          <TimelineHeader
            tl={tl}
            // Edit mode already names the day in its own header a row above, so
            // the pill drops to icon-only there rather than saying it twice.
            dayLabel={editing ? '' : dayLabel}
            openLabel={t('day.overview')}
            // The chip still opens the day sheet, but its accessible name says
            // WHERE the forecast is for — a roadtrip day is ambiguous otherwise (#2167).
            weatherLabel={tl.weatherPlaceName
              ? `${t('day.overview')} · ${t('day.weatherFor', { name: tl.weatherPlaceName })}`
              : undefined}
            onOpenDay={() => shell.openSheet('day', { dayId: day.id })}
            onOpenStay={openStay}
            stayLabel={stayLabel}
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
                    tour={planner.toursEnabled ? planner.tours.find(tour => tour.place_id === row.assignment.place_id) : undefined}
                    fullPlace={tl.fullPlaceOf(row.assignment)}
                    linkedReservations={row.linkedReservations}
                    chrome={chrome}
                    reorder={reorderFor(row.item)}
                    drag={dragFor(row)}
                    onOpen={() => openPlace(row.assignment)}
                    onEdit={canEditPlaces ? () => tl.editAssignment(row.assignment) : undefined}
                    onRemove={() => tl.removeAssignment(row.assignment)}
                    overrun={planner.toursEnabled ? tl.tourOverrun(row.item) : null}
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
                      else shell.openSheet('transport', { reservationId: row.res.id, legIndex: row.res.__leg?.index })
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
                    late={tl.journeyLate(row.item)}
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
              return <ConnRow key={row.key} seg={row.seg} onTap={editing && row.assignmentId != null ? e => openLegMenu(e, row.assignmentId!, row.seg) : undefined} />
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
          // The day's actions as one group on one glass surface, the way iOS groups
          // its controls: each a round icon over its label.
          <div className="mt-3 grid grid-cols-3 gap-x-1 gap-y-2 rounded-[22px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-2 shadow-[0_8px_24px_-16px_rgba(0,0,0,.35)] backdrop-blur-[24px] backdrop-saturate-[1.7]">
            <PlanAction icon={MapPin} label={t('mobileTrip.addPlaceShort')} onClick={tl.addPlace} />
            <PlanAction
              icon={PencilLine}
              label={t('mobileTrip.addNoteShort')}
              onClick={() => day && shell.openSheet('note', { dayId: day.id })}
            />
            <PlanAction icon={Ticket} label={t('mobileTrip.addBookingShort')} onClick={tl.addBooking} />
            <PlanAction icon={TrainFront} label={t('mobileTrip.addTransportShort')} onClick={tl.addTransport} />
            <PlanAction icon={Route} label={t('dayplan.optimize')} onClick={() => void tl.optimize()} />
            {tl.canExportRoute && tl.routeTargets.length > 0 && (
              <PlanAction icon={MapIcon} label={t('mobileTrip.maps')} onClick={openMaps} />
            )}
          </div>
        )}
      </div>
      </div>
    </div>
    </>
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
      // The same surface as the timeline card under it: the two are one plan, and
      // the place at the top plus the round arrow already say which stop is next.
      className="flex-none cursor-pointer rounded-[22px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)] px-4 py-3.5 text-start backdrop-blur-[24px] backdrop-saturate-[1.6] transition-transform active:scale-[.99]"
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
            <span dir="auto" className="min-w-0 truncate text-[1.125rem] font-bold">{place?.name}</span>
          </div>
          {sub && <MarkdownText clamp className="mt-[2px] font-geist text-[0.75rem] text-m-muted">{sub}</MarkdownText>}
        </div>
        <span className="ms-2 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg">
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
    <div className="flex flex-none items-center gap-2">
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
            className={GLASS_ROUND}
          >
            <Pencil size={13} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label={t('dayplan.reorderDays')}
            onClick={() => shell.openSheet('days')}
            className={GLASS_ROUND}
          >
            <CalendarRange size={13} strokeWidth={2.2} />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => void handleUndo()}
        disabled={!canUndo}
        title={lastActionLabel ? t('undo.tooltip', { action: lastActionLabel }) : undefined}
        className={`ms-auto flex flex-none items-center gap-[5px] px-3 py-1.5 text-[0.75rem] font-semibold disabled:opacity-40 ${GLASS_PILL}`}
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
 * carried this, which left a day without a stay (and, with no weather either,
 * the whole header) with no way into the day sheet at all (#2004). Since then
 * the stay chips have a target of their own: tapping a hotel opens that stay,
 * not the day (#2210). Only the weather chip still shares the day pill's target.
 */
function TimelineHeader({ tl, dayLabel, openLabel, weatherLabel, onOpenDay, onOpenStay, stayLabel }: {
  tl: MPlanTimelineController
  dayLabel: string
  openLabel: string
  /** Weather-chip label naming the forecast's anchor place (#2167); falls back to openLabel. */
  weatherLabel?: string
  onOpenDay: () => void
  onOpenStay: (chip: HotelChip) => void
  stayLabel: (chip: HotelChip) => string
}) {
  const WeatherIcon = weatherIconFor(tl.weather?.main)
  return (
    <div className="flex items-center gap-1.5 border-b border-[color:var(--m-rowbr)] px-0.5 py-[9px]">
      {/* The one horizontal scroller inside the day pager. Nested scrolling is
          the browser's: while the chips overflow they pan first, and the pager
          takes over at their end or when they fit. */}
      <span className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {/* The same glass controls as the edit header's: a round one when the day
            is already named above it, a pill with the day's name otherwise. */}
        <button
          type="button"
          onClick={onOpenDay}
          aria-label={openLabel}
          // No widened hit area here: inside the scrolling chip strip it would add
          // a few pixels of sideways scroll.
          className={dayLabel ? `${GLASS_CHIP} gap-[5px] px-2.5` : `${GLASS_CHIP} w-7 justify-center`}
        >
          <CalendarDays size={13} strokeWidth={2.2} className="text-m-muted" />
          {dayLabel && (
            <>
              {dayLabel}
              <ChevronRight size={11} strokeWidth={2.4} aria-hidden="true" className="text-m-faint" />
            </>
          )}
        </button>
        {/* A stay gives way before anything else in the header does: its name ends
            in an ellipsis rather than under the edge or the weather (the chip's
            label says it whole), and the time after it stays. */}
        {tl.hotelChips.map(chip => (
          <button
            key={chip.key}
            type="button"
            onClick={() => onOpenStay(chip)}
            aria-label={stayLabel(chip)}
            className={`${GLASS_CHIP} min-w-[4.5rem] shrink gap-[5px] px-2.5`}
          >
            <HotelChipIcon variant={chip.variant} />
            <span className="min-w-0 truncate">{chip.name}</span>
            {chip.time && <span className="flex-none tabular-nums text-m-muted">{chip.time.slice(0, 5)}</span>}
          </button>
        ))}
      </span>
      {tl.weatherTemp != null && (
        <button
          type="button"
          onClick={onOpenDay}
          aria-label={weatherLabel || openLabel}
          title={tl.weatherPlaceName || undefined}
          className={`${GLASS_CHIP} ms-auto gap-1 px-2.5`}
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

/** One action of the edit-mode group: Place, Note, Booking, Transport, Optimize, Maps,
 *  three per row, a round icon over its label. */
function PlanAction({ icon: Icon, label, onClick }: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[16px] px-1 py-2 transition-transform active:scale-[.94]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink transition-colors group-active:bg-[color:var(--m-rowbr)]">
        <Icon size={19} strokeWidth={2} />
      </span>
      <span className="max-w-full text-center font-geist text-[0.6875rem] font-semibold leading-tight text-m-ink">{label}</span>
    </button>
  )
}
