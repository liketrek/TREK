import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../api/client';
import { tourWalkImportApi } from '../api/tourWalkImport';
import { OnlineOnlyError } from './onlineOnly';
import { tourWalkImportRepo, walkImportRefusalOf } from './tourWalkImportRepo';

// FE-REPO-WALK-IMPORT-001 to FE-REPO-WALK-IMPORT-003

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: () => network.offline }));

const answer = {
  stations: [
    { name: 'Cathedral', lat: 48.1, lng: 11.5 },
    { name: 'Market', lat: null, lng: null },
  ],
  resolved_url: 'https://www.google.com/maps/dir/Cathedral/Market/data=!3e2',
};

beforeEach(() => {
  network.offline = false;
  vi.restoreAllMocks();
});

describe('tourWalkImportRepo', () => {
  it('FE-REPO-WALK-IMPORT-001: reads only online, and offline asks nothing', async () => {
    network.offline = true;
    const post = vi.spyOn(apiClient, 'post');
    await expect(tourWalkImportRepo.preview(5, 'https://maps.app.goo.gl/abc')).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(post).not.toHaveBeenCalled();
  });

  it('FE-REPO-WALK-IMPORT-002: posts the link to the trip’s preview and reads the answer through the contract', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: answer });
    const controller = new AbortController();
    expect(await tourWalkImportRepo.preview(5, 'https://maps.app.goo.gl/abc', controller.signal)).toEqual(answer);
    expect(post).toHaveBeenCalledWith(
      '/trips/5/tours/import/google-maps/preview',
      { url: 'https://maps.app.goo.gl/abc' },
      { signal: controller.signal, timeout: 20_000 }
    );
    // An answer the contract does not describe is a failure, not a preview.
    vi.spyOn(tourWalkImportApi, 'preview').mockResolvedValue({ ...answer, stations: [] });
    await expect(tourWalkImportRepo.preview(5, 'https://maps.app.goo.gl/abc')).rejects.toThrow();
  });

  it('FE-REPO-WALK-IMPORT-003: names the reason of a refusal, and nothing for any other failure', () => {
    const refusal = (data: unknown) => ({ response: { status: 400, data } });
    expect(walkImportRefusalOf(refusal({ error: 'Not on foot.', reason: 'not_walking' }))).toBe('not_walking');
    expect(walkImportRefusalOf(refusal({ error: 'Odd.', reason: 'teleport' }))).toBeNull();
    expect(walkImportRefusalOf(refusal({ error: 'Tours addon is not enabled' }))).toBeNull();
    expect(walkImportRefusalOf(new Error('Network Error'))).toBeNull();
    expect(walkImportRefusalOf(null)).toBeNull();
  });
});
