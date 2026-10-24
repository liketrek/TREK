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
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import {
  assistantThreadListResponseSchema,
  assistantThreadResponseSchema,
  assistantUndoResponseSchema,
  HOME_ASSISTANT_SCOPE,
  successResponseSchema,
} from '@trek/shared';

import type { Response } from 'express';

/**
 * `/api/assistant`: the user's conversations with the assistant outside any
 * one trip, the home chat on the dashboard, Vacay, Atlas, the collections and
 * the settings. Every signed-in user has their own; a conversation is reached
 * only by its owner and only here, never under a trip or a journey. Its turns
 * read the user's trips with the user's own rights and propose only changes
 * that belong to no trip (the atlas, the vacation planner, collections); a
 * trip's own changes are offered as a way into that trip's chat. No files,
 * found places or sharing here: those belong to a trip.
 *
 * `chat` and `decisions` answer with a stream of UI message chunks, refused
 * before it opens with a JSON `{ error, code }` like the trip's.
 */
@Controller('api/assistant')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.AI_ASSISTANT, 'AI assistant')
@ManagedForbidden('the operator decides which model a managed install talks to, and pays for it')
export class HomeAssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('threads')
  @ResponseContract(assistantThreadListResponseSchema)
  threads(@CurrentUser() user: User) {
    return this.assistant.listThreads(user.id, HOME_ASSISTANT_SCOPE);
  }

  @Get('threads/:threadId')
  @ResponseContract(assistantThreadResponseSchema)
  thread(@CurrentUser() user: User, @Param('threadId') threadId: string) {
    return this.assistant.getThread(user.id, HOME_ASSISTANT_SCOPE, idParam(threadId));
  }

  @Delete('threads/:threadId')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async deleteThread(@CurrentUser() user: User, @Param('threadId') threadId: string) {
    await this.assistant.deleteThread(user.id, HOME_ASSISTANT_SCOPE, idParam(threadId));
    return { success: true as const };
  }

  // response-contract-exempt: streams the turn through @Res() as server-sent events, there is no JSON body to check.
  @Post('chat')
  async chat(@CurrentUser() user: User, @Body() body: AssistantChatDto, @Res() res: Response): Promise<void> {
    await this.assistant.chat(user.id, HOME_ASSISTANT_SCOPE, body, channelOf(res));
  }

  // response-contract-exempt: streams the turn through @Res() as server-sent events, there is no JSON body to check.
  @Post('threads/:threadId/decisions')
  async decide(
    @CurrentUser() user: User,
    @Param('threadId') threadId: string,
    @Body() body: AssistantDecisionsDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.assistant.decide(user.id, HOME_ASSISTANT_SCOPE, idParam(threadId), body, channelOf(res));
  }

  @Post('tool-calls/:toolCallId/undo')
  @HttpCode(200)
  @ResponseContract(assistantUndoResponseSchema)
  async undo(@CurrentUser() user: User, @Param('toolCallId') toolCallId: string, @Body() _body: AssistantUndoDto) {
    await this.assistant.undo(user.id, HOME_ASSISTANT_SCOPE, toolCallId);
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
