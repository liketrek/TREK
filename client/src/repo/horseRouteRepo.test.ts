// FE-REPO-HORSE-001 to FE-REPO-HORSE-003: the online-only read behind a ride's horse routes.
import { HORSE_ROUTES_ATTRIBUTION } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { horseRoutesApi } from '../api/horseRoutes';
import { isEffectivelyOffline } from '../sync/networkMode';
import { horseRouteRepo } from './horseRouteRepo';
import { OnlineOnlyError } from './onlineOnly';

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/horseRoutes', () => ({ horseRoutesApi: { list: vi.fn() } }));

const BBOX = '47.10000,11.20000,47.30000,11.50000';
const reply = {
  routes: [
    {
      id: 'relation/42',
      name: 'Reitweg',
      ref: null,
      osmUrl: 'https://www.openstreetmap.org/relation/42',
      continues: false,
      sections: [
        {
          number: 1,
          geometry: [
            [47.15, 11.25],
            [47.16, 11.25],
          ],
          length_m: 1112,
          access: [{ value: 'designated', length_m: 1112 }],
          signposted: null,
        },
      ],
    },
  ],
  truncated: false,
  source: 'openstreetmap',
  attribution: HORSE_ROUTES_ATTRIBUTION,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  vi.mocked(horseRoutesApi.list).mockResolvedValue(reply);
});

describe('horseRouteRepo.list', () => {
  it('FE-REPO-HORSE-001: asks the api for the trip and view with the signal and returns the parsed answer', async () => {
    const signal = new AbortController().signal;
    await expect(horseRouteRepo.list(7, BBOX, signal)).resolves.toEqual(reply);
    expect(horseRoutesApi.list).toHaveBeenCalledWith(7, BBOX, signal);
  });

  it('FE-REPO-HORSE-002: offline it refuses without making the request', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    await expect(horseRouteRepo.list(7, BBOX, new AbortController().signal)).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(horseRoutesApi.list).not.toHaveBeenCalled();
  });

  it('FE-REPO-HORSE-003: an answer off the contract is refused, never shown or taken onto a ride', async () => {
    vi.mocked(horseRoutesApi.list).mockResolvedValue({ ...reply, routes: [{ ...reply.routes[0], id: 'way/42' }] });
    await expect(horseRouteRepo.list(7, BBOX, new AbortController().signal)).rejects.toThrow();
  });
});
