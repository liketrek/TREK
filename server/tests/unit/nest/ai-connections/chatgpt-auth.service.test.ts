/**
 * Sign in with ChatGPT (ChatgptAuthService) over the real repository on a
 * migrated test db: the authorize URL, the pasted-callback checks (state,
 * client id, nonce, account, plan scope), the token exchange, and the refresh
 * that runs once per connection and writes only over the version it read.
 *
 * Replaced: the token endpoint (safeFetch answers from each case), the ID
 * token verification (OidcService), the model list and the demo check.
 */
import { AiConnections } from '../../../../src/db/entities/AiConnections.entity';
import { AiConnectionsModule } from '../../../../src/nest/ai-connections/ai-connections.module';
import { openSecrets, sealSecrets } from '../../../../src/nest/ai-connections/ai-secrets';
import {
  CHATGPT_REDIRECT_URI,
  ChatgptAuthService,
  chatgptTokenExpiry,
} from '../../../../src/nest/ai-connections/chatgpt-auth.service';
import { ModelCatalogService } from '../../../../src/nest/ai-connections/model-catalog.service';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DemoModule } from '../../../../src/nest/common/demo.module';
import { DemoService } from '../../../../src/nest/common/demo.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { OidcService } from '../../../../src/nest/oidc/oidc.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { findRow } from '../../../helpers/factories/rows';
import { readAppSetting } from '../../../helpers/factories/settings';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/ssrfGuard')>()),
  safeFetch,
}));

const db = createSnapshotTestDb();
let t: TestModule;

const verifyIdToken = vi.fn();
const catalog = { list: vi.fn(async () => [{ id: 'gpt-6.1-sol', label: 'GPT 6.1', supportsTools: true }]) };
const demo = { isDemoUserId: vi.fn(async () => false) };

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [AppConfigModule, DemoModule, AiConnectionsModule],
    overrides: [
      { provide: OidcService, useValue: { verifyIdToken } },
      { provide: ModelCatalogService, useValue: catalog },
      { provide: DemoService, useValue: demo },
    ],
  });
});

afterAll(async () => {
  await t.close();
  db.close();
});

beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
  demo.isDemoUserId.mockResolvedValue(false);
});

const service = () => t.get(ChatgptAuthService);
const orm = () => t.get(MikroORM);
const PLAN_SCOPES = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';

