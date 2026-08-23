// FE-MOB-SETNOTIF-001 onwards
import { describe, it, expect, beforeEach } from 'vitest';
import { useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildUser } from '../../../helpers/factories';
import { server } from '../../../helpers/msw/server';
import { useAuthStore } from '../../../../src/store/authStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MSettingsNotifications from '../../../../src/mobile/screens/settings/MSettingsNotifications';

const MASKED = '••••••••';

interface Channel {
  id: string;
  source: 'builtin' | 'plugin';
  labelKey?: string;
  label?: string;
  settingsPath?: string;
  active: boolean;
  configured: boolean;
}

const builtin = (id: string, over: Partial<Channel> = {}): Channel => ({
  id,
  source: 'builtin',
  labelKey: `settings.notificationPreferences.${id}`,
  active: true,
  configured: true,
  ...over,
});

function matrix(over: Record<string, unknown> = {}) {
  return {
    preferences: { trip_invite: { inapp: true, webhook: false } },
    channels: [builtin('inapp'), builtin('webhook')],
    event_types: ['trip_invite'],
    implemented_combos: { trip_invite: ['inapp', 'webhook'] },
    ...over,
  };
}

function usePrefs(payload: unknown) {
  server.use(http.get('/api/notifications/preferences', () => HttpResponse.json(payload)));
}

function useSettings(settings: Record<string, unknown>) {
  server.use(http.get('/api/settings', () => HttpResponse.json({ settings })));
}

/** Renders the current router location so navigate() calls are observable. */
function LocationProbe() {
  const loc = useLocation();
  return <span data-testid="loc">{`${loc.pathname}${loc.search}`}</span>;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  usePrefs(matrix());
  useSettings({});
  server.use(
    http.put('/api/notifications/preferences', () => HttpResponse.json({ success: true })),
    http.put('/api/settings', () => HttpResponse.json({ success: true })),
    http.post('/api/settings/bulk', () => HttpResponse.json({ success: true })),
    http.post('/api/notifications/test-webhook', () => HttpResponse.json({ success: true })),
    http.post('/api/notifications/test-ntfy', () => HttpResponse.json({ success: true })),
  );
});

