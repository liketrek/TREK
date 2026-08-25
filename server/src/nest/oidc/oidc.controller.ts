import { Body, Controller, Get, HttpException, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { oidcLoginQuerySchema } from '@trek/shared';
import { readEnv } from '../../app-config';
import { OidcService, OIDC_STATE_TTL_MS } from './oidc.service';
import { cookieOptions } from '../common/cookie';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminOidcUpdateDto } from '../admin/admin.dto';
import { Public } from '../auth/public.decorator';
import { ManagedForbidden } from '../common/managed';

const OIDC_STATE_COOKIE = 'trek_oidc_state';

/**
 * /api/auth/oidc — OIDC SSO login flow (Authorization Code + PKCE).
 *
 * Byte-identical to the legacy Express route (server/src/routes/oidc.ts):
 * unauthenticated, the sso-disabled / not-configured / HTTPS-issuer guards, the
 * strict id_token + userinfo.sub cross-check, all the frontend redirect error
 * codes, and the auth-code → cookie hand-off on /exchange. Uses @Res directly
 * because the flow mixes provider redirects with JSON error bodies.
 */
@Public('the OIDC handshake happens before a TREK session exists; the provider state is the credential')
@Controller('api/auth/oidc')
export class OidcController {
  constructor(private readonly oidc: OidcService) {}

  @Get('login')
  async login(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (!this.oidc.oidcLoginEnabled()) {
      res.status(403).json({ error: 'SSO login is disabled.' });
      return;
    }
    const config = this.oidc.getOidcConfig();
    if (!config) {
      res.status(400).json({ error: 'OIDC not configured' });
      return;
    }
    if (config.issuer && !config.issuer.startsWith('https://') && readEnv().app.isProduction) {
      res.status(400).json({ error: 'OIDC issuer must use HTTPS in production' });
      return;
    }
    try {
      const doc = await this.oidc.discover(config.issuer, config.discoveryUrl);
      const appUrl = this.oidc.getAppUrl();
      if (!appUrl) {
        res.status(500).json({ error: 'APP_URL is not configured. OIDC cannot be used.' });
        return;
      }
      // `(?<!\/)` as in oidc.service.ts: it pins the run to its own start so a trailing
      // run that does not end the string is not rescanned from every slash in it.
      const redirectUri = `${appUrl.replace(/(?<!\/)\/+$/, '')}/api/auth/oidc/callback`;
      // Lenient parse: a malformed query must never 400 a login redirect, so
      // unknown values simply fall back to the raw invite + default duration.
      const query = oidcLoginQuerySchema.safeParse(req.query);
      const inviteToken = query.success ? query.data.invite : (req.query.invite as string | undefined);
      const remember = query.success && query.data.remember !== undefined ? query.data.remember === '1' : undefined;
      const { state, codeChallenge } = this.oidc.createState(redirectUri, inviteToken, remember);
      // Bind the state to THIS browser. The callback requires a matching cookie,
      // so an attacker-initiated login (whose callback URL carries a valid state
      // from the shared server map) cannot be replayed in a victim's browser to
      // log them into the attacker's account (OIDC login CSRF / session fixation).
      // maxAge matches the server-side pending-state TTL — a cookie that
      // outlives its state entry could only ever produce invalid_state.
      res.cookie(OIDC_STATE_COOKIE, state, { ...cookieOptions(false, req), maxAge: OIDC_STATE_TTL_MS });
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: redirectUri,
        scope: readEnv().oidc.scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });
      res.redirect(`${doc.authorization_endpoint}?${params}`);
    } catch (err: unknown) {
      console.error('[OIDC] Login error:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'OIDC login failed' });
    }
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oidcError: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const f = (p: string) => res.redirect(this.oidc.frontendUrl(p));

    // The state cookie is single-use — clear it regardless of the outcome.
    const boundState = (req.cookies as Record<string, string> | undefined)?.[OIDC_STATE_COOKIE];
    res.clearCookie(OIDC_STATE_COOKIE, cookieOptions(true, req));

    if (!this.oidc.oidcLoginEnabled()) return f('/login?oidc_error=sso_disabled');
    if (oidcError) {
      console.error('[OIDC] Provider error:', oidcError);
      return f('/login?oidc_error=' + encodeURIComponent(oidcError));
    }
    if (!code || !state) return f('/login?oidc_error=missing_params');

    // Require the callback to come from the browser that started the flow.
    if (!boundState || boundState !== state) return f('/login?oidc_error=invalid_state');

    const pending = this.oidc.consumeState(state);
    if (!pending) return f('/login?oidc_error=invalid_state');

    const config = this.oidc.getOidcConfig();
    if (!config) return f('/login?oidc_error=not_configured');
    if (config.issuer && !config.issuer.startsWith('https://') && readEnv().app.isProduction) {
      return f('/login?oidc_error=issuer_not_https');
    }

    try {
      const doc = await this.oidc.discover(config.issuer, config.discoveryUrl);
      const tokenData = await this.oidc.exchangeCodeForToken(doc, code, pending.redirectUri, config.clientId, config.clientSecret, pending.codeVerifier);
      if (!tokenData._ok || !tokenData.access_token) {
        console.error('[OIDC] Token exchange failed: status', tokenData._status);
        return f('/login?oidc_error=token_failed');
      }
      if (!tokenData.id_token) {
        console.error('[OIDC] Token response missing id_token — refusing login');
        return f('/login?oidc_error=no_id_token');
      }
      const idVerify = await this.oidc.verifyIdToken(
        tokenData.id_token,
        doc,
        config.clientId,
        // Same trim as oidc.service.ts, and the same reason for the lookbehind — this one
        // runs over an issuer read out of a fetched discovery document.
        (doc.issuer ?? '').replace(/(?<!\/)\/+$/, '') || config.issuer,
      );
      if (idVerify.ok !== true) {
        const reason = 'error' in idVerify ? idVerify.error : 'unknown';
        console.error('[OIDC] id_token verification failed:', reason);
        return f('/login?oidc_error=id_token_invalid');
      }
      const userInfo = await this.oidc.getUserInfo(doc.userinfo_endpoint, tokenData.access_token);
      if (!userInfo.email) return f('/login?oidc_error=no_email');

      const tokenSub = idVerify.claims.sub;
      if (typeof tokenSub === 'string' && userInfo.sub && userInfo.sub !== tokenSub) {
        console.error('[OIDC] userinfo.sub does not match id_token.sub — refusing login');
        return f('/login?oidc_error=subject_mismatch');
      }

      // Some IdPs put `picture` only in the id_token, not the userinfo response —
      // fall back to it so the avatar (#1399) still populates.
      if (!userInfo.picture && typeof idVerify.claims.picture === 'string') {
        userInfo.picture = idVerify.claims.picture;
      }

      const result = this.oidc.findOrCreateUser(userInfo, config, pending.inviteToken);
      if ('error' in result) return f('/login?oidc_error=' + result.error);

      this.oidc.touchLastLogin(result.user.id);
      const jwtToken = this.oidc.generateToken(result.user, pending.remember === true);
      const authCode = this.oidc.createAuthCode(jwtToken, pending.remember);
      return f('/login?oidc_code=' + authCode);
    } catch (err: unknown) {
      console.error('[OIDC] Callback error:', err);
      return f('/login?oidc_error=server_error');
    }
  }

  @Get('exchange')
  exchange(@Query('code') code: string | undefined, @Req() req: Request, @Res() res: Response): void {
    if (!code) {
      res.status(400).json({ error: 'Code required' });
      return;
    }
    const result = this.oidc.consumeAuthCode(code);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    this.oidc.setAuthCookie(res, result.token, req, result.remember);
    res.json({ token: result.token });
  }
}

