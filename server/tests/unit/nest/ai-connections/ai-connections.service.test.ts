/**
 * AiConnectionsService over the real repository on a migrated test db: saving
 * a key is testing it, secrets are sealed and only a hint goes out, the policy
 * decides whose connection a user's assistant runs on, and the instance's
 * connection keeps a stored key only for the target it was saved for.
 *
 * Replaced: the model catalog (no provider is asked), the ChatGPT sign-in, the
 * addon switch, the demo check, the audit writer and AI parsing's config.
 */
import { AiConnections } from '../../../../src/db/entities/AiConnections.entity';
import { AddonsService } from '../../../../src/nest/addons/addons.service';
import { AiConnectionsModule } from '../../../../src/nest/ai-connections/ai-connections.module';
import { AiConnectionsService } from '../../../../src/nest/ai-connections/ai-connections.service';
import { ChatgptAuthService } from '../../../../src/nest/ai-connections/chatgpt-auth.service';
import { ModelCatalogService } from '../../../../src/nest/ai-connections/model-catalog.service';
import { AiProviderError } from '../../../../src/nest/ai-connections/providers/provider-errors';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { AuditService } from '../../../../src/nest/audit/audit.service';
import { DemoModule } from '../../../../src/nest/common/demo.module';
import { DemoService } from '../../../../src/nest/common/demo.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import { OidcService } from '../../../../src/nest/oidc/oidc.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { findRow } from '../../../helpers/factories/rows';
import { setAppSetting, readUserSetting } from '../../../helpers/factories/settings';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { MASKED_SETTING_VALUE, type AiModelInfo } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

const MODELS: AiModelInfo[] = [
  { id: 'claude-haiku', label: 'Haiku', supportsTools: true },
  { id: 'claude-sonnet', label: 'Sonnet', supportsTools: true },
];

const catalog = { list: vi.fn(async (): Promise<AiModelInfo[]> => MODELS) };
const chatgpt = { accessToken: vi.fn(async () => 'chatgpt-access') };
const addons = { isAddonEnabled: vi.fn(async () => true) };
const demo = { isDemoUserId: vi.fn(async () => false) };
const audit = { writeAudit: vi.fn(async () => undefined) };
const llmConfig = {
  readInstanceEndpoint: vi.fn(async (): Promise<{ provider: string; model: string; baseUrl?: string } | null> => null),
};

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [AppConfigModule, DemoModule, AiConnectionsModule],
    overrides: [
      { provide: ModelCatalogService, useValue: catalog },
      { provide: ChatgptAuthService, useValue: chatgpt },
      { provide: AddonsService, useValue: addons },
      { provide: DemoService, useValue: demo },
      { provide: AuditService, useValue: audit },
      { provide: LlmConfigResolver, useValue: llmConfig },
      { provide: OidcService, useValue: {} },
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
  catalog.list.mockImplementation(async () => MODELS);
  addons.isAddonEnabled.mockResolvedValue(true);
  demo.isDemoUserId.mockResolvedValue(false);
  llmConfig.readInstanceEndpoint.mockResolvedValue(null);
});

const service = () => t.get(AiConnectionsService);
const orm = () => t.get(MikroORM);

async function user(): Promise<number> {
  return (await makeUser(orm())).user.id;
}

