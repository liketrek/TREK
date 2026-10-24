/**
 * Where a journey began and where it ended, for a map whose stops are marked
 * by their ends. The start is a ring around a dot, the way a route planner
 * marks its origin; the finish is a disc carrying a pennant. Both sit on a
 * soft shadow so they stand clear of the line through them.
 */
export function EndMarker({
  x,
  y,
  r,
  finish,
  ink,
  paper,
}: {
  x: number;
  y: number;
  /** The marker's radius in millimetres, the size a numbered stop has. */
  r: number;
  finish: boolean;
  /** The line's colour, and the colour that reads on it. */
  ink: string;
  paper: string;
}) {
  const R = r * 1.15;
  return (
    <g>
      <circle cx={x} cy={y + R * 0.12} r={R * 1.12} fill="#000000" fillOpacity={0.14} />
      {finish ? (
        <>
          <circle cx={x} cy={y} r={R} fill={ink} stroke={paper} strokeWidth={R * 0.16} />
          <line
            x1={x - R * 0.28}
            y1={y + R * 0.5}
            x2={x - R * 0.28}
            y2={y - R * 0.52}
            stroke={paper}
            strokeWidth={R * 0.14}
            strokeLinecap="round"
          />
          <path
            d={`M${x - R * 0.28} ${y - R * 0.52} L${x + R * 0.5} ${y - R * 0.27} L${x - R * 0.28} ${y - R * 0.02} Z`}
            fill={paper}
          />
        </>
      ) : (
        <>
          <circle cx={x} cy={y} r={R} fill={paper} stroke={ink} strokeWidth={R * 0.3} />
          <circle cx={x} cy={y} r={R * 0.34} fill={ink} />
        </>
      )}
    </g>
  );
}
