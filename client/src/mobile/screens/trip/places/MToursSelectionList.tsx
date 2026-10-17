import { ArrowDown, ArrowUp, Mountain, AlertTriangle, CalendarDays } from 'lucide-react'
import type { TourListItem } from '@trek/shared'
import { useSettingsStore } from '../../../../store/settingsStore'
import { formatDistance, formatElevation } from '../../../../utils/units'
import { hikeSourceBadgeLabel, ORIGIN_LABEL_KEY } from '../../../../components/Tours/tourPresentation'
import type { TourListFilters } from '../../../../components/Tours/useTourListFilters'
import type { TripPlanner, MTripShellApi } from '../MTripShell'
import { useTourPermissions, type TourPermissionProps } from '../../../../components/Tours/useTourPermissions'

interface MToursSelectionListProps extends TourPermissionProps {
  planner: TripPlanner
  shell: MTripShellApi
  /** The list's filters (PR1-13): the day status chips sit above, the other dimensions here. */
  filters: TourListFilters
}

/** One value of a dimension as a chip of the row; tapping a chosen one clears it. */
function FacetChip({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-8 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-caption font-semibold ${
        active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink'
      }`}
    >
      {label}
      <span className="font-geist text-caption opacity-60">{count}</span>
    </button>
  )
}

/**
 * Tours mode of the mobile places browser: a selection list that mirrors
 * the desktop ToursSidebar's data, with viewing and day assignment only.
 * This list does not provide GPX import.
 *
 * "Add to day" reuses the existing 'bract' place-actions sheet's day picker
 * (the same one MPlacesBrowser's unplanned-place rows open) — a tour is a
 * Place under the hood, so no new linking code is needed here either.
 */
export default function MToursSelectionList({ planner, shell, filters, canAssign: assignPermission }: MToursSelectionListProps) {
  const { canAssign } = useTourPermissions({ tripId: planner.tripId, canAssign: assignPermission })
  const { t } = planner
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const filtered: TourListItem[] = filters.filtered
  const { facets, selection } = filters
  const facetRow = filters.hasFacets && (
    <div className="-mx-4 mt-2 flex gap-[6px] overflow-x-auto px-4 pb-1">
      {facets.origin.map(option => (
        <FacetChip key={`o-${option.value}`} active={selection.origin === option.value} label={t(ORIGIN_LABEL_KEY[option.value])}
          count={option.count} onClick={() => filters.select('origin', option.value)} />
      ))}
      {facets.grade.map(option => (
        <FacetChip key={`g-${option.value}`} active={selection.grade === option.value} label={`T${option.value}`}
          count={option.count} onClick={() => filters.select('grade', option.value)} />
      ))}
      {facets.type.map(option => (
        <FacetChip key={`t-${option.value}`} active={selection.type === option.value} label={t(`tourTypes.${option.value}`)}
          count={option.count} onClick={() => filters.select('type', option.value)} />
      ))}
    </div>
  )

  if (filters.emptyByFilter) {
    return (
      <>
      {facetRow}
      <div role="status" className="mt-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-6 text-center">
        <p className="font-geist text-caption text-m-muted">{t('tours.filter.empty')}</p>
        <button type="button" onClick={filters.reset} className="mt-3 rounded-full bg-m-act px-4 py-2 text-caption font-semibold text-m-actfg">
          {t('tours.filter.reset')}
        </button>
      </div>
      </>
    )
  }

  if (filtered.length === 0) {
    return (
      <>
      <p className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-2 font-geist text-[0.75rem] text-m-muted">
        {t('tours.planner.mobileHint')}
      </p>
      <div className="mt-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-6 text-center">
        <Mountain className="mx-auto mb-2 h-6 w-6 text-m-faint" strokeWidth={1.6} />
        <p className="font-semibold text-m-ink">{t('tours.empty.title')}</p>
        <p className="mt-1 font-geist text-[0.78125rem] text-m-muted">{t('tours.empty.body')}</p>
      </div>
      </>
    )
  }

  return (
    <>
    <p className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-2 font-geist text-[0.75rem] text-m-muted">
      {t('tours.planner.mobileHint')}
    </p>
    {facetRow}
    <ul className="mt-3 space-y-2">
      {filtered.map(tour => {
        const isSelected = planner.selectedPlaceId === tour.place_id
        return (
        <li
          key={tour.place_id}
          role="option"
          tabIndex={0}
          aria-selected={isSelected}
          onClick={() => planner.handlePlaceClick(tour.place_id)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); planner.handlePlaceClick(tour.place_id) } }}
          className="rounded-2xl border border-[color:var(--m-rowbr)] p-3"
          style={{ background: isSelected ? 'var(--border-faint)' : 'var(--m-ic)' }}
        >
          <div className="min-w-0">
            <span className="block min-w-0 line-clamp-2 break-words font-semibold text-m-ink" title={tour.name}>{tour.name}</span>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-geist text-[0.75rem] text-m-muted">
              <span className="shrink-0 rounded-md border border-[color:var(--m-rowbr)] px-1.5 py-0.5 text-[10px] font-medium text-m-faint">
                {hikeSourceBadgeLabel(tour, t)}
              </span>
              {tour.max_hiking_difficulty != null && (
                <span
                  title={t(`tours.planner.difficulty.t${tour.max_hiking_difficulty}`)}
                  aria-label={t(`tours.planner.difficulty.t${tour.max_hiking_difficulty}`)}
                  className="shrink-0 rounded-md border border-[color:var(--m-rowbr)] px-1.5 py-0.5 text-[10px] font-semibold text-m-muted"
                >T{tour.max_hiking_difficulty}</span>
              )}
              {tour.caution && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[color:var(--warning)] px-1.5 py-0.5 text-[10px] text-[color:var(--warning)]" aria-label={t('tours.caution.badge')} title={t('tours.caution.tooltip')}>
                  <AlertTriangle className="h-3 w-3" strokeWidth={2} aria-hidden="true" />{t('tours.caution.badge')}
                </span>
              )}
            </div>
            <div data-testid="mobile-tour-metrics" className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-geist text-[0.75rem] text-m-muted">
              <span className="whitespace-nowrap" aria-label={`${t('tours.detail.distance')}: ${formatDistance(tour.distance ?? 0, distanceUnit)}`}>
                {formatDistance(tour.distance ?? 0, distanceUnit)}
              </span>
              {tour.elevation_gain != null && (
                <span className="inline-flex items-center gap-0.5 whitespace-nowrap" aria-label={`${t('tours.detail.ascent')}: ${formatElevation(tour.elevation_gain, distanceUnit)}`}>
                  <ArrowUp className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                  {formatElevation(tour.elevation_gain, distanceUnit)}
                </span>
              )}
              {tour.elevation_loss != null && (
                <span className="inline-flex items-center gap-0.5 whitespace-nowrap" aria-label={`${t('tours.detail.descent')}: ${formatElevation(tour.elevation_loss, distanceUnit)}`}>
                  <ArrowDown className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                  {formatElevation(tour.elevation_loss, distanceUnit)}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={!canAssign}
              onClick={(e) => { e.stopPropagation(); if (canAssign) shell.openSheet('bract', { placeId: tour.place_id, dayPicker: true }) }}
              className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border border-[color:var(--m-rowbr)] px-3 py-1.5 text-[0.8125rem] font-medium text-m-ink"
            >
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
              {t('tours.addToDay')}
            </button>
          </div>
        </li>
        )
      })}
    </ul>
    </>
  )
}
