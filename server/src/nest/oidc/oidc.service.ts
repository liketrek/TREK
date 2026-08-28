import { Injectable, OnModuleDestroy } from '@nestjs/common';
import crypto from 'crypto';
import type { webcrypto } from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { readEnv, getAppUrl } from '../../app-config';
import { JWT_SECRET, SESSION_DURATION_SECONDS, SESSION_DURATION_REMEMBER_SECONDS } from '../../config';
import { User } from '../../types';
import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { setAuthCookie, RememberOption } from '../common/cookie';
import { AuthService } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { safeFetchAdminConfigured } from '../../utils/ssrfGuard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OidcDiscoveryDoc {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri?: string;
  issuer?: string;
  _issuer?: string;
}

export interface OidcTokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
}

export interface OidcUserInfo {
  sub: string;
  email?: string;
  // Standard OIDC claim. Some IdPs send it as the string "true"/"false".
  email_verified?: boolean | string;
  name?: string;
  preferred_username?: string;
  // Standard OIDC profile claim: URL of the user's profile picture.
  picture?: string;
  groups?: string[];
  roles?: string[];
  [key: string]: unknown;
}

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  displayName: string;
  discoveryUrl: string | null;
}

// ---------------------------------------------------------------------------
// Constants / TTLs
// ---------------------------------------------------------------------------

const AUTH_CODE_TTL = 60000;          // 1 minute
const AUTH_CODE_CLEANUP = 30000;      // 30 seconds
/** 5 minutes — the server-side pending-state TTL AND the controller's state-cookie maxAge. */
export const OIDC_STATE_TTL_MS = 5 * 60 * 1000;
const STATE_TTL = OIDC_STATE_TTL_MS;
const STATE_CLEANUP = 60 * 1000;      // 1 minute
const DISCOVERY_TTL = 60 * 60 * 1000; // 1 hour

const FETCH_TIMEOUT_MS = 10_000;
// Discovery docs, token responses, userinfo payloads and JWKS sets are all a
// few KB; anything near this cap is not the endpoint we think it is.
const MAX_RESPONSE_BYTES = 1024 * 1024;

// 5 minute JWKS cache — short enough to pick up key rotation within a
// reasonable window, long enough that normal login flow doesn't fetch
// JWKS on every callback.
const JWKS_TTL_MS = 5 * 60 * 1000;
type JwksEntry = { keys: Array<Record<string, unknown>>; fetchedAt: number };

// ---------------------------------------------------------------------------
// Module-private pure helpers
// ---------------------------------------------------------------------------

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

function isDiscoveryDoc(v: unknown): v is OidcDiscoveryDoc {
  if (!isRecord(v)) return false;
  if (typeof v.authorization_endpoint !== 'string' || typeof v.token_endpoint !== 'string' || typeof v.userinfo_endpoint !== 'string') return false;
  if (v.issuer !== undefined && typeof v.issuer !== 'string') return false;
  if (v.jwks_uri !== undefined && typeof v.jwks_uri !== 'string') return false;
  return true;
}

// Same content-length pattern as transit.service.ts — structural param (the
// express Response import shadows the fetch Response type here) and the
// optional chain keeps header-less test stubs flowing through.
function assertResponseSize(res: { headers?: { get(name: string): string | null } }): void {
  const length = Number(res.headers?.get('content-length') ?? 0);
  if (length > MAX_RESPONSE_BYTES) throw new Error('OIDC response too large');
}

