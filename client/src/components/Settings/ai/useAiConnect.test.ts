// FE-HOOK-AI-CONNECT-001 to FE-HOOK-AI-CONNECT-013: pasting a key, an own server, the ChatGPT sign-in and the OpenRouter return.
import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '../../../i18n/TranslationContext';

const repo = vi.hoisted(() => ({
  connectKey: vi.fn(),
  saveAdminConnection: vi.fn(),
  chatgptStart: vi.fn(),
  chatgptFinish: vi.fn(),
  openrouterStart: vi.fn(),
  openrouterFinish: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const { useChatgptConnect, useCustomConnect, useKeyConnect, useOpenrouterReturn, useOpenrouterStart } =
  await import('./useAiConnect');
const { rememberOpenrouterFlow } = await import('./aiConnectModel');

function wrapperAt(url = '/settings') {
  return ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [url] }, createElement(TranslationProvider, null, children));
}

const refused = (code: string) =>
  Object.assign(new Error(code), { response: { status: 422, data: { error: code, code } } });

const FLOW = {
  flowId: '7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f',
  authorizeUrl: 'https://auth.openai.com/api/accounts/authorize?x=1',
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
};
const CALLBACK = 'http://127.0.0.1:1455/auth/callback?code=c1&state=s1&client_id=oaiapp_abc';

beforeEach(() => {
  vi.clearAllMocks();
  repo.connectKey.mockResolvedValue({});
  repo.saveAdminConnection.mockResolvedValue({ connection: null, prefill: null });
  repo.chatgptStart.mockResolvedValue(FLOW);
  repo.chatgptFinish.mockResolvedValue({});
  repo.openrouterFinish.mockResolvedValue({});
});

describe('useKeyConnect', () => {
  it('FE-HOOK-AI-CONNECT-001: a pasted key that names its provider is tested and saved at once', async () => {
    const onConnected = vi.fn();
    const { result } = renderHook(() => useKeyConnect({ scope: 'user', prefill: null, onConnected }), {
      wrapper: wrapperAt(),
    });

    let taken = false;
    act(() => {
      taken = result.current.paste('  sk-ant-api03-abcdef  ');
    });
    expect(taken).toBe(true);
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(repo.connectKey).toHaveBeenCalledWith({ kind: 'anthropic', apiKey: 'sk-ant-api03-abcdef' });
    expect(toast.success).toHaveBeenCalledWith('Connected. Let’s go.');
    expect(result.current.key).toBe('');
  });

  it('FE-HOOK-AI-CONNECT-002: a key with an unknown prefix asks for its provider, and naming it tests the key', async () => {
    const onConnected = vi.fn();
    const { result } = renderHook(() => useKeyConnect({ scope: 'user', prefill: null, onConnected }), {
      wrapper: wrapperAt(),
    });
    expect(result.current.paste('hello world')).toBe(false);
    act(() => result.current.change('abc'));
    expect(result.current.needsProvider).toBe(false);
    act(() => result.current.change('XY.new-format-key'));
    expect(result.current.kind).toBeNull();
    expect(result.current.needsProvider).toBe(true);
    expect(result.current.error).toBeNull();
    await act(() => result.current.submit());
    expect(repo.connectKey).not.toHaveBeenCalled();
    act(() => result.current.pick('gemini'));
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(repo.connectKey).toHaveBeenCalledWith({ kind: 'gemini', apiKey: 'XY.new-format-key' });
  });

  it('FE-HOOK-AI-CONNECT-002b: a provider chosen before pasting takes an unknown key at once; Google’s AQ. keys are known', async () => {
    const { result } = renderHook(() => useKeyConnect({ scope: 'user', prefill: null, onConnected: vi.fn() }), {
      wrapper: wrapperAt(),
    });
    act(() => result.current.change('AQ.Ab8RN6-example'));
    expect(result.current.kind).toBe('gemini');
    act(() => result.current.change(''));
    act(() => result.current.pick('openrouter'));
    expect(repo.connectKey).not.toHaveBeenCalled();
    let taken = false;
    act(() => {
      taken = result.current.paste('unknown-format-key');
    });
    expect(taken).toBe(true);
    await waitFor(() =>
      expect(repo.connectKey).toHaveBeenCalledWith({ kind: 'openrouter', apiKey: 'unknown-format-key' })
    );
  });

  it('FE-HOOK-AI-CONNECT-003: a refused key keeps the form and says why', async () => {
    repo.connectKey.mockRejectedValueOnce(refused('invalid_key'));
    const onConnected = vi.fn();
    const { result } = renderHook(() => useKeyConnect({ scope: 'user', prefill: null, onConnected }), {
      wrapper: wrapperAt(),
    });
    act(() => result.current.change('AIzaSyD-example-key'));
    expect(result.current.kind).toBe('gemini');
    await act(() => result.current.submit());
    expect(result.current.error).toEqual({ messageKey: 'assistant.connect.badKey', code: 'invalid_key' });
    expect(result.current.key).toBe('AIzaSyD-example-key');
    expect(onConnected).not.toHaveBeenCalled();
  });

  it('FE-HOOK-AI-CONNECT-004: the admin saves for everyone and keeps the model AI parsing used for that provider', async () => {
    const prefill = { kind: 'openai' as const, baseUrl: null, model: 'gpt-5.5' };
    const { result } = renderHook(() => useKeyConnect({ scope: 'instance', prefill, onConnected: vi.fn() }), {
      wrapper: wrapperAt(),
    });
    act(() => result.current.change('sk-proj-123456789'));
    await act(() => result.current.submit());
    expect(repo.saveAdminConnection).toHaveBeenCalledWith({
      kind: 'openai',
      apiKey: 'sk-proj-123456789',
      model: 'gpt-5.5',
    });
    expect(repo.connectKey).not.toHaveBeenCalled();

    act(() => result.current.change('sk-ant-123456789'));
    await act(() => result.current.submit());
    expect(repo.saveAdminConnection).toHaveBeenLastCalledWith({ kind: 'anthropic', apiKey: 'sk-ant-123456789' });
  });
});

describe('useCustomConnect', () => {
  it('FE-HOOK-AI-CONNECT-005: an own server needs an http address and a model, the key stays optional', async () => {
    const onConnected = vi.fn();
    const prefill = { kind: 'custom' as const, baseUrl: 'http://ollama:11434/v1', model: 'qwen3:8b' };
    const { result } = renderHook(() => useCustomConnect({ prefill, onConnected }), { wrapper: wrapperAt() });
    expect(result.current.baseUrl).toBe('http://ollama:11434/v1');
    expect(result.current.host).toBe('ollama:11434');
    expect(result.current.ready).toBe(true);

    act(() => result.current.setBaseUrl('ollama:11434'));
    expect(result.current.ready).toBe(false);
    act(() => result.current.setBaseUrl('http://ollama:11434/v1'));
    await act(() => result.current.submit());
    expect(repo.saveAdminConnection).toHaveBeenCalledWith({
      kind: 'custom',
      baseUrl: 'http://ollama:11434/v1',
      model: 'qwen3:8b',
    });
    expect(onConnected).toHaveBeenCalledTimes(1);
  });
});

describe('useChatgptConnect', () => {
  it('FE-HOOK-AI-CONNECT-006: fetches the sign-in address only while its step shows', async () => {
    const { result, rerender } = renderHook(({ active }) => useChatgptConnect({ active, onConnected: vi.fn() }), {
      wrapper: wrapperAt(),
      initialProps: { active: false },
    });
    expect(repo.chatgptStart).not.toHaveBeenCalled();
    rerender({ active: true });
    await waitFor(() => expect(result.current.flow).toEqual(FLOW));
    expect(repo.chatgptStart).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-AI-CONNECT-007: a pasted callback address finishes the sign-in without a click', async () => {
    const onConnected = vi.fn();
    const { result } = renderHook(() => useChatgptConnect({ active: true, onConnected }), { wrapper: wrapperAt() });
    await waitFor(() => expect(result.current.flow).not.toBeNull());

    expect(result.current.paste('https://chatgpt.com/')).toBe(false);
    act(() => {
      result.current.paste(CALLBACK);
    });
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(repo.chatgptFinish).toHaveBeenCalledWith({ flowId: FLOW.flowId, pastedUrl: CALLBACK });
  });

  it('FE-HOOK-AI-CONNECT-008: another address is refused here, before the server is asked', async () => {
    const { result } = renderHook(() => useChatgptConnect({ active: true, onConnected: vi.fn() }), {
      wrapper: wrapperAt(),
    });
    await waitFor(() => expect(result.current.flow).not.toBeNull());
    act(() => result.current.change('http://localhost:1455/auth/callback?code=x'));
    await act(() => result.current.submit());
    expect(result.current.error).toEqual({ messageKey: 'assistant.connect.chatgptWrong', code: 'wrong_url' });
    expect(repo.chatgptFinish).not.toHaveBeenCalled();
  });

  it('FE-HOOK-AI-CONNECT-009: a sign-in that ran out starts a fresh one', async () => {
    repo.chatgptStart.mockResolvedValueOnce({ ...FLOW, expiresAt: new Date(Date.now() - 1000).toISOString() });
    const { result } = renderHook(() => useChatgptConnect({ active: true, onConnected: vi.fn() }), {
      wrapper: wrapperAt(),
    });
    await waitFor(() => expect(result.current.flow).not.toBeNull());
    act(() => result.current.change(CALLBACK));
    await act(() => result.current.submit());
    expect(result.current.error?.code).toBe('expired');
    expect(result.current.pasted).toBe('');
    await waitFor(() => expect(repo.chatgptStart).toHaveBeenCalledTimes(2));
    expect(repo.chatgptFinish).not.toHaveBeenCalled();
  });

  it('FE-HOOK-AI-CONNECT-010: an account ChatGPT will not share says so and keeps the flow', async () => {
    repo.chatgptFinish.mockRejectedValueOnce(refused('not_eligible'));
    const onConnected = vi.fn();
    const { result } = renderHook(() => useChatgptConnect({ active: true, onConnected }), { wrapper: wrapperAt() });
    await waitFor(() => expect(result.current.flow).not.toBeNull());
    act(() => result.current.change(CALLBACK));
    await act(() => result.current.submit());
    expect(result.current.error).toEqual({ messageKey: 'assistant.error.notEligible', code: 'not_eligible' });
    expect(onConnected).not.toHaveBeenCalled();
    expect(repo.chatgptStart).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-AI-CONNECT-013: the clipboard fills the field where the browser lets it be read, else the field gets the cursor', async () => {
    const readText = vi.fn(async () => 'not an address');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText } });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    const { result } = renderHook(() => useChatgptConnect({ active: true, onConnected: vi.fn() }), {
      wrapper: wrapperAt(),
    });
    await waitFor(() => expect(result.current.flow).not.toBeNull());
    const input = document.createElement('input');
    document.body.append(input);
    result.current.inputRef.current = input;

    act(() => result.current.pasteFromClipboard());
    await waitFor(() => expect(result.current.pasted).toBe('not an address'));
    expect(repo.chatgptFinish).not.toHaveBeenCalled();

    // Without a readable clipboard the button and the return from the sign-in window both focus the field.
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
    act(() => result.current.pasteFromClipboard());
    expect(document.activeElement).toBe(input);
    input.blur();
    act(() => {
      result.current.change('');
      result.current.markOpened();
    });
    fireEvent.focus(window);
    expect(document.activeElement).toBe(input);
    expect(readText).toHaveBeenCalledTimes(1);
    input.remove();
  });
});

