/**
 * The bookings read from mails through their repository, and what it reads
 * of the trips they may go to: a decision lands once, an undone booking is
 * remembered per trip, and only the person's open trips are weighed.
 */
import { MailIngestAddresses } from '../../../../src/db/entities/MailIngestAddresses.entity';
import { MailIngestCandidates } from '../../../../src/db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../../../src/db/entities/MailIngestMessages.entity';
import type { MailIngestAddressesRepository } from '../../../../src/db/repositories/MailIngestAddresses.repository';
import type {
  MailIngestCandidateInsert,
  MailIngestCandidatesRepository,
} from '../../../../src/db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessagesRepository } from '../../../../src/db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addBudgetItemPayer, makeBudgetItem } from '../../../helpers/factories/budget';
import { makePlace } from '../../../helpers/factories/places';
import { makeReservation } from '../../../helpers/factories/reservations';
import { addTripMember, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let candidates: MailIngestCandidatesRepository;
let messages: MailIngestMessagesRepository;
let addresses: MailIngestAddressesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  candidates = t.repo(MailIngestCandidates);
  messages = t.repo(MailIngestMessages);
  addresses = t.repo(MailIngestAddresses);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const at = (iso: string) => dbNow(new Date(iso));
const DAY1 = at('2026-11-01T10:00:00Z');

async function mailOf(userId: number): Promise<number> {
  const addressId = await addresses.insertAddress({
    userId,
    tripId: null,
    tokenHash: `h${userId}`,
    tokenEnc: 'e',
    createdAt: DAY1,
  });
  const id = await messages.insertIfNew({
    transport: 'upload',
    messageIdHdr: null,
    dedupeHash: `d${userId}`,
    addressId,
    userId,
    tripId: null,
    size: 1,
    rawEnc: 'enc',
    receivedAt: DAY1,
  });
  return id!;
}

function entry(messageId: number, userId: number, over: Partial<MailIngestCandidateInsert> = {}) {
  return candidates.insertCandidate({
    messageId,
    userId,
    position: 0,
    itemJson: '{}',
    source: 'ai',
    checksJson: '{}',
    uncertainFields: '[]',
    matchJson: null,
    suggestedTripId: null,
    dedupeKey: null,
    contentHash: 'c1',
    resolution: 'pending',
    reason: 'trip_ambiguous',
    createdAt: DAY1,
    ...over,
  });
}

describe('MailIngestCandidatesRepository: the entries', () => {
  it('lists a mail’s entries in order and counts the waiting ones', async () => {
    const { user } = await makeUser(t);
    const mail = await mailOf(user.id);
    const second = await entry(mail, user.id, { position: 1 });
    const first = await entry(mail, user.id, { position: 0, resolution: 'duplicate', reason: null });
    expect((await candidates.listForMessage(mail)).map((row) => row.id)).toEqual([first, second]);
    expect(await candidates.countPending(user.id)).toBe(1);
    expect(await candidates.findById(second)).toMatchObject({ source: 'ai', reason: 'trip_ambiguous' });
    expect(await candidates.findById(second + 10)).toBeNull();
  });

  it('decides an entry once, and records its documents afterwards', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const mail = await mailOf(user.id);
    const id = await entry(mail, user.id);
    const patch = {
      resolution: 'applied',
      reason: null,
      resolvedTripId: trip.id,
      createdIdsJson: '{"reservation_ids":[1]}',
      resolvedBy: user.id,
      resolvedAt: DAY1,
      undoUntil: at('2026-11-08T10:00:00Z'),
    };
    expect(await candidates.resolve(id, ['pending'], patch)).toBe(true);
    expect(await candidates.resolve(id, ['pending'], patch)).toBe(false);

    await candidates.setAttachments(id, '{"reservation_ids":[1],"file_ids":[2]}', null);
    expect(await candidates.findById(id)).toMatchObject({
      resolution: 'applied',
      resolved_trip_id: trip.id,
      created_ids_json: '{"reservation_ids":[1],"file_ids":[2]}',
      attach_error: null,
    });
  });

  it('remembers a booking undone in a trip by its content', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const id = await entry(await mailOf(user.id), user.id, { contentHash: 'same' });
    expect(await candidates.wasUndoneInTrip(trip.id, 'same')).toBe(false);
    await candidates.resolve(id, ['pending'], {
      resolution: 'undone',
      reason: null,
      resolvedTripId: trip.id,
      createdIdsJson: null,
      resolvedBy: user.id,
      resolvedAt: DAY1,
      undoUntil: null,
    });
    expect(await candidates.wasUndoneInTrip(trip.id, 'same')).toBe(true);
    expect(await candidates.wasUndoneInTrip(trip.id, 'other')).toBe(false);
  });

  it('deletes decided entries past the cutoff and keeps the waiting ones', async () => {
    const { user } = await makeUser(t);
    const mail = await mailOf(user.id);
    const waiting = await entry(mail, user.id);
    const decided = await entry(mail, user.id, { position: 1 });
    await candidates.resolve(decided, ['pending'], {
      resolution: 'discarded',
      reason: null,
      resolvedTripId: null,
      createdIdsJson: null,
      resolvedBy: user.id,
      resolvedAt: at('2026-07-01T10:00:00Z'),
      undoUntil: null,
    });
    expect(await candidates.deleteResolvedBefore(at('2026-08-01T00:00:00Z'))).toBe(1);
    expect(await candidates.findById(waiting)).not.toBeNull();
    expect(await candidates.findById(decided)).toBeNull();
  });
});

