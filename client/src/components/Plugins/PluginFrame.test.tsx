// FE-PLUGINS-FRAME-001 to 004
import { render, cleanup, waitFor } from '@testing-library/react';
import PluginFrame from './PluginFrame';

const navigate = vi.fn();
const toast = { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };
const invoke = vi.fn((..._args: unknown[]) => Promise.resolve({ ok: true }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ locale: 'en' }) }));
vi.mock('../../store/authStore', () => ({ useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { id: 7, username: 'ada', avatar_url: null, role: 'admin' } }) }));
vi.mock('../../store/settingsStore', () => ({ useSettingsStore: (sel: (s: unknown) => unknown) => sel({ settings: { default_currency: 'EUR', time_format: '24h', distance_unit: 'metric', temperature_unit: 'celsius' } }) }));
vi.mock('../../api/client', () => ({ pluginsApi: { invoke: (id: string, sub: string, init?: unknown) => invoke(id, sub, init) } }));

function fromFrame(frame: HTMLIFrameElement, data: unknown) {
  window.dispatchEvent(new MessageEvent('message', { source: frame.contentWindow, data } as MessageEventInit));
}

afterEach(() => {
  cleanup();
  navigate.mockClear();
  Object.values(toast).forEach((f) => f.mockClear());
  invoke.mockClear();
});

describe('PluginFrame', () => {
  it('FE-PLUGINS-FRAME-001: renders an opaque sandboxed iframe (no allow-same-origin)', () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toBe('/plugin-frame/demo/index.html');
    const sandbox = iframe.getAttribute('sandbox') || '';
    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).not.toContain('allow-same-origin');
  });

  it('FE-PLUGINS-FRAME-002: authenticates messages by sender window — a foreign source is ignored', () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    // message NOT from our iframe -> ignored
    window.dispatchEvent(new MessageEvent('message', { source: window, data: { type: 'trek:navigate', to: '/admin' } }));
    expect(navigate).not.toHaveBeenCalled();
    // message from our iframe -> handled
    fromFrame(iframe, { type: 'trek:navigate', to: '/dashboard' });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('FE-PLUGINS-FRAME-003: blocks unsafe navigation targets and renders notifications as text', () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    fromFrame(iframe, { type: 'trek:navigate', to: '//evil.example' }); // protocol-relative
    expect(navigate).not.toHaveBeenCalled();
    fromFrame(iframe, { type: 'trek:notify', level: 'success', message: 'saved' });
    expect(toast.success).toHaveBeenCalledWith('saved');
  });

  it('FE-PLUGINS-FRAME-004: trek:invoke calls the host proxy and replies to the frame', async () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    const posted: unknown[] = [];
    // capture host->frame messages
    (iframe.contentWindow as unknown as { postMessage: (m: unknown) => void }).postMessage = (m: unknown) => posted.push(m);

    fromFrame(iframe, { type: 'trek:invoke', requestId: 'r1', sub: '/status', method: 'GET' });
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('demo', '/status', { method: 'GET', body: undefined }));
    await waitFor(() => expect(posted.some((m) => (m as { type?: string }).type === 'trek:response')).toBe(true));
  });

  it('FE-PLUGINS-FRAME-005: context carries theme tokens, formats and non-secret display identity', () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    const posted: Array<Record<string, unknown>> = [];
    (iframe.contentWindow as unknown as { postMessage: (m: unknown) => void }).postMessage = (m: unknown) => posted.push(m as Record<string, unknown>);

    fromFrame(iframe, { type: 'trek:context:request' });

    const ctx = posted.find((m) => m.type === 'trek:context') as Record<string, unknown> | undefined;
    expect(ctx).toBeTruthy();
    expect(ctx!.tokens).toBeTruthy(); // resolved design tokens (empty {} in jsdom, but present)
    expect(ctx!.formats).toMatchObject({ currency: 'EUR', timeFormat: '24h', distanceUnit: 'metric' });
    // Display identity is present but carries NO secret (no email, role only as a boolean).
    expect(ctx!.user).toMatchObject({ name: 'ada', isAdmin: true });
    expect(JSON.stringify(ctx)).not.toContain('@'); // no email leaked
  });

  it('FE-PLUGINS-FRAME-006: context mirrors the host appearance state (scheme/density/flags)', () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    const posted: Array<Record<string, unknown>> = [];
    (iframe.contentWindow as unknown as { postMessage: (m: unknown) => void }).postMessage = (m: unknown) => posted.push(m as Record<string, unknown>);

    fromFrame(iframe, { type: 'trek:context:request' });

    const ctx = posted.find((m) => m.type === 'trek:context') as Record<string, unknown> | undefined;
    expect(ctx).toBeTruthy();
    // A plugin can honour the same accent/density/accessibility choices as the host.
    expect(ctx!.appearance).toMatchObject({
      scheme: 'default',
      density: 'comfortable',
      noTransparency: false,
      reducedMotion: false,
    });
  });
});
