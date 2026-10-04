/**
 * PlacesRepository.findWithTagsAndRatings (Plan 3c Task 0b): the legacy
 * `getPlaceWithTags`'s three statements (place+category, tags, ratings),
 * merged the same way. Real rows on the real test DB, including the
 * non-empty tags/ratings shape neither `trip-access-primitives.test.ts`'s
 * PRIM-GPWT-00x (empty tags/ratings only) nor any other suite exercises.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TRACK_COLORS } from '@trek/shared';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { addTripMember, createCategory, createDay, createDayAssignment, createPlace, createTag, createTrip, createUser } from '../../../helpers/factories';
import { Places } from '../../../../src/db/entities/Places.entity';
import type { PlacesRepository } from '../../../../src/db/repositories/Places.repository';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let places: PlacesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  places = t.repo(Places);
});
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

/**
 * The legacy `getPlaceWithTags` (`db/database.ts:146-197` at base), run raw
 * on the same rows — 0b security review F-B6: a `toMatchObject`/partial
 * assertion cannot see a renamed key (B1's `u__id`) or a dropped one (B2's
 * flat `category_name`/`category_color`/`category_icon`); this reproduces
 * the legacy function's exact three-statement composition and the test below
 * does a full `toEqual` against it, key for key.
 */
function legacyGetPlaceWithTags(placeId: number): unknown {
  const place = testDb
    .prepare('SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?')
    .get(placeId) as (Record<string, unknown> & { category_id: number | null; category_name: string | null; category_color: string | null; category_icon: string | null }) | undefined;
  if (!place) return null;
  const tags = testDb.prepare('SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?').all(placeId);
  const ratings = testDb
    .prepare('SELECT pr.user_id, u.username, u.avatar, pr.rating FROM place_ratings pr JOIN users u ON pr.user_id = u.id WHERE pr.place_id = ? ORDER BY pr.created_at')
    .all(placeId) as { user_id: number; username: string; avatar: string | null; rating: number }[];
  return {
    ...place,
    category: place.category_id
      ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon }
      : null,
    tags,
    ratings,
    rating_avg: ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null,
    rating_count: ratings.length,
  };
}

describe('PlacesRepository.findWithTagsAndRatings — parity with the legacy getPlaceWithTags', () => {
  it('PLACEREPO-011 (0b security review F-B6): full key-for-key parity with the legacy statement, on a place with a category, two tags and two ratings', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voterA } = createUser(testDb, { username: 'parity_voter_a' });
    const { user: voterB } = createUser(testDb, { username: 'parity_voter_b' });
    const trip = createTrip(testDb, owner.id);
    const category = createCategory(testDb, { name: 'Parks', color: '#00aa00', icon: '🌳' });
    const place = createPlace(testDb, trip.id, { category_id: category.id, name: 'Parity Park' });
    const tagA = createTag(testDb, owner.id, { name: 'Green' });
    const tagB = createTag(testDb, owner.id, { name: 'Quiet' });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tagA.id);
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tagB.id);
    testDb.prepare("INSERT INTO place_ratings (place_id, user_id, rating, created_at) VALUES (?, ?, ?, datetime('now', '-2 minutes'))").run(place.id, voterA.id, 5);
    testDb.prepare("INSERT INTO place_ratings (place_id, user_id, rating, created_at) VALUES (?, ?, ?, datetime('now', '-1 minutes'))").run(place.id, voterB.id, 3);

    const result = await places.findWithTagsAndRatings(place.id);
    const legacy = legacyGetPlaceWithTags(place.id) as Record<string, unknown>;

    // Sort both sides' tags/ratings arrays the same way before the full
    // toEqual — the repository's join order and the legacy statement's join
    // order are not contractually identical for the tags half (no ORDER BY
    // in either), only the ratings half is `ORDER BY pr.created_at` on both.
    const sortByField = <T extends Record<string, unknown>>(arr: T[], field: string): T[] =>
      [...arr].sort((a, b) => String(a[field]).localeCompare(String(b[field])));
    const normalize = (row: Record<string, unknown>): Record<string, unknown> => ({
      ...row,
      tags: sortByField(row.tags as Record<string, unknown>[], 'id'),
    });

    expect(normalize(result as unknown as Record<string, unknown>)).toEqual(normalize(legacy));
  });
});

describe('PlacesRepository.findWithTagsAndRatings — parity with the legacy getPlaceWithTags (per-case)', () => {
  it('PLACEREPO-001: no category, no tags, no ratings — null category, empty arrays, null average', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    // category_id: null override defeats createPlace's default-first-category fallback.
    testDb.prepare('DELETE FROM categories').run();
    const place = createPlace(testDb, trip.id, { name: 'Uncategorized Spot' });

    const result = await places.findWithTagsAndRatings(place.id);
    expect(result).toMatchObject({
      id: place.id,
      name: 'Uncategorized Spot',
      category: null,
      tags: [],
      ratings: [],
      rating_avg: null,
      rating_count: 0,
    });
  });

  it('PLACEREPO-002: a category joins in by name/color/icon, not just its id', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const category = createCategory(testDb, { name: 'Museums', color: '#123456', icon: '🏛️' });
    const place = createPlace(testDb, trip.id, { category_id: category.id });

    const result = await places.findWithTagsAndRatings(place.id);
    expect(result?.category).toEqual({ id: category.id, name: 'Museums', color: '#123456', icon: '🏛️' });
  });

  it('PLACEREPO-003: tags attach through place_tags, each one the full tags row', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    const tagA = createTag(testDb, owner.id, { name: 'Must see' });
    const tagB = createTag(testDb, owner.id, { name: 'Rainy day' });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tagA.id);
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tagB.id);

    const result = await places.findWithTagsAndRatings(place.id);
    expect(result?.tags).toHaveLength(2);
    expect(result?.tags.map((tg) => tg.name).sort()).toEqual(['Must see', 'Rainy day']);
  });

  it('PLACEREPO-004: ratings hydrate with the voter\'s username/avatar, in created_at order, and average correctly', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voterA } = createUser(testDb, { username: 'voter_a' });
    const { user: voterB } = createUser(testDb, { username: 'voter_b' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    testDb
      .prepare("INSERT INTO place_ratings (place_id, user_id, rating, created_at) VALUES (?, ?, ?, datetime('now', '-2 minutes'))")
      .run(place.id, voterA.id, 4);
    // Task 0b review M1: 4-and-2 averages to 3, which `Math.round(3)` also
    // equals — the brief's own named mutation (wrapping the average in
    // `Math.round(...)`) survived undetected. 4-and-3 averages to 3.5,
    // which `Math.round` would corrupt to 3 or 4 — mutation-proved.
    testDb
      .prepare("INSERT INTO place_ratings (place_id, user_id, rating, created_at) VALUES (?, ?, ?, datetime('now', '-1 minutes'))")
      .run(place.id, voterB.id, 3);

    const result = await places.findWithTagsAndRatings(place.id);
    expect(result?.ratings).toHaveLength(2);
    expect(result?.ratings.map((r) => r.username)).toEqual(['voter_a', 'voter_b']);
    expect(result?.rating_avg).toBe(3.5);
    expect(result?.rating_count).toBe(2);
  });

  // Task 0b review B1 (HIGH, live regression): `ratings[].user_id` was
  // emitted as `u__id` at runtime (a `join('pr.user','u')` + `.select(['pr.user',
  // …])` interaction — TypeScript's declared `PlaceRatingRow.user_id` never
  // existed on the actual row). The client's `StarRating.tsx` keys off
  // `ratings.find(r => r.user_id === currentUserId)`, so this is the direct
  // regression proof neither PLACEREPO-004 (keys off `username`) nor any
  // other suite caught.
  it('PLACEREPO-007 (0b review B1): a rating row carries a real user_id key, not u__id', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voter } = createUser(testDb, { username: 'keyed_voter' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('INSERT INTO place_ratings (place_id, user_id, rating) VALUES (?, ?, ?)').run(place.id, voter.id, 5);

    const result = await places.findWithTagsAndRatings(place.id);
    expect(result?.ratings[0]).toEqual({ user_id: voter.id, username: 'keyed_voter', avatar: null, rating: 5 });
    expect(result?.ratings[0]).not.toHaveProperty('u__id');
  });

  // Task 0b review B2 (HIGH, live regression): `category_name`/
  // `category_color`/`category_icon` rode along on the legacy
  // `getPlaceWithTags`'s runtime object (`{...place, category: ...}` over
  // the raw `SELECT p.*, c.name as category_name, …` row) even though the
  // declared `PlaceWithTags` interface never mentioned them — several live
  // client call sites read them flat (map popups, dashboard, shared-trip
  // page), so a repository that strips them via `const { category_name,
  // ..., ...placeRest } = place` silently breaks those, even though every
  // OTHER assertion in this file (which reads through `result?.category`)
  // stays green.
  it('PLACEREPO-008 (0b review B2): the flat category_name/category_color/category_icon columns ride along on the row, alongside the nested category object', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const category = createCategory(testDb, { name: 'Cafes', color: '#654321', icon: '☕' });
    const place = createPlace(testDb, trip.id, { category_id: category.id });

    const result = await places.findWithTagsAndRatings(place.id) as unknown as Record<string, unknown>;
    expect(result.category_name).toBe('Cafes');
    expect(result.category_color).toBe('#654321');
    expect(result.category_icon).toBe('☕');
    expect(result.category).toEqual({ id: category.id, name: 'Cafes', color: '#654321', icon: '☕' });
  });

  it('PLACEREPO-009: a missing place id resolves to null, not a throw', async () => {
    expect(await places.findWithTagsAndRatings(999999)).toBeNull();
  });

  it('PLACEREPO-010: a non-numeric-looking id resolves to null, the same raw-bind seam TripsRepository documents', async () => {
    expect(await places.findWithTagsAndRatings('abc')).toBeNull();
  });
});

