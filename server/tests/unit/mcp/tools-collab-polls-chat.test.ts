/**
 * Unit tests for MCP collab polls, chat and link tools (collab addon-gated):
 * list_collab_polls, create_collab_poll, vote_collab_poll, close_collab_poll,
 * delete_collab_poll, list_collab_messages, send_collab_message,
 * delete_collab_message, react_collab_message (CollabMcp, DI-discovered —
 * attached via the nest-mcp registry inside registerTools).
 * Resources: trek://trips/{tripId}/collab/polls, trek://trips/{tripId}/collab/messages.
 */
import { ADDON_IDS } from '../../../src/addons';
import { db as testDb } from '../../../src/db/database';
import { CollabLinks } from '../../../src/db/entities/CollabLinks.entity';
import { CollabPollVotes } from '../../../src/db/entities/CollabPollVotes.entity';
import { CollabPolls } from '../../../src/db/entities/CollabPolls.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';
import { addTripMember, createUser, createTrip } from '../../helpers/factories';
import { makeCollabMessage } from '../../helpers/factories/collab';
import { countRows, findRow, insertRow } from '../../helpers/factories/rows';
import { setAppSetting } from '../../helpers/factories/settings';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { resetTestDb } from '../../helpers/test-db';
import { setAddonEnabled, setCollabFeature } from '../../helpers/test-db';
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
      // Named like REST names it: the author, who is the only one allowed to delete.
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'collab:message:deleted',
        expect.objectContaining({ messageId: Number(msgId), username: user.username }),
      );
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

describe('send_collab_message, as the chat posts it', () => {
  it('MCP-COLLAB-001: notifies the fellow travellers with the preview a typed message gets, after the room heard it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const send = vi
      .spyOn((await bootTestApp(realtime)).get(NotificationsService), 'send')
      .mockResolvedValue({ attempted: 0, delivered: 0 });
    try {
      await withHarness(user.id, async (h) => {
        await h.client.callTool({ name: 'send_collab_message', arguments: { tripId: trip.id, text: 'Dinner at 8?' } });
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:message:created', expect.any(Object));
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'collab_message',
          actorId: user.id,
          targetId: trip.id,
          params: expect.objectContaining({ actor: user.username, preview: 'Dinner at 8?' }),
        }),
      );
    } finally {
      send.mockRestore();
    }
  });
});

/**
 * The collab link tools (#3076): list_collab_links, create_collab_link,
 * update_collab_link and delete_collab_link. They are the Links panel's REST
 * routes as tools, so these cases pin the same rules: trip access for every
 * call, collab_edit for the writes, the http(s) contract of the shared body
 * schemas, the collab:link:* broadcasts, and the links flag hiding all four.
 */
