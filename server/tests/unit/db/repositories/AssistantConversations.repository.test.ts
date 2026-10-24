/**
 * The assistant's conversation tables through their repositories: threads
 * reached only by their owner on their own trip or journey, messages in the
 * order they were written, proposed changes decided and undone exactly once,
 * the usage a daily limit counts, and everything going with its user, trip or
 * journey (GDPR).
 */
import { AssistantMessages } from '../../../../src/db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../../../src/db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../../../src/db/entities/AssistantToolCalls.entity';
import { AssistantUsage } from '../../../../src/db/entities/AssistantUsage.entity';
import { JourneyContributors } from '../../../../src/db/entities/JourneyContributors.entity';
import { Journeys } from '../../../../src/db/entities/Journeys.entity';
import { TripJournalLinkMembers } from '../../../../src/db/entities/TripJournalLinkMembers.entity';
import { TripJournalLinks } from '../../../../src/db/entities/TripJournalLinks.entity';
import { Trips } from '../../../../src/db/entities/Trips.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { AssistantMessagesRepository } from '../../../../src/db/repositories/AssistantMessages.repository';
import type { AssistantThreadsRepository } from '../../../../src/db/repositories/AssistantThreads.repository';
import type { AssistantToolCallsRepository } from '../../../../src/db/repositories/AssistantToolCalls.repository';
import type { AssistantUsageRepository } from '../../../../src/db/repositories/AssistantUsage.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../../helpers/factories/journeys';
import { countRows, createRow, deleteRows, insertRow } from '../../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let threads: AssistantThreadsRepository;
let messages: AssistantMessagesRepository;
let calls: AssistantToolCallsRepository;
let usage: AssistantUsageRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  threads = t.repo(AssistantThreads);
  messages = t.repo(AssistantMessages);
  calls = t.repo(AssistantToolCalls);
  usage = t.repo(AssistantUsage);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const AT = '2026-10-20 10:00:00';
const LATER = '2026-10-20 11:00:00';

async function ownerWithTrip() {
  const { user } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  return { userId: user.id, tripId: trip.id };
}

async function ownerWithJourney() {
  const { user } = await makeUser(t);
  const journey = await makeJourney(t, user.id);
  return { userId: user.id, journeyId: journey.id };
}

async function threadWithMessage() {
  const { userId, tripId } = await ownerWithTrip();
  const threadId = await threads.createThread(userId, tripId, 'Kyoto day', AT);
  const messageId = await messages.append({
    threadId,
    role: 'assistant',
    parts: '[]',
    providerState: null,
    status: 'awaiting_approval',
    model: 'claude',
    createdAt: AT,
  });
  return { userId, tripId, threadId, messageId };
}

function proposal(id: string, threadId: number, messageId: number, providerCallId = id) {
  return {
    id,
    threadId,
    messageId,
    providerCallId,
    toolName: 'create_place',
    args: '{}',
    preview: '{}',
    createdAt: AT,
  };
}

describe('threads', () => {
  it('ASTREPO-001: a thread is found, listed and deleted only by its owner on its trip', async () => {
    const { userId, tripId } = await ownerWithTrip();
    const { user: other } = await makeUser(t);
    const older = await threads.createThread(userId, tripId, 'First', AT);
    const newer = await threads.createThread(userId, tripId, 'Second', AT);
    await threads.touch(older, LATER);

    expect((await threads.listRecent(userId, tripId, 20)).map((row) => row.id)).toEqual([older, newer]);
    expect(await threads.listRecent(userId, tripId, 1)).toHaveLength(1);
    expect(await threads.findOwned(older, other.id, tripId)).toBeNull();
    expect(await threads.findOwned(older, userId, tripId + 1)).toBeNull();
    expect(await threads.findOwned(older, userId, tripId)).toMatchObject({ title: 'First', last_message_at: LATER });

    expect(await threads.deleteOwned(older, other.id, tripId)).toBe(false);
    expect(await threads.deleteOwned(older, userId, tripId)).toBe(true);
  });

  it('ASTREPO-002: retention drops idle threads and the threads of users who left the trip', async () => {
    const { userId, tripId } = await ownerWithTrip();
    const { user: member } = await makeUser(t);
    const { user: leaver } = await makeUser(t);
    await addTripMember(t, tripId, member.id);
    const idle = await threads.createThread(userId, tripId, 'Idle', '2026-01-01 00:00:00');
    const kept = await threads.createThread(userId, tripId, 'Kept', AT);
    const memberThread = await threads.createThread(member.id, tripId, 'Member', AT);
    await threads.createThread(leaver.id, tripId, 'Leaver', AT);

    expect(await threads.deleteIdleBefore('2026-06-01 00:00:00')).toBe(1);
    expect(await threads.deleteWithoutAccess()).toBe(1);
    expect((await threads.listRecent(userId, tripId, 20)).map((row) => row.id)).toEqual([kept]);
    expect(await threads.findOwned(memberThread, member.id, tripId)).not.toBeNull();
    expect(await threads.findOwned(idle, userId, tripId)).toBeNull();
  });
});

