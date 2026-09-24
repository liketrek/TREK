import {
  computeSchedule,
  formatClock,
  hasChosenArrival,
  formatDurationShort,
  insertIndexForAlong,
  deriveDriveWarnings,
  legIndexForAlong,
  refuelsRange,
  sectionAnchors,
  parseClock,
  splitIntoRuns,
  sumLegSeconds,
  refuelStopTypeFor,
  leaveAfter,
  scheduleStopOf,
  carriedSeam,
  reanchorAfterRemove,
  reanchorAfterReorder,
  reanchorByStopOrder,
  seamViaIndex,
  isStoredStop,
} from './roadtripModel';

import { describe, it, expect } from 'vitest';

describe('formatDurationShort', () => {
  it('prints minutes below an hour', () => {
    expect(formatDurationShort(45 * 60)).toBe('45 min');
    expect(formatDurationShort(0)).toBe('0 min');
  });

  it('drops the zero minutes on a whole hour', () => {
    expect(formatDurationShort(3600)).toBe('1 h');
    expect(formatDurationShort(2 * 3600)).toBe('2 h');
  });

  it('prints hours and minutes together', () => {
    expect(formatDurationShort(2 * 3600 + 10 * 60)).toBe('2 h 10 min');
  });

  it('carries instead of printing sixty minutes', () => {
    // 1 h 59 min 40 s rounds the minutes to 60, which must become 2 h.
    expect(formatDurationShort(3600 + 59 * 60 + 40)).toBe('2 h');
  });

  it('treats nonsense as nothing rather than throwing', () => {
    expect(formatDurationShort(Number.NaN)).toBe('0 min');
    expect(formatDurationShort(-90)).toBe('0 min');
  });
});

describe('parseClock', () => {
  it('reads wall-clock times', () => {
    expect(parseClock('09:45')).toBe(9 * 60 + 45);
    expect(parseClock('9:05')).toBe(9 * 60 + 5);
    expect(parseClock('00:00')).toBe(0);
  });

  it('ignores anything trailing, as stored times sometimes carry seconds', () => {
    expect(parseClock('14:30:00')).toBe(14 * 60 + 30);
  });

  it('rejects what is not a time', () => {
    expect(parseClock(null)).toBeNull();
    expect(parseClock('')).toBeNull();
    expect(parseClock('later')).toBeNull();
    expect(parseClock('25:00')).toBeNull();
    expect(parseClock('12:75')).toBeNull();
  });
});

describe('formatClock', () => {
  it('pads both halves', () => {
    expect(formatClock(9 * 60 + 5)).toBe('09:05');
    expect(formatClock(0)).toBe('00:00');
  });

  it('wraps past midnight instead of printing a 25th hour', () => {
    expect(formatClock(25 * 60)).toBe('01:00');
    expect(formatClock(-30)).toBe('23:30');
  });
});

describe('computeSchedule', () => {
  const hours = (h: number): number => h * 3600;

  it('walks arrival and departure forward from the first pinned time', () => {
    // The example from discussion #1797: leave at 8:00, drive 1 h 45, stay 2 h, drive 1 h 10.
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 120 },
        { anchor: null, dwellMinutes: 45 },
      ],
      [hours(1.75), hours(1) + 10 * 60],
    );
    expect(entries[0]!).toMatchObject({ arrival: '08:00', departure: '08:00', anchored: true });
    expect(entries[1]!).toMatchObject({ arrival: '09:45', departure: '11:45', anchored: false });
    expect(entries[2]!).toMatchObject({ arrival: '12:55', departure: '13:40', anchored: false });
  });

  it('works back from the first pinned time to say when to set off', () => {
    // The museum opens at ten and we want an hour at the stop before it, an hour of
    // driving in between: be there at eight. Answering that is the reason to pin a time
    // on the second stop at all.
    const { entries } = computeSchedule(
      [
        { anchor: null, dwellMinutes: 60 },
        { anchor: '10:00', dwellMinutes: 30 },
      ],
      [hours(1)],
    );
    expect(entries[0]!).toMatchObject({ arrival: '08:00', departure: '09:00', anchored: false });
    expect(entries[1]!).toMatchObject({ arrival: '10:00', anchored: true });
  });

  it('stops working back at a leg that never routed rather than inventing one', () => {
    const { entries } = computeSchedule(
      [
        { anchor: null, dwellMinutes: 60 },
        { anchor: null, dwellMinutes: 30 },
        { anchor: '10:00', dwellMinutes: 30 },
      ],
      [undefined, hours(1)],
    );
    expect(entries[0]!).toMatchObject({ arrival: null, departure: null });
    // Leaves at 09:00 to arrive at 10:00, and its own half hour puts it there at 08:30.
    expect(entries[1]!).toMatchObject({ arrival: '08:30', departure: '09:00' });
    expect(entries[2]!).toMatchObject({ arrival: '10:00', anchored: true });
  });

  it('keeps the earliest stop on day zero when working back crosses midnight', () => {
    // Pinned at one in the morning with three hours of driving before it: the stop before
    // is the evening before. The chain shifts up a day rather than printing a day below
    // zero, so the boundary shows between the two stops instead of under the first one.
    const { entries, warnings } = computeSchedule(
      [
        { anchor: null, dwellMinutes: 0 },
        { anchor: '01:00', dwellMinutes: 0 },
      ],
      [hours(3)],
    );
    expect(entries[0]!).toMatchObject({ arrival: '22:00', dayOffset: 0 });
    expect(entries[1]!).toMatchObject({ arrival: '01:00', dayOffset: 1, anchored: true });
    expect(warnings).toContainEqual({ index: 1, code: 'overnight' });
  });

  it('restarts the cascade at a pinned stop instead of pushing it', () => {
    // The drive would arrive at 09:00, but the museum ticket says 11:00: everything
    // after it counts from 11:00, not from the drive.
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: '11:00', dwellMinutes: 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hours(1), hours(1)],
    );
    expect(entries[1]!.arrival).toBe('11:00');
    expect(entries[2]!.arrival).toBe('13:00');
  });

  it('ROADTRIP-MODEL-082: a night drive onto a pinned time after midnight is on time', () => {
    // Leave at 20:00, drive six hours, check in at 02:00. The anchor used to be
    // placed on the day the cascade had reached so far — and that only advances
    // once a computed arrival crosses midnight, which is read before this stop's
    // arrival is known. So the stop that does the crossing had its own pin put a
    // whole day early: the rail drew a warning-coloured "+24 h" on a plan that
    // was exactly on time, and dropped the overnight marker with it.
    const { entries, warnings } = computeSchedule(
      [
        { anchor: '20:00', dwellMinutes: 0 },
        { anchor: '02:00', dwellMinutes: 0 },
      ],
      [hours(6)],
    );

    expect(warnings.filter((w) => w.code === 'late')).toEqual([]);
    expect(entries[1]!).toMatchObject({ arrival: '02:00', dayOffset: 1, anchored: true });
    // The day still turned over, so the rail keeps its carry badge.
    expect(warnings.some((w) => w.code === 'overnight' && w.index === 1)).toBe(true);
  });

  it('ROADTRIP-MODEL-083: a ferry that really is missed is still reported late', () => {
    // The other half: picking the nearest occurrence must not swallow a genuine
    // delay. Leaving at 21:00 and driving five hours arrives at 02:00, half an
    // hour after the 01:30 ferry, and that is what it says.
    const { warnings } = computeSchedule(
      [
        { anchor: '21:00', dwellMinutes: 0 },
        { anchor: '01:30', dwellMinutes: 0 },
      ],
      [hours(5)],
    );
    expect(warnings.find((w) => w.code === 'late')!).toMatchObject({ index: 1, minutes: 30 });
  });

  it('ROADTRIP-MODEL-084: a pinned stop after an untimed leg keeps the day it is on', () => {
    // Nothing to be late against, but the day carried so far still applies —
    // otherwise the stop prints under a day-1 stop as though it happened first.
    const { entries } = computeSchedule(
      [
        { anchor: '20:00', dwellMinutes: 0 },
        { anchor: '02:00', dwellMinutes: 0 },
        { anchor: '09:00', dwellMinutes: 0 },
      ],
      [hours(6), undefined],
    );
    expect(entries[2]!).toMatchObject({ arrival: '09:00', dayOffset: 1 });
  });

  it('reports a stop the drive cannot reach in time', () => {
    const { warnings } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: '09:00', dwellMinutes: 0 },
      ],
      [hours(3)],
    );
    expect(warnings).toEqual([{ index: 1, code: 'late', minutes: 120 }]);
  });

  it('does not cry about a minute of rounding', () => {
    const { warnings } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: '09:00', dwellMinutes: 0 },
      ],
      [hours(1) + 30],
    );
    expect(warnings).toEqual([]);
  });

  it('breaks the chain at a leg that never routed', () => {
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 30 },
        { anchor: null, dwellMinutes: 30 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [undefined, hours(1)],
    );
    expect(entries[0]!.arrival).toBe('08:00');
    expect(entries[1]!.arrival).toBeNull();
    expect(entries[2]!.arrival).toBeNull();
  });

  it('flags the day rolling past midnight and keeps counting', () => {
    const { entries, warnings } = computeSchedule(
      [
        { anchor: '22:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hours(4)],
    );
    expect(entries[1]!.arrival).toBe('02:00');
    expect(entries[1]!.dayOffset).toBe(1);
    expect(warnings).toEqual([{ index: 1, code: 'overnight' }]);
  });

  it('handles an empty chain', () => {
    expect(computeSchedule([], [])).toEqual({ entries: [], warnings: [], endsAt: null });
  });

  it('treats a missing dwell as no time spent', () => {
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: null },
        { anchor: null, dwellMinutes: null },
      ],
      [hours(1)],
    );
    expect(entries[0]!.departure).toBe('08:00');
    expect(entries[1]!.arrival).toBe('09:00');
  });
});

