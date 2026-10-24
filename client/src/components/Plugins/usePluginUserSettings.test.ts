// FE-COMP-PLUGIN-USERSET-001 to -012: the per plugin user settings logic both settings shells share.
import { act, renderHook, waitFor } from '@testing-library/react';
import { pluginsApi, type PluginAction, type PluginUserSettingField } from '../../api/client';
import { SECRET_MASK } from './settingsForm';
import { usePluginOAuth, usePluginUserSettings } from './usePluginUserSettings';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (k: string, p?: Record<string, unknown>) => (p ? `${k}:${String(p.field)}` : k) }),
}));

const FIELDS = [
  { key: 'token', label: 'Token', input_type: 'text', required: true, secret: true },
  { key: 'units', label: '', input_type: 'text', required: true, secret: false, default: 'km' },
  { key: 'on', label: 'On', input_type: 'checkbox', required: false, secret: false },
] as unknown as PluginUserSettingField[];
const PING = { key: 'ping', label: 'Ping', danger: false } as unknown as PluginAction;
const WIPE = { key: 'wipe', label: 'Wipe', danger: true } as unknown as PluginAction;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(pluginsApi, 'userSettings').mockResolvedValue({
    fields: FIELDS,
    config: { token: SECRET_MASK, on: true },
    actions: [PING, WIPE],
  });
  vi.spyOn(pluginsApi, 'oauthStatus').mockResolvedValue({ configured: false, connected: false });
  vi.spyOn(pluginsApi, 'saveUserSettings').mockResolvedValue({
    config: { token: SECRET_MASK, units: 'mi', on: false },
  });
  vi.spyOn(pluginsApi, 'runAction').mockResolvedValue({ ok: true, message: 'pong' });
});
afterEach(() => vi.restoreAllMocks());

async function loaded() {
  const hook = renderHook(() => usePluginUserSettings('p'));
  await waitFor(() => expect(hook.result.current.fields).not.toBeNull());
  return hook;
}

describe('usePluginUserSettings', () => {
  it('FE-COMP-PLUGIN-USERSET-001: seeds the draft from the stored config and the manifest defaults', async () => {
    const { result } = await loaded();
    expect(pluginsApi.userSettings).toHaveBeenCalledWith('p');
    expect(result.current.values).toEqual({ token: SECRET_MASK, units: 'km', on: true });
    expect(result.current.actions).toEqual([PING, WIPE]);
    expect(result.current.hasFields).toBe(true);
    expect(result.current.visible).toBe(true);
  });

  it('FE-COMP-PLUGIN-USERSET-002: stays hidden while loading and when there is nothing to offer', async () => {
    vi.mocked(pluginsApi.userSettings).mockResolvedValue({ fields: [], config: {}, actions: [] });
    const hook = renderHook(() => usePluginUserSettings('p'));
    expect(hook.result.current.visible).toBe(false);
    await waitFor(() => expect(hook.result.current.fields).toEqual([]));
    expect(hook.result.current.visible).toBe(false);
  });

  it('FE-COMP-PLUGIN-USERSET-003: an OAuth connection alone makes the card visible', async () => {
    vi.mocked(pluginsApi.userSettings).mockResolvedValue({ fields: [], config: {}, actions: [] });
    vi.mocked(pluginsApi.oauthStatus).mockResolvedValue({ configured: true, connected: false });
    const { result } = renderHook(() => usePluginUserSettings('p'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.oauth).toEqual({ configured: true, connected: false });
  });

  it('FE-COMP-PLUGIN-USERSET-004: a failed read leaves an empty field list and no OAuth', async () => {
    vi.mocked(pluginsApi.userSettings).mockRejectedValue(new Error('x'));
    vi.mocked(pluginsApi.oauthStatus).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => usePluginUserSettings('p'));
    await waitFor(() => expect(result.current.fields).toEqual([]));
    expect(result.current.oauth).toBeNull();
  });

  it('FE-COMP-PLUGIN-USERSET-005: save refuses a blank required field by name, without a request', async () => {
    const { result } = await loaded();
    act(() => result.current.setValue('units', '  '));
    await act(() => result.current.save());
    expect(toast.error).toHaveBeenCalledWith('settings.plugins.requiredMissing:units');
    expect(pluginsApi.saveUserSettings).not.toHaveBeenCalled();
  });

  it('FE-COMP-PLUGIN-USERSET-006: save leaves the untouched secret out and reseeds from the answer', async () => {
    const { result } = await loaded();
    act(() => result.current.setValue('units', 'mi'));
    act(() => result.current.setValue('on', false));
    await act(() => result.current.save());
    expect(pluginsApi.saveUserSettings).toHaveBeenCalledWith('p', { units: 'mi', on: false });
    expect(result.current.values).toEqual({ token: SECRET_MASK, units: 'mi', on: false });
    expect(toast.success).toHaveBeenCalledWith('settings.plugins.saved');
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-PLUGIN-USERSET-007: a 4xx save shows the server reason, a 5xx the generic error', async () => {
    const { result } = await loaded();
    vi.mocked(pluginsApi.saveUserSettings).mockRejectedValueOnce({
      response: { status: 400, data: { error: 'nope' } },
    });
    await act(() => result.current.save());
    expect(toast.error).toHaveBeenLastCalledWith('nope');
    vi.mocked(pluginsApi.saveUserSettings).mockRejectedValueOnce({
      response: { status: 500, data: { error: 'trace' } },
    });
    await act(() => result.current.save());
    expect(toast.error).toHaveBeenLastCalledWith('common.error');
  });

  it('FE-COMP-PLUGIN-USERSET-008: a safe action runs straight away and records its result', async () => {
    const { result } = await loaded();
    act(() => result.current.runAction(PING));
    await waitFor(() => expect(result.current.actionResult.ping).toEqual({ ok: true, message: 'pong' }));
    expect(pluginsApi.runAction).toHaveBeenCalledWith('p', 'ping');
    expect(result.current.running).toBeNull();
    expect(result.current.pendingAction).toBeNull();
  });

  it('FE-COMP-PLUGIN-USERSET-009: a dangerous action waits for the confirm step', async () => {
    const { result } = await loaded();
    act(() => result.current.runAction(WIPE));
    expect(result.current.pendingAction).toBe(WIPE);
    expect(pluginsApi.runAction).not.toHaveBeenCalled();
    vi.mocked(pluginsApi.runAction).mockRejectedValueOnce(new Error('x'));
    await act(() => result.current.performAction(WIPE));
    expect(result.current.actionResult.wipe).toEqual({ ok: false, message: 'common.error' });
  });
});

