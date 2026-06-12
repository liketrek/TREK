import { Controller, Get, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OauthService } from './oauth.service';
import { RateLimitService } from '../auth/rate-limit.service';
import { writeAudit, getClientIp, logWarn } from '../../services/auditLog';

const MIN = 60_000;

/**
 * Public OAuth 2.1 endpoints (no session) — byte-identical to the legacy
 * oauthPublicRouter (server/src/routes/oauth.ts): MCP-addon gated (404), the
 * per-(ip,client) token / per-ip revoke rate limits, no-store cache headers on
 * /token, the WWW-Authenticate challenge on /userinfo, the three grant types
 * and the RFC 7009 always-200 revoke. Uses @Res directly because every branch
 * sets headers + a specific status the way the spec requires.
 */
@Controller('oauth')
export class OauthPublicController {
  constructor(private readonly oauth: OauthService, private readonly rl: RateLimitService) {}

  @Post('token')
  @HttpCode(200) // token success uses res.json without an explicit status; Express defaults to 200 (Nest POST would default to 201).
  token(@Req() req: Request, @Res() res: Response): void {
    if (!this.oauth.mcpEnabled()) { res.status(404).end(); return; }

    const body: Record<string, string> = typeof req.body === 'object' && req.body ? req.body : {};
    if (!this.rl.check('oauth_token', `${req.ip}|${body.client_id ?? ''}`, 30, MIN, Date.now())) {
      res.status(429).json({ error: 'too_many_requests', error_description: 'Too many attempts. Please try again later.' });
      return;
    }

    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');

    const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, refresh_token, resource } = body;
    const ip = getClientIp(req);

    if (!client_id) {
      res.status(401).json({ error: 'invalid_client', error_description: 'client_id is required' });
      return;
    }

