import { useEffect, useMemo, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Route as RouteIcon } from 'lucide-react'
import type { Day, Reservation } from '../../../types'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { formatTime } from '../../../utils/formatters'
import { Tooltip } from '../../shared/Tooltip'
import { typeInfo, displayTitle, TYPE_ORDER } from './bookingsModel'
import type { BookingFacts } from './bookingFacts'
import { absHour, buildAxis, dayWindow, packBars, placeReservation, type Bar, type Moment } from './timelineModel'
import { CountPill, EYEBROW, TypeTile, fs, toneColor, toneOf } from './bookingParts'

/** The whole trip in the width, or one day on an hour scale. */
export type TimelineZoom = 'trip' | 'day'

export interface BookingsTimelineProps {
  items: Reservation[]
  /** The other tab's bookings, drawn dimmed in a thin lane on top for orientation. */
  context: Reservation[]
  /** What that lane is called: the other tab's name. */
  contextLabel: string
  days: Day[]
  zoom: TimelineZoom
  onZoom: (z: TimelineZoom) => void
  byType: boolean
  showContext: boolean
  selectedId: number | null
  onSelect: (r: Reservation) => void
  factsOf: (r: Reservation) => BookingFacts
}

const LABEL_W = 156
// Below these a label stops being readable, so a long trip or a long day scrolls instead.
const MIN_DAY_W = 56
const MIN_HOUR_W = 52

type Placed = { r: Reservation; start: Moment; end: Moment }

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The bookings of a tab on the trip's days: one lane per type, bars from start
 * to end in local time. The trip view fits every day into the width, the day
 * view spreads one day over an hour scale with larger bars that carry their
 * times and route. Nothing is hidden: what has no date or lies outside the trip
 * waits in the cards below.
 */
