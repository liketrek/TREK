/**
 * Unit tests for UnifiedMemoriesService — MEM-UNIFIED-001 to MEM-UNIFIED-010.
 * Moved 1:1 with the fold; the free functions became methods.
 * Covers error paths: access denied, disabled provider, no providers enabled.
 */
import { ADDON_IDS } from '../../../src/addons';
import { db as testDb } from '../../../src/db/database';
import { JourneyContributors } from '../../../src/db/entities/JourneyContributors.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { PhotoProviders } from '../../../src/db/entities/PhotoProviders.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripAlbumLinks } from '../../../src/db/entities/TripAlbumLinks.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import type { TripAlbumLinksRepository } from '../../../src/db/repositories/TripAlbumLinks.repository';
import type { TripPhotosRepository } from '../../../src/db/repositories/TripPhotos.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { ImmichService } from '../../../src/nest/memories/immich.service';
import { MemoriesAccessService } from '../../../src/nest/memories/memories-access.service';
import type { ServiceResult } from '../../../src/nest/memories/memories.helpers';
import type { SynologyService } from '../../../src/nest/memories/synology.service';
import { UnifiedMemoriesService } from '../../../src/nest/memories/unified-memories.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createUser, createTrip } from '../../helpers/factories';
import { notificationsStub } from '../../helpers/notifications';
import { createTestAddonsService } from '../../helpers/test-addons';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import { createTestUnitOfWork, sharedTestOrm, createTestUsersRepo } from '../../helpers/test-uow';

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
    canAccessTrip: (tripId: any, userId: number) =>
      db
        .prepare(
          `
        SELECT t.id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `,
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return mock;
});

vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

// The album-sync paths are the providers' half and have their own suites; these
// cases never reach them, so stubs keep the graph small.
let svc: UnifiedMemoriesService;
const realtimeMock = { broadcast: vi.fn() };
let tripPhotosRepo: TripPhotosRepository;
let tripAlbumLinksRepo: TripAlbumLinksRepository;
let usersRepo: UsersRepository;

// Narrows the `ServiceResult` discriminated union without an `as any` cast —
// used by the new (Task 7) cases below only; the pre-existing cases above
// keep their original `(result as any)` shape unchanged.
function expectFailure<T>(result: ServiceResult<T>): { message: string; status: number } {
  // `'error' in result`, not `result.success` — discriminant narrowing over a
  // union with a generic member (`{ success: true; data: T }`) doesn't
  // resolve here (a TS control-flow limitation on generic discriminated
  // unions); `in` narrows correctly, the same idiom `handleServiceResult`
  // (`memories.helpers.ts`) already uses.
  if (!('error' in result)) throw new Error('expected a ServiceResult failure, got success');
  return result.error;
}
function expectSuccess<T>(result: ServiceResult<T>): T {
  if ('error' in result) throw new Error(`expected a ServiceResult success, got: ${result.error.message}`);
  return result.data;
}

// Legacy free-function names forwarding to the service, so the moved cases read
// as before. Typed forwarders rather than `.bind` aliases: a bound alias is
// typed `any`, which hides a missing `await` from tsc and from all three lint
// rules now that these methods are async.
type Svc = UnifiedMemoriesService;
const listTripPhotos = (...a: Parameters<Svc['listTripPhotos']>) => svc.listTripPhotos(...a);
const listTripAlbumLinks = (...a: Parameters<Svc['listTripAlbumLinks']>) => svc.listTripAlbumLinks(...a);
const addTripPhotos = (...a: Parameters<Svc['addTripPhotos']>) => svc.addTripPhotos(...a);
const setTripPhotoSharing = (...a: Parameters<Svc['setTripPhotoSharing']>) => svc.setTripPhotoSharing(...a);
const removeTripPhoto = (...a: Parameters<Svc['removeTripPhoto']>) => svc.removeTripPhoto(...a);
const createTripAlbumLink = (...a: Parameters<Svc['createTripAlbumLink']>) => svc.createTripAlbumLink(...a);
const removeAlbumLink = (...a: Parameters<Svc['removeAlbumLink']>) => svc.removeAlbumLink(...a);

