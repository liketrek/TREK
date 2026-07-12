// FE-PLUGINS-FRAME-001 to 012
import { render, cleanup, waitFor, fireEvent, screen, act } from '@testing-library/react';
import PluginFrame from './PluginFrame';

const navigate = vi.fn();
const toast = { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };
const invoke = vi.fn((..._args: unknown[]) => Promise.resolve({ ok: true }));
const wsListeners = new Set<(ev: Record<string, unknown>) => void>();

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ locale: 'en', t: (k: string) => k }) }));
vi.mock('../../store/authStore', () => ({ useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { id: 7, username: 'ada', avatar_url: null, role: 'admin' } }) }));
vi.mock('../../store/settingsStore', () => ({ useSettingsStore: (sel: (s: unknown) => unknown) => sel({ settings: { default_currency: 'EUR', time_format: '24h', distance_unit: 'metric', temperature_unit: 'celsius' } }) }));
vi.mock('../../api/client', () => ({ pluginsApi: { invoke: (id: string, sub: string, init?: unknown) => invoke(id, sub, init) } }));
vi.mock('../../api/websocket', () => ({
  addListener: (fn: (ev: Record<string, unknown>) => void) => wsListeners.add(fn),
  removeListener: (fn: (ev: Record<string, unknown>) => void) => wsListeners.delete(fn),
}));

function fromFrame(frame: HTMLIFrameElement, data: unknown) {
  window.dispatchEvent(new MessageEvent('message', { source: frame.contentWindow, data } as MessageEventInit));
}

