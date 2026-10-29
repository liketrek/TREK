import { Plugins } from '../../db/entities/Plugins.entity';
import type { PluginsRepository } from '../../db/repositories/Plugins.repository';
import { readCappedJson, discardBody } from '../../utils/cappedFetch';
import { safeFetchAdminConfigured } from '../../utils/ssrfGuard';
import { logWarn } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { normalize, declaredProfiles } from '../plugins/contributions/plugin-route-normalize';
import { pluginsEnabled } from '../plugins/kill-switch';
import { PluginHooks } from '../plugins/plugin-hooks.service';
import { RoutingRelayService, type ValhallaRelayAnswer } from '../routing-relay/routing-relay.service';
import { SettingsService } from '../settings/settings.service';
import {
  HEIGHT_CHUNK_SIZE,
  heightBody,
  heightsOf,
  TRACE_TIMEOUT_MS,
  traceBody,
  tracedWaysOf,
  type TracedWay,
} from './valhalla-hike.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  resolveValhallaProvider,
  VALHALLA_COSTING,
  VALHALLA_RELAY_MAX_LOCATIONS,
  valhallaRoutesEveryDay,
  type GeometryPoint,
  type ValhallaCosting,
  type ValhallaProvider,
  type ValhallaRelayAction,
} from '@trek/shared';
import {
  formatDurationShort,
  haversineKm,
  type RoutedLeg,
  type RouteAvoidClass,
  type SnappedWaypoint,
} from '@trek/shared/roadtrip';

import { createHash } from 'node:crypto';
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
          .array(
            z.object({
              distance: z.number().nonnegative(),
              duration: z.number().nonnegative(),
              // CW-12: asked only for a walk on foot, to tell a crossing by boat (`mode` ferry) apart.
              steps: z
                .array(z.object({ mode: z.string().max(32).optional() }))
                .max(20000)
                .optional(),
            }),
          )
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
          // CW-12: where a walk on foot boards a ferry (type 28, or `ferry` on the crossing).
          maneuvers: z
            .array(z.object({ type: z.number().optional(), ferry: z.boolean().optional() }))
            .max(20000)
            .optional(),
        }),
      )
      .min(1)
      .max(99),
  }),
});
type Point = { lat: number; lng: number };
/** A Valhalla answer that asked for alternates: its own way, then each other way it offers. */
const alternatesSchema = valhallaSchema.extend({ alternates: z.array(valhallaSchema).max(5).optional() });
export interface RoadtripRoute {
  leg: RoutedLeg;
  parts: { distance: number; duration: number }[];
  snapped?: SnappedWaypoint[];
  avoidMissed: RouteAvoidClass[];
  /** CW-12: on a way asked on foot only, the legs (counted from 0) that still cross by boat. */
  ferryLegs?: number[];
}

/** How a route is asked for besides its profile. */
export interface RouteOptions {
  /**
   * CW-12: a way that is walked: no point bound to a ferry's edge, ferries
   * avoided wherever a way on land exists, and the legs that still cross by
   * boat said. A city walk asks this; a road trip day never does.
   */
  footOnly?: boolean;
  /**
   * A tour's own costing, sent to Valhalla as the planner in the browser
   * sends it: on foot a hike's (its hiking limit and preferences, as
   * `hikingCosting` builds them) or a run's (`runCosting`), by bike the
   * bicycle costing of its profile (`bikeCosting`). Only Valhalla knows these:
   * OSRM's foot profile takes a T5 ridge as readily as a forest road, and its
   * bike profile knows no road bike from a mountain bike. So a way asked with
   * one is asked of Valhalla alone and fails rather than fall back to OSRM,
   * with a `RouteRefusal` of `no_valhalla` where there is no Valhalla to ask.
   */
  costingOptions?: Readonly<Record<string, number | string>>;
}

export type { TracedWay };

