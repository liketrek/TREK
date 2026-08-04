// FE-COMP-AIRTRAIL-001 to FE-COMP-AIRTRAIL-016
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores } from '../../../tests/helpers/store';
import { ToastContainer } from '../shared/Toast';
import AirTrailConnectionSection from './AirTrailConnectionSection';

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
      <AirTrailConnectionSection />
    </>,
  );
}

// The desktop ToggleSwitch has no accessible name, so reach it through the label
// text it sits next to.
function toggleNextTo(label: string): HTMLElement {
  const row = screen.getByText(label).parentElement as HTMLElement;
  return row.querySelector('button') as HTMLElement;
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  stubSettings();
});

describe('AirTrailConnectionSection', () => {
  it('FE-COMP-AIRTRAIL-001: hydrates url, toggles and the connected badge from the stored settings', async () => {
    stubSettings({ url: 'https://air.example.com', allowInsecureTls: true, writeEnabled: true, connected: true });
    renderSection();

    expect(await screen.findByDisplayValue('https://air.example.com')).toBeInTheDocument();
    expect(toggleNextTo('Allow self-signed certificates')).toHaveAttribute('aria-pressed', 'true');
    expect(toggleNextTo('Write changes back to AirTrail')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('FE-COMP-AIRTRAIL-002: an unconfigured instance renders empty, disconnected and with both actions blocked', async () => {
    renderSection();

    await waitFor(() => expect(screen.getByRole('button', { name: /Test connection/ })).toBeDisabled());
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeDisabled();
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bearer API key')).toHaveValue('');
    expect(toggleNextTo('Allow self-signed certificates')).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-COMP-AIRTRAIL-003: a stored key is only masked by the placeholder, never prefilled', async () => {
    stubSettings({ url: 'https://air.example.com', connected: true });
    renderSection();

    const keyInput = await screen.findByPlaceholderText('••••••••');
    expect(keyInput).toHaveValue('');
  });

  it('FE-COMP-AIRTRAIL-004: a failing settings fetch still ends the loading state', async () => {
    server.use(
      http.get('/api/integrations/airtrail/settings', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderSection();

    // Test stays disabled for the missing URL, but the buttons leave the `loading` lock.
    await waitFor(() => expect(screen.getByRole('button', { name: /Test connection/ })).toBeDisabled());
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://airtrail.example.com')).toHaveValue('');
  });

  it('FE-COMP-AIRTRAIL-005: Save unlocks once a URL and a key are typed', async () => {
    const user = userEvent.setup();
    renderSection();

    const saveBtn = await screen.findByRole('button', { name: /^Save$/ });
    await waitFor(() => expect(saveBtn).toBeDisabled());

    await user.type(screen.getByPlaceholderText('https://airtrail.example.com'), 'https://air.example.com');
    expect(saveBtn).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Bearer API key'), 'secret');
    expect(saveBtn).toBeEnabled();
  });

  it('FE-COMP-AIRTRAIL-006: a connected instance saves without retyping the key', async () => {
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

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    await screen.findByText('AirTrail connection saved');
    expect(body).toEqual({ url: 'https://air.example.com', allowInsecureTls: false, writeEnabled: false });
  });

  it('FE-COMP-AIRTRAIL-007: a typed key and both toggles are sent along, then the key field is cleared', async () => {
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
    await user.click(toggleNextTo('Allow self-signed certificates'));
    await user.click(toggleNextTo('Write changes back to AirTrail'));
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

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

  it('FE-COMP-AIRTRAIL-008: a warning from the server replaces the success toast', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', () => HttpResponse.json({ warning: 'TLS verification is off' })),
      http.get('/api/integrations/airtrail/status', () => HttpResponse.json({ connected: true })),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    await screen.findByText('TLS verification is off');
    expect(screen.queryByText('AirTrail connection saved')).not.toBeInTheDocument();
  });

  it('FE-COMP-AIRTRAIL-009: a failing status probe after a successful save marks the connection dead', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', () => HttpResponse.json({ ok: true })),
      http.get('/api/integrations/airtrail/status', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    await screen.findByText('Not connected');
  });

  it('FE-COMP-AIRTRAIL-010: a rejected save surfaces the server error message', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', () =>
        HttpResponse.json({ error: 'Instance unreachable' }, { status: 400 }),
      ),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    await screen.findByText('Instance unreachable');
  });

  it('FE-COMP-AIRTRAIL-011: a save failure without a server message falls back to the generic error', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', () => HttpResponse.error()),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    await screen.findByText('Could not save the connection');
  });

  it('FE-COMP-AIRTRAIL-012: Save is locked while the request is in flight', async () => {
    const user = userEvent.setup();
    let release!: () => void;
    stubSettings({ url: 'https://air.example.com', connected: true });
    server.use(
      http.put('/api/integrations/airtrail/settings', async () => {
        await new Promise<void>(resolve => {
          release = resolve;
        });
        return HttpResponse.json({ ok: true });
      }),
      http.get('/api/integrations/airtrail/status', () => HttpResponse.json({ connected: true })),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    const saveBtn = screen.getByRole('button', { name: /^Save$/ });
    await user.click(saveBtn);

    await waitFor(() => expect(saveBtn).toBeDisabled());
    release();
    await waitFor(() => expect(saveBtn).toBeEnabled());
  });

  it('FE-COMP-AIRTRAIL-013: a successful test reports the flight count and flips the badge', async () => {
    const user = userEvent.setup();
    let body: { url?: string; apiKey?: string; allowInsecureTls?: boolean } | undefined;
    stubSettings({ url: 'https://air.example.com' });
    server.use(
      http.post('/api/integrations/airtrail/test', async ({ request }) => {
        body = (await request.json()) as { url?: string; allowInsecureTls?: boolean };
        return HttpResponse.json({ connected: true, flightCount: 12 });
      }),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /Test connection/ }));

    await screen.findByText('Connected — 12 flight(s) found');
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(body).toEqual({ url: 'https://air.example.com', allowInsecureTls: false });
  });

  it('FE-COMP-AIRTRAIL-014: a test without a flight count still reports zero', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com' });
    server.use(
      http.post('/api/integrations/airtrail/test', () => HttpResponse.json({ connected: true })),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /Test connection/ }));

    await screen.findByText('Connected — 0 flight(s) found');
  });

  it('FE-COMP-AIRTRAIL-015: a refused test shows the returned error and keeps the badge off', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://air.example.com' });
    server.use(
      http.post('/api/integrations/airtrail/test', () => HttpResponse.json({ connected: false, error: 'Bad token' })),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    await user.click(screen.getByRole('button', { name: /Test connection/ }));

    await screen.findByText('Bad token');
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('FE-COMP-AIRTRAIL-016: a network failure during the test falls back to the generic message and shows a spinner', async () => {
    const user = userEvent.setup();
    let release!: () => void;
    stubSettings({ url: 'https://air.example.com' });
    server.use(
      http.post('/api/integrations/airtrail/test', async () => {
        await new Promise<void>(resolve => {
          release = resolve;
        });
        return HttpResponse.json({ error: 'nope' }, { status: 500 });
      }),
    );
    renderSection();

    await screen.findByDisplayValue('https://air.example.com');
    const testBtn = screen.getByRole('button', { name: /Test connection/ });
    await user.click(testBtn);

    await waitFor(() => expect(testBtn).toBeDisabled());
    expect(testBtn.querySelector('.animate-spin')).not.toBeNull();
    release();
    await screen.findByText('Connection failed');
  });
});
