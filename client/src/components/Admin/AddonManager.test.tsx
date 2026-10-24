import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
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

function llmAddon(config: Record<string, unknown> = {}, enabled = true) {
  return buildAddon({
    id: 'llm_parsing',
    name: 'AI Parsing',
    description: 'Extract bookings from files',
    icon: 'Sparkles',
    type: 'integration',
    enabled,
    config,
  });
}

function aiAddon(id: string, name: string, enabled: boolean) {
  return buildAddon({ id, name, icon: id === 'mcp' ? 'Terminal' : 'Sparkles', type: 'integration', enabled });
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

/** A shelf of more than one row starts folded; open every one so its rows can be read. */
async function unfoldShelves(): Promise<void> {
  const bars = await screen.findAllByRole('button', { name: /\d+ options?/, expanded: false });
  for (const bar of bars) await userEvent.click(bar);
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
    http.get('/api/admin/addons', () => HttpResponse.json({ addons: [] })),
    http.get('/api/admin/tours-wanderer', () => HttpResponse.json({ enabled: false })),
    // The Tours switches load beside the list; unanswered, each would toast the same error as a failed list.
    http.get('/api/admin/tours-hiking-map', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/tours-cycle-map', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/tours-ski-routing', () => HttpResponse.json({ enabled: false }))
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
    await unfoldShelves();

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
    await unfoldShelves();

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

  it('FE-ADMIN-ADDON-033: document providers hang off Documents with their glyphs and stay out of the count', async () => {
    server.use(addonsRoute([
      buildAddon({ id: 'documents', name: 'Documents', icon: 'FileText', enabled: true }),
      buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: false }),
      buildAddon({ id: 'paperless', name: 'Paperless-ngx', description: 'Document archive', type: 'document_provider', enabled: true }),
      buildAddon({ id: 'nextcloud', name: 'Nextcloud', description: 'WebDAV files', type: 'document_provider', enabled: false }),
    ]));
    render(<AddonManager />);

    await unfoldShelves();

    await screen.findByText('Paperless-ngx');
    const paperlessRow = screen.getByText('Paperless-ngx').closest('li') as HTMLElement;
    expect(paperlessRow.querySelector('svg')).toBeInTheDocument();
    expect(isOn(subToggle('Paperless-ngx'))).toBe(true);
    expect(isOn(subToggle('Nextcloud'))).toBe(false);
    // Documents and Journey are the addons; an enabled provider is a shelf row
    // and must not turn 1/2 into 2/2.
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-034: document providers stay hidden while Documents itself is off', async () => {
    server.use(addonsRoute([
      buildAddon({ id: 'documents', name: 'Documents', icon: 'FileText', enabled: false }),
      buildAddon({ id: 'paperless', name: 'Paperless-ngx', type: 'document_provider', enabled: true }),
    ]));
    render(<AddonManager />);

    await screen.findByText('Documents');
    expect(screen.queryByText('Paperless-ngx')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-035: switching Documents off and on again shows the cascaded providers as off', async () => {
    const user = userEvent.setup();
    let loads = 0;
    let documentsOn = true;
    let paperlessOn = true;
    server.use(
      http.get('/api/admin/addons', () => {
        loads += 1;
        return HttpResponse.json({
          addons: [
            buildAddon({ id: 'documents', name: 'Documents', icon: 'FileText', enabled: documentsOn }),
            buildAddon({ id: 'paperless', name: 'Paperless-ngx', type: 'document_provider', enabled: paperlessOn }),
          ],
        });
      }),
      http.put('/api/admin/addons/documents', async ({ request }) => {
        documentsOn = (await request.json() as { enabled: boolean }).enabled;
        if (!documentsOn) paperlessOn = false;
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Paperless-ngx');

    await user.click(addonToggle('Documents'));
    await screen.findByText('Addon updated');
    expect(loads).toBe(2);
    expect(screen.queryByText('Paperless-ngx')).not.toBeInTheDocument();

    await user.click(addonToggle('Documents'));

    await screen.findByText('Paperless-ngx');
    expect(isOn(subToggle('Paperless-ngx'))).toBe(false);
  });

  it('FE-ADMIN-ADDON-036: toggling a document provider persists it without re-reading the list', async () => {
    const user = userEvent.setup();
    let loads = 0;
    let body: unknown = null;
    server.use(
      http.get('/api/admin/addons', () => {
        loads += 1;
        return HttpResponse.json({
          addons: [
            buildAddon({ id: 'documents', name: 'Documents', icon: 'FileText', enabled: true }),
            buildAddon({ id: 'papra', name: 'Papra', type: 'document_provider', enabled: false }),
          ],
        });
      }),
      http.put('/api/admin/addons/papra', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><AddonManager /></>);
    await screen.findByText('Papra');

    await user.click(subToggle('Papra'));

    await screen.findByText('Addon updated');
    expect(body).toEqual({ enabled: true });
    expect(loads).toBe(1);
    expect(isOn(subToggle('Papra'))).toBe(true);
  });

  it('FE-ADMIN-ADDON-018:the collab sub-features render their state and report the toggled key', async () => {
    const user = userEvent.setup();
    const onToggleCollabFeature = vi.fn();
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(
      <AddonManager
        collabFeatures={{ chat: true, notes: false, polls: false, whatsnext: true }}
        onToggleCollabFeature={onToggleCollabFeature}
      />,
    );

    await unfoldShelves();

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

  it('FE-ADMIN-ADDON-037: the links row describes the feature, not an empty list', async () => {
    // The row's tooltip is its description. The links tab's empty state read as a
    // status here, and a status that never changes reads as a broken feature.
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(
      <AddonManager
        collabFeatures={{ chat: true, notes: true, links: true, polls: true, whatsnext: true }}
        onToggleCollabFeature={vi.fn()}
      />
    );
    await unfoldShelves();

    const links = await screen.findByText('Links');
    expect(links).toHaveAttribute('title');
    expect(links.getAttribute('title')).not.toBe('No shared links yet');
  });

  it('FE-ADMIN-ADDON-020: the AI addons head the integration column as one tile with a switch each', async () => {
    server.use(
      addonsRoute([
        aiAddon('mcp', 'MCP', false),
        llmAddon({}, false),
        aiAddon('ai_assistant', 'AI Assistant', false),
        buildAddon({ id: 'airtrail', name: 'AirTrail', type: 'integration', icon: 'Plane' }),
      ]),
    );
    render(<AddonManager />);

    const tile = (await screen.findByText('AI')).closest('article') as HTMLElement;
    const switches = within(tile).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    // In the tile's order, whatever order the server sent them in.
    expect(switches).toEqual(['AI Assistant', 'AI Parsing', 'MCP']);
    expect(within(tile).getByText('0/3')).toBeInTheDocument();
    // Their own icons, keyed by id: the icon column of an install still says Sparkles or Terminal.
    expect(tile.querySelector('svg.lucide-messages-square')).toBeInTheDocument();
    expect(tile.querySelector('svg.lucide-scan-text')).toBeInTheDocument();
    expect(tile.querySelector('svg.lucide-cable')).toBeInTheDocument();
    // Nothing to set up while neither the assistant nor parsing is on.
    expect(within(tile).queryByRole('button', { name: 'Set up AI' })).toBeNull();
    // AirTrail is still its own tile in the same column.
    expect(screen.getByText('AirTrail').closest('article')).not.toBe(tile);
  });

  it('FE-ADMIN-ADDON-021: with parsing on, the tile offers the settings dialog, which closes again', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([llmAddon({}), aiAddon('ai_assistant', 'AI Assistant', false), aiAddon('mcp', 'MCP', true)]),
      http.get('/api/admin/ai/settings', () =>
        HttpResponse.json({ policy: 'instance_or_user', dailyTurns: 50, retention: { mode: 'days', days: 90 } }),
      ),
      http.get('/api/admin/ai/connection', () => HttpResponse.json({ connection: null, prefill: null })),
      http.get('/api/ai/status', () => HttpResponse.json({ error: 'not needed' }, { status: 404 })),
    );
    render(<AddonManager />);

    const tile = (await screen.findByText('AI')).closest('article') as HTMLElement;
    expect(within(tile).getByText('2/3')).toBeInTheDocument();
    await user.click(within(tile).getByRole('button', { name: 'Set up AI' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'AI Parsing' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'AI Assistant' })).toBeNull();
    const closes = within(dialog).getAllByRole('button', { name: 'Close' });
    await user.click(closes[closes.length - 1]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('FE-ADMIN-ADDON-040: a shelf of several options starts folded and says how many there are and how many are on', async () => {
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(
      <AddonManager
        collabFeatures={{ chat: true, notes: false, links: true, polls: false, whatsnext: false }}
        onToggleCollabFeature={vi.fn()}
      />
    );

    const bar = await screen.findByRole('button', { name: /5 options/, expanded: false });
    expect(bar).toHaveTextContent('2 on');
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();

    await userEvent.click(bar);
    expect(bar).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Chat')).toBeInTheDocument();

    await userEvent.click(bar);
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-041: a shelf of one option shows it at once, without a fold', async () => {
    server.use(addonsRoute([buildAddon({ id: 'packing', name: 'Lists', icon: 'ListChecks', enabled: true })]));
    render(<AddonManager bagTrackingEnabled onToggleBagTracking={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Bag Tracking' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\d+ options?/ })).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-042: wanderer hangs off Tours and saves its switch', async () => {
    const puts: unknown[] = [];
    server.use(
      addonsRoute([buildAddon({ id: 'tours', name: 'Tours', icon: 'Mountain', enabled: true })]),
      http.put('/api/admin/tours-wanderer', async ({ request }) => {
        puts.push(await request.json());
        return HttpResponse.json({ enabled: true });
      })
    );
    render(
      <>
        <AddonManager />
        <ToastContainer />
      </>
    );

    // Folded like Collab's and Documents' options until the bar is opened.
    await screen.findByRole('button', { name: /\d+ options?/, expanded: false });
    expect(screen.queryByRole('button', { name: 'wanderer' })).not.toBeInTheDocument();
    await unfoldShelves();
    const toggle = await screen.findByRole('button', { name: 'wanderer' });
    expect(isOn(toggle)).toBe(false);
    await userEvent.click(toggle);

    await waitFor(() => expect(puts).toEqual([{ enabled: true }]));
    expect(isOn(screen.getByRole('button', { name: 'wanderer' }))).toBe(true);
  });

  it('FE-ADMIN-ADDON-043: a failed wanderer save puts the switch back', async () => {
    server.use(
      addonsRoute([buildAddon({ id: 'tours', name: 'Tours', icon: 'Mountain', enabled: true })]),
      http.put('/api/admin/tours-wanderer', () => HttpResponse.json({ error: 'nope' }, { status: 500 }))
    );
    render(
      <>
        <AddonManager />
        <ToastContainer />
      </>
    );

    await unfoldShelves();
    await userEvent.click(await screen.findByRole('button', { name: 'wanderer' }));

    await waitFor(() => expect(isOn(screen.getByRole('button', { name: 'wanderer' }))).toBe(false));
  });

  it('FE-ADMIN-ADDON-044: Tours and Road trip show their own icons, not the fallback puzzle', async () => {
    server.use(
      addonsRoute([
        buildAddon({ id: 'tours', name: 'Tours', icon: 'Mountain', enabled: false }),
        buildAddon({ id: 'roadtrip', name: 'Road trip', icon: 'Route', enabled: false }),
      ])
    );
    render(<AddonManager />);

    const tours = (await screen.findByText('Tours')).closest('article') as HTMLElement;
    const roadtrip = screen.getByText('Road trip').closest('article') as HTMLElement;
    expect(tours.querySelector('svg.lucide-mountain')).toBeInTheDocument();
    expect(roadtrip.querySelector('svg.lucide-car-front')).toBeInTheDocument();
    expect(tours.querySelector('svg.lucide-puzzle')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-ADDON-045: finds an addon by name or description and shows the ones on or off', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([
        buildAddon({ id: 'x-lists', name: 'Todo List', description: 'Track tasks', type: 'trip', enabled: true }),
        buildAddon({ id: 'x-costs', name: 'Budget', description: 'Split costs', type: 'trip', enabled: false }),
        buildAddon({ id: 'x-holiday', name: 'Vacay', description: 'Holiday planner', type: 'global', enabled: true }),
      ])
    );
    render(<AddonManager />);
    await screen.findByText('Todo List');

    await user.type(screen.getByRole('searchbox', { name: 'Search addons' }), 'costs');
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.queryByText('Todo List')).toBeNull();
    expect(screen.queryByText('Vacay')).toBeNull();

    await user.clear(screen.getByRole('searchbox', { name: 'Search addons' }));
    await user.click(screen.getByRole('button', { name: 'On' }));
    expect(screen.getByText('Todo List')).toBeInTheDocument();
    expect(screen.getByText('Vacay')).toBeInTheDocument();
    expect(screen.queryByText('Budget')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Off' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search addons' }), 'nothing like this');
    expect(screen.getByText('No addon matches the search or the filter.')).toBeInTheDocument();
  });
});

