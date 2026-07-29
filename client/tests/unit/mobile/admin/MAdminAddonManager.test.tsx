// FE-MOB-AADD-001 to FE-MOB-AADD-025
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { useAddonStore } from '../../../../src/store/addonStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminAddonManager from '../../../../src/mobile/screens/admin/MAdminAddonManager';

interface AddonFixture {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

function buildAddon(overrides: Partial<AddonFixture> = {}): AddonFixture {
  return {
    id: 'todo',
    name: 'Todo List',
    description: 'Track tasks',
    icon: 'ListChecks',
    type: 'trip',
    enabled: false,
    ...overrides,
  };
}

function addonsRoute(addons: AddonFixture[]) {
  return http.get('/api/admin/addons', () => HttpResponse.json({ addons }));
}

function llmAddon(config: Record<string, unknown> = {}): AddonFixture {
  return buildAddon({
    id: 'llm_parsing',
    name: 'AI Parsing',
    description: 'Extract bookings from files',
    icon: 'Sparkles',
    type: 'integration',
    enabled: true,
    config,
  });
}

function modelsRoute(names: string[], seen?: (string | null)[]) {
  return http.get('/api/admin/llm/local/models', ({ request }) => {
    seen?.push(new URL(request.url).searchParams.get('baseUrl'));
    return HttpResponse.json({ models: names.map(name => ({ name, size: 1 })) });
  });
}

let loadAddonsSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }) });
  loadAddonsSpy = vi.spyOn(useAddonStore.getState(), 'loadAddons').mockResolvedValue(undefined);
  server.use(addonsRoute([]));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MAdminAddonManager', () => {
  it('FE-MOB-AADD-001: shows the spinner while addons load', async () => {
    server.use(
      http.get('/api/admin/addons', async () => {
        await delay(60);
        return HttpResponse.json({ addons: [] });
      }),
    );
    render(<MAdminAddonManager />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    await screen.findByText('No addons available');
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-002: the header uses the light wordmark in light mode', async () => {
    render(<MAdminAddonManager />);

    await screen.findByText('No addons available');
    expect(screen.getByText('Addons')).toBeInTheDocument();
    expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/text-dark.svg');
  });

  it('FE-MOB-AADD-003: dark mode and auto+prefers-dark swap the wordmark', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }) });
    const { unmount } = render(<MAdminAddonManager />);
    await screen.findByText('No addons available');
    expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/text-light.svg');
    unmount();

    const matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal('matchMedia', matchMedia);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'auto' }) });
    render(<MAdminAddonManager />);
    await screen.findByText('No addons available');
    expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/text-light.svg');
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    vi.unstubAllGlobals();
  });

  it('FE-MOB-AADD-004: a failing load toasts the addon error', async () => {
    server.use(http.get('/api/admin/addons', () => HttpResponse.error()));
    render(<><ToastContainer /><MAdminAddonManager /></>);

    await screen.findByText('Failed to update addon');
    expect(screen.getByText('No addons available')).toBeInTheDocument();
  });

  it('FE-MOB-AADD-005: trip addons render with the section band, catalog label and type badge', async () => {
    server.use(addonsRoute([buildAddon({ id: 'packing', name: 'Packing', enabled: true })]));
    render(<MAdminAddonManager />);

    await screen.findByText('Lists');
    expect(screen.getByText('Trip — Available as a tab within each trip')).toBeInTheDocument();
    expect(screen.getByText('Packing lists and to-do tasks for your trips')).toBeInTheDocument();
    expect(screen.getByText('Trip')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Lists' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-AADD-006: an addon without a catalog entry falls back to the API name', async () => {
    server.use(addonsRoute([buildAddon({ id: 'mystery', name: 'Mystery Addon', description: 'No catalog key', icon: 'NoSuchIcon' })]));
    render(<MAdminAddonManager />);

    await screen.findByText('Mystery Addon');
    expect(screen.getByText('No catalog key')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Mystery Addon' })).toBeInTheDocument();
  });

  it('FE-MOB-AADD-007: photo-flavoured trip addons are hidden from the trip section', async () => {
    server.use(
      addonsRoute([
        buildAddon({ id: 'photos', name: 'Memories', icon: 'Image' }),
        buildAddon({ id: 'gallery', name: 'Trip Photos', icon: 'Puzzle', description: 'Share your photo stream' }),
        buildAddon({ id: 'todo', name: 'Todo List' }),
      ]),
    );
    render(<MAdminAddonManager />);

    await screen.findByText('Todo List');
    expect(screen.queryByText('Memories')).not.toBeInTheDocument();
    expect(screen.queryByText('Trip Photos')).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-008: toggling an addon persists it, refreshes the store and toasts', async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      addonsRoute([buildAddon({ id: 'todo', enabled: false })]),
      http.put('/api/admin/addons/todo', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);
    await screen.findByText('Todo List');

    const toggle = screen.getByRole('switch', { name: 'Todo List' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);

    await waitFor(() => expect(body).toEqual({ enabled: true }));
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(loadAddonsSpy).toHaveBeenCalled();
    await screen.findByText('Addon updated');
  });

  it('FE-MOB-AADD-009: a failing toggle rolls the switch back', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([buildAddon({ id: 'todo', enabled: true })]),
      http.put('/api/admin/addons/todo', () => HttpResponse.error()),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);
    await screen.findByText('Todo List');

    const toggle = screen.getByRole('switch', { name: 'Todo List' });
    await user.click(toggle);

    await screen.findByText('Failed to update addon');
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
    expect(loadAddonsSpy).not.toHaveBeenCalled();
  });

  it('FE-MOB-AADD-010: bag tracking shows under an enabled packing addon and reports clicks', async () => {
    const user = userEvent.setup();
    const onToggleBagTracking = vi.fn();
    server.use(addonsRoute([buildAddon({ id: 'packing', enabled: true })]));
    render(<MAdminAddonManager bagTrackingEnabled={false} onToggleBagTracking={onToggleBagTracking} />);

    await screen.findByText('Bag Tracking');
    expect(screen.getByText('Enable weight and bag assignment for packing items')).toBeInTheDocument();
    const bagToggle = screen.getByRole('switch', { name: 'Bag Tracking' });
    expect(bagToggle).toHaveAttribute('aria-checked', 'false');

    await user.click(bagToggle);
    expect(onToggleBagTracking).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-AADD-011: bag tracking stays hidden when packing is off or the handler is missing', async () => {
    server.use(addonsRoute([buildAddon({ id: 'packing', enabled: false })]));
    const { unmount } = render(<MAdminAddonManager bagTrackingEnabled onToggleBagTracking={vi.fn()} />);
    await screen.findByText('Lists');
    expect(screen.queryByText('Bag Tracking')).not.toBeInTheDocument();
    unmount();

    server.use(addonsRoute([buildAddon({ id: 'packing', enabled: true })]));
    render(<MAdminAddonManager bagTrackingEnabled />);
    await screen.findByText('Lists');
    expect(screen.queryByText('Bag Tracking')).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-012: the collab sub-features render and report the toggled key', async () => {
    const user = userEvent.setup();
    const onToggleCollabFeature = vi.fn();
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(
      <MAdminAddonManager
        collabFeatures={{ chat: true, notes: false, polls: false, whatsnext: true }}
        onToggleCollabFeature={onToggleCollabFeature}
      />,
    );

    await screen.findByText('Chat');
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Polls')).toBeInTheDocument();
    expect(screen.getByText("What's Next")).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Chat' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Notes' })).toHaveAttribute('aria-checked', 'false');

    await user.click(screen.getByRole('switch', { name: 'Polls' }));
    expect(onToggleCollabFeature).toHaveBeenCalledWith('polls');
  });

  it('FE-MOB-AADD-013: collab sub-features stay hidden without the handler props', async () => {
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(<MAdminAddonManager />);

    await screen.findByText('Collab');
    expect(screen.queryByText('Polls')).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-014: photo providers render as sub-rows under the journey addon', async () => {
    server.use(
      addonsRoute([
        buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true }),
        buildAddon({ id: 'immich', name: 'Immich', description: 'Self-hosted photos', type: 'photo_provider', enabled: true }),
        buildAddon({ id: 'synologyphotos', name: 'Synology Photos', description: 'NAS photos', type: 'photo_provider', enabled: false }),
        buildAddon({ id: 'unsplash', name: 'Unsplash', description: 'Stock photos', type: 'photo_provider', enabled: false }),
      ]),
    );
    render(<MAdminAddonManager />);

    await screen.findByText('Immich');
    expect(screen.getByText('Global — Available as a standalone section in the main navigation')).toBeInTheDocument();
    expect(screen.getByText('Synology Photos')).toBeInTheDocument();
    expect(screen.getByText('Unsplash')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Immich' })).toHaveAttribute('aria-checked', 'true');
    // Journey + three providers, and providers are not shown as top-level rows.
    expect(screen.getAllByRole('switch')).toHaveLength(4);
    expect(screen.queryByText('Global')).toBeInTheDocument();
  });

  it('FE-MOB-AADD-015: toggling a provider persists it and rolls back on failure', async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      addonsRoute([
        buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true }),
        buildAddon({ id: 'immich', name: 'Immich', description: 'Self-hosted photos', type: 'photo_provider', enabled: false }),
        buildAddon({ id: 'unsplash', name: 'Unsplash', description: 'Stock photos', type: 'photo_provider', enabled: false }),
      ]),
      http.put('/api/admin/addons/immich', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
      http.put('/api/admin/addons/unsplash', () => HttpResponse.error()),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);
    await screen.findByText('Immich');

    await user.click(screen.getByRole('switch', { name: 'Immich' }));
    await waitFor(() => expect(body).toEqual({ enabled: true }));
    expect(screen.getByRole('switch', { name: 'Immich' })).toHaveAttribute('aria-checked', 'true');
    await screen.findByText('Addon updated');

    await user.click(screen.getByRole('switch', { name: 'Unsplash' }));
    await screen.findByText('Failed to update addon');
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Unsplash' })).toHaveAttribute('aria-checked', 'false'));
  });

  it('FE-MOB-AADD-016: a disabled AI-parsing addon renders the integration row without its config', async () => {
    server.use(addonsRoute([llmAddon({ provider: 'local' })].map(a => ({ ...a, enabled: false }))));
    render(<MAdminAddonManager />);

    await screen.findByText('AI Parsing');
    expect(screen.getByText('Integration — Backend services and API integrations with no dedicated page')).toBeInTheDocument();
    expect(screen.queryByText('Connection')).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-017: the local provider lists installed models and selecting a chip fills the model field', async () => {
    const user = userEvent.setup();
    const urls: (string | null)[] = [];
    server.use(addonsRoute([llmAddon({ provider: 'local' })]), modelsRoute(['qwen3:8b', 'llama3:8b'], urls));
    render(<MAdminAddonManager />);

    await screen.findByText('Installed on the server');
    await screen.findByRole('button', { name: 'llama3:8b' });
    expect(urls[0]).toBe('http://localhost:11434/v1');

    await user.click(screen.getByRole('button', { name: 'llama3:8b' }));
    expect(screen.getByPlaceholderText('select or pull below')).toHaveValue('llama3:8b');

    // qwen3:8b is installed, so the recommended row offers "Use" instead of "Pull".
    await user.click(screen.getByRole('button', { name: 'Use' }));
    expect(screen.getByPlaceholderText('select or pull below')).toHaveValue('qwen3:8b');
    expect(screen.getByRole('button', { name: 'Selected' })).toBeDisabled();
  });

  it('FE-MOB-AADD-018: an unreachable Ollama shows the error, Refresh retries', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      addonsRoute([llmAddon({ provider: 'local' })]),
      http.get('/api/admin/llm/local/models', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ error: 'down' }, { status: 500 })
          : HttpResponse.json({ models: [] });
      }),
    );
    render(<MAdminAddonManager />);

    await screen.findByText(/Request failed with status code 500/);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('No models installed yet — pull one below.');
    expect(calls).toBe(2);
  });

  it('FE-MOB-AADD-019: the base URL is used for model lookups on blur', async () => {
    const user = userEvent.setup();
    const urls: (string | null)[] = [];
    server.use(addonsRoute([llmAddon({ provider: 'local' })]), modelsRoute([], urls));
    render(<MAdminAddonManager />);

    await screen.findByText('Installed on the server');
    const baseUrl = screen.getByPlaceholderText('http://localhost:11434/v1');
    await user.type(baseUrl, 'http://ollama.lan:11434/v1');
    await user.tab();

    await waitFor(() => expect(urls).toContain('http://ollama.lan:11434/v1'));
  });

  it('FE-MOB-AADD-020: switching providers swaps the base URL field and the model hint', async () => {
    const user = userEvent.setup();
    server.use(addonsRoute([llmAddon({ provider: 'local', apiKey: '••••••••' })]), modelsRoute([]));
    render(<MAdminAddonManager />);

    await screen.findByText('Installed on the server');
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('select or pull below'), 'mistral:7b');
    expect(screen.getByDisplayValue('mistral:7b')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'OpenAI' }));
    expect(screen.getByPlaceholderText('https://api.openai.com/v1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('gpt-4o')).toBeInTheDocument();
    expect(screen.queryByText('Installed on the server')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Anthropic' }));
    expect(screen.queryByPlaceholderText('https://api.openai.com/v1')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('claude-opus-4-8')).toBeInTheDocument();
    expect(screen.getByText(/Anthropic reads PDFs/)).toBeInTheDocument();
  });

  it('FE-MOB-AADD-021: pulling a model streams progress, then selects it', async () => {
    const user = userEvent.setup();
    let pulled: unknown = null;
    let modelCalls = 0;
    server.use(
      addonsRoute([llmAddon({ provider: 'local' })]),
      http.get('/api/admin/llm/local/models', () => {
        modelCalls += 1;
        return HttpResponse.json({ models: modelCalls === 1 ? [] : [{ name: 'qwen3:8b', size: 1 }] });
      }),
      http.post('/api/admin/llm/local/pull', async ({ request }) => {
        pulled = await request.json();
        await delay(150);
        return new HttpResponse(
          '{"status":"pulling manifest"}\n{"status":"downloading","total":100,"completed":40}\nnot-json\n',
          { headers: { 'Content-Type': 'application/x-ndjson' } },
        );
      }),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);

    await screen.findByText('No models installed yet — pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));

    // While the request is in flight the row shows the busy label and status line.
    await screen.findByText('Pulling…');
    expect(screen.getByText('starting…')).toBeInTheDocument();

    await screen.findByText('Model pulled');
    expect(pulled).toEqual({ baseUrl: 'http://localhost:11434/v1', model: 'qwen3:8b' });
    expect(screen.getByPlaceholderText('select or pull below')).toHaveValue('qwen3:8b');
    // Reloaded models now contain the pulled one, so the row switches to "Selected".
    await waitFor(() => expect(screen.getByRole('button', { name: 'Selected' })).toBeDisabled());
  });

  it('FE-MOB-AADD-022: a failing pull surfaces the server error', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([llmAddon({ provider: 'local' })]),
      modelsRoute([]),
      http.post('/api/admin/llm/local/pull', () => HttpResponse.json({ error: 'no disk space' }, { status: 500 })),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);

    await screen.findByText('No models installed yet — pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));

    await screen.findByText('no disk space');
    expect(screen.getByRole('button', { name: 'Pull' })).toBeEnabled();
  });

  it('FE-MOB-AADD-025: an error frame in the pull stream aborts the pull', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([llmAddon({ provider: 'local' })]),
      modelsRoute([]),
      http.post('/api/admin/llm/local/pull', () => new HttpResponse(
        '{"status":"pulling manifest"}\n{"error":"manifest not found"}\n',
        { headers: { 'Content-Type': 'application/x-ndjson' } },
      )),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);

    await screen.findByText('No models installed yet — pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));

    await screen.findByText('manifest not found');
    expect(screen.queryByText('Model pulled')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pull' })).toBeEnabled();
  });

  it('FE-MOB-AADD-023: saving posts the whole config and reports both outcomes', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      addonsRoute([llmAddon({ provider: 'openai', model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1', apiKey: '••••••••', multimodal: true })]),
      http.put('/api/admin/addons/llm_parsing', async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1 ? HttpResponse.json({ success: true }) : HttpResponse.error();
      }),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);

    const save = await screen.findByRole('button', { name: 'Save' });
    await user.click(save);

    await screen.findByText('Saved');
    expect(bodies[0]).toEqual({
      config: {
        provider: 'openai',
        model: 'gpt-4o',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '••••••••',
        multimodal: true,
      },
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Failed to save');
  });

  it('FE-MOB-AADD-024: the API key field can be revealed', async () => {
    const user = userEvent.setup();
    server.use(addonsRoute([llmAddon({ provider: 'anthropic', apiKey: 'sk-secret' })]));
    render(<MAdminAddonManager />);

    const field = await screen.findByDisplayValue('sk-secret');
    expect(field).toHaveAttribute('type', 'password');

    await user.click(within(field.parentElement as HTMLElement).getByRole('button', { name: 'Show or hide' }));
    expect(screen.getByDisplayValue('sk-secret')).toHaveAttribute('type', 'text');

    await user.type(screen.getByDisplayValue('sk-secret'), '-rotated');
    expect(screen.getByDisplayValue('sk-secret-rotated')).toBeInTheDocument();
  });
});
