import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * Photo sources contributed by plugins that implement the `photoProvider` hook
 * (needs `hook:photo-provider`). This is the core consumer that makes the hook LIVE:
 *   GET /api/plugin-photos/sources           — the installed providers (id + name)
 *   GET /api/plugin-photos/search?q=&page=    — aggregate search across providers
 *   GET /api/plugin-photos/item?pluginId=&id= — one photo by id from one provider
 * The picker fans these into its "plugin sources" tab. Additive + fail-safe: each
 * provider is called host→plugin on a short timeout, one that errors/times out is
 * skipped. Every field is NORMALIZED: strings length-capped, the photo count capped,
 * and thumbnail/full URLs must be http/https (an image src) — never javascript:/data:.
 */
interface DevPhoto { id: string; pluginId: string; title?: string; thumbnailUrl: string; fullUrl: string; takenAt?: string; }

const MAX_PHOTOS = 60;       // per provider per page
const cap = (v: unknown, n: number): string => String(v ?? '').slice(0, n);

/** http/https only — these become <img src>, so a javascript:/data: URL is XSS. */
function imageUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '' || raw.length > 4096) return undefined;
  try {
    const p = new URL(raw).protocol;
    return p === 'http:' || p === 'https:' ? raw : undefined;
  } catch {
    return undefined;
  }
}

function normalizePhotos(pluginId: string, raw: unknown): DevPhoto[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: DevPhoto[] = [];
  for (const p of list) {
    if (out.length >= MAX_PHOTOS) break;
    if (!p || typeof p !== 'object') continue;
    const id = cap(p.id, 256);
    const thumb = imageUrl(p.thumbnailUrl);
    const full = imageUrl(p.fullUrl);
    if (!id || !thumb || !full) continue; // an unusable photo (no id / bad urls) is dropped
    out.push({
      id, pluginId,
      // Strip emojis from the display title (but NOT the id — that round-trips to getById).
      title: p.title != null ? stripEmoji(cap(p.title, 200)) : undefined,
      thumbnailUrl: thumb,
      fullUrl: full,
      takenAt: typeof p.takenAt === 'string' ? cap(p.takenAt, 40) : undefined,
    });
  }
  return out;
}

@Controller('api/plugin-photos')
@UseGuards(JwtAuthGuard)
export class PluginPhotosController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get('sources')
  sources(): { sources: Array<{ pluginId: string }> } {
    if (!pluginsEnabled()) return { sources: [] };
    return { sources: this.runtime.providersOf('photoProvider').map((pluginId) => ({ pluginId })) };
  }

  @Get('search')
  async search(
    @Query('q') q: string | undefined,
    @Query('page') pageRaw: string | undefined,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ providers: Array<{ pluginId: string; photos: DevPhoto[]; total: number; hasMore: boolean }> }> {
    if (!pluginsEnabled()) return { providers: [] };
    const userId = req.user?.id;
    if (userId == null) return { providers: [] };
    const query = cap(q, 200);
    const page = Math.max(1, Math.min(1000, Number(pageRaw) || 1));

    const ids = this.runtime.providersOf('photoProvider');
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const raw = (await this.runtime.invokeHook(id, 'photoProvider', 'search', [query, { page, limit: MAX_PHOTOS }], userId, 5000)) as
            | { photos?: unknown; total?: unknown; hasMore?: unknown }
            | undefined;
          const photos = normalizePhotos(id, raw?.photos);
          if (photos.length === 0) return null;
          return { pluginId: id, photos, total: Number(raw?.total) || photos.length, hasMore: raw?.hasMore === true };
        } catch {
          return null;
        }
      }),
    );
    return { providers: results.filter((r): r is { pluginId: string; photos: DevPhoto[]; total: number; hasMore: boolean } => r !== null) };
  }

  @Get('item')
  async item(
    @Query('pluginId') pluginId: string | undefined,
    @Query('id') id: string | undefined,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ photo: DevPhoto | null }> {
    if (!pluginsEnabled()) return { photo: null };
    const userId = req.user?.id;
    if (userId == null || !pluginId || !id) return { photo: null };
    if (!this.runtime.providersOf('photoProvider').includes(pluginId)) return { photo: null };
    try {
      const raw = await this.runtime.invokeHook(pluginId, 'photoProvider', 'getById', [cap(id, 256)], userId, 5000);
      return { photo: normalizePhotos(pluginId, [raw])[0] ?? null };
    } catch {
      return { photo: null };
    }
  }
}
