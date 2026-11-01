/**
 * The reference sources the owner domains hand the storage reclaim pass
 * (#2924), each against the migrated schema: which of a page of keys its rows
 * still name, in every spelling those columns hold. One object kept too many
 * costs a few bytes; one called unreferenced while a row names it is lost, so
 * every case here is a spelling a real row can carry. A source answers twice:
 * `namedKeys`, every key of a category its rows name (one read, for a pass),
 * and `referenced`, a few keys asked fresh and narrowed to the rows holding
 * their plain runs (the re-check before a delete, and a release).
 * RSRC-001 to RSRC-017.
 */
import { PlaceContribOutbox } from '../../../src/db/entities/PlaceContribOutbox.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { AuthStorageRefsService } from '../../../src/nest/auth/auth-storage-refs.service';
import { CollectionsStorageRefsService } from '../../../src/nest/collections/collections-storage-refs.service';
import { FilesStorageRefsService } from '../../../src/nest/files/files-storage-refs.service';
import { JourneyStorageRefsService } from '../../../src/nest/journey/journey-storage-refs.service';
import { PhotosStorageRefsService } from '../../../src/nest/photos/photos-storage-refs.service';
import { PlaceContribStorageRefsService } from '../../../src/nest/place-contrib/place-contrib-storage-refs.service';
import { PlacesStorageRefsService } from '../../../src/nest/places/places-storage-refs.service';
import { StorageReclaimRegistryService } from '../../../src/nest/storage/storage-reclaim-registry.service';
import { likeAny, MAX_LIKE_TERMS } from '../../../src/nest/storage/storage-reclaim-source.service';
import {
  STORAGE_RECLAIMABLE_CATEGORIES,
  STORAGE_REFERENCE_SOURCE_IDS,
  type StorageReferenceSource,
} from '../../../src/nest/storage/storage-reclaim.types';
import type { ServedCategory } from '../../../src/nest/storage/storage.types';
import { TripsStorageRefsService } from '../../../src/nest/trips/trips-storage-refs.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeCollection, makeCollectionPlace } from '../../helpers/factories/collections';
import { makeTripFile } from '../../helpers/factories/files';
import { makeJourney } from '../../helpers/factories/journeys';
import { makePlace } from '../../helpers/factories/places';
import { insertRow, updateRows } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SOURCES = [
  TripsStorageRefsService,
  CollectionsStorageRefsService,
  PlacesStorageRefsService,
  PlaceContribStorageRefsService,
  JourneyStorageRefsService,
  PhotosStorageRefsService,
  FilesStorageRefsService,
  AuthStorageRefsService,
];

const db = createSnapshotTestDb();
let orm: TestOrm;
let t: TestModule;
let userId: number;
let tripId: number;

beforeAll(async () => {
  orm = await createTestOrm(db);
  t = await createTestModule({ db, imports: [], providers: [StorageReclaimRegistryService, ...SOURCES], init: true });
  userId = (await makeUser(orm)).user.id;
  tripId = (await makeTrip(orm, userId)).id;
});

afterAll(async () => {
  await t.close();
  await orm.close();
  db.close();
});

/** The sorted keys a source still references. */
async function asked(source: StorageReferenceSource, category: ServedCategory, keys: string[]): Promise<string[]> {
  return [...(await source.referenced(category, keys))].sort();
}

