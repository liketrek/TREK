import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { User } from '../../types';
import type { Selection } from '../../services/memories/helpersService';
import { MemoriesService } from './memories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/integrations/memories/unified — provider-agnostic trip photo + album-link
 * management.
 *
 * Byte-identical to the legacy Express router (server/src/routes/memories/unified.ts):
 * bare `authenticate` (JwtAuthGuard), success bodies on 200, and the per-result
 * error envelope `{ error }` at `result.error.status` reused from the unified
 * service. Lenient hand-rolled body coercion is preserved — no Zod here.
 */
@Controller('api/integrations/memories/unified')
@UseGuards(JwtAuthGuard)
export class UnifiedMemoriesController {
  constructor(private readonly memories: MemoriesService) {}

  @Get('trips/:tripId/photos')
  listPhotos(@CurrentUser() user: User, @Param('tripId') tripId: string, @Res() res: Response): void {
    const result = this.memories.listTripPhotos(tripId, user.id);
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json({ photos: result.data });
  }

  @Post('trips/:tripId/photos')
  @HttpCode(200)
  async addPhotos(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') sid: string,
    @Res() res: Response,
  ): Promise<void> {
    const selections: Selection[] = Array.isArray(body?.selections) ? (body.selections as Selection[]) : [];
    const shared = body?.shared === undefined ? true : !!body?.shared;
    const result = await this.memories.addTripPhotos(tripId, user.id, shared, selections, sid);
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json({ success: true, added: result.data.added });
  }

  @Put('trips/:tripId/photos/sharing')
  async setSharing(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.memories.setTripPhotoSharing(tripId, user.id, Number(body?.photo_id), body?.shared as boolean);
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json({ success: true });
  }

  @Delete('trips/:tripId/photos')
  async removePhoto(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ): Promise<void> {
    const result = this.memories.removeTripPhoto(tripId, user.id, Number(body?.photo_id));
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json({ success: true });
  }

  @Get('trips/:tripId/album-links')
  listAlbumLinks(@CurrentUser() user: User, @Param('tripId') tripId: string, @Res() res: Response): void {
    const result = this.memories.listTripAlbumLinks(tripId, user.id);
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json({ links: result.data });
  }

  @Post('trips/:tripId/album-links')
  @HttpCode(200)
  createAlbumLink(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ): void {
    const passphrase = body?.passphrase ? String(body.passphrase) : undefined;
    const result = this.memories.createTripAlbumLink(tripId, user.id, body?.provider, body?.album_id, body?.album_name, passphrase);
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json({ success: true });
  }

  @Delete('trips/:tripId/album-links/:linkId')
  removeAlbumLink(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('linkId') linkId: string,
    @Res() res: Response,
  ): void {
    const result = this.memories.removeAlbumLink(tripId, linkId, user.id);
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json({ success: true });
  }
}
