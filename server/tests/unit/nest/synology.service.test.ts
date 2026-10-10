/**
 * SynologyService — credentials, the SID session with its retry, album listing
 * across three sources, and the asset paths.
 *
 * Same gap as Immich: the provider arrived from services/memories/ at ~60%
 * branch coverage because that tree is outside the gate, and the integration
 * suite drives it over HTTP without reaching the failure paths. The session
 * retry in particular — Synology invalidates a SID on timeout (106), a
 * duplicate login (107) or an unknown SID (119), and the service is supposed to
 * re-login once and repeat the call — had no case at all.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
    return { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => null, isOwner: () => false, getPlaceWithTags: () => null };
});

vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'x'.repeat(40),
  ENCRYPTION_KEY: 'a'.repeat(64),
  updateJwtSecret: () => {},
}));

const { decryptMock, maybeEncryptMock } = vi.hoisted(() => ({
  decryptMock: vi.fn((v: string) => v),
  maybeEncryptMock: vi.fn((v: string) => v),
}));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: decryptMock,
  encrypt_api_key: (v: string) => v,
  maybe_encrypt_api_key: maybeEncryptMock,
}));

const { safeFetch, checkSsrf, SsrfBlockedError } = vi.hoisted(() => {
  class SsrfBlockedError extends Error {}
  return { safeFetch: vi.fn(), checkSsrf: vi.fn(), SsrfBlockedError };
});
vi.mock('../../../src/utils/ssrfGuard', () => ({
  safeFetch, checkSsrf, SsrfBlockedError, createPinnedDispatcher: vi.fn(() => ({})),
}));
// The service fires the session-cleared notice and .catch()es it, so the stub
// has to be a promise.

import { db as testDb } from '../../../src/db/database';
import { SynologyService } from '../../../src/nest/memories/synology.service';
import type { MemoriesAccessService } from '../../../src/nest/memories/memories-access.service';
import { notificationsStub } from '../../helpers/notifications';
import { createTestUserSynologyRepo, sharedTestOrm } from '../../helpers/test-uow';
import { deleteRows, upsertRow } from '../../helpers/factories/rows';
import { readUser } from '../../helpers/factories/users';
import { Users } from '../../../src/db/entities/Users.entity';

const access = { getAlbumLinkForSync: vi.fn(), updateSyncTimeForAlbumLink: vi.fn() };
let svc: SynologyService;

const USER = 1;

interface SynologyCols {
  synology_url: string | null;
  synology_username: string | null;
  synology_password: string | null;
  synology_sid: string | null;
  synology_did: string | null;
  synology_skip_ssl: number;
}

async function seedUser(id: number, cols: Partial<SynologyCols> = {}): Promise<void> {
  const base: SynologyCols = { synology_url: 'https://nas.test', synology_username: 'ada', synology_password: 'pw', synology_sid: 'sid-1', synology_did: null, synology_skip_ssl: 1 };
  await upsertRow(await sharedTestOrm(testDb), Users, {
    id,
    username: `u${id}`,
    email: `u${id}@example.test`,
    password_hash: 'x',
    ...base,
    ...cols,
  });
}

/** A Synology API envelope: { success, data } or { success:false, error:{ code } }. */
function api(data: unknown) {
  return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data }), arrayBuffer: async () => Buffer.from('x') };
}
function apiError(code: number) {
  return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: false, error: { code } }), arrayBuffer: async () => Buffer.from('x') };
}
function httpError(status: number) {
  return { ok: false, status, headers: { get: () => null }, json: async () => ({}), arrayBuffer: async () => Buffer.from('x') };
}

beforeAll(async () => {
  svc = new SynologyService(access as unknown as MemoriesAccessService, notificationsStub(), await createTestUserSynologyRepo(testDb));
});

beforeEach(async () => {
  vi.clearAllMocks();
  decryptMock.mockImplementation((v: string) => v);
  maybeEncryptMock.mockImplementation((v: string) => v);
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '1.2.3.4' });
  await deleteRows(await sharedTestOrm(testDb), Users);
  await seedUser(USER);
});

afterAll(() => testDb.close());

