// FE-COMP-AI-CONNECTION-001 to FE-COMP-AI-CONNECTION-007: Settings → Integrations → AI assistant.
import userEvent from '@testing-library/user-event';
import type { AiConnectionView, AiStatusResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAdmin, buildUser } from '../../../../tests/helpers/factories';
import { render, screen, waitFor } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useAssistantStore } from '../../../store/assistantStore';
import { useAuthStore } from '../../../store/authStore';

const repo = vi.hoisted(() => ({
  status: vi.fn(),
  models: vi.fn(),
  setModel: vi.fn(),
  disconnect: vi.fn(),
  chatgptSignOut: vi.fn(),
  connectKey: vi.fn(),
  chatgptStart: vi.fn(),
}));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));

const { default: AiConnectionSection } = await import('./AiConnectionSection');

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

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  useAssistantStore.setState({ status: null });
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  repo.models.mockResolvedValue([{ id: 'claude-sonnet', label: 'Claude Sonnet', supportsTools: true }]);
  repo.disconnect.mockResolvedValue(undefined);
  repo.chatgptStart.mockResolvedValue({
    flowId: '7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f',
    authorizeUrl: 'https://auth.openai.com/api/accounts/authorize?x=1',
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  });
});

describe('AiConnectionSection', () => {
  it('FE-COMP-AI-CONNECTION-001: without a connection the card is the setup', async () => {
    repo.status.mockResolvedValue(status());
    render(<AiConnectionSection />);
    expect(await screen.findByText('What would you like to chat with?')).toBeInTheDocument();
    expect(screen.getByText('AI assistant')).toBeInTheDocument();
    expect(screen.queryByText('Set up for everyone')).not.toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECTION-002: an own key shows who answers, its model, and disconnects after asking', async () => {
    const user = userEvent.setup();
    repo.status.mockResolvedValueOnce(status({ own: OWN, available: true })).mockResolvedValue(status());
    render(<AiConnectionSection />);
    expect(await screen.findByText('Connected to Anthropic')).toBeInTheDocument();
    expect(screen.getByText('…a1b2')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Chats are deleted after 90 days.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Disconnect/ }));
    expect(screen.getByText('Disconnect Anthropic? Your chats stay.')).toBeInTheDocument();
    const confirm = screen.getAllByRole('button', { name: /Disconnect/ });
    await user.click(confirm[confirm.length - 1]);
    await waitFor(() => expect(repo.disconnect).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('What would you like to chat with?')).toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECTION-003: a ChatGPT sign-in signs out instead of disconnecting', async () => {
    repo.status.mockResolvedValue(
      status({ own: { ...OWN, kind: 'chatgpt', hint: 'me@example.org', host: 'api.openai.com' }, available: true })
    );
    render(<AiConnectionSection />);
    expect(await screen.findByText('Connected to ChatGPT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign out/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Disconnect/ })).not.toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECTION-004: a key that stopped working says so and opens the key field to replace it', async () => {
    const user = userEvent.setup();
    repo.status.mockResolvedValue(status({ own: { ...OWN, status: 'error' } }));
    render(<AiConnectionSection />);
    expect(await screen.findByText('Your Anthropic key doesn’t work anymore.')).toBeInTheDocument();
    expect(screen.queryByText('Model')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Replace key' }));
    expect(screen.getByPlaceholderText('Paste your key here')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText('Paste your key here')).not.toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECTION-005: the admin connection shows with today’s share, and one’s own can still be added', async () => {
    const user = userEvent.setup();
    repo.status.mockResolvedValue(
      status({
        instance: { kind: 'openai', model: 'gpt-5.5', host: 'api.openai.com' },
        quota: { used: 3, limit: 50 },
        available: true,
      })
    );
    render(<AiConnectionSection />);
    expect(await screen.findByText('Provided by your admin')).toBeInTheDocument();
    expect(screen.getByText('OpenAI, gpt-5.5')).toBeInTheDocument();
    expect(screen.getByText('3 of 50 messages used today')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect your own provider' }));
    expect(screen.getByText('What would you like to chat with?')).toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECTION-006: only the admin policy hides the setup, and an admin is sent to set it up for everyone', async () => {
    seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
    repo.status.mockResolvedValue(status({ policy: 'instance', canConnectOwn: false }));
    render(<AiConnectionSection />);
    expect(await screen.findByText('Your admin sets this up.')).toBeInTheDocument();
    expect(screen.queryByText('What would you like to chat with?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set up for everyone' })).toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECTION-007: a refused status keeps the card away', async () => {
    repo.status.mockRejectedValue(new Error('404'));
    const { container } = render(<AiConnectionSection />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
