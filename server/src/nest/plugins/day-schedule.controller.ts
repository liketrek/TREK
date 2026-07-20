import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip, db } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/day-schedule/:tripId — bounded time contributions plugins attach to the
 * day plan via the `dayScheduleProvider` hook: "35 min charging at this stop",
 * "45 min security before this flight". The planner renders them as host-drawn
 * rows anchored to an itinerary item (or the start/end of a day) and folds the
 * minutes into the day's route-footer total — the first hook whose output feeds
 * displayed timing, which is why `minutes` is clamped to a day.
 *
 * Same contract as the other provider hooks: additive + fail-safe, declarative
 * data only, strings sanitized + capped, counts budgeted per provider. dayIds
 * are checked against the trip so a stale/hand-edited contribution can never
 * anchor to another trip's day.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';

export interface DayScheduleItem {
  pluginId: string;
  id: string;
  dayId: number;
  assignmentId?: number;
  reservationId?: number;
  /** Where the row sits when it is not anchored to an item. */
  position?: 'start' | 'end';
  minutes?: number;
  label: string;
  tone: Tone;
}

const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const MAX_ITEMS = 60; // per provider, across the trip's days
const MAX_MINUTES = 1440; // a contribution longer than a day is nonsense data
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

function normalize(pluginId: string, tripDayIds: ReadonlySet<number>, raw: unknown): DayScheduleItem[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: DayScheduleItem[] = [];
  for (const it of list) {
    if (out.length >= MAX_ITEMS) break;
    if (!it || typeof it !== 'object') continue;
    const id = cap(it.id, 64);
    const label = cap(it.label, 120);
    const dayId = Number(it.dayId);
    // No id, no label, or a day outside this trip — the row is meaningless, drop it.
    if (!id || !label || !Number.isInteger(dayId) || !tripDayIds.has(dayId)) continue;
    const assignmentId = Number.isInteger(it.assignmentId) ? (it.assignmentId as number) : undefined;
    const reservationId = Number.isInteger(it.reservationId) ? (it.reservationId as number) : undefined;
    const minutesRaw = Number(it.minutes);
    const minutes = Number.isFinite(minutesRaw) && minutesRaw > 0 ? Math.min(Math.round(minutesRaw), MAX_MINUTES) : undefined;
    out.push({
      pluginId,
      id,
      dayId,
      ...(assignmentId !== undefined ? { assignmentId } : {}),
      ...(reservationId !== undefined ? { reservationId } : {}),
      // Raw-value enum check, same rationale as the marker tone guard.
      ...(it.position === 'start' || it.position === 'end' ? { position: it.position } : {}),
      ...(minutes !== undefined ? { minutes } : {}),
      label,
      tone: TONES.has(it.tone as string) ? (it.tone as Tone) : 'default',
    });
  }
  return out;
}

@Controller('api/day-schedule')
@UseGuards(JwtAuthGuard)
export class DayScheduleController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':tripId')
  async get(
    @Param('tripId') tripIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ items: DayScheduleItem[] }> {
    if (!pluginsEnabled()) return { items: [] };
    const tripId = Number(tripIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(tripId) || userId == null || !canAccessTrip(tripId, userId)) return { items: [] };

    const ids = this.runtime.providersOf('dayScheduleProvider');
    if (ids.length === 0) return { items: [] };
    const dayRows = db.prepare('SELECT id FROM days WHERE trip_id = ?').all(tripId) as Array<{ id: number }>;
    const tripDayIds: ReadonlySet<number> = new Set(dayRows.map((d) => d.id));

    const perProvider = await Promise.all(
      ids.map(async (id): Promise<DayScheduleItem[]> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'dayScheduleProvider', 'getSchedule', [tripId], userId, 5000);
          return normalize(id, tripDayIds, raw);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { items: perProvider.flat() };
  }
}
