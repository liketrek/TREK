import { runningVersion } from '../../app-config';
import { AiConnections } from '../../db/entities/AiConnections.entity';
import { AI_CONNECTION_ACCOUNT, type AiConnectionAccount } from '../../db/json-columns';
import type { AiConnectionRow, AiConnectionsRepository } from '../../db/repositories/AiConnections.repository';
import { readCappedJson } from '../../utils/cappedFetch';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { safeFetch } from '../../utils/ssrfGuard';
import { OidcService } from '../oidc/oidc.service';
import { AI_AUTH_FLOW_TTL_MS, AiAuthFlowStore } from './ai-auth-flow.store';
import { aiRefusal, providerRefusal } from './ai-connections.constants';
import { AiRefreshLock } from './ai-refresh-lock';
import { openSecrets, sealSecrets, type ChatgptTokens } from './ai-secrets';
import { AiSettingsService } from './ai-settings.service';
import { ModelCatalogService, pickDefaultModel } from './model-catalog.service';
import { AiProviderError, errorCodeOf } from './providers/provider-errors';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { AiAuthStartResponse, AiConnectionScope, AiModelInfo } from '@trek/shared';

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';

// Sign in with ChatGPT (developers.openai.com/siwc): the endpoints, the
// resource the token is for and the scopes a plan's use needs.
const ISSUER = 'https://auth.openai.com';
const AUTHORIZE_URL = `${ISSUER}/api/accounts/authorize`;
const TOKEN_URL = `${ISSUER}/api/accounts/oauth/token`;
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;
const RESOURCE = 'https://api.openai.com/v1';
const SCOPE = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';
/** The scope in the TOKEN answer that lets the account's plan pay; a valid ID token alone does not. */
const PLAN_SCOPE = 'chatgpt.tokens.use.direct';
/**
 * The loopback callback the sign-in ends on. Nothing listens there: the
 * browser shows an error page, and the user pastes its address into TREK.
 * The documentation asks for 127.0.0.1, never `localhost`.
 */
export const CHATGPT_REDIRECT_URI = 'http://127.0.0.1:1455/auth/callback';
/** The client id a first sign-in registers through; the answer names the one issued to this user. */
const DYNAMIC_CLIENT_ID = 'dynamic_agent_client';
const ISSUED_CLIENT_ID = /^oaiapp_[A-Za-z0-9_-]+$/;

const TOKEN_TIMEOUT_MS = 15_000;
const MAX_TOKEN_BYTES = 64 * 1024;
/** A token is refreshed this long before it expires, so a turn never starts on one about to lapse. */
const EXPIRY_MARGIN_MS = 3 * 60_000;
/** Refresh answers after which only a new sign-in helps; anything else is worth trying again later. */
const TERMINAL_REFRESH_ERRORS = new Set([
  'invalid_grant',
  'invalid_refresh_token',
  'token_expired',
  'refresh_token_expired',
  'refresh_token_invalidated',
  'refresh_token_reused',
  'invalid_client',
]);

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  id_token: z.string().min(1).optional(),
  expires_in: z.number().optional(),
  scope: z.string().optional(),
});
type TokenResponse = z.infer<typeof tokenResponseSchema>;

/** The token endpoint said no, with its HTTP status and its error code. */
class TokenEndpointError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
  ) {
    super(`token endpoint ${status}${code ? ` (${code})` : ''}`);
  }
}

function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

/** When to stop using an access token: its lifetime or the JWT's own `exp`, whichever is first, less the margin. */
export function chatgptTokenExpiry(accessToken: string, expiresIn: number | undefined, now = Date.now()): number {
  let exp = Infinity;
  try {
    const payload: unknown = JSON.parse(Buffer.from(accessToken.split('.')[1] ?? '', 'base64url').toString('utf8'));
    if (payload && typeof payload === 'object' && typeof (payload as { exp?: unknown }).exp === 'number') {
      exp = (payload as { exp: number }).exp * 1000;
    }
  } catch {
    // Not a JWT we can read: the lifetime the answer gave decides alone.
  }
  return Math.min(now + (expiresIn ?? 3600) * 1000, exp) - EXPIRY_MARGIN_MS;
}

/** What a pasted callback address carries, once it is the callback at all. */
interface PastedCallback {
  code: string | null;
  state: string | null;
  error: string | null;
  clientIds: string[];
}

