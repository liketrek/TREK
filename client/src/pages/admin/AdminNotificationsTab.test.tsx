// FE-ADMNOT-001 to FE-ADMNOT-041
import { http, HttpResponse } from 'msw';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { fireEvent, render, screen, waitFor, within } from '../../../tests/helpers/render';
import { buildAdminHook, type AdminHook } from '../../../tests/helpers/mobileAdmin';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTranslation } from '../../i18n';
import AdminNotificationsTab from './AdminNotificationsTab';

vi.mock('./AdminNotificationsPanel', () => ({
  default: () => <div data-testid="admin-notifications-panel" />,
}));

type Spy = ReturnType<typeof vi.fn>;
type Spies = Record<string, Spy> & { toast: Record<string, Spy> };
type SmtpValues = Record<string, string>;

function Harness({ admin }: { admin: AdminHook }) {
  const { t } = useTranslation();
  return <AdminNotificationsTab admin={admin} t={t} />;
}

function renderTab(overrides: Record<string, unknown> = {}) {
  const admin = buildAdminHook(overrides);
  render(<Harness admin={admin} />);
  return admin as unknown as Spies;
}

/**
 * setSmtpValues is always called with a functional updater; replaying it against
 * the fixture's own values is the only way to see what the click intended.
 */
function replaySmtp(spy: Spy, callIndex: number, base: SmtpValues = {}): SmtpValues {
  const updater = spy.mock.calls[callIndex][0] as (prev: SmtpValues) => SmtpValues;
  return updater(base);
}

/** The card element whose <h2> matches the given heading text. */
function card(heading: string | RegExp): HTMLElement {
  return screen.getByRole('heading', { name: heading }).closest<HTMLElement>('.rounded-xl')!;
}

const EMAIL_ON: SmtpValues = { notification_channels: 'email', smtp_host: 'mail.example.com' };

/**
 * The text inputs hand setSmtpValues an updater that reads e.target.value lazily,
 * so a spy call can no longer be replayed once React re-rendered the controlled
 * input. This harness keeps the values in real state instead.
 */