function tokenAnswer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** A JWT-shaped access token whose payload carries `exp`. */
function accessToken(expSeconds: number, tag = 'a'): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'none' })}.${part({ exp: expSeconds, tag })}.sig`;
}

function claims(over: Record<string, unknown> = {}) {
  return { ok: true, claims: { sub: 'user-sub-1', email: 'traveler@example.com', ...over } };
}

/** The callback address the browser lands on, as the user pastes it. */
function callbackUrl(params: Record<string, string>, extra = ''): string {
  return `${CHATGPT_REDIRECT_URI}?${new URLSearchParams(params).toString()}${extra}`;
}

async function refusal(promise: Promise<unknown>) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

/** A stored user as the service takes the caller of a finished sign-in: the id and the role. */
async function caller(role: 'user' | 'admin' = 'user'): Promise<{ id: number; role: string }> {
  const { user } = await makeUser(orm(), { role });
  return { id: user.id, role };
}

/** Starts a sign-in and answers its flow id with the state and nonce the authorize URL carried. */
async function started(userId: number, scope: 'user' | 'instance' = 'user') {
  const start = await service().start(userId, scope);
  const query = new URL(start.authorizeUrl).searchParams;
  return { flowId: start.flowId, state: query.get('state') ?? '', nonce: query.get('nonce') ?? '', query };
}

async function seedChatgpt(userId: number, tokens: { accessToken: string; refreshToken: string; expiresAt: number }) {
  await orm()
    .em.fork()
    .insert(AiConnections, {
      scope: 'user',
      user: userId,
      kind: 'chatgpt',
      model: 'gpt-6.1-sol',
      secrets: sealSecrets(tokens),
      hint: 'traveler@example.com',
      account: JSON.stringify({ clientId: 'oaiapp_saved', sub: 'user-sub-1', scopes: PLAN_SCOPES.split(' ') }),
    });
  const row = await findRow(orm(), AiConnections, { user: userId });
  if (!row) throw new Error('seed failed');
  return row;
}

describe('starting a sign-in', () => {
  it('CGPT-001: a first sign-in registers dynamically, with PKCE, state, nonce and this host id', async () => {
    const { user } = await makeUser(orm());
    const { query } = await started(user.id);
    expect(Object.fromEntries(query)).toMatchObject({
      client_id: 'dynamic_agent_client',
      agent_name_hint: 'TREK',
      response_type: 'code',
      redirect_uri: 'http://127.0.0.1:1455/auth/callback',
      resource: 'https://api.openai.com/v1',
      scope: PLAN_SCOPES,
      code_challenge_method: 'S256',
    });
    expect(query.get('code_challenge')).toMatch(/^[\w-]{43}$/);
    const hostId = query.get('ext_agent_host_id');
    expect(hostId).toMatch(/^urn:uuid:[0-9a-f-]{36}$/);
    expect(await readAppSetting(orm(), 'ai_siwc_host_id')).toBe(hostId);
    // The host id is created once and kept.
    expect((await started(user.id)).query.get('ext_agent_host_id')).toBe(hostId);
  });

  it('CGPT-002: a later sign-in reuses the issued client id and sends no name hint', async () => {
    const { user } = await makeUser(orm());
    await seedChatgpt(user.id, { accessToken: 'a', refreshToken: 'r', expiresAt: 0 });
    const { query } = await started(user.id);
    expect(query.get('client_id')).toBe('oaiapp_saved');
    expect(query.has('agent_name_hint')).toBe(false);
  });

  it('CGPT-003: the demo account cannot start one', async () => {
    const { user } = await makeUser(orm());
    demo.isDemoUserId.mockResolvedValue(true);
    expect((await refusal(service().start(user.id))).status).toBe(403);
  });
});

describe('finishing a sign-in', () => {
  it('CGPT-010: exchanges the code, checks the ID token and saves the connection', async () => {
    const user = await caller();
    const flow = await started(user.id);
    const access = accessToken(Math.floor(Date.now() / 1000) + 3600);
    safeFetch.mockResolvedValueOnce(
      tokenAnswer(200, {
        access_token: access,
        refresh_token: 'refresh-1',
        id_token: 'id.token.x',
        expires_in: 3600,
        scope: PLAN_SCOPES,
      }),
    );
    verifyIdToken.mockResolvedValueOnce(claims({ nonce: flow.nonce }));

    await service().finish(
      user,
      flow.flowId,
      callbackUrl({ code: 'code-1', state: flow.state, client_id: 'oaiapp_new_1' }),
    );

    const [url, init] = safeFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://auth.openai.com/api/accounts/oauth/token');
    expect(Object.fromEntries(new URLSearchParams(String(init.body)))).toMatchObject({
      grant_type: 'authorization_code',
      client_id: 'oaiapp_new_1',
      code: 'code-1',
      redirect_uri: CHATGPT_REDIRECT_URI,
      resource: 'https://api.openai.com/v1',
    });
    expect(verifyIdToken).toHaveBeenCalledWith(
      'id.token.x',
      expect.objectContaining({ jwks_uri: 'https://auth.openai.com/.well-known/jwks.json' }),
      'oaiapp_new_1',
      'https://auth.openai.com',
    );
    const row = await findRow(orm(), AiConnections, { user: user.id });
    expect(row).toMatchObject({ kind: 'chatgpt', model: 'gpt-6.1-sol', hint: 'traveler@example.com', status: 'ok' });
    expect(JSON.parse(String(row?.account))).toEqual({
      clientId: 'oaiapp_new_1',
      sub: 'user-sub-1',
      scopes: PLAN_SCOPES.split(' '),
    });
    expect(openSecrets(row?.secrets)).toMatchObject({ accessToken: access, refreshToken: 'refresh-1' });
  });

  it('CGPT-030: an admin shares their plan with everyone; only an admin finishes that sign-in', async () => {
    const admin = await caller('admin');
    const member = await caller();
    const shared = await started(admin.id, 'instance');
    const url = callbackUrl({ code: 'c', state: shared.state, client_id: 'oaiapp_shared' });
    // A flow belongs to whoever started it, so a member cannot even take it.
    expect((await refusal(service().finish(member, shared.flowId, url))).body.code).toBe('expired');

    safeFetch.mockResolvedValueOnce(
      tokenAnswer(200, { access_token: 'at', refresh_token: 'rt', id_token: 'id', scope: PLAN_SCOPES }),
    );
    verifyIdToken.mockResolvedValueOnce(claims({ nonce: shared.nonce }));
    expect(await service().finish(admin, shared.flowId, url)).toBe('instance');
    expect(await findRow(orm(), AiConnections, { scope: 'instance' })).toMatchObject({
      kind: 'chatgpt',
      user_id: null,
    });
    expect(await findRow(orm(), AiConnections, { user: admin.id })).toBeNull();

    // An admin who is no longer one cannot finish a sign-in for everyone they started before.
    const later = await started(admin.id, 'instance');
    const demoted = { ...admin, role: 'user' };
    const again = callbackUrl({ code: 'c', state: later.state, client_id: 'oaiapp_shared' });
    expect((await refusal(service().finish(demoted, later.flowId, again))).body.code).toBe('forbidden');
  });

  it('CGPT-011: a wrong address is refused before the flow is used, so the right one still works', async () => {
    const user = await caller();
    const flow = await started(user.id);
    const wrong = await Promise.all(
      ['not a url', 'http://localhost:1455/auth/callback?code=x', 'https://chatgpt.com/'].map((pasted) =>
        refusal(service().finish(user, flow.flowId, pasted)),
      ),
    );
    expect(wrong.map((r) => [r.status, r.body.code])).toEqual([
      [422, 'wrong_url'],
      [422, 'wrong_url'],
      [422, 'wrong_url'],
    ]);
    safeFetch.mockResolvedValueOnce(
      tokenAnswer(200, { access_token: 'at', refresh_token: 'rt', id_token: 'id', scope: PLAN_SCOPES }),
    );
    verifyIdToken.mockResolvedValueOnce(claims({ nonce: flow.nonce }));
    await service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: flow.state, client_id: 'oaiapp_x' }));
    expect(await findRow(orm(), AiConnections, { user: user.id })).not.toBeNull();
  });

  it('CGPT-012: another state, an unknown or foreign flow, and a used one read as expired', async () => {
    const user = await caller();
    const other = await caller();
    const flow = await started(user.id);
    const url = callbackUrl({ code: 'c', state: flow.state, client_id: 'oaiapp_x' });
    expect((await refusal(service().finish(other, flow.flowId, url))).status).toBe(410);
    expect((await refusal(service().finish(user, crypto.randomUUID(), url))).status).toBe(410);
    expect(
      (
        await refusal(
          service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: 'other', client_id: 'oaiapp_x' })),
        )
      ).body,
    ).toMatchObject({ code: 'expired' });
    // The mismatch used the flow up.
    expect((await refusal(service().finish(user, flow.flowId, url))).status).toBe(410);
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('CGPT-013: a client id that is not an issued one, named twice, or another than the saved one is refused', async () => {
    const user = await caller();
    const refused = await Promise.all(
      ['&client_id=evil', '&client_id=oaiapp_a&client_id=oaiapp_b'].map(async (extra) => {
        const flow = await started(user.id);
        return refusal(
          service().finish(user, flow.flowId, `${CHATGPT_REDIRECT_URI}?code=c&state=${flow.state}${extra}`),
        );
      }),
    );
    expect(refused.map((r) => r.body.code)).toEqual(['wrong_url', 'wrong_url']);
    await seedChatgpt(user.id, { accessToken: 'a', refreshToken: 'r', expiresAt: 0 });
    const flow = await started(user.id);
    expect(
      (
        await refusal(
          service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: flow.state, client_id: 'oaiapp_other' })),
        )
      ).body,
    ).toMatchObject({ code: 'wrong_url' });
  });

  it('CGPT-014: a nonce that does not match, another account and a plan without the scope are refused', async () => {
    const user = await caller();
    const answer = () =>
      tokenAnswer(200, { access_token: 'at', refresh_token: 'rt', id_token: 'id', scope: PLAN_SCOPES });

    let flow = await started(user.id);
    safeFetch.mockResolvedValueOnce(answer());
    verifyIdToken.mockResolvedValueOnce(claims({ nonce: 'stale' }));
    expect(
      (
        await refusal(
          service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: flow.state, client_id: 'oaiapp_x' })),
        )
      ).status,
    ).toBe(400);

    await seedChatgpt(user.id, { accessToken: 'a', refreshToken: 'r', expiresAt: 0 });
    flow = await started(user.id);
    safeFetch.mockResolvedValueOnce(answer());
    verifyIdToken.mockResolvedValueOnce(claims({ nonce: flow.nonce, sub: 'someone-else' }));
    expect(
      (await refusal(service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: flow.state })))).body,
    ).toMatchObject({ code: 'account_mismatch' });

    flow = await started(user.id);
    safeFetch.mockResolvedValueOnce(
      tokenAnswer(200, { access_token: 'at', refresh_token: 'rt', id_token: 'id', scope: 'openid profile email' }),
    );
    verifyIdToken.mockResolvedValueOnce(claims({ nonce: flow.nonce }));
    expect(
      await refusal(service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: flow.state }))),
    ).toMatchObject({ status: 403, body: { code: 'not_eligible' } });
    // The stored registration is untouched by any of them.
    expect(openSecrets((await findRow(orm(), AiConnections, { user: user.id }))?.secrets)).toMatchObject({
      accessToken: 'a',
    });
  });

  it('CGPT-015: a refused code reads as expired, a token endpoint that is down as provider_unavailable', async () => {
    const user = await caller();
    let flow = await started(user.id);
    safeFetch.mockResolvedValueOnce(tokenAnswer(400, { error: 'invalid_grant' }));
    expect(
      (
        await refusal(
          service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: flow.state, client_id: 'oaiapp_x' })),
        )
      ).status,
    ).toBe(410);
    flow = await started(user.id);
    safeFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect(
      (
        await refusal(
          service().finish(user, flow.flowId, callbackUrl({ code: 'c', state: flow.state, client_id: 'oaiapp_x' })),
        )
      ).status,
    ).toBe(502);
  });
});

describe('tokens', () => {
  it('CGPT-020: a token that is still good is used as it is', async () => {
    const { user } = await makeUser(orm());
    const row = await seedChatgpt(user.id, { accessToken: 'good', refreshToken: 'r', expiresAt: Date.now() + 60_000 });
    expect(await service().accessToken(row as never)).toBe('good');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('CGPT-021: an expiring token is refreshed once, even when two requests ask at the same time', async () => {
    const { user } = await makeUser(orm());
    const row = await seedChatgpt(user.id, {
      accessToken: 'old',
      refreshToken: 'refresh-old',
      expiresAt: Date.now() - 1,
    });
    const fresh = accessToken(Math.floor(Date.now() / 1000) + 3600, 'fresh');
    safeFetch.mockResolvedValueOnce(
      tokenAnswer(200, { access_token: fresh, refresh_token: 'refresh-new', expires_in: 3600 }),
    );

    const [a, b] = await Promise.all([service().accessToken(row as never), service().accessToken(row as never)]);
    expect([a, b]).toEqual([fresh, fresh]);
    expect(safeFetch).toHaveBeenCalledOnce();
    const body = Object.fromEntries(
      new URLSearchParams(String((safeFetch.mock.calls[0] as [string, RequestInit])[1].body)),
    );
    expect(body).toMatchObject({
      grant_type: 'refresh_token',
      client_id: 'oaiapp_saved',
      refresh_token: 'refresh-old',
    });
    const stored = await findRow(orm(), AiConnections, { user: user.id });
    expect(openSecrets(stored?.secrets)).toMatchObject({ accessToken: fresh, refreshToken: 'refresh-new' });
    // A refresh that leaves the scopes out keeps the ones granted before.
    expect(JSON.parse(String(stored?.account)).scopes).toContain('chatgpt.tokens.use.direct');
    expect(stored?.secrets_version).toBe(row.secrets_version + 1);
  });

  it('CGPT-022: a terminal refresh error drops the tokens and asks for a new sign-in', async () => {
    const { user } = await makeUser(orm());
    const row = await seedChatgpt(user.id, { accessToken: 'old', refreshToken: 'r', expiresAt: 0 });
    safeFetch.mockResolvedValueOnce(tokenAnswer(400, { error: { code: 'refresh_token_reused' } }));
    await expect(service().accessToken(row as never)).rejects.toMatchObject({ code: 'needs_reauth' });
    expect(await findRow(orm(), AiConnections, { user: user.id })).toMatchObject({
      status: 'needs_reauth',
      secrets: null,
    });
  });

  it('CGPT-023: a refresh endpoint that is down leaves the tokens for a later try', async () => {
    const { user } = await makeUser(orm());
    const row = await seedChatgpt(user.id, { accessToken: 'old', refreshToken: 'r', expiresAt: 0 });
    safeFetch.mockResolvedValueOnce(tokenAnswer(503, {}));
    await expect(service().accessToken(row as never)).rejects.toMatchObject({
      code: 'provider_unavailable',
      retryable: true,
    });
    expect((await findRow(orm(), AiConnections, { user: user.id }))?.status).toBe('ok');
  });

  it('CGPT-024: a refreshed ID token of another account is refused', async () => {
    const { user } = await makeUser(orm());
    const row = await seedChatgpt(user.id, { accessToken: 'old', refreshToken: 'r', expiresAt: 0 });
    safeFetch.mockResolvedValueOnce(tokenAnswer(200, { access_token: 'new', id_token: 'id' }));
    verifyIdToken.mockResolvedValueOnce(claims({ sub: 'someone-else' }));
    await expect(service().accessToken(row as never)).rejects.toMatchObject({ code: 'needs_reauth' });
  });

  it('CGPT-025: when another process wrote first, its token is the one answered', async () => {
    const { user } = await makeUser(orm());
    const row = await seedChatgpt(user.id, { accessToken: 'old', refreshToken: 'r', expiresAt: 0 });
    safeFetch.mockImplementationOnce(async () => {
      await orm()
        .em.fork()
        .nativeUpdate(
          AiConnections,
          { user: user.id },
          {
            secrets: sealSecrets({ accessToken: 'theirs', refreshToken: 'r2', expiresAt: Date.now() + 60_000 }),
            secrets_version: 9,
          },
        );
      return tokenAnswer(200, { access_token: 'mine', refresh_token: 'r3' });
    });
    expect(await service().refresh(row.id, 'old')).toBe('theirs');
  });

  it('CGPT-026: the expiry is the earlier of the lifetime and the JWT exp, less three minutes', () => {
    const now = 1_000_000_000_000;
    expect(chatgptTokenExpiry(accessToken(now / 1000 + 600), 3600, now)).toBe(now + 600_000 - 180_000);
    expect(chatgptTokenExpiry('opaque', 3600, now)).toBe(now + 3_600_000 - 180_000);
  });

  it('CGPT-027: signing out drops the tokens and keeps the registration', async () => {
    const { user } = await makeUser(orm());
    expect((await refusal(service().signOut(user.id))).status).toBe(404);
    await seedChatgpt(user.id, { accessToken: 'a', refreshToken: 'r', expiresAt: 0 });
    await service().signOut(user.id);
    const row = await findRow(orm(), AiConnections, { user: user.id });
    expect(row).toMatchObject({ status: 'signed_out', secrets: null });
    expect(JSON.parse(String(row?.account)).clientId).toBe('oaiapp_saved');
  });
});
