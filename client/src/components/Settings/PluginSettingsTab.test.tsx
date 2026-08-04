// FE-COMP-PLUGINSETTINGS-001 to FE-COMP-PLUGINSETTINGS-025
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import { ToastContainer } from '../shared/Toast';
import { usePluginStore, type ActivePlugin } from '../../store/pluginStore';
import type { PluginAction, PluginUserSettingField } from '../../api/client';
import PluginSettingsTab from './PluginSettingsTab';

const plugin = (over: Partial<ActivePlugin> = {}): ActivePlugin => ({
  id: 'weather',
  name: 'Weather',
  type: 'widget',
  icon: 'Cloud',
  ...over,
});

interface SettingsPayload {
  fields?: PluginUserSettingField[]
  config?: Record<string, unknown>
  actions?: PluginAction[]
}

/** Wire the three per-plugin endpoints the form reads on mount. */
function serve(id: string, settings: SettingsPayload, oauth?: { configured: boolean; connected: boolean }): void {
  server.use(
    http.get(`/api/plugin-settings/${id}`, () => HttpResponse.json({
      fields: settings.fields ?? [],
      config: settings.config ?? {},
      actions: settings.actions ?? [],
    })),
    http.get(`/api/plugin-oauth/${id}/status`, () =>
      oauth ? HttpResponse.json(oauth) : HttpResponse.json({ error: 'not found' }, { status: 404 })),
  );
}

function setPlugins(plugins: ActivePlugin[]): void {
  usePluginStore.setState({ plugins });
}

