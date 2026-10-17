import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { TourListItem } from '@trek/shared'
import { AlertTriangle, CalendarDays, ChevronDown, Info, Mountain, Plus, Waves } from 'lucide-react'
import type { Day, DistanceUnit } from '../../types'
import type { RouteGeometryAnalysis } from '../../utils/routeGeometry'
import { useTranslation } from '../../i18n'
import { ContextMenu, useContextMenu } from '../shared/ContextMenu'
import { DialogButton, fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import { BOX, Eyebrow } from '../Planner/bookings/bookingParts'
import { SoftPill, WhiteBadge } from '../Planner/planParts'
import { hikeSourceBadgeLabel, tourSource } from './tourPresentation'
import { type TourDay, dayMenuLabel } from './tourDays'
import { tourMetricFacts } from './tourFacts'
import type { TourDayAssignment } from './useTourDayAssignment'

/**
 * A tour's tile in a list: its T-scale grade in place of the mountain, named in
 * full by its tooltip (a GPX import carries no grade and keeps the mountain),
 * and where it came from, when that was not TREK, as a small badge over its foot.
 */
export function TourGradeTile({ tour }: { tour: Pick<TourListItem, 'max_hiking_difficulty' | 'wanderer_ref' | 'has_waypoints'> & Partial<Pick<TourListItem, 'tour_type'>> }) {
  const { t } = useTranslation()
  const level = tour.max_hiking_difficulty
  const source = tourSource(tour)
  // A paddle tour has no grade; its tile names the type instead.
  const paddle = tour.tour_type === 'kayak'
  const label = level != null ? t(`tours.planner.difficulty.t${level}`) : paddle ? t('tourTypes.kayak') : null
  return (
    <span className="relative flex-none">
      <Tooltip label={label ?? ''} disabled={label == null}>
        <span aria-label={label ?? undefined} className="grid h-[34px] w-[34px] place-items-center rounded-full bg-edge font-geist font-semibold tabular-nums text-content" style={fs(12, 'body')}>
          {level != null ? `T${level}` : paddle
            ? <Waves size={15} strokeWidth={1.9} className="text-content-secondary" />
            : <Mountain size={15} strokeWidth={1.9} className="text-content-secondary" />}
        </span>
      </Tooltip>
      {source !== 'trek' && (
        <span className="absolute inset-x-0 -bottom-1 flex justify-center">
          <Tooltip label={hikeSourceBadgeLabel(tour, t)}>
            <span data-testid="tour-source-badge" aria-label={hikeSourceBadgeLabel(tour, t)}
              className="rounded-full bg-surface-card px-[3px] font-geist font-semibold uppercase leading-[11px] tracking-[.02em] text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint"
              style={fs(7)}>
              {t(`tours.badgeShort.${source}`)}
            </span>
          </Tooltip>
        </span>
      )}
    </span>
  )
}

/**
 * A list of tours as one card, the way the plan shows a day: a head band with
 * an icon, a title and what it counts, the rows below it.
 */
export function TourListCard({ icon,
  title,
  aside, label,
  children,
}: { icon: ReactNode
  title: string
  aside?: ReactNode
  /** The list's name for a screen reader. */
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex-none overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
      <div className="flex items-center gap-2 border-b border-edge-faint bg-surface-secondary px-3 py-2">
        <span className="grid h-4 w-4 flex-none place-items-center text-content-muted">{icon}</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(12.5, 'body')}>
          {title}
        </span>
        {aside}
      </div>
      <ul role="listbox" aria-label={label} className="m-0 list-none py-1">
        {children}
      </ul>
    </div>
  )
}

/** How many days a list row names before the rest fold into one "+n" pill. */
const SHOWN_TOUR_DAYS = 3