function readPastedCallback(pasted: string): PastedCallback {
  let url: URL;
  try {
    url = new URL(pasted.trim());
  } catch {
    throw aiRefusal('wrong_url', 'That is not the address the sign-in ended on');
  }
  if (`${url.origin}${url.pathname}` !== CHATGPT_REDIRECT_URI) {
    throw aiRefusal('wrong_url', 'That is not the address the sign-in ended on');
  }
  const params = url.searchParams;
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    clientIds: params.getAll('client_id'),
  };
}

function chatgptTokensOf(row: AiConnectionRow | null): ChatgptTokens | null {
  const secrets = row?.kind === 'chatgpt' ? openSecrets(row.secrets) : null;
  return secrets && 'accessToken' in secrets ? secrets : null;
}

const needsReauth = () => new AiProviderError('needs_reauth', 401, false);

/**
 * Sign in with ChatGPT: a user's own plan pays for their assistant.
 *
 * The flow is the documented one for open-source and self-hosted apps, with
 * the loopback callback a hosted TREK cannot receive bridged by hand: the
 * user signs in, lands on an error page at 127.0.0.1, and pastes its address
 * here. PKCE, `state` and `nonce` are fresh per attempt and kept server-side
 * for ten minutes, taken once. The first sign-in registers a client for this
 * user (`dynamic_agent_client`), later ones reuse the client id it was issued
 * and must come back as the same account. Tokens are refreshed shortly before
 * they expire, one refresh at a time per connection, and written only if no
 * other process wrote them in between.
 */
@Injectable()
export class ChatgptAuthService {
  constructor(
    @InjectRepository(AiConnections) private readonly connections: AiConnectionsRepository,
    private readonly settings: AiSettingsService,
    private readonly oidc: OidcService,
    private readonly catalog: ModelCatalogService,
    private readonly flows: AiAuthFlowStore,
    private readonly lock: AiRefreshLock,
  ) {}

