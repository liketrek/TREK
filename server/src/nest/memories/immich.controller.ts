import { Body, Controller, Get, Headers, HttpCode, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '../../types';
import { MemoriesService } from './memories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { getClientIp } from '../../services/auditLog';

/**
 * /api/integrations/memories/immich — Immich connection, browse/search, asset
 * proxy and album linking.
 *
 * Byte-identical to the legacy Express router (server/src/routes/memories/immich.ts):
 * `/status` and `/test` answer 200 even on connection failure (the service shapes
 * `{ connected: false, ... }`); `/settings` PUT validates with a 400; the asset
 * routes do the 400 invalid-id guard then the canAccessUserPhoto 403 ('Forbidden')
 * before streaming or returning info; the album sync answers 200 then broadcasts.
 * The legacy `canAccessTrip` import there is dead code — intentionally not ported.
 */
@Controller('api/integrations/memories/immich')
@UseGuards(JwtAuthGuard)
export class ImmichMemoriesController {
  constructor(private readonly memories: MemoriesService) {}

  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return this.memories.immichGetConnectionSettings(user.id);
  }

  @Put('settings')
  async putSettings(
    @CurrentUser() user: User,
    @Body() body: { immich_url?: string; immich_api_key?: string; auto_upload?: unknown },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { immich_url, immich_api_key, auto_upload } = body;
    const result = await this.memories.immichSaveSettings(user.id, immich_url, immich_api_key, getClientIp(req));
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    if (typeof auto_upload === 'boolean') {
      this.memories.immichSetAutoUpload(user.id, auto_upload);
    }
    if (result.warning) {
      res.json({ success: true, warning: result.warning });
      return;
    }
    res.json({ success: true });
  }

  @Get('status')
  async getStatus(@CurrentUser() user: User) {
    return this.memories.immichGetConnectionStatus(user.id);
  }

  @Post('test')
  @HttpCode(200)
  async test(@Body() body: { immich_url?: string; immich_api_key?: string }) {
    const { immich_url, immich_api_key } = body;
    if (!immich_url || !immich_api_key) {
      return { connected: false, error: 'URL and API key required' };
    }
    return this.memories.immichTestConnection(immich_url, immich_api_key);
  }

  @Get('browse')
  async browse(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    const result = await this.memories.immichBrowseTimeline(user.id);
    if (result.error) {
      res.status(result.status!).json({ error: result.error });
      return;
    }
    res.json({ buckets: result.buckets });
  }

  @Post('search')
  @HttpCode(200)
  async search(@CurrentUser() user: User, @Body() body: Record<string, unknown>, @Res() res: Response): Promise<void> {
    const { from, to, size, page } = body as { from?: string; to?: string; size?: unknown; page?: unknown };
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(Number(size) || 50, 200);
    const result = await this.memories.immichSearchPhotos(user.id, from, to, pageNum, pageSize);
    if (result.error) {
      res.status(result.status!).json({ error: result.error });
      return;
    }
    res.json({ assets: result.assets || [], hasMore: !!result.hasMore });
  }

  @Get('assets/:tripId/:assetId/:ownerId/info')
  async assetInfo(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('assetId') assetId: string,
    @Param('ownerId') ownerId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.memories.immichIsValidAssetId(assetId)) {
      res.status(400).json({ error: 'Invalid asset ID' });
      return;
    }
    if (!this.memories.canAccessUserPhoto(user.id, Number(ownerId), tripId, assetId, 'immich')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const result = await this.memories.immichGetAssetInfo(user.id, assetId, Number(ownerId));
    if (result.error) {
      res.status(result.status!).json({ error: result.error });
      return;
    }
    res.json(result.data);
  }

  @Get('assets/:tripId/:assetId/:ownerId/thumbnail')
  async assetThumbnail(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('assetId') assetId: string,
    @Param('ownerId') ownerId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.memories.immichIsValidAssetId(assetId)) {
      res.status(400).json({ error: 'Invalid asset ID' });
      return;
    }
    if (!this.memories.canAccessUserPhoto(user.id, Number(ownerId), tripId, assetId, 'immich')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    await this.memories.immichStreamAsset(res, user.id, assetId, 'thumbnail', Number(ownerId));
  }

  @Get('assets/:tripId/:assetId/:ownerId/original')
  async assetOriginal(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('assetId') assetId: string,
    @Param('ownerId') ownerId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.memories.immichIsValidAssetId(assetId)) {
      res.status(400).json({ error: 'Invalid asset ID' });
      return;
    }
    if (!this.memories.canAccessUserPhoto(user.id, Number(ownerId), tripId, assetId, 'immich')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    await this.memories.immichStreamAsset(res, user.id, assetId, 'original', Number(ownerId));
  }

  @Get('albums')
  async albums(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    const result = await this.memories.immichListAlbums(user.id);
    if (result.error) {
      res.status(result.status!).json({ error: result.error });
      return;
    }
    res.json({ albums: result.albums });
  }

  @Get('albums/:albumId/photos')
  async albumPhotos(@CurrentUser() user: User, @Param('albumId') albumId: string, @Res() res: Response): Promise<void> {
    const result = await this.memories.immichGetAlbumPhotos(user.id, albumId);
    if (result.error) {
      res.status(result.status!).json({ error: result.error });
      return;
    }
    res.json({ assets: result.assets });
  }

  @Post('trips/:tripId/album-links/:linkId/sync')
  @HttpCode(200)
  async sync(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('linkId') linkId: string,
    @Headers('x-socket-id') sid: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.memories.immichSyncAlbumAssets(tripId, linkId, user.id, sid);
    if (result.error) {
      res.status(result.status!).json({ error: result.error });
      return;
    }
    res.json({ success: true, added: result.added, total: result.total });
    if (result.added! > 0) {
      this.memories.broadcast(tripId, 'memories:updated', { userId: user.id }, sid);
    }
  }
}