describe('usePluginOAuth', () => {
  it('FE-COMP-PLUGIN-USERSET-010: disconnect clears the connection, a failure toasts and frees the button', async () => {
    const setState = vi.fn();
    vi.spyOn(pluginsApi, 'oauthDisconnect').mockResolvedValue({ connected: false });
    const { result } = renderHook(() => usePluginOAuth('p', { configured: true, connected: true }, setState));
    await act(() => result.current.disconnect());
    expect(pluginsApi.oauthDisconnect).toHaveBeenCalledWith('p');
    expect(setState).toHaveBeenCalledWith({ configured: true, connected: false });
    vi.mocked(pluginsApi.oauthDisconnect).mockRejectedValueOnce(new Error('x'));
    await act(() => result.current.disconnect());
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.busy).toBe(false);
  });

  it('FE-COMP-PLUGIN-USERSET-011: a failed connect toasts and frees the button', async () => {
    vi.spyOn(pluginsApi, 'oauthConnect').mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => usePluginOAuth('p', { configured: true, connected: false }, vi.fn()));
    await act(() => result.current.connect());
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.busy).toBe(false);
  });

  it('FE-COMP-PLUGIN-USERSET-012: a connect hands off to the provider and keeps the button busy', async () => {
    const realLocation = window.location;
    const loc = { href: 'http://localhost/settings' };
    Object.defineProperty(window, 'location', { writable: true, configurable: true, value: loc });
    try {
      vi.spyOn(pluginsApi, 'oauthConnect').mockResolvedValue({
        authorizeUrl: 'https://provider.example/authorize?x=1',
      });
      const { result } = renderHook(() => usePluginOAuth('p', { configured: true, connected: false }, vi.fn()));
      await act(() => result.current.connect());
      expect(pluginsApi.oauthConnect).toHaveBeenCalledWith('p');
      expect(loc.href).toBe('https://provider.example/authorize?x=1');
      expect(result.current.busy).toBe(true);
      expect(toast.error).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', { writable: true, configurable: true, value: realLocation });
    }
  });
});
