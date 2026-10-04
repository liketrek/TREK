/**
 * Unit tests for JourneyShareService — JOURNEY-SHARE-001 through JOURNEY-SHARE-018.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// -- DB setup -----------------------------------------------------------------

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
    return mock;
});


vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createJourney, createJourneyEntry, addJourneyContributor } from '../../helpers/factories';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { JourneyShareService } from '../../../src/nest/journey/journey-share.service';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { db as dbConn } from '../../../src/db/database';
import { sharedTestOrm, createTestUnitOfWork, createTestAppSettingsRepo, createTestSettingsRepo, createTestTripsRepo, createTestPlacesRepo } from '../../helpers/test-uow';
import type { TestOrm } from '../../helpers/test-orm';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { createTestJourneyShareTokensRepo } from '../../helpers/journey-share-repos';
import type { JourneyPublicGalleryRow, JourneyShareTokensRepository } from '../../../src/db/repositories/JourneyShareTokens.repository';
import type { JourneyEntriesRepository } from '../../../src/db/repositories/JourneyEntries.repository';
import type { JourneyEntryPhotosRepository } from '../../../src/db/repositories/JourneyEntryPhotos.repository';
import { GALLERY_CHRONOLOGICAL_ORDER } from '../../../src/nest/journey/journey-gallery-order';

let svc: JourneyShareService;
let t: TestOrm;

// `t`, `uow` and the settings repositories all derive from the SAME
// `sharedTestOrm(testDb)` (task-2-review.md I2) — see settings.service.test.ts's
// own comment on this pattern for why a second, independent `createTestOrm`
// call here would be unsafe once `SettingsService`'s writes go through
// `uow.transactional(...)`.
beforeAll(async () => {
  const uow = await createTestUnitOfWork(testDb);
  t = await sharedTestOrm(testDb);
  const journeysRepo = await createTestJourneysRepo(testDb);
  svc = new JourneyShareService(
    new JourneyDomainService(
      new RealtimeService(), new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)), uow,
      journeysRepo, await createTestJourneyContributorsRepo(testDb),
      await createTestJourneyTripsRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestTripsRepo(testDb),
      // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
      await createTestJourneyPhotosRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb), await createTestPlacesRepo(testDb),
    ),
    new SettingsService(uow, await createTestAppSettingsRepo(testDb), await createTestSettingsRepo(testDb)),
    // Plan 3g Task 3: JourneyShareTokensRepository (JS1-JS15) + the
    // already-built JourneysRepository (JS8/JS12), same instance the domain
    // service above uses.
    await createTestJourneyShareTokensRepo(testDb), journeysRepo,
    // task-5-fix-brief constructor-ripple: `UnitOfWork` (L1's transactional
    // create/update) + `JourneyPhotosRepository` (L2's `galleryRead` reuse).
    uow, await createTestJourneyPhotosRepo(testDb),
    // Plan 4 Task 8b constructor-ripple: `JourneyEntriesRepository` (JS13) +
    // `JourneyEntryPhotosRepository` (JS14), relocated off
    // `JourneyShareTokensRepository`'s own fallback stub.
    await createTestJourneyEntriesRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

// -- Helpers ------------------------------------------------------------------

/** Insert a trek_photos + journey_photos (gallery) + journey_entry_photos row and return the trek_photos id (used as photoId in public URLs). */
function insertJourneyPhoto(
  entryId: number,
  opts: { filePath?: string; assetId?: string; ownerId?: number } = {}
): number {
  const provider = opts.assetId ? 'immich' : 'local';
  const filePath = !opts.assetId ? (opts.filePath ?? '/photos/test.jpg') : null;
  const trekResult = testDb.prepare(`
    INSERT INTO trek_photos (provider, asset_id, file_path, owner_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(provider, opts.assetId ?? null, filePath, opts.ownerId ?? null, Date.now());
  const trekId = trekResult.lastInsertRowid as number;

  // Look up journey_id from entry so gallery row is keyed to the journey (not entry).
  const entryRow = testDb.prepare('SELECT journey_id FROM journey_entries WHERE id = ?').get(entryId) as { journey_id: number };
  const journeyId = entryRow.journey_id;
  const now = Date.now();

  testDb.prepare(`
    INSERT OR IGNORE INTO journey_photos (journey_id, photo_id, caption, sort_order, created_at)
    VALUES (?, ?, NULL, 0, ?)
  `).run(journeyId, trekId, now);

  const galleryRow = testDb.prepare('SELECT id FROM journey_photos WHERE journey_id = ? AND photo_id = ?').get(journeyId, trekId) as { id: number };

  testDb.prepare(`
    INSERT OR IGNORE INTO journey_entry_photos (entry_id, journey_photo_id, sort_order, created_at)
    VALUES (?, ?, 0, ?)
  `).run(entryId, galleryRow.id, now);

  // Return trek_photos.id — this is p.photo_id in the public API response
  // and the value the client sends to /api/public/journey/:token/photos/:photoId/:kind
  return trekId;
}

// -- Tests --------------------------------------------------------------------

describe('createOrUpdateJourneyShareLink', () => {
  it('JOURNEY-SHARE-001: creates a new share link with default permissions', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const result = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    expect(result.created).toBe(true);
    expect(result.token).toBeTruthy();
    expect(result.token.length).toBeGreaterThan(10);
  });

  it('JOURNEY-SHARE-002: creates a share link with custom permissions', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true,
      share_gallery: false,
      share_map: false,
    });

    const link = await svc.getJourneyShareLink(journey.id);
    expect(link).not.toBeNull();
    expect(link!.share_timeline).toBe(true);
    expect(link!.share_gallery).toBe(false);
    expect(link!.share_map).toBe(false);
  });

  it('JOURNEY-SHARE-003: updates permissions on existing link without regenerating token', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const first = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true,
      share_gallery: true,
      share_map: true,
    });
    const second = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true,
      share_gallery: false,
      share_map: false,
    });

    expect(second.created).toBe(false);
    expect(second.token).toBe(first.token);

    const link = await svc.getJourneyShareLink(journey.id);
    expect(link!.share_gallery).toBe(false);
    expect(link!.share_map).toBe(false);
  });

  it('JOURNEY-SHARE-029: reading the link separates "no link" from "not yours"', async () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, helper.id, 'editor');

    // Nothing published yet: an owner is allowed to look and finds nothing.
    expect(await svc.readJourneyShareLink(journey.id, owner.id)).toEqual({ allowed: true, link: null });

    await svc.createOrUpdateJourneyShareLink(journey.id, owner.id, {});
    const asOwner = await svc.readJourneyShareLink(journey.id, owner.id);
    expect(asOwner.allowed).toBe(true);
    expect(asOwner.allowed && asOwner.link?.token).toBeTruthy();

    // An editor is refused outright. Answering { link: null } here would tell a
    // published journey's editor it is unpublished and offer to publish it.
    expect(await svc.readJourneyShareLink(journey.id, helper.id)).toEqual({ allowed: false });
  });

  it('JOURNEY-SHARE-027: an update leaves out flags it was not given', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true,
      share_gallery: false,
      share_map: false,
      newest_first: true,
    });
    // A caller that only flips the timeline must not silently re-publish the
    // gallery and map at the unchanged token.
    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_timeline: false });

    const link = await svc.getJourneyShareLink(journey.id);
    expect(link!.share_timeline).toBe(false);
    expect(link!.share_gallery).toBe(false);
    expect(link!.share_map).toBe(false);
    expect(link!.newest_first).toBe(true);
  });

  it('JOURNEY-SHARE-028: newest_first survives a flag-only update and is settable', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});
    expect((await svc.getJourneyShareLink(journey.id))!.newest_first).toBe(false);

    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { newest_first: true });
    expect((await svc.getJourneyShareLink(journey.id))!.newest_first).toBe(true);

    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_gallery: false });
    expect((await svc.getJourneyShareLink(journey.id))!.newest_first).toBe(true);
  });

  it('JOURNEY-SHARE-004: different journeys get different tokens', async () => {
    const { user } = createUser(testDb);
    const j1 = createJourney(testDb, user.id);
    const j2 = createJourney(testDb, user.id);

    const r1 = await svc.createOrUpdateJourneyShareLink(j1.id, user.id, {});
    const r2 = await svc.createOrUpdateJourneyShareLink(j2.id, user.id, {});

    expect(r1.token).not.toBe(r2.token);
  });

  // L1 (task-5-review.md) — two concurrent FIRST creates for the same
  // journey used to race the existing-link read against the insert: the
  // loser hit `UNIQUE(journey_id)` and threw (a 500 over HTTP) instead of
  // the base's `{created:false}`. Races two real `Promise.all` callers
  // through the actual service on the shared connection.
  it('JOURNEY-SHARE-L1: two concurrent first-creates for the same journey — one created, one {created:false}, no throw', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const [a, b] = await Promise.all([
      svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_timeline: true }),
      svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_timeline: false }),
    ]);

    const results = [a, b];
    const created = results.filter((r) => r!.created);
    const notCreated = results.filter((r) => !r!.created);
    expect(created).toHaveLength(1);
    expect(notCreated).toHaveLength(1);
    // Both callers agree on the one token that exists.
    expect(a!.token).toBe(b!.token);

    const rows = testDb.prepare('SELECT COUNT(*) AS n FROM journey_share_tokens WHERE journey_id = ?').get(journey.id) as { n: number };
    expect(rows.n).toBe(1);
  });
});

describe('getJourneyShareLink', () => {
  it('JOURNEY-SHARE-005: returns null when no share link exists', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const result = await svc.getJourneyShareLink(journey.id);

    expect(result).toBeNull();
  });

  it('JOURNEY-SHARE-006: returns share link info when it exists', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true,
      share_gallery: false,
      share_map: true,
    });

    const result = await svc.getJourneyShareLink(journey.id);

    expect(result).not.toBeNull();
    expect(result!.token).toBeTruthy();
    expect(result!.share_timeline).toBe(true);
    expect(result!.share_gallery).toBe(false);
    expect(result!.share_map).toBe(true);
    expect(result!.created_at).toBeTruthy();
  });
});

describe('deleteJourneyShareLink', () => {
  it('JOURNEY-SHARE-007: owner can remove an existing share link', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    const ok = await svc.deleteJourneyShareLink(journey.id, user.id);

    expect(ok).toBe(true);
    expect(await svc.getJourneyShareLink(journey.id)).toBeNull();
  });

  it('JOURNEY-SHARE-008: does not throw when deleting non-existent link', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    await expect(svc.deleteJourneyShareLink(journey.id, user.id)).resolves.toBe(true);
  });
});

describe('validateShareTokenForPhoto', () => {
  it('JOURNEY-SHARE-009: returns journeyId and ownerId for valid token + photo', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    const photoId = insertJourneyPhoto(entry.id, { ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    const result = await svc.validateShareTokenForPhoto(token, photoId);

    expect(result).not.toBeNull();
    expect(result!.journeyId).toBe(journey.id);
    expect(result!.ownerId).toBe(user.id);
  });

  it('JOURNEY-SHARE-010: returns null for invalid token', async () => {
    const result = await svc.validateShareTokenForPhoto('nonexistent-token', 1);
    expect(result).toBeNull();
  });

  it('JOURNEY-SHARE-011: returns null when photo does not belong to shared journey', async () => {
    const { user } = createUser(testDb);
    const journey1 = createJourney(testDb, user.id);
    const journey2 = createJourney(testDb, user.id);
    const entry2 = createJourneyEntry(testDb, journey2.id, user.id);
    const photoId = insertJourneyPhoto(entry2.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey1.id, user.id, {});

    const result = await svc.validateShareTokenForPhoto(token, photoId);

    expect(result).toBeNull();
  });

  it('JOURNEY-SHARE-012: falls back to journey owner_id when photo has no owner_id', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    const photoId = insertJourneyPhoto(entry.id, { ownerId: undefined });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    const result = await svc.validateShareTokenForPhoto(token, photoId);

    expect(result).not.toBeNull();
    expect(result!.ownerId).toBe(user.id);
  });

  // Regression — GHSA-9hc8 sibling: the byte proxy must honour share_gallery.
  it('JOURNEY-SHARE-017: returns null when the owner disabled the gallery (share_gallery=false)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    const photoId = insertJourneyPhoto(entry.id, { ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_timeline: true, share_gallery: false, share_map: true });

    expect(await svc.validateShareTokenForPhoto(token, photoId)).toBeNull();
  });

  it('JOURNEY-SHARE-016: resolves correctly when trek_photos.id differs from journey_photos.id (Immich bulk-sync scenario)', async () => {
    // Simulate a user who has many trek_photos from Immich syncs before adding a journey photo.
    // trek_photos.id will be higher than journey_photos.id — the previous bug matched on jp.id
    // instead of jp.photo_id, causing a 404 for Immich photos in public shares.
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);

    // Pre-populate trek_photos to push the autoincrement higher
    for (let i = 0; i < 5; i++) {
      testDb.prepare(`INSERT INTO trek_photos (provider, asset_id, owner_id, created_at) VALUES ('immich', ?, ?, ?)`).run(`bulk-asset-${i}`, user.id, Date.now());
    }

    // This trek_photos row gets a high id (e.g. 6) while journey_photos id will be 1
    const trekPhotoId = insertJourneyPhoto(entry.id, { assetId: 'journey-asset-xyz', ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    // photoId = trek_photos.id (6), not journey_photos.id (1)
    const result = await svc.validateShareTokenForPhoto(token, trekPhotoId);

    expect(result).not.toBeNull();
    expect(result!.ownerId).toBe(user.id);
    expect(result!.journeyId).toBe(journey.id);
  });
});

describe('validateShareTokenForAsset', () => {
  it('JOURNEY-SHARE-013: returns ownerId when asset belongs to shared journey', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    insertJourneyPhoto(entry.id, { assetId: 'immich-asset-123', ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    const result = await svc.validateShareTokenForAsset(token, 'immich-asset-123');

    expect(result).not.toBeNull();
    expect(result!.ownerId).toBe(user.id);
  });

  it('JOURNEY-SHARE-014: returns null for invalid token', async () => {
    const result = await svc.validateShareTokenForAsset('bad-token', 'some-asset');
    expect(result).toBeNull();
  });

  // Regression — GHSA-9hc8 sibling: the asset proxy must honour share_gallery.
  it('JOURNEY-SHARE-018: returns null when the owner disabled the gallery (share_gallery=false)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    insertJourneyPhoto(entry.id, { assetId: 'immich-asset-999', ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_timeline: true, share_gallery: false, share_map: true });

    expect(await svc.validateShareTokenForAsset(token, 'immich-asset-999')).toBeNull();
  });

  it('JOURNEY-SHARE-029: falls back to the journey owner when the photo has no owner_id', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    insertJourneyPhoto(entry.id, { assetId: 'immich-asset-orphan' });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    // Without the fallback the controller filled the gap from the :ownerId path
    // segment, i.e. an anonymous caller picked whose provider credentials to try.
    const result = await svc.validateShareTokenForAsset(token, 'immich-asset-orphan');

    expect(result).not.toBeNull();
    expect(result!.ownerId).toBe(user.id);
  });

  it('JOURNEY-SHARE-015: denies (returns null) when the asset is not part of the shared journey', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    // A valid share token must NOT resolve arbitrary asset IDs to the owner —
    // otherwise it could proxy any asset out of the owner's Immich/Synology
    // library (IDOR). Only assets actually in the journey may resolve.
    const result = await svc.validateShareTokenForAsset(token, 'nonexistent-asset');

    expect(result).toBeNull();
  });

  // M5a (task-5-review.md) — JOURNEY-SHARE-015 above only tries an asset id
  // that does not exist at all; it stays green even with `gp.journey_id = ?`
  // dropped from `findAssetForValidation` (mutation M23), because the join
  // still fails to find a row. This test uses an asset id that IS real and
  // gallery-linked, just to a DIFFERENT journey, so a dropped scope check
  // would resolve it (leaking a cross-journey asset through a valid token)
  // where JOURNEY-SHARE-015 cannot catch that.
  it('JOURNEY-SHARE-M5A: denies an asset that is real but belongs to a DIFFERENT journey (findAssetForValidation journey scope)', async () => {
    const { user } = createUser(testDb);
    const sharedJourney = createJourney(testDb, user.id);
    const otherJourney = createJourney(testDb, user.id);
    const otherEntry = createJourneyEntry(testDb, otherJourney.id, user.id);
    insertJourneyPhoto(otherEntry.id, { assetId: 'other-journey-asset', ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(sharedJourney.id, user.id, {});

    const result = await svc.validateShareTokenForAsset(token, 'other-journey-asset');

    expect(result).toBeNull();
  });
});

describe('getPublicJourney', () => {
  it('JOURNEY-SHARE-016: returns null for invalid token', async () => {
    const result = await svc.getPublicJourney('invalid-token');
    expect(result).toBeNull();
  });

  it('JOURNEY-SHARE-017: returns journey data with entries, stats, and permissions', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, {
      title: 'Japan 2026',
      subtitle: 'Cherry blossom season',
    });
    const entry1 = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry',
      title: 'Arrived in Tokyo',
      entry_date: '2026-03-20',
      location_name: 'Tokyo',
    });
    createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry',
      title: 'Kyoto Day Trip',
      entry_date: '2026-03-22',
      location_name: 'Kyoto',
    });
    insertJourneyPhoto(entry1.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true,
      share_gallery: true,
      share_map: false,
    });

    const result = await svc.getPublicJourney(token);

    expect(result).not.toBeNull();
    expect(result!.journey.title).toBe('Japan 2026');
    expect(result!.journey.subtitle).toBe('Cherry blossom season');
    // The "this journey does not use that field" switches travel with the share:
    // the phone card reads them, and reading an absent one made every field look
    // switched on, so a reader saw chips the owner had turned off.
    expect(result!.journey).toMatchObject({ show_verdict: 1, show_mood: 1, show_weather: 1 });
    expect(result!.entries).toHaveLength(2);
    expect(result!.stats.entries).toBe(2);
    expect(result!.stats.photos).toBe(1);
    expect(result!.stats.places).toBe(2);
    expect(result!.permissions.share_timeline).toBe(true);
    expect(result!.permissions.share_gallery).toBe(true);
    expect(result!.permissions.share_map).toBe(false);
  });

  it('JOURNEY-SHARE-017b: a field the owner switched off is switched off for the reader too', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    testDb.prepare('UPDATE journeys SET show_mood = 0, show_weather = 0 WHERE id = ?').run(journey.id);
    createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', title: 'Tag 1', entry_date: '2026-03-20' });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true, share_gallery: false, share_map: true,
    });

    const result = (await svc.getPublicJourney(token))!;

    expect(result.journey).toMatchObject({ show_mood: 0, show_weather: 0, show_verdict: 1 });
  });

  it('JOURNEY-SHARE-018: excludes skeleton entries from public view', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry',
      title: 'Visible Entry',
      entry_date: '2026-01-10',
    });
    createJourneyEntry(testDb, journey.id, user.id, {
      type: 'skeleton',
      title: 'Skeleton Entry',
      entry_date: '2026-01-11',
    });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    const result = await svc.getPublicJourney(token);

    expect(result).not.toBeNull();
    expect(result!.entries).toHaveLength(1);
    expect(result!.entries[0].title).toBe('Visible Entry');
  });

  it('JOURNEY-SHARE-018b: leaves drafts and the photos only they hold off the public page (#696)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const published = createJourneyEntry(testDb, journey.id, user.id, { title: 'Published', entry_date: '2026-01-10' });
    const draft = createJourneyEntry(testDb, journey.id, user.id, { title: 'Draft', entry_date: '2026-01-11' });
    testDb.prepare('UPDATE journey_entries SET is_draft = 1 WHERE id = ?').run(draft.id);
    const shownPhoto = insertJourneyPhoto(published.id, { ownerId: user.id });
    const draftPhoto = insertJourneyPhoto(draft.id, { ownerId: user.id });
    // A photo on both a draft and a published entry is published.
    const sharedPhoto = insertJourneyPhoto(draft.id, { ownerId: user.id, filePath: '/photos/both.jpg' });
    const sharedRow = testDb.prepare('SELECT id FROM journey_photos WHERE photo_id = ?').get(sharedPhoto) as { id: number };
    testDb.prepare('INSERT INTO journey_entry_photos (entry_id, journey_photo_id, sort_order, created_at) VALUES (?, ?, 1, 0)').run(published.id, sharedRow.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_timeline: true, share_gallery: true });

    const result = (await svc.getPublicJourney(token))!;
    expect(result.entries.map((e: any) => e.title)).toEqual(['Published']);
    expect(result.stats.entries).toBe(1);
    const galleryIds = (result as any).gallery.map((p: any) => p.photo_id).sort();
    expect(galleryIds).toEqual([shownPhoto, sharedPhoto].sort());
    expect(await svc.validateShareTokenForPhoto(token, draftPhoto)).toBeNull();
    expect(await svc.validateShareTokenForPhoto(token, shownPhoto)).not.toBeNull();
  });

  it('JOURNEY-SHARE-019: enriches entries with parsed tags and photos', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry',
      entry_date: '2026-04-01',
    });
    // Set tags on the entry directly
    testDb.prepare('UPDATE journey_entries SET tags = ? WHERE id = ?')
      .run(JSON.stringify(['food', 'culture']), entry.id);
    insertJourneyPhoto(entry.id, { filePath: '/photos/a.jpg' });
    insertJourneyPhoto(entry.id, { filePath: '/photos/b.jpg' });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    const result = await svc.getPublicJourney(token);

    expect(result).not.toBeNull();
    const enriched = result!.entries[0];
    expect(enriched.tags).toEqual(['food', 'culture']);
    expect(enriched.photos).toHaveLength(2);
  });

  it('JOURNEY-SHARE-020: returns empty entries array for journey with no entries', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Empty Journey' });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    const result = await svc.getPublicJourney(token);

    expect(result).not.toBeNull();
    expect(result!.entries).toEqual([]);
    expect(result!.stats.entries).toBe(0);
    expect(result!.stats.photos).toBe(0);
    expect(result!.stats.places).toBe(0);
  });

  it('JOURNEY-SHARE-021: withholds timeline, gallery and GPS when all flags are off', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Secret' });
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 1', story: 'private notes', entry_date: '2026-05-01', location_name: 'Paris',
    });
    testDb.prepare('UPDATE journey_entries SET location_lat = ?, location_lng = ? WHERE id = ?').run(48.8566, 2.3522, entry.id);
    insertJourneyPhoto(entry.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: false, share_gallery: false, share_map: false,
    });

    const result = (await svc.getPublicJourney(token))!;
    expect(result.entries).toEqual([]); // no timeline / story / GPS leaked
    expect(result.gallery).toEqual([]); // no gallery leaked
    expect(result.stats.entries).toBe(1); // counts stay accurate
  });

  it('JOURNEY-SHARE-022: shares the timeline but strips GPS when the map flag is off', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 1', story: 'notes', entry_date: '2026-05-01', location_name: 'Paris',
    });
    testDb.prepare('UPDATE journey_entries SET location_lat = ?, location_lng = ? WHERE id = ?').run(48.8566, 2.3522, entry.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true, share_gallery: true, share_map: false,
    });

    const result = (await svc.getPublicJourney(token))!;
    expect(result.entries).toHaveLength(1);
    const e = result.entries[0] as Record<string, unknown>;
    expect(e.story).toBe('notes'); // narrative present
    expect(e.location_lat).toBeNull(); // GPS withheld
    expect(e.location_lng).toBeNull();
  });

  it('JOURNEY-SHARE-023: map-only share exposes coordinates but not the story', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 1', story: 'private notes', entry_date: '2026-05-01', location_name: 'Paris',
    });
    testDb.prepare('UPDATE journey_entries SET location_lat = ?, location_lng = ? WHERE id = ?').run(48.8566, 2.3522, entry.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: false, share_gallery: false, share_map: true,
    });

    const result = (await svc.getPublicJourney(token))!;
    expect(result.entries).toHaveLength(1);
    const e = result.entries[0] as Record<string, unknown>;
    expect(e.location_lat).toBe(48.8566); // coords for the map
    expect(e.story).toBeUndefined(); // narrative withheld
  });

  // #1614 — a photo now carries the coordinates it was taken at. That is a place
  // the owner never typed, so it has to follow the same switch the entry
  // coordinates follow rather than riding in on the gallery flag.
  it('JOURNEY-SHARE-025: withholds photo capture coordinates when the map flag is off', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 1', story: 'notes', entry_date: '2026-05-01',
    });
    const trekId = insertJourneyPhoto(entry.id, { ownerId: user.id });
    testDb.prepare('UPDATE trek_photos SET lat = ?, lng = ?, taken_at = ? WHERE id = ?')
      .run(48.8584, 2.2945, '2026-05-01T10:00:00Z', trekId);

    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true, share_gallery: true, share_map: false,
    });

    const result = (await svc.getPublicJourney(token))!;
    const gallery = result.gallery as JourneyPublicGalleryRow[];
    expect(gallery).toHaveLength(1);
    expect(gallery[0].lat).toBeNull();
    expect(gallery[0].lng).toBeNull();
    // The capture time is not a location and stays — it is what a blog view sorts by.
    expect(gallery[0].taken_at).toBe('2026-05-01T10:00:00Z');

    const inline = (result.entries[0] as Record<string, unknown>).photos as Record<string, unknown>[];
    expect(inline[0].lat).toBeNull();
    expect(inline[0].lng).toBeNull();
  });

  it('JOURNEY-SHARE-026: hands out photo coordinates once the map is shared', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 1', entry_date: '2026-05-01',
    });
    const trekId = insertJourneyPhoto(entry.id, { ownerId: user.id });
    testDb.prepare('UPDATE trek_photos SET lat = ?, lng = ? WHERE id = ?')
      .run(48.8584, 2.2945, trekId);

    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true, share_gallery: true, share_map: true,
    });

    const gallery = (await svc.getPublicJourney(token))!.gallery as JourneyPublicGalleryRow[];
    expect(gallery[0].lat).toBe(48.8584);
    expect(gallery[0].lng).toBe(2.2945);
  });

  it('JOURNEY-SHARE-024: strips inline entry photos (and their asset metadata) when the gallery is off', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 1', story: 'notes', entry_date: '2026-05-01',
    });
    insertJourneyPhoto(entry.id, { ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true, share_gallery: false, share_map: true,
    });

    const result = (await svc.getPublicJourney(token))!;
    expect(result.gallery).toEqual([]); // gallery array withheld
    expect(result.entries).toHaveLength(1);
    expect((result.entries[0] as Record<string, unknown>).photos).toEqual([]); // inline photos withheld too
  });

  // #2200: the reader of a shared journey gets the same chronology as the owner,
  // so the public gallery cannot fall back to upload order.
  it('JOURNEY-SHARE-031: the public gallery reads in capture order, not upload order', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const day1 = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 1', entry_date: '2026-05-01',
    });
    const day2 = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'entry', title: 'Day 2', entry_date: '2026-05-02',
    });

    const late = insertJourneyPhoto(day2.id, { filePath: '/photos/day2.jpg' });
    insertJourneyPhoto(day1.id, { filePath: '/photos/day1.jpg' });
    testDb.prepare('UPDATE trek_photos SET taken_at = ? WHERE id = ?').run('2026-05-02T16:00:00.000Z', late);

    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true, share_gallery: true, share_map: true,
    });

    const gallery = (await svc.getPublicJourney(token))!.gallery as JourneyPublicGalleryRow[];
    expect(gallery.map(p => p.file_path)).toEqual(['/photos/day1.jpg', '/photos/day2.jpg']);
  });

  it('JOURNEY-SHARE-030: cartoApiKey resolves owner setting → admin instance default → empty (#2054)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_map: true });

    expect((await svc.getPublicJourney(token))!.cartoApiKey).toBe('');
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('default_user_setting_carto_api_key', 'instance-key')").run();
    expect((await svc.getPublicJourney(token))!.cartoApiKey).toBe('instance-key');
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'carto_api_key', ' owner-key ')").run(user.id);
    expect((await svc.getPublicJourney(token))!.cartoApiKey).toBe('owner-key');
  });
});

// -- Parity: JourneyShareTokensRepository reads vs. the legacy raw statement --

describe('parity — JourneyShareTokensRepository reads match the legacy statement run raw', () => {
  let shareTokensRepo: JourneyShareTokensRepository;
  // L2 — JS15 moved to `JourneyPhotosRepository.galleryRead`; P06 below now
  // pins that method's output against the legacy statement instead of the
  // (now-deleted) `JourneyShareTokensRepository.listGalleryForPublicJourney`.
  let journeyPhotosRepo: Awaited<ReturnType<typeof createTestJourneyPhotosRepo>>;
  // Plan 4 Task 8b — JS7/JS10/JS13/JS14 relocated the same way JS15 was: P04
  // and P05 below now pin `JourneyEntriesRepository.listPublicEntries` and
  // `JourneyEntryPhotosRepository.listForPublicJourney` instead of the
  // (now-deleted) `JourneyShareTokensRepository` fallback stub methods.
  let journeyEntriesRepo: JourneyEntriesRepository;
  let journeyEntryPhotosRepo: JourneyEntryPhotosRepository;

  beforeAll(async () => {
    shareTokensRepo = await createTestJourneyShareTokensRepo(testDb);
    journeyPhotosRepo = await createTestJourneyPhotosRepo(testDb);
    journeyEntriesRepo = await createTestJourneyEntriesRepo(testDb);
    journeyEntryPhotosRepo = await createTestJourneyEntryPhotosRepo(testDb);
  });

  it('JOURNEY-SHARE-P01: findFlagsByJourneyId (JS1) matches the legacy 5-column read', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: false, share_gallery: true, share_map: false, newest_first: true,
    });

    const legacy = testDb
      .prepare('SELECT token, share_timeline, share_gallery, share_map, newest_first FROM journey_share_tokens WHERE journey_id = ?')
      .get(journey.id);

    expect(await shareTokensRepo.findFlagsByJourneyId(journey.id)).toEqual(legacy);
  });

  it('JOURNEY-SHARE-P02: findByJourneyId (JS4) and findByToken (JS11) match the legacy `SELECT *` reads', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {
      share_timeline: true, share_gallery: false, share_map: true, newest_first: false,
    });

    const legacyByJourney = testDb.prepare('SELECT * FROM journey_share_tokens WHERE journey_id = ?').get(journey.id);
    const legacyByToken = testDb.prepare('SELECT * FROM journey_share_tokens WHERE token = ?').get(token);

    expect(await shareTokensRepo.findByJourneyId(journey.id)).toEqual(legacyByJourney);
    expect(await shareTokensRepo.findByToken(token)).toEqual(legacyByToken);
  });

  it('JOURNEY-SHARE-P03: findAccessByToken (JS6/JS9) matches the legacy narrow projection', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_gallery: false });

    const legacy = testDb.prepare('SELECT journey_id, share_gallery FROM journey_share_tokens WHERE token = ?').get(token);

    expect(await shareTokensRepo.findAccessByToken(token)).toEqual(legacy);
  });

  it('JOURNEY-SHARE-P04: listPublicEntries (JS13) matches the legacy statement for entries with and without GPS', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01', location_name: 'No GPS' });
    const withGps = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-02', location_name: 'Has GPS' });
    testDb.prepare('UPDATE journey_entries SET location_lat = ?, location_lng = ? WHERE id = ?').run(48.85, 2.35, withGps.id);
    // A skeleton and a dismissed entry — both must be excluded, same as the legacy WHERE.
    createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton', entry_date: '2026-01-03' });
    const dismissed = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-04' });
    testDb.prepare('UPDATE journey_entries SET dismissed = 1 WHERE id = ?').run(dismissed.id);

    const legacy = testDb
      .prepare(`
        SELECT je.* FROM journey_entries je
        WHERE je.journey_id = ? AND je.type != 'skeleton' AND je.dismissed = 0
        ORDER BY je.entry_date, je.sort_order
      `)
      .all(journey.id);

    expect(await journeyEntriesRepo.listPublicEntries(journey.id)).toEqual(legacy);
  });

  it('JOURNEY-SHARE-P05: JourneyEntryPhotosRepository.listForPublicJourney (JS14) matches the legacy JP_SELECT-shaped statement', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    insertJourneyPhoto(entry.id, { ownerId: user.id });

    const legacy = testDb
      .prepare(`
        SELECT gp.id, jep.entry_id, gp.photo_id, gp.caption, jep.sort_order, gp.shared, gp.created_at,
               tkp.provider, tkp.asset_id, tkp.owner_id, tkp.file_path, tkp.thumbnail_path, tkp.width, tkp.height,
               tkp.media_type, tkp.duration_ms, tkp.taken_at, tkp.lat, tkp.lng
        FROM journey_entry_photos jep
        JOIN journey_photos gp ON gp.id = jep.journey_photo_id
        JOIN trek_photos tkp ON tkp.id = gp.photo_id
        WHERE gp.journey_id = ?
        ORDER BY jep.sort_order
      `)
      .all(journey.id);

    expect(await journeyEntryPhotosRepo.listForPublicJourney(journey.id)).toEqual(legacy);
  });

  it('JOURNEY-SHARE-P06: JourneyPhotosRepository.galleryRead (JS15, GALLERY_CHRONOLOGICAL_ORDER) matches the legacy statement — a photo linked to an entry AND an unattached gallery photo', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    insertJourneyPhoto(entry.id, { ownerId: user.id, filePath: '/photos/linked.jpg' }); // linked to an entry
    // An unattached gallery photo — uploaded straight to the gallery, no journey_entry_photos row.
    const unattachedTrekId = testDb
      .prepare('INSERT INTO trek_photos (provider, asset_id, owner_id, file_path, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('local', null, user.id, '/photos/unattached.jpg', Date.now()).lastInsertRowid as number;
    testDb
      .prepare('INSERT INTO journey_photos (journey_id, photo_id, sort_order, created_at) VALUES (?, ?, ?, ?)')
      .run(journey.id, unattachedTrekId, 1, Date.now());

    const legacy = testDb
      .prepare(`
        SELECT gp.id, gp.journey_id, gp.photo_id, gp.caption, gp.shared, gp.sort_order, gp.created_at,
               tp.provider, tp.asset_id, tp.owner_id, tp.file_path, tp.thumbnail_path, tp.width, tp.height,
               tp.media_type, tp.duration_ms, tp.taken_at, tp.lat, tp.lng
        FROM journey_photos gp
        JOIN trek_photos tp ON tp.id = gp.photo_id
        WHERE gp.journey_id = ?
        ${GALLERY_CHRONOLOGICAL_ORDER}
      `)
      .all(journey.id);

    expect(await journeyPhotosRepo.galleryRead(journey.id)).toEqual(legacy);
    expect(legacy).toHaveLength(2);
  });

  it('JOURNEY-SHARE-P07: every true/false combination of the three share flags (+ newest_first) round-trips through the converted read exactly', async () => {
    const { user } = createUser(testDb);
    for (const share_timeline of [true, false]) {
      for (const share_gallery of [true, false]) {
        for (const share_map of [true, false]) {
          for (const newest_first of [true, false]) {
            const journey = createJourney(testDb, user.id);
            await svc.createOrUpdateJourneyShareLink(journey.id, user.id, { share_timeline, share_gallery, share_map, newest_first });
            const link = await svc.getJourneyShareLink(journey.id);
            expect(link).toEqual({
              token: link!.token,
              created_at: link!.created_at,
              share_timeline, share_gallery, share_map, newest_first,
            });
          }
        }
      }
    }
  });
});

// -- R4: the six anonymous share-token statements — exact-match only ---------

describe('R4 — JS6/JS9/JS11 are exact-match token lookups (revoked / wrong-case / NUL)', () => {
  it('JOURNEY-SHARE-R01: validateShareTokenForPhoto 404s (null) for a revoked token', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    const photoId = insertJourneyPhoto(entry.id, { ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});
    await svc.deleteJourneyShareLink(journey.id, user.id);

    expect(await svc.validateShareTokenForPhoto(token, photoId)).toBeNull();
  });

  it('JOURNEY-SHARE-R02: validateShareTokenForAsset 404s (null) for a revoked token', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    insertJourneyPhoto(entry.id, { assetId: 'revoked-asset', ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});
    await svc.deleteJourneyShareLink(journey.id, user.id);

    expect(await svc.validateShareTokenForAsset(token, 'revoked-asset')).toBeNull();
  });

  it('JOURNEY-SHARE-R03: getPublicJourney 404s (null) for a revoked token, not a stale cached response', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});
    expect(await svc.getPublicJourney(token)).not.toBeNull();

    await svc.deleteJourneyShareLink(journey.id, user.id);

    expect(await svc.getPublicJourney(token)).toBeNull();
  });

  it('JOURNEY-SHARE-R04: validateShareTokenForPhoto does not match a differently-cased token', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    const photoId = insertJourneyPhoto(entry.id, { ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});
    const wrongCase = flipCase(token);

    expect(await svc.validateShareTokenForPhoto(wrongCase, photoId)).toBeNull();
    // Mutation proof (loosen → red): a COLLATE NOCASE lookup on the SAME row
    // WOULD wrongly match — proving the null above depends on the real
    // exact-match WHERE, not a coincidence of the fixture.
    expect(testDb.prepare('SELECT 1 FROM journey_share_tokens WHERE token = ? COLLATE NOCASE').get(wrongCase)).toBeTruthy();
  });

  it('JOURNEY-SHARE-R05: validateShareTokenForAsset does not match a differently-cased token', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    insertJourneyPhoto(entry.id, { assetId: 'case-asset', ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});
    const wrongCase = flipCase(token);

    expect(await svc.validateShareTokenForAsset(wrongCase, 'case-asset')).toBeNull();
    expect(testDb.prepare('SELECT 1 FROM journey_share_tokens WHERE token = ? COLLATE NOCASE').get(wrongCase)).toBeTruthy();
  });

  it('JOURNEY-SHARE-R06: getPublicJourney does not match a differently-cased token', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});
    const wrongCase = flipCase(token);

    expect(await svc.getPublicJourney(wrongCase)).toBeNull();
    expect(testDb.prepare('SELECT 1 FROM journey_share_tokens WHERE token = ? COLLATE NOCASE').get(wrongCase)).toBeTruthy();
  });

  it('JOURNEY-SHARE-R07: validateShareTokenForPhoto does not match a token with an embedded NUL byte', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    const photoId = insertJourneyPhoto(entry.id, { ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    expect(await svc.validateShareTokenForPhoto(`${token}\0trailing`, photoId)).toBeNull();
    expect(await svc.validateShareTokenForPhoto(`${token.slice(0, 5)}\0${token.slice(5)}`, photoId)).toBeNull();
  });

  it('JOURNEY-SHARE-R08: validateShareTokenForAsset does not match a token with an embedded NUL byte', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { type: 'entry', entry_date: '2026-01-01' });
    insertJourneyPhoto(entry.id, { assetId: 'nul-asset', ownerId: user.id });
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    expect(await svc.validateShareTokenForAsset(`${token}\0trailing`, 'nul-asset')).toBeNull();
  });

  it('JOURNEY-SHARE-R09: getPublicJourney does not match a token with an embedded NUL byte', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const { token } = await svc.createOrUpdateJourneyShareLink(journey.id, user.id, {});

    expect(await svc.getPublicJourney(`${token}\0trailing`)).toBeNull();
  });
});

/** A token with at least one letter flipped in case — base64url alphabet, near-certain to differ. */
function flipCase(token: string): string {
  const upper = token.toUpperCase();
  return upper !== token ? upper : token.toLowerCase();
}
