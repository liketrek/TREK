import { db } from '../../db/database';
import { AddonsService } from '../addons/addons.service';
import { AuditService } from '../audit/audit.service';
import { DatabaseService } from '../database/database.service';
import { OauthService } from './oauth.service';

/**
 * Non-Nest entry point for the OAuth domain — for code running OUTSIDE the
 * Nest container: the MCP transport (src/mcp/index.ts token verification) and
 * the SDK provider adapter (src/mcp/oauthProvider.ts), which
 * platform.routes.ts mounts on the Express app BEFORE app.init(), so
 * `app.get(OauthService)` is not available to it. Exports the legacy
 * services/oauthService names 1:1 so repointing a consumer is an
 * import-path-only diff. Inside the container, inject OauthService instead.
 * Delete this file when the SDK mount moves behind the container.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton. The one piece of shared state — the
 * pending authorization codes — is module-scoped in oauth.pending-codes.ts, so
 * this instance and the container singleton see the same map. That is load-
 * bearing: the consent controller writes the code through the container and
 * the SDK reads it back through here.
 */
const dbs = new DatabaseService(db);
const oauth = new OauthService(dbs, new AddonsService(dbs), new AuditService(dbs));

export type { OAuthTokenInfo, PendingCode } from './oauth.service';

export function getUserByAccessToken(rawToken: string) {
  return oauth.getUserByAccessToken(rawToken);
}

export function createOAuthClient(...args: Parameters<OauthService['createOAuthClient']>) {
  return oauth.createOAuthClient(...args);
}

export function createAuthCode(params: Parameters<OauthService['createAuthCode']>[0]) {
  return oauth.createAuthCode(params);
}

export function consumeAuthCode(code: string) {
  return oauth.consumeAuthCode(code);
}

export function issueTokens(...args: Parameters<OauthService['issueTokens']>) {
  return oauth.issueTokens(...args);
}

export function refreshTokens(...args: Parameters<OauthService['refreshTokens']>) {
  return oauth.refreshTokens(...args);
}

export function revokeToken(...args: Parameters<OauthService['revokeToken']>) {
  return oauth.revokeToken(...args);
}

export function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
  return oauth.verifyPKCE(codeVerifier, codeChallenge);
}