describe('journey threads', () => {
  it('ASTREPO-003: a journey thread is found, listed and deleted only by its owner on its journey, never on a trip', async () => {
    const { userId, journeyId } = await ownerWithJourney();
    const { user: other } = await makeUser(t);
    const trip = await makeTrip(t, userId);
    const older = await threads.createJourneyThread(userId, journeyId, 'Cover', AT);
    const newer = await threads.createJourneyThread(userId, journeyId, 'Pages', AT);
    const onTrip = await threads.createThread(userId, trip.id, 'Kyoto', AT);
    await threads.touch(older, LATER);

    expect((await threads.listRecentOnJourney(userId, journeyId, 20)).map((row) => row.id)).toEqual([older, newer]);
    expect((await threads.listRecent(userId, trip.id, 20)).map((row) => row.id)).toEqual([onTrip]);
    expect(await threads.findOwnedOnJourney(older, userId, journeyId)).toMatchObject({
      title: 'Cover',
      journey_id: journeyId,
      trip_id: null,
    });
    expect(await threads.findOwnedOnJourney(older, other.id, journeyId)).toBeNull();
    expect(await threads.findOwnedOnJourney(older, userId, journeyId + 1)).toBeNull();
    expect(await threads.findOwnedOnJourney(onTrip, userId, journeyId)).toBeNull();
    expect(await threads.findOwned(older, userId, trip.id)).toBeNull();
    expect(await threads.findOwned(onTrip, userId, trip.id)).toMatchObject({ trip_id: trip.id, journey_id: null });

    expect(await threads.deleteOwnedOnJourney(older, other.id, journeyId)).toBe(false);
    expect(await threads.deleteOwned(older, userId, trip.id)).toBe(false);
    expect(await threads.deleteOwnedOnJourney(older, userId, journeyId)).toBe(true);
  });

  it('ASTREPO-004: retention keeps the threads of the journey owner and its contributors, and drops those of people taken off it', async () => {
    const { userId, journeyId } = await ownerWithJourney();
    const { user: editor } = await makeUser(t);
    const { user: leaver } = await makeUser(t);
    await addJourneyContributor(t, journeyId, editor.id, 'editor');
    await addJourneyContributor(t, journeyId, leaver.id, 'viewer');
    const own = await threads.createJourneyThread(userId, journeyId, 'Own', AT);
    const edited = await threads.createJourneyThread(editor.id, journeyId, 'Editor', AT);
    const left = await threads.createJourneyThread(leaver.id, journeyId, 'Leaver', AT);
    await deleteRows(t, JourneyContributors, { journey: journeyId, user: leaver.id });

    expect(await threads.deleteWithoutAccess()).toBe(1);
    expect(await threads.findOwnedOnJourney(own, userId, journeyId)).not.toBeNull();
    expect(await threads.findOwnedOnJourney(edited, editor.id, journeyId)).not.toBeNull();
    expect(await threads.findOwnedOnJourney(left, leaver.id, journeyId)).toBeNull();
  });

  it('ASTREPO-006: retention keeps the journey threads of someone a trip journal link lets in, until it drops them', async () => {
    const { userId, journeyId } = await ownerWithJourney();
    const trip = await makeTrip(t, userId);
    const { user: member } = await makeUser(t);
    const link = await createRow(t, TripJournalLinks, { trip: trip.id, journey: journeyId, created_at: Date.now() });
    await insertRow(t, TripJournalLinkMembers, { link: link.id, user: member.id, added_at: Date.now() });
    const linked = await threads.createJourneyThread(member.id, journeyId, 'Linked', AT);

    expect(await threads.deleteWithoutAccess()).toBe(0);
    expect(await threads.findOwnedOnJourney(linked, member.id, journeyId)).not.toBeNull();

    await deleteRows(t, TripJournalLinkMembers, { link: link.id, user: member.id });
    expect(await threads.deleteWithoutAccess()).toBe(1);
    expect(await threads.findOwnedOnJourney(linked, member.id, journeyId)).toBeNull();
  });

  it('ASTREPO-005: a change of a journey thread is found only through its own user and journey', async () => {
    const { userId, journeyId } = await ownerWithJourney();
    const { user: other } = await makeUser(t);
    const threadId = await threads.createJourneyThread(userId, journeyId, 'Book', AT);
    const messageId = await messages.append({
      threadId,
      role: 'assistant',
      parts: '[]',
      providerState: null,
      status: 'awaiting_approval',
      model: 'claude',
      createdAt: AT,
    });
    await calls.insertProposals([proposal('j1', threadId, messageId)]);
    expect(await calls.findOwnedOnJourney('j1', userId, journeyId)).toMatchObject({ id: 'j1', thread_id: threadId });
    expect(await calls.findOwnedOnJourney('j1', other.id, journeyId)).toBeNull();
    expect(await calls.findOwnedOnJourney('j1', userId, journeyId + 1)).toBeNull();
    expect(await calls.findOwned('j1', userId, journeyId)).toBeNull();

    await deleteRows(t, Journeys, { id: journeyId });
    expect(await countRows(t, AssistantThreads, { id: threadId })).toBe(0);
    expect(await countRows(t, AssistantMessages, { id: messageId })).toBe(0);
    expect(await countRows(t, AssistantToolCalls, { id: 'j1' })).toBe(0);
  });
});

