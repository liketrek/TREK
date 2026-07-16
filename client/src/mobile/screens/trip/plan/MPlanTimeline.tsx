import { useState } from 'react'
import {
  ArrowRight, ArrowUpRight, BedDouble, CalendarRange, ChevronRight, LogIn, LogOut,
  MapPin, Pencil, PencilLine, Route, Ticket, TrainFront, Undo2,
} from 'lucide-react'
import { fmtTransitDuration } from '../../../../components/Planner/transitDisplay'
import { formatTime } from '../../../../utils/formatters'
import { useMPlanTimeline, type MPlanTimelineController } from './useMPlanTimeline'
import { cityPillsForDay, weatherIconFor } from './planTimelineModel'
import { ConnRow, NoteRow, PlaceRow, ReorderStack, TransitRow, TransportRow } from './MPlanTimelineRows'
import MDancingTrek from '../../../components/MDancingTrek'
import type { MPlanTimelineProps } from '../MTripShell'
import type { MergedItem } from '../../../../utils/dayMerge'
import type { Assignment } from '../../../../types'
import type { ReactNode } from 'react'

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

  // Selecting the place is enough — the place inspector sheet opens off the
  // planner's selection, same contract as map marker taps.
  const openPlace = (assignment: Assignment) => {
    planner.handlePlaceClick(assignment.place?.id ?? null, assignment.id)
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
    <div className="absolute inset-0">
      {!editing && <UpNextCard tl={tl} t={t} onOpen={openPlace} />}
      {editing && <EditHeader tl={tl} planner={planner} shell={shell} />}

      {/* Timeline card — go mode leaves room for the UP-NEXT card above, but
          collapses that reserved space up to the day chips when the day has no
          up-next (no places), so an empty day shows no gap. */}
      <div
        className="absolute left-4 right-4 overflow-y-auto overscroll-contain rounded-[22px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)] px-3.5 pb-2 pt-1 backdrop-blur-[24px] backdrop-saturate-[1.6] bottom-[calc(env(safe-area-inset-bottom,0px)+90px)]"
        style={{ top: `calc(var(--m-safe-top, 12px) + ${editing ? 140 : tl.upNext ? 216 : 102}px)` }}
      >
        <TimelineHeader tl={tl} onOpenDay={() => tl.day && shell.openSheet('day', { dayId: tl.day.id })} />

        {tl.rows.map(row => {
          switch (row.kind) {
            case 'place':
              return (
                <PlaceRow
                  key={row.key}
                  assignment={row.assignment}
                  fullPlace={tl.fullPlaceOf(row.assignment)}
                  linkedRes={row.linkedRes}
                  chrome={chrome}
                  reorder={reorderFor(row.item)}
                  onOpen={() => openPlace(row.assignment)}
                  onEdit={() => tl.editAssignment(row.assignment)}
                  onRemove={() => tl.removeAssignment(row.assignment)}
                />
              )
            case 'transport':
              return (
                <TransportRow
                  key={row.key}
                  res={row.res}
                  dayId={tl.day!.id}
                  chrome={chrome}
                  reorder={reorderFor(row.item)}
                  onOpen={() => {
                    if (editing) tl.editTransport(row.res)
                    else shell.openSheet('transport', { reservationId: row.res.id })
                  }}
                />
              )
            case 'transit':
              return (
                <TransitRow
                  key={row.key}
                  res={row.res}
                  transit={row.transit}
                  dayId={tl.day!.id}
                  open={tl.openTransitKeys.has(row.key)}
                  chrome={chrome}
                  reorder={reorderFor(row.item)}
                  onToggle={() => tl.toggleTransit(row.key)}
                  onOpenJourney={() => tl.openTransitJourney(row.res)}
                />
              )
            case 'note':
              return (
                <NoteRow
                  key={row.key}
                  note={row.note}
                  chrome={chrome}
                  reorder={reorderFor(row.item)}
                  onEdit={() => tl.day && shell.openSheet('note', { dayId: tl.day.id, note: row.note })}
                />
              )
            case 'conn':
              return <ConnRow key={row.key} seg={row.seg} />
          }
        })}

        {tl.rows.length === 0 && !editing && (
          <div className="flex flex-col items-center py-8 text-center">
            <MDancingTrek scene="guide" size={84} className="mb-1" />
            <p className="font-geist text-[0.75rem] text-m-muted">{t('dayplan.emptyDay')}</p>
          </div>
        )}

        {editing && (
          <>
            <AddBar className="mt-2.5">
              <AddBarButton label={t('mobileTrip.addPlaceShort')} onClick={tl.addPlace}>
                <MapPin size={12} strokeWidth={2} />
              </AddBarButton>
              <AddBarSep />
              <AddBarButton
                label={t('mobileTrip.addNoteShort')}
                onClick={() => tl.day && shell.openSheet('note', { dayId: tl.day.id })}
              >
                <PencilLine size={12} strokeWidth={2} />
              </AddBarButton>
              <AddBarSep />
              <AddBarButton label={t('mobileTrip.addBookingShort')} onClick={tl.addBooking}>
                <Ticket size={12} strokeWidth={2} />
              </AddBarButton>
              <AddBarSep />
              <AddBarButton label={t('mobileTrip.addTransportShort')} onClick={tl.addTransport}>
                <TrainFront size={12} strokeWidth={2} />
              </AddBarButton>
            </AddBar>
            <AddBar className="mt-2">
              <AddBarButton label={t('dayplan.optimize')} onClick={() => void tl.optimize()}>
                <Route size={12} strokeWidth={2} />
              </AddBarButton>
              <AddBarSep />
              <AddBarButton label={t('mobileTrip.googleMaps')} onClick={tl.exportGoogleMaps}>
                <ArrowUpRight size={12} strokeWidth={2} />
              </AddBarButton>
            </AddBar>
          </>
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
    <div
      onClick={() => onOpen(upNext.assignment)}
      className="absolute left-4 right-4 cursor-pointer rounded-[22px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-4 py-3.5 shadow-[0_18px_44px_-18px_rgba(0,0,0,.3)] backdrop-blur-[28px] backdrop-saturate-[1.8] top-[calc(var(--m-safe-top,12px)+102px)]"
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
    </div>
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

/** Card header: accommodation chips (check-out / check-in / stay) + the weather chip. */
function TimelineHeader({ tl, onOpenDay }: { tl: MPlanTimelineController; onOpenDay: () => void }) {
  const WeatherIcon = weatherIconFor(tl.weather?.main)
  return (
    <div className="flex items-center gap-1.5 border-b border-[color:var(--m-rowbr)] px-0.5 py-[9px]">
      <span className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
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
        <span className="ml-auto flex flex-none items-center gap-1 whitespace-nowrap px-1.5 py-1 text-[0.71875rem] font-semibold">
          <WeatherIcon size={13} strokeWidth={2} />
          {tl.weatherTemp}°
        </span>
      )}
    </div>
  )
}

/** Icon-coded like the demo, colour-tinted per the audit (green in / red out). */
function HotelChipIcon({ variant }: { variant: 'checkout' | 'checkin' | 'stay' }) {
  if (variant === 'checkout') return <LogOut size={12} strokeWidth={2.2} className="text-[#D6273B]" />
  if (variant === 'checkin') return <LogIn size={12} strokeWidth={2.2} className="text-[#3BA55C]" />
  return <BedDouble size={12} strokeWidth={2.2} className="text-m-muted" />
}

/** Dashed rounded add bar of the edit mode (Place · Note · Booking · Transport / Optimize · Google Maps). */
function AddBar({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`flex items-center justify-between rounded-full border-[1.5px] border-dashed border-[color:var(--m-faint)] px-3.5 py-[3px] ${className}`}>
      {children}
    </div>
  )
}

function AddBarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[5px] whitespace-nowrap px-0.5 py-[9px] font-geist text-[0.6875rem] font-semibold"
    >
      {children}
      {label}
    </button>
  )
}

function AddBarSep() {
  return <span className="h-4 w-px flex-none bg-[color:var(--m-rowbr)]" />
}
