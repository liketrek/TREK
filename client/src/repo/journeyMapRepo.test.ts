import { beforeEach, describe, expect, it, vi } from 'vitest';
import { journeyMapApi } from '../api/journeyMap';
import { journeyMapRepo } from './journeyMapRepo';
import { OnlineOnlyError } from './onlineOnly';

// FE-REPO-JOURNEY-MAP-001 to FE-REPO-JOURNEY-MAP-003

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: () => network.offline }));

const OK = { status: 'ok' as const, items: [] };
const WITHHELD = { status: 'withheld' as const };

beforeEach(() => {
  network.offline = false;
  vi.restoreAllMocks();
});

describe('journeyMapRepo', () => {
  it('FE-REPO-JOURNEY-MAP-001: asks nothing offline', async () => {
    network.offline = true;
    const layers = vi.spyOn(journeyMapApi, 'layers');
    await expect(journeyMapRepo.layers(7)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(journeyMapRepo.publicLayers('tok')).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(layers).not.toHaveBeenCalled();
  });

  it('FE-REPO-JOURNEY-MAP-002: answers what the contract describes, for the journey and for a link', async () => {
    vi.spyOn(journeyMapApi, 'layers').mockResolvedValue({ places: OK, routes: { status: 'unavailable' }, stays: OK });
    vi.spyOn(journeyMapApi, 'publicLayers').mockResolvedValue({
      places: WITHHELD,
      routes: WITHHELD,
      stays: OK,
      recordings: WITHHELD,
    });
    expect((await journeyMapRepo.layers(7)).routes).toEqual({ status: 'unavailable' });
    expect((await journeyMapRepo.publicLayers('tok')).recordings).toEqual(WITHHELD);
  });

  it('FE-REPO-JOURNEY-MAP-003: refuses an answer the contract does not describe', async () => {
    vi.spyOn(journeyMapApi, 'layers').mockResolvedValue({ places: { status: 'partial' } } as never);
    await expect(journeyMapRepo.layers(7)).rejects.toThrow();
  });
});
