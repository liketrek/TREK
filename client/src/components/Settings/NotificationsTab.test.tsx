import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { ToastContainer } from '../shared/Toast';
import NotificationsTab from './NotificationsTab';

const minimalMatrix = {
  preferences: {
    trip_invite: { inapp: true, email: false },
  },
  channels: [
    {
      id: 'email',
      source: 'builtin',
      labelKey: 'settings.notificationPreferences.email',
      active: true,
      configured: true,
    },
    {
      id: 'webhook',
      source: 'builtin',
      labelKey: 'settings.notificationPreferences.webhook',
      active: false,
      configured: true,
    },
    {
      id: 'inapp',
      source: 'builtin',
      labelKey: 'settings.notificationPreferences.inapp',
      active: true,
      configured: true,
    },
  ],
  event_types: ['trip_invite'],
  implemented_combos: { trip_invite: ['inapp', 'email'] },
};

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  server.use(
    http.get('/api/notifications/preferences', () => HttpResponse.json(minimalMatrix)),
    http.get('/api/settings', () => HttpResponse.json({ settings: { webhook_url: '' } })),
    http.put('/api/notifications/preferences', () => HttpResponse.json({ success: true }))
  );
});

describe('NotificationsTab', () => {
  it('FE-COMP-NOTIFICATIONS-001: shows loading state initially', () => {
    server.use(http.get('/api/notifications/preferences', () => new Promise(() => {})));
    render(<NotificationsTab />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIFICATIONS-002: renders the matrix after preferences load', async () => {
    render(<NotificationsTab />);
    // The event label is translated; fallback is the key itself
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    // Should render a toggle (ToggleSwitch renders a button)
    const toggles = await screen.findAllByRole('button');
    expect(toggles.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NOTIFICATIONS-003: renders channel header labels', async () => {
    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    // inapp channel header should appear (either translated or raw key)
    const headers = screen.getAllByText(/inapp|in.?app/i);
    expect(headers.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NOTIFICATIONS-004: shows "no channels" message when no channels are available', async () => {
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: {},
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: false,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: false,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'email'] },
        })
      )
    );
    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    // Should show noChannels message (translated or key)
    const noChannelEl = await screen.findByText(/no.*channel|noChannels/i);
    expect(noChannelEl).toBeInTheDocument();
  });

  it('FE-COMP-NOTIFICATIONS-005: shows a dash for event/channel combos not implemented', async () => {
    // Use two events: booking_change only implements email (making email visible),
    // but trip_invite only implements inapp — so trip_invite row gets a dash for email
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true }, booking_change: { email: true } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: true,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: false,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite', 'booking_change'],
          implemented_combos: {
            trip_invite: ['inapp'], // no email → dash in email column
            booking_change: ['email'], // no inapp → dash in inapp column
          },
        })
      )
    );
    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    // A dash should appear for non-implemented combos
    const dashes = await screen.findAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NOTIFICATIONS-006: clicking a toggle calls the preferences API', async () => {
    const user = userEvent.setup();
    let capturedBody: unknown = null;
    server.use(
      http.put('/api/notifications/preferences', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // minimalMatrix has inapp:true and email:false for trip_invite
    // The grid renders email column first, then inapp. We need the inapp toggle.
    // The inapp toggle is "on" (background accent), email is "off".
    // Find by looking at all buttons — inapp toggle should be 2nd (index 1) since email column comes first.
    const toggleButtons = await screen.findAllByRole('button');
    // There are 2 toggles: email (index 0, off) and inapp (index 1, on)
    await user.click(toggleButtons[1]);

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    // inapp was true, so after click it should be false
    const body = capturedBody as Record<string, Record<string, boolean>>;
    expect(body.trip_invite?.inapp).toBe(false);
  });

  it('FE-COMP-NOTIFICATIONS-007: toggle rolls back on API error', async () => {
    const user = userEvent.setup();
    server.use(http.put('/api/notifications/preferences', () => HttpResponse.json({ error: 'fail' }, { status: 500 })));

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find the inapp toggle for trip_invite — it starts as "on"
    const toggleButtons = await screen.findAllByRole('button');
    const toggleBtn = toggleButtons[0];

    // Verify the initial state via aria-checked or style; click and wait for rollback
    await user.click(toggleBtn);

    // After the error, the toggle should revert back (still rendered in the DOM)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });

    // The toggle should still be present (not removed on error)
    const buttonsAfter = screen.getAllByRole('button');
    expect(buttonsAfter.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NOTIFICATIONS-008: shows "Saving…" indicator while update is in flight', async () => {
    const user = userEvent.setup();
    let resolveRequest!: () => void;
    server.use(
      http.put(
        '/api/notifications/preferences',
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = () => resolve(HttpResponse.json({ success: true }) as unknown as Response);
          })
      )
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const toggleButtons = await screen.findAllByRole('button');
    await user.click(toggleButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    resolveRequest();

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('FE-COMP-NOTIFICATIONS-009: webhook URL section renders when webhook channel is available', async () => {
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, webhook: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: true,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'webhook'] },
        })
      )
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Webhook URL input should be present
    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();

    // Save button should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons.some((b) => /save/i.test(b.textContent || ''))).toBe(true);
  });

  it('FE-COMP-NOTIFICATIONS-010: webhook URL input shows masked placeholder when webhook is already set', async () => {
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, webhook: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: true,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'webhook'] },
        })
      ),
      http.get('/api/settings', () => HttpResponse.json({ settings: { webhook_url: '••••••••' } }))
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const input = await screen.findByRole('textbox');
    expect(input).toHaveAttribute('placeholder', '••••••••');
  });

  it('FE-COMP-NOTIFICATIONS-011: clicking Save webhook calls settings API', async () => {
    const user = userEvent.setup();
    let capturedBody: unknown = null;
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, webhook: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: true,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'webhook'] },
        })
      ),
      http.put('/api/settings', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const input = await screen.findByRole('textbox');
    await user.type(input, 'https://example.com/hook');

    const saveBtn = screen.getAllByRole('button').find((b) => /save/i.test(b.textContent || ''));
    expect(saveBtn).toBeDefined();
    await user.click(saveBtn!);

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });
  });

  it('FE-COMP-NOTIFICATIONS-012: Test button is disabled when no URL is set and no existing webhook', async () => {
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, webhook: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: true,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'webhook'] },
        })
      ),
      http.get('/api/settings', () => HttpResponse.json({ settings: { webhook_url: '' } }))
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await screen.findByRole('textbox');
    const testBtn = screen.getAllByRole('button').find((b) => /test/i.test(b.textContent || ''));
    expect(testBtn).toBeDefined();
    expect(testBtn).toBeDisabled();
  });

  it('FE-COMP-NOTIFICATIONS-013: successful test webhook shows success toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, webhook: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: true,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'webhook'] },
        })
      ),
      http.post('/api/notifications/test-webhook', () => HttpResponse.json({ success: true }))
    );

    render(
      <>
        <NotificationsTab />
        <ToastContainer />
      </>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const input = await screen.findByRole('textbox');
    await user.type(input, 'https://example.com/hook');

    const testBtn = screen.getAllByRole('button').find((b) => /test/i.test(b.textContent || ''));
    expect(testBtn).toBeDefined();
    await user.click(testBtn!);

    // Success toast should appear
    await waitFor(() => {
      const toastText = screen.queryByText(/testSuccess|success|sent/i);
      expect(toastText).toBeInTheDocument();
    });
  });

  it('FE-COMP-NOTIFICATIONS-ntfy-001: ntfy topic input renders when ntfy channel is available', async () => {
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, ntfy: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: false,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
            {
              id: 'ntfy',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.ntfy',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'ntfy'] },
        })
      )
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Ntfy topic input should be present (placeholder text from i18n key or EN default)
    const inputs = await screen.findAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NOTIFICATIONS-ntfy-002: ntfy test button disabled when no topic entered', async () => {
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, ntfy: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: false,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
            {
              id: 'ntfy',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.ntfy',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'ntfy'] },
        })
      ),
      http.get('/api/settings', () => HttpResponse.json({ settings: { ntfy_topic: '' } }))
    );

    render(<NotificationsTab />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Test button should be disabled when topic is empty
    const allButtons = await screen.findAllByRole('button');
    const testBtn = allButtons.find((b) => /test/i.test(b.textContent || ''));
    expect(testBtn).toBeDefined();
    expect(testBtn).toBeDisabled();
  });

  it('FE-COMP-NOTIFICATIONS-ntfy-003: entering topic and clicking Test calls test-ntfy API', async () => {
    const user = userEvent.setup();
    let ntfyCalled = false;
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, ntfy: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: false,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
            {
              id: 'ntfy',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.ntfy',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'ntfy'] },
        })
      ),
      http.post('/api/notifications/test-ntfy', () => {
        ntfyCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    render(
      <>
        <NotificationsTab />
        <ToastContainer />
      </>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find the topic input (first textbox in the ntfy block) and type a topic
    const inputs = await screen.findAllByRole('textbox');
    await user.type(inputs[0], 'my-test-topic');

    // Test button should now be enabled
    const allButtons = screen.getAllByRole('button');
    const testBtn = allButtons.find((b) => /test/i.test(b.textContent || ''));
    expect(testBtn).toBeDefined();
    expect(testBtn).not.toBeDisabled();

    await user.click(testBtn!);

    await waitFor(() => {
      expect(ntfyCalled).toBe(true);
    });
  });

  it('FE-COMP-NOTIFICATIONS-014: failed test webhook shows error toast with message', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/notifications/preferences', () =>
        HttpResponse.json({
          preferences: { trip_invite: { inapp: true, webhook: false } },
          channels: [
            {
              id: 'email',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.email',
              active: false,
              configured: true,
            },
            {
              id: 'webhook',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.webhook',
              active: true,
              configured: true,
            },
            {
              id: 'inapp',
              source: 'builtin',
              labelKey: 'settings.notificationPreferences.inapp',
              active: true,
              configured: true,
            },
          ],
          event_types: ['trip_invite'],
          implemented_combos: { trip_invite: ['inapp', 'webhook'] },
        })
      ),
      http.post('/api/notifications/test-webhook', () =>
        HttpResponse.json({ success: false, error: 'Connection refused' })
      )
    );

    render(
      <>
        <NotificationsTab />
        <ToastContainer />
      </>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const input = await screen.findByRole('textbox');
    await user.type(input, 'https://example.com/hook');

    const testBtn = screen.getAllByRole('button').find((b) => /test/i.test(b.textContent || ''));
    expect(testBtn).toBeDefined();
    await user.click(testBtn!);

    // Error toast with 'Connection refused' should appear
    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });
  });

  it('FE-COMP-NOTIFICATIONS-030: a failing toggle surfaces the generic error', async () => {
    const user = userEvent.setup();
    server.use(
      http.put('/api/notifications/preferences', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    const toggles = await screen.findAllByRole('button');
    await user.click(toggles[0]);

    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIFICATIONS-031: a failing toggle leaves a later toggle alone', async () => {
    const user = userEvent.setup();
    const bodies: Record<string, Record<string, boolean>>[] = [];
    let rejectEmail!: () => void;
    server.use(
      http.put('/api/notifications/preferences', async ({ request }) => {
        const body = (await request.json()) as Record<string, Record<string, boolean>>;
        bodies.push(body);
        if (body.trip_invite?.email !== undefined) {
          return new Promise<Response>(resolve => {
            rejectEmail = () => resolve(HttpResponse.json({ error: 'nope' }, { status: 500 }) as unknown as Response);
          });
        }
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><NotificationsTab /><ToastContainer /></>);
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // Email is off in this matrix, in-app is on.
    const [email, inapp] = await screen.findAllByRole('button');
    await user.click(email);
    await waitFor(() => expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'true'));

    // Flipped while the email write is still hanging.
    await user.click(inapp);
    await waitFor(() => expect(bodies).toHaveLength(2));
    await waitFor(() => expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-pressed', 'false'));
    // The in-app write must not carry the email cell, or the server would keep the
    // value the failing write is about to take back.
    expect(bodies[1].trip_invite.email).toBeUndefined();

    rejectEmail();

    await waitFor(() => expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'false'));
    // The in-app toggle the user made meanwhile is not undone.
    expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-pressed', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plugin notification channels (e.g. a Gotify plugin)
// ─────────────────────────────────────────────────────────────────────────────
//
// A plugin channel must be a first-class citizen here alongside in-app/email/ntfy:
// its own column in the matrix, its state visible, and a way to act on it. The
// credentials themselves live on the plugin's settings page, so an UNconfigured
// channel links there rather than just naming the place.

const pluginMatrix = (over: Record<string, unknown> = {}) => ({
  preferences: { trip_invite: { inapp: true, 'plugin:trek-gotify': true } },
  channels: [
    { id: 'inapp', source: 'builtin', labelKey: 'settings.notificationPreferences.inapp', active: true, configured: true },
    {
      id: 'plugin:trek-gotify',
      source: 'plugin',
      label: 'Gotify',
      settingsPath: '/settings?tab=plugins',
      active: true,
      configured: true,
      ...over,
    },
  ],
  event_types: ['trip_invite'],
  implemented_combos: { trip_invite: ['inapp', 'plugin:trek-gotify'] },
});

function mockMatrix(matrix: unknown) {
  server.use(
    http.get('*/api/notifications/preferences', () => HttpResponse.json(matrix)),
    http.get('*/api/settings', () => HttpResponse.json({ settings: {} })),
  );
}

describe('NotificationsTab — plugin channels', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useAuthStore, { isAuthenticated: true, user: buildUser() });
  });

  it('FE-COMP-NOTIFICATIONS-PLUGIN-001: a configured plugin channel gets its own column, by its own name', async () => {
    mockMatrix(pluginMatrix());
    render(<NotificationsTab />);
    // The server sends the display name outright — plugin channels have no i18n key.
    // It appears TWICE by design: once as the channel's own card, once as the matrix
    // column header — i.e. it really is a first-class column, not just a side panel.
    const shown = await screen.findAllByText('Gotify');
    expect(shown.length).toBe(2);
    // …and it is togglable per event, exactly like a built-in.
    await waitFor(() => expect(screen.getAllByRole('button').length).toBeGreaterThan(0));
  });

  it('FE-COMP-NOTIFICATIONS-PLUGIN-002: configured → offers a test send, no Configure link', async () => {
    mockMatrix(pluginMatrix({ configured: true }));
    render(<NotificationsTab />);

    const test = await screen.findByRole('button', { name: /send test/i });
    expect(test).toBeEnabled();
    expect(screen.queryByRole('link', { name: /configure/i })).not.toBeInTheDocument();
  });

  it('FE-COMP-NOTIFICATIONS-PLUGIN-003: NOT configured → links to the plugin settings tab, test disabled', async () => {
    mockMatrix(pluginMatrix({ configured: false }));
    render(<NotificationsTab />);

    const link = await screen.findByRole('link', { name: /configure/i });
    // A real route — settings is one page with a ?tab= param, not a route per plugin.
    expect(link).toHaveAttribute('href', '/settings?tab=plugins');
    expect(screen.getByRole('button', { name: /send test/i })).toBeDisabled();
  });

  it('FE-COMP-NOTIFICATIONS-PLUGIN-004: Send test calls the generic channel-test route', async () => {
    mockMatrix(pluginMatrix());
    let called = '';
    server.use(
      http.post('*/api/notifications/test/:channelId', ({ params }) => {
        called = String(params.channelId);
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await userEvent.click(await screen.findByRole('button', { name: /send test/i }));
    await waitFor(() => expect(called).toBe('plugin:trek-gotify'));
  });

  it('FE-COMP-NOTIFICATIONS-PLUGIN-005: an INACTIVE plugin channel is not shown at all', async () => {
    mockMatrix(pluginMatrix({ active: false }));
    render(<NotificationsTab />);
    await screen.findByText(/in-app/i);
    // The admin hasn't enabled the channel — it must not appear as an option.
    expect(screen.queryByText('Gotify')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Ntfy credentials, webhook edge cases and channel-test failures (015–029)
// ─────────────────────────────────────────────────────────────────────────────

const ntfyMatrix = {
  preferences: { trip_invite: { inapp: true, ntfy: true } },
  channels: [
    { id: 'inapp', source: 'builtin', labelKey: 'settings.notificationPreferences.inapp', active: true, configured: true },
    { id: 'ntfy', source: 'builtin', labelKey: 'settings.notificationPreferences.ntfy', active: true, configured: true },
  ],
  event_types: ['trip_invite'],
  implemented_combos: { trip_invite: ['inapp', 'ntfy'] },
  defaults: { ntfyServer: 'https://ntfy.example.org' },
};

const webhookMatrix = {
  preferences: { trip_invite: { inapp: true, webhook: true } },
  channels: [
    { id: 'inapp', source: 'builtin', labelKey: 'settings.notificationPreferences.inapp', active: true, configured: true },
    { id: 'webhook', source: 'builtin', labelKey: 'settings.notificationPreferences.webhook', active: true, configured: true },
  ],
  event_types: ['trip_invite'],
  implemented_combos: { trip_invite: ['inapp', 'webhook'] },
};

function mockNtfy(settings: Record<string, unknown> = {}) {
  server.use(
    http.get('*/api/notifications/preferences', () => HttpResponse.json(ntfyMatrix)),
    http.get('*/api/settings', () => HttpResponse.json({ settings })),
  );
}

function tokenInput(): HTMLInputElement {
  return document.querySelector('input[type="password"]') as HTMLInputElement;
}

describe('NotificationsTab — ntfy credentials', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useAuthStore, { isAuthenticated: true, user: buildUser() });
  });

  it('FE-COMP-NOTIFICATIONS-015: a stored token is masked and the server default fills the placeholder', async () => {
    mockNtfy({ ntfy_topic: 'alerts', ntfy_token: '••••••••' });
    render(<NotificationsTab />);

    expect(await screen.findByDisplayValue('alerts')).toBeInTheDocument();
    expect(tokenInput()).toHaveValue('');
    expect(tokenInput()).toHaveAttribute('placeholder', '••••••••');
    expect(screen.getByPlaceholderText('https://ntfy.example.org')).toHaveValue('');
  });

  it('FE-COMP-NOTIFICATIONS-016: saving sends topic and server but omits the untouched token', async () => {
    const user = userEvent.setup();
    let body: { settings: Record<string, unknown> } | null = null;
    mockNtfy({ ntfy_topic: 'alerts', ntfy_token: '••••••••' });
    server.use(
      http.post('*/api/settings/bulk', async ({ request }) => {
        body = (await request.json()) as { settings: Record<string, unknown> };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await user.type(await screen.findByPlaceholderText('https://ntfy.example.org'), 'https://ntfy.self.host');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Ntfy settings saved');
    expect(body!.settings).toEqual({ ntfy_topic: 'alerts', ntfy_server: 'https://ntfy.self.host' });
  });

  it('FE-COMP-NOTIFICATIONS-017: a freshly typed token is sent and switches the field to masked', async () => {
    const user = userEvent.setup();
    let body: { settings: Record<string, unknown> } | null = null;
    mockNtfy({ ntfy_topic: 'alerts' });
    server.use(
      http.post('*/api/settings/bulk', async ({ request }) => {
        body = (await request.json()) as { settings: Record<string, unknown> };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<NotificationsTab />);

    await screen.findByDisplayValue('alerts');
    await user.type(tokenInput(), 'tk_secret');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(body!.settings).toMatchObject({ ntfy_token: 'tk_secret' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument());
  });

  it('FE-COMP-NOTIFICATIONS-018: a failing ntfy save toasts the generic error', async () => {
    const user = userEvent.setup();
    mockNtfy({ ntfy_topic: 'alerts' });
    server.use(
      http.post('*/api/settings/bulk', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await screen.findByDisplayValue('alerts');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Error');
  });

  it('FE-COMP-NOTIFICATIONS-019: Clear wipes the stored token and hides the button', async () => {
    const user = userEvent.setup();
    let body: { key: string; value: unknown } | null = null;
    mockNtfy({ ntfy_topic: 'alerts', ntfy_token: '••••••••' });
    server.use(
      http.put('*/api/settings', async ({ request }) => {
        body = (await request.json()) as { key: string; value: unknown };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await user.click(await screen.findByRole('button', { name: 'Clear' }));

    await screen.findByText('Access token cleared');
    expect(body).toEqual({ key: 'ntfy_token', value: '' });
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('FE-COMP-NOTIFICATIONS-020: a failing clear keeps the token and toasts', async () => {
    const user = userEvent.setup();
    mockNtfy({ ntfy_topic: 'alerts', ntfy_token: '••••••••' });
    server.use(
      http.put('*/api/settings', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await user.click(await screen.findByRole('button', { name: 'Clear' }));

    await screen.findByText('Error');
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('FE-COMP-NOTIFICATIONS-021: a successful test posts topic and server, and never the masked token', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    mockNtfy({ ntfy_topic: 'alerts', ntfy_server: 'https://ntfy.sh', ntfy_token: '••••••••' });
    server.use(
      http.post('*/api/notifications/test-ntfy', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await screen.findByDisplayValue('alerts');
    await user.click(screen.getByRole('button', { name: 'Test' }));

    await screen.findByText('Test ntfy notification sent successfully');
    expect(body).toEqual({ topic: 'alerts', server: 'https://ntfy.sh', token: null });
  });

  it('FE-COMP-NOTIFICATIONS-022: a refused test shows the message the server returned', async () => {
    const user = userEvent.setup();
    mockNtfy({ ntfy_topic: 'alerts' });
    server.use(
      http.post('*/api/notifications/test-ntfy', () => HttpResponse.json({ success: false, error: 'Topic not found' })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await screen.findByDisplayValue('alerts');
    await user.click(screen.getByRole('button', { name: 'Test' }));

    await screen.findByText('Topic not found');
  });

  it('FE-COMP-NOTIFICATIONS-023: a network error during the test falls back to the generic message', async () => {
    const user = userEvent.setup();
    mockNtfy({ ntfy_topic: 'alerts' });
    server.use(
      http.post('*/api/notifications/test-ntfy', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await screen.findByDisplayValue('alerts');
    await user.click(screen.getByRole('button', { name: 'Test' }));

    await screen.findByText('Test ntfy notification failed');
  });

  it('FE-COMP-NOTIFICATIONS-024: without a topic the test button stays disabled', async () => {
    mockNtfy({});
    render(<NotificationsTab />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled());
    expect(screen.getByPlaceholderText('my-trek-alerts')).toHaveValue('');
  });
});

describe('NotificationsTab — webhook and channel-test failures', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useAuthStore, { isAuthenticated: true, user: buildUser() });
    server.use(
      http.get('*/api/notifications/preferences', () => HttpResponse.json(webhookMatrix)),
      http.get('*/api/settings', () => HttpResponse.json({ settings: { webhook_url: '••••••••' } })),
    );
  });

  it('FE-COMP-NOTIFICATIONS-025: saving an empty URL unsets the stored webhook', async () => {
    const user = userEvent.setup();
    let body: { key: string; value: unknown } | null = null;
    server.use(
      http.put('*/api/settings', async ({ request }) => {
        body = (await request.json()) as { key: string; value: unknown };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    const input = await screen.findByRole('textbox');
    expect(input).toHaveAttribute('placeholder', '••••••••');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Webhook URL saved');
    expect(body).toEqual({ key: 'webhook_url', value: '' });
    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'https://discord.com/api/webhooks/...'),
    );
  });

  it('FE-COMP-NOTIFICATIONS-026: a failing webhook save toasts the generic error', async () => {
    const user = userEvent.setup();
    server.use(
      http.put('*/api/settings', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await screen.findByRole('textbox');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Error');
  });

  it('FE-COMP-NOTIFICATIONS-027: a network error during the webhook test falls back to the generic message', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/notifications/test-webhook', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await screen.findByRole('textbox');
    await user.click(screen.getByRole('button', { name: 'Test' }));

    await screen.findByText('Test webhook failed');
  });

  it('FE-COMP-NOTIFICATIONS-028: a refused plugin channel test reports the returned error', async () => {
    const user = userEvent.setup();
    mockMatrix(pluginMatrix());
    server.use(
      http.post('*/api/notifications/test/:channelId', () =>
        HttpResponse.json({ success: false, error: 'Gotify rejected the token' }),
      ),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await user.click(await screen.findByRole('button', { name: /send test/i }));

    await screen.findByText('Gotify rejected the token');
  });

  it('FE-COMP-NOTIFICATIONS-029: a plugin channel test that errors out falls back to the generic message', async () => {
    const user = userEvent.setup();
    mockMatrix(pluginMatrix());
    server.use(
      http.post('*/api/notifications/test/:channelId', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    );
    render(<><NotificationsTab /><ToastContainer /></>);

    await user.click(await screen.findByRole('button', { name: /send test/i }));

    await screen.findByText('Test failed.');
  });
});
