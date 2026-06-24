import { describe, it, expect, vi, beforeEach } from 'vitest';

const { dbMock } = vi.hoisted(() => {
  const stmt = { get: vi.fn() };
  return { dbMock: { prepare: vi.fn(() => stmt), _stmt: stmt } };
});
vi.mock('../../../../src/db/database', () => ({ db: dbMock, closeDb: () => {}, reinitialize: () => {} }));

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn() }));
vi.mock('../../../../src/services/adminService', () => ({ isAddonEnabled }));

const { getUserSettings, getDecryptedUserSetting } = vi.hoisted(() => ({
  getUserSettings: vi.fn(() => ({}) as Record<string, unknown>),
  getDecryptedUserSetting: vi.fn(() => null as string | null),
}));
vi.mock('../../../../src/services/settingsService', () => ({ getUserSettings, getDecryptedUserSetting }));

import { resolveLlmConfig } from '../../../../src/nest/llm-parse/llm-config.resolver';

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
    expect(resolveLlmConfig(1)).toBeNull();
  });

  it('uses instance config when present (and decrypts the key)', () => {
    setInstanceConfig({ provider: 'anthropic', model: 'claude-opus-4-8', apiKey: 'sk-plain', multimodal: true });
    expect(resolveLlmConfig(1)).toEqual({
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
    expect(resolveLlmConfig(7)).toEqual({
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
    expect(resolveLlmConfig(1)).toBeNull();
  });
});
