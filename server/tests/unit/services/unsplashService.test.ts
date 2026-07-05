import { describe, it, expect, vi, afterEach } from 'vitest';
import os from 'os';
import fs from 'fs';
import path from 'path';

// safeFetch is mocked so saveUnsplashCover never hits the network.
// db is mocked so getUnsplashKey resolves from a controllable stub, and
// decrypt_api_key is a passthrough so stored values compare as plaintext.
const { safeFetch, mockDbGet } = vi.hoisted(() => ({ safeFetch: vi.fn(), mockDbGet: vi.fn(() => undefined as unknown) }));
vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetch }));
vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ get: mockDbGet, all: vi.fn(() => []), run: vi.fn() }) },
}));
vi.mock('../../../src/services/apiKeyCrypto', () => ({ decrypt_api_key: (v: string | null) => v }));

import { searchUnsplashPhotos, getUnsplashKey, saveUnsplashCover, isUnsplashCoverUrl } from '../../../src/services/unsplashService';

const ORIGINAL_UNSPLASH_ENV = process.env.UNSPLASH_ACCESS_KEY;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  mockDbGet.mockReturnValue(undefined);
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

  it('UNSPLASH-003: maps a non-ok response to an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes({ ok: false, status: 429, type: 'application/json', json: { errors: ['Rate limited'] } })));
    expect(await searchUnsplashPhotos('paris')).toEqual({ error: 'Rate limited', status: 429 });
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

  it('UNSPLASH-014: falls back to the admin key when the user has none', () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    mockDbGet.mockReturnValueOnce({ unsplash_api_key: null });
    mockDbGet.mockReturnValueOnce({ unsplash_api_key: 'admin-key' });
    expect(getUnsplashKey(1)).toBe('admin-key');
  });

  it('UNSPLASH-015: returns null when neither env, user, nor admin has a key', () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    mockDbGet.mockReturnValue(undefined);
    expect(getUnsplashKey(1)).toBeNull();
  });
});

describe('unsplashService.saveUnsplashCover', () => {
  const dir = path.join(os.tmpdir(), 'trek-unsplash-cover-test');
  afterEach(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } });

  it('UNSPLASH-005: rejects a non-Unsplash host before any fetch', async () => {
    await expect(saveUnsplashCover('https://evil.example.com/x.jpg', dir)).rejects.toThrow('Not an Unsplash image URL');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('UNSPLASH-006: downloads an Unsplash image and writes it locally', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'image/jpeg', bytes: 1234 }));
    const filename = await saveUnsplashCover('https://images.unsplash.com/photo-1?w=1080', dir);
    expect(filename).toMatch(/\.jpg$/);
    expect(fs.existsSync(path.join(dir, filename))).toBe(true);
  });

  it('UNSPLASH-007: rejects an unsupported content type', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'text/html' }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1', dir)).rejects.toThrow(/Unsupported cover image type/);
  });

  it('UNSPLASH-008: rejects an oversized image', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'image/png', bytes: 16 * 1024 * 1024 }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1', dir)).rejects.toThrow('Cover image too large');
  });

  it('UNSPLASH-009: throws when the download fails', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: false, status: 404 }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1', dir)).rejects.toThrow(/HTTP 404/);
  });
});