// Plan 3c Task 1, PP6 ruling (option 2): the `places`-owned half of
// `PlacePhotoCacheService.isReferenced`'s legacy `UNION ALL … LIMIT 1`.
describe('PlacesRepository.existsByGoogleIdOrImageUrl', () => {
  it('EXISTSGOOGLEORIMAGE-001: true when a place carries the google_place_id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET google_place_id = ? WHERE id = ?').run('ChIJ-gpid', place.id);
    expect(await places.existsByGoogleIdOrImageUrl('ChIJ-gpid', '/api/maps/place-photo/ChIJ-gpid/bytes')).toBe(true);
  });

  it('EXISTSGOOGLEORIMAGE-002: true when a place carries the proxy image_url instead (coords: pseudo-ids never have a google_place_id)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const proxyUrl = '/api/maps/place-photo/coords%3A1%3A2/bytes';
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run(proxyUrl, place.id);
    expect(await places.existsByGoogleIdOrImageUrl('coords:1:2', proxyUrl)).toBe(true);
  });

  it('EXISTSGOOGLEORIMAGE-003: false when nothing references either value', async () => {
    expect(await places.existsByGoogleIdOrImageUrl('never-seen', '/api/maps/place-photo/never-seen/bytes')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 4 — the new PlacesRepository methods.
// ---------------------------------------------------------------------------

describe('PlacesRepository.existsInTrip / findInTrip / reclaimInputs / deleteById (PL0/PL7/PL9/PL17/PL19/PL48/PL49/AS5)', () => {
  it('PLACEREPO-012: existsInTrip is true only for the matching id+trip pair', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    expect(await places.existsInTrip(place.id, trip.id)).toBe(true);
    expect(await places.existsInTrip(place.id, otherTrip.id)).toBe(false);
    expect(await places.existsInTrip(999999, trip.id)).toBe(false);
  });

  // Task 9 fix wave (B-M3): relabelled. `findInTrip` is a
  // `qb().execute('get', false)` projection, which never hydrates an entity
  // into the identity map by construction, and the base default leaves the
  // identity map disabled for every read anyway — there is no live
  // identity-map entry here to bypass. This proves a DB round-trip, not an
  // identity-map bypass.
  it('PLACEREPO-013 (fresh after a raw UPDATE, not D-shape): a name write after an unrelated identity-map read is visible in findInTrip\'s FIRST wider read', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Before' });
    // Populate the identity map with an unrelated, WIDER read first — `{ disableIdentityMap: false }`
    // explicitly (program rule 20: the base default leaves the identity map empty, making this vacuous).
    await t.repo(Places).find({ trip: trip.id }, { disableIdentityMap: false });
    testDb.prepare('UPDATE places SET name = ? WHERE id = ?').run('After', place.id);
    const row = await places.findInTrip(place.id, trip.id);
    expect(row?.name).toBe('After');
  });

  // Task 9 fix wave (B-M4, rule 19): widened from `toMatchObject` on 3 keys
  // (a title claiming "every scalar column" that only checked 3 of 28) to
  // `toEqual(legacy SELECT p.* ... WHERE p.id = ? AND p.trip_id = ? run raw)`
  // on the full key set, plus a fully NULL-nullable-column row, so a
  // renamed or dropped column would fail this test.
  it('PLACEREPO-014: findInTrip returns every scalar column (PL9/PL48\'s SELECT *), full toEqual(legacy) parity, undefined cross-trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const category = createCategory(testDb);
    const place = createPlace(testDb, trip.id, { name: 'Full Row' });
    testDb.prepare(`
      UPDATE places SET description = ?, lat = ?, lng = ?, address = ?, category_id = ?, price = ?, currency = ?,
        reservation_status = ?, reservation_notes = ?, reservation_datetime = ?, place_time = ?, end_time = ?,
        duration_minutes = ?, notes = ?, image_url = ?, google_place_id = ?, google_ftid = ?, website = ?, phone = ?,
        transport_mode = ?, osm_id = ?, route_geometry = ?, route_color = ?, stop_type = ?, fill_percent = ?,
        amap_poi_id = ?, source = ?
      WHERE id = ?
    `).run(
      'A description with 007-style digits', 48.1, 2.2, '007 Rue de Paris', category.id, 12.5, 'EUR',
      'confirmed', 'notes-a', '2026-01-01T10:00:00Z', '10:00', '11:00',
      45, 'place notes', '/img/a.png', 'gpid-007', 'gftid-a', 'https://a.example', '+33 1 23 45 67 89',
      'driving', 'osm-a', '{"type":"LineString"}', '#ff0000', 'hotel', 50,
      'amap-a', 'manual',
      place.id,
    );

    const row = await places.findInTrip(place.id, trip.id);
    const legacy = testDb.prepare('SELECT * FROM places WHERE id = ? AND trip_id = ?').get(place.id, trip.id);
    expect(row).toEqual(legacy);
    expect(row).toMatchObject({ id: place.id, trip_id: trip.id, name: 'Full Row', google_place_id: 'gpid-007' });
    expect(await places.findInTrip(place.id, otherTrip.id)).toBeUndefined();
  });

  it('PLACEREPO-052: findInTrip on a bare row — every nullable column comes back null (rule 16), matching legacy', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bare Place' });
    const row = await places.findInTrip(place.id, trip.id);
    const legacy = testDb.prepare('SELECT * FROM places WHERE id = ? AND trip_id = ?').get(place.id, trip.id);
    expect(row).toEqual(legacy);
    expect(row?.description).toBeNull();
    expect(row?.google_ftid).toBeNull();
  });

  it('PLACEREPO-015: reclaimInputs projects only google_place_id/image_url', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET google_place_id = ?, image_url = ? WHERE id = ?').run('gpid-1', '/uploads/places/x.jpg', place.id);
    expect(await places.reclaimInputs(place.id, trip.id)).toEqual({ google_place_id: 'gpid-1', image_url: '/uploads/places/x.jpg' });
    expect(await places.reclaimInputs(999999, trip.id)).toBeUndefined();
  });

  it('PLACEREPO-016: deleteById removes exactly that row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const keep = createPlace(testDb, trip.id, { name: 'Keep' });
    const gone = createPlace(testDb, trip.id, { name: 'Gone' });
    await places.deleteById(gone.id);
    expect(testDb.prepare('SELECT id FROM places WHERE id = ?').get(gone.id)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM places WHERE id = ?').get(keep.id)).toBeDefined();
  });
});

describe('PlacesRepository.scopedIds (PL23) — input-order preservation', () => {
  it('PLACEREPO-017: returns only the trip\'s own ids, in the CALLER\'s input order, not row/id order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id);
    const p2 = createPlace(testDb, trip.id);
    const p3 = createPlace(testDb, trip.id);
    const foreign = createPlace(testDb, other.id);
    // Deliberately out of id order and interleaved with a foreign + missing id.
    const result = await places.scopedIds(trip.id, [p3.id, 999999, p1.id, foreign.id, p2.id]);
    expect(result).toEqual([p3.id, p1.id, p2.id]);
  });

  it('PLACEREPO-018: empty input short-circuits to []', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.scopedIds(trip.id, [])).toEqual([]);
  });
});

