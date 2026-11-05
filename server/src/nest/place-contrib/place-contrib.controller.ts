import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { DomainError } from '../common/domain-error';
import { ResponseContract } from '../common/response-contract';
import { PlaceContribDecisionDto, PlaceContribLogQueryDto, PlaceContribWithdrawDto } from './place-contrib.dto';
import { PlaceContribService } from './place-contrib.service';
import { Body, Controller, Get, HttpCode, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import {
  placeContribLogResponseSchema,
  placeContribStateSchema,
  placeContribWithdrawResponseSchema,
  type PlaceContribDecisionRequest,
  type PlaceContribLogResponse,
  type PlaceContribState,
  type PlaceContribWithdrawResponse,
} from '@trek/shared';

import type { Request } from 'express';

/**
 * /api/admin/places-contribute: the admin's side of sharing place details with
 * the TREK Places API. The state the panel and the first-visit prompt read, the
 * decision, the transmission log, and withdrawing everything that was sent.
 *
 * Admin only, like every instance setting. On a managed install the tenant's
 * own admin decides too: the operator never answers for them.
 */
@Controller('api/admin/places-contribute')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PlaceContribController {
  constructor(
    private readonly contrib: PlaceContribService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ResponseContract(placeContribStateSchema)
  async state(@CurrentUser() user: User): Promise<PlaceContribState> {
    return this.contrib.state(user.id);
  }

  @Put('decision')
  @ResponseContract(placeContribStateSchema)
  async decide(
    @CurrentUser() user: User,
    @Body() body: PlaceContribDecisionDto,
    @Req() req: Request,
  ): Promise<PlaceContribState> {
    const audit = (details: Record<string, unknown>) =>
      this.audit.writeAudit({
        userId: user.id,
        action: 'admin.places_contribute_decision',
        details,
        ip: getClientIp(req),
      });
    let state: PlaceContribState;
    try {
      // The pipe validated the body against the full union; the DTO only types its shared fields.
      state = await this.contrib.decide(user.id, body as PlaceContribDecisionRequest);
    } catch (err) {
      // Switching off commits before the withdrawal asks the service, so an
      // unconfirmed withdrawal still leaves a decision that took effect.
      if (body.action === 'off' && err instanceof DomainError && err.getStatus() === 502) {
        await audit({ ...decisionDetails(body), withdrawFailed: true });
      }
      throw err;
    }
    await audit(decisionDetails(body));
    return state;
  }

  @Get('log')
  @ResponseContract(placeContribLogResponseSchema)
  async log(@Query() query: PlaceContribLogQueryDto): Promise<PlaceContribLogResponse> {
    return this.contrib.logPage(query);
  }

  @Post('withdraw')
  @HttpCode(200)
  @ResponseContract(placeContribWithdrawResponseSchema)
  async withdraw(
    @CurrentUser() user: User,
    @Body() _body: PlaceContribWithdrawDto,
    @Req() req: Request,
  ): Promise<PlaceContribWithdrawResponse> {
    const result = await this.contrib.withdrawAll();
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.places_contribute_withdraw',
      details: { cleared: result.cleared },
      ip: getClientIp(req),
    });
    return result;
  }
}

/** What the audit row keeps of a decision: the action, and the switches or terms it named. */
function decisionDetails(body: PlaceContribDecisionDto): Record<string, unknown> {
  const details: Record<string, unknown> = { action: body.action };
  if (body.termsVersion !== undefined) details.termsVersion = body.termsVersion;
  if (body.fields !== undefined) details.fields = body.fields;
  if (body.withdraw !== undefined) details.withdraw = body.withdraw;
  return details;
}
