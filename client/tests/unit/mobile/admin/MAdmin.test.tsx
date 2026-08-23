import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { fireEvent, render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildAdmin } from '../../../helpers/factories';
import { useAuthStore } from '../../../../src/store/authStore';
import { useAddonStore } from '../../../../src/store/addonStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdmin from '../../../../src/mobile/screens/admin/MAdmin';

// FE-MOB-ADMIN-001 onwards

// The permissions matrix is its own heavy panel — out of scope here. Mock the
// mobile panel MAdmin actually renders (it self-loads GET /api/admin/permissions).
vi.mock('../../../../src/mobile/screens/admin/MAdminPermissionsPanel', () => ({
  default: () => <div data-testid="permissions-panel" />,
}));

// Every other section panel has its own suite; here only the routing into them
// matters, so they are reduced to markers.
vi.mock('../../../../src/mobile/screens/admin/MAdminPluginsPanel', () => ({
  default: () => <div data-testid="plugins-panel" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminBackupPanel', () => ({
  default: () => <div data-testid="backup-panel" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminCategoryManager', () => ({
  default: () => <div data-testid="category-manager" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminPackingTemplateManager', () => ({
  default: () => <div data-testid="packing-templates" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminDefaultUserSettings', () => ({
  default: () => <div data-testid="default-user-settings" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminDevNotificationsPanel', () => ({
  default: () => <div data-testid="dev-notifications" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminNotificationsSection', () => ({
  default: () => <div data-testid="notifications-section" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminMcpTokensPanel', () => ({
  default: () => <div data-testid="mcp-tokens-panel" />,
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminAuditLogPanel', () => ({
  default: ({ serverTimezone }: { serverTimezone?: string }) => (
    <div data-testid="audit-panel">{serverTimezone}</div>
  ),
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminGitHubPanel', () => ({
  default: ({ isPrerelease }: { isPrerelease: boolean }) => (
    <div data-testid="github-panel">{String(isPrerelease)}</div>
  ),
}));
vi.mock('../../../../src/mobile/screens/admin/MAdminStoragePanel', () => ({
  default: () => <div data-testid="m-admin-storage-panel" />,
}));

// The addon manager is reduced to the two controls MAdmin wires itself.
vi.mock('../../../../src/mobile/screens/admin/MAdminAddonManager', () => ({
  default: ({
    bagTrackingEnabled,
    onToggleBagTracking,
    collabFeatures,
    onToggleCollabFeature,
  }: {
    bagTrackingEnabled: boolean;
    onToggleBagTracking: () => void;
    collabFeatures: Record<string, boolean>;
    onToggleCollabFeature: (key: string) => void;
  }) => (
    <div>
      <span data-testid="bag-state">{String(bagTrackingEnabled)}</span>
      <button type="button" onClick={onToggleBagTracking}>toggle bag</button>
      <span data-testid="chat-state">{String(collabFeatures.chat)}</span>
      <button type="button" onClick={() => onToggleCollabFeature('chat')}>toggle chat</button>
      <span data-testid="notes-state">{String(collabFeatures.notes)}</span>
      <button type="button" onClick={() => onToggleCollabFeature('notes')}>toggle notes</button>
    </div>
  ),
}));

function renderAdmin() {
  return render(
    <>
      <ToastContainer />
      <Routes>
        <Route path="/admin" element={<MAdmin />} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </>,
    { initialEntries: ['/admin'] },
  );
}

