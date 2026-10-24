/**
 * MCP-T01: how get_tour_plan lays one saved tour out for an assistant. The
 * facts come from the reads the app uses (the tour detail, its days, the
 * visits of a city walk on a day); this file only arranges them, so the plan
 * an assistant reads is the plan the travellers saved and nothing here writes.
 * Every number made here rather than stored is named in `derived`, so an
 * assistant never takes a reckoning for a saved fact, and a value nobody
 * stored stays null instead of being guessed.
 */
import type { WalkProgress } from './tour-visits.service';
import { computeTourMetrics, thinnedLine, type GeometryPoint } from './tours.helpers';
import {
  walkStationsOf,
  type TourDetailResponse,
  type TourFixedLeg,
  type TourFixedLegKind,
  type TourWaypoint,
} from '@trek/shared';

/** The most points of the saved line an answer carries: its shape without the thousands of points. */
export const TOUR_PLAN_LINE_POINTS = 200;

type VisitStatus = WalkProgress['stations'][number]['status'];

/** A control point as the plan answers it, with the name of the place it stands for where it stands for one. */
type PlanPoint = TourWaypoint & { linked_place_name?: string | null };

/**
 * CW-10: a city walk station with every field it has spelled out, so an
 * assistant reads a stay nobody entered as null and never as missing: null for
 * an unknown stay, a normal importance and no known hours, false for an
 * unprotected station. MCP-T01 adds its status on the day asked for, null
 * while no day was named: a visit belongs to one day, never to the walk.
 */
function spelledOut<T extends PlanPoint>(station: T, status: VisitStatus | null) {
  return {
    ...station,
    key: station.key ?? null,
    name: station.name ?? null,
    stay_minutes: station.stay_minutes ?? null,
    importance: station.importance ?? null,
    protected: station.protected === true,
    opening_hours: station.opening_hours ?? null,
    visit_status: status,
  };
}

/**
 * The points of a tour as get_tour_plan answers them: a city walk's stations
 * spelled out with their status on the day read, every other point as stored.
 * A station without a key is planned, as the day plan shows it.
 */
export function planPoints<T extends PlanPoint>(tourType: string, points: T[], run: WalkProgress | null) {
  const stations = new Set<T>(tourType === 'walk' ? walkStationsOf(points) : []);
  const statusByKey = new Map((run?.stations ?? []).map((station) => [station.key, station.status] as const));
  return points.map((point) => {
    if (!stations.has(point)) return point;
    if (!run) return spelledOut(point, null);
    return spelledOut(point, (point.key && statusByKey.get(point.key)) || 'planned');
  });
}

/** One leg of a tour, from a control point to the next, and how its line came to be. */
interface PlanLeg {
  from_sequence: number;
  to_sequence: number;
  /** The keys of its two points, the same across saves; null for a point that has none. */
  from_key: string | null;
  to_key: string | null;
  /**
   * routed: planned by the router; track: part of a recorded line (an import
   * without control points of its own), which no router planned; ferrata, free
   * and portage: a fixed line taken as it stands. A leg of a planned ski tour
   * (SKI-02) is free: the planner draws it straight between its points.
   */
  kind: 'routed' | 'track' | TourFixedLegKind;
  /** The via ferrata's name where OpenStreetMap gives one. */
  name: string | null;
  /**
   * Derived: the length of a fixed leg's own line, or of the straight line a
   * ski tour's leg is drawn as; null for a routed or track leg, whose length is
   * not stored apart.
   */
  length_km: number | null;
}

/** Kilometres to ten metres: the precision the app shows, and no false digits for an assistant. */
function roundKm(km: number): number {
  return Math.round(km * 100) / 100;
}

/** How the line between the control points came to be, as far as the tour itself says. */
interface PlanLegSource {
  /** The line is a recorded track (the tour stores no control points of its own), so no router planned it. */
  recorded: boolean;
  /**
   * SKI-02: whether the planner drew the leg starting at this point straight
   * (a ski tour's leg the piste router did not plan); left out, no leg was drawn.
   */
  drawn?: (leg: number) => boolean;
}

/** A fixed leg's line as points of a line: latitude and longitude, no height. */
function legLine(geometry: TourFixedLeg['geometry']): GeometryPoint[] {
  return geometry.map(([lat, lng]): GeometryPoint => [lat, lng]);
}