describe('MSettingsNotifications', () => {
  it('FE-MOB-SETNOTIF-001: shows the loading line until the matrix arrives', async () => {
    usePrefs(new Promise(() => {}));
    render(<MSettingsNotifications />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('FE-MOB-SETNOTIF-002: a failing preferences load keeps the loading line instead of crashing', async () => {
    server.use(
      http.get('/api/notifications/preferences', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      http.get('/api/settings', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    render(<MSettingsNotifications />);
    await waitFor(() => expect(screen.getByText('Loading...')).toBeInTheDocument());
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('FE-MOB-SETNOTIF-003: reports when no active channel implements any event', async () => {
    usePrefs(matrix({ implemented_combos: { trip_invite: [] } }));
    render(<MSettingsNotifications />);
    expect(await screen.findByText(/No notification channels are configured/)).toBeInTheDocument();
  });

  it('FE-MOB-SETNOTIF-004: an inactive channel is neither a card nor a chip', async () => {
    usePrefs(matrix({ channels: [builtin('inapp'), builtin('webhook', { active: false })] }));
    render(<MSettingsNotifications />);

    await screen.findByText('Trip invitations');
    expect(screen.getByRole('button', { name: 'In-App' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Webhook' })).not.toBeInTheDocument();
    expect(screen.queryByText('Webhook URL')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETNOTIF-005: the webhook card renders with an unset placeholder and a disabled Test', async () => {
    render(<MSettingsNotifications />);

    expect(await screen.findByText('Webhook URL')).toBeInTheDocument();
    expect(screen.getByText(/Enter your Discord, Slack, or custom webhook URL/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://discord.com/api/webhooks/...')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
  });

  it('FE-MOB-SETNOTIF-006: an already-stored webhook is masked, never echoed into the field', async () => {
    useSettings({ webhook_url: MASKED });
    render(<MSettingsNotifications />);

    const input = await screen.findByPlaceholderText(MASKED);
    expect(input).toHaveValue('');
    // A stored URL is enough to test against, even with the field left blank.
    expect(screen.getByRole('button', { name: 'Test' })).toBeEnabled();
  });

  it('FE-MOB-SETNOTIF-007: saving the webhook writes the setting and toasts', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><MSettingsNotifications /></>);

    const input = await screen.findByPlaceholderText('https://discord.com/api/webhooks/...');
    await user.type(input, 'https://hooks.example.com/x');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Webhook URL saved')).toBeInTheDocument();
    expect(body).toEqual({ key: 'webhook_url', value: 'https://hooks.example.com/x' });
  });

  it('FE-MOB-SETNOTIF-008: a rejected webhook save toasts the generic error', async () => {
    const user = userEvent.setup();
    server.use(http.put('/api/settings', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    render(<><ToastContainer /><MSettingsNotifications /></>);

    await screen.findByPlaceholderText('https://discord.com/api/webhooks/...');
    const save = screen.getByRole('button', { name: 'Save' });
    await user.click(save);

    expect(await screen.findByText('Error')).toBeInTheDocument();
    await waitFor(() => expect(save).toBeEnabled());
  });

  it('FE-MOB-SETNOTIF-009: testing the webhook posts the typed URL and toasts on success', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/notifications/test-webhook', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><MSettingsNotifications /></>);

    await user.type(await screen.findByPlaceholderText('https://discord.com/api/webhooks/...'), 'https://hooks.example.com/x');
    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(await screen.findByText('Test webhook sent successfully')).toBeInTheDocument();
    expect(body).toEqual({ url: 'https://hooks.example.com/x' });
  });

  it('FE-MOB-SETNOTIF-010: a webhook test answering success:false shows the server error', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/notifications/test-webhook', () => HttpResponse.json({ success: false, error: 'Connection refused' })));
    useSettings({ webhook_url: 'https://hooks.example.com/x' });
    render(<><ToastContainer /><MSettingsNotifications /></>);

    await screen.findByDisplayValue('https://hooks.example.com/x');
    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(await screen.findByText('Connection refused')).toBeInTheDocument();
  });

  it('FE-MOB-SETNOTIF-011: a webhook test request failure falls back to the generic message', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/notifications/test-webhook', () => HttpResponse.json({ error: 'x' }, { status: 500 })));
    useSettings({ webhook_url: 'https://hooks.example.com/x' });
    render(<><ToastContainer /><MSettingsNotifications /></>);

    await screen.findByDisplayValue('https://hooks.example.com/x');
    const test = screen.getByRole('button', { name: 'Test' });
    await user.click(test);

    expect(await screen.findByText('Test webhook failed')).toBeInTheDocument();
    await waitFor(() => expect(test).toBeEnabled());
  });

  describe('ntfy channel', () => {
    beforeEach(() => {
      usePrefs(
        matrix({
          preferences: { trip_invite: { inapp: true, ntfy: true } },
          channels: [builtin('inapp'), builtin('ntfy')],
          implemented_combos: { trip_invite: ['inapp', 'ntfy'] },
          defaults: { ntfyServer: 'https://ntfy.admin.example' },
        }),
      );
    });

    it('FE-MOB-SETNOTIF-012: hydrates topic and server and offers the admin default as placeholder', async () => {
      useSettings({ ntfy_topic: 'my-topic', ntfy_server: '' });
      render(<MSettingsNotifications />);

      expect(await screen.findByDisplayValue('my-topic')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://ntfy.admin.example')).toHaveValue('');
      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-013: a stored access token is masked and can be cleared', async () => {
      const user = userEvent.setup();
      let body: Record<string, unknown> | null = null;
      useSettings({ ntfy_topic: 'my-topic', ntfy_token: MASKED });
      server.use(
        http.put('/api/settings', async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ success: true });
        }),
      );
      render(<><ToastContainer /><MSettingsNotifications /></>);

      expect(await screen.findByPlaceholderText(MASKED)).toHaveValue('');
      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(await screen.findByText('Access token cleared')).toBeInTheDocument();
      expect(body).toEqual({ key: 'ntfy_token', value: '' });
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument());
    });

    it('FE-MOB-SETNOTIF-014: a failing token clear keeps the button and toasts', async () => {
      const user = userEvent.setup();
      useSettings({ ntfy_topic: 'my-topic', ntfy_token: MASKED });
      server.use(http.put('/api/settings', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
      render(<><ToastContainer /><MSettingsNotifications /></>);

      await user.click(await screen.findByRole('button', { name: 'Clear' }));

      expect(await screen.findByText('Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-015: saving sends topic, server and a freshly typed token in one bulk write', async () => {
      const user = userEvent.setup();
      let body: { settings?: Record<string, unknown> } | null = null;
      useSettings({ ntfy_topic: 'my-topic', ntfy_server: 'https://ntfy.sh' });
      server.use(
        http.post('/api/settings/bulk', async ({ request }) => {
          body = (await request.json()) as { settings?: Record<string, unknown> };
          return HttpResponse.json({ success: true });
        }),
      );
      render(<><ToastContainer /><MSettingsNotifications /></>);

      await screen.findByDisplayValue('my-topic');
      await user.type(screen.getByPlaceholderText(''), 'tk_abc');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('Ntfy settings saved')).toBeInTheDocument();
      expect(body?.settings).toEqual({ ntfy_topic: 'my-topic', ntfy_server: 'https://ntfy.sh', ntfy_token: 'tk_abc' });
      // The token is now stored, so the Clear action appears.
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-016: saving without a token omits it from the payload', async () => {
      const user = userEvent.setup();
      let body: { settings?: Record<string, unknown> } | null = null;
      useSettings({ ntfy_topic: 'my-topic' });
      server.use(
        http.post('/api/settings/bulk', async ({ request }) => {
          body = (await request.json()) as { settings?: Record<string, unknown> };
          return HttpResponse.json({ success: true });
        }),
      );
      render(<MSettingsNotifications />);

      await screen.findByDisplayValue('my-topic');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(body).not.toBeNull());
      expect(body?.settings).toEqual({ ntfy_topic: 'my-topic', ntfy_server: '' });
    });

    it('FE-MOB-SETNOTIF-017: a rejected ntfy save toasts the generic error', async () => {
      const user = userEvent.setup();
      useSettings({ ntfy_topic: 'my-topic' });
      server.use(http.post('/api/settings/bulk', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
      render(<><ToastContainer /><MSettingsNotifications /></>);

      await screen.findByDisplayValue('my-topic');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('Error')).toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-018: Test needs a topic and sends the current topic, server and token', async () => {
      const user = userEvent.setup();
      let body: Record<string, unknown> | null = null;
      useSettings({});
      server.use(
        http.post('/api/notifications/test-ntfy', async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ success: true });
        }),
      );
      render(<><ToastContainer /><MSettingsNotifications /></>);

      const test = await screen.findByRole('button', { name: 'Test' });
      expect(test).toBeDisabled();

      await user.type(screen.getByPlaceholderText('my-trek-alerts'), 'alerts');
      await user.click(test);

      expect(await screen.findByText('Test ntfy notification sent successfully')).toBeInTheDocument();
      expect(body).toEqual({ topic: 'alerts', server: null, token: null });

      // A typed-in server overrides the admin default for the next test run.
      await user.type(screen.getByPlaceholderText('https://ntfy.admin.example'), 'https://ntfy.example.org');
      await user.click(test);
      await waitFor(() => expect(body).toEqual({ topic: 'alerts', server: 'https://ntfy.example.org', token: null }));
    });

    it('FE-MOB-SETNOTIF-019: an ntfy test answering success:false shows the server error', async () => {
      const user = userEvent.setup();
      useSettings({ ntfy_topic: 'alerts' });
      server.use(http.post('/api/notifications/test-ntfy', () => HttpResponse.json({ success: false, error: 'Topic unreachable' })));
      render(<><ToastContainer /><MSettingsNotifications /></>);

      await screen.findByDisplayValue('alerts');
      await user.click(screen.getByRole('button', { name: 'Test' }));

      expect(await screen.findByText('Topic unreachable')).toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-020: an ntfy test request failure falls back to the generic message', async () => {
      const user = userEvent.setup();
      useSettings({ ntfy_topic: 'alerts' });
      server.use(http.post('/api/notifications/test-ntfy', () => HttpResponse.json({ error: 'x' }, { status: 500 })));
      render(<><ToastContainer /><MSettingsNotifications /></>);

      await screen.findByDisplayValue('alerts');
      const test = screen.getByRole('button', { name: 'Test' });
      await user.click(test);

      expect(await screen.findByText('Test ntfy notification failed')).toBeInTheDocument();
      await waitFor(() => expect(test).toBeEnabled());
    });
  });

  describe('plugin channels', () => {
    const pluginChannel = (over: Partial<Channel> = {}): Channel => ({
      id: 'plugin:trek-gotify',
      source: 'plugin',
      label: 'Gotify',
      settingsPath: '/settings?tab=plugins',
      active: true,
      configured: true,
      ...over,
    });

    const pluginMatrix = (over: Partial<Channel> = {}) =>
      matrix({
        preferences: { trip_invite: { inapp: true, 'plugin:trek-gotify': false } },
        channels: [builtin('inapp'), pluginChannel(over)],
        implemented_combos: { trip_invite: ['inapp', 'plugin:trek-gotify'] },
      });

    it('FE-MOB-SETNOTIF-021: a configured plugin channel offers a test send and no configure link', async () => {
      usePrefs(pluginMatrix());
      render(<MSettingsNotifications />);

      // Once as its own card, once as a chip in the event row.
      await waitFor(() => expect(screen.getAllByText('Gotify')).toHaveLength(2));
      expect(screen.getByText(/Configured\. Manage credentials/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send test' })).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Configure' })).not.toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-022: an unconfigured plugin channel links to its settings page and blocks the test', async () => {
      const user = userEvent.setup();
      usePrefs(pluginMatrix({ configured: false }));
      render(<><MSettingsNotifications /><LocationProbe /></>);

      expect(await screen.findByText(/Not configured yet/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send test' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: 'Configure' }));
      expect(screen.getByTestId('loc')).toHaveTextContent('/settings?tab=plugins');
    });

    it('FE-MOB-SETNOTIF-023: Send test hits the generic channel route and toasts', async () => {
      const user = userEvent.setup();
      let called = '';
      usePrefs(pluginMatrix());
      server.use(
        http.post('/api/notifications/test/:channelId', ({ params }) => {
          called = String(params.channelId);
          return HttpResponse.json({ success: true });
        }),
      );
      render(<><ToastContainer /><MSettingsNotifications /></>);

      await user.click(await screen.findByRole('button', { name: 'Send test' }));

      expect(await screen.findByText('Test notification sent.')).toBeInTheDocument();
      expect(called).toBe('plugin:trek-gotify');
    });

    it('FE-MOB-SETNOTIF-024: a channel test answering success:false surfaces its error', async () => {
      const user = userEvent.setup();
      usePrefs(pluginMatrix());
      server.use(http.post('/api/notifications/test/:channelId', () => HttpResponse.json({ success: false, error: 'Gotify said no' })));
      render(<><ToastContainer /><MSettingsNotifications /></>);

      await user.click(await screen.findByRole('button', { name: 'Send test' }));
      expect(await screen.findByText('Gotify said no')).toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-025: a channel test request failure falls back to the generic message', async () => {
      const user = userEvent.setup();
      usePrefs(pluginMatrix());
      server.use(http.post('/api/notifications/test/:channelId', () => HttpResponse.json({ error: 'x' }, { status: 500 })));
      render(<><ToastContainer /><MSettingsNotifications /></>);

      const send = await screen.findByRole('button', { name: 'Send test' });
      await user.click(send);

      expect(await screen.findByText('Test failed.')).toBeInTheDocument();
      await waitFor(() => expect(send).toBeEnabled());
    });
  });

  describe('event matrix', () => {
    it('FE-MOB-SETNOTIF-026: tapping a chip flips the preference and PUTs the whole matrix', async () => {
      const user = userEvent.setup();
      let body: Record<string, Record<string, boolean>> | null = null;
      server.use(
        http.put('/api/notifications/preferences', async ({ request }) => {
          body = (await request.json()) as Record<string, Record<string, boolean>>;
          return HttpResponse.json({ success: true });
        }),
      );
      render(<MSettingsNotifications />);

      const chip = await screen.findByRole('button', { name: 'In-App' });
      await user.click(chip);

      await waitFor(() => expect(body).not.toBeNull());
      expect(body).toEqual({ trip_invite: { inapp: false, webhook: false } });
    });

    it('FE-MOB-SETNOTIF-027: a channel with no stored preference defaults to on', async () => {
      const user = userEvent.setup();
      let body: Record<string, Record<string, boolean>> | null = null;
      usePrefs(matrix({ preferences: {} }));
      server.use(
        http.put('/api/notifications/preferences', async ({ request }) => {
          body = (await request.json()) as Record<string, Record<string, boolean>>;
          return HttpResponse.json({ success: true });
        }),
      );
      render(<MSettingsNotifications />);

      await user.click(await screen.findByRole('button', { name: 'Webhook' }));

      await waitFor(() => expect(body).not.toBeNull());
      expect(body).toEqual({ trip_invite: { webhook: false } });
    });

    it('FE-MOB-SETNOTIF-028: a failing update rolls the matrix back', async () => {
      const user = userEvent.setup();
      let reject!: () => void;
      server.use(
        http.put(
          '/api/notifications/preferences',
          () => new Promise<Response>(resolve => { reject = () => resolve(HttpResponse.json({ error: 'nope' }, { status: 500 }) as unknown as Response); }),
        ),
      );
      render(<MSettingsNotifications />);

      const chip = await screen.findByRole('button', { name: 'In-App' });
      // The webhook chip is off in this matrix — its look is the "inactive" reference.
      const inactiveClass = screen.getByRole('button', { name: 'Webhook' }).className;
      const activeClass = chip.className;
      expect(activeClass).not.toBe(inactiveClass);

      await user.click(chip);
      // Flipped optimistically while the request is still in flight…
      await waitFor(() => expect(screen.getByRole('button', { name: 'In-App' }).className).toBe(inactiveClass));

      reject();
      // …and restored once the server rejects it.
      await waitFor(() => expect(screen.getByRole('button', { name: 'In-App' }).className).toBe(activeClass));
    });

    it('FE-MOB-SETNOTIF-032: a failing update toasts and leaves a later toggle alone', async () => {
      const user = userEvent.setup();
      let rejectInapp!: () => void;
      server.use(
        http.put('/api/notifications/preferences', async ({ request }) => {
          const body = (await request.json()) as Record<string, Record<string, boolean>>;
          // The first write is the in-app flip; it hangs until the test rejects it.
          if (body.trip_invite.webhook === false) {
            return new Promise<Response>(resolve => {
              rejectInapp = () => resolve(HttpResponse.json({ error: 'nope' }, { status: 500 }) as unknown as Response);
            });
          }
          return HttpResponse.json({ success: true });
        }),
      );
      render(<><ToastContainer /><MSettingsNotifications /></>);

      const inapp = await screen.findByRole('button', { name: 'In-App' });
      // The webhook chip is off in this matrix — its look is the "inactive" reference.
      const inactiveClass = screen.getByRole('button', { name: 'Webhook' }).className;
      const activeClass = inapp.className;

      await user.click(inapp);
      await waitFor(() => expect(screen.getByRole('button', { name: 'In-App' }).className).toBe(inactiveClass));

      // Flipped while the in-app write is still hanging.
      await user.click(screen.getByRole('button', { name: 'Webhook' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Webhook' }).className).toBe(activeClass));

      rejectInapp();

      expect(await screen.findByText('Error')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole('button', { name: 'In-App' }).className).toBe(activeClass));
      // The webhook toggle the user made meanwhile is not undone.
      expect(screen.getByRole('button', { name: 'Webhook' }).className).toBe(activeClass);
    });

    it('FE-MOB-SETNOTIF-029: the saving hint shows while the update is in flight', async () => {
      const user = userEvent.setup();
      let release!: () => void;
      server.use(
        http.put(
          '/api/notifications/preferences',
          () => new Promise<Response>(resolve => { release = () => resolve(HttpResponse.json({ success: true }) as unknown as Response); }),
        ),
      );
      render(<MSettingsNotifications />);

      await user.click(await screen.findByRole('button', { name: 'In-App' }));
      expect(await screen.findByText('Saving...')).toBeInTheDocument();

      release();
      await waitFor(() => expect(screen.queryByText('Saving...')).not.toBeInTheDocument());
    });

    it('FE-MOB-SETNOTIF-030: events without a matching channel are skipped, unknown ones keep their raw key', async () => {
      usePrefs(
        matrix({
          event_types: ['trip_invite', 'booking_change', 'weird_event'],
          implemented_combos: {
            trip_invite: ['inapp'],
            booking_change: ['email'],
            weird_event: ['webhook'],
          },
        }),
      );
      render(<MSettingsNotifications />);

      await screen.findByText('Trip invitations');
      // booking_change only implements the inactive email channel → no row at all.
      expect(screen.queryByText('Booking changes')).not.toBeInTheDocument();
      // No label key for weird_event → the raw event type is shown.
      expect(screen.getByText('weird_event')).toBeInTheDocument();
    });

    it('FE-MOB-SETNOTIF-031: a plugin channel without a label falls back to its id', async () => {
      usePrefs(
        matrix({
          preferences: { trip_invite: { 'plugin:x': true } },
          channels: [{ id: 'plugin:x', source: 'plugin', active: true, configured: true }],
          implemented_combos: { trip_invite: ['plugin:x'] },
        }),
      );
      render(<MSettingsNotifications />);

      const row = (await screen.findByText('Trip invitations')).parentElement as HTMLElement;
      expect(within(row).getByRole('button', { name: 'plugin:x' })).toBeInTheDocument();
    });
  });
});
