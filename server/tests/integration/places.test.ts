/**
 * Places API integration tests.
 * Covers PLACE-001 through PLACE-019.
 *
 * Notes:
 * - PLACE-008/009: place-to-day assignment is tested in assignments.test.ts
 * - PLACE-014: reordering within a day is tested in assignments.test.ts
 * - PLACE-019: GPX bulk import tested here using the test fixture
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll, type MockInstance } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';
import path from 'path';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { MikroORM } from '@mikro-orm/core';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { FactoryOrm } from '../helpers/factories/context';
import { createUser, createAdmin, createTrip, createPlace, addTripMember } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { countRows, findRow, findRows, updateRows } from '../helpers/factories/rows';
import { makeCategory, makeTag } from '../helpers/factories/places';
import { makeBudgetItem } from '../helpers/factories/budget';
import { setAppSetting } from '../helpers/factories/settings';
import { Addons } from '../../src/db/entities/Addons.entity';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { Categories } from '../../src/db/entities/Categories.entity';
import { PlaceRatings } from '../../src/db/entities/PlaceRatings.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { PlacesService } from '../../src/nest/places/places.service';
import { invalidatePermissionsCache } from '../../src/nest/permissions/permissions-cache';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { DomainError } from '../../src/nest/common/domain-error';

let nestApp: INestApplication;
let app: Application;
let orm: FactoryOrm;
// Since the place DI fold the two outbound-I/O paths are stubbed as spies on the
// container's PlacesService singleton (permissions precedent) instead of a path
// mock of the deleted services/placeService. Bare spies keep the real
// implementation, so only the *Once overrides below change behaviour.
let importGoogleList: MockInstance;
let searchPlaceImage: MockInstance;
let broadcast: RealtimeSpies['broadcast'];
const GPX_FIXTURE = path.join(__dirname, '../fixtures/test.gpx');
const KML_FIXTURE = path.join(__dirname, '../fixtures/test.kml');
const KML_NESTED_FIXTURE = path.join(__dirname, '../fixtures/test-nested.kml');
const KML_MALFORMED_FIXTURE = path.join(__dirname, '../fixtures/test-malformed.kml');
const KMZ_FIXTURE = path.join(__dirname, '../fixtures/test.kmz');

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
  await invalidatePermissionsCache();
  // Re-attached per test: one describe below calls vi.restoreAllMocks() in its
  // afterEach, which would otherwise strip these for every later test.
  importGoogleList = vi.spyOn(nestApp.get(PlacesService), 'importGoogleList');
  searchPlaceImage = vi.spyOn(nestApp.get(PlacesService), 'searchImage');
  broadcast = spyOnRealtime(nestApp).broadcast;
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Create place
// ─────────────────────────────────────────────────────────────────────────────

describe('Create place', () => {
  it('PLACE-001 — POST /api/trips/:tripId/places creates place and returns 201', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 });
    expect(res.status).toBe(201);
    expect(res.body.place.name).toBe('Eiffel Tower');
    expect(res.body.place.lat).toBe(48.8584);
    expect(res.body.place.trip_id).toBe(trip.id);
  });

  it('PLACE-001 — POST without name returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ lat: 48.8584, lng: 2.2945 });
    expect(res.status).toBe(400);
  });

  it('PLACE-002 — name exceeding 200 characters is rejected', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'A'.repeat(201) });
    expect(res.status).toBe(400);
  });

  it('PLACE-007 — non-member cannot create a place', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(other.id))
      .send({ name: 'Test Place' });
    expect(res.status).toBe(404);
  });

  it('PLACE-016 — create place with category assigns it correctly', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = await findRow(orm, Categories, {});
    if (!cat) throw new Error('the snapshot seeds no category');

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Louvre', category_id: cat.id });
    expect(res.status).toBe(201);
    expect(res.body.place.category).toBeDefined();
    expect(res.body.place.category.id).toBe(cat.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// List places
// ─────────────────────────────────────────────────────────────────────────────

describe('List places', () => {
  it('PLACE-003 — GET /api/trips/:tripId/places returns all places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Place A' });
    createPlace(testDb, trip.id, { name: 'Place B' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(2);
  });

  it('PLACE-003 — member can list places for a shared trip', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    createPlace(testDb, trip.id, { name: 'Shared Place' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(member.id));
    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
  });

  it('PLACE-007 — non-member cannot list places', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(other.id));
    expect(res.status).toBe(404);
  });

  it('PLACE-017 — GET /api/trips/:tripId/places?category=X filters by category id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cats = (await findRows(orm, Categories)).slice(0, 2);
    expect(cats.length).toBeGreaterThanOrEqual(2);

    createPlace(testDb, trip.id, { name: 'Hotel Alpha', category_id: cats[0].id });
    createPlace(testDb, trip.id, { name: 'Hotel Beta', category_id: cats[0].id });
    createPlace(testDb, trip.id, { name: 'Restaurant Gamma', category_id: cats[1].id });

    // The route filters by category_id, not name
    const res = await request(app)
      .get(`/api/trips/${trip.id}/places?category=${cats[0].id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(2);
    expect(res.body.places.every((p: any) => p.category?.id === cats[0].id)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Get single place
// ─────────────────────────────────────────────────────────────────────────────

describe('Get place', () => {
  it('PLACE-004 — GET /api/trips/:tripId/places/:id returns place with tags', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Test Place' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.place.id).toBe(place.id);
    expect(Array.isArray(res.body.place.tags)).toBe(true);
  });

  it('PLACE-004 — GET non-existent place returns 404', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places/99999`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Update place
// ─────────────────────────────────────────────────────────────────────────────

describe('Update place', () => {
  it('PLACE-005 — PUT /api/trips/:tripId/places/:id updates place details', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Old Name' });

    const res = await request(app)
      .put(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'New Name', description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.place.name).toBe('New Name');
    expect(res.body.place.description).toBe('Updated description');
  });

  it('PLACE-005 — PUT returns 404 for non-existent place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/places/99999`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'New Name' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete place
// ─────────────────────────────────────────────────────────────────────────────

describe('Delete place', () => {
  it('PLACE-006 — DELETE /api/trips/:tripId/places/:id removes place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);

    const del = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const get = await request(app)
      .get(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(get.status).toBe(404);
  });

  it('PLACE-007 — member with default permissions can delete a place', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const place = createPlace(testDb, trip.id);

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(member.id));
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tags
// ─────────────────────────────────────────────────────────────────────────────

describe('Tags', () => {
  it('PLACE-013 — GET /api/tags returns user tags', async () => {
    const { user } = createUser(testDb);
    // Create a tag in DB
    await makeTag(orm, user.id, { name: 'Must-see' });

    const res = await request(app)
      .get('/api/tags')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.tags).toBeDefined();
    const names = (res.body.tags as any[]).map((t: any) => t.name);
    expect(names).toContain('Must-see');
  });

  it('PLACE-010/011 — POST place with tags associates them correctly', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Pre-create a tag
    const tagResult = await makeTag(orm, user.id, { name: 'Romantic' });
    const tagId = tagResult.id;

    // The places API accepts `tags` as an array of tag IDs
    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Dinner Spot', tags: [tagId] });
    expect(res.status).toBe(201);

    // Get place with tags
    const getRes = await request(app)
      .get(`/api/trips/${trip.id}/places/${res.body.place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(getRes.body.place.tags.some((t: any) => t.id === tagId)).toBe(true);
  });

  it('PLACE-012 — DELETE /api/tags/:id removes tag', async () => {
    const { user } = createUser(testDb);
    const tagResult = await makeTag(orm, user.id, { name: 'OldTag' });
    const tagId = tagResult.id;

    const res = await request(app)
      .delete(`/api/tags/${tagId}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);

    const tags = await request(app).get('/api/tags').set('Cookie', authCookie(user.id));
    expect((tags.body.tags as any[]).some((t: any) => t.id === tagId)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Update place tags (PLACE-011)
// ─────────────────────────────────────────────────────────────────────────────

describe('Update place tags', () => {
  it('PLACE-011 — PUT with tags array replaces existing tags', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const tag1Result = await makeTag(orm, user.id, { name: 'OldTag' });
    const tag2Result = await makeTag(orm, user.id, { name: 'NewTag' });
    const tag1Id = tag1Result.id;
    const tag2Id = tag2Result.id;

    // Create place with tag1
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Taggable Place', tags: [tag1Id] });
    expect(createRes.status).toBe(201);
    const placeId = createRes.body.place.id;

    // Update with tag2 only — should replace tag1
    const updateRes = await request(app)
      .put(`/api/trips/${trip.id}/places/${placeId}`)
      .set('Cookie', authCookie(user.id))
      .send({ tags: [tag2Id] });
    expect(updateRes.status).toBe(200);
    const tags = updateRes.body.place.tags as any[];
    expect(tags.some((t: any) => t.id === tag2Id)).toBe(true);
    expect(tags.some((t: any) => t.id === tag1Id)).toBe(false);
  });

  it('PLACE-011 — PUT with empty tags array removes all tags', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const tagResult = await makeTag(orm, user.id, { name: 'RemovableTag' });
    const tagId = tagResult.id;

    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Place With Tag', tags: [tagId] });
    const placeId = createRes.body.place.id;

    const updateRes = await request(app)
      .put(`/api/trips/${trip.id}/places/${placeId}`)
      .set('Cookie', authCookie(user.id))
      .send({ tags: [] });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.place.tags).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Place notes (PLACE-018)
// ─────────────────────────────────────────────────────────────────────────────

describe('Place notes', () => {
  it('PLACE-018 — Create a place with notes', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Noted Place', notes: 'Book in advance!' });
    expect(res.status).toBe(201);
    expect(res.body.place.notes).toBe('Book in advance!');
  });

  it('PLACE-018 — Update place notes via PUT', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'My Spot' });

    const res = await request(app)
      .put(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ notes: 'Updated notes here' });
    expect(res.status).toBe(200);
    expect(res.body.place.notes).toBe('Updated notes here');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search filter (PLACE-017 search variant)
// ─────────────────────────────────────────────────────────────────────────────

describe('Search places', () => {
  it('PLACE-017 — GET ?search= filters places by name', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    createPlace(testDb, trip.id, { name: 'Arc de Triomphe' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places?search=Eiffel`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0].name).toBe('Eiffel Tower');
  });

  it('PLACE-017 — GET ?tag= filters by tag id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const tagResult = await makeTag(orm, user.id, { name: 'Scenic' });
    const tagId = tagResult.id;

    // Create place with the tag and one without
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Scenic Place', tags: [tagId] });
    expect(createRes.status).toBe(201);

    createPlace(testDb, trip.id, { name: 'Plain Place' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places?tag=${tagId}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0].name).toBe('Scenic Place');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

describe('Categories', () => {
  it('PLACE-015 — GET /api/categories returns all categories', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/categories')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.categories[0]).toHaveProperty('name');
    expect(res.body.categories[0]).toHaveProperty('color');
    expect(res.body.categories[0]).toHaveProperty('icon');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Naver list import
// ─────────────────────────────────────────────────────────────────────────────

describe('Naver list import', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('POST /import/naver-list resolves shortlink, paginates, and creates places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const folderId = 'a04c3f7a8dd24d42a8eb52d710a700cc';

    await updateRows(orm, Addons, { id: 'naver_list_import' }, { enabled: true });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        url: `https://map.naver.com/v5/favorite/myPlace/folder/${folderId}`,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          folder: { name: 'Seoul Food', bookmarkCount: 22 },
          bookmarkList: [
            { name: 'SINSAJEON', px: 127.0226195, py: 37.5186363, memo: null, address: 'Sinsa-dong Seoul' },
            { name: 'Ilpyeondeungsim', px: 126.9852986, py: 37.5629334, memo: 'Try lunch set', address: 'Myeong-dong Seoul' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          folder: { name: 'Seoul Food', bookmarkCount: 22 },
          bookmarkList: [
            { name: 'WAIKIKI MARKET', px: 126.8886523, py: 37.5589079, memo: null, address: 'Mapo-gu Seoul' },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/naver-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: 'https://naver.me/GYDpx3Wv' });

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(3);
    expect(res.body.listName).toBe('Seoul Food');
    expect(res.body.places[0].name).toBe('SINSAJEON');
    expect(res.body.places[1].notes).toBe('Try lunch set');
    expect(res.body.places[2].address).toBe('Mapo-gu Seoul');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain(`shares/${folderId}/bookmarks?`);
    expect(fetchMock.mock.calls[1][0]).toContain('start=0');
    expect(fetchMock.mock.calls[1][0]).toContain('limit=20');
    expect(fetchMock.mock.calls[2][0]).toContain('start=20');
  });

  it('POST /import/naver-list returns 400 for invalid URL', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await updateRows(orm, Addons, { id: 'naver_list_import' }, { enabled: true });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/naver-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: 'https://example.com/not-a-naver-list' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Could not extract folder ID');
  });

  it('POST /import/naver-list returns 502 when Naver API is unavailable', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const folderId = 'abc123';

    await updateRows(orm, Addons, { id: 'naver_list_import' }, { enabled: true });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false });

    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/naver-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: `https://map.naver.com/v5/favorite/myPlace/folder/${folderId}` });

    expect(res.status).toBe(502);
    expect(res.body.error).toContain('Failed to fetch list from Naver Maps');
  });

  it('POST /import/naver-list returns 400 when list is empty', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const folderId = 'abc123';

    await updateRows(orm, Addons, { id: 'naver_list_import' }, { enabled: true });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ folder: { name: 'Empty List', bookmarkCount: 0 }, bookmarkList: [] }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/naver-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: `https://map.naver.com/v5/favorite/myPlace/folder/${folderId}` });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('List is empty or could not be read');
  });

  it('POST /import/naver-list returns 400 when all items lack valid coordinates', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const folderId = 'abc123';

    await updateRows(orm, Addons, { id: 'naver_list_import' }, { enabled: true });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        folder: { name: 'No Coords', bookmarkCount: 2 },
        bookmarkList: [
          { name: 'Place A', px: undefined, py: undefined },
          { name: 'Place B', px: 'not-a-number', py: 'not-a-number' },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/naver-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: `https://map.naver.com/v5/favorite/myPlace/folder/${folderId}` });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No places with coordinates found in list');
  });

  it('POST /import/naver-list accepts canonical map.naver.com URL without redirect fetch', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const folderId = 'abc123';

    await updateRows(orm, Addons, { id: 'naver_list_import' }, { enabled: true });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        folder: { name: 'Seoul', bookmarkCount: 1 },
        bookmarkList: [{ name: 'Gyeongbokgung', px: 126.9770, py: 37.5796, memo: null, address: 'Sejongno Seoul' }],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/naver-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: `https://map.naver.com/v5/favorite/myPlace/folder/${folderId}` });

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GPX Import
// ─────────────────────────────────────────────────────────────────────────────

describe('GPX Import', () => {
  it('PLACE-019 — POST /import/gpx with valid GPX file creates places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/gpx`)
      .set('Cookie', authCookie(user.id))
      .attach('file', GPX_FIXTURE);
    expect(res.status).toBe(201);
    expect(res.body.places).toBeDefined();
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('PLACE-019 — POST /import/gpx without file returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/gpx`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// KML / KMZ Import
// ─────────────────────────────────────────────────────────────────────────────

describe('KML/KMZ Import', () => {
  it('PLACE-020 — POST /import/kml with valid KML creates places and returns summary', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await makeCategory(orm, { name: 'Museums', color: '#3b82f6', icon: 'Landmark', user: user.id });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/map`)
      .set('Cookie', authCookie(user.id))
      .attach('file', KML_FIXTURE);

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.totalPlacemarks).toBe(2);
    expect(res.body.summary.createdCount).toBe(2);

    const first = res.body.places.find((p: any) => p.name === 'Eiffel Tower View');
    expect(first).toBeDefined();
    expect(first.description).toContain('Great spot');
    expect(first.description).toContain('\n');
    expect(first.description).not.toContain('<b>');
    expect(first.category?.name).toBe('Museums');
  });

  it('PLACE-021 — nested folders, empty placemark, and coordinates-only placemark are handled', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await makeCategory(orm, { name: 'Parks', color: '#22c55e', icon: 'Trees', user: user.id });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/map`)
      .set('Cookie', authCookie(user.id))
      .attach('file', KML_NESTED_FIXTURE);

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
    expect(res.body.summary.totalPlacemarks).toBe(3);
    expect(res.body.summary.skippedCount).toBe(1);
    expect(Array.isArray(res.body.summary.errors)).toBe(true);
    expect(res.body.summary.errors.join(' ')).toContain('unsupported geometry type');

    const nested = res.body.places.find((p: any) => p.name === 'Nested Place');
    expect(nested).toBeDefined();
    expect(nested.category?.name).toBe('Parks');

    const fallback = res.body.places.find((p: any) => String(p.name).startsWith('Placemark'));
    expect(fallback).toBeDefined();
  });

  it('PLACE-022 — malformed KML returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/map`)
      .set('Cookie', authCookie(user.id))
      .attach('file', KML_MALFORMED_FIXTURE);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('PLACE-023 — non-UTF8 KML continues with warning', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const prefix = Buffer.from('<?xml version="1.0"?><kml><Document><Placemark><name>Caf');
    const invalidByte = Buffer.from([0xe9]); // invalid UTF-8 sequence when used standalone
    const suffix = Buffer.from('</name><Point><coordinates>2.1,48.1,0</coordinates></Point></Placemark></Document></kml>');
    const nonUtf8Kml = Buffer.concat([prefix, invalidByte, suffix]);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/map`)
      .set('Cookie', authCookie(user.id))
      .attach('file', nonUtf8Kml, 'non-utf8.kml');

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(1);
    expect(Array.isArray(res.body.summary.warnings)).toBe(true);
    expect(res.body.summary.warnings.join(' ')).toContain('not valid UTF-8');
  });

  it('PLACE-024 — POST /import/kmz with valid KMZ creates places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/map`)
      .set('Cookie', authCookie(user.id))
      .attach('file', KMZ_FIXTURE);

    expect(res.status).toBe(201);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.summary).toBeDefined();
  });

  it('PLACE-025 — invalid KMZ returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/map`)
      .set('Cookie', authCookie(user.id))
      .attach('file', Buffer.from('not-a-zip-archive'), 'invalid.kmz');

    expect(res.status).toBe(400);
    expect(String(res.body.error || '')).toContain('KMZ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GPX import — no waypoints
// ─────────────────────────────────────────────────────────────────────────────

describe('GPX Import — edge cases', () => {
  it('PLACE-019c — GPX with no waypoints returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Minimal valid GPX with no waypoints, tracks, or routes
    const emptyGpx = Buffer.from(
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"></gpx>'
    );

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/gpx`)
      .set('Cookie', authCookie(user.id))
      .attach('file', emptyGpx, { filename: 'empty.gpx', contentType: 'application/gpx+xml' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no matching places/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps list import
// ─────────────────────────────────────────────────────────────────────────────

describe('Google Maps list import', () => {
  it('PLACE-020 — POST /import/google-list without url returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/google-list`)
      .set('Cookie', authCookie(user.id))
      .send({});
    expect(res.status).toBe(400);
  });

  it('PLACE-020b — POST /import/google-list success path returns 201 with places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    importGoogleList.mockResolvedValueOnce({
      places: [{ id: 1, name: 'Mocked Place' } as any],
      listName: 'My List',
    } as any);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/google-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: 'https://maps.google.com/maps/list/example' });
    expect(res.status).toBe(201);
    expect(res.body.count).toBe(1);
    expect(res.body.listName).toBe('My List');
  });

  it('PLACE-020c — POST /import/google-list returns service error status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // The service refuses by throwing a DomainError; the controller passes it through.
    importGoogleList.mockRejectedValueOnce(new DomainError(422, 'Invalid list URL'));

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/google-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: 'https://maps.google.com/maps/list/bad' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Invalid list URL');
  });

  it('PLACE-020d — POST /import/google-list thrown exception returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    importGoogleList.mockRejectedValueOnce(new Error('Network failure'));

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/import/google-list`)
      .set('Cookie', authCookie(user.id))
      .send({ url: 'https://maps.google.com/maps/list/broken' });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Place image search
// ─────────────────────────────────────────────────────────────────────────────

describe('Place image search', () => {
  it('PLACE-021 — GET /:id/image returns photos on success', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });

    searchPlaceImage.mockResolvedValueOnce({
      photos: [{ url: 'https://example.com/photo.jpg' }],
    } as any);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places/${place.id}/image`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.photos).toHaveLength(1);
  });

  it('PLACE-021b — GET /:id/image returns service error status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Tower' });

    searchPlaceImage.mockRejectedValueOnce(new DomainError(404, 'No images found'));

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places/${place.id}/image`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('No images found');
  });

  it('PLACE-021c — GET /:id/image thrown exception returns 500', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bridge' });

    searchPlaceImage.mockRejectedValueOnce(new Error('Unsplash down'));

    const res = await request(app)
      .get(`/api/trips/${trip.id}/places/${place.id}/image`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete place permission denied
// ─────────────────────────────────────────────────────────────────────────────

describe('Delete place — permission edge cases', () => {
  it('PLACE-022 — DELETE place by non-owner member when place_edit is trip_owner returns 403', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const place = createPlace(testDb, trip.id, { name: 'Restricted Place' });

    // Restrict place edits to trip owner only
    await setAppSetting(orm, 'perm_place_edit', 'trip_owner');
    await invalidatePermissionsCache();

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(member.id));
    expect(res.status).toBe(403);
  });
});

describe('Delete place — not found', () => {
  it('PLACE-023 — DELETE non-existent place returns 404', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/99999`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Custom place image upload (#1136)
// ─────────────────────────────────────────────────────────────────────────────

describe('Custom place image upload', () => {
  const FIXTURE_JPEG = path.join(__dirname, '../fixtures/small-image.jpg');
  const FIXTURE_PDF = path.join(__dirname, '../fixtures/test.pdf');

  it('PLACE-026 — POST /:id/image stores the upload, then PUT image_url:null clears it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Snap' });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/${place.id}/image`)
      .set('Cookie', authCookie(user.id))
      .attach('image', FIXTURE_JPEG);
    expect(res.status).toBe(200);
    expect(res.body.place.image_url).toMatch(/^\/uploads\/places\/[0-9a-f-]{36}\./);
    // The bytes land at the final uploads/places path under the bare uuid name.
    const fsMod = require('fs') as typeof import('fs');
    const pathMod = require('path') as typeof import('path');
    const diskName = res.body.place.image_url.replace('/uploads/places/', '');
    expect(fsMod.existsSync(pathMod.join(__dirname, '../../uploads/places', diskName))).toBe(true);

    const cleared = await request(app)
      .put(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ image_url: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.place.image_url).toBeNull();
  });

  it('PLACE-027 — uploading a non-image (PDF) is rejected', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Snap' });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places/${place.id}/image`)
      .set('Cookie', authCookie(user.id))
      .attach('image', FIXTURE_PDF);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// H1 (task-4-review.md) — the trip id is parsed ONCE, at the gate, and that
// value is what every later call uses (rule 21). A hex-spelled trip id whose
// `Number()` value is a REAL, accessible trip must answer the same not-found
// every place/day/assignment id already does — not reach the real trip
// through a `Number(tripId)` gate while a raw-bound write behind it (or vice
// versa) misses.
// ─────────────────────────────────────────────────────────────────────────────

describe('H1 — trip id parsed once at the gate (rule 21)', () => {
  it('GET by the trip\'s hex-spelled id 404s — it does not read the real trip\'s place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Spot' });
    const hexTripId = '0x' + trip.id.toString(16);

    const res = await request(app)
      .get(`/api/trips/${hexTripId}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Place not found' });
  });

  it('PUT with tags by the hex-spelled trip id 404s "Trip not found" (Task 9 fix wave: `verifyTripAccess` now gates BEFORE the place-id read, so the string changed from "Place not found") and leaves the tags untouched (H1 live: they used to be wiped)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tagResult = await makeTag(orm, user.id, { name: 'Original' });
    const tagId = tagResult.id;
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Taggable', tags: [tagId] });
    expect(createRes.status).toBe(201);
    const placeId = createRes.body.place.id;
    const hexTripId = '0x' + trip.id.toString(16);

    const res = await request(app)
      .put(`/api/trips/${hexTripId}/places/${placeId}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Renamed', tags: [] });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });

    const after = await request(app)
      .get(`/api/trips/${trip.id}/places/${placeId}`)
      .set('Cookie', authCookie(user.id));
    expect(after.body.place.name).toBe('Taggable');
    expect((after.body.place.tags as { id: number }[]).some((t) => t.id === tagId)).toBe(true);
  });

  it('PUT :id/rating by the hex-spelled trip id 404s "Trip not found" (Task 9 fix wave: was "Place not found" — see the PUT :id case above)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Rated' });
    const hexTripId = '0x' + trip.id.toString(16);

    const res = await request(app)
      .put(`/api/trips/${hexTripId}/places/${place.id}/rating`)
      .set('Cookie', authCookie(user.id))
      .send({ rating: 4 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
    expect(await countRows(orm, PlaceRatings, { place: place.id })).toBe(0);
  });

  it('POST create by the hex-spelled trip id now 404s "Trip not found" (Task 9 fix wave, M1: `verifyTripAccess` gates with `toRowId` before `create()` is ever reached — the base 94c6efbbc 500 this test used to mirror was ruled a defect, not the contract to preserve, once the gate itself refuses the id)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const hexTripId = '0x' + trip.id.toString(16);

    const res = await request(app)
      .post(`/api/trips/${hexTripId}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Should not land' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
    expect(await countRows(orm, Places, { trip: trip.id })).toBe(0);
  });

  it('DELETE :id by the hex-spelled trip id 404s, deletes nothing and broadcasts nothing, even with a linked expense (#1298)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    await makeBudgetItem(orm, trip.id, { name: 'Tickets', total_price: 34, place: place.id });
    const hexTripId = '0x' + trip.id.toString(16);
    vi.mocked(broadcast).mockClear();

    const res = await request(app)
      .delete(`/api/trips/${hexTripId}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Place not found' });
    expect(await findRow(orm, Places, { id: place.id })).toBeTruthy();
    expect(await findRow(orm, BudgetItems, { place: place.id })).toBeTruthy();
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('POST bulk-delete by the hex-spelled trip id now 404s "Trip not found" and deletes nothing (Task 9 fix wave: `verifyTripAccess` gates before `scopedIds`/`removeMany` ever run — was a 200 with `count: 0`)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    await makeBudgetItem(orm, trip.id, { name: 'Tickets', total_price: 34, place: place.id });
    const hexTripId = '0x' + trip.id.toString(16);
    vi.mocked(broadcast).mockClear();

    const res = await request(app)
      .post(`/api/trips/${hexTripId}/places/bulk-delete`)
      .set('Cookie', authCookie(user.id))
      .send({ ids: [place.id] });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
    expect(await findRow(orm, Places, { id: place.id })).toBeTruthy();
    expect(broadcast).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan 3c Task 9 fix wave — A-H1 / A-M1 / B-H1: `verifyTripAccess` parses
// ONCE with `toRowId` (never `Number()`) and answers 404 `Trip not found`
// before ANY read or write on the 10 `requireTrip`-gated routes above,
// closing two live regressions at once:
//   - A-H1: a non-numeric id (`abc`, `1abc`) used to become `NaN` and 500
//     (`no such column: NaN`) instead of the legacy 404 — every one of
//     these routes now answers the SAME 404 a stranger's clean miss does.
//   - A-M1 / B-H1: a numeric-but-non-canonical id (`1.0`, `' 1'`, `'+1'`,
//     `'1e0'`) used to pass the old loose `Number()` gate and then
//     manufacture a FRESH 500 at the write (`toRowId(tripId) ?? -1`, an FK
//     violation on `-1`) — an id the gate itself authorised. It now 404s at
//     the gate instead: an ACCEPTED rule-15 narrowing (legacy's raw-bind
//     affinity matched these forms; `toRowId` deliberately does not), named
//     here rather than claimed as parity.
// ─────────────────────────────────────────────────────────────────────────────

describe('A-H1 / A-M1 / B-H1 — verifyTripAccess parses once with toRowId (Task 9 fix wave)', () => {
  const nonCanonicalShapes: [label: string, spell: (id: number) => string][] = [
    ['a non-numeric id (abc)', () => 'abc'],
    ['a numeric-suffixed id (1abc)', (id) => `${id}abc`],
    ['a decimal-spelled id (1.0) — rule-15 narrowing, base 201', (id) => `${id}.0`],
    ['a leading-space id (\' 1\') — rule-15 narrowing, base 201', (id) => ` ${id}`],
    ['a leading-plus id (+1) — rule-15 narrowing, base 201', (id) => `+${id}`],
    ['an exponent-spelled id (1e0) — rule-15 narrowing, base 201', (id) => `${id}e0`],
  ];

  describe.each(nonCanonicalShapes)('POST create — %s', (_label, spell) => {
    it('404s "Trip not found" and creates nothing', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const spelled = spell(trip.id);

      const res = await request(app)
        .post(`/api/trips/${spelled}/places`)
        .set('Cookie', authCookie(user.id))
        .send({ name: 'Should not land' });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
      expect(await countRows(orm, Places, { trip: trip.id })).toBe(0);
    });
  });

  describe.each(nonCanonicalShapes)('PUT :id — %s', (_label, spell) => {
    it('404s "Trip not found" and leaves the place untouched', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id, { name: 'Untouched' });
      const spelled = spell(trip.id);

      const res = await request(app)
        .put(`/api/trips/${spelled}/places/${place.id}`)
        .set('Cookie', authCookie(user.id))
        .send({ name: 'Renamed' });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
      const row = await findRow(orm, Places, { id: place.id });
      expect(row?.name).toBe('Untouched');
    });
  });

  describe.each(nonCanonicalShapes)('POST bulk-delete — %s', (_label, spell) => {
    it('404s "Trip not found" and deletes nothing', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id, { name: 'Louvre' });
      const spelled = spell(trip.id);
      vi.mocked(broadcast).mockClear();

      const res = await request(app)
        .post(`/api/trips/${spelled}/places/bulk-delete`)
        .set('Cookie', authCookie(user.id))
        .send({ ids: [place.id] });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
      expect(await findRow(orm, Places, { id: place.id })).toBeTruthy();
      expect(broadcast).not.toHaveBeenCalled();
    });
  });

  describe.each(nonCanonicalShapes)('POST bulk-update — %s', (_label, spell) => {
    it('404s "Trip not found" and updates nothing', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id, { name: 'Louvre', category_id: null });
      const spelled = spell(trip.id);

      const res = await request(app)
        .post(`/api/trips/${spelled}/places/bulk-update`)
        .set('Cookie', authCookie(user.id))
        .send({ ids: [place.id], category_id: null });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    });
  });

  describe.each(nonCanonicalShapes)('PUT :id/rating — %s', (_label, spell) => {
    it('404s "Trip not found" and writes no rating', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id, { name: 'Rated' });
      const spelled = spell(trip.id);

      const res = await request(app)
        .put(`/api/trips/${spelled}/places/${place.id}/rating`)
        .set('Cookie', authCookie(user.id))
        .send({ rating: 4 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
      expect(await countRows(orm, PlaceRatings, { place: place.id })).toBe(0);
    });
  });

  describe.each(nonCanonicalShapes)('GET export.gpx — %s', (_label, spell) => {
    it('404s "Trip not found"', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const spelled = spell(trip.id);

      const res = await request(app)
        .get(`/api/trips/${spelled}/places/export.gpx`)
        .set('Cookie', authCookie(user.id));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    });
  });

  describe.each(nonCanonicalShapes)('POST import/gpx — %s', (_label, spell) => {
    it('404s "Trip not found" and imports nothing', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const spelled = spell(trip.id);

      const res = await request(app)
        .post(`/api/trips/${spelled}/places/import/gpx`)
        .set('Cookie', authCookie(user.id))
        .attach('file', GPX_FIXTURE);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
      expect(await countRows(orm, Places, { trip: trip.id })).toBe(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M1 / program rule 22 (task-4-review.md) — a NUL byte in a user string no
// longer 500s: the platform override restores the legacy raw-bind's
// byte-for-byte round-trip (base 94c6efbbc: 200/201; before this fix, every
// ORM-converted statement 500'd on NUL).
// ─────────────────────────────────────────────────────────────────────────────

describe('M1 — NUL-safe value quoting on the SQLite platform (rule 22)', () => {
  it('GET ?search=%00 is 200, not 500 (status parity — SQLite\'s LIKE pattern matcher itself iterates its RHS as NUL-terminated, an independent SQLite limitation this platform fix does not touch, so a NUL search matches everything on BOTH trees, not nothing)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Spot' });

    // A raw, pre-encoded `%00` in the URL — the review's exact literal
    // request shape (`GET /api/trips/:id/places?search=%00`). `.query({...})`
    // goes through superagent's own `qs` encoder, which is not guaranteed to
    // round-trip a NUL character the same way; the literal query string is
    // what Express/the route actually receives in production.
    const res = await request(app)
      .get(`/api/trips/${trip.id}/places?search=%00`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
  });

  it('POST create with a NUL in the name is 201 and the name round-trips byte-for-byte', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const name = 'nul\u0000name';

    const res = await request(app)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name });
    expect(res.status).toBe(201);
    expect(res.body.place.name).toBe(name);

    const stored = await findRow(orm, Places, { id: res.body.place.id });
    expect(stored?.name).toBe(name);
  });

  it('fuzzes every 0x01-0x1F control character in a created place name: none 500 and every one round-trips', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // 0x00 is covered by its own dedicated test above; this sweeps the rest
    // of the control-character range the review's fuzz asked for.
    for (let code = 0x01; code <= 0x1f; code++) {
      const name = `ctrl${String.fromCharCode(code)}char`;
      const res = await request(app)
        .post(`/api/trips/${trip.id}/places`)
        .set('Cookie', authCookie(user.id))
        .send({ name });
      expect(res.status).toBe(201);
      expect(res.body.place.name).toBe(name);
    }
  });
});