describe('PlacesRepository.insertPlace (PL4) / updatePlace (PL11)', () => {
  it('PLACEREPO-019: insertPlace writes every one of the 27 columns and returns the generated id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const id = await places.insertPlace({
      trip_id: trip.id, name: 'Full Insert', description: 'd', lat: 0, lng: 0, address: 'a',
      category_id: null, price: 0, currency: 'USD', place_time: '09:00', end_time: '10:00',
      duration_minutes: 60, notes: 'n', image_url: '/uploads/places/x.jpg', google_place_id: 'g',
      google_ftid: 'f', osm_id: 'o', amap_poi_id: 'am', website: 'w', phone: 'p', email: 'e@x.test', opening_hours: 'Mo-Fr 09:00-17:00',
      transport_mode: 'walking', route_geometry: '[[1,2]]', route_color: '#fff', stop_type: 'fuel',
      fill_percent: 50,
    });
    const row = await places.findInTrip(id, trip.id);
    expect(row).toMatchObject({
      trip_id: trip.id, name: 'Full Insert', description: 'd', lat: 0, lng: 0, address: 'a',
      category_id: null, price: 0, currency: 'USD', place_time: '09:00', end_time: '10:00',
      duration_minutes: 60, notes: 'n', image_url: '/uploads/places/x.jpg', google_place_id: 'g',
      google_ftid: 'f', osm_id: 'o', amap_poi_id: 'am', website: 'w', phone: 'p', email: 'e@x.test', opening_hours: 'Mo-Fr 09:00-17:00',
      transport_mode: 'walking', route_geometry: '[[1,2]]', route_color: '#fff', stop_type: 'fuel',
      fill_percent: 50,
    });
  });

  it('PLACEREPO-020 (PL11 matrix): a written null vs a written value are byte-distinct on the same column', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Original' });
    const base = {
      name: 'Original', description: null, lat: null, lng: null, address: null, category_id: null,
      price: null, currency: null, place_time: null, end_time: null, duration_minutes: null,
      notes: null, image_url: null, google_place_id: null, google_ftid: null, osm_id: null,
      amap_poi_id: null, website: null, phone: null, email: null, opening_hours: null, transport_mode: null, route_color: null,
      stop_type: null, fill_percent: null,
    };
    // A non-COALESCE column (description) written explicitly null clears it.
    await places.updatePlace(place.id, { ...base, description: 'first' });
    expect((await places.findInTrip(place.id, trip.id))?.description).toBe('first');
    await places.updatePlace(place.id, { ...base, description: null });
    expect((await places.findInTrip(place.id, trip.id))?.description).toBeNull();
    // duration_minutes: 0 is a real value, distinct from null (the service's
    // `!== undefined` fallback — this repository test proves the write itself
    // stores 0 and null distinctly, not that either collapses to the other).
    await places.updatePlace(place.id, { ...base, duration_minutes: 0 });
    expect((await places.findInTrip(place.id, trip.id))?.duration_minutes).toBe(0);
    await places.updatePlace(place.id, { ...base, duration_minutes: null });
    expect((await places.findInTrip(place.id, trip.id))?.duration_minutes).toBeNull();
  });

  it('PLACEREPO-021: updatePlace stamps updated_at with the current time', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Stampable' });
    // Force a stale, second-resolution-distinguishable `updated_at` — this
    // write and the assertion below both happen within the same real
    // second, so comparing against `createPlace`'s own `CURRENT_TIMESTAMP`
    // default would be flaky (Object.is on two identical second-granularity
    // strings), not a proof of anything.
    testDb.prepare("UPDATE places SET updated_at = datetime('now', '-1 hour') WHERE id = ?").run(place.id);
    const before = (await places.findInTrip(place.id, trip.id))?.updated_at;
    await places.updatePlace(place.id, {
      name: 'Stamped', description: null, lat: null, lng: null, address: null, category_id: null,
      price: null, currency: null, place_time: null, end_time: null, duration_minutes: null,
      notes: null, image_url: null, google_place_id: null, google_ftid: null, osm_id: null,
      amap_poi_id: null, website: null, phone: null, email: null, opening_hours: null, transport_mode: null, route_color: null,
      stop_type: null, fill_percent: null,
    });
    const after = await places.findInTrip(place.id, trip.id);
    expect(after?.name).toBe('Stamped');
    expect(after?.updated_at).not.toBe(before);
  });
});

describe('PlacesRepository.findDuplicateByExternalId / findDuplicateByName / findDuplicateByCoords (PL25/PL26/PL27)', () => {
  it('PLACEREPO-022 (PL25): matches on any of the four provider-id columns, lowest id wins', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const first = createPlace(testDb, trip.id, { name: 'First' });
    testDb.prepare('UPDATE places SET osm_id = ? WHERE id = ?').run('node:123', first.id);
    const second = createPlace(testDb, trip.id, { name: 'Second' });
    testDb.prepare('UPDATE places SET google_ftid = ? WHERE id = ?').run('node:123', second.id);
    const hit = await places.findDuplicateByExternalId(String(trip.id), 'node:123');
    expect(hit?.id).toBe(first.id);
  });

  // Task 4 review L2: only osm_id/google_ftid were exercised — a mutation
  // dropping `amap_poi_id` from the `$or` survived every suite until this.
  it('PLACEREPO-022b (PL25, L2): matches on amap_poi_id alone (no osm_id/google_ftid/google_place_id set)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Amap-only' });
    testDb.prepare('UPDATE places SET amap_poi_id = ? WHERE id = ?').run('B0FFH00X01', place.id);
    const hit = await places.findDuplicateByExternalId(String(trip.id), 'B0FFH00X01');
    expect(hit?.id).toBe(place.id);
  });

  it('PLACEREPO-023 (PL26, rule 18 exception): lower(trim(name)) matches ASCII-folded names; a non-ASCII cased letter does NOT match — the documented legacy divergence, pinned not fixed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: '  Café Central  ' });
    // The service's own JS-lowered+trimmed value, matching `normalizePlaceName`'s
    // Unicode-aware fold — this side is honest, so it would match the row exactly.
    const jsLowered = '  café central  '.trim().toLowerCase();
    // SQLite's lower()/trim() is ASCII-only: it lowercases "C" but never touches
    // "É"/"é" — `Café Central` (stored) trims+lowers via SQL to `café central`.
    const hit = await places.findDuplicateByName(String(trip.id), jsLowered);
    expect(hit?.id).toBe(place.id);
    // A row stored with an upper-case accented letter (`CAFÉ`) does NOT match a
    // JS-lowered candidate (`café`) — SQLite's LOWER() never folds `É` to `é`,
    // reproducing the documented disagreement (places.service.ts's own PL26 docstring).
    const accented = createPlace(testDb, trip.id, { name: 'CAFÉ NORD' });
    const jsLoweredAccented = 'café nord'.toLowerCase();
    const miss = await places.findDuplicateByName(String(trip.id), jsLoweredAccented);
    expect(miss?.id).not.toBe(accented.id);
  });

  it('PLACEREPO-024 (PL27): matches within the coordinate tolerance box, on both lat and lng', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { lat: 48.8566, lng: 2.3522 });
    const hit = await places.findDuplicateByCoords(String(trip.id), 48.8566 + 0.00005, 2.3522 - 0.00005, 0.0001);
    expect(hit?.id).toBe(place.id);
    const miss = await places.findDuplicateByCoords(String(trip.id), 48.9, 2.5, 0.0001);
    expect(miss).toBeUndefined();
  });

  // Task 4 review L2: PLACEREPO-024's miss case differed on both lat AND
  // lng, so `lng` alone was never proven — a mutation widening the lng
  // tolerance (or dropping the lng check entirely) survived every suite
  // until this.
  it('PLACEREPO-024b (PL27, L2): a candidate within lat tolerance but OUTSIDE lng tolerance is a miss', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { lat: 48.8566, lng: 2.3522 });
    // lat matches exactly; lng is 0.01 off — 100x the tolerance below.
    const miss = await places.findDuplicateByCoords(String(trip.id), 48.8566, 2.3622, 0.0001);
    expect(miss).toBeUndefined();
  });
});

describe('PlacesRepository.listForGpx (PL29) and existsByImageUrl (PI1)', () => {
  it('PLACEREPO-025: projects the waypoint columns plus the flat category name, ordered by id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const category = createCategory(testDb, { name: 'Trails' });
    const p1 = createPlace(testDb, trip.id, { name: 'A', category_id: category.id });
    // `createPlace` always falls back to the first available category when
    // no override is given (its own `?? defaultCat?.id ?? null` chain — an
    // explicit `category_id: null` override is ALSO nullish, so it falls
    // through the same way), and deleting the categories table would also
    // break p1's own join. Insert place B directly instead, to genuinely
    // pin `category_id = NULL` while `category` (p1's) still exists.
    const p2Id = testDb.prepare('INSERT INTO places (trip_id, name, category_id) VALUES (?, ?, NULL)').run(trip.id, 'B').lastInsertRowid;
    const p2 = { id: p2Id as number };
    const rows = await places.listForGpx(String(trip.id));
    expect(rows.map((r) => r.name)).toEqual(['A', 'B']);
    expect(rows[0]).toMatchObject({ name: 'A', category: 'Trails' });
    expect(rows[1]).toMatchObject({ name: 'B', category: null });
    void p1; void p2;
  });

  it('PLACEREPO-026 (PI1): existsByImageUrl is trip-agnostic — true for any place carrying the url', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/uploads/places/shared.jpg', place.id);
    expect(await places.existsByImageUrl('/uploads/places/shared.jpg')).toBe(true);
    expect(await places.existsByImageUrl('/uploads/places/nope.jpg')).toBe(false);
  });
});

