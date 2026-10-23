import { haversineMetres, type TourRouteCard } from '@trek/shared';

import type { SketchLine, SketchMark } from '../parts/routeSketchModel';
import { alongOf, sacPaint } from './tourRouteModel';

/**
 * A tour card's sketch, pure: the way in the colour the planner draws it in
 * (dashed while it is only its stops joined straight), the stretches graded
 * T3 and harder tinted over it, the carried, ferried and lifted stretches
 * dotted, the way a held change replaces faint beneath, the start as a disc
 * and the end as a ring, one disc when the way comes back to its start.
 */

/** The white rim the planner's highlighted lines wear. */
const CASING = 'var(--bike-highlight-casing)';
/** How close the end may lie to the start for the way to count as a loop, in metres. */
const LOOP_M = 60;

type Point = readonly [number, number];

/** The points of the line between two places along it, with one point either side so the piece joins the way. */
function pieceOf(points: readonly Point[], along: readonly number[], fromM: number, toM: number): Point[] {
  const inside = along.flatMap((metres, index) => (metres >= fromM && metres <= toM ? [index] : []));
  const first = inside[0];
  const last = inside[inside.length - 1];
  if (first === undefined || last === undefined) return [];
  const piece = points.slice(Math.max(0, first - 1), Math.min(points.length, last + 2));
  return piece.length >= 2 ? piece : [];
}

/** The lines and marks of a route's sketch; `paint` is the colour of the way (the chosen way's in a ways card). */
export function sketchOf(card: TourRouteCard, paint: string): { lines: SketchLine[]; marks: SketchMark[] } {
  const lines: SketchLine[] = [];
  if (card.previous) {
    lines.push({ id: 'previous', points: card.previous.line, color: 'var(--text-faint)', casing: CASING, dim: true });
  }
  const points = card.line.map(([lat, lng]): Point => [lat, lng]);
  if (points.length >= 2) {
    lines.push({ id: 'route', points, color: paint, casing: CASING, dashed: !card.routed });
    const along = alongOf(card);
    card.stretches.forEach((stretch, index) => {
      if (stretch.facet === 'ski') return;
      if (stretch.facet === 'sac' && stretch.step < 3) return;
      const piece = pieceOf(points, along, stretch.fromM, stretch.toM);
      if (piece.length === 0) return;
      lines.push(
        stretch.facet === 'sac'
          ? { id: `sac-${index}`, points: piece, color: sacPaint(stretch.step), casing: CASING }
          : { id: `mark-${index}`, points: piece, color: 'var(--text-muted)', casing: CASING, dashed: true }
      );
    });
  }
  const start = card.stops.find((stop) => stop.role === 'start');
  const end = [...card.stops].reverse().find((stop) => stop.role === 'end');
  const marks: SketchMark[] = [];
  if (start) marks.push({ id: 'start', lat: start.lat, lng: start.lng, shape: 'service', color: 'var(--accent)' });
  const loop = start && end && haversineMetres(start.lat, start.lng, end.lat, end.lng) <= LOOP_M;
  if (end && !loop) marks.push({ id: 'end', lat: end.lat, lng: end.lng, shape: 'stop' });
  return { lines, marks };
}
