/**
 * Unit tests for MCP collab polls and chat tools (collab addon-gated):
 * list_collab_polls, create_collab_poll, vote_collab_poll, close_collab_poll,
 * delete_collab_poll, list_collab_messages, send_collab_message,
 * delete_collab_message, react_collab_message (CollabMcp, DI-discovered —
 * attached via the nest-mcp registry inside registerTools).
 * Resources: trek://trips/{tripId}/collab/polls, trek://trips/{tripId}/collab/messages.
 */
import { ADDON_IDS } from '../../../src/addons';
import { db as testDb } from '../../../src/db/database';
import { CollabPollVotes } from '../../../src/db/entities/CollabPollVotes.entity';
import { CollabPolls } from '../../../src/db/entities/CollabPolls.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { createUser, createTrip } from '../../helpers/factories';
import { makeCollabMessage } from '../../helpers/factories/collab';
import { countRows, findRow, insertRow } from '../../helpers/factories/rows';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { setAddonEnabled } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;

beforeEach(() => {
  setAddonEnabled(testDb, ADDON_IDS.COLLAB, true);
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
});

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

afterAll(async () => {
  await orm.close();
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

async function withResourceHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: true });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

// ---------------------------------------------------------------------------
// list_collab_polls
// ---------------------------------------------------------------------------

describe('Tool: list_collab_polls', () => {
  it('returns empty array initially', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_collab_polls',
        arguments: { tripId: trip.id },
      });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.polls)).toBe(true);
      expect(data.polls).toHaveLength(0);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_collab_polls', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// create_collab_poll
// ---------------------------------------------------------------------------