/**
 * PL24 (Task 5 review L6 ruling): `listDedupInputs` carries only the
 * legacy projection — `PlacesService.buildDedupSet`'s JS folding (name
 * lowercase+trim, coordinates only for unnamed rows, provider ids for every
 * row) is untested here on purpose; it belongs to, and is already covered
 * by, the service-level dedup tests.
 */
describe('PlacesRepository.listDedupInputs (PL24)', () => {
  it('PLACEREPO-048: projects exactly the seven dedup columns, scoped to the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    testDb.prepare(
      `INSERT INTO places (trip_id, name, lat, lng, google_place_id, google_ftid, osm_id, amap_poi_id)
       VALUES (?, 'Louvre', 48.86, 2.34, 'gp1', 'ft1', 'osm1', 'amap1')`,
    ).run(trip.id);
    testDb.prepare(
      `INSERT INTO places (trip_id, name, lat, lng) VALUES (?, '', 1.1, 2.2)`,
    ).run(trip.id);
    createPlace(testDb, other.id, { name: 'Not this trip' });

    const rows = await places.listDedupInputs(String(trip.id));
    expect(rows).toEqual([
      { name: 'Louvre', lat: 48.86, lng: 2.34, google_place_id: 'gp1', google_ftid: 'ft1', osm_id: 'osm1', amap_poi_id: 'amap1' },
      { name: '', lat: 1.1, lng: 2.2, google_place_id: null, google_ftid: null, osm_id: null, amap_poi_id: null },
    ]);
  });

  it('PLACEREPO-049: an empty trip returns an empty array', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.listDedupInputs(String(trip.id))).toEqual([]);
  });
});

describe('PlacesRepository.listForTrip (PL3) — filter fragments', () => {
  it('PLACEREPO-027: no filters — every trip place, DISTINCT, newest first', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const older = createPlace(testDb, trip.id, { name: 'Older' });
    testDb.prepare("UPDATE places SET created_at = datetime('now', '-1 hour') WHERE id = ?").run(older.id);
    const newer = createPlace(testDb, trip.id, { name: 'Newer' });
    const rows = await places.listForTrip(String(trip.id), {});
    expect(rows.map((r) => r.id)).toEqual([newer.id, older.id]);
  });

  it('PLACEREPO-028: searchPattern matches name/address/description (already-escaped, wrapped by the caller — NOT a test of the ESCAPE clause itself: `%Eiffel%` has no literal `%`/`_` to escape. `ESCAPE \'\\\'` is proven by `PLACE-SVC-068`/PLACEREPO-028b below, which do carry a literal wildcard character)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const hit = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    const miss = createPlace(testDb, trip.id, { name: 'Louvre' });
    const rows = await places.listForTrip(String(trip.id), { searchPattern: '%Eiffel%' });
    expect(rows.map((r) => r.id)).toEqual([hit.id]);
    void miss;
  });

  it('PLACEREPO-028b (M2 — the ESCAPE clause this repository method actually relies on): a literal `%` in the already-escaped pattern matches literally, not as a wildcard', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // escapeLikePattern (the service) would have produced this pattern for a
    // literal search term "50%": the `%` the user typed is backslash-escaped,
    // and the wrapping `%…%` are the real wildcards this method adds.
    const hit = createPlace(testDb, trip.id, { name: '50% off tour' });
    const miss = createPlace(testDb, trip.id, { name: '50X off tour' });
    const rows = await places.listForTrip(String(trip.id), { searchPattern: '%50\\%%' });
    expect(rows.map((r) => r.id)).toEqual([hit.id]);
    void miss;
  });

  it('PLACEREPO-029: category filters to that category_id only', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = createCategory(testDb, { name: 'Museums' });
    const inCat = createPlace(testDb, trip.id, { category_id: cat.id });
    const outCat = createPlace(testDb, trip.id);
    testDb.prepare('DELETE FROM categories WHERE id != ?').run(cat.id);
    const rows = await places.listForTrip(String(trip.id), { category: String(cat.id) });
    expect(rows.map((r) => r.id)).toEqual([inCat.id]);
    void outCat;
  });

  it('PLACEREPO-030: tag filters via the place_tags subquery', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag = createTag(testDb, user.id, { name: 'Must see' });
    const tagged = createPlace(testDb, trip.id, { name: 'Tagged' });
    const untagged = createPlace(testDb, trip.id, { name: 'Untagged' });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(tagged.id, tag.id);
    const rows = await places.listForTrip(String(trip.id), { tag: String(tag.id) });
    expect(rows.map((r) => r.id)).toEqual([tagged.id]);
    void untagged;
  });

  it('PLACEREPO-031: assignment=unassigned / assigned split the trip\'s places by day_assignments membership', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const assigned = createPlace(testDb, trip.id, { name: 'On a day' });
    const unassigned = createPlace(testDb, trip.id, { name: 'In the pool' });
    createDayAssignment(testDb, day.id, assigned.id);
    const assignedRows = await places.listForTrip(String(trip.id), { assignment: 'assigned' });
    expect(assignedRows.map((r) => r.id)).toEqual([assigned.id]);
    const unassignedRows = await places.listForTrip(String(trip.id), { assignment: 'unassigned' });
    expect(unassignedRows.map((r) => r.id)).toEqual([unassigned.id]);
  });

  it('PLACEREPO-032: search + category + tag + assignment combine with AND, all four fragments at once', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = createCategory(testDb, { name: 'Parks' });
    const tag = createTag(testDb, user.id, { name: 'Green' });
    const day = createDay(testDb, trip.id);
    const winner = createPlace(testDb, trip.id, { name: 'Central Park', category_id: cat.id });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(winner.id, tag.id);
    createDayAssignment(testDb, day.id, winner.id);
    // A near-miss on every axis, to prove the AND actually excludes it.
    const other = createPlace(testDb, trip.id, { name: 'Central Park Annex', category_id: cat.id });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(other.id, tag.id);
    // `other` is left unassigned, so `assignment: 'assigned'` alone should exclude it.
    const rows = await places.listForTrip(String(trip.id), {
      searchPattern: '%Central Park%', category: String(cat.id), tag: String(tag.id), assignment: 'assigned',
    });
    expect(rows.map((r) => r.id)).toEqual([winner.id]);
  });
});

/**
 * PL3 parity (Task 4 review M2/rule 19): the base `94c6efbbc` raw statement
 * (`places.service.ts:180-217` at that commit — reproduced verbatim below,
 * the same `let query += …` composition, the same param order), run over
 * every `search × category × tag × assignment` combination
 * (2 × 2 × 2 × 4 = 32, undefined/present for the first three, {undefined,
 * 'all', 'assigned', 'unassigned'} for the fourth). Each cell asserts
 * `toEqual` on the FULL row set from both statements, not just the id list —
 * a dropped/renamed column would pass an id-only comparison silently.
 */
