import '../../styles/fadeEnd.css'
import { useId, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { TourListItem } from '@trek/shared'
import { fs } from '../shared/DialogShell'
import { FoldButton, TourActivityBadge, TourCautionBadge, TourDaysBadge, TourGradeTile } from './tourParts'
import type { Day } from '../../types'
import { endPlaceDrag, startPlaceDrag } from '../Map/markerDrag'
import { TourDayRowPills } from './TourDayRowFacts'
import { StageCountCorner, TourStagesBadge } from './stages/StageParts'
import { useTourDays } from './tourDays'
import { Tooltip } from '../shared/Tooltip'
import { useTranslation } from '../../i18n'

const NO_DAYS: Day[] = []

interface TourListRowProps {
  tour: TourListItem
  /** The trip's days, to name the ones the tour is on; without them the row names none. */
  days?: Day[]
  selected?: boolean
  disabled?: boolean
  /** The row can be picked up and dropped on a day of the plan, like a place. */
  draggableToDay?: boolean
  onSelect: (tour: TourListItem, opener: HTMLElement) => void
  action?: ReactNode
  children?: ReactNode
  /** The colour the tour's line has on the map, shown beside it so the two read as one. */
  trackColor?: string
  /** PR1-07: the person's switch for this tour's line on the trip map. */
  mapToggle?: { hidden: boolean; onToggle: () => void; showLabel: string; hideLabel: string }
  /** MDT-02: a multi-day tour unfolds its stages below the row; `controls` is the id of what unfolds. */
  fold?: { expanded: boolean; onToggle: () => void; label: string; controls: string }
}

/** The eye beside a row: shown on hover like the other actions, and always while the tour is hidden. */
function MapToggleButton({ toggle }: { toggle: NonNullable<TourListRowProps['mapToggle']> }) {
  const label = toggle.hidden ? toggle.showLabel : toggle.hideLabel
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={toggle.hidden}
        onClick={event => { event.stopPropagation(); toggle.onToggle() }}
        className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${toggle.hidden ? 'bg-surface-tertiary' : 'bg-surface-card'}`}
      >
        {toggle.hidden ? <EyeOff size={13} strokeWidth={2.2} /> : <Eye size={13} strokeWidth={2.2} />}
      </button>
    </Tooltip>
  )
}

/** The tile, the name, the description on a line of its own and one line of badges. */
function TourRowBody({ tour, nameId, tourDays, dimmed }: {
  tour: TourListItem
  nameId: string
  tourDays: ReturnType<typeof useTourDays>
  dimmed: boolean
}) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2.5 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
      <TourGradeTile tour={tour} />
      <div className="min-w-0 flex-1">
        <span id={nameId} className="block min-w-0 truncate font-semibold leading-tight text-content"
          style={fs(13, 'body')}>{tour.name}</span>
        {tour.description && (
          <span
            data-testid="tour-description-preview"
            className="mt-0.5 block min-w-0 truncate text-content-faint"
            style={fs(10.5)}
          >
            {tour.description}
          </span>
        )}
        {/* One line of whole badges, most important first: one that does not fit wraps onto a
            second line the fixed height hides, so a narrow sidebar shows two and never half of one.
            The days come before the measures, so the ascent is what goes, never the days. */}
        <div
          data-testid="tour-metrics"
          className="-mx-0.5 mt-0.5 flex h-6 min-w-0 flex-wrap content-start gap-x-1.5 gap-y-2 overflow-hidden px-0.5 pt-0.5"
        >
          <TourCautionBadge tour={tour} />
          <TourActivityBadge tour={tour} />
          <TourDaysBadge tourDays={tourDays} />
          <TourDayRowPills tour={tour} compact />
        </div>
      </div>
    </div>
  )
}

/**
 * The eye and the row's actions on the right. A hidden tour keeps its eye in
 * sight; the rest come out on hover, focus or selection, as a plan row's
 * controls do, so the name and badges have the room otherwise.
 */
function TourRowActions({ action, mapToggle, selected }: Pick<TourListRowProps, 'action' | 'mapToggle'> & { selected: boolean }) {
  const hoverToggle = mapToggle && !mapToggle.hidden ? mapToggle : null
  return (
    <>
      {mapToggle?.hidden && <MapToggleButton toggle={mapToggle} />}
      {(action || hoverToggle) && (
        <div data-testid="tour-action-row" role="presentation"
          onClick={event => event.stopPropagation()}
          className={`flex-none items-center gap-1.5 group-focus-within:flex group-hover:flex ${selected ? 'flex' : 'hidden'}`}>
          {hoverToggle && <MapToggleButton toggle={hoverToggle} />}
          {action}
        </div>
      )}
    </>
  )
}

/**
 * MDT-02: how many stages the tour has, always in sight beside the row: on
 * the fold button where the row unfolds them, as a mark of its own otherwise.
 */
function TourRowStages({ tour, fold }: Pick<TourListRowProps, 'tour' | 'fold'>) {
  const { t } = useTranslation()
  if (!fold) return <TourStagesBadge tour={tour} />
  const count = tour.stage_count ?? 0
  return (
    // Always in sight, unlike the hover actions: the stages are part of what the row is.
    <span role="presentation" className="flex-none" onClick={event => event.stopPropagation()}>
      <FoldButton expanded={fold.expanded} onToggle={fold.onToggle} controls={fold.controls} label={fold.label}
        corner={count > 0 ? <StageCountCorner count={count} /> : undefined}
        hint={count > 0 ? t('tours.stages.count', { count }) : undefined} />
    </span>
  )
}

/**
 * A tour in a list, laid out like a stop in the day plan: its tile with the
 * grade, the name, the description below it, and one line of the plan's
 * white badges (time, distance, ascent, the days it is on, a caution). The day
 * and delete actions sit on the right.
 */
export default function TourListRow({ tour,
  days = NO_DAYS,
  selected = false, disabled = false,
  draggableToDay = false, onSelect, action, children, trackColor, mapToggle, fold }: TourListRowProps) {
  const nameId = useId()
  const tourDays = useTourDays(tour.place_id, days)
  const draggable = draggableToDay && !disabled
  const tone = selected ? 'bg-surface-selected' : disabled ? '' : 'hover:bg-surface-hover'
  const cursor = disabled ? 'cursor-default opacity-60' : draggable ? 'cursor-grab' : 'cursor-pointer'
  return (
    <li
      role="option"
      tabIndex={disabled ? -1 : 0}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      aria-labelledby={nameId}
      data-place-id={tour.place_id}
      draggable={draggable || undefined}
      onDragStart={draggable ? (event) => startPlaceDrag(event.dataTransfer, tour.place_id) : undefined}
      onDragEnd={draggable ? endPlaceDrag : undefined}
      className={`group mx-1.5 rounded-[10px] px-1.5 py-2 outline-none transition-colors focus-visible:bg-surface-hover ${tone} ${cursor}`}
      onClick={event => { if (!disabled) onSelect(tour, event.currentTarget) }}
      onKeyDown={event => {
        if (disabled || event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(tour, event.currentTarget)
        }
      }}
    >
      <div className="flex items-center gap-2.5">
        {trackColor && (
          // The line's colour on the map, as a plan row shows its category.
          <span aria-hidden="true" className="-me-1 h-8 w-[3px] flex-none rounded-full" style={{ background: trackColor }} />
        )}
        <TourRowBody tour={tour} nameId={nameId} tourDays={tourDays} dimmed={!!mapToggle?.hidden} />
        <TourRowActions action={action} mapToggle={mapToggle} selected={selected} />
        <TourRowStages tour={tour} fold={fold} />
      </div>
      {children}
    </li>
  )
}
