import { getAppUrl } from '../../../app-config';
import { PluginOauthState } from '../../../db/entities/PluginOauthState.entity';
import { PluginOauthTokens } from '../../../db/entities/PluginOauthTokens.entity';
import { PluginSettingsFields } from '../../../db/entities/PluginSettingsFields.entity';
import { Plugins } from '../../../db/entities/Plugins.entity';
import type { PluginOauthStateRepository } from '../../../db/repositories/PluginOauthState.repository';
import type { PluginOauthTokensRepository } from '../../../db/repositories/PluginOauthTokens.repository';
import type { PluginSettingsFieldsRepository } from '../../../db/repositories/PluginSettingsFields.repository';
import type { PluginsRepository } from '../../../db/repositories/Plugins.repository';
import { safeFetchAdminConfigured } from '../../../utils/ssrfGuard';
import { encrypt_api_key, decrypt_api_key } from '../../common/crypto/apiKeyCrypto';
import { UnitOfWork } from '../../database/unit-of-work';
import { isPrivateIp } from '../install/safe-fetch';
import { applySettingDefaults, settingDefaults } from '../settings-defaults';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import crypto from 'node:crypto';

/**
 * Host-brokered outbound OAuth (#plugins). A plugin becomes an OAuth *client* of a
 * third-party service; the HOST runs the whole flow (authorize -> callback -> token
 * exchange -> refresh) with PKCE + state and HOLDS the tokens. The plugin only ever
 * triggers "connect" and reads a short-lived access token via `ctx.oauth.getAccessToken()`
 * — it never sees the refresh token or the client secret.
 *
 * Provider config (endpoints + client credentials) is the plugin's admin-owned
 * INSTANCE settings — a plugin declares these `scope:'instance'` fields and the admin
 * fills them in:
 *   oauth_authorize_url, oauth_token_url, oauth_scopes (optional), and the two secrets
 *   oauth_client_id, oauth_client_secret.
 * Tokens are per-user + encrypted at rest; the PKCE verifier/state row is short-lived.
 */
export interface OAuthProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string;
  clientId: string;
  clientSecret: string;
}

const STATE_TTL_MS = 10 * 60 * 1000; // an authorize round-trip must finish within 10 min
const REFRESH_SKEW_S = 60; // refresh a token expiring within a minute

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

/** Cheap fast-fail for an obviously-internal token endpoint. This is a pre-check, not the
 * authoritative gate: the real SSRF defence is the DNS-resolving, IP-pinning guard inside
 * the fetch (tokenRequest), which blocks the cloud-metadata range even for a DNS name. This
 * rejects the literal loopback / link-local / metadata hosts (v4 AND v6) plus the internal
 * name suffixes, so a bracketed IPv6 literal or a `.internal` name can't slip past the
 * fast-fail. Private LAN (10./192.168./…) is deliberately left to the fetch policy so a
 * self-hosted internal IdP stays reachable. */
function assertSafeHttps(urlStr: string, what: string): URL {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error(`${what} is not a valid URL`);
  }
  if (u.protocol !== 'https:') throw new Error(`${what} must be https`);
  const host = u.hostname.toLowerCase();
  const ip = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  const loopbackOrMeta =
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('0.') ||
    ip.startsWith('169.254.') ||
    /^fe[89ab][0-9a-f]:/.test(ip) ||
    ip.startsWith('fd00:ec2:');
  if (loopbackOrMeta) throw new Error(`${what} may not point at a loopback or metadata address`);
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error(`${what} may not point at a local address`);
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && isPrivateIp(host))
    throw new Error(`${what} may not point at a private address`);
  return u;
}

@Injectable()
export class PluginOAuthService {
  constructor(
    @InjectRepository(Plugins) private readonly pluginsRepo: PluginsRepository,
    @InjectRepository(PluginOauthTokens) private readonly tokensRepo: PluginOauthTokensRepository,
    @InjectRepository(PluginOauthState) private readonly stateRepo: PluginOauthStateRepository,
    @InjectRepository(PluginSettingsFields) private readonly settingsFieldsRepo: PluginSettingsFieldsRepository,
    private readonly uow: UnitOfWork,
  ) {}

