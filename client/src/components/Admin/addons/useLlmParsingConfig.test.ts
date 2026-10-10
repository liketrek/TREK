import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../../api/client';
import { type Addon, DEFAULT_OLLAMA_URL, MASKED } from './addonModel';
import { useLlmParsingConfig } from './useLlmParsingConfig';

// FE-HOOK-LLMCFG-001 to FE-HOOK-LLMCFG-010

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

function llm(config?: Record<string, unknown>): Addon {
  return {
    id: 'llm_parsing',
    name: 'AI',
    description: '',
    icon: 'Sparkles',
    type: 'integration',
    enabled: true,
    config,
  };
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  vi.spyOn(adminApi, 'llmLocalModels').mockResolvedValue({ models: [{ name: 'qwen3.5:4b', size: 1 }] });
  vi.spyOn(adminApi, 'llmLocalPull').mockResolvedValue(undefined);
  vi.spyOn(adminApi, 'updateAddon').mockResolvedValue({});
});
afterEach(() => vi.restoreAllMocks());

describe('useLlmParsingConfig', () => {
  it('FE-HOOK-LLMCFG-001: starts from the stored config, defaulting to the local provider', () => {
    const { result } = renderHook(() => useLlmParsingConfig(llm()));
    expect(result.current.provider).toBe('local');
    expect(result.current.model).toBe('');
    expect(result.current.vision).toBe('auto');
    const stored = renderHook(() =>
      useLlmParsingConfig(llm({ provider: 'openai', model: 'gpt-4o', baseUrl: 'https://o', apiKey: MASKED }))
    );
    expect(stored.result.current.provider).toBe('openai');
    expect(stored.result.current.apiKey).toBe(MASKED);
  });

  it('FE-HOOK-LLMCFG-002: the local provider lists the installed models from the default URL', async () => {
    const { result } = renderHook(() => useLlmParsingConfig(llm()));
    await waitFor(() => expect(result.current.installed).toEqual(['qwen3.5:4b']));
    expect(adminApi.llmLocalModels).toHaveBeenCalledWith(DEFAULT_OLLAMA_URL);
    expect(result.current.isInstalled('qwen3.5:4b')).toBe(true);
    expect(result.current.isInstalled('llama3')).toBe(false);
  });

  it('FE-HOOK-LLMCFG-003: a cloud provider lists nothing until switched to local, then uses the typed URL', async () => {
    const { result } = renderHook(() =>
      useLlmParsingConfig(llm({ provider: 'openai', baseUrl: ' http://box:11434/v1 ' }))
    );
    expect(adminApi.llmLocalModels).not.toHaveBeenCalled();
    await act(() => result.current.loadModels());
    expect(adminApi.llmLocalModels).not.toHaveBeenCalled();
    act(() => result.current.setProvider('local'));
    await waitFor(() => expect(adminApi.llmLocalModels).toHaveBeenCalledWith('http://box:11434/v1'));
  });

  it('FE-HOOK-LLMCFG-004: an unreachable server shows its message and empties the list', async () => {
    vi.mocked(adminApi.llmLocalModels).mockRejectedValue(new Error('ECONNREFUSED'));
    const { result } = renderHook(() => useLlmParsingConfig(llm()));
    await waitFor(() => expect(result.current.modelsErr).toBe('ECONNREFUSED'));
    expect(result.current.installed).toEqual([]);
    expect(result.current.loadingModels).toBe(false);
    vi.mocked(adminApi.llmLocalModels).mockRejectedValue('nope');
    await act(() => result.current.loadModels());
    expect(result.current.modelsErr).toBe('Could not reach the local LLM server');
  });

  it('FE-HOOK-LLMCFG-005: a pull reports progress, selects the model and lists again', async () => {
    let progress!: (p: { status?: string; total?: number; completed?: number; error?: string }) => void;
    let finish!: () => void;
    vi.mocked(adminApi.llmLocalPull).mockImplementation((_url, _id, onProgress) => {
      progress = onProgress;
      return new Promise<void>((r) => (finish = r));
    });
    const { result } = renderHook(() => useLlmParsingConfig(llm()));
    await waitFor(() => expect(result.current.installed).toEqual(['qwen3.5:4b']));
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.pull('qwen3.5:4b');
    });
    expect(result.current.pulling).toBe('qwen3.5:4b');
    expect(result.current.pullStatus).toBe('starting…');
    act(() => progress({ status: 'downloading', total: 200, completed: 50 }));
    expect(result.current.pullStatus).toBe('downloading');
    expect(result.current.pullPct).toBe(25);
    await act(async () => {
      finish();
      await pending;
    });
    expect(toast.success).toHaveBeenCalledWith('Model pulled');
    expect(result.current.model).toBe('qwen3.5:4b');
    expect(adminApi.llmLocalModels).toHaveBeenCalledTimes(2);
    expect(result.current.pulling).toBeNull();
    expect(result.current.pullPct).toBe(0);
    expect(result.current.pullStatus).toBe('');
  });

  it('FE-HOOK-LLMCFG-006: a second pull while one runs is ignored', async () => {
    vi.mocked(adminApi.llmLocalPull).mockReturnValue(new Promise<void>(() => {}));
    const { result } = renderHook(() => useLlmParsingConfig(llm()));
    act(() => {
      void result.current.pull('a');
    });
    await act(() => result.current.pull('b'));
    expect(adminApi.llmLocalPull).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-LLMCFG-007: an error frame or a failed pull toasts the message', async () => {
    vi.mocked(adminApi.llmLocalPull).mockImplementation(async (_url, _id, onProgress) => {
      onProgress({ error: 'manifest unknown' });
    });
    const { result } = renderHook(() => useLlmParsingConfig(llm()));
    await act(() => result.current.pull('x'));
    expect(toast.error).toHaveBeenCalledWith('manifest unknown');
    vi.mocked(adminApi.llmLocalPull).mockRejectedValue('nope');
    await act(() => result.current.pull('x'));
    expect(toast.error).toHaveBeenLastCalledWith('Pull failed');
    expect(result.current.pulling).toBeNull();
  });

  it('FE-HOOK-LLMCFG-008: save sends the trimmed config with the masked key unchanged', async () => {
    const { result } = renderHook(() =>
      useLlmParsingConfig(llm({ provider: 'openai', model: ' gpt-4o ', baseUrl: ' https://o/v1 ', apiKey: MASKED }))
    );
    await act(() => result.current.save());
    expect(adminApi.updateAddon).toHaveBeenCalledWith('llm_parsing', {
      config: { provider: 'openai', model: 'gpt-4o', baseUrl: 'https://o/v1', apiKey: MASKED, vision: 'auto' },
    });
    expect(toast.success).toHaveBeenCalledWith('Saved');
    expect(result.current.saving).toBe(false);
  });

  it('FE-HOOK-LLMCFG-009: Anthropic is saved with an empty base URL, whatever was typed before', async () => {
    const { result } = renderHook(() => useLlmParsingConfig(llm({ provider: 'openai', baseUrl: 'https://o/v1' })));
    act(() => {
      result.current.setProvider('anthropic');
      result.current.setVision('off');
    });
    await act(() => result.current.save());
    expect(vi.mocked(adminApi.updateAddon).mock.calls[0][1]).toEqual({
      config: { provider: 'anthropic', model: '', baseUrl: '', apiKey: '', vision: 'off' },
    });
  });

  it('FE-HOOK-LLMCFG-010: a failed save toasts and clears saving', async () => {
    vi.mocked(adminApi.updateAddon).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useLlmParsingConfig(llm({ provider: 'openai' })));
    await act(() => result.current.save());
    expect(toast.error).toHaveBeenCalledWith('Failed to save');
    expect(result.current.saving).toBe(false);
  });
});
