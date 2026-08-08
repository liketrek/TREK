import { describe, it, expect, vi, beforeEach } from 'vitest';

const { dbMock } = vi.hoisted(() => {
  const stmt = { get: vi.fn() };
  return { dbMock: { prepare: vi.fn(() => stmt), _stmt: stmt } };
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
const getDecryptedUserSetting = vi.fn(() => null as string | null);
const settingsStub = { getUserSettings, getDecryptedUserSetting } as unknown as SettingsService;

const addonsStub = { isAddonEnabled } as unknown as AddonsService;
const resolver = new LlmConfigResolver(settingsStub, new DatabaseService(dbMock as never), addonsStub);

function setInstanceConfig(config: unknown) {
  dbMock._stmt.get.mockReturnValue(config === undefined ? undefined : { config: JSON.stringify(config) });
}

beforeEach(() => {
  vi.clearAllMocks();
  isAddonEnabled.mockReturnValue(true);
  setInstanceConfig(undefined);
  getUserSettings.mockReturnValue({});
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

  it('falls back to per-user config when instance config is incomplete', () => {
    setInstanceConfig({ provider: 'anthropic' }); // no model → not usable
    getUserSettings.mockReturnValue({ llm_provider: 'local', llm_model: 'nuextract', llm_base_url: 'http://x/v1', llm_multimodal: true });
    getDecryptedUserSetting.mockReturnValue('user-key');
    expect(resolver.resolve(7)).toEqual({
      provider: 'local',
      model: 'nuextract',
      baseUrl: 'http://x/v1',
      apiKey: 'user-key',
      multimodal: true,
    });
    expect(getDecryptedUserSetting).toHaveBeenCalledWith(7, 'llm_api_key');
  });

  it('returns null when neither instance nor user config is usable', () => {
    getUserSettings.mockReturnValue({ llm_provider: 'openai' }); // no model
    expect(resolver.resolve(1)).toBeNull();
  });
});
