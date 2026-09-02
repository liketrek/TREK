// FE-MOB-SETPLG-001 onwards
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { usePluginStore, type ActivePlugin } from '../../../../src/store/pluginStore';
import type { PluginAction, PluginUserSettingField } from '../../../../src/api/client';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MSettingsPlugins from '../../../../src/mobile/screens/settings/MSettingsPlugins';

// The plugin's own settings.html lives behind a sandboxed iframe + postMessage
// bridge — out of scope here, so the frame is stubbed to its identifying props.
vi.mock('../../../../src/components/Plugins/PluginFrame', () => ({
  default: ({ pluginId, path, title }: { pluginId: string; path?: string; title?: string }) => (
    <div data-testid="plugin-frame" data-plugin={pluginId} data-path={path} data-title={title} />
  ),
}));

const SECRET_MASK = '••••••••';

const PLUGIN: ActivePlugin = { id: 'p1', name: 'Weather Pro', type: 'integration', icon: 'Cloud' };

const FIELDS: PluginUserSettingField[] = [
  { key: 'api_key', label: 'API key', input_type: 'text', secret: true, required: true, placeholder: 'sk-key', hint: 'From the provider dashboard' },
  { key: 'endpoint', label: 'Endpoint', input_type: 'text', placeholder: 'https://api.example' },
  { key: 'retries', label: 'Retries', input_type: 'number', placeholder: '3' },
  { key: 'notify', label: 'Notify me', input_type: 'checkbox', hint: 'Send a push' },
  { key: 'mode', label: 'Mode', input_type: 'select', options: [{ value: 'fast', label: 'Fast' }, { value: 'slow', label: 'Slow' }] },
  { key: 'raw' },
];

const CONFIG: Record<string, unknown> = {
  api_key: SECRET_MASK,
  endpoint: 'https://api.example',
  retries: 3,
  notify: true,
  mode: null,
  raw: null,
};

const ACTIONS: PluginAction[] = [
  { key: 'test', label: 'Test connection', hint: 'Pings the provider', danger: false, scope: 'user' },
  { key: 'reset', label: 'Reset cache', danger: true, scope: 'user' },
];

const ACTIVITY = [
  { ts: '2025-05-01T10:00:00.000Z', plugin_id: 'p1', plugin_name: 'Weather Pro', method: 'GET', resource: '/trips/1', code: 'ok' },
  { ts: 'not-a-date', plugin_id: 'p2', plugin_name: null, method: 'POST', resource: null, code: 'FORBIDDEN' },
  { ts: '2025-05-02T10:00:00.000Z', plugin_id: 'p3', plugin_name: 'Sync', method: 'PUT', resource: '/atlas', code: 'RATE_LIMIT' },
];

interface SettingsRoute {
  fields?: PluginUserSettingField[]
  config?: Record<string, unknown>
  actions?: PluginAction[]
  oauth?: { configured: boolean; connected: boolean }
}

function seedPluginApi(id: string, r: SettingsRoute) {
  server.use(
    http.get(`/api/plugin-settings/${id}`, () =>
      HttpResponse.json({ fields: r.fields ?? [], config: r.config ?? {}, actions: r.actions ?? [] })),
    http.get(`/api/plugin-oauth/${id}/status`, () =>
      HttpResponse.json(r.oauth ?? { configured: false, connected: false })),
  );
}

function renderScreen() {
  return render(<><ToastContainer /><MSettingsPlugins /></>);
}

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }) });
  usePluginStore.setState({ plugins: [], loaded: true });
  server.use(http.get('/api/plugin-activity', () => HttpResponse.json({ activity: [] })));
});

