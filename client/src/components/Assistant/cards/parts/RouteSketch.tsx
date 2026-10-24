import { linePoints, sketchFrame, type SketchLine, type SketchMark } from './routeSketchModel';

/**
 * A route drawn small, without tiles or a network: the lines and stops of a
 * drive or a hike projected as the map projects them, on the quiet secondary
 * surface. Lines keep their width however the box scales; marks are sized
 * for a card a little wider than the phone. The sketch is geographic, so it
 * reads the same in both directions of text. With `onActivate` it is a
 * button (show it on the map).
 */

/** The card width the marks are sized for: a stop stays about three pixels across in a card this wide. */
const CARD_WIDTH = 360;

function Mark({ mark, x, y, unit }: { mark: SketchMark; x: number; y: number; unit: number }) {
  const dashed = mark.state === 'pending' ? `${2 * unit} ${2 * unit}` : undefined;
  const stroke = mark.state === 'removed' ? 'var(--text-faint)' : 'var(--text-muted)';
  return (
    <g>
      {mark.hot && <circle cx={x} cy={y} r={6 * unit} fill="none" stroke="var(--accent)" strokeWidth={unit} />}
      {mark.shape === 'via' ? (
        <rect
          x={x - 3.5 * unit}
          y={y - 3.5 * unit}
          width={7 * unit}
          height={7 * unit}
          transform={`rotate(45 ${x} ${y})`}
          fill="var(--accent)"
          strokeDasharray={dashed}
        />
      ) : (
        <circle
          cx={x}
          cy={y}
          r={(mark.shape === 'service' ? 4 : 3) * unit}
          fill={mark.shape === 'service' ? (mark.color ?? 'var(--text-muted)') : 'var(--bg-card)'}
          stroke={mark.shape === 'new' ? 'var(--accent)' : stroke}
          strokeWidth={unit}
          strokeDasharray={mark.shape === 'new' ? `${2 * unit} ${2 * unit}` : dashed}
        />
      )}
    </g>
  );
}

export default function RouteSketch({
  lines,
  marks,
  height,
  ariaLabel,
  onActivate,
}: {
  lines: readonly SketchLine[];
  marks: readonly SketchMark[];
  /** The box's height in pixels; its width is the card's. */
  height: number;
  ariaLabel: string;
  onActivate?: () => void;
}) {
  const frame = sketchFrame(lines, marks);
  if (!frame) return null;
  const svg = (
    <svg
      role={onActivate ? undefined : 'img'}
      aria-label={onActivate ? undefined : ariaLabel}
      aria-hidden={onActivate ? true : undefined}
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full"
    >
      {lines.map((line) => {
        const points = linePoints(frame, line.points);
        return (
          <g key={line.id} opacity={line.dim ? 0.4 : 1}>
            <polyline
              points={points}
              fill="none"
              stroke={line.casing}
              strokeWidth={4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={line.dashed ? '5 4' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
      {marks.map((mark) => {
        const [x, y] = frame.project(mark.lat, mark.lng);
        return <Mark key={mark.id} mark={mark} x={x} y={y} unit={frame.width / CARD_WIDTH} />;
      })}
    </svg>
  );
  const box = 'block w-full overflow-hidden rounded-xl bg-surface-secondary ring-1 ring-inset ring-edge-faint';
  if (!onActivate) {
    return (
      <div className={box} style={{ height }}>
        {svg}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={ariaLabel}
      className={`${box} transition-shadow hover:ring-edge focus-visible:ring-2 focus-visible:ring-accent`}
      style={{ height }}
    >
      {svg}
    </button>
  );
}