describe('splitIntoRuns', () => {
  const drive = (): string => 'driving';

  it('asks for a whole day travelled one way in a single run', () => {
    const runs = splitIntoRuns(['a', 'b', 'c', 'd'], drive);
    expect(runs).toEqual([{ stops: ['a', 'b', 'c', 'd'], mode: 'driving' }]);
  });

  it('splits where the travel mode changes, and repeats the stop on both sides', () => {
    // Drive to b, walk to c, drive on to d: the walk is its own request, and b and c
    // each belong to two runs because they are the ends of neighbouring legs.
    const modes = ['driving', 'walking', 'driving'];
    const runs = splitIntoRuns(['a', 'b', 'c', 'd'], (from) => modes[['a', 'b', 'c'].indexOf(from)]!);
    expect(runs).toEqual([
      { stops: ['a', 'b'], mode: 'driving' },
      { stops: ['b', 'c'], mode: 'walking' },
      { stops: ['c', 'd'], mode: 'driving' },
    ]);
  });

  it('keeps consecutive legs of the same mode together across a change and back', () => {
    const modes = ['driving', 'driving', 'walking', 'walking'];
    const runs = splitIntoRuns(['a', 'b', 'c', 'd', 'e'], (from) => modes[['a', 'b', 'c', 'd'].indexOf(from)]!);
    expect(runs).toEqual([
      { stops: ['a', 'b', 'c'], mode: 'driving' },
      { stops: ['c', 'd', 'e'], mode: 'walking' },
    ]);
  });

  it('has nothing to ask for when there is no leg', () => {
    expect(splitIntoRuns([], drive)).toEqual([]);
    expect(splitIntoRuns(['a'], drive)).toEqual([]);
  });
});

describe('sumLegSeconds', () => {
  it('adds only the legs that routed', () => {
    expect(sumLegSeconds([600, undefined, 1200])).toBe(1800);
    expect(sumLegSeconds([])).toBe(0);
  });
});

describe('insertIndexForAlong', () => {
  // Hamburg 0, Lueneburg 50, Berlin 290 — the day's stops as distances driven.
  const stops = [0, 50, 290];

  it('puts a hit between the two stops it falls between', () => {
    expect(insertIndexForAlong(stops, 120)).toBe(2);
    expect(insertIndexForAlong(stops, 20)).toBe(1);
  });

  it('never lands before the stop the day starts from', () => {
    expect(insertIndexForAlong(stops, 0)).toBe(1);
    // A corridor is wider than the road, so a hit can project just behind the start.
    expect(insertIndexForAlong(stops, -3)).toBe(1);
  });

  it('never lands after the stop the day ends at', () => {
    expect(insertIndexForAlong(stops, 290)).toBe(2);
    expect(insertIndexForAlong(stops, 400)).toBe(2);
  });

  it('puts a hit exactly on a stop after it, not before', () => {
    expect(insertIndexForAlong(stops, 50)).toBe(2);
  });

  it('has nowhere to insert on a day that is not a drive', () => {
    expect(insertIndexForAlong([], 10)).toBe(0);
    expect(insertIndexForAlong([0], 10)).toBe(1);
  });
});

describe('legIndexForAlong', () => {
  // Against the legs' own lengths rather than by projecting the stops as well: leg
  // distances come from the router and are exact, while two stops close together project
  // onto each other's stretch and would put a charging halt the wrong side of a town.
  const legs = [10_000, 25_000, 40_000];

  it('FE-ROADTRIP-MODEL-050: a point inside a leg belongs to that leg', () => {
    expect(legIndexForAlong(legs, 0)).toBe(0);
    expect(legIndexForAlong(legs, 9_999)).toBe(0);
    expect(legIndexForAlong(legs, 10_000)).toBe(1);
    expect(legIndexForAlong(legs, 24_999)).toBe(1);
    expect(legIndexForAlong(legs, 25_000)).toBe(2);
  });

  it('FE-ROADTRIP-MODEL-051: a point past the end lands in the last leg, not nowhere', () => {
    // A rounding edge, not a missing leg: the projection and the router measure the same
    // line two different ways and disagree by metres at the very end.
    expect(legIndexForAlong(legs, 40_000)).toBe(2);
    expect(legIndexForAlong(legs, 99_999)).toBe(2);
  });

  it('FE-ROADTRIP-MODEL-052: a day with no routed leg has nowhere to put anything', () => {
    expect(legIndexForAlong([], 100)).toBe(-1);
  });
});