describe('credentials', () => {
  it('SYNO-U001: an unknown user is 404, not "not configured"', async () => {
    const result = await svc.getSynologySettings(999);
    expect(result).toEqual({ success: false, error: { message: 'User not found', status: 404 } });
  });

  it('SYNO-U002: a half-filled row is "Synology not configured"', async () => {
    await seedUser(2, { synology_password: null });
    const result = await svc.getSynologySettings(2);
    expect(result).toEqual({ success: false, error: { message: 'Synology not configured', status: 400 } });
  });

  it('SYNO-U003: a password that will not decrypt is a 500, not a silent retry', async () => {
    decryptMock.mockReturnValue(null);
    const result = await svc.getSynologySettings(USER);
    expect(result).toEqual({ success: false, error: { message: 'Synology credentials corrupted', status: 500 } });
  });

  it('SYNO-U004: skip_ssl is read as a boolean, 0 meaning verify', async () => {
    await seedUser(3, { synology_skip_ssl: 0 });
    const result = await svc.getSynologySettings(3);
    expect(result.success && result.data.synology_skip_ssl).toBe(false);
  });

  it('SYNO-U005: settings report the URL, the username and a live session', async () => {
    const result = await svc.getSynologySettings(USER);
    expect(result.success && result.data).toMatchObject({ synology_url: 'https://nas.test', synology_username: 'ada', connected: true });
  });
});

describe('the session', () => {
  it('SYNO-U010: a cached SID is used without logging in', async () => {
    safeFetch.mockResolvedValue(api({ list: [] }));
    await svc.searchSynologyPhotos(USER);
    const bodies = safeFetch.mock.calls.map(c => String((c[1] as { body: URLSearchParams }).body));
    expect(bodies.some(b => b.includes('SYNO.API.Auth'))).toBe(false);
  });

  it('SYNO-U011: a SID that will not decrypt is cleared and a fresh login happens', async () => {
    decryptMock.mockImplementation((v: string) => (v === 'sid-1' ? null : v));
    safeFetch.mockResolvedValueOnce(api({ sid: 'sid-2' })).mockResolvedValueOnce(api({ list: [] }));

    await svc.searchSynologyPhotos(USER);

    const first = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(first).toContain('SYNO.API.Auth');
  });

  it('SYNO-U012: a login that returns no sid is a 500', async () => {
    await seedUser(4, { synology_sid: null });
    safeFetch.mockResolvedValue(api({}));
    const result = await svc.searchSynologyPhotos(4);
    expect(result).toEqual({ success: false, error: { message: 'Failed to get session ID from Synology', status: 500 } });
  });

  it('SYNO-U013: a stored device id rides along so a trusted device skips OTP', async () => {
    await seedUser(5, { synology_sid: null, synology_did: 'device-1' });
    safeFetch.mockResolvedValueOnce(api({ sid: 's' })).mockResolvedValueOnce(api({ list: [] }));

    await svc.searchSynologyPhotos(5);

    expect(String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body)).toContain('device_id=device-1');
  });

  it.each([106, 107, 119])('SYNO-U014: error %i clears the SID, re-logs in and repeats the call', async (code) => {
    safeFetch
      .mockResolvedValueOnce(apiError(code))       // the call, with a dead SID
      .mockResolvedValueOnce(api({ sid: 'sid-2' })) // the re-login
      .mockResolvedValueOnce(api({ list: [] }));    // the retry

    const result = await svc.searchSynologyPhotos(USER);

    expect(result.success).toBe(true);
    expect(String((safeFetch.mock.calls[1][1] as { body: URLSearchParams }).body)).toContain('SYNO.API.Auth');
  });

  it('SYNO-U015: an app-level error that is NOT a session code is not retried', async () => {
    safeFetch.mockResolvedValue(apiError(105));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result.success).toBe(false);
    // one call only — no re-login, no repeat
    expect(safeFetch).toHaveBeenCalledTimes(1);
  });
});

describe('the API envelope', () => {
  it('SYNO-U020: an HTTP failure carries the upstream status', async () => {
    safeFetch.mockResolvedValue(httpError(502));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result).toEqual({ success: false, error: { message: 'Synology API request failed with status 502', status: 502 } });
  });

  it('SYNO-U021: a known app error code becomes its documented message at HTTP 400', async () => {
    safeFetch.mockResolvedValue(apiError(400));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result.success).toBe(false);
    expect((result as { error: { status: number } }).error.status).toBe(400);
  });

  it('SYNO-U022: an unknown code still produces a message rather than undefined', async () => {
    safeFetch.mockResolvedValue(apiError(99999));
    const result = await svc.searchSynologyPhotos(USER);
    expect((result as { error: { message: string } }).error.message).toContain('99999');
  });

  it('SYNO-U023: an SSRF block is a 400 with the guard\'s own message', async () => {
    safeFetch.mockRejectedValue(new SsrfBlockedError('blocked host'));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result).toEqual({ success: false, error: { message: 'blocked host', status: 400 } });
  });

  it('SYNO-U024: any other transport failure is a 500', async () => {
    safeFetch.mockRejectedValue(new Error('ECONNRESET'));
    const result = await svc.searchSynologyPhotos(USER);
    expect(result).toEqual({ success: false, error: { message: 'Failed to connect to Synology API', status: 500 } });
  });
});

