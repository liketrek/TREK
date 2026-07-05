import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { db, canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';

/**
 * GET /api/place-details/:placeId — extra info for a place, contributed by plugins
 * that implement the `placeDetailProvider` hook (#1429). Additive and fail-safe:
 * the place must belong to a trip the caller can access, each provider is called
 * host→plugin with a short timeout, and a provider that errors or times out is
 * simply skipped — it never delays or breaks the place panel.
 */
interface ProviderResult {
  pluginId: string;
  items: unknown;
}

@Controller('api/place-details')
@UseGuards(JwtAuthGuard)
export class PlaceDetailsController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':placeId')
  async get(
    @Param('placeId') placeIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ providers: ProviderResult[] }> {
    if (!pluginsEnabled()) return { providers: [] };
    const placeId = Number(placeIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(placeId) || userId == null) return { providers: [] };

    // The place must belong to a trip the caller can access — same gate as a read.
    const row = db.prepare('SELECT trip_id FROM places WHERE id = ?').get(placeId) as { trip_id: number } | undefined;
    if (!row || !canAccessTrip(row.trip_id, userId)) return { providers: [] };

    const ids = this.runtime.providersOf('placeDetailProvider');
    const results = await Promise.all(
      ids.map(async (id): Promise<ProviderResult | null> => {
        try {
          const items = await this.runtime.invokeHook(id, 'placeDetailProvider', 'getDetails', [placeId], userId, 5000);
          return { pluginId: id, items };
        } catch {
          return null; // a slow / failing provider is skipped, never fatal
        }
      }),
    );
    return { providers: results.filter((r): r is ProviderResult => r !== null) };
  }
}
