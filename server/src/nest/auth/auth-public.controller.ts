import { Body, Controller, Get, HttpCode, HttpException, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, MfaVerifyLoginDto } from './auth.dto';
import { RateLimitService } from '../common/rate-limit.service';
import { OptionalJwtGuard } from './optional-jwt.guard';
import { getClientIp } from '../audit/client-ip';
import { AuditService } from '../audit/audit.service';
import { willDropSecureCookie } from '../common/cookie';
import type { User } from '../../types';
import { Public } from './public.decorator';
import { MfaExempt } from './mfa-policy.guard';

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
  constructor(private readonly auth: AuthService, private readonly rl: RateLimitService, private readonly audit: AuditService) {}

  private limit(bucket: string, req: Request, max: number): void {
    if (!this.rl.check(bucket, req.ip || 'unknown', max, WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
  }

  @Get('app-config')
  @MfaExempt('bootstrap config, read before the client knows whether it must set up MFA')
  @UseGuards(OptionalJwtGuard)
  appConfig(@Req() req: Request) {
    return this.auth.getAppConfig((req.user as User | undefined) ?? undefined);
  }

  @Post('demo-login')
  @Public('issues a session for the demo account; there is nothing to authenticate yet')
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
  @Public('the invite token IS the credential')
  invite(@Param('token') token: string, @Req() req: Request) {
    this.limit('login', req, 10);
    const result = this.auth.validateInviteToken(token);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { valid: result.valid, max_uses: result.max_uses, used_count: result.used_count, expires_at: result.expires_at };
  }

  @Post('register')
  @Public('creating the account that would carry the session')
  @HttpCode(201)
  register(@Body() body: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('login', req, 10);
    const result = this.auth.registerUser(body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.audit.writeAudit({ userId: result.auditUserId!, action: 'user.register', ip: getClientIp(req), details: result.auditDetails });
    this.auth.setAuthCookie(res, result.token!, req);
    return { token: result.token, user: result.user };
  }

  @Post('login')
  @Public('the login itself')
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('login', req, 10);
    const started = Date.now();
    const result = this.auth.loginUser(body);
    if (result.auditAction) {
      this.audit.writeAudit({ userId: result.auditUserId ?? null, action: result.auditAction, ip: getClientIp(req), details: result.auditDetails });
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
    return {
      token: result.token,
      user: result.user,
      // Surfaced so the client can explain the plain-HTTP cookie gotcha instead
      // of the user hitting a bare "Access token required" on the next request.
      ...(willDropSecureCookie(req) ? { insecureCookie: true } : {}),
    };
  }

  @Post('forgot-password')
  @Public('reached by somebody who cannot log in')
  @HttpCode(200)
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: Request) {
    this.limit('forgot', req, 3);
    const started = Date.now();
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const ip = getClientIp(req);

    const outcome = this.auth.requestPasswordReset(rawEmail, ip);
    if (outcome.reason === 'issued' && outcome.tokenForDelivery && outcome.userEmail) {
      const origin = this.auth.getAppUrl();
      const url = `${origin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(outcome.tokenForDelivery)}`;
      this.audit.writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: 'pending' } });
      try {
        const delivery = await this.auth.sendPasswordResetEmail(outcome.userEmail, url, outcome.userId);
        this.audit.writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: delivery.delivered } });
      } catch {
        this.audit.writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: 'failed' } });
      }
    } else {
      this.audit.writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { reason: outcome.reason } });
    }
    const elapsed = Date.now() - started;
    if (elapsed < FORGOT_MIN_LATENCY_MS) await delay(FORGOT_MIN_LATENCY_MS - elapsed);
    return GENERIC_FORGOT_RESPONSE;
  }

  @Post('reset-password')
  @Public('the reset token IS the credential')
  @HttpCode(200)
  resetPassword(@Body() body: ResetPasswordDto, @Req() req: Request) {
    // Per-IP brute-force guard, parity with the legacy resetLimiter (5 / 15 min on
    // a dedicated bucket) — without it reset tokens could be guessed unthrottled.
    this.limit('reset', req, 5);
    const ip = getClientIp(req);
    const result = this.auth.resetPassword(body);
    if (result.error) {
      this.audit.writeAudit({ userId: null, action: 'user.password_reset_fail', ip, details: { reason: result.error } });
      throw new HttpException({ error: result.error }, result.status!);
    }
    if (result.mfa_required) {
      return { mfa_required: true };
    }
    this.audit.writeAudit({ userId: result.userId ?? null, action: 'user.password_reset_success', ip });
    return { success: true };
  }

  @Post('mfa/verify-login')
  @Public('second factor of a login that has no session yet')
  @HttpCode(200)
  verifyMfaLogin(@Body() body: MfaVerifyLoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('mfa', req, 5);
    const result = this.auth.verifyMfaLogin(body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.audit.writeAudit({ userId: result.auditUserId!, action: 'user.login', ip: getClientIp(req), details: { mfa: true } });
    this.auth.setAuthCookie(res, result.token!, req, result.remember);
    return { token: result.token, user: result.user };
  }

  @Post('logout')
  @Public('clearing a cookie must work even with an expired token, or the client cannot sign out')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.auth.clearAuthCookie(res, req);
    return { success: true };
  }
}
