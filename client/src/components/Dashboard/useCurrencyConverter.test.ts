// FE-COMP-FXHOOK-001 to -008: the currency converter both dashboards share.
import { act, renderHook, waitFor } from '@testing-library/react';

import { useSettingsStore } from '../../store/settingsStore';
import { CURRENCIES } from '../Budget/BudgetPanel.constants';
import { useCurrencyConverter } from './useCurrencyConverter';

const RATES = [
  { quote: 'USD', rate: 1.1 },
  { quote: 'CHF', rate: 0.95 },
];

const updateSetting = vi.fn<(key: string, value: unknown) => Promise<void>>();
let fetchMock: ReturnType<typeof vi.fn>;

function seedSettings(over: Record<string, unknown> = {}, isLoaded = false) {
  useSettingsStore.setState((s) => ({
    isLoaded,
    updateSetting: updateSetting as unknown as typeof s.updateSetting,
    settings: { ...s.settings, dashboard_fx_from: undefined, dashboard_fx_to: undefined, ...over } as typeof s.settings,
  }));
}

function respond(body: unknown) {
  return Promise.resolve({ json: () => Promise.resolve(body) } as Response);
}

beforeEach(() => {
  updateSetting.mockReset().mockResolvedValue(undefined);
  fetchMock = vi.fn(() => respond(RATES));
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
  seedSettings();
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('useCurrencyConverter', () => {
  it('FE-COMP-FXHOOK-001: defaults to EUR to USD and converts the amount with the fetched rate', async () => {
    const { result } = renderHook(() => useCurrencyConverter());
    expect(result.current.from).toBe('EUR');
    expect(result.current.to).toBe('USD');
    expect(result.current.currencies).toBe(CURRENCIES);
    await waitFor(() => expect(result.current.rate).toBe(1.1));
    expect(result.current.converted).toBeCloseTo(110);
    expect(result.current.currencies).toEqual(['CHF', 'EUR', 'USD']);
    act(() => result.current.setAmount('2,5'));
    expect(result.current.converted).toBeCloseTo(2.75);
  });

  it('FE-COMP-FXHOOK-002: both dashboards fetch the rates with an abort signal', async () => {
    renderHook(() => useCurrencyConverter());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]).toEqual([
      'https://api.frankfurter.dev/v2/rates?base=EUR',
      { signal: expect.any(AbortSignal) },
    ]);
  });

  it('FE-COMP-FXHOOK-003: it aborts the request on unmount and on a refetch', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const { result, unmount } = renderHook(() => useCurrencyConverter());
    const first = (fetchMock.mock.calls[0][1] as { signal: AbortSignal }).signal;
    act(() => result.current.fetchRates());
    expect(first.aborted).toBe(true);
    const second = (fetchMock.mock.calls[1][1] as { signal: AbortSignal }).signal;
    unmount();
    expect(second.aborted).toBe(true);
  });

  it('FE-COMP-FXHOOK-004: a failed or malformed answer leaves no rate', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const failed = renderHook(() => useCurrencyConverter());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(failed.result.current.rate).toBeNull();
    expect(failed.result.current.converted).toBeNull();

    fetchMock.mockImplementationOnce(() => respond({ error: 'nope' }));
    const malformed = renderHook(() => useCurrencyConverter());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(malformed.result.current.rate).toBeNull();
  });

  it('FE-COMP-FXHOOK-005: picking and swapping write the pair to the settings', () => {
    seedSettings({ dashboard_fx_from: 'GBP', dashboard_fx_to: 'JPY' });
    const { result } = renderHook(() => useCurrencyConverter());
    act(() => result.current.swap());
    expect(updateSetting).toHaveBeenCalledWith('dashboard_fx_from', 'JPY');
    expect(updateSetting).toHaveBeenCalledWith('dashboard_fx_to', 'GBP');
    act(() => result.current.setFrom('CHF'));
    expect(updateSetting).toHaveBeenLastCalledWith('dashboard_fx_from', 'CHF');
  });

  it('FE-COMP-FXHOOK-006: once settings are loaded, the old localStorage pair moves into them', async () => {
    localStorage.setItem('trek_fx_from', 'CAD');
    localStorage.setItem('trek_fx_to', 'AUD');
    seedSettings({}, true);
    renderHook(() => useCurrencyConverter());
    expect(updateSetting).toHaveBeenCalledWith('dashboard_fx_from', 'CAD');
    expect(updateSetting).toHaveBeenCalledWith('dashboard_fx_to', 'AUD');
    await waitFor(() => expect(localStorage.getItem('trek_fx_from')).toBeNull());
    expect(localStorage.getItem('trek_fx_to')).toBeNull();
  });

  it('FE-COMP-FXHOOK-007: a failed migration keeps the localStorage pair for the next load', async () => {
    localStorage.setItem('trek_fx_from', 'CAD');
    updateSetting.mockRejectedValue(new Error('down'));
    seedSettings({}, true);
    renderHook(() => useCurrencyConverter());
    await waitFor(() => expect(updateSetting).toHaveBeenCalled());
    await Promise.resolve();
    expect(localStorage.getItem('trek_fx_from')).toBe('CAD');
  });

  it('FE-COMP-FXHOOK-008: a late answer for the previous from currency never overwrites the newer one', async () => {
    let resolveEur: (body: unknown) => void = () => {};
    fetchMock.mockImplementation((url: string) =>
      url.endsWith('base=EUR')
        ? new Promise((resolve) => {
            resolveEur = (body) => resolve({ json: () => Promise.resolve(body) } as Response);
          })
        : respond([{ quote: 'USD', rate: 1.3 }])
    );
    const { result } = renderHook(() => useCurrencyConverter());
    act(() => seedSettings({ dashboard_fx_from: 'GBP' }));
    await waitFor(() => expect(result.current.rate).toBe(1.3));
    await act(async () => {
      resolveEur([{ quote: 'USD', rate: 1.1 }]);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.rate).toBe(1.3);
  });
});
