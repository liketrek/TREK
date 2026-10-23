import type { AddonsRepository } from '../../../../src/db/repositories/Addons.repository';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import type { SettingsService } from '../../../../src/nest/settings/settings.service';
import type { ModuleRef } from '@nestjs/core';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const isAddonEnabled = vi.fn();
const findById = vi.fn();

// The resolver injects SettingsService — a stub instance (same behaviors as
// before the DI move). Plan 4 Task 1: the addon-row read is now
// `AddonsRepository.findById`, stubbed the same way — `config` comes back
// already-parsed (the repository's own `p.json()` column), never a JSON
// string this test has to stringify.
const getUserSettings = vi.fn(() => ({}) as Record<string, unknown>);
const getAdminUserDefaults = vi.fn(() => ({}) as Record<string, unknown>);
const getDecryptedUserSetting = vi.fn(() => null as string | null);
const settingsStub = { getUserSettings, getAdminUserDefaults, getDecryptedUserSetting } as unknown as SettingsService;

const addonsStub = { isAddonEnabled } as unknown as AddonsService;
const addonsRepoStub = { findById } as unknown as AddonsRepository;
// The assistant's connection, offered through the port; unregistered unless a case provides it.
const forParsing = vi.fn();
let portRegistered = false;
const moduleRefStub = {
  get: vi.fn(() => {
    if (!portRegistered) throw new Error('not registered');
    return { forParsing };
  }),
} as unknown as ModuleRef;
const resolver = new LlmConfigResolver(settingsStub, addonsRepoStub, addonsStub, moduleRefStub);

function setInstanceConfig(config: Record<string, unknown> | undefined) {
  findById.mockResolvedValue(config === undefined ? null : { id: 'llm_parsing', config });
}

beforeEach(() => {
  vi.clearAllMocks();
  isAddonEnabled.mockReturnValue(true);
  setInstanceConfig(undefined);
  getUserSettings.mockReturnValue({});
  getAdminUserDefaults.mockReturnValue({});
  getDecryptedUserSetting.mockReturnValue(null);
  portRegistered = false;
  forParsing.mockResolvedValue(null);
});

describe('resolveLlmConfig', () => {
  it('returns null when the addon is disabled', async () => {
    isAddonEnabled.mockReturnValue(false);
    expect(await resolver.resolve(1)).toBeNull();
    // Gated BEFORE the addon-row read: a disabled addon never even queries it.
    expect(findById).not.toHaveBeenCalled();
  });

  it('uses instance config when present (and decrypts the key)', async () => {
    setInstanceConfig({ provider: 'anthropic', model: 'claude-opus-4-8', apiKey: 'sk-plain', vision: 'on' });
    expect(await resolver.resolve(1)).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-4-8',
      baseUrl: undefined,
      apiKey: 'sk-plain',
      vision: 'on',
    });
    expect(findById).toHaveBeenCalledWith('llm_parsing');
  });

  it('reads the instance vision setting as auto when it is missing, unknown, or only the old multimodal flag', async () => {
    for (const extra of [{}, { vision: 'maybe' }, { multimodal: false }, { multimodal: true }]) {
      setInstanceConfig({ provider: 'local', model: 'qwen3.5:4b', ...extra });
      expect((await resolver.resolve(1))?.vision).toBe('auto');
    }
    setInstanceConfig({ provider: 'local', model: 'qwen3.5:4b', vision: 'off' });
    expect((await resolver.resolve(1))?.vision).toBe('off');
  });

  it('instance config with a base URL still wins for a plain user (#1772 does not touch it)', async () => {
    setInstanceConfig({ provider: 'local', model: 'nuextract', baseUrl: 'http://ollama:11434' });
    expect(await resolver.resolve(7)).toMatchObject({ provider: 'local', baseUrl: 'http://ollama:11434' });
  });

  it('falls back to per-user config when instance config is incomplete', async () => {
    setInstanceConfig({ provider: 'anthropic' }); // no model → not usable
    getUserSettings.mockReturnValue({ llm_provider: 'anthropic', llm_model: 'claude-sonnet', llm_multimodal: true });
    getDecryptedUserSetting.mockReturnValue('user-key');
    expect(await resolver.resolve(7)).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet',
      baseUrl: undefined,
      apiKey: 'user-key',
      vision: 'on',
    });
    expect(getDecryptedUserSetting).toHaveBeenCalledWith(7, 'llm_api_key');
  });

  it('returns null when neither instance nor user config is usable', async () => {
    getUserSettings.mockReturnValue({ llm_provider: 'openai' }); // no model
    expect(await resolver.resolve(1)).toBeNull();
  });

  it('returns null when the addon row has no config at all', async () => {
    setInstanceConfig(undefined);
    expect(await resolver.resolve(1)).toBeNull();
  });

  // #1772: the endpoint is instance configuration, so it may only come from an
  // admin-controlled source, whoever is asking.
  it('#1772: picking local personally gets no config at all (no silent reroute)', async () => {
    getUserSettings.mockReturnValue({
      llm_provider: 'local',
      llm_model: 'nuextract',
      llm_base_url: 'http://192.168.1.5:11434',
    });
    expect(await resolver.resolve(7)).toBeNull();
  });

  it('#1772: a personal OpenAI config survives but loses its own base URL', async () => {
    getUserSettings.mockReturnValue({
      llm_provider: 'openai',
      llm_model: 'gpt-4o-mini',
      llm_base_url: 'http://192.168.1.5:11434',
    });
    getDecryptedUserSetting.mockReturnValue('sk-user');
    expect(await resolver.resolve(7)).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
      baseUrl: undefined,
      apiKey: 'sk-user',
      vision: 'off',
    });
  });

  it('#1772: an admin-set instance default endpoint applies to everyone', async () => {
    // getUserSettings merges the admin defaults in; getAdminUserDefaults is the
    // admin-controlled layer the endpoint is allowed to come from.
    getUserSettings.mockReturnValue({
      llm_provider: 'local',
      llm_model: 'nuextract',
      llm_base_url: 'http://ollama.internal:11434',
    });
    getAdminUserDefaults.mockReturnValue({ llm_provider: 'local', llm_base_url: 'http://ollama.internal:11434' });
    expect(await resolver.resolve(7)).toMatchObject({ provider: 'local', baseUrl: 'http://ollama.internal:11434' });
  });

  it("#1772: the caller's identity does not change the answer — the resolver never reads anything keyed by it besides the settings service", async () => {
    // An instance has one endpoint. An admin who parked one in their own row is
    // in exactly the same position as anyone else.
    getUserSettings.mockReturnValue({
      llm_provider: 'local',
      llm_model: 'nuextract',
      llm_base_url: 'http://192.168.1.5:11434',
    });
    expect(await resolver.resolve(7)).toBeNull();
    // The addon-row read is a single, userId-independent lookup — called once,
    // with no user-scoped argument.
    expect(findById).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith('llm_parsing');
  });
});

