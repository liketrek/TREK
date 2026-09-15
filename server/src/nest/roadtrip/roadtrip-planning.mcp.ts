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
import { corridorTiles, projectOntoRoute, simplifyLine } from '@trek/shared/roadtrip';

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
      'Read the saved roadtrip days, visits, pinned times, stays, stop types, fill levels, travel modes, via points, followed tracks and manual day endings. Includes the shared driving preferences for this trip. No routing request and no browser needed. Coordinates missing from a visit prevent it from being routed. Use calculate_roadtrip to get the derived day layout. Edit visits with the existing place and assignment tools; change their saved order with reorder_day_assignments. Settings, visits and manual boundaries all belong to the shared trip.',
    inputSchema: { tripId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when,
  })
  async context({ tripId }: { tripId: number }, ctx: McpContext) {
    return ok(this.plans.context(tripId, ctx.userId));
  }

  @Tool({
    name: 'calculate_roadtrip',
    description:
      'Calculate a saved trip without an open browser, using the same daily scheduling and vehicle-range rules as the planner. Returns derived days, arrivals, departures, driving limits, fuel warnings, automatic pauses and routing failures. Fixed visit times retain priority; no accommodation or place is created. Optional settings are a read-only preview, not saved. Distances are metres, durations seconds, dwell times minutes. A failed leg or conflicting window means the output is incomplete: never present its totals as a complete route. Up to 150 legs; requests are paced for public routing servers and can take time. Existing place/assignment tools edit stops, stays and ordering, update_roadtrip_settings saves preferences, set_assignment_end_day and set_day_boundary set exceptions. Recalculate after changes. Plugin profiles follow installed route-provider permissions.',
    inputSchema: roadtripPlanRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when,
  })
  async calculate(input: RoadtripPlanRequest, ctx: McpContext) {
    const plan = await this.plans.calculate(input.tripId, ctx.userId, input.settings);
    const { calculated } = plan;
    return ok({
      complete: !plan.failures.length && !plan.omittedVisits.length && !calculated.dayWindowIssue,
      settings: plan.preferences,
      failures: plan.failures,
      omittedVisitIds: plan.omittedVisits,
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
  }

  @Tool({
    name: 'search_roadtrip_corridor',
    description:
      'Search for fuel, charging, rest areas, campsites, food, sights or accommodation along a calculated roadtrip day, without a browser. Uses the routed road, not a straight line. Returns distance along the route and distance from it. Search rectangles are paged in batches of six; continue with nextOffset until null for full coverage. Optional name, socket family and minimum power filter the matches; missing charging details mean unknown. Does not add stops. Add a chosen place and assign it to the appropriate stored day, preserving any via anchors. Routing failures refuse the corridor search rather than searching an invented line.',
    inputSchema: roadtripCorridorRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when,
  })
  async corridor(input: RoadtripCorridorRequest, ctx: McpContext) {
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
    const tiles = corridorTiles(line, input.widthKm);
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
          if (!projection || projection.offRouteKm > input.widthKm) continue;
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
  }
}
