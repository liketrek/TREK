// FE-ADMIN-ADDON-001 to FE-ADMIN-ADDON-025
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import { useAddonStore } from '../../store/addonStore';
import { ToastContainer } from '../shared/Toast';
import AddonManager from './AddonManager';

function buildAddon(overrides = {}) {
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

function addonsRoute(addons: ReturnType<typeof buildAddon>[]) {
  return http.get('/api/admin/addons', () => HttpResponse.json({ addons }));
}

function llmAddon(config: Record<string, unknown> = {}) {
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

/** Every switch is labelled with the thing it controls, top-level tile or shelf
 *  row alike, so one lookup covers both. */
function addonToggle(name: string): HTMLElement {
  return screen.getByRole('button', { name });
}

const subToggle = addonToggle;

function isOn(toggle: HTMLElement): boolean {
  return toggle.getAttribute('aria-pressed') === 'true';
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: { dark_mode: false } });
  vi.spyOn(useAddonStore.getState(), 'loadAddons').mockResolvedValue(undefined);
  server.use(
    http.get('/api/admin/addons', () => HttpResponse.json({ addons: [] }))
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove('dark');
});

describe('AddonManager', () => {
  it('FE-ADMIN-ADDON-001: loading spinner shown while fetching', async () => {
    server.use(
      http.get('/api/admin/addons', async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return HttpResponse.json({ addons: [] });
      })
    );
    render(<AddonManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-002: empty state when addons list is empty', async () => {
    render(<AddonManager />);
    expect(await screen.findByText('No addons available')).toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-003: trip addons section renders with correct section header', async () => {
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({ addons: [buildAddon({ id: 'todo', name: 'Todo List', type: 'trip' })] })
      )
    );
    render(<AddonManager />);
    await screen.findByText('Todo List');
    // Section header contains "Trip" and "Available as a tab within each trip"
    expect(screen.getAllByText(/Trip/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Available as a tab within each trip/)).toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-004: global and integration sections render when present', async () => {
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({
          addons: [
            buildAddon({ id: 'global1', name: 'Global Feature', type: 'global' }),
            buildAddon({ id: 'int1', name: 'Integration Feature', type: 'integration' }),
          ],
        })
      )
    );
    render(<AddonManager />);
    await screen.findByText('Global Feature');
    expect(screen.getAllByText(/Global/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Integration/).length).toBeGreaterThan(0);
  });

  it('FE-ADMIN-ADDON-005: toggle enables a disabled addon (optimistic update)', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({ addons: [buildAddon({ id: 'todo', enabled: false })] })
      ),
      http.put('/api/admin/addons/todo', () =>
        HttpResponse.json({ success: true })
      )
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Todo List');

    const toggleBtn = addonToggle('Todo List');
    expect(isOn(toggleBtn)).toBe(false);

    await user.click(toggleBtn);

    // After click - success toast
    await screen.findByText('Addon updated');
  });

  it('FE-ADMIN-ADDON-006: toggle rolls back on API failure', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({ addons: [buildAddon({ id: 'todo', enabled: false })] })
      ),
      http.put('/api/admin/addons/todo', () =>
        HttpResponse.error()
      )
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Todo List');

    await user.click(addonToggle('Todo List'));

    // Error toast appears
    await screen.findByText('Failed to update addon');

    // The switch is back off after rollback
    await waitFor(() => {
      expect(isOn(addonToggle('Todo List'))).toBe(false);
    });
  });

  it('FE-ADMIN-ADDON-007: bag tracking sub-toggle renders when packing addon is enabled', async () => {
    const user = userEvent.setup();
    const mockToggle = vi.fn();
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({ addons: [buildAddon({ id: 'packing', enabled: true })] })
      )
    );
    render(
      <AddonManager bagTrackingEnabled={false} onToggleBagTracking={mockToggle} />
    );
    await screen.findByText('Bag Tracking');
    await user.click(subToggle('Bag Tracking'));
    expect(mockToggle).toHaveBeenCalled();
  });

  it('FE-ADMIN-ADDON-008: bag tracking hidden when packing addon is disabled', async () => {
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({ addons: [buildAddon({ id: 'packing', enabled: false })] })
      )
    );
    render(
      <AddonManager bagTrackingEnabled={false} onToggleBagTracking={vi.fn()} />
    );
    await screen.findByText('Lists');
    expect(screen.queryByText('Bag Tracking')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-009: bag tracking hidden when onToggleBagTracking prop not provided', async () => {
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({ addons: [buildAddon({ id: 'packing', enabled: true })] })
      )
    );
    render(<AddonManager bagTrackingEnabled={false} />);
    await screen.findByText('Lists');
    expect(screen.queryByText('Bag Tracking')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-010: photo provider sub-toggles shown under Journey addon', async () => {
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({
          addons: [
            buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true }),
            buildAddon({ id: 'photos', name: 'Memories', type: 'trip', icon: 'Image', enabled: false }),
            buildAddon({ id: 'unsplash', name: 'Unsplash', type: 'photo_provider', enabled: true }),
            buildAddon({ id: 'pexels', name: 'Pexels', type: 'photo_provider', enabled: false }),
          ],
        })
      )
    );
    render(<AddonManager />);

    // Provider sub-rows are visible under Journey addon
    await screen.findByText('Unsplash');
    expect(screen.getByText('Pexels')).toBeInTheDocument();

    // Journey addon is rendered
    expect(screen.getByText('Journey')).toBeInTheDocument();

    // Journey's own switch plus one per provider, each labelled with what it controls
    expect(isOn(addonToggle('Journey'))).toBe(true);
    expect(isOn(subToggle('Unsplash'))).toBe(true);
    expect(isOn(subToggle('Pexels'))).toBe(false);
  });

  it('FE-ADMIN-ADDON-011: icon falls back to Puzzle when icon name unknown', async () => {
    server.use(
      http.get('/api/admin/addons', () =>
        HttpResponse.json({
          addons: [buildAddon({ id: 'mystery', name: 'Mystery Addon', icon: 'NonExistentIcon', type: 'trip' })],
        })
      )
    );
    // Should not throw; Puzzle icon is used as fallback
    expect(() => render(<AddonManager />)).not.toThrow();
    await screen.findByText('Mystery Addon');
  });

  it('FE-ADMIN-ADDON-012: a failing load toasts the addon error and shows the empty state', async () => {
    server.use(http.get('/api/admin/addons', () => HttpResponse.error()));
    render(<><ToastContainer /><AddonManager /></>);

    await screen.findByText('Failed to update addon');
    expect(screen.getByText('No addons available')).toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-013: dark mode swaps the wordmark in the header', async () => {
    // The wordmark reads the .dark class, the same source applyAppearance() writes.
    document.documentElement.classList.add('dark');
    render(<AddonManager />);

    await screen.findByText('No addons available');
    expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/text-light.svg');
  });

  it('FE-ADMIN-ADDON-014: photo-flavoured trip addons are hidden from the trip section', async () => {
    server.use(addonsRoute([
      buildAddon({ id: 'photos', name: 'Memories', icon: 'Image' }),
      buildAddon({ id: 'gallery', name: 'Trip Photos', icon: 'Puzzle', description: 'Share your photo stream' }),
      buildAddon({ id: 'todo', name: 'Todo List' }),
    ]));
    render(<AddonManager />);

    await screen.findByText('Todo List');
    expect(screen.queryByText('Memories')).not.toBeInTheDocument();
    expect(screen.queryByText('Trip Photos')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-015: provider sub-rows carry their vendor icons and toggle state', async () => {
    server.use(addonsRoute([
      buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true }),
      buildAddon({ id: 'immich', name: 'Immich', description: 'Self-hosted photos', type: 'photo_provider', enabled: true }),
      buildAddon({ id: 'synologyphotos', name: 'Synology Photos', description: 'NAS photos', type: 'photo_provider', enabled: false }),
      buildAddon({ id: 'unsplash', name: 'Unsplash', description: 'Stock photos', type: 'photo_provider', enabled: false }),
    ]));
    render(<AddonManager />);

    await screen.findByText('Immich');
    // immich and synologyphotos ship a vendor glyph, unsplash does not
    const immichRow = screen.getByText('Immich').closest('li') as HTMLElement;
    expect(immichRow.querySelector('svg')).toBeInTheDocument();
    const synologyRow = screen.getByText('Synology Photos').closest('li') as HTMLElement;
    expect(synologyRow.querySelector('svg')).toBeInTheDocument();
    const unsplashRow = screen.getByText('Unsplash').closest('li') as HTMLElement;
    expect(unsplashRow.querySelector('svg')).not.toBeInTheDocument();

    expect(isOn(subToggle('Immich'))).toBe(true);
    expect(isOn(subToggle('Unsplash'))).toBe(false);
  });

  it('FE-ADMIN-ADDON-016: toggling a photo provider persists it and refreshes the global addons', async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      addonsRoute([
        buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true }),
        buildAddon({ id: 'immich', name: 'Immich', description: 'Self-hosted photos', type: 'photo_provider', enabled: false }),
      ]),
      http.put('/api/admin/addons/immich', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Immich');

    await user.click(subToggle('Immich'));

    await waitFor(() => expect(body).toEqual({ enabled: true }));
    await screen.findByText('Addon updated');
    expect(isOn(subToggle('Immich'))).toBe(true);
  });

  it('FE-ADMIN-ADDON-017: a failing photo-provider toggle rolls the sub-row back', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([
        buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true }),
        buildAddon({ id: 'unsplash', name: 'Unsplash', description: 'Stock photos', type: 'photo_provider', enabled: true }),
      ]),
      http.put('/api/admin/addons/unsplash', () => HttpResponse.error()),
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Unsplash');

    await user.click(subToggle('Unsplash'));

    await screen.findByText('Failed to update addon');
    await waitFor(() => expect(isOn(subToggle('Unsplash'))).toBe(true));
  });

  it('FE-ADMIN-ADDON-030: provider sub-rows stay hidden while Journey itself is off', async () => {
    server.use(addonsRoute([
      buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: false }),
      buildAddon({ id: 'immich', name: 'Immich', description: 'Self-hosted photos', type: 'photo_provider', enabled: true }),
      buildAddon({ id: 'synologyphotos', name: 'Synology Photos', description: 'NAS photos', type: 'photo_provider', enabled: false }),
    ]));
    render(<AddonManager />);

    await screen.findByText('Journey');
    expect(screen.queryByText('Immich')).not.toBeInTheDocument();
    expect(screen.queryByText('Synology Photos')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-031: switching Journey off and on again shows the cascaded providers as off', async () => {
    const user = userEvent.setup();
    let loads = 0;
    let journeyOn = true;
    let immichOn = true;
    server.use(
      http.get('/api/admin/addons', () => {
        loads += 1;
        return HttpResponse.json({
          addons: [
            buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: journeyOn }),
            buildAddon({ id: 'immich', name: 'Immich', description: 'Self-hosted photos', type: 'photo_provider', enabled: immichOn }),
          ],
        });
      }),
      http.put('/api/admin/addons/journey', async ({ request }) => {
        journeyOn = (await request.json() as { enabled: boolean }).enabled;
        // Journey off takes its providers with it, see admin.service.ts.
        if (!journeyOn) immichOn = false;
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Immich');

    await user.click(addonToggle('Journey'));
    // The toast closes the whole toggle, re-read included.
    await screen.findByText('Addon updated');
    expect(loads).toBe(2);
    expect(screen.queryByText('Immich')).not.toBeInTheDocument();

    await user.click(addonToggle('Journey'));

    await screen.findByText('Immich');
    expect(isOn(subToggle('Immich'))).toBe(false);
  });

  it('FE-ADMIN-ADDON-032: a toggle the server does not cascade keeps the snapshot it has', async () => {
    const user = userEvent.setup();
    let loads = 0;
    server.use(
      http.get('/api/admin/addons', () => {
        loads += 1;
        return HttpResponse.json({ addons: [buildAddon({ id: 'todo', enabled: false })] });
      }),
      http.put('/api/admin/addons/todo', () => HttpResponse.json({ success: true })),
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Todo List');

    await user.click(addonToggle('Todo List'));

    await screen.findByText('Addon updated');
    expect(loads).toBe(1);
    expect(isOn(addonToggle('Todo List'))).toBe(true);
  });

  it('FE-ADMIN-ADDON-018: the collab sub-features render their state and report the toggled key', async () => {
    const user = userEvent.setup();
    const onToggleCollabFeature = vi.fn();
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(
      <AddonManager
        collabFeatures={{ chat: true, notes: false, polls: false, whatsnext: true }}
        onToggleCollabFeature={onToggleCollabFeature}
      />,
    );

    await screen.findByText('Chat');
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Polls')).toBeInTheDocument();
    expect(screen.getByText("What's Next")).toBeInTheDocument();
    expect(isOn(subToggle('Chat'))).toBe(true);
    expect(isOn(subToggle('Notes'))).toBe(false);

    await user.click(subToggle('Polls'));
    expect(onToggleCollabFeature).toHaveBeenCalledWith('polls');
  });

  it('FE-ADMIN-ADDON-019: collab sub-features stay hidden without the handler props', async () => {
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(<AddonManager />);

    await screen.findByText('Collab');
    expect(screen.queryByText('Polls')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-020: a disabled AI-parsing addon renders the row without its config block', async () => {
    server.use(addonsRoute([{ ...llmAddon({ provider: 'local' }), enabled: false }]));
    render(<AddonManager />);

    await screen.findByText('AI Parsing');
    // The catalog key now exists, so the tile shows the translation rather than falling
    // back to the English description the server sent.
    expect(screen.getByText('Reads bookings the built-in parser cannot, using an AI model you choose')).toBeInTheDocument();
    expect(screen.queryByText('Provider')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-020b: the config lives in the tile shelf, not as a band below the grid', async () => {
    server.use(addonsRoute([llmAddon({ provider: 'openai' })]));
    render(<AddonManager />);

    const label = await screen.findByText('Provider');
    // Inside the AI Parsing tile's <article>, like the collab toggles sit in theirs.
    const tile = label.closest('article');
    expect(tile).not.toBeNull();
    expect(tile!.textContent).toContain('AI Parsing');
  });

  it('FE-ADMIN-ADDON-021: the local provider lists installed models and a chip fills the model field', async () => {
    const user = userEvent.setup();
    const urls: (string | null)[] = [];
    server.use(addonsRoute([llmAddon({ provider: 'local' })]), modelsRoute(['qwen3.5:4b', 'llama3:8b'], urls));
    render(<AddonManager />);

    await screen.findByText('Installed on the server');
    await screen.findByRole('button', { name: 'llama3:8b' });
    expect(urls[0]).toBe('http://localhost:11434/v1');

    await user.click(screen.getByRole('button', { name: 'llama3:8b' }));
    expect(screen.getByPlaceholderText('select or pull below')).toHaveValue('llama3:8b');

    // qwen3.5:4b is already installed, so the recommended row offers "Use" instead of "Pull"
    await user.click(screen.getByRole('button', { name: 'Use' }));
    expect(screen.getByPlaceholderText('select or pull below')).toHaveValue('qwen3.5:4b');
    expect(screen.getByRole('button', { name: 'Selected' })).toBeDisabled();
  });

  it('FE-ADMIN-ADDON-022: an unreachable Ollama shows the error and Refresh retries', async () => {
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
    render(<AddonManager />);

    await screen.findByText(/Request failed with status code 500/);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('No models installed yet — pull one below.');
    expect(calls).toBe(2);
  });

  it('FE-ADMIN-ADDON-023: switching providers swaps the base URL field, the model hint and the Ollama block', async () => {
    const user = userEvent.setup();
    const urls: (string | null)[] = [];
    server.use(addonsRoute([llmAddon({ provider: 'local', apiKey: '••••••••' })]), modelsRoute([], urls));
    render(<AddonManager />);

    await screen.findByText('Installed on the server');
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

    // A hand-typed base URL is used for the next lookup on blur
    await user.type(screen.getByPlaceholderText('http://localhost:11434/v1'), 'http://ollama.lan:11434/v1');
    await user.tab();
    await waitFor(() => expect(urls).toContain('http://ollama.lan:11434/v1'));

    await user.click(screen.getByRole('button', { name: /Local · OpenAI-compatible/ }));
    await user.click(screen.getByRole('button', { name: 'OpenAI' }));
    expect(screen.getByPlaceholderText('https://api.openai.com/v1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('gpt-4o')).toBeInTheDocument();
    expect(screen.queryByText('Installed on the server')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'OpenAI' }));
    await user.click(screen.getByRole('button', { name: 'Anthropic' }));
    expect(screen.queryByPlaceholderText('https://api.openai.com/v1')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('claude-opus-4-8')).toBeInTheDocument();
    expect(screen.getByText(/Anthropic reads PDFs/)).toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-024: pulling a model streams progress and then selects it', async () => {
    const user = userEvent.setup();
    let pulled: unknown = null;
    let modelCalls = 0;
    server.use(
      addonsRoute([llmAddon({ provider: 'local' })]),
      http.get('/api/admin/llm/local/models', () => {
        modelCalls += 1;
        return HttpResponse.json({ models: modelCalls === 1 ? [] : [{ name: 'qwen3.5:4b', size: 1 }] });
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
    render(<><ToastContainer /><AddonManager /></>);

    await screen.findByText('No models installed yet — pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));

    await screen.findByText('Pulling…');
    expect(screen.getByText('starting…')).toBeInTheDocument();

    await screen.findByText('Model pulled');
    expect(pulled).toEqual({ baseUrl: 'http://localhost:11434/v1', model: 'qwen3.5:4b' });
    expect(screen.getByPlaceholderText('select or pull below')).toHaveValue('qwen3.5:4b');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Selected' })).toBeDisabled());
  });

  it('FE-ADMIN-ADDON-025: a failing pull surfaces the server error and saving reports both outcomes', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      addonsRoute([llmAddon({ provider: 'local', model: 'qwen3:8b', baseUrl: '', apiKey: '••••••••', multimodal: true })]),
      modelsRoute([]),
      http.post('/api/admin/llm/local/pull', () => HttpResponse.json({ error: 'no disk space' }, { status: 500 })),
      http.put('/api/admin/addons/llm_parsing', async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1 ? HttpResponse.json({ success: true }) : HttpResponse.error();
      }),
    );
    render(<><ToastContainer /><AddonManager /></>);

    await screen.findByText('No models installed yet — pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));
    await screen.findByText('no disk space');
    expect(screen.getByRole('button', { name: 'Pull' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Saved');
    expect(bodies[0]).toEqual({
      config: { provider: 'local', model: 'qwen3:8b', baseUrl: '', apiKey: '••••••••', multimodal: true },
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Failed to save');
  });

  it('FE-ADMIN-ADDON-026: model and API key are editable and their hints follow the provider', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      addonsRoute([llmAddon({ provider: 'local' })]),
      modelsRoute([]),
      http.put('/api/admin/addons/llm_parsing', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><AddonManager /></>);

    await screen.findByText('Installed on the server');
    expect(screen.getByPlaceholderText('(often not required)')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('select or pull below'), ' mistral:7b ');
    await user.type(screen.getByPlaceholderText('(often not required)'), 'sk-live');

    await user.click(screen.getByRole('button', { name: /Local · OpenAI-compatible/ }));
    await user.click(screen.getByRole('button', { name: 'OpenAI' }));
    expect(screen.getByPlaceholderText('sk-…')).toHaveValue('sk-live');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Saved');
    // The model is trimmed before it is stored, the key is sent verbatim
    expect(bodies[0]).toEqual({
      config: { provider: 'openai', model: 'mistral:7b', baseUrl: '', apiKey: 'sk-live', multimodal: false },
    });
  });

  it('FE-ADMIN-ADDON-029: switching to Anthropic clears a stale base URL before saving', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      addonsRoute([llmAddon({ provider: 'local', model: '', baseUrl: 'http://ollama.lan:11434/v1', apiKey: '', multimodal: false })]),
      modelsRoute([]),
      http.put('/api/admin/addons/llm_parsing', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><AddonManager /></>);

    await screen.findByText('Installed on the server');

    await user.click(screen.getByRole('button', { name: /Local · OpenAI-compatible/ }));
    await user.click(screen.getByRole('button', { name: 'Anthropic' }));
    await user.type(screen.getByPlaceholderText('claude-opus-4-8'), 'claude-haiku-4-5-20251001');
    await user.type(screen.getByPlaceholderText('sk-…'), 'sk-ant-live');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Saved');
    // The stale local base URL must not ride along to Anthropic — it would hijack the endpoint.
    expect(bodies[0]).toEqual({
      config: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', baseUrl: '', apiKey: 'sk-ant-live', multimodal: false },
    });
  });

  it('FE-ADMIN-ADDON-027: an error frame in the pull stream aborts the pull and is reported', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([llmAddon({ provider: 'local' })]),
      modelsRoute([]),
      http.post('/api/admin/llm/local/pull', () => new HttpResponse(
        '{"status":"pulling manifest"}\n{"error":"manifest not found"}\n',
        { headers: { 'Content-Type': 'application/x-ndjson' } },
      )),
    );
    render(<><ToastContainer /><AddonManager /></>);

    await screen.findByText('No models installed yet — pull one below.');
    await user.click(screen.getByRole('button', { name: 'Pull' }));

    await screen.findByText('manifest not found');
    expect(screen.queryByText('Model pulled')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pull' })).toBeEnabled());
    expect(screen.queryByText('Pulling…')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-028: blurring the base URL under a cloud provider queries no local models', async () => {
    const user = userEvent.setup();
    const urls: (string | null)[] = [];
    server.use(addonsRoute([llmAddon({ provider: 'openai' })]), modelsRoute([], urls));
    render(<AddonManager />);

    await screen.findByText('Provider');
    expect(screen.queryByText('Installed on the server')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('https://api.openai.com/v1'), 'https://proxy.local/v1');
    await user.tab();

    await waitFor(() => expect(screen.getByDisplayValue('https://proxy.local/v1')).toBeInTheDocument());
    expect(urls).toHaveLength(0);
  });
});
