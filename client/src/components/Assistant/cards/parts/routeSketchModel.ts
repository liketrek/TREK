/**
 * The geometry of a route sketch: lines and marks projected the way the map
 * projects them (Web Mercator), framed by everything they hold with a little
 * room around it, in a box 1000 units wide. Pure, so the sketch and a test
 * read the same numbers. Points are `[lat, lng]`.
 */

/** One line to draw: a day of a drive, a way of a hike. Colours are CSS values the caller made safe. */
export interface SketchLine {
  id: string;
  points: readonly (readonly [number, number])[];
  color: string;
  casing: string;
  dashed?: boolean;
  dim?: boolean;
}

/** One mark on the sketch: a stop, a service stop, a via the route passes, a stop a change adds. */
export interface SketchMark {
  id: string;
  lat: number;
  lng: number;
  shape: 'stop' | 'service' | 'via' | 'new';
  color?: string;
  state?: 'pending' | 'removed';
  hot?: boolean;
}

/** The width of the sketch's box in its own units; its height follows the route's shape. */
const SKETCH_WIDTH = 1000;
/** The room around everything, as a share of the longer side. */
const PADDING = 0.08;
/** The box of a sketch with a single point, which has no shape of its own. */
const POINT_HEIGHT = 400;
/** The tallest box a narrow route gets, so a line running north does not turn into a needle. */
const MAX_HEIGHT = 2000;

const RAD = Math.PI / 180;

/** Web Mercator's y for a latitude, in the units of a longitude in radians. */
export function mercatorY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  return Math.log(Math.tan(Math.PI / 4 + (clamped * RAD) / 2));
}

interface SketchFrame {
  width: number;
  height: number;
  /** A point's place in the box: `x` to the east, `y` down. */
  project(lat: number, lng: number): [number, number];
}

/** The frame of everything a sketch draws, or null when it holds no point at all. */
export function sketchFrame(lines: readonly SketchLine[], marks: readonly SketchMark[]): SketchFrame | null {
  const points: [number, number][] = [
    ...lines.flatMap((line) => line.points.map(([lat, lng]): [number, number] => [lng * RAD, mercatorY(lat)])),
    ...marks.map((mark): [number, number] => [mark.lng * RAD, mercatorY(mark.lat)]),
  ];
  if (points.length === 0) return null;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = maxY - Math.min(...ys);
  const side = Math.max(spanX, spanY);
  if (side === 0) {
    return { width: SKETCH_WIDTH, height: POINT_HEIGHT, project: () => [SKETCH_WIDTH / 2, POINT_HEIGHT / 2] };
  }
  const pad = side * PADDING;
  const scale = SKETCH_WIDTH / (spanX + 2 * pad);
  const height = Math.min(MAX_HEIGHT, Math.round((spanY + 2 * pad) * scale));
  return {
    width: SKETCH_WIDTH,
    height,
    project: (lat, lng) => [(lng * RAD - minX + pad) * scale, (maxY - mercatorY(lat) + pad) * scale],
  };
}

/** A line as an SVG `points` list in the frame, rounded to a tenth of a unit. */
export function linePoints(frame: SketchFrame, points: SketchLine['points']): string {
  return points
    .map(([lat, lng]) => {
      const [x, y] = frame.project(lat, lng);
      return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
    })
    .join(' ');
}
