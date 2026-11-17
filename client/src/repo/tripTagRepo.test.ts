// FE-REPO-TRIPTAG-001 to FE-REPO-TRIPTAG-007: the tags a trip owns, read through to the
// server and kept on this device, read from there without a connection, and added
// online only.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTag } from '../../tests/helpers/factories';
import { clearAll, clearTripData, offlineDb } from '../db/offlineDb';
import { isEffectivelyOffline } from '../sync/networkMode';
import { OnlineOnlyError } from './onlineOnly';
import { tripTagRepo } from './tripTagRepo';

const { client } = vi.hoisted(() => ({ client: { get: vi.fn(), post: vi.fn() } }));

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/client', () => ({ default: client, apiClient: client }));

const monument = buildTag({ id: 7, trip_id: 4, name: 'Monument' });
const zone = buildTag({ id: 8, trip_id: 4, name: 'Zone' });
/** An axios failure that never reached the server. */
const networkError = () => Object.assign(new Error('Network Error'), { isAxiosError: true });

beforeEach(async () => {
  await clearAll();
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
});

describe('tripTagRepo', () => {
  it('FE-REPO-TRIPTAG-001: reads the tags of the trip and keeps them on this device', async () => {
    client.get.mockResolvedValue({ data: { tags: [monument, zone] } });

    expect(await tripTagRepo.list('4')).toEqual({ tags: [monument, zone] });

    expect(client.get).toHaveBeenCalledWith('/trips/4/tags');
    expect((await offlineDb.tripTags.get(4))?.tags).toEqual([monument, zone]);
  });

  it('FE-REPO-TRIPTAG-002: without a connection answers what the device last read, and nothing for a trip it never read', async () => {
    await offlineDb.tripTags.put({ tripId: 4, tags: [monument] });
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);

    expect(await tripTagRepo.list(4)).toEqual({ tags: [monument] });
    expect(await tripTagRepo.list(5)).toEqual({ tags: [] });
    expect(client.get).not.toHaveBeenCalled();
  });

  it('FE-REPO-TRIPTAG-003: a request that never reached the server falls back to the device, a refusal does not', async () => {
    await offlineDb.tripTags.put({ tripId: 4, tags: [zone] });
    client.get.mockRejectedValueOnce(networkError());
    expect(await tripTagRepo.list(4)).toEqual({ tags: [zone] });

    const refused = Object.assign(new Error('Forbidden'), { isAxiosError: true, response: { status: 403 } });
    client.get.mockRejectedValueOnce(refused);
    await expect(tripTagRepo.list(4)).rejects.toBe(refused);
  });

  it('FE-REPO-TRIPTAG-004: a new tag is sent to the trip and joins the list on this device, by name', async () => {
    await offlineDb.tripTags.put({ tripId: 4, tags: [zone] });
    client.post.mockResolvedValue({ data: { tag: monument } });

    expect(await tripTagRepo.create(4, { name: 'Monument', color: '#6366f1' })).toEqual(monument);

    expect(client.post).toHaveBeenCalledWith('/trips/4/tags', { name: 'Monument', color: '#6366f1' });
    expect((await offlineDb.tripTags.get(4))?.tags.map((tag) => tag.name)).toEqual(['Monument', 'Zone']);
  });

  it('FE-REPO-TRIPTAG-005: the tag the trip has already under that name is not kept twice', async () => {
    await offlineDb.tripTags.put({ tripId: 4, tags: [monument, zone] });
    client.post.mockResolvedValue({ data: { tag: zone } });

    await tripTagRepo.create(4, { name: 'zone' });

    expect((await offlineDb.tripTags.get(4))?.tags.map((tag) => tag.id)).toEqual([7, 8]);
  });

  it('FE-REPO-TRIPTAG-006: adding a tag needs a connection, and says so before anything is sent', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);

    await expect(tripTagRepo.create(4, { name: 'Monument' })).rejects.toBeInstanceOf(OnlineOnlyError);

    expect(client.post).not.toHaveBeenCalled();
    expect(await offlineDb.tripTags.get(4)).toBeUndefined();
  });

  it('FE-REPO-TRIPTAG-007: the tags kept for a trip go with it, and another trip keeps its own', async () => {
    await offlineDb.tripTags.bulkPut([
      { tripId: 4, tags: [monument] },
      { tripId: 5, tags: [zone] },
    ]);

    await clearTripData(4);

    expect(await offlineDb.tripTags.get(4)).toBeUndefined();
    expect((await offlineDb.tripTags.get(5))?.tags).toEqual([zone]);
  });
});
