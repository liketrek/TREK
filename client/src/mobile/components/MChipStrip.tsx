import { useState, type ReactNode } from 'react';

import { edgeFadeClass, useEdgeFade } from './useEdgeFade';

/**
 * A row of chips that scrolls sideways once it is wider than its room, and
 * fades out at an edge with more behind it, the way the trip's day strip does,
 * so a chip cut by the edge reads as "the row goes on" rather than as a word
 * cut in half. It shrinks to its room in a row it shares (min-width 0), so a
 * button beside it stays beside it instead of covering the chips.
 */
export default function MChipStrip({
  children,
  className = '',
  label,
}: {
  children: ReactNode;
  /** Layout of the row itself: gap, alignment, growth. */
  className?: string;
  /** Names the group for a screen reader, where the chips are a set of filters. */
  label?: string;
}) {
  const [strip, setStrip] = useState<HTMLDivElement | null>(null);
  const fade = useEdgeFade(strip);
  return (
    <div
      ref={setStrip}
      role={label ? 'group' : undefined}
      aria-label={label}
      className={`flex min-w-0 overflow-x-auto ${edgeFadeClass(fade)} ${className}`}
    >
      {children}
    </div>
  );
}
