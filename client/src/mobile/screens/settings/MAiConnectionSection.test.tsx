// FE-MOB-AI-CONNECTION-001 to FE-MOB-AI-CONNECTION-003: the phone's AI assistant card.
import userEvent from '@testing-library/user-event';
import type { AiConnectionView, AiStatusResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/helpers/render';
import { useAssistantStore } from '../../../store/assistantStore';

const repo = vi.hoisted(() => ({
  status: vi.fn(),
  models: vi.fn(),
  setModel: vi.fn(),
  disconnect: vi.fn(),
  chatgptSignOut: vi.fn(),
}));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));

const { default: MAiConnectionSection } = await import('./MAiConnectionSection');

const OWN: AiConnectionView = {
  scope: 'user',
  kind: 'gemini',
  model: 'gemini-flash',
  hint: '…77aa',
  status: 'ok',
  host: 'generativelanguage.googleapis.com',
};

function status(over: Partial<AiStatusResponse> = {}): AiStatusResponse {
  return {
    available: true,
    policy: 'instance_or_user',
    canConnectOwn: true,
    effective: null,
    own: null,
    instance: null,
    quota: null,
    privacyAcked: true,
    retention: { mode: 'forever' },
    openrouterOAuth: false,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAssistantStore.setState({ status: null });
  repo.models.mockResolvedValue([
    { id: 'gemini-flash', label: 'Gemini Flash', supportsTools: true, free: true },
    { id: 'gemini-pro', label: 'Gemini Pro', supportsTools: true },
  ]);
  repo.setModel.mockResolvedValue({ ...OWN, model: 'gemini-pro' });
});

describe('MAiConnectionSection', () => {
  it('FE-MOB-AI-CONNECTION-001: an own connection shows its model and picks another from a sheet', async () => {
    const user = userEvent.setup();
    repo.status.mockResolvedValue(status({ own: OWN }));
    render(<MAiConnectionSection />);
    expect(await screen.findByText('Connected to Gemini')).toBeInTheDocument();
    expect(screen.getByText('Chats are kept until you delete them.')).toBeInTheDocument();
    await waitFor(() => expect(repo.models).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'gemini-flash' }));
    await user.click(await screen.findByText('Gemini Pro'));
    await waitFor(() => expect(repo.setModel).toHaveBeenCalledWith('gemini-pro'));
  });

  it('FE-MOB-AI-CONNECTION-002: the admin connection shows with today’s share', async () => {
    repo.status.mockResolvedValue(
      status({
        instance: { kind: 'anthropic', model: 'claude-haiku', host: 'api.anthropic.com' },
        quota: { used: 1, limit: 1 },
      })
    );
    render(<MAiConnectionSection />);
    expect(await screen.findByText('Provided by your admin')).toBeInTheDocument();
    expect(screen.getByText('Anthropic, claude-haiku')).toBeInTheDocument();
    expect(screen.getByText('1 of 1 message used today')).toBeInTheDocument();
  });

  it('FE-MOB-AI-CONNECTION-003: nothing connected shows the shared setup', async () => {
    repo.status.mockResolvedValue(status({ available: false }));
    render(<MAiConnectionSection />);
    expect(await screen.findByText('What would you like to chat with?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Paste an API key/ })).toBeInTheDocument();
  });
});
