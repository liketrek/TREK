import { ChevronDown, ChevronRight, Hotel } from 'lucide-react'
import { fs, NEUTRAL_TINT } from '../../components/shared/DialogShell'
import { getCategoryIcon } from '../../components/shared/categoryIcons'
import { Tooltip } from '../../components/shared/Tooltip'
import { SoftPill, TimePill, tintOf } from '../../components/Planner/planParts'
import { TypeTile } from '../../components/Planner/bookings/bookingParts'
import { typeInfo } from '../../components/Planner/bookings/bookingsModel'
import { getNoteIcon } from '../../components/Planner/DayPlanSidebar.constants'
import { noteSurface } from '../../components/Planner/noteSurface'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { getDisplayTimeForDay, getSpanPhase, type MergedItem } from '../../utils/dayMerge'
import { formatTime, splitReservationDateTime } from '../../utils/formatters'
import { safeHexColor } from '../../utils/safeColor'
import { SharedPlaceDetails, type SharedPlaceLike } from './SharedPlaceDetails'
import { spanLabelKey, transportFacts, type SharedTransport } from './sharedTripModel'

const DAY_HEAD_SELECTED = 'color-mix(in srgb, var(--accent) 12%, transparent)'

export interface SharedDayCardProps {
  day: { id: number; title?: string | null; date?: string | null; day_number: number }
  index: number
  selected: boolean
  collapsed: boolean
  onSelect: () => void
  onToggleCollapse: () => void
  /** The day's rows, merged and ordered the way the planner orders them. */
  items: MergedItem[]
  stays: { id: number; place_name?: string | null; start_day_id?: number | null; end_day_id?: number | null }[]
  placeCount: number
  stopNumber: Record<number, number>
  categories: { id: number; color?: string | null; icon?: string | null }[]
  /** A "travel and stays" link (#1712) counts no places and says nothing about an empty plan. */
  travelOnly?: boolean
}

/**
 * One day as the planner draws it: a head band with the day's number on a
 * raised tile, its name, date and stays, and the plan below it. Clicking the
 * head opens the day on the map; the chevron folds the plan away.
 */