beforeAll(async () => {
  // Plan 4 Task 4: `DatabaseService` is gone — `UnifiedMemoriesService`
  // never read it, so the `dbs.canAccessTrip` spy this block used to route
  // to a real `DatabaseService` was already dead; removed with it.
  const t = await sharedTestOrm(testDb);
  tripPhotosRepo = t.repo(TripPhotos);
  tripAlbumLinksRepo = t.repo(TripAlbumLinks);
  usersRepo = await createTestUsersRepo(testDb);
  svc = new UnifiedMemoriesService(
    new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), t.repo(JourneyPhotos)),
    {} as ImmichService,
    {} as SynologyService,
    new MemoriesAccessService(
      t.repo(TripPhotos),
      t.repo(TrekPhotos),
      t.repo(TripAlbumLinks),
      t.repo(Trips),
      t.repo(Journeys),
      t.repo(JourneyContributors),
      t.repo(JourneyPhotos),
    ),
    notificationsStub(),
    await createTestAddonsService(testDb),
    await createTestUnitOfWork(testDb),
    realtimeMock as unknown as RealtimeService,
    t.repo(PhotoProviders),
    tripPhotosRepo,
    tripAlbumLinksRepo,
    usersRepo,
    t.repo(Trips),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  // Ensure default providers are enabled (resetTestDb seeds them but doesn't reset enabled flag)
  testDb.prepare('UPDATE photo_providers SET enabled = 1').run();
  // Providers only count as enabled under an enabled journey addon (migration 84 seeds it off).
  setAddonEnabled(testDb, ADDON_IDS.JOURNEY, true);
  realtimeMock.broadcast.mockClear();
});

afterAll(() => {
  testDb.close();
});

// ── listTripPhotos ────────────────────────────────────────────────────────────

describe('listTripPhotos', () => {
  it('MEM-UNIFIED-001: returns 404 when user cannot access trip', async () => {
    const result = await listTripPhotos('9999', 1);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(404);
  });

  it('MEM-UNIFIED-002: returns 400 when no photo providers are enabled', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Disable all providers
    testDb.prepare('UPDATE photo_providers SET enabled = 0').run();

    const result = await listTripPhotos(String(trip.id), user.id);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(400);
    expect((result as any).error.message).toMatch(/no photo providers enabled/i);
  });

  it('MEM-UNIFIED-013: treats enabled providers as disabled while the journey addon is off', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    setAddonEnabled(testDb, ADDON_IDS.JOURNEY, false);

    const result = await listTripPhotos(String(trip.id), user.id);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(400);
    expect((result as any).error.message).toMatch(/no photo providers enabled/i);
  });
});

// ── listTripAlbumLinks ────────────────────────────────────────────────────────

describe('listTripAlbumLinks', () => {
  it('MEM-UNIFIED-003: returns 404 when user cannot access trip', async () => {
    const result = await listTripAlbumLinks('9999', 1);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(404);
  });

  it('MEM-UNIFIED-004: returns 400 when no photo providers are enabled', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    testDb.prepare('UPDATE photo_providers SET enabled = 0').run();

    const result = await listTripAlbumLinks(String(trip.id), user.id);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(400);
  });
});

// ── addTripPhotos ─────────────────────────────────────────────────────────────

describe('addTripPhotos', () => {
  it('MEM-UNIFIED-005: returns 404 when user cannot access trip', async () => {
    const result = await addTripPhotos('9999', 1, false, [{ provider: 'immich', asset_ids: ['a1'] }], 'sid');
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(404);
  });

  it('MEM-UNIFIED-006: returns 400 when provider is found but disabled (covers line 25)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Insert a disabled provider
    testDb
      .prepare(
        'INSERT OR IGNORE INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run('disabled-prov', 'Disabled', 'Disabled provider', 'Image', 0, 99);

    const result = await addTripPhotos(
      String(trip.id),
      user.id,
      false,
      [{ provider: 'disabled-prov', asset_ids: ['asset-x'] }],
      'sid',
    );

    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(400);
    expect((result as any).error.message).toMatch(/not enabled/i);
  });

  it('MEM-UNIFIED-007: returns 400 when provider is not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = await addTripPhotos(
      String(trip.id),
      user.id,
      false,
      [{ provider: 'nonexistent-provider', asset_ids: ['asset-x'] }],
      'sid',
    );

    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(400);
    expect((result as any).error.message).toMatch(/not supported/i);
  });
});