export default function BookingsTimeline(p: BookingsTimelineProps) {
  const { t, locale } = useTranslation()
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const [scrollRef, width] = useWidth<HTMLDivElement>()
  const axis = useMemo(() => buildAxis(p.days), [p.days])
  const n = Math.max(axis.length, 1)
  const todayIndex = axis.findIndex(a => a.date === localToday())
  const dayMode = p.zoom === 'day'

  const placed = useMemo(() => p.items.map(r => ({ r, pl: placeReservation(r, axis, p.days) })), [p.items, axis, p.days])
  const onAxis = useMemo(() => placed.flatMap(x => (x.pl.kind === 'on' ? [{ r: x.r, start: x.pl.start, end: x.pl.end }] : [])), [placed])
  const tray = placed.filter(x => x.pl.kind !== 'on')
  const contextOnAxis = useMemo(() => (p.showContext
    ? p.context.flatMap(r => { const pl = placeReservation(r, axis, p.days); return pl.kind === 'on' ? [{ r, start: pl.start, end: pl.end }] : [] })
    : []), [p.context, p.showContext, axis, p.days])

  // The day view opens on today during the trip, otherwise on the first day with something on it.
  const [dayIndex, setDayIndex] = useState(() => {
    if (todayIndex >= 0) return todayIndex
    const first = onAxis.reduce((min, it) => Math.min(min, it.start.day), Infinity)
    return Number.isFinite(first) ? first : 0
  })
  const day = Math.min(dayIndex, n - 1)
  const openDay = (i: number) => { setDayIndex(i); p.onZoom('day') }

  // One scale for both views: a moment in pixels, the drawn width, and what is in view.
  const avail = Math.max(0, width - LABEL_W - 2)
  const win = dayMode ? dayWindow(onAxis, day) : null
  const winFrom = win ? day * 24 + win.from : 0
  const winTo = win ? day * 24 + win.to : n * 24
  const pxPerHour = win
    ? Math.max(MIN_HOUR_W, avail / (win.to - win.from))
    : Math.max(MIN_DAY_W, Math.floor(avail / n)) / 24
  const gridW = Math.round((winTo - winFrom) * pxPerHour)
  const toX = (m: Moment) => (absHour(m) - winFrom) * pxPerHour
  const inView = (it: Placed) => absHour(it.start) < winTo && absHour(it.end) > winFrom
  const scrolls = width > 0 && LABEL_W + gridW > width + 1
  const barH = dayMode ? 50 : 30
  const laneH = barH + 6

  // A handful of bookings per trip: packing them on every render costs nothing worth memoising.
  const groups = new Map<string, Placed[]>()
  for (const it of onAxis) {
    if (!inView(it)) continue
    const key = p.byType ? it.r.type : 'all'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(it)
  }
  const lanes = [...groups.keys()]
    .sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b))
    .map(key => ({ key, count: groups.get(key)!.length, ...packBars(groups.get(key)!, toX, gridW, dayMode ? 34 : 26) }))
  const contextBars = contextOnAxis.length ? packBars(contextOnAxis.filter(inView), toX, gridW, 12, 2) : null

  const now = new Date()
  const nowAbs = todayIndex >= 0 ? todayIndex * 24 + now.getHours() + now.getMinutes() / 60 : null
  const nowX = nowAbs != null && nowAbs >= winFrom && nowAbs <= winTo ? (nowAbs - winFrom) * pxPerHour : null

  const fmtDay = (date: string, opts: Intl.DateTimeFormatOptions) => new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, { ...opts, timeZone: 'UTC' })
  const dayName = (i: number) => axis[i]?.title || t('dayplan.dayN', { n: axis[i]?.dayNumber ?? i + 1 })
  const range = axis[0]?.date && axis[axis.length - 1]?.date
    ? `${fmtDay(axis[0].date!, { day: 'numeric', month: 'short' })} → ${fmtDay(axis[axis.length - 1].date!, { day: 'numeric', month: 'short' })}`
    : null
  const hourLabel = (h: number) => formatTime(`${String(h % 24).padStart(2, '0')}:00`, locale, timeFormat)
  const hourStep = pxPerHour >= (timeFormat === '12h' ? 72 : 56) ? 1 : 2

  const [hover, setHover] = useState<{ r: Reservation; rect: DOMRect } | null>(null)
  const hoverProps = (r: Reservation): HoverHandlers => ({
    onMouseEnter: e => setHover({ r, rect: e.currentTarget.getBoundingClientRect() }),
    onMouseLeave: () => setHover(null),
    onFocus: e => setHover({ r, rect: e.currentTarget.getBoundingClientRect() }),
    onBlur: () => setHover(null),
  })

  // Weekend days in the trip view, the night hours in the day view.
  const Cells = () => win ? (
    <>
      {Array.from({ length: win.to - win.from }, (_, i) => {
        const h = win.from + i
        return <div key={h} className={`absolute inset-y-0 border-l ${h % 6 === 0 ? 'border-edge' : 'border-edge-faint'} ${h < 6 || h >= 22 ? 'bg-surface-secondary' : ''}`} style={{ left: i * pxPerHour, width: pxPerHour }} />
      })}
    </>
  ) : (
    <>
      {axis.map((a, i) => {
        const wd = a.date ? new Date(`${a.date}T00:00:00Z`).getUTCDay() : -1
        return <div key={i} className={`absolute inset-y-0 border-l ${wd === 1 ? 'border-edge' : 'border-edge-faint'} ${wd === 0 || wd === 6 ? 'bg-surface-secondary' : ''} ${i === todayIndex ? 'bg-[color:var(--accent-subtle)]' : ''}`} style={{ left: i * 24 * pxPerHour, width: 24 * pxPerHour }} />
      })}
    </>
  )

  const segBtn = (on: boolean) => `rounded-full px-3 py-1 font-medium ${on ? 'bg-accent text-accent-text' : 'text-content-muted hover:text-content'}`
  const navBtn = 'grid h-7 w-7 place-items-center rounded-full bg-surface-card text-content-muted shadow-sm hover:text-content disabled:opacity-40 disabled:hover:text-content-muted'
  const showToday = todayIndex >= 0 && (dayMode ? todayIndex !== day : scrolls)
  const goToday = () => {
    if (dayMode) { setDayIndex(todayIndex); return }
    if (nowX != null) scrollRef.current?.scrollTo({ left: Math.max(0, nowX - 200), behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-edge-faint bg-surface-secondary px-3.5 py-2.5">
          {dayMode ? (
            <div className="flex items-center gap-1.5">
              <Tooltip label={t('reservations.timeline.prevDay')}>
                <button type="button" onClick={() => setDayIndex(Math.max(0, day - 1))} disabled={day === 0} aria-label={t('reservations.timeline.prevDay')} className={navBtn}>
                  <ChevronLeft size={15} strokeWidth={2.2} />
                </button>
              </Tooltip>
              <span className="inline-flex items-stretch overflow-hidden rounded-full bg-surface-card font-semibold text-content shadow-sm" style={fs(12, 'body')}>
                <span className="px-3 py-1">{dayName(day)}</span>
                {axis[day]?.date && (
                  <>
                    <span aria-hidden className="w-[3px] bg-surface-secondary" />
                    <span className="px-3 py-1 text-content-muted">{fmtDay(axis[day].date!, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </>
                )}
              </span>
              <Tooltip label={t('reservations.timeline.nextDay')}>
                <button type="button" onClick={() => setDayIndex(Math.min(n - 1, day + 1))} disabled={day >= n - 1} aria-label={t('reservations.timeline.nextDay')} className={navBtn}>
                  <ChevronRight size={15} strokeWidth={2.2} />
                </button>
              </Tooltip>
            </div>
          ) : range && (
            <span className="inline-flex items-stretch overflow-hidden rounded-full bg-surface-card font-semibold text-content shadow-sm" style={fs(12, 'body')}>
              <span className="px-3 py-1">{range}</span>
              <span aria-hidden className="w-[3px] bg-surface-secondary" />
              <span className="px-3 py-1">{t('reservations.timeline.dayCount', { count: axis.length })}</span>
            </span>
          )}
          <span className="flex-1" />
          {showToday && (
            <button type="button" onClick={goToday} className="rounded-full border border-edge-faint bg-surface-card px-3 py-1 font-medium text-content hover:bg-surface-hover" style={fs(12, 'body')}>
              {t('reservations.timeline.today')}
            </button>
          )}
          <div className="inline-flex rounded-full bg-surface-tertiary p-[3px]" role="group" aria-label={t('reservations.timeline.zoom')}>
            <button type="button" onClick={() => p.onZoom('trip')} aria-pressed={!dayMode} className={segBtn(!dayMode)} style={fs(12, 'body')}>{t('reservations.timeline.trip')}</button>
            <button type="button" onClick={() => p.onZoom('day')} aria-pressed={dayMode} className={segBtn(dayMode)} style={fs(12, 'body')}>{t('reservations.timeline.day')}</button>
          </div>
        </div>

        <div ref={scrollRef} className="overflow-x-auto" dir="ltr">
          <div className="relative" style={{ width: LABEL_W + gridW }}>
            <div className="flex border-b border-edge-faint">
              <div className="sticky left-0 z-20 flex-none border-r border-edge-faint bg-surface-card" style={{ width: LABEL_W }} />
              <div className={`relative flex-none ${win ? 'h-9' : 'h-11'}`} style={{ width: gridW }}>
                {win ? (
                  Array.from({ length: win.to - win.from }, (_, i) => win.from + i).filter(h => (h - win.from) % hourStep === 0).map(h => (
                    <span key={h} className="absolute top-0 flex h-full items-center px-1.5 font-geist tabular-nums text-content-muted" style={{ left: (h - win.from) * pxPerHour, ...fs(10.5) }}>
                      {hourLabel(h)}
                    </span>
                  ))
                ) : axis.map((a, i) => (
                  <Tooltip key={i} label={t('reservations.timeline.openDay', { day: dayName(i) })}>
                    <button type="button" onClick={() => openDay(i)}
                      className="absolute top-0 flex h-full flex-col justify-center px-2 text-left hover:bg-surface-hover" style={{ left: i * 24 * pxPerHour, width: 24 * pxPerHour }}>
                      <span className={`w-full truncate font-geist ${i === todayIndex ? 'font-bold text-content' : 'text-content-muted'}`} style={fs(10.5)}>
                        {a.date ? fmtDay(a.date, { weekday: 'short', day: 'numeric', ...(i === 0 || a.date.endsWith('-01') ? { month: 'short' } : {}) }) : ''}
                      </span>
                      <span className={`w-full truncate font-semibold ${i === todayIndex ? 'text-content' : 'text-content-secondary'}`} style={fs(11.5, 'body')}>
                        {24 * pxPerHour >= 90 ? t('dayplan.dayN', { n: a.dayNumber ?? i + 1 }) : String(a.dayNumber ?? i + 1)}
                      </span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {contextBars && contextBars.bars.length > 0 && (
              <div className="flex border-b border-edge-faint">
                <div className="sticky left-0 z-20 flex flex-none items-center border-r border-edge-faint bg-surface-card px-3" style={{ width: LABEL_W }}>
                  <span className={EYEBROW} style={fs(9.5)}>{p.contextLabel}</span>
                </div>
                <div className="relative flex-none" style={{ width: gridW, height: 8 + contextBars.lanes * 18 }}>
                  <Cells />
                  {contextBars.bars.map(b => {
                    const info = typeInfo(b.r.type)
                    return (
                      <div key={b.r.id} {...hoverProps(b.r)} className="absolute truncate rounded-md px-1.5 font-geist text-content-muted opacity-70"
                        style={{ left: b.x, width: b.w, top: 4 + b.lane * 18, height: 14, lineHeight: '14px', ...fs(9.5), background: `color-mix(in srgb, ${info.color} 14%, var(--bg-card))` }}>
                        {b.w > 60 ? displayTitle(b.r) : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {lanes.map(lane => {
              const info = typeInfo(lane.key)
              return (
                <div key={lane.key} className="flex border-b border-edge-faint last:border-b-0">
                  <div className="sticky left-0 z-20 flex flex-none items-center gap-2 border-r border-edge-faint bg-surface-card px-3" style={{ width: LABEL_W }}>
                    {lane.key !== 'all' && <info.Icon size={14} strokeWidth={2} style={{ color: info.color }} className="flex-none" />}
                    <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(12.5, 'body')}>{lane.key === 'all' ? t('common.all') : t(info.chipKey)}</span>
                    <CountPill>{lane.count}</CountPill>
                  </div>
                  <div className="relative flex-none" style={{ width: gridW, height: 12 + lane.lanes * laneH }}>
                    <Cells />
                    {lane.bars.map(b => (
                      <TimelineBar key={b.r.id} bar={b} top={6 + b.lane * laneH} height={barH} detailed={dayMode}
                        facts={p.factsOf(b.r)} selected={p.selectedId === b.r.id} onSelect={() => p.onSelect(b.r)} hover={hoverProps(b.r)} />
                    ))}
                  </div>
                </div>
              )
            })}

            {lanes.length === 0 && (
              <div className="flex">
                <div className="sticky left-0 flex-none border-r border-edge-faint bg-surface-card" style={{ width: LABEL_W }} />
                <div className="flex-none py-8 text-center font-geist text-content-faint" style={{ width: gridW, ...fs(12) }}>
                  {t(dayMode ? 'reservations.timeline.nothingThisDay' : 'reservations.timeline.noneDated')}
                </div>
              </div>
            )}

            {nowX != null && (
              <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-[2px] bg-accent" style={{ left: LABEL_W + nowX }}>
                <span className="absolute left-1 top-1 whitespace-nowrap font-geist font-bold text-content" style={fs(9.5)}>{t('reservations.timeline.now')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {(['before', 'after', 'undated'] as const).map(kind => {
        const list = tray.filter(x => x.pl.kind === kind)
        if (list.length === 0) return null
        return (
          <section key={kind}>
            <div className="mb-3 flex items-center gap-2 px-0.5">
              <span className={EYEBROW} style={fs(11)}>{t(`reservations.group.${kind}`)}</span>
              <CountPill>{list.length}</CountPill>
            </div>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(max(240px,calc((100%_-_36px)/4)),1fr))]">
              {list.map(({ r }) => <TrayCard key={r.id} r={r} selected={p.selectedId === r.id} onSelect={() => p.onSelect(r)} />)}
            </div>
          </section>
        )
      })}

      {hover && <HoverCard r={hover.r} rect={hover.rect} facts={p.factsOf(hover.r)} />}
    </div>
  )
}

interface HoverHandlers {
  onMouseEnter: (e: MouseEvent<HTMLElement>) => void
  onMouseLeave: () => void
  onFocus: (e: FocusEvent<HTMLElement>) => void
  onBlur: () => void
}

/**
 * One bar. On the trip view it carries the icon and the title; on the day view
 * it is tall enough for the times and the route below the title, and an arrow
 * marks the side where it runs on past the hours in view.
 */
function TimelineBar({ bar, top, height, detailed, facts, selected, onSelect, hover }: {
  bar: Bar; top: number; height: number; detailed: boolean; facts: BookingFacts; selected: boolean; onSelect: () => void; hover: HoverHandlers
}) {
  const { r, x, w } = bar
  const info = typeInfo(r.type)
  const pending = r.type !== 'transit' && r.status !== 'confirmed'
  const route = facts.endpoints.length >= 2 ? facts.endpoints.map(e => e.code || e.name).join(' → ') : null
  const second = [facts.time, route].filter(Boolean).join('  ')
  return (
    <button type="button" onClick={onSelect} aria-label={displayTitle(r)} {...hover}
      className={`absolute flex items-center gap-2 overflow-hidden whitespace-nowrap px-2 text-left text-content transition-shadow hover:z-10 hover:shadow-md ${detailed ? 'rounded-[10px]' : 'rounded-lg'} ${pending ? 'border-[1.5px] border-dashed border-warning' : 'border border-edge-faint'} ${selected ? 'ring-2 ring-[color:var(--text-primary)]' : ''}`}
      style={{ left: x, width: w, top, height, background: `color-mix(in srgb, ${info.color} 15%, var(--bg-card))`, boxShadow: `inset 3px 0 0 ${info.color}` }}>
      {bar.cutStart && <ChevronLeft size={12} strokeWidth={2.4} className="-ml-1 flex-none text-content-faint" />}
      <info.Icon size={detailed ? 14 : 12} strokeWidth={2.2} className="flex-none" style={{ color: info.color }} />
      {w > (detailed ? 70 : 64) && (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold" style={fs(detailed ? 12.5 : 11.5, 'body')}>{displayTitle(r)}</span>
          {detailed && second && w > 110 && <span className="truncate font-geist tabular-nums text-content-muted" style={fs(10.5)}>{second}</span>}
        </span>
      )}
      {bar.cutEnd && <ChevronRight size={12} strokeWidth={2.4} className="-mr-1 ml-auto flex-none text-content-faint" />}
    </button>
  )
}

/** What a bar holds, beside it while the pointer rests on it or it has the focus. */
function HoverCard({ r, rect, facts }: { r: Reservation; rect: DOMRect; facts: BookingFacts }) {
  const { t } = useTranslation()
  const info = typeInfo(r.type)
  const tone = toneOf(r)
  const status = tone === 'transit' ? null : tone === 'confirmed' ? t('reservations.confirmed') : t('reservations.pending')
  const route = facts.endpoints.length >= 2 ? facts.endpoints.map(e => e.code || e.name).join(' → ') : null
  const where = facts.place || facts.accommodation
  const W = 290
  const below = rect.bottom + 200 < window.innerHeight
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - W - 8))
  return createPortal(
    <div role="tooltip" className="trek-popover-enter pointer-events-none fixed z-[100000] rounded-[14px] border border-edge-faint bg-surface-card p-3 shadow-lg"
      style={{ width: W, left, top: below ? rect.bottom + 8 : rect.top - 8, transform: below ? undefined : 'translateY(-100%)' }}>
      <div className="flex items-center gap-2.5">
        <TypeTile type={r.type} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-content" style={fs(13.5, 'body')}>{displayTitle(r)}</div>
          <div className="flex items-center gap-1.5 font-geist text-content-muted" style={fs(11)}>
            <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: toneColor(tone) }} />
            <span className="truncate">{[t(info.labelKey), status].filter(Boolean).join(', ')}</span>
          </div>
        </div>
      </div>
      {(facts.day || facts.time || route || where) && (
        <div className="mt-2.5 flex flex-col gap-1 border-t border-edge-faint pt-2.5">
          {facts.day && <HoverLine icon={<CalendarDays size={12} />}>{[facts.day.label, facts.day.date].filter(Boolean).join('  ')}</HoverLine>}
          {facts.time && <HoverLine icon={<Clock size={12} />}>{facts.time}</HoverLine>}
          {route && <HoverLine icon={<RouteIcon size={12} />}>{route}</HoverLine>}
          {where && <HoverLine icon={<MapPin size={12} />}>{where}</HoverLine>}
        </div>
      )}
    </div>,
    document.body,
  )
}

function HoverLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-content-secondary" style={fs(12, 'body')}>
      <span className="flex-none text-content-faint">{icon}</span>
      <span className="min-w-0 flex-1 truncate tabular-nums">{children}</span>
    </div>
  )
}

/** A booking the axis cannot place, as a small card of its own below the timeline. */
function TrayCard({ r, selected, onSelect }: { r: Reservation; selected: boolean; onSelect: () => void }) {
  const { t } = useTranslation()
  const info = typeInfo(r.type)
  const tone = toneOf(r)
  const status = tone === 'transit' ? null : tone === 'confirmed' ? t('reservations.confirmed') : t('reservations.pending')
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected}
      className={`group flex items-center gap-3 rounded-2xl border bg-surface-secondary px-3 py-2.5 text-start transition-shadow hover:shadow-md ${selected ? 'border-[color:var(--text-primary)]' : 'border-edge-faint'}`}>
      <TypeTile type={r.type} size={38} raised />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-content" style={fs(13.5, 'body')}>{displayTitle(r)}</span>
        <span className="mt-0.5 flex items-center gap-1.5 font-geist text-content-muted" style={fs(11.5)}>
          <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: toneColor(tone) }} />
          <span className="truncate">{[t(info.labelKey), status].filter(Boolean).join(', ')}</span>
        </span>
      </span>
      <ChevronRight size={15} strokeWidth={2} className="flex-none text-content-faint transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
