import type { FerrySpan } from './valhallaRoute';

/** One step of a Valhalla leg, with the fields the ferry spans are read from. */
export interface ValhallaManeuver {
  type?: number;
  ferry?: boolean;
  begin_shape_index?: number;
  end_shape_index?: number;
  time?: number;
  length?: number;
}

/** Valhalla's maneuver type for boarding a ferry; the maneuver also carries `ferry: true` for its crossing. */
const FERRY_ENTER = 28;

/**
 * CW-12: the stretches of a leg the router takes by boat, read off its
 * maneuvers: a crossing is the maneuver that boards the ferry, from the point
 * it starts at to the one it ends at, with its own length and time. Measured
 * on Venice, the San Tomà to Ca' Rezzonico line came back as one maneuver of
 * type 28, ferry true, 1.236 km and 745 s over shape points 24 to 46, then the
 * walk off it. Crossings that touch are one. A leg the summary says has a
 * ferry but whose maneuvers do not say where is taken whole, without a time:
 * the crossing is somewhere on it, and none of it is counted as walked.
 */
export function ferrySpansOf(maneuvers: ValhallaManeuver[] | undefined, points: number): FerrySpan[] {
  const spans: FerrySpan[] = [];
  for (const maneuver of maneuvers ?? []) {
    if (maneuver.ferry !== true && maneuver.type !== FERRY_ENTER) continue;
    const from = Number(maneuver.begin_shape_index);
    const to = Number(maneuver.end_shape_index);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to <= from || to >= points) continue;
    const metres = Number.isFinite(maneuver.length) ? Number(maneuver.length) * 1000 : 0;
    const seconds = Number.isFinite(maneuver.time) ? Number(maneuver.time) : null;
    const previous = spans[spans.length - 1];
    if (previous && previous.to === from) {
      previous.to = to;
      previous.metres += metres;
      previous.seconds = previous.seconds === null || seconds === null ? null : previous.seconds + seconds;
    } else {
      spans.push({ from, to, metres, seconds });
    }
  }
  return spans.length || points < 2 ? spans : [{ from: 0, to: points - 1, metres: 0, seconds: null }];
}
