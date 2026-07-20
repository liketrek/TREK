import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/map-layers/:tripId — bounded vector overlays plugins draw on the trip map
 * via the `mapLayerProvider` hook. The marker hook (#587) covers points; this one
 * covers the shapes an integration needs to show a computed route, a reachable-range
 * corridor or a zone: polylines, polygons and metric circles.
 *
 * DECLARATIVE ONLY — same contract as map markers: a plugin never runs JS on the map
 * canvas, it returns geometry specs the host draws. Styling stays inside the tone
 * palette; the only free knobs are clamped numerics (width/opacity/radius) and a
 * dash enum, so a layer can never impersonate core UI or smuggle markup. Coordinates
 * are range-checked, strings are String()-coerced + emoji-stripped + length-capped,
 * and the point budget is capped per provider because every vertex is render cost.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';
type Dash = 'solid' | 'dash' | 'dot';

export interface MapLayerFeature {
  type: 'polyline' | 'polygon' | 'circle';
  points?: Array<[number, number]>; // [lat,lng] — polyline/polygon
  center?: [number, number]; // circle
  radiusM?: number; // circle, metres
  tone: Tone;
  width: number;
  dash: Dash;
  opacity: number;
  fill: boolean;
  label?: string;
}

export interface MapLayer {
  pluginId: string;
  id: string;
  name?: string;
  features: MapLayerFeature[];
}

const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const DASHES: ReadonlySet<string> = new Set(['solid', 'dash', 'dot']);
const MAX_LAYERS = 4; // per provider
const MAX_FEATURES = 150; // per provider, across its layers
const MAX_POINTS = 8000; // per provider — total vertex budget, bounds the render cost
const MAX_FEATURE_POINTS = 2000; // one feature can't eat the whole budget
const MAX_RADIUS_M = 2_000_000; // 2000 km — anything larger is a "tint the planet" wash
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

const clamp = (v: unknown, lo: number, hi: number, dflt: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

function readPoint(raw: unknown): [number, number] | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const lat = Number(raw[0]);
  const lng = Number(raw[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function readPoints(raw: unknown, budget: number): Array<[number, number]> | null {
  if (!Array.isArray(raw)) return null;
  // An oversized shape is dropped whole rather than truncated — a silently clipped
  // route would render as a different geometry than the plugin computed, which is
  // worse than rendering nothing. Same rule for a shape that overruns the budget.
  if (raw.length > MAX_FEATURE_POINTS || raw.length > budget) return null;
  const out: Array<[number, number]> = [];
  for (const p of raw) {
    const pt = readPoint(p);
    // One bad vertex invalidates the shape too, for the same reason.
    if (!pt) return null;
    out.push(pt);
  }
  return out;
}

function normalize(pluginId: string, raw: unknown): MapLayer[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: MapLayer[] = [];
  let features = 0;
  let points = 0;
  for (const l of list) {
    if (out.length >= MAX_LAYERS) break;
    if (!l || typeof l !== 'object') continue;
    const id = cap(l.id, 64);
    if (!id) continue;
    const feats: MapLayerFeature[] = [];
    const rawFeats = Array.isArray(l.features) ? (l.features as Array<Record<string, unknown>>) : [];
    for (const f of rawFeats) {
      if (features >= MAX_FEATURES || points >= MAX_POINTS) break;
      if (!f || typeof f !== 'object') continue;
      const type = f.type;
      // Check the RAW value against the enums (not String(...)) — same rationale as
      // the marker tone guard: a toString() match must not let an object through.
      const tone: Tone = TONES.has(f.tone as string) ? (f.tone as Tone) : 'default';
      const dash: Dash = DASHES.has(f.dash as string) ? (f.dash as Dash) : 'solid';
      const base = {
        tone,
        dash,
        width: Math.round(clamp(f.width, 1, 8, 3)),
        opacity: clamp(f.opacity, 0.05, 1, 0.8),
        label: f.label != null ? cap(f.label, 80) : undefined,
      };
      if (type === 'polyline' || type === 'polygon') {
        const min = type === 'polygon' ? 3 : 2;
        const pts = readPoints(f.points, MAX_POINTS - points);
        if (!pts || pts.length < min) continue;
        points += pts.length;
        features++;
        feats.push({ ...base, type, points: pts, fill: type === 'polygon' ? f.fill !== false : false });
      } else if (type === 'circle') {
        const center = readPoint(f.center);
        const radiusM = clamp(f.radiusM, 1, MAX_RADIUS_M, 0);
        if (!center || radiusM < 1) continue;
        points += 1;
        features++;
        feats.push({ ...base, type, center, radiusM, fill: f.fill !== false });
      }
    }
    if (feats.length === 0) continue;
    out.push({
      pluginId,
      id,
      name: l.name != null ? cap(l.name, 60) : undefined,
      features: feats,
    });
  }
  return out;
}

@Controller('api/map-layers')
@UseGuards(JwtAuthGuard)
export class MapLayersController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':tripId')
  async get(
    @Param('tripId') tripIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ layers: MapLayer[] }> {
    if (!pluginsEnabled()) return { layers: [] };
    const tripId = Number(tripIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(tripId) || userId == null || !canAccessTrip(tripId, userId)) return { layers: [] };

    const ids = this.runtime.providersOf('mapLayerProvider');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<MapLayer[]> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'mapLayerProvider', 'getLayers', [tripId], userId, 5000);
          return normalize(id, raw);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { layers: perProvider.flat() };
  }
}
