import { badRequest } from '../common/domain-error';
import { thinnedLine } from './tours.helpers';
import {
  clockOf,
  haversineMetres,
  minutesOf,
  stationFit,
  stationHoursOn,
  TOUR_DISPLAY_LINE_POINTS,
  TOUR_MAX_SNAP_M,
  TOUR_POI_MAX_CATEGORIES,
  TOUR_STATION_HOURS_MAX,
  TOUR_STATION_NAME_MAX,
  WALK_THEMES,
  type CityWalkStation,
  type HoursSource,
  type HoursWindow,
  type StationFit,
  type TourPoi,
  type TourPoiCategory,
  type WalkTheme,
} from '@trek/shared';

/**
 * CW-11: a city walk proposed from a briefing, worked out without guessing.
 * The stations are ordered on estimates over the straight distance with an
 * allowance for streets; the walk in that order is then planned on foot by the
 * router, and its legs time the walk. Where the router gives no way, the
 * estimates stand and say so. A stay is known only where the traveller gave
 * it, and every other stay stays unknown, which makes the arrivals after it
 * lower bounds. Opening hours are read with the helpers the planner and the
 * tour detail use, and a lower bound is never called a conflict unless it
 * already is one.
 */

/** The walking pace of the estimate, 4.5 km/h, in metres a minute. */
const WALK_PACE_M_PER_MIN = 75;
/** The allowance for streets over the straight distance. */
const STREET_FACTOR = 1.3;
/** Closer than this, a place found is a station the traveller already named. */
const SAME_PLACE_M = 60;

type BriefingSource = 'start' | 'end' | 'wished' | 'appointment' | 'trip_place' | 'theme';

/** Why a place of a theme is in: its theme and category, the source that has it, how far from the line searched. */
interface ThemeFind {
  theme: WalkTheme;
  category: TourPoiCategory;
  kind: string;
  found_in: string;
  poi_id: string;
  distance_to_search_m: number;
}

/** A station the walk may get, as the proposal weighs it. */
export interface WalkCandidate {
  source: BriefingSource;
  name: string | null;
  lat: number;
  lng: number;
  /** Minutes; null when nobody said. */
  stay: number | null;
  /** A trip place's own hours, seven days as JSON. */
  placeHours: string | null;
  /** Hours as OpenStreetMap writes them. */
  osmHours: string | null;
  /** The trip place it stands for. */
  placeId: number | null;
  /** An appointment's time, minutes after midnight. */
  time: number | null;
  find: ThemeFind | null;
}

/** The frame of a walk in minutes after midnight, and the date its hours are read for. */
export interface WalkFrame {
  start: number;
  end: number;
  date: string | null;
}

export type LeftOutReason =
  'closed_all_day' | 'closed_at_arrival' | 'closes_during_stay' | 'no_time' | 'no_position' | 'not_in_trip' | 'is_tour';

export interface LeftOut {
  name: string | null;
  source: BriefingSource;
  place_id: number | null;
  poi_id: string | null;
  reason: LeftOutReason;
}

type StationConflict = 'closed_all_day' | 'closed_at_arrival' | 'closes_during_stay' | 'late' | 'after_frame';
type HoursConflict = Extract<StationConflict, LeftOutReason>;

type Clock = { from: string; to: string };

/** What a station's hours say about the visit, as an assistant reads it. */
export type HoursCheck =
  | { kind: 'no_date' }
  | { kind: 'unknown' }
  | { kind: 'unread'; text: string }
  | { kind: 'next_day' }
  | { kind: 'uncertain'; source: HoursSource }
  | { kind: 'open'; source: HoursSource; window: Clock }
  | { kind: 'closed_all_day'; source: HoursSource }
  | { kind: 'closed'; source: HoursSource; windows: Clock[] }
  | { kind: 'closes'; source: HoursSource; window: Clock };

interface Leg {
  metres: number;
  minutes: number;
}

