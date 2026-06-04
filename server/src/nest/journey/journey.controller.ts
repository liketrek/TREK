import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { User } from '../../types';
import { JourneyService } from './journey.service';
import { JourneyAddonGuard } from './journey-addon.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { getAllowedExtensions } from '../../services/fileService';

const uploadsBase = path.join(__dirname, '../../../uploads/journey');
const IMAGE_UPLOAD = {
  storage: diskStorage({
    destination: (_req, _file, cb) => { if (!fs.existsSync(uploadsBase)) fs.mkdirSync(uploadsBase, { recursive: true }); cb(null, uploadsBase); },
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase() || '.jpg'}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    if (!file.mimetype.startsWith('image/') || file.mimetype.includes('svg')) {
      const err: Error & { statusCode?: number } = new Error('Only image files are allowed');
      err.statusCode = 400;
      return cb(err, false);
    }
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const allowed = getAllowedExtensions().split(',').map((e) => e.trim().toLowerCase());
    if (!allowed.includes('*') && !allowed.includes(ext)) {
      const err: Error & { statusCode?: number } = new Error(`File type .${ext} is not allowed`);
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
};

/**
 * /api/journeys — cross-trip travel narrative (journeys, entries, photo gallery
 * + provider mirroring, contributors, preferences, share links).
 *
 * Byte-identical to the legacy Express route (server/src/routes/journey.ts):
 * the Journey-addon gate (404) runs before auth, the service owns access
 * control (null/false → 403/404), create routes answer 201 while cover/trips/
 * share-link/reorder/patch answer 200 and the two unlink/gallery-delete routes
 * answer 204. Static prefixes (/suggestions, /available-trips, /entries, /photos)
 * are declared before /:id so they win over the param.
 */
@Controller('api/journeys')
@UseGuards(JourneyAddonGuard, JwtAuthGuard)
export class JourneyController {
  constructor(private readonly journey: JourneyService) {}

  // ── Static prefix routes (before /:id) ──────────────────────────────────
  @Get()
  list(@CurrentUser() user: User) {
    return { journeys: this.journey.listJourneys(user.id) };
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: { title?: string; subtitle?: string; trip_ids?: unknown[] }) {
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      throw new HttpException({ error: 'Title is required' }, 400);
    }
    return this.journey.createJourney(user.id, {
      title: body.title.trim(),
      subtitle: body.subtitle,
      trip_ids: Array.isArray(body.trip_ids) ? body.trip_ids.map(Number) : [],
    });
  }

  @Get('suggestions')
  suggestions(@CurrentUser() user: User) {
    return { trips: this.journey.getSuggestions(user.id) };
  }

  @Get('available-trips')
  availableTrips(@CurrentUser() user: User) {
    return { trips: this.journey.listUserTrips(user.id) };
  }

  // ── Entries (prefix /entries — before /:id) ─────────────────────────────
  @Patch('entries/:entryId')
  updateEntry(@CurrentUser() user: User, @Param('entryId') entryId: string, @Body() body: Record<string, unknown>, @Headers('x-socket-id') socketId?: string) {
    const result = this.journey.updateEntry(Number(entryId), user.id, body, socketId);
    if (!result) {
      throw new HttpException({ error: 'Entry not found' }, 404);
    }
    return result;
  }

  @Delete('entries/:entryId')
  deleteEntry(@CurrentUser() user: User, @Param('entryId') entryId: string, @Headers('x-socket-id') socketId?: string) {
    if (!this.journey.deleteEntry(Number(entryId), user.id, socketId)) {
      throw new HttpException({ error: 'Entry not found' }, 404);
    }
    return { success: true };
  }

  @Post('entries/:entryId/photos')
  @UseInterceptors(FilesInterceptor('photos', undefined, IMAGE_UPLOAD))
  async uploadEntryPhotos(@CurrentUser() user: User, @Param('entryId') entryId: string, @UploadedFiles() files: Express.Multer.File[] | undefined, @Body() body: { caption?: string }) {
    if (!files?.length) {
      throw new HttpException({ error: 'No files uploaded' }, 400);
    }
    const results: unknown[] = [];
    for (const file of files) {
      const relativePath = `journey/${file.filename}`;
      const photo = this.journey.addPhoto(Number(entryId), user.id, relativePath, undefined, body?.caption);
      if (!photo) continue;
      // Mirror to Immich only when the user explicitly opted in (#730).
      if (this.journey.immichAutoUploadEnabled(user.id)) {
        try {
          const immichId = await this.journey.uploadToImmich(user.id, relativePath, file.originalname);
          if (immichId) {
            this.journey.setPhotoProvider(photo.id, 'immich', immichId, user.id);
            Object.assign(photo, { provider: 'immich', asset_id: immichId, owner_id: user.id });
          }
        } catch {
          // best-effort mirror; the local photo is already saved
        }
      }
      results.push(photo);
    }
    if (!results.length) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { photos: results };
  }

  @Post('entries/:entryId/provider-photos')
  providerPhotos(@CurrentUser() user: User, @Param('entryId') entryId: string, @Body() body: { provider?: string; asset_id?: string; asset_ids?: unknown[]; caption?: string; passphrase?: string }) {
    const pp = body.passphrase && typeof body.passphrase === 'string' ? body.passphrase : undefined;
    if (Array.isArray(body.asset_ids) && body.provider) {
      const added: unknown[] = [];
      for (const id of body.asset_ids) {
        const photo = this.journey.addProviderPhoto(Number(entryId), user.id, body.provider, String(id), body.caption, pp);
        if (photo) added.push(photo);
      }
      return { photos: added, added: added.length };
    }
    if (!body.provider || !body.asset_id) {
      throw new HttpException({ error: 'provider and asset_id required' }, 400);
    }
    const photo = this.journey.addProviderPhoto(Number(entryId), user.id, body.provider, body.asset_id, body.caption, pp);
    if (!photo) {
      throw new HttpException({ error: 'Not allowed or duplicate' }, 403);
    }
    return photo;
  }

  @Post('entries/:entryId/link-photo')
  linkPhoto(@CurrentUser() user: User, @Param('entryId') entryId: string, @Body() body: { journey_photo_id?: unknown; photo_id?: unknown }) {
    const journeyPhotoId = body.journey_photo_id ?? body.photo_id;
    if (!journeyPhotoId) {
      throw new HttpException({ error: 'journey_photo_id required' }, 400);
    }
    const result = this.journey.linkPhotoToEntry(Number(entryId), Number(journeyPhotoId), user.id);
    if (!result) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return result;
  }

  @Delete('entries/:entryId/photos/:journeyPhotoId')
  @HttpCode(204)
  unlinkPhoto(@CurrentUser() user: User, @Param('entryId') entryId: string, @Param('journeyPhotoId') journeyPhotoId: string): void {
    if (!this.journey.unlinkPhotoFromEntry(Number(entryId), Number(journeyPhotoId), user.id)) {
      throw new HttpException({ error: 'Not found or not allowed' }, 404);
    }
  }

  @Patch('photos/:photoId')
  updatePhoto(@CurrentUser() user: User, @Param('photoId') photoId: string, @Body() body: Record<string, unknown>) {
    const result = this.journey.updatePhoto(Number(photoId), user.id, body);
    if (!result) {
      throw new HttpException({ error: 'Photo not found' }, 404);
    }
    return result;
  }

  @Delete('photos/:photoId')
  deletePhoto(@CurrentUser() user: User, @Param('photoId') photoId: string) {
    const photo = this.journey.deletePhoto(Number(photoId), user.id);
    if (!photo) {
      throw new HttpException({ error: 'Photo not found' }, 404);
    }
    if (photo.file_path) {
      try { fs.unlinkSync(path.join(__dirname, '../../../uploads', photo.file_path)); } catch { /* file already gone */ }
    }
    return { success: true };
  }

  // ── Gallery (prefix /:id/gallery — before /:id) ─────────────────────────
  @Post(':id/gallery/photos')
  @UseInterceptors(FilesInterceptor('photos', undefined, IMAGE_UPLOAD))
  uploadGalleryPhotos(@CurrentUser() user: User, @Param('id') id: string, @UploadedFiles() files: Express.Multer.File[] | undefined) {
    if (!files?.length) {
      throw new HttpException({ error: 'No files uploaded' }, 400);
    }
    const filePaths = files.map((f) => ({ path: `journey/${f.filename}` }));
    const photos = this.journey.uploadGalleryPhotos(Number(id), user.id, filePaths);
    if (!photos.length) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { photos };
  }

  @Post(':id/gallery/provider-photos')
  galleryProviderPhotos(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { provider?: string; asset_id?: string; asset_ids?: unknown[]; passphrase?: string }) {
    const pp = body.passphrase && typeof body.passphrase === 'string' ? body.passphrase : undefined;
    if (Array.isArray(body.asset_ids) && body.provider) {
      const added: unknown[] = [];
      for (const aid of body.asset_ids) {
        const photo = this.journey.addProviderPhotoToGallery(Number(id), user.id, body.provider, String(aid), undefined, pp);
        if (photo) added.push(photo);
      }
      return { photos: added, added: added.length };
    }
    if (!body.provider || !body.asset_id) {
      throw new HttpException({ error: 'provider and asset_id required' }, 400);
    }
    const photo = this.journey.addProviderPhotoToGallery(Number(id), user.id, body.provider, body.asset_id, undefined, pp);
    if (!photo) {
      throw new HttpException({ error: 'Not allowed or duplicate' }, 403);
    }
    return photo;
  }

  @Delete(':id/gallery/:journeyPhotoId')
  @HttpCode(204)
  deleteGalleryPhoto(@CurrentUser() user: User, @Param('journeyPhotoId') journeyPhotoId: string): void {
    const photo = this.journey.deleteGalleryPhoto(Number(journeyPhotoId), user.id);
    if (!photo) {
      throw new HttpException({ error: 'Photo not found or not allowed' }, 404);
    }
    if (photo.file_path) {
      try { fs.unlinkSync(path.join(__dirname, '../../../uploads', photo.file_path)); } catch { /* file already gone */ }
    }
  }

  // ── Journeys /:id ───────────────────────────────────────────────────────
  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    const data = this.journey.getJourneyFull(Number(id), user.id);
    if (!data) {
      throw new HttpException({ error: 'Journey not found' }, 404);
    }
    return data;
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const result = this.journey.updateJourney(Number(id), user.id, body);
    if (!result) {
      throw new HttpException({ error: 'Journey not found' }, 404);
    }
    return result;
  }

  @Post(':id/cover')
  @HttpCode(200) // Express answers cover with res.json (200).
  @UseInterceptors(FileInterceptor('cover', IMAGE_UPLOAD))
  cover(@CurrentUser() user: User, @Param('id') id: string, @UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    const result = this.journey.updateJourney(Number(id), user.id, { cover_image: `journey/${file.filename}` });
    if (!result) {
      throw new HttpException({ error: 'Journey not found' }, 404);
    }
    return result;
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    if (!this.journey.deleteJourney(Number(id), user.id)) {
      throw new HttpException({ error: 'Journey not found' }, 404);
    }
    return { success: true };
  }

  // ── Journey trips ───────────────────────────────────────────────────────
  @Post(':id/trips')
  @HttpCode(200) // Express answers with res.json (200).
  addTrip(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { trip_id?: unknown }) {
    if (!body.trip_id) {
      throw new HttpException({ error: 'trip_id required' }, 400);
    }
    if (!this.journey.addTripToJourney(Number(id), Number(body.trip_id), user.id)) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { success: true };
  }

  @Delete(':id/trips/:tripId')
  removeTrip(@CurrentUser() user: User, @Param('id') id: string, @Param('tripId') tripId: string) {
    if (!this.journey.removeTripFromJourney(Number(id), Number(tripId), user.id)) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { success: true };
  }

  // ── Entries under journey ───────────────────────────────────────────────
  @Get(':id/entries')
  listEntries(@CurrentUser() user: User, @Param('id') id: string) {
    const entries = this.journey.listEntries(Number(id), user.id);
    if (!entries) {
      throw new HttpException({ error: 'Journey not found' }, 404);
    }
    return { entries };
  }

  @Post(':id/entries')
  createEntry(@CurrentUser() user: User, @Param('id') id: string, @Body() body: Record<string, unknown> & { entry_date?: unknown }, @Headers('x-socket-id') socketId?: string) {
    if (!body.entry_date) {
      throw new HttpException({ error: 'entry_date is required' }, 400);
    }
    const entry = this.journey.createEntry(Number(id), user.id, body, socketId);
    if (!entry) {
      throw new HttpException({ error: 'Journey not found' }, 404);
    }
    return entry;
  }

  @Put(':id/entries/reorder')
  reorderEntries(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { orderedIds?: unknown }, @Headers('x-socket-id') socketId?: string) {
    const orderedIds = body.orderedIds;
    if (!Array.isArray(orderedIds) || !orderedIds.every((v) => Number.isFinite(Number(v)))) {
      throw new HttpException({ error: 'orderedIds must be an array of numbers' }, 400);
    }
    if (!this.journey.reorderEntries(Number(id), user.id, orderedIds.map(Number), socketId)) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { success: true };
  }

  // ── Contributors ────────────────────────────────────────────────────────
  @Post(':id/contributors')
  addContributor(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { user_id?: unknown; role?: 'editor' | 'viewer' }) {
    if (!body.user_id) {
      throw new HttpException({ error: 'user_id required' }, 400);
    }
    if (!this.journey.addContributor(Number(id), user.id, Number(body.user_id), body.role || 'viewer')) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { success: true };
  }

  @Patch(':id/contributors/:userId')
  updateContributor(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string, @Body() body: { role?: 'editor' | 'viewer' }) {
    if (!this.journey.updateContributorRole(Number(id), user.id, Number(userId), body.role as 'editor' | 'viewer')) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { success: true };
  }

  @Delete(':id/contributors/:userId')
  removeContributor(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string) {
    if (!this.journey.removeContributor(Number(id), user.id, Number(userId))) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { success: true };
  }

  // ── User Preferences ────────────────────────────────────────────────────
  @Patch(':id/preferences')
  preferences(@CurrentUser() user: User, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const result = this.journey.updateJourneyPreferences(Number(id), user.id, body);
    if (!result) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return result;
  }

  // ── Share Link ──────────────────────────────────────────────────────────
  @Get(':id/share-link')
  getShareLink(@CurrentUser() user: User, @Param('id') id: string) {
    return { link: this.journey.getJourneyShareLink(Number(id), user.id) };
  }

  @Post(':id/share-link')
  @HttpCode(200) // Express answers with res.json (200).
  setShareLink(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { share_timeline?: boolean; share_gallery?: boolean; share_map?: boolean }) {
    const result = this.journey.createOrUpdateJourneyShareLink(Number(id), user.id, {
      share_timeline: body.share_timeline,
      share_gallery: body.share_gallery,
      share_map: body.share_map,
    });
    if (!result) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return result;
  }

  @Delete(':id/share-link')
  deleteShareLink(@CurrentUser() user: User, @Param('id') id: string) {
    if (!this.journey.deleteJourneyShareLink(Number(id), user.id)) {
      throw new HttpException({ error: 'Not allowed' }, 403);
    }
    return { success: true };
  }
}
