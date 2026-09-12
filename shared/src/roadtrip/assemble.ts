import { spurFor } from './accessSpur';
import { pointAtMeters } from './corridor';
import type { RoadtripDayBoundary } from './day-boundary.schema';
import { planDayWindow, type DayWindow } from './dayWindow';
import { spillChains } from './nightSpill';
import type {
  PlanDay,
  QuietDay,
  RoadtripStop,
  RoadtripDay,
  RoadtripRoutes,
  RoutedLeg,
  RouteSegment,
  SnappedWaypoint,
  RouteAvoidClass,
  DistanceUnit,
} from './planning-types';
import {
  computeSchedule,
  parseClock,
  deriveDriveWarnings,
  refuelsRange,
  isServiceStopType,
  type DryPoint,
  type DriveLimits,
  type VehicleKind,
} from './roadtripModel';
import { splitScheduledDays } from './splitScheduledDays';

const stopKey = (s: RoadtripStop): string =>
  `${s.lat.toFixed(5)},${s.lng.toFixed(5)},${s.legMode ?? ''},${s.incomingLegMode ?? ''}`;

const legKey = (from: RoadtripStop, to: RoadtripStop): string => `${stopKey(from)}>${stopKey(to)}`;

export function assembleRoadtrip({
  plan,
  quietDays,
  window,
  distanceUnit,
  allLegs,
  snapByDay,
  missedByDay,
  loading,
  limits,
  vehicleKind,
  connectDays,
  boundaries,
  labels,
}: {
  plan: PlanDay[];
  quietDays: QuietDay[];
  window: DayWindow | null;
  distanceUnit: DistanceUnit;
  allLegs: Record<string, RoutedLeg>;
  snapByDay: Record<number, Record<string, SnappedWaypoint>>;
  missedByDay: Record<number, RouteAvoidClass[]>;
  loading: boolean;
  limits: DriveLimits;
  vehicleKind: VehicleKind | null;
  connectDays: boolean;
  boundaries: RoadtripDayBoundary[];
  labels: { start: string; end: string };
}): RoadtripRoutes {
  const chains = spillChains(plan, quietDays, (a, b) => allLegs[legKey(a, b)]);

  const allSnaps: Record<string, SnappedWaypoint> = {};
  for (const day of plan) Object.assign(allSnaps, snapByDay[day.dayId] ?? {});
  const storedLegFor = (from: RoadtripStop, to: RoadtripStop): RoutedLeg | undefined => allLegs[legKey(from, to)];
  const timed = window
    ? planDayWindow(
        [...plan, ...quietDays],
        window,
        storedLegFor,
        distanceUnit,
        { start: labels.start, end: labels.end },
        boundaries,
      )
    : null;
  const automaticSchedule = !!timed && timed.issue === null;
  const displayChains = automaticSchedule
    ? timed.chains
    : timed?.issue
      ? [...plan, ...quietDays]
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .filter((d) => d.stops.length)
          .map((d) => ({
            ...d,
            spills: [],
            schedule: computeSchedule(
              d.stops.map((s) => ({
                anchor: s.time ?? s.checkInTime ?? null,
                dwellMinutes: s.dwellMinutes,
                departureAt: s.checkoutAt === undefined ? undefined : s.checkoutAt - d.dayNumber * 1440,
              })),
              d.stops.slice(0, -1).map((s, i) => storedLegFor(s, d.stops[i + 1]!)?.seg.duration),
            ),
          }))
      : splitScheduledDays(chains, [...plan, ...quietDays], storedLegFor);
  const legFor = automaticSchedule ? timed.legFor : storedLegFor;

  const lines: [number, number][][] = [];
  const lineDays: number[] = [];
  const segments: RouteSegment[] = [];
  const accessLines: RoadtripRoutes['accessLines'] = [];

  const out: RoadtripDay[] = [];
  let carryKm: number | null = 0;

  let previousStop: RoadtripStop | undefined;

  let previousDayNumber: number | undefined;
  for (const chain of displayChains) {
    const routed = chain.stops.slice(0, -1).map((s, i) => legFor(s, chain.stops[i + 1]!));

    const inboundAt = new Map<number, { seg: RouteSegment | undefined; line: [number, number][]; drawnAs: number }>();
    if (connectDays && !automaticSchedule) {
      for (const spill of chain.spills) {
        inboundAt.set(spill.at, { seg: spill.leg, line: spill.line, drawnAs: spill.fromDayNumber });
      }

      const joined = inboundAt.has(0) ? undefined : previousStop && legFor(previousStop, chain.stops[0]!);
      if (joined)
        inboundAt.set(0, { seg: joined.seg, line: joined.line, drawnAs: previousDayNumber ?? chain.dayNumber });
    }
    previousStop = chain.stops[chain.stops.length - 1]! ?? previousStop;
    previousDayNumber = chain.stops.length ? chain.dayNumber : previousDayNumber;
    for (let i = 0; i < chain.stops.length; i++) {
      const inbound = inboundAt.get(i);
      if (inbound) {
        if (inbound.line.length > 1) {
          lines.push(inbound.line);
          lineDays.push(inbound.drawnAs);
        }
        if (inbound.seg) segments.push(inbound.seg);
      }
      const leg = routed[i];
      if (!leg) continue;
      if (leg.line.length > 1) {
        lines.push(leg.line);
        lineDays.push(chain.dayNumber);
      }
      segments.push(leg.seg);
    }

    const geometry: [number, number][] = [];
    for (let i = 0; i < chain.stops.length; i++) {
      const inbound = inboundAt.get(i);
      if (inbound) geometry.push(...inbound.line);
      geometry.push(...(routed[i]?.line ?? []));
    }
    const legs = routed.map((l) => l?.seg);
    const inbound = [...inboundAt.values()].map((l) => l.seg);
    const distance =
      legs.reduce((sum, l) => sum + (l?.distance ?? 0), 0) + inbound.reduce((sum, l) => sum + (l?.distance ?? 0), 0);
    const duration =
      legs.reduce((sum, l) => sum + (l?.duration ?? 0), 0) + inbound.reduce((sum, l) => sum + (l?.duration ?? 0), 0);
    const schedule = chain.schedule;
    const legVias = routed.map((l) => l?.vias ?? []);
    const stops = chain.stops.map((s, index) => {
      const snap = s.automaticNight ? undefined : allSnaps[stopKey(s)];
      const line = spurFor(snap);
      if (line) accessLines.push({ line, meters: snap!.meters, stopKey: stopKey(s) });
      const entry = schedule.entries[index];
      const arrival = parseClock(entry?.arrival);
      const dwellMinutes =
        s.checkoutAt !== undefined && arrival !== null
          ? Math.max(0, s.checkoutAt - ((chain.dayNumber + (entry?.dayOffset ?? 0)) * 1440 + arrival))
          : s.checkoutAt !== undefined
            ? null
            : s.dwellMinutes;
      return { ...s, dwellMinutes, offRoadMeters: line ? snap!.meters : null };
    });

    const drive = {
      warnings: [] as ReturnType<typeof deriveDriveWarnings>['warnings'],
      day: null as ReturnType<typeof deriveDriveWarnings>['day'],
    };
    const dryPoints: (DryPoint & { lat: number; lng: number })[] = [];
    const drivingLine: [number, number][] = [];
    let drivenMeters = 0;
    let drivingSeconds = 0;
    for (let i = 0; i < stops.length; i++) {
      const incoming = inboundAt.get(i);
      if (incoming?.seg) {
        const incomingDrive = deriveDriveWarnings([incoming.seg], [false, false], limits, carryKm);
        carryKm = incomingDrive.carryKm;
        drive.warnings.push(...incomingDrive.warnings.map((w) => ({ ...w, index: i })));
        for (const dry of incomingDrive.emptyAt) {
          const at = pointAtMeters(
            incoming.line.map(([lat, lng]) => ({ lat, lng })),
            dry.drivenMeters,
          );
          if (at) dryPoints.push({ ...dry, legIndex: -i - 1, inboundLine: incoming.line, lat: at.lat, lng: at.lng });
        }
        if (!incoming.seg.mode || incoming.seg.mode === 'driving') drivingSeconds += incoming.seg.duration ?? 0;
      }
      const leg = routed[i];
      const outgoing = deriveDriveWarnings(
        i < stops.length - 1 ? [leg?.seg] : [],
        [refuelsRange(stops[i]!.stopType, vehicleKind), false],
        limits,
        carryKm,
        [stops[i]!.fillPercent],
      );
      carryKm = outgoing.carryKm;
      drive.warnings.push(...outgoing.warnings.map((w) => ({ ...w, index: i + 1 })));
      for (const dry of outgoing.emptyAt) {
        const at = pointAtMeters(
          (leg?.line ?? []).map(([lat, lng]) => ({ lat, lng })),
          dry.intoLegKm * 1000,
        );
        if (at)
          dryPoints.push({
            ...dry,
            legIndex: i,
            drivenMeters: drivenMeters + dry.intoLegKm * 1000,
            lat: at.lat,
            lng: at.lng,
          });
      }
      if (leg && (!leg.seg.mode || leg.seg.mode === 'driving')) {
        drivingLine.push(...leg.line);
        drivenMeters += leg.seg.distance ?? 0;
        drivingSeconds += leg.seg.duration ?? 0;
      }
    }
    const drivingMinutes = Math.round(drivingSeconds / 60);
    if (limits.dayMinutes && drivingMinutes > limits.dayMinutes) {
      drive.day = { code: 'dayDriving', minutes: drivingMinutes, limitMinutes: limits.dayMinutes };
    }
    const drivingGeometry = drivingLine.length === geometry.length ? geometry : drivingLine;
    out.push({
      automaticSchedule,
      dayId: chain.dayId,
      dayNumber: chain.dayNumber,
      date: chain.date,
      title: chain.title,
      avoidMissed: missedByDay[chain.dayId],
      spills: chain.spills,
      stops,
      legs,
      legVias,
      schedule,
      geometry,
      distance,
      duration,
      dryPoints,
      drivingGeometry,
      driveWarnings: drive.warnings,
      dayWarning: drive.day,
    });
  }
  const drives = out.filter((d) => d.stops.length > 1 || !!d.spills?.length || d.stops.some((s) => s.automaticNight));
  const originalStops = [...plan, ...quietDays].sort((a, b) => a.dayNumber - b.dayNumber).flatMap((day) => day.stops);
  const boundaryPath = originalStops.slice(0, -1).flatMap((from, position) => {
    const to = originalStops[position + 1]!;
    const leg = storedLegFor(from, to);
    return leg && (!leg.seg.mode || leg.seg.mode === 'driving') && from.assignmentId > 0 && to.assignmentId > 0
      ? [{ from, to, position, line: leg.line }]
      : [];
  });
  return {
    boundaryPath,
    validateBoundaries: (next: RoadtripDayBoundary[]) =>
      window
        ? planDayWindow(
            [...plan, ...quietDays],
            window,
            storedLegFor,
            distanceUnit,
            { start: labels.start, end: labels.end },
            next,
          ).issue
        : 'conflict',
    dayWindowIssue: timed?.issue ?? null,
    days: drives,
    lines,
    lineDays,
    segments,
    accessLines,
    vias: out.flatMap((d) => d.legVias.flat()),
    totalDistance: drives.reduce((s, d) => s + d.distance, 0),
    totalDuration: drives.reduce((s, d) => s + d.duration, 0),

    totalStops: drives.reduce(
      (s, d) => s + d.stops.filter((st) => !st.automaticNight && !isServiceStopType(st.stopType)).length,
      0,
    ),

    quietDays: out
      .filter((d) => d.stops.length < 2 && !d.spills?.length && !d.stops.some((s) => s.automaticNight))
      .map((d) => ({ dayId: d.dayId, dayNumber: d.dayNumber, date: d.date, title: d.title, stops: d.stops })),
    loading,
  };
}