async function openSection(label: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Administration' }));
  fireEvent.click(screen.getByRole('button', { name: label }));
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin() });
  server.use(
    http.get('/api/admin/collab-features', () =>
      HttpResponse.json({ chat: true, notes: true, polls: true, whatsnext: true }),
    ),
    http.get('/api/admin/places-photos', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/places-autocomplete', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/places-details', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/invites/trips', () => HttpResponse.json({ trips: [] })),
  );
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdmin', () => {
  it('FE-MOB-ADMIN-001: renders stats grid and the user list with role badges', async () => {
    render(<MAdmin />);

    // Users load from GET /api/admin/users (MSW: admin + alice)
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();

    // Stats from GET /api/admin/stats: 42 places, 8 files
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-002: the section dropdown switches to the settings section', async () => {
    render(<MAdmin />);
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    // Open the switcher pill (labelled with the admin title)
    fireEvent.click(screen.getByRole('button', { name: 'Administration' }));

    // All standard sections are listed
    expect(screen.getByRole('button', { name: 'User Defaults' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Backup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Audit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    // Settings section renders the auth methods card, user list is gone
    await waitFor(() => expect(screen.getByText('Authentication Methods')).toBeInTheDocument());
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-003: the back button leaves for the dashboard', async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText('dashboard page')).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-004: the header plus opens the create-user sheet', async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

    expect(screen.getByRole('dialog', { name: 'Create User' })).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-005: MCP Access and the dev section stay hidden unless enabled', async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Administration' }));

    expect(screen.queryByRole('button', { name: 'MCP Access' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dev: Notifications' })).not.toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-006: the MCP addon adds its section to the dropdown', async () => {
    useAddonStore.setState({
      addons: [{ id: 'mcp', name: 'MCP', type: 'integration', icon: 'plug', enabled: true }],
      bagTracking: false,
      loaded: true,
    });
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    await openSection('MCP Access');

    expect(screen.getByTestId('mcp-tokens-panel')).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-007: dev mode adds the dev notifications section', async () => {
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), devMode: true });
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    await openSection('Dev: Notifications');

    expect(screen.getByTestId('dev-notifications')).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-008: every remaining section is reachable from the dropdown', async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    await openSection('User Defaults');
    expect(screen.getByTestId('default-user-settings')).toBeInTheDocument();

    await openSection('Personalization');
    expect(screen.getByTestId('packing-templates')).toBeInTheDocument();
    expect(screen.getByTestId('category-manager')).toBeInTheDocument();

    await openSection('Plugins');
    expect(screen.getByTestId('plugins-panel')).toBeInTheDocument();

    await openSection('Storage');
    expect(screen.getByTestId('m-admin-storage-panel')).toBeInTheDocument();

    await openSection('Notifications');
    expect(screen.getByTestId('notifications-section')).toBeInTheDocument();

    await openSection('Backup');
    expect(screen.getByTestId('backup-panel')).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-009: the audit and GitHub panels get the server timezone and prerelease flag', async () => {
    server.use(
      http.get('/api/admin/version-check', () =>
        HttpResponse.json({
          update_available: true,
          latest: '3.5.0',
          current: '3.4.0',
          is_prerelease: true,
          is_docker: true,
        }),
      ),
    );
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), serverTimezone: 'Europe/Berlin' });
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    await openSection('Audit');
    expect(screen.getByTestId('audit-panel')).toHaveTextContent('Europe/Berlin');

    await openSection('GitHub');
    await waitFor(() => expect(screen.getByTestId('github-panel')).toHaveTextContent('true'));
  });

  it('FE-MOB-ADMIN-010: the update banner opens the how-to-update sheet', async () => {
    server.use(
      http.get('/api/admin/version-check', () =>
        HttpResponse.json({ update_available: true, latest: '3.5.0', current: '3.4.0', is_docker: true }),
      ),
    );
    renderAdmin();

    await screen.findByText('Update available');
    expect(screen.getByText('Version v3.5.0 available · you have v3.4.0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(screen.getByRole('dialog', { name: 'How to Update' })).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-011: no banner when the version check reports no update', async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    expect(screen.queryByText('Update available')).not.toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-012: demo instances can save a baseline', async () => {
    let saved = false;
    server.use(
      http.post('/api/admin/save-demo-baseline', () => {
        saved = true;
        return HttpResponse.json({ success: true });
      }),
    );
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), demoMode: true });
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Save Baseline' }));

    await screen.findByText('Baseline saved! Resets will restore to this state.');
    expect(saved).toBe(true);
  });

  it('FE-MOB-ADMIN-013: a failing baseline save surfaces the server message', async () => {
    server.use(
      http.post('/api/admin/save-demo-baseline', () =>
        HttpResponse.json({ error: 'Not a demo instance' }, { status: 400 }),
      ),
    );
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), demoMode: true });
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Save Baseline' }));

    await screen.findByText('Not a demo instance');
  });

  it('FE-MOB-ADMIN-014: the bag tracking toggle persists and rolls back on failure', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.put('/api/admin/bag-tracking', async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1
          ? HttpResponse.json({ enabled: true })
          : HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    await openSection('Addons');

    expect(screen.getByTestId('bag-state')).toHaveTextContent('false');
    fireEvent.click(screen.getByRole('button', { name: 'toggle bag' }));
    await waitFor(() => expect(screen.getByTestId('bag-state')).toHaveTextContent('true'));

    // Second call fails → the optimistic value is reverted
    fireEvent.click(screen.getByRole('button', { name: 'toggle bag' }));
    await waitFor(() => expect(screen.getByTestId('bag-state')).toHaveTextContent('true'));
    expect(bodies).toEqual([{ enabled: true }, { enabled: false }]);
  });

  it('FE-MOB-ADMIN-015: a collab feature toggle sends only the changed key', async () => {
    let sent: Record<string, unknown> = {};
    server.use(
      http.put('/api/admin/collab-features', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...sent });
      }),
    );
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    await openSection('Addons');

    await waitFor(() => expect(screen.getByTestId('chat-state')).toHaveTextContent('true'));
    fireEvent.click(screen.getByRole('button', { name: 'toggle chat' }));

    await waitFor(() => expect(sent).toEqual({ chat: false }));
    expect(screen.getByTestId('chat-state')).toHaveTextContent('false');
  });

  it('FE-MOB-ADMIN-016: a failing collab update restores the previous flags', async () => {
    server.use(
      http.put('/api/admin/collab-features', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    await openSection('Addons');

    await waitFor(() => expect(screen.getByTestId('chat-state')).toHaveTextContent('true'));
    fireEvent.click(screen.getByRole('button', { name: 'toggle chat' }));

    await waitFor(() => expect(screen.getByTestId('chat-state')).toHaveTextContent('true'));
  });

  it('FE-MOB-ADMIN-018: a failing toggle only rolls back its own key', async () => {
    let releaseChat: () => void = () => {};
    server.use(
      http.put('/api/admin/collab-features', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        if ('chat' in body) {
          await new Promise<void>((resolve) => { releaseChat = resolve; });
          return HttpResponse.json({ error: 'boom' }, { status: 500 });
        }
        return HttpResponse.json({ ...body });
      }),
    );
    renderAdmin();
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    await openSection('Addons');

    await waitFor(() => expect(screen.getByTestId('chat-state')).toHaveTextContent('true'));
    fireEvent.click(screen.getByRole('button', { name: 'toggle chat' }));
    fireEvent.click(screen.getByRole('button', { name: 'toggle notes' }));
    await waitFor(() => expect(screen.getByTestId('notes-state')).toHaveTextContent('false'));

    releaseChat();

    // Chat comes back, but the notes toggle the admin made meanwhile survives.
    await waitFor(() => expect(screen.getByTestId('chat-state')).toHaveTextContent('true'));
    expect(screen.getByTestId('notes-state')).toHaveTextContent('false');
  });

  it('FE-MOB-ADMIN-017: the stats grid falls back to zero files', async () => {
    server.use(
      http.get('/api/admin/stats', () =>
        HttpResponse.json({ totalUsers: 3, totalTrips: 7, totalPlaces: 11 }),
      ),
    );
    renderAdmin();

    await screen.findByText('11');
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-018: the long admin flow scrolls with the document', async () => {
    // #1809: no height and no scroller of its own, otherwise iOS Safari never
    // sees the root scroller move and keeps its address bar at full height.
    const { container } = render(<MAdmin />);
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain('h-full');
    expect(root.className).not.toContain('overflow-y-auto');
  });

  it('FE-MOB-ADMIN-STOR-001: managed mode hides the Storage section', async () => {
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), managed: true });
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'Administration' }));
    expect(screen.queryByRole('button', { name: 'Storage' })).not.toBeInTheDocument();
  });
});
