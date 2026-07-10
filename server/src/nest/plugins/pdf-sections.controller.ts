import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { canAccessTrip } from '../../db/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { stripEmoji } from './text-sanitize';

/**
 * GET /api/pdf-sections/:tripId — text-only sections plugins append to a trip's
 * PDF export via the `pdfSectionProvider` hook. Additive + fail-safe like the
 * other provider-hook controllers: the caller must access the trip, each provider
 * runs host->plugin on a short timeout, and one that errors/times out contributes
 * nothing.
 *
 * DECLARATIVE ONLY — a plugin never renders into the document; it returns plain
 * strings the export escapes and lays out itself. Everything is normalized here:
 * strings are String()-coerced + length-capped, paragraph/row/header counts are
 * capped, table rows are clipped to the header width, and the section count is
 * capped per plugin. No urls in a PDF, so there is nothing to allowlist.
 */
interface PdfTable {
  headers: string[];
  rows: string[][];
}
interface PdfSection {
  pluginId: string;
  title: string;
  paragraphs: string[];
  table?: PdfTable;
}

const MAX_SECTIONS = 5; // per provider — bounds the export size
const MAX_PARAGRAPHS = 20;
const MAX_HEADERS = 8;
const MAX_ROWS = 50;
const TITLE_MAX = 120;
const PARAGRAPH_MAX = 2000;
const HEADER_MAX = 60;
const CELL_MAX = 200;

const cap = (v: unknown, n: number): string => stripEmoji(String(v ?? '')).slice(0, n);

function normalizeTable(raw: unknown): PdfTable | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const t = raw as Record<string, unknown>;
  const headers = (Array.isArray(t.headers) ? t.headers : []).slice(0, MAX_HEADERS).map((h) => cap(h, HEADER_MAX));
  // A table without headers has no width to clip rows to — drop it.
  if (headers.length === 0) return undefined;
  const rows = (Array.isArray(t.rows) ? t.rows : [])
    .slice(0, MAX_ROWS)
    .map((row) => (Array.isArray(row) ? row : []).slice(0, headers.length).map((c) => cap(c, CELL_MAX)));
  return { headers, rows };
}

function normalize(pluginId: string, raw: unknown): PdfSection[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const out: PdfSection[] = [];
  for (const s of list) {
    if (out.length >= MAX_SECTIONS) break;
    if (!s || typeof s !== 'object') continue;
    const title = cap(s.title, TITLE_MAX);
    if (!title) continue; // a section without a heading is meaningless — drop it
    out.push({
      pluginId,
      title,
      paragraphs: (Array.isArray(s.paragraphs) ? s.paragraphs : []).slice(0, MAX_PARAGRAPHS).map((p) => cap(p, PARAGRAPH_MAX)),
      table: normalizeTable(s.table),
    });
  }
  return out;
}

@Controller('api/pdf-sections')
@UseGuards(JwtAuthGuard)
export class PdfSectionsController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get(':tripId')
  async get(
    @Param('tripId') tripIdRaw: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ sections: PdfSection[] }> {
    if (!pluginsEnabled()) return { sections: [] };
    const tripId = Number(tripIdRaw);
    const userId = req.user?.id;
    if (!Number.isFinite(tripId) || userId == null || !canAccessTrip(tripId, userId)) return { sections: [] };

    const ids = this.runtime.providersOf('pdfSectionProvider');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<PdfSection[]> => {
        try {
          const raw = await this.runtime.invokeHook(id, 'pdfSectionProvider', 'getSections', [tripId], userId, 5000);
          return normalize(id, raw);
        } catch {
          return []; // a slow / failing provider contributes nothing
        }
      }),
    );
    return { sections: perProvider.flat() };
  }
}