describe('Collab link tools (#3076)', () => {
  beforeEach(async () => {
    setAddonEnabled(testDb, ADDON_IDS.COLLAB, true);
    // resetTestDb truncates app_settings, but the permission cache is module-scoped
    // and would keep serving whatever the previous case configured.
    await invalidatePermissionsCache();
  });

  type ToolResult = Awaited<ReturnType<McpHarness['client']['callTool']>>;

  async function call(userId: number, name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const h = await createMcpHarness({ realtime, userId, withResources: false });
    try {
      return await h.client.callTool({ name, arguments: args });
    } finally {
      await h.cleanup();
    }
  }

  async function toolNames(userId: number): Promise<string[]> {
    const h = await createMcpHarness({ realtime, userId, withResources: false });
    try {
      return (await h.client.listTools()).tools.map((tool) => tool.name);
    } finally {
      await h.cleanup();
    }
  }

  function insertLink(tripId: number, userId: number, title = 'Ferry', pinned = 0): Promise<number> {
    return insertRow(orm, CollabLinks, { trip: tripId, user: userId, title, url: 'https://example.com/ferry', pinned });
  }

  function linkRow(id: number) {
    return findRow(orm, CollabLinks, { id });
  }

  /** A member of the owner's trip, once collab_edit is lowered to the owner alone. */
  async function memberWithoutEdit() {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    await setAppSetting(orm, 'perm_collab_edit', 'trip_owner');
    await invalidatePermissionsCache();
    return { owner, member, trip };
  }

  const LINK_TOOLS = ['list_collab_links', 'create_collab_link', 'update_collab_link', 'delete_collab_link'];

  describe('Tool: list_collab_links', () => {
    it('MCP-COLLAB-LINK-001: lists the links pinned first, then newest first, with their author', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      await insertLink(trip.id, user.id, 'Timetable');
      const pinned = await insertLink(trip.id, user.id, 'Hotel', 1);
      const data = parseToolResult(await call(user.id, 'list_collab_links', { tripId: trip.id })) as {
        links: Array<Record<string, unknown>>;
      };
      expect(data.links.map((link) => link.title)).toEqual(['Hotel', 'Timetable']);
      expect(data.links[0]).toMatchObject({ id: pinned, pinned: 1, username: user.username });
    });

    it('MCP-COLLAB-LINK-002: refuses a trip the user is not part of', async () => {
      const { user } = createUser(testDb);
      const { user: owner } = createUser(testDb);
      const trip = createTrip(testDb, owner.id);
      await insertLink(trip.id, owner.id);
      expect((await call(user.id, 'list_collab_links', { tripId: trip.id })).isError).toBe(true);
    });

    it('MCP-COLLAB-LINK-003: is a read a member may make without collab_edit', async () => {
      const { owner, member, trip } = await memberWithoutEdit();
      await insertLink(trip.id, owner.id);
      const result = await call(member.id, 'list_collab_links', { tripId: trip.id });
      expect(result.isError).toBeFalsy();
      expect((parseToolResult(result) as { links: unknown[] }).links).toHaveLength(1);
    });
  });

  describe('Tool: create_collab_link', () => {
    it('MCP-COLLAB-LINK-004: saves the link with the caller as author and broadcasts it', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const result = await call(user.id, 'create_collab_link', {
        tripId: trip.id,
        title: '  Ferry tickets ',
        url: 'https://example.com/ferry',
        pinned: true,
      });
      const { link } = parseToolResult(result) as { link: Record<string, unknown> };
      expect(link).toMatchObject({
        trip_id: trip.id,
        user_id: user.id,
        title: 'Ferry tickets',
        url: 'https://example.com/ferry',
        pinned: 1,
        username: user.username,
      });
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'collab:link:created',
        expect.objectContaining({ link: expect.objectContaining({ id: link.id }) }),
      );
    });

    it('MCP-COLLAB-LINK-005: leaves a link unpinned unless asked', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const result = await call(user.id, 'create_collab_link', {
        tripId: trip.id,
        title: 'Map',
        url: 'https://example.com/map',
      });
      expect((parseToolResult(result) as { link: { pinned: number } }).link.pinned).toBe(0);
    });

    it('MCP-COLLAB-LINK-006: refuses a URL that is not http(s), or an empty title, like the REST route', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const refused = await Promise.all(
        [
          { title: 'Script', url: 'javascript:alert(1)' },
          { title: 'Mail', url: 'mailto:someone@example.com' },
          { title: '   ', url: 'https://example.com' },
        ].map((args) => call(user.id, 'create_collab_link', { tripId: trip.id, ...args })),
      );
      expect(refused.every((r) => r.isError)).toBe(true);
      expect(await countRows(orm, CollabLinks, { trip: trip.id })).toBe(0);
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    it('MCP-COLLAB-LINK-007: refuses a member without collab_edit and saves nothing', async () => {
      const { member, trip } = await memberWithoutEdit();
      const result = await call(member.id, 'create_collab_link', {
        tripId: trip.id,
        title: 'Ferry',
        url: 'https://example.com/ferry',
      });
      expect(result.isError).toBe(true);
      expect(await countRows(orm, CollabLinks, { trip: trip.id })).toBe(0);
    });

    it('MCP-COLLAB-LINK-008: refuses a trip the user is not part of', async () => {
      const { user } = createUser(testDb);
      const { user: owner } = createUser(testDb);
      const trip = createTrip(testDb, owner.id);
      const result = await call(user.id, 'create_collab_link', {
        tripId: trip.id,
        title: 'Ferry',
        url: 'https://example.com/ferry',
      });
      expect(result.isError).toBe(true);
      expect(await countRows(orm, CollabLinks, { trip: trip.id })).toBe(0);
    });

    it('MCP-COLLAB-LINK-009: blocks the demo user', async () => {
      process.env.DEMO_MODE = 'true';
      const { user } = createUser(testDb, { email: 'demo@nomad.app' });
      const trip = createTrip(testDb, user.id);
      const result = await call(user.id, 'create_collab_link', {
        tripId: trip.id,
        title: 'Ferry',
        url: 'https://example.com/ferry',
      });
      expect(result.isError).toBe(true);
    });
  });

  describe('Tool: update_collab_link', () => {
    it('MCP-COLLAB-LINK-010: changes only the fields given and broadcasts the link', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = await insertLink(trip.id, user.id, 'Ferry');
      const result = await call(user.id, 'update_collab_link', { tripId: trip.id, linkId: id, pinned: true });
      expect((parseToolResult(result) as { link: Record<string, unknown> }).link).toMatchObject({
        id,
        title: 'Ferry',
        url: 'https://example.com/ferry',
        pinned: 1,
      });
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'collab:link:updated',
        expect.objectContaining({ link: expect.objectContaining({ id }) }),
      );
    });

    it('MCP-COLLAB-LINK-011: renames, moves and unpins a link', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = await insertLink(trip.id, user.id, 'Ferry', 1);
      await call(user.id, 'update_collab_link', {
        tripId: trip.id,
        linkId: id,
        title: 'Night ferry',
        url: 'https://example.com/night-ferry',
        pinned: false,
      });
      expect(await linkRow(id)).toMatchObject({
        title: 'Night ferry',
        url: 'https://example.com/night-ferry',
        pinned: 0,
      });
    });

    it('MCP-COLLAB-LINK-012: says the link is not found when it belongs to another trip, and leaves it alone', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const other = createTrip(testDb, user.id);
      const id = await insertLink(other.id, user.id, 'Ferry');
      const result = await call(user.id, 'update_collab_link', { tripId: trip.id, linkId: id, title: 'Moved' });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Link not found.');
      expect((await linkRow(id))?.title).toBe('Ferry');
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    it('MCP-COLLAB-LINK-013: refuses a URL that is not http(s)', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = await insertLink(trip.id, user.id);
      const result = await call(user.id, 'update_collab_link', {
        tripId: trip.id,
        linkId: id,
        url: 'ftp://example.com',
      });
      expect(result.isError).toBe(true);
      expect((await linkRow(id))?.url).toBe('https://example.com/ferry');
    });

    it('MCP-COLLAB-LINK-014: refuses a member without collab_edit', async () => {
      const { owner, member, trip } = await memberWithoutEdit();
      const id = await insertLink(trip.id, owner.id);
      const result = await call(member.id, 'update_collab_link', { tripId: trip.id, linkId: id, title: 'Mine' });
      expect(result.isError).toBe(true);
      expect((await linkRow(id))?.title).toBe('Ferry');
    });
  });

  describe('Tool: delete_collab_link', () => {
    it('MCP-COLLAB-LINK-015: removes the link and broadcasts its id', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = await insertLink(trip.id, user.id);
      const result = await call(user.id, 'delete_collab_link', { tripId: trip.id, linkId: id });
      expect(parseToolResult(result)).toEqual({ success: true });
      expect(await linkRow(id)).toBeNull();
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'collab:link:deleted',
        expect.objectContaining({ linkId: id }),
      );
    });

    it('MCP-COLLAB-LINK-016: says the link is not found for a link of another trip', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const other = createTrip(testDb, user.id);
      const id = await insertLink(other.id, user.id);
      const result = await call(user.id, 'delete_collab_link', { tripId: trip.id, linkId: id });
      expect(result.isError).toBe(true);
      expect(await linkRow(id)).not.toBeNull();
    });

    it('MCP-COLLAB-LINK-017: refuses a member without collab_edit', async () => {
      const { owner, member, trip } = await memberWithoutEdit();
      const id = await insertLink(trip.id, owner.id);
      expect((await call(member.id, 'delete_collab_link', { tripId: trip.id, linkId: id })).isError).toBe(true);
      expect(await linkRow(id)).not.toBeNull();
    });
  });

  describe('Collab link tools, gating', () => {
    it('MCP-COLLAB-LINK-018: are offered only while the links are switched on', async () => {
      const { user } = createUser(testDb);
      expect(await toolNames(user.id)).toEqual(expect.arrayContaining(LINK_TOOLS));
      setCollabFeature(testDb, 'links', false);
      try {
        const names = await toolNames(user.id);
        expect(names.filter((name) => LINK_TOOLS.includes(name))).toEqual([]);
        expect(names).toContain('list_collab_notes');
      } finally {
        setCollabFeature(testDb, 'links', true);
      }
    });

    it('MCP-COLLAB-LINK-019: are gone with the collab addon', async () => {
      const { user } = createUser(testDb);
      setAddonEnabled(testDb, ADDON_IDS.COLLAB, false);
      const names = await toolNames(user.id);
      expect(names.filter((name) => LINK_TOOLS.includes(name))).toEqual([]);
    });
  });
});