/** A leg drawn straight from one control point to the next, as the planner draws a ski tour's. */
function straightLine(from: TourWaypoint, to: TourWaypoint): GeometryPoint[] {
  return [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ];
}

/**
 * The legs between consecutive control points, each saying whether the router
 * planned it, it follows a recorded track, or it is a fixed line. A ski tour's
 * leg the piste router did not plan is a straight line between its points, as
 * the planner drew it.
 */
export function planLegs(points: readonly TourWaypoint[], { recorded, drawn }: PlanLegSource): PlanLeg[] {
  return points.slice(1).map((to, index) => {
    const from = points[index] as TourWaypoint;
    const leg = from.fixed_leg ?? null;
    const unfixed = recorded ? 'track' : drawn?.(index) ? 'free' : 'routed';
    const line = leg ? legLine(leg.geometry) : unfixed === 'free' ? straightLine(from, to) : null;
    return {
      from_sequence: from.sequence,
      to_sequence: to.sequence,
      from_key: from.key ?? null,
      to_key: to.key ?? null,
      kind: leg?.kind ?? unfixed,
      name: leg?.kind === 'ferrata' ? leg.name : null,
      length_km: line ? roundKm(computeTourMetrics(line).distanceKm) : null,
    };
  });
}

/** The saved line in brief: how many points it has, whether each carries a height, and its shape thinned. */
interface PlanLine {
  point_count: number;
  has_heights: boolean;
  /** Derived: at most TOUR_PLAN_LINE_POINTS of its points, spread evenly with both ends kept. */
  preview: GeometryPoint[];
}

/** The saved line of a tour, or null while it has none (a tour saved with its points only). */
export function planLine(line: readonly GeometryPoint[]): PlanLine | null {
  if (line.length < 2) return null;
  return {
    point_count: line.length,
    has_heights: computeTourMetrics(line).hasElevation,
    preview: thinnedLine(line, TOUR_PLAN_LINE_POINTS),
  };
}

/** The visits of a city walk on the day read: the day, its assignment, and what is still open. */
export function planRun(progress: WalkProgress) {
  return { day_id: progress.day_id, assignment_id: progress.assignment_id, open: progress.open };
}

/** What get_tour_plan read besides the tour detail, to tell which of its fields were worked out. */
interface PlanExtras {
  /** The control points are the two ends of the saved line: the tour stores none of its own. */
  controlsFromTrack: boolean;
  line: PlanLine | null;
  run: WalkProgress | null;
}

/**
 * The fields of this answer worked out when it was read rather than stored
 * with the tour. The distance, heights and walking time of a tour are stored
 * when it is saved, and the days are the trip's own assignments, so neither
 * is listed here. What a recorded track measures (ACT-01) is read off its
 * line on every read, a multi-day tour's stages (MDT-01) are counted from
 * its stage ends and the time an import is estimated to take (TIME-01) is
 * worked out from its measures, so all three are.
 */
export function derivedFields(detail: TourDetailResponse, { controlsFromTrack, line, run }: PlanExtras): string[] {
  const type = detail.tour.tour_type;
  return [
    'tour.planned',
    'tour.caution',
    'tour.route_pending',
    'provenance.editedLocally',
    'legs[].length_km',
    ...(line ? ['line.preview'] : []),
    ...(controlsFromTrack ? ['waypoints'] : []),
    ...(type === 'walk' ? ['tour.station_count', 'tour.station_stay_minutes', 'tour.station_stays_unknown'] : []),
    ...(detail.tour.walk_ferry_minutes !== undefined ? ['tour.walk_ferry_minutes'] : []),
    ...(run ? ['run.open'] : []),
    ...(type === 'kayak' ? ['tour.paddle_check', 'obstacle_check'] : []),
    ...((detail.activities?.length ?? 0) > 0 ? ['activities[].metrics'] : []),
    ...(detail.tour.stage_count != null ? ['tour.stage_count', 'tour.stage_stops'] : []),
    // TIME-01: an estimate is worked out on every read, never stored.
    ...(detail.tour.time_estimate ? ['tour.time_estimate'] : []),
  ];
}
