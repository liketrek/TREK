/**
 * The via ferrata mark as a React element: the ladder on a disc that the map
 * draws at a ferrata's midpoint, in the same `--map-ferrata` tokens, for the
 * places beside the map that point at one (a waypoint at its foot or top).
 */
export function FerrataGlyph({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="9.75" fill="var(--map-ferrata-casing)" stroke="var(--map-ferrata)" strokeWidth="1.5" />
      <path
        d="M8 6v10M14 6v10M8 8.5h6M8 11h6M8 13.5h6"
        fill="none"
        stroke="var(--map-ferrata)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The same ladder as a line icon, drawn the way lucide draws its icons (24 grid,
 * round caps, the current colour), for controls that sit among lucide icons:
 * the via ferrata switch in the map's layer pill.
 */
export function FerrataLineIcon({ size = 15, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3v18M16 3v18M8 7h8M8 12h8M8 17h8" />
    </svg>
  );
}