/** The invite_tokens row shape findOrCreateUser consumes. */
interface InviteTokenRow {
  id: number;
  token: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_by: number | null;
  trip_id: number | null;
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

// Sanitize the OIDC `picture` claim before we store it as the avatar. Only https
// URLs are usable: the app's CSP allows https image sources but not http, and we
// render the value directly. Non-strings, non-https and oversized values (e.g. a
// large data: URI) are ignored so a user payload never carries junk. #1399
function safeOidcPicture(picture: unknown): string | null {
  if (typeof picture !== 'string') return null;
  const url = picture.trim();
  if (!url || url.length > 1024) return null;
  return /^https:\/\//i.test(url) ? url : null;
}

/**
 * DI-native OIDC service — the legacy services/oidcService.ts folded in whole
 * (pure relocation): PKCE state, discovery, the strict id_token/JWKS
 * verification, user provisioning and the auth-code hand-off, all over the
 * injected DatabaseService, with the resolveAuthToggles bridge import replaced
 * by the injected AuthService.
 *
 * The legacy module-level state (pending-state / auth-code maps and their two
 * sweep intervals, the discovery cache, the JWKS cache) lives on the instance:
 * nothing outside the container consumes this domain, so no bridge needs to
 * share it. The sweepers start in the constructor (legacy started them at
 * import) and are cleared in onModuleDestroy.
 *
 * Post-migration fixes on top of the relocated legacy behavior (exchange-rates
 * precedent): every outbound fetch carries an AbortSignal timeout and a
 * content-length cap, responses are boundary-validated instead of `as`-cast
 * (getUserInfo now also refuses non-ok responses), the discovery cache is
 * keyed by URL instead of a single slot, findOrCreateUser guards the email
 * claim and re-selects the inserted user row, and the uuid/bcryptjs lazy
 * requires became top-level imports. Kept on purpose: frontendUrl's
 * case-sensitive nodeEnv compare, consumeAuthCode burning expired codes
 * before the expiry check, and the invite_exhausted reference sentinel.
 */
@Injectable()
export class OidcService implements OnModuleDestroy {
  // -------------------------------------------------------------------------
  // State management – pending OIDC states
  // -------------------------------------------------------------------------

  private readonly pendingStates = new Map<string, { createdAt: number; redirectUri: string; inviteToken?: string; codeVerifier: string; remember?: boolean }>();

  // -------------------------------------------------------------------------
  // Auth code management – short-lived codes exchanged for JWT
  // -------------------------------------------------------------------------

  private readonly authCodes = new Map<string, { token: string; created: number; remember?: boolean }>();

  // Discovery document cache (1 h TTL), keyed by discovery URL so two
  // configured issuers no longer thrash a single slot.
  private readonly discoveryCache = new Map<string, { doc: OidcDiscoveryDoc; fetchedAt: number }>();

  private readonly jwksCache = new Map<string, JwksEntry>();

  private readonly stateSweeper: NodeJS.Timeout;
  private readonly codeSweeper: NodeJS.Timeout;

  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly membership: TripMembershipService,
  ) {
    this.stateSweeper = setInterval(() => {
      const now = Date.now();
      for (const [state, data] of this.pendingStates) {
        if (now - data.createdAt > STATE_TTL) this.pendingStates.delete(state);
      }
    }, STATE_CLEANUP);
    this.codeSweeper = setInterval(() => {
      const now = Date.now();
      for (const [code, entry] of this.authCodes) {
        if (now - entry.created > AUTH_CODE_TTL) this.authCodes.delete(code);
      }
    }, AUTH_CODE_CLEANUP);
  }

  onModuleDestroy(): void {
    clearInterval(this.stateSweeper);
    clearInterval(this.codeSweeper);
  }

  oidcLoginEnabled(): boolean { return this.auth.resolveAuthToggles().oidc_login; }

  getAppUrl() { return getAppUrl(); }

  setAuthCookie(res: Response, token: string, req: Request, remember?: RememberOption) { setAuthCookie(res, token, req, remember); }

  // Creates the login state and a matching PKCE pair. The verifier stays server
  // side (in pendingStates); the S256 challenge goes to the provider so PKCE-
  // required setups (e.g. Pocket ID with PKCE = required) work.
  createState(redirectUri: string, inviteToken?: string, remember?: boolean): { state: string; codeChallenge: string } {
    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = base64url(crypto.randomBytes(32));
    const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
    this.pendingStates.set(state, { createdAt: Date.now(), redirectUri, inviteToken, codeVerifier, remember });
    return { state, codeChallenge };
  }

  consumeState(state: string) {
    const pending = this.pendingStates.get(state);
    if (!pending) return null;
    this.pendingStates.delete(state);
    return pending;
  }

