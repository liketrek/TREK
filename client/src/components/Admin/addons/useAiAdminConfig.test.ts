// FE-HOOK-AI-ADMIN-001 to FE-HOOK-AI-ADMIN-007: the AI assistant's settings and connection for everyone.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { AiAdminConnectionResponse, AiAdminSettings } from '@trek/shared';
import { MASKED_SETTING_VALUE } from '@trek/shared';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { useAssistantStore } from '../../../store/assistantStore';

const repo = vi.hoisted(() => ({
  status: vi.fn(),
  adminSettings: vi.fn(),
  saveAdminSettings: vi.fn(),
  adminConnection: vi.fn(),
  saveAdminConnection: vi.fn(),
  removeAdminConnection: vi.fn(),
  adminModels: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const { useAiAdminConfig } = await import('./useAiAdminConfig');

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    MemoryRouter,
    { initialEntries: ['/admin?tab=addons'] },
    createElement(TranslationProvider, null, children)
  );

const SETTINGS: AiAdminSettings = {
  policy: 'instance_or_user',
  dailyTurns: 50,
  webSearch: true,
  retention: { mode: 'days', days: 90 },
};
const NONE: AiAdminConnectionResponse = { connection: null, prefill: null };
const LIVE: AiAdminConnectionResponse = {
  connection: {
    scope: 'instance',
    kind: 'anthropic',
    model: 'claude-sonnet',
    hint: '…a1b2',
    status: 'ok',
    host: 'api.anthropic.com',
    baseUrl: null,
  },
  prefill: null,
};

async function renderLoaded() {
  const view = renderHook(() => useAiAdminConfig(), { wrapper });
  await waitFor(() => expect(view.result.current.loaded).toBe(true));
  return view;
}

beforeEach(() => {
  vi.clearAllMocks();
  useAssistantStore.setState({ status: null });
  repo.status.mockRejectedValue(new Error('not needed'));
  repo.adminSettings.mockResolvedValue(SETTINGS);
  repo.saveAdminSettings.mockImplementation(async (next: AiAdminSettings) => next);
  repo.adminConnection.mockResolvedValue(NONE);
  repo.saveAdminConnection.mockResolvedValue(LIVE);
  repo.removeAdminConnection.mockResolvedValue(undefined);
  repo.adminModels.mockResolvedValue([{ id: 'claude-sonnet', label: 'Claude Sonnet', supportsTools: true }]);
});

describe('useAiAdminConfig', () => {
  it('FE-HOOK-AI-ADMIN-001: loads the settings and, without a connection, opens the setup for everyone', async () => {
    const { result } = await renderLoaded();
    expect(result.current.policy).toBe('instance_or_user');
    expect(result.current.policyHintKey).toBe('assistant.admin.policy.instanceOrUserHint');
    expect(result.current.instancePays).toBe(true);
    expect(result.current.showPanel).toBe(true);
    expect(result.current.dailyDraft).toBe('50');
    expect(result.current.retention).toBe('90');
    expect(result.current.retentionOptions.map((o) => o.label)).toEqual(['30 days', '90 days', '365 days', 'Forever']);
    expect(repo.status).toHaveBeenCalled();
  });

  it('FE-HOOK-AI-ADMIN-002: a policy change saves at once, and a refused one is taken back', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.setPolicy('user'));
    await waitFor(() => expect(result.current.policy).toBe('user'));
    expect(repo.saveAdminSettings).toHaveBeenCalledWith({ ...SETTINGS, policy: 'user' });
    expect(result.current.instancePays).toBe(false);

    repo.saveAdminSettings.mockRejectedValueOnce(new Error('nope'));
    await act(async () => result.current.setPolicy('instance'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(result.current.policy).toBe('user');
  });

  it('FE-HOOK-AI-ADMIN-003: the daily limit is kept within 1 to 10000 and saved when the field is left', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setDailyDraft('20000'));
    await act(async () => result.current.commitDailyLimit());
    expect(result.current.dailyDraft).toBe('10000');
    expect(repo.saveAdminSettings).toHaveBeenCalledWith({ ...SETTINGS, dailyTurns: 10000 });

    vi.clearAllMocks();
    act(() => result.current.setDailyDraft(''));
    await act(async () => result.current.commitDailyLimit());
    expect(result.current.dailyDraft).toBe('10000');
    expect(repo.saveAdminSettings).not.toHaveBeenCalled();
  });

  it('FE-HOOK-AI-ADMIN-004: a retention period set elsewhere stays selectable', async () => {
    repo.adminSettings.mockResolvedValue({ ...SETTINGS, retention: { mode: 'days', days: 120 } });
    const { result } = await renderLoaded();
    expect(result.current.retentionOptions.map((o) => o.value)).toEqual(['30', '90', '120', '365', 'forever']);
    await act(async () => result.current.setRetention('forever'));
    expect(repo.saveAdminSettings).toHaveBeenCalledWith({ ...SETTINGS, retention: { mode: 'forever' } });
  });

  it('FE-HOOK-AI-ADMIN-005: another model keeps the stored key by sending the mask', async () => {
    repo.adminConnection.mockResolvedValue(LIVE);
    const { result } = await renderLoaded();
    expect(result.current.showPanel).toBe(false);
    await waitFor(() => expect(result.current.instance.models).toHaveLength(1));
    await act(async () => result.current.instance.setModel('claude-haiku'));
    await waitFor(() => expect(repo.saveAdminConnection).toHaveBeenCalledTimes(1));
    expect(repo.saveAdminConnection).toHaveBeenCalledWith({
      kind: 'anthropic',
      apiKey: MASKED_SETTING_VALUE,
      model: 'claude-haiku',
    });
  });

  it('FE-HOOK-AI-ADMIN-006: an own server without a key sends none', async () => {
    repo.adminConnection.mockResolvedValue({
      connection: {
        scope: 'instance',
        kind: 'custom',
        model: 'llama3',
        hint: null,
        status: 'ok',
        host: 'ollama:11434',
        baseUrl: 'http://ollama:11434/v1',
      },
      prefill: null,
    });
    const { result } = await renderLoaded();
    await act(async () => result.current.instance.setModel('qwen3:8b'));
    await waitFor(() => expect(repo.saveAdminConnection).toHaveBeenCalledTimes(1));
    expect(repo.saveAdminConnection).toHaveBeenCalledWith({
      kind: 'custom',
      baseUrl: 'http://ollama:11434/v1',
      model: 'qwen3:8b',
    });
  });

  it('FE-HOOK-AI-ADMIN-007: removing asks first, then shows the setup again; replacing opens it beside the old one', async () => {
    repo.adminConnection.mockResolvedValueOnce(LIVE).mockResolvedValue(NONE);
    const { result } = await renderLoaded();
    act(() => result.current.instance.replace());
    expect(result.current.showPanel).toBe(true);
    act(() => result.current.instance.cancelReplace());
    expect(result.current.showPanel).toBe(false);

    act(() => result.current.instance.askRemove());
    expect(result.current.instance.confirmingRemove).toBe(true);
    act(() => result.current.instance.remove());
    await waitFor(() => expect(result.current.instance.live).toBeNull());
    expect(repo.removeAdminConnection).toHaveBeenCalledTimes(1);
    expect(result.current.instance.confirmingRemove).toBe(false);
    expect(result.current.showPanel).toBe(true);
  });
});
