// FE-MOB-ANOTIF-001 to FE-MOB-ANOTIF-031
import { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { useTranslation } from '../../../../src/i18n';
import type { useAdmin } from '../../../../src/pages/admin/useAdmin';
import MAdminNotificationsSection from '../../../../src/mobile/screens/admin/MAdminNotificationsSection';

// The per-event matrix loads its own data and has its own spec — stub it so the
// assertions here only see the section's own cards.
vi.mock('../../../../src/mobile/screens/admin/MAdminNotifyMatrix', () => ({
  default: () => <div data-testid="notify-matrix" />,
}));

const MASK = '••••••••';

interface HarnessProps {
  initial?: Record<string, string>;
  smtpLoaded?: boolean;
  toast?: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  setTripRemindersEnabled?: (value: boolean) => void;
}

function buildToast() {
  return { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
}

// The section is a controlled child of useAdmin — this harness owns the same
// smtpValues state so setSmtpValues updaters really re-render the card.
function Harness({ initial = {}, smtpLoaded = true, toast = buildToast(), setTripRemindersEnabled = vi.fn() }: HarnessProps) {
  const { t } = useTranslation();
  const [smtpValues, setSmtpValues] = useState<Record<string, string>>(initial);
  const admin = {
    toast,
    smtpValues,
    setSmtpValues,
    smtpLoaded,
    setTripRemindersEnabled,
  } as unknown as ReturnType<typeof useAdmin>;
  return <MAdminNotificationsSection admin={admin} t={t} />;
}

/** Records the body of every PUT /auth/app-settings the section sends. */
function captureAppSettings() {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    http.put('/api/auth/app-settings', async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ success: true });
    }),
  );
  return bodies;
}

function failAppSettings() {
  server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
}

