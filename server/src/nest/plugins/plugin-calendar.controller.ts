import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * Calendar events contributed by plugins that implement the `calendarSource` hook
 * (needs `hook:calendar-source`). The core consumer that makes the hook LIVE:
 *   GET /api/plugin-calendar?start=<ISO>&end=<ISO> — aggregate events for the signed-in
 *   user across every calendar-source plugin, for embedding in a calendar view or an
 *   external subscription. Additive + fail-safe: each source is called host→plugin on a
 *   short timeout, one that errors/times out is skipped. Every field is NORMALIZED —
 *   strings length-capped, dates kept as ISO strings, the event count capped per source.
 */
interface DevEvent { id: string; pluginId: string; source: string; title: string; start: string; end: string; allDay: boolean; }

const MAX_EVENTS = 500;      // per source per request
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);
const isoish = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 && v.length <= 40 ? v : undefined);

function normalizeEvents(pluginId: string, source: string, raw: unknown): DevEvent[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: DevEvent[] = [];
  for (const e of list) {
    if (out.length >= MAX_EVENTS) break;
    if (!e || typeof e !== 'object') continue;
    const id = cap(e.id, 256);
    const title = cap(e.title, 300);
    const start = isoish(e.start);
    const end = isoish(e.end);
    if (!id || !title || !start || !end) continue; // an event missing its core fields is dropped
    out.push({ id, pluginId, source, title, start, end, allDay: e.allDay === true });
  }
  return out;
}

@Controller('api/plugin-calendar')
@UseGuards(JwtAuthGuard)
export class PluginCalendarController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get()
  async get(
    @Query('start') start: string | undefined,
    @Query('end') end: string | undefined,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ sources: Array<{ pluginId: string; name: string; events: DevEvent[] }> }> {
    if (!pluginsEnabled()) return { sources: [] };
    const userId = req.user?.id;
    if (userId == null) return { sources: [] };
    // Default to a generous window (90 days back → ~1 year out) when unspecified.
    const s = isoish(start) ?? new Date(Date.now() - 90 * 864e5).toISOString();
    const e = isoish(end) ?? new Date(Date.now() + 366 * 864e5).toISOString();

    const ids = this.runtime.providersOf('calendarSource');
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const [rawName, rawEvents] = await Promise.all([
            this.runtime.invokeHook(id, 'calendarSource', 'getName', [], userId, 3000).catch(() => id),
            this.runtime.invokeHook(id, 'calendarSource', 'getEvents', [userId, s, e], userId, 5000),
          ]);
          const name = cap(rawName, 80) || id;
          const events = normalizeEvents(id, name, rawEvents);
          return events.length > 0 ? { pluginId: id, name, events } : null;
        } catch {
          return null;
        }
      }),
    );
    return { sources: results.filter((r): r is { pluginId: string; name: string; events: DevEvent[] } => r !== null) };
  }
}
