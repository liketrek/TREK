/**
 * Sharing an assistant answer in the trip chat, over the real thread and
 * message repositories on a migrated test db: the chat must be on, the thread
 * the user's on this trip, the message an answer in it; then it is posted as
 * the user's own message with the assistant's origin, through the chat's own
 * posting use case, which broadcasts and notifies like a typed message
 * (collab.service.test.ts holds that, the preview included).
 *
 * Replaced: the addon switches and the collab chat itself.
 */
import { AssistantMessages } from '../../../../src/db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../../../src/db/entities/AssistantThreads.entity';
import { AddonsService } from '../../../../src/nest/addons/addons.service';
import { AssistantShareService, messageRowOf } from '../../../../src/nest/assistant/assistant-share.service';
import { CollabService } from '../../../../src/nest/collab/collab.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import type { User } from '../../../../src/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createRow } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

const addons = {
  isAddonEnabled: vi.fn(async () => true),
  getCollabFeatures: vi.fn(async () => ({ chat: true, notes: true, polls: true })),
};
const collab = {
  restWriter: vi.fn((tripId: string, user: User, socketId: string | undefined) => ({
    tripId,
    userId: user.id,
    socketId,
  })),
  postMessage: vi.fn(async (_trip: number, input: { text: string; origin?: string | null }, w: { userId: number }) => ({
    message: { id: 90, user_id: w.userId, text: input.text.trim(), origin: input.origin },
  })),
};

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [MikroOrmModule.forFeature([AssistantThreads, AssistantMessages])],
    providers: [
      AssistantShareService,
      { provide: AddonsService, useValue: addons },
      { provide: CollabService, useValue: collab },
    ],
  });
});

beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
});

afterAll(async () => {
  await t.close();
  db.close();
});

/** A user with a trip and a thread on it holding a question and its answer. */
async function conversation() {
  const orm = t.get(MikroORM);
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id);
  const thread = await createRow(orm, AssistantThreads, { user: user.id, trip: trip.id, title: 'June' });
  const message = (role: string) =>
    createRow(orm, AssistantMessages, { thread: thread.id, role, parts: '[]', status: 'complete' });
  const question = await message('user');
  const answer = await message('assistant');
  return { user: user as unknown as User, tripId: trip.id, threadId: thread.id, question, answer };
}

/** Shares "Hi" from the message as the user, without a socket. */
function shareAs(user: User, tripId: number, threadId: number, messageId: string) {
  return t.get(AssistantShareService).share(user, tripId, threadId, messageId, 'Hi', undefined);
}

describe('AssistantShareService', () => {
  it('ASTSHR-001: posts the answer as the user, marked as from the assistant, through the chat posting use case', async () => {
    const c = await conversation();
    const service = t.get(AssistantShareService);
    const shared = await service.share(c.user, c.tripId, c.threadId, `msg-${c.answer.id}`, 'x'.repeat(100), undefined);
    expect(collab.postMessage).toHaveBeenCalledWith(
      c.tripId,
      { text: 'x'.repeat(100), origin: 'assistant' },
      { tripId: String(c.tripId), userId: c.user.id, socketId: undefined },
    );
    expect(shared).toEqual({ message: expect.objectContaining({ id: 90, origin: 'assistant' }) });
  });

  it('ASTSHR-002: the asking tab hears its shared message too: the socket the route names is not left out', async () => {
    const c = await conversation();
    await t.get(AssistantShareService).share(c.user, c.tripId, c.threadId, `msg-${c.answer.id}`, 'Hi', 'sock-1');
    // It never put the message into its own chat, so a writer skipping it would leave the chat without it.
    expect(collab.restWriter).toHaveBeenCalledWith(String(c.tripId), c.user, undefined);
    expect(collab.postMessage.mock.calls[0]?.[2]).toMatchObject({ socketId: undefined });
  });

  it('ASTSHR-003: refused while the collab addon or its chat is off', async () => {
    const c = await conversation();
    const share = () => shareAs(c.user, c.tripId, c.threadId, `msg-${c.answer.id}`);
    addons.isAddonEnabled.mockResolvedValueOnce(false);
    await expect(share()).rejects.toMatchObject({ status: 403, message: 'Collab chat is off' });
    addons.getCollabFeatures.mockResolvedValueOnce({ chat: false, notes: true, polls: true });
    await expect(share()).rejects.toMatchObject({ status: 403, code: 'forbidden' });
    expect(collab.postMessage).not.toHaveBeenCalled();
  });

  it('ASTSHR-004: a thread of another user or trip, a question, an answer elsewhere or no id is not found', async () => {
    const c = await conversation();
    const other = await conversation();
    const notFound = { status: 404, code: 'not_found' };
    await expect(shareAs(other.user, c.tripId, c.threadId, `msg-${c.answer.id}`)).rejects.toMatchObject(notFound);
    await expect(shareAs(c.user, other.tripId, c.threadId, `msg-${c.answer.id}`)).rejects.toMatchObject(notFound);
    await expect(shareAs(c.user, c.tripId, c.threadId, `msg-${c.question.id}`)).rejects.toMatchObject(notFound);
    await expect(shareAs(c.user, c.tripId, c.threadId, `msg-${other.answer.id}`)).rejects.toMatchObject(notFound);
    await expect(shareAs(c.user, c.tripId, c.threadId, 'msg-x')).rejects.toBeInstanceOf(DomainError);
    expect(collab.postMessage).not.toHaveBeenCalled();
  });

  it('ASTSHR-005: a message the chat could not post is a refusal, never a silent success', async () => {
    const c = await conversation();
    collab.postMessage.mockResolvedValueOnce({ message: undefined } as never);
    await expect(shareAs(c.user, c.tripId, c.threadId, `msg-${c.answer.id}`)).rejects.toMatchObject({ status: 400 });
    expect(collab.postMessage).toHaveBeenCalledTimes(1);
  });

  it('ASTSHR-006: reads a wire message id as its row', () => {
    expect(messageRowOf('msg-12')).toBe(12);
    for (const bad of ['msg-0', 'msg-', '12', 'msg-1.5', 'msg-01', 'msg-12345678901234567']) {
      expect(messageRowOf(bad), bad).toBeNull();
    }
  });
});
