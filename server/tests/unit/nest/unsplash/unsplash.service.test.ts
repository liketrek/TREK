import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// safeFetch is mocked so saveUnsplashCover never hits the network.
// db is mocked so getUnsplashKey resolves from a controllable stub, and
// decrypt_api_key is a passthrough so stored values compare as plaintext.
// The instance-wide row (#1939) is read before the user's own, so it gets its
// own seam rather than eating the mockDbGet stub of every case below.
const { safeFetch, mockDbGet, mockInstanceGet } = vi.hoisted(() => ({
  safeFetch: vi.fn(),
  mockDbGet: vi.fn((..._args: unknown[]) => undefined as unknown),
  mockInstanceGet: vi.fn((..._args: unknown[]) => undefined as unknown),
}));
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetch }));
vi.mock('../../../../src/db/database', () => ({
  db: {
    prepare: (sql: string) => ({
      get: (...args: unknown[]) => (sql.includes('app_settings') ? mockInstanceGet(...args) : mockDbGet(...args)),
      all: vi.fn(() => []),
      run: vi.fn(),
    }),
  },
}));
vi.mock('../../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: (v: string | null) => v,
  // Unused by the read path here, but instance-api-keys imports it.
  maybe_encrypt_api_key: (v: string | null) => v,
}));

import { UnsplashService } from '../../../../src/nest/unsplash/unsplash.service';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { db } from '../../../../src/db/database';
import { makeStorageFixture } from '../../../helpers/storage-fixture';

// Same four entry points, now methods. The db mock above still feeds them.
const coverFx = makeStorageFixture('covers/');
const svc = new UnsplashService(new DatabaseService(db), new RuntimeEnvService(), coverFx.storage);
const searchUnsplashPhotos = svc.searchUnsplashPhotos.bind(svc);
const getUnsplashKey = svc.getUnsplashKey.bind(svc);
const saveUnsplashCover = svc.saveUnsplashCover.bind(svc);
const isUnsplashCoverUrl = svc.isUnsplashCoverUrl.bind(svc);

const ORIGINAL_UNSPLASH_ENV = process.env.UNSPLASH_ACCESS_KEY;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  mockDbGet.mockReturnValue(undefined);
  mockInstanceGet.mockReturnValue(undefined);
  if (ORIGINAL_UNSPLASH_ENV === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
  else process.env.UNSPLASH_ACCESS_KEY = ORIGINAL_UNSPLASH_ENV;
});

function fakeRes(init: { ok: boolean; status?: number; type?: string; bytes?: number; json?: unknown }): Response {
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? init.type ?? '' : null) },
    arrayBuffer: async () => new ArrayBuffer(init.bytes ?? 8),
    json: async () => init.json ?? {},
  } as unknown as Response;
}

describe('unsplashService.isUnsplashCoverUrl', () => {
  it('UNSPLASH-001: accepts only the Unsplash image CDN host', () => {
    expect(isUnsplashCoverUrl('https://images.unsplash.com/photo-1?w=1080')).toBe(true);
    expect(isUnsplashCoverUrl('https://evil.example.com/x.jpg')).toBe(false);
    expect(isUnsplashCoverUrl('/uploads/covers/local.jpg')).toBe(false);
    expect(isUnsplashCoverUrl(null)).toBe(false);
    expect(isUnsplashCoverUrl(undefined)).toBe(false);
  });
});

