import { MAX_TRIP_DAYS } from '../trip/trip.schema';
import { lineMetres, projectOntoRoute, sliceAtMeters } from './corridor';
import type { RoadtripDayBoundary } from './day-boundary.schema';
import type { SpillChain } from './nightSpill';
import type { RoadtripDay, RoadtripStop, RoutedLeg } from './planning-types';
import type { DistanceUnit } from './planning-types';
import { formatClock, hasChosenArrival, isStoredStop, leaveAfter, parseClock } from './roadtripModel';
import { formatDurationShort } from './roadtripModel';
import { formatDistance } from './units';

export interface DayWindow {
  start: number;
  end: number;
  endMode?: 'route' | 'stop';
}

export interface AutomaticNight {
  phase: 'start' | 'end';
  fromDayNumber: number;
  position?: number;
  manual?: boolean;
}

type PlanDay = Pick<RoadtripDay, 'dayId' | 'dayNumber' | 'date' | 'title' | 'stops'>;
type LegLookup = (from: RoadtripStop, to: RoadtripStop) => RoutedLeg | undefined;

export function dayWindow(start: unknown, end: unknown, endMode?: unknown): DayWindow | null {
  const minutes = (clock: unknown): number | null => {
    if (typeof clock !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) return null;
    return Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
  };
  const from = minutes(start);
  const to = minutes(end);
  return from !== null && to !== null && to > from
    ? { start: from, end: to, ...(endMode === 'stop' ? ({ endMode } as const) : {}) }
    : null;
}

function portion(leg: RoutedLeg, from: number, to: number, unit: DistanceUnit): RoutedLeg {
  if (from === 0 && to === 1) return leg;
  const coordinates = leg.line.length ? leg.line : [leg.seg.from, leg.seg.to];
  const spine = coordinates.map(([lat, lng]) => ({ lat, lng }));
  const metres = lineMetres(spine);
  const line =
    metres === 0
      ? coordinates
      : sliceAtMeters(spine, from * metres, to * metres).map((p) => [p.lat, p.lng] as [number, number]);
  const distance = leg.seg.distance * (to - from);
  const duration = leg.seg.duration * (to - from);
  const durationText = formatDurationShort(duration);
  const distanceText = formatDistance(distance / 1000, unit);
  return {
    seg: {
      ...leg.seg,
      distance,
      duration,
      distanceText,
      durationText,
      drivingText: `${distanceText} · ${durationText}`,
      walkingText: `${distanceText} · ${durationText}`,
      from: line[0]!,
      to: line[line.length - 1]!,
      mid: line[Math.floor(line.length / 2)]!,
    },
    line,
    vias: leg.vias.filter((v) => {
      const along = (projectOntoRoute(v, spine)?.alongKm ?? 0) * 1000;
      return along >= from * metres && (to === 1 ? along <= metres : along < to * metres);
    }),
  };
}

/**
 * The leg of a drive that goes nowhere: from a stop to the same spot, nothing measured.
 *
 * Between the last stop of a day and the marker that closes it, and between a booked
 * night's hotel in the evening and the same hotel the next morning (`withStationaryJoins`).
 */
export function stationary(stop: RoadtripStop): RoutedLeg {
  const at: [number, number] = [stop.lat, stop.lng];
  return {
    line: [],
    vias: [],
    seg: {
      from: at,
      to: at,
      mid: at,
      distance: 0,
      duration: 0,
      mode: 'driving',
      walkingText: '',
      drivingText: '',
      distanceText: '',
    },
  };
}

export interface WindowPlan {
  chains: SpillChain[];
  legFor: LegLookup;
  issue: 'incomplete' | 'conflict' | 'tooLong' | 'legTooLong' | null;
}

