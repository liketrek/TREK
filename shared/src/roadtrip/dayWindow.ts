import { lineMetres, projectOntoRoute, sliceAtMeters } from './corridor';
import type { RoadtripDayBoundary } from './day-boundary.schema';
import type { SpillChain } from './nightSpill';
import type { RoadtripDay, RoadtripStop, RoutedLeg } from './planning-types';
import type { DistanceUnit } from './planning-types';
import { formatClock, parseClock } from './roadtripModel';
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

function stationary(stop: RoadtripStop): RoutedLeg {
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
  const targets = new Map<number, number>();
  let lastTarget = -1;
  for (const boundary of [...boundaries].sort((a, b) => a.day_number - b.day_number)) {
    const from = positions.get(boundary.from_assignment_id);
    const to = boundary.to_assignment_id === null ? null : positions.get(boundary.to_assignment_id);
    if (from === undefined || (to !== null && to !== from + 1)) return failed('conflict');
    const target = from + (to === null ? 0 : boundary.fraction);
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
      anchored: !stop.automaticNight && stop.time !== null,
      dayOffset: Math.floor(arrival / 1440),
    });
  };
  const night = (at: RoadtripStop, final = false): RoadtripStop => {
    const chain = chainAt(number);
    const last = chain.stops[chain.stops.length - 1]!;
    const end: RoadtripStop = {
      ...at,
      assignmentId: -2000000000 - number * 2,
      name: labels.end,
      time: null,
      dwellMinutes: 0,
      checkoutAt: undefined,
      checkInTime: undefined,
      stopType: null,
      fillPercent: null,
      automaticNight: { phase: 'end', fromDayNumber: number, position, manual: targets.has(number) },
    };
    append(end, clock);
    if (last) putLeg(last, end, stationary(at));
    if (final) return end;
    number += 1;
    if (number - firstDay > 365) issue = 'tooLong';
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
    const pin = parseClock(stop.time);
    if (previous && number < day.dayNumber && !targets.has(number)) {
      if (window.endMode !== 'stop') clock = Math.max(clock, window.end);
      previous = night(previous);
      while (number < day.dayNumber && !issue) {
        clock = window.end;
        previous = night(previous);
      }
    } else if (!previous) {
      number = day.dayNumber;
      clock = pin ?? window.start;
    }
    if (issue) return failed(issue);
    if (pin !== null && day.dayNumber !== number) return failed('conflict');

    if (previous) {
      const leg = legs[i - 1]!;
      const minutes = leg.seg.duration / 60;
      if (pin !== null && chainAt(number).stops.every((s) => s.automaticNight)) {
        clock = Math.min(clock, pin - minutes);
        if (clock < 0) return failed('conflict');
        const startEntry = chainAt(number).schedule.entries[0]!;
        startEntry.arrival = formatClock(Math.round(clock));
        startEntry.departure = formatClock(Math.round(clock));
      }
      if (pin !== null && clock + minutes > pin + 1) return failed('conflict');

      let fraction = 0;
      const split = pin === null && (leg.seg.mode === 'driving' || leg.seg.mode === undefined);
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
      clock += minutes * (1 - fraction);
      putLeg(previous, stop, remainder);
    }
    position = i;
    if (pin !== null && number !== day.dayNumber) return failed('conflict');
    const target = targets.get(number);
    if (target !== undefined && target < position) return failed('conflict');
    if (pin !== null) clock = pin;
    if (pin === null && number === day.dayNumber) clock = Math.max(clock, parseClock(stop.checkInTime) ?? 0);
    append(stop, clock);
    previous = stop;

    if (stop.checkoutAt !== undefined) {
      const checkoutDay = Math.floor(stop.checkoutAt / 1440);
      const checkoutTime = stop.checkoutAt % 1440;
      const arrivalAt = number * 1440 + clock;
      if (stop.checkoutAt > arrivalAt) {
        const entries = chainAt(number).schedule.entries;
        entries[entries.length - 1]!.departure = formatClock(checkoutTime);
        while (number < checkoutDay) {
          previous = night(previous);
          if (issue) return failed(issue);
        }
        clock = checkoutTime;
        if (previous.automaticNight?.phase === 'start') {
          const entries = chainAt(number).schedule.entries;
          entries[entries.length - 1]!.arrival = formatClock(clock);
          entries[entries.length - 1]!.departure = formatClock(clock);
        }
      }
      continue;
    }
    let dwell = Math.max(0, stop.dwellMinutes ?? 0);
    while (dwell > 0) {
      const remaining = targets.has(number) ? dwell : Math.max(0, window.end - clock);
      const spend = Math.min(dwell, remaining);
      clock += spend;
      dwell -= spend;
      const entries = chainAt(number).schedule.entries;
      entries[entries.length - 1]!.departure = formatClock(Math.round(clock));
      if (dwell > 0) {
        previous = night(previous);
        if (issue) return failed(issue);
      }
    }
    if (target === position || (!targets.has(number) && stop.endDay && i < stops.length - 1)) {
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

export function roadtripInsertion(day: Pick<RoadtripDay, 'stops'>, index: number) {
  const stop = day.stops[Math.min(Math.max(0, index), day.stops.length - 1)]!;
  return stop
    ? { dayId: stop.ownerDayId, position: stop.ownerIndex + (stop.automaticNight || index >= day.stops.length ? 1 : 0) }
    : null;
}