  createAuthCode(token: string, remember?: boolean): string {
    const authCode: string = uuidv4();
    this.authCodes.set(authCode, { token, created: Date.now(), remember });
    return authCode;
  }

  consumeAuthCode(code: string): { token: string; remember?: boolean } | { error: string } {
    const entry = this.authCodes.get(code);
    if (!entry) return { error: 'Invalid or expired code' };
    this.authCodes.delete(code);
    if (Date.now() - entry.created > AUTH_CODE_TTL) return { error: 'Code expired' };
    return { token: entry.token, remember: entry.remember };
  }

  // -------------------------------------------------------------------------
  // OIDC configuration (env + DB)
  // -------------------------------------------------------------------------

  getOidcConfig(): OidcConfig | null {
    const get = (key: string) =>
      (this.db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as { value: string } | undefined)?.value || null;

    const oidcEnv = readEnv().oidc;
    const issuer = oidcEnv.issuer || get('oidc_issuer');
    const clientId = oidcEnv.clientId || get('oidc_client_id');
    const clientSecret = oidcEnv.clientSecret || decrypt_api_key(get('oidc_client_secret'));
    const displayName = oidcEnv.displayName || get('oidc_display_name') || 'SSO';
    const discoveryUrl = oidcEnv.discoveryUrl || get('oidc_discovery_url') || null;

    if (!issuer || !clientId || !clientSecret) return null;
    // The lookbehind pins the trailing-slash strip (here and below) to the start of
    // the run — without it an issuer of nothing but slashes retries from every one.
    return { issuer: issuer.replace(/(?<!\/)\/+$/, ''), clientId, clientSecret, displayName, discoveryUrl };
  }

  // -------------------------------------------------------------------------
  // Discovery document (cached, 1 h TTL)
  // -------------------------------------------------------------------------