describe('home threads', () => {
  it('ASTREPO-007: a home thread is found, listed and deleted only by its owner at home, never on a trip or a journey', async () => {
    const { userId, tripId } = await ownerWithTrip();
    const journey = await makeJourney(t, userId);
    const { user: other } = await makeUser(t);
    const older = await threads.createHomeThread(userId, 'Next trip', AT);
    const newer = await threads.createHomeThread(userId, 'Atlas', AT);
    const onTrip = await threads.createThread(userId, tripId, 'Kyoto', AT);
    const onJourney = await threads.createJourneyThread(userId, journey.id, 'Book', AT);
    await threads.createHomeThread(other.id, 'Theirs', AT);
    await threads.touch(older, LATER);

    expect((await threads.listRecentAtHome(userId, 20)).map((row) => row.id)).toEqual([older, newer]);
    expect(await threads.listRecentAtHome(userId, 1)).toHaveLength(1);
    expect((await threads.listRecent(userId, tripId, 20)).map((row) => row.id)).toEqual([onTrip]);
    expect(await threads.findOwnedAtHome(older, userId)).toMatchObject({
      title: 'Next trip',
      trip_id: null,
      journey_id: null,
      last_message_at: LATER,
    });
    expect(await threads.findOwnedAtHome(older, other.id)).toBeNull();
    expect(await threads.findOwnedAtHome(onTrip, userId)).toBeNull();
    expect(await threads.findOwnedAtHome(onJourney, userId)).toBeNull();
    expect(await threads.findOwned(older, userId, tripId)).toBeNull();
    expect(await threads.findOwnedOnJourney(older, userId, journey.id)).toBeNull();

    expect(await threads.deleteOwnedAtHome(older, other.id)).toBe(false);
    expect(await threads.deleteOwnedAtHome(onTrip, userId)).toBe(false);
    expect(await threads.deleteOwned(older, userId, tripId)).toBe(false);
    expect(await threads.deleteOwnedAtHome(older, userId)).toBe(true);
    expect(await threads.findOwnedAtHome(older, userId)).toBeNull();
  });

  it('ASTREPO-008: retention keeps a home thread while it is in use and its user stays', async () => {
    const { user } = await makeUser(t);
    const kept = await threads.createHomeThread(user.id, 'Kept', AT);
    const idle = await threads.createHomeThread(user.id, 'Idle', '2026-01-01 00:00:00');

    expect(await threads.deleteWithoutAccess()).toBe(0);
    expect(await threads.deleteIdleBefore('2026-06-01 00:00:00')).toBe(1);
    expect(await threads.findOwnedAtHome(kept, user.id)).not.toBeNull();
    expect(await threads.findOwnedAtHome(idle, user.id)).toBeNull();

    await deleteRows(t, Users, { id: user.id });
    expect(await countRows(t, AssistantThreads, { id: kept })).toBe(0);
  });

  it('ASTREPO-009: a change of a home thread is found only through its own user, never on a trip or a journey', async () => {
    const { userId, tripId } = await ownerWithTrip();
    const { user: other } = await makeUser(t);
    const threadId = await threads.createHomeThread(userId, 'Atlas', AT);
    const messageId = await messages.append({
      threadId,
      role: 'assistant',
      parts: '[]',
      providerState: null,
      status: 'awaiting_approval',
      model: 'claude',
      createdAt: AT,
    });
    await calls.insertProposals([proposal('h1', threadId, messageId)]);
    expect(await calls.findOwnedAtHome('h1', userId)).toMatchObject({ id: 'h1', thread_id: threadId });
    expect(await calls.findOwnedAtHome('h1', other.id)).toBeNull();
    expect(await calls.findOwned('h1', userId, tripId)).toBeNull();

    const { threadId: tripThread, messageId: tripMessage, userId: tripUser } = await threadWithMessage();
    await calls.insertProposals([proposal('t1', tripThread, tripMessage)]);
    expect(await calls.findOwnedAtHome('t1', tripUser)).toBeNull();
  });
});