describe('PlacesRepository.listForTrip (PL3) — toEqual(legacy) over all 32 filter combinations', () => {
  function legacyListForTrip(
    tripId: string,
    filters: { searchPattern?: string; category?: string; tag?: string; assignment?: 'all' | 'unassigned' | 'assigned' },
  ): unknown[] {
    let query = `
      SELECT DISTINCT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
        pr.country_code as country_code, pr.region_name as region_name
      FROM places p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN place_regions pr ON pr.place_id = p.id
      WHERE p.trip_id = ?
    `;
    const params: (string | number)[] = [tripId];

    if (filters.searchPattern) {
      query += " AND (p.name LIKE ? ESCAPE '\\' OR p.address LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')";
      params.push(filters.searchPattern, filters.searchPattern, filters.searchPattern);
    }
    if (filters.category) {
      query += ' AND p.category_id = ?';
      params.push(filters.category);
    }
    if (filters.tag) {
      query += ' AND p.id IN (SELECT place_id FROM place_tags WHERE tag_id = ?)';
      params.push(filters.tag);
    }
    if (filters.assignment === 'unassigned') {
      query += ' AND p.id NOT IN (SELECT da.place_id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE d.trip_id = ?)';
      params.push(tripId);
    } else if (filters.assignment === 'assigned') {
      query += ' AND p.id IN (SELECT da.place_id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE d.trip_id = ?)';
      params.push(tripId);
    }
    query += ' ORDER BY p.created_at DESC';
    return testDb.prepare(query).all(...params);
  }

  it('PLACEREPO-032b (PL3, M2): every row, every column, on all 32 combinations, byte-identical to the legacy raw statement', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const cat = createCategory(testDb, { name: 'Museums' });
    const tag = createTag(testDb, user.id, { name: 'Must see' });
    const day = createDay(testDb, trip.id);

    // p1: category + tag + assigned + matches the search term.
    const p1 = createPlace(testDb, trip.id, { name: 'Central Park', category_id: cat.id });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(p1.id, tag.id);
    createDayAssignment(testDb, day.id, p1.id);
    // p2: category, no tag, unassigned, matches the search term (a near-miss on 3 of 4 axes).
    createPlace(testDb, trip.id, { name: 'Central Station', category_id: cat.id });
    // p3: no category, tag + assigned, does NOT match the search term.
    const p3 = createPlace(testDb, trip.id, { name: 'Louvre' });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(p3.id, tag.id);
    createDayAssignment(testDb, day.id, p3.id);
    // p4: no category, no tag, unassigned, does NOT match the search term.
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    // Another trip's place, named to collide with the search term — must
    // never appear in either statement's output (both scope by trip_id).
    createPlace(testDb, otherTrip.id, { name: 'Central Perk' });

    const searchOptions: (string | undefined)[] = [undefined, '%Central%'];
    const categoryOptions: (string | undefined)[] = [undefined, String(cat.id)];
    const tagOptions: (string | undefined)[] = [undefined, String(tag.id)];
    const assignmentOptions: (('all' | 'unassigned' | 'assigned') | undefined)[] = [undefined, 'all', 'assigned', 'unassigned'];

    let combinations = 0;
    for (const searchPattern of searchOptions) {
      for (const category of categoryOptions) {
        for (const tag_ of tagOptions) {
          for (const assignment of assignmentOptions) {
            combinations++;
            const filters = { searchPattern, category, tag: tag_, assignment };
            const actual = await places.listForTrip(String(trip.id), filters);
            const legacy = legacyListForTrip(String(trip.id), filters);
            expect(actual).toEqual(legacy);
          }
        }
      }
    }
    expect(combinations).toBe(32);
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 5 — the four importers' `insertPlace` column sets, the
// colorize read+write transaction, the ftid backfill, and the
// enrichment/backfill `fillIfEmpty` matrix.
// ---------------------------------------------------------------------------

describe('PlacesRepository.insertPlace — the four importers\' narrower column sets (PL31/34/38/41), read back inside the same transaction (PL32/35/40/42)', () => {
  const base = {
    address: null, category_id: null, price: null, currency: null,
    place_time: null, end_time: null, duration_minutes: 60, notes: null, image_url: null,
    google_place_id: null, google_ftid: null, osm_id: null, amap_poi_id: null, website: null,
    phone: null, email: null, opening_hours: null, transport_mode: 'walking', route_geometry: null, route_color: null,
    stop_type: null, fill_percent: null,
  };

  it('PLACEREPO-033 (PL31/PL32, GPX): the 7-column GPX shape is stored, and the read inside the same transaction sees the uncommitted row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const row = await t.em.transactional(async () => {
      const id = await places.insertPlace({
        ...base,
        trip_id: trip.id, name: 'GPX Waypoint', description: 'from a gpx file',
        lat: 48.85, lng: 2.35, route_geometry: '[[48.85,2.35],[48.86,2.36]]',
      });
      // Same transaction, no commit yet — this read must still see it.
      return places.findWithTagsAndRatings(id);
    });

    expect(row).toMatchObject({
      trip_id: trip.id, name: 'GPX Waypoint', description: 'from a gpx file',
      lat: 48.85, lng: 2.35, address: null, category_id: null, notes: null,
      transport_mode: 'walking', route_geometry: '[[48.85,2.35],[48.86,2.36]]',
      duration_minutes: 60, category: null, tags: [], ratings: [],
    });
    // Committed for real, not just visible mid-transaction.
    expect(testDb.prepare('SELECT name FROM places WHERE trip_id = ?').get(trip.id)).toMatchObject({ name: 'GPX Waypoint' });
  });

  it('PLACEREPO-033b: a transaction that throws after the insert leaves no row behind — the insert really was uncommitted, not autocommitted ahead of the wrapper', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await expect(t.em.transactional(async () => {
      const id = await places.insertPlace({ ...base, trip_id: trip.id, name: 'Rolled back', description: null, lat: 1, lng: 1 });
      // The uncommitted row is visible to a read inside the same transaction...
      const seen = await places.findWithTagsAndRatings(id);
      expect(seen?.name).toBe('Rolled back');
      throw new Error('force rollback');
    })).rejects.toThrow('force rollback');

    // ...but never lands once the wrapping transaction rolls back.
    expect(testDb.prepare('SELECT COUNT(*) as c FROM places WHERE trip_id = ?').get(trip.id)).toMatchObject({ c: 0 });
  });

  it('PLACEREPO-034 (PL34/PL35, KML): the 8-column KML shape (adds category_id) is stored, read back in the same transaction', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = createCategory(testDb, { name: 'Hiking' });

    const row = await t.em.transactional(async () => {
      const id = await places.insertPlace({
        ...base,
        trip_id: trip.id, name: 'Placemark 1', description: 'a kml placemark',
        lat: 35.0, lng: 139.0, category_id: cat.id, route_geometry: null,
      });
      return places.findWithTagsAndRatings(id);
    });

    expect(row).toMatchObject({
      trip_id: trip.id, name: 'Placemark 1', description: 'a kml placemark',
      lat: 35.0, lng: 139.0, category_id: cat.id, duration_minutes: 60,
      transport_mode: 'walking', address: null, notes: null,
      category: { id: cat.id, name: 'Hiking' },
    });
  });

  it('PLACEREPO-035 (PL38/PL40, Google list): the 7-column Google shape (notes + google_ftid) is stored, read back in the same transaction', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const row = await t.em.transactional(async () => {
      const id = await places.insertPlace({
        ...base,
        trip_id: trip.id, name: 'Google Place', description: null,
        lat: 40.7, lng: -74.0, notes: 'a note', google_ftid: '0x1:0x2',
      });
      return places.findWithTagsAndRatings(id);
    });

    expect(row).toMatchObject({
      trip_id: trip.id, name: 'Google Place', notes: 'a note', google_ftid: '0x1:0x2',
      lat: 40.7, lng: -74.0, address: null, category_id: null, duration_minutes: 60,
      transport_mode: 'walking',
    });
  });

  it('PLACEREPO-036 (PL41/PL42, Naver list): the 7-column Naver shape (address + notes) is stored, read back in the same transaction', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const row = await t.em.transactional(async () => {
      const id = await places.insertPlace({
        ...base,
        trip_id: trip.id, name: 'Naver Spot', description: null,
        lat: 37.5, lng: 127.0, address: '123 Some Street', notes: 'a naver note',
      });
      return places.findWithTagsAndRatings(id);
    });

    expect(row).toMatchObject({
      trip_id: trip.id, name: 'Naver Spot', address: '123 Some Street', notes: 'a naver note',
      lat: 37.5, lng: 127.0, category_id: null, duration_minutes: 60, transport_mode: 'walking',
    });
  });
});

describe('PlacesRepository.distinctRouteColors / setRouteColor (PL36/PL37)', () => {
  it('PLACEREPO-037: distinctRouteColors returns only this trip\'s non-null colours, scoped by trip_id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    testDb.prepare("INSERT INTO places (trip_id, name, lat, lng, route_geometry, route_color) VALUES (?, 'A', 1, 1, '[[1,1]]', ?)").run(trip.id, TRACK_COLORS[0]);
    testDb.prepare("INSERT INTO places (trip_id, name, lat, lng, route_geometry, route_color) VALUES (?, 'B', 1, 1, '[[1,1]]', ?)").run(trip.id, TRACK_COLORS[1]);
    testDb.prepare("INSERT INTO places (trip_id, name, lat, lng, route_geometry) VALUES (?, 'C', 1, 1, '[[1,1]]')").run(trip.id);
    testDb.prepare("INSERT INTO places (trip_id, name, lat, lng, route_geometry, route_color) VALUES (?, 'D', 1, 1, '[[1,1]]', ?)").run(other.id, TRACK_COLORS[2]);

    const colors = await places.distinctRouteColors(trip.id);
    expect(new Set(colors)).toEqual(new Set([TRACK_COLORS[0], TRACK_COLORS[1]]));
  });

  it('PLACEREPO-038: setRouteColor writes the column without stamping updated_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET updated_at = ? WHERE id = ?').run('2020-01-01 00:00:00', place.id);

    await places.setRouteColor(place.id, TRACK_COLORS[3]);

    const row = testDb.prepare('SELECT route_color, updated_at FROM places WHERE id = ?').get(place.id) as { route_color: string; updated_at: string };
    expect(row.route_color).toBe(TRACK_COLORS[3]);
    expect(row.updated_at).toBe('2020-01-01 00:00:00');
  });

  it('PLACEREPO-039 (D6 single-connection race safety): two concurrent colour claims for the same trip never pick the same free colour', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const placeA = createPlace(testDb, trip.id, { name: 'Track A' });
    const placeB = createPlace(testDb, trip.id, { name: 'Track B' });
    testDb.prepare("UPDATE places SET route_geometry = '[[1,1]]' WHERE id IN (?, ?)").run(placeA.id, placeB.id);

    // Mirrors PlacesService.colorizeImportedTracks's own PL36+PL37 pairing
    // EXACTLY: the read AND the write for one claim share ONE transaction —
    // splitting them (read in one transaction, write in a second, separate
    // one) is precisely the bug this pairing exists to prevent, and doing
    // that here would make the test pass for the wrong reason.
    const claimAndWrite = (placeId: number) => t.em.transactional(async () => {
      const taken = new Set(await places.distinctRouteColors(trip.id));
      const free = TRACK_COLORS.find((c) => !taken.has(c));
      if (!free) throw new Error('palette exhausted');
      await places.setRouteColor(placeId, free);
      return free;
    });

    const [colorA, colorB] = await Promise.all([
      claimAndWrite(placeA.id),
      claimAndWrite(placeB.id),
    ]);

    expect(colorA).not.toBe(colorB);
    const rows = testDb.prepare('SELECT route_color FROM places WHERE id IN (?, ?)').all(placeA.id, placeB.id) as { route_color: string }[];
    expect(new Set(rows.map((r) => r.route_color)).size).toBe(2);
  });
});

