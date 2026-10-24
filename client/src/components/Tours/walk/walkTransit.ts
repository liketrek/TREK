import { clockOf, minutesOf, type TourListItem } from '@trek/shared';
import type { Assignment, Place, Reservation, TranslationFn } from '../../../types';
import type { MergedItem } from '../../../utils/dayMerge';
import { splitReservationDateTime } from '../../../utils/formatters';
import type { DayItineraryItem } from '../../Map/dayTourProjection';
import type { TransitLeg } from '../../Planner/transitLeg';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { tourPlannedTimes } from '../tourPresentation';
import { walkStartOf } from './walkSchedule';

/**
 * CW-08: public transit between two city walks on one day. The leg runs from
 * where the first walk really ends to where the next one starts, and departs
 * when the first one ends: its start that day and its planned total, a total
 * entered by hand before the one worked out. Where that cannot be worked out
 * no time is made up. The walks stay two walks on foot; nothing here is saved.
 */

const DAY_MINUTES = 24 * 60;
/** Closer than this, in degrees, a leg's end is the walk's end: the route copies the coordinates. */
const SAME_SPOT_DEG = 1e-9;

/** Which tour a place is, as the trip's tour list knows it. */
export type TourOf = (placeId: number) => TourListItem | undefined;

/** What the transit search says of the two walks a leg runs between. */
export interface WalkTransitContext {
  /** The day both walks are on: on another day the search no longer speaks of them. */
  dayId: number;
  fromWalk: string;
  toWalk: string;
  /** `HH:MM` the first walk ends that day; null where it cannot be worked out or ends on the next day. */
  ends: string | null;
  /** The first walk ends after midnight, on another day than the one searched on. */
  endsNextDay: boolean;
  /** The end leaves out a time not known yet, so the walk ends then at the earliest. */
  endsAtLeast: boolean;
  /** `HH:MM` the next walk starts that day; null without a start time. */
  nextStarts: string | null;
}

type TourItem = Extract<DayItineraryItem, { kind: 'tour' }>;

/** A walk in the day's route: its item there and the tour it is. */
interface DayWalk {
  item: TourItem;
  tour: TourListItem;
}

/** The two walks a leg runs between. */
export interface WalkPair {
  first: DayWalk;
  next: DayWalk;
}

/** A walk the arrival comes too late for: its name and the `HH:MM` it starts. */
export interface WalkLate {
  walk: string;
  time: string;
}

function sameSpot(point: { lat: number; lng: number } | null, other: { lat: number; lng: number }): boolean {
  return !!point && Math.abs(point.lat - other.lat) < SAME_SPOT_DEG && Math.abs(point.lng - other.lng) < SAME_SPOT_DEG;
}

function walkOf(item: DayItineraryItem | undefined, tourOf: TourOf): DayWalk | null {
  if (item?.kind !== 'tour') return null;
  const tour = tourOf(item.placeId);
  return tour?.tour_type === 'walk' ? { item, tour } : null;
}

/** Whether the day's route goes to an item: in the route, and a walk or a stop with a location. */
function routeGoesTo(item: DayItineraryItem): boolean {
  const { assignment } = item;
  if (assignment.route_excluded || assignment.accommodation_id != null) return false;
  return item.kind === 'tour' || (!!assignment.place?.lat && !!assignment.place?.lng);
}

/**
 * The walk a leg leaves from its end and the walk it reaches at its start, or
 * null where the leg is no such leg. The leg is told by the entry it leaves,
 * as the connector carries it, since two walks of a day can end at one spot;
 * it reaches the next point the route goes to, so that must be the next walk.
 */
export function walkPairAt(
  items: readonly DayItineraryItem[],
  leg: Pick<TransitLeg, 'from' | 'to'>,
  tourOf: TourOf,
  originId: number | undefined
): WalkPair | null {
  const index = items.findIndex((item) => item.assignment.id === originId);
  const first = walkOf(items[index], tourOf);
  if (!first || !sameSpot(first.item.end, leg.from)) return null;
  const next = walkOf(items.slice(index + 1).find(routeGoesTo), tourOf);
  return next && sameSpot(next.item.start, leg.to) ? { first, next } : null;
}

/**
 * When a walk ends after a start, in minutes after midnight, or null without
 * a start or a total. Past midnight it ends on the next day. A list that says
 * nothing of the stops leaves the stays out, so that end is a lower bound too.
 */
export function walkEndOf(
  start: number | null,
  tour: TourListItem
): { minutes: number; atLeast: boolean; nextDay: boolean } | null {
  const times = tourPlannedTimes(tour);
  if (start === null || times.plannedTotalMinutes === null) return null;
  const minutes = start + times.plannedTotalMinutes;
  return {
    minutes,
    atLeast: times.atLeast || (!times.manuallyOverridden && times.walk === null),
    nextDay: minutes >= DAY_MINUTES,
  };
}

