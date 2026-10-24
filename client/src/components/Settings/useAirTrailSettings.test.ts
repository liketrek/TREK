// FE-COMP-AIRTRAIL-HOOK-001 to -008: the AirTrail connection form both settings shells share.
import { act, renderHook, waitFor } from '@testing-library/react';
import { airtrailApi } from '../../api/client';
import { useAirTrailSettings } from './useAirTrailSettings';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (k: string, p?: Record<string, unknown>) => (p ? `${k}:${JSON.stringify(p)}` : k) }),
}));

const STORED = { url: 'https://air.example', allowInsecureTls: true, writeEnabled: false, connected: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(airtrailApi, 'getSettings').mockResolvedValue(STORED);
  vi.spyOn(airtrailApi, 'saveSettings').mockResolvedValue({});
  vi.spyOn(airtrailApi, 'status').mockResolvedValue({ connected: true });
  vi.spyOn(airtrailApi, 'test').mockResolvedValue({ connected: true, flightCount: 3 });
});
afterEach(() => vi.restoreAllMocks());

async function loaded() {
  const hook = renderHook(() => useAirTrailSettings());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('useAirTrailSettings', () => {
  it('FE-COMP-AIRTRAIL-HOOK-001: hydrates the form from the stored settings and never prefills the key', async () => {
    const { result } = await loaded();
    expect(result.current.url).toBe('https://air.example');
    expect(result.current.allowInsecureTls).toBe(true);
    expect(result.current.writeEnabled).toBe(false);
    expect(result.current.connected).toBe(true);
    expect(result.current.apiKey).toBe('');
  });

  it('FE-COMP-AIRTRAIL-HOOK-002: a failed read still ends loading and leaves the defaults', async () => {
    vi.mocked(airtrailApi.getSettings).mockRejectedValue(new Error('down'));
    const { result } = await loaded();
    expect(result.current.url).toBe('');
    expect(result.current.connected).toBe(false);
  });

  it('FE-COMP-AIRTRAIL-HOOK-003: canSave needs a url plus a connection or a typed key', async () => {
    vi.mocked(airtrailApi.getSettings).mockResolvedValue({ url: '', connected: false });
    const { result } = await loaded();
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setUrl('https://a.example'));
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setApiKey('  k  '));
    expect(result.current.canSave).toBe(true);
  });

  it('FE-COMP-AIRTRAIL-HOOK-004: save leaves a blank key out, refreshes the status and toasts success', async () => {
    const { result } = await loaded();
    act(() => result.current.toggleWriteEnabled());
    act(() => result.current.toggleInsecureTls());
    await act(() => result.current.handleSave());
    expect(airtrailApi.saveSettings).toHaveBeenCalledWith({
      url: 'https://air.example',
      allowInsecureTls: false,
      writeEnabled: true,
    });
    expect(airtrailApi.status).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('settings.airtrail.toast.saved');
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-AIRTRAIL-HOOK-005: save sends a typed key trimmed, clears it, and shows a server warning instead', async () => {
    vi.mocked(airtrailApi.saveSettings).mockResolvedValue({ warning: 'careful' });
    vi.mocked(airtrailApi.status).mockRejectedValue(new Error('x'));
    const { result } = await loaded();
    act(() => result.current.setApiKey(' secret '));
    await act(() => result.current.handleSave());
    expect(airtrailApi.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'secret' }));
    expect(result.current.apiKey).toBe('');
    expect(result.current.connected).toBe(false);
    expect(toast.warning).toHaveBeenCalledWith('careful');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('FE-COMP-AIRTRAIL-HOOK-006: a refused save toasts the server reason, else the generic error', async () => {
    vi.mocked(airtrailApi.saveSettings).mockRejectedValueOnce({ response: { data: { error: 'bad url' } } });
    const { result } = await loaded();
    await act(() => result.current.handleSave());
    expect(toast.error).toHaveBeenLastCalledWith('bad url');
    vi.mocked(airtrailApi.saveSettings).mockRejectedValueOnce(new Error('x'));
    await act(() => result.current.handleSave());
    expect(toast.error).toHaveBeenLastCalledWith('settings.airtrail.toast.saveError');
  });

  it('FE-COMP-AIRTRAIL-HOOK-007: test reports the flight count, or the probe error, and updates the connection', async () => {
    const { result } = await loaded();
    await act(() => result.current.handleTest());
    expect(airtrailApi.test).toHaveBeenCalledWith({ url: 'https://air.example', allowInsecureTls: true });
    expect(toast.success).toHaveBeenCalledWith('settings.airtrail.test.success:{"count":3}');
    vi.mocked(airtrailApi.test).mockResolvedValueOnce({ connected: false, error: 'nope' });
    await act(() => result.current.handleTest());
    expect(result.current.connected).toBe(false);
    expect(toast.error).toHaveBeenLastCalledWith('nope');
  });

  it('FE-COMP-AIRTRAIL-HOOK-008: a test that throws toasts the generic failure and clears testing', async () => {
    vi.mocked(airtrailApi.test).mockRejectedValue(new Error('x'));
    const { result } = await loaded();
    await act(() => result.current.handleTest());
    expect(toast.error).toHaveBeenCalledWith('settings.airtrail.test.failed');
    expect(result.current.testing).toBe(false);
  });
});