function StatefulHarness({ initial }: { initial: SmtpValues }) {
  const { t } = useTranslation();
  const [smtpValues, setSmtpValues] = React.useState<SmtpValues>(initial);
  const admin = buildAdminHook({ smtpValues, setSmtpValues });
  return <AdminNotificationsTab admin={admin} t={t} />;
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('AdminNotificationsTab', () => {
  it('FE-ADMNOT-001: renders every channel panel plus the preference matrix', () => {
    renderTab();

    expect(screen.getByRole('heading', { name: 'Email (SMTP)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^webhook$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ntfy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In-App' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trip Reminders' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Webhook' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Ntfy' })).toBeInTheDocument();
    expect(screen.getByTestId('admin-notifications-panel')).toBeInTheDocument();
  });

  it('FE-ADMNOT-002: hides the SMTP fields until smtpLoaded is true', () => {
    renderTab({ smtpLoaded: false });

    expect(screen.queryByPlaceholderText('mail.example.com')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('https://discord.com/api/webhooks/...')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('https://ntfy.sh')).not.toBeInTheDocument();
  });

  it('FE-ADMNOT-003: renders all five SMTP fields once loaded', () => {
    renderTab({ smtpValues: EMAIL_ON });

    expect(screen.getByPlaceholderText('mail.example.com')).toHaveValue('mail.example.com');
    expect(screen.getByPlaceholderText('587')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('trek@example.com')).toHaveLength(2);
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('FE-ADMNOT-004: greys out the SMTP body while the email channel is off', () => {
    renderTab({ smtpValues: { notification_channels: 'none' } });

    const body = screen.getByPlaceholderText('mail.example.com').closest<HTMLElement>('.p-6')!;
    expect(body.className).toContain('pointer-events-none');
  });

  it('FE-ADMNOT-005: enabling the email channel PUTs the merged channel list', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    const admin = renderTab({ smtpValues: { notification_channels: 'webhook' } });

    fireEvent.click(within(card('Email (SMTP)')).getAllByRole('button')[0]);

    await waitFor(() => expect(body).toEqual({ notification_channels: 'email,webhook' }));
    expect(replaySmtp(admin.setSmtpValues, 0).notification_channels).toBe('email,webhook');
  });

  it('FE-ADMNOT-006: disabling the last channel falls back to "none"', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    renderTab({ smtpValues: { notification_channels: 'email' } });

    fireEvent.click(within(card('Email (SMTP)')).getAllByRole('button')[0]);

    await waitFor(() => expect(body).toEqual({ notification_channels: 'none' }));
  });

  it('FE-ADMNOT-007: unknown channel ids survive a toggle instead of being dropped', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    renderTab({ smtpValues: { notification_channels: 'email, plugin-gotify' } });

    fireEvent.click(within(card('Ntfy')).getAllByRole('button')[0]);

    await waitFor(() => expect(body).toEqual({ notification_channels: 'email,ntfy,plugin-gotify' }));
  });

  it('FE-ADMNOT-008: a failing channel toggle reverts and toasts', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: { notification_channels: 'email' } });

    fireEvent.click(within(card(/^webhook$/i)).getAllByRole('button')[0]);

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
    expect(replaySmtp(admin.setSmtpValues, 0).notification_channels).toBe('email,webhook');
    expect(replaySmtp(admin.setSmtpValues, 1).notification_channels).toBe('email');
  });

  it('FE-ADMNOT-009: falls back to the legacy singular notification_channel key', () => {
    renderTab({ smtpValues: { notification_channel: 'email', smtp_host: 'mail.example.com' } });

    const body = screen.getByPlaceholderText('mail.example.com').closest<HTMLElement>('.p-6')!;
    expect(body.className).not.toContain('pointer-events-none');
  });

  it('FE-ADMNOT-010: typing in an SMTP field writes that key back', () => {
    render(<StatefulHarness initial={EMAIL_ON} />);

    fireEvent.change(screen.getByPlaceholderText('587'), { target: { value: '465' } });
    fireEvent.change(screen.getByPlaceholderText('mail.example.com'), { target: { value: 'smtp.test' } });

    expect(screen.getByPlaceholderText('587')).toHaveValue('465');
    expect(screen.getByPlaceholderText('mail.example.com')).toHaveValue('smtp.test');
  });

  it('FE-ADMNOT-011: the TLS toggle flips smtp_skip_tls_verify', () => {
    const admin = renderTab({ smtpValues: { ...EMAIL_ON, smtp_skip_tls_verify: 'false' } });

    const tlsRow = screen.getByText('Skip TLS certificate check').closest<HTMLElement>('div[style]')!;
    fireEvent.click(within(tlsRow).getByRole('button'));

    expect(replaySmtp(admin.setSmtpValues, 0).smtp_skip_tls_verify).toBe('true');
  });

  it('FE-ADMNOT-012: the TLS toggle flips back when already enabled', () => {
    const admin = renderTab({ smtpValues: { ...EMAIL_ON, smtp_skip_tls_verify: 'true' } });

    const tlsRow = screen.getByText('Skip TLS certificate check').closest<HTMLElement>('div[style]')!;
    fireEvent.click(within(tlsRow).getByRole('button'));

    expect(replaySmtp(admin.setSmtpValues, 0).smtp_skip_tls_verify).toBe('false');
  });

  it('FE-ADMNOT-013: saving SMTP sends only the credential keys that are set', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
      http.get('/api/auth/app-config', () => HttpResponse.json({ trip_reminders_enabled: true }))
    );
    const admin = renderTab({
      smtpValues: { ...EMAIL_ON, smtp_port: '587', notification_channels: 'email', admin_ntfy_topic: 'x' },
    });

    fireEvent.click(within(card('Email (SMTP)')).getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(admin.toast.success).toHaveBeenCalledWith('Notification settings saved'));
    expect(body).toEqual({ smtp_host: 'mail.example.com', smtp_port: '587' });
    await waitFor(() => expect(admin.setTripRemindersEnabled).toHaveBeenCalledWith(true));
  });

  it('FE-ADMNOT-014: a failing SMTP save toasts the generic error', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: EMAIL_ON });

    fireEvent.click(within(card('Email (SMTP)')).getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
  });

  it('FE-ADMNOT-015: the test-email button needs a configured SMTP host', () => {
    renderTab({ smtpValues: { notification_channels: 'email' } });

    expect(screen.getByRole('button', { name: /send test email/i })).toBeDisabled();
  });

  it('FE-ADMNOT-016: a successful SMTP test toasts success', async () => {
    server.use(http.post('/api/notifications/test-smtp', () => HttpResponse.json({ success: true })));
    const admin = renderTab({ smtpValues: EMAIL_ON });

    fireEvent.click(screen.getByRole('button', { name: /send test email/i }));

    await waitFor(() => expect(admin.toast.success).toHaveBeenCalledWith('Test email sent successfully'));
  });

  it('FE-ADMNOT-017: a rejected SMTP test surfaces the server error', async () => {
    server.use(
      http.post('/api/notifications/test-smtp', () => HttpResponse.json({ success: false, error: 'auth failed' }))
    );
    const admin = renderTab({ smtpValues: EMAIL_ON });

    fireEvent.click(screen.getByRole('button', { name: /send test email/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('auth failed'));
  });

  it('FE-ADMNOT-018: a failing SMTP test request toasts the fallback message', async () => {
    server.use(http.post('/api/notifications/test-smtp', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: EMAIL_ON });

    fireEvent.click(screen.getByRole('button', { name: /send test email/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Test email failed'));
  });

  it('FE-ADMNOT-019: enabling trip reminders PUTs true and refreshes the store flag', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
      http.get('/api/auth/app-config', () => HttpResponse.json({ trip_reminders_enabled: false }))
    );
    const admin = renderTab({ smtpValues: { notify_trip_reminder: 'false' } });

    fireEvent.click(within(card('Trip Reminders')).getByRole('button'));

    await waitFor(() => expect(body).toEqual({ notify_trip_reminder: 'true' }));
    expect(admin.toast.success).toHaveBeenCalledWith('Trip reminders enabled');
    await waitFor(() => expect(admin.setTripRemindersEnabled).toHaveBeenCalledWith(false));
  });

  it('FE-ADMNOT-020: disabling trip reminders toasts the disabled message', async () => {
    server.use(http.get('/api/auth/app-config', () => HttpResponse.json({})));
    const admin = renderTab({ smtpValues: {} });

    fireEvent.click(within(card('Trip Reminders')).getByRole('button'));

    await waitFor(() => expect(admin.toast.success).toHaveBeenCalledWith('Trip reminders disabled'));
    expect(replaySmtp(admin.setSmtpValues, 0).notify_trip_reminder).toBe('false');
  });

  it('FE-ADMNOT-021: a failing trip-reminder toggle reverts the value', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: {} });

    fireEvent.click(within(card('Trip Reminders')).getByRole('button'));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
    expect(replaySmtp(admin.setSmtpValues, 1).notify_trip_reminder).toBe('true');
  });

  it('FE-ADMNOT-022: the admin webhook URL is editable and saved', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    const admin = renderTab({ smtpValues: { admin_webhook_url: 'https://hooks.example/1' } });

    fireEvent.click(within(card('Admin Webhook')).getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(body).toEqual({ admin_webhook_url: 'https://hooks.example/1' }));
    expect(admin.toast.success).toHaveBeenCalledWith('Admin webhook URL saved');
  });

  it('FE-ADMNOT-023: the admin webhook URL input is editable', () => {
    render(<StatefulHarness initial={{ admin_webhook_url: 'https://hooks.example/1' }} />);

    const input = screen.getByPlaceholderText('https://discord.com/api/webhooks/...');
    fireEvent.change(input, { target: { value: 'https://hooks.example/2' } });

    expect(input).toHaveValue('https://hooks.example/2');
  });

  it('FE-ADMNOT-024: a stored webhook URL renders masked with an empty input', () => {
    renderTab({ smtpValues: { admin_webhook_url: '••••••••' } });

    const input = within(card('Admin Webhook')).getByPlaceholderText('••••••••');
    expect(input).toHaveValue('');
  });

  it('FE-ADMNOT-025: a failing admin-webhook save toasts the generic error', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: { admin_webhook_url: 'https://hooks.example/1' } });

    fireEvent.click(within(card('Admin Webhook')).getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
  });

  it('FE-ADMNOT-026: the webhook test button is disabled without a URL', () => {
    renderTab({ smtpValues: {} });

    expect(screen.getByRole('button', { name: /send test webhook/i })).toBeDisabled();
  });

  it('FE-ADMNOT-027: a successful webhook test posts the URL and toasts', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/notifications/test-webhook', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      })
    );
    const admin = renderTab({ smtpValues: { admin_webhook_url: 'https://hooks.example/1' } });

    fireEvent.click(screen.getByRole('button', { name: /send test webhook/i }));

    await waitFor(() => expect(body).toEqual({ url: 'https://hooks.example/1' }));
    expect(admin.toast.success).toHaveBeenCalledWith('Test webhook sent successfully');
  });

  it('FE-ADMNOT-028: a rejected webhook test surfaces the server error', async () => {
    server.use(
      http.post('/api/notifications/test-webhook', () => HttpResponse.json({ success: false, error: '404 from hook' }))
    );
    const admin = renderTab({ smtpValues: { admin_webhook_url: 'https://hooks.example/1' } });

    fireEvent.click(screen.getByRole('button', { name: /send test webhook/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('404 from hook'));
  });

  it('FE-ADMNOT-029: testing a masked webhook URL skips the pre-save', async () => {
    let putCalls = 0;
    server.use(
      http.put('/api/auth/app-settings', () => {
        putCalls += 1;
        return HttpResponse.json({});
      }),
      http.post('/api/notifications/test-webhook', () => HttpResponse.json({ success: true }))
    );
    const admin = renderTab({ smtpValues: { admin_webhook_url: '••••••••' } });

    fireEvent.click(screen.getByRole('button', { name: /send test webhook/i }));

    await waitFor(() => expect(admin.toast.success).toHaveBeenCalledWith('Test webhook sent successfully'));
    expect(putCalls).toBe(0);
  });

  it('FE-ADMNOT-030: ntfy server, topic and token inputs write back', () => {
    render(<StatefulHarness initial={{}} />);

    const server_ = screen.getByPlaceholderText('https://ntfy.sh');
    fireEvent.change(server_, { target: { value: 'https://ntfy.example' } });

    const topic = screen.getByPlaceholderText('trek-admin-alerts');
    fireEvent.change(topic, { target: { value: 'alerts' } });

    const token = screen.getByText('Access Token (optional)').parentElement!.querySelector('input')!;
    fireEvent.change(token, { target: { value: 'tk_123' } });

    expect(server_).toHaveValue('https://ntfy.example');
    expect(topic).toHaveValue('alerts');
    expect(token).toHaveValue('tk_123');
  });

  it('FE-ADMNOT-031: clearing a stored ntfy token PUTs an empty value', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    const admin = renderTab({ smtpValues: { admin_ntfy_token: '••••••••' } });

    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));

    await waitFor(() => expect(body).toEqual({ admin_ntfy_token: '' }));
    expect(admin.toast.success).toHaveBeenCalledWith('Admin access token cleared');
    expect(replaySmtp(admin.setSmtpValues, 0).admin_ntfy_token).toBe('');
  });

  it('FE-ADMNOT-032: the clear button only exists for a stored token', () => {
    renderTab({ smtpValues: { admin_ntfy_token: 'plain' } });

    expect(screen.queryByRole('button', { name: /^clear$/i })).not.toBeInTheDocument();
  });

  it('FE-ADMNOT-033: saving admin ntfy omits a masked token', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    const admin = renderTab({
      smtpValues: { admin_ntfy_server: 'https://ntfy.example', admin_ntfy_topic: 'alerts', admin_ntfy_token: '••••••••' },
    });

    fireEvent.click(within(card('Admin Ntfy')).getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(body).toEqual({ admin_ntfy_server: 'https://ntfy.example', admin_ntfy_topic: 'alerts' })
    );
    expect(admin.toast.success).toHaveBeenCalledWith('Admin ntfy settings saved');
  });

  it('FE-ADMNOT-034: saving admin ntfy includes a freshly typed token', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    renderTab({ smtpValues: { admin_ntfy_topic: 'alerts', admin_ntfy_token: 'tk_live' } });

    fireEvent.click(within(card('Admin Ntfy')).getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(body).toMatchObject({ admin_ntfy_token: 'tk_live' }));
  });

  it('FE-ADMNOT-035: a failing admin-ntfy save toasts the generic error', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: { admin_ntfy_topic: 'alerts' } });

    fireEvent.click(within(card('Admin Ntfy')).getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
  });

  it('FE-ADMNOT-036: the ntfy test button is disabled without a topic', () => {
    renderTab({ smtpValues: {} });

    expect(within(card('Admin Ntfy')).getByRole('button', { name: /send test ntfy/i })).toBeDisabled();
  });

  it('FE-ADMNOT-037: a successful ntfy test posts topic, server and token', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/notifications/test-ntfy', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      })
    );
    const admin = renderTab({
      smtpValues: { admin_ntfy_topic: ' alerts ', admin_ntfy_server: 'https://ntfy.example', admin_ntfy_token: 'tk' },
    });

    fireEvent.click(within(card('Admin Ntfy')).getByRole('button', { name: /send test ntfy/i }));

    await waitFor(() =>
      expect(body).toEqual({ topic: 'alerts', server: 'https://ntfy.example', token: 'tk' })
    );
    expect(admin.toast.success).toHaveBeenCalledWith('Test ntfy sent successfully');
  });

  it('FE-ADMNOT-038: a masked ntfy token is sent as null', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/notifications/test-ntfy', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: false, error: 'topic rejected' });
      })
    );
    const admin = renderTab({ smtpValues: { admin_ntfy_topic: 'alerts', admin_ntfy_token: '••••••••' } });

    fireEvent.click(within(card('Admin Ntfy')).getByRole('button', { name: /send test ntfy/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('topic rejected'));
    expect(body).toEqual({ topic: 'alerts', server: null, token: null });
  });

  it('FE-ADMNOT-039: a failing ntfy test request toasts the fallback message', async () => {
    server.use(http.post('/api/notifications/test-ntfy', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: { admin_ntfy_topic: 'alerts' } });

    fireEvent.click(within(card('Admin Ntfy')).getByRole('button', { name: /send test ntfy/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Test ntfy failed'));
  });

  it('FE-ADMNOT-040: a failing webhook test request toasts the fallback message', async () => {
    server.use(http.post('/api/notifications/test-webhook', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: { admin_webhook_url: 'https://hooks.example/1' } });

    fireEvent.click(screen.getByRole('button', { name: /send test webhook/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Test webhook failed'));
  });

  it('FE-ADMNOT-041: a failing token clear toasts the generic error', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderTab({ smtpValues: { admin_ntfy_token: '••••••••' } });

    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
  });
});
