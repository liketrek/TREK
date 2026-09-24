import { stripEmoji } from '../text-sanitize';

import type Database from 'better-sqlite3';

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
export const PROFILE_RE = /^[a-z][a-z0-9-]{0,23}$/;
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

export function readWaypoints(raw: unknown): RouteWaypointIn[] | null {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > MAX_WAYPOINTS) return null;
  const out: RouteWaypointIn[] = [];
  for (const w of raw as Array<Record<string, unknown>>) {
    if (!w || typeof w !== 'object' || !validCoord(w.lat, w.lng)) return null;
    const name = w.name != null ? cap(w.name, 120) : undefined;
    const placeId = Number.isInteger(w.placeId) ? (w.placeId as number) : undefined;
    out.push({
      lat: Number(w.lat),
      lng: Number(w.lng),
      ...(name ? { name } : {}),
      ...(placeId !== undefined ? { placeId } : {}),
    });
  }
  return out;
}

function nonNeg(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function normalize(
  pluginId: string,
  profile: string,
  waypointCount: number,
  raw: unknown,
): PluginRouteOut | null {
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
        tone: TONES.has(v.tone as string) ? (v.tone as Tone) : 'default',
        ...(Number.isFinite(dwell) && dwell >= 0 ? { dwellSeconds: Math.min(Math.round(dwell), MAX_DWELL_S) } : {}),
      });
    }
  }

  return { pluginId, profile, coordinates, distance, duration, legs, viaPoints };
}

export function declaredProfiles(conn: Database.Database, pluginId: string): string[] {
  try {
    const row = conn.prepare('SELECT capabilities FROM plugins WHERE id = ?').get(pluginId) as
      | { capabilities?: string }
      | undefined;
    const c = JSON.parse(row?.capabilities || '{}') as { routeProfiles?: Array<{ id?: unknown }> };
    if (!Array.isArray(c.routeProfiles)) return [];
    return c.routeProfiles
      .map((p) => (p && typeof p === 'object' && typeof p.id === 'string' ? p.id : ''))
      .filter((id) => PROFILE_RE.test(id));
  } catch {
    return [];
  }
}
