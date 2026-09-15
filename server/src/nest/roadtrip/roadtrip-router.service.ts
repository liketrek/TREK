import { readCappedJson, discardBody } from '../../utils/cappedFetch';
import { safeFetchAdminConfigured } from '../../utils/ssrfGuard';
import { DatabaseService } from '../database/database.service';
import { normalize, declaredProfiles } from '../plugins/contributions/plugin-route-normalize';
import { pluginsEnabled } from '../plugins/kill-switch';
import { PluginHooks } from '../plugins/plugin-hooks.service';
import { SettingsService } from '../settings/settings.service';
import { Injectable } from '@nestjs/common';
import {
  formatDurationShort,
  haversineKm,
  type RoutedLeg,
  type RouteAvoidClass,
  type SnappedWaypoint,
} from '@trek/shared/roadtrip';

import { z } from 'zod';

const coordinate = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const osrmSchema = z.object({
  code: z.literal('Ok'),
  routes: z
    .array(
      z.object({
        distance: z.number().nonnegative(),
        duration: z.number().nonnegative(),
        legs: z
          .array(z.object({ distance: z.number().nonnegative(), duration: z.number().nonnegative() }))
          .min(1)
          .max(99),
        geometry: z.object({ coordinates: z.array(coordinate).min(2).max(200000) }),
      }),
    )
    .min(1),
  waypoints: z.array(z.object({ location: coordinate, distance: z.number().nonnegative() })).optional(),
});
const valhallaSchema = z.object({
  trip: z.object({
    legs: z
      .array(
        z.object({
          shape: z.string().max(2000000),
          summary: z.object({
            length: z.number().nonnegative(),
            time: z.number().nonnegative(),
            has_toll: z.boolean().optional(),
            has_highway: z.boolean().optional(),
            has_ferry: z.boolean().optional(),
          }),
        }),
      )
      .min(1)
      .max(99),
  }),
});
type Point = { lat: number; lng: number };
export interface RoadtripRoute {
  leg: RoutedLeg;
  parts: { distance: number; duration: number }[];
  snapped?: SnappedWaypoint[];
  avoidMissed: RouteAvoidClass[];
}

function decode(shape: string): [number, number][] {
  const line: [number, number][] = [];
  let index = 0,
    lat = 0,
    lng = 0;
  while (index < shape.length) {
    const pair: number[] = [];
    for (let axis = 0; axis < 2; axis++) {
      let value = 0,
        shift = 0,
        byte: number;
      do {
        if (index >= shape.length || shift > 30) throw new Error('Invalid route geometry');
        byte = shape.charCodeAt(index++) - 63;
        if (byte < 0 || byte > 63) throw new Error('Invalid route geometry');
        value |= (byte & 31) << shift;
        shift += 5;
      } while (byte >= 32);
      pair.push(value & 1 ? ~(value >> 1) : value >> 1);
    }
    lat += pair[0];
    lng += pair[1];
    coordinate.parse([lng / 1e6, lat / 1e6]);
    line.push([lat / 1e6, lng / 1e6]);
  }
  if (line.length < 2) throw new Error('Invalid route geometry');
  return line;
}

@Injectable()
export class RoadtripRouterService {
  private nextRequest = 0;
  private queue: Promise<void> = Promise.resolve();
  private cache = new Map<string, { at: number; route: RoadtripRoute }>();

  constructor(
    private readonly settings: SettingsService,
    private readonly hooks: PluginHooks,
    private readonly db: DatabaseService,
  ) {}

  profiles(): string[] {
    return [
      'driving',
      'walking',
      'cycling',
      ...(pluginsEnabled()
        ? this.hooks
            .providersOf('routeProvider')
            .flatMap((id) => declaredProfiles(this.db.connection, id).map((profile) => `plugin:${id}/${profile}`))
        : []),
    ];
  }

