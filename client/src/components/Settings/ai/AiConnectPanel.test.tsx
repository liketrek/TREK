// FE-COMP-AI-CONNECT-PANEL-001 to FE-COMP-AI-CONNECT-PANEL-009: the mode tiles, the key field, the ChatGPT paste step.
import userEvent from '@testing-library/user-event';
import type { AiStatusResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../../tests/helpers/render';
import { resetAllStores } from '../../../../tests/helpers/store';
import { useAssistantStore } from '../../../store/assistantStore';

const repo = vi.hoisted(() => ({
  connectKey: vi.fn(),
  saveAdminConnection: vi.fn(),
  chatgptStart: vi.fn(),
  chatgptFinish: vi.fn(),
  openrouterStart: vi.fn(),
}));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));

const { default: AiConnectPanel } = await import('./AiConnectPanel');

const FLOW = {
  flowId: '7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f',
  authorizeUrl: 'https://auth.openai.com/api/accounts/authorize?x=1',
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
};
const CALLBACK = 'http://127.0.0.1:1455/auth/callback?code=c1&state=s1&client_id=oaiapp_abc';

function seedStatus(over: Partial<AiStatusResponse> = {}) {
  useAssistantStore.setState({
    status: {
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
    },
  });
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStatus();
  repo.connectKey.mockResolvedValue({});
  repo.chatgptStart.mockResolvedValue(FLOW);
  repo.chatgptFinish.mockResolvedValue({});
});

