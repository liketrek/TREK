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
import {
  countRows,
  findRow,
  findRows,
  insertRow,
  insertRowIgnoringConflict,
  updateRows,
} from '../../helpers/factories/rows';
import { notificationsStub } from '../../helpers/notifications';
import { createTestAddonsService } from '../../helpers/test-addons';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import type { TestOrm } from '../../helpers/test-orm';
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
  };
  return mock;
});

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
  orm = t;
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

beforeEach(async () => {
  resetTestDb(testDb);
  // Ensure default providers are enabled (resetTestDb seeds them but doesn't reset enabled flag)
  await updateRows(orm, PhotoProviders, {}, { enabled: 1 });
  // Providers only count as enabled under an enabled journey addon (migration 84 seeds it off).
  setAddonEnabled(testDb, ADDON_IDS.JOURNEY, true);
  realtimeMock.broadcast.mockClear();
});

afterAll(() => {
  testDb.close();
});

let orm: TestOrm;

/** The ids of the providers switched on, the list the legacy statements bind into their IN (...). */
async function enabledProviderIds(): Promise<string[]> {
  return (await findRows(orm, PhotoProviders, { enabled: 1 })).map((r) => r.id as string);
}

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
    await updateRows(orm, PhotoProviders, {}, { enabled: 0 });

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

    await updateRows(orm, PhotoProviders, {}, { enabled: 0 });

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
    await insertRowIgnoringConflict(orm, PhotoProviders, {
      id: 'disabled-prov',
      name: 'Disabled',
      description: 'Disabled provider',
      icon: 'Image',
      enabled: 0,
      sort_order: 99,
    });

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

describe('addTripPhotos is atomic per photo', () => {
  it('MEM-UNIFIED-007b: the photo row and its trip link are one write: a failing link leaves no photo row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await insertRowIgnoringConflict(orm, PhotoProviders, {
      id: 'tx-prov',
      name: 'Tx',
      description: 'Tx provider',
      icon: 'Image',
      enabled: 1,
      sort_order: 98,
    });
    const spy = vi.spyOn(tripPhotosRepo, 'insertIgnore').mockRejectedValueOnce(new Error('disk full'));

    const result = await addTripPhotos(
      String(trip.id),
      user.id,
      false,
      [{ provider: 'tx-prov', asset_ids: ['asset-tx'] }],
      'sid',
    );

    expect(result.success).toBe(false);
    expect(await findRows(orm, TrekPhotos, { asset_id: 'asset-tx' })).toEqual([]);
    spy.mockRestore();
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

    await insertRowIgnoringConflict(orm, PhotoProviders, {
      id: 'disabled-prov2',
      name: 'Disabled2',
      description: 'desc',
      icon: 'Image',
      enabled: 0,
      sort_order: 100,
    });

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

    expect(await countRows(orm, TripAlbumLinks, { trip: trip.id, user: user.id })).toBe(1);
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
    const linkRow = await findRow(orm, TripAlbumLinks, { trip: trip.id, user: user.id, album_id: 'album-rm-1' });
    if (!linkRow) throw new Error('album link album-rm-1 was not created');

    await addTripPhotos(
      String(trip.id),
      user.id,
      true,
      [{ provider: 'immich', asset_ids: ['asset-rm-1'] }],
      'sid-6',
      String(linkRow.id),
    );
    const photoRow = await findRow(orm, TripPhotos, { trip: trip.id, albumLink: linkRow.id });
    expect(photoRow).not.toBeNull();

    const result = await removeAlbumLink(String(trip.id), String(linkRow.id), user.id);
    expect(result.success).toBe(true);

    const remainingLink = await findRow(orm, TripAlbumLinks, { id: linkRow.id });
    expect(remainingLink).toBeNull();
    const remainingPhoto = await findRow(orm, TripPhotos, { trip: trip.id, albumLink: linkRow.id });
    expect(remainingPhoto).toBeNull();
    // The orphaned trek_photos row is reclaimed too (TrekPhotoRegistrationService.deleteIfOrphan, PH10/PH11).
    const orphan = await findRow(orm, TrekPhotos, { id: photoRow?.photo_id });
    expect(orphan).toBeNull();
  });
});

// ── UM2/UM3 parity — full-key toEqual against the legacy statement run raw ────

describe('listTripPhotos / listTripAlbumLinks — parity', () => {
  it('PARITY-UM2: matches the legacy join, enabled/disabled providers mixed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // A photo under a disabled provider must not appear — the legacy `tkp.provider IN (...)`
    // only ever names the enabled set.
    await insertRowIgnoringConflict(orm, PhotoProviders, {
      id: 'disabled-x',
      name: 'Disabled X',
      description: 'desc',
      icon: 'Image',
      enabled: 0,
      sort_order: 50,
    });

    const enabledPhoto = await insertRow(orm, TrekPhotos, {
      provider: 'immich',
      asset_id: 'asset-enabled',
      owner: user.id,
    });
    const disabledPhoto = await insertRow(orm, TrekPhotos, {
      provider: 'disabled-x',
      asset_id: 'asset-disabled',
      owner: user.id,
    });

    await insertRow(orm, TripPhotos, { trip: trip.id, user: user.id, photo: enabledPhoto, shared: 1 });
    await insertRow(orm, TripPhotos, { trip: trip.id, user: user.id, photo: disabledPhoto, shared: 1 });

    const enabledProviders = await enabledProviderIds();
    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
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

    const enabledProviders = await enabledProviderIds();
    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
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
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'asset-r8-2', owner: user.id });
    await insertRow(orm, TripPhotos, { trip: trip.id, user: user.id, photo: photoId, shared: 0 });

    const result = await setTripPhotoSharing(String(trip.id), user.id, photoId, true, 'sid-2');

    expect(result.success).toBe(true);
    expect(realtimeMock.broadcast).toHaveBeenCalledTimes(1);
    expect(realtimeMock.broadcast).toHaveBeenCalledWith(
      String(trip.id),
      'memories:updated',
      { userId: user.id },
      'sid-2',
    );
    const row = await findRow(orm, TripPhotos, { trip: trip.id, user: user.id, photo: photoId });
    expect(row?.shared).toBe(1);
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

    expect(await countRows(orm, TripPhotos, { trip: trip.id, user: user.id })).toBe(1);
  });

  it('MEM-UNIFIED-017: removeTripPhoto calls this.realtime.broadcast and deletes the row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const photoId = await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'asset-r8-3', owner: user.id });
    await insertRow(orm, TripPhotos, { trip: trip.id, user: user.id, photo: photoId, shared: 0 });

    const result = await removeTripPhoto(String(trip.id), user.id, photoId, 'sid-3');

    expect(result.success).toBe(true);
    expect(realtimeMock.broadcast).toHaveBeenCalledTimes(1);
    expect(realtimeMock.broadcast).toHaveBeenCalledWith(
      String(trip.id),
      'memories:updated',
      { userId: user.id },
      'sid-3',
    );
    const row = await findRow(orm, TripPhotos, { trip: trip.id, user: user.id, photo: photoId });
    expect(row).toBeNull();
  });
});
