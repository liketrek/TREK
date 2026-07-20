import { BedDouble, Car, ChevronDown, ChevronUp, Clock, Footprints, Pencil, Route, Ticket, X, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import PlaceAvatar from '../../../../components/shared/PlaceAvatar'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import { RES_ICONS, getNoteIcon } from '../../../../components/Planner/DayPlanSidebar.constants'
import { getDisplayTimeForDay, getSpanPhase } from '../../../../utils/dayMerge'
import { formatTime, splitReservationDateTime } from '../../../../utils/formatters'
import { transportSubtitle, type TransitMeta, type TransportEntry } from './planTimelineModel'
import { splitNoteTime } from '../lib/dayNotes'
import type { TransitLegDisplay } from '../../../../components/Planner/transitDisplay'
import type { Assignment, DayNote, Place, Reservation, RouteSegment, TranslationFn } from '../../../../types'

/**
 * The five row types of the mobile day timeline (place / manual transport /
 * auto-transit with collapsible legs / travel-time connector / note), each in
 * its go and edit variant. Edit rows swap the left avatar for right-hand action
 * circles; reordering is button-based — no drag on touch (#1432).
 */

interface RowChrome {
  editing: boolean
  t: TranslationFn
  language: string
  timeFormat: string
}

const fmtTime = (time: string | null | undefined, c: RowChrome): string =>
  time ? formatTime(time.slice(0, 5), c.language, c.timeFormat) : ''

/** Stacked up/down buttons in the demo's 30px action-circle footprint. */
export function ReorderStack({ onUp, onDown, canUp, canDown, t }: {
  onUp: () => void
  onDown: () => void
  canUp: boolean
  canDown: boolean
  t: TranslationFn
}) {
  return (
    <span className="flex h-[30px] w-[30px] flex-none flex-col overflow-hidden rounded-full bg-[color:var(--m-ic)]">
      <button
        type="button"
        aria-label={t('dayplan.moveUp')}
        disabled={!canUp}
        onClick={e => { e.stopPropagation(); onUp() }}
        className="flex h-[15px] w-full items-center justify-center text-m-faint disabled:opacity-30"
      >
        <ChevronUp size={12} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        aria-label={t('dayplan.moveDown')}
        disabled={!canDown}
        onClick={e => { e.stopPropagation(); onDown() }}
        className="flex h-[15px] w-full items-center justify-center text-m-faint disabled:opacity-30"
      >
        <ChevronDown size={12} strokeWidth={2.2} />
      </button>
    </span>
  )
}

function ActionCircle({ label, onClick, faint = false, children }: {
  label: string
  onClick: () => void
  faint?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={e => { e.stopPropagation(); onClick() }}
      className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] ${faint ? 'text-m-faint' : 'text-m-muted'}`}
    >
      {children}
    </button>
  )
}

/** 30px go-mode avatar ring (photo for places, icon circle for transports/notes). */
function AvatarRing({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`flex h-[30px] w-[30px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[color:var(--m-avbr)] bg-[color:var(--m-ic)] ${className}`}>
      {children}
    </span>
  )
}

const TIME_CHIP = 'flex-none whitespace-nowrap rounded-[6px] bg-[color:var(--m-ic)] px-[6px] py-px font-geist text-[0.65625rem] font-semibold'

// ── b3) Place row ────────────────────────────────────────────────────────────

export function PlaceRow({ assignment, fullPlace, linkedRes, chrome, reorder, onOpen, onEdit, onRemove }: {
  assignment: Assignment
  fullPlace: Place | undefined
  linkedRes: Reservation | null
  chrome: RowChrome
  reorder: ReactNode
  onOpen: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = chrome
  const place = assignment.place
  const CatIcon = getCategoryIcon(place?.category?.icon)
  const time = fmtTime(place?.place_time, chrome)
  const sub = linkedRes
    ? [
        linkedRes.status === 'confirmed' ? t('dayplan.confirmed') : t('dayplan.pendingRes'),
        linkedRes.confirmation_number ? `#${linkedRes.confirmation_number}` : '',
      ].filter(Boolean).join(' · ')
    : place?.address || place?.description || ''

  return (
    <div onClick={onOpen} className="flex cursor-pointer items-center gap-2.5 py-1.5">
      {!chrome.editing && (
        <AvatarRing className="shadow-[0_3px_8px_-3px_rgba(0,0,0,.4)]">
          <PlaceAvatar
            place={fullPlace ?? {
              id: place?.id ?? assignment.place_id,
              name: place?.name ?? '',
              image_url: place?.image_url ?? null,
              google_place_id: place?.google_place_id ?? null,
              osm_id: null,
              lat: place?.lat ?? null,
              lng: place?.lng ?? null,
            }}
            size={27}
            category={place?.category ? { color: place.category.color ?? undefined, icon: place.category.icon ?? undefined } : null}
          />
        </AvatarRing>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <CatIcon size={12} strokeWidth={2.2} className="flex-none text-m-muted" />
          <span className="min-w-0 truncate text-[0.875rem] font-semibold">{place?.name}</span>
          {linkedRes && (
            <span className="flex flex-none items-center gap-1 rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] text-[0.5625rem] font-bold tracking-[.04em]">
              <Ticket size={10} strokeWidth={2.2} />
              {t('mobileTrip.resBadge')}
            </span>
          )}
        </div>
        {(time || sub) && (
          <div className="mt-[2px] flex min-w-0 items-center gap-1.5">
            {time && <span className={TIME_CHIP}>{time}</span>}
            {sub && <span className="min-w-0 truncate font-geist text-[0.71875rem] text-m-muted">{sub}</span>}
          </div>
        )}
      </div>
      {chrome.editing && (
        <span className="flex flex-none items-center gap-1.5">
          <ActionCircle label={t('common.edit')} onClick={onEdit}>
            <Pencil size={14} strokeWidth={2} />
          </ActionCircle>
          <ActionCircle label={t('planner.removeFromDay')} onClick={onRemove}>
            <X size={14} strokeWidth={2} />
          </ActionCircle>
          {reorder}
        </span>
      )}
    </div>
  )
}

// ── b1) Manual transport / booking row ───────────────────────────────────────

export function TransportRow({ res, dayId, chrome, reorder, onOpen }: {
  res: TransportEntry
  dayId: number
  chrome: RowChrome
  reorder: ReactNode
  onOpen: () => void
}) {
  const Icon = RES_ICONS[res.type as keyof typeof RES_ICONS] || Ticket
  const phase = getSpanPhase(res, dayId)
  const start = splitReservationDateTime(getDisplayTimeForDay(res, dayId)).time
  const end = splitReservationDateTime(res.reservation_end_time).time
  const time = start
    ? `${fmtTime(start, chrome)}${phase === 'single' && end ? ` – ${fmtTime(end, chrome)}` : ''}`
    : ''
  const sub = transportSubtitle(res)

  return (
    <div onClick={onOpen} className="mt-1.5 flex cursor-pointer items-center gap-2.5">
      {!chrome.editing && (
        <AvatarRing>
          <Icon size={14} strokeWidth={2} />
        </AvatarRing>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-4 rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[11px] py-[7px]">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-[7px]">
            <span className="min-w-0 truncate text-[0.875rem] font-semibold">{res.title}</span>
            {time && <span className={TIME_CHIP}>{time}</span>}
          </div>
          {sub && <div className="mt-px truncate font-geist text-[0.71875rem] text-m-muted">{sub}</div>}
        </div>
        <Route size={15} strokeWidth={2} className="flex-none text-m-faint" />
      </div>
      {chrome.editing && <span className="flex flex-none items-center gap-1.5">{reorder}</span>}
    </div>
  )
}

// ── b2) Auto-transit row with collapsible legs ───────────────────────────────

function LineBadge({ leg, className = '' }: { leg: TransitLegDisplay; className?: string }) {
  return (
    <span
      className={`rounded-[6px] px-[7px] py-px text-[0.59375rem] font-extrabold ${className}`}
      style={{
        background: leg.line_color || 'var(--m-faint)',
        color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--m-actfg)',
      }}
    >
      {leg.line || leg.mode}
    </span>
  )
}

function TransitStrip({ legs }: { legs: TransitLegDisplay[] }) {
  const shown = legs.filter(l => l.mode !== 'WALK' || (l.duration || 0) >= 60)
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-m-faint">
      {shown.map((leg, i) => (
        <span key={i} className="inline-flex items-center gap-[2px]">
          {i > 0 && <span className="text-[0.5rem]">›</span>}
          {leg.mode === 'WALK' ? (
            <span className="inline-flex items-center gap-[2px] font-geist text-[0.625rem] font-bold">
              <Footprints size={11} strokeWidth={2.2} />
              {Math.round((leg.duration || 0) / 60)}
            </span>
          ) : (
            <LineBadge leg={leg} />
          )}
        </span>
      ))}
    </div>
  )
}

function TransitLegRows({ legs, t }: { legs: TransitLegDisplay[]; t: TranslationFn }) {
  const walkDash = 'repeating-linear-gradient(180deg, var(--m-faint) 0 3px, transparent 3px 7px)'
  return (
    <div className="border-t border-[color:var(--m-rowbr)] px-3 pb-3 pt-1">
      {legs.map((leg, i) => {
        const isWalk = leg.mode === 'WALK'
        const mins = leg.duration ? Math.round(leg.duration / 60) : null
        const hasSeg = i < legs.length - 1
        return (
          <div key={i} className="flex gap-[9px]">
            <span className="w-9 flex-none pt-[9px] text-right font-geist text-[0.65625rem] font-semibold tabular-nums text-m-muted">
              {isWalk ? '' : leg.from?.time?.slice(0, 5) || ''}
            </span>
            <div className="flex w-3 flex-none flex-col items-center">
              {isWalk ? (
                <span className="mt-[11px] h-[7px] w-[7px] flex-none rounded-full border-2 border-[color:var(--m-faint)]" />
              ) : (
                <span
                  className="mt-[10px] h-[9px] w-[9px] flex-none rounded-full border-[3px]"
                  style={{ borderColor: leg.line_color || 'var(--m-faint)' }}
                />
              )}
              {hasSeg && (
                <span
                  className="mt-[3px] min-h-[14px] w-[3px] flex-1 rounded-[2px]"
                  style={{ background: isWalk ? walkDash : leg.line_color || 'var(--m-faint)' }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 py-[7px]">
              {isWalk ? (
                <div className="truncate font-geist text-[0.6875rem] font-semibold text-m-muted">
                  <Footprints size={10} strokeWidth={2.2} className="mr-1 inline-block align-[-1px]" />
                  {[mins ? t('transit.min', { count: mins }) : '', t('transit.walkTo', { name: leg.to?.name || '' })]
                    .filter(Boolean).join(' · ')}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5">
                    <LineBadge leg={leg} className="flex-none" />
                    <span className="truncate text-[0.78125rem] font-bold">
                      {[leg.from?.name, leg.to?.name].filter(Boolean).join(' → ')}
                    </span>
                  </div>
                  <div className="mt-[2px] font-geist text-[0.625rem] text-m-faint">
                    {[
                      mins ? t('transit.min', { count: mins }) : null,
                      leg.stops ? t('transit.stops', { count: leg.stops }) : null,
                      leg.from?.track ? t('transit.platform', { track: leg.from.track }) : null,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TransitRow({ res, transit, dayId, open, chrome, reorder, onToggle, onOpenJourney }: {
  res: TransportEntry
  transit: TransitMeta
  dayId: number
  open: boolean
  chrome: RowChrome
  reorder: ReactNode
  onToggle: () => void
  onOpenJourney: () => void
}) {
  const { t } = chrome
  const Icon = RES_ICONS.transit
  const [from, to] = res.title.split(' → ')
  const start = splitReservationDateTime(getDisplayTimeForDay(res, dayId)).time
  const end = splitReservationDateTime(res.reservation_end_time).time
  const Chevron = open ? ChevronUp : ChevronDown

  return (
    <div className="mt-1.5 flex items-start gap-2.5">
      {!chrome.editing && (
        <AvatarRing className="mt-1">
          <Icon size={14} strokeWidth={2} />
        </AvatarRing>
      )}
      <div className="min-w-0 flex-1 overflow-hidden rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
        <div onClick={onToggle} className="cursor-pointer px-3 py-[9px]">
          <div className="flex items-center gap-[7px]">
            <span className="min-w-0 truncate text-[0.84375rem] font-bold">
              {to ? `${from} → ${to}` : res.title}
            </span>
            {start && (
              <span className="ml-auto flex-none whitespace-nowrap rounded-[6px] bg-[color:var(--m-ic)] px-[6px] py-px font-geist text-[0.6875rem] font-semibold tabular-nums">
                <Clock size={10} strokeWidth={2.2} className="mr-[3px] inline-block align-[-1px]" />
                {fmtTime(start, chrome)}{end ? ` – ${fmtTime(end, chrome)}` : ''}
              </span>
            )}
            <Chevron size={15} strokeWidth={2} className={`flex-none text-m-faint ${start ? '' : 'ml-auto'}`} />
          </div>
          <TransitStrip legs={transit.legs} />
        </div>
        {open && <TransitLegRows legs={transit.legs} t={t} />}
      </div>
      {chrome.editing && (
        <span className="mt-1 flex flex-none items-center gap-1.5">
          <ActionCircle label={t('common.edit')} onClick={onOpenJourney}>
            <Pencil size={14} strokeWidth={2} />
          </ActionCircle>
          {reorder}
        </span>
      )}
    </div>
  )
}

// ── b4) Walk/drive connector between two located places ─────────────────────

export function ConnRow({ seg }: { seg: RouteSegment }) {
  return (
    <div className="mt-[5px] flex items-center gap-2 py-px text-[color:var(--m-conn)]">
      <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
      <span className="inline-flex items-center gap-[3px] whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-faint">
        <Footprints size={10} strokeWidth={2} />
        {seg.walkingText}
      </span>
      <span className="whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-faint">
        · {seg.distanceText} ·
      </span>
      <span className="inline-flex items-center gap-[3px] whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-faint">
        <Car size={10} strokeWidth={2} />
        {seg.drivingText}
      </span>
      {/* Extra text a plugin route attached to this leg (e.g. "25 min charge"). */}
      {seg.noteText && (
        <span className="inline-flex items-center gap-[3px] whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-faint">
          <Zap size={10} strokeWidth={2} />
          {seg.noteText}
        </span>
      )}
      <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
    </div>
  )
}

// ── b4b) Accommodation bookend leg (hotel → first stop / last stop → hotel) ──

export function HotelConnRow({ seg, name, placement }: {
  seg: RouteSegment
  name: string
  placement: 'top' | 'bottom'
}) {
  const travel = (
    <div className="flex items-center gap-2 py-px text-[color:var(--m-conn)]">
      <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
      <span className="inline-flex items-center gap-[3px] whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-faint">
        <Footprints size={10} strokeWidth={2} />
        {seg.walkingText}
      </span>
      <span className="whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-faint">
        · {seg.distanceText} ·
      </span>
      <span className="inline-flex items-center gap-[3px] whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-faint">
        <Car size={10} strokeWidth={2} />
        {seg.drivingText}
      </span>
      <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
    </div>
  )
  const hotel = (
    <div className="flex items-center justify-center gap-[5px] whitespace-nowrap font-geist text-[0.59375rem] font-semibold text-m-muted">
      <BedDouble size={11} strokeWidth={2} className="flex-none" />
      <span className="min-w-0 truncate">{name}</span>
    </div>
  )
  return (
    <div className="mt-[5px] flex flex-col gap-[3px]">
      {placement === 'top' ? <>{hotel}{travel}</> : <>{travel}{hotel}</>}
    </div>
  )
}

// ── b5) Day-note row ─────────────────────────────────────────────────────────

export function NoteRow({ note, chrome, reorder, onEdit }: {
  note: DayNote
  chrome: RowChrome
  reorder: ReactNode
  onEdit: () => void
}) {
  const Icon = getNoteIcon(note.icon)
  // The time column is a free detail line; only a leading HH:MM is a real time.
  const { time: noteTime, detail } = splitNoteTime(note.time)
  const time = noteTime ? fmtTime(noteTime, chrome) : ''
  const [title, ...rest] = note.text.split('\n')
  const sub = [rest.join(' ').trim(), detail].filter(Boolean).join(' · ')

  return (
    <div
      onClick={chrome.editing ? onEdit : undefined}
      className={`my-[2px] flex items-center gap-2.5 ${chrome.editing ? 'cursor-pointer' : ''}`}
    >
      {!chrome.editing && (
        <AvatarRing>
          <Icon size={14} strokeWidth={2} className="text-m-muted" />
        </AvatarRing>
      )}
      <div className="min-w-0 flex-1 rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[11px] py-[7px]">
        <div className="flex items-center gap-1.5">
          {time && <span className={TIME_CHIP}>{time}</span>}
          <span className="min-w-0 text-[0.875rem] font-semibold">{title}</span>
        </div>
        {sub && (
          <div className="mt-px font-geist text-[0.71875rem] leading-[1.4] text-m-muted">{sub}</div>
        )}
      </div>
      {chrome.editing && <span className="flex flex-none items-center gap-1.5">{reorder}</span>}
    </div>
  )
}
