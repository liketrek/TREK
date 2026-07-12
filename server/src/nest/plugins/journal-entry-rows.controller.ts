import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { db } from '../../db/database';
import { canAccessJourney } from '../../services/journeyService';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/journal-entry-rows/:entryId — extra rows for a journal entry,
 * contributed by plugins implementing the `journalEntryProvider` hook. Additive +
 * fail-safe like place-details: the entry's journey must be one the caller can
 * access (owner/contributor — the same gate as the journal detail routes), the
 * Journey addon must be on (an off addon just yields nothing, this endpoint is
 * purely additive), each provider runs host->plugin on a short timeout, and one
 * that errors/times out contributes nothing.
 *
 * Unlike place-details, every row is NORMALIZED server-side: strings are
 * String()-coerced + length-capped, the row count is capped per plugin, and a
 * row url must be http/https/mailto — a javascript:/data: url rendered as an
 * <a href> would be click-XSS into the journal page.
 */
interface EntryRow {
  label: string;
  value?: string;
  url?: string;
}
interface ProviderResult {
  pluginId: string;
  items: EntryRow[];
}

const MAX_ROWS = 12; // per provider — bounds the card footprint
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

function normalize(raw: unknown): EntryRow[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: EntryRow[] = [];
  for (const r of list) {
    if (out.length >= MAX_ROWS) break;
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

@Controller('api/journal-entry-rows')
@UseGuards(JwtAuthGuard)
export class JournalEntryRowsController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':entryId')
  async get(
    @Param('entryId') entryIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ providers: ProviderResult[] }> {
    if (!pluginsEnabled() || !isAddonEnabled(ADDON_IDS.JOURNEY)) return { providers: [] };
    const entryId = Number(entryIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(entryId) || userId == null) return { providers: [] };

    // The entry's journey must be one the caller can access — same gate as a read.
    const row = db.prepare('SELECT journey_id FROM journey_entries WHERE id = ?').get(entryId) as { journey_id: number } | undefined;
    if (!row || !canAccessJourney(row.journey_id, userId)) return { providers: [] };

    const ids = this.runtime.providersOf('journalEntryProvider');
    const results = await Promise.all(
      ids.map(async (id): Promise<ProviderResult | null> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'journalEntryProvider', 'getRows', [entryId], userId, 5000);
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