async function refusal(promise: Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

describe('a user own key', () => {
  it('AICS-001: nothing connected: not available, with the defaults', async () => {
    const id = await user();
    expect(await service().status(id)).toMatchObject({
      available: false,
      policy: 'instance_or_user',
      canConnectOwn: true,
      effective: null,
      own: null,
      instance: null,
      quota: null,
      privacyAcked: false,
      retention: { mode: 'days', days: 90 },
    });
  });

  it('AICS-002: saving tests the key, picks the default model and stores the key sealed', async () => {
    const id = await user();
    const view = await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-api03-secret-9876' });
    expect(catalog.list).toHaveBeenCalledWith({ kind: 'anthropic', baseUrl: null, secret: 'sk-ant-api03-secret-9876' });
    expect(view).toEqual({
      scope: 'user',
      kind: 'anthropic',
      model: 'claude-sonnet',
      hint: '…9876',
      status: 'ok',
      host: 'api.anthropic.com',
    });
    const row = await findRow(orm(), AiConnections, { user: id });
    expect(row?.secrets).toMatch(/^enc:v1:/);
    expect(row?.secrets).not.toContain('secret-9876');
    expect(audit.writeAudit).toHaveBeenCalledWith({
      userId: id,
      action: 'ai.connection.saved',
      details: { scope: 'user', kind: 'anthropic' },
    });
    expect(await service().status(id)).toMatchObject({
      available: true,
      effective: { source: 'user', kind: 'anthropic', model: 'claude-sonnet', paidBy: 'user' },
      quota: null,
      privacyAcked: true,
    });
  });

  it('AICS-003: a chosen model must be on offer; a refused key is invalid_key', async () => {
    const id = await user();
    expect(
      await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-key-1', model: 'claude-haiku' }),
    ).toMatchObject({
      model: 'claude-haiku',
    });
    expect(
      await refusal(service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-key-1', model: 'gpt-5' })),
    ).toEqual({ status: 422, body: { error: 'This model is not offered here', code: 'unknown_model' } });
    catalog.list.mockRejectedValueOnce(new AiProviderError('invalid_key', 401, false));
    expect(await refusal(service().saveOwnKey(id, { kind: 'openai', apiKey: 'sk-wrong-key' }))).toEqual({
      status: 422,
      body: { error: 'The provider refused this key', code: 'invalid_key' },
    });
    // The refused key replaced nothing.
    expect((await findRow(orm(), AiConnections, { user: id }))?.kind).toBe('anthropic');
  });

  it('AICS-004: no own connection under the instance policy, and never for the demo account', async () => {
    const id = await user();
    await setAppSetting(orm(), 'ai_assistant_policy', 'instance');
    expect((await refusal(service().saveOwnKey(id, { kind: 'gemini', apiKey: 'AIzaSyKey' }))).body).toMatchObject({
      code: 'forbidden',
    });
    expect((await service().status(id)).canConnectOwn).toBe(false);

    await setAppSetting(orm(), 'ai_assistant_policy', 'user');
    demo.isDemoUserId.mockResolvedValue(true);
    expect((await refusal(service().saveOwnKey(id, { kind: 'gemini', apiKey: 'AIzaSyKey' }))).status).toBe(403);
  });

  it('AICS-005: the model can be changed to one on offer, the connection removed', async () => {
    const id = await user();
    await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-key-2' });
    expect(await service().setOwnModel(id, 'claude-haiku')).toMatchObject({ model: 'claude-haiku' });
    expect((await refusal(service().setOwnModel(id, 'nope'))).status).toBe(422);
    expect(await service().listOwnModels(id)).toEqual(MODELS);
    await service().removeOwn(id);
    expect(await findRow(orm(), AiConnections, { user: id })).toBeNull();
    expect((await refusal(service().removeOwn(id))).status).toBe(404);
  });

  it('AICS-006: model lists are limited to a few a minute per user', async () => {
    const id = await user();
    await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-key-3' });
    // The save asked once; four more fill the minute.
    await Promise.all([1, 2, 3, 4].map(() => service().listOwnModels(id)));
    expect(await refusal(service().listOwnModels(id))).toMatchObject({ status: 429, body: { code: 'rate_limited' } });
  });
});

describe('the instance connection', () => {
  it('AICS-010: a custom server is saved with its address and the model as named', async () => {
    const admin = await user();
    const saved = await service().saveInstance(admin, {
      kind: 'custom',
      baseUrl: 'http://ollama.lan:11434/v1',
      model: 'qwen3:14b',
    });
    expect(catalog.list).toHaveBeenCalledWith({ kind: 'custom', baseUrl: 'http://ollama.lan:11434/v1', secret: null });
    expect(saved).toEqual({
      connection: {
        scope: 'instance',
        kind: 'custom',
        model: 'qwen3:14b',
        hint: null,
        status: 'ok',
        host: 'ollama.lan:11434',
        baseUrl: 'http://ollama.lan:11434/v1',
      },
      prefill: null,
    });
  });

  it('AICS-011: the mask keeps the stored key for the same kind, and only for it', async () => {
    const admin = await user();
    await service().saveInstance(admin, { kind: 'openai', apiKey: 'sk-proj-first-1111' });
    await service().saveInstance(admin, { kind: 'openai', apiKey: MASKED_SETTING_VALUE, model: 'claude-haiku' });
    expect(catalog.list).toHaveBeenLastCalledWith({ kind: 'openai', baseUrl: null, secret: 'sk-proj-first-1111' });
    expect((await service().instanceConnection()).connection).toMatchObject({ model: 'claude-haiku', hint: '…1111' });

    expect(
      await refusal(service().saveInstance(admin, { kind: 'anthropic', apiKey: MASKED_SETTING_VALUE })),
    ).toMatchObject({ status: 422, body: { code: 'invalid_key' } });
  });

  it('AICS-012: without a connection, the form starts from what AI parsing uses', async () => {
    llmConfig.readInstanceEndpoint.mockResolvedValueOnce({
      provider: 'local',
      model: 'llama3',
      baseUrl: 'http://ollama:11434/v1',
    });
    expect((await service().instanceConnection()).prefill).toEqual({
      kind: 'custom',
      baseUrl: 'http://ollama:11434/v1',
      model: 'llama3',
    });
    llmConfig.readInstanceEndpoint.mockResolvedValueOnce({ provider: 'anthropic', model: 'claude-x' });
    expect((await service().instanceConnection()).prefill).toEqual({
      kind: 'anthropic',
      baseUrl: null,
      model: 'claude-x',
    });
    llmConfig.readInstanceEndpoint.mockResolvedValueOnce({ provider: 'openai', model: 'gpt-x' });
    expect((await service().instanceConnection()).prefill).toEqual({ kind: 'openai', baseUrl: null, model: 'gpt-x' });
  });

  it('AICS-013: on the instance connection a user sees the quota and acknowledges kind@host once', async () => {
    const admin = await user();
    const id = await user();
    await service().saveInstance(admin, { kind: 'anthropic', apiKey: 'sk-ant-instance' });
    expect(await service().status(id)).toMatchObject({
      available: true,
      effective: { source: 'instance', paidBy: 'instance', host: 'api.anthropic.com' },
      instance: { kind: 'anthropic', model: 'claude-sonnet', host: 'api.anthropic.com' },
      quota: { used: 0, limit: 50 },
      privacyAcked: false,
    });
    await service().ackPrivacy(id, { kind: 'anthropic', host: 'api.anthropic.com' });
    expect(await readUserSetting(orm(), id, 'assistant_privacy_ack')).toContain('anthropic@api.anthropic.com');
    expect((await service().status(id)).privacyAcked).toBe(true);

    // Another provider for everyone asks again.
    await service().saveInstance(admin, { kind: 'openai', apiKey: 'sk-proj-other' });
    expect((await service().status(id)).privacyAcked).toBe(false);
  });

  it('AICS-016: images of Studio pages are acknowledged on their own, per kind@host, on any connection', async () => {
    const admin = await user();
    const id = await user();
    await service().saveInstance(admin, { kind: 'anthropic', apiKey: 'sk-ant-instance' });
    const target = { kind: 'anthropic' as const, host: 'api.anthropic.com' };
    expect((await service().status(id)).studioImagesAcked).toBe(false);
    // The planner's acknowledgement says nothing about images.
    await service().ackPrivacy(id, target);
    expect(await service().studioImagesAcked(id, target)).toBe(false);
    await service().ackPrivacy(id, { ...target, scope: 'studio_images' });
    expect(await readUserSetting(orm(), id, 'assistant_privacy_ack_studio_images')).toContain(
      'anthropic@api.anthropic.com',
    );
    expect(await service().studioImagesAcked(id, target)).toBe(true);
    expect(await service().status(id)).toMatchObject({ privacyAcked: true, studioImagesAcked: true });
    // Another provider asks again.
    expect(await service().studioImagesAcked(id, { kind: 'openai', host: 'api.openai.com' })).toBe(false);
    await service().saveInstance(admin, { kind: 'openai', apiKey: 'sk-proj-other' });
    expect((await service().status(id)).studioImagesAcked).toBe(false);
  });

  it('AICS-017: status says whether the model the user runs on reads images, so Studio asks only then', async () => {
    const admin = await user();
    const id = await user();
    await service().saveInstance(admin, { kind: 'anthropic', apiKey: 'sk-ant-instance' });
    expect((await service().status(id)).studioImages).toBe(true);
    // A custom server cannot be told to read images from its model's name: its pages go as text.
    await service().saveInstance(admin, { kind: 'custom', baseUrl: 'http://ollama.lan:11434/v1', model: 'qwen3:14b' });
    expect((await service().status(id)).studioImages).toBe(false);
    await service().removeInstance(admin);
    expect((await service().status(id)).studioImages).toBe(false);
  });

  it('AICS-018: a model a provider refused an image for reads pages in words from then on, and status says so', async () => {
    const admin = await user();
    const id = await user();
    // The service, and what it remembers, lives for the whole file: no later test asks whether Haiku reads images.
    await service().saveInstance(admin, { kind: 'anthropic', apiKey: 'sk-ant-instance', model: 'claude-haiku' });
    const haiku = { kind: 'anthropic' as const, model: 'claude-haiku' };
    expect(service().readsImages(haiku)).toBe(true);
    expect((await service().status(id)).studioImages).toBe(true);

    service().refuseImages(haiku);
    expect(service().readsImages(haiku)).toBe(false);
    expect((await service().status(id)).studioImages).toBe(false);
    // Only that model: another one of the same provider still gets its pages as pictures.
    expect(service().readsImages({ ...haiku, model: 'claude-sonnet' })).toBe(true);
  });

  it('AICS-014: settings are read with their defaults and written back', async () => {
    const admin = await user();
    expect(await service().readSettings()).toEqual({
      policy: 'instance_or_user',
      dailyTurns: 50,
      retention: { mode: 'days', days: 90 },
      webSearch: true,
    });
    await setAppSetting(orm(), 'ai_assistant_retention', '{"mode":"weeks"}');
    expect((await service().readSettings()).retention).toEqual({ mode: 'days', days: 90 });
    const next = { policy: 'user' as const, dailyTurns: 20, retention: { mode: 'forever' as const }, webSearch: false };
    expect(await service().writeSettings(admin, next)).toEqual(next);
    expect(await service().readSettings()).toEqual(next);
    // Only "false" switches the search off: an odd row leaves it on, as it ships.
    await setAppSetting(orm(), 'ai_assistant_web_search', 'maybe');
    expect((await service().readSettings()).webSearch).toBe(true);
  });

  it('AICS-015: removing the instance connection, and refusing when there is none', async () => {
    const admin = await user();
    expect((await refusal(service().removeInstance(admin))).status).toBe(404);
    expect((await refusal(service().listInstanceModels(admin))).status).toBe(404);
    await service().saveInstance(admin, { kind: 'gemini', apiKey: 'AIzaSyInstance' });
    expect(await service().listInstanceModels(admin)).toEqual(MODELS);
    await service().removeInstance(admin);
    expect((await service().instanceConnection()).connection).toBeNull();
  });
});

describe('resolving the connection a turn runs on', () => {
  it('AICS-020: refuses while the addon is off, and without any connection', async () => {
    const id = await user();
    expect((await refusal(service().resolveForUser(id))).body).toMatchObject({ code: 'not_connected' });
    await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-key-4' });
    addons.isAddonEnabled.mockResolvedValue(false);
    expect((await refusal(service().resolveForUser(id))).status).toBe(409);
    expect((await service().status(id)).available).toBe(false);
  });

  it('AICS-021: answers the own connection with its key, the instance one under the instance policy', async () => {
    const admin = await user();
    const id = await user();
    await service().saveInstance(admin, { kind: 'openai', apiKey: 'sk-proj-instance' });
    await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-own-key' });
    expect(await service().resolveForUser(id)).toMatchObject({
      scope: 'user',
      kind: 'anthropic',
      paidBy: 'user',
      credential: { type: 'api_key', apiKey: 'sk-ant-own-key' },
    });
    await setAppSetting(orm(), 'ai_assistant_policy', 'instance');
    expect(await service().resolveForUser(id)).toMatchObject({
      scope: 'instance',
      kind: 'openai',
      paidBy: 'instance',
      credential: { type: 'api_key', apiKey: 'sk-proj-instance' },
    });
  });

  it('AICS-022: a ChatGPT connection needing a new sign-in is refused as needs_reauth, a refreshed one carries its token', async () => {
    const id = await user();
    const { em } = orm();
    await em.fork().insert(AiConnections, {
      scope: 'user',
      user: id,
      kind: 'chatgpt',
      model: 'gpt-6.1-sol',
      status: 'needs_reauth',
    });
    expect((await refusal(service().resolveForUser(id))).body).toMatchObject({ code: 'needs_reauth' });
    await em.fork().nativeUpdate(AiConnections, { user: id }, { status: 'ok' });
    expect(await service().resolveForUser(id)).toMatchObject({
      kind: 'chatgpt',
      host: 'api.openai.com',
      credential: { type: 'chatgpt', accessToken: 'chatgpt-access' },
    });
    chatgpt.accessToken.mockRejectedValueOnce(new AiProviderError('needs_reauth', 401, false));
    expect((await refusal(service().resolveForUser(id))).body).toMatchObject({ code: 'needs_reauth' });
  });

  it('AICS-023: a refused key marks the connection, a turn that worked clears the mark', async () => {
    const id = await user();
    await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-key-5' });
    const resolved = await service().resolveForUser(id);
    await service().noteOutcome(resolved, 'invalid_key');
    expect((await service().ownView(id)).status).toBe('error');
    await service().noteOutcome({ ...resolved, status: 'error' }, null);
    expect((await service().ownView(id)).status).toBe('ok');
  });
});

describe('the connection AI parsing shares', () => {
  it('AICS-030: parsing reads with the connection the policy picks, through the OpenAI-compatible endpoints', async () => {
    const admin = await user();
    const id = await user();
    expect(await service().forParsing(id)).toBeNull();
    await service().saveInstance(admin, { kind: 'gemini', apiKey: 'AQ.instance-key' });
    expect(await service().forParsing(id)).toEqual({
      provider: 'openai',
      model: 'claude-haiku',
      apiKey: 'AQ.instance-key',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    });
    await service().saveOwnKey(id, { kind: 'anthropic', apiKey: 'sk-ant-own-parse' });
    expect(await service().forParsing(id)).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet',
      apiKey: 'sk-ant-own-parse',
    });
  });

  it('AICS-031: a ChatGPT plan or a connection with a problem is not lent to parsing', async () => {
    const id = await user();
    const { em } = orm();
    await em.fork().insert(AiConnections, {
      scope: 'user',
      user: id,
      kind: 'chatgpt',
      model: 'gpt-6.1-sol',
      status: 'ok',
    });
    expect(await service().forParsing(id)).toBeNull();
    await em.fork().nativeDelete(AiConnections, { user: id });
    await service().saveOwnKey(id, { kind: 'openai', apiKey: 'sk-proj-own-parse' });
    expect(await service().forParsing(id)).toMatchObject({ provider: 'openai', apiKey: 'sk-proj-own-parse' });
    await em.fork().nativeUpdate(AiConnections, { user: id }, { status: 'error' });
    expect(await service().forParsing(id)).toBeNull();
  });
});