describe('unsplashService.searchUnsplashPhotos', () => {
  it('UNSPLASH-002: rejects an empty query without hitting the network', async () => {
    expect(await searchUnsplashPhotos('   ')).toEqual({ error: 'Search query is required', status: 400 });
  });

  it('UNSPLASH-002a: gives the search request a deadline so a hung upstream cannot pin the caller', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeRes({ ok: true, type: 'application/json', json: { results: [] } }));
    vi.stubGlobal('fetch', fetchMock);

    await searchUnsplashPhotos('paris');
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('UNSPLASH-003: maps a non-ok response to an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes({ ok: false, status: 429, type: 'application/json', json: { errors: ['Rate limited'] } })));
    expect(await searchUnsplashPhotos('paris')).toEqual({ error: 'Rate limited', status: 429 });
  });

  it('UNSPLASH-016: a 200 carrying unparseable JSON becomes a 502, not a crash', async () => {
    // The web endpoint answers 200 with an HTML challenge page when it decides the
    // caller is a datacenter (#1449), so a parse failure on an ok response is an
    // upstream problem, not the caller's.
    const bad = fakeRes({ ok: true, type: 'text/html' });
    (bad as { json: () => Promise<unknown> }).json = async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(bad));
    expect(await searchUnsplashPhotos('paris')).toEqual({ error: 'Unsplash search unavailable', status: 502 });
  });

  it('UNSPLASH-017: a failing response with unparseable JSON keeps its own status', async () => {
    const bad = fakeRes({ ok: false, status: 503, type: 'text/html' });
    (bad as { json: () => Promise<unknown> }).json = async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(bad));
    expect(await searchUnsplashPhotos('paris')).toEqual({ error: 'Unsplash search unavailable', status: 503 });
  });

  it('UNSPLASH-018: falls back to the generic message when a non-ok body names no error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes({ ok: false, status: 500, type: 'application/json', json: {} })));
    expect(await searchUnsplashPhotos('paris')).toEqual({ error: 'Unsplash search unavailable', status: 500 });
  });

  it('UNSPLASH-019: uses the single error field when the errors array is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes({ ok: false, status: 401, type: 'application/json', json: { error: 'Bad credentials' } })));
    expect(await searchUnsplashPhotos('paris')).toEqual({ error: 'Bad credentials', status: 401 });
  });

  it('UNSPLASH-004: returns normalised photos on success and drops entries missing a url/thumb', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes({
      ok: true,
      type: 'application/json',
      json: {
        results: [
          { id: 'a', urls: { regular: 'https://images.unsplash.com/a', small: 'https://images.unsplash.com/a-s' }, user: { name: 'Alice' }, links: { html: 'https://unsplash.com/a' } },
          { id: 'b', urls: {} }, // dropped — no url/thumb
        ],
      },
    })));
    const res = await searchUnsplashPhotos('paris') as { photos: { id: string }[] };
    expect(res.photos).toHaveLength(1);
    expect(res.photos[0]).toMatchObject({ id: 'a', photographer: 'Alice', link: 'https://unsplash.com/a' });
  });

  it('UNSPLASH-010: hits the unauthenticated web endpoint when no access key is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeRes({ ok: true, type: 'application/json', json: { results: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    await searchUnsplashPhotos('paris');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('unsplash.com/napi/search/photos');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('UNSPLASH-011: hits the official API with a Client-ID header when an access key is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeRes({ ok: true, type: 'application/json', json: { results: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    await searchUnsplashPhotos('paris', 9, 'my-access-key');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('api.unsplash.com/search/photos');
    expect((init.headers as Record<string, string>).Authorization).toBe('Client-ID my-access-key');
    expect((init.headers as Record<string, string>)['Accept-Version']).toBe('v1');
  });
});

