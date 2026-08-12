import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { diskStorage } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../../types';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { writeAudit, getClientIp, logInfo } from '../../services/auditLog';
import { isDemoEmail } from '../../services/demo';
import { NotFoundError, ValidationError } from '../../services/tripService';
import { saveUnsplashCover, isUnsplashCoverUrl } from '../../services/unsplashService';

const MAX_COVER_SIZE = 20 * 1024 * 1024;
const coversDir = path.join(__dirname, '../../../uploads/covers');
const COVER_UPLOAD = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
      cb(null, coversDir);
    },
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: MAX_COVER_SIZE },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (file.mimetype.startsWith('image/') && !file.mimetype.includes('svg') && allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only jpg, png, gif, webp images allowed'), false);
  },
};

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

/**
 * /api/trips — the trip aggregate root.
 *
 * Byte-identical to the legacy Express route (server/src/routes/trips.ts): the
 * same per-field permission checks (trip_create / trip_edit / trip_archive /
 * trip_cover_upload / trip_delete / member_manage), the date inference on create,
 * audit logging, the offline bundle, ICS export and member-invite notification.
 * Uses EXACT strangler prefixes so it never swallows the nested sub-domain mounts.
 */
@Controller('api/trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Get()
  list(@CurrentUser() user: User, @Query('archived') archived?: string) {
    return { trips: this.trips.list(user.id, archived === '1' ? 1 : 0) };
  }

  @Get('cover-images/search')
  async coverImages(@CurrentUser() user: User, @Query('query') query?: string) {
    try {
      const result = await this.trips.searchCoverImages(query || '', user.id);
      if ('error' in result) {
        throw new HttpException({ error: result.error }, result.status);
      }
      return { photos: result.photos };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      console.error('Unsplash cover image error:', err);
      throw new HttpException({ error: 'Error searching for cover images' }, 500);
    }
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: User, @Body() body: Record<string, unknown>, @Req() req: Request) {
    if (!this.trips.can('trip_create', user.role, null, user.id, false)) {
      throw new HttpException({ error: 'No permission to create trips' }, 403);
    }
    const { title, description, currency, reminder_days, day_count } = body as Record<string, never>;
    if (!title) {
      throw new HttpException({ error: 'Title is required' }, 400);
    }
    let start_date: string | null = (body.start_date as string) || null;
    let end_date: string | null = (body.end_date as string) || null;
    if (start_date && !end_date) end_date = toDateStr(addDays(new Date(start_date), 6));
    else if (!start_date && end_date) start_date = toDateStr(addDays(new Date(end_date), -6));
    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      throw new HttpException({ error: 'End date must be after start date' }, 400);
    }
    const parsedDayCount = day_count ? Math.min(Math.max(Number(day_count) || 7, 1), 365) : undefined;
    const { trip, tripId, reminderDays } = this.trips.create(user.id, { title, description, start_date, end_date, currency, reminder_days, day_count: parsedDayCount });
    writeAudit({ userId: user.id, action: 'trip.create', ip: getClientIp(req), details: { tripId, title, reminder_days: reminderDays === 0 ? 'none' : `${reminderDays} days` } });
    if (reminderDays > 0) logInfo(`${user.email} set ${reminderDays}-day reminder for trip "${title}"`);
    return { trip };
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    const trip = this.trips.get(id, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return { trip };
  }

  @Put(':id')
  async update(@CurrentUser() user: User, @Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: Request, @Headers('x-socket-id') socketId?: string) {
    const access = this.trips.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    const ownerId = access.user_id;
    const isMember = ownerId !== user.id;
    if (body.is_archived !== undefined && !this.trips.can('trip_archive', user.role, ownerId, user.id, isMember)) {
      throw new HttpException({ error: 'No permission to archive/unarchive this trip' }, 403);
    }
    if (body.cover_image !== undefined && !this.trips.can('trip_cover_upload', user.role, ownerId, user.id, isMember)) {
      throw new HttpException({ error: 'No permission to change cover image' }, 403);
    }
    const editFields = ['title', 'description', 'start_date', 'end_date', 'currency', 'reminder_days', 'day_count'];
    if (editFields.some((f) => body[f] !== undefined) && !this.trips.can('trip_edit', user.role, ownerId, user.id, isMember)) {
      throw new HttpException({ error: 'No permission to edit this trip' }, 403);
    }
    // A chosen Unsplash cover arrives as an images.unsplash.com hot-link; download
    // it into uploads/covers so the cover survives offline + CDN link-rot (#1277).
    if (isUnsplashCoverUrl(body.cover_image)) {
      try {
        const filename = await saveUnsplashCover(body.cover_image, coversDir);
        body.cover_image = `/uploads/covers/${filename}`;
      } catch (e) {
        console.error('Unsplash cover download failed:', e);
        throw new HttpException({ error: 'Could not save the selected cover image' }, 502);
      }
    }
    const oldCover = body.cover_image !== undefined
      ? (this.trips.getRaw(id) as { cover_image: string | null } | undefined)?.cover_image
      : undefined;
    try {
      const result = await this.trips.update(id, user.id, body, user.role);
      if (body.cover_image !== undefined && body.cover_image !== oldCover) {
        this.trips.deleteOldCover(oldCover);
      }
      if (Object.keys(result.changes).length > 0) {
        writeAudit({ userId: user.id, action: 'trip.update', ip: getClientIp(req), details: { tripId: Number(id), trip: result.newTitle, ...(result.ownerEmail ? { owner: result.ownerEmail } : {}), ...result.changes } });
        if (result.isAdminEdit && result.ownerEmail) logInfo(`Admin ${user.email} edited trip "${result.newTitle}" owned by ${result.ownerEmail}`);
      }
      if (result.newReminder !== result.oldReminder) {
        if (result.newReminder > 0) logInfo(`${user.email} set ${result.newReminder}-day reminder for trip "${result.newTitle}"`);
        else logInfo(`${user.email} removed reminder for trip "${result.newTitle}"`);
      }
      this.trips.broadcast(id, 'trip:updated', { trip: result.updatedTrip }, socketId);
      return { trip: result.updatedTrip };
    } catch (e: unknown) {
      if (e instanceof NotFoundError) throw new HttpException({ error: e.message }, 404);
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('cover', COVER_UPLOAD))
  cover(@CurrentUser() user: User, @Param('id') id: string, @UploadedFile() file: Express.Multer.File | undefined) {
    if (process.env.DEMO_MODE?.toLowerCase() === 'true' && isDemoEmail(user.email)) {
      throw new HttpException({ error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' }, 403);
    }
    const access = this.trips.canAccessTrip(id, user.id);
    if (!access?.user_id) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!this.trips.can('trip_cover_upload', user.role, access.user_id, user.id, access.user_id !== user.id)) {
      throw new HttpException({ error: 'No permission to change the cover image' }, 403);
    }
    const trip = this.trips.getRaw(id) as { cover_image: string | null } | undefined;
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!file) {
      throw new HttpException({ error: 'No image uploaded' }, 400);
    }
    this.trips.deleteOldCover(trip.cover_image);
    const coverUrl = `/uploads/covers/${file.filename}`;
    this.trips.updateCoverImage(id, coverUrl);
    return { cover_image: coverUrl };
  }

  @Post(':id/copy')
  @HttpCode(201)
  copy(@CurrentUser() user: User, @Param('id') id: string, @Body('title') title: string | undefined, @Req() req: Request) {
    if (!this.trips.can('trip_create', user.role, null, user.id, false)) {
      throw new HttpException({ error: 'No permission to create trips' }, 403);
    }
    if (!this.trips.canAccessTrip(id, user.id)) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    try {
      const newTripId = this.trips.copy(id, user.id, title);
      writeAudit({ userId: user.id, action: 'trip.copy', ip: getClientIp(req), details: { sourceTripId: Number(id), newTripId, title } });
      return { trip: this.trips.getCopiedTrip(newTripId, user.id) };
    } catch {
      throw new HttpException({ error: 'Failed to copy trip' }, 500);
    }
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request, @Headers('x-socket-id') socketId?: string) {
    const owner = this.trips.getOwner(id);
    if (!owner) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!this.trips.can('trip_delete', user.role, owner.user_id, user.id, owner.user_id !== user.id)) {
      throw new HttpException({ error: 'No permission to delete this trip' }, 403);
    }
    const info = this.trips.remove(id, user.id, user.role);
    writeAudit({ userId: user.id, action: 'trip.delete', ip: getClientIp(req), details: { tripId: info.tripId, trip: info.title, ...(info.ownerEmail ? { owner: info.ownerEmail } : {}) } });
    if (info.isAdminDelete && info.ownerEmail) logInfo(`Admin ${user.email} deleted trip "${info.title}" owned by ${info.ownerEmail}`);
    this.trips.broadcast(String(info.tripId), 'trip:deleted', { id: info.tripId }, socketId);
    return { success: true };
  }

  @Get(':id/members')
  members(@CurrentUser() user: User, @Param('id') id: string) {
    const access = this.trips.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    const { owner, members } = this.trips.listMembers(id, access.user_id);
    return { owner, members, current_user_id: user.id };
  }

  @Post(':id/members')
  @HttpCode(201)
  addMember(@CurrentUser() user: User, @Param('id') id: string, @Body('identifier') identifier: string) {
    const access = this.trips.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!this.trips.can('member_manage', user.role, access.user_id, user.id, access.user_id !== user.id)) {
      throw new HttpException({ error: 'No permission to manage members' }, 403);
    }
    try {
      const result = this.trips.addMember(id, identifier, access.user_id, user.id);
      this.trips.notifyInvite(id, user, result.targetUserId, result.tripTitle, result.member.email);
      return { member: result.member };
    } catch (e: unknown) {
      if (e instanceof NotFoundError) throw new HttpException({ error: e.message }, 404);
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Delete(':id/members/:userId')
  removeMember(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string) {
    const access = this.trips.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    const targetId = parseInt(userId);
    if (targetId !== user.id && !this.trips.can('member_manage', user.role, access.user_id, user.id, access.user_id !== user.id)) {
      throw new HttpException({ error: 'No permission to remove members' }, 403);
    }
    this.trips.removeMember(id, targetId);
    return { success: true };
  }

  @Post(':id/transfer')
  transferOwnership(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('newOwnerId') newOwnerId: unknown,
    @Req() req: Request,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const access = this.trips.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    // Owner-only: handing over a trip is reserved for its actual owner, not just
    // anyone who can manage members.
    if (access.user_id !== user.id) {
      throw new HttpException({ error: 'Only the owner can transfer ownership' }, 403);
    }
    if (typeof newOwnerId !== 'number') {
      throw new HttpException({ error: 'newOwnerId is required' }, 400);
    }
    try {
      const result = this.trips.transferOwnership(id, newOwnerId, user.id);
      writeAudit({ userId: user.id, action: 'trip.transfer_ownership', ip: getClientIp(req), details: { tripId: Number(id), trip: result.tripTitle, from: result.fromEmail, to: result.toEmail } });
      // Nudge everyone viewing the trip to re-read it so the new ownership and the
      // recomputed permissions take effect live.
      const updatedTrip = this.trips.get(id, user.id);
      this.trips.broadcast(id, 'trip:updated', { trip: updatedTrip }, socketId);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof NotFoundError) throw new HttpException({ error: e.message }, 404);
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  /** Loads the trip or throws 404, then asserts the caller is its owner (guest CRUD, #1362). */
  private requireOwner(id: string, user: User): void {
    const access = this.trips.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (access.user_id !== user.id) {
      throw new HttpException({ error: 'Only the owner can manage guests' }, 403);
    }
  }

  @Post(':id/guests')
  @HttpCode(201)
  createGuest(@CurrentUser() user: User, @Param('id') id: string, @Body('name') name: unknown) {
    this.requireOwner(id, user);
    if (typeof name !== 'string' || !name.trim()) {
      throw new HttpException({ error: 'Guest name is required' }, 400);
    }
    try {
      // No notifyInvite: a guest has no inbox.
      return this.trips.createGuest(id, name, user.id);
    } catch (e: unknown) {
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Put(':id/guests/:userId')
  renameGuest(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string, @Body('name') name: unknown) {
    this.requireOwner(id, user);
    if (typeof name !== 'string' || !name.trim()) {
      throw new HttpException({ error: 'Guest name is required' }, 400);
    }
    try {
      if (!this.trips.renameGuest(id, parseInt(userId), name)) {
        throw new HttpException({ error: 'Guest not found' }, 404);
      }
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof HttpException) throw e;
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Delete(':id/guests/:userId')
  deleteGuest(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string) {
    this.requireOwner(id, user);
    if (!this.trips.deleteGuest(id, parseInt(userId))) {
      throw new HttpException({ error: 'Guest not found' }, 404);
    }
    return { success: true };
  }

  @Get(':id/bundle')
  bundle(@CurrentUser() user: User, @Param('id') id: string) {
    const trip = this.trips.get(id, user.id) as { user_id: number } | undefined;
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return this.trips.bundle(id, trip);
  }

  @Get(':id/export.ics')
  exportIcs(@CurrentUser() user: User, @Param('id') id: string, @Res() res: Response) {
    if (!this.trips.canAccessTrip(id, user.id)) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    try {
      const { ics, filename } = this.trips.exportICS(id);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(ics);
    } catch (e: unknown) {
      if (e instanceof NotFoundError) throw new HttpException({ error: e.message }, 404);
      throw e;
    }
  }
}
