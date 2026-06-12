import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OauthService } from './oauth.service';
import { RateLimitService } from '../auth/rate-limit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CookieAuthGuard } from '../auth/cookie-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { getClientIp } from '../../services/auditLog';
import type { User } from '../../types';
import type { AuthorizeParams } from '../../services/oauthService';

const MIN = 60_000;

/**
 * Authenticated OAuth management endpoints (the SPA's consent + client/session
 * UI) — byte-identical to the legacy oauthApiRouter (server/src/routes/oauth.ts):
 * MCP-addon gated (404 on the anonymous validate to avoid fingerprinting, 403
 * elsewhere), optional-auth on validate, cookie-only auth on state-changing
 * routes (consent/create/rotate/delete/revoke) and Bearer-or-cookie auth on the
 * read lists. create answers 201; the rest 200.
 */
@Controller('api/oauth')
export class OauthApiController {
  constructor(private readonly oauth: OauthService, private readonly rl: RateLimitService) {}

  private requireMcp403(): void {
    if (!this.oauth.mcpEnabled()) {
      throw new HttpException({ error: 'MCP is not enabled' }, 403);
    }
  }

  @Get('authorize/validate')
  @UseGuards(OptionalJwtGuard)
  validate(@Req() req: Request, @Query() params: Partial<AuthorizeParams>, @Res({ passthrough: true }) res: Response) {
    if (!this.rl.check('oauth_validate', req.ip || 'unknown', 30, MIN, Date.now())) {
      throw new HttpException({ error: 'too_many_requests', error_description: 'Too many attempts. Please try again later.' }, 429);
    }
    if (!this.oauth.mcpEnabled()) {
      // 404 (not 403) with an empty body so anonymous callers can't fingerprint the feature.
      res.status(404).end();
      return undefined;
    }
    const userId = (req.user as User | undefined)?.id ?? null;
    const result = this.oauth.validateAuthorizeRequest(
      {
        response_type: params.response_type || '',
        client_id: params.client_id || '',
        redirect_uri: params.redirect_uri || '',
        scope: params.scope || '',
        state: params.state,
        code_challenge: params.code_challenge || '',
        code_challenge_method: params.code_challenge_method || '',
        resource: typeof params.resource === 'string' ? params.resource : undefined,
      },
      userId,
    );
    if (userId === null && result.valid) {
      return { valid: result.valid, loginRequired: true };
    }
    if (userId === null && !result.valid) {
      return { valid: false, error: 'invalid_request', error_description: 'Invalid authorization request' };
    }
    return result;
  }

  @Post('authorize')
  @HttpCode(200) // Express answers consent with res.json (200), not the POST-default 201.
  @UseGuards(CookieAuthGuard)
  authorize(@CurrentUser() user: User, @Body() body: {
    client_id: string; redirect_uri: string; scope: string; state?: string;
    code_challenge: string; code_challenge_method: string; approved: boolean; resource?: string;
  }, @Req() req: Request) {
    const ip = getClientIp(req);
    if (!this.oauth.mcpEnabled()) {
      throw new HttpException({ error: 'MCP is not enabled' }, 403);
    }
    if (!body.approved) {
      const url = new URL(body.redirect_uri);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('error_description', 'User denied the authorization request');
      if (body.state) url.searchParams.set('state', body.state);
      return { redirect: url.toString() };
    }
    const params: AuthorizeParams = {
      response_type: 'code',
      client_id: body.client_id,
      redirect_uri: body.redirect_uri,
      scope: body.scope,
      state: body.state,
      code_challenge: body.code_challenge,
      code_challenge_method: body.code_challenge_method,
      resource: body.resource,
    };
    const validation = this.oauth.validateAuthorizeRequest(params, user.id);
    if (!validation.valid) {
      throw new HttpException({ error: validation.error, error_description: validation.error_description }, 400);
    }
    const scopes = validation.scopes!;
    this.oauth.saveConsent(body.client_id, user.id, scopes, ip);
    const code = this.oauth.createAuthCode({
      clientId: body.client_id,
      userId: user.id,
      redirectUri: body.redirect_uri,
      scopes,
      resource: validation.resource ?? null,
      codeChallenge: body.code_challenge,
      codeChallengeMethod: 'S256',
    });
    if (!code) {
      throw new HttpException({ error: 'server_error', error_description: 'Authorization server is temporarily unavailable' }, 503);
    }
    const url = new URL(body.redirect_uri);
    url.searchParams.set('code', code);
    if (body.state) url.searchParams.set('state', body.state);
    return { redirect: url.toString() };
  }

  @Get('clients')
  @UseGuards(JwtAuthGuard)
  listClients(@CurrentUser() user: User) {
    this.requireMcp403();
    return { clients: this.oauth.listOAuthClients(user.id) };
  }

  @Post('clients')
  @HttpCode(201)
  @UseGuards(CookieAuthGuard)
  createClient(@CurrentUser() user: User, @Body() body: { name: string; redirect_uris?: string[]; allowed_scopes: string[]; allows_client_credentials?: boolean }, @Req() req: Request) {
    this.requireMcp403();
    const result = this.oauth.createOAuthClient(user.id, body.name, body.redirect_uris ?? [], body.allowed_scopes, getClientIp(req), { allowsClientCredentials: body.allows_client_credentials });
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status || 400);
    }
    return result;
  }

  @Post('clients/:id/rotate')
  @HttpCode(200)
  @UseGuards(CookieAuthGuard)
  rotateClient(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    this.requireMcp403();
    const result = this.oauth.rotateOAuthClientSecret(user.id, id, getClientIp(req));
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status || 400);
    }
    return { client_secret: result.client_secret };
  }

  @Delete('clients/:id')
  @UseGuards(CookieAuthGuard)
  deleteClient(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    this.requireMcp403();
    const result = this.oauth.deleteOAuthClient(user.id, id, getClientIp(req));
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status || 400);
    }
    return { success: true };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  listSessions(@CurrentUser() user: User) {
    this.requireMcp403();
    return { sessions: this.oauth.listOAuthSessions(user.id) };
  }

  @Delete('sessions/:id')
  @UseGuards(CookieAuthGuard)
  revokeSession(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    this.requireMcp403();
    const result = this.oauth.revokeSession(user.id, Number(id), getClientIp(req));
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status || 400);
    }
    return { success: true };
  }
}
