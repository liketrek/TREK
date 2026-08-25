import { Controller, Get, HttpException, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import path from 'node:path';
import { JourneyService } from './journey.service';
import { StorageService } from '../storage/storage.service';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { ADDON_IDS } from '../../addons';
import { Public } from '../auth/public.decorator';

/**
 * /api/public/journey — unauthenticated, share-token validated read + photo
 * proxy for publicly shared journeys.
 *
 * Byte-identical to the legacy Express route (server/src/routes/journeyPublic.ts):
 * no authentication, every route validates the share token (404 on failure),
 * the unified proxy streams by trek_photo_id and the legacy proxy serves local
 * files (with the uploads-dir traversal guard) or proxies immich/synology.
 *
 * The addon gate is the one guard here, and it has to be: turning the Journey
 * addon off is meant to take the feature away, and without it already-published
 * journeys stayed publicly readable while the authenticated surface went dark.
 * AddonGuard only reads addon state, so it is safe in front of a @Public route.
 */
@Public('share-token validated: the whole point is a link that works without an account')
@UseGuards(AddonGuard)
@RequireAddon(ADDON_IDS.JOURNEY, 'Journey')
@Controller('api/public/journey')
export class JourneyPublicController {
  constructor(
    private readonly journey: JourneyService,
    private readonly storage: StorageService,
  ) {}

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
    @Param('kind') kind: string,
    @Res() res: Response,
  ): Promise<void> {
    const valid = this.journey.validateShareTokenForAsset(token, assetId);
    if (!valid) {
      throw new HttpException({ error: 'Not found' }, 404);
    }

    const wantThumb = kind === 'thumbnail' ? 'thumbnail' : 'original';

    if (provider === 'local') {
      // Local journey assets are flat filenames. basename() kept for shape;
      // containment now lives in central storage key validation
      // (storage-keys.ts), which subsumes the old journeyDir startsWith guard.
      const name = path.basename(assetId);
      if (!(await this.storage.exists('journey', name).catch(() => false))) {
        throw new HttpException({ error: 'Not found' }, 404);
      }
      res.set('Cache-Control', 'public, max-age=86400');
      // The storage layer serves it, whichever driver is configured. dev's fix
      // for the absolute-path 404 under the Nest ExpressAdapter does not apply
      // here any more: nothing on this path calls sendFile.
      await this.storage.sendToResponse('journey', name, res);
      return;
    }

    // :ownerId stays in the route pattern so old share links keep routing, but
    // it is not bound at all any more: the owner comes from the row the token
    // resolved to.
    const effectiveOwnerId = valid.ownerId;
    const streaming = this.journey.streamProviderAsset(
      res,
      provider,
      { userId: effectiveOwnerId, ownerId: effectiveOwnerId, assetId },
      wantThumb,
    );
    if (streaming === null) {
      res.status(404).json({ error: 'Provider not supported' });
      return;
    }
    try {
      await streaming;
    } catch {
      // Kept: a provider that throws mid-parse answered 404 here before, and a
      // share link that half-writes a response is worse than one that 404s.
      res.status(404).json({ error: 'Provider not supported' });
    }
  }
}
