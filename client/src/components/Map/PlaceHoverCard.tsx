import React from 'react'
import { Star } from 'lucide-react'
import { getCategoryIcon } from '../shared/categoryIcons'

/**
 * What a place is, shown at the cursor while the pointer rests on its marker.
 *
 * One card for every map. It was written twice, once in each renderer, and the two
 * had already drifted in how they resolved the category icon; a third copy for the
 * collections map was not going to end better. Collections is also why it carries a
 * rating: on a wall of round photos, "which of these did I like" is the question the
 * picture cannot answer.
 *
 * Follows the cursor rather than anchoring to the marker, and never takes the
 * pointer: it is a label on the map, not something to aim at.
 */
export interface PlaceHoverCardProps {
  x: number
  y: number
  name: string | null | undefined
  categoryName?: string | null
  categoryIcon?: string | null
  categoryColor?: string | null
  address?: string | null
  /** Average across everyone who rated it, when the surface tracks ratings. */
  rating?: number | null
}

export default function PlaceHoverCard({ x, y, name, categoryName, categoryIcon, categoryColor, address, rating }: PlaceHoverCardProps): React.ReactElement {
  const CatIcon = categoryName ? getCategoryIcon(categoryIcon) : null
  return (
    <div data-testid="tooltip" style={{
      position: 'fixed',
      left: x + 14,
      top: y - 10,
      zIndex: 9999,
      pointerEvents: 'none',
      background: 'white',
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      padding: '6px 10px',
      fontFamily: 'var(--font-system)',
      maxWidth: 220,
      whiteSpace: 'nowrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        {typeof rating === 'number' && rating > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#111827' }}>
            <Star size={10} style={{ fill: '#f59e0b', color: '#f59e0b' }} aria-hidden />
            {/* One decimal only when it earns it: "4" reads faster than "4.0". */}
            {Number.isInteger(rating) ? rating : rating.toFixed(1)}
          </span>
        )}
      </div>
      {categoryName && CatIcon && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
          <CatIcon size={10} style={{ color: categoryColor || '#6b7280', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#6b7280' }}>{categoryName}</span>
        </div>
      )}
      {address && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {address}
        </div>
      )}
    </div>
  )
}
