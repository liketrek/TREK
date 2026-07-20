import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip, db } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * POST /api/plugin-routes/:pluginId/:profileId — ask ONE routeProvider plugin to
 * route the given waypoints under one of its declared profiles (an EV profile with
 * charging stops, a scenic profile, …). Unlike the fan-out hooks this is targeted:
 * the planner's route toggle names a specific plugin profile, so exactly that
 * provider is invoked.
 *
 * The route result is data the client renders exactly like an OSRM response:
 * geometry + per-leg distance/duration + optional via points (charging stops).
 * Everything is normalized here — coordinates range-checked, the leg list forced
 * to exactly waypoints-1 entries (anything else means the plugin routed a
 * different request than asked), text emoji-stripped + capped, counts budgeted.
 * A failure returns { route: null } so the client falls back to straight lines,
 * mirroring how an OSRM outage degrades.
 *
 * Routing may call an external solver through the plugin's declared egress, so
 * the invoke timeout is 20 s — well above the 5 s of the render-blocking hooks;
 * the client shows the straight-line route until the result lands.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';

interface RouteWaypointIn {
  lat: number;
  lng: number;
  name?: string;
  placeId?: number;
}

interface RouteLegOut {
  distance: number;
  duration: number;
  note?: string;
}

interface RouteViaOut {
  lat: number;
  lng: number;
  label?: string;
  tone: Tone;
  dwellSeconds?: number;
}

export interface PluginRouteOut {
  pluginId: string;
  profile: string;
  coordinates: Array<[number, number]>;
  distance: number;
  duration: number;
  legs: RouteLegOut[];
  viaPoints: RouteViaOut[];
}

const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const PROFILE_RE = /^[a-z][a-z0-9-]{0,23}$/;
const MAX_WAYPOINTS = 30;
const MAX_COORDINATES = 10_000; // vertex budget for the returned geometry
const MAX_VIAS = 40;
const MAX_DWELL_S = 86_400; // a "stop" longer than a day is nonsense data
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

function validCoord(lat: unknown, lng: unknown): boolean {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180;
}

/** The caller's waypoint list — invalid input is a client bug, answered with null. */
function readWaypoints(raw: unknown): RouteWaypointIn[] | null {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > MAX_WAYPOINTS) return null;
  const out: RouteWaypointIn[] = [];
  for (const w of raw as Array<Record<string, unknown>>) {
    if (!w || typeof w !== 'object' || !validCoord(w.lat, w.lng)) return null;
    const name = w.name != null ? cap(w.name, 120) : undefined;
    const placeId = Number.isInteger(w.placeId) ? (w.placeId as number) : undefined;
    out.push({ lat: Number(w.lat), lng: Number(w.lng), ...(name ? { name } : {}), ...(placeId !== undefined ? { placeId } : {}) });
  }
  return out;
}

