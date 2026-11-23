// FE-STORE-TRIPADDONS-001 to FE-STORE-TRIPADDONS-009: the trip addons per trip, read,
// pushed and switched, and the readers that fall back to the instance switches.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TripAddon } from '@trek/shared';
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUser } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import { resetAllStores, seedInstanceAddons, seedStore } from '../../tests/helpers/store';
import { addListener, removeListener } from '../api/websocket';
import { clearAll } from '../db/offlineDb';
import { cachedTripAddons } from '../repo/tripAddonsRepo';
import { useAuthStore } from './authStore';
import {
  tripAddonEnabledNow,
  tripAddonsEntry,
  useTripAddonEnabled,
  useTripAddonsStore,
  watchTripAddons,
} from './tripAddonsStore';

const addon = (id: string, enabled: boolean, instanceEnabled = !enabled): TripAddon => ({
  id,
  name: id,
  icon: null,
  enabled,
  instanceEnabled,
  overridden: enabled !== instanceEnabled,
});

const entry = (tripId: number) => tripAddonsEntry(useTripAddonsStore.getState(), tripId);

function tripHas(tripId: number, addons: TripAddon[]) {
  server.use(http.get(`/api/trips/${tripId}/addons`, () => HttpResponse.json({ tripId, addons })));
}

beforeEach(async () => {
  await clearAll();
  resetAllStores();
  vi.mocked(addListener).mockClear();
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tripAddonsStore', () => {
  it('FE-STORE-TRIPADDONS-001: reads the trip’s list for the signed-in account', async () => {
    tripHas(4, [addon('budget', false)]);

    await useTripAddonsStore.getState().load(4);

    expect(entry(4)).toMatchObject({ status: 'ready', addons: [addon('budget', false)] });
    expect(useTripAddonsStore.getState().trips['1:4']).toBeDefined();
    // Another account on the same tab does not see it.
    seedStore(useAuthStore, { user: buildUser({ id: 2 }) });
    expect(entry(4)).toBeUndefined();
  });

  it('FE-STORE-TRIPADDONS-002: a read that fails keeps what was held and says so; an invalid id reads nothing', async () => {
    tripHas(4, [addon('tours', true)]);
    await useTripAddonsStore.getState().load(4);
    server.use(http.get('/api/trips/4/addons', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));

    await useTripAddonsStore.getState().load(4);

    expect(entry(4)).toMatchObject({ status: 'failed', addons: [addon('tours', true)] });
    await useTripAddonsStore.getState().load(0);
    await useTripAddonsStore.getState().load(Number.NaN);
    expect(Object.keys(useTripAddonsStore.getState().trips)).toEqual(['1:4']);
  });

  it('FE-STORE-TRIPADDONS-003: one read per trip at a time, and a push during it outlives its older answer', async () => {
    let release: () => void = () => {};
    let asked = 0;
    server.use(
      http.get('/api/trips/4/addons', async () => {
        asked++;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ tripId: 4, addons: [addon('budget', true, true)] });
      })
    );

    const first = useTripAddonsStore.getState().load(4);
    const second = useTripAddonsStore.getState().load(4);
    await waitFor(() => expect(asked).toBe(1));
    useTripAddonsStore.getState().publish(4, [addon('budget', false, true)]);
    release();
    expect(await first).toEqual([addon('budget', false, true)]);
    expect(await second).toEqual([addon('budget', false, true)]);

    expect(asked).toBe(1);
    expect(entry(4)).toMatchObject({ status: 'ready', addons: [addon('budget', false, true)] });
  });

  it('FE-STORE-TRIPADDONS-009: a second caller during a read gets that read’s answer, not the list held before', async () => {
    tripHas(4, [addon('tours', false, false)]);
    await useTripAddonsStore.getState().load(4);
    let release: () => void = () => {};
    let asked = 0;
    server.use(
      http.get('/api/trips/4/addons', async () => {
        asked++;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ tripId: 4, addons: [addon('tours', true, false)] });
      })
    );

    const first = useTripAddonsStore.getState().load(4);
    const second = useTripAddonsStore.getState().load(4);
    await waitFor(() => expect(asked).toBe(1));
    release();

    expect(await second).toEqual([addon('tours', true, false)]);
    expect(await first).toEqual([addon('tours', true, false)]);
  });

  it('FE-STORE-TRIPADDONS-004: the owner’s switch puts the server’s answer in place', async () => {
    const addons = await useTripAddonsStore.getState().setOverride(4, 'collab', false);

    expect(addons[0]).toMatchObject({ id: 'collab', enabled: false, overridden: true });
    expect(entry(4)?.addons).toEqual(addons);
  });

  it('FE-STORE-TRIPADDONS-005: a push for a trip goes into the store and the device’s copy; anything malformed is dropped', async () => {
    const stop = watchTripAddons();
    const listener = vi.mocked(addListener).mock.calls[0][0] as (event: Record<string, unknown>) => void;

    listener({ type: 'tripAddons:changed', tripId: 4, addons: [addon('tours', true)] });
    listener({ type: 'tripAddons:changed', tripId: 'x', addons: [addon('tours', false)] });
    listener({ type: 'tripAddons:changed', tripId: 5, addons: [{ id: 'tours' }] });
    listener({ type: 'roadtripPreferences:changed', tripId: 6, addons: [] });

    expect(entry(4)?.addons).toEqual([addon('tours', true)]);
    expect(entry(5)).toBeUndefined();
    expect(entry(6)).toBeUndefined();
    await waitFor(async () => expect(await cachedTripAddons(4)).toEqual([addon('tours', true)]));

    stop();
    expect(vi.mocked(removeListener)).toHaveBeenCalledWith(listener);
  });

  it('FE-STORE-TRIPADDONS-006: read once outside React, the trip’s list first, then the instance, then the guess', () => {
    expect(tripAddonEnabledNow(4, 'packing', true)).toBe(true);
    expect(tripAddonEnabledNow(4, 'packing')).toBe(false);

    seedInstanceAddons(['packing']);
    expect(tripAddonEnabledNow(4, 'packing')).toBe(true);
    expect(tripAddonEnabledNow(null, 'packing')).toBe(true);

    useTripAddonsStore.getState().publish(4, [addon('packing', false, true)]);
    expect(tripAddonEnabledNow(4, 'packing', true)).toBe(false);
  });

  it('FE-STORE-TRIPADDONS-007: a trip view follows the trip’s list as it changes', () => {
    seedInstanceAddons(['budget']);
    const { result } = renderHook(() => useTripAddonEnabled(4, 'budget'));
    expect(result.current).toBe(true);

    act(() => useTripAddonsStore.getState().publish(4, [addon('budget', false, true)]));
    expect(result.current).toBe(false);

    act(() => useTripAddonsStore.getState().publish(4, [addon('budget', true, true)]));
    expect(result.current).toBe(true);
  });

  it('FE-STORE-TRIPADDONS-008: without a trip, the instance switch alone answers', () => {
    seedInstanceAddons(['tours']);
    const { result } = renderHook(() => useTripAddonEnabled(undefined, 'tours'));
    expect(result.current).toBe(true);
  });
});
