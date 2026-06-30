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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { User } from '../../types';
import { PlacesService } from './places.service';
import { isUpdateConflict } from '../../services/conflictResult';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

const STRING_LIMITS: Record<string, number> = { name: 200, description: 2000, address: 500, notes: 2000 };
const UPLOAD = { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } };

function validateLengths(body: Record<string, unknown>): void {
  for (const [field, max] of Object.entries(STRING_LIMITS)) {
    const value = body[field];
    if (value && typeof value === 'string' && value.length > max) {
      throw new HttpException({ error: `${field} must be ${max} characters or less` }, 400);
    }
  }
}

function parseBool(v: unknown, defaultVal: boolean): boolean {
  return v === undefined || v === null ? defaultVal : String(v) === 'true';
}

/**
 * /api/trips/:tripId/places — the trip's place pool + importers.
 *
 * Byte-identical to the legacy Express route (server/src/routes/places.ts):
 * trip access (404) runs first, then the string-length guard (400), then the
 * 'place_edit' permission (403); create 201 / rest 200; the bespoke 400/404
 * bodies; the journey create/update/delete hooks; and WebSocket broadcasts with
 * the forwarded X-Socket-Id. The /import/* and /bulk-delete routes are declared
 * before /:id so the static segments win over the param.
 */
