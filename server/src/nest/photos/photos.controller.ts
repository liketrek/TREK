import { Controller, Get, Headers, HttpException, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { User } from '../../types';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/photos/:id/{thumbnail,original,info} — global (not trip-scoped) photo
 * access for the memories/journey features. Streaming endpoints write straight
 * to the response via the resolver service.
 *
 * Byte-identical to the legacy Express route (server/src/routes/photos.ts):
 * a finite-id guard (400), the canAccessTrekPhoto check (403), then stream or
 * the provider info (404 inside the service / mapped error for info).
 */
@Controller('api/photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  private requireAccess(user: User, rawId: string): number {
    const photoId = Number(rawId);
    if (!Number.isFinite(photoId)) {
      throw new HttpException({ error: 'Invalid photo ID' }, 400);
    }
    if (!this.photos.canAccess(user.id, photoId)) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }
    return photoId;
  }

  @Get(':id/thumbnail')
  async thumbnail(@CurrentUser() user: User, @Param('id') id: string, @Res() res: Response): Promise<void> {
    const photoId = this.requireAccess(user, id);
    await this.photos.stream(res, user.id, photoId, 'thumbnail');
  }

  @Get(':id/original')
  async original(@CurrentUser() user: User, @Param('id') id: string, @Res() res: Response, @Headers('range') range?: string): Promise<void> {
    const photoId = this.requireAccess(user, id);
    await this.photos.stream(res, user.id, photoId, 'original', range);
  }

  @Get(':id/info')
  async info(@CurrentUser() user: User, @Param('id') id: string, @Res() res: Response): Promise<void> {
    const photoId = this.requireAccess(user, id);
    const result = await this.photos.info(user.id, photoId);
    if ('error' in result) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.json(result.data);
  }
}