// ── setTripPhotoSharing ───────────────────────────────────────────────────────

describe('setTripPhotoSharing', () => {
  it('MEM-UNIFIED-008: returns 404 when user cannot access trip', async () => {
    const result = await setTripPhotoSharing('9999', 1, 1, true);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(404);
  });
});

// ── removeTripPhoto ───────────────────────────────────────────────────────────

describe('removeTripPhoto', () => {
  it('MEM-UNIFIED-009: returns 404 when user cannot access trip', async () => {
    const result = await removeTripPhoto('9999', 1, 1);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(404);
  });
});

// ── createTripAlbumLink ───────────────────────────────────────────────────────

describe('createTripAlbumLink', () => {
  it('MEM-UNIFIED-010: returns 404 when user cannot access trip', async () => {
    const result = await createTripAlbumLink('9999', 1, 'immich', 'album-1', 'My Album');
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(404);
  });

  it('MEM-UNIFIED-011: returns 400 when provider is disabled', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    testDb
      .prepare(
        'INSERT OR IGNORE INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run('disabled-prov2', 'Disabled2', 'desc', 'Image', 0, 100);

    const result = await createTripAlbumLink(String(trip.id), user.id, 'disabled-prov2', 'album-1', 'My Album');
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(400);
  });

  it('MEM-UNIFIED-019: UM7 insertIgnore reports the 409 "already linked" on a re-link (duplicate-ignore, not a crash)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const first = await createTripAlbumLink(String(trip.id), user.id, 'immich', 'album-dup-1', 'First Name');
    expectSuccess(first);

    const second = await createTripAlbumLink(String(trip.id), user.id, 'immich', 'album-dup-1', 'Second Name');
    expect(expectFailure(second).status).toBe(409);

    const rows = testDb
      .prepare('SELECT COUNT(*) as c FROM trip_album_links WHERE trip_id = ? AND user_id = ?')
      .get(trip.id, user.id) as { c: number };
    expect(rows.c).toBe(1);
  });
});

// ── removeAlbumLink ───────────────────────────────────────────────────────────

describe('removeAlbumLink', () => {
  it('MEM-UNIFIED-012: returns 404 when user cannot access trip', async () => {
    const result = await removeAlbumLink('9999', '1', 1);
    expect(result.success).toBe(false);
    expect((result as any).error.status).toBe(404);
  });

  it('MEM-UNIFIED-020: UM8/UM9/UM10 — the transaction removes the link and every trip_photos row it owned', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const linked = await createTripAlbumLink(String(trip.id), user.id, 'immich', 'album-rm-1', 'To Remove');
    expect(linked.success).toBe(true);
    const linkRow = testDb
      .prepare('SELECT id FROM trip_album_links WHERE trip_id = ? AND user_id = ? AND album_id = ?')
      .get(trip.id, user.id, 'album-rm-1') as { id: number };

    await addTripPhotos(
      String(trip.id),
      user.id,
      true,
      [{ provider: 'immich', asset_ids: ['asset-rm-1'] }],
      'sid-6',
      String(linkRow.id),
    );
    const photoRow = testDb
      .prepare('SELECT photo_id FROM trip_photos WHERE trip_id = ? AND album_link_id = ?')
      .get(trip.id, linkRow.id) as { photo_id: number };
    expect(photoRow).toBeDefined();

    const result = await removeAlbumLink(String(trip.id), String(linkRow.id), user.id);
    expect(result.success).toBe(true);

    const remainingLink = testDb.prepare('SELECT * FROM trip_album_links WHERE id = ?').get(linkRow.id);
    expect(remainingLink).toBeUndefined();
    const remainingPhoto = testDb
      .prepare('SELECT * FROM trip_photos WHERE trip_id = ? AND album_link_id = ?')
      .get(trip.id, linkRow.id);
    expect(remainingPhoto).toBeUndefined();
    // The orphaned trek_photos row is reclaimed too (TrekPhotoRegistrationService.deleteIfOrphan, PH10/PH11).
    const orphan = testDb.prepare('SELECT * FROM trek_photos WHERE id = ?').get(photoRow.photo_id);
    expect(orphan).toBeUndefined();
  });
});

