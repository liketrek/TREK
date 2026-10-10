/**
 * Unit tests for the memories helpers and access checks — MEM-HELPERS-001 to 020.
 * Moved with the fold: the pure half is nest/memories/memories.helpers.ts, the
 * DB-backed half is MemoriesAccessService.
 * Covers mapDbError, getAlbumIdFromLink, pipeAsset error paths.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ─────────────────────────────────────────────────────────────────

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
  };
    return mock;
});

const { mockSafeFetch } = vi.hoisted(() => ({
  mockSafeFetch: vi.fn(),
}));

vi.mock('../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {
    constructor(msg: string) { super(msg); this.name = 'SsrfBlockedError'; }
  }
  return {
    safeFetch: mockSafeFetch,
    SsrfBlockedError,
    checkSsrf: vi.fn(async () => ({ allowed: true, resolvedIp: '1.2.3.4' })),
  };
});

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { mapDbError, pipeAsset, type ServiceResult } from '../../../src/nest/memories/memories.helpers';
import { MemoriesAccessService } from '../../../src/nest/memories/memories-access.service';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripAlbumLinks } from '../../../src/db/entities/TripAlbumLinks.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { JourneyContributors } from '../../../src/db/entities/JourneyContributors.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { sharedTestOrm } from '../../helpers/test-uow';
import type { TestOrm } from '../../helpers/test-orm';
import { findRow, insertRow } from '../../helpers/factories/rows';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';

// Plan 3c Task 0b / Plan 3e Task 6 / Plan 3g Task 4: `access` used to be
// constructed at module load, before any `beforeAll` could resolve a real
// `EntityManager` — it now also needs `TripPhotosRepository`/
// `TrekPhotosRepository`/`TripAlbumLinksRepository`/`TripsRepository` (the
// ORM ones) and, for MA1/MA2/MA6's journey half, `JourneysRepository`/
// `JourneyContributorsRepository`/`JourneyPhotosRepository`, all of which
// the same `sharedTestOrm(testDb)` this file already used for the
// `canAccessTrip` patch hands out. Built inside the async `beforeAll` below.
let access: MemoriesAccessService;
// A typed forwarder, not a `.bind` alias: a bound alias is typed `any`, which
// hides a missing `await` from tsc and from all three lint rules.
const getAlbumIdFromLink = (...a: Parameters<MemoriesAccessService['getAlbumIdFromLink']>) => access.getAlbumIdFromLink(...a);
import { SsrfBlockedError } from '../../../src/utils/ssrfGuard';

let orm: TestOrm;

/** An album link of the user on the trip, written straight in. */
function insertAlbumLink(tripId: number, userId: number, albumId: string, albumName: string, passphrase?: string | null): Promise<number> {
  return insertRow(orm, TripAlbumLinks, {
    trip: tripId, user: userId, provider: 'immich', album_id: albumId, album_name: albumName,
    ...(passphrase !== undefined ? { passphrase } : {}),
  });
}

/** A journey photo row pointing at a trek photo, the way the journey gallery holds it. */
async function addToJourney(journeyId: number, photoId: number): Promise<void> {
  await insertRow(orm, JourneyPhotos, { journey: journeyId, photo: photoId, created_at: 0 });
}

/** Adds the user to the journey's contributors with the given role. */
async function addContributor(journeyId: number, userId: number, role: 'editor' | 'viewer'): Promise<void> {
  await insertRow(orm, JourneyContributors, { journey: journeyId, user: userId, role, added_at: 0 });
}

beforeAll(async () => {
  const t = await sharedTestOrm(testDb);
  orm = t;
  // Plan 4 Task 4: `DatabaseService` is gone — `MemoriesAccessService` is
  // fully repository-backed, so the `DatabaseService.prototype.canAccessTrip`
  // spy this block used to route to the real predicate is dead; removed
  // with it.
  access = new MemoriesAccessService(t.repo(TripPhotos), t.repo(TrekPhotos), t.repo(TripAlbumLinks), t.repo(Trips), t.repo(Journeys), t.repo(JourneyContributors), t.repo(JourneyPhotos));
});

