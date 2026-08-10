import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/plugin-poi-categories — search POIs contributed by plugins that
 * implement the `poiCategoryProvider` hook. Additive and fail-safe: each
 * provider is called with a short timeout, and a provider that errors or times
 * out is simply skipped — it never delays or breaks the caller.
 *
 * Every field is NORMALIZED server-side: strings are String()-coerced +
 * length-capped, coordinates are range-checked, URLs are http/https/mailto only,
 * and the result count is capped per provider.
 */

interface PoiCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface PoiResult {
  id: string;
  categoryId: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  description?: string;
  url?: string;
  icon?: string;
}

interface ProviderResult {
  pluginId: string;
  categories: PoiCategory[];
  results: PoiResult[];
  hasMore: boolean;
}

const MAX_RESULTS = 100; // per provider — caps the response footprint
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

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

function normalizeCategories(raw: unknown): PoiCategory[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: PoiCategory[] = [];
  for (const r of list) {
    if (!r || typeof r !== 'object') continue;
    const id = cap(r.id, 60);
    const name = cap(r.name, 120);
    if (!id || !name) continue;
    const entry: PoiCategory = { id, name };
    const icon = r.icon != null ? cap(r.icon, 60) : undefined;
    if (icon) entry.icon = icon;
    const color = typeof r.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(r.color) ? r.color : undefined;
    if (color) entry.color = color;
    out.push(entry);
  }
  return out;
}

function normalizeResults(raw: unknown): PoiResult[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: PoiResult[] = [];
  for (const r of list) {
    if (out.length >= MAX_RESULTS) break;
    if (!r || typeof r !== 'object') continue;
    const id = cap(r.id, 60);
    const categoryId = cap(r.categoryId, 60);
    const name = cap(r.name, 120);
    if (!id || !categoryId || !name) continue;
    const lat = typeof r.lat === 'number' ? r.lat : Number(r.lat);
    const lng = typeof r.lng === 'number' ? r.lng : Number(r.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) continue;
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) continue;
    const result: PoiResult = { id, categoryId, name, lat, lng };
    const address = r.address != null ? cap(r.address, 300) : undefined;
    if (address) result.address = address;
    const description = r.description != null ? cap(r.description, 500) : undefined;
    if (description) result.description = description;
    const url = safeUrl(r.url);
    if (url) result.url = url;
    const icon = r.icon != null ? cap(r.icon, 60) : undefined;
    if (icon) result.icon = icon;
    out.push(result);
  }
  return out;
}

export interface PoiSearchQuery {
  query?: string;
  north?: string;
  south?: string;
  east?: string;
  west?: string;
  limit?: string;
}

@Controller('api/plugin-poi-categories')
@UseGuards(JwtAuthGuard)
export class PoiCategoriesController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get()
  async search(
    @Query() q: PoiSearchQuery,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ providers: ProviderResult[] }> {
    if (!pluginsEnabled()) return { providers: [] };
    const userId = req.user?.id;
    if (userId == null) return { providers: [] };

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(Number(q.limit)) ? Number(q.limit) : DEFAULT_LIMIT));
    const opts: Record<string, unknown> = { limit };
    if (q.query) opts.query = q.query;
    if (q.north != null && q.south != null && q.east != null && q.west != null) {
      const [north, south, east, west] = [Number(q.north), Number(q.south), Number(q.east), Number(q.west)];
      if ([north, south, east, west].every(Number.isFinite)) {
        opts.bounds = { north, south, east, west };
      }
    }

    const ids = this.runtime.providersOf('poiCategoryProvider');
    const results = await Promise.all(
      ids.map(async (id): Promise<ProviderResult | null> => {
        try {
          const [rawCategories, rawSearch] = await Promise.all([
            this.runtime.invokeHook(id, 'poiCategoryProvider', 'getCategories', [], userId, 5000),
            this.runtime.invokeHook(id, 'poiCategoryProvider', 'search', [opts], userId, 8000),
          ]);
          const categories = normalizeCategories(rawCategories);
          const search = rawSearch && typeof rawSearch === 'object' ? rawSearch as Record<string, unknown> : {};
          const poiResults = normalizeResults(search.results);
          const hasMore = search.hasMore === true;
          return { pluginId: id, categories, results: poiResults, hasMore };
        } catch {
          return null; // a slow / failing provider is skipped, never fatal
        }
      }),
    );
    return { providers: results.filter((r): r is ProviderResult => r !== null) };
  }
}