@Controller('api/trips/:tripId/places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.places.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: NonNullable<ReturnType<PlacesService['verifyTripAccess']>>, user: User): void {
    if (!this.places.canEdit(trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Get()
  list(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    this.requireTrip(tripId, user);
    return { places: this.places.list(tripId, { search, category, tag }) };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: Record<string, unknown> & { name?: string },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    validateLengths(body);
    this.requireEdit(trip, user);
    if (!body.name) {
      throw new HttpException({ error: 'Place name is required' }, 400);
    }
    const place = this.places.create(tripId, body as never);
    this.places.broadcast(tripId, 'place:created', { place }, socketId);
    this.places.onCreated(tripId, place.id);
    return { place };
  }

  @Post('import/gpx')
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  importGpx(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    const importWaypoints = parseBool(body.importWaypoints, true);
    const importRoutes = parseBool(body.importRoutes, true);
    const importTracks = parseBool(body.importTracks, true);
    if (!importWaypoints && !importRoutes && !importTracks) {
      throw new HttpException({ error: 'No import types selected' }, 400);
    }
    const result = this.places.importGpx(tripId, file.buffer, { importWaypoints, importRoutes, importTracks, defaultName: file.originalname });
    if (!result) {
      throw new HttpException({ error: 'No matching places found in GPX file' }, 400);
    }
    for (const place of result.places) {
      this.places.broadcast(tripId, 'place:created', { place }, socketId);
    }
    return { places: result.places, count: result.count, skipped: result.skipped };
  }

  @Post('import/map')
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  async importMap(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    const importPoints = parseBool(body.importPoints, true);
    const importPaths = parseBool(body.importPaths, true);
    if (!importPoints && !importPaths) {
      throw new HttpException({ error: 'No import types selected' }, 400);
    }
    try {
      const result = await this.places.importMapFile(tripId, file.buffer, file.originalname, { importPoints, importPaths });
      if (result.summary?.totalPlacemarks === 0) {
        throw new HttpException({ error: 'No valid Placemarks found in map file', summary: result.summary }, 400);
      }
      for (const place of result.places) {
        this.places.broadcast(tripId, 'place:created', { place }, socketId);
      }
      return result;
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      const message = err instanceof Error ? err.message : 'Failed to import map file';
      throw new HttpException({ error: message }, 400);
    }
  }

  @Post('import/google-list')
  async importGoogle(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body('url') url: unknown, @Body('enrich') enrich: unknown, @Headers('x-socket-id') socketId?: string) {
    return this.importList('google', user, tripId, url, enrich, socketId);
  }

  @Post('import/naver-list')
  async importNaver(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body('url') url: unknown, @Body('enrich') enrich: unknown, @Headers('x-socket-id') socketId?: string) {
    return this.importList('naver', user, tripId, url, enrich, socketId);
  }

  /** Shared google/naver list import — identical flow, different provider + error string. */
  private async importList(provider: 'google' | 'naver', user: User, tripId: string, url: unknown, enrich: unknown, socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!url || typeof url !== 'string') {
      throw new HttpException({ error: 'URL is required' }, 400);
    }
    // Opt-in: re-resolve each imported place via the Places API to fill in
    // photo / address / website / phone and persist a google_place_id (#886).
    const opts = { enrich: parseBool(enrich, false), userId: user.id };
    const label = provider === 'google' ? 'Google' : 'Naver';
    try {
      const result = provider === 'google'
        ? await this.places.importGoogleList(tripId, url, opts)
        : await this.places.importNaverList(tripId, url, opts);
      if ('error' in result) {
        throw new HttpException({ error: result.error }, result.status);
      }
      for (const place of result.places) {
        this.places.broadcast(tripId, 'place:created', { place }, socketId);
      }
      return { places: result.places, count: result.places.length, listName: result.listName, skipped: result.skipped };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      console.error(`[Places] ${label} list import error:`, err instanceof Error ? err.message : err);
      throw new HttpException({ error: `Failed to import ${label} Maps list. Make sure the list is shared publicly.` }, 400);
    }
  }

  @Post('bulk-delete')
  @HttpCode(200) // Express answers bulk-delete with res.json (200), unlike the 201 imports.
  bulkDelete(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body('ids') ids: unknown,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!Array.isArray(ids) || ids.some((v) => typeof v !== 'number')) {
      throw new HttpException({ error: 'ids must be an array of numbers' }, 400);
    }
    if (ids.length === 0) {
      return { deleted: [], count: 0 };
    }
    for (const id of ids) this.places.onDeleted(id);
    const deleted = this.places.removeMany(tripId, ids);
    for (const id of deleted) {
      this.places.broadcast(tripId, 'place:deleted', { placeId: id }, socketId);
    }
    return { deleted, count: deleted.length };
  }

  @Post('bulk-update')
  @HttpCode(200)
  bulkUpdate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { ids?: unknown; category_id?: unknown },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const { ids } = body;
    if (!Array.isArray(ids) || ids.some((v) => typeof v !== 'number')) {
      throw new HttpException({ error: 'ids must be an array of numbers' }, 400);
    }
    if (ids.length === 0) {
      return { updated: [], count: 0 };
    }
    // `category_id` may be a number or null (null clears it), so key presence —
    // not truthiness — is what signals there's something to change.
    if (!('category_id' in body)) {
      throw new HttpException({ error: 'Provide at least one field to update' }, 400);
    }
    const updated = this.places.updateMany(tripId, ids, { category_id: body.category_id as number | null });
    for (const place of updated) {
      this.places.broadcast(tripId, 'place:updated', { place }, socketId);
      this.places.onUpdated(place.id);
    }
    return { updated: updated.map((p) => p.id), count: updated.length };
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string) {
    this.requireTrip(tripId, user);
    const place = this.places.get(tripId, id);
    if (!place) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    return { place };
  }

  @Get(':id/image')
  async image(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string) {
    this.requireTrip(tripId, user);
    try {
      const result = await this.places.searchImage(tripId, id, user.id);
      if ('error' in result) {
        throw new HttpException({ error: result.error }, result.status);
      }
      return { photos: result.photos };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      console.error('Unsplash error:', err);
      throw new HttpException({ error: 'Error searching for image' }, 500);
    }
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') socketId?: string,
    @Headers('x-base-updated-at') ifMatch?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    validateLengths(body);
    this.requireEdit(trip, user);
    const result = this.places.update(tripId, id, body as never, ifMatch);
    if (!result) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    // The offline edit was based on a now-stale version — let the client resolve
    // it (#1135) instead of silently overwriting the newer server state.
    if (isUpdateConflict(result)) {
      throw new HttpException({ error: 'conflict', server: result.server }, 409);
    }
    const place = result;
    this.places.broadcast(tripId, 'place:updated', { place }, socketId);
    this.places.onUpdated(place.id);
    return { place };
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    this.places.onDeleted(Number(id)); // sync before actual delete
    if (!this.places.remove(tripId, id)) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    this.places.broadcast(tripId, 'place:deleted', { placeId: Number(id) }, socketId);
    return { success: true };
  }
}