describe('updateSynologySettings', () => {
  it('SYNO-U030: refuses a URL the SSRF guard blocks', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, error: 'private range' });
    const result = await svc.updateSynologySettings(USER, 'http://10.0.0.1', 'ada', 'pw');
    expect(result).toEqual({ success: false, error: { message: 'private range', status: 400 } });
  });

  it('SYNO-U031: keeps the stored password when none is supplied', async () => {
    safeFetch.mockResolvedValue(api({ sid: 's' }));
    await svc.updateSynologySettings(USER, 'https://nas2.test', 'ada');
    const row = await readUser(await sharedTestOrm(testDb), USER);
    expect(row.synology_password).toBe('pw');
    expect(row.synology_url).toBe('https://nas2.test');
  });

  // R6 — this file mocks `maybe_encrypt_api_key` as identity elsewhere (so
  // the cases above can assert on the plaintext round-trip); this one case
  // swaps in the REAL crypto for the duration of a single call and reads the
  // raw column back — proving `UsersRepository.setSynologySettings` never
  // bypasses the service's encrypt step. `beforeEach` restores the identity
  // stub for every other case.
  it('SYNO-U032 (R6): the stored synology_password is the encrypted envelope, never the plaintext', async () => {
    safeFetch.mockResolvedValue(api({ sid: 's' }));
    const real = await vi.importActual<typeof import('../../../src/nest/common/crypto/apiKeyCrypto')>(
      '../../../src/nest/common/crypto/apiKeyCrypto',
    );
    maybeEncryptMock.mockImplementation(real.maybe_encrypt_api_key);

    const plaintext = 'synthetic-test-synology-pw-001';
    await svc.updateSynologySettings(USER, 'https://nas3.test', 'ada', plaintext);

    const row = await readUser(await sharedTestOrm(testDb), USER);
    expect(row.synology_password).not.toBe(plaintext);
    expect(row.synology_password?.startsWith('enc:v1:')).toBe(true);
  });
});

describe('testSynologyConnection', () => {
  it('SYNO-U040: sends the OTP and asks for a device token when one is given', async () => {
    safeFetch.mockResolvedValue(api({ sid: 's', did: 'd' }));

    await svc.testSynologyConnection(USER, 'https://nas.test', 'ada', 'pw', '123456');

    const body = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(body).toContain('otp_code=123456');
    expect(body).toContain('enable_device_token=yes');
  });

  it('SYNO-U041: omits the OTP fields when none is given', async () => {
    safeFetch.mockResolvedValue(api({ sid: 's' }));

    await svc.testSynologyConnection(USER, 'https://nas.test', 'ada', 'pw');

    expect(String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body)).not.toContain('otp_code');
  });
});

describe('listSynologyAlbums', () => {
  it('SYNO-U050: merges personal, shared and shared-with-me, carrying each passphrase', async () => {
    safeFetch
      .mockResolvedValueOnce(api({ list: [{ id: 1, name: 'Personal', item_count: 2 }] }))
      .mockResolvedValueOnce(api({ list: [{ id: 2, name: 'Shared', item_count: 1, passphrase: 'p2' }] }))
      .mockResolvedValueOnce(api({ list: [{ id: 3, name: 'WithMe', item_count: 3, sharing_info: { passphrase: 'p3' } }] }));

    const result = await svc.listSynologyAlbums(USER);

    const albums = (result as { data: { albums: { id: string; passphrase?: string }[] } }).data.albums;
    expect(albums.map(a => a.id).sort()).toEqual(['1', '2', '3']);
    expect(albums.find(a => a.id === '2')!.passphrase).toBe('p2');
    expect(albums.find(a => a.id === '3')!.passphrase).toBe('p3');
  });

  it('SYNO-U051: a partial source failure still returns the albums that came back', async () => {
    safeFetch
      .mockResolvedValueOnce(api({ list: [{ id: 1, name: 'Personal' }] }))
      .mockResolvedValueOnce(apiError(105))
      .mockResolvedValueOnce(apiError(105));

    const result = await svc.listSynologyAlbums(USER);

    expect((result as { data: { albums: unknown[] } }).data.albums).toHaveLength(1);
  });

  it('SYNO-U052: the same album id from two sources collapses to one entry', async () => {
    safeFetch
      .mockResolvedValueOnce(api({ list: [{ id: 9, name: 'Dup' }] }))
      .mockResolvedValueOnce(api({ list: [] }))
      .mockResolvedValueOnce(api({ list: [{ id: 9, name: 'Dup', sharing_info: { passphrase: 'p9' } }] }));

    const result = await svc.listSynologyAlbums(USER);

    const albums = (result as { data: { albums: { id: string; passphrase?: string }[] } }).data.albums;
    expect(albums).toHaveLength(1);
    // last write wins, so the shared-with-me passphrase survives
    expect(albums[0].passphrase).toBe('p9');
  });

  it('SYNO-U053: when every source fails, the personal failure is surfaced', async () => {
    safeFetch.mockResolvedValue(httpError(500));
    const result = await svc.listSynologyAlbums(USER);
    expect(result.success).toBe(false);
  });
});

