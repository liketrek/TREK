import { createElement } from 'react'
import { Plus } from 'lucide-react'
import type { TourListItem } from '@trek/shared'
import { hikeSourceBadgeLabel, ORIGIN_LABEL_KEY, tourSource } from '../../../../components/Tours/tourPresentation'
import { tourDayRowIcon } from '../../../../components/Tours/tourDayRowIcon'
import { useTourDays } from '../../../../components/Tours/tourDays'
import { resolveTrackColor } from '../../../../components/Map/trackColors'
import type { TourListFilters } from '../../../../components/Tours/useTourListFilters'
import MDancingTrek from '../../../components/MDancingTrek'
import TourDayRowFacts from '../../../../components/Tours/TourDayRowFacts'
import { TourCautionBadge } from '../../../../components/Tours/tourParts'
import MPlanOnDesktopBadge from '../../../components/MPlanOnDesktopBadge'
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
 * The tour's tile, the size of a place's avatar: its grade where it has one,
 * its type otherwise, and a small mark under it when it came in from outside.
 */
function TourTile({ tour, t }: { tour: TourListItem; t: TripPlanner['t'] }) {
  const level = tour.max_hiking_difficulty
  const source = tourSource(tour)
  const label = level != null ? t(`tours.planner.difficulty.t${level}`) : t(`tourTypes.${tour.tour_type}`)
  return (
    <span className="relative flex-none">
      <span
        role="img"
        aria-label={label}
        className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-[color:var(--m-avbr)] bg-[color:var(--m-ic)] font-geist text-[length:calc(12px*var(--fs-scale-body,1))] font-bold tabular-nums text-m-ink"
      >
        {level != null
          ? `T${level}`
          : createElement(tourDayRowIcon(tour.tour_type), { size: 16, strokeWidth: 1.9, 'aria-hidden': true })}
      </span>
      {source !== 'trek' && (
        <span
          aria-label={hikeSourceBadgeLabel(tour, t)}
          className="absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[4px] font-geist text-[length:calc(7px*var(--fs-scale-caption,1))] font-bold normal-case leading-[11px] tracking-[.02em] text-m-muted"
        >
          {t(`tours.badgeShort.${source}`)}
        </span>
      )}
    </span>
  )
}

/** A tour as a row of the browser, laid out like a place: tap opens it, the right side is its day. */
function TourRow({ tour, planner, shell, canAssign }: {
  tour: TourListItem
  planner: TripPlanner
  shell: MTripShellApi
  canAssign: boolean
}) {
  const { t } = planner
  const tourDays = useTourDays(tour.place_id, planner.days)
  const place = planner.places.find(p => p.id === tour.place_id)
  const selected = planner.selectedPlaceId === tour.place_id
  return (
    <div
      data-testid="mobile-tour-row"
      className={`flex items-center gap-[11px] border-b border-[color:var(--m-rowbr)] px-[2px] py-[9px] ${selected ? 'bg-[color:var(--m-ic)]' : ''}`}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => planner.handlePlaceClick(tour.place_id)}
        className="flex min-w-0 flex-1 items-center gap-[11px] text-start"
      >
        <TourTile tour={tour} t={t} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-[6px]">
            {place?.route_geometry && (
              // The line's colour on the map: on the phone the row is the only thing tying the two together.
              <span aria-hidden="true" className="h-[3px] w-[14px] flex-none rounded-full" style={{ background: resolveTrackColor(place) }} />
            )}
            <span className="truncate text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink">{tour.name}</span>
          </span>
          <span data-testid="mobile-tour-metrics" className="mt-[3px] flex min-w-0 items-center gap-1">
            <TourCautionBadge tour={tour} />
            <span className="min-w-0 flex-1"><TourDayRowFacts tour={tour} mobile /></span>
          </span>
        </span>
      </button>
      {tourDays.length > 0 ? (
        <span className="flex-none whitespace-nowrap rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[9px] py-1 font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.05em] text-m-muted">
          {t('planner.dayN', { n: tourDays[0].index + 1 })}
          {tourDays.length > 1 && ` +${tourDays.length - 1}`}
        </span>
      ) : canAssign && (
        <button
          type="button"
          onClick={() => shell.openSheet('bract', { placeId: tour.place_id, dayPicker: true })}
          aria-label={t('tours.addToDay')}
          className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg"
        >
          <Plus size={14} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

/**
 * Tours mode of the mobile places browser: the trip's tours in the same rows
 * as its places, to open and to put on a day. Tours are planned on a bigger
 * screen, which the badge under the list says once; the phone never creates or
 * imports one.
 *
 * "Add to day" reuses the 'bract' place-actions sheet's day picker, the same
 * one an unplanned place's plus opens: a tour is a Place under the hood.
 */
export default function MToursSelectionList({ planner, shell, filters, canAssign: assignPermission }: MToursSelectionListProps) {
  const { canAssign } = useTourPermissions({ tripId: planner.tripId, canAssign: assignPermission })
  const { t } = planner
  const { facets, selection, filtered } = filters
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

  if (planner.tours.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-10 text-center">
        <MDancingTrek scene="guide" className="mb-2" />
        <p className="text-[length:calc(15px*var(--fs-scale-body,1))] font-semibold text-m-ink">{t('tours.empty.title')}</p>
        <p className="mt-1.5 max-w-[27ch] font-geist text-[length:calc(12.5px*var(--fs-scale-body,1))] leading-[1.5] text-m-muted">{t('mobileTrip.toursEmptyBody')}</p>
        <MPlanOnDesktopBadge className="mt-3" />
      </div>
    )
  }

  return (
    <>
      {facetRow}
      <div className="mb-1 mt-[14px] flex items-center gap-[10px]">
        <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
        <span className="whitespace-nowrap font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.09em] text-m-faint">
          {t('mobileTrip.toursCount', { count: filtered.length })}
        </span>
        <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
      </div>
      {filters.emptyByFilter ? (
        <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center px-8 py-10 text-center">
          <MDancingTrek scene="search" className="mb-2" />
          <p className="font-geist text-[length:calc(13px*var(--fs-scale-body,1))] font-medium text-m-muted">{t('tours.filter.empty')}</p>
          <button type="button" onClick={filters.reset} className="mt-3 rounded-full bg-m-act px-4 py-2 text-caption font-semibold text-m-actfg">
            {t('tours.filter.reset')}
          </button>
        </div>
      ) : (
        filtered.map(tour => <TourRow key={tour.place_id} tour={tour} planner={planner} shell={shell} canAssign={canAssign} />)
      )}
      <div className="mt-5 flex justify-center">
        <MPlanOnDesktopBadge />
      </div>
    </>
  )
}
