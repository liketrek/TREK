/**
 * Unit tests for MCP atlas and bucket list tools:
 * mark_country_visited, unmark_country_visited, create_bucket_list_item, delete_bucket_list_item,
 * list_bucket_list.
 */
import { db as testDb } from '../../../src/db/database';
import { BucketList } from '../../../src/db/entities/BucketList.entity';
import { VisitedCountries } from '../../../src/db/entities/VisitedCountries.entity';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { createUser, createBucketListItem, createVisitedCountry } from '../../helpers/factories';
import { countRows, findRow } from '../../helpers/factories/rows';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

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

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

// ---------------------------------------------------------------------------
// mark_country_visited
// ---------------------------------------------------------------------------

describe('Tool: mark_country_visited', () => {
  it('marks a country as visited', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'FR' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(data.country_code).toBe('FR');
      // Where the atlas stands now, which the assistant's card and answer read.
      expect(data.after).toEqual({ country_status: 'visited', countries_visited: 1 });
      const row = await findRow(orm, VisitedCountries, { user: user.id, country_code: 'FR' });
      expect(row).toBeTruthy();
    });
  });

  it('MCP-ATLAS-AFTER-001: a failed read after the mark leaves `after` out, not the done write', async () => {
    const { user } = createUser(testDb);
    const stats = vi.spyOn(AtlasService.prototype, 'stats').mockRejectedValue(new Error('stats unavailable'));
    try {
      await withHarness(user.id, async (h) => {
        const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'NO' } });
        expect(result.isError).toBeFalsy();
        expect(parseToolResult(result)).toEqual({ success: true, country_code: 'NO' });
        expect(await findRow(orm, VisitedCountries, { user: user.id, country_code: 'NO' })).toBeTruthy();
      });
    } finally {
      stats.mockRestore();
    }
  });

  it('is idempotent — marking twice does not error', async () => {
    const { user } = createUser(testDb);
    createVisitedCountry(testDb, user.id, 'JP');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'JP' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const count = await countRows(orm, VisitedCountries, { user: user.id, country_code: 'JP' });
      expect(count).toBe(1);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'DE' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// unmark_country_visited
// ---------------------------------------------------------------------------

describe('Tool: unmark_country_visited', () => {
  it('removes a visited country', async () => {
    const { user } = createUser(testDb);
    createVisitedCountry(testDb, user.id, 'ES');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unmark_country_visited', arguments: { country_code: 'ES' } });
      expect(parseToolResult(result)).toEqual({
        success: true,
        country_code: 'ES',
        after: { country_status: null, countries_visited: 0 },
      });
      const row = await findRow(orm, VisitedCountries, { user: user.id, country_code: 'ES' });
      expect(row).toBeNull();
    });
  });

  it('succeeds even when country was not marked (no-op)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unmark_country_visited', arguments: { country_code: 'AU' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    createVisitedCountry(testDb, user.id, 'IT');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unmark_country_visited', arguments: { country_code: 'IT' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// create_bucket_list_item
// ---------------------------------------------------------------------------

describe('Tool: create_bucket_list_item', () => {
  it('stores a wished-for region and refuses one outside its country (#1901)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const ok = parseToolResult(
        await h.client.callTool({
          name: 'create_bucket_list_item',
          arguments: { name: 'Bayern', country_code: 'DE', region_code: 'DE-BY' },
        }),
      ) as any;
      expect(ok.item.region_code).toBe('DE-BY');
      const bad = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Berlin', country_code: 'FR', region_code: 'DE-BE' },
      });
      expect(bad.isError).toBe(true);
    });
  });

  it('creates a bucket list item with all fields', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Kyoto', lat: 35.0116, lng: 135.7681, country_code: 'JP', notes: 'Cherry blossom season' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Kyoto');
      expect(data.item.country_code).toBe('JP');
      expect(data.item.notes).toBe('Cherry blossom season');
    });
  });

  it('creates a minimal item (name only)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_bucket_list_item', arguments: { name: 'Antarctica' } });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Antarctica');
      expect(data.item.user_id).toBe(user.id);
    });
  });

  it('takes a target date, so the same place can be planned for several dates (#1898)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const first = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Japan', country_code: 'JP', target_date: '2027-05' },
      });
      expect((parseToolResult(first) as any).item.target_date).toBe('2027-05');

      const second = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Japan', country_code: 'JP', target_date: '2028-09' },
      });
      expect((parseToolResult(second) as any).item.target_date).toBe('2028-09');
    });
  });

  it('reports the duplicate instead of appending a second row (#1898)', async () => {
    const { user } = createUser(testDb);
    createBucketListItem(testDb, user.id, { name: 'Japan', country_code: 'JP' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Japan', country_code: 'JP' },
      });
      expect(result.isError).toBe(true);
      expect(await countRows(orm, BucketList, { user: user.id })).toBe(1);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_bucket_list_item', arguments: { name: 'Nowhere' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_bucket_list_item
// ---------------------------------------------------------------------------

describe('Tool: delete_bucket_list_item', () => {
  it('deletes a bucket list item owned by the user', async () => {
    const { user } = createUser(testDb);
    const item = createBucketListItem(testDb, user.id, { name: 'Machu Picchu' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: item.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(await findRow(orm, BucketList, { id: item.id })).toBeNull();
    });
  });

  it('returns error for item not found (wrong user)', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const item = createBucketListItem(testDb, other.id, { name: "Other's Wish" });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: item.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns error for non-existent item', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const item = createBucketListItem(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: item.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_bucket_list
// ---------------------------------------------------------------------------

describe('Tool: list_bucket_list', () => {
  it("MCP-ATLAS-BUCKET-001: answers the user's own wishes with their ids, shaped like GET /bucket-list", async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const kyoto = createBucketListItem(testDb, user.id, { name: 'Kyoto', country_code: 'JP', notes: 'In autumn' });
    createBucketListItem(testDb, other.id, { name: "Other's Wish" });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_bucket_list', arguments: {} });
      const data = parseToolResult(result) as { items: Array<Record<string, unknown>> };
      expect(data.items).toHaveLength(1);
      expect(data.items[0]).toMatchObject({ id: kyoto.id, name: 'Kyoto', country_code: 'JP', notes: 'In autumn' });
    });
  });

  it('MCP-ATLAS-BUCKET-002: answers an empty list, and reads for a demo user too', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_bucket_list', arguments: {} });
      expect(result.isError).toBeFalsy();
      expect(parseToolResult(result)).toEqual({ items: [] });
    });
  });
});
