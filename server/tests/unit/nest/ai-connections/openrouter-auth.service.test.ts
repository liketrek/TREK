/**
 * OpenrouterAuthService: OpenRouter's OAuth with PKCE, whose callback address
 * comes from the configured app URL only, and whose code is exchanged for a
 * key saved like a pasted one. The key exchange answers through a mocked
 * safeFetch; saving goes to a stubbed AiConnectionsService.
 */
import { AiConnectionsModule } from '../../../../src/nest/ai-connections/ai-connections.module';
import { AiConnectionsService } from '../../../../src/nest/ai-connections/ai-connections.service';
import { OpenrouterAuthService } from '../../../../src/nest/ai-connections/openrouter-auth.service';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DemoModule } from '../../../../src/nest/common/demo.module';
import { DemoService } from '../../../../src/nest/common/demo.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { OidcService } from '../../../../src/nest/oidc/oidc.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { createHash } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/ssrfGuard')>()),
  safeFetch,
}));

const db = createSnapshotTestDb();
let t: TestModule;
const VIEW = {
  scope: 'user',
  kind: 'openrouter',
  model: 'anthropic/claude-sonnet-5',
  hint: '…abcd',
  status: 'ok',
  host: 'openrouter.ai',
};
const connections = { saveOpenrouterKey: vi.fn(async () => VIEW) };
const demo = { isDemoUserId: vi.fn(async () => false) };

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [AppConfigModule, DemoModule, AiConnectionsModule],
    overrides: [
      { provide: AiConnectionsService, useValue: connections },
      { provide: DemoService, useValue: demo },
      { provide: OidcService, useValue: {} },
    ],
  });
});

afterAll(async () => {
  await t.close();
  db.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('APP_URL', 'https://trip.example.org');
});

afterEach(() => vi.unstubAllEnvs());

const service = () => t.get(OpenrouterAuthService);
const USER = { id: 4, role: 'user' };
const ADMIN = { id: 1, role: 'admin' };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

async function refusal(promise: Promise<unknown>) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

describe('OpenrouterAuthService', () => {
  it('ORA-001: the callback goes to the configured address, for the user to settings and for the admin to the addon', async () => {
    const user = new URL((await service().start(USER.id, 'user')).authorizeUrl);
    expect(user.origin + user.pathname).toBe('https://openrouter.ai/auth');
    expect(user.searchParams.get('callback_url')).toBe(
      'https://trip.example.org/settings?tab=integrations&ai=openrouter',
    );
    expect(user.searchParams.get('code_challenge_method')).toBe('S256');
    const admin = new URL((await service().start(ADMIN.id, 'instance')).authorizeUrl);
    expect(admin.searchParams.get('callback_url')).toBe('https://trip.example.org/admin?tab=addons&ai=openrouter');
  });

  it('ORA-002: not offered without an https address, and not to a user who may not connect their own', async () => {
    vi.stubEnv('APP_URL', 'http://192.168.1.20:3000');
    expect((await refusal(service().start(USER.id, 'user'))).body).toMatchObject({ code: 'forbidden' });
    vi.stubEnv('APP_URL', 'https://trip.example.org');
    demo.isDemoUserId.mockResolvedValueOnce(true);
    expect((await refusal(service().start(USER.id, 'user'))).status).toBe(403);
  });

  it('ORA-003: the code is exchanged with the verifier whose challenge went out, and the key is saved', async () => {
    const start = await service().start(USER.id, 'user');
    const challenge = new URL(start.authorizeUrl).searchParams.get('code_challenge');
    safeFetch.mockResolvedValueOnce(json(200, { key: 'sk-or-v1-new-key-abcd' }));

    expect(await service().finish(USER, start.flowId, 'code-123')).toBe(VIEW);

    const [url, init] = safeFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/auth/keys');
    const body = JSON.parse(String(init.body)) as {
      code: string;
      code_verifier: string;
      code_challenge_method: string;
    };
    expect(body.code).toBe('code-123');
    expect(body.code_challenge_method).toBe('S256');
    expect(createHash('sha256').update(body.code_verifier).digest('base64url')).toBe(challenge);
    expect(connections.saveOpenrouterKey).toHaveBeenCalledWith(USER.id, 'user', 'sk-or-v1-new-key-abcd');
  });

  it('ORA-004: a flow is the starter own and used once; an instance one only an admin finishes', async () => {
    const start = await service().start(USER.id, 'user');
    expect((await refusal(service().finish(ADMIN, start.flowId, 'c'))).status).toBe(410);
    safeFetch.mockResolvedValueOnce(json(200, { key: 'sk-or-v1-new-key-abcd' }));
    await service().finish(USER, start.flowId, 'c');
    expect((await refusal(service().finish(USER, start.flowId, 'c'))).status).toBe(410);

    const instance = await service().start(USER.id, 'instance');
    expect((await refusal(service().finish(USER, instance.flowId, 'c'))).status).toBe(403);
  });

  it('ORA-005: a refused code starts over, an OpenRouter that is down is provider_unavailable', async () => {
    let start = await service().start(USER.id, 'user');
    safeFetch.mockResolvedValueOnce(json(400, { error: { message: 'invalid code' } }));
    expect((await refusal(service().finish(USER, start.flowId, 'c'))).body).toMatchObject({ code: 'expired' });
    start = await service().start(USER.id, 'user');
    safeFetch.mockResolvedValueOnce(json(502, {}));
    expect((await refusal(service().finish(USER, start.flowId, 'c'))).status).toBe(502);
    start = await service().start(USER.id, 'user');
    safeFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect((await refusal(service().finish(USER, start.flowId, 'c'))).status).toBe(502);
    expect(connections.saveOpenrouterKey).not.toHaveBeenCalled();
  });
});
