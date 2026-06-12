import { Body, Controller, Get, Headers, HttpCode, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { User } from '../../types';
import type { ServiceResult } from '../../services/memories/helpersService';
import { fail, success } from '../../services/memories/helpersService';
import { MemoriesService } from './memories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

function _parseStringBodyField(value: unknown): string {
  return String(value ?? '').trim();
}

function _parseNumberBodyField(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * /api/integrations/memories/synologyphotos — Synology Photos connection,
 * search, albums and asset proxy.
 *
 * Byte-identical to the legacy Express router (server/src/routes/memories/synology.ts):
 * every response goes through the service `ServiceResult` envelope (success →
 * `res.json(data)` at 200, error → status + `{ error }`); `/status` and `/test`
 * always answer 200 (the service shapes `{ connected: false, error }` on
 * failure); the asset routes use the distinct 403 string "You don't have access
 * to this photo"; `/info` is declared before the catch-all `/:kind` so the
 * literal route wins as Express ordered it; lenient hand-rolled coercion is kept.
 */
@Controller('api/integrations/memories/synologyphotos')
@UseGuards(JwtAuthGuard)
export class SynologyMemoriesController {
  constructor(private readonly memories: MemoriesService) {}

  private handle<T>(res: Response, result: ServiceResult<T>): void {
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
    } else {
      res.json(result.data);
    }
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    this.handle(res, await this.memories.synologyGetSettings(user.id));
  }

  @Put('settings')
  async putSettings(@CurrentUser() user: User, @Body() body: Record<string, unknown>, @Res() res: Response): Promise<void> {
    const synology_url = _parseStringBodyField(body.synology_url);
    const synology_username = _parseStringBodyField(body.synology_username);
    const synology_password = _parseStringBodyField(body.synology_password);
    const synology_skip_ssl = body.synology_skip_ssl === true || body.synology_skip_ssl === 'true';

    if (!synology_url || !synology_username) {
      this.handle(res, fail('URL and username are required', 400));
    } else {
      this.handle(res, await this.memories.synologyUpdateSettings(user.id, synology_url, synology_username, synology_password, synology_skip_ssl));
    }
  }

  @Get('status')
  async getStatus(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    this.handle(res, await this.memories.synologyGetStatus(user.id));
  }

  @Post('test')
  @HttpCode(200)
  async test(@CurrentUser() user: User, @Body() body: Record<string, unknown>, @Res() res: Response): Promise<void> {
    const synology_url = _parseStringBodyField(body.synology_url);
    const synology_username = _parseStringBodyField(body.synology_username);
    const synology_password = _parseStringBodyField(body.synology_password);
    const synology_otp = _parseStringBodyField(body.synology_otp);
    const synology_skip_ssl = body.synology_skip_ssl === true || body.synology_skip_ssl === 'true';

    if (!synology_url || !synology_username || !synology_password) {
      const missingFields: string[] = [];
      if (!synology_url) missingFields.push('URL');
      if (!synology_username) missingFields.push('Username');
      if (!synology_password) missingFields.push('Password');
      this.handle(res, success({ connected: false, error: `${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required` }));
    } else {
      this.handle(res, await this.memories.synologyTestConnection(user.id, synology_url, synology_username, synology_password, synology_otp, synology_skip_ssl));
    }
  }

  @Get('albums')
  async albums(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    this.handle(res, await this.memories.synologyListAlbums(user.id));
  }

  @Get('albums/:albumId/photos')
  async albumPhotos(@CurrentUser() user: User, @Param('albumId') albumId: string, @Query('passphrase') passphraseRaw: string | undefined, @Res() res: Response): Promise<void> {
    const passphrase = passphraseRaw ? String(passphraseRaw) : undefined;
    this.handle(res, await this.memories.synologyGetAlbumPhotos(user.id, albumId, passphrase));
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
    this.handle(res, await this.memories.synologySyncAlbumLink(user.id, tripId, linkId, sid));
  }

  @Post('search')
  @HttpCode(200)
  async search(@CurrentUser() user: User, @Body() body: Record<string, unknown>, @Res() res: Response): Promise<void> {
    const from = _parseStringBodyField(body.from);
    const to = _parseStringBodyField(body.to);
    let offset = _parseNumberBodyField(body.offset, 0);
    const page = _parseNumberBodyField(body.page, 1) - 1;
    let limit = _parseNumberBodyField(body.limit, 100);
    const size = _parseNumberBodyField(body.size, 0);
    if (size > 0) limit = size;
    if (page > 0) offset = page * limit;

    this.handle(res, await this.memories.synologySearchPhotos(user.id, from || undefined, to || undefined, offset, limit));
  }

  @Get('assets/:tripId/:photoId/:ownerId/info')
  async assetInfo(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('photoId') photoId: string,
    @Param('ownerId') ownerId: string,
    @Query('passphrase') passphraseRaw: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const passphrase = passphraseRaw ? String(passphraseRaw) : undefined;
    if (!this.memories.canAccessUserPhoto(user.id, Number(ownerId), tripId, photoId, 'synologyphotos')) {
      this.handle(res, fail("You don't have access to this photo", 403));
    } else {
      this.handle(res, await this.memories.synologyGetAssetInfo(user.id, photoId, Number(ownerId), passphrase));
    }
  }

  @Get('assets/:tripId/:photoId/:ownerId/:kind')
  async asset(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('photoId') photoId: string,
    @Param('ownerId') ownerId: string,
    @Param('kind') kind: string,
    @Query('size') sizeRaw: string | undefined,
    @Query('passphrase') passphraseRaw: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const VALID_SIZES = ['sm', 'm', 'xl'] as const;
    const rawSize = String(sizeRaw ?? 'sm');
    const size = (VALID_SIZES as readonly string[]).includes(rawSize) ? rawSize : 'sm';
    const passphrase = passphraseRaw ? String(passphraseRaw) : undefined;

    if (kind !== 'thumbnail' && kind !== 'original') {
      this.handle(res, fail('Invalid asset kind', 400));
      return;
    }

    if (!this.memories.canAccessUserPhoto(user.id, Number(ownerId), tripId, photoId, 'synologyphotos')) {
      this.handle(res, fail("You don't have access to this photo", 403));
    } else {
      await this.memories.synologyStreamAsset(res, user.id, Number(ownerId), photoId, kind, String(size), passphrase);
    }
  }
}
