// FE-PLACE-PICTURE-REPO-001 to FE-PLACE-PICTURE-REPO-002: the pictures a place can be given,
// asked of the maps route and the attached files behind the repository.
import type { MapsPlaceEnrichmentResult } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchImageAsBlob } from '../api/authUrl';
import { mapsApi } from '../api/client';
import { placePictureRepo } from './placePictureRepo';

vi.mock('../api/client', () => ({ mapsApi: { placeEnrichment: vi.fn() } }));
vi.mock('../api/authUrl', () => ({ fetchImageAsBlob: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('place pictures', () => {
  it('FE-PLACE-PICTURE-REPO-001: asks the maps route for the enrichment with the query and the signal', async () => {
    const answer = { photos: [] } as unknown as MapsPlaceEnrichmentResult;
    vi.mocked(mapsApi.placeEnrichment).mockResolvedValue(answer);
    const signal = new AbortController().signal;
    const query = { placeId: 'way:2', lat: 48.1, lng: 11.5, name: 'Rathaus', lang: 'de' };

    await expect(placePictureRepo.enrichment(query, signal)).resolves.toBe(answer);
    expect(mapsApi.placeEnrichment).toHaveBeenCalledWith(query, signal);
  });

  it('FE-PLACE-PICTURE-REPO-002: reads an attached image as an object URL', async () => {
    vi.mocked(fetchImageAsBlob).mockResolvedValue('blob:attached');

    await expect(placePictureRepo.attachedImage('/api/files/41')).resolves.toBe('blob:attached');
    expect(fetchImageAsBlob).toHaveBeenCalledWith('/api/files/41');
  });
});