describe('OpenRouter', () => {
  it('FE-HOOK-AI-CONNECT-011: a refused start tells the user and frees the button', async () => {
    repo.openrouterStart.mockRejectedValueOnce(refused('forbidden'));
    const { result } = renderHook(() => useOpenrouterStart('user'), { wrapper: wrapperAt() });
    await act(() => result.current.start());
    expect(repo.openrouterStart).toHaveBeenCalledWith('user');
    expect(toast.error).toHaveBeenCalledWith('Something went wrong.');
    expect(result.current.busy).toBe(false);
  });

  it('FE-HOOK-AI-CONNECT-012: the return finishes the remembered flow once and clears the address', async () => {
    rememberOpenrouterFlow(FLOW.flowId);
    const onConnected = vi.fn();
    const { result } = renderHook(
      () => {
        useOpenrouterReturn(onConnected);
        return useLocation();
      },
      { wrapper: wrapperAt('/settings?tab=integrations&ai=openrouter&code=or-code') }
    );
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(repo.openrouterFinish).toHaveBeenCalledWith({ flowId: FLOW.flowId, code: 'or-code' });
    expect(result.current.search).toBe('?tab=integrations');

    vi.clearAllMocks();
    renderHook(() => useOpenrouterReturn(onConnected), { wrapper: wrapperAt('/settings?ai=openrouter&code=again') });
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(repo.openrouterFinish).not.toHaveBeenCalled();
  });
});