  /** The plugin's decrypted OAuth provider config from its INSTANCE settings, or null
   *  when any required piece is missing/blank. */
  async providerConfig(pluginId: string): Promise<OAuthProviderConfig | null> {
    // PO1 — dup shape of PR18/PS5/PS13, reuses PluginsRepository.findConfig.
    const config = await this.pluginsRepo.findConfig(pluginId);
    if (config === null) return null;
    let cfg: Record<string, unknown>;
    try {
      cfg = JSON.parse(config || '{}');
    } catch {
      return null;
    }
    // A provider plugin ships its endpoints/scopes as manifest defaults; the admin types
    // only the client id/secret (secrets — never defaulted).
    cfg = applySettingDefaults(cfg, await settingDefaults(this.settingsFieldsRepo, pluginId, 'instance'));
    const authorizeUrl = String(cfg.oauth_authorize_url ?? '').trim();
    const tokenUrl = String(cfg.oauth_token_url ?? '').trim();
    const clientId = cfg.oauth_client_id ? String(decrypt_api_key(cfg.oauth_client_id)) : '';
    const clientSecret = cfg.oauth_client_secret ? String(decrypt_api_key(cfg.oauth_client_secret)) : '';
    const scopes = String(cfg.oauth_scopes ?? '').trim();
    if (!authorizeUrl || !tokenUrl || !clientId || !clientSecret) return null;
    return { authorizeUrl, tokenUrl, scopes, clientId, clientSecret };
  }

  private redirectUri(pluginId: string): string {
    return `${getAppUrl()}/api/plugin-oauth/${pluginId}/callback`;
  }

  /** Whether the acting user has a stored token for this plugin. */
  async status(pluginId: string, userId: number): Promise<{ configured: boolean; connected: boolean }> {
    const configured = (await this.providerConfig(pluginId)) !== null;
    const connected = await this.tokensRepo.hasAccessToken(pluginId, userId); // PO2
    return { configured, connected };
  }

