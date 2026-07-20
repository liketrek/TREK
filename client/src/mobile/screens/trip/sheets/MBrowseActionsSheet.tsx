import { useEffect, useRef, useState } from 'react'
import { Bookmark, Calendar, ChevronDown, ChevronUp, Eye, Pencil, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'
import { useAddonStore } from '../../../../store/addonStore'
import { useSaveToCollectionStore } from '../../../../store/saveToCollectionStore'
import { collectionTargetFromPlace } from '../lib/collectionTarget'
import type { Place } from '../../../../types'

interface BrowseActionsPayload {
  placeId?: number
  /** True opens the sheet with the day list already expanded (quick-add "+"). */
  dayPicker?: boolean
}

/**
 * Places-pool context menu ('bract', payload { placeId, dayPicker? }): view
 * details, edit, save to collection, assign to a day (full day list) and delete.
 */
export default function MBrowseActionsSheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'bract'
  const payload = (shell.sheet?.payload ?? {}) as BrowseActionsPayload
  const livePlace = planner.places.find(p => p.id === payload.placeId) ?? null

  const canEditPlaces = planner.can('place_edit', planner.trip)
  const canEditDays = planner.can('day_edit', planner.trip)
  const collectionsEnabled = useAddonStore(s => s.isEnabled('collections'))
  const openSavePicker = useSaveToCollectionStore(s => s.open)

  const [daysOpen, setDaysOpen] = useState(false)
  useEffect(() => { setDaysOpen(open && Boolean(payload.dayPicker)) }, [open, payload.dayPicker])

  // Hold the last place so the card content survives the exit animation.
  const heldRef = useRef<Place | null>(null)
  if (livePlace) heldRef.current = livePlace
  const place = livePlace ?? heldRef.current

  if (!place) {
    return <MSheet open={false} onClose={shell.closeSheet} variant="card" material="glass" />
  }

  const viewDetails = () => {
    shell.closeSheet()
    planner.handlePlaceClick(place.id)
  }

  const editPlace = () => {
    shell.closeSheet()
    planner.openPlaceEditor(place)
  }

  const saveToCollection = () => {
    shell.closeSheet()
    openSavePicker(collectionTargetFromPlace(place))
  }

  const assignToDay = (dayId: number) => {
    shell.closeSheet()
    planner.handleAssignToDay(place.id, dayId)
  }

  const deletePlace = () => {
    shell.closeSheet()
    planner.handleDeletePlace(place.id)
  }

  const rowCls = 'flex w-full items-center gap-3 px-2 py-[11px] text-left text-[0.84375rem] font-medium'

  return (
    <MSheet open={open && !!livePlace} onClose={shell.closeSheet} variant="card" material="glass" ariaLabel={place.name}>
      <div className="flex-none border-b border-[color:var(--m-rowbr)] px-[18px] pb-[11px] pt-4">
        <div className="truncate text-[1.03125rem] font-bold">{place.name}</div>
        {(place.address || place.description) && (
          <div className="mt-[2px] truncate font-geist text-[0.6875rem] text-m-muted">
            {place.address || place.description}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[10px] pb-3 pt-[6px]">
        <button type="button" onClick={viewDetails} className={rowCls}>
          <Eye size={16} strokeWidth={2} className="flex-none text-m-muted" />
          {t('mobileTrip.viewDetails')}
        </button>
        {canEditPlaces && (
          <button type="button" onClick={editPlace} className={rowCls}>
            <Pencil size={16} strokeWidth={2} className="flex-none text-m-muted" />
            {t('common.edit')}
          </button>
        )}
        {collectionsEnabled && (
          <button type="button" onClick={saveToCollection} className={rowCls}>
            <Bookmark size={16} strokeWidth={2} className="flex-none text-m-muted" />
            {t('inspector.saveToCollection')}
          </button>
        )}
        {canEditDays && planner.days.length > 0 && (
          <>
            <button type="button" onClick={() => setDaysOpen(v => !v)} aria-expanded={daysOpen} className={rowCls}>
              <Calendar size={16} strokeWidth={2} className="flex-none text-m-muted" />
              <span className="flex-1">{t('mobileTrip.addToDayQuestion')}</span>
              {daysOpen
                ? <ChevronUp size={14} strokeWidth={2} className="flex-none text-m-faint" />
                : <ChevronDown size={14} strokeWidth={2} className="flex-none text-m-faint" />}
            </button>
            {daysOpen && (
              <div className="mx-2 mb-1 max-h-[200px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
                {planner.days.map((d, i) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => assignToDay(d.id)}
                    className={`flex w-full items-center gap-2 px-3 py-[10px] text-left ${i > 0 ? 'border-t border-[color:var(--m-rowbr)]' : ''}`}
                  >
                    <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold">
                      {d.title || t('planner.dayN', { n: (d.day_number ?? i + 1) || '?' })}
                    </span>
                    {d.date && (
                      <span className="flex-none font-geist text-[0.65625rem] font-medium text-m-muted">
                        {new Date(`${d.date.slice(0, 10)}T00:00:00Z`).toLocaleDateString(locale, {
                          weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
                        })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {canEditPlaces && (
          <button type="button" onClick={deletePlace} className={`${rowCls} text-[color:var(--m-st-danger)]`}>
            <Trash2 size={16} strokeWidth={2} className="flex-none" />
            {t('common.delete')}
          </button>
        )}
      </div>
    </MSheet>
  )
}
