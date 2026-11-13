import { useId } from 'react';

interface FlightArcProps {
  /** Share of the way flown, 0 to 1. */
  progress: number;
  /** Draws the aircraft; off where only the route is shown. */
  showPlane: boolean;
  /** Softens the aircraft while its position is a guess (stale feed). */
  dimPlane?: boolean;
  /** Colours as CSS values, so the desktop and the phone dress it in their own tokens. */
  track: string;
  flown: string;
  plane: string;
  className?: string;
}

// The arc is a quadratic curve across a fixed box; the SVG scales to its column.
const W = 320;
const H = 74;
const P0 = { x: 14, y: 62 };
const P1 = { x: W / 2, y: -14 };
const P2 = { x: W - 14, y: 62 };

function pointAt(t: number): { x: number; y: number; angle: number } {
  const u = 1 - t;
  const x = u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x;
  const y = u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y;
  const dx = 2 * u * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
  const dy = 2 * u * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const PATH = `M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`;

/** An airliner seen from above, nose along +x, about 18 units long. */
const PLANE =
  'M9 0c0-.9-.7-1.3-1.6-1.3H3.2L-1.6-7.6h-2.1l2.3 6.3h-4.1l-1.7-2.4h-1.6l1 3.7-1 3.7h1.6l1.7-2.4h4.1l-2.3 6.3h2.1l4.8-6.3h4.2C8.3 1.3 9 .9 9 0Z';

/**
 * The route of a flight as a gentle arc: dashed where it is still to fly,
 * solid where it has flown, the aircraft riding the curve at its heading.
 * Around the aircraft the lines are masked out rather than covered, so it sits
 * cleanly on any card, translucent ones included. In a right-to-left layout
 * the origin stands on the right, so the whole drawing is mirrored with it.
 * Purely visual; the numbers sit in the card around it.
 */
export default function FlightArc({
  progress,
  showPlane,
  dimPlane,
  track,
  flown,
  plane,
  className = '',
}: FlightArcProps) {
  const maskId = useId();
  const p = Math.min(1, Math.max(0, progress));
  const at = pointAt(p);
  // A CSS transform rather than the attribute, so a new position glides there.
  const placed = { transform: `translate(${at.x}px, ${at.y}px) rotate(${at.angle}deg)` };
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`block h-auto w-full overflow-visible rtl:-scale-x-100 ${className}`}
      aria-hidden="true"
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x={-20} y={-30} width={W + 40} height={H + 60}>
        <rect x={-20} y={-30} width={W + 40} height={H + 60} fill="white" />
        {showPlane && (
          <circle
            r={13}
            fill="black"
            style={placed}
            className="transition-transform duration-700 ease-out motion-reduce:transition-none"
          />
        )}
      </mask>
      <g mask={`url(#${maskId})`}>
        <path d={PATH} fill="none" stroke={track} strokeWidth={1.6} strokeDasharray="2 5" strokeLinecap="round" />
        {p > 0 && (
          <path
            d={PATH}
            fill="none"
            stroke={flown}
            strokeWidth={2.4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${p} 1`}
            className="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none"
          />
        )}
        <circle cx={P0.x} cy={P0.y} r={4} fill="none" stroke={p > 0 ? flown : track} strokeWidth={2} />
        <circle
          cx={P2.x}
          cy={P2.y}
          r={4}
          fill={p >= 1 ? flown : 'none'}
          stroke={p >= 1 ? flown : track}
          strokeWidth={2}
        />
      </g>
      {showPlane && (
        <g
          style={placed}
          className="transition-transform duration-700 ease-out motion-reduce:transition-none"
          opacity={dimPlane ? 0.55 : 1}
        >
          <path d={PLANE} fill={plane} />
        </g>
      )}
    </svg>
  );
}
