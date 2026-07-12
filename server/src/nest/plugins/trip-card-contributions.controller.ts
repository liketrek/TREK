import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/trip-card-contributions?tripIds=1,2,3 — host-rendered badges that plugins
 * implementing the `tripCardProvider` hook (#plugins) add to the dashboard trip cards.
 * The dashboard passes exactly the cards it is showing; the host access-checks each
 * one for the acting user before any plugin sees it, then fans out to every granted
 * provider ONCE with the full id list (a card grid can hold many trips — one call per
 * plugin, not one per trip).
 *
 * Like view-contributions, every field is NORMALIZED server-side: a contribution only
 * ever crosses this boundary as bounded primitives (never HTML/markup). Strings are
 * String()-coerced + length-capped, tone/icon are enum/length-bounded, the count is
 * capped, and a url must be http/https/mailto — a javascript:/data: url would be
 * click-XSS into the dashboard DOM. Additive + fail-safe: a slow/failing provider
 * contributes nothing.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';
interface TripCardBadge { pluginId: string; tripId: number; id: string; label: string; value?: string; icon?: string; tone: Tone; url?: string; }

const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const MAX_TRIP_IDS = 60;         // a dashboard never shows more cards than this
const MAX_BADGES_PER_TRIP = 4;  // per provider PER card — so one badge on every card always fits
const MAX_BADGES_TOTAL = MAX_TRIP_IDS * MAX_BADGES_PER_TRIP; // overall abuse bound
const LABEL_MAX = 64;
const VALUE_MAX = 256;
const URL_MAX = 2048;
const ID_MAX = 64;
const ICON_MAX = 40;

const cap = (v: unknown, max: number): string => stripEmoji(String(v ?? '')).slice(0, max);

/** Allow only http/https/mailto; anything else (or an unparseable value) is dropped —
 * a javascript:/data:/vbscript: URL rendered as an <a href> is click-XSS. */
function safeUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > URL_MAX) return undefined;
  try {
    const proto = new URL(raw).protocol;
    return proto === 'http:' || proto === 'https:' || proto === 'mailto:' ? raw : undefined;
  } catch {
    return undefined;
  }
}

/** Coerce a provider's raw output to bounded badges, keeping only badges whose tripId
 * is one the acting user actually asked about (a provider can't inject onto a card the
 * dashboard isn't showing / the user can't access). */
function normalize(pluginId: string, raw: unknown, allowed: Set<number>): TripCardBadge[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: TripCardBadge[] = [];
  const perTrip = new Map<number, number>(); // cap PER card, not across the whole grid
  for (const c of list) {
    if (out.length >= MAX_BADGES_TOTAL) break;
    if (!c || typeof c !== 'object') continue;
    const tripId = typeof c.tripId === 'number' && Number.isFinite(c.tripId) ? c.tripId : undefined;
    const id = cap(c.id, ID_MAX);
    const label = cap(c.label, LABEL_MAX);
    if (tripId === undefined || !allowed.has(tripId) || !id || !label) continue;
    const n = perTrip.get(tripId) ?? 0;
    if (n >= MAX_BADGES_PER_TRIP) continue; // this card is full; other cards still get theirs
    perTrip.set(tripId, n + 1);
    out.push({
      pluginId,
      tripId,
      id,
      label,
      value: c.value !== undefined && c.value !== null ? cap(c.value, VALUE_MAX) : undefined,
      icon: typeof c.icon === 'string' && c.icon ? cap(c.icon, ICON_MAX) : undefined,
      tone: (TONES.has(c.tone as string) ? c.tone : 'default') as Tone,
      url: safeUrl(c.url),
    });
  }
  return out;
}

@Controller('api/trip-card-contributions')
@UseGuards(JwtAuthGuard)
export class TripCardContributionsController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get()
  async get(
    @Query('tripIds') tripIdsRaw: string | undefined,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ contributions: TripCardBadge[] }> {
    if (!pluginsEnabled()) return { contributions: [] };
    const userId = req.user?.id;
    if (userId == null) return { contributions: [] };

    // Parse + access-check the requested cards; only those the user can actually see
    // are handed to any plugin.
    const requested = (tripIdsRaw ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, MAX_TRIP_IDS);
    const accessible = [...new Set(requested)].filter((id) => canAccessTrip(id, userId));
    if (accessible.length === 0) return { contributions: [] };
    const allowed = new Set(accessible);

    const ids = this.runtime.providersOf('tripCardProvider');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<TripCardBadge[]> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'tripCardProvider', 'getCards', [accessible], userId, 5000);
          return normalize(id, raw, allowed);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { contributions: perProvider.flat() };
  }
}
