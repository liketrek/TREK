import React from 'react'
import { Check, MapPin } from 'lucide-react'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../types'
import PlaceCover from '../shared/PlaceCover'
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
 * Grid view — gradient/photo cover cards modelled on the dashboard trip cards.
 * The place name sits over the cover with a scrim; the status pill (top-right)
 * cycles idea→want→visited on tap; a compact body carries the category. In
 * select mode a tap toggles the checkbox instead of opening the place.
 */
export default function CollectionGrid({
  places, selectedPlaceId, selectMode, selectedIds, onOpenPlace, onStatusChange, onToggleSelect, t,
}: CollectionGridProps): React.ReactElement {
  return (
    <div className="col-grid">
      {places.map(place => {
        const selected = selectedIds.includes(place.id)
        const active = selectedPlaceId === place.id
        const sub = place.category?.name || place.address
        const activate = () => (selectMode ? onToggleSelect(place.id) : onOpenPlace(place.id))
        return (
          <div
            key={place.id}
            role="button"
            tabIndex={0}
            aria-label={place.name}
            onClick={activate}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() } }}
            className={`col-card${active || selected ? ' sel' : ''}`}
          >
            <div className="col-cover">
              <PlaceCover place={place} />
              {selectMode && (
                <span className={`col-card-check${selected ? ' on' : ''}`}>
                  {selected && <Check size={14} strokeWidth={3} />}
                </span>
              )}
              <span className="col-card-status">
                <StatusBadge
                  status={place.status}
                  showLabel={false}
                  onCover
                  onChange={selectMode ? undefined : next => onStatusChange(place.id, next)}
                  t={t}
                />
              </span>
              <span className="col-card-name">{place.name}</span>
            </div>
            {sub && (
              <div className="col-card-body">
                <span className="col-card-cat">
                  {place.category?.name
                    ? <span className="cdot" style={{ background: place.category.color || '#6366f1' }} />
                    : <MapPin size={13} />}
                  <span>{sub}</span>
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