describe('Tool: create_collab_poll', () => {
  it('inserts poll with votes structure and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_collab_poll',
        arguments: {
          tripId: trip.id,
          question: 'Where should we eat?',
          options: ['Pizza', 'Sushi', 'Tacos'],
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.poll).toBeDefined();
      expect(data.poll.question).toBe('Where should we eat?');
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:poll:created', expect.any(Object));
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_collab_poll',
        arguments: { tripId: trip.id, question: 'Q?', options: ['A', 'B'] },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_collab_poll',
        arguments: { tripId: trip.id, question: 'Q?', options: ['A', 'B'] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// vote_collab_poll
// ---------------------------------------------------------------------------

describe('Tool: vote_collab_poll', () => {
  it('records vote and broadcasts collab:poll:voted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Create a poll directly in the DB
    const pollId = await insertRow(orm, CollabPolls, {
      trip: trip.id,
      user: user.id,
      question: 'Best city?',
      options: JSON.stringify(['Paris', 'Rome']),
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'vote_collab_poll',
        arguments: { tripId: trip.id, pollId: Number(pollId), optionIndex: 0 },
      });
      const data = parseToolResult(result) as any;
      expect(data.poll).toBeDefined();
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:poll:voted', expect.any(Object));
    });
  });

  it('blocks demo user (gate added with the DI migration — the legacy registrar missed it)', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const pollId = await insertRow(orm, CollabPolls, {
      trip: trip.id,
      user: user.id,
      question: 'Best city?',
      options: JSON.stringify(['Paris', 'Rome']),
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'vote_collab_poll',
        arguments: { tripId: trip.id, pollId: Number(pollId), optionIndex: 0 },
      });
      expect(result.isError).toBe(true);
      expect(await countRows(orm, CollabPollVotes, { poll: pollId })).toBe(0);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'vote_collab_poll',
        arguments: { tripId: trip.id, pollId: 1, optionIndex: 0 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// close_collab_poll
// ---------------------------------------------------------------------------

describe('Tool: close_collab_poll', () => {
  it('sets closed flag and broadcasts collab:poll:closed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const pollId = await insertRow(orm, CollabPolls, {
      trip: trip.id,
      user: user.id,
      question: 'Vote now?',
      options: JSON.stringify(['Yes', 'No']),
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'close_collab_poll',
        arguments: { tripId: trip.id, pollId: Number(pollId) },
      });
      const data = parseToolResult(result) as any;
      expect(data.poll).toBeDefined();
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:poll:closed', expect.any(Object));
    });
  });

  it('returns error for non-existent poll', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'close_collab_poll',
        arguments: { tripId: trip.id, pollId: 99999 },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'close_collab_poll', arguments: { tripId: trip.id, pollId: 1 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_collab_poll
// ---------------------------------------------------------------------------

describe('Tool: delete_collab_poll', () => {
  it('removes poll and broadcasts collab:poll:deleted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const pollId = await insertRow(orm, CollabPolls, {
      trip: trip.id,
      user: user.id,
      question: 'Delete me?',
      options: JSON.stringify(['Yes', 'No']),
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_collab_poll',
        arguments: { tripId: trip.id, pollId: Number(pollId) },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'collab:poll:deleted',
        expect.objectContaining({ pollId: Number(pollId) }),
      );
      expect(await findRow(orm, CollabPolls, { id: Number(pollId) })).toBeNull();
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_collab_poll', arguments: { tripId: trip.id, pollId: 1 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_collab_messages
// ---------------------------------------------------------------------------

describe('Tool: list_collab_messages', () => {
  it('returns empty array initially', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_collab_messages',
        arguments: { tripId: trip.id },
      });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages).toHaveLength(0);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_collab_messages', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// send_collab_message
// ---------------------------------------------------------------------------

describe('Tool: send_collab_message', () => {
  it('inserts message and broadcasts collab:message:created', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'send_collab_message',
        arguments: { tripId: trip.id, text: 'Hello team!' },
      });
      const data = parseToolResult(result) as any;
      expect(data.message).toBeDefined();
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:message:created', expect.any(Object));
    });
  });

  it('sends message with replyTo when parent exists', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const msgId = (await makeCollabMessage(orm, trip.id, user.id, { text: 'Original message' })).id;

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'send_collab_message',
        arguments: { tripId: trip.id, text: 'Reply here', replyTo: Number(msgId) },
      });
      const data = parseToolResult(result) as any;
      expect(data.message).toBeDefined();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'send_collab_message',
        arguments: { tripId: trip.id, text: 'Hello!' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'send_collab_message',
        arguments: { tripId: trip.id, text: 'Hi' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_collab_message
// ---------------------------------------------------------------------------

describe('Tool: delete_collab_message', () => {
  it('soft-deletes message and broadcasts collab:message:deleted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const msgId = (await makeCollabMessage(orm, trip.id, user.id, { text: 'To be deleted' })).id;

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_collab_message',
        arguments: { tripId: trip.id, messageId: Number(msgId) },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:message:deleted', expect.any(Object));
    });
  });

  it('returns error when message belongs to different user', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Add other as trip member
    await insertRow(orm, TripMembers, { trip: trip.id, user: other.id });
    const msgId = (await makeCollabMessage(orm, trip.id, user.id, { text: 'Owner message' })).id;

    await withHarness(other.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_collab_message',
        arguments: { tripId: trip.id, messageId: Number(msgId) },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_collab_message',
        arguments: { tripId: trip.id, messageId: 1 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// react_collab_message
// ---------------------------------------------------------------------------

describe('Tool: react_collab_message', () => {
  it('toggles reaction and broadcasts collab:message:reacted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const msgId = (await makeCollabMessage(orm, trip.id, user.id, { text: 'React to me' })).id;

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'react_collab_message',
        arguments: { tripId: trip.id, messageId: Number(msgId), emoji: '👍' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reactions).toBeDefined();
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:message:reacted', expect.any(Object));
    });
  });

  it('returns error for non-existent message', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'react_collab_message',
        arguments: { tripId: trip.id, messageId: 99999, emoji: '👍' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'react_collab_message',
        arguments: { tripId: trip.id, messageId: 1, emoji: '👍' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/collab/polls', () => {
  it('returns polls list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/collab/polls` });
      const data = parseResourceResult(result) as any;
      expect(Array.isArray(data)).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/collab/polls` });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeDefined();
    });
  });
});

describe('Resource: trek://trips/{tripId}/collab/messages', () => {
  it('returns messages list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/collab/messages` });
      const data = parseResourceResult(result) as any;
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