describe('deriveDriveWarnings', () => {
  // Worked through the way a traveller reads it: Hamburg, A1, HEM, Berlin. The badge on
  // a stop has to agree with the sum of the drive bands above it, or it looks made up.
  it('FE-ROADTRIP-MODEL-069: the figure on a stop is what the bands above it add up to', () => {
    const out = deriveDriveWarnings(
      [leg(20, 21.5), leg(62, 103.4), leg(155, 244.7)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 100 },
      0,
    );
    // 21.5 + 103.4 on arrival at HEM, and then it keeps counting, because nothing on this
    // trip fills up.
    expect(out.warnings).toEqual([
      { index: 2, code: 'range', sinceKm: 125 },
      { index: 3, code: 'range', sinceKm: 370 },
    ]);
  });

  it('FE-ROADTRIP-MODEL-070: arriving at a petrol station is the plan, not a warning', () => {
    // Same trip, but HEM is marked as fuel. Reaching it with an empty tank is exactly
    // what it is there for, so nothing is flagged on it; the budget still starts over,
    // and the next stretch is measured from there.
    const out = deriveDriveWarnings(
      [leg(20, 21.5), leg(62, 103.4), leg(155, 244.7)],
      [false, false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 100 },
      0,
    );
    expect(out.warnings).toEqual([{ index: 3, code: 'range', sinceKm: 245 }]);
    // 245 and not 370: HEM filled the tank, so Berlin counts from there.
  });

  const noLimits = { legMinutes: null, dayMinutes: null, rangeKm: null };
  const leg = (minutes: number, km: number) => ({ duration: minutes * 60, distance: km * 1000 });

  it('FE-ROADTRIP-MODEL-060: no limits set means nothing to report', () => {
    const out = deriveDriveWarnings([leg(600, 900)], [false, false], noLimits, 0);
    expect(out.warnings).toEqual([]);
    expect(out.day).toBeNull();
  });

  it('FE-ROADTRIP-MODEL-061: a leg over the limit reports how far over, on the stop it arrives at', () => {
    // On arrival, not on departure. Both findings are running totals that only become
    // true when you get there, and anchored to the departure the number reads as the
    // length of the NEXT leg, which is a different figure and the one that looked wrong.
    const out = deriveDriveWarnings(
      [leg(100, 90), leg(240, 200)],
      [false, false, false],
      { ...noLimits, legMinutes: 180 },
      0,
    );
    expect(out.warnings).toEqual([{ index: 2, code: 'leg', overMinutes: 60 }]);
  });

  it('FE-ROADTRIP-MODEL-062: the day figure is the sum of the legs, and only that', () => {
    const out = deriveDriveWarnings(
      [leg(200, 180), leg(200, 180)],
      [false, false, false],
      { ...noLimits, dayMinutes: 360 },
      0,
    );
    expect(out.day).toEqual({ code: 'dayDriving', minutes: 400, limitMinutes: 360 });
  });

  it('FE-ROADTRIP-MODEL-063: the figure keeps counting until something actually refuels', () => {
    // A warning is not a fill-up. Zeroing the budget at one made every figure after the
    // first wrong: the second stop would claim a fresh tank while the same one is still
    // in the car.
    const out = deriveDriveWarnings(
      [leg(60, 300), leg(60, 400), leg(60, 300), leg(60, 400)],
      [false, false, false, false, false],
      { ...noLimits, rangeKm: 600 },
      0,
    );
    expect(out.warnings).toEqual([
      { index: 2, code: 'range', sinceKm: 700 },
      { index: 3, code: 'range', sinceKm: 1000 },
      { index: 4, code: 'range', sinceKm: 1400 },
    ]);
  });

  it('FE-ROADTRIP-MODEL-071: adding a fuel stop is what stops the run of warnings', () => {
    // The same drive with a charger at stop 2. Nothing is flagged there, because reaching
    // it on an empty tank is what it is for; everything after counts from zero again, so
    // the three-warning run above collapses to one.
    const out = deriveDriveWarnings(
      [leg(60, 300), leg(60, 400), leg(60, 300), leg(60, 400)],
      [false, false, true, false, false],
      { ...noLimits, rangeKm: 600 },
      0,
    );
    expect(out.warnings).toEqual([{ index: 4, code: 'range', sinceKm: 700 }]);
  });

  it('FE-ROADTRIP-MODEL-064: filling up starts the budget over, resting does not', () => {
    const stops = [false, true, false];
    const out = deriveDriveWarnings([leg(60, 500), leg(60, 500)], stops, { ...noLimits, rangeKm: 600 }, 0);
    // The tank is filled at stop 1, so the second 500 km starts from zero and neither leg
    // trips the limit. Without the refuel it would be 1000 km on a 600 km range.
    expect(out.warnings).toEqual([]);
  });

  it('FE-ROADTRIP-MODEL-065: only fuel and charging refuel', () => {
    expect(refuelsRange('fuel')).toBe(true);
    expect(refuelsRange('charging')).toBe(true);
    // A two-hour lunch fills no tank, and TREK does not know whether the restaurant has a
    // charger in its car park.
    expect(refuelsRange('restaurant')).toBe(false);
    expect(refuelsRange('rest_area')).toBe(false);
    expect(refuelsRange('campsite')).toBe(false);
    expect(refuelsRange(null)).toBe(false);
  });

  it('FE-ROADTRIP-MODEL-066: the budget carries into the next day, because a tank does not empty overnight', () => {
    const first = deriveDriveWarnings([leg(60, 400)], [false, false], { ...noLimits, rangeKm: 600 }, 0);
    expect(first.carryKm).toBe(400);

    const second = deriveDriveWarnings([leg(60, 300)], [false, false], { ...noLimits, rangeKm: 600 }, first.carryKm);
    expect(second.warnings).toEqual([{ index: 1, code: 'range', sinceKm: 700 }]);
  });

  it('FE-ROADTRIP-MODEL-067: an unrouted leg gives the budget up rather than guessing', () => {
    const out = deriveDriveWarnings([undefined, leg(60, 500)], [false, false, false], { ...noLimits, rangeKm: 100 }, 0);
    expect(out.warnings).toEqual([]);
    expect(out.carryKm).toBeNull();
  });

  it('FE-ROADTRIP-MODEL-068: filling up at the last stop of the day still counts', () => {
    const out = deriveDriveWarnings([leg(60, 400)], [false, true], { ...noLimits, rangeKm: 600 }, 0);
    expect(out.carryKm).toBe(0);
  });
});

describe('sectionAnchors', () => {
  it('FE-ROADTRIP-MODEL-080: every stop, and the middle of every leg between them', () => {
    // The leg midpoints are the point of the feature: a break on a five-hour drive is
    // planned in the middle of the drive, not at either end of it.
    expect(sectionAnchors([0, 100, 250])).toEqual([
      { kind: 'stop', index: 0, alongKm: 0 },
      { kind: 'leg', index: 0, alongKm: 50 },
      { kind: 'stop', index: 1, alongKm: 100 },
      { kind: 'leg', index: 1, alongKm: 175 },
      { kind: 'stop', index: 2, alongKm: 250 },
    ]);
  });

  it('FE-ROADTRIP-MODEL-081: a single stop has no leg to sit in the middle of', () => {
    expect(sectionAnchors([42])).toEqual([{ kind: 'stop', index: 0, alongKm: 42 }]);
    expect(sectionAnchors([])).toEqual([]);
  });
});