/** The two password inputs are, in DOM order, the SMTP password and the ntfy token. */
function ntfyTokenInput() {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]'))[1];
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdminNotificationsSection', () => {
  it('FE-MOB-ANOTIF-001: renders every channel card and prefills the SMTP fields', () => {
    render(
      <Harness
        initial={{ notification_channels: 'email', smtp_host: 'mail.test', smtp_port: '2525' }}
      />,
    );

    expect(screen.getByText('Email (SMTP)')).toBeInTheDocument();
    expect(screen.getByText('Webhook')).toBeInTheDocument();
    expect(screen.getByText('Ntfy')).toBeInTheDocument();
    expect(screen.getByText('In-App')).toBeInTheDocument();
    expect(screen.getByText('Trip Reminders')).toBeInTheDocument();
    expect(screen.getByText('Admin Webhook')).toBeInTheDocument();
    expect(screen.getByText('Admin Ntfy')).toBeInTheDocument();
    expect(screen.getByTestId('notify-matrix')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('mail.example.com')).toHaveValue('mail.test');
    expect(screen.getByPlaceholderText('587')).toHaveValue('2525');
    expect(screen.getByRole('switch', { name: 'Email (SMTP)' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'In-App' })).toBeDisabled();
  });

  it('FE-MOB-ANOTIF-002: hides the credential fields until the settings have loaded', () => {
    render(<Harness smtpLoaded={false} initial={{ smtp_host: 'mail.test' }} />);

    expect(screen.queryByPlaceholderText('mail.example.com')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('https://ntfy.sh')).not.toBeInTheDocument();
    expect(screen.getByText('Email (SMTP)')).toBeInTheDocument();
  });

  it('FE-MOB-ANOTIF-003: derives the active channels from the plural setting', () => {
    render(<Harness initial={{ notification_channels: 'webhook,ntfy' }} />);

    expect(screen.getByRole('switch', { name: 'Email (SMTP)' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'Webhook' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Ntfy' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-ANOTIF-004: falls back to the legacy singular setting', () => {
    render(<Harness initial={{ notification_channel: 'email' }} />);

    expect(screen.getByRole('switch', { name: 'Email (SMTP)' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Webhook' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-ANOTIF-005: treats a missing setting as no active channel', () => {
    render(<Harness />);

    expect(screen.getByRole('switch', { name: 'Email (SMTP)' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'Ntfy' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-ANOTIF-006: enabling a channel saves the CSV and keeps unknown channel ids', async () => {
    const bodies = captureAppSettings();
    const user = userEvent.setup();
    render(<Harness initial={{ notification_channels: 'webhook,pushover' }} />);

    await user.click(screen.getByRole('switch', { name: 'Email (SMTP)' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ notification_channels: 'email,webhook,pushover' });
    expect(screen.getByRole('switch', { name: 'Email (SMTP)' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-ANOTIF-007: disabling the last channel stores "none"', async () => {
    const bodies = captureAppSettings();
    const user = userEvent.setup();
    render(<Harness initial={{ notification_channels: 'ntfy' }} />);

    await user.click(screen.getByRole('switch', { name: 'Ntfy' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ notification_channels: 'none' });
  });

  it('FE-MOB-ANOTIF-008: a failed channel save rolls the toggle back and reports the error', async () => {
    failAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness initial={{ notification_channels: 'email' }} toast={toast} />);

    await user.click(screen.getByRole('switch', { name: 'Webhook' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
    expect(screen.getByRole('switch', { name: 'Webhook' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'Email (SMTP)' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-ANOTIF-009: editing an SMTP field and saving sends only the credential keys', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const setTripRemindersEnabled = vi.fn();
    const user = userEvent.setup();
    server.use(
      http.get('/api/auth/app-config', () => HttpResponse.json({ trip_reminders_enabled: true })),
    );
    render(
      <Harness
        initial={{ notification_channels: 'email', smtp_host: 'mail.test', admin_ntfy_topic: 'ops' }}
        toast={toast}
        setTripRemindersEnabled={setTripRemindersEnabled}
      />,
    );

    // smtp_user and smtp_from share a placeholder — the first one is the user field
    await user.type(screen.getAllByPlaceholderText('trek@example.com')[0], 'bot');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ smtp_host: 'mail.test', smtp_user: 'bot' });
    expect(toast.success).toHaveBeenCalledWith('Notification settings saved');
    // The follow-up app-config read syncs the reminder flag back into the store
    await waitFor(() => expect(setTripRemindersEnabled).toHaveBeenCalledWith(true));
  });

  it('FE-MOB-ANOTIF-010: a failed SMTP save reports the error', async () => {
    failAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness initial={{ smtp_host: 'mail.test' }} toast={toast} />);

    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('FE-MOB-ANOTIF-011: the TLS toggle flips smtp_skip_tls_verify', async () => {
    const bodies = captureAppSettings();
    const user = userEvent.setup();
    render(<Harness initial={{ notification_channels: 'email', smtp_host: 'mail.test' }} />);

    const tls = screen.getByRole('switch', { name: 'Skip TLS certificate check' });
    expect(tls).toHaveAttribute('aria-checked', 'false');
    await user.click(tls);
    expect(tls).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ smtp_skip_tls_verify: 'true' });

    await user.click(tls);
    expect(tls).toHaveAttribute('aria-checked', 'false');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toMatchObject({ smtp_skip_tls_verify: 'false' });
  });

  it('FE-MOB-ANOTIF-012: the test button is disabled until a host is configured', () => {
    render(<Harness initial={{ smtp_host: '   ' }} />);

    expect(screen.getByRole('button', { name: 'Send test email' })).toBeDisabled();
  });

  it('FE-MOB-ANOTIF-013: the SMTP test persists the credentials first and reports success', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    server.use(http.post('/api/notifications/test-smtp', () => HttpResponse.json({ success: true })));
    render(<Harness initial={{ smtp_host: 'mail.test', smtp_from: 'trek@test' }} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Send test email' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Test email sent successfully'));
    expect(bodies[0]).toEqual({ smtp_host: 'mail.test', smtp_from: 'trek@test' });
  });

  it('FE-MOB-ANOTIF-014: an unsuccessful SMTP test surfaces the server error text', async () => {
    const toast = buildToast();
    const user = userEvent.setup();
    server.use(
      http.post('/api/notifications/test-smtp', () =>
        HttpResponse.json({ success: false, error: 'auth rejected' }),
      ),
    );
    render(<Harness initial={{ smtp_host: 'mail.test' }} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Send test email' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('auth rejected'));

    // Without an error field the generic message is used
    server.use(http.post('/api/notifications/test-smtp', () => HttpResponse.json({ success: false })));
    await user.click(screen.getByRole('button', { name: 'Send test email' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Test email failed'));
  });

  it('FE-MOB-ANOTIF-015: a rejected SMTP test falls back to the generic failure text', async () => {
    const toast = buildToast();
    const user = userEvent.setup();
    server.use(http.post('/api/notifications/test-smtp', () => HttpResponse.json({}, { status: 500 })));
    render(<Harness initial={{ smtp_host: 'mail.test' }} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Send test email' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Test email failed'));
  });

  it('FE-MOB-ANOTIF-016: trip reminders default to on and can be switched off', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const setTripRemindersEnabled = vi.fn();
    const user = userEvent.setup();
    server.use(
      http.get('/api/auth/app-config', () => HttpResponse.json({ trip_reminders_enabled: false })),
    );
    render(<Harness toast={toast} setTripRemindersEnabled={setTripRemindersEnabled} />);

    const toggle = screen.getByRole('switch', { name: 'Trip Reminders' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Trip reminders disabled'));
    expect(bodies[0]).toEqual({ notify_trip_reminder: 'false' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await waitFor(() => expect(setTripRemindersEnabled).toHaveBeenCalledWith(false));
  });

  it('FE-MOB-ANOTIF-017: switching trip reminders back on reports the enabled toast', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness initial={{ notify_trip_reminder: 'false' }} toast={toast} />);

    await user.click(screen.getByRole('switch', { name: 'Trip Reminders' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Trip reminders enabled'));
    expect(bodies[0]).toEqual({ notify_trip_reminder: 'true' });
  });

  it('FE-MOB-ANOTIF-018: a failed trip reminder save rolls the toggle back', async () => {
    failAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness toast={toast} />);

    await user.click(screen.getByRole('switch', { name: 'Trip Reminders' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
    expect(screen.getByRole('switch', { name: 'Trip Reminders' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-ANOTIF-019: the admin webhook URL is saved and tested', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    let testedUrl: string | undefined;
    server.use(
      http.post('/api/notifications/test-webhook', async ({ request }) => {
        testedUrl = ((await request.json()) as { url?: string }).url;
        return HttpResponse.json({ success: true });
      }),
    );
    render(<Harness toast={toast} />);

    const input = screen.getByPlaceholderText('https://discord.com/api/webhooks/...');
    await user.type(input, 'https://hooks.test/abc');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[1]);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Admin webhook URL saved'));
    expect(bodies[0]).toEqual({ admin_webhook_url: 'https://hooks.test/abc' });

    await user.click(screen.getByRole('button', { name: 'Send test webhook' }));
    await waitFor(() => expect(testedUrl).toBe('https://hooks.test/abc'));
    expect(toast.success).toHaveBeenCalledWith('Test webhook sent successfully');
  });

  it('FE-MOB-ANOTIF-020: a masked admin webhook is tested without resending the URL', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    let payload: { url?: string } | undefined;
    server.use(
      http.post('/api/notifications/test-webhook', async ({ request }) => {
        payload = (await request.json()) as { url?: string };
        return HttpResponse.json({ success: false, error: 'endpoint gone' });
      }),
    );
    render(<Harness initial={{ admin_webhook_url: MASK }} toast={toast} />);

    // The masked value is never echoed into the input, only into the placeholder
    const maskedInput = screen
      .getAllByPlaceholderText(MASK)
      .find((el) => (el as HTMLInputElement).type === 'text')!;
    expect(maskedInput).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Send test webhook' }));
    await waitFor(() => expect(payload).toBeDefined());
    // The mask is not a URL, so nothing is re-saved before the probe
    expect(payload).toEqual({});
    expect(bodies).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('endpoint gone');

    server.use(http.post('/api/notifications/test-webhook', () => HttpResponse.json({ success: false })));
    await user.click(screen.getByRole('button', { name: 'Send test webhook' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Test webhook failed'));
  });

  it('FE-MOB-ANOTIF-021: admin webhook errors are reported for save and test alike', async () => {
    const toast = buildToast();
    const user = userEvent.setup();
    failAppSettings();
    server.use(
      http.post('/api/notifications/test-webhook', () => HttpResponse.json({}, { status: 500 })),
    );
    render(<Harness initial={{ admin_webhook_url: 'https://hooks.test/abc' }} toast={toast} />);

    await user.click(screen.getAllByRole('button', { name: 'Save' })[1]);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));

    await user.click(screen.getByRole('button', { name: 'Send test webhook' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Test webhook failed'));
  });

  it('FE-MOB-ANOTIF-022: the admin webhook test button is disabled without a URL', () => {
    render(<Harness />);

    expect(screen.getByRole('button', { name: 'Send test webhook' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send test ntfy' })).toBeDisabled();
  });

  it('FE-MOB-ANOTIF-023: saving admin ntfy sends server, topic and a freshly typed token', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness toast={toast} />);

    await user.type(screen.getByPlaceholderText('https://ntfy.sh'), 'https://ntfy.test');
    await user.type(screen.getByPlaceholderText('trek-admin-alerts'), 'ops');
    await user.type(ntfyTokenInput(), 'tk_1');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[2]);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Admin ntfy settings saved'));
    expect(bodies[0]).toEqual({
      admin_ntfy_server: 'https://ntfy.test',
      admin_ntfy_topic: 'ops',
      admin_ntfy_token: 'tk_1',
    });
  });

  it('FE-MOB-ANOTIF-024: a masked ntfy token is omitted from the save payload', async () => {
    const bodies = captureAppSettings();
    const user = userEvent.setup();
    render(<Harness initial={{ admin_ntfy_topic: 'ops', admin_ntfy_token: MASK }} />);

    await user.click(screen.getAllByRole('button', { name: 'Save' })[2]);

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ admin_ntfy_server: '', admin_ntfy_topic: 'ops' });
  });

  it('FE-MOB-ANOTIF-025: a failed ntfy save reports the error', async () => {
    failAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness initial={{ admin_ntfy_topic: 'ops' }} toast={toast} />);

    await user.click(screen.getAllByRole('button', { name: 'Save' })[2]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
  });

  it('FE-MOB-ANOTIF-026: the ntfy test sends topic, server and the unmasked token', async () => {
    const toast = buildToast();
    const user = userEvent.setup();
    let payload: Record<string, unknown> | undefined;
    server.use(
      http.post('/api/notifications/test-ntfy', async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );
    render(
      <Harness
        initial={{ admin_ntfy_topic: ' ops ', admin_ntfy_server: 'https://ntfy.test', admin_ntfy_token: 'tk_1' }}
        toast={toast}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Send test ntfy' }));

    await waitFor(() => expect(payload).toBeDefined());
    expect(payload).toEqual({ topic: 'ops', server: 'https://ntfy.test', token: 'tk_1' });
    expect(toast.success).toHaveBeenCalledWith('Test ntfy sent successfully');
  });

  it('FE-MOB-ANOTIF-027: a masked token is sent as null and a failed test is reported', async () => {
    const toast = buildToast();
    const user = userEvent.setup();
    let payload: Record<string, unknown> | undefined;
    server.use(
      http.post('/api/notifications/test-ntfy', async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: false, error: 'topic refused' });
      }),
    );
    render(<Harness initial={{ admin_ntfy_topic: 'ops', admin_ntfy_token: MASK }} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Send test ntfy' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('topic refused'));
    expect(payload).toEqual({ topic: 'ops', server: null, token: null });

    server.use(http.post('/api/notifications/test-ntfy', () => HttpResponse.json({ success: false })));
    await user.click(screen.getByRole('button', { name: 'Send test ntfy' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Test ntfy failed'));
  });

  it('FE-MOB-ANOTIF-028: a rejected ntfy test falls back to the generic failure text', async () => {
    const toast = buildToast();
    const user = userEvent.setup();
    server.use(http.post('/api/notifications/test-ntfy', () => HttpResponse.json({}, { status: 500 })));
    render(<Harness initial={{ admin_ntfy_topic: 'ops' }} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Send test ntfy' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Test ntfy failed'));
  });

  it('FE-MOB-ANOTIF-029: the Clear button only exists for a stored token and wipes it', async () => {
    const bodies = captureAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness initial={{ admin_ntfy_token: MASK }} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Admin access token cleared'));
    expect(bodies[0]).toEqual({ admin_ntfy_token: '' });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument());
  });

  it('FE-MOB-ANOTIF-030: a failed token clear keeps the button and reports the error', async () => {
    failAppSettings();
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness initial={{ admin_ntfy_token: MASK }} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('FE-MOB-ANOTIF-031: a failing app-config refresh does not break the SMTP save', async () => {
    const toast = buildToast();
    const setTripRemindersEnabled = vi.fn();
    const user = userEvent.setup();
    captureAppSettings();
    server.use(http.get('/api/auth/app-config', () => HttpResponse.json({}, { status: 500 })));
    render(
      <Harness
        initial={{ smtp_host: 'mail.test' }}
        toast={toast}
        setTripRemindersEnabled={setTripRemindersEnabled}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Notification settings saved'));
    expect(setTripRemindersEnabled).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