describe('getSynologyAlbumPhotos', () => {
  it('SYNO-U060: pages until a short page and keys assets by the thumbnail cache key', async () => {
    const page = (n: number) => api({ list: Array.from({ length: n }, (_, i) => ({ id: i, time: 1700000000, additional: { thumbnail: { cache_key: `ck-${i}` } } })) });
    safeFetch.mockResolvedValueOnce(page(50)).mockResolvedValueOnce(page(3));

    const result = await svc.getSynologyAlbumPhotos(USER, '7');

    const assets = (result as { data: { assets: { id: string }[] } }).data.assets;
    expect(assets).toHaveLength(53);
    expect(assets[0].id).toBe('ck-0');
  });

  it('SYNO-U061: a passphrase album queries by passphrase, not album_id', async () => {
    safeFetch.mockResolvedValue(api({ list: [] }));

    await svc.getSynologyAlbumPhotos(USER, '7', 'secret');

    const body = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(body).toContain('passphrase=secret');
    expect(body).not.toContain('album_id');
  });

  it('SYNO-U062: an upstream failure is passed straight through', async () => {
    safeFetch.mockResolvedValue(httpError(503));
    expect((await svc.getSynologyAlbumPhotos(USER, '7')).success).toBe(false);
  });

  it('SYNO-U063: asks Browse.Item for no ordering of its own', async () => {
    // The loop below drains every page before sorting, so an upstream sort buys
    // nothing — while a parameter some DSM build rejects becomes a 400 and takes
    // the whole album down.
    safeFetch.mockResolvedValue(api({ list: [] }));

    await svc.getSynologyAlbumPhotos(USER, '7');

    const body = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(body).not.toContain('sort_by');
    expect(body).not.toContain('sort_direction');
  });

  it('SYNO-U064: orders the album by capture time, newest first', async () => {
    safeFetch.mockResolvedValue(api({ list: [
      { id: 1, time: 1700000000, additional: { thumbnail: { cache_key: 'older' } } },
      { id: 2, time: 1800000000, additional: { thumbnail: { cache_key: 'newer' } } },
    ] }));

    const assets = (await svc.getSynologyAlbumPhotos(USER, '7') as { data: { assets: { id: string }[] } }).data.assets;

    expect(assets.map(a => a.id)).toEqual(['newer', 'older']);
  });
});

describe('collectSynologyAlbumSelection', () => {
  it('SYNO-U070: fails when the album link does not resolve', async () => {
    access.getAlbumLinkForSync.mockReturnValue({ success: false, error: { message: 'Album link not found', status: 404 } });
    const result = await svc.collectSynologyAlbumSelection(USER, '1', 'l1');
    expect(result.success).toBe(false);
  });

  it('SYNO-U071: returns the cache keys as the selection, with the raw total', async () => {
    access.getAlbumLinkForSync.mockReturnValue({ success: true, data: { albumId: '7', passphrase: undefined } });
    safeFetch.mockResolvedValue(api({ list: [
      { id: 1, additional: { thumbnail: { cache_key: 'ck-1' } } },
      { id: 2, additional: { thumbnail: { cache_key: '' } } },
    ] }));

    const result = await svc.collectSynologyAlbumSelection(USER, '1', 'l1');

    const data = (result as { data: { selection: { asset_ids: string[] }; total: number } }).data;
    // the empty cache key is filtered out of the selection but still counted
    expect(data.selection.asset_ids).toEqual(['ck-1']);
    expect(data.total).toBe(2);
  });
});

