import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { onClientGone, openSseStream } from '../common/sse-stream';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { AssistantFoundPlacesService } from './assistant-found-places.service';
import { AssistantProposalsService } from './assistant-proposals.service';
import { tripScope } from './assistant-scope';
import { AssistantShareService } from './assistant-share.service';
import {
  AssistantAddFoundPlaceDto,
  AssistantChatDto,
  AssistantDecisionsDto,
  AssistantShareDto,
  AssistantStopDto,
  AssistantTakeProposalDto,
  AssistantUndoDto,
} from './assistant.dto';
import { AssistantService, type TurnChannel } from './assistant.service';
import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import {
  assistantAddFoundPlaceResponseSchema,
  assistantThreadListResponseSchema,
  assistantThreadResponseSchema,
  assistantUndoResponseSchema,
  collabMessageResponseSchema,
  successResponseSchema,
} from '@trek/shared';

import type { Response } from 'express';

/** A route id: a positive integer, or the 404 an unknown one gets. */
export function idParam(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw aiRefusal('not_found', 'Conversation not found');
  return id;
}

/** The turn's stream on this response, and the signal that its client went away. */
export function channelOf(res: Response): TurnChannel {
  const gone = new AbortController();
  onClientGone(res, () => gone.abort());
  return { open: () => openSseStream(res), signal: gone.signal };
}

/**
 * `/api/trips/:tripId/assistant`: the user's conversations with the trip
 * assistant on one trip. A conversation belongs to the user who had it and
 * is only reached on its own trip. Reading the trip is enough to talk about
 * it; what a proposed change may do is decided by the tool that runs it, with
 * the user's own rights.
 *
 * `chat` and `decisions` answer with a stream of UI message chunks. A refusal
 * before the stream opens (rate limit, connection, daily limit, a turn
 * already running) is a JSON `{ error, code }` with its status; one after it
 * is an `error` chunk.
 */
@Controller('api/trips/:tripId/assistant')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.AI_ASSISTANT, 'AI assistant')
@ManagedForbidden('the operator decides which model a managed install talks to, and pays for it')
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly foundPlaces: AssistantFoundPlacesService,
    private readonly shares: AssistantShareService,
    private readonly proposals: AssistantProposalsService,
  ) {}

  @Get('threads')
  @ResponseContract(assistantThreadListResponseSchema)
  threads(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return this.assistant.listThreads(user.id, tripScope(Number(tripId)));
  }

  @Get('threads/:threadId')
  @ResponseContract(assistantThreadResponseSchema)
  thread(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('threadId') threadId: string) {
    return this.assistant.getThread(user.id, tripScope(Number(tripId)), idParam(threadId));
  }

  @Delete('threads/:threadId')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async deleteThread(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('threadId') threadId: string) {
    await this.assistant.deleteThread(user.id, tripScope(Number(tripId)), idParam(threadId));
    return { success: true as const };
  }

  // response-contract-exempt: streams the turn through @Res() as server-sent events, there is no JSON body to check.
  @Post('chat')
  async chat(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: AssistantChatDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.assistant.chat(user.id, tripScope(Number(tripId)), body, channelOf(res));
  }

  // response-contract-exempt: streams the turn through @Res() as server-sent events, there is no JSON body to check.
  @Post('threads/:threadId/decisions')
  async decide(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('threadId') threadId: string,
    @Body() body: AssistantDecisionsDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.assistant.decide(user.id, tripScope(Number(tripId)), idParam(threadId), body, channelOf(res));
  }

  /**
   * "+ Day 3" on a place a search found: a change card for the day, held like any other, no model turn.
   * It holds a new place or a place planned on a day, so it asks for the right the place routes ask for.
   */
  @Post('threads/:threadId/found-places')
  @HttpCode(200)
  @RequirePermission('place_edit')
  @ResponseContract(assistantAddFoundPlaceResponseSchema)
  addFoundPlace(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('threadId') threadId: string,
    @Body() body: AssistantAddFoundPlaceDto,
  ) {
    return this.foundPlaces.add(user.id, Number(tripId), idParam(threadId), body);
  }

  /**
   * "Plan this" on a hike or a city walk an answer proposed: a change card that creates it, no model turn.
   * It holds a new tour, so it asks for the right the tour routes ask for.
   */
  @Post('threads/:threadId/proposals')
  @HttpCode(200)
  @RequirePermission('place_edit')
  @ResponseContract(assistantAddFoundPlaceResponseSchema)
  takeProposal(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('threadId') threadId: string,
    @Body() body: AssistantTakeProposalDto,
  ) {
    return this.proposals.take(user.id, Number(tripId), idParam(threadId), body);
  }

  /** An answer shared in the trip's chat, marked as from the assistant; the chat's own right decides. */
  @Post('threads/:threadId/messages/:messageId/share')
  @HttpCode(201)
  @RequirePermission('collab_edit')
  @ResponseContract(collabMessageResponseSchema)
  share(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
    @Body() body: AssistantShareDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.shares.share(user, Number(tripId), idParam(threadId), messageId, body.text, socketId);
  }

  @Post('tool-calls/:toolCallId/undo')
  @HttpCode(200)
  @ResponseContract(assistantUndoResponseSchema)
  async undo(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('toolCallId') toolCallId: string,
    @Body() _body: AssistantUndoDto,
  ) {
    await this.assistant.undo(user.id, tripScope(Number(tripId)), toolCallId);
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
