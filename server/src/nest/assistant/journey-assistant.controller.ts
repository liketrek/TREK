import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { channelOf, idParam } from './assistant.controller';
import { AssistantChatDto, AssistantDecisionsDto, AssistantStopDto, AssistantUndoDto } from './assistant.dto';
import { AssistantService } from './assistant.service';
import { JourneyAssistantGuard } from './journey-assistant.guard';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import {
  assistantThreadListResponseSchema,
  assistantThreadResponseSchema,
  assistantUndoResponseSchema,
  successResponseSchema,
  type AssistantScope,
} from '@trek/shared';

import type { Response } from 'express';

/** The scope of a request JourneyAssistantGuard let through: the journey is open to the user. */
function journeyScope(journeyId: string): AssistantScope {
  return { kind: 'journey', journeyId: Number(journeyId) };
}

/**
 * `/api/journeys/:journeyId/assistant`: the user's conversations with the
 * assistant in TREK Studio, about one journey and its book. The same
 * conversations, turns, change cards, decisions and undo as on a trip, with
 * the book's tools; any member may talk about the journey, and what a
 * proposed change may do is decided by the tool that runs it, with the
 * user's own rights (a viewer's turn is offered no write at all). A journey
 * without trips works. No files, found places or sharing to a trip's chat
 * here: those belong to a trip.
 *
 * `chat` and `decisions` answer with a stream of UI message chunks, refused
 * before it opens with a JSON `{ error, code }` like the trip's.
 */
@Controller('api/journeys/:journeyId/assistant')
@UseGuards(AddonGuard, JwtAuthGuard, JourneyAssistantGuard)
@RequireAddon(ADDON_IDS.AI_ASSISTANT, 'AI assistant')
@ManagedForbidden('the operator decides which model a managed install talks to, and pays for it')
export class JourneyAssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('threads')
  @ResponseContract(assistantThreadListResponseSchema)
  threads(@CurrentUser() user: User, @Param('journeyId') journeyId: string) {
    return this.assistant.listThreads(user.id, journeyScope(journeyId));
  }

  @Get('threads/:threadId')
  @ResponseContract(assistantThreadResponseSchema)
  thread(@CurrentUser() user: User, @Param('journeyId') journeyId: string, @Param('threadId') threadId: string) {
    return this.assistant.getThread(user.id, journeyScope(journeyId), idParam(threadId));
  }

  @Delete('threads/:threadId')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async deleteThread(
    @CurrentUser() user: User,
    @Param('journeyId') journeyId: string,
    @Param('threadId') threadId: string,
  ) {
    await this.assistant.deleteThread(user.id, journeyScope(journeyId), idParam(threadId));
    return { success: true as const };
  }

  // response-contract-exempt: streams the turn through @Res() as server-sent events, there is no JSON body to check.
  @Post('chat')
  async chat(
    @CurrentUser() user: User,
    @Param('journeyId') journeyId: string,
    @Body() body: AssistantChatDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.assistant.chat(user.id, journeyScope(journeyId), body, channelOf(res));
  }

  // response-contract-exempt: streams the turn through @Res() as server-sent events, there is no JSON body to check.
  @Post('threads/:threadId/decisions')
  async decide(
    @CurrentUser() user: User,
    @Param('journeyId') journeyId: string,
    @Param('threadId') threadId: string,
    @Body() body: AssistantDecisionsDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.assistant.decide(user.id, journeyScope(journeyId), idParam(threadId), body, channelOf(res));
  }

  @Post('tool-calls/:toolCallId/undo')
  @HttpCode(200)
  @ResponseContract(assistantUndoResponseSchema)
  async undo(
    @CurrentUser() user: User,
    @Param('journeyId') journeyId: string,
    @Param('toolCallId') toolCallId: string,
    @Body() _body: AssistantUndoDto,
  ) {
    await this.assistant.undo(user.id, journeyScope(journeyId), toolCallId);
    return { undone: true as const };
  }

  @Post('stop')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async stop(@CurrentUser() user: User, @Body() _body: AssistantStopDto) {
    await this.assistant.stop(user.id);
    return { success: true as const };
  }
}