afterEach(() => {
  cleanup();
  navigate.mockClear();
  Object.values(toast).forEach((f) => f.mockClear());
  invoke.mockClear();
  wsListeners.clear();
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

  it('FE-PLUGINS-FRAME-008: a day-detail host passes the open day (and place stays null)', () => {
    const { container } = render(<PluginFrame pluginId="demo" tripId="1" dayId="12" />);
    const iframe = container.querySelector('iframe')!;
    const posted: Array<Record<string, unknown>> = [];
    (iframe.contentWindow as unknown as { postMessage: (m: unknown) => void }).postMessage = (m: unknown) => posted.push(m as Record<string, unknown>);

    fromFrame(iframe, { type: 'trek:context:request' });

    const ctx = posted.find((m) => m.type === 'trek:context') as Record<string, unknown> | undefined;
    expect(ctx).toBeTruthy();
    expect(ctx!.tripId).toBe('1');
    expect(ctx!.dayId).toBe('12');
    expect(ctx!.placeId).toBeNull();
  });

  it('FE-PLUGINS-FRAME-014: a reservation-detail host passes the open reservation (and day/place stay null)', () => {
    const { container } = render(<PluginFrame pluginId="demo" tripId="1" reservationId="88" />);
    const iframe = container.querySelector('iframe')!;
    const posted: Array<Record<string, unknown>> = [];
    (iframe.contentWindow as unknown as { postMessage: (m: unknown) => void }).postMessage = (m: unknown) => posted.push(m as Record<string, unknown>);

    fromFrame(iframe, { type: 'trek:context:request' });

    const ctx = posted.find((m) => m.type === 'trek:context') as Record<string, unknown> | undefined;
    expect(ctx).toBeTruthy();
    expect(ctx!.tripId).toBe('1');
    expect(ctx!.reservationId).toBe('88');
    expect(ctx!.dayId).toBeNull();
    expect(ctx!.placeId).toBeNull();
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

  it('FE-PLUGINS-FRAME-007: fill mode pins the frame to 100% height and ignores trek:resize', () => {
    const { container } = render(<PluginFrame pluginId="demo" fill />);
    const iframe = container.querySelector('iframe')!;
    act(() => { fromFrame(iframe, { type: 'trek:resize', height: 480 }); });
    expect(iframe.style.height).toBe('100%');
  });

  it('FE-PLUGINS-FRAME-008: without fill, trek:resize drives the frame height (widget self-sizing)', () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    act(() => { fromFrame(iframe, { type: 'trek:resize', height: 480 }); });
    expect(iframe.style.height).toBe('480px');
  });

  it('FE-PLUGINS-FRAME-009: trek:confirm renders the native dialog and answers over the bridge', async () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    const posted: Array<Record<string, unknown>> = [];
    (iframe.contentWindow as unknown as { postMessage: (m: unknown) => void }).postMessage = (m: unknown) => posted.push(m as Record<string, unknown>);

    fromFrame(iframe, { type: 'trek:confirm', requestId: 'c1', message: 'Delete everything?', confirmLabel: 'Yes, wipe it' });
    const confirmBtn = await screen.findByText('Yes, wipe it');
    fireEvent.click(confirmBtn);

    const result = posted.find((m) => m.type === 'trek:confirm:result') as Record<string, unknown> | undefined;
    expect(result).toMatchObject({ requestId: 'c1', confirmed: true });
  });

  it('FE-PLUGINS-FRAME-010: trek:openExternal opens only real web URLs in a noopener tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;

    fromFrame(iframe, { type: 'trek:openExternal', url: 'javascript:alert(1)' });
    fromFrame(iframe, { type: 'trek:openExternal', url: 'not a url' });
    expect(open).not.toHaveBeenCalled();

    fromFrame(iframe, { type: 'trek:openExternal', url: 'https://example.com/docs' });
    expect(open).toHaveBeenCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('FE-PLUGINS-FRAME-011: forwards core-event names for the trip in view, payload-free', () => {
    const { container } = render(<PluginFrame pluginId="demo" tripId="42" />);
    const iframe = container.querySelector('iframe')!;
    const posted: Array<Record<string, unknown>> = [];
    (iframe.contentWindow as unknown as { postMessage: (m: unknown) => void }).postMessage = (m: unknown) => posted.push(m as Record<string, unknown>);
    // The bridge only forwards to the original document (first load).
    fireEvent.load(iframe);

    expect(wsListeners.size).toBe(1);
    const emit = [...wsListeners][0];
    emit({ type: 'place_created', tripId: 99, place: { secret: true } }); // other trip -> dropped
    emit({ type: 'place_created', tripId: 42, place: { secret: true } });

    const events = posted.filter((m) => m.type === 'trek:event');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ event: 'place_created', tripId: '42' });
    expect(JSON.stringify(events[0])).not.toContain('secret'); // names only, never payloads
  });

  it('FE-PLUGINS-FRAME-012: trek:notify clamps a plugin-supplied duration', () => {
    const { container } = render(<PluginFrame pluginId="demo" />);
    const iframe = container.querySelector('iframe')!;
    fromFrame(iframe, { type: 'trek:notify', level: 'info', message: 'hi', duration: 999999 });
    expect(toast.info).toHaveBeenCalledWith('hi', 15000);
    // NaN must not slip through the clamp as a sticky toast.
    fromFrame(iframe, { type: 'trek:notify', level: 'info', message: 'ho', duration: NaN });
    expect(toast.info).toHaveBeenLastCalledWith('ho');
  });

  it('FE-PLUGINS-FRAME-013: swapping pluginId in place restarts the bridge for the new plugin', () => {
    const { container, rerender } = render(<PluginFrame pluginId="alpha" />);
    fireEvent.load(container.querySelector('iframe')!);

    rerender(<PluginFrame pluginId="beta" />);
    const next = container.querySelector('iframe')!; // keyed by pluginId -> fresh element
    expect(next.getAttribute('src')).toBe('/plugin-frame/beta/index.html');
    act(() => { fireEvent.load(next); });

    // Without the per-plugin reset this would be refused as a "navigated" frame.
    fromFrame(next, { type: 'trek:navigate', to: '/dashboard' });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });
});
