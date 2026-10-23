// FE-COMP-AI-ADMIN-001 to FE-COMP-AI-ADMIN-020: the AI settings dialog behind the AI tile.
import userEvent from '@testing-library/user-event';
import type { AiAdminConnectionResponse, AiAdminSettings } from '@trek/shared';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../../tests/helpers/render';
import { useAssistantStore } from '../../../store/assistantStore';
import { ToastContainer } from '../../shared/Toast';
import type { Addon } from './addonModel';

const repo = vi.hoisted(() => ({
  status: vi.fn(),
  adminSettings: vi.fn(),
  saveAdminSettings: vi.fn(),
  adminConnection: vi.fn(),
  saveAdminConnection: vi.fn(),
  removeAdminConnection: vi.fn(),
  adminModels: vi.fn(),
}));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));

const { default: AiSettingsDialog } = await import('./AiAdminConfig');

const SETTINGS: AiAdminSettings = { policy: 'instance_or_user', dailyTurns: 50, retention: { mode: 'days', days: 90 } };
const LIVE: AiAdminConnectionResponse = {
  connection: {
    scope: 'instance',
    kind: 'openai',
    model: 'gpt-5.5',
    hint: '…9f3c',
    status: 'ok',
    host: 'api.openai.com',
    baseUrl: null,
  },
  prefill: null,
};

function addon(id: string, enabled: boolean, config?: Record<string, unknown>): Addon {
  return { id, name: id, description: '', icon: 'Sparkles', type: 'integration', enabled, config } as Addon;
}

const ASSISTANT = addon('ai_assistant', true);
const parsing = (config: Record<string, unknown> = {}) => addon('llm_parsing', true, config);

function renderDialog(addons: Addon[] = [ASSISTANT]) {
  const onClose = vi.fn();
  render(
    <>
      <ToastContainer />
      <AiSettingsDialog addons={addons} onClose={onClose} />
    </>
  );
  return { onClose };
}

/** The dialog opened on AI parsing's tab. */
async function renderParsing(config: Record<string, unknown> = {}) {
  const user = userEvent.setup();
  renderDialog([ASSISTANT, parsing(config)]);
  await user.click(await screen.findByRole('button', { name: 'AI Parsing' }));
  return user;
}

function modelsRoute(names: string[], seen?: (string | null)[]) {
  return http.get('/api/admin/llm/local/models', ({ request }) => {
    seen?.push(new URL(request.url).searchParams.get('baseUrl'));
    return HttpResponse.json({ models: names.map((name) => ({ name, size: 1 })) });
  });
}

