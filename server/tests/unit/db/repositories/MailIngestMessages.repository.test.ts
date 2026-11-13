/**
 * Forwarded mails through their repository: a mail delivered twice is stored
 * once, a due mail is claimed by one run, a run whose claim ran out hands the
 * mail on, and the retention keeps a mail while its inbox entry waits.
 */
import { MailIngestAddresses } from '../../../../src/db/entities/MailIngestAddresses.entity';
import { MailIngestCandidates } from '../../../../src/db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../../../src/db/entities/MailIngestMessages.entity';
import type { MailIngestAddressesRepository } from '../../../../src/db/repositories/MailIngestAddresses.repository';
import type { MailIngestCandidatesRepository } from '../../../../src/db/repositories/MailIngestCandidates.repository';
import type {
  MailIngestMessageOutcome,
  MailIngestMessagesRepository,
} from '../../../../src/db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let messages: MailIngestMessagesRepository;
let addresses: MailIngestAddressesRepository;
let candidates: MailIngestCandidatesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  messages = t.repo(MailIngestMessages);
  addresses = t.repo(MailIngestAddresses);
  candidates = t.repo(MailIngestCandidates);
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

async function inbox() {
  const { user } = await makeUser(t);
  const addressId = await addresses.insertAddress({
    userId: user.id,
    tripId: null,
    tokenHash: `h${user.id}`,
    tokenEnc: 'e',
    createdAt: DAY1,
  });
  return { userId: user.id, addressId };
}

/** Stores a mail and answers its id; a second store of the same hash fails the test. */
async function store(box: { userId: number; addressId: number }, hash: string, receivedAt = DAY1): Promise<number> {
  const id = await insert(box, hash, receivedAt);
  if (id === null) throw new Error(`mail ${hash} was stored already`);
  return id;
}

function insert(box: { userId: number; addressId: number }, hash: string, receivedAt = DAY1) {
  return messages.insertIfNew({
    transport: 'upload',
    messageIdHdr: `<${hash}@x>`,
    dedupeHash: hash,
    addressId: box.addressId,
    userId: box.userId,
    tripId: null,
    size: 10,
    rawEnc: 'enc',
    receivedAt,
  });
}

const DONE: MailIngestMessageOutcome = {
  status: 'processed',
  reason: null,
  subject: 'Booking',
  fromAddr: 'a@b.c',
  fromVerified: true,
  authResults: 'dkim=pass',
  hints: '[]',
  attachments: '[]',
  forwardingCode: null,
  aiUsed: true,
  processedAt: DAY1,
};

describe('MailIngestMessagesRepository', () => {
  it('stores a mail once and finds it by its hash', async () => {
    const box = await inbox();
    const id = await store(box, 'm1');
    expect(await insert(box, 'm1')).toBeNull();
    expect(await messages.findIdByDedupeHash('m1')).toBe(id);
    expect(await messages.findIdByDedupeHash('m2')).toBeNull();
    expect(await messages.findById(id)).toMatchObject({ status: 'queued', attempts: 0, raw_eml_enc: 'enc' });
    expect(await messages.findById(id + 1)).toBeNull();
  });

  it('counts the mails of an address and the AI-read mails of a person since a time', async () => {
    const box = await inbox();
    const first = await store(box, 'c1', at('2026-10-31T10:00:00Z'));
    await store(box, 'c2', DAY1);
    expect(await messages.countForAddressSince(box.addressId, at('2026-11-01T00:00:00Z'))).toBe(1);
    await messages.finish(first, DONE);
    expect(await messages.countAiReadSince(box.userId, at('2026-10-31T00:00:00Z'))).toBe(1);
    expect(await messages.countAiReadSince(box.userId, at('2026-11-01T00:00:00Z'))).toBe(0);
  });

  it('claims a due mail for one run and lets a claim that ran out go to the next', async () => {
    const box = await inbox();
    const id = await store(box, 'd1');
    await store(box, 'd2', at('2026-11-05T10:00:00Z'));

    const now = at('2026-11-01T11:00:00Z');
    const lease = at('2026-11-01T11:10:00Z');
    expect(await messages.claimDue(now, lease, 3)).toEqual([id]);
    expect(await messages.claimDue(now, lease, 3)).toEqual([]);

    const later = at('2026-11-01T11:20:00Z');
    expect(await messages.claimDue(later, at('2026-11-01T11:30:00Z'), 3)).toEqual([id]);
    expect(await messages.findById(id)).toMatchObject({ status: 'processing', attempts: 2 });

    await messages.retryLater(id, at('2026-11-01T12:00:00Z'));
    expect(await messages.claimDue(later, lease, 3)).toEqual([]);
    expect(await messages.claimDue(at('2026-11-01T12:00:00Z'), lease, 3)).toEqual([id]);

    await messages.finish(id, DONE);
    expect(await messages.findById(id)).toMatchObject({
      status: 'processed',
      ai_used: 1,
      from_verified: 1,
      lease_until: null,
    });
  });

  it('purges a mail once it is done and nothing waits on it, and always after the hard limit', async () => {
    const box = await inbox();
    const waiting = await store(box, 'p1');
    const settled = await store(box, 'p2');
    const old = await store(box, 'p3', at('2026-09-01T10:00:00Z'));
    await messages.finish(waiting, DONE);
    await messages.finish(settled, DONE);
    await candidates.insertCandidate({
      messageId: waiting,
      userId: box.userId,
      position: 0,
      itemJson: null,
      source: null,
      checksJson: null,
      uncertainFields: null,
      matchJson: null,
      suggestedTripId: null,
      dedupeKey: null,
      contentHash: null,
      resolution: 'pending',
      reason: 'no_trip_in_range',
      createdAt: DAY1,
    });

    const purgedAt = at('2026-11-20T10:00:00Z');
    expect(await messages.purgeRaw(at('2026-11-10T10:00:00Z'), at('2026-10-01T10:00:00Z'), purgedAt)).toBe(2);
    expect(await messages.findById(waiting)).toMatchObject({ raw_eml_enc: 'enc', raw_purged_at: null });
    expect(await messages.findById(settled)).toMatchObject({ raw_eml_enc: null, raw_purged_at: purgedAt });
    expect(await messages.findById(old)).toMatchObject({ raw_eml_enc: null });
  });

  it('deletes settled mails without entries, and keeps queued ones and those with entries', async () => {
    const box = await inbox();
    const queued = await store(box, 'x1', at('2026-08-01T10:00:00Z'));
    const bare = await store(box, 'x2', at('2026-08-01T10:00:00Z'));
    const withEntry = await store(box, 'x3', at('2026-08-01T10:00:00Z'));
    await messages.finish(bare, { ...DONE, status: 'discarded' });
    await messages.finish(withEntry, DONE);
    await candidates.insertCandidate({
      messageId: withEntry,
      userId: box.userId,
      position: 0,
      itemJson: null,
      source: null,
      checksJson: null,
      uncertainFields: null,
      matchJson: null,
      suggestedTripId: null,
      dedupeKey: null,
      contentHash: null,
      resolution: 'discarded',
      reason: null,
      createdAt: DAY1,
    });

    expect(await messages.deleteSettledBefore(at('2026-09-01T00:00:00Z'))).toBe(1);
    expect(await messages.findById(bare)).toBeNull();
    expect(await messages.findById(queued)).not.toBeNull();
    expect(await messages.findById(withEntry)).not.toBeNull();
  });
});
