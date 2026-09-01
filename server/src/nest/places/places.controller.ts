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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { isDemoWriteBlocked, DEMO_WRITE_ERROR } from '../common/demo-write';
import { contentDisposition } from '../common/content-disposition';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { memoryStorage } from 'multer';
import { hexColorSchema, placeImageUrlSchema, placeWebsiteSchema } from '@trek/shared';
import type { User } from '../../types';
import { PlacesService } from './places.service';
import { isUpdateConflict } from '../common/conflictResult';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { PLACE_IMAGE_FILE_FILTER } from '../common/place-image-upload';
import { StorageService } from '../storage/storage.service';
import { placeImageUrl } from './place-image';
import {
  PlaceBulkDeleteDto,
  PlaceBulkUpdateDto,
  PlaceCreateDto,
  PlaceExportGpxDto,
  PlaceImportGpxDto,
  PlaceImportListDto,
  PlaceImportMapDto,
  PlaceRatingDto,
  PlaceUpdateDto,
} from './places.dto';

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

// A bad hex makes MapLibre fail hard when it parses the paint property, and the
// update body is an open record that Zod does not police — so check it here.
function validateRouteColor(body: Record<string, unknown>): void {
  const value = body.route_color;
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' || !hexColorSchema.safeParse(value).success) {
    throw new HttpException({ error: 'route_color must be a hex colour like #4f46e5' }, 400);
  }
}

