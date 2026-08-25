import React from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Plus, Check, Star } from 'lucide-react'
import PlaceAvatar from '../shared/PlaceAvatar'
import { getCategoryIcon } from '../shared/categoryIcons'
import { resolveTrackColor } from '../Map/trackColors'
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
  // Touch is reached through a long press instead of being locked out (#1616).
  const dragDisabled = isMobile
  // One place for what a row does, so the keyboard path below cannot drift from the click.
  const activate = () => {
    if (selectMode) {
      toggleSelected(place.id)
    } else if (isMobile) {
      setDayPickerPlace(place)
    } else {
      onPlaceClick(isSelected ? null : place.id)
    }
  }
  return (
    <div
      key={place.id}
      ref={element => registerPlaceRow(place.id, element)}
      role="option"
      tabIndex={0}
      aria-selected={isSelected}
      data-place-id={place.id}
      draggable={!selectMode && !dragDisabled}
      onDragStart={e => {
        if (dragDisabled) { e.preventDefault(); return }
        e.dataTransfer.setData('placeId', String(place.id))
        e.dataTransfer.effectAllowed = 'copy'
        window.__dragData = { placeId: String(place.id) }
      }}
      onClick={activate}
      onKeyDown={e => {
        // Only when the row itself has focus — the "+" button inside it keeps its own key handling.
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() }
      }}
      onContextMenu={selectMode ? undefined : e => onContextMenu(e, place)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px 9px 16px',
        cursor: selectMode || dragDisabled ? 'pointer' : 'grab',
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
          {/* A stroke of the colour the track is drawn in — the map has no legend
              of its own, so this is what tells you which line is this row (#776).
              A line rather than another 11px icon, so it doesn't read as a second
              category glyph next to the one below. */}
          {hasGeometry && (
            <span title={t('places.trackIndicator')} style={{ display: 'inline-flex', flexShrink: 0 }}>
              <span style={{ display: 'block', width: 14, height: 3, borderRadius: 999, background: resolveTrackColor(place) }} />
            </span>
          )}
          {cat && (() => {
            const CatIcon = getCategoryIcon(cat.icon)
            return <span title={cat.name} style={{ display: 'inline-flex', flexShrink: 0 }}><CatIcon size={11} strokeWidth={2} color={cat.color || '#6366f1'} /></span>
          })()}
          <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {place.name}
          </span>
          {/* Average member rating (#1435). */}
          {(place.rating_count ?? 0) > 0 && place.rating_avg != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              <Star size={9} color="#facc15" fill="#facc15" />
              {(Math.round(place.rating_avg * 10) / 10).toLocaleString()}
            </span>
          )}
        </div>
        {(place.description || place.address || cat?.name) && (
          <div style={{ marginTop: 2 }}>
            {/* Rendered, like the same line in the day plan: the description is
                Markdown everywhere else, and printing it raw here was the one
                place a formatted place read as `_underscores_`. Still clamped to
                one line — the row is a list entry, not the inspector. */}
            <div className="collab-note-md text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, maxHeight: '1.2em' }}>
              <Markdown remarkPlugins={[remarkGfm]}>{place.description || place.address || cat?.name || ''}</Markdown>
            </div>
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {!selectMode && !inDay && selectedDayId !== null && (
          <button type="button"
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
