import type { GeometryPoint } from '@trek/shared';

import { z } from 'zod';

/**
 * What the router asks Valhalla about a hike besides its way, and how it
 * reads the answers: the heights along a line (/height) and the OpenStreetMap
 * ways under it (/trace_attributes). The request shapes are the planner's in
 * the browser (enrichTourElevations and valhallaTraceAttributes on the
 * client), so a hike planned on the server is measured as one planned there.
 * Pure: the requests themselves go through the router's one paced queue.
 */

/** Points one /height question carries; a longer line is asked in pieces that overlap by one point. */
export const HEIGHT_CHUNK_SIZE = 500;
/** The most points a description of a line asks about; a longer line is thinned evenly, its ends kept. */
const TRACE_MAX_POINTS = 4000;
/** How long a description may take before it counts as failed: the matcher is slower than the router. */
export const TRACE_TIMEOUT_MS = 30_000;
/** The most edges a description is read with; a line of 4000 points has far fewer. */
const TRACE_MAX_EDGES = 20_000;

type LinePoint = GeometryPoint | readonly [number, number];

/** The /height question for one piece of a line: every point, and the distance along it asked back. */
export function heightBody(piece: readonly LinePoint[]) {
  return { shape: piece.map(([lat, lng]) => ({ lat, lon: lng })), range: true };
}

/**
 * /height with `range` answers `[metres along, height]` per point; the height
 * is null where the terrain data has none.
 */
const heightAnswerSchema = z.object({
  range_height: z.array(z.tuple([z.number(), z.number().nullable()])).max(HEIGHT_CHUNK_SIZE),
});

/**
 * The height of each point of a piece, null where there is none, or null for
 * the whole piece when the answer is no answer of that kind or does not name
 * every point it was asked about.
 */
export function heightsOf(answer: unknown, expected: number): Array<number | null> | null {
  const parsed = heightAnswerSchema.safeParse(answer);
  if (!parsed.success || parsed.data.range_height.length !== expected) return null;
  return parsed.data.range_height.map(([, height]) => height);
}

/** The line thinned evenly to at most `TRACE_MAX_POINTS`, its last point always kept. */
function traceShape(line: readonly LinePoint[]) {
  const step = Math.max(1, Math.ceil(line.length / TRACE_MAX_POINTS));
  return line
    .filter((_, index) => index % step === 0 || index === line.length - 1)
    .map(([lat, lng]) => ({ lat, lon: lng }));
}

/**
 * The trace_attributes question for a hike's line: matched on foot with every
 * grade of path open, since a hike may run on a T6 ridge the matcher must not
 * refuse (matching is no routing: the limit the hike was planned with plays
 * no part), asking only for the way behind each edge and the edge's length.
 */
export function traceBody(line: readonly LinePoint[]) {
  return {
    shape: traceShape(line),
    costing: 'pedestrian',
    costing_options: { pedestrian: { max_hiking_difficulty: 6 } },
    shape_match: 'map_snap',
    filters: { attributes: ['edge.way_id', 'edge.length'], action: 'include' },
  };
}

const traceAnswerSchema = z.object({
  edges: z
    .array(
      z.object({
        way_id: z.number().int().nonnegative().optional(),
        /** Kilometres. */
        length: z.number().nonnegative().optional(),
      }),
    )
    .max(TRACE_MAX_EDGES),
});

/** One stretch of a described line: the OpenStreetMap way it runs on, where the router names one, and its length. */
export interface TracedWay {
  wayId: number | null;
  metres: number;
}

/**
 * The ways under a line in the order they are walked. An edge without a
 * length is left out, since it cannot be placed along the line; one without a
 * way keeps its length, so the stretches still add up to the line.
 */
export function tracedWaysOf(answer: unknown): TracedWay[] {
  const { edges } = traceAnswerSchema.parse(answer);
  return edges.flatMap((edge) =>
    edge.length === undefined
      ? []
      : [{ wayId: edge.way_id !== undefined && edge.way_id > 0 ? edge.way_id : null, metres: edge.length * 1000 }],
  );
}
