import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/atlas-layers — country tint layers plugins draw over the Atlas world
 * map via the `atlasLayerProvider` hook (wishlists, travel advisories, …).
 * USER-SCOPED: there is no tripId — the layers are for the signed-in user, and
 * the hook receives no target parameter (the acting user is host-bound to the
 * invocation, so the plugin cannot ask for anyone else's map). No addon gate,
 * matching the other /api/addons/atlas routes, which have none either.
 *
 * DECLARATIVE ONLY — a plugin never touches the map canvas; it returns country
 * codes + a tone the host tints. Everything is normalized here: codes must be
 * ISO-3166 alpha-2 (uppercase-coerced, anything else dropped), tone is
 * enum-whitelisted, strings are String()-coerced + length-capped, and the
 * layer/country counts are capped per plugin.
 */
type Tone = 'default' | 'success' | 'warn' | 'danger';
interface AtlasLayerCountry {
  code: string;
  tone: Tone;
  label?: string;
}
interface AtlasLayer {
  pluginId: string;
  id: string;
  name?: string;
  countries: AtlasLayerCountry[];
}

const TONES: ReadonlySet<string> = new Set(['default', 'success', 'warn', 'danger']);
const CODE_RE = /^[A-Z]{2}$/;
const MAX_LAYERS = 3; // per provider
const MAX_COUNTRIES = 300; // per layer — bounds the render cost
const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

function normalizeCountries(raw: unknown): AtlasLayerCountry[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: AtlasLayerCountry[] = [];
  for (const c of list) {
    if (out.length >= MAX_COUNTRIES) break;
    if (!c || typeof c !== 'object') continue;
    const code = String(c.code ?? '').toUpperCase();
    if (!CODE_RE.test(code)) continue; // not an alpha-2 code — nothing to tint
    out.push({
      code,
      // Check the raw value (not String(c.tone)) so a non-string tone can't slip through
      // its toString() and be emitted raw through the Tone-typed API.
      tone: TONES.has(c.tone as string) ? (c.tone as Tone) : 'default',
      label: c.label != null ? cap(c.label, 80) : undefined,
    });
  }
  return out;
}

function normalize(pluginId: string, raw: unknown): AtlasLayer[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: AtlasLayer[] = [];
  for (const l of list) {
    if (out.length >= MAX_LAYERS) break;
    if (!l || typeof l !== 'object') continue;
    const id = cap(l.id, 64);
    if (!id) continue; // a layer with no id can't be keyed/deduped — drop it
    out.push({
      pluginId,
      id,
      name: l.name != null ? cap(l.name, 60) : undefined,
      countries: normalizeCountries(l.countries),
    });
  }
  return out;
}

@Controller('api/atlas-layers')
@UseGuards(JwtAuthGuard)
export class AtlasLayersController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get()
  async get(@Req() req: Request & { user?: { id: number } }): Promise<{ layers: AtlasLayer[] }> {
    if (!pluginsEnabled()) return { layers: [] };
    const userId = req.user?.id;
    if (userId == null) return { layers: [] };

    const ids = this.runtime.providersOf('atlasLayerProvider');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<AtlasLayer[]> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'atlasLayerProvider', 'getLayers', [], userId, 5000);
          return normalize(id, raw);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { layers: perProvider.flat() };
  }
}
