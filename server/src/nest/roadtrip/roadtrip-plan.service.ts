import { DatabaseService } from '../database/database.service';
import { SettingsService } from '../settings/settings.service';
import { DayBoundariesService } from './day-boundaries.service';
import { RoadtripPreferencesService } from './roadtrip-preferences.service';
import { RoadtripRouterService } from './roadtrip-router.service';
import { RoadtripService } from './roadtrip.service';
import { Injectable, HttpException } from '@nestjs/common';
import { type RoadtripPreferences } from '@trek/shared';
import {
  assembleRoadtrip,
  foldRouteRun,
  splitIntoRuns,
  spillChains,
  dayWindow,
  parseClock,
  effectiveRangeKm,
  parseAvoid,
  type RoadtripStop,
  type PlanDay,
  type RoutedLeg,
  type SnappedWaypoint,
  type RouteAvoidClass,
} from '@trek/shared/roadtrip';

interface StoredDay {
  id: number;
  day_number: number;
  date: string | null;
  title: string | null;
  default_transport_mode: string | null;
}
interface VisitRow {
  check_in: string | null;
  check_out: string | null;
  checkout_day: number | null;
  id: number;
  day_id: number;
  place_id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  time: string | null;
  duration_minutes: number | null;
  end_day: number;
  leg_transport_mode: string | null;
  incoming_leg_transport_mode: string | null;
  stop_type: string | null;
  fill_percent: number | null;
}
const stopKey = (s: RoadtripStop) =>
  `${s.lat.toFixed(5)},${s.lng.toFixed(5)},${s.legMode ?? ''},${s.incomingLegMode ?? ''}`;

@Injectable()
export class RoadtripPlanService {
  constructor(
    private readonly db: DatabaseService,
    private readonly settings: SettingsService,
    private readonly preferences: RoadtripPreferencesService,
    private readonly router: RoadtripRouterService,
    private readonly roadtrip: RoadtripService,
    private readonly boundaries: DayBoundariesService,
  ) {}

  context(tripId: number, userId: number) {
    if (!this.db.canAccessTrip(tripId, userId)) throw new HttpException({ error: 'Trip not found' }, 404);
    const days = this.db.all<StoredDay>(
      'SELECT id, day_number, date, title, default_transport_mode FROM days WHERE trip_id = ? ORDER BY day_number',
      tripId,
    );
    const visits = this.db.all<VisitRow>(
      `SELECT a.id, a.day_id, a.place_id, p.name, p.lat, p.lng,
      COALESCE(a.assignment_time, p.place_time) AS time, p.duration_minutes, a.end_day,
      a.leg_transport_mode, a.incoming_leg_transport_mode, p.stop_type, p.fill_percent, stay.check_in, stay.check_out, checkout.day_number AS checkout_day
      FROM day_assignments a JOIN days d ON d.id = a.day_id JOIN places p ON p.id = a.place_id
      LEFT JOIN day_accommodations stay ON stay.id = (SELECT id FROM day_accommodations WHERE place_id = p.id AND start_day_id = d.id ORDER BY id LIMIT 1)
      LEFT JOIN days checkout ON checkout.id = stay.end_day_id
      WHERE d.trip_id = ? ORDER BY d.day_number, a.order_index, a.created_at`,
      tripId,
    );
    return {
      days,
      visits,
      settings: this.preferences.read(tripId),
      profiles: this.router.profiles(),
      vias: this.roadtrip.listForTrip(tripId),
      tracks: this.roadtrip.tracksForTrip(tripId),
      boundaries: this.boundaries.list(tripId),
    };
  }

