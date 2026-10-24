// FE-HOOK-AI-CONNECTIONS-001 to FE-HOOK-AI-CONNECTIONS-010: the AI connection card's states and actions.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { AiConnectionView, AiStatusResponse } from '@trek/shared';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { useAssistantStore } from '../../../store/assistantStore';

const repo = vi.hoisted(() => ({
  status: vi.fn(),
  models: vi.fn(),
  setModel: vi.fn(),
  disconnect: vi.fn(),
  chatgptSignOut: vi.fn(),
}));
const trips = vi.hoisted(() => ({ active: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));
vi.mock('../../../repo/tripRepo', () => ({ tripRepo: trips }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const { modelOptions, useAiConnections } = await import('./useAiConnections');

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    MemoryRouter,
    { initialEntries: ['/settings?tab=integrations'] },
    createElement(TranslationProvider, null, children)
  );

const OWN: AiConnectionView = {
  scope: 'user',
  kind: 'anthropic',
  model: 'claude-sonnet',
  hint: '…a1b2',
  status: 'ok',
  host: 'api.anthropic.com',
};

function status(over: Partial<AiStatusResponse> = {}): AiStatusResponse {
  return {
    available: false,
    policy: 'instance_or_user',
    canConnectOwn: true,
    effective: null,
    own: null,
    instance: null,
    quota: null,
    privacyAcked: false,
    retention: { mode: 'days', days: 90 },
    openrouterOAuth: false,
    ...over,
  };
}

function renderConnections(phone = false) {
  return renderHook(() => ({ hook: useAiConnections({ phone }), location: useLocation() }), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  useAssistantStore.setState({ status: null, window: { open: false, minimized: false } });
  repo.status.mockResolvedValue(status());
  repo.models.mockResolvedValue([
    { id: 'claude-sonnet', label: 'Claude Sonnet', supportsTools: true },
    { id: 'claude-haiku', label: 'Claude Haiku', supportsTools: true },
  ]);
  repo.setModel.mockResolvedValue({ ...OWN, model: 'claude-haiku' });
  repo.disconnect.mockResolvedValue(undefined);
  repo.chatgptSignOut.mockResolvedValue(undefined);
});

describe('useAiConnections', () => {
  it('FE-HOOK-AI-CONNECTIONS-001: nothing connected opens the setup right away', async () => {
    const { result } = renderConnections();
    expect(result.current.hook.view).toBe('loading');
    await waitFor(() => expect(result.current.hook.view).toBe('setup'));
    expect(result.current.hook.panel).toBe(true);
    expect(result.current.hook.retentionText).toBe('Chats are deleted after 90 days.');
  });

  it('FE-HOOK-AI-CONNECTIONS-002: tells the admin connection, the admin-only policy and a refused status apart', async () => {
    const instance = { kind: 'openai' as const, model: 'gpt-5.5', host: 'api.openai.com' };
    repo.status.mockResolvedValueOnce(status({ instance, quota: { used: 3, limit: 50 }, available: true }));
    const a = renderConnections();
    await waitFor(() => expect(a.result.current.hook.view).toBe('instance'));
    expect(a.result.current.hook.instanceProvider).toBe('OpenAI');
    expect(a.result.current.hook.panel).toBe(false);
    act(() => a.result.current.hook.connectOwn());
    expect(a.result.current.hook.panel).toBe(true);
    a.unmount();

    repo.status.mockResolvedValueOnce(status({ policy: 'instance', canConnectOwn: false }));
    const b = renderConnections();
    await waitFor(() => expect(b.result.current.hook.view).toBe('adminOnly'));
    b.unmount();

    repo.status.mockRejectedValueOnce(new Error('404'));
    useAssistantStore.setState({ status: null });
    const c = renderConnections();
    await waitFor(() => expect(c.result.current.hook.view).toBe('hidden'));
  });

  it('FE-HOOK-AI-CONNECTIONS-003: an own connection lists its models with the current one first known', async () => {
    repo.status.mockResolvedValue(status({ own: OWN, available: true }));
    const { result } = renderConnections();
    await waitFor(() => expect(result.current.hook.ownActions.models).toHaveLength(2));
    expect(result.current.hook.view).toBe('own');
    expect(result.current.hook.ownActions.provider).toBe('Anthropic');
    expect(result.current.hook.repairMode).toBeNull();
    expect(repo.models).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-AI-CONNECTIONS-004: switching the model saves it and reads the status again', async () => {
    repo.status.mockResolvedValue(status({ own: OWN, available: true }));
    const { result } = renderConnections();
    await waitFor(() => expect(result.current.hook.view).toBe('own'));
    await act(() => result.current.hook.ownActions.setModel('claude-haiku'));
    expect(repo.setModel).toHaveBeenCalledWith('claude-haiku');
    expect(repo.status).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith('Saved');
  });

  it('FE-HOOK-AI-CONNECTIONS-005: disconnecting asks first, then removes the connection', async () => {
    repo.status.mockResolvedValue(status({ own: OWN, available: true }));
    const { result } = renderConnections();
    await waitFor(() => expect(result.current.hook.view).toBe('own'));
    act(() => result.current.hook.ownActions.askDisconnect());
    expect(result.current.hook.ownActions.confirmingDisconnect).toBe(true);
    repo.status.mockResolvedValue(status());
    await act(() => result.current.hook.ownActions.disconnect());
    expect(repo.disconnect).toHaveBeenCalledTimes(1);
    expect(result.current.hook.ownActions.confirmingDisconnect).toBe(false);
    expect(result.current.hook.view).toBe('setup');
  });

  it('FE-HOOK-AI-CONNECTIONS-006: a refused action keeps the connection and names the provider', async () => {
    repo.status.mockResolvedValue(status({ own: OWN, available: true }));
    repo.setModel.mockRejectedValueOnce({
      response: { status: 502, data: { error: 'down', code: 'provider_unavailable' } },
    });
    const { result } = renderConnections();
    await waitFor(() => expect(result.current.hook.view).toBe('own'));
    await act(() => result.current.hook.ownActions.setModel('claude-haiku'));
    expect(toast.error).toHaveBeenCalledWith('Anthropic isn’t responding right now.');
    expect(result.current.hook.ownActions.busy).toBe(false);
  });

  it('FE-HOOK-AI-CONNECTIONS-007: a broken sign-in offers the way back in on its own form', async () => {
    repo.status.mockResolvedValue(
      status({ own: { ...OWN, kind: 'chatgpt', status: 'needs_reauth', host: 'api.openai.com' } })
    );
    const { result } = renderConnections();
    await waitFor(() => expect(result.current.hook.repairMode).toBe('chatgpt'));
    expect(repo.models).not.toHaveBeenCalled();
    act(() => result.current.hook.repair('chatgpt'));
    expect(result.current.hook.panel).toBe(true);
    expect(result.current.hook.panelMode).toBe('chatgpt');
    act(() => result.current.hook.closePanel());
    expect(result.current.hook.panel).toBe(false);
  });

  it('FE-HOOK-AI-CONNECTIONS-008: "Open assistant" opens the chat on the trip under way, else on the dashboard', async () => {
    repo.status.mockResolvedValue(status({ own: OWN, available: true }));
    trips.active.mockResolvedValueOnce({ trip: { id: 7, title: 'Kyoto', start_date: null, end_date: null } });
    const { result } = renderConnections();
    await waitFor(() => expect(result.current.hook.canOpen).toBe(true));
    act(() => result.current.hook.openAssistant());
    await waitFor(() => expect(result.current.location.pathname).toBe('/trips/7'));
    expect(result.current.location.search).toBe('?assistant=1');
    // The planner opens it from the link, so a trip that never loads leaves nothing open.
    expect(useAssistantStore.getState().window.open).toBe(false);

    trips.active.mockResolvedValueOnce({ trip: null });
    act(() => result.current.hook.openAssistant());
    await waitFor(() => expect(result.current.location.pathname).toBe('/dashboard'));
    expect(useAssistantStore.getState().window.open).toBe(true);
  });

  it('FE-HOOK-AI-CONNECTIONS-010: on the phone without a trip it says to make one, and opens nothing', async () => {
    repo.status.mockResolvedValue(status({ own: OWN, available: true }));
    trips.active.mockResolvedValueOnce({ trip: null });
    const { result } = renderConnections(true);
    await waitFor(() => expect(result.current.hook.canOpen).toBe(true));
    act(() => result.current.hook.openAssistant());
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('Create a trip first, then the assistant can help you plan it.')
    );
    expect(result.current.location.pathname).toBe('/settings');
    expect(useAssistantStore.getState().window.open).toBe(false);
  });
});

describe('modelOptions', () => {
  it('FE-HOOK-AI-CONNECTIONS-009: keeps the current model selectable when the provider no longer lists it, and marks free ones', () => {
    const models = [{ id: 'a', label: 'A', supportsTools: true, free: true }];
    const labels = { free: 'Free', recommended: 'Recommended' };
    expect(modelOptions(models, 'a', labels)).toEqual([{ value: 'a', label: 'A', badge: 'Free' }]);
    expect(modelOptions([{ id: 'b', label: 'B', supportsTools: true, recommended: true }], 'b', labels)).toEqual([
      { value: 'b', label: 'B', badge: 'Recommended' },
    ]);
    expect(modelOptions(models, 'old', labels)).toEqual([
      { value: 'old', label: 'old', badge: undefined },
      { value: 'a', label: 'A', badge: 'Free' },
    ]);
  });
});
