import type { RoadtripDayBoundary } from './day-boundary.schema';
import type { WindowPlan } from './dayWindow';
import type { AutomaticNight } from './dayWindow';
import type { SpillMark } from './nightSpill';
import type { Schedule, ScheduleWarning, DayWarning, DryPoint } from './roadtripModel';

/**
 * A point a booking puts on the drive: the airport, station or port a flight, train,
 * ferry, cruise or bus leaves from or lands at, or the desk a hire car is picked up at
 * or handed back at.
 *
 * For a ride the drive ends at the departure terminal and starts again at the arrival
 * one; what happens in between is the booking's business, not the road's, and the leg
 * between the two carries the ride's minutes and nothing else. A hire car's pick-up and
 * return are points ON the road: the drive runs through them, it just starts or ends
 * there.
 */
export interface CarrierTerminal {
  reservationId: number;
  /** flight | train | ferry | cruise | bus for a ride, car for a hire car. */
  type: string;
  role: 'departure' | 'arrival' | 'pickup' | 'return';
  /** The booking's title, which is what the rail prints on the ride. */
  title: string;
  /** IATA code or station code, when the booking carries one. */
  code: string | null;
  /** The timetable's clock at this terminal, 'HH:mm' local, null when the booking names none. */
  at: string | null;
}

/** Which end of a day a booked night stands at: the stay slept in, or tonight's. */
export type BookendPhase = 'morning' | 'evening';

/**
 * A booked night standing at one end of a day it is no stop of: in the morning the stay
 * the traveller woke up in, in the evening the one they sleep in (`seatNightBookends`).
 *
 * The stay's own place, not an assignment: nothing about it can be moved, timed or given a
 * via point, and what it opens is the booking behind the night, or the stay itself when
 * nothing was booked for it.
 */
export interface NightBookend {
  phase: BookendPhase;
  accommodationId: number;
  /** The booking behind the night, the one a tap opens. Null for a stay entered without one. */
  reservationId: number | null;
  /** A morning on the day the stay is handed back. */
  checkingOut: boolean;
  /** An evening on the day the stay begins. */
  checkingIn: boolean;
  /**
   * The latest the room has to be handed back, on the morning it is: a label for the row,
   * never a time the drive leaves at (#2357).
   */
  checkOut: string | null;
  /** From when the room is ready, on the evening the stay begins. A label like `checkOut`. */
  checkIn?: string | null;
}

export interface RoadtripStop {
  automaticNight?: AutomaticNight;
  /** Set on the two ends of a carrier ride. Such a stop is no place and belongs to no assignment. */
  carrier?: CarrierTerminal;
  /** Set on a booked night standing at the start or the end of a day. Belongs to no assignment. */
  bookend?: NightBookend;
  assignmentId: number;

  ownerDayId: number;
  ownerIndex: number;
  placeId: number;
  name: string;
  lat: number;
  lng: number;

  time: string | null;

  /**
   * When the traveller leaves this stop: the visit's own end time, or the place's.
   * The stay then runs until it rather than for `dwellMinutes`.
   */
  leaveAt?: string | null;

  dwellMinutes: number | null;
  checkInTime?: string | null;
  /** A booked night's stop on its check-in day, whether or not the booking names an hour. */
  night?: boolean;
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
   * The road each of `legs` is drawn on, parallel to it: the very line the map shows for
   * that leg, vias included.
   *
   * Kept per leg because a surface that talks about ONE leg has to show the road the rail
   * actually drives there. `geometry` is the whole card in one line and cannot be cut back
   * into its legs without measuring it again, which is how the picker of other ways once
   * offered a road the rail was not on as the one it was.
   */
  legLines?: ([number, number][] | undefined)[];

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

  /** The road `arrivingLeg` is drawn on. Present exactly when `arrivingLeg` is. */
  arrivingLine?: [number, number][];

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

  /**
   * Which of `lines` is the drive INTO the following day rather than a drive within the
   * day it is drawn as, parallel to `lines` and `lineDays`.
   *
   * With "connect the days" on, the leg from one day's last stop to the next day's first
   * is drawn in the colour of the day it leaves, so on a map showing the whole drive it
   * reads as that day continuing. A surface showing ONE day has to tell the two apart:
   * the connection leads off the day on screen and belongs to the next one, and drawn
   * there it is a line to a place that day never visits.
   */
  lineJoins: boolean[];

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
