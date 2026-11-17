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
import { Body, Controller, Get, HttpCode, HttpException, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  nativeHandoffResponseSchema,
  successResponseSchema,
  type NativeHandoffResponse,
  type SuccessResponse,
} from '@trek/shared';

import type { Request, Response } from 'express';

const EXCHANGE_WINDOW_MS = 15 * 60 * 1000;
const EXCHANGE_MAX = 20;

const CHALLENGE = /^[0-9a-f]{64}$/;
const START = new Set(['oidc', 'passkey']);
const INVITE = /^[A-Za-z0-9_-]{1,200}$/;

/** `&`, `<`, `>` and `"` as entities, for a value inside a double-quoted attribute. */
function attr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The page /api/auth/native/start answers with: it takes a service worker of an
 * older TREK off the browser, then opens the handoff page (public/native-handoff.js).
 * A browser that ran TREK before 5.1.1 keeps that version's app in its service
 * worker, and the worker answers /native-handoff from its cache with an app that
 * has no such page: the sign-in ended on the dashboard in the browser instead of
 * in the app. Every TREK service worker lets /api through to the server, so this
 * page always comes from the running version.
 */
export function nativeStartPage(target: string): string {
  const href = attr(target);
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex"><title>TREK</title>',
    `<noscript><meta http-equiv="refresh" content="0;url=${href}"></noscript>`,
    `<script src="/native-handoff.js" data-target="${href}"></script>`,
    '</head><body></body></html>',
  ].join('');
}

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

  /**
   * Where the app's sign-in in the system browser starts. Answers a small page
   * instead of the handoff page itself (see nativeStartPage); the query is the
   * one the handoff page takes, checked here so nothing else rides along.
   */
  // response-contract-exempt: an HTML page that forwards the browser, no body to check
  @Get('start')
  @Public('opens the handoff page in the browser; it carries no credential and shows nothing')
  start(
    @Query('challenge') challenge: unknown,
    @Query('start') start: unknown,
    @Query('invite') invite: unknown,
    @Res() res: Response,
  ): void {
    if (typeof challenge !== 'string' || !CHALLENGE.test(challenge)) {
      res.status(400).type('text/plain').send('Invalid sign-in link.');
      return;
    }
    const params = new URLSearchParams({ challenge });
    if (typeof start === 'string' && START.has(start)) params.set('start', start);
    if (typeof invite === 'string' && INVITE.test(invite)) params.set('invite', invite);
    res
      .status(200)
      .set('Cache-Control', 'no-store')
      .type('text/html')
      .send(nativeStartPage(`/native-handoff?${params.toString()}`));
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