describe('MSettingsPlugins', () => {
  it('FE-MOB-SETPLG-001: without active plugins only the empty note and the activity card render', async () => {
    renderScreen();

    expect(screen.getByText('No plugins are active.')).toBeInTheDocument();
    expect(screen.getByText('Plugin activity')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await screen.findByText('No plugin activity yet.');
  });

  it('FE-MOB-SETPLG-002: the activity log renders one row per entry with its status tone', async () => {
    server.use(http.get('/api/plugin-activity', () => HttpResponse.json({ activity: ACTIVITY })));
    renderScreen();

    await screen.findByText('Weather Pro');
    // Nameless plugin falls back to its id, missing resource to an em dash
    expect(screen.getByText('p2')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('/trips/1')).toBeInTheDocument();
    // An unparsable timestamp is shown verbatim
    expect(screen.getByText('not-a-date')).toBeInTheDocument();

    expect(screen.getByText('ok')).toHaveClass('text-m-muted');
    expect(screen.getByText('FORBIDDEN')).toHaveClass('text-[color:var(--m-st-danger)]');
    expect(screen.getByText('RATE_LIMIT')).toHaveClass('text-[color:var(--m-st-pending)]');
  });

  it('FE-MOB-SETPLG-003: refresh re-requests the activity log', async () => {
    let calls = 0;
    server.use(http.get('/api/plugin-activity', () => { calls += 1; return HttpResponse.json({ activity: ACTIVITY }); }));
    renderScreen();

    await screen.findByText('Weather Pro');
    expect(calls).toBe(1);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(calls).toBe(2));
  });

  it('FE-MOB-SETPLG-004: a failing activity request degrades to the empty state', async () => {
    server.use(http.get('/api/plugin-activity', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    expect(await screen.findByText('No plugin activity yet.')).toBeInTheDocument();
  });

  it('FE-MOB-SETPLG-005: declared user fields render as the matching mobile controls', async () => {
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { fields: FIELDS, config: CONFIG });
    renderScreen();

    await screen.findByText('Weather Pro');
    const secret = screen.getByPlaceholderText('sk-key');
    expect(secret).toHaveAttribute('type', 'password');
    expect(secret).toHaveValue(SECRET_MASK);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('From the provider dashboard')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('https://api.example')).toHaveAttribute('type', 'text');
    expect(screen.getByPlaceholderText('3')).toHaveAttribute('type', 'number');
    expect(screen.getByRole('switch', { name: 'Notify me' })).toHaveAttribute('aria-checked', 'true');
    // No option matches the null config value
    expect(screen.getByRole('button', { name: '—' })).toBeInTheDocument();
    // A field without a label falls back to its key
    expect(screen.getByText('raw')).toBeInTheDocument();
  });

  it('FE-MOB-SETPLG-006: saving posts every field but leaves an untouched secret alone', async () => {
    const user = userEvent.setup();
    let body: { config?: Record<string, unknown> } | null = null;
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { fields: FIELDS, config: CONFIG });
    server.use(
      http.post('/api/plugin-settings/p1', async ({ request }) => {
        body = (await request.json()) as { config: Record<string, unknown> };
        return HttpResponse.json({ config: { ...CONFIG, endpoint: 'https://new.example' } });
      }),
    );
    renderScreen();

    await screen.findByText('Weather Pro');
    const endpoint = screen.getByPlaceholderText('https://api.example');
    await user.clear(endpoint);
    await user.type(endpoint, 'https://new.example');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Settings saved');
    expect(body?.config).toEqual({
      endpoint: 'https://new.example',
      retries: '3',
      notify: true,
      mode: '',
      raw: '',
    });
    expect(body?.config).not.toHaveProperty('api_key');
    expect(endpoint).toHaveValue('https://new.example');
  });

  it('FE-MOB-SETPLG-007: an edited secret is included in the patch', async () => {
    const user = userEvent.setup();
    let body: { config?: Record<string, unknown> } | null = null;
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { fields: [FIELDS[0]], config: { api_key: SECRET_MASK } });
    server.use(
      http.post('/api/plugin-settings/p1', async ({ request }) => {
        body = (await request.json()) as { config: Record<string, unknown> };
        return HttpResponse.json({ config: { api_key: SECRET_MASK } });
      }),
    );
    renderScreen();

    const secret = await screen.findByPlaceholderText('sk-key');
    await user.clear(secret);
    await user.type(secret, 'sk-live-123');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(body?.config).toEqual({ api_key: 'sk-live-123' }));
    // The response re-masks it
    expect(secret).toHaveValue(SECRET_MASK);
  });

  it('FE-MOB-SETPLG-008: the checkbox and select controls feed their new values into the patch', async () => {
    const user = userEvent.setup();
    let body: { config?: Record<string, unknown> } | null = null;
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { fields: [FIELDS[3], FIELDS[4]], config: { notify: true, mode: null } });
    server.use(
      http.post('/api/plugin-settings/p1', async ({ request }) => {
        body = (await request.json()) as { config: Record<string, unknown> };
        return HttpResponse.json({ config: { notify: false, mode: 'slow' } });
      }),
    );
    renderScreen();

    await screen.findByText('Weather Pro');
    await user.click(screen.getByRole('switch', { name: 'Notify me' }));
    await user.click(screen.getByRole('button', { name: '—' }));

    // Picker sheet lists the empty option plus the declared ones
    await screen.findByRole('button', { name: 'Fast' });
    await user.click(screen.getByRole('button', { name: 'Slow' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(body?.config).toEqual({ notify: false, mode: 'slow' }));
    expect(screen.getByRole('switch', { name: 'Notify me' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-SETPLG-009: a failed save toasts the error and keeps the edit', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { fields: [FIELDS[1]], config: { endpoint: 'https://api.example' } });
    server.use(http.post('/api/plugin-settings/p1', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    const endpoint = await screen.findByPlaceholderText('https://api.example');
    await user.clear(endpoint);
    await user.type(endpoint, 'https://broken');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Error');
    expect(endpoint).toHaveValue('https://broken');
  });

  it('FE-MOB-SETPLG-010: a plugin with no fields, actions or OAuth renders no card', async () => {
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', {});
    renderScreen();

    await screen.findByText('No plugin activity yet.');
    expect(screen.queryByText('Weather Pro')).toBeNull();
    expect(screen.queryByText('No plugins are active.')).toBeNull();
  });

  it('FE-MOB-SETPLG-011: a failing settings request is fail-safe — no card, no crash', async () => {
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    server.use(
      http.get('/api/plugin-settings/p1', () => HttpResponse.json({}, { status: 500 })),
      http.get('/api/plugin-oauth/p1/status', () => HttpResponse.json({}, { status: 500 })),
    );
    renderScreen();

    await screen.findByText('No plugin activity yet.');
    expect(screen.queryByText('Weather Pro')).toBeNull();
  });

  it('FE-MOB-SETPLG-012: a plain action runs straight away and shows its result', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { actions: ACTIONS });
    server.use(http.post('/api/plugin-settings/p1/actions/test', () => HttpResponse.json({ ok: true, message: 'Reached the provider' })));
    renderScreen();

    await screen.findByText('Actions');
    expect(screen.getByText('Pings the provider')).toBeInTheDocument();
    // Without user fields there is no Save button
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Test connection' }));
    await screen.findByText('Reached the provider');
  });

  it('FE-MOB-SETPLG-013: an action result without a message falls back to the generic label', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { actions: [ACTIONS[0], { key: 'probe', label: 'Probe', danger: false, scope: 'user' }] });
    server.use(
      http.post('/api/plugin-settings/p1/actions/test', () => HttpResponse.json({ ok: true })),
      http.post('/api/plugin-settings/p1/actions/probe', () => HttpResponse.json({ ok: false })),
    );
    renderScreen();

    await screen.findByText('Actions');
    await user.click(screen.getByRole('button', { name: 'Test connection' }));
    await screen.findByText('Success');

    await user.click(screen.getByRole('button', { name: 'Probe' }));
    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('FE-MOB-SETPLG-014: unlabelled fields fall back to their key, hints render below', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    server.use(
      // No `actions` key at all — the form must still render.
      http.get('/api/plugin-settings/p1', () => HttpResponse.json({
        fields: [
          { key: 'flag', input_type: 'checkbox', hint: 'Toggle it' },
          { key: 'pick', input_type: 'select', hint: 'Choose one', options: [{ value: 'a', label: 'Alpha' }] },
        ],
        config: {},
      })),
      http.get('/api/plugin-oauth/p1/status', () => HttpResponse.json({ configured: false, connected: false })),
    );
    renderScreen();

    await screen.findByText('Weather Pro');
    expect(screen.getByRole('switch', { name: 'flag' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Toggle it')).toBeInTheDocument();
    expect(screen.getByText('Choose one')).toBeInTheDocument();
    expect(screen.queryByText('Actions')).toBeNull();

    // The picker sheet is titled with the key too
    await user.click(screen.getByRole('button', { name: '—' }));
    await waitFor(() => expect(screen.getAllByText('pick').length).toBeGreaterThan(1));
  });

  it('FE-MOB-SETPLG-015: a failing action reports an error result', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { actions: [ACTIONS[0]] });
    server.use(http.post('/api/plugin-settings/p1/actions/test', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    await screen.findByText('Actions');
    await user.click(screen.getByRole('button', { name: 'Test connection' }));
    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('FE-MOB-SETPLG-016: a danger action asks for confirmation before it runs', async () => {
    const user = userEvent.setup();
    let ran = 0;
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { actions: [ACTIONS[1]] });
    server.use(http.post('/api/plugin-settings/p1/actions/reset', () => { ran += 1; return HttpResponse.json({ ok: true, message: 'Cache cleared' }); }));
    renderScreen();

    await screen.findByText('Actions');

    // Cancelling runs nothing
    await user.click(screen.getByRole('button', { name: 'Reset cache' }));
    await screen.findByText('Run this action?');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull());
    expect(ran).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Reset cache' }));
    await screen.findByText('Run this action?');
    const confirms = screen.getAllByRole('button', { name: 'Reset cache' });
    await user.click(confirms[confirms.length - 1]);

    await screen.findByText('Cache cleared');
    expect(ran).toBe(1);
  });

  it('FE-MOB-SETPLG-017: an unconfigured OAuth plugin shows no connect controls', async () => {
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { actions: [ACTIONS[0]], oauth: { configured: false, connected: false } });
    renderScreen();

    await screen.findByText('Actions');
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
    expect(screen.queryByText('Not connected')).toBeNull();
  });

  it('FE-MOB-SETPLG-018: connecting hands off to the provider authorize URL', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { oauth: { configured: true, connected: false } });
    server.use(http.post('/api/plugin-oauth/p1/connect', () =>
      HttpResponse.json({ authorizeUrl: `${window.location.origin}/#plugin-authorized` })));
    renderScreen();

    // The card renders for the OAuth section alone, even without fields
    await screen.findByText('Weather Pro');
    expect(screen.getByText('Not connected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(window.location.hash).toBe('#plugin-authorized'));
    window.location.hash = '';
  });

  it('FE-MOB-SETPLG-019: a failed connect toasts and re-enables the button', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { oauth: { configured: true, connected: false } });
    server.use(http.post('/api/plugin-oauth/p1/connect', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    await screen.findByText('Not connected');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await screen.findByText('Error');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Connect' })).not.toBeDisabled());
  });

  it('FE-MOB-SETPLG-020: disconnecting flips the section back to "not connected"', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { oauth: { configured: true, connected: true } });
    server.use(http.post('/api/plugin-oauth/p1/disconnect', () => HttpResponse.json({ connected: false })));
    renderScreen();

    await screen.findByText('Connected');
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    await screen.findByText('Not connected');
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('FE-MOB-SETPLG-021: a failed disconnect keeps the connected state', async () => {
    const user = userEvent.setup();
    usePluginStore.setState({ plugins: [PLUGIN], loaded: true });
    seedPluginApi('p1', { oauth: { configured: true, connected: true } });
    server.use(http.post('/api/plugin-oauth/p1/disconnect', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    await screen.findByText('Connected');
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    await screen.findByText('Error');
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-SETPLG-022: a settingsUi plugin gets its own framed card', async () => {
    usePluginStore.setState({ plugins: [{ ...PLUGIN, settingsUi: true }], loaded: true });
    seedPluginApi('p1', { fields: [FIELDS[1]], config: { endpoint: 'https://api.example' } });
    renderScreen();

    const frame = await screen.findByTestId('plugin-frame');
    expect(frame).toHaveAttribute('data-plugin', 'p1');
    expect(frame).toHaveAttribute('data-path', 'settings.html');
    expect(frame).toHaveAttribute('data-title', 'Weather Pro');
    // Declared-field form and framed surface are two separate cards
    expect(screen.getAllByText('Weather Pro')).toHaveLength(2);
  });

  it('FE-MOB-SETPLG-023: several active plugins each get their own form', async () => {
    const second: ActivePlugin = { id: 'p2', name: 'Trip Todos', type: 'widget', icon: null };
    usePluginStore.setState({ plugins: [PLUGIN, second], loaded: true });
    seedPluginApi('p1', { fields: [FIELDS[1]], config: { endpoint: 'https://api.example' } });
    seedPluginApi('p2', { actions: [ACTIONS[0]] });
    renderScreen();

    await screen.findByText('Weather Pro');
    expect(await screen.findByText('Trip Todos')).toBeInTheDocument();
    expect(screen.queryByText('No plugins are active.')).toBeNull();
  });
});
