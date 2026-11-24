/**
 * Unit tests for the share-link MCP surface (ShareMcp, DI-discovered):
 * get_share_link, create_share_link, delete_share_link — moved here from the
 * legacy src/mcp/tools/trips.ts registrar with the trip DI port. All three
 * ride the canShareTrips predicate (no declarative trips:share mode exists).
 */
import { ShareTokens } from '../../../src/db/entities/ShareTokens.entity';
import { findRow } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetDatabase } from '../../helpers/reset-database';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

beforeEach(async () => {
  await resetDatabase(orm);
  delete process.env.DEMO_MODE;
});

let orm: MikroORM;

beforeAll(async () => {
  orm = (await bootTestApp()).get(MikroORM);
});

afterAll(async () => {
  await (await bootTestApp()).close();
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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
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
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: create_share_link', () => {
  it('creates with the legacy defaults, then updates in place (created=false)', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
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
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const foreign = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      expect((await h.client.callTool({ name: 'create_share_link', arguments: { tripId: foreign.id } })).isError).toBe(
        true,
      );
    });
    process.env.DEMO_MODE = 'true';
    const { user: demo } = await makeUser(orm, { email: 'demo@nomad.app' });
    const trip = await makeTrip(orm, demo.id);
    await withHarness(demo.id, async (h) => {
      expect((await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } })).isError).toBe(
        true,
      );
    });
  });
});

describe('Tool: delete_share_link', () => {
  it('revokes the link; denies without access', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } });
      const result = parseToolResult(
        await h.client.callTool({ name: 'delete_share_link', arguments: { tripId: trip.id } }),
      ) as any;
      expect(result.success).toBe(true);
      expect(await findRow(orm, ShareTokens, { trip: trip.id })).toBeNull();
    });
    const { user: stranger } = await makeUser(orm);
    await withHarness(stranger.id, async (h) => {
      expect((await h.client.callTool({ name: 'delete_share_link', arguments: { tripId: trip.id } })).isError).toBe(
        true,
      );
    });
  });
});
