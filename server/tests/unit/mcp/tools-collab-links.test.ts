/**
 * Unit tests for the collab link tools (#3076): list_collab_links,
 * create_collab_link, update_collab_link and delete_collab_link (CollabMcp).
 *
 * They are the Links panel's REST routes as tools, so these cases pin the
 * same rules: trip access for every call, collab_edit for the writes, the
 * http(s) contract of the shared body schemas, the collab:link:* broadcasts,
 * and the links flag hiding all four.
 */
import { ADDON_IDS } from '../../../src/addons';
import { db as testDb } from '../../../src/db/database';
import { CollabLinks } from '../../../src/db/entities/CollabLinks.entity';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';
import { addTripMember, createTrip, createUser } from '../../helpers/factories';
import { countRows, findRow, insertRow } from '../../helpers/factories/rows';
import { setAppSetting } from '../../helpers/factories/settings';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb, setAddonEnabled, setCollabFeature } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;

beforeEach(async () => {
  resetTestDb(testDb);
  setAddonEnabled(testDb, ADDON_IDS.COLLAB, true);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
  // resetTestDb truncates app_settings, but the permission cache is module-scoped
  // and would keep serving whatever the previous case configured.
  await invalidatePermissionsCache();
});

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

afterAll(async () => {
  await orm.close();
  testDb.close();
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
    for (const args of [
      { title: 'Script', url: 'javascript:alert(1)' },
      { title: 'Mail', url: 'mailto:someone@example.com' },
      { title: '   ', url: 'https://example.com' },
    ]) {
      expect((await call(user.id, 'create_collab_link', { tripId: trip.id, ...args })).isError).toBe(true);
    }
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
    const result = await call(user.id, 'update_collab_link', { tripId: trip.id, linkId: id, url: 'ftp://example.com' });
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
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:link:deleted', expect.objectContaining({ linkId: id }));
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
