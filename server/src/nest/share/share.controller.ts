import { Body, Controller, Delete, Get, HttpException, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { User } from '../../types';
import { ShareService } from './share.service';
import { StorageService } from '../storage/storage.service';
import { isClientAbortError } from '../storage/storage.types';
import { ShareLinkDto } from './share.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

/**
 * /api/trips/:tripId/share-link — manage a trip's public read-only share token.
 *
 * Trip access answers 404, the 'share_manage' permission answers 403, and the
 * create-vs-update status split is preserved (201 on first creation, 200 on a
 * subsequent update). The permission now covers GET as well: it used to require
 * trip access alone, which let any member read out the owner's public token.
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
    @Body() body: ShareLinkDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.requireManage(tripId, user);
    const result = this.share.createOrUpdate(tripId, user.id, {
      share_map: body.share_map,
      share_bookings: body.share_bookings,
      share_packing: body.share_packing,
      share_budget: body.share_budget,
      share_collab: body.share_collab,
    });
    // 201 only on first creation; an update answers 200, mirroring the legacy route.
    res.status(result.created ? 201 : 200);
    return { token: result.token };
  }

  @Get()
  get(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    // The token is the whole credential for the anonymous /api/shared/:token
    // page, so reading it needs the same share_manage permission as creating or
    // deleting it, not just trip access. Trip membership lets someone read the
    // trip while signed in; it does not let them hand out a copy that works
    // without an account and outlives their membership.
    this.requireManage(tripId, user);
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
@Public('share-token validated: a shared trip link has to work for somebody without an account')
@Controller('api/shared')
export class SharedController {
  constructor(
    private readonly share: ShareService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Public, token-scoped place-photo proxy. The shared payload rewrites place
   * image URLs to this route so thumbnails load without a session cookie (the
   * /api/maps bytes endpoint is JwtAuthGuard'd). The service validates the token
   * and that the place belongs to its trip; a miss streams nothing and answers
   * an empty 204, mirroring MapsController.placePhotoBytes (#1727's rationale
   * extended to shared pages: shared payloads keep this URL in place
   * image_urls, so evicted cache entries would otherwise 404 once per place
   * per render). Declared before the bare ':token' read route. Cached photos
   * are always JPEG.
   */
  @Get(':token/place-photo/:placeId/bytes')
  async placePhotoBytes(@Param('token') token: string, @Param('placeId') placeId: string, @Res() res: Response): Promise<void> {
    const key = await this.share.getSharedPlacePhotoKey(token, placeId);
    if (!key) {
      this.emptyPhoto(res);
      return;
    }
    // Bytes are stream-piped like the maps handler; headers go on before the
    // stream attempt so an early failure overrides them exactly as the old
    // createReadStream error event did.
    res.set('Cache-Control', 'public, max-age=2592000, immutable');
    res.type('image/jpeg');
    let stream: Readable;
    try {
      ({ stream } = await this.storage.getStream('photos-google', key));
    } catch {
      // Cache-delete race — same terminal state as the stream error path.
      if (!res.headersSent) this.emptyPhoto(res);
      return;
    }
    try {
      // pipeline destroys the source on any failure (no leaked read handle),
      // matching storage.service.ts's sendToResponse contract.
      await pipeline(stream, res);
    } catch (err) {
      if (!res.headersSent) {
        // Same terminal state as the old pre-flush stream error path.
        this.emptyPhoto(res);
        return;
      }
      // Bytes are already on the wire — a client abort mid-download is the
      // client's problem now, not ours; a real source error still surfaces
      // (to the exception filter, which now no-ops safely on headersSent).
      if (!isClientAbortError(err)) throw err;
    }
  }

  // 204 for "no bytes to serve". Overrides the immutable Cache-Control the hit
  // path already set — a photo that reappears in the cache must not stay hidden
  // behind a month-old empty response.
  private emptyPhoto(res: Response): void {
    res.set('Cache-Control', 'no-store');
    res.status(204).end();
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
