import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RateLimitService } from '../common/rate-limit.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasskeyEnabledGuard } from './passkey-enabled.guard';
import { CurrentUser } from './current-user.decorator';
import { setAuthCookie } from '../common/cookie';
import { getClientIp } from '../audit/client-ip';
import { AuditService } from '../audit/audit.service';
import { PasskeyService } from './passkey.service';
import { PasskeyRegisterOptionsDto, PasskeyRegisterVerifyDto, PasskeyLoginVerifyDto, PasskeyRenameDto, PasskeyDeleteDto } from './auth.dto';
import type { User } from '../../types';
import { MfaExempt } from './mfa-policy.guard';

const WINDOW = 15 * 60 * 1000;
const LOGIN_MIN_LATENCY_MS = 350;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * /api/auth/passkey — WebAuthn (passkey) registration, primary login and
 * credential management.
 *
 * - register/*  : authenticated, gated by the admin toggle + password re-auth.
 * - login/*     : UNauthenticated discoverable-credential login, gated by the
 *                 admin toggle; mints the SAME session cookie as password login.
 * - credentials : owner-scoped management — intentionally NOT toggle-gated so a
 *                 user can always view/remove their passkeys.
 *
 * PasskeyEnabledGuard is listed first so a disabled feature 404s before auth.
 */
@Controller('api/auth/passkey')
export class PasskeyController {
  constructor(
    private readonly rl: RateLimitService,
    private readonly audit: AuditService,
    private readonly passkeys: PasskeyService,
  ) {}

  private limit(bucket: string, req: Request, max: number): void {
    if (!this.rl.check(bucket, req.ip || 'unknown', max, WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
  }

  // ── Registration (authenticated) ──
  @Post('register/options')
  @MfaExempt('a user-verified passkey satisfies require_mfa, so enrolling one is a way out')
  @HttpCode(200)
  @UseGuards(PasskeyEnabledGuard, JwtAuthGuard)
  async registerOptions(@CurrentUser() user: User, @Body() body: PasskeyRegisterOptionsDto, @Req() req: Request) {
    this.limit('mfa', req, 5);
    const result = await this.passkeys.passkeyRegisterOptions(user.id, body?.password);
    if (result.error) throw new HttpException({ error: result.error }, result.status!);
    return result.options;
  }

  @Post('register/verify')
  @MfaExempt('a user-verified passkey satisfies require_mfa, so enrolling one is a way out')
  @HttpCode(200)
  @UseGuards(PasskeyEnabledGuard, JwtAuthGuard)
  async registerVerify(@CurrentUser() user: User, @Body() body: PasskeyRegisterVerifyDto, @Req() req: Request) {
    const result = await this.passkeys.passkeyRegisterVerify(user.id, body);
    if (result.error) throw new HttpException({ error: result.error }, result.status!);
    this.audit.writeAudit({ userId: user.id, action: 'user.passkey_register', ip: getClientIp(req) });
    return { success: true, credential: result.credential };
  }

  // ── Authentication (public — primary login) ──
  @Post('login/options')
  @MfaExempt('unauthenticated passkey login ceremony')
  @HttpCode(200)
  @UseGuards(PasskeyEnabledGuard)
  async loginOptions(@Req() req: Request) {
    this.limit('login', req, 10);
    const result = await this.passkeys.passkeyLoginOptions();
    if (result.error) throw new HttpException({ error: result.error }, result.status!);
    return result.options;
  }

  @Post('login/verify')
  @MfaExempt('unauthenticated passkey login ceremony')
  @HttpCode(200)
  @UseGuards(PasskeyEnabledGuard)
  async loginVerify(@Body() body: PasskeyLoginVerifyDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('login', req, 10);
    const started = Date.now();
    const result = await this.passkeys.passkeyLoginVerify(body);
    if (result.auditAction) {
      this.audit.writeAudit({ userId: result.auditUserId ?? null, action: result.auditAction, ip: getClientIp(req) });
    }
    // Pad to the same floor as password login so timing can't distinguish a
    // known credential from an unknown one.
    const elapsed = Date.now() - started;
    if (elapsed < LOGIN_MIN_LATENCY_MS) await delay(LOGIN_MIN_LATENCY_MS - elapsed);
    if (result.error) throw new HttpException({ error: result.error }, result.status!);
    this.audit.writeAudit({ userId: result.auditUserId!, action: 'user.login', ip: getClientIp(req), details: { method: 'passkey' } });
    setAuthCookie(res, result.token!, req);
    return { token: result.token, user: result.user };
  }

  // ── Management (authenticated, owner-scoped — NOT toggle-gated) ──
  @Get('credentials')
  @MfaExempt('the setup screen lists what the user already has')
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: User) {
    return { credentials: this.passkeys.listPasskeys(user.id) };
  }

  @Patch('credentials/:id')
  @UseGuards(JwtAuthGuard)
  rename(@CurrentUser() user: User, @Param('id') id: string, @Body() body: PasskeyRenameDto) {
    const result = this.passkeys.renamePasskey(user.id, id, body?.name);
    if (result.error) throw new HttpException({ error: result.error }, result.status!);
    return { success: true };
  }

  @Delete('credentials/:id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: User, @Param('id') id: string, @Body() body: PasskeyDeleteDto, @Req() req: Request) {
    this.limit('login', req, 5);
    const result = this.passkeys.deletePasskey(user.id, id, body?.password);
    if (result.error) throw new HttpException({ error: result.error }, result.status!);
    this.audit.writeAudit({ userId: user.id, action: 'user.passkey_delete', resource: String(id), ip: getClientIp(req) });
    return { success: true };
  }
}