  /** Begin the authorize flow: mint PKCE + state, persist them, return the provider URL. */
  async startConnect(pluginId: string, userId: number, nowMs: number): Promise<string> {
    const cfg = await this.providerConfig(pluginId);
    if (!cfg) throw new Error('OAuth is not configured for this plugin');
    const authorize = assertSafeHttps(cfg.authorizeUrl, 'authorize_url');
    assertSafeHttps(cfg.tokenUrl, 'token_url'); // fail fast if the token endpoint is unsafe too

    const verifier = b64url(crypto.randomBytes(32));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = b64url(crypto.randomBytes(24));

    // Drop this user's stale states for the plugin and store the fresh one, together.
    await this.uow.transactional(async () => {
      await this.stateRepo.deleteForUser(pluginId, userId); // PO3
      await this.stateRepo.insertState(state, pluginId, userId, verifier, nowMs); // PO4
    });

    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('client_id', cfg.clientId);
    authorize.searchParams.set('redirect_uri', this.redirectUri(pluginId));
    if (cfg.scopes) authorize.searchParams.set('scope', cfg.scopes);
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 'S256');
    return authorize.toString();
  }

  /**
   * Complete the callback: verify state, exchange the code, store the tokens.
   * @txIndependent the state is consumed before the token exchange (network I/O),
   * and the tokens are stored after it.
   */
  async completeCallback(pluginId: string, userId: number, code: string, state: string, nowMs: number): Promise<void> {
    // PO5+PO6+PO7, atomically — the state is consumed (deleted) by this ONE call
    // regardless of outcome, same as the legacy SELECT-then-unconditional-DELETE
    // sequence, but without the SELECT→await→DELETE race the split conversion
    // would have reopened (see PluginOauthStateRepository.consumeByState's own
    // docstring). Single-use is therefore enforced HERE, before the checks below,
    // not on a later path-specific call.
    const row = await this.stateRepo.consumeByState(state);
    // State must exist, belong to THIS plugin + user, and be fresh — this binds the
    // callback to the connect request and blocks CSRF / a replayed/foreign state.
    if (!row || row.plugin_id !== pluginId || row.user_id !== userId || nowMs - row.created_at > STATE_TTL_MS) {
      throw new Error('invalid or expired OAuth state');
    }

    const cfg = await this.providerConfig(pluginId);
    if (!cfg) throw new Error('OAuth is not configured for this plugin');

    const token = await this.tokenRequest(cfg, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri(pluginId),
      code_verifier: row.verifier,
    });
    await this.storeToken(pluginId, userId, token, nowMs);
  }

  /** A valid access token for the acting user, refreshing it if it is expiring. Null when
   *  the user hasn't connected. The plugin never receives the refresh token. */
  async getAccessToken(pluginId: string, userId: number, nowMs: number): Promise<string | null> {
    const row = await this.tokensRepo.findTokenRow(pluginId, userId); // PO8
    if (!row || !row.access_token) return null;

    const notExpiring = row.expires_at == null || row.expires_at - REFRESH_SKEW_S * 1000 > nowMs;
    if (notExpiring) return decrypt_api_key(row.access_token) as string;

    if (!row.refresh_token) return decrypt_api_key(row.access_token) as string; // no refresh token — hand back what we have
    const cfg = await this.providerConfig(pluginId);
    if (!cfg) return null;
    const token = await this.tokenRequest(cfg, {
      grant_type: 'refresh_token',
      refresh_token: decrypt_api_key(row.refresh_token) as string,
    });
    // Some providers omit a new refresh_token on refresh — keep the existing one.
    if (!token.refresh_token) token.refresh_token = decrypt_api_key(row.refresh_token) as string;
    await this.storeToken(pluginId, userId, token, nowMs);
    return token.access_token ?? null;
  }

  async disconnect(pluginId: string, userId: number): Promise<void> {
    await this.uow.transactional(async () => {
      await this.tokensRepo.deleteForUser(pluginId, userId); // PO9
      await this.stateRepo.deleteForUser(pluginId, userId); // PO10
    });
  }

  // --- internals ---

  private async tokenRequest(
    cfg: OAuthProviderConfig,
    params: Record<string, string>,
  ): Promise<{ access_token?: string; refresh_token?: string; expires_in?: number; scope?: string }> {
    assertSafeHttps(cfg.tokenUrl, 'token_url');
    const body = new URLSearchParams({ ...params, client_id: cfg.clientId, client_secret: cfg.clientSecret });
    // Route the server-side token POST through the SSRF guard: it resolves the host
    // and refuses the link-local / cloud-metadata range (169.254/fe80/IMDSv6) while
    // pinning the connection to the resolved IP, so a token_url that is a DNS name
    // (or IPv6 literal) pointing at metadata can't reach it and can't DNS-rebind.
    // Loopback/LAN stay reachable so a self-hosted internal IdP keeps working.
    // maxRedirects 0, same as the OIDC twin: following one would hand
    // client_secret to a second host, and a token endpoint has no legitimate
    // reason to redirect. The timeout is not optional either — without it a
    // hanging provider pins the request handler open indefinitely.
    const resp = await safeFetchAdminConfigured(
      cfg.tokenUrl,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
      },
      0,
    );
    if (!resp.ok) throw new Error(`token endpoint returned ${resp.status}`);
    const json = (await resp.json()) as Record<string, unknown>;
    return {
      access_token: typeof json.access_token === 'string' ? json.access_token : undefined,
      refresh_token: typeof json.refresh_token === 'string' ? json.refresh_token : undefined,
      expires_in: typeof json.expires_in === 'number' ? json.expires_in : undefined,
      scope: typeof json.scope === 'string' ? json.scope : undefined,
    };
  }

  private async storeToken(
    pluginId: string,
    userId: number,
    token: { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string },
    nowMs: number,
  ): Promise<void> {
    if (!token.access_token) throw new Error('token endpoint returned no access_token');
    const expiresAt = token.expires_in ? nowMs + token.expires_in * 1000 : null;
    // PO11 (R-oauth-upsert) — encryption happens HERE, in the service, before the
    // repository call; the repository's `storeToken` passes ciphertext through
    // untouched and never calls encrypt_api_key/decrypt_api_key (3e's R6 boundary).
    await this.tokensRepo.storeToken({
      plugin_id: pluginId,
      user_id: userId,
      access_token: encrypt_api_key(token.access_token),
      refresh_token: token.refresh_token ? encrypt_api_key(token.refresh_token) : null,
      expires_at: expiresAt,
      scope: token.scope ?? null,
    });
  }
}