/** The settings card for a plugin (the heading's rounded container). */
const cardFor = (name: string) => screen.getByRole('heading', { name }).closest('div.rounded-xl') as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  setPlugins([]);
  server.use(http.get('/api/plugin-activity', () => HttpResponse.json({ activity: [] })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PluginSettingsTab', () => {
  it('FE-COMP-PLUGINSETTINGS-001: shows the header and the empty state when no plugin is active', async () => {
    render(<PluginSettingsTab />);

    expect(screen.getByRole('heading', { name: 'Plugin settings' })).toBeInTheDocument();
    expect(screen.getByText('Your personal settings for the plugins you use (API keys, preferences).')).toBeInTheDocument();
    expect(screen.getByText('No plugins are active.')).toBeInTheDocument();
    // The activity log is always mounted, plugins or not.
    expect(await screen.findByText('Plugin activity')).toBeInTheDocument();
  });

  it('FE-COMP-PLUGINSETTINGS-002: a plugin with nothing to configure renders no card', async () => {
    serve('weather', {});
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await screen.findByText('Plugin activity');
    expect(screen.queryByText('No plugins are active.')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Weather' })).not.toBeInTheDocument());
  });

  it('FE-COMP-PLUGINSETTINGS-003: a failing settings request leaves the card out', async () => {
    server.use(
      http.get('/api/plugin-settings/weather', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      http.get('/api/plugin-oauth/weather/status', () => HttpResponse.json({ configured: false, connected: false })),
    );
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await screen.findByText('Plugin activity');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Weather' })).not.toBeInTheDocument());
  });

  it('FE-COMP-PLUGINSETTINGS-004: text fields are labelled, prefilled and marked required', async () => {
    serve('weather', {
      fields: [
        { key: 'api_key', label: 'API key', input_type: 'text', required: true, hint: 'From your provider' },
        { key: 'units', input_type: 'text' },
      ],
      config: { api_key: 'abc123', units: 'metric' },
    });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await screen.findByDisplayValue('abc123');
    const card = cardFor('Weather');
    expect(within(card).getByText('API key')).toHaveTextContent('*');
    expect(within(card).getByText('From your provider')).toBeInTheDocument();
    // No label declared → the key stands in for it.
    expect(within(card).getByText('units')).toBeInTheDocument();
    expect(within(card).getByDisplayValue('metric')).toBeInTheDocument();
  });

  it('FE-COMP-PLUGINSETTINGS-005: a secret field renders as a password input with a placeholder', async () => {
    serve('weather', {
      fields: [{ key: 'token', label: 'Token', input_type: 'text', secret: true, placeholder: 'paste here' }],
      config: { token: '••••••••' },
    });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    const input = await screen.findByPlaceholderText('paste here') as HTMLInputElement;
    expect(input.type).toBe('password');
    expect(input.autocomplete).toBe('new-password');
    expect(input.value).toBe('••••••••');
  });

  it('FE-COMP-PLUGINSETTINGS-006: a number field renders a numeric input and a null config value is blank', async () => {
    serve('weather', {
      fields: [{ key: 'days', label: 'Days', input_type: 'number' }],
      config: { days: null },
    });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    const input = await screen.findByRole('spinbutton') as HTMLInputElement;
    expect(input.type).toBe('number');
    expect(input.value).toBe('');
  });

  it('FE-COMP-PLUGINSETTINGS-007: a checkbox field mirrors the boolean config and toggles', async () => {
    const user = userEvent.setup();
    serve('weather', {
      fields: [{ key: 'alerts', label: 'Alerts', input_type: 'checkbox' }],
      config: { alerts: true },
    });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    const box = await screen.findByRole('checkbox');
    expect(box).toBeChecked();
    await user.click(box);
    expect(box).not.toBeChecked();
  });

  it('FE-COMP-PLUGINSETTINGS-008: a select field lists its options and keeps the chosen one', async () => {
    const user = userEvent.setup();
    serve('weather', {
      fields: [{
        key: 'unit', label: 'Unit', input_type: 'select',
        options: [{ value: 'c', label: 'Celsius' }, { value: 'f', label: 'Fahrenheit' }],
      }],
      config: { unit: 'c' },
    });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    const select = await screen.findByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('c');
    await user.selectOptions(select, 'f');
    expect(select.value).toBe('f');
  });

  it('FE-COMP-PLUGINSETTINGS-009: a select field without options falls back to a text input', async () => {
    serve('weather', {
      fields: [{ key: 'unit', label: 'Unit', input_type: 'select' }],
      config: { unit: 'c' },
    });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    expect(await screen.findByDisplayValue('c')).toHaveAttribute('type', 'text');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('FE-COMP-PLUGINSETTINGS-010: saving posts the edited values and echoes back the stored config', async () => {
    const user = userEvent.setup();
    const sent: { body?: { config?: Record<string, unknown> } } = {};
    serve('weather', {
      fields: [
        { key: 'api_key', label: 'API key', input_type: 'text' },
        { key: 'alerts', label: 'Alerts', input_type: 'checkbox' },
      ],
      config: { api_key: 'old', alerts: false },
    });
    server.use(http.post('/api/plugin-settings/weather', async ({ request }) => {
      sent.body = await request.json() as { config?: Record<string, unknown> };
      return HttpResponse.json({ config: { api_key: 'new-key', alerts: true } });
    }));
    setPlugins([plugin()]);
    render(<><ToastContainer /><PluginSettingsTab /></>);

    const input = await screen.findByDisplayValue('old');
    await user.clear(input);
    await user.type(input, 'new-key');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Settings saved');
    expect(sent.body?.config).toEqual({ api_key: 'new-key', alerts: true });
    expect(await screen.findByDisplayValue('new-key')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('FE-COMP-PLUGINSETTINGS-011: an untouched secret is not overwritten with its mask', async () => {
    const user = userEvent.setup();
    const sent: { body?: { config?: Record<string, unknown> } } = {};
    serve('weather', {
      fields: [
        { key: 'token', label: 'Token', input_type: 'text', secret: true },
        { key: 'city', label: 'City', input_type: 'text' },
      ],
      config: { token: '••••••••', city: 'Berlin' },
    });
    server.use(http.post('/api/plugin-settings/weather', async ({ request }) => {
      sent.body = await request.json() as { config?: Record<string, unknown> };
      return HttpResponse.json({ config: { token: '••••••••', city: 'Paris' } });
    }));
    setPlugins([plugin()]);
    render(<><ToastContainer /><PluginSettingsTab /></>);

    const city = await screen.findByDisplayValue('Berlin');
    await user.clear(city);
    await user.type(city, 'Paris');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Settings saved');
    expect(sent.body?.config).toEqual({ city: 'Paris' });
  });

  it('FE-COMP-PLUGINSETTINGS-012: a changed secret IS sent', async () => {
    const user = userEvent.setup();
    const sent: { body?: { config?: Record<string, unknown> } } = {};
    serve('weather', {
      fields: [{ key: 'token', label: 'Token', input_type: 'text', secret: true }],
      config: { token: '••••••••' },
    });
    server.use(http.post('/api/plugin-settings/weather', async ({ request }) => {
      sent.body = await request.json() as { config?: Record<string, unknown> };
      return HttpResponse.json({ config: { token: '••••••••' } });
    }));
    setPlugins([plugin()]);
    render(<><ToastContainer /><PluginSettingsTab /></>);

    const token = await screen.findByDisplayValue('••••••••');
    await user.clear(token);
    await user.type(token, 'real-secret');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Settings saved');
    expect(sent.body?.config).toEqual({ token: 'real-secret' });
  });

  it('FE-COMP-PLUGINSETTINGS-013: a failing save reports an error and re-enables the button', async () => {
    const user = userEvent.setup();
    serve('weather', {
      fields: [{ key: 'city', label: 'City', input_type: 'text' }],
      config: { city: 'Berlin' },
    });
    server.use(http.post('/api/plugin-settings/weather', () =>
      HttpResponse.json({ error: 'nope' }, { status: 500 })));
    setPlugins([plugin()]);
    render(<><ToastContainer /><PluginSettingsTab /></>);

    await screen.findByDisplayValue('Berlin');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Error');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('FE-COMP-PLUGINSETTINGS-014: a plugin with only actions gets a card without a Save button', async () => {
    serve('weather', { actions: [{ key: 'test', label: 'Test connection', hint: 'Pings the API', danger: false }] });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await screen.findByRole('button', { name: 'Test connection' });
    const card = cardFor('Weather');
    expect(within(card).getByText('Actions')).toBeInTheDocument();
    expect(within(card).getByText('Pings the API')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PLUGINSETTINGS-015: running an action shows the message it returns', async () => {
    const user = userEvent.setup();
    serve('weather', { actions: [{ key: 'test', label: 'Test connection', danger: false }] });
    server.use(http.post('/api/plugin-settings/weather/actions/test', () =>
      HttpResponse.json({ ok: true, message: 'Reached the API' })));
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await user.click(await screen.findByRole('button', { name: 'Test connection' }));
    expect(await screen.findByText('Reached the API')).toHaveClass('text-success');
  });

  it('FE-COMP-PLUGINSETTINGS-016: a message-less result falls back to the generic ok/error labels', async () => {
    const user = userEvent.setup();
    serve('weather', { actions: [{ key: 'test', label: 'Test connection', danger: false }] });
    server.use(http.post('/api/plugin-settings/weather/actions/test', () => HttpResponse.json({ ok: false })));
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await user.click(await screen.findByRole('button', { name: 'Test connection' }));
    expect(await screen.findByText('Error')).toHaveClass('text-danger');
  });

  it('FE-COMP-PLUGINSETTINGS-017: a failing action reports an error result', async () => {
    const user = userEvent.setup();
    serve('weather', { actions: [{ key: 'test', label: 'Test connection', danger: false }] });
    server.use(http.post('/api/plugin-settings/weather/actions/test', () =>
      HttpResponse.json({ error: 'down' }, { status: 500 })));
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    const button = await screen.findByRole('button', { name: 'Test connection' });
    await user.click(button);
    expect(await screen.findByText('Error')).toHaveClass('text-danger');
    expect(button).toBeEnabled();
  });

  it('FE-COMP-PLUGINSETTINGS-018: a dangerous action asks first and a declined confirm skips it', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    let ran = 0;
    serve('weather', { actions: [{ key: 'wipe', label: 'Wipe cache', danger: true }] });
    server.use(http.post('/api/plugin-settings/weather/actions/wipe', () => {
      ran += 1;
      return HttpResponse.json({ ok: true, message: 'Wiped' });
    }));
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await user.click(await screen.findByRole('button', { name: 'Wipe cache' }));
    expect(confirmSpy).toHaveBeenCalledWith('Run this action?');
    expect(ran).toBe(0);

    confirmSpy.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Wipe cache' }));
    await screen.findByText('Wiped');
    expect(ran).toBe(1);
    confirmSpy.mockRestore();
  });

  it('FE-COMP-PLUGINSETTINGS-019: an unconfigured OAuth integration renders no connect row', async () => {
    serve('weather', {
      fields: [{ key: 'city', label: 'City', input_type: 'text' }],
      config: { city: 'Berlin' },
    }, { configured: false, connected: false });
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    await screen.findByDisplayValue('Berlin');
    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
    expect(screen.queryByText('Not connected')).not.toBeInTheDocument();
  });

  it('FE-COMP-PLUGINSETTINGS-020: an OAuth-only plugin gets a card and Connect hands off to the provider', async () => {
    const user = userEvent.setup();
    const loc = { href: 'http://localhost/settings', origin: 'http://localhost', pathname: '/settings' };
    vi.stubGlobal('location', loc);
    serve('weather', {}, { configured: true, connected: false });
    server.use(http.post('/api/plugin-oauth/weather/connect', () =>
      HttpResponse.json({ authorizeUrl: 'https://provider.example/authorize?x=1' })));
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    expect(await screen.findByText('Not connected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => expect(loc.href).toBe('https://provider.example/authorize?x=1'));
  });

  it('FE-COMP-PLUGINSETTINGS-021: a failing connect reports an error and frees the button', async () => {
    const user = userEvent.setup();
    serve('weather', {}, { configured: true, connected: false });
    server.use(http.post('/api/plugin-oauth/weather/connect', () =>
      HttpResponse.json({ error: 'nope' }, { status: 500 })));
    setPlugins([plugin()]);
    render(<><ToastContainer /><PluginSettingsTab /></>);

    await user.click(await screen.findByRole('button', { name: 'Connect' }));

    await screen.findByText('Error');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled());
  });

  it('FE-COMP-PLUGINSETTINGS-022: disconnecting flips the row back to "not connected"', async () => {
    const user = userEvent.setup();
    serve('weather', {}, { configured: true, connected: true });
    server.use(http.post('/api/plugin-oauth/weather/disconnect', () => HttpResponse.json({ connected: false })));
    setPlugins([plugin()]);
    render(<PluginSettingsTab />);

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(await screen.findByText('Not connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('FE-COMP-PLUGINSETTINGS-023: a failing disconnect keeps the connection and reports an error', async () => {
    const user = userEvent.setup();
    serve('weather', {}, { configured: true, connected: true });
    server.use(http.post('/api/plugin-oauth/weather/disconnect', () =>
      HttpResponse.json({ error: 'nope' }, { status: 500 })));
    setPlugins([plugin()]);
    render(<><ToastContainer /><PluginSettingsTab /></>);

    await user.click(await screen.findByRole('button', { name: 'Disconnect' }));

    await screen.findByText('Error');
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeEnabled();
  });

  it('FE-COMP-PLUGINSETTINGS-024: a settingsUi plugin also gets its own sandboxed frame card', async () => {
    serve('weather', {
      fields: [{ key: 'city', label: 'City', input_type: 'text' }],
      config: { city: 'Berlin' },
    });
    setPlugins([plugin({ settingsUi: true })]);
    const { container } = render(<PluginSettingsTab />);

    await screen.findByDisplayValue('Berlin');
    expect(screen.getAllByRole('heading', { name: 'Weather' })).toHaveLength(2);
    const frame = container.querySelector('iframe') as HTMLIFrameElement;
    expect(frame).not.toBeNull();
    expect(frame.getAttribute('src')).toBe('/plugin-frame/weather/settings.html');
    expect(frame.getAttribute('sandbox') || '').not.toContain('allow-same-origin');
  });

  it('FE-COMP-PLUGINSETTINGS-025: every active plugin gets its own form', async () => {
    serve('weather', { fields: [{ key: 'city', label: 'City', input_type: 'text' }], config: { city: 'Berlin' } });
    server.use(
      http.get('/api/plugin-settings/notes', () => HttpResponse.json({
        fields: [{ key: 'folder', label: 'Folder', input_type: 'text' }], config: { folder: 'Trips' }, actions: [],
      })),
      http.get('/api/plugin-oauth/notes/status', () => HttpResponse.json({ configured: false, connected: false })),
    );
    setPlugins([plugin(), plugin({ id: 'notes', name: 'Notes', icon: null })]);
    render(<PluginSettingsTab />);

    await screen.findByDisplayValue('Berlin');
    expect(await screen.findByDisplayValue('Trips')).toBeInTheDocument();
    expect(within(cardFor('Notes')).getByText('Folder')).toBeInTheDocument();
  });
});
