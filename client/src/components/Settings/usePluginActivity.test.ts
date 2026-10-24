// FE-COMP-PLUGIN-ACTIVITY-HOOK-001 to -004: the plugin activity log both settings shells share.
import { act, renderHook, waitFor } from '@testing-library/react';
import { pluginsApi } from '../../api/client';
import { usePluginActivity } from './usePluginActivity';

vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k, locale: 'en-US' }) }));

const ROW = {
  ts: '2026-01-02T03:04:05Z',
  plugin_id: 'p',
  plugin_name: 'P',
  method: 'trips.read',
  resource: 'trip:1',
  code: 'ok',
};

afterEach(() => vi.restoreAllMocks());

describe('usePluginActivity', () => {
  it('FE-COMP-PLUGIN-ACTIVITY-HOOK-001: loads on mount and ends loading', async () => {
    vi.spyOn(pluginsApi, 'myActivity').mockResolvedValue({ activity: [ROW] });
    const { result } = renderHook(() => usePluginActivity());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toEqual([ROW]);
    expect(pluginsApi.myActivity).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-PLUGIN-ACTIVITY-HOOK-002: a failed load shows an empty log instead of an error', async () => {
    vi.spyOn(pluginsApi, 'myActivity').mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => usePluginActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toEqual([]);
  });

  it('FE-COMP-PLUGIN-ACTIVITY-HOOK-003: refresh loads again and replaces the rows', async () => {
    const spy = vi.spyOn(pluginsApi, 'myActivity').mockResolvedValue({ activity: [] });
    const { result } = renderHook(() => usePluginActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    spy.mockResolvedValue({ activity: [ROW] });
    act(() => result.current.load());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.rows).toEqual([ROW]));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('FE-COMP-PLUGIN-ACTIVITY-HOOK-004: formats a timestamp in the locale and passes an unreadable one through', async () => {
    vi.spyOn(pluginsApi, 'myActivity').mockResolvedValue({ activity: [] });
    const { result } = renderHook(() => usePluginActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fmtWhen(ROW.ts)).toBe(new Date(ROW.ts).toLocaleString('en-US'));
    expect(result.current.fmtWhen('not a date')).toBe('not a date');
  });
});