/** The days a tour is on as one white badge of a plan row: "Days 2, 4", each day named in full in the tooltip. */
export function TourDaysBadge({ tourDays }: { tourDays: readonly TourDay[] }) {
  const { t, locale } = useTranslation()
  if (tourDays.length === 0) return null
  const label = tourDays.map(({ day, index }) => dayMenuLabel(day, index, t, locale)).join(', ')
  const numbers = tourDays.map(({ index }) => index + 1).join(', ')
  return (
    <Tooltip label={label}>
      <span data-testid="tour-days-badge" aria-label={label} className="inline-flex flex-none">
        <WhiteBadge icon={<CalendarDays size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
          {t('tours.days.short', { count: tourDays.length, days: numbers })}
        </WhiteBadge>
      </span>
    </Tooltip>
  )
}

/** A tour that asks for care, as an icon-only warning badge whose tooltip says why. */
export function TourCautionBadge({ tour }: { tour: Pick<TourListItem, 'caution'> }) {
  const { t } = useTranslation()
  if (!tour.caution) return null
  return (
        <Tooltip label={t('tours.caution.tooltip')}>
          <span aria-label={t('tours.caution.badge')} className="inline-flex flex-none">
            <WhiteBadge className="text-warning" icon={<AlertTriangle size={10} strokeWidth={2.2} className="flex-none" />}>{null}
        </WhiteBadge>
      </span>
    </Tooltip>
  )
}

/**
 * The days a tour is on as small pills, "Day 2" each, the date and title in the
 * tooltip. A tour on many days names the first ones and folds the rest into "+n",
 * whose tooltip lists them. The pills come without a box of their own, so they
 * flow on in the row of pills they are put into.
 */
export function TourDayPills({
  tourDays,
  shown: limit = SHOWN_TOUR_DAYS,
}: {
  tourDays: readonly TourDay[]
  /** How many days to name before folding the rest; a detail with room names them all. */
  shown?: number
}) {
  const { t, locale } = useTranslation()
  if (tourDays.length === 0) return null
  const fullLabel = ({ day, index }: TourDay) => dayMenuLabel(day, index, t, locale)
  const shown = tourDays.length > limit ? tourDays.slice(0, limit - 1) : tourDays
  const folded = tourDays.slice(shown.length)
  const foldedLabel = folded.map(fullLabel).join(', ')
  return (
    <>
      {shown.map((tourDay) => (
        <Tooltip key={tourDay.day.id} label={fullLabel(tourDay)}>
          <span data-testid="tour-day" aria-label={fullLabel(tourDay)} className="inline-flex">
            <SoftPill icon={<CalendarDays size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
              {t('dayplan.dayN', { n: tourDay.index + 1 })}</SoftPill>
          </span>
        </Tooltip>
      ))}
      {folded.length > 0 && (
        <Tooltip label={foldedLabel}>
          <span data-testid="tour-day" aria-label={foldedLabel} className="inline-flex">
            <SoftPill className="tabular-nums">+{folded.length}
    </SoftPill>
          </span>
        </Tooltip>
  )}
    </>
  )
}

/**
 * Putting a tour on a day: a round "+" on a row, or a footer button with a
 * chevron, both opening the trip's days as a menu. Which days it offers and
 * the write itself come from the shared assignment rules (PR1-18): a day that
 * has the tour, or is getting it right now, is greyed out.
 */
export function TourDayMenu({ days, placeId, assignment, label, variant = 'round', primary = false }: {
  days: Day[]
  placeId: number
  assignment: TourDayAssignment
  label: string
  variant?: 'round' | 'button'
  primary?: boolean
}) {
  const { t, locale } = useTranslation()
  const menu = useContextMenu()
  const disabled = !assignment.canAssign
  const items = days.map((day, index) => ({
    label: dayMenuLabel(day, index, t, locale),
    disabled: !assignment.isAvailable(placeId, day.id),
    onClick: () => void assignment.assign(placeId, day.id),
  }))
  const hasAvailableDay = items.some(item => !item.disabled)
  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !hasAvailableDay) return
    if (menu.menu) { event.stopPropagation(); menu.close(); return }
    menu.open(event, items, true)
  }
  return (
    <>
      {variant === 'round' ? (
        <Tooltip label={label} disabled={!!menu.menu}>
          <button type="button" onClick={open} disabled={disabled || !hasAvailableDay} aria-label={label} aria-haspopup="menu" aria-expanded={!!menu.menu}
            className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-full shadow-sm ring-1 transition-colors disabled:cursor-default disabled:opacity-40 ${menu.menu ? 'bg-accent text-accent-text ring-transparent' : 'bg-surface-card text-content-muted ring-edge-faint enabled:hover:bg-accent enabled:hover:text-accent-text enabled:hover:ring-transparent'}`}>
            <Plus size={13} strokeWidth={2.4} />
          </button>
        </Tooltip>
      ) : (
        <DialogButton variant={primary ? 'primary' : 'secondary'} onClick={open} disabled={disabled || !hasAvailableDay}
          aria-haspopup="menu" aria-expanded={!!menu.menu} icon={<Plus size={14} strokeWidth={2} />}>
          {label}
          <ChevronDown size={13} strokeWidth={2.2} className={`transition-transform ${menu.menu ? 'rotate-180' : ''}`} />
        </DialogButton>
      )}
      <ContextMenu menu={disabled ? null : menu.menu} onClose={menu.close} />
    </>
  )
}

/** The round info dot beside a label; hover, focus and a tap show the explanation as a tooltip. */
export function InfoDot({ description, label }: { description: string; label: string }) {
  const id = useId()
  return (
    <Tooltip label={description}>
      <button type="button" aria-label={label} aria-describedby={id}
        className="grid h-5 w-5 flex-none place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-card hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <Info size={13} strokeWidth={2} aria-hidden="true" />
        <span id={id} className="sr-only">{description}</span>
      </button>
    </Tooltip>
  )
}

/** A labelled block of a tour panel: the eyebrow, an optional control on its right, then the content. */
export function TourSection({ label, action, children, className = '' }: { label: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-2 flex min-h-[18px] items-center gap-2">
        <Eyebrow>{label}</Eyebrow>
        {action && <span className="ms-auto flex items-center">{action}</span>}
      </div>
      {children}
    </section>
  )
}

/** One sentence the panel has to say (read-only, a warning, a status), in the card look. */
export function TourNotice({ tone = 'neutral', icon, children, role }: { tone?: 'neutral' | 'warning'; icon?: ReactNode; children: ReactNode; role?: 'status' }) {
  const look = tone === 'warning'
    ? 'border-transparent bg-warning-soft text-warning'
    : 'border-edge-faint bg-surface-card text-content-muted'
  return (
    <div role={role} className={`flex items-start gap-2 rounded-[10px] border px-3 py-2 leading-snug ${look}`} style={fs(12, 'body')}>
      {icon && <span className="mt-[2px] flex-none">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** The chevron that folds a section away, quiet like the rest of a panel's controls. */
export function FoldButton({ expanded, onToggle, controls, label }: { expanded: boolean; onToggle: () => void; controls: string; label: string }) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={controls} aria-label={label}
        className="grid h-6 w-6 place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-card hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <ChevronDown size={14} strokeWidth={2.2} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>
    </Tooltip>
  )
}

export interface TourMetricField {
  label: string
  /** Said instead of `label` where the field is too narrow for it, rather than cutting it off. */
  shortLabel?: string
  value: string
  info?: { label: string; description: string }
}

/** A label that falls back to its short form when the full one does not fit its box. */
function FitLabel({ full, short }: { full: string; short?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [narrow, setNarrow] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current?.parentElement
    if (!element || !short) return
    // Measured with the full text in place: it fits when it does not overflow its box.
    const check = () => {
      const probe = ref.current
      if (!probe) return
      setNarrow(probe.scrollWidth > element.clientWidth + 0.5)
    }
    check()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(check)
    observer.observe(element)
    return () => observer.disconnect()
  }, [full, short])
  if (!short) return <>{full}</>
  return (
    <>
      <span ref={ref} aria-hidden={narrow || undefined} className={`inline-block whitespace-nowrap ${narrow ? 'invisible absolute' : ''}`}>{full}</span>
      {narrow && <span title={full}>{short}</span>}
    </>
  )
}

/** Fixed field rows; five only from the small breakpoint up, a phone gets two. */
const FIELD_COLUMNS = { 2: 'grid-cols-2', 3: 'grid-cols-3', 5: 'grid-cols-2 sm:grid-cols-5' } as const
type FieldColumns = keyof typeof FIELD_COLUMNS

/**
 * Labelled values in the booking-card look: a fixed number of columns where the
 * caller wants one row per group, otherwise as many as fit.
 */
export function TourFactFields({ fields, columns }: { fields: readonly TourMetricField[]; columns?: FieldColumns }) {
  return (
    <dl
      className={`m-0 grid gap-2 ${columns ? FIELD_COLUMNS[columns] : 'grid-cols-[repeat(auto-fit,minmax(104px,1fr))]'}`}
    >
      {fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <dt className="mb-[3px] flex min-w-0 items-center gap-0.5">
            <Eyebrow className="relative min-w-0 truncate">
              <FitLabel full={field.label} short={field.shortLabel} />
            </Eyebrow>
            {field.info && (
              <span className="-my-1 flex-none">
                <InfoDot label={field.info.label} description={field.info.description} />
              </span>
            )}
          </dt>
          <dd
            className={`${BOX} m-0 truncate px-[10px] py-[7px] text-center font-semibold tabular-nums text-content`}
            style={fs(12.5, 'body')}
          >
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * A tour's numbers as labelled fields, the way a booking card shows its facts:
 * distance, any extra the caller has (the walking time), then the altitudes.
 */
export function TourMetricFields({ analysis, unit, extra = [], columns }: {
  analysis: Pick<RouteGeometryAnalysis, 'distanceKm' | 'minEle' | 'maxEle' | 'gain' | 'loss'> | null
  unit?: DistanceUnit
  extra?: Array<TourMetricField>
  /** A fixed column count: two in a narrow rail, one row in the inspector. */
  columns?: FieldColumns
}) {
  const { t } = useTranslation()
  return <TourFactFields fields={tourMetricFacts(analysis, unit, t, extra)} columns={columns} />
}

/**
 * A card of a rail, the way the plan shows a day: a head band with an icon and
 * a title, the content below. Rails stack these instead of loose boxes.
 */
export function RailCard({
  icon,
  title,
  aside,
  children,
  className = '',
}: {
  icon: ReactNode
  title: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`flex-none overflow-hidden rounded-2xl border border-edge-faint bg-surface-card ${className}`}
      aria-label={title}
    >
      <div className="flex items-center gap-2 border-b border-edge-faint bg-surface-secondary px-3 py-2">
        <span className="grid h-4 w-4 flex-none place-items-center text-content-muted">{icon}</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(12.5, 'body')}>
          {title}
        </span>
        {aside}
      </div>
      <div className="px-3 py-3">{children}</div>
    </section>
  )
}

/** The one action of a rail card's text, a small pill rather than a dialog's full-size button. */
export function CardAction({
  icon,
  onClick,
  disabled = false,
  children,
}: {
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-surface-card px-2.5 font-semibold text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:text-content disabled:cursor-default disabled:opacity-40"
      style={fs(11.5, 'body')}
    >
      <span className="flex-none">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  )
}

/** Facts as label over value, two to a row, without a box each: the compact form a rail card uses. */
export function RailFacts({ facts }: { facts: readonly TourMetricField[] }) {
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="flex min-w-0 items-center gap-0.5 text-content-faint" style={fs(10.5, 'body')}>
            <span className="relative min-w-0 truncate"><FitLabel full={fact.label} short={fact.shortLabel} /></span>
            {fact.info && <span className="-my-1 flex-none"><InfoDot label={fact.info.label} description={fact.info.description} /></span>}
          </dt>
          <dd className="m-0 truncate font-semibold tabular-nums text-content" style={fs(13, 'body')}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
