import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { DomainError } from '../common/domain-error';
import { ResponseContract } from '../common/response-contract';
import { armKeepalive, openSseStream } from '../common/sse-stream';
import { AiTravelPlanService } from './ai-travel-plan.service';
import { ApplyTravelPlanDto } from './dto/apply-travel-plan.dto';
import { CreateTravelPlanRevisionDto } from './dto/create-travel-plan-revision.dto';
import { CreateTravelPlanDto } from './dto/create-travel-plan.dto';
import { DiscardTravelPlanDto } from './dto/discard-travel-plan.dto';
import { UndoTravelPlanDto } from './dto/undo-travel-plan.dto';
import { Body, Controller, Get, Headers, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import {
  travelPlanApplyResponseSchema,
  travelPlanDiscardResponseSchema,
  travelPlanResponseSchema,
  travelPlanRevisionResponseSchema,
  travelPlanUndoResponseSchema,
  type TravelPlanApplyResponse,
  type TravelPlanDiscardResponse,
  type TravelPlanResponse,
  type TravelPlanRevisionResponse,
  type TravelPlanUndoResponse,
} from '@trek/shared';

import type { Response } from 'express';

/**
 * `/api/ai-travel-plans` — the REST contract of the AI travel planner.
 *
 * The five routes are the whole surface a client (or, later, the Java/Spring
 * AI service behind the same URLs) needs:
 *
 * - POST   /api/ai-travel-plans              create + generate revision 1
 * - GET    /api/ai-travel-plans/:id          the plan with its current draft
 * - POST   /api/ai-travel-plans/:id/revisions  append a revision
 * - POST   /api/ai-travel-plans/:id/apply      apply (the trip write)
 * - POST   /api/ai-travel-plans/:id/undo       revert a `new_trip` apply
 * - POST   /api/ai-travel-plans/:id/discard    mark expired
 *
 * Plans are personal: every route answers only for the signed-in owner, and
 * another user's id is a 404. `apply` additionally requires
 * `X-Idempotency-Key`; the global idempotency interceptor replays a repeated
 * key instead of applying twice.
 */
@Controller('api/ai-travel-plans')
@UseGuards(JwtAuthGuard)
export class AiTravelPlanController {
  constructor(private readonly plans: AiTravelPlanService) {}

  @Post()
  @ResponseContract(travelPlanResponseSchema)
  create(@CurrentUser() user: User, @Body() body: CreateTravelPlanDto): Promise<TravelPlanResponse> {
    return this.plans.create(user, body);
  }

  /**
   * PLAN-11: the same create, streamed. Every event is one JSON document of
   * `travelPlanStreamEventSchema`; the final `done` event carries the plan the
   * JSON route would have returned.
   */
  // response-contract-exempt: server-sent events, not a JSON response body
  @Post('stream')
  async stream(@CurrentUser() user: User, @Body() body: CreateTravelPlanDto, @Res() res: Response): Promise<void> {
    const stream = openSseStream(res);
    const stop = armKeepalive(stream);
    try {
      await this.plans.createStreaming(user, body, (event) => stream.send(JSON.stringify(event)));
    } catch (err) {
      // A refusal raised before generation (OPS-01's `daily_limit`, a missing
      // permission) keeps its own code and message; anything else is the
      // generic "generation failed".
      const refusal = err instanceof DomainError ? err : null;
      stream.send(
        JSON.stringify({
          type: 'error',
          code: refusal?.code ?? 'generation_failed',
          message: refusal?.publicMessage ?? '生成请求没有被接受，请稍后重试。',
        }),
      );
    } finally {
      stop();
      stream.end();
    }
  }

  @Get(':id')
  @ResponseContract(travelPlanResponseSchema)
  get(@CurrentUser() user: User, @Param('id') id: string): Promise<TravelPlanResponse> {
    return this.plans.get(user, id);
  }

  @Post(':id/revisions')
  @ResponseContract(travelPlanRevisionResponseSchema)
  createRevision(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: CreateTravelPlanRevisionDto,
  ): Promise<TravelPlanRevisionResponse> {
    return this.plans.createRevision(user, id, body);
  }

  /**
   * Refreshes the current draft's traffic legs from the real road network
   * without regenerating the proposal or charging the daily quota.
   */
  @Post(':id/recalculate')
  @HttpCode(200)
  @ResponseContract(travelPlanResponseSchema)
  recalculate(@CurrentUser() user: User, @Param('id') id: string): Promise<TravelPlanResponse> {
    return this.plans.recalculate(user, id);
  }

  @Post(':id/apply')
  @HttpCode(200)
  @ResponseContract(travelPlanApplyResponseSchema)
  apply(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: ApplyTravelPlanDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<TravelPlanApplyResponse> {
    return this.plans.apply(user, id, body, idempotencyKey);
  }

  @Post(':id/discard')
  @HttpCode(200)
  @ResponseContract(travelPlanDiscardResponseSchema)
  discard(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: DiscardTravelPlanDto,
  ): Promise<TravelPlanDiscardResponse> {
    return this.plans.discard(user, id, body.reason);
  }

  /**
   * PLAN-13: undo. A `new_trip` apply is reverted by deleting the trip it
   * created; an apply into an existing trip answers 409 `undo_manual_required`
   * with the recorded ids to remove by hand.
   */
  @Post(':id/undo')
  @HttpCode(200)
  @ResponseContract(travelPlanUndoResponseSchema)
  undo(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UndoTravelPlanDto,
  ): Promise<TravelPlanUndoResponse> {
    return this.plans.undo(user, id, body.reason);
  }
}