function nonNeg(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** The plugin's answer — a malformed route is rejected whole (null), never patched. */
function normalize(pluginId: string, profile: string, waypointCount: number, raw: unknown): PluginRouteOut | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  if (!Array.isArray(r.coordinates) || r.coordinates.length < 2 || r.coordinates.length > MAX_COORDINATES) return null;
  const coordinates: Array<[number, number]> = [];
  for (const c of r.coordinates) {
    if (!Array.isArray(c) || !validCoord(c[0], c[1])) return null;
    coordinates.push([Number(c[0]), Number(c[1])]);
  }

  const distance = nonNeg(r.distance);
  const duration = nonNeg(r.duration);
  if (distance == null || duration == null) return null;

  // Exactly one leg per waypoint pair — a mismatched list means the plugin routed
  // something other than the request, and mis-keyed legs would attach wrong times
  // to the sidebar connectors.
  if (!Array.isArray(r.legs) || r.legs.length !== waypointCount - 1) return null;
  const legs: RouteLegOut[] = [];
  for (const l of r.legs as Array<Record<string, unknown>>) {
    if (!l || typeof l !== 'object') return null;
    const legDistance = nonNeg(l.distance);
    const legDuration = nonNeg(l.duration);
    if (legDistance == null || legDuration == null) return null;
    const note = l.note != null ? cap(l.note, 120) : undefined;
    legs.push({ distance: legDistance, duration: legDuration, ...(note ? { note } : {}) });
  }

  // Via points are decorative (charging stops on the drawn route) — a bad entry
  // is dropped individually, it can't invalidate the route. Slice the raw array so
  // an all-invalid list can't force unbounded iteration (the output is MAX_VIAS,
  // but only valid entries advance that counter).
  const viaPoints: RouteViaOut[] = [];
  if (Array.isArray(r.viaPoints)) {
    for (const v of (r.viaPoints as Array<Record<string, unknown>>).slice(0, MAX_VIAS * 4)) {
      if (viaPoints.length >= MAX_VIAS) break;
      if (!v || typeof v !== 'object' || !validCoord(v.lat, v.lng)) continue;
      const dwell = Number(v.dwellSeconds);
      const label = v.label != null ? cap(v.label, 80) : undefined;
      viaPoints.push({
        lat: Number(v.lat),
        lng: Number(v.lng),
        ...(label ? { label } : {}),
        // Raw-value enum check, same rationale as the marker tone guard.
        tone: TONES.has(v.tone as string) ? (v.tone as Tone) : 'default',
        ...(Number.isFinite(dwell) && dwell >= 0 ? { dwellSeconds: Math.min(Math.round(dwell), MAX_DWELL_S) } : {}),
      });
    }
  }

  return { pluginId, profile, coordinates, distance, duration, legs, viaPoints };
}

@Controller('api/plugin-routes')
@UseGuards(JwtAuthGuard)
export class PluginRoutesController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Post(':pluginId/:profileId')
  async route(
    @Param('pluginId') pluginId: string,
    @Param('profileId') profileId: string,
    @Body() body: Record<string, unknown> | undefined,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ route: PluginRouteOut | null }> {
    if (!pluginsEnabled()) return { route: null };
    const userId = req.user?.id;
    const tripId = Number(body?.tripId);
    if (userId == null || !Number.isFinite(tripId) || !canAccessTrip(tripId, userId)) return { route: null };
    if (!PROFILE_RE.test(profileId)) return { route: null };
    const waypoints = readWaypoints(body?.waypoints);
    if (!waypoints) return { route: null };
    const dayIdNum = Number(body?.dayId);
    const dayId = Number.isInteger(dayIdNum) ? dayIdNum : null;

    // Provider gate (implements the hook AND holds the grant) + the profile must be
    // one the manifest declared — re-validated from the DB row like the plugins feed,
    // so a hand-edited capabilities blob can't invent profiles.
    if (!this.runtime.providersOf('routeProvider').includes(pluginId)) return { route: null };
    if (!declaredProfiles(pluginId).includes(profileId)) return { route: null };

    try {
      const raw = await this.runtime.invokeHook(
        pluginId,
        'routeProvider',
        'getRoute',
        [{ tripId, dayId, profile: profileId, waypoints }],
        userId,
        20_000,
      );
      return { route: normalize(pluginId, profileId, waypoints.length, raw) };
    } catch {
      return { route: null }; // slow / failing provider — client falls back to straight lines
    }
  }
}

function declaredProfiles(pluginId: string): string[] {
  try {
    const row = db.prepare('SELECT capabilities FROM plugins WHERE id = ?').get(pluginId) as { capabilities?: string } | undefined;
    const c = JSON.parse(row?.capabilities || '{}') as { routeProfiles?: Array<{ id?: unknown }> };
    if (!Array.isArray(c.routeProfiles)) return [];
    return c.routeProfiles
      .map((p) => (p && typeof p === 'object' && typeof p.id === 'string' ? p.id : ''))
      .filter((id) => PROFILE_RE.test(id));
  } catch {
    return [];
  }
}
