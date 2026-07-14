import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  getWikiIndex,
  getWikiPage,
  getWikiAsset,
  isLocalWiki,
  WikiNotFound,
  type WikiPage,
  type WikiNavSection,
} from '../../services/wikiService';

/**
 * /api/help — embedded TREK wiki, served from the `wiki/` directory that ships
 * with the app (see wikiService for the GitHub fallback). Content is public docs,
 * so these endpoints are unauthenticated; that also lets <img> tags load the
 * proxied assets without sending credentials.
 */
@Controller('api/help')
export class HelpController {
  @Get('index')
  index(): Promise<{ sections: WikiNavSection[] }> {
    return getWikiIndex();
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
