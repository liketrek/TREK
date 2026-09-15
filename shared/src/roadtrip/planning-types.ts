import type { RoadtripDayBoundary } from './day-boundary.schema';
import type { WindowPlan } from './dayWindow';
import type { AutomaticNight } from './dayWindow';
import type { SpillMark } from './nightSpill';
import type { Schedule, ScheduleWarning, DayWarning, DryPoint } from './roadtripModel';

export interface RoadtripStop {
  automaticNight?: AutomaticNight;
  assignmentId: number;

  ownerDayId: number;
  ownerIndex: number;
  placeId: number;
  name: string;
  lat: number;
  lng: number;

  time: string | null;

  dwellMinutes: number | null;
  checkInTime?: string | null;
  endDay?: boolean;

  legMode: string | null;
  incomingLegMode: string | null;

  stopType: string | null;

  fillPercent?: number | null;

  offRoadMeters?: number | null;
}

export interface RoutedLeg {
  seg: RouteSegment;
  line: [number, number][];

  snapped?: { from: SnappedPoint | null; to: SnappedPoint | null };

  vias: RouteVia[];
}

export interface SnappedPoint {
  lat: number;
  lng: number;

  offRoadMeters: number;
}

export interface RouteSegment {
  mid: [number, number];
  from: [number, number];
  to: [number, number];
  distance: number;
  duration: number;
  walkingText: string;
  drivingText: string;
  distanceText: string;
  durationText?: string;

  noteText?: string;

  mode?: string;
}

export interface RouteVia {
  hoverCard?: boolean;
  nightPause?: {
    day: number;
    atPlace: boolean;
    position?: number;
    manual?: boolean;
    minPosition?: number;
    maxPosition?: number;
  };
  lat: number;
  lng: number;
  label?: string;
  tone: 'default' | 'success' | 'warn' | 'danger';
  dwellSeconds?: number;
}

export interface SnappedWaypoint {
  asked: [number, number];

  at: [number, number];

  meters: number;
}

export type DistanceUnit = 'metric' | 'imperial';
export type RouteAvoidClass = 'motorway' | 'toll' | 'ferry';
export interface RoadtripDay {
  automaticSchedule?: boolean;
  dayId: number;
  dayNumber: number;
  date: string | null;
  title: string | null;
  stops: RoadtripStop[];

  legs: (RouteSegment | undefined)[];

  /**
   * The drive from where the day before ended to where this one starts.
   *
   * Only when the days are connected, and only when no stop actually crossed over —
   * a crossing is already drawn as a spill, with this same road under it. Separate
   * from `legs`, which are the roads BETWEEN this day's own stops: this one arrives
   * before the first of them, and without it a morning that begins at 08:11 looks
   * like it began out of nowhere.
   */
  arrivingLeg?: RouteSegment;

  /**
   * The stop the drive at the head of this card's `geometry` sets off from, when the
   * days are connected.
   *
   * Kept even where `arrivingLeg` is withheld for a crossing further down the card: the
   * band goes, the road stays drawn. A point placed on that stretch belongs after THIS
   * stop, on the day it is stored on, and nothing else on the card says which stop that
   * is. Measured against the card's own first stop instead, a via dropped there was
   * filed on the leg after it, and the drive ran on, turned back to the point and came
   * the same way again.
   */
  arrivingFrom?: RoadtripStop;

  schedule: Schedule;

  legVias: RouteVia[][];

  avoidMissed?: RouteAvoidClass[];

  dryPoints?: (DryPoint & { lat: number; lng: number })[];

  drivingGeometry?: [number, number][];

  geometry: [number, number][];
  distance: number;
  duration: number;

  driveWarnings: ScheduleWarning[];

  dayWarning: DayWarning | null;

  spills?: SpillMark[];
}

export type PlanDay = Pick<RoadtripDay, 'dayId' | 'dayNumber' | 'date' | 'title' | 'stops'>;

export interface AccessSpur {
  line: [[number, number], [number, number]];
  meters: number;

  stopKey: string;
}

export interface QuietDay {
  dayId: number;
  dayNumber: number;
  date: string | null;
  title: string | null;

  stops: RoadtripStop[];
}

export interface RoadtripRoutes {
  boundaryPath?: DayBoundaryLeg[];
  validateBoundaries?: (boundaries: RoadtripDayBoundary[]) => WindowPlan['issue'];
  dayWindowIssue?: 'incomplete' | 'conflict' | 'tooLong' | 'legTooLong' | null;
  days: RoadtripDay[];

  quietDays: QuietDay[];

  lines: [number, number][][];

  lineDays: number[];

  accessLines: AccessSpur[];

  vias: RouteVia[];

  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  totalStops: number;

  loading: boolean;
}

export interface DayBoundaryLeg {
  from: RoadtripStop;
  to: RoadtripStop;
  position: number;
  line: [number, number][];
}