describe('AiConnectPanel', () => {
  it('FE-COMP-AI-CONNECT-PANEL-001: a user picks between ChatGPT and a key, nothing opens by itself', () => {
    render(<AiConnectPanel scope="user" onConnected={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Sign in with ChatGPT/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Paste an API key/ })).toBeInTheDocument();
    expect(screen.queryByText('Own server')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Paste your key here')).not.toBeInTheDocument();
    expect(repo.chatgptStart).not.toHaveBeenCalled();
  });

  it('FE-COMP-AI-CONNECT-PANEL-002: the admin picks between a key, their ChatGPT plan and an own server, prefilled from AI parsing', () => {
    render(
      <AiConnectPanel
        scope="instance"
        onConnected={vi.fn()}
        prefill={{ kind: 'custom', baseUrl: 'http://ollama:11434/v1', model: 'qwen3:8b' }}
      />
    );
    expect(screen.getByRole('button', { name: /Paste an API key/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Sign in with ChatGPT/ })).toHaveAttribute('aria-pressed', 'false');
    expect(repo.chatgptStart).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Own server/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Taken over from AI Parsing.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('http://ollama:11434/v1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('qwen3:8b')).toBeInTheDocument();
    expect(
      screen.getByText('Your messages and the trip data the assistant reads go to ollama:11434.')
    ).toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECT-PANEL-003: a typed key names its provider and the privacy line names it too', async () => {
    const user = userEvent.setup();
    render(<AiConnectPanel scope="user" onConnected={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Paste an API key/ }));
    expect(screen.getByRole('link', { name: /Gemini/ })).toHaveAttribute(
      'href',
      'https://aistudio.google.com/app/apikey'
    );

    await user.type(screen.getByPlaceholderText('Paste your key here'), 'sk-ant-api03-abc');
    expect(screen.getByText('Detected: Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Claude Max and Team include API credits.')).toBeInTheDocument();
    expect(
      screen.getByText('Your messages and the trip data the assistant reads go to Anthropic.')
    ).toBeInTheDocument();
    expect(repo.connectKey).not.toHaveBeenCalled();
  });

  it('FE-COMP-AI-CONNECT-PANEL-004: pasting a key connects without a click', async () => {
    const user = userEvent.setup();
    const onConnected = vi.fn();
    render(<AiConnectPanel scope="user" onConnected={onConnected} initialMode="key" />);
    await user.click(screen.getByPlaceholderText('Paste your key here'));
    await user.paste('sk-or-v1-0123456789');
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(repo.connectKey).toHaveBeenCalledWith({ kind: 'openrouter', apiKey: 'sk-or-v1-0123456789' });
  });

  it('FE-COMP-AI-CONNECT-PANEL-005: the ChatGPT step links the prefetched sign-in and finishes on paste', async () => {
    const user = userEvent.setup();
    const onConnected = vi.fn();
    render(<AiConnectPanel scope="user" onConnected={onConnected} />);
    await user.click(screen.getByRole('button', { name: /Sign in with ChatGPT/ }));
    const open = await screen.findByRole('link', { name: /Open ChatGPT sign-in/ });
    await waitFor(() => expect(open).toHaveAttribute('href', FLOW.authorizeUrl));
    expect(open).toHaveAttribute('target', '_blank');

    await user.click(screen.getByRole('textbox', { name: 'Paste address' }));
    await user.paste(CALLBACK);
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(repo.chatgptFinish).toHaveBeenCalledWith({ flowId: FLOW.flowId, pastedUrl: CALLBACK });
  });

  it('FE-COMP-AI-CONNECT-PANEL-005b: the sign-in opens in a small window, and coming back takes the copied address', async () => {
    const user = userEvent.setup();
    const onConnected = vi.fn();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const readText = vi.fn(async () => CALLBACK);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText } });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    render(<AiConnectPanel scope="user" onConnected={onConnected} />);
    await user.click(screen.getByRole('button', { name: /Sign in with ChatGPT/ }));
    const open = await screen.findByRole('link', { name: /Open ChatGPT sign-in/ });
    await waitFor(() => expect(open).toHaveAttribute('href', FLOW.authorizeUrl));
    await user.click(open);
    expect(opened).toHaveBeenCalledWith(FLOW.authorizeUrl, 'trek-chatgpt', expect.stringContaining('popup'));

    fireEvent.focus(window);
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(repo.chatgptFinish).toHaveBeenCalledWith({ flowId: FLOW.flowId, pastedUrl: CALLBACK });
    opened.mockRestore();
  });

  it('FE-COMP-AI-CONNECT-PANEL-006: an account ChatGPT will not share offers another provider, which opens the key field', async () => {
    repo.chatgptFinish.mockRejectedValueOnce({
      response: { status: 403, data: { error: 'no', code: 'not_eligible' } },
    });
    const user = userEvent.setup();
    render(<AiConnectPanel scope="user" onConnected={vi.fn()} initialMode="chatgpt" />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Open ChatGPT sign-in/ })).toHaveAttribute('href', FLOW.authorizeUrl)
    );
    await user.click(screen.getByRole('textbox', { name: 'Paste address' }));
    await user.paste(CALLBACK);

    expect(await screen.findByText('This ChatGPT account can’t be used here.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose another provider' }));
    expect(screen.getByPlaceholderText('Paste your key here')).toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECT-PANEL-007: OpenRouter sign-in shows only where OpenRouter can return to', async () => {
    const { unmount } = render(<AiConnectPanel scope="user" onConnected={vi.fn()} initialMode="key" />);
    expect(screen.queryByRole('button', { name: /Connect OpenRouter/ })).not.toBeInTheDocument();
    unmount();

    seedStatus({ openrouterOAuth: true });
    render(<AiConnectPanel scope="user" onConnected={vi.fn()} initialMode="key" />);
    expect(screen.getByRole('button', { name: /Connect OpenRouter/ })).toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECT-PANEL-008: the sharing details fold out', async () => {
    const user = userEvent.setup();
    render(<AiConnectPanel scope="user" onConnected={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /What gets shared\?/ }));
    expect(screen.getByText('Not your password, your files or your other trips.')).toBeInTheDocument();
  });

  it('FE-COMP-AI-CONNECT-PANEL-009: the admin signing in with ChatGPT is told the plan is shared, and the sign-in is for everyone', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AiConnectPanel scope="user" onConnected={vi.fn()} initialMode="chatgpt" />);
    await waitFor(() => expect(repo.chatgptStart).toHaveBeenCalledWith('user'));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    unmount();

    render(<AiConnectPanel scope="instance" onConnected={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Sign in with ChatGPT/ }));
    expect(screen.getByRole('note')).toHaveTextContent(
      'You share your own ChatGPT plan with everyone on this server: their chats count against your plan.'
    );
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Open ChatGPT sign-in/ })).toHaveAttribute('href', FLOW.authorizeUrl)
    );
    expect(repo.chatgptStart).toHaveBeenLastCalledWith('instance');
  });
});
