import React from 'react'
import { Check } from 'lucide-react'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../types'
import PlaceAvatar from '../shared/PlaceAvatar'
import StatusBadge from './StatusBadge'

interface CollectionGridProps {
  places: CollectionPlace[]
  selectedPlaceId: number | null
  selectMode: boolean
  selectedIds: number[]
  onOpenPlace: (id: number) => void
  onStatusChange: (placeId: number, status: CollectionStatus) => void
  onToggleSelect: (id: number) => void
  t: TranslationFn
}

/**
 * Grid view — PlaceAvatar thumb cards (rounded-xl) with the status badge in the
 * top-right corner. In select mode a tap toggles the checkbox; otherwise it
 * opens the place.
 */
export default function CollectionGrid({
  places, selectedPlaceId, selectMode, selectedIds, onOpenPlace, onStatusChange, onToggleSelect, t,
}: CollectionGridProps): React.ReactElement {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
      {places.map(place => {
        const selected = selectedIds.includes(place.id)
        const active = selectedPlaceId === place.id
        return (
          <button
            key={place.id}
            type="button"
            onClick={() => (selectMode ? onToggleSelect(place.id) : onOpenPlace(place.id))}
            className={`group relative flex flex-col rounded-xl border bg-surface-card text-left overflow-hidden transition-all hover:shadow-card hover:-translate-y-0.5 ${active || selected ? 'border-accent ring-1 ring-accent' : 'border-edge'}`}
          >
            {/* Photo band */}
            <div className="relative flex items-center justify-center h-28 bg-surface-secondary">
              <PlaceAvatar place={place} size={64} category={place.category ? { color: place.category.color ?? undefined, icon: place.category.icon ?? undefined } : null} />
              <div className="absolute top-2 right-2">
                <StatusBadge
                  status={place.status}
                  showLabel={false}
                  onChange={selectMode ? undefined : next => onStatusChange(place.id, next)}
                  t={t}
                />
              </div>
              {selectMode && (
                <div className={`absolute top-2 left-2 w-5 h-5 rounded-md flex items-center justify-center border ${selected ? 'bg-accent border-accent' : 'bg-surface-card/90 border-edge'}`}>
                  {selected && <Check size={13} className="text-accent-text" strokeWidth={3} />}
                </div>
              )}
            </div>
            {/* Body */}
            <div className="flex flex-col gap-0.5 px-3 py-2.5 min-w-0">
              <span className="text-[13px] font-semibold text-content truncate">{place.name}</span>
              {(place.category?.name || place.address) && (
                <span className="text-[11px] text-content-faint truncate">
                  {place.category?.name || place.address}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
