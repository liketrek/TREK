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
import { BookingImportService } from './booking-import.service';
import { ImportJobsService } from './import-jobs.service';
import { bookingImportModeSchema } from '@trek/shared';
import type { BookingImportPreviewItem, BookingImportPreviewResponse, BookingImportConfirmResponse, BookingImportMode } from '@trek/shared';

const ACCEPTED_EXTS = new Set(['.eml', '.pdf', '.pkpass', '.html', '.htm', '.txt']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;

const UPLOAD = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
};

@Controller('api/trips/:tripId/reservations/import')
@UseGuards(JwtAuthGuard)
export class BookingImportController {
  constructor(
    private readonly bookingImport: BookingImportService,
    private readonly importJobs: ImportJobsService,
  ) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.bookingImport.verifyTripAccess(tripId, user.id);
    if (!trip) throw new HttpException({ error: 'Trip not found' }, 404);
    return trip;
  }

  private requireEdit(trip: ReturnType<BookingImportService['verifyTripAccess']>, user: User): void {
    if (!this.bookingImport.canEdit(trip!, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  /** Shared validation for both the sync and async import endpoints; returns the parsed mode. */
  private validateImport(tripId: string, user: User, files: Express.Multer.File[] | undefined, rawMode?: string): BookingImportMode {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);

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
  @Post('booking')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, UPLOAD))
  async preview(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body('mode') rawMode?: string,
  ): Promise<BookingImportPreviewResponse> {
    const mode = this.validateImport(tripId, user, files, rawMode);
    return this.bookingImport.preview(files!, mode, user.id);
  }

  /**
   * POST /api/trips/:tripId/reservations/import/booking/async
   * Same input as /booking, but returns a job id immediately and parses in the
   * background. Progress + completion are pushed over the user's WebSocket
   * (import:progress / import:done / import:error). Lets the upload modal close at
   * once and a background widget track the work while the user keeps navigating.
   */
  @Post('booking/async')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, UPLOAD))
  async previewAsync(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body('mode') rawMode?: string,
  ): Promise<{ jobId: string }> {
    const mode = this.validateImport(tripId, user, files, rawMode);
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
  @Post('booking/confirm')
  async confirm(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { items?: BookingImportPreviewItem[] },
    @Headers('x-socket-id') socketId?: string,
  ): Promise<BookingImportConfirmResponse> {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);

    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpException({ error: 'items must be a non-empty array' }, 400);
    }

    return this.bookingImport.confirm(tripId, items, socketId);
  }
}