/** The way on foot between the stations as the router planned it, or why the estimates stand in for it. */
export type FootWay =
  | { kind: 'routed'; line: Array<[number, number]>; legs: Leg[]; seconds: number }
  | {
      kind: 'unrouted';
      why: 'nothing_to_route' | 'router_unavailable' | 'station_off_the_way' | 'ferry_only';
      /** The station no way reaches, or (ferry_only) the one the crossing by boat starts at, counted from 1. */
      position: number | null;
    };

/** What the router answers for the stations: its line, a part for each leg, and how far it moved each station onto a way. */
export interface FootRouteAnswer {
  leg: { line: Array<[number, number]> };
  parts: ReadonlyArray<{ distance: number; duration: number }>;
  snapped?: ReadonlyArray<{ meters: number }>;
  /** CW-12: the legs, counted from 0, the router could only join by boat. */
  ferryLegs?: readonly number[];
}

interface Visit {
  node: WalkCandidate;
  leg: Leg | null;
  arrival: number;
  /** The arrival is only a lower bound: a stay before it is not known. */
  earliest: boolean;
  leave: number | null;
  lateBy: number;
  roomBefore: number;
  fit: StationFit | 'no_date' | null;
}

interface Timeline {
  visits: Visit[];
  endsAt: number;
  endsEarliest: boolean;
}

/** The frame a briefing gives; refused when it ends before it starts or an appointment lies outside it. */
export function frameOf(
  briefing: { start_time: string; end_time: string; appointments?: ReadonlyArray<{ time: string }> },
  date: string | null,
): WalkFrame {
  const start = minutesOf(briefing.start_time) ?? Number.NaN;
  const end = minutesOf(briefing.end_time) ?? Number.NaN;
  if (!(end > start)) throw badRequest('end_time must be after start_time, both HH:MM on one day');
  const outside = (briefing.appointments ?? []).some((appointment) => {
    const time = minutesOf(appointment.time) ?? Number.NaN;
    return !(time >= start && time <= end);
  });
  if (outside) throw badRequest('An appointment has to lie between start_time and end_time');
  return { start, end, date };
}

/** The categories the themes ask for, each with the first theme that brought it, as many as one search takes. */
export function briefingCategories(themes: readonly WalkTheme[]): {
  searched: Array<{ category: TourPoiCategory; theme: WalkTheme }>;
  notSearched: TourPoiCategory[];
} {
  const all = themes.flatMap((theme) => WALK_THEMES[theme].map((category) => ({ category, theme })));
  const unique = all.filter((entry, index) => all.findIndex((other) => other.category === entry.category) === index);
  return {
    searched: unique.slice(0, TOUR_POI_MAX_CATEGORIES),
    notSearched: unique.slice(TOUR_POI_MAX_CATEGORIES).map((entry) => entry.category),
  };
}

function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return haversineMetres(a.lat, a.lng, b.lat, b.lng);
}