describe('deriveDriveWarnings — what counts as driving', () => {
  const drive = (minutes: number, km: number) => ({ duration: minutes * 60, distance: km * 1000, mode: 'driving' });
  const onFoot = (minutes: number, km: number) => ({ duration: minutes * 60, distance: km * 1000, mode: 'walking' });

  it('FE-ROADTRIP-MODEL-085: a walk to a viewpoint is not over the longest drive allowed', () => {
    // A day may legitimately mix modes — splitIntoRuns exists for exactly that —
    // and a two hour hike reported as a leg finding reads as a fault in a plan
    // that has none.
    const out = deriveDriveWarnings(
      [drive(60, 80), onFoot(120, 6)],
      [false, false, false],
      { legMinutes: 90, dayMinutes: null, rangeKm: null },
      0,
    );
    expect(out.warnings).toEqual([]);
  });

  it('FE-ROADTRIP-MODEL-086: walked kilometres are not on the tank', () => {
    // Nor does walking fill it: the budget is left exactly as the drive left it.
    const out = deriveDriveWarnings(
      [drive(60, 80), onFoot(120, 60), drive(30, 30)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 100 },
      0,
    );
    // 80 then 110 — the 60 walked kilometres never entered the budget.
    expect(out.warnings).toEqual([{ index: 3, code: 'range', sinceKm: 110 }]);
    expect(out.carryKm).toBe(110);
  });

  it('FE-ROADTRIP-MODEL-087: a walk does not count toward the driving time of the day', () => {
    const out = deriveDriveWarnings(
      [drive(60, 80), onFoot(180, 9)],
      [false, false, false],
      { legMinutes: null, dayMinutes: 90, rangeKm: null },
      0,
    );
    expect(out.day).toBeNull();
  });

  it('FE-ROADTRIP-MODEL-088: a leg with no mode is still a drive', () => {
    // Every leg was a drive before the field existed, so an absent mode counts.
    // Reading it the other way round would silently switch the warnings off.
    const out = deriveDriveWarnings(
      [{ duration: 120 * 60, distance: 200 * 1000 }],
      [false, false],
      { legMinutes: 90, dayMinutes: null, rangeKm: null },
      0,
    );
    expect(out.warnings).toEqual([{ index: 1, code: 'leg', overMinutes: 30 }]);
  });
});