/** A stop as named: its own name, else the trip place it stands for. */
function stopName(stop: TourPlannerWaypoint | undefined, places: readonly Pick<Place, 'id' | 'name'>[]): string {
  if (!stop) return '';
  return stop.name || places.find((place) => place.id === stop.linkedPlaceId)?.name || '';
}

export interface WalkTransitInput {
  leg: TransitLeg;
  dayId: number;
  pair: WalkPair;
  /** Each walk's stops as read; null where they could not be read. */
  stops: { first: readonly TourPlannerWaypoint[] | null; next: readonly TourPlannerWaypoint[] | null };
  places: readonly Pick<Place, 'id' | 'name'>[];
  t: TranslationFn;
}

/**
 * The search for a leg between two walks: from the first walk's last stop to
 * the next one's first, each named, else said as the end or start of its walk,
 * at the coordinates the day's route draws, so a journey saved there joins it.
 * It departs when the first walk ends, and never at the time the leg's own
 * point carries: that is when the walk starts.
 */
export function walkTransitLeg({ leg, dayId, pair, stops, places, t }: WalkTransitInput): TransitLeg & {
  walk: WalkTransitContext;
} {
  const { first, next } = pair;
  const firstStops = stops.first ?? [];
  // A loop ends where it starts, at its first stop again.
  const endStop = first.item.loop ? firstStops[0] : firstStops[firstStops.length - 1];
  const end = walkEndOf(walkStartOf(first.item.assignment), first.tour);
  // Past midnight no time on the search's day is made up.
  const ends = end && !end.nextDay ? clockOf(end.minutes) : null;
  const nextStart = walkStartOf(next.item.assignment);
  return {
    from: { ...leg.from, name: stopName(endStop, places) || t('tours.walk.transit.endOf', { walk: first.tour.name }) },
    to: {
      ...leg.to,
      name: stopName(stops.next?.[0], places) || t('tours.walk.transit.startOf', { walk: next.tour.name }),
    },
    time: ends,
    walk: {
      dayId,
      fromWalk: first.tour.name,
      toWalk: next.tour.name,
      ends,
      endsNextDay: end?.nextDay ?? false,
      endsAtLeast: end?.atLeast ?? false,
      nextStarts: nextStart === null ? null : clockOf(nextStart),
    },
  };
}

/**
 * Whether an arrival comes after a start on a day: a later date always, the
 * same date by the clock. An arrival without a date is on that day. Nothing is
 * said without a date, a start or an arrival time.
 */
export function arrivesAfterStart(
  arrival: { date: string | null; time: string | null },
  date: string | null,
  start: string | null
): boolean {
  const startMinutes = minutesOf(start);
  const arrivalMinutes = minutesOf(arrival.time);
  if (!date || startMinutes === null || arrivalMinutes === null) return false;
  const arrivalDate = arrival.date ?? date;
  return arrivalDate === date ? arrivalMinutes > startMinutes : arrivalDate > date;
}

/** The next walk a connection found in the search arrives too late for, or null. */
export function lateForWalk(
  walk: WalkTransitContext | null,
  date: string | null,
  arrival: { date: string | null; time: string | null }
): WalkLate | null {
  if (!walk?.nextStarts || !arrivesAfterStart(arrival, date, walk.nextStarts)) return null;
  return { walk: walk.toWalk, time: walk.nextStarts };
}

export interface JourneyLateInput {
  reservation: Pick<Reservation, 'type' | 'reservation_end_time'>;
  /** The day's items after the journey, in their order. */
  following: readonly MergedItem[];
  date: string | null;
  tourOf: TourOf;
}

/**
 * A saved journey that now arrives after the walk it leads to starts, said
 * while the plan is looked at and never written: a walk moved or a journey
 * changed since shows here, and nothing is replaced. Only a public transit
 * journey, followed by a walk with a start time, notes aside.
 */
export function journeyLate({ reservation, following, date, tourOf }: JourneyLateInput): WalkLate | null {
  if (reservation.type !== 'transit') return null;
  const next = following.find((item) => item.type !== 'note');
  if (next?.type !== 'place') return null;
  const assignment: Assignment = next.data;
  const tour = assignment.tour_place_id === assignment.place_id ? tourOf(assignment.place_id) : undefined;
  const start = walkStartOf(assignment);
  if (tour?.tour_type !== 'walk' || start === null) return null;
  const time = clockOf(start);
  const arrival = splitReservationDateTime(reservation.reservation_end_time);
  return arrivesAfterStart(arrival, date, time) ? { walk: tour.name, time } : null;
}