beforeEach(() => {
  resetTestDb(testDb);
  mockSafeFetch.mockReset();
});

afterAll(() => {
  testDb.close();
});

// ── mapDbError ────────────────────────────────────────────────────────────────

describe('mapDbError', () => {
  it('MEM-HELPERS-001: returns 409 for unique constraint error', async () => {
    const err = new Error('UNIQUE constraint failed: users.email');
    const result = mapDbError(err, 'fallback');
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(409);
    expect(result.error.message).toBe('Resource already exists');
  });

  it('MEM-HELPERS-002: returns 409 for generic constraint error', async () => {
    const err = new Error('constraint violation');
    const result = mapDbError(err, 'fallback');
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(409);
  });

  it('MEM-HELPERS-003: returns 500 with original message for non-constraint error', async () => {
    const err = new Error('Something went wrong');
    const result = mapDbError(err, 'fallback');
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe('Something went wrong');
  });

  it('MEM-HELPERS-004: returns 500 for generic DB error', async () => {
    const err = new Error('disk I/O error');
    const result = mapDbError(err, 'fallback');
    expect(result.error.status).toBe(500);
  });
});

// ── getAlbumIdFromLink ────────────────────────────────────────────────────────

/**
 * The failure arm of a ServiceResult. The assertions below used to read
 * `result.error` through a `.bind` alias that typed the whole thing `any`; the
 * typed forwarder narrows properly instead of casting.
 */
function failureOf(result: ServiceResult<unknown>): { message: string; status: number } {
  if (!('error' in result)) throw new Error('expected a failing ServiceResult');
  return result.error;
}

describe('getAlbumIdFromLink', () => {
  it('MEM-HELPERS-005: returns 404 when trip access is denied', async () => {
    const result = await getAlbumIdFromLink('9999', 'link-1', 1);
    expect(result.success).toBe(false);
    expect(failureOf(result).status).toBe(404);
  });

  it('MEM-HELPERS-006: returns 404 when album link is not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = await getAlbumIdFromLink(String(trip.id), 'nonexistent-link', user.id);
    expect(result.success).toBe(false);
    expect(failureOf(result).status).toBe(404);
    expect(failureOf(result).message).toBe('Album link not found');
  });

  it('MEM-HELPERS-007: returns album_id when link exists', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Insert with auto-increment id (INTEGER PRIMARY KEY)
    const linkId = await insertAlbumLink(trip.id, user.id, 'album-123', 'My Album');

    const result = await getAlbumIdFromLink(String(trip.id), String(linkId), user.id);
    expect(result.success).toBe(true);
    expect((result as any).data).toBe('album-123');
  });
});

// ── pipeAsset ─────────────────────────────────────────────────────────────────

