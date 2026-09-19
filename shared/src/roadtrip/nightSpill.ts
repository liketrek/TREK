import type { QuietDay, RoadtripDay, RoadtripStop } from './planning-types';
import type { RouteSegment } from './planning-types';
import { computeSchedule, parseClock, type Schedule, hasChosenArrival } from './roadtripModel';

export interface SpillMark {
  automatic?: boolean;

  at: number;

  count: number;

  fromDayNumber: number;

  departure: string | null;

  leg: RouteSegment | undefined;

  fromStop: RoadtripStop | undefined;

  line: [number, number][];
}

export interface SpillChain {
  dayId: number;
  dayNumber: number;
  date: string | null;
  title: string | null;

  stops: RoadtripStop[];

  schedule: Schedule;

  spills: SpillMark[];
}

type PlanDay = Pick<RoadtripDay, 'dayId' | 'dayNumber' | 'date' | 'title' | 'stops'>;

type LegLookup = (from: RoadtripStop, to: RoadtripStop) => { seg: RouteSegment; line: [number, number][] } | undefined;

interface Placed {
  stop: RoadtripStop;
  arrival: string | null;
  departure: string | null;

  dayOffset: number;

  codes: ('late' | 'overnight' | 'leg' | 'range')[];
  lateMinutes: number | null;

  fromDayNumber: number | null;
  departedAt: string | null;
  leg: RouteSegment | undefined;
  line: [number, number][];
  from: RoadtripStop | undefined;
}

export function spillChains(plan: PlanDay[], quietDays: QuietDay[], legFor: LegLookup): SpillChain[] {
  const all: PlanDay[] = [
    ...plan,
    ...quietDays.map((d) => ({
      dayId: d.dayId,
      dayNumber: d.dayNumber,
      date: d.date,
      title: d.title,
      stops: d.stops,
    })),
  ].sort((a, b) => a.dayNumber - b.dayNumber);
  const numbers = new Set(all.map((d) => d.dayNumber));
  const landing = new Map<number, Placed[]>();
  for (const d of all) landing.set(d.dayNumber, []);

  /**
   * How far into a day the one before it still reaches.
   *
   * A stop stood at for twenty-four hours is not over when the date changes: the day
   * after it begins where it ends, not at nothing. Only ever a floor, and only when a
   * stay genuinely runs past midnight — an ordinary day that finishes at six in the
   * evening hands on nothing, because the night between them is not a wait, it is a
   * night.
   */
  let carriedInto: { dayNumber: number; minute: number; from: RoadtripStop } | null = null;

  for (const d of all) {
    // Plus the drive from where the stay ends to where this day starts. The carried
    // minute is a DEPARTURE, and arriving at the same instant would mean the road
    // between them takes no time at all.
    const arriving = carriedInto?.dayNumber === d.dayNumber && d.stops[0]
      ? legFor(carriedInto.from, d.stops[0])?.seg.duration
      : undefined;
    const notBefore = carriedInto?.dayNumber === d.dayNumber
      ? carriedInto.minute + Math.round((arriving ?? 0) / 60)
      : null;
    const routed = d.stops.slice(0, -1).map((s, i) => legFor(s, d.stops[i + 1]!));
    const legs = routed.map((l) => l?.seg);
    const schedule = computeSchedule(
      d.stops.map((s) => ({
        anchor: s.time ?? null,
        earliest: s.checkInTime ?? null,
        dwellMinutes: s.dwellMinutes,
      })),
      legs.map((l) => l?.duration),
      { notBefore },
    );
    // Where this day's last clock lands, carried to whichever day that turns out to be.
    const ends = schedule.endsAt ?? null;
    if (ends !== null && ends > 1440) {
      carriedInto = { dayNumber: d.dayNumber + Math.floor(ends / 1440), minute: ends % 1440, from: d.stops[d.stops.length - 1]! };
    } else if (carriedInto && carriedInto.dayNumber <= d.dayNumber) {
      // Spent: this is the day it was pointing at.
      carriedInto = null;
    }
    // Otherwise it is left alone. A stay of several days passes over the days in the
    // middle without them having anything to say, and clearing it there would lose the
    // morning it was aimed at.

    let day = 0;
    let previous: number | null = null;
    const baseOffset = schedule.entries.find((e) => e.arrival !== null)?.dayOffset ?? 0;
    d.stops.forEach((stop, i) => {
      const entry = schedule.entries[i]!;
      const clock = parseClock(entry?.arrival);
      if (clock !== null) {
        if (previous !== null && clock < previous) day += 1;
        previous = clock;
      }
      // How many days on from where this one's clock STARTS, not the schedule's absolute
      // count: a day whose first arrivals came out negative is lifted whole, and the
      // lift shows up in every offset, so reading them raw moved an early stop to
      // tomorrow and left the late one behind. Differences survive the lift.
      //
      // The backwards-clock fallback covers stops with no time at all, and stays as the
      // floor for the rest. On its own it cannot see a stop reached after a stay that
      // ran through the night: twenty-four hours on puts you in tomorrow at the same
      // reading on the clock, never an earlier one.
      const offset = entry?.arrival != null ? Math.max(entry.dayOffset - baseOffset, day) : day;
      const marks = schedule.warnings.filter((w) => w.index === i);

      const reachable = offset > 0 && numbers.has(d.dayNumber + offset);
      const target = reachable ? d.dayNumber + offset : d.dayNumber;
      const moved = target !== d.dayNumber;
      landing.get(target)?.push({
        stop,
        arrival: entry?.arrival ?? null,
        departure: entry?.departure ?? null,

        dayOffset: moved ? 0 : offset,

        codes: marks.map((w) => w.code).filter((c) => !(moved && c === 'overnight')),
        lateMinutes: marks.find((w) => w.code === 'late')?.minutes ?? null,
        fromDayNumber: moved ? d.dayNumber : null,
        departedAt: moved ? (schedule.entries[i - 1]?.departure ?? null) : null,
        leg: moved ? legs[i - 1] : undefined,
        line: moved ? (routed[i - 1]?.line ?? []) : [],
        from: moved ? d.stops[i - 1]! : undefined,
      });
    });
  }

  const out: SpillChain[] = [];
  for (const d of all) {
    const placed = landing.get(d.dayNumber) ?? [];
    if (!placed.length) continue;

    placed.sort((a, b) => (a.fromDayNumber ?? Number.MAX_SAFE_INTEGER) - (b.fromDayNumber ?? Number.MAX_SAFE_INTEGER));
    const spills: SpillMark[] = [];
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i]!;
      if (p.fromDayNumber === null) continue;
      const last = spills[spills.length - 1]!;
      if (last && last.fromDayNumber === p.fromDayNumber && last.at + last.count === i) last.count += 1;
      else
        spills.push({
          at: i,
          count: 1,
          fromDayNumber: p.fromDayNumber,
          departure: p.departedAt,
          leg: p.leg,
          line: p.line,
          fromStop: p.from,
        });
    }
    out.push({
      dayId: d.dayId,
      dayNumber: d.dayNumber,
      date: d.date,
      title: d.title,
      stops: placed.map((p) => p.stop),
      schedule: {
        entries: placed.map((p) => ({
          arrival: p.arrival,
          departure: p.departure,
          anchored: hasChosenArrival(p.stop),
          dayOffset: p.dayOffset,
        })),
        warnings: placed.flatMap((p, i) =>
          p.codes.map((code) =>
            code === 'late' ? { index: i, code, minutes: p.lateMinutes ?? 0 } : { index: i, code },
          ),
        ),
      },
      spills,
    });
  }
  return out;
}
