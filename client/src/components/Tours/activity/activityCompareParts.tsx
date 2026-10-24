/**
 * ACT-02: how plan and actual track look wherever they are named side by
 * side, so the detail's table and the map's legend show the same two lines:
 * the plan solid in its track colour, the actual track dotted in the colour
 * of done. Dotted as well as coloured, so the two stay apart for someone who
 * cannot tell the hues apart, and on a screenshot in black and white.
 */

/** The colour of what was recorded, as the actual track's card and profile already use it. */
export const ACTUAL_TRACK_COLOR = 'var(--success)';

/** A short stretch of line: solid for the plan, dotted for the actual track. */
export function LineSwatch({ color, dotted = false }: { color: string; dotted?: boolean }) {
  return (
    <svg width="22" height="8" viewBox="0 0 22 8" aria-hidden="true" className="flex-none overflow-visible">
      <line
        x1="2"
        y1="4"
        x2="20"
        y2="4"
        strokeWidth={dotted ? 3.2 : 3.5}
        strokeLinecap="round"
        strokeDasharray={dotted ? '0.1 5.4' : undefined}
        style={{ stroke: color }}
      />
    </svg>
  );
}
