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
  carrierLegsFor,
  carrierSeam,
  foldRouteRun,
  hotelBookendsOn,
  isStationaryJoin,
  splitIntoRuns,
  spillChains,
  dayWindow,
  effectiveRangeKm,
  parseAvoid,
  formatDistance,
  formatDurationShort,
  seatCarrierStops,
  seatNightBookends,
  undatedRides,
  viasOnLeg,
  type BookendStay,
  type CarrierBooking,
  type CarrierSeam,
  type DistanceUnit,
  type RoadtripStop,
  type PlanDay,
  type RoutedLeg,
  type SnappedWaypoint,
  type RouteAvoidClass,
  standsAsDay,
} from '@trek/shared/roadtrip';

interface StoredDay {
  id: number;
  day_number: number;
  date: string | null;
  title: string | null;
  default_transport_mode: string | null;
}
/**
 * A booking the traveller rides, with what the seam needs of it: the days and clocks at
 * both ends, the terminals, and where the day plan seats it. Same projection the client
 * reads off the reservation list, so the two plans seat a flight in the same place.
 */
interface CarrierRow {
  id: number;
  type: string;
  title: string;
  day_id: number | null;
  end_day_id: number | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  metadata: string | null;
  day_plan_position: number | null;
}
interface VisitRow {
  /** The booking this stop stands for on its check-in day, when there is one. */
  stay_id: number | null;
  check_in: string | null;
  /** The drive does not read these two (#2357): they are the booking as get_roadtrip_context reports it. */
  check_out: string | null;
  checkout_day: number | null;
  id: number;
  day_id: number;
  order_index: number;
  place_id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  end_day: number;
  leg_transport_mode: string | null;
  incoming_leg_transport_mode: string | null;
  stop_type: string | null;
  fill_percent: number | null;
}
/**
 * A booked night as the road trip reads it: the stay, the days it spans, where it is and
 * the earliest booking linked to it. The rule reads these for the hotel at the edges of
 * the days around the night (`seatNightBookends`); get_roadtrip_context reports them as
 * they are, with the check-in beside the check-out.
 */
