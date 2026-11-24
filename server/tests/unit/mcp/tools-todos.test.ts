/**
 * Unit tests for the todo MCP surface (TodoMcp, DI-discovered):
 * create_todo, update_todo, toggle_todo, delete_todo, reorder_todos,
 * list_todos, get_todo_category_assignees, set_todo_category_assignees,
 * plus the trek://trips/{tripId}/todos resource.
 *
 * All of it attaches via the nest-mcp registry inside registerTools, so every
 * harness here keeps withTools on (the resource is NOT registered by the
 * legacy registerResources fan-out anymore).
 */
import { ADDON_IDS } from '../../../src/addons';
import { TodoCategoryAssignees } from '../../../src/db/entities/TodoCategoryAssignees.entity';
import { TodoItems } from '../../../src/db/entities/TodoItems.entity';
import type { FactoryOrm } from '../../helpers/factories/context';
import { findRow, insertRow } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTodoItem } from '../../helpers/factories/todos';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetDatabase } from '../../helpers/reset-database';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;

beforeEach(async () => {
  await resetDatabase(orm);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
});

// The booted container's own ORM, the one the tools write through.
let orm: FactoryOrm;

beforeAll(async () => {
  orm = (await bootTestApp(realtime)).get(MikroORM);
});

afterAll(async () => {
  await (await bootTestApp(realtime)).close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

// ---------------------------------------------------------------------------
// list_todos
// ---------------------------------------------------------------------------

describe('Tool: list_todos', () => {
  it('returns empty list for a new trip', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_todos', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.items).toEqual([]);
    });
  });

  it('returns todos ordered by sort_order', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makeTodoItem(orm, trip.id, { name: 'First' });
    await makeTodoItem(orm, trip.id, { name: 'Second' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_todos', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.items).toHaveLength(2);
      expect(data.items[0].name).toBe('First');
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_todos', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// create_todo
// ---------------------------------------------------------------------------

describe('Tool: create_todo', () => {
  it('creates a todo item with all fields', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_todo',
        arguments: {
          tripId: trip.id,
          name: 'Book hotel',
          category: 'Booking',
          due_date: '2025-06-01',
          description: 'Find a good deal',
          priority: 2,
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Book hotel');
      expect(data.item.category).toBe('Booking');
      expect(data.item.due_date).toBe('2025-06-01');
      expect(data.item.priority).toBe(2);
      expect(data.item.checked).toBe(0);
    });
  });

  it('creates a minimal todo item', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_todo',
        arguments: { tripId: trip.id, name: 'Pack bags' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Pack bags');
      expect(data.item.checked).toBe(0);
    });
  });

  it('broadcasts todo:created event', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_todo', arguments: { tripId: trip.id, name: 'Test' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'todo:created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_todo', arguments: { tripId: trip.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = await makeUser(orm, { email: 'demo@nomad.app' });
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_todo', arguments: { tripId: trip.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_todo
// ---------------------------------------------------------------------------

describe('Tool: update_todo', () => {
  it('updates todo name and category', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id, { name: 'Old name', category: 'General' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_todo',
        arguments: { tripId: trip.id, itemId: item.id, name: 'New name', category: 'Booking' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('New name');
      expect(data.item.category).toBe('Booking');
    });
  });

  it('clears due_date when passed null', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id, { name: 'Task', checked: 0, sort_order: 0, due_date: '2025-01-01' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_todo',
        arguments: { tripId: trip.id, itemId: item.id, due_date: null },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.due_date).toBeNull();
    });
  });

  it('broadcasts todo:updated event', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_todo',
        arguments: { tripId: trip.id, itemId: item.id, name: 'Updated' },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'todo:updated', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_todo',
        arguments: { tripId: trip.id, itemId: 99999, name: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const item = await makeTodoItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_todo',
        arguments: { tripId: trip.id, itemId: item.id, name: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// toggle_todo
// ---------------------------------------------------------------------------

describe('Tool: toggle_todo', () => {
  it('marks a todo as done', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_todo',
        arguments: { tripId: trip.id, itemId: item.id, checked: true },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.checked).toBe(1);
    });
  });

  it('unchecks a done todo', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id, { checked: 1 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_todo',
        arguments: { tripId: trip.id, itemId: item.id, checked: false },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.checked).toBe(0);
    });
  });

  it('broadcasts todo:updated event', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'toggle_todo', arguments: { tripId: trip.id, itemId: item.id, checked: true } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'todo:updated', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_todo',
        arguments: { tripId: trip.id, itemId: 99999, checked: true },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_todo
// ---------------------------------------------------------------------------

describe('Tool: delete_todo', () => {
  it('deletes an existing todo item', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_todo', arguments: { tripId: trip.id, itemId: item.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(await findRow(orm, TodoItems, { id: item.id })).toBeNull();
    });
  });

  it('broadcasts todo:deleted event', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeTodoItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_todo', arguments: { tripId: trip.id, itemId: item.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'todo:deleted', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_todo', arguments: { tripId: trip.id, itemId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const item = await makeTodoItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_todo', arguments: { tripId: trip.id, itemId: item.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// reorder_todos
// ---------------------------------------------------------------------------

describe('Tool: reorder_todos', () => {
  it('reorders todo items', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item1 = await makeTodoItem(orm, trip.id, { name: 'First' });
    const item2 = await makeTodoItem(orm, trip.id, { name: 'Second' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_todos',
        arguments: { tripId: trip.id, orderedIds: [item2.id, item1.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      // item2 should now have sort_order 0
      const updated = await findRow(orm, TodoItems, { id: item2.id });
      expect(updated?.sort_order).toBe(0);
      // Every open list, the asking tab's too, takes the new order live.
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'todo:reordered', {
        orderedIds: [item2.id, item1.id],
        _source: 'mcp',
      });
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_todos',
        arguments: { tripId: trip.id, orderedIds: [1] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// get_todo_category_assignees
// ---------------------------------------------------------------------------

describe('Tool: get_todo_category_assignees', () => {
  it('returns empty object for a new trip', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_todo_category_assignees', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.assignees).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// set_todo_category_assignees
// ---------------------------------------------------------------------------

describe('Tool: set_todo_category_assignees', () => {
  it('sets category assignees and broadcasts', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_todo_category_assignees',
        arguments: { tripId: trip.id, categoryName: 'Booking', userIds: [user.id] },
      });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.assignees)).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'todo:assignees', expect.any(Object));
    });
  });

  it('clears assignees when passed empty array', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    // Set then clear
    await insertRow(orm, TodoCategoryAssignees, { trip: trip.id, category_name: 'Booking', user: user.id });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_todo_category_assignees',
        arguments: { tripId: trip.id, categoryName: 'Booking', userIds: [] },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignees).toEqual([]);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = await makeUser(orm, { email: 'demo@nomad.app' });
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_todo_category_assignees',
        arguments: { tripId: trip.id, categoryName: 'Test', userIds: [] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Scope gating (todos read/write, registration-time)
// ---------------------------------------------------------------------------

describe('Todo tools — scope gating', () => {
  const READ_TOOLS = ['list_todos', 'get_todo_category_assignees'];
  const WRITE_TOOLS = [
    'create_todo',
    'update_todo',
    'toggle_todo',
    'delete_todo',
    'reorder_todos',
    'set_todo_category_assignees',
  ];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ realtime, userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers all eight tools with null scopes (full access)', async () => {
    const { user } = await makeUser(orm);
    const names = await listToolNames(user.id, null);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).toContain(tool);
  });

  it('registers only the read tools with todos:read', async () => {
    const { user } = await makeUser(orm);
    const names = await listToolNames(user.id, ['todos:read']);
    for (const tool of READ_TOOLS) expect(names).toContain(tool);
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });

  it('registers no todo tools for an unrelated scope', async () => {
    const { user } = await makeUser(orm);
    const names = await listToolNames(user.id, ['budget:read']);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).not.toContain(tool);
  });
});

// ---------------------------------------------------------------------------
// Addon gating (packing addon, the legacy whole-registrar early return —
// now the `when` predicate on every TodoMcp entry)
// ---------------------------------------------------------------------------

describe('Todo tools — packing addon gating', () => {
  it('registers nothing (tools or resource) when the packing addon is disabled', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await setAddonEnabled(orm, ADDON_IDS.PACKING, false);
    try {
      await withHarness(user.id, async (h) => {
        const names = (await h.client.listTools()).tools.map((t) => t.name);
        expect(names).not.toContain('list_todos');
        expect(names).not.toContain('create_todo');
        await expect(h.client.readResource({ uri: `trek://trips/${trip.id}/todos` })).rejects.toThrow();
      });
    } finally {
      await setAddonEnabled(orm, ADDON_IDS.PACKING, true);
    }
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/todos resource (moved from the legacy registerResources)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/todos', () => {
  it('returns the trip todos ordered by position', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makeTodoItem(orm, trip.id, { name: 'First' });
    await makeTodoItem(orm, trip.id, { name: 'Second' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/todos` });
      const items = parseResourceResult(result) as any[];
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('First');
      expect(items[1].name).toBe('Second');
    });
  });

  it('returns the access-denied payload for a non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/todos` });
      expect(parseResourceResult(result)).toEqual({ error: 'Trip not found or access denied' });
    });
  });

  it('returns the access-denied payload for a malformed trip id', async () => {
    const { user } = await makeUser(orm);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://trips/not-a-number/todos' });
      expect(parseResourceResult(result)).toEqual({ error: 'Trip not found or access denied' });
    });
  });
});
