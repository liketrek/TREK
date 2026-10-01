import React from 'react'
import { MapPin, Star } from 'lucide-react'
import { getCategoryIcon } from '../shared/categoryIcons'
import { fs } from '../shared/DialogShell'
import { tintOf } from '../Planner/planParts'

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
  /** The picture its marker wears; the card shows it in place of the category tile. */
  photo?: string | null
}

export default function PlaceHoverCard({ x, y, name, categoryName, categoryIcon, categoryColor, address, rating, photo }: PlaceHoverCardProps): React.ReactElement {
  // The tile wears the category the way the planner's rows do; without one it is a quiet pin.
  const CatIcon = categoryName ? getCategoryIcon(categoryIcon) : MapPin
  const tone = categoryName ? categoryColor || 'var(--text-muted)' : null
  return (
    <div data-testid="tooltip"
      className="flex max-w-[300px] items-center gap-3 rounded-[18px] border border-edge-faint bg-surface-card p-1.5 pr-4 font-system shadow-popover"
      style={{ position: 'fixed', left: x + 14, top: y - 10, zIndex: 9999, pointerEvents: 'none' }}>
      {/* Twelve inside eighteen with six of padding: the picture's corners follow the card's. */}
      {photo ? (
        <img src={photo} alt="" className="block h-14 w-14 flex-none rounded-[12px] bg-surface-tertiary object-cover" />
      ) : (
        <span className="grid h-14 w-14 flex-none place-items-center rounded-[12px]"
          style={{ background: tone ? tintOf(tone, 14) : 'var(--bg-tertiary)' }}>
          <CatIcon size={18} strokeWidth={2} style={{ color: tone || 'var(--text-faint)' }} />
        </span>
      )}
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate font-semibold text-content" style={fs(13, 'body')}>{name}</span>
          {typeof rating === 'number' && rating > 0 && (
            <span className="inline-flex flex-none items-center gap-0.5 font-geist tabular-nums text-content-secondary" style={fs(11)}>
              <Star size={10} strokeWidth={2} className="fill-current text-warning" aria-hidden />
              {/* One decimal only when it earns it: "4" reads faster than "4.0". */}
              {Number.isInteger(rating) ? rating : rating.toFixed(1)}
            </span>
          )}
        </div>
        {categoryName && <span className="truncate text-content-muted" style={fs(11)}>{categoryName}</span>}
        {address && <span className="truncate text-content-faint" style={fs(11)}>{address}</span>}
      </div>
    </div>
  )
}
