import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/view-contributions/:view/:tripId — host-rendered columns/actions that
 * plugins implementing the `tableContributor` hook (#plugins) add into a native
 * planner view (reservations/transports/places/day/costs/packing/files/todos). Mirrors place-details.controller (#1429):
 * additive + fail-safe — the caller must access the trip, each provider runs
 * host->plugin on a short timeout, and one that errors/times out contributes nothing.
 *
 * Unlike place-details, every field is NORMALIZED server-side: a plugin contribution
 * only ever crosses this boundary as bounded primitives (never HTML/markup). Strings
 * are String()-coerced + length-capped, kind/tone/icon/target are enum-whitelisted,
 * per-provider counts are capped, and a column URL must be http/https/mailto — a
 * javascript:/data: URL would be click-XSS into the native DOM.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';
type ActionTarget = { kind: 'frame'; sub: string } | { kind: 'route'; method: 'GET' | 'POST'; sub: string };
interface Column { kind: 'column'; pluginId: string; entityId: number; id: string; label: string; value?: string; url?: string; icon?: string; tone: Tone; }
interface Action { kind: 'action'; pluginId: string; entityId: number; id: string; label: string; icon?: string; target: ActionTarget; }
type Contribution = Column | Action;

const VIEWS: ReadonlySet<string> = new Set(['reservations', 'transports', 'places', 'day', 'costs', 'packing', 'files', 'todos']);
const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const MAX_COLUMNS = 20;
const MAX_ACTIONS = 10;
const LABEL_MAX = 64;
const VALUE_MAX = 256;
const URL_MAX = 2048;
const ID_MAX = 64;
const ICON_MAX = 40;
const SUB_MAX = 512;

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

function normalize(pluginId: string, raw: unknown): Contribution[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: Contribution[] = [];
  // The caps are PER ENTITY (the data model is keyed by entityId) — a global cap would
  // make columns vanish from every row past the first MAX_COLUMNS in a large table. A
  // generous overall bound still guards against a provider returning millions of rows.
  const colsPer = new Map<number, number>();
  const actsPer = new Map<number, number>();
  const MAX_TOTAL = 5000;
  for (const c of list) {
    if (out.length >= MAX_TOTAL) break;
    if (!c || typeof c !== 'object') continue;
    const entityId = typeof c.entityId === 'number' && Number.isFinite(c.entityId) ? c.entityId : undefined;
    const id = cap(c.id, ID_MAX);
    const label = cap(c.label, LABEL_MAX);
    if (entityId === undefined || !id || !label) continue; // an entity-keyed contribution must have all three
    const icon = typeof c.icon === 'string' && c.icon ? cap(c.icon, ICON_MAX) : undefined;

    if (c.kind === 'column') {
      if ((colsPer.get(entityId) ?? 0) >= MAX_COLUMNS) continue;
      colsPer.set(entityId, (colsPer.get(entityId) ?? 0) + 1);
      out.push({
        kind: 'column',
        pluginId,
        entityId,
        id,
        label,
        value: c.value !== undefined && c.value !== null ? cap(c.value, VALUE_MAX) : undefined,
        url: safeUrl(c.url),
        icon,
        tone: (TONES.has(c.tone as string) ? c.tone : 'default') as Tone,
      });
    } else if (c.kind === 'action') {
      if ((actsPer.get(entityId) ?? 0) >= MAX_ACTIONS) continue;
      const t = c.target as Record<string, unknown> | undefined;
      let target: ActionTarget | undefined;
      if (t && t.kind === 'frame' && typeof t.sub === 'string' && t.sub) {
        target = { kind: 'frame', sub: cap(t.sub, SUB_MAX) };
      } else if (t && t.kind === 'route' && (t.method === 'GET' || t.method === 'POST') && typeof t.sub === 'string' && t.sub) {
        target = { kind: 'route', method: t.method, sub: cap(t.sub, SUB_MAX) };
      }
      if (!target) continue; // a malformed target drops the action, never renders a dead button
      actsPer.set(entityId, (actsPer.get(entityId) ?? 0) + 1);
      out.push({ kind: 'action', pluginId, entityId, id, label, icon, target });
    }
  }
  return out;
}

@Controller('api/view-contributions')
@UseGuards(JwtAuthGuard)
export class ViewContributionsController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':view/:tripId')
  async get(
    @Param('view') view: string,
    @Param('tripId') tripIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ contributions: Contribution[] }> {
    if (!pluginsEnabled() || !VIEWS.has(view)) return { contributions: [] };
    const tripId = Number(tripIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(tripId) || userId == null || !canAccessTrip(tripId, userId)) return { contributions: [] };

    const ids = this.runtime.providersOf('tableContributor');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<Contribution[]> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'tableContributor', 'getContributions', [view, tripId], userId, 5000);
          return normalize(id, raw);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { contributions: perProvider.flat() };
  }
}
