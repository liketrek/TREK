import React, { useEffect, useMemo, useRef } from 'react'
import { EyeOff, FileDown } from 'lucide-react'
import type { TourListItem } from '@trek/shared'
import type { Day } from '../../types'
import { useTranslation } from '../../i18n'
import TourListRow from './TourListRow'
import { useTourPermissions, type TourPermissionProps } from './useTourPermissions'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import EmptyState from '../shared/EmptyState'
import { TourDayMenu } from './tourParts'
import TourListFilterMenu from './TourListFilterMenu'
import { useTourListFilters } from './useTourListFilters'
import TourGpxPreviewDialog from './TourGpxPreviewDialog'
import { useTourGpxImport } from './useTourGpxImport'
import { type AssignTourToDay, useTourDayAssignment } from './useTourDayAssignment'
import { useTourMapVisibility } from './useTourMapVisibility'
import { useTripStore } from '../../store/tripStore'
import { resolveTrackColor } from '../Map/trackColors'

interface ToursSidebarProps extends TourPermissionProps {
  tripId: number
  days: Day[]
  tours: TourListItem[]
  loading?: boolean
  selectedPlaceId?: number | null
  onAssignToDay: AssignTourToDay
  pushUndo?: (label: string, undo: () => void | Promise<void>) => void
  /** Imported place ids are excluded immediately; no ids means refresh derived Tour metadata. */
  onToursChanged?: (placeIds?: number[]) => void | Promise<void>
  /** Tour row was clicked — caller will render the detail modal. */
  onSelectTour?: (tour: TourListItem | null, opener?: HTMLElement) => void
}


/**
 * Tours mode of the right add-panel: a selection list of existing tours
 * with GPX import and day assignment.
 *
 * Reuses the existing day-assignment mechanism as-is: `onAssignToDay` is the
 * same `handleAssignToDay` PlacesSidebar calls, so a tour lands on a day
 * exactly like a place does, and its route line renders on the day map
 * without any Tours-specific rendering code.
 */
export default function ToursSidebar({ tripId, days, tours, loading = false, selectedPlaceId = null, onAssignToDay, onToursChanged, onSelectTour, canEdit: editPermission, canAssign: assignPermission }: ToursSidebarProps): React.ReactElement {
  const { t } = useTranslation()
  const { canEdit, canAssign } = useTourPermissions({ tripId, canEdit: editPermission, canAssign: assignPermission })
  const gpxImport = useTourGpxImport({ tripId, canEdit, onToursChanged })
  const filters = useTourListFilters(tours)

  const dayAssignment = useTourDayAssignment({ canAssign, onAssignToDay })
  const tourIds = useMemo(() => new Set(tours.map(tour => tour.place_id)), [tours])
  const visibility = useTourMapVisibility(tripId, tourIds)
  // The colour each line has on the map, so a row and its line read as one (PR1-08).
  const places = useTripStore(state => state.places)
  const trackColors = useMemo(
    () => new Map(places.filter(place => tourIds.has(place.id)).map(place => [place.id, resolveTrackColor(place)])),
    [places, tourIds],
  )
  const listRef = useRef<HTMLUListElement>(null)
  // A tour picked on the map shows in the list too, scrolled into view.
  useEffect(() => {
    if (selectedPlaceId == null) return
    const row = listRef.current?.querySelector<HTMLElement>(`[data-place-id="${selectedPlaceId}"]`)
    row?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedPlaceId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-system)' }}>
      <div className="flex flex-none flex-col gap-2 border-b border-edge-faint px-3 py-2.5" style={{ background: NEUTRAL_TINT }}>
        {/* GPX import stays — the tour-appropriate import path. List Import
            (place/route-of-driving oriented) is deliberately absent here. */}
        <div>
          <Tooltip label={t('tours.import.hint')}>
            <button type="button" onClick={gpxImport.pick} disabled={!canEdit || gpxImport.importing}
              className="flex h-8 w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[10px] bg-accent px-3 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
              style={fs(12.5, 'body')}>
              <FileDown size={14} strokeWidth={2.2} className="flex-none" />
              <span className="truncate">{t('tours.import.button')}</span>
            </button>
          </Tooltip>
        </div>
        <TourListFilterMenu filters={filters} />
        {visibility.hiddenCount > 0 && (
          <div role="status" className="flex min-w-0 items-center gap-2 rounded-[10px] bg-surface-card px-2.5 py-1.5 shadow-sm ring-1 ring-inset ring-edge-faint">
            <EyeOff size={13} strokeWidth={2.2} className="flex-none text-content-faint" />
            <span className="min-w-0 flex-1 truncate text-content-secondary" style={fs(12, 'body')}>{t('tours.visibility.hidden')}</span>
            <span className="font-geist tabular-nums text-content-faint" style={fs(10.5)}>{visibility.hiddenCount}</span>
            <button type="button" onClick={visibility.showAll}
              className="flex-none rounded-full px-2 py-0.5 font-semibold text-content-secondary transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              style={fs(11.5, 'body')}>
              {t('tours.visibility.showAll')}
            </button>
          </div>
        )}
      </div>

      <div className="trek-stagger min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1.5">
        {!loading && filters.emptyByFilter ? (
          <div role="status" className="mx-1.5 mt-2 flex flex-col items-center gap-2 rounded-[12px] bg-surface-card px-4 py-5 text-center shadow-sm ring-1 ring-inset ring-edge-faint">
            <p className="m-0 text-content-muted" style={fs(12.5, 'body')}>{t('tours.filter.empty')}</p>
            <button type="button" onClick={filters.reset}
              className="rounded-full bg-surface-secondary px-3 py-1 font-semibold text-content-secondary transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              style={fs(11.5, 'body')}>
              {t('tours.filter.reset')}
            </button>
          </div>
        ) : !loading && filters.filtered.length === 0 ? (
          <EmptyState scene="tours" size={92} fill surface="var(--bg-secondary)" title={t('tours.empty.title')}
            action={<p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>{t('tours.empty.body')}</p>} />
        ) : (
          <ul ref={listRef} role="listbox" aria-label={t('tours.mode.tours')} className="m-0 list-none p-0">
            {filters.filtered.map(tour => (
              <TourListRow
                key={tour.place_id}
                tour={tour}
                days={days}
                draggableToDay={canAssign && days.length > 0}
                selected={tour.place_id === selectedPlaceId}
                trackColor={trackColors.get(tour.place_id)}
                mapToggle={{
                  hidden: visibility.isHidden(tour.place_id),
                  onToggle: () => visibility.toggle(tour.place_id),
                  showLabel: t('tours.visibility.show'),
                  hideLabel: t('tours.visibility.hide'),
                }}
                onSelect={(selectedTour, opener) => onSelectTour?.(selectedTour, opener)}
                action={<TourDayMenu days={days} placeId={tour.place_id} label={t('tours.addToDay')} assignment={dayAssignment} />}
              />
            ))}
          </ul>
        )}
      </div>
      <TourGpxPreviewDialog gpxImport={gpxImport} />
    </div>
  )
}
