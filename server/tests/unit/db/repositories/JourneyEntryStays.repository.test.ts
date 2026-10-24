/**
 * `JourneyEntryStaysRepository` (JRN-02): the stays an entry was taken over
 * from, written together, read back as the ledger of one person's stays in
 * one journey with the entry holding each, unique per journey, source, person
 * and visit, gone with their entry and kept past the account they came from.
 */
import { JourneyEntries } from '../../../../src/db/entities/JourneyEntries.entity';
import { JourneyEntryStays } from '../../../../src/db/entities/JourneyEntryStays.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type {
  JourneyEntryStaysRepository,
  JourneyEntryStayWrite,
} from '../../../../src/db/repositories/JourneyEntryStays.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeJourney } from '../../../helpers/factories/journeys';
import { countRows, deleteRows, findRows, insertRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let stays: JourneyEntryStaysRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  stays = t.repo(JourneyEntryStays);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function journeyWithEntry(title = 'Venice') {
  const { user } = await makeUser(t, { username: 'marta' });
  const journey = await makeJourney(t, user.id);
  const entryId = await entry(journey.id, user.id, title);
  return { user, journey, entryId };
}

function entry(journeyId: number, authorId: number, title: string) {
  return insertRow(t, JourneyEntries, {
    journey: journeyId,
    author: authorId,
    type: 'entry',
    title,
    entry_date: '2026-05-14',
    created_at: 0,
    updated_at: 0,
  });
}

function stay(
  journeyId: number,
  entryId: number,
  userId: number,
  overrides: Partial<JourneyEntryStayWrite> = {},
): JourneyEntryStayWrite {
  return {
    journey_id: journeyId,
    entry_id: entryId,
    source: 'dawarich',
    source_visit_id: '101',
    name: 'Piazza San Marco',
    lat: 45.434,
    lng: 12.3388,
    started_at: '2026-05-14T09:10:00+02:00',
    ended_at: '2026-05-14T10:05:00+02:00',
    duration_minutes: 55,
    sort_order: 0,
    user_id: userId,
    ...overrides,
  };
}

describe('JourneyEntryStaysRepository', () => {
  it('JESTAYS-001: writes the stays of an entry together and reads which of them the journey holds', async () => {
    const { user, journey, entryId } = await journeyWithEntry('Morning in San Marco');
    await stays.insertStays([
      stay(journey.id, entryId, user.id),
      stay(journey.id, entryId, user.id, { source_visit_id: '102', name: 'Rialto', sort_order: 1 }),
    ]);

    const held = await stays.listHeld(journey.id, user.id, 'dawarich', ['101', '102', '103']);
    expect(held).toHaveLength(2);
    expect(held).toEqual(
      expect.arrayContaining([
        { source_visit_id: '101', entry_id: entryId, entry_title: 'Morning in San Marco' },
        { source_visit_id: '102', entry_id: entryId, entry_title: 'Morning in San Marco' },
      ]),
    );
    expect(await findRows(t, JourneyEntryStays, { entry: entryId })).toHaveLength(2);
  });

  it('JESTAYS-002: the ledger is per person, journey and source, and an empty ask reads nothing', async () => {
    const { user, journey, entryId } = await journeyWithEntry();
    const { user: editor } = await makeUser(t);
    const other = await makeJourney(t, user.id);
    await stays.insertStays([stay(journey.id, entryId, user.id)]);

    expect(await stays.listHeld(journey.id, editor.id, 'dawarich', ['101'])).toEqual([]);
    expect(await stays.listHeld(other.id, user.id, 'dawarich', ['101'])).toEqual([]);
    expect(await stays.listHeld(journey.id, user.id, 'other', ['101'])).toEqual([]);
    expect(await stays.listHeld(journey.id, user.id, 'dawarich', [])).toEqual([]);
    await stays.insertStays([]);
    expect(await countRows(t, JourneyEntryStays, {})).toBe(1);
  });

  it('JESTAYS-003: the same stay of the same person lands in a journey once; another person may hold the same visit id', async () => {
    const { user, journey, entryId } = await journeyWithEntry();
    const { user: editor } = await makeUser(t);
    await stays.insertStays([stay(journey.id, entryId, user.id)]);

    await expect(stays.insertStays([stay(journey.id, entryId, user.id)])).rejects.toThrow();
    await stays.insertStays([stay(journey.id, entryId, editor.id)]);
    expect(await countRows(t, JourneyEntryStays, {})).toBe(2);
  });

  it('JESTAYS-004: the stays go with their entry and outlive the account they came from', async () => {
    const { user, journey, entryId } = await journeyWithEntry();
    const { user: editor } = await makeUser(t);
    const second = await entry(journey.id, user.id, 'Afternoon');
    await stays.insertStays([
      stay(journey.id, entryId, editor.id),
      stay(journey.id, second, user.id, { source_visit_id: '200' }),
    ]);

    await deleteRows(t, Users, { id: editor.id });
    expect(await countRows(t, JourneyEntryStays, { entry: entryId, user: null })).toBe(1);

    await deleteRows(t, JourneyEntries, { id: second });
    expect(await countRows(t, JourneyEntryStays, {})).toBe(1);
  });

  it('JESTAYS-005: the map reads the located stays of a journey by entry, in the order they were lived', async () => {
    const { user, journey, entryId } = await journeyWithEntry();
    const second = await entry(journey.id, user.id, 'Afternoon');
    const other = await makeJourney(t, user.id);
    await stays.insertStays([
      stay(journey.id, second, user.id, { source_visit_id: '300', name: 'Giudecca' }),
      stay(journey.id, entryId, user.id, { source_visit_id: '102', name: 'Rialto', sort_order: 1 }),
      stay(journey.id, entryId, user.id, { source_visit_id: '101', name: 'San Marco', sort_order: 0 }),
      stay(journey.id, entryId, user.id, {
        source_visit_id: '103',
        name: 'Nowhere',
        lat: null,
        lng: null,
        sort_order: 2,
      }),
    ]);
    await stays.insertStays([stay(other.id, entryId, user.id, { source_visit_id: '400' })]);

    const located = await stays.listLocatedForJourney(journey.id);
    expect(located.map((s) => [s.entry_id, s.name])).toEqual([
      [entryId, 'San Marco'],
      [entryId, 'Rialto'],
      [second, 'Giudecca'],
    ]);
    expect(located[0]).toEqual({
      id: expect.any(Number),
      entry_id: entryId,
      name: 'San Marco',
      lat: 45.434,
      lng: 12.3388,
      started_at: '2026-05-14T09:10:00+02:00',
      ended_at: '2026-05-14T10:05:00+02:00',
    });
  });
});