describe('PlacesRepository.backfillFtid (PL39)', () => {
  it('PLACEREPO-040: stamps google_ftid and updated_at, unscoped by trip (the candidate was already resolved against the trip by findDuplicatePlace)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET updated_at = ? WHERE id = ?').run('2020-01-01 00:00:00', place.id);

    await places.backfillFtid(place.id, '0x9:0x9');

    const row = testDb.prepare('SELECT google_ftid, updated_at FROM places WHERE id = ?').get(place.id) as { google_ftid: string; updated_at: string };
    expect(row.google_ftid).toBe('0x9:0x9');
    expect(row.updated_at).not.toBe('2020-01-01 00:00:00');
  });
});

describe('PlacesRepository.fillIfEmpty (PL43/PL44/PL46) — three call shapes over one COALESCE-per-column method', () => {
  it('PLACEREPO-041 (PL43 shape): fills every empty column named in fields, stamps updated_at, and leaves an omitted column untouched', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET phone = ?, updated_at = ? WHERE id = ?').run('+1 555', '2020-01-01 00:00:00', place.id);

    await places.fillIfEmpty(place.id, trip.id, {
      google_place_id: 'gp1', google_ftid: 'gf1', address: 'addr1', website: 'https://x', phone: 'ignored',
    });

    const row = testDb.prepare('SELECT google_place_id, google_ftid, address, website, phone, updated_at FROM places WHERE id = ?').get(place.id) as Record<string, string>;
    expect(row.google_place_id).toBe('gp1');
    expect(row.google_ftid).toBe('gf1');
    expect(row.address).toBe('addr1');
    expect(row.website).toBe('https://x');
    // Already set — COALESCE keeps the existing value, not the caller's.
    expect(row.phone).toBe('+1 555');
    expect(row.updated_at).not.toBe('2020-01-01 00:00:00');
  });

  it('PLACEREPO-042: a column already set is NOT overwritten; an empty one is filled', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET address = ? WHERE id = ?').run('Existing address', place.id);

    await places.fillIfEmpty(place.id, trip.id, { address: 'New address' });

    expect((testDb.prepare('SELECT address FROM places WHERE id = ?').get(place.id) as { address: string }).address).toBe('Existing address');

    const empty = createPlace(testDb, trip.id, { name: 'No address yet' });
    await places.fillIfEmpty(empty.id, trip.id, { address: 'First address' });
    expect((testDb.prepare('SELECT address FROM places WHERE id = ?').get(empty.id) as { address: string }).address).toBe('First address');
  });

  it('PLACEREPO-043 (PL44 shape): image_url-only', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);

    await places.fillIfEmpty(place.id, trip.id, { image_url: '/api/maps/place-photo/x/bytes' });

    const row = testDb.prepare('SELECT image_url, google_place_id FROM places WHERE id = ?').get(place.id) as { image_url: string; google_place_id: string | null };
    expect(row.image_url).toBe('/api/maps/place-photo/x/bytes');
    // Not touched — the key was never in `fields`, not even COALESCE'd against itself.
    expect(row.google_place_id).toBeNull();
  });

  it('PLACEREPO-044 (PL46 shape): address-only', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);

    await places.fillIfEmpty(place.id, trip.id, { address: '1 Rue de Rivoli' });

    expect((testDb.prepare('SELECT address FROM places WHERE id = ?').get(place.id) as { address: string }).address).toBe('1 Rue de Rivoli');
  });

  it('PLACEREPO-045: WHERE id = ? AND trip_id = ? scoping — a mismatched trip_id writes nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);

    await places.fillIfEmpty(place.id, otherTrip.id, { address: 'Should not land' });

    expect((testDb.prepare('SELECT address FROM places WHERE id = ?').get(place.id) as { address: string | null }).address).toBeNull();
  });
});

// ── Plan 3c Task 7 (trips.rpc.ts::getPlaces, RP2) — additive ────────────────

describe('PlacesRepository.listForTripOrdered (RP2)', () => {
  it('PLACEREPO-046: every place of the trip, ORDER BY created_at DESC, scoped to the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id, { name: 'First' });
    testDb.prepare('UPDATE places SET created_at = ? WHERE id = ?').run('2026-01-01 00:00:00', p1.id);
    const p2 = createPlace(testDb, trip.id, { name: 'Second' });
    testDb.prepare('UPDATE places SET created_at = ? WHERE id = ?').run('2026-02-01 00:00:00', p2.id);
    createPlace(testDb, otherTrip.id, { name: 'Elsewhere' });

    const legacy = testDb.prepare('SELECT * FROM places WHERE trip_id = ? ORDER BY created_at DESC').all(trip.id);
    const rows = await places.listForTripOrdered(trip.id);
    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).toEqual([p2.id, p1.id]);
  });

  it('PLACEREPO-047: an empty trip returns an empty array, not a throw', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.listForTripOrdered(trip.id)).toEqual([]);
  });
});

// Task 9 fix wave (B-M4, rule 19): `listAllForTrip` (TP40, `TripsService.copy`'s
// places read) had no repository test at all. Full-row parity on a fully
// seeded fixture — every nullable column non-null in one row, null in the
// other, plus a unicode string and a '007'-style digit string — so a
// renamed/dropped column or a changed row order would fail this, not a
// `toMatchObject` on a few keys.
describe('PlacesRepository.listAllForTrip (TP40)', () => {
  it('PLACEREPO-050: every column, rowid scan order (no ORDER BY) — toEqual(legacy SELECT * run raw) on a fully seeded fixture', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const category = createCategory(testDb);

    const insert = testDb.prepare(`
      INSERT INTO places (
        trip_id, name, description, lat, lng, address, category_id, price, currency,
        reservation_status, reservation_notes, reservation_datetime, place_time, end_time,
        duration_minutes, notes, image_url, google_place_id, google_ftid, website, phone,
        transport_mode, created_at, updated_at, osm_id, route_geometry, route_color, stop_type,
        fill_percent, amap_poi_id, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Row A: every nullable column non-null — a unicode string and a
    // '007'-style digit string among the values (rule 19's fixture bar).
    const rowA = insert.run(
      trip.id, 'Café — 日本 ☕️', 'A description with 007-style digits', 48.1, 2.2, '007 Rue de Paris', category.id, 12.5, 'EUR',
      'confirmed', 'notes-a', '2026-01-01T10:00:00Z', '10:00', '11:00',
      45, 'place notes', '/img/a.png', 'gpid-007', 'gftid-a', 'https://a.example', '+33 1 23 45 67 89',
      'driving', '2026-01-01 09:00:00', '2026-01-01 09:30:00', 'osm-a', '{"type":"LineString"}', '#ff0000', 'hotel',
      50, 'amap-a', 'manual',
    ).lastInsertRowid as number;

    // Row B: every nullable column NULL.
    const rowB = insert.run(
      trip.id, 'Bare Place', null, null, null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, null, null, null,
      null, null, null, null, null, null, null,
      null, null, null,
    ).lastInsertRowid as number;

    // A place on another trip — must not leak into this trip's listAllForTrip.
    createPlace(testDb, otherTrip.id, { name: 'Elsewhere' });

    const rows = await places.listAllForTrip(trip.id);
    const legacy = testDb.prepare('SELECT * FROM places WHERE trip_id = ?').all(trip.id);
    expect(rows).toEqual(legacy);
    // rowid-ascending scan order (no ORDER BY), not insertion-reversed or re-sorted.
    expect(rows.map((r) => r.id)).toEqual([rowA, rowB]);
  });

  it('PLACEREPO-051: an empty trip returns an empty array, not a throw', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.listAllForTrip(trip.id)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// L3 (Plan 3d Task 7 whole-plan review): CH1 (`findChargingProbe`,
// `ChargingService.read`'s trip-scoped gate) had zero coverage of the REAL
// repository call anywhere in the suite — every existing `charging.test.ts`/
// `roadtrip.e2e.test.ts` case mocks `findChargingProbe` or `ChargingService
// .read` itself. Pinned here at the repository level (parity with the legacy
// `SELECT name, lat, lng, stop_type FROM places WHERE id = ? AND trip_id =
// ?`), and separately at the route level for the foreign-place 404
// (`tests/e2e/roadtrip.e2e.test.ts`).
// ─────────────────────────────────────────────────────────────────────────────

describe('PlacesRepository.findChargingProbe (CH1)', () => {
  it('CH1-001: an own-trip place resolves name/lat/lng/stop_type, matching the legacy statement', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Ladepark Nord', lat: 48.137, lng: 11.575 });
    testDb.prepare("UPDATE places SET stop_type = 'charging' WHERE id = ?").run(place.id);

    const typed = await places.findChargingProbe(place.id, trip.id);
    const legacy = testDb
      .prepare('SELECT name, lat, lng, stop_type FROM places WHERE id = ? AND trip_id = ?')
      .get(place.id, trip.id);

    expect(typed).toEqual(legacy);
    expect(typed).toEqual({ name: 'Ladepark Nord', lat: 48.137, lng: 11.575, stop_type: 'charging' });
  });

  it('CH1-002: a place belonging to a DIFFERENT trip resolves to undefined, matching the legacy miss', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const place = createPlace(testDb, otherTrip.id, { name: 'Theirs' });

    const typed = await places.findChargingProbe(place.id, trip.id);
    const legacy = testDb
      .prepare('SELECT name, lat, lng, stop_type FROM places WHERE id = ? AND trip_id = ?')
      .get(place.id, trip.id);

    expect(typed).toBeUndefined();
    expect(legacy).toBeUndefined();
  });

  it('CH1-003: a non-charging place still resolves (the caller, not this query, decides what to do with stop_type)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Just a stop' });

    const typed = await places.findChargingProbe(place.id, trip.id);
    expect(typed).toEqual({ name: 'Just a stop', lat: 48.8566, lng: 2.3522, stop_type: null });
  });
});