  private async request(url: string, body?: unknown): Promise<unknown> {
    const before = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await before;
    try {
      const delay = this.nextRequest - Date.now();
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      this.nextRequest = Date.now() + 1100;
      const response = await safeFetchAdminConfigured(url, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'TREK Roadtrip', 'Content-Type': 'application/json', 'X-Client-Id': 'trek' },
        ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
      });
      if (!response.ok) {
        discardBody(response);
        throw new Error(`Routing provider returned ${response.status}`);
      }
      const payload = await readCappedJson<unknown>(response, 8 * 1024 * 1024);
      if (payload === undefined) throw new Error('Routing response is invalid or too large');
      return payload;
    } finally {
      release();
    }
  }

  async route(
    userId: number,
    tripId: number,
    dayId: number,
    points: Point[],
    profile: string,
    avoid: RouteAvoidClass[],
  ): Promise<RoadtripRoute> {
    const settings = this.settings.getUserSettings(userId);
    const key = JSON.stringify([
      userId,
      tripId,
      dayId,
      points,
      profile,
      avoid,
      settings.routing_base_url,
      settings.valhalla_base_url,
    ]);
    const cached = this.cache.get(key);
    if (!profile.startsWith('plugin:') && cached && Date.now() - cached.at < 300000) return cached.route;
    let line: [number, number][], distance: number, duration: number;
    let parts: { distance: number; duration: number }[];
    let vias: RoutedLeg['vias'] = [];
    let avoidMissed = profile === 'driving' ? [...avoid] : [];
    let snapped: SnappedWaypoint[] | undefined;
    const plugin = /^plugin:([^/]+)\/(.+)$/.exec(profile);
    if (plugin) {
      const [, id, name] = plugin;
      if (
        points.length > 30 ||
        !pluginsEnabled() ||
        !this.hooks.providersOf('routeProvider').includes(id) ||
        !declaredProfiles(this.db.connection, id).includes(name)
      )
        throw new Error('Routing plugin is unavailable or has too many waypoints');
      const raw = await this.hooks.route(id, { tripId, dayId, profile: name, waypoints: points }, userId);
      const route = normalize(id, name, points.length, raw);
      if (!route) throw new Error('Routing plugin could not calculate this leg');
      line = route.coordinates;
      distance = route.distance;
      duration = route.duration;
      vias = route.viaPoints;
      parts = route.legs;
    } else {
      const mode = profile === 'walking' || profile === 'cycling' ? profile : 'driving';
      const base =
        typeof settings.routing_base_url === 'string' ? settings.routing_base_url.trim().replace(/\/+$/, '') : '';
      const configuredValhalla =
        typeof settings.valhalla_base_url === 'string' ? settings.valhalla_base_url.trim().replace(/\/+$/, '') : '';
      const valhalla = configuredValhalla || (base ? '' : 'https://valhalla1.openstreetmap.de');
      let weighted = false;
      if (mode === 'driving' && avoid.length && valhalla) {
        try {
          const options = {
            use_tolls: avoid.includes('toll') ? 0 : 1,
            use_highways: avoid.includes('motorway') ? 0 : 1,
            use_ferry: avoid.includes('ferry') ? 0 : 1,
          };
          const legs: z.infer<typeof valhallaSchema>['trip']['legs'] = [];
          for (let start = 0; start < points.length - 1; start += 9) {
            const payload = await this.request(`${valhalla}/route`, {
              locations: points.slice(start, start + 10).map((p) => ({ lat: p.lat, lon: p.lng, radius: 50 })),
              costing: 'auto',
              costing_options: { auto: options },
              directions_options: { units: 'kilometers' },
            });
            legs.push(...valhallaSchema.parse(payload).trip.legs);
          }
          if (legs.length !== points.length - 1) throw new Error('Routing response has mismatched legs');
          const shapes = legs.map((leg) => decode(leg.shape));
          line = shapes.flat();
          const locations = [...shapes.map((shape) => shape[0]), shapes[shapes.length - 1].at(-1)!];
          snapped = locations.map(([lat, lng], index) => ({
            asked: [points[index].lat, points[index].lng],
            at: [lat, lng],
            meters: haversineKm(points[index], { lat, lng }) * 1000,
          }));
          distance = legs.reduce((sum, leg) => sum + leg.summary.length * 1000, 0);
          duration = legs.reduce((sum, leg) => sum + leg.summary.time, 0);
          parts = legs.map((leg) => ({ distance: leg.summary.length * 1000, duration: leg.summary.time }));
          avoidMissed = avoid.filter((cls) =>
            legs.some((leg) =>
              cls === 'toll'
                ? leg.summary.has_toll
                : cls === 'motorway'
                  ? leg.summary.has_highway
                  : leg.summary.has_ferry,
            ),
          );
          weighted = true;
        } catch {
          avoidMissed = [...avoid];
          snapped = undefined;
        }
      }
      if (!weighted) {
        const path = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'driving';
        const origin =
          base ||
          `https://routing.openstreetmap.de/routed-${mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'car'}`;
        const payload = await this.request(
          `${origin}/route/v1/${path}/${points.map((p) => `${p.lng},${p.lat}`).join(';')}?overview=full&geometries=geojson&steps=false`,
        );
        const parsed = osrmSchema.parse(payload);
        const route = parsed.routes[0];
        line = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        distance = route.distance;
        duration = route.duration;
        parts = route.legs;
        if (parsed.waypoints?.length === points.length)
          snapped = parsed.waypoints.map((waypoint, index) => ({
            asked: [points[index].lat, points[index].lng],
            at: [waypoint.location[1], waypoint.location[0]],
            meters: waypoint.distance,
          }));
      }
    }
    const from = line[0],
      to = line[line.length - 1];
    const durationText = formatDurationShort(duration);
    const distanceText = `${Math.round(distance / 100) / 10} km`;
    if (parts.length !== points.length - 1) throw new Error('Routing response has mismatched legs');
    const route = {
      parts,
      snapped,
      leg: {
        line,
        vias,
        seg: {
          from,
          to,
          mid: line[Math.floor(line.length / 2)],
          distance,
          duration,
          durationText,
          distanceText,
          drivingText: durationText,
          walkingText: durationText,
          mode: profile,
        },
        snapped: {
          from: {
            lat: from[0],
            lng: from[1],
            offRoadMeters: haversineKm(points[0], { lat: from[0], lng: from[1] }) * 1000,
          },
          to: {
            lat: to[0],
            lng: to[1],
            offRoadMeters: haversineKm(points[points.length - 1], { lat: to[0], lng: to[1] }) * 1000,
          },
        },
      },
      avoidMissed,
    };
    this.cache.set(key, { at: Date.now(), route });
    if (this.cache.size > 100) this.cache.delete(this.cache.keys().next().value!);
    return route;
  }
}