  async calculate(tripId: number, userId: number, overrides?: RoadtripPreferences) {
    const context = this.context(tripId, userId);
    const preferences = { ...context.settings, ...overrides };
    const window = dayWindow(
      preferences.roadtrip_day_start,
      preferences.roadtrip_day_end,
      preferences.roadtrip_day_end_mode,
    );
    if (preferences.roadtrip_day_start && preferences.roadtrip_day_end && !window)
      throw new HttpException({ error: 'Day end must be later than day start.' }, 400);
    const plan: PlanDay[] = context.days.map((day) => ({
      dayId: day.id,
      dayNumber: day.day_number,
      date: day.date,
      title: day.title,
      stops: context.visits
        .filter((v) => v.day_id === day.id && v.lat !== null && v.lng !== null)
        .map((v, index) => ({
          assignmentId: v.id,
          ownerDayId: day.id,
          ownerIndex: index,
          placeId: v.place_id,
          name: v.name,
          lat: v.lat!,
          lng: v.lng!,
          time: v.time,
          checkInTime: v.check_in,
          ...(v.checkout_day != null && parseClock(v.check_out) !== null ? { checkoutAt: v.checkout_day * 1440 + parseClock(v.check_out)! } : {}),
          dwellMinutes: v.duration_minutes,
          endDay: v.end_day === 1,
          legMode: v.leg_transport_mode,
          incomingLegMode: v.incoming_leg_transport_mode,
          stopType: v.stop_type,
          fillPercent: v.fill_percent,
        })),
    }));
    const allLegs: Record<string, RoutedLeg> = {};
    const snapByDay: Record<number, Record<string, SnappedWaypoint>> = {};
    const missedByDay: Record<number, RouteAvoidClass[]> = {};
    const failures: { fromAssignmentId: number; toAssignmentId: number; reason: string }[] = [];
    const avoid = parseAvoid(preferences.roadtrip_avoid);
    const connectDays = preferences.roadtrip_connect_days || window !== null;
    if (context.visits.length > 150)
      throw new HttpException({ error: 'This trip exceeds the 150-visit calculation limit.' }, 400);
    const asked = new Set<string>();
    const fetchRun = async (stops: RoadtripStop[], dayId: number, profile: string) => {
      const points: { lat: number; lng: number }[] = [];
      const stopAt: number[] = [];
      stops.forEach((stop, index) => {
        stopAt.push(points.length);
        points.push({ lat: stop.lat, lng: stop.lng });
        if (index < stops.length - 1)
          points.push(
            ...context.vias
              .filter((v) => v.day_id === stop.ownerDayId && v.after_order_index === stop.ownerIndex)
              .sort((a, b) => a.sequence - b.sequence)
              .map((v) => ({ lat: v.lat, lng: v.lng })),
          );
      });
      const pairs = stops.slice(0, -1).map((from, index) => ({ from, to: stops[index + 1] }));
      pairs.forEach(({ from, to }) => asked.add(stopKey(from) + '>' + stopKey(to)));
      try {
        if (points.length > 100) throw new Error('Too many waypoints');
        const routed = await this.router.route(userId, tripId, dayId, points, profile, avoid);
        const legs = routed.parts.map((part, index) => ({
          ...routed.leg.seg,
          ...part,
          from: [points[index].lat, points[index].lng] as [number, number],
          to: [points[index + 1].lat, points[index + 1].lng] as [number, number],
        }));
        Object.assign(
          allLegs,
          foldRouteRun(stops, stopAt, { coordinates: routed.leg.line, legs, vias: routed.leg.vias }, profile),
        );
        missedByDay[dayId] = [...new Set([...(missedByDay[dayId] ?? []), ...routed.avoidMissed])];
        stops.forEach((stop, index) => {
          const snapped = routed.snapped?.[stopAt[index]];
          if (snapped) (snapByDay[stop.ownerDayId] ??= {})[stopKey(stop)] = snapped;
        });
      } catch {
        pairs.forEach(({ from, to }) =>
          failures.push({
            fromAssignmentId: from.assignmentId,
            toAssignmentId: to.assignmentId,
            reason:
              points.length > 100
                ? 'More than 100 waypoints in this run.'
                : 'Routing provider could not calculate this run. Check the profile, connection and provider limits.',
          }),
        );
      }
    };
    for (const day of plan.filter((d) => d.stops.length > 1)) {
      const fallback = context.days.find((d) => d.id === day.dayId)?.default_transport_mode || 'driving';
      for (const run of splitIntoRuns(day.stops, (from) => from.legMode ?? fallback))
        await fetchRun(run.stops, day.dayId, run.mode);
    }
    const chains = window
      ? plan.filter((d) => d.stops.length)
      : spillChains(
          plan.filter((d) => d.stops.length > 1),
          plan.filter((d) => d.stops.length < 2),
          (a, b) => allLegs[stopKey(a) + '>' + stopKey(b)],
        );
    let previous: RoadtripStop | undefined;
    for (const chain of chains) {
      const pairs = chain.stops.slice(0, -1).map((from, index) => ({ from, to: chain.stops[index + 1] }));
      if (connectDays && previous && chain.stops.length) pairs.push({ from: previous, to: chain.stops[0] });
      for (const { from, to } of pairs) {
        if (asked.has(stopKey(from) + '>' + stopKey(to))) continue;
        await fetchRun(
          [from, to],
          chain.dayId,
          from.legMode ?? context.days.find((d) => d.id === chain.dayId)?.default_transport_mode ?? 'driving',
        );
      }
      previous = chain.stops[chain.stops.length - 1] ?? previous;
    }
    const vehicleKind = preferences.roadtrip_vehicle || null;
    const rangeKm =
      effectiveRangeKm(
        vehicleKind,
        {
          tankLitres: preferences.roadtrip_tank_litres,
          litresPer100: preferences.roadtrip_litres_per_100,
          batteryKwh: preferences.roadtrip_battery_kwh,
          kwhPer100: preferences.roadtrip_kwh_per_100,
          degradationPercent: preferences.roadtrip_battery_degradation,
        },
        preferences.roadtrip_range_km,
      ) || null;
    const calculated = assembleRoadtrip({
      plan: plan.filter((d) => d.stops.length > 1),
      quietDays: plan.filter((d) => d.stops.length < 2),
      window,
      allLegs,
      snapByDay,
      missedByDay,
      loading: false,
      limits: {
        legMinutes: preferences.roadtrip_leg_minutes || null,
        dayMinutes: preferences.roadtrip_day_minutes || null,
        rangeKm,
        fillPercent: preferences.roadtrip_fill_percent || null,
      },
      vehicleKind,
      connectDays,
      boundaries: context.boundaries,
      distanceUnit: this.settings.getUserSettings(userId).distance_unit === 'imperial' ? 'imperial' : 'metric',
      labels: { start: 'Continue journey', end: 'End of day' },
    });
    return {
      context,
      preferences,
      calculated,
      failures,
      omittedVisits: context.visits.filter((v) => v.lat === null || v.lng === null).map((v) => v.id),
    };
  }
}