/**
 * Why a route asked of Valhalla has none, as opposed to a router that did not
 * answer: no Valhalla to ask (an own OSRM without one), Valhalla's own word
 * that no way joins the points (`no_way`: points in regions no edge connects,
 * a point with no edge near it, or no path between them, within the hiking
 * limit where one was asked), or that the way is longer than it plans for
 * one costing (`too_long`). Asking again gives the same answer.
 */
export class RouteRefusal extends Error {
  constructor(
    readonly why: 'no_valhalla' | 'no_way' | 'too_long',
    message: string,
  ) {
    super(message);
    this.name = 'RouteRefusal';
  }
}

/**
 * Valhalla's refusals that are about the way rather than the host: locations
 * in regions no edge connects (170), no edge near a location (171), no path
 * (442), and a way past the instance's distance limit for the costing (154).
 */
const REFUSAL_CODES: ReadonlyMap<number, 'no_way' | 'too_long'> = new Map([
  [154, 'too_long'],
  [170, 'no_way'],
  [171, 'no_way'],
  [442, 'no_way'],
]);
const refusalSchema = z.object({ error_code: z.number() });
/** The most of a refusal's body that is read to tell which one it is. */
const REFUSAL_MAX_BYTES = 64 * 1024;

/** Valhalla's word in a router's 400 that the way cannot be had, or null where the 400 says something else. */
function refusalIn(payload: unknown): 'no_way' | 'too_long' | null {
  const refusal = refusalSchema.safeParse(payload);
  return refusal.success ? (REFUSAL_CODES.get(refusal.data.error_code) ?? null) : null;
}

async function refusalOf(response: Response): Promise<'no_way' | 'too_long' | null> {
  return refusalIn(await readCappedJson(response, REFUSAL_MAX_BYTES));
}

/** The public Valhalla FOSSGIS runs, which TREK ships with. */
const FOSSGIS_VALHALLA = 'https://valhalla1.openstreetmap.de';
/** Locations one request to FOSSGIS may carry; the eleventh is refused with error 150. */
const FOSSGIS_MAX_LOCATIONS = 10;

/**
 * What the relay says when it cannot answer for the TREK services right now:
 * no key, an allowance spent, a body it does not take, a path the host does
 * not know, a host that is down or resting. The question then goes to
 * FOSSGIS, as the planner in the browser sends it.
 */
function relayCannotAnswer(status: number): boolean {
  return [401, 403, 404, 405, 413, 429].includes(status) || status >= 500;
}

/** The relay's answer read as the queue reads a router's: the payload, a refusal, or a failure. */
function payloadOf(answer: ValhallaRelayAnswer): unknown {
  let payload: unknown;
  try {
    payload = JSON.parse(answer.body.toString('utf8'));
  } catch {
    payload = undefined;
  }
  if (answer.status === 400) {
    const why = refusalIn(payload);
    if (why) throw new RouteRefusal(why, 'Routing provider returned 400');
  }
  if (answer.status < 200 || answer.status >= 300) throw new Error(`Routing provider returned ${answer.status}`);
  if (payload === undefined) throw new Error('Routing response is invalid or too large');
  return payload;
}

/** How often a piece of a line whose heights could not be read is asked again, as the planner asks a route again. */
const HEIGHT_RETRIES = 1;
/** How long a line's heights are kept, as long as a route is: a proposal and the hike created from it ask once. */
const HEIGHTS_TTL_MS = 300_000;
/** The most lines whose heights are kept; a line of ten thousand points keeps that many numbers. */
const HEIGHTS_CACHE_MAX = 20;

/** The heights of a line kept under: who asked, the Valhalla asked, and the line itself as a digest. */
function heightsKey(userId: number, valhalla: string, line: ReadonlyArray<readonly [number, number]>): string {
  const digest = createHash('sha256').update(JSON.stringify(line)).digest('hex');
  return `${userId} ${valhalla} ${digest}`;
}

/**
 * The routers a user's settings name: their own OSRM (blank for the public
 * hosts), the Valhalla to ask, if any, chosen as the browser chooses it
 * (`valhallaBase`), and whether that Valhalla routes every day rather than
 * only what OSRM cannot (`everyDay`, the TREK services or an own one).
 * `trekValhalla` is the TREK services' Valhalla while it can be asked.
 */