function saveRoute(bodies: unknown[], fail = false) {
  return http.put('/api/admin/addons/llm_parsing', async ({ request }) => {
    bodies.push(await request.json());
    return fail ? HttpResponse.error() : HttpResponse.json({ success: true });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useAssistantStore.setState({ status: null });
  repo.status.mockRejectedValue(new Error('not needed'));
  repo.adminSettings.mockResolvedValue(SETTINGS);
  repo.saveAdminSettings.mockImplementation(async (next: AiAdminSettings) => next);
  repo.adminConnection.mockResolvedValue({ connection: null, prefill: null });
  repo.removeAdminConnection.mockResolvedValue(undefined);
  repo.adminModels.mockResolvedValue([{ id: 'gpt-5.5', label: 'GPT-5.5', supportsTools: true }]);
});

describe('the connection and the assistant', () => {
  it('FE-COMP-AI-ADMIN-001: shows who pays and the setup for everyone, the limits on the assistant tab', async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(await screen.findByRole('radio', { name: 'I pay, own allowed' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Everyone uses the connection below unless they connect their own.')).toBeInTheDocument();
    expect(screen.getByText('No connection yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Own server/ })).toBeInTheDocument();
    // The admin may share their own ChatGPT plan with everyone, so its tile is offered too.
    expect(screen.getByRole('button', { name: /Sign in with ChatGPT/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'AI Assistant' }));
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByText('Keep chats')).toBeInTheDocument();
  });

  it('FE-COMP-AI-ADMIN-002: "Everyone uses their own" drops the connection and the limit', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(await screen.findByRole('radio', { name: 'Everyone uses their own account' }));
    await waitFor(() => expect(screen.queryByText('No connection yet.')).not.toBeInTheDocument());
    expect(repo.saveAdminSettings).toHaveBeenCalledWith({ ...SETTINGS, policy: 'user' });
    expect(screen.getByText('Everyone connects their own provider. Nothing is charged to you.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'AI Assistant' }));
    expect(screen.queryByText('Messages per person per day')).not.toBeInTheDocument();
  });

  it('FE-COMP-AI-ADMIN-003: a live connection shows its provider and opens the setup only to change it', async () => {
    const user = userEvent.setup();
    repo.adminConnection.mockResolvedValue(LIVE);
    renderDialog();
    expect(await screen.findByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('…9f3c')).toBeInTheDocument();
    expect(screen.queryByText('What would you like to chat with?')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByText('What would you like to chat with?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('FE-COMP-AI-ADMIN-004: removing the connection asks first', async () => {
    const user = userEvent.setup();
    repo.adminConnection.mockResolvedValueOnce(LIVE).mockResolvedValue({ connection: null, prefill: null });
    renderDialog();
    await user.click(await screen.findByRole('button', { name: 'Remove connection' }));
    expect(screen.getByText('Disconnect OpenAI? Your chats stay.')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Remove connection' });
    await user.click(buttons[buttons.length - 1]);
    expect(await screen.findByText('No connection yet.')).toBeInTheDocument();
    expect(repo.removeAdminConnection).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-AI-ADMIN-005: a tab shows only while its addon is on, and Close closes', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog([addon('ai_assistant', false), parsing()]);
    expect(await screen.findByRole('button', { name: 'AI Parsing' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AI Assistant' })).not.toBeInTheDocument();
    const closes = screen.getAllByRole('button', { name: 'Close' });
    await user.click(closes[closes.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AI parsing', () => {
  it('FE-COMP-AI-ADMIN-010: without its own connection parsing reads with the shared one, and can be given its own', async () => {
    repo.adminConnection.mockResolvedValue(LIVE);
    server.use(modelsRoute([]));
    const user = await renderParsing({ vision: 'auto' });
    expect(await screen.findByText('Shared')).toBeInTheDocument();
    expect(screen.getByText('gpt-5.5')).toBeInTheDocument();
    expect(screen.queryByLabelText('Model')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use a different one' }));
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Model')).not.toBeInTheDocument();
  });

  it('FE-COMP-AI-ADMIN-011: with no connection anywhere it says so and leads to the connection tab', async () => {
    const user = await renderParsing();
    expect(
      await screen.findByText('No connection yet. Set one up for everyone, or give AI parsing its own.')
    ).toBeInTheDocument();
    // The link in the hint, not the tab of the same name above it.
    const link = screen.getAllByRole('button', { name: 'Connection' }).find((b) => !b.hasAttribute('aria-pressed'));
    await user.click(link as HTMLElement);
    expect(await screen.findByRole('radio', { name: 'I pay, own allowed' })).toBeInTheDocument();
  });

  it('FE-COMP-AI-ADMIN-012: an own connection is shown as such and goes back to the shared one, keeping the vision setting', async () => {
    const bodies: unknown[] = [];
    repo.adminConnection.mockResolvedValue(LIVE);
    server.use(modelsRoute([]), saveRoute(bodies));
    const user = await renderParsing({ provider: 'anthropic', model: 'claude-x', apiKey: '••••••••', vision: 'on' });
    expect(await screen.findByText('Own connection', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('claude-x')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use the shared connection' }));
    await screen.findByText('AI settings saved');
    expect(bodies[0]).toEqual({ config: { vision: 'on' } });
    expect(await screen.findByText('Shared')).toBeInTheDocument();
  });

  it('FE-COMP-AI-ADMIN-013: the local provider lists installed models and a chip fills the model field', async () => {
    const urls: (string | null)[] = [];
    server.use(modelsRoute(['qwen3.5:4b', 'llama3:8b'], urls));
    const user = await renderParsing({ provider: 'local', model: 'old' });
    await screen.findByText('Installed on the server');
    await user.click(await screen.findByRole('button', { name: 'llama3:8b' }));
    expect(urls[0]).toBe('http://localhost:11434/v1');
    expect(screen.getByLabelText('Model')).toHaveValue('llama3:8b');
    // qwen3.5:4b is installed already, so the recommended row offers Use instead of Pull.
    await user.click(screen.getByRole('button', { name: 'Use' }));
    expect(screen.getByLabelText('Model')).toHaveValue('qwen3.5:4b');
    expect(screen.getByRole('button', { name: 'Selected' })).toBeDisabled();
  });

  it("FE-COMP-AI-ADMIN-014: an unreachable Ollama shows the server's reason and Refresh retries", async () => {
    let calls = 0;
    server.use(
      http.get('/api/admin/llm/local/models', () => {
        calls += 1;
        return calls === 1 ? HttpResponse.json({ error: 'down' }, { status: 500 }) : HttpResponse.json({ models: [] });
      })
    );
    const user = await renderParsing({ provider: 'local', model: 'm' });
    await screen.findByText('down');
    expect(screen.queryByText(/Request failed with status code/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('No models installed yet. Pull one below.');
    expect(calls).toBe(2);
  });

  it('FE-COMP-AI-ADMIN-015: switching providers swaps the address placeholder and the Ollama block, and drops a stale address', async () => {
    const bodies: unknown[] = [];
    server.use(modelsRoute([]), saveRoute(bodies));
    const user = await renderParsing({ provider: 'local', model: 'm', baseUrl: 'http://ollama.lan:11434/v1' });
    await screen.findByText('Installed on the server');
    await user.click(screen.getByRole('radio', { name: 'OpenAI' }));
    expect(screen.getByPlaceholderText('https://api.openai.com/v1')).toHaveValue('');
    expect(screen.queryByText('Installed on the server')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Anthropic' }));
    // A gateway can stand in for Anthropic too, so the field stays (#2655).
    expect(screen.getByPlaceholderText('https://api.anthropic.com')).toHaveValue('');
    expect(screen.getByText(/Anthropic reads PDFs/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Model'));
    await user.type(screen.getByLabelText('Model'), ' claude-haiku ');
    await user.type(screen.getByLabelText('API key'), 'sk-ant-live');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('AI settings saved');
    // The stale local address must not ride along to Anthropic, and the model is trimmed.
    expect(bodies[0]).toEqual({
      config: { provider: 'anthropic', model: 'claude-haiku', baseUrl: '', apiKey: 'sk-ant-live', vision: 'auto' },
    });
  });

  it('FE-COMP-AI-ADMIN-016: a hand-typed address is asked on blur, a cloud provider asks nothing', async () => {
    const urls: (string | null)[] = [];
    server.use(modelsRoute([], urls));
    const user = await renderParsing({ provider: 'local', model: 'm' });
    await screen.findByText('Installed on the server');
    await user.type(screen.getByLabelText('Base URL'), 'http://ollama.lan:11434/v1');
    await user.tab();
    await waitFor(() => expect(urls).toContain('http://ollama.lan:11434/v1'));
    const before = urls.length;
    await user.click(screen.getByRole('radio', { name: 'OpenAI' }));
    await user.type(screen.getByLabelText('Base URL'), 'https://proxy.local/v1');
    await user.tab();
    expect(urls).toHaveLength(before);
  });

  it('FE-COMP-AI-ADMIN-017: a pull streams progress and then selects the model', async () => {
    let pulled: unknown = null;
    let modelCalls = 0;
    server.use(
      http.get('/api/admin/llm/local/models', () => {
        modelCalls += 1;
        return HttpResponse.json({ models: modelCalls === 1 ? [] : [{ name: 'qwen3.5:4b', size: 1 }] });
      }),
      http.post('/api/admin/llm/local/pull', async ({ request }) => {
        pulled = await request.json();
        await delay(150);
        return new HttpResponse(
          '{"status":"pulling manifest"}\n{"status":"downloading","total":100,"completed":40}\nnot-json\n',
          { headers: { 'Content-Type': 'application/x-ndjson' } }
        );
      })
    );
    const user = await renderParsing({ provider: 'local', model: 'm' });
    await screen.findByText('No models installed yet. Pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));
    expect(await screen.findAllByText('Pulling…')).not.toHaveLength(0);
    await screen.findByText('Model pulled');
    expect(pulled).toEqual({ baseUrl: 'http://localhost:11434/v1', model: 'qwen3.5:4b' });
    expect(screen.getByLabelText('Model')).toHaveValue('qwen3.5:4b');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Selected' })).toBeDisabled());
  });

  it('FE-COMP-AI-ADMIN-018: an error frame or a refused pull is reported and the button comes back', async () => {
    server.use(
      modelsRoute([]),
      http.post(
        '/api/admin/llm/local/pull',
        () =>
          new HttpResponse('{"status":"pulling manifest"}\n{"error":"manifest not found"}\n', {
            headers: { 'Content-Type': 'application/x-ndjson' },
          })
      )
    );
    const user = await renderParsing({ provider: 'local', model: 'm' });
    await screen.findByText('No models installed yet. Pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));
    await screen.findByText('manifest not found');
    expect(screen.queryByText('Model pulled')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pull' })).toBeEnabled());
  });

  it('FE-COMP-AI-ADMIN-019: saving keeps a masked key and reports both outcomes', async () => {
    const bodies: unknown[] = [];
    server.use(modelsRoute([]), saveRoute(bodies));
    const user = await renderParsing({ provider: 'local', model: 'qwen3:8b', baseUrl: '', apiKey: '••••••••' });
    await screen.findByText('Installed on the server');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('AI settings saved');
    expect(bodies[0]).toEqual({
      config: { provider: 'local', model: 'qwen3:8b', baseUrl: '', apiKey: '••••••••', vision: 'auto' },
    });
    server.use(saveRoute(bodies, true));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Could not save AI settings');
  });

  it('FE-COMP-AI-ADMIN-020: whether the model reads images saves at once, with the connection as saved', async () => {
    const bodies: unknown[] = [];
    server.use(saveRoute(bodies));
    const user = await renderParsing({
      provider: 'openai',
      model: 'gpt-4.1-mini',
      baseUrl: '',
      apiKey: 'sk',
      vision: 'off',
    });
    expect(await screen.findByRole('button', { name: 'No' })).toBeInTheDocument();
    expect(
      screen.getByText('Automatic means no for a cloud model. Choose Yes if this model reads images.')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes' }));
    await screen.findByText('AI settings saved');
    expect(bodies[0]).toEqual({
      config: { provider: 'openai', model: 'gpt-4.1-mini', baseUrl: '', apiKey: 'sk', vision: 'on' },
    });
  });
});