export function SharedDayCard(p: SharedDayCardProps) {
  const { t, locale } = useTranslation()
  const { day } = p
  // A stays-only day on a travel link is its head alone: its hotel pill says it all.
  const hasBody = !(p.travelOnly && p.items.length === 0)
  const date = day.date
    ? new Date(`${day.date}T00:00:00Z`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    : null

  return (
    <article
      id={`shared-day-${day.id}`}
      className={`scroll-mt-20 overflow-hidden rounded-2xl border border-edge-faint bg-surface-card transition-shadow ${p.selected ? 'shadow-md' : ''}`}
    >
      <div className="flex items-start gap-1 py-2.5 ps-2.5 pe-2" style={{ background: p.selected ? DAY_HEAD_SELECTED : NEUTRAL_TINT }}>
        <button type="button" onClick={p.onSelect} aria-pressed={p.selected} className="flex min-w-0 flex-1 items-start gap-2.5 text-start">
          <span
            className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] font-geist font-bold tabular-nums shadow-sm ${p.selected ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-muted'}`}
            style={fs(12)}
          >
            {p.index + 1}
          </span>
          <span className="min-w-0 flex-1 pt-px">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="min-w-0 truncate font-bold text-content" style={fs(13.5, 'body')}>
                {day.title || t('dayplan.dayN', { n: day.day_number })}
              </span>
              {date && <span className="flex-none whitespace-nowrap text-content-faint" style={fs(11)}>{date}</span>}
            </span>
            <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1">
              {p.stays.map(stay => <StayPill key={stay.id} stay={stay} dayId={day.id} />)}
              {!p.travelOnly && <SoftPill>{p.placeCount} {t('shared.places', { count: p.placeCount })}</SoftPill>}
            </span>
          </span>
        </button>
        {hasBody && <button
          type="button"
          onClick={p.onToggleCollapse}
          aria-label={p.collapsed ? t('common.expand') : t('common.collapse')}
          aria-expanded={!p.collapsed}
          className="grid h-7 w-7 flex-none place-items-center rounded-full text-content-muted hover:bg-surface-card hover:text-content"
        >
          {p.collapsed ? <ChevronRight size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
        </button>}
      </div>

      {hasBody && !p.collapsed && (
        <div className="flex flex-col gap-0.5 border-t border-edge-faint p-1.5">
          {p.items.length === 0 ? (
            <p className="px-2 py-2.5 text-content-faint" style={fs(12, 'body')}>{t('dayplan.emptyDay')}</p>
          ) : (
            p.items.map(item => {
              if (item.type === 'transport') return <TransportRow key={item.data.__leg ? `t-${item.data.id}-leg${item.data.__leg.index}` : `t-${item.data.id}`} r={item.data} dayId={day.id} />
              if (item.type === 'note') return <NoteRow key={`n-${item.data.id}`} note={item.data} />
              if (!item.data.place) return null
              return (
                <PlaceRow
                  key={`p-${item.data.id}`}
                  place={item.data.place}
                  notes={item.data.notes}
                  number={p.stopNumber[item.data.id]}
                  category={p.categories.find(c => c.id === item.data.place.category_id) ?? item.data.place.category ?? null}
                />
              )
            })
          )}
        </div>
      )}
    </article>
  )
}

/** A stay on this day, its check-in green and its check-out red, as the planner marks them. */
function StayPill({ stay, dayId }: { stay: SharedDayCardProps['stays'][number]; dayId: number }) {
  const { t } = useTranslation()
  const isCheckIn = stay.start_day_id === dayId
  const isCheckOut = stay.end_day_id === dayId
  const state = isCheckOut && !isCheckIn ? t('day.checkOut') : isCheckIn ? t('day.checkIn') : null
  const tone = isCheckOut && !isCheckIn ? 'text-danger' : isCheckIn ? 'text-success' : 'text-content-faint'
  const name = stay.place_name || ''
  return (
    <Tooltip label={state ? `${state}: ${name}` : name}>
      <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-surface-card px-2 py-[2px] font-geist text-content-secondary shadow-sm" style={fs(10.5)}>
        <Hotel size={11} strokeWidth={2} className={`flex-none ${tone}`} />
        <span className="truncate">{name}</span>
      </span>
    </Tooltip>
  )
}

export interface PlaceRowProps {
  place: SharedPlaceLike & { id: number; image_url?: string | null }
  notes?: string | null
  number?: number
  category: { color?: string | null; icon?: string | null } | null
}

export function PlaceRow({ place, notes, number, category }: PlaceRowProps) {
  const { locale } = useTranslation()
  const timeFormat = useSettingsStore(s => s.settings.time_format)
  const color = safeHexColor(category?.color, '#6366f1')
  const CatIcon = getCategoryIcon(category?.icon)
  const time = place.place_time
    ? `${formatTime(place.place_time, locale, timeFormat)}${place.end_time ? ` → ${formatTime(place.end_time, locale, timeFormat)}` : ''}`
    : null
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-2 py-2">
      <span className="relative flex-none">
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full shadow-sm" style={{ background: color }}>
          {place.image_url
            ? <img src={place.image_url} alt="" className="h-full w-full object-cover" />
            : <CatIcon size={16} strokeWidth={2} color="white" />}
        </span>
        {number != null && (
          <span className="absolute -bottom-1 -end-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border border-edge-faint bg-surface-card px-1 font-geist font-bold tabular-nums text-content shadow-sm" style={fs(9.5)}>
            {number}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex min-w-0 items-start gap-2">
          <span className="min-w-0 flex-1 font-semibold text-content" style={{ ...fs(13.5, 'body'), lineHeight: 1.3 }}>{place.name}</span>
          {time && <TimePill className="mt-px">{time}</TimePill>}
        </div>
        <SharedPlaceDetails place={place} assignmentNotes={notes} />
      </div>
    </div>
  )
}

function TransportRow({ r, dayId }: { r: SharedTransport; dayId: number }) {
  const { t, locale } = useTranslation()
  const timeFormat = useSettingsStore(s => s.settings.time_format)
  const color = typeInfo(r.type).color
  // A leg carries its own times; the booking's span decides which of its two a day shows.
  const phase = r.__leg ? 'single' : getSpanPhase(r, dayId)
  const start = splitReservationDateTime(r.__leg ? r.reservation_time : getDisplayTimeForDay(r, dayId)).time
  const end = phase === 'single' ? splitReservationDateTime(r.reservation_end_time).time : null
  const time = [start ? formatTime(start, locale, timeFormat) : '', end ? formatTime(end, locale, timeFormat) : ''].filter(Boolean).join(' → ')
  const spanKey = spanLabelKey(r.type, phase)
  const facts = transportFacts(r, t('reservations.meta.platform'))
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5" style={{ border: `1px solid ${tintOf(color, 24)}`, background: tintOf(color, 7) }}>
      <TypeTile type={r.type} size={34} raised />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-content" style={{ ...fs(13, 'body'), lineHeight: 1.3 }}>{r.title}</div>
        {(time || spanKey || facts.length > 0) && (
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
            {spanKey && <SoftPill caps>{t(spanKey)}</SoftPill>}
            {time && <TimePill>{time}</TimePill>}
            {facts.map(f => <span key={f} className="whitespace-nowrap font-medium text-content-muted" style={fs(11)}>{f}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteRow({ note }: { note: { id: number; text: string; time?: string | null; icon?: string | null; color?: string | null } }) {
  const skin = noteSurface(note.color)
  const Icon = getNoteIcon(note.icon)
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-2 py-2" style={{ background: skin.background, border: `1px solid ${skin.border}` }}>
      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px]" style={{ background: skin.iconBackground, color: skin.iconColor }}>
        <Icon size={14} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="whitespace-pre-wrap text-content-secondary [overflow-wrap:anywhere]" style={fs(12.5, 'body')}>{note.text}</div>
        {note.time && <div className="mt-1"><TimePill>{note.time}</TimePill></div>}
      </div>
    </div>
  )
}
