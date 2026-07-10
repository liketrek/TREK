import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { db, canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

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
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:' ? raw.slice(0, 2048) : undefined;
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
          const raw = await this.runtime.invokeHook(id, 'placeDetailProvider', 'getDetails', [placeId], userId, 5000);
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
