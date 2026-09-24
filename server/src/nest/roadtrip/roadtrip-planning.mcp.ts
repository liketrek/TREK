import { ADDON_IDS } from '../../addons';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, errorResult, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { RoadtripSearchService } from './roadtrip-search.service';
import { RoadtripPlanService } from './roadtrip-plan.service';
import {
  roadtripPlanRequestSchema,
  roadtripCorridorRequestSchema,
  type RoadtripPlanRequest,
  type RoadtripCorridorRequest,
} from '@trek/shared';
import {
  corridorTiles,
  drivenPieces,
  inRiddenRange,
  projectOntoRoute,
  rideGaps,
  riddenRanges,
  simplifyLine,
} from '@trek/shared/roadtrip';
import { answeringRefusals } from './roadtrip-mcp.helpers';

import { z } from 'zod';

const when = addonGate(ADDON_IDS.ROADTRIP);

@McpController()
export class RoadtripPlanningMcp {
  constructor(
    private readonly plans: RoadtripPlanService,
    private readonly maps: RoadtripSearchService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'get_roadtrip_context',
    description:
      'Read the saved roadtrip days, visits, pinned times, end times (when the drive leaves a visit), stays, stop types, fill levels, travel modes, via points, followed tracks, manual day endings and the carrier bookings (flight, train, ferry, cruise, bus) that seam the drive at their terminals, plus the hire cars whose pick-up and return desks stand on it. stays lists every booked stay with its check-in and check-out day, its place and the earliest linked reservation (reservation_id). Includes the shared driving preferences for this trip. No routing request and no browser needed. Coordinates missing from a visit prevent it from being routed. Use calculate_roadtrip to get the derived day layout. Edit visits with the existing place and assignment tools; change their saved order with reorder_day_assignments. Settings, visits and manual boundaries all belong to the shared trip.',
    inputSchema: { tripId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when,
  })
  async context({ tripId }: { tripId: number }, ctx: McpContext) {
    return answeringRefusals(() => ok(this.plans.context(tripId, ctx.userId)));
  }

  @Tool({
    name: 'calculate_roadtrip',
    description:
      'Calculate a saved trip without an open browser, using the same daily scheduling and vehicle-range rules as the planner. Returns derived days, arrivals, departures, driving limits, fuel warnings, automatic pauses and routing failures. A flight, train, ferry, cruise or bus booking with located terminals is a seam: its terminals appear as stops carrying `carrier` (role departure or arrival), the road ends at the departure terminal and resumes at the arrival one, and the leg between them is the ride, in the mode of the booking type, with its timetable minutes and no distance. The departure terminal is pinned a check-in ahead of the timetable departure (an hour for a flight); reaching it after that is a late warning with the full minutes, however many, and the ride keeps its own day, so the drive after the arrival terminal goes on from the timetable arrival. On a day a ride leaves and lands on, the stop of a stay checked into that day comes after the arrival terminal when the stay lies nearer to it than to the departure terminal: a check-in is the earliest arrival, not a time that seats the stay ahead of the ride, and it pins the stay only when the ride lands before it. A time set on the stop itself keeps its seat. A hire car booking with a located pick-up desk puts that desk on the road as a stop carrying `carrier` with role pickup, and its return desk with role return when the booking names a return day and place; the road runs through both. A flight, train, ferry, cruise or bus booking that is on none of the days of the trip (saved without a date, or on a day the trip no longer has) is not on the drive at all, although its terminals are located: undatedRides lists each one (id, type, title) so it can be given a date within the trip with the reservation tools, after which the road ends at its terminal. With roadtrip_hotel_bookends switched on (missing means off), a day after a booked night starts at that stay and a day before one ends there. Such stops carry `bookend` {phase, accommodationId, reservationId, checkingOut, checkingIn, checkOut, and checkIn on the evening a stay begins when it has a check-in time}, stopType hotel, the real placeId of the stay and a synthetic negative assignmentId that belongs to no assignment: they cannot be reordered, edited or given via points, and `failures` may name them. The check-out and check-in are labels, never a departure or arrival time. A day between two nights in the same stay with no visit has no drive. Nor does a day with nothing on it but the check-in of the next stay when a flight, train, ferry, cruise or bus is booked on that day, with or without located terminals: the booking is the move between the two stays. A stay is never joined by road to a terminal more than 2000 km away in a straight line. Pass settings {roadtrip_hotel_bookends:true} to preview the drive from and to the stays without saving it. Fixed visit times retain priority. The end time of a visit is when the drive leaves it, in place of its stay; reaching the visit after it is reported as a missedLeave warning. No accommodation or place is created. Optional settings are a read-only preview, not saved. Distances are metres, durations seconds, dwell times minutes. A failed leg or conflicting window means the output is incomplete: never present its totals as a complete route. Up to 150 legs; requests are paced for public routing servers and can take time. Existing place/assignment tools edit stops, stays and ordering, update_roadtrip_settings saves preferences, set_assignment_end_day and set_day_boundary set exceptions. Recalculate after changes. Plugin profiles follow installed route-provider permissions.',
    inputSchema: roadtripPlanRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when,
  })
  async calculate(input: RoadtripPlanRequest, ctx: McpContext) {
    return answeringRefusals(async () => {
      const plan = await this.plans.calculate(input.tripId, ctx.userId, input.settings);
      const { calculated } = plan;
      return ok({
        complete: !plan.failures.length && !plan.omittedVisits.length && !calculated.dayWindowIssue,
        settings: plan.preferences,
        failures: plan.failures,
        omittedVisitIds: plan.omittedVisits,
        undatedRides: plan.undatedRides,
        dayWindowIssue: calculated.dayWindowIssue,
        totalDistanceMetres: calculated.totalDistance,
        totalDurationSeconds: calculated.totalDuration,
        totalStops: calculated.totalStops,
        days: calculated.days.map((day) => ({
          dayId: day.dayId,
          dayNumber: day.dayNumber,
          date: day.date,
          title: day.title,
          stops: day.stops,
          schedule: day.schedule,
          legs: day.legs,
          distanceMetres: day.distance,
          durationSeconds: day.duration,
          driveWarnings: day.driveWarnings,
          dayWarning: day.dayWarning,
          avoidMissed: day.avoidMissed,
          dryPoints: day.dryPoints,
          ...(input.includeGeometry ? { geometry: day.geometry } : {}),
        })),
        quietDays: calculated.quietDays,
      });
    });
  }