  async discover(issuer: string, discoveryUrl?: string | null): Promise<OidcDiscoveryDoc> {
    const url = discoveryUrl || `${issuer}/.well-known/openid-configuration`;
    const cached = this.discoveryCache.get(url);
    if (cached && Date.now() - cached.fetchedAt < DISCOVERY_TTL) {
      return cached.doc;
    }
    const res = await safeFetchAdminConfigured(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error('Failed to fetch OIDC discovery document');
    assertResponseSize(res);
    const parsed: unknown = await res.json();
    if (!isDiscoveryDoc(parsed)) throw new Error('Invalid OIDC discovery document');
    const doc = parsed;
    // Validate that the discovery doc's issuer matches the operator-configured one.
    // When no custom discoveryUrl is set, a mismatch signals a MITM or misconfiguration
    // and we reject. When the operator explicitly overrides the discovery URL (e.g.
    // Authentik realm paths), the discovery doc's issuer is the canonical value —
    // trust it and warn rather than blocking login.
    const docIssuer = doc.issuer?.replace(/(?<!\/)\/+$/, '') ?? '';
    if (docIssuer && docIssuer !== issuer) {
      if (discoveryUrl) {
        console.warn(
          `[OIDC] Discovery doc issuer "${doc.issuer}" differs from configured OIDC_ISSUER "${issuer}". ` +
          `Using discovery doc issuer for id_token verification (custom OIDC_DISCOVERY_URL is set).`,
        );
      } else {
        throw new Error(`OIDC discovery issuer mismatch: expected "${issuer}", got "${doc.issuer}"`);
      }
    }
    doc._issuer = url;
    this.discoveryCache.set(url, { doc, fetchedAt: Date.now() });
    return doc;
  }

  // -------------------------------------------------------------------------
  // Role resolution via OIDC claims
  // -------------------------------------------------------------------------

  resolveOidcRole(userInfo: OidcUserInfo, isFirstUser: boolean): 'admin' | 'user' {
    if (isFirstUser) return 'admin';
    const adminValue = readEnv().oidc.adminValue;
    if (!adminValue) return 'user';
    const claimKey = readEnv().oidc.adminClaim;
    const claimData = userInfo[claimKey];
    if (Array.isArray(claimData)) {
      return claimData.some((v) => String(v) === adminValue) ? 'admin' : 'user';
    }
    if (typeof claimData === 'string') {
      return claimData === adminValue ? 'admin' : 'user';
    }
    return 'user';
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  frontendUrl(path: string): string {
    // Case-sensitive on purpose (legacy parity).
    const base = readEnv().app.nodeEnv === 'production' ? '' : 'http://localhost:5173';
    return base + path;
  }

  generateToken(user: { id: number }, remember?: boolean): string {
    // Embed the current password_version so an OIDC-issued session is invalidated
    // by a password change/reset exactly like a password-login session (the auth
    // middleware compares this `pv` against users.password_version).
    const pv = (this.db.prepare('SELECT password_version FROM users WHERE id = ?').get(user.id) as { password_version?: number } | undefined)?.password_version ?? 0;
    // "Remember me" mirrors the password flow: the JWT lifetime matches the
    // persistent cookie maxAge picked by the cookie service off the same flag,
    // and the claim lets sliding renewal preserve those semantics.
    const expiresIn = remember === true ? SESSION_DURATION_REMEMBER_SECONDS : SESSION_DURATION_SECONDS;
    return jwt.sign(
      { id: user.id, pv, ...(typeof remember === 'boolean' ? { remember } : {}) },
      JWT_SECRET,
      { expiresIn, algorithm: 'HS256' },
    );
  }

  // -------------------------------------------------------------------------
  // Token exchange with OIDC provider
  // -------------------------------------------------------------------------

  async exchangeCodeForToken(
    doc: OidcDiscoveryDoc,
    code: string,
    redirectUri: string,
    clientId: string,
    clientSecret: string,
    codeVerifier?: string,
  ): Promise<OidcTokenResponse & { _ok: boolean; _status: number }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    if (codeVerifier) body.set('code_verifier', codeVerifier);
    // maxRedirects 0: following one would hand client_secret to a second host,
    // and the platform default of 'follow' does exactly that today.
    const tokenRes = await safeFetchAdminConfigured(doc.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    }, 0);
    assertResponseSize(tokenRes);
    // Error responses are still parsed on purpose — callers branch on _ok/_status.
    const parsed: unknown = await tokenRes.json();
    const tokenData: OidcTokenResponse = isRecord(parsed)
      ? { access_token: str(parsed.access_token), id_token: str(parsed.id_token), token_type: str(parsed.token_type) }
      : {};
    return { ...tokenData, _ok: tokenRes.ok, _status: tokenRes.status };
  }

  // -------------------------------------------------------------------------
  // Fetch userinfo from OIDC provider
  // -------------------------------------------------------------------------

