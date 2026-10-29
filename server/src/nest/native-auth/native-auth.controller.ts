import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { CookieAuthGuard } from '../auth-core/cookie-auth.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { Public } from '../auth-core/public.decorator';
import { setAuthCookie } from '../common/cookie';
import { RateLimitService } from '../common/rate-limit.service';
import { ResponseContract } from '../common/response-contract';
import { sessionClientFrom } from '../sessions/sessions.service';
import { NativeExchangeDto, NativeHandoffDto } from './native-auth.dto';
import { NativeAuthService } from './native-auth.service';
import { Body, Controller, HttpCode, HttpException, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  nativeHandoffResponseSchema,
  successResponseSchema,
  type NativeHandoffResponse,
  type SuccessResponse,
} from '@trek/shared';

import type { Request, Response } from 'express';

const EXCHANGE_WINDOW_MS = 15 * 60 * 1000;
const EXCHANGE_MAX = 20;

/**
 * /api/auth/native: the sign-in hand-off between the system browser and the
 * native app. See the contract in @trek/shared for the whole round trip.
 */
@Controller('api/auth/native')
export class NativeAuthController {
  constructor(
    private readonly nativeAuth: NativeAuthService,
    private readonly audit: AuditService,
    private readonly rl: RateLimitService,
  ) {}

  /**
   * Cookie only: an API or MCP bearer token must not be able to mint itself a
   * full browser session this way.
   */
  @Post('handoff')
  @UseGuards(CookieAuthGuard)
  @HttpCode(200)
  @ResponseContract(nativeHandoffResponseSchema)
  async handoff(@Body() body: NativeHandoffDto, @CurrentUser() user: User): Promise<NativeHandoffResponse> {
    return { code: await this.nativeAuth.issueCode(user.id, body.challenge) };
  }

  @Post('exchange')
  @Public('the one-time code together with its verifier is the credential')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async exchange(
    @Body() body: NativeExchangeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponse> {
    if (!(await this.rl.check('native-exchange', req.ip || 'unknown', EXCHANGE_MAX, EXCHANGE_WINDOW_MS, Date.now()))) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
    const session = await this.nativeAuth.redeem(body.code, body.verifier, sessionClientFrom(req));
    setAuthCookie(res, session.token, req, true);
    await this.audit.writeAudit({
      userId: session.userId,
      action: 'user.login',
      ip: getClientIp(req),
      details: { method: 'native_app' },
    });
    return { success: true };
  }
}