function routersOf(
  settings: Record<string, unknown>,
  trekValhalla: string | null,
): { base: string; valhalla: string; everyDay: boolean } {
  const base =
    typeof settings.routing_base_url === 'string' ? settings.routing_base_url.trim().replace(/\/+$/, '') : '';
  const configuredValhalla =
    typeof settings.valhalla_base_url === 'string' ? settings.valhalla_base_url.trim().replace(/\/+$/, '') : '';
  const provider = resolveValhallaProvider({
    provider: settings.routing_valhalla_provider,
    valhallaUrl: configuredValhalla,
    routingUrl: base,
    trekAvailable: trekValhalla !== null,
  });
  const valhallaOf: Record<ValhallaProvider, string> = {
    custom: configuredValhalla,
    trek: trekValhalla ?? FOSSGIS_VALHALLA,
    fossgis: FOSSGIS_VALHALLA,
  };
  return { base, valhalla: provider ? valhallaOf[provider] : '', everyDay: valhallaRoutesEveryDay(provider) };
}

/** How a question to Valhalla is asked besides its body. */
interface ValhallaAsk {
  timeoutMs?: number;
  /**
   * Whether FOSSGIS answers where the relay cannot, as it does for what only
   * Valhalla can answer. A day OSRM would otherwise route is not handed to it:
   * the question fails instead, and OSRM routes the day.
   */
  publicFallback?: boolean;
}

/** Valhalla's maneuver type for boarding a ferry. */
const FERRY_ENTER = 28;

type ValhallaLegs = z.infer<typeof valhallaSchema>['trip']['legs'];

/** Whether a walked leg still crosses by boat (CW-12). */
function crossesByBoat(leg: ValhallaLegs[number]): boolean {
  return (
    leg.summary.has_ferry === true ||
    (leg.maneuvers ?? []).some((maneuver) => maneuver.ferry === true || maneuver.type === FERRY_ENTER)
  );
}

