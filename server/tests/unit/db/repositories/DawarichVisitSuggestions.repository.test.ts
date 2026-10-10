import { DawarichVisitSuggestions } from '../../../../src/db/entities/DawarichVisitSuggestions.entity';
import { JourneyEntries } from '../../../../src/db/entities/JourneyEntries.entity';
import { Journeys } from '../../../../src/db/entities/Journeys.entity';
import type { DawarichVisitSuggestionsRepository } from '../../../../src/db/repositories/DawarichVisitSuggestions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, createTrip } from '../../../helpers/factories';
import { makeBucketListItem } from '../../../helpers/factories/atlas';
import { makePlace } from '../../../helpers/factories/places';
import { deleteRows, findRow, findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let suggestions: DawarichVisitSuggestionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  suggestions = t.repo(DawarichVisitSuggestions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  testDb.exec('DELETE FROM dawarich_visit_suggestions');
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

let _seq = 0;

async function seed(
  userId: number,
  over: Partial<{
    source_visit_id: string;
    trip_id: number | null;
    name: string;
    lat: number | null;
    lng: number | null;
    started_at: string;
    ended_at: string;
    duration_minutes: number;
    local_date: string;
    source_status: string;
    confidence: number | null;
    confidence_band: string | null;
    country_code: string | null;
    state: string;
    target: string | null;
    accepted_place_id: number | null;
    accepted_journal_entry_id: number | null;
    accepted_bucket_list_item_id: number | null;
    matched_bucket_list_item_id: number | null;
    source_hash: string;
    accepted_hash: string | null;
    source_missing_at: string | null;
  }> = {},
): Promise<number> {
  _seq++;
  return insertRow(t, DawarichVisitSuggestions, {
    user: userId,
    source_visit_id: over.source_visit_id ?? `visit-${_seq}`,
    trip: over.trip_id ?? null,
    name: over.name ?? 'Cafe Central',
    lat: over.lat === undefined ? 48.2092 : over.lat,
    lng: over.lng === undefined ? 16.3658 : over.lng,
    started_at: over.started_at ?? '2026-09-01T09:30:00Z',
    ended_at: over.ended_at ?? '2026-09-01T11:45:00Z',
    duration_minutes: over.duration_minutes ?? 135,
    local_date: over.local_date ?? '2026-09-01',
    source_status: over.source_status ?? 'suggested',
    confidence: over.confidence ?? 0.7,
    confidence_band: over.confidence_band ?? 'high',
    country_code: over.country_code ?? 'AT',
    state: over.state ?? 'new',
    target: over.target ?? null,
    acceptedPlace: over.accepted_place_id ?? null,
    accepted_journal_entry_id: over.accepted_journal_entry_id ?? null,
    acceptedBucketListItem: over.accepted_bucket_list_item_id ?? null,
    matchedBucketListItem: over.matched_bucket_list_item_id ?? null,
    source_hash: over.source_hash ?? `hash-${_seq}`,
    accepted_hash: over.accepted_hash ?? null,
    source_missing_at: over.source_missing_at ?? null,
  });
}

function storedRow(id: number) {
  return findRow(t, DawarichVisitSuggestions, { id });
}

/** The stored row; fails the case when it is gone. */
async function rawRow(id: number) {
  const row = await storedRow(id);
  if (!row) throw new Error(`no suggestion ${id}`);
  return row;
}

async function seedPlace(tripId: number): Promise<number> {
  return (await makePlace(t, tripId, { name: 'A place', lat: null, lng: null })).id;
}

async function seedJourneyEntry(userId: number): Promise<number> {
  const journeyId = await insertRow(t, Journeys, {
    user: userId,
    title: 'Trip diary',
    status: 'active',
    created_at: 0,
    updated_at: 0,
  });
  return insertRow(t, JourneyEntries, {
    journey: journeyId,
    author: userId,
    type: 'entry',
    title: 'Cafe',
    entry_date: '2026-09-01',
    created_at: 0,
    updated_at: 0,
  });
}

async function seedBucketItem(userId: number): Promise<number> {
  return (await makeBucketListItem(t, userId, { name: 'Wish' })).id;
}

describe('DawarichVisitSuggestionsRepository', () => {
  describe('list/getOne (DWS1/DWS3)', () => {
    it('DVSREPO-001: a fully-seeded row (with a trip and a matched wish) joins trip_title/matched_bucket_name and every scalar column, matching a legacy raw join', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id, { title: 'Vienna' });
      const wish = await seedBucketItem(user.id);
      const id = await seed(user.id, { trip_id: trip.id, matched_bucket_list_item_id: wish, name: 'Cafe Central' });

      const rows = await suggestions.list(user.id, {});
      const legacy = testDb
        // test-sql-allow: the legacy statement is the oracle the repository read is held to.
        .prepare(
          `SELECT s.*, t.title AS trip_title, b.name AS matched_bucket_name
             FROM dawarich_visit_suggestions s
             LEFT JOIN trips t ON t.id = s.trip_id
             LEFT JOIN bucket_list b ON b.id = s.matched_bucket_list_item_id
            WHERE s.user_id = ?`,
        )
        .get(user.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual(legacy);
      expect(rows[0].id).toBe(id);
      expect(rows[0].trip_title).toBe('Vienna');
      expect(rows[0].matched_bucket_name).toBe('Wish');
    });

    it("DVSREPO-002: scoped by user_id — a stranger's row never appears", async () => {
      const { user } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      await seed(stranger.id);
      expect(await suggestions.list(user.id, {})).toEqual([]);
    });

    it('DVSREPO-003: filters by tripId and state, ordered started_at DESC, id DESC', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const older = await seed(user.id, { trip_id: trip.id, started_at: '2026-09-01T00:00:00Z' });
      const newer = await seed(user.id, { trip_id: trip.id, started_at: '2026-09-02T00:00:00Z' });
      await seed(user.id, { started_at: '2026-09-03T00:00:00Z' }); // no trip

      const byTrip = await suggestions.list(user.id, { tripId: trip.id });
      expect(byTrip.map((r) => r.id)).toEqual([newer, older]);

      await seed(user.id, { trip_id: trip.id, state: 'dismissed' });
      const byState = await suggestions.list(user.id, { state: 'dismissed' });
      expect(byState).toHaveLength(1);
      expect(byState[0].state).toBe('dismissed');
    });

    it('DVSREPO-004: getOne is the single-row variant, still user-scoped', async () => {
      const { user } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const id = await seed(user.id);
      expect(await suggestions.getOne(stranger.id, id)).toBeNull();
      expect((await suggestions.getOne(user.id, id))?.id).toBe(id);
    });
  });

  describe('reopenOrphaned (DWS2)', () => {
    it('DVSREPO-010: place target with a NULL accepted_place_id is reopened', async () => {
      const { user } = createUser(testDb);
      const id = await seed(user.id, { state: 'accepted', target: 'place', accepted_place_id: null });
      await suggestions.reopenOrphaned(user.id);
      const row = await rawRow(id);
      expect(row.state).toBe('new');
      expect(row.target).toBeNull();
    });

    it('DVSREPO-011: bucket_list target with a NULL accepted_bucket_list_item_id is reopened', async () => {
      const { user } = createUser(testDb);
      const id = await seed(user.id, { state: 'accepted', target: 'bucket_list', accepted_bucket_list_item_id: null });
      await suggestions.reopenOrphaned(user.id);
      expect((await rawRow(id)).state).toBe('new');
    });

    it('DVSREPO-012: journal target whose entry no longer exists (cross-domain NOT EXISTS against journey_entries) is reopened', async () => {
      const { user } = createUser(testDb);
      const entryId = await seedJourneyEntry(user.id);
      const id = await seed(user.id, { state: 'accepted', target: 'journal', accepted_journal_entry_id: entryId });

      // Still exists: not reopened.
      await suggestions.reopenOrphaned(user.id);
      expect((await rawRow(id)).state).toBe('accepted');

      await deleteRows(t, JourneyEntries, { id: entryId });
      await suggestions.reopenOrphaned(user.id);
      expect((await rawRow(id)).state).toBe('new');
      expect((await rawRow(id)).accepted_journal_entry_id).toBeNull();
    });

    it('DVSREPO-013: journal target with a NULL accepted_journal_entry_id is reopened without needing a journey_entries lookup at all', async () => {
      const { user } = createUser(testDb);
      const id = await seed(user.id, { state: 'accepted', target: 'journal', accepted_journal_entry_id: null });
      await suggestions.reopenOrphaned(user.id);
      expect((await rawRow(id)).state).toBe('new');
    });

    it("DVSREPO-014: an intact acceptance (place still exists) is left alone; another user's orphan is untouched", async () => {
      const { user } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const placeId = await seedPlace(trip.id);
      const intact = await seed(user.id, { state: 'accepted', target: 'place', accepted_place_id: placeId });
      const theirs = await seed(stranger.id, { state: 'accepted', target: 'place', accepted_place_id: null });

      await suggestions.reopenOrphaned(user.id);

      expect((await rawRow(intact)).state).toBe('accepted');
      expect((await rawRow(theirs)).state).toBe('accepted');
    });
  });

  describe('findForUser/findByUserAndVisit (DWS6/DSY3) — full-row parity, including persist(false) shadow FKs', () => {
    it('DVSREPO-020: every scalar column round-trips, matching a legacy SELECT *', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const wish = await seedBucketItem(user.id);
      const id = await seed(user.id, {
        trip_id: trip.id,
        matched_bucket_list_item_id: wish,
        accepted_bucket_list_item_id: wish,
        target: 'bucket_list',
        state: 'accepted',
        accepted_hash: 'hash-frozen',
      });

      const row = await suggestions.findForUser(id, user.id);
      // test-sql-allow: the row as SELECT * returns it is the oracle the repository read is held to.
      expect(row).toEqual(testDb.prepare('SELECT * FROM dawarich_visit_suggestions WHERE id = ?').get(id));
      // The persist(false) shadow FKs specifically — the trap this Kysely
      // full-row read exists to avoid.
      expect(row!.trip_id).toBe(trip.id);
      expect(row!.matched_bucket_list_item_id).toBe(wish);
      expect(row!.accepted_bucket_list_item_id).toBe(wish);
    });

    it('DVSREPO-021: findForUser is scoped by id AND user_id; findByUserAndVisit by user_id AND source_visit_id', async () => {
      const { user } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const id = await seed(stranger.id, { source_visit_id: 'abc' });
      expect(await suggestions.findForUser(id, user.id)).toBeNull();
      expect(await suggestions.findByUserAndVisit(user.id, 'abc')).toBeNull();
      expect((await suggestions.findByUserAndVisit(stranger.id, 'abc'))?.id).toBe(id);
    });
  });

  describe('insertVisit/updateNewVisit/refreshHash (DSY4/DSY5/DSY6)', () => {
    it('DVSREPO-030: insertVisit writes state=new and every column handed to it', async () => {
      const { user } = createUser(testDb);
      const id = await suggestions.insertVisit({
        user_id: user.id,
        source_visit_id: 'v-1',
        trip_id: null,
        name: 'Stop',
        lat: 1,
        lng: 2,
        started_at: '2026-01-01T00:00:00Z',
        ended_at: '2026-01-01T01:00:00Z',
        duration_minutes: 60,
        local_date: '2026-01-01',
        source_status: 'suggested',
        confidence: null,
        confidence_band: null,
        country_code: 'DE',
        source_hash: 'h1',
        first_seen_at: '2026-01-01T00:00:00Z',
        last_seen_at: '2026-01-01T00:00:00Z',
      });
      expect(await rawRow(id)).toMatchObject({ state: 'new', name: 'Stop', country_code: 'DE', source_hash: 'h1' });
    });

    it('DVSREPO-031: updateNewVisit overwrites the full row and clears source_missing_at', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = await seed(user.id, { source_missing_at: '2026-01-01T00:00:00Z', name: 'Old name' });

      await suggestions.updateNewVisit(id, {
        name: 'New name',
        lat: 9,
        lng: 9,
        started_at: '2026-02-01T00:00:00Z',
        ended_at: '2026-02-01T01:00:00Z',
        duration_minutes: 30,
        local_date: '2026-02-01',
        source_status: 'confirmed',
        confidence: 0.9,
        confidence_band: 'high',
        country_code: 'FR',
        source_hash: 'h2',
        trip_id: trip.id,
        last_seen_at: '2026-02-01T00:00:00Z',
      });

      const row = await rawRow(id);
      expect(row).toMatchObject({ name: 'New name', source_missing_at: null, trip_id: trip.id, source_hash: 'h2' });
    });

    it('DVSREPO-032: refreshHash touches only source_hash/source_missing_at/last_seen_at — the user-visible fields survive', async () => {
      const { user } = createUser(testDb);
      const id = await seed(user.id, {
        name: 'Kept name',
        state: 'accepted',
        source_missing_at: '2026-01-01T00:00:00Z',
      });

      await suggestions.refreshHash(id, 'h3', '2026-03-01T00:00:00Z');

      expect(await rawRow(id)).toMatchObject({
        name: 'Kept name',
        state: 'accepted',
        source_hash: 'h3',
        source_missing_at: null,
        last_seen_at: '2026-03-01T00:00:00Z',
      });
    });
  });

  describe('listCandidatesForWindow/deleteById/stampMissingIfUnset (DSY7/DSY8/DSY9)', () => {
    it('DVSREPO-040: candidates are scoped by user/trip and local_date bounds', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const inWindow = await seed(user.id, { trip_id: trip.id, local_date: '2026-05-05' });
      await seed(user.id, { trip_id: trip.id, local_date: '2019-01-01' });

      const candidates = await suggestions.listCandidatesForWindow(user.id, trip.id, '2026-05-01', '2026-05-10');
      expect(candidates.map((c) => c.id)).toEqual([inWindow]);
    });

    it('DVSREPO-041: deleteById removes exactly the named row', async () => {
      const { user } = createUser(testDb);
      const id = await seed(user.id);
      await suggestions.deleteById(id);
      expect(await storedRow(id)).toBeNull();
    });

    it('DVSREPO-042: stampMissingIfUnset preserves the FIRST-missing timestamp (COALESCE, not overwrite)', async () => {
      const { user } = createUser(testDb);
      const id = await seed(user.id, { source_missing_at: '2026-01-01T00:00:00Z' });
      await suggestions.stampMissingIfUnset(id, '2026-06-01T00:00:00Z');
      expect((await rawRow(id)).source_missing_at).toBe('2026-01-01T00:00:00Z');

      const id2 = await seed(user.id, { source_missing_at: null });
      await suggestions.stampMissingIfUnset(id2, '2026-06-01T00:00:00Z');
      expect((await rawRow(id2)).source_missing_at).toBe('2026-06-01T00:00:00Z');
    });
  });

  describe('markAccepted (DWS11) — self-column-copy', () => {
    it('DVSREPO-050: accepted_hash tracks CURRENT source_hash at UPDATE time, not a value bound earlier', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const placeId = await seedPlace(trip.id);
      const id = await seed(user.id, { source_hash: 'hash-original' });

      // A concurrent write lands between "the caller decided to accept" and
      // the markAccepted call itself.
      await updateRows(t, DawarichVisitSuggestions, { id }, { source_hash: 'hash-concurrent' });

      await suggestions.markAccepted(id, { target: 'place', placeId, journalEntryId: null, bucketItemId: null });

      const row = await rawRow(id);
      expect(row.source_hash).toBe('hash-concurrent');
      expect(row.accepted_hash).toBe('hash-concurrent');
      expect(row.state).toBe('accepted');
      expect(row.accepted_place_id).toBe(placeId);
    });
  });

  describe('listHoldersOfWish/clearWishHolders/assignWishHolder (DSY11/12/13)', () => {
    it("DVSREPO-060: listHoldersOfWish excludes the caller's own source_visit_id", async () => {
      const { user } = createUser(testDb);
      const wish = await seedBucketItem(user.id);
      const holder = await seed(user.id, { source_visit_id: 'holder', matched_bucket_list_item_id: wish });
      await seed(user.id, { source_visit_id: 'self', matched_bucket_list_item_id: wish });

      const holders = await suggestions.listHoldersOfWish(user.id, wish, 'self');
      expect(holders.map((h) => h.id)).toEqual([holder]);
    });

    it('DVSREPO-061: clear-then-assign leaves exactly one holder, scoped to the caller', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      const wish = await seedBucketItem(user.id);
      await seed(user.id, { source_visit_id: 'a', matched_bucket_list_item_id: wish });
      await seed(user.id, { source_visit_id: 'b', matched_bucket_list_item_id: wish });
      const winnerId = await seed(user.id, { source_visit_id: 'c', matched_bucket_list_item_id: null });
      const otherHolder = await seed(other.id, { source_visit_id: 'a', matched_bucket_list_item_id: wish });

      await suggestions.clearWishHolders(user.id, wish);
      await suggestions.assignWishHolder(user.id, 'c', wish);

      const all = await findRows(t, DawarichVisitSuggestions, { matchedBucketListItem: wish, user: user.id });
      expect(all.map((r) => r.id)).toEqual([winnerId]);
      // clearWishHolders is scoped by user_id — another user's row with the
      // SAME wish id (a coincidence, wishes aren't globally unique ids across
      // users here) is untouched.
      expect((await rawRow(otherHolder)).matched_bucket_list_item_id).toBe(wish);
    });
  });

  describe('matchedStayStart (DWS14)', () => {
    it("DVSREPO-070: the most recent started_at among the user's stays matched to that wish", async () => {
      const { user } = createUser(testDb);
      const wish = await seedBucketItem(user.id);
      await seed(user.id, { matched_bucket_list_item_id: wish, started_at: '2026-01-01T00:00:00Z' });
      await seed(user.id, { matched_bucket_list_item_id: wish, started_at: '2026-06-01T00:00:00Z' });

      expect(await suggestions.matchedStayStart(user.id, wish)).toBe('2026-06-01T00:00:00Z');
      expect(await suggestions.matchedStayStart(user.id, 999999)).toBeNull();
    });
  });
});
