/**
 * Unit tests for QueryHelpersService (Plan 3c Task 1) — its first dedicated
 * test file (inventory §15c: previously exercised only transitively through
 * days/assignments/places/share suites). Real rows through
 * `TagsRepository`/`PlaceRatingsRepository`/`AssignmentParticipantsRepository`.
 */
import { AssignmentParticipants } from '../../../src/db/entities/AssignmentParticipants.entity';
import { PlaceRatings } from '../../../src/db/entities/PlaceRatings.entity';
import { Tags } from '../../../src/db/entities/Tags.entity';
import type { AssignmentParticipantsRepository } from '../../../src/db/repositories/AssignmentParticipants.repository';
import type { PlaceRatingsRepository } from '../../../src/db/repositories/PlaceRatings.repository';
import type { TagsRepository } from '../../../src/db/repositories/Tags.repository';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import {
  createDay,
  createDayAssignment,
  createPlace,
  createTag,
  createTrip,
  createUser,
} from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let svc: QueryHelpersService;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  const tags: TagsRepository = t.repo(Tags);
  const placeRatings: PlaceRatingsRepository = t.repo(PlaceRatings);
  const assignmentParticipants: AssignmentParticipantsRepository = t.repo(AssignmentParticipants);
  svc = new QueryHelpersService(tags, placeRatings, assignmentParticipants);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function attachTag(tagId: number, placeId: number): void {
  testDb.prepare('INSERT INTO place_tags (tag_id, place_id) VALUES (?, ?)').run(tagId, placeId);
}

function rate(placeId: number, userId: number, rating: number): void {
  testDb.prepare('INSERT INTO place_ratings (place_id, user_id, rating) VALUES (?, ?, ?)').run(placeId, userId, rating);
}

function addParticipant(assignmentId: number, userId: number): void {
  testDb
    .prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)')
    .run(assignmentId, userId);
}

describe('QueryHelpersService.loadTagsByPlaceIds', () => {
  it('QH-001: an empty placeIds array yields an empty Record', async () => {
    expect(await svc.loadTagsByPlaceIds([])).toEqual({});
  });

  it('QH-002: indexes tags by place id, non-compact carries every column but the join key', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const tag = createTag(testDb, user.id, { name: 'Beach', color: '#ff0000' });
    attachTag(tag.id, place.id);

    const byPlace = await svc.loadTagsByPlaceIds([place.id]);
    expect(byPlace[place.id]).toHaveLength(1);
    expect(byPlace[place.id][0]).toMatchObject({ id: tag.id, user_id: user.id, name: 'Beach', color: '#ff0000' });
    expect(byPlace[place.id][0]).not.toHaveProperty('place_id');
  });

  it('QH-003: compact drops user_id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const tag = createTag(testDb, user.id, { name: 'Compact' });
    attachTag(tag.id, place.id);

    const byPlace = await svc.loadTagsByPlaceIds([place.id], { compact: true });
    expect(byPlace[place.id][0]).toEqual({
      id: tag.id,
      name: 'Compact',
      color: tag.color,
      created_at: expect.any(String),
    });
  });

  it('QH-004: batches across several places, grouping correctly, a place with no tags gets no key', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const placeA = createPlace(testDb, trip.id, { name: 'A' });
    const placeB = createPlace(testDb, trip.id, { name: 'B' });
    const placeC = createPlace(testDb, trip.id, { name: 'C' });
    const tag = createTag(testDb, user.id);
    attachTag(tag.id, placeA.id);
    attachTag(tag.id, placeB.id);

    const byPlace = await svc.loadTagsByPlaceIds([placeA.id, placeB.id, placeC.id]);
    expect(Object.keys(byPlace).map(Number).sort()).toEqual([placeA.id, placeB.id].sort());
    expect(byPlace[placeC.id]).toBeUndefined();
  });

  it('QH-004b: a second tag on the same place appends to the existing array instead of resetting it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const tagA = createTag(testDb, user.id, { name: 'First' });
    const tagB = createTag(testDb, user.id, { name: 'Second' });
    attachTag(tagA.id, place.id);
    attachTag(tagB.id, place.id);

    const byPlace = await svc.loadTagsByPlaceIds([place.id]);
    expect(byPlace[place.id].map((t) => t.name).sort()).toEqual(['First', 'Second']);
  });
});

describe('QueryHelpersService.loadRatingsByPlaceIds', () => {
  it('QH-005: an empty placeIds array yields an empty Record', async () => {
    expect(await svc.loadRatingsByPlaceIds([])).toEqual({});
  });

  it("QH-006: indexes ratings by place id with the voter's username/avatar", async () => {
    const { user: owner } = createUser(testDb);
    const { user: voter } = createUser(testDb, { username: 'rater1' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    rate(place.id, voter.id, 4);

    const byPlace = await svc.loadRatingsByPlaceIds([place.id]);
    expect(byPlace[place.id]).toEqual([{ user_id: voter.id, username: 'rater1', avatar: null, rating: 4 }]);
  });

  it('QH-007: a place with no ratings gets no key', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    expect(await svc.loadRatingsByPlaceIds([place.id])).toEqual({});
  });

  it('QH-007b: a second rating on the same place appends to the existing array instead of resetting it', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voterA } = createUser(testDb, { username: 'voter-a' });
    const { user: voterB } = createUser(testDb, { username: 'voter-b' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    rate(place.id, voterA.id, 5);
    rate(place.id, voterB.id, 2);

    const byPlace = await svc.loadRatingsByPlaceIds([place.id]);
    expect(byPlace[place.id].map((r) => r.username).sort()).toEqual(['voter-a', 'voter-b']);
  });
});

describe('QueryHelpersService.loadParticipantsByAssignmentIds', () => {
  it('QH-008: an empty assignmentIds array yields an empty Record', async () => {
    expect(await svc.loadParticipantsByAssignmentIds([])).toEqual({});
  });

  it('QH-009: indexes participants by assignment id, with NO COALESCE(display_name, username) — raw username only', async () => {
    const { user: owner } = createUser(testDb);
    const { user: participant } = createUser(testDb, { username: 'raw-username' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Ignored Display Name', participant.id);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    addParticipant(assignment.id, participant.id);

    const byAssignment = await svc.loadParticipantsByAssignmentIds([assignment.id]);
    expect(byAssignment[assignment.id]).toEqual([{ user_id: participant.id, username: 'raw-username', avatar: null }]);
  });

  it('QH-010: an assignment with no participants gets no key', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    expect(await svc.loadParticipantsByAssignmentIds([assignment.id])).toEqual({});
  });

  it('QH-010b: a second participant on the same assignment appends to the existing array instead of resetting it', async () => {
    const { user: owner } = createUser(testDb);
    const { user: p1 } = createUser(testDb, { username: 'p1' });
    const { user: p2 } = createUser(testDb, { username: 'p2' });
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    addParticipant(assignment.id, p1.id);
    addParticipant(assignment.id, p2.id);

    const byAssignment = await svc.loadParticipantsByAssignmentIds([assignment.id]);
    expect(byAssignment[assignment.id].map((p) => p.username).sort()).toEqual(['p1', 'p2']);
  });
});
