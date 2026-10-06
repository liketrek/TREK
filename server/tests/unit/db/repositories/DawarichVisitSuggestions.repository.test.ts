import { DawarichVisitSuggestions } from '../../../../src/db/entities/DawarichVisitSuggestions.entity';
import type { DawarichVisitSuggestionsRepository } from '../../../../src/db/repositories/DawarichVisitSuggestions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, createTrip } from '../../../helpers/factories';
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

function seed(
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
): number {
  _seq++;
  const result = testDb
    .prepare(
      `INSERT INTO dawarich_visit_suggestions
         (user_id, source_visit_id, trip_id, name, lat, lng, started_at, ended_at, duration_minutes,
          local_date, source_status, confidence, confidence_band, country_code, state, target,
          accepted_place_id, accepted_journal_entry_id, accepted_bucket_list_item_id,
          matched_bucket_list_item_id, source_hash, accepted_hash, source_missing_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      over.source_visit_id ?? `visit-${_seq}`,
      over.trip_id ?? null,
      over.name ?? 'Cafe Central',
      over.lat === undefined ? 48.2092 : over.lat,
      over.lng === undefined ? 16.3658 : over.lng,
      over.started_at ?? '2026-09-01T09:30:00Z',
      over.ended_at ?? '2026-09-01T11:45:00Z',
      over.duration_minutes ?? 135,
      over.local_date ?? '2026-09-01',
      over.source_status ?? 'suggested',
      over.confidence ?? 0.7,
      over.confidence_band ?? 'high',
      over.country_code ?? 'AT',
      over.state ?? 'new',
      over.target ?? null,
      over.accepted_place_id ?? null,
      over.accepted_journal_entry_id ?? null,
      over.accepted_bucket_list_item_id ?? null,
      over.matched_bucket_list_item_id ?? null,
      over.source_hash ?? `hash-${_seq}`,
      over.accepted_hash ?? null,
      over.source_missing_at ?? null,
    );
  return Number(result.lastInsertRowid);
}

function rawRow(id: number): Record<string, unknown> {
  return testDb.prepare('SELECT * FROM dawarich_visit_suggestions WHERE id = ?').get(id) as Record<string, unknown>;
}

function seedPlace(tripId: number): number {
  const category = testDb.prepare('SELECT id FROM categories LIMIT 1').get() as { id: number } | undefined;
  const result = testDb
    .prepare('INSERT INTO places (trip_id, name, category_id) VALUES (?, ?, ?)')
    .run(tripId, 'A place', category?.id ?? null);
  return Number(result.lastInsertRowid);
}

function seedJourneyEntry(userId: number): number {
  const journeyId = Number(
    testDb
      .prepare(
        "INSERT INTO journeys (user_id, title, status, created_at, updated_at) VALUES (?, 'Trip diary', 'active', 0, 0)",
      )
      .run(userId).lastInsertRowid,
  );
  return Number(
    testDb
      .prepare(
        "INSERT INTO journey_entries (journey_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, 'entry', 'Cafe', '2026-09-01', 0, 0)",
      )
      .run(journeyId, userId).lastInsertRowid,
  );
}

function seedBucketItem(userId: number): number {
  return Number(
    testDb.prepare('INSERT INTO bucket_list (user_id, name) VALUES (?, ?)').run(userId, 'Wish').lastInsertRowid,
  );
}

describe('DawarichVisitSuggestionsRepository', () => {
  describe('list/getOne (DWS1/DWS3)', () => {
    it('DVSREPO-001: a fully-seeded row (with a trip and a matched wish) joins trip_title/matched_bucket_name and every scalar column, matching a legacy raw join', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id, { title: 'Vienna' });
      const wish = seedBucketItem(user.id);
      const id = seed(user.id, { trip_id: trip.id, matched_bucket_list_item_id: wish, name: 'Cafe Central' });

      const rows = await suggestions.list(user.id, {});
      const legacy = testDb
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
      seed(stranger.id);
      expect(await suggestions.list(user.id, {})).toEqual([]);
    });

    it('DVSREPO-003: filters by tripId and state, ordered started_at DESC, id DESC', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const older = seed(user.id, { trip_id: trip.id, started_at: '2026-09-01T00:00:00Z' });
      const newer = seed(user.id, { trip_id: trip.id, started_at: '2026-09-02T00:00:00Z' });
      seed(user.id, { started_at: '2026-09-03T00:00:00Z' }); // no trip

      const byTrip = await suggestions.list(user.id, { tripId: trip.id });
      expect(byTrip.map((r) => r.id)).toEqual([newer, older]);

      seed(user.id, { trip_id: trip.id, state: 'dismissed' });
      const byState = await suggestions.list(user.id, { state: 'dismissed' });
      expect(byState).toHaveLength(1);
      expect(byState[0].state).toBe('dismissed');
    });

    it('DVSREPO-004: getOne is the single-row variant, still user-scoped', async () => {
      const { user } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const id = seed(user.id);
      expect(await suggestions.getOne(stranger.id, id)).toBeNull();
      expect((await suggestions.getOne(user.id, id))?.id).toBe(id);
    });
  });

  describe('reopenOrphaned (DWS2)', () => {
    it('DVSREPO-010: place target with a NULL accepted_place_id is reopened', async () => {
      const { user } = createUser(testDb);
      const id = seed(user.id, { state: 'accepted', target: 'place', accepted_place_id: null });
      await suggestions.reopenOrphaned(user.id);
      const row = rawRow(id);
      expect(row.state).toBe('new');
      expect(row.target).toBeNull();
    });

    it('DVSREPO-011: bucket_list target with a NULL accepted_bucket_list_item_id is reopened', async () => {
      const { user } = createUser(testDb);
      const id = seed(user.id, { state: 'accepted', target: 'bucket_list', accepted_bucket_list_item_id: null });
      await suggestions.reopenOrphaned(user.id);
      expect(rawRow(id).state).toBe('new');
    });

    it('DVSREPO-012: journal target whose entry no longer exists (cross-domain NOT EXISTS against journey_entries) is reopened', async () => {
      const { user } = createUser(testDb);
      const entryId = seedJourneyEntry(user.id);
      const id = seed(user.id, { state: 'accepted', target: 'journal', accepted_journal_entry_id: entryId });

      // Still exists: not reopened.
      await suggestions.reopenOrphaned(user.id);
      expect(rawRow(id).state).toBe('accepted');

      testDb.prepare('DELETE FROM journey_entries WHERE id = ?').run(entryId);
      await suggestions.reopenOrphaned(user.id);
      expect(rawRow(id).state).toBe('new');
      expect(rawRow(id).accepted_journal_entry_id).toBeNull();
    });

    it('DVSREPO-013: journal target with a NULL accepted_journal_entry_id is reopened without needing a journey_entries lookup at all', async () => {
      const { user } = createUser(testDb);
      const id = seed(user.id, { state: 'accepted', target: 'journal', accepted_journal_entry_id: null });
      await suggestions.reopenOrphaned(user.id);
      expect(rawRow(id).state).toBe('new');
    });

    it("DVSREPO-014: an intact acceptance (place still exists) is left alone; another user's orphan is untouched", async () => {
      const { user } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const placeId = seedPlace(trip.id);
      const intact = seed(user.id, { state: 'accepted', target: 'place', accepted_place_id: placeId });
      const theirs = seed(stranger.id, { state: 'accepted', target: 'place', accepted_place_id: null });

      await suggestions.reopenOrphaned(user.id);

      expect(rawRow(intact).state).toBe('accepted');
      expect(rawRow(theirs).state).toBe('accepted');
    });
  });

  describe('findForUser/findByUserAndVisit (DWS6/DSY3) — full-row parity, including persist(false) shadow FKs', () => {
    it('DVSREPO-020: every scalar column round-trips, matching a legacy SELECT *', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const wish = seedBucketItem(user.id);
      const id = seed(user.id, {
        trip_id: trip.id,
        matched_bucket_list_item_id: wish,
        accepted_bucket_list_item_id: wish,
        target: 'bucket_list',
        state: 'accepted',
        accepted_hash: 'hash-frozen',
      });

      const row = await suggestions.findForUser(id, user.id);
      expect(row).toEqual(rawRow(id));
      // The persist(false) shadow FKs specifically — the trap this Kysely
      // full-row read exists to avoid.
      expect(row!.trip_id).toBe(trip.id);
      expect(row!.matched_bucket_list_item_id).toBe(wish);
      expect(row!.accepted_bucket_list_item_id).toBe(wish);
    });

    it('DVSREPO-021: findForUser is scoped by id AND user_id; findByUserAndVisit by user_id AND source_visit_id', async () => {
      const { user } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const id = seed(stranger.id, { source_visit_id: 'abc' });
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
      expect(rawRow(id)).toMatchObject({ state: 'new', name: 'Stop', country_code: 'DE', source_hash: 'h1' });
    });

    it('DVSREPO-031: updateNewVisit overwrites the full row and clears source_missing_at', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = seed(user.id, { source_missing_at: '2026-01-01T00:00:00Z', name: 'Old name' });

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

      const row = rawRow(id);
      expect(row).toMatchObject({ name: 'New name', source_missing_at: null, trip_id: trip.id, source_hash: 'h2' });
    });

    it('DVSREPO-032: refreshHash touches only source_hash/source_missing_at/last_seen_at — the user-visible fields survive', async () => {
      const { user } = createUser(testDb);
      const id = seed(user.id, { name: 'Kept name', state: 'accepted', source_missing_at: '2026-01-01T00:00:00Z' });

      await suggestions.refreshHash(id, 'h3', '2026-03-01T00:00:00Z');

      expect(rawRow(id)).toMatchObject({
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
      const inWindow = seed(user.id, { trip_id: trip.id, local_date: '2026-05-05' });
      seed(user.id, { trip_id: trip.id, local_date: '2019-01-01' });

      const candidates = await suggestions.listCandidatesForWindow(user.id, trip.id, '2026-05-01', '2026-05-10');
      expect(candidates.map((c) => c.id)).toEqual([inWindow]);
    });

    it('DVSREPO-041: deleteById removes exactly the named row', async () => {
      const { user } = createUser(testDb);
      const id = seed(user.id);
      await suggestions.deleteById(id);
      expect(rawRow(id)).toBeUndefined();
    });

    it('DVSREPO-042: stampMissingIfUnset preserves the FIRST-missing timestamp (COALESCE, not overwrite)', async () => {
      const { user } = createUser(testDb);
      const id = seed(user.id, { source_missing_at: '2026-01-01T00:00:00Z' });
      await suggestions.stampMissingIfUnset(id, '2026-06-01T00:00:00Z');
      expect(rawRow(id).source_missing_at).toBe('2026-01-01T00:00:00Z');

      const id2 = seed(user.id, { source_missing_at: null });
      await suggestions.stampMissingIfUnset(id2, '2026-06-01T00:00:00Z');
      expect(rawRow(id2).source_missing_at).toBe('2026-06-01T00:00:00Z');
    });
  });

  describe('markAccepted (DWS11) — self-column-copy', () => {
    it('DVSREPO-050: accepted_hash tracks CURRENT source_hash at UPDATE time, not a value bound earlier', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const placeId = seedPlace(trip.id);
      const id = seed(user.id, { source_hash: 'hash-original' });

      // A concurrent write lands between "the caller decided to accept" and
      // the markAccepted call itself.
      testDb.prepare('UPDATE dawarich_visit_suggestions SET source_hash = ? WHERE id = ?').run('hash-concurrent', id);

      await suggestions.markAccepted(id, { target: 'place', placeId, journalEntryId: null, bucketItemId: null });

      const row = rawRow(id);
      expect(row.source_hash).toBe('hash-concurrent');
      expect(row.accepted_hash).toBe('hash-concurrent');
      expect(row.state).toBe('accepted');
      expect(row.accepted_place_id).toBe(placeId);
    });
  });

  describe('listHoldersOfWish/clearWishHolders/assignWishHolder (DSY11/12/13)', () => {
    it("DVSREPO-060: listHoldersOfWish excludes the caller's own source_visit_id", async () => {
      const { user } = createUser(testDb);
      const wish = seedBucketItem(user.id);
      const holder = seed(user.id, { source_visit_id: 'holder', matched_bucket_list_item_id: wish });
      seed(user.id, { source_visit_id: 'self', matched_bucket_list_item_id: wish });

      const holders = await suggestions.listHoldersOfWish(user.id, wish, 'self');
      expect(holders.map((h) => h.id)).toEqual([holder]);
    });

    it('DVSREPO-061: clear-then-assign leaves exactly one holder, scoped to the caller', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      const wish = seedBucketItem(user.id);
      seed(user.id, { source_visit_id: 'a', matched_bucket_list_item_id: wish });
      seed(user.id, { source_visit_id: 'b', matched_bucket_list_item_id: wish });
      const winnerId = seed(user.id, { source_visit_id: 'c', matched_bucket_list_item_id: null });
      const otherHolder = seed(other.id, { source_visit_id: 'a', matched_bucket_list_item_id: wish });

      await suggestions.clearWishHolders(user.id, wish);
      await suggestions.assignWishHolder(user.id, 'c', wish);

      const all = testDb
        .prepare(
          'SELECT id, matched_bucket_list_item_id FROM dawarich_visit_suggestions WHERE matched_bucket_list_item_id = ? AND user_id = ?',
        )
        .all(wish, user.id) as { id: number; matched_bucket_list_item_id: number }[];
      expect(all.map((r) => r.id)).toEqual([winnerId]);
      // clearWishHolders is scoped by user_id — another user's row with the
      // SAME wish id (a coincidence, wishes aren't globally unique ids across
      // users here) is untouched.
      expect(rawRow(otherHolder).matched_bucket_list_item_id).toBe(wish);
    });
  });

  describe('matchedStayStart (DWS14)', () => {
    it("DVSREPO-070: the most recent started_at among the user's stays matched to that wish", async () => {
      const { user } = createUser(testDb);
      const wish = seedBucketItem(user.id);
      seed(user.id, { matched_bucket_list_item_id: wish, started_at: '2026-01-01T00:00:00Z' });
      seed(user.id, { matched_bucket_list_item_id: wish, started_at: '2026-06-01T00:00:00Z' });

      expect(await suggestions.matchedStayStart(user.id, wish)).toBe('2026-06-01T00:00:00Z');
      expect(await suggestions.matchedStayStart(user.id, 999999)).toBeNull();
    });
  });
});
