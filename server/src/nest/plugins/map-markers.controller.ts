import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/map-markers/:tripId — bounded markers plugins overlay on the trip map
 * via the `mapMarkerProvider` hook (#587 "show bookings on map"). Additive + fail-safe
 * like the other provider-hook controllers: the caller must access the trip, each
 * provider runs host->plugin on a short timeout, and one that errors/times out
 * contributes nothing.
 *
 * DECLARATIVE ONLY — a plugin never runs JS on the map canvas; it returns marker
 * specs the host draws. Every field is normalized here exactly like view-contributions:
 * coordinates are range-checked, strings are String()-coerced + length-capped,
 * icon/tone are enum-whitelisted, the popup url must be http/https/mailto (a
 * javascript:/data: url would be click-XSS), and the marker count is capped per plugin.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';
interface MapMarker {
  pluginId: string;
  id: string;
  lat: number;
  lng: number;
  label?: string;
  popupText?: string;
  url?: string;
  icon?: string;
  tone: Tone;
}

const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const MAX_MARKERS = 200; // per provider — bounds the render cost
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

function safeUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined;
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:' ? raw.slice(0, 2048) : undefined;
  } catch {
    return undefined;
  }
}

function normalize(pluginId: string, raw: unknown): MapMarker[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: MapMarker[] = [];
  for (const m of list) {
    if (out.length >= MAX_MARKERS) break;
    if (!m || typeof m !== 'object') continue;
    const lat = Number(m.lat);
    const lng = Number(m.lng);
    const id = cap(m.id, 64);
    // A marker with no id or out-of-range coordinates is meaningless — drop it.
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    out.push({
      pluginId,
      id,
      lat,
      lng,
      label: m.label != null ? cap(m.label, 80) : undefined,
      popupText: m.popupText != null ? cap(m.popupText, 280) : undefined,
      url: safeUrl(m.url),
      icon: m.icon != null ? cap(m.icon, 40) : undefined,
      // Check the RAW value against the enum (not String(m.tone)) — otherwise an object
      // with a matching toString() passes the guard but the raw object is emitted as the
      // tone, and a non-string tone crashes the client that renders it.
      tone: TONES.has(m.tone as string) ? (m.tone as Tone) : 'default',
    });
  }
  return out;
}

@Controller('api/map-markers')
@UseGuards(JwtAuthGuard)
export class MapMarkersController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':tripId')
  async get(
    @Param('tripId') tripIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ markers: MapMarker[] }> {
    if (!pluginsEnabled()) return { markers: [] };
    const tripId = Number(tripIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(tripId) || userId == null || !canAccessTrip(tripId, userId)) return { markers: [] };

    const ids = this.runtime.providersOf('mapMarkerProvider');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<MapMarker[]> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'mapMarkerProvider', 'getMarkers', [tripId], userId, 5000);
          return normalize(id, raw);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { markers: perProvider.flat() };
  }
}