export function planDayWindow(
  days: PlanDay[],
  window: DayWindow,
  lookup: LegLookup,
  unit: DistanceUnit,
  labels: { start: string; end: string },
  boundaries: RoadtripDayBoundary[] = [],
): WindowPlan {
  const ordered = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  const stops = ordered.flatMap((day) => day.stops.map((stop) => ({ stop, day })));
  const failed = (issue: WindowPlan['issue']): WindowPlan => ({ chains: [], legFor: lookup, issue });
  if (!stops.length) return { chains: [], legFor: lookup, issue: null };
  const positions = new Map(stops.map(({ stop }, i) => [stop.assignmentId, i]));
  // Where a day ended at stop `i` really ends: behind tonight's hotel when the booked night
  // stands right after it on the same day. Ended at the stop, the hotel would be put on the
  // morning after, a drive to bed made the next day.
  const behindTonight = (i: number): number => {
    const next = stops[i + 1]?.stop;
    return next?.bookend?.phase === 'evening' && next.ownerDayId === stops[i]!.stop.ownerDayId ? i + 1 : i;
  };
  // A stop set to end its day ends it there, or behind tonight's hotel right after it.
  const endsDayHere = (i: number): boolean => {
    if (stops[i]!.stop.endDay) return behindTonight(i) === i;
    return i > 0 && !!stops[i - 1]!.stop.endDay && behindTonight(i - 1) === i;
  };
  const targets = new Map<number, number>();
  let lastTarget = -1;
  for (const boundary of [...boundaries].sort((a, b) => a.day_number - b.day_number)) {
    const from = positions.get(boundary.from_assignment_id);
    const to = boundary.to_assignment_id === null ? null : positions.get(boundary.to_assignment_id);
    // A boundary between two stops a booked night now stands between is left alone: the
    // night ends the day there already, and the two are no longer next to each other only
    // because the hotel stands in between.
    if (
      from !== undefined &&
      to !== null &&
      to !== undefined &&
      to > from + 1 &&
      stops.slice(from + 1, to).every(({ stop }) => stop.bookend)
    )
      continue;
    if (from === undefined || (to !== null && to !== from + 1)) return failed('conflict');
    const target = to === null ? behindTonight(from) : from + boundary.fraction;
    if (target <= lastTarget) return failed('conflict');
    targets.set(boundary.day_number, target);
    lastTarget = target;
  }
  const legs = stops.slice(0, -1).map((s, i) => lookup(s.stop, stops[i + 1]!.stop));
  if (
    legs.some(
      (l) => !l || !Number.isFinite(l.seg.duration) || l.seg.duration < 0 || (l.line.length < 2 && l.seg.distance > 0),
    )
  ) {
    return failed('incomplete');
  }

  const chains = new Map<number, SpillChain>();
  const pieces = new Map<RoadtripStop, Map<RoadtripStop, RoutedLeg>>();
  const firstDay = stops[0]!.day.dayNumber;
  let number = firstDay;
  let clock = window.start;
  let issue: WindowPlan['issue'] = null;
  let position = 0;

  const chainAt = (n: number): SpillChain => {
    const existing = chains.get(n);
    if (existing) return existing;
    const stored = ordered.find((d) => d.dayNumber === n);
    const dated = ordered.find((d) => d.date);
    let date = stored?.date ?? null;
    if (!stored && dated?.date) {
      const dayDate = new Date(`${dated.date}T12:00:00Z`);
      dayDate.setUTCDate(dayDate.getUTCDate() + n - dated.dayNumber);
      date = dayDate.toISOString().slice(0, 10);
    }
    const chain: SpillChain = {
      dayId: stored?.dayId ?? -1000000000 - n,
      dayNumber: n,
      date,
      title: stored?.title ?? null,
      stops: [],
      schedule: { entries: [], warnings: [] },
      spills: [],
    };
    chains.set(n, chain);
    return chain;
  };
  const putLeg = (from: RoadtripStop, to: RoadtripStop, leg: RoutedLeg) => {
    if (!pieces.has(from)) pieces.set(from, new Map());
    pieces.get(from)!.set(to, leg);
  };
  const append = (stop: RoadtripStop, arrival: number, departure = arrival) => {
    const chain = chainAt(number);
    chain.stops.push(stop);
    chain.schedule.entries.push({
      arrival: formatClock(Math.round(arrival)),
      departure: formatClock(Math.round(departure)),
      anchored: hasChosenArrival(stop),
      dayOffset: Math.floor(arrival / 1440),
    });
  };
  const night = (at: RoadtripStop, final = false): RoadtripStop => {
    const chain = chainAt(number);
    const last = chain.stops[chain.stops.length - 1]!;
    const end: RoadtripStop = {
      ...at,
      // A marker placed where a terminal or a booked night's hotel stands is a marker, not
      // the terminal or the hotel.
      carrier: undefined,
      bookend: undefined,
      assignmentId: -2000000000 - number * 2,
      name: labels.end,
      time: null,
      leaveAt: undefined,
      dwellMinutes: 0,
      checkInTime: undefined,
      stopType: null,
      fillPercent: null,
      automaticNight: { phase: 'end', fromDayNumber: number, position, manual: targets.has(number) },
    };
    append(end, clock);
    if (last) putLeg(last, end, stationary(at));
    if (final) return end;
    number += 1;
    if (number - firstDay > MAX_TRIP_DAYS) issue = 'tooLong';
    clock = window.start;
    const start: RoadtripStop = {
      ...end,
      assignmentId: end.assignmentId - 1,
      name: labels.start,
      automaticNight: { ...end.automaticNight!, phase: 'start' },
    };
    append(start, clock);
    return start;
  };

  let previous: RoadtripStop | undefined;
  for (let i = 0; i < stops.length; i++) {
    const { stop, day } = stops[i]!;
    // A booked night's check-in pins the stop the way its own time would: the day is
    // built to be there by then, and a drive that cannot make it is the same conflict
    // a pinned stop out of reach is.
    const pin = parseClock(stop.time) ?? parseClock(stop.checkInTime);
    const leave = parseClock(stop.leaveAt);
    // When the drive into this stop set out, on this day's clock: for one a night broke
    // up, the morning it went on.
    let setOut: number | null = null;
    // A ride from its departure terminal to its arrival runs on the booking's clock and
    // through the night if it must: no day end is placed on a flight and no morning
    // resumes on one. The clock follows the ride, and the day counter follows the clock,
    // to the day the booking lands on. A road leg gets the window's treatment below.
    if (
      previous?.carrier?.role === 'departure' &&
      stop.carrier?.role === 'arrival' &&
      previous.carrier.reservationId === stop.carrier.reservationId
    ) {
      const leg = legs[i - 1]!;
      clock += leg.seg.duration / 60;
      while (number < day.dayNumber && clock >= 1440) {
        clock -= 1440;
        number += 1;
      }
      // The booking's days are what it says they are, whatever its clocks add up to.
      if (number !== day.dayNumber) {
        number = day.dayNumber;
        clock = ((clock % 1440) + 1440) % 1440;
      }
      if (pin !== null) clock = pin;
      putLeg(previous, stop, leg);
      position = i;
      append(stop, clock);
      previous = stop;
      continue;
    }
    if (previous && number < day.dayNumber && !targets.has(number)) {
      if (window.endMode !== 'stop') clock = Math.max(clock, window.end);
      previous = night(previous);
      while (number < day.dayNumber && !issue) {
        clock = window.end;
        previous = night(previous);
      }
    } else if (!previous) {
      number = day.dayNumber;
      // A time set to leave the first stop starts the day early the way a pinned arrival
      // does. Otherwise a ferry at seven on a day whose travel hours begin at nine was
      // reported missed by two hours, when nothing but the preference made it late.
      clock = pin ?? (leave === null ? window.start : Math.min(window.start, leave));
    }
    if (issue) return failed(issue);
    if (pin !== null && day.dayNumber !== number) return failed('conflict');

    if (previous) {
      const leg = legs[i - 1]!;
      const minutes = leg.seg.duration / 60;
      // The same for the first stop after a night: the morning starts early enough to get
      // there by its pinned time, or to leave it by the time it is set to be left at. A
      // pin that cannot be made is a conflict. A leave time is only ever missed, so one
      // out of reach even from midnight moves nothing and says so once the stop is reached.
      let early: number | null = null;
      if (pin !== null) early = pin - minutes;
      else if (leave !== null && leave - minutes >= 0) early = leave - minutes;
      // The hotel the day wakes up in is part of the morning, not a stop in the way of it:
      // the day sets out from there early just the same. Everything before this leg moves
      // back by the same minutes, so the marker keeps the drive to the hotel it has, which
      // is none when the night was spent there.
      const morning = chainAt(number);
      if (
        early !== null &&
        early < clock &&
        morning.stops.every((s) => s.automaticNight || s.bookend?.phase === 'morning')
      ) {
        const shift = early - clock;
        const moved = (at: string | null): number => (parseClock(at) ?? clock) + shift;
        if (early < 0 || moved(morning.schedule.entries[0]!.arrival) < 0) return failed('conflict');
        for (const entry of morning.schedule.entries) {
          entry.arrival = formatClock(Math.round(moved(entry.arrival)));
          entry.departure = formatClock(Math.round(moved(entry.departure)));
        }
        clock = early;
      }
      if (pin !== null && clock + minutes > pin + 1) return failed('conflict');

      let fraction = 0;
      // The drive to tonight's hotel is never cut by the window, and never put off to the
      // morning: the night is booked there, so the day ends there, later than the window
      // says if it must. Cut, the day ended on the road and the hotel was reached the next
      // morning, just before the day set out from it again.
      const split =
        pin === null && stop.bookend?.phase !== 'evening' && (leg.seg.mode === 'driving' || leg.seg.mode === undefined);
      if (split && !targets.has(number) && window.endMode === 'stop' && clock + minutes > window.end + 0.000001) {
        if (minutes > window.end - window.start) return failed('legTooLong');
        previous = night(previous);
        if (issue) return failed(issue);
      }
      while (fraction < 1) {
        const target = targets.get(number);
        if (target !== undefined && target < i - 1 + fraction - 0.000001) return failed('conflict');
        const manualCut = target !== undefined && target < i && target >= i - 1 + fraction;
        if (!manualCut && (target !== undefined || !split || clock + minutes * (1 - fraction) <= window.end + 0.000001))
          break;
        const available = manualCut ? minutes * (target - (i - 1 + fraction)) : Math.max(0, window.end - clock);
        if (available === 0) {
          previous = night(previous);
        } else {
          const until = Math.min(1, fraction + available / minutes);
          const part = portion(leg, fraction, until, unit);
          const at = part.line[part.line.length - 1]!;
          const point = { ...previous, lat: at[0], lng: at[1] };
          clock += available;
          position = i - 1 + until;
          const before = previous;
          previous = night(point);
          const previousStops = chainAt(number - 1).stops;
          const ending = previousStops[previousStops.length - 1]!;
          putLeg(before, ending, part);
          fraction = until;
        }
        if (issue) return failed(issue);
      }
      const remainder = portion(leg, fraction, 1, unit);
      setOut = clock;
      clock += minutes * (1 - fraction);
      putLeg(previous, stop, remainder);
    }
    position = i;
    if (pin !== null && number !== day.dayNumber) return failed('conflict');
    const target = targets.get(number);
    if (target !== undefined && target < position) return failed('conflict');
    if (pin !== null) clock = pin;
    append(stop, clock);
    previous = stop;

    // How long the traveller is here, spent against the clock rather than against the
    // driving hours. The night between two of them is not a pause in the stay: standing
    // somewhere for twenty-four hours takes twenty-four hours, and counting only the
    // hours the window is open stretched a single night over three days.
    //
    // A leave time decides the stay on its own: the traveller is here until then, however
    // long the stop usually takes. Reached after it, the drive leaves at once and the
    // stop says by how much it missed.
    const overnight = Math.max(0, 1440 - window.end + window.start);
    const left = leave === null ? null : leaveAfter(clock, leave, setOut);
    if (left && left.missedBy !== null) {
      const chain = chainAt(number);
      chain.schedule.warnings.push({ index: chain.stops.length - 1, code: 'missedLeave', minutes: left.missedBy });
    }
    let dwell = left ? left.departure - clock : Math.max(0, stop.dwellMinutes ?? 0);
    while (dwell > 0) {
      // The wait at a terminal is the booking's, not the window's: a check-in that runs
      // past the travel hours is not a day ending at the airport.
      const remaining = targets.has(number) || stop.carrier ? dwell : Math.max(0, window.end - clock);
      const spend = Math.min(dwell, remaining);
      clock += spend;
      dwell -= spend;
      const entries = chainAt(number).schedule.entries;
      entries[entries.length - 1]!.departure = formatClock(Math.round(clock));
      if (dwell > 0) {
        previous = night(previous);
        if (issue) return failed(issue);
        // The hours the window was shut passed too.
        dwell = Math.max(0, dwell - overnight);
        if (dwell === 0) {
          const resumed = chainAt(number).schedule.entries;
          resumed[resumed.length - 1]!.departure = formatClock(Math.round(clock));
        }
      }
    }
    if (target === position || (!targets.has(number) && endsDayHere(i) && i < stops.length - 1)) {
      previous = night(previous, i === stops.length - 1);
      if (issue) return failed(issue);
    }
  }

  if ([...targets.keys()].some((day) => !chains.get(day)?.stops.some((stop) => stop.automaticNight?.phase === 'end')))
    return failed('conflict');

  for (const chain of chains.values()) {
    for (let i = 0; i < chain.stops.length; i++) {
      const stop = chain.stops[i]!;
      if (stop.automaticNight) continue;
      const owner = ordered.find((d) => d.dayId === stop.ownerDayId);
      if (!owner || owner.dayNumber === chain.dayNumber) continue;
      const last = chain.spills[chain.spills.length - 1]!;
      if (last?.fromDayNumber === owner.dayNumber && last.at + last.count === i) last.count += 1;
      else
        chain.spills.push({
          automatic: true,
          at: i,
          count: 1,
          fromDayNumber: owner.dayNumber,
          departure: null,
          leg: undefined,
          line: [],
          fromStop: undefined,
        });
    }
  }
  for (const day of ordered) chainAt(day.dayNumber);
  return {
    chains: [...chains.values()].sort((a, b) => a.dayNumber - b.dayNumber),
    legFor: (from, to) => pieces.get(from)?.get(to),
    issue: null,
  };
}

/**
 * Where a stop inserted at `index` of a card lands on the day it is stored on.
 *
 * In front of the stop at that index, which is its own index there. Behind the card's last
 * stop, one further on, unless that stop is a terminal or tonight's hotel: those stand
 * behind the stored stops with the index the next stored stop would have, which is the
 * position a stop added at the end of the day takes.
 */
export function roadtripInsertion(day: Pick<RoadtripDay, 'stops'>, index: number) {
  const stop = day.stops[Math.min(Math.max(0, index), day.stops.length - 1)]!;
  if (!stop) return null;
  const behind = stop.automaticNight || (index >= day.stops.length && isStoredStop(stop));
  return { dayId: stop.ownerDayId, position: stop.ownerIndex + (behind ? 1 : 0) };
}
