import React, { useEffect, useRef } from 'react'
import { Check, MapPin } from 'lucide-react'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../types'
import PlaceAvatar from '../shared/PlaceAvatar'
import { getCategoryIcon } from '../shared/categoryIcons'
import StatusBadge from './StatusBadge'

interface CollectionListProps {
  places: CollectionPlace[]
  selectedPlaceId: number | null
  selectMode: boolean
  selectedIds: number[]
  onOpenPlace: (id: number) => void
  onStatusChange?: (placeId: number, status: CollectionStatus) => void
  onToggleSelect: (id: number) => void
  t: TranslationFn
}

/**
 * List view — one glass row per saved place with a photo avatar, name +
 * category/address, and a one-tap status cycle on the badge. Click the row to
 * open the place (or toggle it in select mode).
 */
export default function CollectionList({
  places, selectedPlaceId, selectMode, selectedIds, onOpenPlace, onStatusChange, onToggleSelect, t,
}: CollectionListProps): React.ReactElement {
  // Bring the selected row into view — e.g. when it was picked from the map.
  const selectedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedPlaceId])

  return (
    <div className="col-listview">
      {places.map(place => {
        const selected = selectedIds.includes(place.id)
        const active = selectedPlaceId === place.id
        return (
          <div
            key={place.id}
            ref={active ? selectedRef : undefined}
            role="button"
            tabIndex={0}
            onClick={() => (selectMode ? onToggleSelect(place.id) : onOpenPlace(place.id))}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (selectMode) onToggleSelect(place.id); else onOpenPlace(place.id) } }}
            className={`col-lrow${active || selected ? ' sel' : ''}`}
          >
            {selectMode ? (
              <span className={`col-lcheck${selected ? ' on' : ''}`}>{selected && <Check size={14} strokeWidth={3} />}</span>
            ) : (
              <PlaceAvatar place={place} size={40} category={place.category ? { color: place.category.color ?? undefined, icon: place.category.icon ?? undefined } : null} />
            )}
            <div className="li">
              <div className="t">{place.name}</div>
              {place.address && (
                <div className="s">
                  <MapPin size={11} />
                  <span>{place.address}</span>
                </div>
              )}
            </div>
            <div className="col-lrow-end">
              {place.category?.name && (() => {
                const CatIcon = getCategoryIcon(place.category.icon ?? undefined)
                return (
                  <>
                    <span className="col-lrow-cat" style={{ ['--cat' as string]: place.category.color || '#6366f1' }}>
                      <CatIcon size={11} /> {place.category.name}
                    </span>
                    <span className="col-lrow-div" aria-hidden />
                  </>
                )
              })()}
              <StatusBadge status={place.status} onChange={selectMode || !onStatusChange ? undefined : next => onStatusChange(place.id, next)} t={t} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
