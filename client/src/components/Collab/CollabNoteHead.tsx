import { Pin } from 'lucide-react';
import type { ReactNode } from 'react';

import { fs } from '../Planner/bookings/bookingParts';
import { tintOf } from '../Planner/planParts';
import { Tooltip } from '../shared/Tooltip';

/**
 * The head band of a shared note, tinted by its category's colour: the
 * category as a dot (its name in the tooltip), the title, a pin when it is
 * pinned and whatever the caller puts at the end (the note card's link, menu
 * and author). The Collab tab and the assistant chat's note cards draw it.
 */
export function NoteHeadBand({
  title,
  color,
  category,
  pinned,
  bordered,
  trailing,
  titleClassName = '',
}: {
  title: ReactNode;
  /** The category's colour, already checked. */
  color: string;
  category: string | null;
  pinned: boolean;
  /** A line under the band, when a body follows. */
  bordered: boolean;
  trailing?: ReactNode;
  /** Extra classes for the title (struck through for a note about to go). */
  titleClassName?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 py-1.5 pe-1.5 ps-3 ${bordered ? 'border-b border-edge-faint' : ''}`}
      style={{ background: tintOf(color) }}
    >
      {/* The category is only its colour here; the name is in the tooltip and the filter above. */}
      {category && (
        <Tooltip label={category}>
          <span
            role="img"
            aria-label={category}
            data-testid="note-category-dot"
            className="h-2.5 w-2.5 flex-none rounded-full"
            style={{ background: color }}
          />
        </Tooltip>
      )}
      <span className={`min-w-0 flex-1 truncate font-bold text-content ${titleClassName}`} style={fs(13, 'body')}>
        {title}
      </span>
      {pinned && <Pin size={12} strokeWidth={2.2} className="flex-none" style={{ color }} />}
      {trailing}
    </div>
  );
}
