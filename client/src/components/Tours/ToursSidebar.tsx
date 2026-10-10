import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, FileDown } from 'lucide-react'
import type { TourListItem } from '@trek/shared'
import type { Day } from '../../types'
import { tourRepo } from '../../repo/tourRepo'
import { useTripStore } from '../../store/tripStore'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import TourListRow from './TourListRow'
import { useTourPermissions, type TourPermissionProps } from './useTourPermissions'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import EmptyState from '../shared/EmptyState'
import { TourDayMenu } from './tourParts'
import { filterTours, type TourFilter } from './tourPresentation'

const MAX_FILE_BYTES = 10 * 1024 * 1024

interface ToursSidebarProps extends TourPermissionProps {
  tripId: number
  days: Day[]
  tours: TourListItem[]
  loading?: boolean
  selectedPlaceId?: number | null
  onAssignToDay: (placeId: number, dayId: number) => void | boolean | Promise<void | boolean>
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
  const toast = useToast()
  const loadTrip = useTripStore(s => s.loadTrip)
  const [filter, setFilter] = useState<TourFilter>('all')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const handleImportClick = () => { if (canEdit) fileInputRef.current?.click() }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!canEdit || !file) return
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext !== 'gpx') { toast.error(t('places.importFileUnsupported')); return }
    if (file.size > MAX_FILE_BYTES) { toast.error(t('places.importFileTooLarge', { maxMb: 10 })); return }

    setImporting(true)
    try {
      const result = await tourRepo.importGpx(tripId, file)
      if (result.tours.length > 0) {
        // The server publishes place:created with sender echo suppression.
        // Reload the importing client's trip so new places and route geometry
        // enter the shared store used by the day map.
        await onToursChanged?.(result.tours.map(tour => tour.place_id))
        await loadTrip(tripId)
        toast.success(t('tours.import.success', { count: result.tours.length }))
        if (result.caution) toast.info(t('tours.import.caution'))
      } else {
        toast.warning(t('places.importAllSkipped'))
      }
    } catch (err: any) {
      const message = err?.response?.data?.error
      toast.error(message === 'No track or route found in GPX file' ? t('tours.import.noTrack') : t('tours.import.error'))
    } finally {
      setImporting(false)
    }
  }

  const handleAssign = async (tour: TourListItem, day: Day, index: number) => {
    if (!canAssign) return
    const assigned = await onAssignToDay(tour.place_id, day.id)
    if (assigned === false) return
    toast.success(t('tours.addedToDay', { n: index + 1 }))
  }

  const counts = {
    all: tours.length,
    unplanned: tours.filter(tr => !tr.planned).length,
    planned: tours.filter(tr => tr.planned).length,
  }
  const filtered = filterTours(tours, filter)

  useEffect(() => {
    if (!filterOpen) return
    const onDown = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setFilterOpen(false)
      filterButtonRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [filterOpen])

  const filterLabel = filter === 'all' ? t('places.all') : filter === 'unplanned' ? t('places.unplanned') : t('places.planned')
  const filterCount = counts[filter]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-system)' }}>
      <div className="flex flex-none flex-col gap-2 border-b border-edge-faint px-3 py-2.5" style={{ background: NEUTRAL_TINT }}>
        {/* GPX import stays — the tour-appropriate import path. List Import
            (place/route-of-driving oriented) is deliberately absent here. */}
        <div>
          <Tooltip label={t('places.importFile')}>
            <button type="button" onClick={handleImportClick} disabled={!canEdit || importing}
              className="flex h-8 w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[10px] bg-accent px-3 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
              style={fs(12.5, 'body')}>
              <FileDown size={14} strokeWidth={2.2} className="flex-none" />
              <span className="truncate">{t('places.importFile')}</span>
            </button>
          </Tooltip>
          <input ref={fileInputRef} type="file" accept=".gpx" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>
        <div ref={filterRef} className="relative min-w-0">
          <button ref={filterButtonRef} type="button" onClick={() => setFilterOpen(value => !value)}
            aria-expanded={filterOpen} aria-haspopup="listbox" aria-label={t('places.filterShow')}
            className="flex h-8 w-full min-w-0 items-center gap-1.5 rounded-[10px] bg-surface-card px-2.5 font-semibold text-content-secondary shadow-sm transition-colors hover:text-content"
            style={fs(12, 'body')}>
            <span className="min-w-0 truncate text-start">{filterLabel}</span>
            <span className="font-geist tabular-nums text-content-faint" style={fs(10.5)}>{filterCount}</span>
            <ChevronDown size={13} strokeWidth={2.2} className={`ms-auto flex-none text-content-faint transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div role="group" aria-label={t('places.filterShow')} className="trek-popover-enter absolute start-0 top-full z-50 mt-1.5 flex w-full min-w-[180px] flex-col gap-px rounded-[12px] border border-edge-secondary bg-surface-card p-1.5 shadow-popover">
              {(['all', 'unplanned', 'planned'] as const).map(id => {
                const label = id === 'all' ? t('places.all') : id === 'unplanned' ? t('places.unplanned') : t('places.planned')
                const active = filter === id
                return <button key={id} type="button" onClick={() => { setFilter(id); setFilterOpen(false) }} aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-start transition-colors ${active ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
                  style={fs(12.5, 'body')}>
                  <span className="min-w-0 flex-1 truncate text-content">{label}</span>
                  <span className="font-geist tabular-nums text-content-faint" style={fs(11)}>{counts[id]}</span>
                  <span className="grid w-3.5 flex-none place-items-center">{active && <Check size={13} strokeWidth={2.4} className="text-content-muted" />}</span>
                </button>
              })}
            </div>
          )}
        </div>
      </div>

      <div className="trek-stagger min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1.5">
        {!loading && filtered.length === 0 ? (
          <EmptyState scene="tours" size={92} fill surface="var(--bg-secondary)" title={t('tours.empty.title')}
            action={<p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>{t('tours.empty.body')}</p>} />
        ) : (
          <ul role="listbox" aria-label={t('tours.mode.tours')} className="m-0 list-none p-0">
            {filtered.map(tour => (
              <TourListRow
                key={tour.place_id}
                tour={tour}
                selected={tour.place_id === selectedPlaceId}
                onSelect={(selectedTour, opener) => onSelectTour?.(selectedTour, opener)}
                action={<TourDayMenu days={days} placeId={tour.place_id} label={t('tours.addToDay')} disabled={!canAssign} onPick={(day, index) => { void handleAssign(tour, day, index) }} />}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
