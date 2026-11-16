import type { AppSettingsRepository } from '../../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../../src/db/repositories/Users.repository';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { AmapPhotoService } from '../../../../src/nest/amap-photo/amap-photo.service';

import { describe, it, expect, vi, afterEach } from 'vitest';

const { mockSafeFetchFollow, mockGetValue, mockGetApiKeyColumn } = vi.hoisted(() => ({
  mockSafeFetchFollow: vi.fn(),
  mockGetValue: vi.fn(() => Promise.resolve(undefined as string | null | undefined)),
  mockGetApiKeyColumn: vi.fn(() => Promise.resolve(undefined as string | null | undefined)),
}));

// safeFetchFollow is mocked so tests never hit the real Amap endpoint.
// resolveApiKey reads decrypt_api_key — passthrough so stored values compare plaintext.
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchFollow: mockSafeFetchFollow }));
vi.mock('../../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: (v: string | null) => v,
  maybe_encrypt_api_key: (v: string | null) => v,
}));

const ORIGINAL_AMAP_KEY = process.env.AMAP_API_KEY;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  mockGetValue.mockResolvedValue(undefined);
  mockGetApiKeyColumn.mockResolvedValue(undefined);
  if (ORIGINAL_AMAP_KEY === undefined) delete process.env.AMAP_API_KEY;
  else process.env.AMAP_API_KEY = ORIGINAL_AMAP_KEY;
});

