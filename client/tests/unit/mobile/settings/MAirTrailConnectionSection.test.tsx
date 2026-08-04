// FE-MOB-SETAIR-001 onwards
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAirTrailConnectionSection from '../../../../src/mobile/screens/settings/MAirTrailConnectionSection';

interface SavedBody {
  url: string;
  apiKey?: string;
  allowInsecureTls?: boolean;
  writeEnabled?: boolean;
}

function stubSettings(over: Record<string, unknown> = {}) {
  server.use(
    http.get('/api/integrations/airtrail/settings', () =>
      HttpResponse.json({ url: '', allowInsecureTls: false, writeEnabled: false, connected: false, ...over }),
    ),
  );
}

function renderSection() {
  return render(
    <>
      <ToastContainer />
      <MAirTrailConnectionSection />
    </>,
  );
}

describe('MAirTrailConnectionSection', () => {
  beforeEach(() => {
    resetAllStores();
    stubSettings();
  });

  it('FE-MOB-SETAIR-001: hydrates the form from the stored connection', async () => {
    stubSettings({ url: 'https://air.example.com', allowInsecureTls: true, writeEnabled: true, connected: true });
    renderSection();

    expect(await screen.findByDisplayValue('https://air.example.com')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Allow self-signed certificates' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Write changes back to AirTrail' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-SETAIR-002: an unconfigured instance renders empty and disconnected', async () => {
    renderSection();

    await waitFor(() => expect(screen.getByRole('button', { name: /Test connection/ })).toBeDisabled());
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bearer API key')).toHaveValue('');
  });

  it('FE-MOB-SETAIR-003: the stored key is masked by the placeholder, never prefilled', async () => {
    stubSettings({ url: 'https://air.example.com', connected: true });
    renderSection();

    const keyInput = await screen.findByPlaceholderText('••••••••');
    expect(keyInput).toHaveValue('');
  });

  it('FE-MOB-SETAIR-004: a failing settings fetch still ends the loading state', async () => {
    server.use(
      http.get('/api/integrations/airtrail/settings', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderSection();

    // Save stays disabled because there is no URL, but the buttons are rendered
    // rather than stuck behind `loading`.
    await waitFor(() => expect(screen.getByRole('button', { name: /Test connection/ })).toBeDisabled());
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('FE-MOB-SETAIR-005: Save stays disabled until a URL and a key are present', async () => {
    const user = userEvent.setup();
    renderSection();

    const saveBtn = await screen.findByRole('button', { name: /Save/ });
    expect(saveBtn).toBeDisabled();

    await user.type(screen.getByPlaceholderText('https://airtrail.example.com'), 'https://air.example.com');
    expect(saveBtn).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Bearer API key'), 'secret');
    expect(saveBtn).toBeEnabled();
  });

  it('FE-MOB-SETAIR-006: an already-connected instance can be saved without retyping the key', async () => {
    const user = userEvent.setup();
    let body: SavedBody | undefined;
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', async ({ request }) => {
        body = (await request.json()) as SavedBody;
        return HttpResponse.json({ ok: true });
      }),
      http.get('/api/integrations/airtrail/status', () => HttpResponse.json({ connected: true })),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Save/ }));
    await screen.findByText('AirTrail connection saved');
    expect(body).toEqual({ url: 'https://air.example.com', allowInsecureTls: false, writeEnabled: false });
  });

  it('FE-MOB-SETAIR-007: a typed key and the toggles are sent along and the field is cleared', async () => {
    const user = userEvent.setup();
    let body: SavedBody | undefined;
    server.use(
      http.put('/api/integrations/airtrail/settings', async ({ request }) => {
        body = (await request.json()) as SavedBody;
        return HttpResponse.json({ ok: true });
      }),
      http.get('/api/integrations/airtrail/status', () => HttpResponse.json({ connected: true })),
    );
    renderSection();

    await user.type(await screen.findByPlaceholderText('https://airtrail.example.com'), '  https://air.example.com  ');
    await user.type(screen.getByPlaceholderText('Bearer API key'), ' tok-123 ');
    await user.click(screen.getByRole('switch', { name: 'Allow self-signed certificates' }));
    await user.click(screen.getByRole('switch', { name: 'Write changes back to AirTrail' }));
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() =>
      expect(body).toEqual({
        url: 'https://air.example.com',
        allowInsecureTls: true,
        writeEnabled: true,
        apiKey: 'tok-123',
      }),
    );
    await waitFor(() => expect(screen.getByPlaceholderText('••••••••')).toHaveValue(''));
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-SETAIR-008: a warning from the server replaces the success toast', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', () => HttpResponse.json({ warning: 'TLS verification is off' })),
      http.get('/api/integrations/airtrail/status', () => HttpResponse.json({ connected: true })),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Save/ }));
    await screen.findByText('TLS verification is off');
    expect(screen.queryByText('AirTrail connection saved')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETAIR-009: a failing status probe after a successful save marks it disconnected', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', () => HttpResponse.json({ ok: true })),
      http.get('/api/integrations/airtrail/status', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Save/ }));
    await screen.findByText('Not connected');
  });

  it('FE-MOB-SETAIR-010: a rejected save surfaces the server error message', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', () =>
        HttpResponse.json({ error: 'Instance unreachable' }, { status: 400 }),
      ),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Save/ }));
    await screen.findByText('Instance unreachable');
  });

  it('FE-MOB-SETAIR-011: a successful test reports the flight count and flips the badge', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com' });
    server.use(
      http.post('/api/integrations/airtrail/test', () => HttpResponse.json({ connected: true, flightCount: 12 })),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Test connection/ }));
    await screen.findByText('Connected — 12 flight(s) found');
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-SETAIR-012: a rejected test shows the returned error and keeps the badge off', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com' });
    server.use(
      http.post('/api/integrations/airtrail/test', () => HttpResponse.json({ connected: false, error: 'Bad token' })),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Test connection/ }));
    await screen.findByText('Bad token');
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('FE-MOB-SETAIR-013: a network failure during the test falls back to the generic message', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com' });
    server.use(
      http.post('/api/integrations/airtrail/test', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Test connection/ }));
    await screen.findByText('Connection failed');
  });
});
