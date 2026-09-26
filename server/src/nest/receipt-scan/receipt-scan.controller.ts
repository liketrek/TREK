import { Controller, HttpException, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { ReceiptScanStartResponse } from '@trek/shared';
import type { User } from '../../types';
import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DatabaseService } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ImportJobsService } from '../booking-import/import-jobs.service';
import { LlmParseService } from '../llm-parse/llm-parse.service';
import { imageMimeType } from '../llm-parse/image-input';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Scan a receipt photo into an expense draft.
 *
 * It only reads: the job answers a `ReceiptRead` the client pre-fills the
 * expense editor with, and the expense (and the photo, attached to it) is saved
 * by that editor's own path once the person has checked it. The job is a
 * booking-import job like any other, so the background tasks widget follows it
 * and `GET …/reservations/import/jobs/:jobId` answers for it.
 *
 * Trip access, the addon and the right are checked in the handler, not by
 * guards: a guard answers before multer has read the body, and a response sent
 * while the client is still uploading reaches it as ECONNRESET, not as the 404
 * or 403 (see files.controller.ts). The answers are the guards' own.
 *
 * There is no MCP twin, for the reason the booking-file import has none: the
 * route takes an uploaded photo, and a tool caller has no file to hand it.
 */
@Controller('api/trips/:tripId/budget/receipt-scan')
@UseGuards(JwtAuthGuard)
export class ReceiptScanController {
  constructor(
    private readonly importJobs: ImportJobsService,
    private readonly llmParse: LlmParseService,
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly addons: AddonsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_FILE_BYTES, files: 1 }, defParamCharset: 'utf8' }))
  async scan(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ReceiptScanStartResponse> {
    const trip = this.db.canAccessTrip(tripId, user.id);
    if (!trip) throw new HttpException({ error: 'Trip not found' }, 404);
    if (!this.addons.isAddonEnabled(ADDON_IDS.BUDGET)) throw new HttpException({ error: 'Costs addon is not enabled' }, 404);
    if (!this.permissions.checkPermission('budget_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    if (!file) throw new HttpException({ error: 'No file uploaded' }, 400);
    if (!imageMimeType(file.originalname)) {
      throw new HttpException({ error: `Unsupported file type: ${file.originalname}. Accepted: JPG, PNG, WEBP` }, 400);
    }
    if (!(await this.llmParse.readsImages(user.id))) {
      throw new HttpException({ error: 'The configured AI model does not read photos' }, 400);
    }
    return { jobId: this.importJobs.startReceipt(tripId, file, user.id) };
  }
}