// Same reason as route_color: these two leave the database for a renderer that
// treats them as a URL — the thumbnail into marker HTML, the homepage into
// window.open — and the open record means the pipe never sees them.
function validateUrlFields(body: Record<string, unknown>): void {
  const image = body.image_url;
  if (image !== undefined && image !== null) {
    if (typeof image !== 'string' || !placeImageUrlSchema.safeParse(image).success) {
      throw new HttpException({ error: 'image_url must be an uploaded path, a photo-proxy path, an inline image or an https URL' }, 400);
    }
  }
  const website = body.website;
  // '' is how the UI clears the field; treat it like an absent value.
  if (website !== undefined && website !== null && website !== '') {
    if (typeof website !== 'string' || !placeWebsiteSchema.safeParse(website).success) {
      throw new HttpException({ error: 'website must be an http or https URL' }, 400);
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
 *
 * Bodies validate against the @trek/shared place schemas via the DTO classes in
 * places.dto.ts + the global ZodValidationPipe (400 with the standard
 * `{ error }` envelope on mismatch). That replaced three bespoke checks —
 * 'Place name is required', 'ids must be an array of numbers' and
 * 'URL is required' — and, because a pipe runs before the handler, a malformed
 * body now 400s ahead of the trip-access 404 / permission 403 it used to follow.
 * Same trade the todo and trips migrations took. The length and route_color
 * guards below stay in the handler: the place body is a deliberately open
 * record, so the pipe passes their inputs through untouched.
 */
@Controller('api/trips/:tripId/places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(
    private readonly places: PlacesService,
    private readonly env: RuntimeEnvService,
    private readonly storage: StorageService,
  ) {}

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
  @UseGuards(TripAccessGuard)
  list(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return { places: this.places.list(tripId, { search, category, tag }) };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PlaceCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    validateLengths(body);
    validateRouteColor(body);
    validateUrlFields(body);
    this.requireEdit(trip, user);
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
    @Body() body: PlaceImportGpxDto,
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

  /**
   * The trip as GPX, for Organic Maps, a handheld or anything else that reads it.
   * A read, so viewing the trip is enough; no edit permission required. Declared
   * before the `:id` routes so the literal path wins.
   */
  @Get('export.gpx')
  exportGpx(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Query() query: PlaceExportGpxDto,
    @Res() res: Response,
  ) {
    this.requireTrip(tripId, user);
    const waypoints = parseBool(query.waypoints, true);
    const tracks = parseBool(query.tracks, true);
    const dayRoutes = parseBool(query.dayRoutes, true);
    if (!waypoints && !tracks && !dayRoutes) {
      throw new HttpException({ error: 'No export types selected' }, 400);
    }
    const result = this.places.exportGpx(tripId, { waypoints, tracks, dayRoutes });
    if (!result) {
      throw new HttpException({ error: 'Nothing to export' }, 404);
    }
    res.setHeader('Content-Type', 'application/gpx+xml; charset=utf-8');
    res.setHeader('Content-Disposition', contentDisposition(result.filename, 'attachment'));
    res.send(result.gpx);
  }

  @Post('import/map')
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  async importMap(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: PlaceImportMapDto,
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
  async importGoogle(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body() body: PlaceImportListDto, @Headers('x-socket-id') socketId?: string) {
    return this.importList('google', user, tripId, body, socketId);
  }

  @Post('import/naver-list')
  async importNaver(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body() body: PlaceImportListDto, @Headers('x-socket-id') socketId?: string) {
    return this.importList('naver', user, tripId, body, socketId);
  }

  /** Shared google/naver list import — identical flow, different provider + error string. */
  private async importList(provider: 'google' | 'naver', user: User, tripId: string, body: PlaceImportListDto, socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const { url, enrich } = body;
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
  async bulkDelete(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PlaceBulkDeleteDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const { ids } = body;
    if (ids.length === 0) {
      return { deleted: [], count: 0 };
    }
    // Scope the ids to the trip before the hook: onPlaceDeleted keys on the
    // place id alone, so an id from another trip would detach that trip's
    // journey entries even though removeMany below refuses it. Still ahead of
    // the DELETE — journey_entries.source_place_id is ON DELETE SET NULL, so
    // afterwards there is nothing left to detach.
    const scoped = this.places.scopedIds(tripId, ids);
    for (const id of scoped) this.places.onDeleted(id);
    // Read the linked expenses before the delete — afterwards the link is gone (#1298).
    const expenseIds = this.places.linkedExpenseIds(tripId, scoped);
    const deleted = await this.places.removeMany(tripId, ids);
    for (const id of deleted) {
      this.places.broadcast(tripId, 'place:deleted', { placeId: id }, socketId);
    }
    for (const itemId of expenseIds) {
      this.places.broadcast(tripId, 'budget:deleted', { itemId }, socketId);
    }
    return { deleted, count: deleted.length };
  }

  @Post('bulk-update')
  @HttpCode(200)
  async bulkUpdate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: PlaceBulkUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const { ids } = body;
    if (ids.length === 0) {
      return { updated: [], count: 0 };
    }
    // `category_id` may be a number or null (null clears it), so key presence —
    // not truthiness — is what signals there's something to change.
    if (!('category_id' in body)) {
      throw new HttpException({ error: 'Provide at least one field to update' }, 400);
    }
    const updated = await this.places.updateMany(tripId, ids, { category_id: body.category_id as number | null });
    for (const place of updated) {
      this.places.broadcast(tripId, 'place:updated', { place }, socketId);
      this.places.onUpdated(place.id);
    }
    return { updated: updated.map((p) => p.id), count: updated.length };
  }

  @Get(':id')
  @UseGuards(TripAccessGuard)
  get(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string) {
    const place = this.places.get(tripId, id);
    if (!place) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    return { place };
  }

  @Post(':id/image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', { fileFilter: PLACE_IMAGE_FILE_FILTER }))
  async uploadImage(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    // Inline rather than DemoWriteGuard: requireEdit above answers 404/403 for a
    // trip the caller cannot reach, and a guard would run before it.
    if (isDemoWriteBlocked(this.env, user.email)) {
      throw new HttpException(DEMO_WRITE_ERROR, 403);
    }
    if (!file) {
      throw new HttpException({ error: 'No image uploaded' }, 400);
    }
    // Commit the spooled upload to its final storage location (atomic
    // same-volume rename) before the DB row references the final path.
    await this.storage.put('places', file.filename, { tmpPath: file.path });
    // Reuse the existing image_url slot (the top-precedence thumbnail source); the
    // update path reclaims any previously uploaded file it replaces.
    const result = await this.places.update(tripId, id, { image_url: placeImageUrl(file.filename) } as never);
    if (!result || isUpdateConflict(result)) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    const place = result;
    this.places.broadcast(tripId, 'place:updated', { place }, socketId);
    this.places.onUpdated(place.id);
    return { place };
  }

  @Put(':id/rating')
  rate(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: PlaceRatingDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Deliberately no place_edit check: every trip member may cast their own
    // vote (#1435), even when an admin restricts place editing.
    this.requireTrip(tripId, user);
    const place = this.places.rate(tripId, id, user.id, body.rating);
    if (!place) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    this.places.broadcast(tripId, 'place:updated', { place }, socketId);
    return { place };
  }

  @Delete(':id/rating')
  @UseGuards(TripAccessGuard)
  unrate(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const place = this.places.rate(tripId, id, user.id, null);
    if (!place) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    this.places.broadcast(tripId, 'place:updated', { place }, socketId);
    return { place };
  }

  @Get(':id/image')
  @UseGuards(TripAccessGuard)
  async image(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string) {
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
  async update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: PlaceUpdateDto,
    @Headers('x-socket-id') socketId?: string,
    @Headers('x-base-updated-at') ifMatch?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    validateLengths(body);
    validateRouteColor(body);
    validateUrlFields(body);
    this.requireEdit(trip, user);
    const result = await this.places.update(tripId, id, body as never, ifMatch);
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
  @UseGuards(TripAccessGuard)
  @RequirePermission('place_edit')
  async remove(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    // Scope the id to the trip before the hook (see bulkDelete), then sync the
    // journey ahead of the actual delete.
    if (!this.places.get(tripId, id)) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    this.places.onDeleted(Number(id));
    const expenseIds = this.places.linkedExpenseIds(tripId, [id]);
    if (!(await this.places.remove(tripId, id))) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    this.places.broadcast(tripId, 'place:deleted', { placeId: Number(id) }, socketId);
    for (const itemId of expenseIds) {
      this.places.broadcast(tripId, 'budget:deleted', { itemId }, socketId);
    }
    return { success: true };
  }
}
