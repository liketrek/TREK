import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as oidc from '../../services/oidcService';
import { getAppUrl } from '../../services/notifications';
import { resolveAuthToggles } from '../../services/authService';
import { setAuthCookie } from '../../services/cookie';

/**
 * Thin Nest wrapper around the existing OIDC service. PKCE state, discovery,
 * the strict id_token/JWKS verification, user provisioning and the auth-code
 * hand-off all reuse the legacy code unchanged.
 */
@Injectable()
export class OidcService {
  oidcLoginEnabled(): boolean { return resolveAuthToggles().oidc_login; }
  getOidcConfig() { return oidc.getOidcConfig(); }
  getAppUrl() { return getAppUrl(); }
  discover(issuer: string, discoveryUrl?: string | null) { return oidc.discover(issuer, discoveryUrl); }
  createState(redirectUri: string, inviteToken?: string) { return oidc.createState(redirectUri, inviteToken); }
  consumeState(state: string) { return oidc.consumeState(state); }
  exchangeCodeForToken(...args: Parameters<typeof oidc.exchangeCodeForToken>) { return oidc.exchangeCodeForToken(...args); }
  verifyIdToken(...args: Parameters<typeof oidc.verifyIdToken>) { return oidc.verifyIdToken(...args); }
  getUserInfo(endpoint: string, accessToken: string) { return oidc.getUserInfo(endpoint, accessToken); }
  findOrCreateUser(...args: Parameters<typeof oidc.findOrCreateUser>) { return oidc.findOrCreateUser(...args); }
  touchLastLogin(userId: number) { return oidc.touchLastLogin(userId); }
  generateToken(user: { id: number }) { return oidc.generateToken(user); }
  createAuthCode(token: string) { return oidc.createAuthCode(token); }
  consumeAuthCode(code: string) { return oidc.consumeAuthCode(code); }
  frontendUrl(path: string) { return oidc.frontendUrl(path); }
  setAuthCookie(res: Response, token: string, req: Request) { setAuthCookie(res, token, req); }
}
