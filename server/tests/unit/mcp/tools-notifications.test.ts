/**
 * Unit tests for the notifications MCP surface (NotificationsMcp,
 * DI-discovered since the notifications fold):
 * list_notifications, get_unread_notification_count, mark_notification_read,
 * mark_notification_unread, mark_all_notifications_read.
 * Also covers the resource trek://notifications/in-app.
 *
 * All of it attaches via the nest-mcp registry inside registerTools, so every
 * harness here keeps withTools on (the resource is NOT registered by the
 * legacy registerResources fan-out anymore).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { db as testDb } from '../../../src/db/database';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { countRows, findRow, updateRows } from '../../helpers/factories/rows';
import { makeNotification } from '../../helpers/factories/notifications';
import { Notifications } from '../../../src/db/entities/Notifications.entity';

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  delete process.env.DEMO_MODE;
});

afterAll(async () => {
  await orm.close();
  testDb.close();
});

// ---------------------------------------------------------------------------
// Helper: insert a notification directly into the DB
// ---------------------------------------------------------------------------

function createNotification(
  userId: number,
  overrides: { type?: string; scope?: string; target?: number; title_key?: string; text_key?: string } = {},
) {
  return makeNotification(orm, userId, {
    type: overrides.type ?? 'simple',
    scope: overrides.scope ?? 'user',
    target: overrides.target ?? 0,
    title_key: overrides.title_key ?? 'notification.test.title',
    text_key: overrides.text_key ?? 'notification.test.body',
    is_read: 0,
  });
}

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

async function withResourceHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  // The in-app resource attaches via the nest-mcp registry (withTools), not
  // the legacy registerResources fan-out.
  const h = await createMcpHarness({ userId, withTools: true, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// list_notifications
// ---------------------------------------------------------------------------

describe('Tool: list_notifications', () => {
  it('returns empty array initially', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_notifications', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.notifications).toEqual([]);
    });
  });

  it('returns notifications when they exist', async () => {
    const { user } = createUser(testDb);
    await createNotification(user.id, { title_key: 'notif.first' });
    await createNotification(user.id, { title_key: 'notif.second' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_notifications', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.notifications).toHaveLength(2);
    });
  });

  it('returns only unread notifications when unread_only is true', async () => {
    const { user } = createUser(testDb);
    await createNotification(user.id);
    const read = await createNotification(user.id);
    await updateRows(orm, Notifications, { id: read.id }, { is_read: 1 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_notifications', arguments: { unread_only: true } });
      const data = parseToolResult(result) as any;
      expect(data.notifications).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// get_unread_notification_count
// ---------------------------------------------------------------------------

describe('Tool: get_unread_notification_count', () => {
  it('returns 0 initially', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_unread_notification_count', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.count).toBe(0);
    });
  });

  it('returns 1 after inserting one unread notification', async () => {
    const { user } = createUser(testDb);
    await createNotification(user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_unread_notification_count', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.count).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// mark_notification_read
// ---------------------------------------------------------------------------

describe('Tool: mark_notification_read', () => {
  it('flips is_read to 1 and returns success', async () => {
    const { user } = createUser(testDb);
    const notif = await createNotification(user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_notification_read',
        arguments: { notificationId: notif.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const row = (await findRow(orm, Notifications, { id: notif.id }))!;
      expect(row.is_read).toBe(1);
    });
  });

  it('returns isError for non-existent notification', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_notification_read',
        arguments: { notificationId: 99999 },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const notif = await createNotification(user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_notification_read',
        arguments: { notificationId: notif.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// mark_notification_unread
// ---------------------------------------------------------------------------

describe('Tool: mark_notification_unread', () => {
  it('flips is_read to 0', async () => {
    const { user } = createUser(testDb);
    const notif = await createNotification(user.id);
    await updateRows(orm, Notifications, { id: notif.id }, { is_read: 1 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_notification_unread',
        arguments: { notificationId: notif.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const row = (await findRow(orm, Notifications, { id: notif.id }))!;
      expect(row.is_read).toBe(0);
    });
  });

  it('returns isError for non-existent notification', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_notification_unread',
        arguments: { notificationId: 99999 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// mark_all_notifications_read
// ---------------------------------------------------------------------------

describe('Tool: mark_all_notifications_read', () => {
  it('marks all notifications read and returns count', async () => {
    const { user } = createUser(testDb);
    await createNotification(user.id);
    await createNotification(user.id);
    await createNotification(user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_all_notifications_read', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
      const unread = await countRows(orm, Notifications, { recipient: user.id, is_read: 0 });
      expect(unread).toBe(0);
    });
  });

  it('returns count 0 when nothing to mark', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_all_notifications_read', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.count).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Resource: trek://notifications/in-app
// ---------------------------------------------------------------------------

describe('Resource: trek://notifications/in-app', () => {
  it('returns notifications list', async () => {
    const { user } = createUser(testDb);
    await createNotification(user.id, { title_key: 'notif.test' });
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://notifications/in-app' });
      const data = parseResourceResult(result) as any;
      expect(data.notifications).toBeDefined();
      expect(Array.isArray(data.notifications)).toBe(true);
      expect(data.notifications).toHaveLength(1);
    });
  });

  it('returns empty notifications for user with none', async () => {
    const { user } = createUser(testDb);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://notifications/in-app' });
      const data = parseResourceResult(result) as any;
      expect(data.notifications).toEqual([]);
    });
  });
});
