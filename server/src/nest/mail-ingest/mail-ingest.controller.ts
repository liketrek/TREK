import type { MailIngestCandidateRow } from '../../db/repositories/MailIngestCandidates.repository';
import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { DomainError } from '../common/domain-error';
import { ResponseContract } from '../common/response-contract';
import { MailIngestActionsService } from './mail-ingest-actions.service';
import { MailIngestInboxService } from './mail-ingest-inbox.service';
import { MAIL_INGEST_LIMITS } from './mail-ingest.constants';
import {
  MailIngestApplyDto,
  MailIngestFileDto,
  MailIngestInboxQueryDto,
  MailIngestMoveDto,
  MailIngestPrefsUpdateDto,
  MailIngestUndoDto,
} from './mail-ingest.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  idParamSchema,
  mailIngestAddressResponseSchema,
  mailIngestCandidateResponseSchema,
  mailIngestInboxCountResponseSchema,
  mailIngestInboxResponseSchema,
  mailIngestMessagePreviewResponseSchema,
  mailIngestPrefillResponseSchema,
  mailIngestSettingsResponseSchema,
  mailIngestUploadResponseSchema,
  type MailIngestAddressResponse,
  type MailIngestCandidateResponse,
  type MailIngestInboxCountResponse,
  type MailIngestInboxResponse,
  type MailIngestMessagePreviewResponse,
  type MailIngestPrefillResponse,
  type MailIngestSettingsResponse,
  type MailIngestUploadResponse,
} from '@trek/shared';

import { memoryStorage } from 'multer';
import { extname } from 'node:path';

const UPLOAD = {
  storage: memoryStorage(),
  // The largest mail any install takes; the import's own limit, smaller on a self-hosted one, is checked after.
  limits: { fileSize: MAIL_INGEST_LIMITS.cloudMailBytes, files: 1 },
  defParamCharset: 'utf8' as const,
};

/**
 * `/api/mail-ingest`: a person's own mail import. The settings card (their
 * address and switches), the inbox of bookings that wait, and what they do
 * with an entry: add it to a trip, move or undo an added one, file the mail
 * as documents, take the form's starting values, or discard it. An .eml
 * upload reads a mail without any transport. Every write takes the client's
 * X-Idempotency-Key through the global interceptor, so a replay from the
 * offline queue answers what the first call answered.
 */
@Controller('api/mail-ingest')
@UseGuards(JwtAuthGuard)
export class MailIngestController {
  constructor(
    private readonly inbox: MailIngestInboxService,
    private readonly actions: MailIngestActionsService,
  ) {}

  @Get('settings')
  @ResponseContract(mailIngestSettingsResponseSchema)
  settings(@CurrentUser() user: User): Promise<MailIngestSettingsResponse> {
    return this.inbox.settingsOf(user.id);
  }

  @Patch('settings')
  @ResponseContract(mailIngestSettingsResponseSchema)
  updateSettings(
    @CurrentUser() user: User,
    @Body() body: MailIngestPrefsUpdateDto,
  ): Promise<MailIngestSettingsResponse> {
    return this.inbox.updatePrefs(user.id, body);
  }

  @Post('address/renew')
  @HttpCode(200)
  @ResponseContract(mailIngestAddressResponseSchema)
  renewAddress(@CurrentUser() user: User): Promise<MailIngestAddressResponse> {
    return this.inbox.renewOwnAddress(user.id);
  }

  @Get('inbox/count')
  @ResponseContract(mailIngestInboxCountResponseSchema)
  count(@CurrentUser() user: User): Promise<MailIngestInboxCountResponse> {
    return this.inbox.count(user.id);
  }

  @Get('inbox')
  @ResponseContract(mailIngestInboxResponseSchema)
  list(@CurrentUser() user: User, @Query() query: MailIngestInboxQueryDto): Promise<MailIngestInboxResponse> {
    return this.inbox.inbox(user.id, query);
  }

  @Get('messages/:id/preview')
  @ResponseContract(mailIngestMessagePreviewResponseSchema)
  preview(@CurrentUser() user: User, @Param('id') id: string): Promise<MailIngestMessagePreviewResponse> {
    return this.inbox.preview(user.id, idOf(id, 'Mail not found'));
  }

  @Get('candidates/:id/prefill')
  @ResponseContract(mailIngestPrefillResponseSchema)
  prefill(@CurrentUser() user: User, @Param('id') id: string): Promise<MailIngestPrefillResponse> {
    return this.actions.prefill(entryId(id), user.id);
  }

  @Post('candidates/:id/apply')
  @HttpCode(200)
  @ResponseContract(mailIngestCandidateResponseSchema)
  async apply(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: MailIngestApplyDto,
  ): Promise<MailIngestCandidateResponse> {
    return this.answer(await this.actions.applyToTrip(entryId(id), user.id, body.trip_id ?? null));
  }

  @Post('candidates/:id/move')
  @HttpCode(200)
  @ResponseContract(mailIngestCandidateResponseSchema)
  async move(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: MailIngestMoveDto,
  ): Promise<MailIngestCandidateResponse> {
    return this.answer(await this.actions.move(entryId(id), user.id, body.trip_id, body.confirm === true));
  }

  @Post('candidates/:id/file')
  @HttpCode(200)
  @ResponseContract(mailIngestCandidateResponseSchema)
  async file(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: MailIngestFileDto,
  ): Promise<MailIngestCandidateResponse> {
    return this.answer(await this.actions.fileToTrip(entryId(id), user.id, body.trip_id));
  }

  @Post('candidates/:id/undo')
  @HttpCode(200)
  @ResponseContract(mailIngestCandidateResponseSchema)
  async undo(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: MailIngestUndoDto,
  ): Promise<MailIngestCandidateResponse> {
    return this.answer(await this.actions.undo(entryId(id), user.id, body.confirm === true));
  }

  @Post('candidates/:id/discard')
  @HttpCode(200)
  @ResponseContract(mailIngestCandidateResponseSchema)
  async discard(@CurrentUser() user: User, @Param('id') id: string): Promise<MailIngestCandidateResponse> {
    return this.answer(await this.actions.discard(entryId(id), user.id));
  }

  /**
   * An .eml file, read as if it had been forwarded to the person's own
   * address. Checked in the handler, never by a guard: an answer sent while
   * the client still uploads reaches it as a reset connection.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  @ResponseContract(mailIngestUploadResponseSchema)
  async upload(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<MailIngestUploadResponse> {
    if (!file) throw new DomainError(400, 'No file uploaded');
    if (extname(file.originalname).toLowerCase() !== '.eml' && file.mimetype !== 'message/rfc822') {
      throw new DomainError(400, 'Upload a mail saved as an .eml file');
    }
    return this.inbox.upload(user.id, file.buffer);
  }

  private async answer(row: MailIngestCandidateRow): Promise<MailIngestCandidateResponse> {
    return { candidate: await this.inbox.entry(row) };
  }
}

/** An id from the path; one that is no id names nothing, like an id nobody holds. */
function idOf(raw: string, missing: string): number {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) throw new DomainError(404, missing);
  return parsed.data;
}

function entryId(raw: string): number {
  return idOf(raw, 'Entry not found');
}