describe('reference sources', () => {
  it('RSRC-001: every source registers itself once the app boots, under the ids the ledger knows', () => {
    const registry = t.get(StorageReclaimRegistryService);
    expect([...registry.ids()].sort()).toEqual([...STORAGE_REFERENCE_SOURCE_IDS].sort());
    for (const source of registry.sources()) {
      const claimed = source.claims.map((claim) => `${claim.category}:${claim.prefix}`).sort();
      if (source.id === 'files') expect(claimed).toEqual(['files:']);
      else if (source.id === 'auth') expect(claimed).toEqual(['avatars:']);
      else expect(claimed).toEqual(STORAGE_RECLAIMABLE_CATEGORIES.map((category) => `${category}:`).sort());
    }
  });

  it('RSRC-002: a trip cover keeps its object in every spelling, and in whatever category it points into', async () => {
    await makeTrip(orm, userId, { cover_image: '/uploads/covers/rsrc-a.jpg' });
    await makeTrip(orm, userId, { cover_image: 'https://trip.example.test/uploads/places/rsrc-b.jpg?v=2' });
    await makeTrip(orm, userId, { cover_image: '/uploads/covers/RSRC-Mixed.JPG' });
    await makeTrip(orm, userId, { cover_image: 'https://images.unsplash.com/rsrc-z.jpg' });
    const trips = t.get(TripsStorageRefsService);
    expect(await asked(trips, 'covers', ['rsrc-a.jpg', 'rsrc-mixed.jpg', 'rsrc-z.jpg', 'rsrc-b.jpg'])).toEqual([
      'rsrc-a.jpg',
      'rsrc-mixed.jpg',
    ]);
    expect(await asked(trips, 'places', ['rsrc-b.jpg', 'rsrc-a.jpg'])).toEqual(['rsrc-b.jpg']);
    expect(await asked(trips, 'covers', [])).toEqual([]);
  });

  it('RSRC-003: a list cover and a saved place image both keep their objects', async () => {
    const collection = await makeCollection(orm, userId, { cover_image: '/uploads/covers/rsrc-c.jpg' });
    await makeCollectionPlace(orm, collection.id, userId, { image_url: '/uploads/places/rsrc-d.jpg' });
    await makeCollectionPlace(orm, collection.id, userId, { image_url: 'https://example.test/rsrc-y.jpg' });
    const collections = t.get(CollectionsStorageRefsService);
    expect(await asked(collections, 'covers', ['rsrc-c.jpg', 'rsrc-d.jpg'])).toEqual(['rsrc-c.jpg']);
    expect(await asked(collections, 'places', ['rsrc-d.jpg', 'rsrc-y.jpg'])).toEqual(['rsrc-d.jpg']);
  });

  it('RSRC-004: a place image keeps its object; a photo-proxy path or an inline image names none', async () => {
    await makePlace(orm, tripId, { image_url: '/uploads/places/rsrc-e.jpg' });
    await makePlace(orm, tripId, { image_url: '/uploads/covers/rsrc-e2.jpg' });
    await makePlace(orm, tripId, { image_url: '/api/maps/place-photo/rsrc-x/bytes' });
    await makePlace(orm, tripId, { image_url: 'data:image/png;base64,AAAA' });
    const places = t.get(PlacesStorageRefsService);
    expect(await asked(places, 'places', ['rsrc-e.jpg', 'rsrc-x', 'bytes'])).toEqual(['rsrc-e.jpg']);
    expect(await asked(places, 'covers', ['rsrc-e2.jpg'])).toEqual(['rsrc-e2.jpg']);
  });

  it('RSRC-005: a queued contribution keeps the image it has yet to send', async () => {
    const place = await makePlace(orm, tripId, { image_url: null });
    await insertRow(orm, PlaceContribOutbox, {
      contrib_key: 'osm:node/2924',
      field: 'image',
      value: '/uploads/places/rsrc-f.jpg',
      place: place.id,
      place_name: 'Queued',
      cid: 'cid-rsrc-0001',
      eligible_at: '2026-01-01 00:00:00',
      next_attempt_at: '2026-01-01 00:00:00',
    });
    const outbox = t.get(PlaceContribStorageRefsService);
    expect(await asked(outbox, 'places', ['rsrc-f.jpg', 'rsrc-f2.jpg'])).toEqual(['rsrc-f.jpg']);
  });

  it('RSRC-006: a journey cover keeps a shared trip cover and a gallery photo by their relative spelling', async () => {
    await makeJourney(orm, userId, { cover_image: 'covers/rsrc-g.jpg' });
    await makeJourney(orm, userId, { cover_image: 'journey/rsrc-h.jpg' });
    await makeJourney(orm, userId, { cover_image: '/uploads/covers/rsrc-g2.jpg' });
    const journeys = t.get(JourneyStorageRefsService);
    expect(await asked(journeys, 'covers', ['rsrc-g.jpg', 'rsrc-g2.jpg', 'rsrc-h.jpg'])).toEqual([
      'rsrc-g.jpg',
      'rsrc-g2.jpg',
    ]);
    expect(await asked(journeys, 'journey', ['rsrc-h.jpg', 'rsrc-g.jpg'])).toEqual(['rsrc-h.jpg']);
  });

  it('RSRC-007: every photo row with a path keeps it, whatever its provider and links', async () => {
    // A local photo retargeted to a remote provider is still served from its bytes.
    await insertRow(orm, TrekPhotos, {
      provider: 'immich',
      asset_id: 'rsrc-asset',
      owner: userId,
      file_path: 'journey/rsrc-i.jpg',
      thumbnail_path: 'journey/rsrc-i-poster.jpg',
    });
    await insertRow(orm, TrekPhotos, { provider: 'local', owner: userId, file_path: 'legacy/rsrc-j.jpg' });
    await insertRow(orm, TrekPhotos, { provider: 'immich', asset_id: 'rsrc-remote', owner: userId });
    const photos = t.get(PhotosStorageRefsService);
    expect(
      await asked(photos, 'journey', ['rsrc-i.jpg', 'rsrc-i-poster.jpg', 'rsrc-j.jpg', 'rsrc-remote', 'rsrc-k.jpg']),
    ).toEqual(['rsrc-i-poster.jpg', 'rsrc-i.jpg', 'rsrc-j.jpg']);
    expect(await asked(photos, 'covers', ['rsrc-i.jpg'])).toEqual([]);
  });

  it('RSRC-008: a trip file keeps its object, trashed or carrying a legacy path', async () => {
    await makeTripFile(orm, tripId, { filename: 'rsrc-k.pdf' });
    await makeTripFile(orm, tripId, { filename: 'rsrc-l.pdf', deleted_at: '2026-01-01 00:00:00' });
    await makeTripFile(orm, tripId, { filename: 'files/rsrc-m.pdf' });
    await makeTripFile(orm, tripId, { filename: '/uploads/files/rsrc-n.pdf' });
    await makeTripFile(orm, tripId, { filename: 'uploads\\files\\rsrc-p.pdf' });
    const files = t.get(FilesStorageRefsService);
    expect(
      await asked(files, 'files', ['rsrc-k.pdf', 'rsrc-l.pdf', 'rsrc-m.pdf', 'rsrc-n.pdf', 'rsrc-p.pdf', 'rsrc-o.pdf']),
    ).toEqual(['rsrc-k.pdf', 'rsrc-l.pdf', 'rsrc-m.pdf', 'rsrc-n.pdf', 'rsrc-p.pdf']);
  });

  it('RSRC-009: a source asked about a category it does not claim answers nothing', async () => {
    await makeTripFile(orm, tripId, { filename: 'rsrc-q.jpg' });
    expect(await asked(t.get(FilesStorageRefsService), 'covers', ['rsrc-q.jpg'])).toEqual([]);
    expect(await asked(t.get(FilesStorageRefsService), 'files', [])).toEqual([]);
    expect(await asked(t.get(AuthStorageRefsService), 'files', ['rsrc-q.jpg'])).toEqual([]);
  });

  it('RSRC-010: an uploaded avatar keeps its object; an OIDC picture names none', async () => {
    const uploaded = (await makeUser(orm)).user;
    const oidc = (await makeUser(orm)).user;
    await updateRows(orm, Users, { id: uploaded.id }, { avatar: 'rsrc-r.png' });
    await updateRows(orm, Users, { id: oidc.id }, { avatar: 'https://idp.example.test/pictures/rsrc-s.png' });
    const auth = t.get(AuthStorageRefsService);
    expect(await asked(auth, 'avatars', ['rsrc-r.png', 'rsrc-s.png'])).toEqual(['rsrc-r.png']);
    expect(await asked(auth, 'avatars', [])).toEqual([]);
  });

  it('RSRC-011: every source asked with no keys answers nothing', async () => {
    const answers = await Promise.all(
      SOURCES.map((Source) => asked(t.get<StorageReferenceSource>(Source), 'covers', [])),
    );
    expect(answers).toEqual(SOURCES.map(() => []));
  });

  it('RSRC-012: a narrowed question still finds a uuid-named object in every spelling a row holds', async () => {
    const id = '7b1f0c2e-5a4d-4e3f-8a9b-0c1d2e3f4a5b';
    await makeTrip(orm, userId, {
      cover_image: `https://trip.example.test/uploads/covers/${id.toUpperCase()}.JPG?v=3`,
    });
    await makePlace(orm, tripId, { image_url: `/uploads/places/${id}-p.jpg#frag` });
    const trips = t.get(TripsStorageRefsService);
    expect(await asked(trips, 'covers', [`${id}.jpg`, `${id}-other.jpg`])).toEqual([`${id}.jpg`]);
    expect(await asked(t.get(PlacesStorageRefsService), 'places', [`${id}-p.jpg`])).toEqual([`${id}-p.jpg`]);
  });

  it('RSRC-013: namedKeys answers every key of the category its rows name, lowercased, in one read', async () => {
    await makeTrip(orm, userId, { cover_image: '/uploads/covers/RSRC-Named-A.jpg' });
    await makeTrip(orm, userId, { cover_image: '/uploads/places/rsrc-named-b.jpg' });
    const trips = t.get(TripsStorageRefsService);
    const covers = await trips.namedKeys('covers');
    expect(covers.has('rsrc-named-a.jpg')).toBe(true);
    expect(covers.has('rsrc-named-b.jpg')).toBe(false);
    expect((await trips.namedKeys('places')).has('rsrc-named-b.jpg')).toBe(true);
    expect(await t.get(FilesStorageRefsService).namedKeys('covers')).toEqual(new Set());
  });

  it('RSRC-014: a trip file whose name holds a #, a ? or a trailing blank keeps its object both ways', async () => {
    const id = '3c9d8e7f-6a5b-4c4d-9e3f-2a1b0c9d8e7f';
    const names = [`${id}. #4711`, `${id}.c#`, `${id}.v2?final`, `${id}.pdf `];
    await Promise.all(names.map((filename) => makeTripFile(orm, tripId, { filename })));
    const files = t.get(FilesStorageRefsService);
    expect(await asked(files, 'files', names)).toEqual([...names].sort());
    const named = await files.namedKeys('files');
    for (const name of names) expect(named.has(name.toLowerCase())).toBe(true);
  });

  it('RSRC-015: a question about many keys is split into reads of at most MAX_LIKE_TERMS terms each', async () => {
    const ids = Array.from({ length: 60 }, (_unused, i) => `9d8c7b6a-5f4e-4d3c-8b2a-${String(i).padStart(12, '0')}`);
    await Promise.all(ids.slice(0, 30).map((id) => makePlace(orm, tripId, { image_url: `/uploads/places/${id}.jpg` })));
    const keys = ids.map((id) => `${id}.jpg`);
    expect(await asked(t.get(PlacesStorageRefsService), 'places', keys)).toEqual(keys.slice(0, 30).sort());
    // The photos source reads two columns, still within the bound.
    expect(await asked(t.get(PhotosStorageRefsService), 'journey', keys)).toEqual([]);
  });

  it('RSRC-016: a filter past MAX_LIKE_TERMS terms is refused before it reaches SQLite', () => {
    const runs = Array.from({ length: MAX_LIKE_TERMS + 1 }, (_unused, i) => `run-${String(i).padStart(8, '0')}`);
    expect(() => likeAny<{ a: string }>(['a'], runs)).toThrow(/at most/);
    expect(() => likeAny<{ a: string; b: string }>(['a', 'b'], runs.slice(0, 25))).not.toThrow();
    expect(() => likeAny<{ a: string; b: string }>(['a', 'b'], runs.slice(0, 26))).toThrow(/at most/);
  });

  it('RSRC-017: namedKeysByCategory reads once and answers every category the source claims, none it does not', async () => {
    await makeTrip(orm, userId, { cover_image: '/uploads/covers/rsrc-once-a.jpg' });
    await makeTrip(orm, userId, { cover_image: '/uploads/places/rsrc-once-b.jpg' });
    const answer = await t.get(TripsStorageRefsService).namedKeysByCategory(['covers', 'places', 'photos']);
    expect(answer.get('covers')?.has('rsrc-once-a.jpg')).toBe(true);
    expect(answer.get('covers')?.has('rsrc-once-b.jpg')).toBe(false);
    expect(answer.get('places')?.has('rsrc-once-b.jpg')).toBe(true);
    expect(answer.has('photos')).toBe(false);
    expect(await t.get(FilesStorageRefsService).namedKeysByCategory(['covers'])).toEqual(new Map());
  });
});
