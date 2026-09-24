import { Body, Controller, HttpCode, HttpException, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { NativeAuthService } from './native-auth.service';
import { NativeExchangeDto, NativeHandoffDto } from './native-auth.dto';
import { AuthService } from '../auth/auth.service';
import { CookieAuthGuard } from '../auth/cookie-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { RateLimitService } from '../common/rate-limit.service';
import type { User } from '../../types';

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
    private readonly auth: AuthService,
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
  handoff(@Body() body: NativeHandoffDto, @CurrentUser() user: User) {
    return { code: this.nativeAuth.issueCode(user.id, body.challenge) };
  }

  @Post('exchange')
  @Public('the one-time code together with its verifier is the credential')
  @HttpCode(200)
  exchange(@Body() body: NativeExchangeDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!this.rl.check('native-exchange', req.ip || 'unknown', EXCHANGE_MAX, EXCHANGE_WINDOW_MS, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
    const session = this.nativeAuth.redeem(body.code, body.verifier);
    if (!session) throw new HttpException({ error: 'Invalid or expired code' }, 400);
    this.auth.setAuthCookie(res, session.token, req, true);
    this.audit.writeAudit({ userId: session.userId, action: 'user.login', ip: getClientIp(req), details: { method: 'native_app' } });
    return { ok: true };
  }
}
