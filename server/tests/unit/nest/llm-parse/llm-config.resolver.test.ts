import { describe, it, expect, vi, beforeEach } from 'vitest';

// prepare() has to answer per statement now: the resolver reads the addon row
// AND the caller's role, and a single shared stub would hand the role lookup the
// addon row (silently green tests for the #1772 gate).
const { dbMock } = vi.hoisted(() => {
  const addonStmt = { get: vi.fn() };
  const roleStmt = { get: vi.fn() };
  const other = { get: vi.fn(), all: vi.fn(), run: vi.fn() };
  return {
    dbMock: {
      prepare: vi.fn((sql: string) => {
        if (sql.includes('FROM addons')) return addonStmt;
        if (sql.includes('FROM users')) return roleStmt;
        return other;
      }),
      _addon: addonStmt,
      _role: roleStmt,
    },
  };
});
vi.mock('../../../../src/db/database', () => ({ db: dbMock, closeDb: () => {}, reinitialize: () => {} }));

const isAddonEnabled = vi.fn();

import { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import type { SettingsService } from '../../../../src/nest/settings/settings.service';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';

// The resolver injects SettingsService — a stub instance instead of the old
// legacy-module path mock (same behaviors as before the DI move). The
// DatabaseService rides the same prepare/get mock the module-level db used.
const getUserSettings = vi.fn(() => ({}) as Record<string, unknown>);
const getAdminUserDefaults = vi.fn(() => ({}) as Record<string, unknown>);
const getDecryptedUserSetting = vi.fn(() => null as string | null);
const settingsStub = { getUserSettings, getAdminUserDefaults, getDecryptedUserSetting } as unknown as SettingsService;

const addonsStub = { isAddonEnabled } as unknown as AddonsService;
const resolver = new LlmConfigResolver(settingsStub, new DatabaseService(dbMock as never), addonsStub);

function setInstanceConfig(config: unknown) {
  dbMock._addon.get.mockReturnValue(config === undefined ? undefined : { config: JSON.stringify(config) });
}

function setRole(role: 'user' | 'admin' | undefined) {
  dbMock._role.get.mockReturnValue(role === undefined ? undefined : { role });
}

beforeEach(() => {
  vi.clearAllMocks();
  isAddonEnabled.mockReturnValue(true);
  setInstanceConfig(undefined);
  setRole('user');
  getUserSettings.mockReturnValue({});
  getAdminUserDefaults.mockReturnValue({});
  getDecryptedUserSetting.mockReturnValue(null);
});

describe('resolveLlmConfig', () => {
  it('returns null when the addon is disabled', () => {
    isAddonEnabled.mockReturnValue(false);
    expect(resolver.resolve(1)).toBeNull();
  });

  it('uses instance config when present (and decrypts the key)', () => {
    setInstanceConfig({ provider: 'anthropic', model: 'claude-opus-4-8', apiKey: 'sk-plain', multimodal: true });
    expect(resolver.resolve(1)).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-4-8',
      baseUrl: undefined,
      apiKey: 'sk-plain',
      multimodal: true,
    });
  });

  it('instance config with a base URL still wins for a plain user (#1772 does not touch it)', () => {
    setInstanceConfig({ provider: 'local', model: 'nuextract', baseUrl: 'http://ollama:11434' });
    setRole('user');
    expect(resolver.resolve(7)).toMatchObject({ provider: 'local', baseUrl: 'http://ollama:11434' });
  });

  it('falls back to per-user config when instance config is incomplete', () => {
    setInstanceConfig({ provider: 'anthropic' }); // no model → not usable
    getUserSettings.mockReturnValue({ llm_provider: 'anthropic', llm_model: 'claude-sonnet', llm_multimodal: true });
    getDecryptedUserSetting.mockReturnValue('user-key');
    expect(resolver.resolve(7)).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet',
      baseUrl: undefined,
      apiKey: 'user-key',
      multimodal: true,
    });
    expect(getDecryptedUserSetting).toHaveBeenCalledWith(7, 'llm_api_key');
  });

  it('returns null when neither instance nor user config is usable', () => {
    getUserSettings.mockReturnValue({ llm_provider: 'openai' }); // no model
    expect(resolver.resolve(1)).toBeNull();
  });

  // #1772: the endpoint is instance configuration, so it may only come from an
  // admin-controlled source, whoever is asking.
  it('#1772: picking local personally gets no config at all (no silent reroute)', () => {
    getUserSettings.mockReturnValue({ llm_provider: 'local', llm_model: 'nuextract', llm_base_url: 'http://192.168.1.5:11434' });
    expect(resolver.resolve(7)).toBeNull();
  });

  it('#1772: a personal OpenAI config survives but loses its own base URL', () => {
    getUserSettings.mockReturnValue({ llm_provider: 'openai', llm_model: 'gpt-4o-mini', llm_base_url: 'http://192.168.1.5:11434' });
    getDecryptedUserSetting.mockReturnValue('sk-user');
    expect(resolver.resolve(7)).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
      baseUrl: undefined,
      apiKey: 'sk-user',
      multimodal: false,
    });
  });

  it('#1772: an admin-set instance default endpoint applies to everyone', () => {
    // getUserSettings merges the admin defaults in; getAdminUserDefaults is the
    // admin-controlled layer the endpoint is allowed to come from.
    getUserSettings.mockReturnValue({ llm_provider: 'local', llm_model: 'nuextract', llm_base_url: 'http://ollama.internal:11434' });
    getAdminUserDefaults.mockReturnValue({ llm_provider: 'local', llm_base_url: 'http://ollama.internal:11434' });
    expect(resolver.resolve(7)).toMatchObject({ provider: 'local', baseUrl: 'http://ollama.internal:11434' });
  });

  it('#1772: the caller\'s role does not change the answer, and no role is looked up', () => {
    // An instance has one endpoint. An admin who parked one in their own row is
    // in exactly the same position as anyone else, and the resolver no longer
    // reads the users table at all.
    setRole('admin');
    getUserSettings.mockReturnValue({ llm_provider: 'local', llm_model: 'nuextract', llm_base_url: 'http://192.168.1.5:11434' });
    expect(resolver.resolve(7)).toBeNull();
    expect(dbMock._role.get).not.toHaveBeenCalled();
  });
});
