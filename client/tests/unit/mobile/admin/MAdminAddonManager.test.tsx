import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { act, render, screen, waitFor, within } from '../../../helpers/render';
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

let loadAddonsSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }) });
  loadAddonsSpy = vi.spyOn(useAddonStore.getState(), 'loadAddons').mockResolvedValue(undefined);
  server.use(addonsRoute([]));
});

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove('dark');
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

  it('FE-MOB-AADD-003: the dark palette swaps the wordmark', async () => {
    // The wordmark reads the .dark class, the same source applyAppearance() writes
    // for dark and for auto under a dark OS theme.
    document.documentElement.classList.add('dark');
    render(<MAdminAddonManager />);
    await screen.findByText('No addons available');
    expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/text-light.svg');
  });

  it('FE-MOB-AADD-004: a failing load toasts the addon error', async () => {
    // A server error, not a dropped connection: a network error starts the client's
    // connectivity probe, and whether the app then counts itself offline (and stays
    // quiet, as it should offline) raced the toast on a loaded runner.
    server.use(http.get('/api/admin/addons', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    render(<><ToastContainer /><MAdminAddonManager /></>);

    await screen.findByText('Failed to update addon');
    // The empty state follows the toast once loading has ended, not in the same render.
    expect(await screen.findByText('No addons available')).toBeInTheDocument();
  });

  it('FE-MOB-AADD-005: trip addons render with the section band, catalog label and type badge', async () => {
    server.use(addonsRoute([buildAddon({ id: 'packing', name: 'Packing', enabled: true })]));
    render(<MAdminAddonManager />);

    await screen.findByText('Lists');
    // The band names the type and says what it means on a line of its own, no dash between them.
    expect(screen.getByText('Available as a tab within each trip')).toBeInTheDocument();
    expect(screen.getByText('Packing lists and to-do tasks for your trips')).toBeInTheDocument();
    expect(screen.getAllByText('Trip')).toHaveLength(2);
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

  it('FE-MOB-AADD-032: the links row describes the feature, not an empty list', async () => {
    // The line under the row is its description. The links tab's empty state
    // read as a status here, and a status that never changes reads as a
    // broken feature.
    server.use(addonsRoute([buildAddon({ id: 'collab', name: 'Collab', enabled: true })]));
    render(
      <MAdminAddonManager
        collabFeatures={{ chat: true, notes: true, links: true, polls: true, whatsnext: true }}
        onToggleCollabFeature={vi.fn()}
      />,
    );

    await screen.findByText('Links');
    expect(screen.getByText('Shared links and bookmarks')).toBeInTheDocument();
    expect(screen.queryByText('No shared links yet')).not.toBeInTheDocument();
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
    expect(screen.getByText('Available as a standalone section in the main navigation')).toBeInTheDocument();
    expect(screen.getByText('Synology Photos')).toBeInTheDocument();
    expect(screen.getByText('Unsplash')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Immich' })).toHaveAttribute('aria-checked', 'true');
    // Journey + three providers, and providers are not shown as top-level rows.
    expect(screen.getAllByRole('switch')).toHaveLength(4);
    // The band and the addon's type badge both say Global.
    expect(screen.getAllByText('Global')).toHaveLength(2);
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

  it('FE-MOB-AADD-034: a failing provider toggle keeps a provider toggled while it was in flight', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([
        buildAddon({ id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true }),
        buildAddon({ id: 'immich', name: 'Immich', description: 'Self-hosted photos', type: 'photo_provider', enabled: false }),
        buildAddon({ id: 'unsplash', name: 'Unsplash', description: 'Stock photos', type: 'photo_provider', enabled: false }),
      ]),
      http.put('/api/admin/addons/immich', () => HttpResponse.json({ success: true })),
      http.put('/api/admin/addons/unsplash', async () => {
        await delay(150);
        return HttpResponse.error();
      }),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);
    await screen.findByText('Immich');

    // Unsplash is still saving when Immich goes on and through.
    await user.click(screen.getByRole('switch', { name: 'Unsplash' }));
    await user.click(screen.getByRole('switch', { name: 'Immich' }));
    await screen.findByText('Addon updated');

    await screen.findByText('Failed to update addon');
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Unsplash' })).toHaveAttribute('aria-checked', 'false'));
    expect(screen.getByRole('switch', { name: 'Immich' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-AADD-026: switching the journey addon off and on again shows the cascaded providers as off', async () => {
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
    render(<><ToastContainer /><MAdminAddonManager /></>);
    await screen.findByText('Immich');

    await user.click(screen.getByRole('switch', { name: 'Journey' }));
    // The toast closes the whole toggle, re-read included.
    await screen.findByText('Addon updated');
    expect(loads).toBe(2);
    expect(screen.queryByText('Immich')).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Journey' }));

    await screen.findByText('Immich');
    expect(screen.getByRole('switch', { name: 'Immich' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-AADD-027: a toggle the server does not cascade keeps the snapshot it has', async () => {
    const user = userEvent.setup();
    let loads = 0;
    server.use(
      http.get('/api/admin/addons', () => {
        loads += 1;
        return HttpResponse.json({ addons: [buildAddon({ id: 'todo', enabled: false })] });
      }),
      http.put('/api/admin/addons/todo', () => HttpResponse.json({ success: true })),
    );
    render(<><ToastContainer /><MAdminAddonManager /></>);
    await screen.findByText('Todo List');

    await user.click(screen.getByRole('switch', { name: 'Todo List' }));

    await screen.findByText('Addon updated');
    expect(loads).toBe(1);
    expect(screen.getByRole('switch', { name: 'Todo List' })).toHaveAttribute('aria-checked', 'true');
  });

  describe('document providers', () => {
    const documents = (enabled = true) =>
      buildAddon({ id: 'documents', name: 'Documents', description: 'Store and manage travel documents', icon: 'FileText', enabled });
    const docProvider = (id: string, name: string, enabled: boolean) =>
      buildAddon({ id, name, description: `${name} archive`, icon: id, type: 'document_provider', enabled });

    it('FE-MOB-AADD-028: they render as sub-rows under the Documents addon, not as addons of their own', async () => {
      server.use(
        addonsRoute([
          documents(),
          docProvider('paperless', 'Paperless-ngx', false),
          docProvider('nextcloud', 'Nextcloud', true),
        ]),
      );
      render(<MAdminAddonManager />);

      await screen.findByText('Paperless-ngx');
      expect(screen.getByText('Nextcloud archive')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'Paperless-ngx' })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('switch', { name: 'Nextcloud' })).toHaveAttribute('aria-checked', 'true');
      // Documents plus two providers, and neither provider carries a type badge of its own.
      expect(screen.getAllByRole('switch')).toHaveLength(3);
      // The band and the addon's type badge.
      expect(screen.getAllByText('Trip')).toHaveLength(2);
    });

    it('FE-MOB-AADD-029: the shelf stays hidden while Documents is off', async () => {
      server.use(addonsRoute([documents(false), docProvider('paperless', 'Paperless-ngx', false)]));
      render(<MAdminAddonManager />);

      await screen.findByText('Documents');
      expect(screen.queryByText('Paperless-ngx')).not.toBeInTheDocument();
      expect(screen.getAllByRole('switch')).toHaveLength(1);
    });

    it('FE-MOB-AADD-030: toggling one persists it and rolls back on failure', async () => {
      const user = userEvent.setup();
      let body: unknown = null;
      server.use(
        addonsRoute([
          documents(),
          docProvider('paperless', 'Paperless-ngx', false),
          docProvider('papra', 'Papra', false),
        ]),
        http.put('/api/admin/addons/paperless', async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ success: true });
        }),
        http.put('/api/admin/addons/papra', () => HttpResponse.error()),
      );
      render(<><ToastContainer /><MAdminAddonManager /></>);
      await screen.findByText('Paperless-ngx');

      await user.click(screen.getByRole('switch', { name: 'Paperless-ngx' }));
      await waitFor(() => expect(body).toEqual({ enabled: true }));
      expect(screen.getByRole('switch', { name: 'Paperless-ngx' })).toHaveAttribute('aria-checked', 'true');
      await screen.findByText('Addon updated');
      expect(loadAddonsSpy).toHaveBeenCalled();

      await user.click(screen.getByRole('switch', { name: 'Papra' }));
      await screen.findByText('Failed to update addon');
      await waitFor(() => expect(screen.getByRole('switch', { name: 'Papra' })).toHaveAttribute('aria-checked', 'false'));
      expect(screen.getByRole('switch', { name: 'Paperless-ngx' })).toHaveAttribute('aria-checked', 'true');
    });

    it('FE-MOB-AADD-031: switching Documents off and on again shows the cascaded providers as off', async () => {
      const user = userEvent.setup();
      let loads = 0;
      let documentsOn = true;
      let paperlessOn = true;
      server.use(
        http.get('/api/admin/addons', () => {
          loads += 1;
          return HttpResponse.json({
            addons: [documents(documentsOn), docProvider('paperless', 'Paperless-ngx', paperlessOn)],
          });
        }),
        http.put('/api/admin/addons/documents', async ({ request }) => {
          documentsOn = (await request.json() as { enabled: boolean }).enabled;
          // Documents off takes its providers with it, see admin.service.ts.
          if (!documentsOn) paperlessOn = false;
          return HttpResponse.json({ success: true });
        }),
      );
      render(<><ToastContainer /><MAdminAddonManager /></>);
      await screen.findByText('Paperless-ngx');

      await user.click(screen.getByRole('switch', { name: 'Documents' }));
      await screen.findByText('Addon updated');
      expect(loads).toBe(2);
      expect(screen.queryByText('Paperless-ngx')).not.toBeInTheDocument();

      await user.click(screen.getByRole('switch', { name: 'Documents' }));

      await screen.findByText('Paperless-ngx');
      expect(screen.getByRole('switch', { name: 'Paperless-ngx' })).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('FE-MOB-AADD-016: the AI addons head the integration card as one group with a switch each', async () => {
    server.use(
      addonsRoute([
        buildAddon({ id: 'mcp', name: 'MCP', icon: 'Terminal', type: 'integration', enabled: false }),
        { ...llmAddon(), enabled: false },
        buildAddon({ id: 'ai_assistant', name: 'AI Assistant', icon: 'Sparkles', type: 'integration', enabled: false }),
      ]),
    );
    render(<MAdminAddonManager />);

    await screen.findByText('AI');
    const names = screen.getAllByRole('switch').map(s => s.getAttribute('aria-label'));
    expect(names).toEqual(['AI Assistant', 'AI Parsing', 'MCP']);
    expect(screen.getByText('0/3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set up AI' })).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-017: with the assistant on, the group opens the AI settings dialog', async () => {
    const user = userEvent.setup();
    server.use(
      addonsRoute([buildAddon({ id: 'ai_assistant', name: 'AI Assistant', icon: 'Sparkles', type: 'integration', enabled: true })]),
      http.get('/api/admin/ai/settings', () =>
        HttpResponse.json({ policy: 'instance_or_user', dailyTurns: 50, retention: { mode: 'days', days: 90 } }),
      ),
      http.get('/api/admin/ai/connection', () => HttpResponse.json({ connection: null, prefill: null })),
      http.get('/api/ai/status', () => HttpResponse.json({ error: 'not needed' }, { status: 404 })),
    );
    render(<MAdminAddonManager />);

    await user.click(await screen.findByRole('button', { name: 'Set up AI' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'AI Parsing' })).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-036: collab and AI parsing show their own icons, not the puzzle fallback', async () => {
    server.use(
      addonsRoute([
        buildAddon({ id: 'collab', name: 'Collab', icon: 'Users', enabled: true }),
        buildAddon({ id: 'llm_parsing', name: 'AI Parsing', icon: 'Sparkles', type: 'integration', enabled: false }),
      ]),
    );
    render(<MAdminAddonManager />);

    await screen.findByRole('switch', { name: 'Collab' });
    expect(document.querySelector('svg.lucide-users')).toBeInTheDocument();
    // The AI group carries the sparkles; AI parsing its own glyph, keyed by id.
    expect(document.querySelector('svg.lucide-sparkles')).toBeInTheDocument();
    expect(document.querySelector('svg.lucide-scan-text')).toBeInTheDocument();
    expect(document.querySelector('svg.lucide-puzzle')).not.toBeInTheDocument();
  });

  it('FE-MOB-AADD-037: under auto the wordmark follows an OS theme switch without a re-render', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'auto' }) });
    render(<MAdminAddonManager />);
    await screen.findByText('No addons available');
    expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/text-dark.svg');

    // applyAppearance() flips the .dark class when the OS theme changes under auto.
    act(() => document.documentElement.classList.add('dark'));
    await waitFor(() => expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/text-light.svg'));
  });
  it('FE-MOB-AADD-030: wanderer hangs off an enabled Tours addon and saves its switch', async () => {
    const user = userEvent.setup();
    const puts: unknown[] = [];
    server.use(
      addonsRoute([buildAddon({ id: 'tours', name: 'Tours', icon: 'Mountain', enabled: true })]),
      http.get('/api/admin/tours-wanderer', () => HttpResponse.json({ enabled: false })),
      http.put('/api/admin/tours-wanderer', async ({ request }) => {
        puts.push(await request.json());
        return HttpResponse.json({ enabled: true });
      })
    );
    render(<MAdminAddonManager />);

    const toggle = await screen.findByRole('switch', { name: 'wanderer' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    await waitFor(() => expect(puts).toEqual([{ enabled: true }]));
  });
});