// ---------------------------------------------------------------------------
// Plan 3h Task 3 (`DawarichSuggestionsService::acceptAsPlace`) — additive.
// ---------------------------------------------------------------------------

describe('PlacesRepository.setSource (DWS7)', () => {
  it('DWS7-001: stamps source without touching updated_at, matching the legacy statement\'s own column list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Imported stay' });
    const before = testDb.prepare('SELECT updated_at FROM places WHERE id = ?').get(place.id) as { updated_at: string | null };

    await places.setSource(place.id, 'dawarich');

    const row = testDb.prepare('SELECT source, updated_at FROM places WHERE id = ?').get(place.id) as { source: string | null; updated_at: string | null };
    expect(row.source).toBe('dawarich');
    expect(row.updated_at).toBe(before.updated_at);
  });
});

// ---------------------------------------------------------------------------
// Plan 3h Task 7 review, M1 coverage — Plan 3h Task 4's `maps.service.ts`
// photo-fetch (MAP9), untested at the repository level (the service test
// stubs this method).
// ---------------------------------------------------------------------------

describe('PlacesRepository.setImageUrlIfUnset (MAP9)', () => {
  it('MAP9-001: fills a NULL image_url, matching the legacy $or guard', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'No photo yet' });
    testDb.prepare("UPDATE places SET google_place_id = 'ChIJ_shared' WHERE id = ?").run(place.id);

    const n = await places.setImageUrlIfUnset('ChIJ_shared', '/uploads/photo-cache/new.jpg');

    expect(n).toBe(1);
    const row = testDb.prepare('SELECT image_url FROM places WHERE id = ?').get(place.id) as { image_url: string | null };
    expect(row.image_url).toBe('/uploads/photo-cache/new.jpg');
  });

  it('MAP9-002: fills an EMPTY-STRING image_url too (the second half of the $or)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Blank photo' });
    testDb.prepare("UPDATE places SET google_place_id = 'ChIJ_blank', image_url = '' WHERE id = ?").run(place.id);

    const n = await places.setImageUrlIfUnset('ChIJ_blank', '/uploads/photo-cache/filled.jpg');

    expect(n).toBe(1);
    const row = testDb.prepare('SELECT image_url FROM places WHERE id = ?').get(place.id) as { image_url: string | null };
    expect(row.image_url).toBe('/uploads/photo-cache/filled.jpg');
  });

  it('MAP9-003: an already-set image_url is left untouched — never clobbers a custom image', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Custom photo' });
    testDb.prepare("UPDATE places SET google_place_id = 'ChIJ_custom', image_url = '/uploads/custom.jpg' WHERE id = ?").run(place.id);

    const n = await places.setImageUrlIfUnset('ChIJ_custom', '/uploads/photo-cache/should-not-land.jpg');

    expect(n).toBe(0);
    const row = testDb.prepare('SELECT image_url FROM places WHERE id = ?').get(place.id) as { image_url: string | null };
    expect(row.image_url).toBe('/uploads/custom.jpg');
  });

  it('MAP9-004: unscoped by trip — every empty-image row sharing the google_place_id across trips is filled in one statement', async () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id);
    const tripB = createTrip(testDb, user.id);
    const placeA = createPlace(testDb, tripA.id, { name: 'A' });
    const placeB = createPlace(testDb, tripB.id, { name: 'B' });
    testDb.prepare("UPDATE places SET google_place_id = 'ChIJ_shared2' WHERE id IN (?, ?)").run(placeA.id, placeB.id);

    const n = await places.setImageUrlIfUnset('ChIJ_shared2', '/uploads/photo-cache/both.jpg');

    expect(n).toBe(2);
    expect((testDb.prepare('SELECT image_url FROM places WHERE id = ?').get(placeA.id) as { image_url: string }).image_url).toBe('/uploads/photo-cache/both.jpg');
    expect((testDb.prepare('SELECT image_url FROM places WHERE id = ?').get(placeB.id) as { image_url: string }).image_url).toBe('/uploads/photo-cache/both.jpg');
  });
});