describe('the search order', () => {
  it('SYNO-U065: search results come back newest first without a sort parameter upstream', async () => {
    // SYNO.Foto.Search.Search documents no sort_by, and _fetchSynologyJson maps
    // every app code except 106/107/119 onto a 400, so a rejected parameter would
    // take search down for that user entirely. Ordering happens here instead.
    safeFetch.mockResolvedValue(api({ list: [
      { id: 1, time: 1700000000, additional: { thumbnail: { cache_key: 'older' } } },
      { id: 2, time: 1800000000, additional: { thumbnail: { cache_key: 'newer' } } },
    ] }));

    const result = await svc.searchSynologyPhotos(USER);

    const assets = (result as { data: { assets: { id: string }[] } }).data.assets;
    expect(assets.map(a => a.id)).toEqual(['newer', 'older']);
    const body = String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body);
    expect(body).not.toContain('sort_by');
  });

});

describe('the search window', () => {
  const windowOf = async (from?: string, to?: string, tzOffsetMinutes?: number) => {
    safeFetch.mockResolvedValue(api({ list: [] }));
    await svc.searchSynologyPhotos(USER, from, to, 0, 100, tzOffsetMinutes);
    return new URLSearchParams(String((safeFetch.mock.calls[0][1] as { body: URLSearchParams }).body));
  };

  it('SYNO-U081: with no offset the day is the UTC day it has always been', async () => {
    const body = await windowOf('2026-03-15', '2026-03-15');

    expect(body.get('start_time')).toBe(String(Date.UTC(2026, 2, 15) / 1000));
    expect(body.get('end_time')).toBe(String(Date.UTC(2026, 2, 15) / 1000 + 86400));
  });

  it("SYNO-U082: the caller's offset moves both bounds onto the day it meant", async () => {
    // UTC+10: the 15th there runs from 14:00Z on the 14th. Without this the NAS
    // was asked for 10:00 that morning to 09:59 the next (#2336).
    const body = await windowOf('2026-03-15', '2026-03-15', 600);

    expect(body.get('start_time')).toBe(String(Date.UTC(2026, 2, 15) / 1000 - 600 * 60));
    expect(body.get('end_time')).toBe(String(Date.UTC(2026, 2, 15) / 1000 - 600 * 60 + 86400));
  });

  it('SYNO-U083: a one-sided range still sets only the bound it was given', async () => {
    // Both are optional on the MCP tool, so this is reachable.
    const fromOnly = await windowOf('2026-03-15', undefined, 600);
    expect(fromOnly.get('start_time')).toBe(String(Date.UTC(2026, 2, 15) / 1000 - 600 * 60));
    expect(fromOnly.get('end_time')).toBeNull();

    vi.clearAllMocks();
    const toOnly = await windowOf(undefined, '2026-03-15', -480);
    expect(toOnly.get('start_time')).toBeNull();
    expect(toOnly.get('end_time')).toBe(String(Date.UTC(2026, 2, 15) / 1000 + 480 * 60 + 86400));
  });

  it('SYNO-U084: no dates at all still means no window, offset or not', async () => {
    const body = await windowOf(undefined, undefined, 600);

    expect(body.get('start_time')).toBeNull();
    expect(body.get('end_time')).toBeNull();
  });
});

describe('fetchSynologyThumbnailBytes', () => {
  it('SYNO-U080: fails without credentials rather than fetching', async () => {
    await seedUser(6, { synology_url: null });
    const result = await svc.fetchSynologyThumbnailBytes(6, 6, 'a1');
    expect(result).toHaveProperty('error');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('SYNO-U081: bounds the thumbnail read in time and size, on a host the user configured', async () => {
    await seedUser(7);
    safeFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => new Uint8Array([1, 2]).buffer,
    });

    const result = await svc.fetchSynologyThumbnailBytes(7, 7, '101_1633659236');

    expect(result).toEqual({ bytes: Buffer.from([1, 2]), contentType: 'image/jpeg' });
    const [url, init, options] = safeFetch.mock.calls.at(-1)!;
    expect(String(url)).toContain('SYNO.Foto.Thumbnail');
    expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal);
    expect(options).toEqual({ rejectUnauthorized: false, maxBytes: 8 * 1024 * 1024 });
  });
});