  async getUserInfo(userinfoEndpoint: string, accessToken: string): Promise<OidcUserInfo> {
    const res = await safeFetchAdminConfigured(userinfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Userinfo fetch failed: HTTP ${res.status}`);
    assertResponseSize(res);
    const parsed: unknown = await res.json();
    if (!isRecord(parsed) || typeof parsed.sub !== 'string') throw new Error('Invalid userinfo response');
    return parsed as OidcUserInfo;
  }

  // -------------------------------------------------------------------------
  // id_token verification (signature + iss + aud + exp)
  // -------------------------------------------------------------------------

  private async fetchJwks(jwksUri: string): Promise<Array<Record<string, unknown>>> {
    const cached = this.jwksCache.get(jwksUri);
    if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) return cached.keys;
    const res = await safeFetchAdminConfigured(jwksUri, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`JWKS fetch failed: HTTP ${res.status}`);
    assertResponseSize(res);
    const json: unknown = await res.json();
    const keys = isRecord(json) && Array.isArray(json.keys) ? json.keys.filter(isRecord) : [];
    this.jwksCache.set(jwksUri, { keys, fetchedAt: Date.now() });
    return keys;
  }

  /**
   * Verify an OIDC id_token end-to-end: signature against the provider's
   * JWKS, issuer match, audience match, and exp/nbf. Does NOT verify a
   * nonce — the server doesn't currently send one in the auth request;
   * when that's added, pass the expected nonce here and check `claims.nonce`.
   *
   * Returning the claims lets callers cross-check `sub` / `email` against
   * the userinfo response. A mismatch would mean the provider's userinfo
   * endpoint is speaking for a different subject than the id_token — a
   * classic IdP-side compromise signal worth refusing login over.
   */
  async verifyIdToken(
    idToken: string,
    doc: OidcDiscoveryDoc,
    clientId: string,
    expectedIssuer: string,
  ): Promise<{ ok: true; claims: Record<string, unknown> } | { ok: false; error: string }> {
    if (!doc.jwks_uri) return { ok: false, error: 'no_jwks_uri' };
    const parts = idToken.split('.');
    if (parts.length !== 3) return { ok: false, error: 'malformed_token' };

    let header: { kid?: string; alg?: string };
    try { header = JSON.parse(base64UrlDecode(parts[0]!).toString('utf8')); }
    catch { return { ok: false, error: 'bad_header' }; }

    const alg = header.alg;
    if (!alg || !/^(RS256|RS384|RS512|ES256|ES384|ES512|PS256|PS384|PS512)$/.test(alg)) {
      return { ok: false, error: 'unsupported_alg' };
    }

    let keys: Array<Record<string, unknown>>;
    try { keys = await this.fetchJwks(doc.jwks_uri); }
    catch { return { ok: false, error: 'jwks_fetch_failed' }; }

    // When the token carries a `kid`, refuse to fall back to any other
    // key in the JWKS — a mismatch means the token was signed with a key
    // the provider no longer publishes, and we should reject rather than
    // mask the failure by trying another key.
    const jwk = header.kid
      ? keys.find((k) => k['kid'] === header.kid)
      : keys[0];
    if (!jwk) return { ok: false, error: 'no_matching_key' };

    let publicKey;
    try {
      // Node 16+ understands JWK directly; no PEM conversion library needed —
      // JsonWebKey carries an unknown-valued index signature, so the record
      // narrows without an any-cast.
      publicKey = crypto.createPublicKey({ key: jwk as webcrypto.JsonWebKey, format: 'jwk' });
    } catch {
      return { ok: false, error: 'key_import_failed' };
    }

    let claims: Record<string, unknown>;
    try {
      const verified = jwt.verify(idToken, publicKey, {
        algorithms: [alg as jwt.Algorithm],
        audience: clientId,
      });
      claims = typeof verified === 'string' ? {} : (verified as Record<string, unknown>);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'verify_failed';
      return { ok: false, error: `signature_or_claim_mismatch: ${msg}` };
    }

    // Normalize trailing slash before issuer comparison — some IdPs (e.g. Authentik)
    // include a trailing slash in the id_token iss claim.
    const tokenIssuer = typeof claims['iss'] === 'string' ? claims['iss'].replace(/(?<!\/)\/+$/, '') : '';
    if (tokenIssuer !== expectedIssuer) {
      return { ok: false, error: `signature_or_claim_mismatch: jwt issuer invalid. expected: ${expectedIssuer}` };
    }

    return { ok: true, claims };
  }

  // -------------------------------------------------------------------------
  // Find or create user by OIDC sub / email
  // -------------------------------------------------------------------------

  findOrCreateUser(
    userInfo: OidcUserInfo,
    config: OidcConfig,
    inviteToken?: string,
  ): { user: User } | { error: string } {
    // Defense-in-depth for direct callers — the controller redirects on a
    // missing email before it ever calls this; the same code flows through its
    // `oidc_error=' + result.error` pass-through if reached here.
    if (!userInfo.email) return { error: 'no_email' };
    const email = userInfo.email.trim().toLowerCase();
    const name = userInfo.name || userInfo.preferred_username || email.split('@')[0];
    const sub = userInfo.sub;
    const picture = safeOidcPicture(userInfo.picture);

    // Try to find existing user by sub, then by email
    let user = this.db.prepare('SELECT * FROM users WHERE oidc_sub = ? AND oidc_issuer = ?').get(sub, config.issuer) as User | undefined;
    if (!user) {
      // Never link/log-in to a guest (#1362) via its synthetic email.
      user = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = ? AND COALESCE(is_guest, 0) = 0').get(email) as User | undefined;
    }

    if (user) {
      // Reaching here without an oidc_sub means we matched an existing local
      // account by email. Only auto-link the OIDC identity when the IdP asserts
      // the email is verified; an unverified email must not auto-link.
      if (!user.oidc_sub) {
        const emailVerified = userInfo.email_verified === true || userInfo.email_verified === 'true';
        if (!emailVerified) {
          return { error: 'email_not_verified' };
        }
        this.db.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?').run(sub, config.issuer, user.id);
        user = { ...user, oidc_sub: sub, oidc_issuer: config.issuer } as User;
      } else if (user.oidc_issuer !== config.issuer || user.oidc_sub !== sub) {
        // The admin pointed the instance at a different IdP. We got here through the
        // verified-email lookup, so this is the same person arriving from the new
        // provider; leaving the old sub and issuer on the row would keep the account
        // pinned to a provider that no longer exists (#2110).
        this.db.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?').run(sub, config.issuer, user.id);
        user = { ...user, oidc_sub: sub, oidc_issuer: config.issuer } as User;
      }
      // Update role based on OIDC claims on every login (if claim mapping is configured)
      if (readEnv().oidc.adminValue) {
        const newRole = this.resolveOidcRole(userInfo, false);
        if (user.role !== newRole) {
          // Never let the claim-based downgrade strip the last admin. The bootstrap
          // admin (first SSO user) usually doesn't carry the admin claim, so a forced
          // re-login — e.g. after a JWT-secret rotation — would otherwise demote it and
          // lock an OIDC-only instance out for good. #1274
          const demotingLastAdmin =
            user.role === 'admin' &&
            newRole !== 'admin' &&
            (this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as { count: number }).count <= 1;
          if (demotingLastAdmin) {
            console.warn(`[OIDC] Kept admin role for user ${user.id}: their OIDC claims map to '${newRole}', but they are the only admin — demoting would lock the instance out.`);
          } else {
            this.db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, user.id);
            user = { ...user, role: newRole } as User;
          }
        }
      }
      // Keep the avatar in sync with the OIDC picture, but never clobber a custom
      // upload: only touch it when empty or when the current value is itself an OIDC
      // picture URL, so the picture refreshes on each login without overriding an
      // uploaded one. #1399
      //
      // "In sync" includes the provider having no picture for this user any more. That
      // is what a provider switch looks like from here, and the old value points at a
      // host this instance no longer talks to, so it renders as a broken image forever
      // (#2110). An uploaded avatar is a bare filename and stays untouched either way.
      const avatarIsOidc = !!user.avatar && /^https:\/\//i.test(user.avatar);
      if (picture ? picture !== user.avatar && (!user.avatar || avatarIsOidc) : avatarIsOidc) {
        this.db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(picture, user.id);
        user = { ...user, avatar: picture } as User;
      }
      return { user };
    }

    // --- New user registration ---
    const userCount = (this.db.prepare('SELECT COUNT(*) as count FROM users WHERE COALESCE(is_guest, 0) = 0').get() as { count: number }).count;
    const isFirstUser = userCount === 0;

    let validInvite: InviteTokenRow | null = null;
    if (inviteToken) {
      validInvite = (this.db.prepare('SELECT * FROM invite_tokens WHERE token = ?').get(inviteToken) as InviteTokenRow | undefined) ?? null;
      if (validInvite) {
        if (validInvite.max_uses > 0 && validInvite.used_count >= validInvite.max_uses) validInvite = null;
        if (validInvite?.expires_at && new Date(validInvite.expires_at) < new Date()) validInvite = null;
      }
    }

    if (!isFirstUser && !validInvite) {
      const { oidc_registration } = this.auth.resolveAuthToggles();
      if (!oidc_registration) {
        return { error: 'registration_disabled' };
      }
    }

    const role = this.resolveOidcRole(userInfo, isFirstUser);
    const randomPass = crypto.randomBytes(32).toString('hex');
    const hash = bcrypt.hashSync(randomPass, 10);

    // Username: sanitize and avoid collisions. Keep dots — they are valid in
    // usernames (see the ^[a-zA-Z0-9_.-]+$ validation in authService) and common
    // in OIDC name claims like "first.last".
    let username = name.replace(/[^a-zA-Z0-9_.-]/g, '').substring(0, 30) || 'user';
    const existing = this.db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username);
    if (existing) username = `${username}_${Date.now() % 10000}`;

