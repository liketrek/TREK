import { Places } from '../../../db/entities/Places.entity';
import type { PlacesRepository } from '../../../db/repositories/Places.repository';
import { JwtAuthGuard } from '../../auth-core/jwt-auth.guard';
import { TripAccessService } from '../../trip-membership/trip-access.service';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import { stripEmoji } from '../text-sanitize';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

/**
 * GET /api/place-details/:placeId — extra info for a place, contributed by plugins
 * that implement the `placeDetailProvider` hook (#1429). Additive and fail-safe:
 * the place must belong to a trip the caller can access, each provider is called
 * host→plugin with a short timeout, and a provider that errors or times out is
 * simply skipped — it never delays or breaks the place panel.
 *
 * Every row is NORMALIZED server-side (same as journal-entry-rows): strings are
 * String()-coerced + length-capped, the row count is capped per plugin, and a
 * row url must be http/https/mailto — a javascript:/data: url rendered as an
 * <a href> would be click-XSS into the place panel.
 */
interface DetailItem {
  label: string;
  value?: string;
  url?: string;
}
interface ProviderResult {
  pluginId: string;
  items: DetailItem[];
}

const MAX_ITEMS = 12; // per provider — bounds the panel footprint
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

function safeUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined;
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:'
      ? raw.slice(0, 2048)
      : undefined;
  } catch {
    return undefined;
  }
}

function normalize(raw: unknown): DetailItem[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: DetailItem[] = [];
  for (const r of list) {
    if (out.length >= MAX_ITEMS) break;
    if (!r || typeof r !== 'object') continue;
    const label = cap(r.label, 60);
    if (!label) continue; // a row without a label is meaningless — drop it
    out.push({
      label,
      value: r.value != null ? cap(r.value, 200) : undefined,
      url: safeUrl(r.url),
    });
  }
  return out;
}

@Controller('api/place-details')
@UseGuards(JwtAuthGuard)
export class PlaceDetailsController {
  constructor(
    private readonly hooks: PluginHooks,
    private readonly trips: TripAccessService,
    // CT7 (Plan 3j Task 5) — the place's owning trip id, converted onto Places.repository.ts.
    @InjectRepository(Places) private readonly places: PlacesRepository,
  ) {}

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
    const tripId = await this.places.findTripId(placeId); // CT7 — Plan 3j
    if (tripId === undefined || !(await this.trips.findAccessible(tripId, userId))) return { providers: [] };

    const ids = this.hooks.providersOf('placeDetailProvider');
    const results = await Promise.all(
      ids.map(async (id): Promise<ProviderResult | null> => {
        try {
          const raw = await this.hooks.placeDetails(id, placeId, userId);
          const items = normalize(raw);
          return items.length > 0 ? { pluginId: id, items } : null;
        } catch {
          return null; // a slow / failing provider is skipped, never fatal
        }
      }),
    );
    return { providers: results.filter((r): r is ProviderResult => r !== null) };
  }
}