/** Valhalla's legs as a route: the line, its length and time, a part per leg, and where each point met a way. */
function routeOfLegs(points: Point[], legs: ValhallaLegs) {
  const shapes = legs.map((leg) => decode(leg.shape));
  const locations = [...shapes.map((shape) => shape[0]), shapes[shapes.length - 1].at(-1)!];
  return {
    line: shapes.flat(),
    distance: legs.reduce((sum, leg) => sum + leg.summary.length * 1000, 0),
    duration: legs.reduce((sum, leg) => sum + leg.summary.time, 0),
    parts: legs.map((leg) => ({ distance: leg.summary.length * 1000, duration: leg.summary.time })),
    snapped: locations.map(([lat, lng], index): SnappedWaypoint => ({
      asked: [points[index].lat, points[index].lng],
      at: [lat, lng],
      meters: haversineKm(points[index], { lat, lng }) * 1000,
    })),
  };
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
  private heightsCache = new Map<string, { at: number; heights: Array<number | null> }>();

  constructor(
    private readonly settings: SettingsService,
    private readonly hooks: PluginHooks,
    @InjectRepository(Plugins) private readonly plugins: PluginsRepository,
    private readonly relay: RoutingRelayService,
  ) {}

  async profiles(): Promise<string[]> {
    const plugin: string[] = [];
    if (pluginsEnabled()) {
      // R1.4: a `flatMap` callback cannot await the now-async profile read, so the
      // fan-out runs as an explicit loop — same providers, same order.
      for (const id of this.hooks.providersOf('routeProvider')) {
        // RRT1 — `plugins` is Plan 3j's table; `declaredProfiles` now converted (Task 3).
        for (const profile of await declaredProfiles(this.plugins, id)) plugin.push(`plugin:${id}/${profile}`); // Plan 3j
      }
    }
    return ['driving', 'walking', 'cycling', ...plugin];
  }

  private async request(url: string, body?: unknown, timeoutMs = 20000): Promise<unknown> {
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
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'User-Agent': 'TREK Roadtrip', 'Content-Type': 'application/json', 'X-Client-Id': 'trek' },
        ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
      });
      if (!response.ok) {
        // A 400 from Valhalla says why: a way that does not exist is no failure of the host.
        if (response.status !== 400) discardBody(response);
        else {
          const why = await refusalOf(response);
          if (why) throw new RouteRefusal(why, 'Routing provider returned 400');
        }
        throw new Error(`Routing provider returned ${response.status}`);
      }
      const payload = await readCappedJson<unknown>(response, 8 * 1024 * 1024);
      if (payload === undefined) throw new Error('Routing response is invalid or too large');
      return payload;
    } finally {
      release();
    }
  }

  /**
   * One question to a Valhalla. The TREK services' one is asked through the
   * relay, under the user's allowance there and with the installation key; a
   * relay that cannot answer hands the question to FOSSGIS through the paced
   * queue, unless `publicFallback` is off. Every other Valhalla is asked
   * through the queue directly.
   */
  private async askValhalla(
    userId: number,
    valhalla: string,
    action: ValhallaRelayAction,
    body: object,
    { timeoutMs, publicFallback = true }: ValhallaAsk = {},
  ): Promise<unknown> {
    if (!this.relay.serves(valhalla)) return this.request(`${valhalla}/${action}`, body, timeoutMs);
    const answer = await this.relay.ask(userId, action, body, timeoutMs).catch((err: unknown) => {
      if (err instanceof DomainError) return null;
      throw err;
    });
    if (answer && !relayCannotAnswer(answer.status)) return payloadOf(answer);
    if (!publicFallback) throw new Error('The TREK routing service cannot answer');
    return this.request(`${FOSSGIS_VALHALLA}/${action}`, body, timeoutMs);
  }

  /**
   * Locations one route request carries: ten wherever it may end up at
   * FOSSGIS, twenty at the TREK Valhalla asked alone and at an own one, as the
   * planner splits a day (`locationsPerRequest`).
   */
  private locationsPerRequest(valhalla: string, publicFallback: boolean): number {
    const mayReachPublic = valhalla === FOSSGIS_VALHALLA || (this.relay.serves(valhalla) && publicFallback);
    return mayReachPublic ? FOSSGIS_MAX_LOCATIONS : VALHALLA_RELAY_MAX_LOCATIONS;
  }

  async route(
    userId: number,
    tripId: number,
    dayId: number,
    points: Point[],
    profile: string,
    avoid: RouteAvoidClass[],
    options: RouteOptions = {},
  ): Promise<RoadtripRoute> {
    const settings = await this.settings.getUserSettings(userId);
    const footOnly = options.footOnly === true && profile === 'walking';
    // A tour's own costing goes with a way on foot or by bike; a drive has its avoidances instead.
    const hiking = profile === 'walking' || profile === 'cycling' ? options.costingOptions : undefined;
    const trekValhalla = this.relay.trekValhalla();
    // Whether the TREK services can be asked belongs in the key: a key added or removed
    // moves the days from one engine to the other.
    const key = JSON.stringify([
      trekValhalla !== null,
      userId,
      tripId,
      dayId,
      points,
      profile,
      avoid,
      settings.routing_base_url,
      settings.valhalla_base_url,
      settings.routing_valhalla_provider,
      ...(footOnly ? ['foot-only'] : []),
      ...(hiking ? [{ hiking }] : []),
    ]);
    const cached = this.cache.get(key);
    if (!profile.startsWith('plugin:') && cached && Date.now() - cached.at < 300000) return cached.route;
    let line: [number, number][], distance: number, duration: number;
    let parts: { distance: number; duration: number }[];
    let vias: RoutedLeg['vias'] = [];
    let avoidMissed = profile === 'driving' ? [...avoid] : [];
    let snapped: SnappedWaypoint[] | undefined;
    let ferryLegs: number[] | undefined;
    // A day Valhalla routes that OSRM drew instead, kept no longer than this answer: the
    // next question goes to Valhalla again, as the planner's does.
    let standIn = false;
    const plugin = /^plugin:([^/]+)\/(.+)$/.exec(profile);
    if (plugin) {
      const [, id, name] = plugin;
      if (
        points.length > 30 ||
        !pluginsEnabled() ||
        !this.hooks.providersOf('routeProvider').includes(id) ||
        !(await declaredProfiles(this.plugins, id)).includes(name) // RRT2 — Plan 3j, converted (Task 3)
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
      const { base, valhalla, everyDay } = routersOf(settings, trekValhalla);
      let weighted = false;
      if (hiking) {
        const cycling = mode === 'cycling';
        if (!valhalla) {
          throw new RouteRefusal('no_valhalla', `No Valhalla is set to plan a ${cycling ? 'bike tour' : 'hike'} with`);
        }
        const legs = await this.valhallaLegs(userId, valhalla, points, cycling ? 'bicycle' : 'pedestrian', {
          ...hiking,
        });
        ({ line, distance, duration, parts, snapped } = routeOfLegs(points, legs));
        weighted = true;
      } else if (footOnly && valhalla) {
        // A walk kept off the boats is something only Valhalla can do, like an avoidance,
        // so it may go to FOSSGIS where the relay cannot answer, as the planner's does.
        try {
          const ferryless = { use_ferry: 0 };
          const offBoats = { offBoatLines: true };
          const legs = await this.valhallaLegs(userId, valhalla, points, 'pedestrian', ferryless, offBoats);
          ({ line, distance, duration, parts, snapped } = routeOfLegs(points, legs));
          ferryLegs = legs.flatMap((leg, index) => (crossesByBoat(leg) ? [index] : []));
          weighted = true;
        } catch {
          snapped = undefined;
        }
      } else if (mode === 'driving' && avoid.length && valhalla) {
        try {
          const options = {
            use_tolls: avoid.includes('toll') ? 0 : 1,
            use_highways: avoid.includes('motorway') ? 0 : 1,
            use_ferry: avoid.includes('ferry') ? 0 : 1,
          };
          const legs = await this.valhallaLegs(userId, valhalla, points, 'auto', options);
          ({ line, distance, duration, parts, snapped } = routeOfLegs(points, legs));
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
      } else if (everyDay) {
        // Where Valhalla routes the days, it routes this one whole, as the planner
        // does (`valhallaDayRun`); where it cannot answer, OSRM routes all of it.
        try {
          const relayOnly = { publicFallback: false };
          const legs = await this.valhallaLegs(userId, valhalla, points, VALHALLA_COSTING[mode], {}, relayOnly);
          ({ line, distance, duration, parts, snapped } = routeOfLegs(points, legs));
          weighted = true;
        } catch {
          snapped = undefined;
          standIn = true;
        }
      }
      if (!weighted) {
        const path = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'driving';
        const origin =
          base ||
          `https://routing.openstreetmap.de/routed-${mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'car'}`;
        // `continue_straight=false` because a stop is somewhere the traveller stops, not a
        // shape hint. OSRM's car profile otherwise forbids a u-turn at an INTERMEDIATE
        // waypoint, and it refuses the WHOLE request rather than the one leg it cannot
        // obey on: a single stop on a dead end (Gouffre de Padirac snaps onto a cave
        // access road that leads nowhere else) turned a whole routed day into a 400. The
        // browser sends the same thing, see `uTurnParam` in client RouteCalculator.ts.
        // Only with something in the middle to turn round at.
        const uTurn = points.length > 2 ? '&continue_straight=false' : '';
        // A walk on foot only asks for the steps, the one place OSRM says a leg is on a ferry.
        const payload = await this.request(
          `${origin}/route/v1/${path}/${points.map((p) => `${p.lng},${p.lat}`).join(';')}?overview=full&geometries=geojson&steps=${footOnly}${uTurn}`,
        );
        const parsed = osrmSchema.parse(payload);
        const route = parsed.routes[0];
        line = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        distance = route.distance;
        duration = route.duration;
        parts = route.legs.map((leg) => ({ distance: leg.distance, duration: leg.duration }));
        if (footOnly)
          ferryLegs = route.legs.flatMap((leg, index) =>
            leg.steps?.some((step) => step.mode === 'ferry') ? [index] : [],
          );
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
      ...(ferryLegs ? { ferryLegs } : {}),
    };
    if (!standIn) this.cache.set(key, { at: Date.now(), route });
    if (this.cache.size > 100) this.cache.delete(this.cache.keys().next().value!);
    return route;
  }

  /**
   * Valhalla's legs through the points, as many locations a request as the
   * host takes (`locationsPerRequest`), one after another through the paced
   * queue, each piece starting on the point the one before ended at. CW-12: a
   * walk on foot binds no point to a ferry's edge (`offBoatLines`).
   */
  private async valhallaLegs(
    userId: number,
    valhalla: string,
    points: Point[],
    costing: ValhallaCosting,
    options: Record<string, number | string>,
    { offBoatLines = false, publicFallback = true }: { offBoatLines?: boolean; publicFallback?: boolean } = {},
  ): Promise<ValhallaLegs> {
    const legs: ValhallaLegs = [];
    const size = this.locationsPerRequest(valhalla, publicFallback);
    for (let start = 0; start < points.length - 1; start += size - 1) {
      const body = {
        locations: points.slice(start, start + size).map((p) => ({
          lat: p.lat,
          lon: p.lng,
          radius: 50,
          ...(offBoatLines ? { search_filter: { exclude_ferry: true } } : {}),
        })),
        costing,
        costing_options: { [costing]: options },
        directions_options: { units: 'kilometers' },
      };
      const payload = await this.askValhalla(userId, valhalla, 'route', body, { publicFallback });
      legs.push(...valhallaSchema.parse(payload).trip.legs);
    }
    if (legs.length !== points.length - 1) throw new Error('Routing response has mismatched legs');
    return legs;
  }

  /** The Valhalla a user's routes are asked of, or null where there is none to ask. */
  private async valhallaFor(userId: number): Promise<string | null> {
    return routersOf(await this.settings.getUserSettings(userId), this.relay.trekValhalla()).valhalla || null;
  }

  /**
   * The height of every point of a line, from Valhalla's /height, the way the
   * planner in the browser reads it (enrichTourElevations): in pieces of 500
   * points that overlap by one, one after another through the paced queue.
   * A point the terrain data has no height for stays `[lat, lng]`. A piece
   * whose question fails is asked once more; one that fails again ends the
   * reading, and the points after it stay without heights. A line read whole
   * is kept for five minutes, so a hike created from a proposal does not ask
   * the host again. Null where there is no Valhalla to ask, or nothing to
   * measure.
   */
  async heights(userId: number, line: ReadonlyArray<readonly [number, number]>): Promise<GeometryPoint[] | null> {
    const valhalla = await this.valhallaFor(userId);
    if (!valhalla || line.length < 2) return null;
    const key = heightsKey(userId, valhalla, line);
    const kept = this.heightsCache.get(key);
    const heights =
      kept && Date.now() - kept.at < HEIGHTS_TTL_MS
        ? kept.heights
        : await this.readHeights(userId, key, valhalla, line);
    return line.map(([lat, lng], index): GeometryPoint => {
      const height = heights[index];
      return height === null ? [lat, lng] : [lat, lng, height];
    });
  }

  /** The heights of a line asked piece by piece, kept under `key` where every piece was answered. */
  private async readHeights(
    userId: number,
    key: string,
    valhalla: string,
    line: ReadonlyArray<readonly [number, number]>,
  ): Promise<Array<number | null>> {
    const heights: Array<number | null> = line.map(() => null);
    const step = HEIGHT_CHUNK_SIZE - 1;
    const offsets = Array.from({ length: Math.ceil((line.length - 1) / step) }, (_, index) => index * step);
    // One piece after another through the queue; the first that fails twice ends the reading.
    const whole = await offsets.reduce<Promise<boolean>>(async (going, offset) => {
      if (!(await going)) return false;
      const read = await this.pieceHeights(userId, valhalla, line.slice(offset, offset + HEIGHT_CHUNK_SIZE), offset);
      // The point a piece shares with the one before keeps the height it already has.
      read?.forEach((height, index) => {
        if (index > 0 || heights[offset] === null) heights[offset + index] = height;
      });
      return read !== null;
    }, Promise.resolve(true));
    if (whole) {
      this.heightsCache.set(key, { at: Date.now(), heights });
      const [oldest] = this.heightsCache.keys();
      if (this.heightsCache.size > HEIGHTS_CACHE_MAX && oldest !== undefined) this.heightsCache.delete(oldest);
    }
    return heights;
  }

  /**
   * The heights of one piece of a line, starting at `offset`, asked again
   * `retries` times where its question fails, or null where it failed every time.
   */
  private async pieceHeights(
    userId: number,
    valhalla: string,
    piece: ReadonlyArray<readonly [number, number]>,
    offset: number,
    retries = HEIGHT_RETRIES,
  ): Promise<Array<number | null> | null> {
    let why: string;
    try {
      const read = heightsOf(await this.askValhalla(userId, valhalla, 'height', heightBody(piece)), piece.length);
      if (read) return read;
      why = 'the answer does not name every point';
    } catch (err: unknown) {
      why = err instanceof Error ? err.message : String(err);
    }
    if (retries > 0) return await this.pieceHeights(userId, valhalla, piece, offset, retries - 1);
    logWarn(`[Router] heights stop at point ${offset}: ${why}`);
    return null;
  }

  /**
   * The OpenStreetMap ways under a line, in the order they are walked, each
   * with the metres of the line it runs along: Valhalla's trace_attributes,
   * matched on foot with every grade of path open, the line thinned to at
   * most 4000 points as the planner thins it. Throws where there is no
   * Valhalla or it gives no answer: a description is an addition beside a
   * route that already exists, and its caller decides what its absence means.
   */
  async wayIds(userId: number, line: ReadonlyArray<readonly [number, number]>): Promise<TracedWay[]> {
    const valhalla = await this.valhallaFor(userId);
    if (!valhalla) throw new RouteRefusal('no_valhalla', 'No Valhalla is set to describe a line with');
    const answer = await this.askValhalla(userId, valhalla, 'trace_attributes', traceBody(line), {
      timeoutMs: TRACE_TIMEOUT_MS,
    });
    return tracedWaysOf(answer);
  }

  /**
   * RTE-02: the ways on foot between two points under a hike's own costing,
   * the router's own first and then each other way it offers, at most
   * `count` besides, as the planner asks them (`valhallaAlternates`). Asked of
   * Valhalla alone through the paced queue: only Valhalla knows a hiking limit
   * and offers alternates on foot. A `RouteRefusal` where there is no Valhalla
   * or no way within the limit.
   */
  async alternatesOnFoot(
    userId: number,
    from: Point,
    to: Point,
    costingOptions: NonNullable<RouteOptions['costingOptions']>,
    count: number,
  ): Promise<Array<[number, number][]>> {
    const valhalla = await this.valhallaFor(userId);
    if (!valhalla) throw new RouteRefusal('no_valhalla', 'No Valhalla is set to plan a hike with');
    const payload = await this.askValhalla(userId, valhalla, 'route', {
      locations: [from, to].map((p) => ({ lat: p.lat, lon: p.lng, radius: 50 })),
      costing: 'pedestrian',
      costing_options: { pedestrian: { ...costingOptions } },
      directions_options: { units: 'kilometers' },
      ...(count > 0 ? { alternates: count } : {}),
    });
    const parsed = alternatesSchema.parse(payload);
    const trips = [parsed.trip, ...(parsed.alternates ?? []).map((alternate) => alternate.trip)];
    return trips.map((trip) => trip.legs.flatMap((leg) => decode(leg.shape)));
  }
}
