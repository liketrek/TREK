// FE-TP-TRIPVIEW-001 to FE-TP-TRIPVIEW-006
//
// The planner's view switches the account remembers per trip (#2639): road trip
// mode, the Dawarich trail and the route overview. The tab keeps a copy that
// answers before the settings arrive.
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { buildSettings } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import { usePlannerTripView } from './usePlannerTripView';

function captureSettingWrites() {
  const writes: Array<{ key: string; value: unknown }> = [];
  server.use(
    http.put('/api/settings', async ({ request }) => {
      const body = (await request.json()) as { key: string; value: unknown };
      writes.push(body);
      return HttpResponse.json({ success: true, key: body.key, value: body.value });
    })
  );
  return writes;
}

beforeEach(() => {
  resetAllStores();
});

describe('usePlannerTripView', () => {
  it('FE-TP-TRIPVIEW-001: a fresh browser opens the trip with the switches the account has on', () => {
    seedStore(useSettingsStore, {
      settings: buildSettings({ planner_trip_views: { '42': { roadtrip: true } } }),
      isLoaded: true,
    });
    expect(renderHook(() => usePlannerTripView(42, 'roadtrip')).result.current[0]).toBe(true);
    expect(renderHook(() => usePlannerTripView(42, 'dawarich')).result.current[0]).toBe(false);
    expect(renderHook(() => usePlannerTripView(43, 'roadtrip')).result.current[0]).toBe(false);
  });

  it('FE-TP-TRIPVIEW-002: the tab copy answers until the settings are here, then the account decides', () => {
    sessionStorage.setItem('trip-roadtrip-42', '1');
    const { result } = renderHook(() => usePlannerTripView(42, 'roadtrip'));
    expect(result.current[0]).toBe(true);

    // Switched off on another device since this tab last looked.
    act(() => {
      seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });
    });
    expect(result.current[0]).toBe(false);
  });

  it('FE-TP-TRIPVIEW-003: a switch is saved on the account next to the other trips, and only what is on', async () => {
    const writes = captureSettingWrites();
    seedStore(useSettingsStore, {
      settings: buildSettings({ planner_trip_views: { '7': { overview: true }, '42': { dawarich: true } } }),
      isLoaded: true,
    });
    const { result } = renderHook(() => usePlannerTripView(42, 'roadtrip'));

    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);
    expect(sessionStorage.getItem('trip-roadtrip-42')).toBe('1');
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toEqual({
      key: 'planner_trip_views',
      value: { '7': { overview: true }, '42': { dawarich: true, roadtrip: true } },
    });

    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(false);
    await waitFor(() => expect(writes).toHaveLength(2));
    expect(writes[1].value).toEqual({ '7': { overview: true }, '42': { dawarich: true } });
  });

  it('FE-TP-TRIPVIEW-004: a switch made before the settings arrived waits for them instead of erasing other trips', async () => {
    const writes = captureSettingWrites();
    server.use(
      http.get('/api/settings', () =>
        HttpResponse.json({
          settings: buildSettings({ planner_trip_views: { '7': { overview: true } } }),
        })
      )
    );
    const { result } = renderHook(() => usePlannerTripView(42, 'dawarich'));

    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0].value).toEqual({ '7': { overview: true }, '42': { dawarich: true } });
    expect(result.current[0]).toBe(true);
  });

  it('FE-TP-TRIPVIEW-005: a save that fails keeps the switch for the session', async () => {
    let tried = false;
    server.use(
      http.put('/api/settings', () => {
        tried = true;
        return HttpResponse.json({ error: 'nope' }, { status: 500 });
      })
    );
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });
    const { result } = renderHook(() => usePlannerTripView(42, 'overview'));

    act(() => {
      result.current[1]();
    });
    await waitFor(() => expect(tried).toBe(true));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current[0]).toBe(true);
    expect(sessionStorage.getItem('trip-overview-42')).toBe('1');
  });

  it('FE-TP-TRIPVIEW-006: settings that cannot be loaded leave the tab copy in charge and write nothing', async () => {
    const writes = captureSettingWrites();
    server.use(http.get('/api/settings', () => HttpResponse.json({ error: 'offline' }, { status: 503 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => usePlannerTripView(42, 'roadtrip'));

    act(() => {
      result.current[1]();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(result.current[0]).toBe(true);
    expect(writes).toHaveLength(0);
  });
});
