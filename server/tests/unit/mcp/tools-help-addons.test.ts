/**
 * Unit tests for the MCP help and addons tools:
 * list_help_topics, get_help_page, list_addons.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

// The wiki reader is stubbed at the module boundary, the way the weather tools
// stub weather.impl: help.mcp.ts calls these functions directly, and the reader
// has its own tests in tests/unit/nest/wiki.test.ts. Stubbing keeps these cases
// off the 94 real pages in wiki/ and reaches the failure branches, which a
// directory on disk cannot produce on demand.
const { wiki } = vi.hoisted(() => {
  class WikiNotFound extends Error {
    status = 404;
  }
  return {
    wiki: {
      WikiNotFound,
      isLocalWiki: vi.fn(() => true),
      getWikiIndex: vi.fn(),
      getWikiPage: vi.fn(),
      getWikiAsset: vi.fn(),
    },
  };
});
vi.mock('../../../src/nest/help/wiki', () => wiki);

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { ADDON_IDS } from '../../../src/addons';

const SECTIONS = [
  { title: 'Getting Started', pages: [{ title: 'Quick Start', slug: 'Quick-Start' }] },
  { title: 'Planning', pages: [{ title: 'Currencies', slug: 'Currencies' }] },
];

// 40004 characters: four over the 40000-character cap, so the second chunk is
// short enough to assert on in full.
const LONG_MARKDOWN = 'a'.repeat(40_000) + 'TAIL';

const PAGES: Record<string, { slug: string; title: string; markdown: string }> = {
  'Quick-Start': {
    slug: 'Quick-Start',
    title: 'Quick Start',
    markdown: '# Quick Start\n\nCreate a trip, then add days to it.',
  },
  'Plugin-Development': {
    slug: 'Plugin-Development',
    title: 'Plugin Development',
    markdown: LONG_MARKDOWN,
  },
};

interface HelpIndexPayload {
  sections: { title: string; pages: { title: string; slug: string }[] }[];
}
interface HelpPagePayload {
  slug: string;
  title: string;
  markdown: string;
  truncated: boolean;
  next_offset: number | null;
}
interface AddonEntry {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}
interface AddonsPayload {
  addons: AddonEntry[];
  collabFeatures: { chat: boolean; notes: boolean; polls: boolean; whatsnext: boolean };
  bagTracking: boolean;
}

/** First text block of a tool result, for asserting on refusal wording. */
function toolText(result: unknown): string {
  const { content } = result as { content: { type: string; text?: string }[] };
  return content.find((c) => c.type === 'text')?.text ?? '';
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
  wiki.getWikiIndex.mockReset();
  wiki.getWikiPage.mockReset();
  wiki.getWikiIndex.mockResolvedValue({ sections: SECTIONS });
  wiki.getWikiPage.mockImplementation(async (slug: string) => {
    const page = PAGES[slug];
    if (!page) throw new wiki.WikiNotFound(slug);
    return page;
  });
  // resetTestDb leaves the addons table alone, so a case that flips a toggle
  // would otherwise leak into the next one.
  for (const id of [ADDON_IDS.BUDGET, ADDON_IDS.PACKING, ADDON_IDS.COLLAB]) {
    setAddonEnabled(testDb, id, true);
  }
});

afterAll(() => {
  testDb.close();
});

async function withHarness(
  userId: number,
  fn: (h: McpHarness) => Promise<void>,
  scopes?: string[] | null,
) {
  const h = await createMcpHarness({ userId, withResources: false, scopes: scopes ?? null });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// list_help_topics
// ---------------------------------------------------------------------------

describe('Tool: list_help_topics', () => {
  it('returns the sections the wiki reader parsed out of the sidebar', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_help_topics', arguments: {} });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as HelpIndexPayload;
      expect(data.sections).toEqual(SECTIONS);
      expect(wiki.getWikiIndex).toHaveBeenCalledTimes(1);
    });
  });

  it('answers with a refusal instead of throwing when the reader fails', async () => {
    wiki.getWikiIndex.mockRejectedValue(new Error('ENOENT'));
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_help_topics', arguments: {} });
      expect(result.isError).toBe(true);
      expect(toolText(result)).toBe('Help contents unavailable.');
    });
  });

  it('stays registered for a token holding an unrelated scope', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map((t) => t.name);
      expect(names).toContain('list_help_topics');
      expect(names).toContain('get_help_page');
      const result = await h.client.callTool({ name: 'list_help_topics', arguments: {} });
      expect(result.isError).toBeFalsy();
    }, ['weather:read']);
  });
});

// ---------------------------------------------------------------------------
// get_help_page
// ---------------------------------------------------------------------------

