// FE-COMP-TZHOOK-001 to -007: the world clocks both dashboards share.
import { act, renderHook, waitFor } from '@testing-library/react';

import { useSettingsStore } from '../../store/settingsStore';
import { shortZone, useDashboardTimezones } from './useDashboardTimezones';

const updateSetting = vi.fn<(key: string, value: unknown) => Promise<void>>();
const home = Intl.DateTimeFormat().resolvedOptions().timeZone;

function seedSettings(zones: string[] | undefined, isLoaded = false) {
  useSettingsStore.setState((s) => ({
    isLoaded,
    updateSetting: updateSetting as unknown as typeof s.updateSetting,
    settings: { ...s.settings, dashboard_timezones: zones } as typeof s.settings,
  }));
}

beforeEach(() => {
  updateSetting.mockReset().mockResolvedValue(undefined);
  localStorage.clear();
  seedSettings(undefined);
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('shortZone', () => {
  it('FE-COMP-TZHOOK-001: keeps the city and spaces out underscores', () => {
    expect(shortZone('America/New_York')).toBe('New York');
    expect(shortZone('UTC')).toBe('UTC');
  });
});

describe('useDashboardTimezones', () => {
  it('FE-COMP-TZHOOK-002: an unset list falls back to home plus the defaults, a stored one is honoured', () => {
    const fallback = renderHook(() => useDashboardTimezones('en'));
    expect(fallback.result.current.zones).toEqual([home, 'Europe/London', 'Asia/Tokyo']);

    seedSettings([]);
    const empty = renderHook(() => useDashboardTimezones('en'));
    expect(empty.result.current.zones).toEqual([]);
  });

  it('FE-COMP-TZHOOK-003: adding a new zone writes the list and closes the picker, a known one only closes it', () => {
    seedSettings(['UTC']);
    const { result } = renderHook(() => useDashboardTimezones('en'));
    act(() => result.current.setAdding(true));
    act(() => result.current.addZone('Asia/Tokyo'));
    expect(updateSetting).toHaveBeenCalledWith('dashboard_timezones', ['UTC', 'Asia/Tokyo']);
    expect(result.current.adding).toBe(false);

    updateSetting.mockClear();
    act(() => result.current.setAdding(true));
    act(() => result.current.addZone('UTC'));
    expect(updateSetting).not.toHaveBeenCalled();
    expect(result.current.adding).toBe(false);
  });

  it('FE-COMP-TZHOOK-004: removing drops the zone from the stored list', () => {
    seedSettings(['UTC', 'Asia/Tokyo']);
    const { result } = renderHook(() => useDashboardTimezones('en'));
    act(() => result.current.removeZone('UTC'));
    expect(updateSetting).toHaveBeenCalledWith('dashboard_timezones', ['Asia/Tokyo']);
  });

  it('FE-COMP-TZHOOK-005: the clocks read the zone time and tick every 30 seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    seedSettings(['UTC']);
    const { result } = renderHook(() => useDashboardTimezones('en-GB'));
    expect(result.current.timeIn('UTC')).toBe('12:00');
    expect(result.current.timeIn('Asia/Tokyo')).toBe('21:00');
    expect(result.current.offsetLabel('UTC')).toBe('UTC');
    act(() => vi.advanceTimersByTime(30000));
    expect(result.current.timeIn('UTC')).toBe('12:00');
    act(() => vi.advanceTimersByTime(30000));
    expect(result.current.timeIn('UTC')).toBe('12:01');
  });

  it('FE-COMP-TZHOOK-006: once settings are loaded, an old localStorage list moves into them', async () => {
    localStorage.setItem('trek_dashboard_tz', JSON.stringify(['Europe/Paris']));
    seedSettings(undefined, true);
    renderHook(() => useDashboardTimezones('en'));
    expect(updateSetting).toHaveBeenCalledWith('dashboard_timezones', ['Europe/Paris']);
    await waitFor(() => expect(localStorage.getItem('trek_dashboard_tz')).toBeNull());
  });

  it('FE-COMP-TZHOOK-007: a malformed localStorage value is dropped without a write', () => {
    localStorage.setItem('trek_dashboard_tz', '{not json');
    seedSettings(undefined, true);
    renderHook(() => useDashboardTimezones('en'));
    expect(localStorage.getItem('trek_dashboard_tz')).toBeNull();

    localStorage.setItem('trek_dashboard_tz', JSON.stringify({ zone: 'UTC' }));
    renderHook(() => useDashboardTimezones('en'));
    expect(localStorage.getItem('trek_dashboard_tz')).toBeNull();
    expect(updateSetting).not.toHaveBeenCalled();
  });
});