describe('pipeAsset', () => {
  function mockResponse(overrides: Record<string, any> = {}) {
    return {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      end: vi.fn(),
      json: vi.fn(),
      headersSent: false,
      ...overrides,
    } as any;
  }

  it('MEM-HELPERS-009: calls response.end() when resp.body is null', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: { get: vi.fn(() => null) },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/asset', res);

    expect(res.end).toHaveBeenCalled();
  });

  it('MEM-HELPERS-010: returns 400 when SsrfBlockedError is thrown', async () => {
    mockSafeFetch.mockRejectedValue(new SsrfBlockedError('SSRF blocked'));
    const res = mockResponse({ headersSent: false });

    await pipeAsset('https://internal.example.com/asset', res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('MEM-HELPERS-011: returns 500 for generic fetch error', async () => {
    mockSafeFetch.mockRejectedValue(new Error('Network error'));
    const res = mockResponse({ headersSent: false });

    await pipeAsset('https://example.com/asset', res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch asset' });
  });

  it('MEM-HELPERS-012: calls response.end() when headersSent is true on error', async () => {
    mockSafeFetch.mockRejectedValue(new Error('fail'));
    const res = mockResponse({ headersSent: true });

    await pipeAsset('https://example.com/asset', res);

    expect(res.end).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('MEM-HELPERS-013: sets content-type header when present in response', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: {
        get: (h: string) => {
          if (h === 'content-type') return 'image/jpeg';
          return null;
        },
      },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/img.jpg', res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.end).toHaveBeenCalled();
  });
});

// ── pipeAsset fetch options (#1611) ───────────────────────────────────────────

describe('pipeAsset fetch options (#1611)', () => {
  function mockResponse(overrides: Record<string, any> = {}) {
    return {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      end: vi.fn(),
      json: vi.fn(),
      headersSent: false,
      ...overrides,
    } as any;
  }

  it('MEM-HELPERS-021: forwards fetchOptions to safeFetch', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: { get: vi.fn(() => null) },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/asset', res, undefined, undefined, undefined, { rejectUnauthorized: false });

    expect(mockSafeFetch).toHaveBeenCalledWith(
      'https://example.com/asset',
      expect.anything(),
      { rejectUnauthorized: false, maxBytes: null },
    );
  });

  it('MEM-HELPERS-022: omitting fetchOptions only lifts the body cap, since the asset is streamed through', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: { get: vi.fn(() => null) },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/asset', res);

    expect(mockSafeFetch.mock.calls[0][2]).toEqual({ maxBytes: null });
  });

  it('MEM-HELPERS-023: logs the underlying error when responding 500', async () => {
    const boom = new Error('unable to verify the first certificate');
    mockSafeFetch.mockRejectedValue(boom);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockResponse({ headersSent: false });

    await pipeAsset('https://example.com/asset', res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(errorSpy).toHaveBeenCalledWith(expect.any(String), boom);
    errorSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// The access checks
//
// These decide who may fetch someone else's provider photo, and they had no
// cases at all — they sat outside the measured tree. A provider asset is
// reachable through a trip *or* a journey, which is why neither check can live
// in the trips or the journey domain alone, and why both need pinning here.
// ---------------------------------------------------------------------------

/** A trek_photos row plus the trip_photos link that shares it. */
async function shareInTrip(tripId: number, ownerId: number, assetId: string, provider = 'immich', shared = 1): Promise<number> {
  const photoId = await insertRow(orm, TrekPhotos, { provider, asset_id: assetId, owner: ownerId });
  await insertRow(orm, TripPhotos, { trip: tripId, photo: photoId, user: ownerId, shared });
  return photoId;
}

function makeJourney(userId: number): Promise<number> {
  return insertRow(orm, Journeys, { user: userId, title: 'J', status: 'draft', created_at: 0, updated_at: 0 });
}

describe('canAccessUserPhoto', () => {
  it('MEM-ACCESS-001: the owner always passes, with no lookup needed', async () => {
    expect(await access.canAccessUserPhoto(7, 7, '1', 'asset-1', 'immich')).toBe(true);
  });

  it('MEM-ACCESS-002: a trip member sees an asset shared into that trip', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb, { username: 'member' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: member.id });
    await shareInTrip(trip.id, owner.id, 'asset-shared');

    expect(await access.canAccessUserPhoto(member.id, owner.id, String(trip.id), 'asset-shared', 'immich')).toBe(true);
  });

  it('MEM-ACCESS-003: an unshared asset stays private even inside the same trip', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb, { username: 'member' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: member.id });
    await shareInTrip(trip.id, owner.id, 'asset-private', 'immich', 0);

    expect(await access.canAccessUserPhoto(member.id, owner.id, String(trip.id), 'asset-private', 'immich')).toBe(false);
  });

  it('MEM-ACCESS-004: a stranger is refused even for a shared asset', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb, { username: 'stranger' });
    const trip = createTrip(testDb, owner.id);
    await shareInTrip(trip.id, owner.id, 'asset-shared');

    expect(await access.canAccessUserPhoto(stranger.id, owner.id, String(trip.id), 'asset-shared', 'immich')).toBe(false);
  });

  it('MEM-ACCESS-005: the provider is part of the match — same asset id, other provider, no access', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb, { username: 'member' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: member.id });
    await shareInTrip(trip.id, owner.id, 'same-id', 'immich');

    expect(await access.canAccessUserPhoto(member.id, owner.id, String(trip.id), 'same-id', 'synologyphotos')).toBe(false);
  });

  it('MEM-ACCESS-006: tripId "0" routes through journeys — a contributor passes', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contributor } = createUser(testDb, { username: 'contrib' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'j-asset', owner: owner.id });
    await addToJourney(journeyId, photoId);
    await addContributor(journeyId, contributor.id, 'editor');

    expect(await access.canAccessUserPhoto(contributor.id, owner.id, '0', 'j-asset', 'immich')).toBe(true);
  });

  it('MEM-ACCESS-006b: tripId "0" — the journey OWNER (not the photo\'s own owner_id) passes via MA2\'s owner branch, not the trivial requestingUserId===ownerUserId shortcut', async () => {
    const { user: journeyOwner } = createUser(testDb, { username: 'journey-owner' });
    const { user: uploader } = createUser(testDb, { username: 'uploader-6b' });
    const journeyId = await makeJourney(journeyOwner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'j-asset-owner', owner: uploader.id });
    await addToJourney(journeyId, photoId);

    // requestingUserId (journeyOwner) !== ownerUserId (uploader) — MA1's read is
    // scoped to tkp.owner_id=uploader, so the trivial owner shortcut at the top
    // of canAccessUserPhoto never fires; access is decided by MA2's owner branch.
    expect(await access.canAccessUserPhoto(journeyOwner.id, uploader.id, '0', 'j-asset-owner', 'immich')).toBe(true);
  });

  it('MEM-ACCESS-006c: tripId "0" — a VIEWER-role contributor also passes (MA2 checks any role, not just editor)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb, { username: 'viewer-6c' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'j-asset-viewer', owner: owner.id });
    await addToJourney(journeyId, photoId);
    await addContributor(journeyId, viewer.id, 'viewer');

    expect(await access.canAccessUserPhoto(viewer.id, owner.id, '0', 'j-asset-viewer', 'immich')).toBe(true);
  });

  // M5b (task-5-review.md) — mutation M24 dropped `tkp.owner_id = ?` from
  // `JourneyPhotosRepository.findJourneyIdForAsset` (MA1) and every existing
  // test stayed green, because none put the SAME asset_id/provider under a
  // DIFFERENT trek_photos.owner_id than the `ownerUserId` the caller asks
  // about. Here the asset really is in a journey the requester (the journey
  // owner) could otherwise reach — but `ownerUserId` names someone who did
  // NOT upload it, so MA1's owner scope must refuse to resolve it. A dropped
  // scope would match on asset_id+provider alone, resolve the journey, and
  // MA2's owner-or-contributor check would then grant access wrongly.
  it('MEM-ACCESS-M5B: tripId "0" — same asset_id/provider exists in the journey but under a DIFFERENT owner_id (findJourneyIdForAsset owner scope)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: realUploader } = createUser(testDb, { username: 'real-uploader-m5b' });
    const { user: otherOwner } = createUser(testDb, { username: 'other-owner-m5b' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'm5b-shared-asset', owner: realUploader.id });
    await addToJourney(journeyId, photoId);

    // requestingUserId (owner) !== ownerUserId (otherOwner), so the trivial
    // shortcut does not fire; MA1 must refuse because otherOwner never
    // uploaded this asset.
    expect(await access.canAccessUserPhoto(owner.id, otherOwner.id, '0', 'm5b-shared-asset', 'immich')).toBe(false);
  });

  it('MEM-ACCESS-007: tripId "0" refuses someone with no journey link', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb, { username: 'stranger' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'j-asset-2', owner: owner.id });
    await addToJourney(journeyId, photoId);

    expect(await access.canAccessUserPhoto(stranger.id, owner.id, '0', 'j-asset-2', 'immich')).toBe(false);
  });

  it('MEM-ACCESS-008: tripId "0" refuses an asset that is in no journey at all', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    expect(await access.canAccessUserPhoto(other.id, owner.id, '0', 'not-in-any-journey', 'immich')).toBe(false);
  });
});

