import { Body, Controller, Get, HttpCode, HttpException, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RateLimitService } from './rate-limit.service';
import { OptionalJwtGuard } from './optional-jwt.guard';
import { writeAudit, getClientIp } from '../../services/auditLog';
import type { User } from '../../types';

const WINDOW = 15 * 60 * 1000;
const LOGIN_MIN_LATENCY_MS = 350;
const FORGOT_MIN_LATENCY_MS = 350;
const GENERIC_FORGOT_RESPONSE = { ok: true };

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Public auth endpoints (no session required) — byte-identical to the legacy
 * Express route (server/src/routes/auth.ts): the same per-IP rate-limit buckets
 * + limits, the constant-time login/forgot latency padding, the enumeration-safe
 * forgot response, the audit writes and the JWT httpOnly cookie set/clear via
 * the shared cookie service (no new token shape).
 */
@Controller('api/auth')
export class AuthPublicController {
  constructor(private readonly auth: AuthService, private readonly rl: RateLimitService) {}

  private limit(bucket: string, req: Request, max: number): void {
    if (!this.rl.check(bucket, req.ip || 'unknown', max, WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
  }

  @Get('app-config')
  @UseGuards(OptionalJwtGuard)
  appConfig(@Req() req: Request) {
    return this.auth.getAppConfig((req.user as User | undefined) ?? undefined);
  }

  @Post('demo-login')
  @HttpCode(200)
  demoLogin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = this.auth.demoLogin();
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.auth.setAuthCookie(res, result.token!, req);
    return { token: result.token, user: result.user };
  }

  @Get('invite/:token')
  invite(@Param('token') token: string, @Req() req: Request) {
    this.limit('login', req, 10);
    const result = this.auth.validateInviteToken(token);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { valid: result.valid, max_uses: result.max_uses, used_count: result.used_count, expires_at: result.expires_at };
  }

  @Post('register')
  @HttpCode(201)
  register(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('login', req, 10);
    const result = this.auth.registerUser(body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: result.auditUserId!, action: 'user.register', ip: getClientIp(req), details: result.auditDetails });
    this.auth.setAuthCookie(res, result.token!, req);
    return { token: result.token, user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('login', req, 10);
    const started = Date.now();
    const result = this.auth.loginUser(body);
    if (result.auditAction) {
      writeAudit({ userId: result.auditUserId ?? null, action: result.auditAction, ip: getClientIp(req), details: result.auditDetails });
    }
    const elapsed = Date.now() - started;
    if (elapsed < LOGIN_MIN_LATENCY_MS) await delay(LOGIN_MIN_LATENCY_MS - elapsed);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    if (result.mfa_required) {
      return { mfa_required: true, mfa_token: result.mfa_token };
    }
    this.auth.setAuthCookie(res, result.token!, req, result.remember);
    return { token: result.token, user: result.user };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: { email?: unknown }, @Req() req: Request) {
    this.limit('forgot', req, 3);
    const started = Date.now();
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const ip = getClientIp(req);

    const outcome = this.auth.requestPasswordReset(rawEmail, ip);
    if (outcome.reason === 'issued' && outcome.tokenForDelivery && outcome.userEmail) {
      const origin = this.auth.getAppUrl();
      const url = `${origin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(outcome.tokenForDelivery)}`;
      writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: 'pending' } });
      try {
        const delivery = await this.auth.sendPasswordResetEmail(outcome.userEmail, url, outcome.userId);
        writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: delivery.delivered } });
      } catch {
        writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: 'failed' } });
      }
    } else {
      writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { reason: outcome.reason } });
    }
    const elapsed = Date.now() - started;
    if (elapsed < FORGOT_MIN_LATENCY_MS) await delay(FORGOT_MIN_LATENCY_MS - elapsed);
    return GENERIC_FORGOT_RESPONSE;
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() body: unknown, @Req() req: Request) {
    // Per-IP brute-force guard, parity with the legacy resetLimiter (5 / 15 min on
    // a dedicated bucket) — without it reset tokens could be guessed unthrottled.
    this.limit('reset', req, 5);
    const ip = getClientIp(req);
    const result = this.auth.resetPassword(body);
    if (result.error) {
      writeAudit({ userId: null, action: 'user.password_reset_fail', ip, details: { reason: result.error } });
      throw new HttpException({ error: result.error }, result.status!);
    }
    if (result.mfa_required) {
      return { mfa_required: true };
    }
    writeAudit({ userId: result.userId ?? null, action: 'user.password_reset_success', ip });
    return { success: true };
  }

  @Post('mfa/verify-login')
  @HttpCode(200)
  verifyMfaLogin(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('mfa', req, 5);
    const result = this.auth.verifyMfaLogin(body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: result.auditUserId!, action: 'user.login', ip: getClientIp(req), details: { mfa: true } });
    this.auth.setAuthCookie(res, result.token!, req, result.remember);
    return { token: result.token, user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.auth.clearAuthCookie(res, req);
    return { success: true };
  }
}