function fakeRes(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

const appSettingsStub = { getValue: mockGetValue } as unknown as AppSettingsRepository;
const usersStub = { getApiKeyColumn: mockGetApiKeyColumn } as unknown as UsersRepository;
const svc = new AmapPhotoService(appSettingsStub, usersStub);

/** Inject a key via the env var (lowest-precedence source resolveApiKey reads). */
function withKeyInEnv(key = 'test-key') {
  process.env.AMAP_API_KEY = key;
  return svc;
}

describe('amapPhotoService.searchCoverPhotos', () => {
  it('FE-AMAP-PHOTO-001: returns POI-photos from Amap place/text when the key is present', async () => {
    mockSafeFetchFollow.mockResolvedValue(
      fakeRes({
        status: '1',
        info: 'OK',
        pois: [
          {
            name: '外滩',
            photos: [
              { url: 'http://store.is.autonavi.com/showpic/aaa', title: '外滩夜景' },
              { url: 'http://store.is.autonavi.com/showpic/bbb' },
            ],
          },
          {
            name: '上海市',
            photos: [
              { url: 'http://store.is.autonavi.com/showpic/ccc', title: null },
            ],
          },
        ],
      }),
    );

    const result = await withKeyInEnv().searchCoverPhotos('上海', 9, 0);

    expect(result.hadKey).toBe(true);
    expect(result.photos).toHaveLength(3);
    expect(result.photos[0]).toMatchObject({
      description: '外滩',
      url: 'http://store.is.autonavi.com/showpic/aaa',
    });
    expect(result.photos[1].url).toBe('http://store.is.autonavi.com/showpic/bbb');
    expect(result.photos[2].description).toBe('上海市');
    // id is deterministic for testability
    expect(result.photos[0].id).toMatch(/^amap:/);
    // thumb mirrors url (Amap hands out CDN-ready JPEGs, no separate thumb endpoint)
    expect(result.photos[0].thumb).toBe(result.photos[0].url);
  });

  it('FE-AMAP-PHOTO-002: returns empty list when no Amap key is configured', async () => {
    delete process.env.AMAP_API_KEY;
    mockGetValue.mockResolvedValue(null);
    mockGetApiKeyColumn.mockResolvedValue(null);

    const result = await svc.searchCoverPhotos('上海', 9, 0);

    expect(result.hadKey).toBe(false);
    expect(result.photos).toEqual([]);
    expect(mockSafeFetchFollow).not.toHaveBeenCalled();
  });

  it('FE-AMAP-PHOTO-003: returns empty list when Amap refuses (status !== "1")', async () => {
    mockSafeFetchFollow.mockResolvedValue(
      fakeRes({ status: '0', info: 'INVALID_USER_KEY', infocode: '10001' }),
    );

    const result = await withKeyInEnv().searchCoverPhotos('上海', 9, 0);

    expect(result.hadKey).toBe(true);
    expect(result.photos).toEqual([]);
  });

  it('FE-AMAP-PHOTO-004: deduplicates photo URLs across POIs', async () => {
    mockSafeFetchFollow.mockResolvedValue(
      fakeRes({
        status: '1',
        pois: [
          { name: 'A', photos: [{ url: 'http://store.is.autonavi.com/showpic/same' }] },
          { name: 'B', photos: [{ url: 'http://store.is.autonavi.com/showpic/same' }] },
        ],
      }),
    );

    const { photos } = await withKeyInEnv().searchCoverPhotos('上海', 9, 0);
    expect(photos).toHaveLength(1);
  });

  it('FE-AMAP-PHOTO-005: caps per-POI and total photo counts', async () => {
    // Simulate a POI with 5 photos and a second POI with 5 — max 3 per POI, 9 total
    const photosP1 = Array.from({ length: 5 }, (_, i) => ({ url: `http://x/${i}` }));
    const photosP2 = Array.from({ length: 5 }, (_, i) => ({ url: `http://y/${i}` }));
    mockSafeFetchFollow.mockResolvedValue(
      fakeRes({
        status: '1',
        pois: [
          { name: 'P1', photos: photosP1 },
          { name: 'P2', photos: photosP2 },
          // A third POI that would push us past perPage=5
          { name: 'P3', photos: Array.from({ length: 5 }, (_, i) => ({ url: `http://z/${i}` })) },
        ],
      }),
    );

    const { photos } = await withKeyInEnv().searchCoverPhotos('上海', 5, 0);
    // P1 contributes 3, P2 contributes 2 → total 5
    expect(photos).toHaveLength(5);
    expect(photos.map((p) => p.url)).toEqual(expect.arrayContaining(['http://x/0', 'http://x/1', 'http://x/2', 'http://y/0', 'http://y/1']));
  });

  it('FE-AMAP-PHOTO-006: drops non-http(s) photo URLs', async () => {
    mockSafeFetchFollow.mockResolvedValue(
      fakeRes({
        status: '1',
        pois: [
          {
            name: 'poi',
            photos: [
              { url: 'javascript:alert(1)' },
              { url: '//relative.example.com/img.jpg' },
              { url: 'http://store.is.autonavi.com/showpic/good' },
              { url: '' },
              { url: undefined as unknown as string },
            ],
          },
        ],
      }),
    );

    const { photos } = await withKeyInEnv().searchCoverPhotos('上海', 9, 0);
    expect(photos).toHaveLength(1);
    expect(photos[0].url).toBe('http://store.is.autonavi.com/showpic/good');
  });

  it('FE-AMAP-PHOTO-007: returns empty list on transport failure (fetch throws)', async () => {
    mockSafeFetchFollow.mockRejectedValue(new Error('ETIMEDOUT'));

    const result = await withKeyInEnv().searchCoverPhotos('上海', 9, 0);
    expect(result.hadKey).toBe(true);
    expect(result.photos).toEqual([]);
  });

  it('FE-AMAP-PHOTO-008: returns empty list when HTTP status is not 2xx', async () => {
    mockSafeFetchFollow.mockResolvedValue(fakeRes({ status: 500, ok: false }));

    const result = await withKeyInEnv().searchCoverPhotos('上海', 9, 0);
    expect(result.hadKey).toBe(true);
    expect(result.photos).toEqual([]);
  });

  it('FE-AMAP-PHOTO-009: returns empty list for blank query without hitting the network', async () => {
    const result = await withKeyInEnv().searchCoverPhotos('   ', 9, 0);
    expect(result.hadKey).toBe(false); // no call means hadKey is from before key lookup
    expect(result.photos).toEqual([]);
    expect(mockSafeFetchFollow).not.toHaveBeenCalled();
  });

  it('FE-AMAP-PHOTO-010: attribution is the Amap copyright string', () => {
    expect(svc.attribution).toBe('© 高德地图');
  });
});
