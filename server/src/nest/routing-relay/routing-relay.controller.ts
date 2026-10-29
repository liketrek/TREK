import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ValhallaHeightDto, ValhallaRouteDto, ValhallaTraceDto } from './routing-relay.dto';
import { RoutingRelayService, type ValhallaRelayAnswer } from './routing-relay.service';
import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';

import type { Response } from 'express';

/**
 * /api/routing/valhalla/:action: the planner's Valhalla questions, asked of
 * the TREK services through this server. Same origin, so the browser needs no
 * new connect-src, and Valhalla's own answer comes back as it was sent, its
 * refusals included: a 400 that says no way joins the points is the planner's
 * to read.
 */
@Controller('api/routing/valhalla')
@UseGuards(JwtAuthGuard)
export class RoutingRelayController {
  constructor(private readonly relay: RoutingRelayService) {}

  // response-contract-exempt: passes Valhalla's own answer through @Res(), status and body as they came.
  @Post('route')
  @HttpCode(200)
  async route(@CurrentUser() user: User, @Body() body: ValhallaRouteDto, @Res() res: Response): Promise<void> {
    passOn(res, await this.relay.ask(user.id, 'route', body));
  }

  // response-contract-exempt: passes Valhalla's own answer through @Res(), status and body as they came.
  @Post('trace_attributes')
  @HttpCode(200)
  async traceAttributes(
    @CurrentUser() user: User,
    @Body() body: ValhallaTraceDto,
    @Res() res: Response,
  ): Promise<void> {
    passOn(res, await this.relay.ask(user.id, 'trace_attributes', body));
  }

  // response-contract-exempt: passes Valhalla's own answer through @Res(), status and body as they came.
  @Post('height')
  @HttpCode(200)
  async height(@CurrentUser() user: User, @Body() body: ValhallaHeightDto, @Res() res: Response): Promise<void> {
    passOn(res, await this.relay.ask(user.id, 'height', body));
  }
}

/** Of the upstream's headers only Retry-After goes on, so the planner knows how long to ask FOSSGIS instead. */
function passOn(res: Response, answer: ValhallaRelayAnswer): void {
  if (answer.retryAfter) res.set('Retry-After', answer.retryAfter);
  res.status(answer.status).type(answer.contentType).send(answer.body);
}
