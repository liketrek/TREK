import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/trip-warnings/:tripId — validation/warning contributions from plugins
 * that implement the `warningProvider` hook (#1429). Additive and fail-safe: the
 * caller must be able to access the trip, each provider is called host→plugin with
 * a short timeout, and a provider that errors or times out contributes nothing.
 */
type Level = 'info' | 'warning' | 'error';
interface Warning {
  pluginId: string;
  level: Level;
  message: string;
  dayId?: number;
  placeId?: number;
}

const MAX_WARNINGS = 20; // per provider — bounds the banner
const MESSAGE_MAX = 300;

@Controller('api/trip-warnings')
@UseGuards(JwtAuthGuard)
export class TripWarningsController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':tripId')
  async get(
    @Param('tripId') tripIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ warnings: Warning[] }> {
    if (!pluginsEnabled()) return { warnings: [] };
    const tripId = Number(tripIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(tripId) || userId == null || !canAccessTrip(tripId, userId)) return { warnings: [] };

    const ids = this.runtime.providersOf('warningProvider');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<Warning[]> => {
        try {
          const raw = (await this.runtime.invokeHook(id, 'warningProvider', 'getWarnings', [tripId], userId, 5000)) as unknown;
          const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
          // Drop non-object elements BEFORE the cap — otherwise one null in the array
          // throws inside map() and the catch below discards ALL of this provider's
          // warnings (and the cap should count only valid entries anyway).
          return list.filter((w): w is Record<string, unknown> => !!w && typeof w === 'object').slice(0, MAX_WARNINGS).map((w) => ({
            pluginId: id,
            level: w.level === 'error' || w.level === 'info' ? (w.level as Level) : 'warning',
            message: stripEmoji(String(w.message ?? '')).slice(0, MESSAGE_MAX),
            dayId: typeof w.dayId === 'number' ? w.dayId : undefined,
            placeId: typeof w.placeId === 'number' ? w.placeId : undefined,
          }));
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { warnings: perProvider.flat().filter((w) => w.message) };
  }
}