describe('Tool: get_help_page', () => {
  it('returns a short page whole, with nothing left to fetch', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_help_page',
        arguments: { slug: 'Quick-Start' },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as HelpPagePayload;
      expect(data).toEqual({
        slug: 'Quick-Start',
        title: 'Quick Start',
        markdown: PAGES['Quick-Start'].markdown,
        truncated: false,
        next_offset: null,
      });
      expect(wiki.getWikiPage).toHaveBeenCalledWith('Quick-Start');
    });
  });

  it('refuses a slug this instance does not ship, and says where to look', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_help_page',
        arguments: { slug: 'No-Such-Page' },
      });
      expect(result.isError).toBe(true);
      expect(toolText(result)).toContain('No help page named "No-Such-Page"');
      expect(toolText(result)).toContain('list_help_topics');
    });
  });

  it('separates an unavailable reader from a missing page', async () => {
    wiki.getWikiPage.mockRejectedValue(new Error('socket hang up'));
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_help_page',
        arguments: { slug: 'Quick-Start' },
      });
      expect(result.isError).toBe(true);
      expect(toolText(result)).toBe('Help page unavailable.');
    });
  });

  it('caps a long page and hands back the offset to resume from', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_help_page',
        arguments: { slug: 'Plugin-Development' },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as HelpPagePayload;
      expect(data.markdown).toHaveLength(40_000);
      expect(data.markdown).toBe(LONG_MARKDOWN.slice(0, 40_000));
      expect(data.truncated).toBe(true);
      expect(data.next_offset).toBe(40_000);
    });
  });

  it('resumes from the offset the previous chunk reported', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_help_page',
        arguments: { slug: 'Plugin-Development', offset: 40_000 },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as HelpPagePayload;
      expect(data.markdown).toBe('TAIL');
      expect(data.truncated).toBe(false);
      expect(data.next_offset).toBeNull();
    });
  });

  it('refuses an offset past the end of the page', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_help_page',
        arguments: { slug: 'Quick-Start', offset: 5000 },
      });
      expect(result.isError).toBe(true);
      expect(toolText(result)).toContain('past the end of "Quick-Start"');
    });
  });

  it('serves a demo account, the way the public REST route does', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_help_page',
        arguments: { slug: 'Quick-Start' },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as HelpPagePayload;
      expect(data.title).toBe('Quick Start');
    });
  });
});

// ---------------------------------------------------------------------------
// list_addons
// ---------------------------------------------------------------------------

describe('Tool: list_addons', () => {
  it('lists the enabled addons with the collab sub-features and bag tracking', async () => {
    const { user } = createUser(testDb);
    const row = testDb.prepare('SELECT name, type FROM addons WHERE id = ?').get('budget') as {
      name: string;
      type: string;
    };
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_addons', arguments: {} });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as AddonsPayload;
      // The whole entry, so the admin-panel chrome (icon, plus config and fields
      // on a photo provider) has to be absent rather than merely unasserted.
      expect(data.addons).toContainEqual({
        id: 'budget',
        name: row.name,
        type: row.type,
        enabled: true,
      });
      expect(data.collabFeatures).toEqual({ chat: true, notes: true, polls: true, whatsnext: true });
      expect(data.bagTracking).toBe(false);
    });
  });

  it('lists the enabled photo providers alongside the addons', async () => {
    const { user } = createUser(testDb);
    const row = testDb.prepare('SELECT name FROM photo_providers WHERE id = ?').get('immich') as {
      name: string;
    };
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_addons', arguments: {} });
      const data = parseToolResult(result) as AddonsPayload;
      expect(data.addons).toContainEqual({
        id: 'immich',
        name: row.name,
        type: 'photo_provider',
        enabled: true,
      });
    });
  });

  it('drops an addon the admin switched off, so absence means disabled', async () => {
    setAddonEnabled(testDb, ADDON_IDS.BUDGET, false);
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_addons', arguments: {} });
      const data = parseToolResult(result) as AddonsPayload;
      const ids = data.addons.map((a) => a.id);
      expect(ids).not.toContain(ADDON_IDS.BUDGET);
      expect(ids).toContain(ADDON_IDS.PACKING);
    });
  });

  it('follows a collab sub-feature the admin toggles, in both directions', async () => {
    // Written through the same service the admin panel writes through rather
    // than through a hand-rolled app_settings row, so the tool is checked
    // against the real writer and not against a restatement of it.
    const addonsService = new AddonsService(new DatabaseService(testDb));
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      addonsService.updateCollabFeatures({ polls: false });
      const off = parseToolResult(
        await h.client.callTool({ name: 'list_addons', arguments: {} }),
      ) as AddonsPayload;
      expect(off.collabFeatures.polls).toBe(false);
      expect(off.collabFeatures.chat).toBe(true);

      addonsService.updateCollabFeatures({ polls: true });
      const on = parseToolResult(
        await h.client.callTool({ name: 'list_addons', arguments: {} }),
      ) as AddonsPayload;
      expect(on.collabFeatures.polls).toBe(true);
    });
  });

  it('reports bag tracking once it is switched on', async () => {
    testDb
      .prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('bag_tracking_enabled', 'true')")
      .run();
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_addons', arguments: {} });
      const data = parseToolResult(result) as AddonsPayload;
      expect(data.bagTracking).toBe(true);
    });
  });

  it('stays registered for a token holding an unrelated scope', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map((t) => t.name);
      expect(names).toContain('list_addons');
      const result = await h.client.callTool({ name: 'list_addons', arguments: {} });
      expect(result.isError).toBeFalsy();
    }, ['weather:read']);
  });

  it('serves a demo account, the way the authenticated REST route does', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_addons', arguments: {} });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as AddonsPayload;
      expect(data.addons.map((a) => a.id)).toContain(ADDON_IDS.PACKING);
    });
  });
});