    if (grant_type === 'authorization_code') {
      if (!code || !redirect_uri || !code_verifier) {
        res.status(400).json({ error: 'invalid_request', error_description: 'code, redirect_uri, and code_verifier are required' });
        return;
      }
      const pending = this.oauth.consumeAuthCode(code);
      const invalidGrant = (reason: string, userId: number | null) => {
        writeAudit({ userId, action: 'oauth.token.grant_failed', details: { client_id, reason }, ip });
        res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization grant is invalid.' });
      };
      if (!pending) return invalidGrant('code_invalid_or_expired', null);
      if (pending.clientId !== client_id) return invalidGrant('client_id_mismatch', pending.userId);
      if (pending.redirectUri !== redirect_uri) return invalidGrant('redirect_uri_mismatch', pending.userId);
      if (pending.resource && resource && pending.resource !== resource.replace(/\/+$/, '')) return invalidGrant('resource_mismatch', pending.userId);
      if (!this.oauth.authenticateClient(client_id, client_secret)) {
        logWarn(`[OAuth] Invalid client credentials for client_id=${client_id} ip=${ip ?? '-'}`);
        writeAudit({ userId: pending.userId, action: 'oauth.token.client_auth_failed', details: { client_id }, ip });
        res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
        return;
      }
      if (!this.oauth.verifyPKCE(code_verifier, pending.codeChallenge)) return invalidGrant('pkce_failed', pending.userId);
      const tokens = this.oauth.issueTokens(client_id, pending.userId, pending.scopes, null, pending.resource ?? null);
      writeAudit({ userId: pending.userId, action: 'oauth.token.issue', details: { client_id, scopes: pending.scopes, audience: pending.resource ?? null }, ip });
      res.json(tokens);
      return;
    }

    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token is required' });
        return;
      }
      const result = this.oauth.refreshTokens(refresh_token, client_id, client_secret, ip);
      if (result.error) {
        if (result.error === 'invalid_client') logWarn(`[OAuth] Invalid client credentials on refresh for client_id=${client_id} ip=${ip ?? '-'}`);
        res.status(result.status || 400).json({ error: result.error, error_description: result.error === 'invalid_client' ? 'Invalid client credentials' : 'Refresh token is invalid or expired' });
        return;
      }
      res.json(result.tokens);
      return;
    }

    if (grant_type === 'client_credentials') {
      if (!client_secret) {
        res.status(401).json({ error: 'invalid_client', error_description: 'client_secret is required for client_credentials grant' });
        return;
      }
      const client = this.oauth.authenticateClient(client_id, client_secret);
      if (!client) {
        logWarn(`[OAuth] Invalid client credentials for client_id=${client_id} ip=${ip ?? '-'}`);
        writeAudit({ userId: null, action: 'oauth.token.client_auth_failed', details: { client_id }, ip });
        res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
        return;
      }
      if (client.is_public || !client.allows_client_credentials || client.user_id == null) {
        writeAudit({ userId: client.user_id ?? null, action: 'oauth.token.grant_failed', details: { client_id, reason: 'unauthorized_client' }, ip });
        res.status(400).json({ error: 'unauthorized_client', error_description: 'This client is not authorized for the client_credentials grant' });
        return;
      }
      const allowedScopes: string[] = JSON.parse(client.allowed_scopes);
      let grantedScopes: string[];
      if (body.scope) {
        const requested = body.scope.split(' ').filter(Boolean);
        const invalid = requested.filter((s) => !allowedScopes.includes(s));
        if (invalid.length > 0) {
          res.status(400).json({ error: 'invalid_scope', error_description: `Scopes not allowed for this client: ${invalid.join(', ')}` });
          return;
        }
        grantedScopes = requested;
      } else {
        grantedScopes = allowedScopes;
      }
      const audience = resource ? resource.replace(/\/+$/, '') : `${this.oauth.mcpSafeUrl().replace(/\/+$/, '')}/mcp`;
      const tokens = this.oauth.issueClientCredentialsToken(client_id, client.user_id, grantedScopes, audience);
      writeAudit({ userId: client.user_id, action: 'oauth.token.issue', details: { client_id, scopes: grantedScopes, audience, grant: 'client_credentials' }, ip });
      res.json(tokens);
      return;
    }

    res.status(400).json({ error: 'unsupported_grant_type', error_description: `Unsupported grant_type: ${grant_type}` });
  }

  @Get('userinfo')
  userinfo(@Headers('authorization') auth: string | undefined, @Res() res: Response): void {
    if (!this.oauth.mcpEnabled()) { res.status(404).end(); return; }
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      res.set('WWW-Authenticate', 'Bearer realm="TREK MCP"');
      res.status(401).json({ error: 'invalid_token' });
      return;
    }
    const info = this.oauth.getUserByAccessToken(auth.slice(7));
    if (!info) {
      res.set('WWW-Authenticate', 'Bearer realm="TREK MCP", error="invalid_token"');
      res.status(401).json({ error: 'invalid_token' });
      return;
    }
    res.json({ sub: String(info.user.id), email: info.user.email, email_verified: true, preferred_username: info.user.username });
  }

  @Post('revoke')
  revoke(@Req() req: Request, @Res() res: Response): void {
    if (!this.oauth.mcpEnabled()) { res.status(404).end(); return; }
    if (!this.rl.check('oauth_revoke', req.ip || 'unknown', 10, MIN, Date.now())) {
      res.status(429).json({ error: 'too_many_requests', error_description: 'Too many attempts. Please try again later.' });
      return;
    }
    const body: Record<string, string> = typeof req.body === 'object' && req.body ? req.body : {};
    const { token, client_id, client_secret } = body;
    const ip = getClientIp(req);
    if (!token || !client_id) {
      res.status(400).json({ error: 'invalid_request', error_description: 'token and client_id are required' });
      return;
    }
    if (!this.oauth.authenticateClient(client_id, client_secret)) {
      logWarn(`[OAuth] Invalid client credentials on revoke for client_id=${client_id} ip=${ip ?? '-'}`);
      writeAudit({ userId: null, action: 'oauth.token.client_auth_failed', details: { client_id, endpoint: 'revoke' }, ip });
      res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
      return;
    }
    this.oauth.revokeToken(token, client_id, undefined, ip);
    res.status(200).json({});
  }
}
