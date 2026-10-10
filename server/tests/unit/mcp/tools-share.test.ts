/**
 * Unit tests for the share-link MCP surface (ShareMcp, DI-discovered):
 * get_share_link, create_share_link, delete_share_link — moved here from the
 * legacy src/mcp/tools/trips.ts registrar with the trip DI port. All three
 * ride the canShareTrips predicate (no declarative trips:share mode exists).
 */
import { db as testDb } from '../../../src/db/database';
import { ShareTokens } from '../../../src/db/entities/ShareTokens.entity';
import { createUser, createTrip } from '../../helpers/factories';
import { findRow } from '../../helpers/factories/rows';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

beforeEach(() => {
  resetTestDb(testDb);
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
  const h = await createMcpHarness({ userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

describe('Tool: get_share_link', () => {
  it('returns null when the trip has no share link, then the token after creation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const empty = parseToolResult(
        await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } }),
      ) as any;
      expect(empty.link).toBeNull();
      const created = parseToolResult(
        await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } }),
      ) as any;
      const link = parseToolResult(
        await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } }),
      ) as any;
      expect(link.link.token).toBe(created.token);
    });
  });

  it('stores the two narrowing options like the REST route (#1712)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'create_share_link',
        arguments: { tripId: trip.id, share_travel_only: true, share_hide_images: true },
      });
      const link = parseToolResult(
        await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } }),
      ) as any;
      expect(link.link).toMatchObject({ share_travel_only: true, share_hide_images: true });
    });
  });

  it('returns access denied for a non-member trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: create_share_link', () => {
  it('creates with the legacy defaults, then updates in place (created=false)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const first = parseToolResult(
        await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } }),
      ) as any;
      expect(first.created).toBe(true);
      const row = await findRow(orm, ShareTokens, { trip: trip.id });
      expect(row).toMatchObject({
        share_map: 1,
        share_bookings: 1,
        share_packing: 0,
        share_budget: 0,
        share_collab: 0,
      });
      const second = parseToolResult(
        await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id, share_budget: true } }),
      ) as any;
      expect(second.created).toBe(false);
      expect(second.token).toBe(first.token);
    });
  });

  it('denies without trip access; blocks demo users', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const foreign = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      expect((await h.client.callTool({ name: 'create_share_link', arguments: { tripId: foreign.id } })).isError).toBe(
        true,
      );
    });
    process.env.DEMO_MODE = 'true';
    const { user: demo } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, demo.id);
    await withHarness(demo.id, async (h) => {
      expect((await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } })).isError).toBe(
        true,
      );
    });
  });
});

describe('Tool: delete_share_link', () => {
  it('revokes the link; denies without access', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } });
      const result = parseToolResult(
        await h.client.callTool({ name: 'delete_share_link', arguments: { tripId: trip.id } }),
      ) as any;
      expect(result.success).toBe(true);
      expect(await findRow(orm, ShareTokens, { trip: trip.id })).toBeNull();
    });
    const { user: stranger } = createUser(testDb);
    await withHarness(stranger.id, async (h) => {
      expect((await h.client.callTool({ name: 'delete_share_link', arguments: { tripId: trip.id } })).isError).toBe(
        true,
      );
    });
  });
});
