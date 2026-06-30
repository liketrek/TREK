import React from 'react'
import { Check, MapPin } from 'lucide-react'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../types'
import PlaceAvatar from '../shared/PlaceAvatar'
import StatusBadge from './StatusBadge'

interface CollectionListProps {
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
 * Dense list view — one row per saved place with a one-tap status cycle on the
 * badge. Click the row to open the place (or toggle in select mode).
 */
export default function CollectionList({
  places, selectedPlaceId, selectMode, selectedIds, onOpenPlace, onStatusChange, onToggleSelect, t,
}: CollectionListProps): React.ReactElement {
  return (
    <div className="flex flex-col rounded-xl border border-edge bg-surface-card overflow-hidden divide-y divide-edge-faint">
      {places.map(place => {
        const selected = selectedIds.includes(place.id)
        const active = selectedPlaceId === place.id
        return (
          <div
            key={place.id}
            role="button"
            tabIndex={0}
            onClick={() => (selectMode ? onToggleSelect(place.id) : onOpenPlace(place.id))}
            onKeyDown={e => { if (e.key === 'Enter') onOpenPlace(place.id) }}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-surface-hover ${active ? 'bg-surface-selected' : ''}`}
          >
            {selectMode && (
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${selected ? 'bg-accent border-accent' : 'bg-surface-card border-edge'}`}>
                {selected && <Check size={13} className="text-accent-text" strokeWidth={3} />}
              </div>
            )}
            <PlaceAvatar place={place} size={36} category={place.category ? { color: place.category.color ?? undefined, icon: place.category.icon ?? undefined } : null} />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-content truncate">{place.name}</span>
              {(place.category?.name || place.address) && (
                <span className="text-[11px] text-content-faint truncate flex items-center gap-1">
                  {!place.category?.name && <MapPin size={10} />}
                  {place.category?.name || place.address}
                </span>
              )}
            </div>
            <StatusBadge status={place.status} onChange={next => onStatusChange(place.id, next)} t={t} />
          </div>
        )
      })}
    </div>
  )
}
