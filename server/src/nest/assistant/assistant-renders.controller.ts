import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonsService } from '../addons/addons.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { readImageHeader } from '../common/image-header';
import { isManagedBlocked, MANAGED_FORBIDDEN_ERROR, ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { JourneyAiPhotosService } from '../journey/journey-ai-photos.service';
import { AssistantBookContext } from './assistant-book-context';
import { AssistantRenderRegistry } from './assistant-render.registry';
import { AssistantRenderUploadDto } from './assistant.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ASSISTANT_PAGE_IMAGE,
  assistantRenderUploadResponseSchema,
  drawnPhotoIdsOf,
  type AssistantRenderUploadResponse,
} from '@trek/shared';

import { memoryStorage } from 'multer';

const UPLOAD = {
  storage: memoryStorage(),
  limits: { fileSize: ASSISTANT_PAGE_IMAGE.maxBytes, files: 1 },
};

/** A positive integer route id, or null. */
function routeId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * `POST /api/journeys/:journeyId/assistant/threads/:threadId/renders/:requestId`:
 * the Studio page a running turn asked for (journey-studio.md 3.1), drawn by
 * the Studio tab that holds the turn's stream and uploaded as one image in
 * the field `image`.
 *
 * It takes a multipart upload, so the addons, the managed install and the
 * journey are checked in the handler, as for a file in the trip chat
 * (AssistantAttachmentsController): a guard would answer before multer read
 * the body. Then the image itself (at most 1 MB by multer, a JPEG, PNG or
 * WebP by its first bytes, at most 2048 px on its long edge and 4 MP), the
 * photos it says it shows (only the user's own, JourneyAiPhotosService), and
 * that a turn of this user on this journey and thread still waits for exactly
 * this page and version. The bytes go on as received, decoded by nobody here,
 * and are kept nowhere.
 */
@Controller('api/journeys/:journeyId/assistant')
@UseGuards(JwtAuthGuard)
export class AssistantRendersController {
  constructor(
    private readonly registry: AssistantRenderRegistry,
    private readonly books: AssistantBookContext,
    private readonly photos: JourneyAiPhotosService,
    private readonly addons: AddonsService,
    private readonly env: RuntimeEnvService,
  ) {}

  @ManagedForbidden('the operator decides which model a managed install talks to, and pays for it', {
    enforcedInHandler: true,
  })
  @Post('threads/:threadId/renders/:requestId')
  @HttpCode(200)
  @ResponseContract(assistantRenderUploadResponseSchema)
  @UseInterceptors(FileInterceptor('image', UPLOAD))
  async upload(
    @CurrentUser() user: User,
    @Param('journeyId') journeyParam: string,
    @Param('threadId') threadParam: string,
    @Param('requestId') requestId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: AssistantRenderUploadDto,
  ): Promise<AssistantRenderUploadResponse> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.AI_ASSISTANT))) {
      throw new HttpException({ error: 'AI assistant addon is not enabled' }, 404);
    }
    if (isManagedBlocked(this.env)) throw new HttpException(MANAGED_FORBIDDEN_ERROR, 403);
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.JOURNEY))) {
      throw new HttpException({ error: 'Journey addon is not enabled' }, 404);
    }
    const journeyId = routeId(journeyParam);
    if (journeyId === null || !(await this.books.canOpen(user.id, journeyId))) {
      throw new HttpException({ error: 'Journey not found' }, 404);
    }
    const threadId = routeId(threadParam);
    if (threadId === null) throw new HttpException({ error: 'No page was asked for' }, 404);
    if (!file) throw new HttpException({ error: 'No image uploaded' }, 400);
    const header = readImageHeader(file.buffer);
    if (!header) throw new HttpException({ error: 'The upload is not a JPEG, PNG or WebP image' }, 415);
    const { maxEdge, maxPixels } = ASSISTANT_PAGE_IMAGE;
    if (Math.max(header.width, header.height) > maxEdge || header.width * header.height > maxPixels) {
      throw new HttpException({ error: `The image is larger than ${maxEdge} px or ${maxPixels / 1_000_000} MP` }, 413);
    }
    const own = await this.photos.ownPhotoIds(journeyId, user.id);
    if (drawnPhotoIdsOf(body.drawnPhotoIds).some((photoId) => !own.has(photoId))) {
      throw new HttpException({ error: 'The image shows a photo another member contributed' }, 403);
    }
    const delivered = this.registry.deliver(
      { userId: user.id, journeyId, threadId, requestId },
      { spreadId: body.spreadId, bookVersion: body.bookVersion },
      { mimeType: header.mimeType, data: file.buffer, width: header.width, height: header.height },
    );
    if (delivered === 'unknown') throw new HttpException({ error: 'No page was asked for' }, 404);
    if (delivered === 'mismatch') {
      throw new HttpException({ error: 'The image shows another page or version than the one asked for' }, 409);
    }
    return { accepted: true };
  }
}
