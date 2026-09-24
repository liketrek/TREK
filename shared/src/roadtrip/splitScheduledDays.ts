import { continueSchedule } from './continueSchedule';
import type { SpillChain, SpillMark } from './nightSpill';
import type { PlanDay, RoadtripStop, RoutedLeg } from './planning-types';

export function splitScheduledDays(
  chains: SpillChain[],
  days: PlanDay[],
  legFor: (from: RoadtripStop, to: RoadtripStop) => RoutedLeg | undefined,
): SpillChain[] {
  const grouped = new Map<number, SpillChain>();
  for (const chain of chains) {
    const schedule = continueSchedule(
      chain.stops,
      chain.schedule,
      chain.stops.slice(0, -1).map((stop, i) => legFor(stop, chain.stops[i + 1]!)?.seg.duration),
      chain.dayNumber,
    );
    chain.stops.forEach((stop, i) => {
      const entry = schedule.entries[i]!;
      const offset = Math.max(0, entry.dayOffset);
      const number = chain.dayNumber + offset;
      let target = grouped.get(number);
      if (!target) {
        const stored = days.find((day) => day.dayNumber === number);
        let date = stored?.date ?? null;
        if (!date && chain.date) {
          const shifted = new Date(chain.date + 'T12:00:00Z');
          shifted.setUTCDate(shifted.getUTCDate() + offset);
          date = shifted.toISOString().slice(0, 10);
        }
        target = {
          dayId: stored?.dayId ?? -1000000000 - number,
          dayNumber: number,
          date,
          title: stored?.title ?? null,
          stops: [],
          schedule: { entries: [], warnings: [] },
          spills: [],
        };
        grouped.set(number, target);
      }
      const index = target.stops.length;
      target.stops.push(stop);
      target.schedule.entries.push({ ...entry, dayOffset: 0 });
      target.schedule.warnings.push(
        ...schedule.warnings
          .filter((warning) => warning.index === i && !(offset && warning.code === 'overnight'))
          .map((warning) => ({ ...warning, index })),
      );
      const inherited = chain.spills.find((spill) => i >= spill.at && i < spill.at + spill.count);
      const fromDayNumber = offset ? chain.dayNumber : inherited?.fromDayNumber;
      if (fromDayNumber !== undefined) {
        const last = target.spills[target.spills.length - 1];
        if (last && last.fromDayNumber === fromDayNumber && last.at + last.count === index) last.count += 1;
        else {
          const from = i > 0 ? chain.stops[i - 1] : inherited?.fromStop;
          const leg = from ? legFor(from, stop) : undefined;
          const mark: SpillMark = offset
            ? {
                at: index,
                count: 1,
                fromDayNumber,
                departure: schedule.entries[i - 1]?.departure ?? inherited?.departure ?? null,
                fromStop: from,
                leg: leg?.seg,
                line: leg?.line ?? [],
              }
            : { ...inherited!, at: index, count: 1 };
          target.spills.push(mark);
        }
      }
    });
  }
  return [...grouped.values()].sort((a, b) => a.dayNumber - b.dayNumber);
}
