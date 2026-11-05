/**
 * The community's pictures for a place: which ones the service publishes
 * (cover first, only paths of its own picture store) and their bytes, fetched
 * with the installation's key and capped.
 */
import { TrekCommunityService } from '../../../src/nest/maps/trek-community.service';
import { trekCommunityByKeys, trekPlacesById } from '../../../src/nest/maps/trek-places.client';
import { identifiedFetch } from '../../../src/nest/maps/trek-places.fetch';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/nest/maps/trek-places.client', () => ({
  trekCommunityByKeys: vi.fn(),
  trekPlacesById: vi.fn(),
  trekPlacesBaseUrl: () => 'https://places.example',
}));
vi.mock('../../../src/nest/maps/trek-places.fetch', () => ({ identifiedFetch: vi.fn() }));

const byKeys = vi.mocked(trekCommunityByKeys);
const byId = vi.mocked(trekPlacesById);
const fetchWithKey = vi.mocked(identifiedFetch);

const A = '/v1/contrib/img/aaaaaaaaaaaaaaaa.webp';
const B = '/v1/contrib/img/bbbbbbbbbbbbbbbb.webp';

beforeEach(() => {
  byKeys.mockReset();
  byId.mockReset();
  fetchWithKey.mockReset();
});

describe('TrekCommunityService.photoPaths', () => {
  it('TCOM-001: reads an OSM place from /v1/community, cover first', async () => {
    byKeys.mockResolvedValue({ 'osm:way/7': { images: [{ url: A }, { url: B, cover: true }] } });
    expect(await new TrekCommunityService().photoPaths('way:7')).toEqual([B, A]);
    expect(byKeys).toHaveBeenCalledWith(['osm:way/7']);
  });

  it('TCOM-002: reads an index place from its own row', async () => {
    byId.mockResolvedValue({ images: [{ url: A, cover: true }] } as never);
    expect(await new TrekCommunityService().photoPaths('gers:abc')).toEqual([A]);
    expect(byId).toHaveBeenCalledWith('abc');
  });

  it('TCOM-003: drops anything that is not a path of the picture store', async () => {
    byKeys.mockResolvedValue({
      'osm:node/1': {
        images: [{ url: 'https://evil.example/x.webp' }, { url: '/v1/contrib/img/../gate' }, { url: A }],
      },
    });
    expect(await new TrekCommunityService().photoPaths('node:1')).toEqual([A]);
  });

  it('TCOM-003b: takes an absolute URL on the configured service as its path, never another host', async () => {
    byKeys.mockResolvedValue({
      'osm:node/2': {
        images: [
          { url: `https://places.example${A}`, cover: true },
          { url: `https://other.example${B}` },
          { url: `https://places.example${B}?x=1` },
        ],
      },
    });
    expect(await new TrekCommunityService().photoPaths('node:2')).toEqual([A]);
  });

  it('TCOM-004: nothing for another kind of place, or when the service fails', async () => {
    expect(await new TrekCommunityService().photoPaths('ChIJgoogle')).toEqual([]);
    byId.mockRejectedValue(new Error('down'));
    expect(await new TrekCommunityService().photoPaths('gers:abc')).toEqual([]);
  });
});

describe('TrekCommunityService.imageBytes', () => {
  it('TCOM-005: fetches a store path with the key and returns the bytes', async () => {
    fetchWithKey.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    expect(await new TrekCommunityService().imageBytes(A)).toEqual(Buffer.from([1, 2, 3]));
    expect(String(fetchWithKey.mock.calls[0]?.[0])).toBe(`https://places.example${A}`);
  });

  it('TCOM-006: never fetches another path, and a failed or oversized answer is null', async () => {
    const svc = new TrekCommunityService();
    expect(await svc.imageBytes('/v1/place/abc')).toBeNull();
    expect(fetchWithKey).not.toHaveBeenCalled();
    fetchWithKey.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(await svc.imageBytes(A)).toBeNull();
    fetchWithKey.mockResolvedValueOnce(
      new Response(new Uint8Array([1]), { status: 200, headers: { 'content-length': '9000000' } }),
    );
    expect(await svc.imageBytes(A)).toBeNull();
    fetchWithKey.mockRejectedValueOnce(new Error('timeout'));
    expect(await svc.imageBytes(A)).toBeNull();
  });

  it('TCOM-007: an answer that declares no length stops being read at the cap', async () => {
    // An endless body in 1 MB chunks, without a content-length, as a chunked answer comes.
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(1_000_000));
      },
    });
    fetchWithKey.mockResolvedValueOnce(new Response(body, { status: 200 }));
    expect(await new TrekCommunityService().imageBytes(A)).toBeNull();
    expect(pulled).toBeLessThanOrEqual(6);
  });
});
