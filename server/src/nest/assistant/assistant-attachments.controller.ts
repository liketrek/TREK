import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonsService } from '../addons/addons.service';
import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { isManagedBlocked, MANAGED_FORBIDDEN_ERROR, ManagedForbidden } from '../common/managed';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { MAX_ATTACHMENT_BYTES } from './assistant-tools.constants';
import { channelOf } from './assistant.controller';
import { AssistantAttachmentDto } from './assistant.dto';
import { AssistantService } from './assistant.service';
import {
  Body,
  Controller,
  HttpException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LLM_PHOTO_EXTENSIONS } from '@trek/shared';

import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { extname } from 'node:path';

/** What the assistant reads bookings from: the booking import's formats, plus calendar files. */
const ACCEPTED_EXTENSIONS: ReadonlySet<string> = new Set([
  '.eml',
  '.pdf',
  '.pkpass',
  '.ics',
  '.html',
  '.htm',
  '.txt',
  ...LLM_PHOTO_EXTENSIONS,
]);

const PHOTO_LABEL = LLM_PHOTO_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase()).join(', ');
const ACCEPTED_LABEL = `EML, PDF, PKPass, ICS, HTML, TXT, ${PHOTO_LABEL}`;

const UPLOAD = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 },
  // Multer reads the name as latin1 otherwise ("BestÃ¤tigung.pdf").
  defParamCharset: 'utf8' as const,
};

/**
 * `POST /api/trips/:tripId/assistant/attachments`: a file the user hands the
 * trip assistant in the chat, answered as a stream like a chat turn (see
 * AssistantService.attach).
 *
 * It is its own controller because it takes a multipart upload: the addon,
 * the managed install and the trip are checked in the handler, not by the
 * guards the other assistant routes sit behind. A guard answers before multer
 * has read the body, and a response sent while the client still uploads
 * reaches it as ECONNRESET, not as the 404 or 403 (see files.controller.ts).
 * The answers are the guards' own.
 */
@Controller('api/trips/:tripId/assistant')
@UseGuards(JwtAuthGuard)
export class AssistantAttachmentsController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly trips: TripAccessService,
    private readonly addons: AddonsService,
    private readonly env: RuntimeEnvService,
  ) {}

  // response-contract-exempt: streams the turn through @Res() as server-sent events, there is no JSON body to check.
  @ManagedForbidden('the operator decides which model a managed install talks to, and pays for it', {
    enforcedInHandler: true,
  })
  @Post('attachments')
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  async attach(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: AssistantAttachmentDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.AI_ASSISTANT))) {
      throw new HttpException({ error: 'AI assistant addon is not enabled' }, 404);
    }
    if (isManagedBlocked(this.env)) throw new HttpException(MANAGED_FORBIDDEN_ERROR, 403);
    if (!(await this.trips.findAccessible(tripId, user.id))) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!file) throw aiRefusal('generic', 'No file uploaded');
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw aiRefusal('generic', `The file is larger than ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB`);
    }
    if (!ACCEPTED_EXTENSIONS.has(extname(file.originalname).toLowerCase())) {
      throw aiRefusal('generic', `Unsupported file type: ${file.originalname}. Accepted: ${ACCEPTED_LABEL}`);
    }
    await this.assistant.attach(user.id, Number(tripId), body, file, channelOf(res));
  }
}
