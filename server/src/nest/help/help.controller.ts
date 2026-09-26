import { Controller, Get, HttpException, Param, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../auth/public.decorator';
import {
  getWikiIndex,
  getWikiPage,
  getWikiAsset,
  isLocalWiki,
  searchWiki,
  WikiNotFound,
  type WikiPage,
  type WikiNavSection,
  type WikiSearchHit,
} from './wiki';

/** Longest query the search accepts; anything past it is noise, not a question. */
const SEARCH_MAX_QUERY = 120;

/**
 * /api/help — embedded TREK wiki, served from the `wiki/` directory that ships
 * with the app (see wiki.ts for the GitHub fallback). Content is public docs,
 * so these endpoints are unauthenticated; that also lets <img> tags load the
 * proxied assets without sending credentials.
 */
@Public('help assets are loaded by <img> and <a>, which cannot send credentials')
@Controller('api/help')
export class HelpController {
  @Get('index')
  index(): Promise<{ sections: WikiNavSection[] }> {
    return getWikiIndex();
  }

  /**
   * Full-text search over the bundled pages, for the help panel's search box.
   * `q` is required; `limit` is optional and clamped by the search itself.
   */
  @Get('search')
  async search(@Query('q') q?: string, @Query('limit') limit?: string): Promise<{ hits: WikiSearchHit[] }> {
    const query = (q ?? '').trim();
    if (!query) throw new HttpException({ error: 'A search query is required' }, 400);
    if (query.length > SEARCH_MAX_QUERY) {
      throw new HttpException({ error: `Search query too long (max ${SEARCH_MAX_QUERY} chars)` }, 400);
    }
    const n = limit === undefined ? undefined : Number(limit);
    if (n !== undefined && !Number.isInteger(n)) throw new HttpException({ error: 'limit must be an integer' }, 400);
    try {
      return { hits: await searchWiki(query, n) };
    } catch {
      throw new HttpException({ error: 'Help search unavailable' }, 502);
    }
  }

  @Get('page/:slug')
  async page(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
    try {
      const page: WikiPage = await getWikiPage(slug);
      res.json(page);
    } catch (err) {
      res.status(err instanceof WikiNotFound ? 404 : 502).json({ error: 'Help page unavailable' });
    }
  }

  @Get('asset/*')
  async asset(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Take everything after `/asset/` straight from the URL — the Express
    // wildcard param isn't reliably populated through the Nest adapter.
    const after = (req.originalUrl || req.url).split('/asset/')[1] ?? '';
    const assetPath = decodeURIComponent(after.split('?')[0]);
    try {
      const { buf, type } = await getWikiAsset(assetPath);
      res.setHeader('Content-Type', type);
      // Bundled assets are pinned to this build, so they can be cached hard; the
      // GitHub fallback refreshes hourly, so match that TTL instead.
      res.setHeader('Cache-Control', isLocalWiki() ? 'public, max-age=86400' : 'public, max-age=3600');
      res.end(buf);
    } catch {
      res.status(404).end();
    }
  }
}