/**
 * /api/admin/oidc — the SSO configuration.
 *
 * Two routes that sat on AdminController with their SQL in AdminService, for a domain
 * that already had a module. They read and write the same five app_settings keys the
 * login flow next door consumes, so they belong here; the lockout guard that refuses
 * to remove the config while password login is off lives with them in OidcService.
 *
 * The path, the {error,status} envelope and the audit action are unchanged.
 */
@Controller('api/admin/oidc')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminOidcController {
  constructor(
    private readonly oidc: OidcService,
    private readonly audit: AuditService,
  ) {}

  // Both halves, not just the write: reading back the issuer, client id and the
  // discovery URL tells a caller how the identity of this install is wired, and
  // on a managed install that wiring is not theirs.
  @ManagedForbidden('the identity provider is part of what the operator runs')
  @Get()
  get() {
    return this.oidc.getOidcSettings();
  }

  @ManagedForbidden('an instance-supplied issuer could assert any address as verified')
  @Put()
  update(@CurrentUser() user: User, @Body() body: AdminOidcUpdateDto, @Req() req: Request) {
    const result = this.oidc.updateOidcSettings(body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status || 400);
    }
    // Only whether an issuer was set, never the value: the details column is readable
    // by every admin and the issuer identifies the customer's IdP tenant.
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.oidc_update',
      ip: getClientIp(req),
      details: { issuer_set: !!body.issuer },
    });
    return { success: true };
  }
}