describe('canAccessTrekPhoto', () => {
  it('MEM-ACCESS-010: an unknown photo id is refused, not treated as public', async () => {
    expect(await access.canAccessTrekPhoto(1, 999999)).toBe(false);
  });

  it('MEM-ACCESS-011: the owner passes', async () => {
    const { user } = createUser(testDb);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'own', owner: user.id });

    expect(await access.canAccessTrekPhoto(user.id, photoId)).toBe(true);
  });

  it('MEM-ACCESS-012: a trip member passes for a shared photo, a stranger does not', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb, { username: 'member' });
    const { user: stranger } = createUser(testDb, { username: 'stranger' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: member.id });
    const photoId = await shareInTrip(trip.id, owner.id, 'trek-shared');

    expect(await access.canAccessTrekPhoto(member.id, photoId)).toBe(true);
    expect(await access.canAccessTrekPhoto(stranger.id, photoId)).toBe(false);
  });

  it('MEM-ACCESS-013: the trip owner passes without a trip_members row', async () => {
    const { user: owner } = createUser(testDb);
    const { user: uploader } = createUser(testDb, { username: 'uploader' });
    const trip = createTrip(testDb, owner.id);
    const photoId = await shareInTrip(trip.id, uploader.id, 'owner-path');

    expect(await access.canAccessTrekPhoto(owner.id, photoId)).toBe(true);
  });

  it('MEM-ACCESS-014: a journey contributor passes', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contributor } = createUser(testDb, { username: 'contrib' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'j-trek', owner: owner.id });
    await addToJourney(journeyId, photoId);
    await addContributor(journeyId, contributor.id, 'editor');

    expect(await access.canAccessTrekPhoto(contributor.id, photoId)).toBe(true);
  });

  it('MEM-ACCESS-014b: a VIEWER-role journey contributor also passes MA6\'s unified check (any role, not just editor)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb, { username: 'viewer-14b' });
    const { user: stranger } = createUser(testDb, { username: 'stranger-14b' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'j-trek-viewer', owner: owner.id });
    await addToJourney(journeyId, photoId);
    await addContributor(journeyId, viewer.id, 'viewer');

    expect(await access.canAccessTrekPhoto(viewer.id, photoId)).toBe(true);
    expect(await access.canAccessTrekPhoto(stranger.id, photoId)).toBe(false);
  });

  it('MEM-ACCESS-015: an ownerless local upload is reachable only through its journey', async () => {
    const { user: owner } = createUser(testDb);
    const { user: outsider } = createUser(testDb, { username: 'outsider' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'local', file_path: 'journey/x.jpg' });
    await addToJourney(journeyId, photoId);

    expect(await access.canAccessTrekPhoto(owner.id, photoId)).toBe(true);
    expect(await access.canAccessTrekPhoto(outsider.id, photoId)).toBe(false);
  });

  it('MEM-ACCESS-016: an ownerless local upload in no journey is reachable by nobody', async () => {
    const { user } = createUser(testDb);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'local', file_path: 'orphan.jpg' });

    expect(await access.canAccessTrekPhoto(user.id, photoId)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MA5 — canAccessTrekPhoto's trip-membership predicate, rewritten (R4) onto
// TripsRepository.findAccessible instead of a hand-translated second copy of
// the legacy `EXISTS(...trip_members...UNION ALL...trips...)` text. This
// parity suite proves the rewrite answers identically to the legacy text on
// the same rows across owner/member/stranger, and is mutation-proof-worthy
// per the plan's rule: MEMACCESS-MA5-003 is the one the report's mutation
// proof (temporarily breaking the `findAccessible` call) must turn red.
// ---------------------------------------------------------------------------

/** The MA5 statement, run raw for comparison — never converted, kept only as the oracle. */
function legacyMA5(photoId: number, userId: number): boolean {
  // test-sql-allow: the legacy statement is this parity test's oracle and has to run as written.
  return !!testDb.prepare(`
    SELECT 1 FROM trip_photos tp WHERE tp.photo_id = ? AND tp.shared = 1
      AND EXISTS (
        SELECT 1 FROM trip_members tm WHERE tm.trip_id = tp.trip_id AND tm.user_id = ?
        UNION ALL
        SELECT 1 FROM trips t WHERE t.id = tp.trip_id AND t.user_id = ?
      )
    LIMIT 1
  `).get(photoId, userId, userId);
}

describe('canAccessTrekPhoto — MA5 parity (TripsRepository.findAccessible rewrite vs. the legacy EXISTS/UNION ALL text)', () => {
  it('MEMACCESS-MA5-001: the trip owner (not the photo owner, no trip_members row) matches the legacy predicate — both true', async () => {
    const { user: photoOwner } = createUser(testDb);
    const { user: tripOwner } = createUser(testDb, { username: 'trip-owner' });
    const trip = createTrip(testDb, tripOwner.id);
    const photoId = await shareInTrip(trip.id, photoOwner.id, 'ma5-owner-asset');

    expect(await access.canAccessTrekPhoto(tripOwner.id, photoId)).toBe(legacyMA5(photoId, tripOwner.id));
    expect(await access.canAccessTrekPhoto(tripOwner.id, photoId)).toBe(true);
  });

  it('MEMACCESS-MA5-002: a trip member (a trip_members row, not the trip owner) matches the legacy predicate — both true', async () => {
    const { user: photoOwner } = createUser(testDb);
    const { user: tripOwner } = createUser(testDb, { username: 'trip-owner-2' });
    const { user: member } = createUser(testDb, { username: 'member-2' });
    const trip = createTrip(testDb, tripOwner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: member.id });
    const photoId = await shareInTrip(trip.id, photoOwner.id, 'ma5-member-asset');

    expect(await access.canAccessTrekPhoto(member.id, photoId)).toBe(legacyMA5(photoId, member.id));
    expect(await access.canAccessTrekPhoto(member.id, photoId)).toBe(true);
  });

  it('MEMACCESS-MA5-003: a stranger (neither owner nor member) matches the legacy predicate — both false. Mutation proof: breaking the findAccessible call (e.g. hard-coding it to return undefined) turns this red.', async () => {
    const { user: photoOwner } = createUser(testDb);
    const { user: tripOwner } = createUser(testDb, { username: 'trip-owner-3' });
    const { user: stranger } = createUser(testDb, { username: 'stranger-3' });
    const trip = createTrip(testDb, tripOwner.id);
    const photoId = await shareInTrip(trip.id, photoOwner.id, 'ma5-stranger-asset');

    expect(await access.canAccessTrekPhoto(stranger.id, photoId)).toBe(legacyMA5(photoId, stranger.id));
    expect(await access.canAccessTrekPhoto(stranger.id, photoId)).toBe(false);
  });

  it('MEMACCESS-MA5-004: an unshared trip_photos row (shared=0) matches the legacy predicate — both false even for the trip owner', async () => {
    const { user: photoOwner } = createUser(testDb);
    const { user: tripOwner } = createUser(testDb, { username: 'trip-owner-4' });
    const trip = createTrip(testDb, tripOwner.id);
    const photoId = await shareInTrip(trip.id, photoOwner.id, 'ma5-unshared-asset', 'immich', 0);

    expect(await access.canAccessTrekPhoto(tripOwner.id, photoId)).toBe(legacyMA5(photoId, tripOwner.id));
    expect(await access.canAccessTrekPhoto(tripOwner.id, photoId)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MA1/MA2/MA6 — the journey half of the cross-domain photo-access checks
// (Plan 3g Task 4), onto `JourneysRepository.isOwnedByUser`/
// `JourneyContributorsRepository.existsForUser` via the private
// `ownerOrContributor` helper. MEM-ACCESS-006/006b/006c/014/014b above
// already cover owner (006b), editor (006/014) and viewer (006c/014b)
// contributors passing, and MEM-ACCESS-007/008/016 cover a stranger/no-link
// case refused — this block is the explicit mutation-proof line item the
// plan's "security-critical" flag on these three sites calls for.
//
// Mutation proof (performed once by hand, not run in CI): editing
// `MemoriesAccessService.ownerOrContributor` from
//   `if (await this.journeys.isOwnedByUser(...)) return true; return await
//   this.journeyContributors.existsForUser(...);`
// to an AND (`return (await this.journeys.isOwnedByUser(...)) &&
// (await this.journeyContributors.existsForUser(...));`) — collapsing the
// owner-OR-contributor union into an owner-AND-contributor intersection —
// turns MEM-ACCESS-006 (an editor who is NOT also the owner) and
// MEM-ACCESS-006c (a viewer who is NOT also the owner) red: both contributors
// incorrectly lose access, since neither is also a row in `journeys` for that
// id. MEM-ACCESS-006b (the journey owner, who has no `journey_contributors`
// row of their own reachable through this photo's read) would ALSO go red
// under the same mutation. Confirmed by hand; the fix is reverted here.
// ---------------------------------------------------------------------------

describe('canAccessUserPhoto/canAccessTrekPhoto — MA1/MA2/MA6 mutation-proof coverage', () => {
  it('MEMACCESS-MA2-001: an editor who is not the journey owner still passes (breaks under an owner-AND-contributor mutation)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb, { username: 'ma2-editor' });
    const journeyId = await makeJourney(owner.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'ma2-editor-asset', owner: owner.id });
    await addToJourney(journeyId, photoId);
    await addContributor(journeyId, editor.id, 'editor');

    expect(await access.canAccessUserPhoto(editor.id, owner.id, '0', 'ma2-editor-asset', 'immich')).toBe(true);
    expect(await access.canAccessTrekPhoto(editor.id, photoId)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Album link syncing — MA7/MA8 (getAlbumIdFromLink/getAlbumLinkForSync, one
// shared `findScoped` repository method) and MA9 (updateSyncTimeForAlbumLink).
// ---------------------------------------------------------------------------

describe('getAlbumLinkForSync (MA8)', () => {
  it('MEMACCESS-MA8-001: returns the album id and decrypted passphrase when the link exists', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const linkId = await insertAlbumLink(trip.id, user.id, 'album-sync-1', 'Sync Album', null);

    const result = await access.getAlbumLinkForSync(String(trip.id), String(linkId), user.id);
    expect(result.success).toBe(true);
    expect((result as { data: { albumId: string } }).data.albumId).toBe('album-sync-1');
  });

  it('MEMACCESS-MA8-002: is USER-scoped — a different user on the same trip gets "not found", not another user\'s link', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other-link-user' });
    const trip = createTrip(testDb, owner.id);
    await insertRow(orm, TripMembers, { trip: trip.id, user: other.id });
    const linkId = await insertAlbumLink(trip.id, owner.id, 'album-scoped', 'Scoped');

    const result = await access.getAlbumLinkForSync(String(trip.id), String(linkId), other.id);
    expect(result.success).toBe(false);
  });

  it('MEMACCESS-MA8-003: a non-canonical link id (rule 15) answers the same "not found" as a genuinely missing link', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = await access.getAlbumLinkForSync(String(trip.id), '1.0', user.id);
    expect(result.success).toBe(false);
  });
});

describe('updateSyncTimeForAlbumLink (MA9)', () => {
  it('MEMACCESS-MA9-001: stamps last_synced_at on the given link', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const linkId = await insertAlbumLink(trip.id, user.id, 'album-touch', 'Touch');

    await access.updateSyncTimeForAlbumLink(String(linkId));

    const row = await findRow(orm, TripAlbumLinks, { id: linkId });
    expect(row).not.toBeNull();
    expect(row!.last_synced_at).not.toBeNull();
  });

  it('MEMACCESS-MA9-002: a non-canonical id is a silent no-op, matching a legacy UPDATE that matched zero rows', async () => {
    await expect(access.updateSyncTimeForAlbumLink('not-a-number')).resolves.toBeUndefined();
  });
});