// ── UM2/UM3 parity — full-key toEqual against the legacy statement run raw ────

describe('listTripPhotos / listTripAlbumLinks — parity', () => {
  it('PARITY-UM2: matches the legacy join, enabled/disabled providers mixed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // A photo under a disabled provider must not appear — the legacy `tkp.provider IN (...)`
    // only ever names the enabled set.
    testDb
      .prepare(
        'INSERT OR IGNORE INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, 0, 50)',
      )
      .run('disabled-x', 'Disabled X', 'desc', 'Image');

    const enabledPhoto = testDb
      .prepare('INSERT INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)')
      .run('immich', 'asset-enabled', user.id).lastInsertRowid as number;
    const disabledPhoto = testDb
      .prepare('INSERT INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)')
      .run('disabled-x', 'asset-disabled', user.id).lastInsertRowid as number;

    testDb
      .prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)')
      .run(trip.id, user.id, enabledPhoto);
    testDb
      .prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)')
      .run(trip.id, user.id, disabledPhoto);

    const enabledProviders = testDb
      .prepare('SELECT id FROM photo_providers WHERE enabled = 1')
      .all()
      .map((r: { id: string }) => r.id);
    const oracle = testDb
      .prepare(
        `
      SELECT tp.photo_id, tkp.asset_id, tkp.provider, tp.user_id, tp.shared, tp.added_at,
             u.username, u.avatar
      FROM trip_photos tp
      JOIN trek_photos tkp ON tkp.id = tp.photo_id
      JOIN users u ON tp.user_id = u.id
      WHERE tp.trip_id = ?
        AND (tp.user_id = ? OR tp.shared = 1)
        AND tkp.provider IN (${enabledProviders.map(() => '?').join(',')})
      ORDER BY tp.added_at ASC
    `,
      )
      .all(trip.id, user.id, ...enabledProviders);

    const result = await listTripPhotos(String(trip.id), user.id);
    const data = expectSuccess(result);
    expect(data).toEqual(oracle);
    expect(data.some((r: { provider: string }) => r.provider === 'disabled-x')).toBe(false);
  });

  it('PARITY-UM3: matches the legacy join for an album link with a passphrase', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await createTripAlbumLink(
      String(trip.id),
      user.id,
      'synologyphotos',
      'album-p1',
      'Passphrase Album',
      'secret-pass',
    );

    const enabledProviders = testDb
      .prepare('SELECT id FROM photo_providers WHERE enabled = 1')
      .all()
      .map((r: { id: string }) => r.id);
    const oracle = testDb
      .prepare(
        `
      SELECT tal.id,
             tal.trip_id,
             tal.user_id,
             tal.provider,
             tal.album_id,
             tal.album_name,
             tal.sync_enabled,
             tal.last_synced_at,
             tal.created_at,
             u.username
      FROM trip_album_links tal
      JOIN users u ON tal.user_id = u.id
      WHERE tal.trip_id = ?
        AND tal.provider IN (${enabledProviders.map(() => '?').join(',')})
      ORDER BY tal.created_at ASC
    `,
      )
      .all(trip.id, ...enabledProviders);

    const result = await listTripAlbumLinks(String(trip.id), user.id);
    const data = expectSuccess(result);
    expect(data).toEqual(oracle);
    // The passphrase column round-trips through the repository encrypted, same
    // as it always was — not part of this listing's SELECT list either way.
    expect(data[0].album_id).toBe('album-p1');
  });
});

// ── Access-check mutation proof — a non-member (not "trip missing") ───────────

