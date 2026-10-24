import type { CSSProperties, SVGProps } from 'react';
import { PADDLE_GLYPH_PATHS, type PaddleGlyphKind } from './paddleGlyphPaths';

/**
 * The paddler's own symbols, drawn on lucide's grid (24, stroke 2, round
 * caps) so they sit beside its icons without a seam: a lock as a chamber
 * between its two mitre gates, a portage as footsteps (lucide's own), a weir
 * as water falling over a ledge, a dam as a wall holding water back, rapids
 * as broken water, getting in and out as an arrow into or out of the water.
 * The waypoint list, the map and the checklist all use them.
 */
export function PaddleGlyph({
  kind,
  size = 16,
  strokeWidth = 2,
  ...rest
}: { kind: PaddleGlyphKind; size?: number; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, 'children'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-paddle-glyph={kind}
      {...rest}
    >
      {PADDLE_GLYPH_PATHS[kind].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The portage glyph as an icon component, for menus that take one. */
export function PortageIcon(props: { size?: number; style?: CSSProperties }) {
  return <PaddleGlyph kind="portage" {...props} />;
}

/** The lock glyph as an icon component, for menus that take one. */
export function LockIcon(props: { size?: number; style?: CSSProperties }) {
  return <PaddleGlyph kind="lock" {...props} />;
}
