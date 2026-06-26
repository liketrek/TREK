import React from 'react'
import { Plus, Check, Route } from 'lucide-react'
import PlaceAvatar from '../shared/PlaceAvatar'
import { getCategoryIcon } from '../shared/categoryIcons'
import type { Place, Category } from '../../types'

interface MemoPlaceRowProps {
  place: Place
  category: Category | undefined
  isSelected: boolean
  isPlanned: boolean
  inDay: boolean
  isChecked: boolean
  selectMode: boolean
  selectedDayId: number | null
  canEditPlaces: boolean
  isMobile: boolean
  t: (key: string, params?: Record<string, any>) => string
  onPlaceClick: (id: number | null) => void
  onContextMenu: (e: React.MouseEvent, place: Place) => void
  onAssignToDay: (placeId: number, dayId?: number) => void
  toggleSelected: (id: number) => void
  setDayPickerPlace: (place: any) => void
  registerPlaceRow: (placeId: number, element: HTMLDivElement | null) => void
}

export const MemoPlaceRow = React.memo(function MemoPlaceRow({
  place, category: cat, isSelected, isPlanned, inDay, isChecked,
  selectMode, selectedDayId, canEditPlaces, isMobile, t,
  onPlaceClick, onContextMenu, onAssignToDay, toggleSelected, setDayPickerPlace, registerPlaceRow,
}: MemoPlaceRowProps) {
  const hasGeometry = Boolean(place.route_geometry)
  return (
    <div
      key={place.id}
      ref={element => registerPlaceRow(place.id, element)}
      aria-selected={isSelected}
      data-place-id={place.id}
      draggable={!selectMode}
      onDragStart={e => {
        e.dataTransfer.setData('placeId', String(place.id))
        e.dataTransfer.effectAllowed = 'copy'
        window.__dragData = { placeId: String(place.id) }
      }}
      onClick={() => {
        if (selectMode) {
          toggleSelected(place.id)
        } else if (isMobile) {
          setDayPickerPlace(place)
        } else {
          onPlaceClick(isSelected ? null : place.id)
        }
      }}
      onContextMenu={selectMode ? undefined : e => onContextMenu(e, place)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px 9px 16px',
        cursor: selectMode ? 'pointer' : 'grab',
        background: isChecked ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : isSelected ? 'var(--border-faint)' : 'transparent',
        borderBottom: '1px solid var(--border-faint)',
        transition: 'background 0.1s',
        contentVisibility: 'auto',
        containIntrinsicSize: '0 52px',
      }}
      onMouseEnter={e => { if (!isSelected && !isChecked) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!isSelected && !isChecked) e.currentTarget.style.background = 'transparent' }}
    >
      {selectMode && (
        <div className={isChecked ? 'bg-accent' : 'bg-transparent'} style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: isChecked ? 'none' : '1.5px solid var(--border-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isChecked && <Check size={10} strokeWidth={3} color="white" />}
        </div>
      )}
      <PlaceAvatar place={place} category={cat} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
          {hasGeometry && <span title="Track / Route" style={{ display: 'inline-flex', flexShrink: 0 }}><Route size={11} strokeWidth={2} color="var(--text-faint)" /></span>}
          {cat && (() => {
            const CatIcon = getCategoryIcon(cat.icon)
            return <span title={cat.name} style={{ display: 'inline-flex', flexShrink: 0 }}><CatIcon size={11} strokeWidth={2} color={cat.color || '#6366f1'} /></span>
          })()}
          <span className="text-content" style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {place.name}
          </span>
        </div>
        {(place.description || place.address || cat?.name) && (
          <div style={{ marginTop: 2 }}>
            <span className="text-content-faint" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', lineHeight: 1.2 }}>
              {place.description || place.address || cat?.name}
            </span>
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {!selectMode && !inDay && selectedDayId && (
          <button
            onClick={e => { e.stopPropagation(); onAssignToDay(place.id) }}
            className="bg-surface-hover text-content-faint"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: 6,
              border: 'none', cursor: 'pointer',
              padding: 0, transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-faint)' }}
          ><Plus size={12} strokeWidth={2.5} /></button>
        )}
      </div>
    </div>
  )
})
