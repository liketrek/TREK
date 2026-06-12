import { Controller, Get, HttpException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { JourneyService } from './journey.service';

/**
 * /api/public/journey — unauthenticated, share-token validated read + photo
 * proxy for publicly shared journeys.
 *
 * Byte-identical to the legacy Express route (server/src/routes/journeyPublic.ts):
 * NOT behind any guard, every route validates the share token (404 on failure),
 * the unified proxy streams by trek_photo_id and the legacy proxy serves local
 * files (with the uploads-dir traversal guard) or proxies immich/synology.
 */
@Controller('api/public/journey')
export class JourneyPublicController {
  constructor(private readonly journey: JourneyService) {}

  @Get(':token')
  get(@Param('token') token: string) {
    const data = this.journey.getPublicJourney(token);
    if (!data) {
      throw new HttpException({ error: 'Not found' }, 404);
    }
    return data;
  }

  @Get(':token/photos/:photoId/:kind')
  async photo(@Param('token') token: string, @Param('photoId') photoId: string, @Param('kind') kind: string, @Res() res: Response): Promise<void> {
    const valid = this.journey.validateShareTokenForPhoto(token, Number(photoId));
    if (!valid) {
      throw new HttpException({ error: 'Not found' }, 404);
    }
    await this.journey.streamPhoto(res, valid.ownerId, Number(photoId), kind === 'thumbnail' ? 'thumbnail' : 'original');
  }

  @Get(':token/photo/:provider/:assetId/:ownerId/:kind')
  async legacyPhoto(
    @Param('token') token: string,
    @Param('provider') provider: string,
    @Param('assetId') assetId: string,
    @Param('ownerId') ownerId: string,
    @Param('kind') kind: string,
    @Res() res: Response,
  ): Promise<void> {
    const valid = this.journey.validateShareTokenForAsset(token, assetId);
    if (!valid) {
      throw new HttpException({ error: 'Not found' }, 404);
    }

    const wantThumb = kind === 'thumbnail' ? 'thumbnail' : 'original';

    if (provider === 'local') {
      // Local journey assets are flat filenames; use basename() and confine the
      // resolved path to the journey upload directory.
      const journeyDir = path.resolve(__dirname, '../../../uploads/journey');
      const resolved = path.resolve(path.join(journeyDir, path.basename(assetId)));
      if (!resolved.startsWith(journeyDir + path.sep) || !fs.existsSync(resolved)) {
        throw new HttpException({ error: 'Not found' }, 404);
      }
      res.set('Cache-Control', 'public, max-age=86400');
      res.sendFile(resolved);
      return;
    }

    const effectiveOwnerId = valid.ownerId || Number(ownerId);
    if (provider === 'immich') {
      await this.journey.streamImmichAsset(res, effectiveOwnerId, assetId, wantThumb, effectiveOwnerId);
    } else {
      try {
        await this.journey.streamSynologyAsset(res, effectiveOwnerId, effectiveOwnerId, assetId, wantThumb);
      } catch {
        res.status(404).json({ error: 'Provider not supported' });
      }
    }
  }
}