describe('unsplashService.getUnsplashKey', () => {
  it('UNSPLASH-012: prefers the UNSPLASH_ACCESS_KEY env var over any stored key', () => {
    process.env.UNSPLASH_ACCESS_KEY = 'env-key';
    mockDbGet.mockReturnValue({ unsplash_api_key: 'user-key' });
    expect(getUnsplashKey(1)).toBe('env-key');
    expect(mockDbGet).not.toHaveBeenCalled();
  });

  it('UNSPLASH-013: returns the user key when set and no env var', () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    mockDbGet.mockReturnValueOnce({ unsplash_api_key: 'user-key' });
    expect(getUnsplashKey(1)).toBe('user-key');
  });

  it('UNSPLASH-014: the instance-wide key wins over the user own key (#1939)', () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    mockInstanceGet.mockReturnValue({ value: 'instance-key' });
    mockDbGet.mockReturnValue({ unsplash_api_key: 'user-key' });
    expect(getUnsplashKey(1)).toBe('instance-key');
    expect(mockDbGet).not.toHaveBeenCalled(); // the own row is not even read
  });

  it('UNSPLASH-015: returns null when neither env, instance, nor the user has a key', () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    mockDbGet.mockReturnValue(undefined);
    expect(getUnsplashKey(1)).toBeNull();
  });

  it("UNSPLASH-015b: never reads another user's key — the admin fallback is gone (#1939)", () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    mockDbGet.mockReturnValue(undefined);
    expect(getUnsplashKey(1)).toBeNull();
    // Both reads are scoped: the instance row and this caller's own row.
    expect(mockDbGet).toHaveBeenCalledTimes(1);
    expect(mockDbGet).toHaveBeenCalledWith(1);
  });
});

describe('unsplashService.saveUnsplashCover', () => {
  const coversDir = path.join(coverFx.root, 'covers');
  const writtenCovers = () => (fs.existsSync(coversDir) ? fs.readdirSync(coversDir) : []);
  afterEach(() => { try { fs.rmSync(coversDir, { recursive: true, force: true }); } catch { /* ignore */ } });

  it('UNSPLASH-005: rejects a non-Unsplash host before any fetch', async () => {
    await expect(saveUnsplashCover('https://evil.example.com/x.jpg')).rejects.toThrow('Not an Unsplash image URL');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('UNSPLASH-006: downloads an Unsplash image and stores it under covers', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'image/jpeg', bytes: 1234 }));
    const filename = await saveUnsplashCover('https://images.unsplash.com/photo-1?w=1080');
    expect(filename).toMatch(/\.jpg$/);
    expect(fs.existsSync(path.join(coversDir, filename))).toBe(true);
  });

  it('UNSPLASH-007: rejects an unsupported content type without writing', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'text/html' }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1')).rejects.toThrow(/Unsupported cover image type/);
    expect(writtenCovers()).toEqual([]);
  });

  it('UNSPLASH-008: rejects an oversized image without writing', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'image/png', bytes: 16 * 1024 * 1024 }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1')).rejects.toThrow('Cover image too large');
    expect(writtenCovers()).toEqual([]);
  });

  it('UNSPLASH-008a: rejects on the declared length before the body is buffered', async () => {
    const arrayBuffer = vi.fn(async () => new ArrayBuffer(8));
    safeFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'image/png' : String(20 * 1024 * 1024)),
      },
      arrayBuffer,
    } as unknown as Response);

    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1')).rejects.toThrow('Cover image too large');
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(writtenCovers()).toEqual([]);
  });

  it('UNSPLASH-008b: stops a chunked oversized body mid-stream instead of buffering it', async () => {
    let cancelled = false;
    let served = 0;
    safeFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'image/png' : null) },
      body: {
        getReader: () => ({
          read: async () => {
            served++;
            return { done: false, value: new Uint8Array(4 * 1024 * 1024) };
          },
          cancel: async () => { cancelled = true; },
        }),
      },
    } as unknown as Response);

    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1')).rejects.toThrow('Cover image too large');
    expect(cancelled).toBe(true);
    // 15MB budget, 4MB chunks: the read stops on the fourth, not after an endless body.
    expect(served).toBe(4);
    expect(writtenCovers()).toEqual([]);
  });

  it('UNSPLASH-008c: passes a deadline through safeFetch', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'image/jpeg', bytes: 32 }));
    await saveUnsplashCover('https://images.unsplash.com/photo-1');
    expect(safeFetch.mock.calls[0][1]).toEqual(expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('UNSPLASH-009: throws when the download fails', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: false, status: 404 }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1')).rejects.toThrow(/HTTP 404/);
    expect(writtenCovers()).toEqual([]);
  });
});