describe('messages', () => {
  it('ASTREPO-010: the latest messages come oldest first, and a message changes its parts and status', async () => {
    const { threadId, messageId } = await threadWithMessage();
    const second = await messages.append({
      threadId,
      role: 'user',
      parts: '[{"type":"text","text":"ok"}]',
      providerState: null,
      status: 'complete',
      model: null,
      createdAt: LATER,
    });
    expect((await messages.listLatest(threadId, 50)).map((row) => row.id)).toEqual([messageId, second]);
    expect((await messages.listLatest(threadId, 1)).map((row) => row.id)).toEqual([second]);

    await messages.update(messageId, {
      status: 'complete',
      providerState: '{"adapter":"openai-responses","items":[]}',
    });
    await messages.update(messageId, {});
    expect(await messages.findInThread(messageId, threadId)).toMatchObject({
      status: 'complete',
      parts: '[]',
      provider_state: '{"adapter":"openai-responses","items":[]}',
    });
    expect(await messages.findInThread(messageId, threadId + 1)).toBeNull();
  });
});

describe('proposed changes', () => {
  it('ASTREPO-020: a decision is taken once, only while waiting and in its own thread', async () => {
    const { threadId, messageId } = await threadWithMessage();
    await calls.insertProposals([proposal('c1', threadId, messageId), proposal('c2', threadId, messageId)]);
    await calls.insertProposals([]);
    expect((await calls.listOpen(threadId, AT)).map((row) => row.id)).toEqual(['c1', 'c2']);
    // Proposed before `notBefore`, a change waits no more, though no sweep has marked it expired yet.
    expect(await calls.listOpen(threadId, LATER)).toEqual([]);

    expect(await calls.claimDecision('c1', threadId + 1, true, AT, LATER)).toBe(false);
    expect(await calls.claimDecision('c1', threadId, true, '2026-10-21 00:00:00', LATER)).toBe(false);
    expect(await calls.claimDecision('c1', threadId, true, AT, LATER)).toBe(true);
    expect(await calls.claimDecision('c1', threadId, false, AT, LATER)).toBe(false);
    expect(await calls.claimDecision('c2', threadId, false, AT, LATER)).toBe(true);
    expect((await calls.listByMessage(messageId)).map((row) => [row.id, row.state])).toEqual([
      ['c1', 'approved'],
      ['c2', 'rejected'],
    ]);
  });

  it('ASTREPO-021: the provider call id is unique per thread, not across threads', async () => {
    const a = await threadWithMessage();
    const b = await threadWithMessage();
    await calls.insertProposals([proposal('x1', a.threadId, a.messageId, 'toolu_1')]);
    await calls.insertProposals([proposal('x2', b.threadId, b.messageId, 'toolu_1')]);
    await expect(calls.insertProposals([proposal('x3', a.threadId, a.messageId, 'toolu_1')])).rejects.toThrow(/UNIQUE/);
  });

  it('ASTREPO-022: an executed change is undone once, by its owner, within its window', async () => {
    const { userId, threadId, messageId } = await threadWithMessage();
    const { user: other } = await makeUser(t);
    await calls.insertProposals([proposal('u1', threadId, messageId)]);
    await calls.claimDecision('u1', threadId, true, AT, AT);
    await calls.recordOutcome('u1', 'executed', '{"place":{"id":5}}', '2026-10-20 10:15:00');
    expect(await calls.findInThread('u1', threadId)).toMatchObject({ state: 'executed', result: '{"place":{"id":5}}' });

    expect(await calls.claimUndo('u1', other.id, '2026-10-20 10:05:00')).toBe(false);
    expect(await calls.claimUndo('u1', userId, '2026-10-20 10:20:00')).toBe(false);
    expect(await calls.claimUndo('u1', userId, '2026-10-20 10:05:00')).toBe(true);
    expect(await calls.claimUndo('u1', userId, '2026-10-20 10:05:00')).toBe(false);
  });

  it('ASTREPO-024: a call is found only through its own user and trip', async () => {
    const { userId, tripId, threadId, messageId } = await threadWithMessage();
    const { user: other } = await makeUser(t);
    await calls.insertProposals([proposal('o1', threadId, messageId)]);
    expect(await calls.findOwned('o1', userId, tripId)).toMatchObject({
      id: 'o1',
      thread_id: threadId,
      state: 'approval_requested',
    });
    expect(await calls.findOwned('o1', other.id, tripId)).toBeNull();
    expect(await calls.findOwned('o1', userId, tripId + 1)).toBeNull();
    expect(await calls.findOwned('missing', userId, tripId)).toBeNull();
  });

  it('ASTREPO-023: proposals left waiting expire, and the answer names their messages', async () => {
    const { threadId, messageId } = await threadWithMessage();
    await calls.insertProposals([proposal('e1', threadId, messageId)]);
    expect(await calls.expireBefore('2026-10-20 09:00:00')).toEqual([]);
    expect(await calls.expireBefore('2026-10-21 10:00:00')).toEqual([{ id: 'e1', message_id: messageId }]);
    expect((await calls.findInThread('e1', threadId))?.state).toBe('expired');
  });
});