describe('MailIngestCandidatesRepository: what it reads of the trips', () => {
  it('lists the person’s open trips, owned or joined, newest start first', async () => {
    const { user } = await makeUser(t);
    const { user: other } = await makeUser(t);
    const owned = await makeTrip(t, user.id, { start_date: '2027-03-01', end_date: '2027-03-03', currency: 'JPY' });
    const joined = await makeTrip(t, other.id, { start_date: '2027-05-01', end_date: '2027-05-02' });
    await addTripMember(t, joined.id, user.id);
    const undated = await makeTrip(t, user.id);
    await makeTrip(t, user.id, { start_date: '2026-01-01', end_date: '2026-01-02' });
    await makeTrip(t, user.id, { start_date: '2027-06-01', end_date: '2027-06-02', is_archived: 1 });
    await makeTrip(t, other.id, { start_date: '2027-07-01', end_date: '2027-07-02' });

    const trips = await candidates.listOpenTrips(user.id, '2026-10-01', 20);
    expect(trips.map((trip) => trip.id).sort()).toEqual([owned.id, joined.id, undated.id].sort());
    expect(trips.find((trip) => trip.id === owned.id)).toMatchObject({ user_id: user.id, currency: 'JPY' });
    expect(await candidates.listOpenTrips(user.id, '2026-10-01', 1)).toHaveLength(1);
  });

  it('reads the dated days and the placed places of trips', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id, { start_date: '2027-03-01', end_date: '2027-03-02' });
    await makePlace(t, trip.id, { name: 'Hotel Sakura', address: 'Tokyo', lat: 35.68, lng: 139.76 });
    await makePlace(t, trip.id, { name: 'Somewhere', lat: null, lng: null });

    expect(await candidates.listDayDates([trip.id])).toEqual([
      { trip_id: trip.id, date: '2027-03-01' },
      { trip_id: trip.id, date: '2027-03-02' },
    ]);
    expect(await candidates.listDayDates([])).toEqual([]);
    expect(await candidates.listPlacesWithPosition([trip.id])).toEqual([
      { trip_id: trip.id, name: 'Hotel Sakura', address: 'Tokyo', lat: 35.68, lng: 139.76 },
    ]);
    expect(await candidates.listPlacesWithPosition([])).toEqual([]);
  });

  it('reads the person a mail is for', async () => {
    const { user } = await makeUser(t, { username: 'mia', email: 'mia@example.com' });
    expect(await candidates.findPerson(user.id)).toEqual({ id: user.id, username: 'mia', email: 'mia@example.com', role: 'user' });
    expect(await candidates.findPerson(user.id + 100)).toBeNull();
  });

  it('finds a booking an import stored under a key, and one that looks the same', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    await makeReservation(t, trip.id, {
      type: 'flight',
      reservation_time: '2027-03-01T10:00',
      confirmation_number: 'ABC123',
      external_source: 'mail',
      external_id: 'ABC123|flight|2027-03-01|hnd-itm',
    });

    expect(await candidates.tripHasExternal(trip.id, ['import', 'mail'], 'ABC123|flight|2027-03-01|hnd-itm')).toBe(true);
    expect(await candidates.tripHasExternal(trip.id, ['import'], 'ABC123|flight|2027-03-01|hnd-itm')).toBe(false);

    const none = { type: 'flight', startFrom: null, startTo: null, confirmation: null };
    expect(await candidates.tripHasSimilar(trip.id, none)).toBe(false);
    expect(await candidates.tripHasSimilar(trip.id, { ...none, confirmation: 'ABC123' })).toBe(true);
    expect(
      await candidates.tripHasSimilar(trip.id, { ...none, startFrom: '2027-03-01T09:30', startTo: '2027-03-01T10:30' }),
    ).toBe(true);
    expect(
      await candidates.tripHasSimilar(trip.id, {
        ...none,
        type: 'train',
        startFrom: '2027-03-01T09:30',
        startTo: '2027-03-01T10:30',
      }),
    ).toBe(false);
  });

  it('counts the payers of costs', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const paid = await makeBudgetItem(t, trip.id);
    const open = await makeBudgetItem(t, trip.id);
    await addBudgetItemPayer(t, paid.id, user.id, 100);
    expect(await candidates.countPayers([paid.id, open.id])).toBe(1);
    expect(await candidates.countPayers([open.id])).toBe(0);
    expect(await candidates.countPayers([])).toBe(0);
  });
});