    // Atomic registration: if an invite was presented, the increment IS
    // the capacity check — UPDATE matches zero rows the moment another
    // concurrent callback wins the last slot, and the transaction aborts
    // the user INSERT. Without this, two parallel OIDC callbacks could
    // both pass the earlier SELECT-based check and each create a user.
    const inviteRaceError = new Error('invite_exhausted');
    try {
      const result = this.db.transaction(() => {
        if (validInvite) {
          const updated = this.db.prepare(
            'UPDATE invite_tokens SET used_count = used_count + 1 WHERE id = ? AND (max_uses = 0 OR used_count < max_uses)',
          ).run(validInvite.id);
          if (updated.changes === 0) throw inviteRaceError;
        }
        const ins = this.db.prepare(
          'INSERT INTO users (username, email, password_hash, role, oidc_sub, oidc_issuer, avatar, first_seen_version, login_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
        ).run(username, email, hash, role, sub, config.issuer, picture, readEnv().app.appVersion || '0.0.0');
        // Trip-bound invite (#1402): auto-add the new SSO user to the trip inside the
        // same atomic step as the invite consume. Idempotent + owner-safe.
        if (validInvite?.trip_id) {
          this.membership.joinTripAsMember(Number(validInvite.trip_id), Number(ins.lastInsertRowid), validInvite.created_by ?? null);
        }
        return ins;
      }) as { lastInsertRowid: number | bigint };
      // Re-select so the returned User carries the real row (password_version,
      // is_guest, created_at, …) instead of a hand-built partial — same shape
      // the existing-user branch returns.
      user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)) as User;
      return { user };
    } catch (err) {
      if (err === inviteRaceError) {
        console.warn(`[OIDC] Invite token ${inviteToken?.slice(0, 8)}... exhausted — concurrent callback won the last slot`);
        return { error: 'registration_disabled' };
      }
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Update last_login timestamp
  // -------------------------------------------------------------------------

  touchLastLogin(userId: number): void {
    this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?').run(userId);
  }

  // ── OIDC settings ──────────────────────────────────────────────────────────
  // Moved here from AdminService, which held the SQL for a domain that already had a
  // module of its own. The lockout guard below is the reason this cannot be a plain
  // settings write: removing the SSO config while password login is off would lock
  // every user out of the instance.

  getOidcSettings() {
    const get = (key: string) =>
      this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key)?.value || '';
    const secret = decrypt_api_key(get('oidc_client_secret'));
    return {
      issuer: get('oidc_issuer'),
      client_id: get('oidc_client_id'),
      client_secret_set: !!secret,
      display_name: get('oidc_display_name'),
      oidc_only: get('oidc_only') === 'true',
      discovery_url: get('oidc_discovery_url'),
    };
  }

  updateOidcSettings(data: {
    issuer?: string;
    client_id?: string;
    client_secret?: string;
    display_name?: string;
    discovery_url?: string;
  }): { error?: string; status?: number; success?: boolean } {
    // Lockout prevention: can't remove OIDC config when password login is disabled
    if ((data.issuer === '' || data.client_id === '') && !this.auth.resolveAuthToggles().password_login) {
      return {
        error: 'Cannot remove SSO configuration while password login is disabled. Enable password login first.',
        status: 400,
      };
    }

    const set = (key: string, val: string) =>
      this.db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', key, val || '');
    // All five writes are one SSO config — a partial apply would leave the
    // instance with an issuer but no client id (or vice versa).
    this.db.transaction(() => {
      set('oidc_issuer', data.issuer ?? '');
      set('oidc_client_id', data.client_id ?? '');
      if (data.client_secret !== undefined) set('oidc_client_secret', maybe_encrypt_api_key(data.client_secret) ?? '');
      set('oidc_display_name', data.display_name ?? '');
      set('oidc_discovery_url', data.discovery_url ?? '');
    });
    return { success: true };
  }
}