describe('usage', () => {
  it('ASTREPO-030: turns and tokens add up per user, day and payer; old days are dropped', async () => {
    const { user } = await makeUser(t);
    await usage.add(user.id, '2026-10-20', 'instance', { turns: 1, inputTokens: 100, outputTokens: 10 });
    await usage.add(user.id, '2026-10-20', 'instance', { turns: 1, inputTokens: 50, outputTokens: 5 });
    await usage.add(user.id, '2026-10-20', 'user', { turns: 1, inputTokens: 0, outputTokens: 0 });
    await usage.add(user.id, '2025-01-01', 'instance', { turns: 3, inputTokens: 0, outputTokens: 0 });
    expect(await usage.turnsOn(user.id, '2026-10-20', 'instance')).toBe(2);
    expect(await usage.turnsOn(user.id, '2026-10-21', 'instance')).toBe(0);
    expect(await usage.deleteBefore('2026-01-01')).toBe(1);
    expect(await countRows(t, AssistantUsage)).toBe(2);
  });
});

describe('cascades', () => {
  it('ASTREPO-040: a trip deleted takes its threads, messages and proposals; a user deleted takes their usage', async () => {
    const { userId, tripId, threadId, messageId } = await threadWithMessage();
    await calls.insertProposals([proposal('g1', threadId, messageId)]);
    await usage.add(userId, '2026-10-20', 'user', { turns: 1, inputTokens: 0, outputTokens: 0 });

    await deleteRows(t, Trips, { id: tripId });
    expect(await countRows(t, AssistantThreads)).toBe(0);
    expect(await countRows(t, AssistantMessages)).toBe(0);
    expect(await countRows(t, AssistantToolCalls)).toBe(0);

    await deleteRows(t, Users, { id: userId });
    expect(await countRows(t, AssistantUsage)).toBe(0);
  });
});