/** The straight distance and the walking time it estimates. */
export function legOf(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Leg {
  const metres = metresBetween(from, to);
  return { metres: Math.round(metres), minutes: Math.ceil((metres * STREET_FACTOR) / WALK_PACE_M_PER_MIN) };
}

/**
 * The router's way as the walk takes it: each leg's distance and walking time,
 * and the line. A station the router had to move further onto a way than the
 * planner allows is one no way on foot reaches, and the way is not taken. Nor
 * is a way that crosses by boat (CW-12): the boat's time would pass for
 * walking, so the walk waits for the travellers to take the crossing in the
 * planner.
 */
export function footWayOf(answer: FootRouteAnswer): FootWay {
  const off = (answer.snapped ?? []).findIndex((point) => point.meters > TOUR_MAX_SNAP_M);
  if (off >= 0) return { kind: 'unrouted', why: 'station_off_the_way', position: off + 1 };
  const boat = answer.ferryLegs?.[0];
  if (boat !== undefined) return { kind: 'unrouted', why: 'ferry_only', position: boat + 1 };
  return {
    kind: 'routed',
    line: answer.leg.line,
    legs: answer.parts.map((part) => ({ metres: Math.round(part.distance), minutes: Math.ceil(part.duration / 60) })),
    seconds: answer.parts.reduce((sum, part) => sum + part.duration, 0),
  };
}

/**
 * The places of the themes as candidates, the nearest to the line searched
 * first, taking turns between the categories so each theme is heard. A place
 * without a name, or one where the traveller already named a station, is not
 * offered.
 */
export function themeCandidates(
  pois: readonly TourPoi[],
  searched: ReadonlyArray<{ category: TourPoiCategory; theme: WalkTheme }>,
  taken: ReadonlyArray<{ lat: number; lng: number }>,
): WalkCandidate[] {
  const offered = pois.filter(
    (poi) => poi.name.trim() !== '' && !taken.some((spot) => metresBetween(spot, poi) <= SAME_PLACE_M),
  );
  const queues = searched.map(({ category, theme }) =>
    offered
      .filter((poi) => poi.category === category)
      .sort((a, b) => a.distance_m - b.distance_m)
      .map((poi) => themeCandidate(poi, theme)),
  );
  const rounds = Math.max(0, ...queues.map((queue) => queue.length));
  return Array.from({ length: rounds }, (_, round) => queues.flatMap((queue) => queue.slice(round, round + 1))).flat();
}

function themeCandidate(poi: TourPoi, theme: WalkTheme): WalkCandidate {
  return {
    source: 'theme',
    name: poi.name,
    lat: poi.lat,
    lng: poi.lng,
    stay: null,
    placeHours: null,
    osmHours: poi.opening_hours,
    placeId: null,
    time: null,
    find: {
      theme,
      category: poi.category,
      kind: poi.kind,
      found_in: poi.source,
      poi_id: poi.id,
      distance_to_search_m: poi.distance_m,
    },
  };
}

function fitOf(node: WalkCandidate, at: { arrival: number; atLeast: boolean }, date: string | null): Visit['fit'] {
  if (node.source === 'start' || node.source === 'end') return null;
  if (date === null) return 'no_date';
  return stationFit(stationHoursOn({ place: node.placeHours, osm: node.osmHours }, date), at, node.stay);
}

/**
 * The arrivals along the walk: the start at its time, the walking time of each
 * leg (the router's where it planned the way, else the estimate), the stays as
 * far as known. An appointment's own time sets the clock again once the walk
 * is there in time; a stay not known makes every later arrival a lower bound
 * until then.
 */
function timelineOf(route: readonly WalkCandidate[], frame: WalkFrame, legs?: readonly Leg[]): Timeline {
  let clock = frame.start;
  let unknownBefore = false;
  const visits = route.map((node, index): Visit => {
    const leg = index > 0 ? (legs?.[index - 1] ?? legOf(route[index - 1], node)) : null;
    clock += leg?.minutes ?? 0;
    const lateBy = node.time === null ? 0 : Math.max(0, clock - node.time);
    const roomBefore = node.time === null ? 0 : Math.max(0, node.time - clock);
    if (node.time !== null && lateBy === 0) {
      clock = node.time;
      unknownBefore = false;
    }
    const at = { arrival: clock, atLeast: unknownBefore };
    const fit = fitOf(node, at, frame.date);
    if (node.stay === null) unknownBefore = true;
    else clock += node.stay;
    return {
      node,
      leg,
      arrival: at.arrival,
      earliest: at.atLeast,
      leave: node.stay === null ? null : clock,
      lateBy,
      roomBefore,
      fit,
    };
  });
  return { visits, endsAt: clock, endsEarliest: unknownBefore };
}

const HOURS_CONFLICTS: Partial<Record<StationFit['kind'], HoursConflict>> = {
  closedAllDay: 'closed_all_day',
  closed: 'closed_at_arrival',
  closes: 'closes_during_stay',
};

function hoursConflictOf(visit: Visit): HoursConflict | undefined {
  return visit.fit && visit.fit !== 'no_date' ? HOURS_CONFLICTS[visit.fit.kind] : undefined;
}

/** How far the walk misses its times: appointments reached late, and the end past the frame. */
function overrunOf(timeline: Timeline, frame: WalkFrame): number {
  return timeline.visits.reduce((sum, visit) => sum + visit.lateBy, Math.max(0, timeline.endsAt - frame.end));
}

/** The places a station may take: after the start, and before the end when the walk has one. */
function slotsOf(route: readonly WalkCandidate[], hasEnd: boolean): number[] {
  return Array.from({ length: route.length - (hasEnd ? 1 : 0) }, (_, index) => index + 1);
}

/** The straight metres a station adds where it goes in. */
function detourOf(route: readonly WalkCandidate[], at: number, station: WalkCandidate): number {
  const before = route[at - 1];
  const after = route[at];
  const to = metresBetween(before, station);
  return after ? to + metresBetween(station, after) - metresBetween(before, after) : to;
}

/**
 * Where a station goes: the cheapest place it fits, open on arrival, without
 * making an appointment late or the walk end later past its frame, and
 * without bringing a station already on the walk there after it closed; the
 * cheapest place and what stands in its way otherwise.
 */
function placed(
  route: readonly WalkCandidate[],
  station: WalkCandidate,
  frame: WalkFrame,
  hasEnd: boolean,
): { route: WalkCandidate[]; trouble: Exclude<LeftOutReason, 'no_position' | 'not_in_trip' | 'is_tour'> | null } {
  const before = timelineOf(route, frame);
  const base = overrunOf(before, frame);
  const closedBefore = new Set(
    before.visits.filter((visit) => hoursConflictOf(visit) !== undefined).map((visit) => visit.node),
  );
  const options = slotsOf(route, hasEnd)
    .map((at) => {
      const next = [...route.slice(0, at), station, ...route.slice(at)];
      const timeline = timelineOf(next, frame);
      const visit = timeline.visits[at];
      const late = visit.arrival > frame.end || overrunOf(timeline, frame) > base;
      const closesOther = timeline.visits.some(
        (other, index) => index !== at && hoursConflictOf(other) !== undefined && !closedBefore.has(other.node),
      );
      return {
        route: next,
        trouble: hoursConflictOf(visit) ?? (late || closesOther ? ('no_time' as const) : null),
        detour: detourOf(route, at, station),
      };
    })
    .sort((a, b) => a.detour - b.detour);
  return options.find((option) => option.trouble === null) ?? options[0];
}

function leftOutOf(station: WalkCandidate, reason: LeftOutReason): LeftOut {
  return {
    name: station.name,
    source: station.source,
    place_id: station.placeId,
    poi_id: station.find?.poi_id ?? null,
    reason,
  };
}

export interface WalkPlanInput {
  frame: WalkFrame;
  start: WalkCandidate;
  end: WalkCandidate | null;
  appointments: WalkCandidate[];
  wished: WalkCandidate[];
  tripPlaces: WalkCandidate[];
  /** In the order they are offered. */
  themes: WalkCandidate[];
  themeLimit: number;
}

/**
 * The stations in their order: the start, the appointments in time order and
 * the end stay where they are; every wished station goes in, where it fits
 * best, whatever stands in its way; a trip place and a place of a theme go in
 * only where they fit, and a theme takes at most `themeLimit` places, looking
 * at twice as many. What did not fit is left out with the reason.
 */
export function planWalk(input: WalkPlanInput): { route: WalkCandidate[]; leftOut: LeftOut[] } {
  const hasEnd = input.end !== null;
  const appointments = [...input.appointments].sort((a, b) => Number(a.time) - Number(b.time));
  let route = [input.start, ...appointments, ...(input.end ? [input.end] : [])];
  const leftOut: LeftOut[] = [];
  for (const station of input.wished) route = placed(route, station, input.frame, hasEnd).route;
  const offer = (station: WalkCandidate) => {
    const option = placed(route, station, input.frame, hasEnd);
    if (option.trouble === null) route = option.route;
    else leftOut.push(leftOutOf(station, option.trouble));
    return option.trouble === null;
  };
  input.tripPlaces.forEach(offer);
  let taken = 0;
  for (const station of input.themes.slice(0, input.themeLimit * 2)) {
    if (taken < input.themeLimit && offer(station)) taken += 1;
  }
  return { route, leftOut };
}

function clockSpan([from, to]: HoursWindow): Clock {
  return { from: clockOf(from), to: clockOf(to) };
}

/** A station's hours check as an assistant reads it. */
export function hoursCheckOf(fit: StationFit | 'no_date'): HoursCheck {
  if (fit === 'no_date') return { kind: 'no_date' };
  switch (fit.kind) {
    case 'unknown':
      return { kind: 'unknown' };
    case 'unread':
      return { kind: 'unread', text: fit.text };
    case 'nextDay':
      return { kind: 'next_day' };
    case 'uncertain':
      return { kind: 'uncertain', source: fit.source };
    case 'open':
      return { kind: 'open', source: fit.source, window: clockSpan(fit.window) };
    case 'closedAllDay':
      return { kind: 'closed_all_day', source: fit.source };
    case 'closed':
      return { kind: 'closed', source: fit.source, windows: fit.windows.map(clockSpan) };
    case 'closes':
      return { kind: 'closes', source: fit.source, window: clockSpan(fit.window) };
  }
}

function conflictsOf(visit: Visit, frame: WalkFrame): StationConflict[] {
  const hours = hoursConflictOf(visit);
  return [
    ...(hours ? [hours] : []),
    ...(visit.lateBy > 0 ? (['late'] as const) : []),
    ...(visit.arrival > frame.end ? (['after_frame'] as const) : []),
  ];
}

const IMPORTANCE: Record<BriefingSource, 'must' | 'optional' | null> = {
  start: null,
  end: null,
  wished: 'must',
  appointment: 'must',
  trip_place: null,
  theme: 'optional',
};

/** A station as create_city_walk takes it: what the proposal knows, nothing more. */
function stationForCreate(node: WalkCandidate): CityWalkStation {
  const hours = node.osmHours?.trim() ?? '';
  return {
    lat: node.lat,
    lng: node.lng,
    name: node.name?.slice(0, TOUR_STATION_NAME_MAX) ?? null,
    stay_minutes: node.stay,
    importance: IMPORTANCE[node.source],
    protected: node.source === 'appointment',
    // Hours too long to keep are left out rather than cut into something else.
    opening_hours: hours && hours.length <= TOUR_STATION_HOURS_MAX ? hours : null,
    linked_place_id: node.placeId,
  };
}

/** Where a known stay comes from: the traveller, or the frame, which leaves the start and ends at the end; null when not known. */
function staySourceOf(node: WalkCandidate): 'given' | 'frame' | null {
  if (node.stay === null) return null;
  return node.source === 'start' || node.source === 'end' ? 'frame' : 'given';
}

function stationOf(visit: Visit, index: number, frame: WalkFrame) {
  const { node } = visit;
  return {
    position: index + 1,
    name: node.name,
    lat: node.lat,
    lng: node.lng,
    source: node.source,
    found: node.find,
    place_id: node.placeId,
    walk_from_previous: visit.leg && { metres: visit.leg.metres, minutes: visit.leg.minutes },
    arrival: clockOf(visit.arrival),
    arrival_is_earliest: visit.earliest,
    appointment_time: node.time === null ? null : clockOf(node.time),
    stay_minutes: node.stay,
    stay_source: staySourceOf(node),
    leave: visit.leave === null ? null : clockOf(visit.leave),
    importance: IMPORTANCE[node.source],
    protected: node.source === 'appointment',
    opening_hours: node.osmHours,
    hours: visit.fit && hoursCheckOf(visit.fit),
    conflicts: conflictsOf(visit, frame),
  };
}

interface Gap {
  before_position: number | null;
  from: string;
  to: string;
  minutes: number;
  unknown_stays: number;
  kind: 'before_appointment' | 'at_end';
}

/** Free time before an appointment the walk reaches early, and at the end of the frame, with the unknown stays it may take. */
function gapsOf(timeline: Timeline, frame: WalkFrame): Gap[] {
  const gaps: Gap[] = [];
  let unknown = 0;
  timeline.visits.forEach((visit, index) => {
    if (visit.node.time !== null) {
      if (visit.roomBefore > 0) {
        const from = clockOf(visit.arrival - visit.roomBefore);
        gaps.push({
          before_position: index + 1,
          from,
          to: clockOf(visit.arrival),
          minutes: visit.roomBefore,
          unknown_stays: unknown,
          kind: 'before_appointment',
        });
      }
      unknown = 0;
    }
    if (visit.node.stay === null) unknown += 1;
  });
  const room = frame.end - timeline.endsAt;
  if (room > 0) {
    gaps.push({
      before_position: null,
      from: clockOf(timeline.endsAt),
      to: clockOf(frame.end),
      minutes: room,
      unknown_stays: unknown,
      kind: 'at_end',
    });
  }
  return gaps;
}

function totalsOf(timeline: Timeline, gaps: readonly Gap[], frame: WalkFrame) {
  const { visits } = timeline;
  const walk = visits.reduce((sum, visit) => sum + (visit.leg?.minutes ?? 0), 0);
  const stays = visits.reduce((sum, visit) => sum + (visit.node.stay ?? 0), 0);
  const unknown = visits.filter((visit) => visit.node.stay === null).length;
  return {
    walk_minutes: walk,
    walk_m: visits.reduce((sum, visit) => sum + (visit.leg?.metres ?? 0), 0),
    stay_minutes_known: stays,
    stays_unknown: unknown,
    total_minutes: walk + stays,
    total_complete: unknown === 0,
    ends_at: clockOf(timeline.endsAt),
    ends_at_is_earliest: timeline.endsEarliest,
    over_frame_by_minutes: Math.max(0, timeline.endsAt - frame.end),
    minutes_left_for_unknown_stays:
      unknown === 0 ? null : gaps.filter((gap) => gap.unknown_stays > 0).reduce((sum, gap) => sum + gap.minutes, 0),
  };
}

/** How the walking times were found: the router's way on foot, or the estimate over the straight distance and why. */
function estimateOf(way: FootWay) {
  if (way.kind === 'routed') return { kind: 'routed' as const, profile: 'walking' as const };
  return {
    kind: 'straight_line' as const,
    street_factor: STREET_FACTOR,
    pace_kmh: (WALK_PACE_M_PER_MIN * 60) / 1000,
    why: way.why,
    position: way.position,
  };
}

/**
 * The way on foot for drawing, thinned to TOUR_DISPLAY_LINE_POINTS, where it
 * was planned and the caller asked for it (include_geometry); nothing else.
 */
export function walkLineGeometry(
  way: FootWay,
  asked: boolean | undefined,
): { line_geometry?: Array<[number, number]> } {
  return asked === true && way.kind === 'routed'
    ? { line_geometry: thinnedLine(way.line, TOUR_DISPLAY_LINE_POINTS) }
    : {};
}

/** The walk as the proposal says it: its stations with their times, the gaps, the totals and what create_city_walk takes. */
export function describeWalk(route: readonly WalkCandidate[], frame: WalkFrame, way: FootWay) {
  const timeline = timelineOf(route, frame, way.kind === 'routed' ? way.legs : undefined);
  const stations = timeline.visits.map((visit, index) => stationOf(visit, index, frame));
  const gaps = gapsOf(timeline, frame);
  const stationsForCreate = route.map(stationForCreate);
  return {
    date: frame.date,
    frame: { start_time: clockOf(frame.start), end_time: clockOf(frame.end) },
    stations,
    wishes_not_met: stations
      .filter(
        (station) => (station.source === 'wished' || station.source === 'appointment') && station.conflicts.length > 0,
      )
      .map(({ position, name, source, conflicts }) => ({ position, name, source, conflicts })),
    gaps,
    totals: totalsOf(timeline, gaps, frame),
    estimate: estimateOf(way),
    stations_for_create: stationsForCreate,
    can_create: stationsForCreate.length >= 2,
  };
}
