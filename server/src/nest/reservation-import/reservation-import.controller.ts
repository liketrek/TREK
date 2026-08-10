import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpException,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { ADDON_IDS } from '../../addons';
import { BookingImportService } from '../booking-import/booking-import.service';
import { ImportJobsService } from '../booking-import/import-jobs.service';
import { AirtrailImportService } from '../integrations/airtrail-import.service';
import { AirtrailImportDto } from '../integrations/airtrail.dto';
import type { AirtrailImportResult } from '@trek/shared';
import { bookingImportModeSchema } from '@trek/shared';
import type { BookingImportPreviewItem, BookingImportPreviewResponse, BookingImportConfirmResponse, BookingImportMode } from '@trek/shared';
import { BookingImportConfirmDto, BookingImportPreviewDto } from './reservation-import.dto';

const ACCEPTED_EXTS = new Set(['.eml', '.pdf', '.pkpass', '.html', '.htm', '.txt']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;

const UPLOAD = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
};

/**
 * Everything that turns something external into reservations, on one prefix.
 *
 * It used to be two controllers declaring the same @Controller string from two
 * modules — booking-import for the file upload, integrations for AirTrail — each
 * rebuilding the trip access check its own way. The sub-paths never actually
 * collided, so this is not a bug fix; it is one access path instead of two
 * implementations of the same one.
 *
 * AddonGuard sits FIRST in the chain and the addon requirement lives on the
 * AirTrail handler alone. Order matters: a disabled addon has to answer 404 to
 * an anonymous caller, so the addon check must beat the 401. Handler-level
 * rather than class-level matters just as much — a class-level @RequireAddon
 * would 404 the four file-upload routes whenever AirTrail happens to be off.
 */
@Controller('api/trips/:tripId/reservations/import')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('reservation_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
export class ReservationImportController {
  constructor(
    private readonly bookingImport: BookingImportService,
    private readonly importJobs: ImportJobsService,
    private readonly airtrailImport: AirtrailImportService,
  ) {}

  /**
   * Turn selected AirTrail flights into reservations. The flights are re-fetched
   * server-side with the caller's own key, so the client cannot inject arbitrary
   * flight data.
   *
   * The hand-written requireEdit this had is gone: the class guard chain runs the
   * identical check with the identical action string. That does move the trip 404
   * ahead of the body 400, because a guard runs before the pipe — the same
   * ordering every other trip-scoped controller already has, and no case pinned
   * the other way round for this route.
   */
  @Post('airtrail')
  @RequireAddon(ADDON_IDS.AIRTRAIL, 'AirTrail')
  @RequirePermission('reservation_edit')
  async importAirtrail(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: AirtrailImportDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<AirtrailImportResult> {
    try {
      return await this.airtrailImport.importAirtrailFlights(tripId, user.id, body.flightIds, socketId, body.connections ?? []);
    } catch (err: any) {
      throw new HttpException({ error: err?.message || 'AirTrail import failed' }, err?.status === 400 ? 400 : 502);
    }
  }



  /** Shared validation for both the sync and async import endpoints; returns the parsed mode. */
  private validateImport(tripId: string, user: User, files: Express.Multer.File[] | undefined, rawMode?: string): BookingImportMode {

    const modeResult = bookingImportModeSchema.safeParse(rawMode ?? 'no-ai');
    if (!modeResult.success) throw new HttpException({ error: 'Invalid mode' }, 400);
    const mode = modeResult.data;

    if (mode === 'force-ai' && !this.bookingImport.aiAvailable(user.id)) {
      throw new HttpException({ error: 'AI parsing is not configured' }, 409);
    }
    if (mode === 'no-ai' && !this.bookingImport.isAvailable()) {
      throw new HttpException({ error: 'KItinerary extractor is not available on this server' }, 503);
    }
    if (!files || files.length === 0) throw new HttpException({ error: 'No files uploaded' }, 400);
    for (const f of files) {
      const ext = f.originalname.toLowerCase().slice(f.originalname.lastIndexOf('.'));
      if (!ACCEPTED_EXTS.has(ext)) {
        throw new HttpException({ error: `Unsupported file type: ${f.originalname}. Accepted: EML, PDF, PKPass, HTML, TXT` }, 400);
      }
    }
    return mode;
  }

  /**
   * POST /api/trips/:tripId/reservations/import/booking
   * Accepts up to 5 booking confirmation files (EML, PDF, PKPass, HTML, TXT).
   * Returns a preview list without persisting anything.
   */
  @RequirePermission('reservation_edit')
  @Post('booking')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, UPLOAD))
  async preview(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() body: BookingImportPreviewDto,
  ): Promise<BookingImportPreviewResponse> {
    const mode = this.validateImport(tripId, user, files, body?.mode);
    return this.bookingImport.preview(files!, mode, user.id);
  }

  /**
   * POST /api/trips/:tripId/reservations/import/booking/async
   * Same input as /booking, but returns a job id immediately and parses in the
   * background. Progress + completion are pushed over the user's WebSocket
   * (import:progress / import:done / import:error). Lets the upload modal close at
   * once and a background widget track the work while the user keeps navigating.
   */
  @RequirePermission('reservation_edit')
  @Post('booking/async')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, UPLOAD))
  async previewAsync(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() body: BookingImportPreviewDto,
  ): Promise<{ jobId: string }> {
    const mode = this.validateImport(tripId, user, files, body?.mode);
    const jobId = this.importJobs.start(tripId, files!, mode, user.id);
    return { jobId };
  }

  /**
   * GET /api/trips/:tripId/reservations/import/jobs/:jobId
   * Poll a background import job — recovery path for a client that missed the
   * WebSocket push (navigation, reconnect). 404 once the job has expired.
   */
  @Get('jobs/:jobId')
  async jobStatus(@CurrentUser() user: User, @Param('jobId') jobId: string) {
    const job = this.importJobs.get(jobId, user.id);
    if (!job) throw new HttpException({ error: 'Job not found' }, 404);
    return { status: job.status, done: job.done, total: job.total, result: job.result, error: job.error };
  }

  /**
   * POST /api/trips/:tripId/reservations/import/booking/confirm
   * Persists the user-confirmed subset of parsed items.
   */
  @RequirePermission('reservation_edit')
  @Post('booking/confirm')
  async confirm(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BookingImportConfirmDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<BookingImportConfirmResponse> {

    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpException({ error: 'items must be a non-empty array' }, 400);
    }

    // The DTO asserts an array of objects and stops there, so the per-item shape
    // is still the service's to interpret — as it was before the contract landed.
    return this.bookingImport.confirm(tripId, items as BookingImportPreviewItem[], socketId);
  }
}
