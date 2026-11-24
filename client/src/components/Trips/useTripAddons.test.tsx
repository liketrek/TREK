// FE-TRIPADDONS-HOOK-001 to FE-TRIPADDONS-HOOK-006: the trip addons of one trip for the
// planner and the trip settings: read, refreshed when the connection returns, switched
// by the owner online only.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TripAddon } from '@trek/shared';
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedInstanceAddons, seedStore } from '../../../tests/helpers/store';
import { clearAll } from '../../db/offlineDb';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAuthStore } from '../../store/authStore';
import { useTripAddons } from './useTripAddons';

const env = vi.hoisted(() => ({
  offline: false,
  modeListeners: [] as Array<() => void>,
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('../../sync/networkMode', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../sync/networkMode')>();
  return {
    ...actual,
    isEffectivelyOffline: () => env.offline,
    onNetworkModeChange: (fn: () => void) => {
      env.modeListeners.push(fn);
      return () => {
        env.modeListeners = env.modeListeners.filter((l) => l !== fn);
      };
    },
  };
});

vi.mock('../shared/Toast', () => ({ useToast: () => env.toast }));

const addon = (id: string, enabled: boolean, instanceEnabled: boolean): TripAddon => ({
  id,
  name: id,
  icon: null,
  enabled,
  instanceEnabled,
  overridden: enabled !== instanceEnabled,
});

function wrapper({ children }: { children: ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}

function tripHas(addons: TripAddon[]) {
  server.use(http.get('/api/trips/4/addons', () => HttpResponse.json({ tripId: 4, addons })));
}

beforeEach(async () => {
  await clearAll();
  resetAllStores();
  vi.clearAllMocks();
  env.offline = false;
  env.modeListeners = [];
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTripAddons', () => {
  it('FE-TRIPADDONS-HOOK-001: reads the trip’s list, and until then answers with the instance switches', async () => {
    seedInstanceAddons(['budget']);
    tripHas([addon('budget', false, true), addon('tours', true, false)]);

    const { result } = renderHook(() => useTripAddons(4), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.loaded).toBe(false);
    expect(result.current.isEnabled('budget')).toBe(true);

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.addons.map((a) => a.id)).toEqual(['budget', 'tours']);
    expect(result.current.isEnabled('budget')).toBe(false);
    expect(result.current.isEnabled('tours')).toBe(true);
    // Not a trip addon: the instance decides.
    expect(result.current.isEnabled('dawarich')).toBe(false);
  });

  it('FE-TRIPADDONS-HOOK-002: reads again when the connection comes back, and no trip reads nothing', async () => {
    let asked = 0;
    server.use(
      http.get('/api/trips/4/addons', () => {
        asked++;
        return HttpResponse.json({ tripId: 4, addons: [addon('budget', asked > 1, true)] });
      })
    );
    const { result } = renderHook(() => useTripAddons(4), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isEnabled('budget')).toBe(false);

    expect(env.modeListeners).toHaveLength(1);
    act(() => env.modeListeners.forEach((listener) => listener()));

    await waitFor(() => expect(result.current.isEnabled('budget')).toBe(true));
    expect(asked).toBe(2);

    const none = renderHook(() => useTripAddons(null), { wrapper });
    expect(none.result.current).toMatchObject({ addons: [], loading: false, loaded: false });
  });

  it('FE-TRIPADDONS-HOOK-003: the owner switches an addon, and the trip follows the answer', async () => {
    let sent: unknown = null;
    server.use(
      http.put('/api/trips/4/addons/budget', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ tripId: 4, addons: [addon('budget', true, false)] });
      })
    );
    const { result } = renderHook(() => useTripAddons(4), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    let ok = false;
    await act(async () => {
      ok = await result.current.setOverride('budget', true);
    });

    expect(ok).toBe(true);
    expect(sent).toEqual({ enabled: true });
    expect(result.current.isEnabled('budget')).toBe(true);
    expect(env.toast.error).not.toHaveBeenCalled();
  });

  it('FE-TRIPADDONS-HOOK-004: offline the switch is refused with a word why, and nothing is sent', async () => {
    let sent = false;
    server.use(
      http.put('/api/trips/4/addons/:addonId', () => {
        sent = true;
        return HttpResponse.json({ tripId: 4, addons: [] });
      })
    );
    const { result } = renderHook(() => useTripAddons(4), { wrapper });
    env.offline = true;

    let ok = true;
    await act(async () => {
      ok = await result.current.setOverride('budget', false);
    });

    expect(ok).toBe(false);
    expect(sent).toBe(false);
    expect(env.toast.error).toHaveBeenCalledWith(expect.stringMatching(/connection/i));
  });

  it('FE-TRIPADDONS-HOOK-005: a refusal from the server is said in its own words', async () => {
    server.use(
      http.put('/api/trips/4/addons/budget', () =>
        HttpResponse.json({ error: 'Only the owner can change the addons of this trip' }, { status: 403 })
      )
    );
    const { result } = renderHook(() => useTripAddons(4), { wrapper });

    let ok = true;
    await act(async () => {
      ok = await result.current.setOverride('budget', null);
    });

    expect(ok).toBe(false);
    expect(env.toast.error).toHaveBeenCalledWith('Only the owner can change the addons of this trip');
  });

  it('FE-TRIPADDONS-HOOK-006: a failure without the server’s words falls back to the localized one', async () => {
    server.use(http.put('/api/trips/4/addons/budget', () => HttpResponse.json({}, { status: 500 })));
    const { result } = renderHook(() => useTripAddons(4), { wrapper });

    await act(async () => {
      await result.current.setOverride('budget', true);
    });

    expect(env.toast.error).toHaveBeenCalledWith('The addons of this trip could not be changed.');
  });
});