describe('readLocalServerAccess (#2649)', () => {
  it('answers the saved local server and its decrypted key, before a model is chosen', async () => {
    setInstanceConfig({ provider: 'local', baseUrl: ' https://ollama.example.org/v1 ', apiKey: 'proxy-key' });
    expect(await resolver.readLocalServerAccess()).toEqual({
      baseUrl: 'https://ollama.example.org/v1',
      apiKey: 'proxy-key',
    });
  });

  it('answers without a key when none is saved, and a blank base URL as the default', async () => {
    setInstanceConfig({ provider: 'local', model: 'nuextract', baseUrl: '' });
    expect(await resolver.readLocalServerAccess()).toEqual({ baseUrl: undefined, apiKey: undefined });
  });

  it('answers null when the saved provider is not local, or nothing is saved', async () => {
    setInstanceConfig({ provider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk' });
    expect(await resolver.readLocalServerAccess()).toBeNull();
    setInstanceConfig(undefined);
    expect(await resolver.readLocalServerAccess()).toBeNull();
  });
});

describe('readInstanceEndpoint', () => {
  it('answers the saved provider, model and address, never the key', async () => {
    setInstanceConfig({ provider: 'local', model: 'qwen3.5:4b', baseUrl: ' http://10.0.0.2:11434 ', apiKey: 'k' });
    expect(await resolver.readInstanceEndpoint()).toEqual({
      provider: 'local',
      model: 'qwen3.5:4b',
      baseUrl: 'http://10.0.0.2:11434',
    });
  });

  it('answers null when nothing usable is saved', async () => {
    expect(await resolver.readInstanceEndpoint()).toBeNull();
    setInstanceConfig({ provider: 'anthropic', model: '' });
    expect(await resolver.readInstanceEndpoint()).toBeNull();
  });
});

describe('the shared AI connection', () => {
  const shared = { provider: 'openai', model: 'gemini-3-flash', apiKey: 'g', baseUrl: 'https://gemini.test/openai' };

  it('LLMRES-SHARED-001: reads with the assistant connection when parsing has none of its own', async () => {
    portRegistered = true;
    forParsing.mockResolvedValue(shared);
    setInstanceConfig({ vision: 'on' });
    expect(await resolver.resolve(7)).toEqual({ ...shared, vision: 'on' });
    expect(forParsing).toHaveBeenCalledWith(7);
  });

  it('LLMRES-SHARED-002: an instance config of its own still wins, and the shared one beats a personal one', async () => {
    portRegistered = true;
    forParsing.mockResolvedValue(shared);
    setInstanceConfig({ provider: 'anthropic', model: 'claude-x', apiKey: 'a' });
    expect(await resolver.resolve(1)).toMatchObject({ provider: 'anthropic', model: 'claude-x' });
    expect(forParsing).not.toHaveBeenCalled();

    setInstanceConfig(undefined);
    getUserSettings.mockReturnValue({ llm_provider: 'openai', llm_model: 'gpt-4o' });
    expect(await resolver.resolve(1)).toMatchObject({ model: 'gemini-3-flash', vision: 'auto' });
  });

  it('LLMRES-SHARED-003: without the port or a usable connection, the personal config answers', async () => {
    getUserSettings.mockReturnValue({ llm_provider: 'openai', llm_model: 'gpt-4o' });
    expect(await resolver.resolve(1)).toMatchObject({ provider: 'openai', model: 'gpt-4o' });
    portRegistered = true;
    expect(await resolver.resolve(1)).toMatchObject({ provider: 'openai', model: 'gpt-4o' });
  });
});
