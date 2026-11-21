// FE-REPO-TRIPADDONS-001 to FE-REPO-TRIPADDONS-006: the trip addons of one trip, read
// through to the server and kept on this device, read from there without a connection,
// and switched online only.
import type { TripAddon } from '@trek/shared';
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, clearTripData, offlineDb } from '../db/offlineDb';
import { isEffectivelyOffline } from '../sync/networkMode';
import { OnlineOnlyError } from './onlineOnly';
import { cachedTripAddons, tripAddonsRepo } from './tripAddonsRepo';

const { client } = vi.hoisted(() => ({ client: { get: vi.fn(), put: vi.fn() } }));

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/client', () => ({ default: client, apiClient: client }));

const costs = (enabled: boolean): TripAddon => ({
  id: 'budget',
  name: 'Costs',
  icon: 'Wallet',
  enabled,
  instanceEnabled: true,
  overridden: !enabled,
});
/** An axios failure that never reached the server. */
const networkError = () => Object.assign(new Error('Network Error'), { isAxiosError: true });

beforeEach(async () => {
  await clearAll();
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
});

describe('tripAddonsRepo', () => {
  it('FE-REPO-TRIPADDONS-001: reads the addons of the trip and keeps them on this device', async () => {
    client.get.mockResolvedValue({ data: { tripId: 4, addons: [costs(false)] } });

    expect(await tripAddonsRepo.list(4)).toEqual([costs(false)]);

    expect(client.get).toHaveBeenCalledWith('/trips/4/addons');
    expect(await cachedTripAddons(4)).toEqual([costs(false)]);
  });

  it('FE-REPO-TRIPADDONS-002: without a connection answers what the device last read, and refuses a trip it never read', async () => {
    await offlineDb.tripAddons.put({ tripId: 4, addons: [costs(true)] });
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);

    expect(await tripAddonsRepo.list(4)).toEqual([costs(true)]);
    await expect(tripAddonsRepo.list(5)).rejects.toThrow('not available offline');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('FE-REPO-TRIPADDONS-003: a request that never reached the server falls back to the device, a refusal does not', async () => {
    await offlineDb.tripAddons.put({ tripId: 4, addons: [costs(true)] });
    client.get.mockRejectedValueOnce(networkError());
    expect(await tripAddonsRepo.list(4)).toEqual([costs(true)]);

    const refused = Object.assign(new Error('Not found'), { isAxiosError: true, response: { status: 404 } });
    client.get.mockRejectedValueOnce(refused);
    await expect(tripAddonsRepo.list(4)).rejects.toBe(refused);
  });

  it('FE-REPO-TRIPADDONS-004: an answer the contract does not describe is refused and nothing is kept', async () => {
    client.get.mockResolvedValue({ data: { tripId: 4, addons: [{ id: 'budget' }] } });

    await expect(tripAddonsRepo.list(4)).rejects.toThrow();
    expect(await cachedTripAddons(4)).toBeNull();
  });

  it('FE-REPO-TRIPADDONS-005: the owner switches an addon online, and the answer is kept; offline nothing is sent', async () => {
    client.put.mockResolvedValue({ data: { tripId: 4, addons: [costs(false)] } });

    expect(await tripAddonsRepo.setOverride(4, 'budget', false)).toEqual([costs(false)]);
    expect(client.put).toHaveBeenCalledWith('/trips/4/addons/budget', { enabled: false });
    expect(await cachedTripAddons(4)).toEqual([costs(false)]);

    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    await expect(tripAddonsRepo.setOverride(4, 'budget', null)).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(client.put).toHaveBeenCalledTimes(1);
  });

  it('FE-REPO-TRIPADDONS-006: a pushed list is kept, and the trip leaving the cache takes it along', async () => {
    await tripAddonsRepo.remember(4, [costs(true)]);
    expect(await cachedTripAddons(4)).toEqual([costs(true)]);

    await clearTripData(4);
    expect(await cachedTripAddons(4)).toBeNull();
  });
});