describe('deriveDriveWarnings — where the tank actually runs dry', () => {
  const drive = (minutes: number, km: number) => ({ duration: minutes * 60, distance: km * 1000, mode: 'driving' });
  const ferry = (minutes: number, km: number) => ({ duration: minutes * 60, distance: km * 1000, mode: 'ferry' });

  it('FE-ROADTRIP-MODEL-089: the dry point sits where the fuel ends, not where somebody notices', () => {
    // 300 km of range, two legs of 200. The warning lands on stop 2, which is 400 km in;
    // the tank was empty 100 km earlier, halfway through the second leg. Suggesting a
    // filling station at the warning would suggest one the car cannot reach.
    const out = deriveDriveWarnings(
      [drive(120, 200), drive(120, 200)],
      [false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    );
    expect(out.warnings).toEqual([{ index: 2, code: 'range', sinceKm: 400 }]);
    expect(out.emptyAt).toEqual([{ legIndex: 1, intoLegKm: 100, drivenMeters: 300000, sinceKm: 300 }]);
  });

  it('FE-ROADTRIP-MODEL-090: one dry point per tank, however many warnings the stretch produces', () => {
    // A long run with nothing on it warns at every stop on purpose, because a warning is
    // not a fill-up. One refuel offer per warning would stack three identical offers for
    // a single tank down one day.
    const out = deriveDriveWarnings(
      [drive(60, 400), drive(60, 400), drive(60, 400)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 600 },
      0,
    );
    expect(out.warnings).toHaveLength(2);
    expect(out.emptyAt).toHaveLength(1);
    expect(out.emptyAt[0]!).toMatchObject({ legIndex: 1, drivenMeters: 600000 });
  });

  it('FE-ROADTRIP-MODEL-091: filling up starts a new tank, and the next one runs dry again', () => {
    const out = deriveDriveWarnings(
      [drive(60, 400), drive(60, 400), drive(60, 400)],
      [false, false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 600 },
      0,
    );
    // Empty once before the fuel stop, then once more after it.
    expect(out.emptyAt).toHaveLength(1);
    expect(out.emptyAt[0]!.drivenMeters).toBe(600000);
  });

  it('FE-ROADTRIP-MODEL-092: a ferry carries the car without burning a drop', () => {
    // The trap this field exists for. The budget skips a ferry, so the dry point must be
    // counted in DRIVING metres only; measuring along the day's drawn line instead would
    // overshoot by the whole crossing and put the marker out at sea.
    const out = deriveDriveWarnings(
      [drive(60, 200), ferry(120, 50), drive(60, 200)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    );
    expect(out.emptyAt).toEqual([{ legIndex: 2, intoLegKm: 100, drivenMeters: 300000, sinceKm: 300 }]);
  });

  it('FE-ROADTRIP-MODEL-093: a tank carried over midnight runs dry earlier the next day', () => {
    const out = deriveDriveWarnings(
      [drive(60, 200), drive(60, 200)],
      [false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      250,
    );
    // Only 50 km left on arrival, so it empties a quarter into the first leg.
    expect(out.emptyAt).toEqual([{ legIndex: 0, intoLegKm: 50, drivenMeters: 50000, sinceKm: 300 }]);
  });

  it('FE-ROADTRIP-MODEL-094: no range limit and no crossing produce no dry point at all', () => {
    const noLimit = deriveDriveWarnings(
      [drive(60, 900)],
      [false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: null },
      0,
    );
    expect(noLimit.emptyAt).toEqual([]);

    const withinRange = deriveDriveWarnings(
      [drive(60, 100)],
      [false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    );
    expect(withinRange.emptyAt).toEqual([]);
  });

  it('FE-ROADTRIP-MODEL-095: an unrouted leg gives the tank up rather than guessing where it ends', () => {
    // The budget goes null and stays null, so there is no honest dry point to offer.
    const out = deriveDriveWarnings(
      [drive(60, 200), undefined, drive(60, 400)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    );
    expect(out.emptyAt).toEqual([]);
    expect(out.carryKm).toBeNull();
  });
});

describe('refuelsRange — what fills which tank', () => {
  it('FE-ROADTRIP-MODEL-096: with no vehicle named, either kind fills up', () => {
    // What TREK did before the setting existed, and the right answer for somebody who
    // never opened the dialog. Anything else would quietly change their warnings.
    expect(refuelsRange('fuel')).toBe(true);
    expect(refuelsRange('charging')).toBe(true);
    expect(refuelsRange('fuel', null)).toBe(true);
    expect(refuelsRange('charging', null)).toBe(true);
  });

  it('FE-ROADTRIP-MODEL-097: a petrol station does not charge a battery', () => {
    // The bug this exists for: an electric car pausing at a petrol station had its
    // battery refilled on paper, the warnings went quiet for the rest of the day, and
    // the driver was told nothing.
    expect(refuelsRange('charging', 'electric')).toBe(true);
    expect(refuelsRange('fuel', 'electric')).toBe(false);
  });

  it('FE-ROADTRIP-MODEL-098: and a charger does not fill a tank', () => {
    expect(refuelsRange('fuel', 'combustion')).toBe(true);
    expect(refuelsRange('charging', 'combustion')).toBe(false);
  });

  it('FE-ROADTRIP-MODEL-099: nothing else refuels anything, whatever is driven', () => {
    for (const vehicle of [null, 'combustion', 'electric'] as const) {
      expect(refuelsRange('rest_area', vehicle)).toBe(false);
      expect(refuelsRange('restaurant', vehicle)).toBe(false);
      expect(refuelsRange(null, vehicle)).toBe(false);
    }
  });

  it('FE-ROADTRIP-MODEL-100: the search looks for what the vehicle actually takes', () => {
    expect(refuelStopTypeFor('combustion')).toEqual(['fuel']);
    expect(refuelStopTypeFor('electric')).toEqual(['charging']);
    expect(refuelStopTypeFor(null)).toEqual(['fuel', 'charging']);
  });
});

describe('deriveDriveWarnings — filling only part way', () => {
  const drive = (minutes: number, km: number) => ({ duration: minutes * 60, distance: km * 1000, mode: 'driving' });

  it('FE-ROADTRIP-MODEL-101: a stop that fills to 80 % leaves a fifth already used', () => {
    // Nobody charges to 100 % on the road: the last fifth takes as long as the first
    // four. Counting a stop as a full tank overstates what comes after it by that fifth.
    const out = deriveDriveWarnings(
      [drive(60, 100), drive(60, 450)],
      [false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 500, fillPercent: 80 },
      0,
    );
    // After the stop the budget restarts at 100 km rather than 0, so the tank is dry
    // 400 km into the second leg. Filled all the way it would have gone the whole 450.
    expect(out.emptyAt).toHaveLength(1);
    expect(out.emptyAt[0]!).toMatchObject({ legIndex: 1, intoLegKm: 400 });
  });

  it('FE-ROADTRIP-MODEL-102: filling all the way is what absent, zero and 100 all mean', () => {
    const legs = [drive(60, 100), drive(60, 450)];
    const refuels = [false, true, false];
    const full = { legMinutes: null, dayMinutes: null, rangeKm: 500 };
    for (const fillPercent of [undefined, null, 0, 100]) {
      const out = deriveDriveWarnings(legs, refuels, { ...full, fillPercent }, 0);
      // A full tank after the stop covers the remaining 450 km without a finding.
      expect(out.emptyAt).toEqual([]);
      expect(out.warnings).toEqual([]);
    }
  });

  it('FE-ROADTRIP-MODEL-103: with no range set, the fill level changes nothing', () => {
    const out = deriveDriveWarnings(
      [drive(60, 900)],
      [true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: null, fillPercent: 50 },
      0,
    );
    expect(out.warnings).toEqual([]);
    expect(out.emptyAt).toEqual([]);
  });

  it('FE-ROADTRIP-MODEL-104: a stop that says how full it fills is read against itself', () => {
    // The motorway charger tops up to 60 %; the traveller's own default is 80. Reading
    // the default here would promise 100 km the car does not have.
    const out = deriveDriveWarnings(
      [drive(60, 100), drive(60, 450)],
      [false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 500, fillPercent: 80 },
      0,
      [null, 60, null],
    );
    // 60 % of 500 km is 300, so the tank is dry 300 km into the second leg rather than
    // the 400 the traveller's own figure would have given.
    expect(out.emptyAt).toHaveLength(1);
    expect(out.emptyAt[0]!).toMatchObject({ legIndex: 1, intoLegKm: 300 });
  });

  it('FE-ROADTRIP-MODEL-105: a stop with no opinion still follows the traveller', () => {
    // Same day, same stop, nothing said about it: the default has to keep applying, or
    // adding the field would have quietly changed every trip that never used it.
    const out = deriveDriveWarnings(
      [drive(60, 100), drive(60, 450)],
      [false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 500, fillPercent: 80 },
      0,
      [null, null, null],
    );
    expect(out.emptyAt[0]!).toMatchObject({ legIndex: 1, intoLegKm: 400 });
  });

  it('FE-ROADTRIP-MODEL-106: a stop can also say it fills right up', () => {
    // The charger at the hotel: the car stands there all night, so this one goes to 100
    // even on a trip whose default stops at 80.
    const out = deriveDriveWarnings(
      [drive(60, 100), drive(60, 450)],
      [false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 500, fillPercent: 80 },
      0,
      [null, 100, null],
    );
    expect(out.emptyAt).toEqual([]);
  });
});

describe('checkout without daily travel times', () => {
  it('keeps the car at the hotel until the next day', () => {
    const schedule = computeSchedule(
      [
        { anchor: '16:00', dwellMinutes: 30, departureAt: 1440 + 720 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [3600],
    );
    expect(schedule.entries[0]!.departure).toBe('12:00');
    expect(schedule.entries[1]!.arrival).toBe('13:00');
    expect(schedule.entries[1]!.dayOffset).toBe(1);
  });
});

it('uses a set departure even without an arrival or daily start', () => {
  // Nothing before the stop says when it is reached, so its own stay does: an hour
  // before eight. The stop ahead of it is worked back from there like from a pin.
  const schedule = computeSchedule(
    [
      { anchor: null, dwellMinutes: 60 },
      { anchor: null, dwellMinutes: 60, departureAt: 480 },
      { anchor: null, dwellMinutes: 0 },
    ],
    [3600, 7200],
  );
  expect(schedule.entries[0]!).toMatchObject({ arrival: '05:00', departure: '06:00', anchored: false });
  expect(schedule.entries[1]!).toMatchObject({ arrival: '07:00', departure: '08:00', anchored: false });
  expect(schedule.entries[2]!).toMatchObject({ arrival: '10:00', dayOffset: 0 });
  expect(schedule.warnings).toEqual([]);
});

describe('a time set to leave a stop', () => {
  const hour = 3600;

  it('holds the stop until then, whatever its stay', () => {
    // Arrive at ten, stay half an hour by default, but leave at two: the next stop is
    // reached at three, not at half past eleven.
    const schedule = computeSchedule(
      [
        { anchor: '09:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 30, departureAt: 14 * 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    expect(schedule.entries[1]!).toMatchObject({ arrival: '10:00', departure: '14:00' });
    expect(schedule.entries[2]!).toMatchObject({ arrival: '15:00' });
    expect(schedule.warnings).toEqual([]);
    expect(schedule.endsAt).toBe(15 * 60);
  });

  it('is kept when the stop is reached later, as long as it is still ahead', () => {
    const schedule = computeSchedule(
      [
        { anchor: '12:30', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 60, departureAt: 14 * 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    // Half an hour there, because that is what is left until two, not the hour it takes.
    expect(schedule.entries[1]!).toMatchObject({ arrival: '13:30', departure: '14:00' });
    expect(schedule.entries[2]!.arrival).toBe('15:00');
  });

  it('says so when the drive gets there after it, and leaves at once', () => {
    const schedule = computeSchedule(
      [
        { anchor: '13:30', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 30, departureAt: 14 * 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    expect(schedule.entries[1]!).toMatchObject({ arrival: '14:30', departure: '14:30' });
    expect(schedule.entries[2]!.arrival).toBe('15:30');
    expect(schedule.warnings).toEqual([{ index: 1, code: 'missedLeave', minutes: 30 }]);
  });

  it('pins both ends of the stay when the arrival is set too', () => {
    // Start and End on one visit: arrive at ten, leave at two. The stay is the four hours
    // between them, not the hour the place carries.
    const schedule = computeSchedule(
      [
        { anchor: '09:00', dwellMinutes: 0 },
        { anchor: '10:00', dwellMinutes: 60, departureAt: 14 * 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    expect(schedule.entries[1]!).toMatchObject({ arrival: '10:00', departure: '14:00', anchored: true });
    expect(schedule.entries[2]!.arrival).toBe('15:00');
    expect(schedule.warnings).toEqual([]);
  });

  it('works backwards from it like from a pinned arrival', () => {
    // Nothing is pinned before the stop. Leaving at two with half an hour there means
    // arriving at half past one, and the stop before it is left at half past twelve.
    const schedule = computeSchedule(
      [
        { anchor: null, dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 30, departureAt: 14 * 60 },
        { anchor: '15:00', dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    expect(schedule.entries[0]!).toMatchObject({ arrival: '12:30', departure: '12:30', anchored: false });
    expect(schedule.entries[1]!).toMatchObject({ arrival: '13:30', departure: '14:00', anchored: false });
    expect(schedule.entries[2]!).toMatchObject({ arrival: '15:00', anchored: true });
    expect(schedule.warnings).toEqual([]);
  });

  it('makes the next pinned stop late when it is left too late to reach it', () => {
    const schedule = computeSchedule(
      [
        { anchor: '09:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 0, departureAt: 14 * 60 },
        { anchor: '14:30', dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    expect(schedule.warnings).toEqual([{ index: 2, code: 'late', minutes: 30 }]);
  });

  it('counts on the day the stop is reached', () => {
    // Reached after midnight on a drive through the night: the ten o'clock it is left at
    // is that morning's, not the morning before.
    const schedule = computeSchedule(
      [
        { anchor: '20:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 0, departureAt: 10 * 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [6 * hour, hour],
    );
    expect(schedule.entries[1]!).toMatchObject({ arrival: '02:00', departure: '10:00', dayOffset: 1 });
    expect(schedule.entries[2]!).toMatchObject({ arrival: '11:00', dayOffset: 1 });
    expect(schedule.warnings).toEqual([{ index: 1, code: 'overnight' }]);
  });

  it('is missed when the drive passes it on the way, midnight or not', () => {
    // Left at eight in the evening, four and a half hours on the road: the half past
    // eleven the stop was to be left at went by on the way. It is not the half past
    // eleven of the next evening, which held the drive there for twenty-three hours.
    const schedule = computeSchedule(
      [
        { anchor: '20:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 0, departureAt: 23 * 60 + 30 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [4.5 * hour, hour],
    );
    expect(schedule.entries[1]!).toMatchObject({ arrival: '00:30', departure: '00:30', dayOffset: 1 });
    expect(schedule.entries[2]!).toMatchObject({ arrival: '01:30', dayOffset: 1 });
    expect(schedule.warnings).toEqual([
      { index: 1, code: 'missedLeave', minutes: 60 },
      { index: 1, code: 'overnight' },
    ]);
  });

  it('waits all day for a time late in the evening', () => {
    const schedule = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 60, departureAt: 21 * 60 + 30 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    expect(schedule.entries[1]!).toMatchObject({ arrival: '09:00', departure: '21:30', dayOffset: 0 });
    expect(schedule.entries[2]!.arrival).toBe('22:30');
    expect(schedule.warnings).toEqual([]);
  });

  it('takes a time just after midnight as that night, with or without a start', () => {
    // Reached at nine in the evening, left at one: four hours, not a departure twenty
    // hours in the past. The same visit with a start at ten (which only MCP can write,
    // the form refuses an end before its start) runs past midnight the same way.
    for (const anchor of [null, '22:00']) {
      const schedule = computeSchedule(
        [
          { anchor: '20:00', dwellMinutes: 0 },
          { anchor, dwellMinutes: 30, departureAt: 60 },
          { anchor: null, dwellMinutes: 0 },
        ],
        [hour, hour],
      );
      expect(schedule.entries[1]!.departure).toBe('01:00');
      expect(schedule.entries[2]!).toMatchObject({ arrival: '02:00', dayOffset: 1 });
      expect(schedule.warnings).toEqual([{ index: 2, code: 'overnight' }]);
    }
  });

  it('lets the first stop of the day start at midnight at the earliest', () => {
    // A hotel stayed at for twelve hours and left at eight. Worked back from its stay it
    // was reached at eight the evening before, which pushed the whole day onto the next.
    const schedule = computeSchedule(
      [
        { anchor: null, dwellMinutes: 720, departureAt: 8 * 60 },
        { anchor: null, dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hour, hour],
    );
    expect(schedule.entries.map((e) => [e.arrival, e.departure, e.dayOffset])).toEqual([
      ['00:00', '08:00', 0],
      ['09:00', '09:00', 0],
      ['10:00', '10:00', 0],
    ]);
    expect(schedule.warnings).toEqual([]);
    expect(schedule.endsAt).toBe(10 * 60);
  });

  it('keeps a departure it cannot place yet, after a leg that never routed', () => {
    const schedule = computeSchedule(
      [
        { anchor: '09:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 0, departureAt: 14 * 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [undefined, hour],
    );
    expect(schedule.entries[1]!).toMatchObject({ arrival: null, departure: '14:00' });
    expect(schedule.entries[2]!.arrival).toBe('15:00');
  });
});

describe('leaveAfter', () => {
  it('waits for a time still ahead of the arrival', () => {
    expect(leaveAfter(600, 840)).toEqual({ departure: 840, missedBy: null });
  });

  it('leaves on arrival for a time already past, and says by how much', () => {
    expect(leaveAfter(870, 840)).toEqual({ departure: 870, missedBy: 30 });
  });

  it('forgives the minute a rounded drive can add', () => {
    expect(leaveAfter(841, 840)).toEqual({ departure: 841, missedBy: null });
  });

  it('places the time on the day of the arrival', () => {
    expect(leaveAfter(1440 + 120, 600)).toEqual({ departure: 1440 + 600, missedBy: null });
  });

  it('counts a time the drive went past on the way as missed, across midnight too', () => {
    // Set out at 20:00, in at 00:30, meant to leave at 23:30.
    expect(leaveAfter(1470, 1410, 1200)).toEqual({ departure: 1470, missedBy: 60 });
  });

  it('waits for a time more than half a day ahead rather than calling the last one missed', () => {
    expect(leaveAfter(540, 1290, 480)).toEqual({ departure: 1290, missedBy: null });
  });

  it('takes a time after midnight as that night when the one this morning is long gone', () => {
    expect(leaveAfter(1320, 60)).toEqual({ departure: 1500, missedBy: null });
  });

  it('still calls a time missed that went by before the drive set out, the same afternoon', () => {
    // The stop before was left at half past two for a stop meant to be left at two. That
    // is late, not a reason to stand there until two tomorrow.
    expect(leaveAfter(930, 840, 870)).toEqual({ departure: 930, missedBy: 90 });
  });
});

describe('scheduleStopOf', () => {
  it('turns a leave time into a departure', () => {
    expect(scheduleStopOf({ time: '10:00', checkInTime: null, dwellMinutes: 60, leaveAt: '14:00' })).toEqual({
      anchor: '10:00',
      dwellMinutes: 60,
      departureAt: 840,
    });
  });

  it('leaves the departure out when there is no usable leave time', () => {
    expect(scheduleStopOf({ time: null, dwellMinutes: 30 })).toEqual({
      anchor: null,
      dwellMinutes: 30,
    });
    expect(scheduleStopOf({ time: null, dwellMinutes: 30, leaveAt: 'soon' })).not.toHaveProperty('departureAt');
  });

  it('anchors a booked night on its check-in', () => {
    expect(scheduleStopOf({ time: null, checkInTime: '10:00', dwellMinutes: 60 })).toEqual({
      anchor: '10:00',
      dwellMinutes: 60,
    });
  });

  it('lets a time pinned on the stop itself win over the check-in', () => {
    expect(scheduleStopOf({ time: '16:00', checkInTime: '15:00', dwellMinutes: 60 }).anchor).toBe('16:00');
  });
});


describe('hasChosenArrival', () => {
  // The rail prints a chosen hour in ink and a computed one in grey. Every scheduler
  // anchors on `time ?? checkInTime`, so a booked night's check-in is as chosen as a
  // pinned stop; two of the three used to ask only about `time` and printed it grey.
  it('counts a pinned time', () => {
    expect(hasChosenArrival({ time: '09:00' })).toBe(true);
  });

  it('counts a check-in, which is the hour a booked night starts its day on', () => {
    expect(hasChosenArrival({ time: null, checkInTime: '08:00' })).toBe(true);
  });

  it('leaves a stop the chain worked out alone', () => {
    expect(hasChosenArrival({ time: null, checkInTime: null })).toBe(false);
    expect(hasChosenArrival({})).toBe(false);
  });

  it('never counts a night the planner inserted itself', () => {
    // Its clock comes from the driving limits, not from anybody's decision.
    expect(hasChosenArrival({ time: '22:00', automaticNight: { phase: 'end' } })).toBe(false);
  });
});

describe('a check-in holds a booked night the way a pinned time does', () => {
  // The hour the traveller said they are at the hotel. It used to be a floor, waited
  // for when the drive got there first and silent otherwise, and once anything before
  // it set the clock it held nothing: a night booked for ten in the morning was
  // reported reached at a quarter past twelve, with the rest of the day lined up
  // behind that. The check-in goes in as the anchor now (see scheduleStopOf), so
  // these run on the anchor the way the rail does.
  it('waits for it when the drive gets there first', () => {
    const schedule = computeSchedule(
      [{ anchor: '09:00', dwellMinutes: 0 }, { anchor: '15:00', dwellMinutes: 0 }],
      [3600],
    );
    expect(schedule.entries[1]!.arrival).toBe('15:00');
    expect(schedule.entries[1]!.anchored).toBe(true);
    expect(schedule.warnings).toEqual([]);
  });

  it('sets the hour when nothing before it does, instead of being worked backwards', () => {
    // Booked to check in at ten, with a stop pinned to three in the afternoon behind it.
    // Read only as a floor, the chain worked the hotel backwards out of the afternoon
    // and put it at 13:46: true enough as arithmetic, and nothing anybody asked for.
    const schedule = computeSchedule(
      [{ anchor: '10:00', dwellMinutes: 60 }, { anchor: '15:00', dwellMinutes: 60 }],
      [14 * 60],
    );
    expect(schedule.entries[0]!.arrival).toBe('10:00');
    expect(schedule.entries[0]!.anchored).toBe(true);
    expect(schedule.entries[1]!.arrival).toBe('15:00');
    expect(schedule.warnings).toEqual([]);
  });

  it('keeps its hour and says how late the drive is when it gets there later', () => {
    // Two stops, then the hotel booked for ten: the drive reaches it at 12:17. The
    // night stays at ten and the day is lined up behind that, and the finding says
    // by how much the drive misses it, the way it would for any pinned stop.
    const schedule = computeSchedule(
      [{ anchor: '08:00', dwellMinutes: 30 }, { anchor: null, dwellMinutes: 60 }, { anchor: '10:00', dwellMinutes: 60 }],
      [89 * 60, 78 * 60],
    );
    expect(schedule.entries[1]!.arrival).toBe('09:59');
    expect(schedule.entries[2]!.arrival).toBe('10:00');
    expect(schedule.entries[2]!.anchored).toBe(true);
    expect(schedule.entries[2]!.departure).toBe('11:00');
    expect(schedule.warnings).toEqual([{ index: 2, code: 'late', minutes: 137 }]);
    // Still the same day, which is what the day split reads.
    expect(schedule.entries[2]!.dayOffset).toBe(0);
  });

  it('still reports a pinned time that cannot be made', () => {
    const schedule = computeSchedule(
      [{ anchor: '15:00', dwellMinutes: 60 }, { anchor: '11:00', dwellMinutes: 0 }],
      [14 * 60],
    );
    expect(schedule.warnings).toContainEqual({ index: 1, code: 'late', minutes: 314 });
  });
});

describe('carriedSeam', () => {
  it('FE-ROADTRIP-MODEL-107: the via behind a last stop stays with it while it is last, whatever its number', () => {
    expect(carriedSeam([10, 20, 30], [20, 10, 30])).toEqual({ from: 2, to: 2 });
    // A stop taken out ahead of it, and a night seated ahead of it.
    expect(carriedSeam([10, 20, 30], [10, 30])).toEqual({ from: 2, to: 1 });
    expect(carriedSeam([10, 20, 30], [10, 20, 25, 30])).toEqual({ from: 2, to: 3 });
    // Another stop is last now, or the day has none.
    expect(carriedSeam([10, 20, 30], [30, 10, 20])).toBeNull();
    expect(carriedSeam([10, 20, 30], [10, 20, 30, 40])).toBeNull();
    expect(carriedSeam([10, 20, 30], [10, 20])).toBeNull();
    expect(carriedSeam([], [10])).toBeNull();
    expect(carriedSeam([10], [])).toBeNull();
  });

  it('FE-ROADTRIP-MODEL-108: the reorder and the removal the planner and the server run both keep to it', () => {
    const via = (id: number, after: number) => ({ id, after_order_index: after, lat: 53, lng: 10 });
    expect(reanchorByStopOrder([via(9, 2)], [10, 20, 30], [10, 30])).toEqual({
      vias: [{ id: 9, after_order_index: 1 }],
      remove: [],
    });
    expect(reanchorByStopOrder([via(9, 2)], [10, 20, 30], [20, 10, 30])).toEqual({ vias: [], remove: [] });
    expect(reanchorAfterRemove([via(9, 2)], 2, 3)).toEqual({ vias: [], remove: [9] });
    expect(reanchorAfterRemove([via(9, 2)], 0, 3)).toEqual({ vias: [{ id: 9, after_order_index: 1 }], remove: [] });
  });
});

describe('seamViaIndex', () => {
  const via = (id: number, after: number) => ({ id, after_order_index: after, lat: 53, lng: 10 });
  /** The day's stops after `from` was taken out and put back at `to`. */
  const moved = (ids: number[], from: number, to: number): number[] => {
    const next = ids.filter((_, i) => i !== from);
    next.splice(to, 0, ids[from]!);
    return next;
  };

  it('FE-ROADTRIP-MODEL-109: the via behind the last stop stays while that stop is last and goes once it is not', () => {
    expect(seamViaIndex(2, [10, 20, 30], [10, 30])).toBe(1);
    expect(seamViaIndex(2, [10, 20, 30], [30, 10, 20])).toBeNull();
    expect(seamViaIndex(2, [10, 20, 30], [10, 30, 20])).toBeNull();
    // A via on a leg of the day is left to the writer.
    expect(seamViaIndex(1, [10, 20, 30], [30, 10, 20])).toBeUndefined();
  });

  it('FE-ROADTRIP-MODEL-110: every writer does the same to it for the same move, and never bends a leg of the day with it', () => {
    // The rail's drag (positional) and the list's reorder or the server's sort (by stop)
    // used to disagree: one dropped the via, the other put it on the leg its stop leaves by.
    for (const count of [2, 3, 4, 5]) {
      const ids = Array.from({ length: count }, (_, i) => 10 * (i + 1));
      for (let from = 0; from < count; from++) {
        for (let to = 0; to < count; to++) {
          if (from === to) continue;
          const vias = [via(9, count - 1)];
          const positional = reanchorAfterReorder(vias, from, to, count);
          expect(reanchorByStopOrder(vias, ids, moved(ids, from, to)), `${count}: ${from}->${to}`).toEqual(positional);
          const stays = moved(ids, from, to)[count - 1] === ids[count - 1];
          expect(positional, `${count}: ${from}->${to}`).toEqual(
            stays ? { vias: [], remove: [] } : { vias: [], remove: [9] },
          );
        }
        // Taken out: the same, by position and by stop.
        const removed = ids.filter((_, i) => i !== from);
        expect(reanchorByStopOrder([via(9, count - 1)], ids, removed)).toEqual(
          reanchorAfterRemove([via(9, count - 1)], from, count),
        );
      }
    }
  });
});

describe('isStoredStop', () => {
  it('FE-ROADTRIP-MODEL-111: a stored stop is an assignment, not a marker, a terminal or a booked night at the edge', () => {
    expect(isStoredStop({})).toBe(true);
    expect(isStoredStop({ automaticNight: { phase: 'end', fromDayNumber: 1 } })).toBe(false);
    expect(
      isStoredStop({
        carrier: { reservationId: 1, type: 'flight', role: 'arrival', title: 'Flight', code: null, at: null },
      }),
    ).toBe(false);
    expect(
      isStoredStop({
        bookend: {
          phase: 'morning',
          accommodationId: 1,
          reservationId: null,
          checkingOut: false,
          checkingIn: false,
          checkOut: null,
        },
      }),
    ).toBe(false);
  });
});

/**
 * A ride's departure terminal is pinned a check-in ahead of a dated timetable. Read as a
 * time of day like any other pin, a drive more than half a day behind it caught the same
 * flight a day later without a word, and one that got there half a day early read the
 * pin as yesterday's and came out late.
 */
describe('a departure terminal on its timetable’s day', () => {
  const terminal = (role: 'departure' | 'arrival' | 'pickup', time: string, leaveAt: string | null = null) => ({
    time,
    leaveAt,
    checkInTime: null,
    dwellMinutes: role === 'departure' ? 60 : 0,
    carrier: {
      reservationId: 77,
      type: role === 'pickup' ? 'car' : 'flight',
      role,
      title: 'LH 2078',
      code: null,
      at: null,
    },
  });
  const minutes = (m: number): number => m * 60;

  it('FE-ROADTRIP-MODEL-112: only a ride’s departure terminal is held to its day', () => {
    expect(scheduleStopOf(terminal('departure', '14:15', '15:15'))).toEqual({
      anchor: '14:15',
      dwellMinutes: 60,
      departureAt: 915,
      dated: true,
    });
    expect(scheduleStopOf(terminal('arrival', '17:20'))).not.toHaveProperty('dated');
    expect(scheduleStopOf(terminal('pickup', '09:00'))).not.toHaveProperty('dated');
    expect(scheduleStopOf({ time: '14:15', dwellMinutes: 0 })).not.toHaveProperty('dated');
  });

  it('FE-ROADTRIP-MODEL-113: reached more than half a day after its check-in, it is late by all of it, and the ride still flies that day', () => {
    // Left at eight with eighteen and a half hours of road ahead: at the airport at half past
    // two the next morning for a check-in at 14:15. Read as a clock, that was the next
    // day's 14:15 and nothing was said.
    const { entries, warnings } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        scheduleStopOf(terminal('departure', '14:15', '15:15')),
        scheduleStopOf(terminal('arrival', '17:20')),
        { anchor: null, dwellMinutes: 0 },
      ],
      [minutes(18 * 60 + 30), minutes(125), minutes(30)],
    );
    expect(warnings).toEqual([{ index: 1, code: 'late', minutes: 735 }]);
    // The drive after the landing runs on from the timetable, as it always has.
    expect(entries.map((e) => [e.arrival, e.departure, e.dayOffset])).toEqual([
      ['08:00', '08:00', 0],
      ['14:15', '15:15', 0],
      ['17:20', '17:20', 0],
      ['17:50', '17:50', 0],
    ]);
  });

  it('FE-ROADTRIP-MODEL-114: reached long before its check-in, it is waited for on its day, not read as the day before', () => {
    const { entries, warnings } = computeSchedule(
      [{ anchor: '00:30', dwellMinutes: 0 }, scheduleStopOf(terminal('departure', '14:15', '15:15'))],
      [minutes(10)],
    );
    expect(warnings).toEqual([]);
    expect(entries.map((e) => [e.arrival, e.departure, e.dayOffset])).toEqual([
      ['00:30', '00:30', 0],
      ['14:15', '15:15', 0],
    ]);
    // An arrival terminal keeps the reading nearest the drive: a flight booked on one day
    // that lands after midnight is on time the next morning.
    const lateLanding = computeSchedule(
      [
        { anchor: '21:00', dwellMinutes: 0 },
        scheduleStopOf(terminal('departure', '22:00', '23:00')),
        scheduleStopOf(terminal('arrival', '01:00')),
      ],
      [minutes(30), minutes(120)],
    );
    expect(lateLanding.warnings.filter((w) => w.code === 'late')).toEqual([]);
    expect(lateLanding.entries[2]).toMatchObject({ arrival: '01:00', dayOffset: 1 });
  });
});
