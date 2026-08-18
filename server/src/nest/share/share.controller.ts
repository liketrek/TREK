import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import type { User } from '../../types';
import { ShareService } from './share.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NOTE_UPLOAD } from '../collab/collab.controller';

/**
 * /api/trips/:tripId/share-link — manage a trip's public read-only share token.
 *
 * Byte-identical to the legacy Express route (server/src/routes/share.ts): trip
 * access (404), the 'share_manage' permission (403), and the create-vs-update
 * status split (201 on first creation, 200 on a subsequent update).
 */
@Controller('api/trips/:tripId/share-link')
@UseGuards(JwtAuthGuard)
export class TripShareController {
  constructor(private readonly share: ShareService) {}

  private requireManage(tripId: string, user: User) {
    const trip = this.share.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!this.share.canManage(trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { share_map?: boolean; share_bookings?: boolean; share_packing?: boolean; share_budget?: boolean; share_collab?: boolean; allow_guest_notes?: boolean },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.requireManage(tripId, user);
    const result = this.share.createOrUpdate(tripId, user.id, {
      share_map: body.share_map,
      share_bookings: body.share_bookings,
      share_packing: body.share_packing,
      share_budget: body.share_budget,
      share_collab: body.share_collab,
      allow_guest_notes: body.allow_guest_notes,
    });
    // 201 only on first creation; an update answers 200, mirroring the legacy route.
    res.status(result.created ? 201 : 200);
    return { token: result.token };
  }

  @Get()
  get(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    if (!this.share.verifyTripAccess(tripId, user.id)) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    const info = this.share.get(tripId);
    return info ? info : { token: null };
  }

  @Delete()
  remove(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireManage(tripId, user);
    this.share.remove(tripId);
    return { success: true };
  }
}

/**
 * GET /api/shared/:token — public, unauthenticated read-only trip snapshot.
 * Deliberately NOT behind a guard; an invalid/expired token answers 404.
 */
@Controller('api/shared')
export class SharedController {
  constructor(private readonly share: ShareService) {}

  /**
   * Public, token-scoped place-photo proxy. The shared payload rewrites place
   * image URLs to this route so thumbnails load without a session cookie (the
   * /api/maps bytes endpoint is JwtAuthGuard'd). The service validates the token
   * and that the place belongs to its trip; a miss streams nothing and answers
   * 404. Declared before the bare ':token' read route. Streaming mirrors
   * MapsController.placePhotoBytes (cached photos are always JPEG).
   */
  @Get(':token/place-photo/:placeId/bytes')
  placePhotoBytes(@Param('token') token: string, @Param('placeId') placeId: string, @Res() res: Response): void {
    const fp = this.share.getSharedPlacePhotoPath(token, placeId);
    if (!fp) {
      res.status(404).json({ error: 'Photo not cached' });
      return;
    }
    res.set('Cache-Control', 'public, max-age=2592000, immutable');
    res.type('image/jpeg');
    const stream = createReadStream(fp);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ error: 'Photo not cached' });
    });
    stream.pipe(res);
  }

  @Post(':token/notes')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', NOTE_UPLOAD))
  createGuestNote(
    @Param('token') token: string,
    @Body() body: { title?: string; content?: string; category?: string; guest_name?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const shareRow = this.share.getValidShareToken(token);
    if (!shareRow) {
      throw new HttpException({ error: 'Invalid or expired link' }, 404);
    }
    if (!shareRow.allow_guest_notes) {
      throw new HttpException({ error: 'Guest note submissions are disabled for this link' }, 403);
    }

    const guestName = typeof body.guest_name === 'string' ? body.guest_name.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!guestName || !title) {
      throw new HttpException({ error: 'guest_name and title are required' }, 400);
    }

    const content = typeof body.content === 'string' ? body.content.trim() : undefined;
    const category = typeof body.category === 'string' ? body.category.trim() : undefined;

    const note = this.share.createGuestNote(
      shareRow.trip_id,
      shareRow.created_by,
      {
        title,
        content,
        category,
        guest_name: guestName,
      },
      file,
    );

    return { success: true, note };
  }

  @Get(':token')
  read(@Param('token') token: string) {
    const data = this.share.getSharedTripData(token);
    if (!data) {
      throw new HttpException({ error: 'Invalid or expired link' }, 404);
    }
    return data;
  }
}