  @Tool({
    name: 'search_roadtrip_corridor',
    description:
      'Search for fuel, charging, rest areas, campsites, food, sights or accommodation along a calculated roadtrip day, without a browser. Uses the routed road, not a straight line, and leaves out the ride between the two terminals of a flight, train, ferry, cruise or bus booking: no rectangle is searched under it and nothing found there is a hit. Returns distance along the route and distance from it. Search rectangles are paged in batches of six; continue with nextOffset until null for full coverage. Optional name, socket family and minimum power filter the matches; missing charging details mean unknown. Does not add stops. Add a chosen place and assign it to the appropriate stored day, preserving any via anchors. With roadtrip_hotel_bookends on, the road of the day includes the drive from the stay slept in and to the stay of that night; a place found there belongs at the start or the end of the stored day. Routing failures refuse the corridor search rather than searching an invented line.',
    inputSchema: roadtripCorridorRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when,
  })
  async corridor(input: RoadtripCorridorRequest, ctx: McpContext) {
    return answeringRefusals(async () => {
      const plan = await this.plans.calculate(input.tripId, ctx.userId);
      if (plan.failures.length || plan.omittedVisits.length || plan.calculated.dayWindowIssue)
        return errorResult(
          'Resolve missing coordinates, routing or day-window conflicts before searching this corridor.',
        );
      if (input.fromKm != null && input.toKm != null && input.fromKm > input.toKm)
        return errorResult('fromKm must not exceed toKm.');
      const day = plan.calculated.days.find((d) => d.dayNumber === input.dayNumber);
      if (!day?.geometry.length) return errorResult('This day has no routed road.');
      const line = simplifyLine(
        day.geometry.map(([lat, lng]) => ({ lat, lng })),
        Math.max(1, input.widthKm / 3),
      );
      // The line jumps straight from a departure terminal to its arrival, and the car is
      // not on that stretch: nothing under it is tiled or on the way (#2428).
      const ridden = riddenRanges(line, rideGaps(day.stops));
      const tiles = drivenPieces(line, ridden).flatMap((piece) => corridorTiles(piece, input.widthKm));
      const hits = new Map<
        string,
        { poi: Awaited<ReturnType<RoadtripSearchService['search']>>['pois'][number]; alongKm: number; distanceKm: number }
      >();
      const page = tiles.slice(input.offset, input.offset + 6);
      const failedAreas: number[] = [];
      let truncatedAreas = 0;
      const sources = new Set<string>();
      const failedSources = new Set<string>();
      for (const bbox of page) {
        try {
          const found = await this.maps.search({ categories: [input.category], bbox }, ctx.userId);
          found.sources.forEach(source => sources.add(source));
          found.failedSources.forEach(source => failedSources.add(source));
          if (found.truncated || found.clamped) truncatedAreas++;
          for (const poi of found.pois) {
            const projection = projectOntoRoute(poi, line);
            if (!projection || projection.offRouteKm > input.widthKm || inRiddenRange(ridden, projection.alongKm))
              continue;
            if (
              (input.fromKm != null && projection.alongKm < input.fromKm) ||
              (input.toKm != null && projection.alongKm > input.toKm)
            )
              continue;
            if (
              input.name &&
              !`${poi.name} ${poi.brand ?? ''}`.toLocaleLowerCase().includes(input.name.toLocaleLowerCase())
            )
              continue;
            if (poi.category === 'charging') {
              if (input.socket && !poi.charging?.sockets.some((socket) => socket.type === input.socket)) continue;
              if (
                input.minKw &&
                poi.charging?.sockets.some((socket) => socket.kw != null) &&
                !poi.charging.sockets.some((socket) => (socket.kw ?? 0) >= input.minKw!)
              )
                continue;
            }
            hits.set(poi.osm_id, { poi, alongKm: projection.alongKm, distanceKm: projection.offRouteKm });
          }
        } catch {
          failedAreas.push(input.offset + page.indexOf(bbox));
        }
      }
      return ok({
        dayNumber: day.dayNumber,
        sources: [...sources],
        failedSources: [...failedSources],
        complete: !failedSources.size && !failedAreas.length && !truncatedAreas && input.offset + page.length >= tiles.length,
        failedAreas,
        truncatedAreas,
        totalAreas: tiles.length,
        hits: [...hits.values()].sort((a, b) => a.alongKm - b.alongKm),
        nextOffset: input.offset + page.length < tiles.length ? input.offset + page.length : null,
      });
    });
  }
}