describe('access check — non-member refusal', () => {
  it('MEM-UNIFIED-014: a real trip, a real non-member user, still 404s (red if the gate is loosened)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const result = await listTripPhotos(String(trip.id), stranger.id);
    expect(expectFailure(result).status).toBe(404);
  });
});

// ── R8 — RealtimeService.broadcast pins ────────────────────────────────────────

describe('R8 — injected RealtimeService, not the legacy module broadcast', () => {
  it('MEM-UNIFIED-015: addTripPhotos calls this.realtime.broadcast with the exact legacy event/payload/arity', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = await addTripPhotos(
      String(trip.id),
      user.id,
      false,
      [{ provider: 'immich', asset_ids: ['asset-r8-1'] }],
      'sid-1',
    );

    expect(expectSuccess(result).added).toBe(1);
    expect(realtimeMock.broadcast).toHaveBeenCalledTimes(1);
    expect(realtimeMock.broadcast).toHaveBeenCalledWith(
      String(trip.id),
      'memories:updated',
      { userId: user.id },
      'sid-1',
    );
  });

  it('MEM-UNIFIED-016: setTripPhotoSharing calls this.realtime.broadcast', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const photoId = testDb
      .prepare('INSERT INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)')
      .run('immich', 'asset-r8-2', user.id).lastInsertRowid as number;
    testDb
      .prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 0)')
      .run(trip.id, user.id, photoId);

    const result = await setTripPhotoSharing(String(trip.id), user.id, photoId, true, 'sid-2');

    expect(result.success).toBe(true);
    expect(realtimeMock.broadcast).toHaveBeenCalledTimes(1);
    expect(realtimeMock.broadcast).toHaveBeenCalledWith(
      String(trip.id),
      'memories:updated',
      { userId: user.id },
      'sid-2',
    );
    const row = testDb
      .prepare('SELECT shared FROM trip_photos WHERE trip_id = ? AND user_id = ? AND photo_id = ?')
      .get(trip.id, user.id, photoId) as { shared: number };
    expect(row.shared).toBe(1);
  });

  it('MEM-UNIFIED-018: UM4 insertIgnore reports 0 added on a re-add of the same photo (duplicate-ignore, not a crash)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const first = await addTripPhotos(
      String(trip.id),
      user.id,
      false,
      [{ provider: 'immich', asset_ids: ['asset-dup-1'] }],
      'sid-4',
    );
    expect(expectSuccess(first).added).toBe(1);
    realtimeMock.broadcast.mockClear();

    const second = await addTripPhotos(
      String(trip.id),
      user.id,
      false,
      [{ provider: 'immich', asset_ids: ['asset-dup-1'] }],
      'sid-5',
    );
    expect(expectSuccess(second).added).toBe(0);

    const rows = testDb
      .prepare('SELECT COUNT(*) as c FROM trip_photos WHERE trip_id = ? AND user_id = ?')
      .get(trip.id, user.id) as { c: number };
    expect(rows.c).toBe(1);
  });

  it('MEM-UNIFIED-017: removeTripPhoto calls this.realtime.broadcast and deletes the row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const photoId = testDb
      .prepare('INSERT INTO trek_photos (provider, asset_id, owner_id) VALUES (?, ?, ?)')
      .run('immich', 'asset-r8-3', user.id).lastInsertRowid as number;
    testDb
      .prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 0)')
      .run(trip.id, user.id, photoId);

    const result = await removeTripPhoto(String(trip.id), user.id, photoId, 'sid-3');

    expect(result.success).toBe(true);
    expect(realtimeMock.broadcast).toHaveBeenCalledTimes(1);
    expect(realtimeMock.broadcast).toHaveBeenCalledWith(
      String(trip.id),
      'memories:updated',
      { userId: user.id },
      'sid-3',
    );
    const row = testDb
      .prepare('SELECT * FROM trip_photos WHERE trip_id = ? AND user_id = ? AND photo_id = ?')
      .get(trip.id, user.id, photoId);
    expect(row).toBeUndefined();
  });
});