describe('PlacesRepository.listAssignedForPublicApi (Plan 4 Task 1, public-api.service.ts::placesByDay)', () => {
  it('PLACEREPO-053: day_id + place fields + category name, scoped to the trip, ordered by day then order_index — a booked-night stop is excluded', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const category = createCategory(testDb, { name: 'Museum' });
    const dayA = createDay(testDb, trip.id);
    const dayB = createDay(testDb, trip.id);
    const placeA1 = createPlace(testDb, trip.id, { name: 'A-first', category_id: category.id });
    const placeA2 = createPlace(testDb, trip.id, { name: 'A-second' });
    testDb.prepare('UPDATE places SET category_id = NULL WHERE id = ?').run(placeA2.id); // no category, not the factory's default
    const placeB1 = createPlace(testDb, trip.id, { name: 'B-first' });
    const hotelPlace = createPlace(testDb, trip.id, { name: 'Hotel' });
    createDayAssignment(testDb, dayA.id, placeA2.id, { order_index: 5 });
    createDayAssignment(testDb, dayA.id, placeA1.id, { order_index: 1 });
    createDayAssignment(testDb, dayB.id, placeB1.id, { order_index: 0 });
    // A booked-night stop: da.accommodation_id IS NOT NULL, must be excluded.
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id, order_index, accommodation_id) VALUES (?, ?, 0, 999)').run(dayA.id, hotelPlace.id);
    // Unassigned place in the same trip — never a candidate at all.
    createPlace(testDb, trip.id, { name: 'Unassigned' });
    // A place assigned on a DIFFERENT trip — must not leak in.
    const otherDay = createDay(testDb, other.id);
    createDayAssignment(testDb, otherDay.id, createPlace(testDb, other.id, { name: 'Elsewhere' }).id);

    const rows = await places.listAssignedForPublicApi(trip.id);

    expect(rows.map((r) => r.name)).toEqual(['A-first', 'A-second', 'B-first']);
    expect(rows[0]).toMatchObject({ day_id: dayA.id, name: 'A-first', category: 'Museum' });
    expect(rows[1]).toMatchObject({ day_id: dayA.id, name: 'A-second', category: null });
    expect(rows[2]).toMatchObject({ day_id: dayB.id, name: 'B-first' });
  });

  it('PLACEREPO-054: empty array when nothing is assigned', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.listAssignedForPublicApi(trip.id)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan 4 Task 8b-2, item 1 (3d Task 7 review's "Places.findTrackInTrip" carry,
// the actual method is `isTrackInTrip`): RT13 (`RoadtripService.trackExists`)
// had no repository-level parity test. `SELECT id FROM places WHERE id = ?
// AND trip_id = ? AND route_geometry IS NOT NULL AND route_geometry != ''`,
// both nullable/empty-string edges pinned against the legacy predicate.
// ─────────────────────────────────────────────────────────────────────────────

describe('PlacesRepository.isTrackInTrip (RT13, RoadtripService.trackExists)', () => {
  const legacyIsTrackInTrip = (id: number, tripId: number): boolean =>
    !!testDb.prepare(
      "SELECT id FROM places WHERE id = ? AND trip_id = ? AND route_geometry IS NOT NULL AND route_geometry != ''",
    ).get(id, tripId);

  it('PLACEREPO-055: a place with route_geometry set matches the legacy predicate — true', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET route_geometry = ? WHERE id = ?').run('{"type":"LineString"}', place.id);

    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(legacyIsTrackInTrip(place.id, trip.id));
    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(true);
  });

  it('PLACEREPO-056: route_geometry NULL matches the legacy predicate — false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET route_geometry = NULL WHERE id = ?').run(place.id);

    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(legacyIsTrackInTrip(place.id, trip.id));
    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(false);
  });

  it('PLACEREPO-057: route_geometry \'\' (empty string) matches the legacy predicate — false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare("UPDATE places SET route_geometry = '' WHERE id = ?").run(place.id);

    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(legacyIsTrackInTrip(place.id, trip.id));
    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(false);
  });

  it('PLACEREPO-058: a track on a DIFFERENT trip is not found — false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const place = createPlace(testDb, other.id);
    testDb.prepare('UPDATE places SET route_geometry = ? WHERE id = ?').run('{"type":"LineString"}', place.id);

    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(legacyIsTrackInTrip(place.id, trip.id));
    expect(await places.isTrackInTrip(place.id, trip.id)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan 4 Task 8b-2, item 3 (3f L6 carry): AtlasService's own reads on
// PlacesRepository — AT2 (listForTripIds) and AT41 (listAddressesForUser) —
// had no repository-level toEqual(<legacy raw>) parity test.
// ─────────────────────────────────────────────────────────────────────────────

describe('PlacesRepository.listForTripIds (AT2, AtlasService#getPlacesForTrips)', () => {
  it('PLACEREPO-059: matches SELECT * FROM places WHERE trip_id IN (...) run raw', async () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id);
    const tripB = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const pa = createPlace(testDb, tripA.id, { name: 'A' });
    const pb = createPlace(testDb, tripB.id, { name: 'B' });
    createPlace(testDb, other.id, { name: 'Not in the batch' });

    const legacy = testDb.prepare(`SELECT * FROM places WHERE trip_id IN (${[tripA.id, tripB.id].join(',')})`).all();
    const typed = await places.listForTripIds([tripA.id, tripB.id]);
    expect(typed).toEqual(legacy);
    expect(typed.map((p) => p.id).sort((a, b) => a - b)).toEqual([pa.id, pb.id].sort((a, b) => a - b));
  });

  it('PLACEREPO-060: an empty trip-id array short-circuits to [] without a query', async () => {
    expect(await places.listForTripIds([])).toEqual([]);
  });
});

describe('PlacesRepository.listAddressesForUser (AT41, AtlasService#getTravelStats)', () => {
  it('PLACEREPO-061: matches the legacy DISTINCT statement, owner and member trips, region_name joined from place_regions', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const place = createPlace(testDb, trip.id, { name: 'Tower', lat: 48.85, lng: 2.35 });
    testDb.prepare('UPDATE places SET address = ? WHERE id = ?').run('5 Avenue Anatole France', place.id);
    testDb.prepare('INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)')
      .run(place.id, 'FR', 'FR-IDF', 'Île-de-France');
    const noAddress = createPlace(testDb, trip.id, { name: 'No address' });
    testDb.prepare('UPDATE places SET address = NULL, lat = NULL, lng = NULL WHERE id = ?').run(noAddress.id);

    const legacy = testDb.prepare(`
      SELECT DISTINCT p.address, p.lat, p.lng, pr.region_name
      FROM places p JOIN trips t ON p.trip_id = t.id
      LEFT JOIN trip_members tm ON t.id = tm.trip_id
      LEFT JOIN place_regions pr ON pr.place_id = p.id
      WHERE t.user_id = ? OR tm.user_id = ?`).all(owner.id, owner.id);

    const typedOwner = await places.listAddressesForUser(owner.id);
    expect(typedOwner).toEqual(legacy);
    expect(typedOwner).toEqual([
      { address: '5 Avenue Anatole France', lat: 48.85, lng: 2.35, region_name: 'Île-de-France' },
      { address: null, lat: null, lng: null, region_name: null },
    ]);

    const typedMember = await places.listAddressesForUser(member.id);
    expect(typedMember).toEqual(typedOwner);

    expect(await places.listAddressesForUser(stranger.id)).toEqual([]);
  });
});

/**
 * Plan 4 Task 8b-4a (3h L4) — full-key `toEqual(<legacy raw>)` parity for
 * `PlacesRepository.listPublicForShare` (`share.service.ts:340` SH12),
 * flagged by the 3h ledger as having no repository-level parity test. The
 * legacy statement (the method's own docstring) is a named 20-column
 * allow-list (never `p.*`) LEFT JOINed to `categories`, scoped by trip only
 * — a public share sees every place in the pool regardless of any
 * assignment/booking status, but never the owner-only columns
 * (`reservation_status`, `google_place_id`, `osm_id`, `route_geometry`,
 * `source`, …) this SELECT list withholds by omission.
 */
describe('PlacesRepository — share.service.ts SH12 read', () => {
  function legacyPublicForShare(tripId: number): unknown {
    return testDb.prepare(`
      SELECT p.id, p.trip_id, p.name, p.description, p.lat, p.lng, p.address, p.category_id,
        p.price, p.currency, p.place_time, p.end_time, p.duration_minutes, p.notes,
        p.image_url, p.website, p.phone, p.transport_mode, p.created_at, p.updated_at,
        c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM places p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.trip_id = ?
      ORDER BY p.created_at DESC`).all(tripId);
  }

  it('listPublicForShare — matches the legacy statement, categorised and uncategorised, every nullable column both null and set', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const category = createCategory(testDb, { name: 'Museum', color: '#111111', icon: '🏛️' });

    const withCategory = createPlace(testDb, trip.id, { name: 'Louvre', lat: 48.86, lng: 2.34, category_id: category.id, description: 'Art museum' });
    testDb.prepare(`
      UPDATE places SET address = ?, price = ?, currency = ?, place_time = ?, end_time = ?,
        duration_minutes = ?, notes = ?, image_url = ?, website = ?, phone = ?, transport_mode = ?,
        updated_at = ?, created_at = ?, reservation_status = 'confirmed', google_place_id = 'ChIJ123'
      WHERE id = ?`).run(
      'Rue de Rivoli', 17.5, 'EUR', '10:00', '12:00', 120, 'bring ID', 'https://img/louvre.jpg',
      'https://louvre.fr', '+33140205050', 'walking', '2026-09-01T09:00:00.000Z', '2026-09-01T08:00:00.000Z',
      withCategory.id,
    );

    const bare = createPlace(testDb, trip.id, { name: 'Unnamed spot' });
    testDb.prepare(`
      UPDATE places SET category_id = NULL, lat = NULL, lng = NULL, address = NULL, price = NULL,
        currency = NULL, place_time = NULL, end_time = NULL, duration_minutes = NULL, notes = NULL,
        image_url = NULL, website = NULL, phone = NULL, transport_mode = NULL, updated_at = NULL,
        created_at = '2026-09-02T08:00:00.000Z', description = NULL
      WHERE id = ?`).run(bare.id);

    // A place on a different trip must never leak in.
    createPlace(testDb, other.id, { name: 'Foreign place' });

    const legacy = legacyPublicForShare(trip.id);
    const typed = await places.listPublicForShare(trip.id);
    expect(typed).toEqual(legacy);
    // ORDER BY p.created_at DESC: bare (2026-09-02) before withCategory (2026-09-01).
    expect(typed.map((r) => r.id)).toEqual([bare.id, withCategory.id]);
    expect(typed.find((r) => r.id === withCategory.id)).toMatchObject({
      category_name: 'Museum', category_color: '#111111', category_icon: '🏛️',
    });
    expect(typed.find((r) => r.id === bare.id)).toMatchObject({
      category_id: null, category_name: null, category_color: null, category_icon: null,
    });
    // Owner-only columns are withheld by omission — never present on the row at all.
    expect(typed[1]).not.toHaveProperty('reservation_status');
    expect(typed[1]).not.toHaveProperty('google_place_id');
  });

  it('listPublicForShare — [] for a trip with no places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.listPublicForShare(trip.id)).toEqual([]);
  });
});