type StayRow = BookendStay & { check_in: string | null };
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
      `SELECT a.id, a.day_id, a.order_index, a.place_id, p.name, p.lat, p.lng,
      COALESCE(a.assignment_time, p.place_time) AS time, COALESCE(a.assignment_end_time, p.end_time) AS end_time,
      p.duration_minutes, a.end_day,
      a.leg_transport_mode, a.incoming_leg_transport_mode, p.stop_type, p.fill_percent, stay.id AS stay_id, stay.check_in, stay.check_out, checkout.day_number AS checkout_day
      FROM day_assignments a JOIN days d ON d.id = a.day_id JOIN places p ON p.id = a.place_id
      LEFT JOIN day_accommodations stay ON stay.id = (SELECT id FROM day_accommodations WHERE place_id = p.id AND start_day_id = d.id ORDER BY id LIMIT 1)
      LEFT JOIN days checkout ON checkout.id = stay.end_day_id
      WHERE d.trip_id = ? ORDER BY d.day_number, a.order_index, a.created_at`,
      tripId,
    );
    // Every stay of the trip in id order, the order the rule reads them in, so a browser
    // holding them in another order still picks the same hotel where two overlap. The
    // booking is the earliest linked one, the one the planner opens from the hotel's row.
    const stays = this.db.all<StayRow>(
      `SELECT a.id, a.place_id, a.start_day_id, a.end_day_id, a.check_in, a.check_out,
      p.name AS place_name, p.lat AS place_lat, p.lng AS place_lng,
      (SELECT MIN(r.id) FROM reservations r WHERE r.accommodation_id = a.id) AS reservation_id
      FROM day_accommodations a LEFT JOIN places p ON p.id = a.place_id
      WHERE a.trip_id = ? ORDER BY a.id`,
      tripId,
    );
    return {
      days,
      visits,
      stays,
      carriers: this.carriers(tripId),
      settings: this.preferences.read(tripId),
      profiles: this.router.profiles(),
      vias: this.roadtrip.listForTrip(tripId),
      tracks: this.roadtrip.tracksForTrip(tripId),
      boundaries: this.boundaries.list(tripId),
    };
  }

  /**
   * The bookings that seam the drive, a flight, train, ferry, cruise or bus on a day, and
   * the hire cars whose desks stand on it, with their terminals and the slots the day
   * plan gave them. The reservation service reads the same three tables for the booking
   * list; this is the road trip's own cut of them, so the module stays out of the
   * reservations graph.
   */
  private carriers(tripId: number): CarrierBooking[] {
    return this.withTerminals(
      tripId,
      this.db.all<CarrierRow>(
        `SELECT id, type, title, day_id, end_day_id, reservation_time, reservation_end_time, metadata, day_plan_position
         FROM reservations WHERE trip_id = ? AND type IN ('flight', 'train', 'ferry', 'cruise', 'bus', 'car') AND day_id IS NOT NULL`,
        tripId,
      ),
    );
  }

  /**
   * The rides the drive leaves out because they are on no day: a flight, train, ferry,
   * cruise or bus with both terminals located and no day to leave on (#2461). The map
   * draws their arcs all the same, so the answer names them rather than leaving an
   * assistant to read a drive around a booked crossing as the plan. Which ones count is
   * `undatedRides` alone, the rule the planner's rail lists them by, so the statement
   * names no types of its own.
   */
  undatedRides(tripId: number): { id: number; type: string; title: string }[] {
    const rows = this.db.all<CarrierRow>(
      `SELECT id, type, title, day_id, end_day_id, reservation_time, reservation_end_time, metadata, day_plan_position
       FROM reservations WHERE trip_id = ? AND day_id IS NULL`,
      tripId,
    );
    return undatedRides(this.withTerminals(tripId, rows)).map(({ id, type, title }) => ({ id, type, title }));
  }

  /** The rows with their terminals and the slots the day plan gave them joined on. */
  private withTerminals(tripId: number, rows: CarrierRow[]): CarrierBooking[] {
    if (!rows.length) return [];
    const endpoints = this.db.all<{
      reservation_id: number;
      role: string;
      sequence: number;
      name: string;
      code: string | null;
      lat: number;
      lng: number;
    }>(
      `SELECT e.reservation_id, e.role, e.sequence, e.name, e.code, e.lat, e.lng
       FROM reservation_endpoints e JOIN reservations r ON r.id = e.reservation_id
       WHERE r.trip_id = ? ORDER BY e.reservation_id, e.sequence`,
      tripId,
    );
    const positions = this.db.all<{ reservation_id: number; day_id: number; position: number }>(
      `SELECT p.reservation_id, p.day_id, p.position
       FROM reservation_day_positions p JOIN reservations r ON r.id = p.reservation_id WHERE r.trip_id = ?`,
      tripId,
    );
    return rows.map((row) => ({
      ...row,
      endpoints: endpoints.filter((e) => e.reservation_id === row.id),
      day_positions: Object.fromEntries(
        positions.filter((p) => p.reservation_id === row.id).map((p) => [String(p.day_id), p.position]),
      ),
    }));
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
    const seams = context.carriers.map((booking) => carrierSeam(booking)).filter((seam): seam is CarrierSeam => seam !== null);
    const dayNumberOf = (dayId: number): number => context.days.find((d) => d.id === dayId)?.day_number ?? 0;
    const stored: PlanDay[] = context.days.map((day) => {
      const visits = context.visits.filter((v) => v.day_id === day.id && v.lat !== null && v.lng !== null);
      const stops = visits.map(
        (v, index): RoadtripStop => ({
          assignmentId: v.id,
          ownerDayId: day.id,
          ownerIndex: index,
          placeId: v.place_id,
          name: v.name,
          lat: v.lat!,
          lng: v.lng!,
          time: v.time,
          // The visit's end time is when the drive leaves it, the same reading the
          // planner makes in the browser (useRoadtripRoutes).
          leaveAt: v.end_time,
          checkInTime: v.check_in,
          night: v.stay_id !== null,
          dwellMinutes: v.duration_minutes,
          endDay: v.end_day === 1,
          legMode: v.leg_transport_mode,
          incomingLegMode: v.incoming_leg_transport_mode,
          stopType: v.stop_type,
          fillPercent: v.fill_percent,
        }),
      );
      return {
        dayId: day.id,
        dayNumber: day.day_number,
        date: day.date,
        title: day.title,
        // The terminals of the day's rides, seated where the day plan shows the booking.
        stops: seatCarrierStops(
          day.id,
          stops,
          visits.map((v) => v.order_index),
          seams,
        ),
      };
    });
    // A day after a booked night starts at the stay and a day before one ends there, by
    // the rule the planner runs in the browser, and only while the trip (or the preview's
    // own settings) has it switched on. The rides go in with or without their stations,
    // the way the browser hands over its bookings. Everything below reads the seated days.
    const plan = hotelBookendsOn(preferences)
      ? seatNightBookends(stored, context.days, context.stays, context.carriers)
      : stored;
    const allLegs: Record<string, RoutedLeg> = {};
    const snapByDay: Record<number, Record<string, SnappedWaypoint>> = {};
    const missedByDay: Record<number, RouteAvoidClass[]> = {};
    const failures: { fromAssignmentId: number; toAssignmentId: number; reason: string }[] = [];
    const avoid = parseAvoid(preferences.roadtrip_avoid);
    const connectDays = preferences.roadtrip_connect_days || window !== null;
    if (context.visits.length > 150)
      throw new HttpException({ error: 'This trip exceeds the 150-visit calculation limit.' }, 400);
    const asked = new Set<string>();
    const distanceUnit: DistanceUnit =
      this.settings.getUserSettings(userId).distance_unit === 'imperial' ? 'imperial' : 'metric';
    const fetchRun = async (stops: RoadtripStop[], dayId: number, profile: string) => {
      const pairs = stops.slice(0, -1).map((from, index) => ({ from, to: stops[index + 1] }));
      pairs.forEach(({ from, to }) => asked.add(stopKey(from) + '>' + stopKey(to)));
      // A ride is no road: the leg between its terminals is the booking's minutes, and
      // the router is never asked for it.
      const rides = carrierLegsFor(
        stops,
        profile,
        (from, to) => dayNumberOf(to.ownerDayId) - dayNumberOf(from.ownerDayId),
        (from, to) => stopKey(from) + '>' + stopKey(to),
      );
      if (rides) {
        Object.assign(allLegs, rides);
        return;
      }
      const points: { lat: number; lng: number }[] = [];
      const stopAt: number[] = [];
      stops.forEach((stop, index) => {
        stopAt.push(points.length);
        points.push({ lat: stop.lat, lng: stop.lng });
        // None bend the drive from or to a booked night's hotel (`viasOnLeg`).
        if (index < stops.length - 1)
          points.push(...viasOnLeg(stop, stops[index + 1], context.vias).map((v) => ({ lat: v.lat, lng: v.lng })));
      });
      try {
        if (points.length > 100) throw new Error('Too many waypoints');
        const routed = await this.router.route(userId, tripId, dayId, points, profile, avoid);
        // Spreading the run's own seg first carried its whole-route text and
        // midpoint onto every leg of a multi-stop run: `part` only overrides the
        // metres and the seconds, so leg one of a 480 km day reported 100 km with
        // "480 km" printed beside it. The four texts and the midpoint are per leg
        // now, the way the browser has always computed them — and in the reader's
        // own unit, rather than the router's hard-coded kilometres.
        const legs = routed.parts.map((part, index) => {
          const from = [points[index].lat, points[index].lng] as [number, number];
          const to = [points[index + 1].lat, points[index + 1].lng] as [number, number];
          const durationText = formatDurationShort(part.duration);
          return {
            ...routed.leg.seg,
            ...part,
            from,
            to,
            mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2] as [number, number],
            distanceText: formatDistance(part.distance / 1000, distanceUnit),
            durationText,
            drivingText: durationText,
            walkingText: durationText,
          };
        });
        Object.assign(
          allLegs,
          foldRouteRun(stops, stopAt, { coordinates: routed.leg.line, legs, vias: routed.leg.vias }, profile, distanceUnit),
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
        // A night spent at one hotel is no drive, and no router is asked about it.
        if (isStationaryJoin(from, to) || asked.has(stopKey(from) + '>' + stopKey(to))) continue;
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
      plan: plan.filter((d) => standsAsDay(d.stops)),
      quietDays: plan.filter((d) => !standsAsDay(d.stops)),
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
      distanceUnit,
      labels: { start: 'Continue journey', end: 'End of day' },
    });
    return {
      context,
      preferences,
      calculated,
      failures,
      omittedVisits: context.visits.filter((v) => v.lat === null || v.lng === null).map((v) => v.id),
      undatedRides: this.undatedRides(tripId),
    };
  }
}
