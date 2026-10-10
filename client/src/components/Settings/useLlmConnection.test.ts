// FE-COMP-LLM-HOOK-001 to -006: the AI parsing form both settings shells share.
import { act, renderHook } from '@testing-library/react';
import { buildSettings } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import type { Settings } from '../../types';
import { useLlmConnection } from './useLlmConnection';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

function seed(over: Partial<Settings> = {}, isLoaded = true) {
  const updateSettings = vi.fn().mockResolvedValue(undefined);
  const loadSettings = vi.fn().mockResolvedValue(undefined);
  seedStore(useSettingsStore, { settings: buildSettings(over), isLoaded, updateSettings, loadSettings });
  return { updateSettings, loadSettings };
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
});

describe('useLlmConnection', () => {
  it('FE-COMP-LLM-HOOK-001: waits for the settings, then hydrates them without the key itself', () => {
    seed({ llm_provider: 'anthropic', llm_model: 'claude', llm_multimodal: true, llm_api_key: '****' }, false);
    const { result, rerender } = renderHook(() => useLlmConnection());
    expect(result.current.provider).toBe('openai');
    expect(result.current.model).toBe('');
    act(() => useSettingsStore.setState({ isLoaded: true }));
    rerender();
    expect(result.current.provider).toBe('anthropic');
    expect(result.current.model).toBe('claude');
    expect(result.current.multimodal).toBe(true);
    expect(result.current.hasStoredKey).toBe(true);
    expect(result.current.apiKey).toBe('');
  });

  it('FE-COMP-LLM-HOOK-002: a stored local provider from before #1772 shows as OpenAI', () => {
    seed({ llm_provider: 'local' });
    const { result } = renderHook(() => useLlmConnection());
    expect(result.current.provider).toBe('openai');
  });

  it('FE-COMP-LLM-HOOK-003: offers exactly the two hosted providers', () => {
    seed();
    const { result } = renderHook(() => useLlmConnection());
    expect(result.current.providerOptions).toEqual([
      { value: 'openai', label: 'settings.aiParsing.providerOpenai' },
      { value: 'anthropic', label: 'settings.aiParsing.providerAnthropic' },
    ]);
  });

  it('FE-COMP-LLM-HOOK-004: save with a blank key keeps the stored one and always clears the endpoint', async () => {
    const { updateSettings } = seed({ llm_provider: 'openai', llm_model: 'm' });
    const { result } = renderHook(() => useLlmConnection());
    act(() => result.current.setModel('  gpt  '));
    act(() => result.current.toggleMultimodal());
    await act(() => result.current.handleSave());
    expect(updateSettings).toHaveBeenCalledWith({
      llm_provider: 'openai',
      llm_model: 'gpt',
      llm_base_url: '',
      llm_multimodal: true,
    });
    expect(toast.success).toHaveBeenCalledWith('settings.aiParsing.toast.saved');
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-LLM-HOOK-005: a typed key is sent trimmed, cleared afterwards and marks a stored key', async () => {
    const { updateSettings } = seed();
    const { result } = renderHook(() => useLlmConnection());
    act(() => result.current.setProvider('anthropic'));
    act(() => result.current.setApiKey(' sk '));
    await act(() => result.current.handleSave());
    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ llm_provider: 'anthropic', llm_api_key: 'sk' })
    );
    expect(result.current.apiKey).toBe('');
    expect(result.current.hasStoredKey).toBe(true);
  });

  it('FE-COMP-LLM-HOOK-006: a refused save reloads the stored settings and toasts the error', async () => {
    const { updateSettings, loadSettings } = seed();
    updateSettings.mockRejectedValue(new Error('403'));
    const { result } = renderHook(() => useLlmConnection());
    act(() => result.current.setApiKey('sk'));
    await act(() => result.current.handleSave());
    expect(loadSettings).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('settings.aiParsing.toast.saveError');
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.apiKey).toBe('sk');
    expect(result.current.saving).toBe(false);
  });
});