  /**
   * Starts a sign-in for the user's own connection, or for the instance's:
   * an admin may share their plan with everyone here. Whether that suits
   * their plan and OpenAI's terms is the admin's call; the setting says so.
   */
  async start(userId: number, scope: AiConnectionScope = 'user'): Promise<AiAuthStartResponse> {
    if (scope === 'user') await this.settings.assertCanConnectOwn(userId);
    const existing =
      scope === 'instance' ? await this.connections.findInstance() : await this.connections.findForUser(userId);
    const savedClientId = existing?.kind === 'chatgpt' ? (this.accountOf(existing).clientId ?? null) : null;
    const verifier = randomToken();
    const state = randomToken();
    const nonce = randomToken();
    const params = new URLSearchParams({
      client_id: savedClientId ?? DYNAMIC_CLIENT_ID,
      // The name is a hint for the first registration only.
      ...(savedClientId ? {} : { agent_name_hint: 'TREK' }),
      ext_agent_host_id: await this.settings.siwcHostId(),
      response_type: 'code',
      redirect_uri: CHATGPT_REDIRECT_URI,
      resource: RESOURCE,
      scope: SCOPE,
      state,
      nonce,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
    });
    const flowId = randomUUID();
    const expiresAt = Date.now() + AI_AUTH_FLOW_TTL_MS;
    await this.flows.put(flowId, {
      provider: 'chatgpt',
      userId,
      scope,
      verifier,
      state,
      nonce,
      savedClientId,
      expiresAt,
    });
    return {
      flowId,
      authorizeUrl: `${AUTHORIZE_URL}?${params.toString()}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Finishes a sign-in from the pasted callback address and saves the
   * connection, the user's or (started by an admin) the instance's; answers
   * which. The address is checked before the flow is taken, so a wrong paste
   * can be corrected without starting over.
   */
  async finish(user: { id: number; role: string }, flowId: string, pastedUrl: string): Promise<AiConnectionScope> {
    const callback = readPastedCallback(pastedUrl);
    const flow = await this.flows.take(flowId, user.id, Date.now());
    if (flow?.provider !== 'chatgpt' || callback.state !== flow.state) {
      throw aiRefusal('expired', 'The sign-in took too long; start it again');
    }
    if (flow.scope === 'instance' && user.role !== 'admin') throw aiRefusal('forbidden', 'Admin access required');
    if (flow.scope === 'user') await this.settings.assertCanConnectOwn(user.id);
    if (callback.error) throw aiRefusal('generic', 'ChatGPT did not complete the sign-in');
    // A first sign-in names the client id issued to this user's registration;
    // a later one may leave it out, but must not name another.
    const [issued, ...more] = callback.clientIds;
    const clientId = flow.savedClientId ?? issued;
    const foreignClient = flow.savedClientId
      ? issued !== undefined && issued !== flow.savedClientId
      : !ISSUED_CLIENT_ID.test(clientId ?? '');
    if (!callback.code || !clientId || more.length > 0 || foreignClient) {
      throw aiRefusal('wrong_url', 'That is not the address the sign-in ended on');
    }

    const tokens = await this.exchangeCode(clientId, callback.code, flow.verifier);
    if (!tokens.id_token || !tokens.refresh_token) {
      throw aiRefusal('provider_unavailable', 'ChatGPT sent an incomplete answer');
    }
    const claims = await this.verifiedClaims(tokens.id_token, clientId);
    if (!claims || claims.nonce !== flow.nonce || typeof claims.sub !== 'string' || !claims.sub) {
      throw aiRefusal('generic', 'The sign-in could not be verified');
    }

    const existing =
      flow.scope === 'instance' ? await this.connections.findInstance() : await this.connections.findForUser(user.id);
    const previous: AiConnectionAccount = existing?.kind === 'chatgpt' ? this.accountOf(existing) : {};
    if (previous.sub && previous.sub !== claims.sub) {
      throw aiRefusal('account_mismatch', 'This is another ChatGPT account; remove the connection first');
    }
    const scopes = (tokens.scope ?? '').split(/\s+/).filter(Boolean);
    if (!scopes.includes(PLAN_SCOPE)) {
      throw aiRefusal('not_eligible', 'This ChatGPT account cannot be used here');
    }

    const model = await this.modelFor(existing, tokens.access_token);
    await this.connections.save(flow.scope === 'instance' ? null : user.id, {
      kind: 'chatgpt',
      model,
      baseUrl: null,
      secrets: sealSecrets({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: chatgptTokenExpiry(tokens.access_token, tokens.expires_in),
      }),
      hint: typeof claims.email === 'string' ? claims.email : null,
      account: encodeJson(AI_CONNECTION_ACCOUNT, { clientId, sub: claims.sub, scopes }),
    });
    return flow.scope;
  }

  /**
   * Signs the user out: the tokens go, the registration stays (the client id
   * and the account), so signing in again is the same registration.
   */
  async signOut(userId: number, scope: AiConnectionScope = 'user'): Promise<void> {
    const row =
      scope === 'instance' ? await this.connections.findInstance() : await this.connections.findForUser(userId);
    if (row?.kind !== 'chatgpt') throw aiRefusal('not_found', 'No ChatGPT sign-in to sign out of');
    await this.connections.clearSecrets(row.id, 'signed_out');
  }

  /** A usable access token for the connection, refreshed first when it is about to expire. */
  async accessToken(row: AiConnectionRow): Promise<string> {
    const tokens = chatgptTokensOf(row);
    if (!tokens) throw needsReauth();
    if (tokens.expiresAt > Date.now()) return tokens.accessToken;
    return this.refresh(row.id, tokens.accessToken);
  }

  /**
   * A new access token after the provider refused `rejected`. When another
   * request refreshed in the meantime its token is answered instead, so the
   * rotating refresh token is never spent twice.
   *
   * @txIndependent each path writes one outcome after the token endpoint answered; the version check guards it
   */
  refresh(connectionId: number, rejected: string): Promise<string> {
    return this.lock.run(`chatgpt:${connectionId}`, async () => {
      const row = await this.connections.findById(connectionId);
      const current = chatgptTokensOf(row);
      if (!row || !current) throw needsReauth();
      if (current.accessToken !== rejected && current.expiresAt > Date.now()) return current.accessToken;
      const account = this.accountOf(row);
      if (!account.clientId) throw needsReauth();

      let tokens: TokenResponse;
      try {
        tokens = await this.tokenRequest({
          grant_type: 'refresh_token',
          client_id: account.clientId,
          refresh_token: current.refreshToken,
          resource: RESOURCE,
        });
      } catch (err) {
        if (err instanceof TokenEndpointError && err.code && TERMINAL_REFRESH_ERRORS.has(err.code)) {
          await this.connections.clearSecrets(row.id, 'needs_reauth');
          throw needsReauth();
        }
        throw new AiProviderError('provider_unavailable', err instanceof TokenEndpointError ? err.status : 0, true);
      }
      // A refresh may leave out the ID token; one that comes must still be the same account.
      if (tokens.id_token) {
        const claims = await this.verifiedClaims(tokens.id_token, account.clientId);
        if (!claims || claims.sub !== account.sub) {
          await this.connections.clearSecrets(row.id, 'needs_reauth');
          throw needsReauth();
        }
      }
      const next: ChatgptTokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? current.refreshToken,
        expiresAt: chatgptTokenExpiry(tokens.access_token, tokens.expires_in),
      };
      // A refresh may leave out the scopes too; then the ones granted before still hold.
      const scopes = tokens.scope ? tokens.scope.split(/\s+/).filter(Boolean) : account.scopes;
      const written = await this.connections.replaceSecretsIfUnchanged(
        row.id,
        row.secrets_version,
        sealSecrets(next),
        encodeJson(AI_CONNECTION_ACCOUNT, { ...account, scopes }),
      );
      if (written) return next.accessToken;
      // Another process refreshed first: its token is the one to use.
      const theirs = chatgptTokensOf(await this.connections.findById(row.id));
      if (!theirs) throw needsReauth();
      return theirs.accessToken;
    });
  }

  private async exchangeCode(clientId: string, code: string, verifier: string): Promise<TokenResponse> {
    try {
      return await this.tokenRequest({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        code_verifier: verifier,
        redirect_uri: CHATGPT_REDIRECT_URI,
        resource: RESOURCE,
      });
    } catch (err) {
      // A code that is refused has expired or was used already: the sign-in starts over.
      if (err instanceof TokenEndpointError && err.status === 400) {
        throw aiRefusal('expired', 'The sign-in took too long; start it again');
      }
      throw aiRefusal('provider_unavailable', 'ChatGPT is not responding');
    }
  }

  /** The model a sign-in keeps (the one chosen before, while the plan still offers it) or starts on. */
  private async modelFor(existing: AiConnectionRow | null, accessToken: string): Promise<string> {
    let models: AiModelInfo[];
    try {
      models = await this.catalog.list({ kind: 'chatgpt', baseUrl: null, secret: accessToken });
    } catch (err) {
      if (err instanceof AiProviderError) throw providerRefusal(err);
      throw err;
    }
    if (existing?.kind === 'chatgpt' && models.some((m) => m.id === existing.model)) return existing.model;
    const model = pickDefaultModel('chatgpt', models);
    if (!model) throw aiRefusal('provider_unavailable', 'ChatGPT offers no model to use');
    return model;
  }

  private accountOf(row: AiConnectionRow): AiConnectionAccount {
    return decodeJson(AI_CONNECTION_ACCOUNT, row.account, `ai connection ${row.id}`);
  }

  private async verifiedClaims(idToken: string, clientId: string): Promise<Record<string, unknown> | null> {
    const doc = {
      authorization_endpoint: AUTHORIZE_URL,
      token_endpoint: TOKEN_URL,
      userinfo_endpoint: '',
      jwks_uri: JWKS_URL,
    };
    const verified = await this.oidc.verifyIdToken(idToken, doc, clientId, ISSUER);
    return verified.ok ? verified.claims : null;
  }

  private async tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
    let res: Response;
    try {
      res = await safeFetch(
        TOKEN_URL,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
            'user-agent': `TREK/${runningVersion()}`,
          },
          body: new URLSearchParams(body).toString(),
          signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
        },
        { maxBytes: MAX_TOKEN_BYTES },
      );
    } catch {
      throw new TokenEndpointError(0, undefined);
    }
    const json = await readCappedJson<unknown>(res, MAX_TOKEN_BYTES);
    if (!res.ok) throw new TokenEndpointError(res.status, errorCodeOf(json));
    const parsed = tokenResponseSchema.safeParse(json);
    if (!parsed.success) throw new TokenEndpointError(res.status, 'unreadable_answer');
    return parsed.data;
  }
}
