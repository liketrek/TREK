/**
 * Unit tests for the memories (photo provider) MCP tools and the journey
 * provider-photo attach they feed.
 *
 * The provider calls themselves are spied on the service prototypes: the real
 * methods talk HTTP to an Immich or Synology box, and what these cases are about
 * is the layer above that, the provider gate, the argument coercion each REST
 * route performs, and what lands in the DB.
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
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock, broadcastToUser: broadcastMock }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import { createUser, createJourney, createJourneyEntry, addJourneyContributor } from '../../helpers/factories';
import { ADDON_IDS } from '../../../src/addons';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { ImmichService } from '../../../src/nest/memories/immich.service';
import { SynologyService } from '../../../src/nest/memories/synology.service';
import { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';

const immichSearch = vi.spyOn(ImmichService.prototype, 'searchPhotos');
const immichAlbums = vi.spyOn(ImmichService.prototype, 'listAlbums');
const immichAlbumPhotos = vi.spyOn(ImmichService.prototype, 'getAlbumPhotos');
const synologySearch = vi.spyOn(SynologyService.prototype, 'searchSynologyPhotos');
const synologyAlbums = vi.spyOn(SynologyService.prototype, 'listSynologyAlbums');
const synologyAlbumPhotos = vi.spyOn(SynologyService.prototype, 'getSynologyAlbumPhotos');
// Detached in production; held still here so a case can assert what was queued
// without the provider lookup it would otherwise fire.
const backfillSchedule = vi.spyOn(PhotoCaptureBackfillService.prototype, 'schedule').mockImplementation(() => {});

const IMMICH_ASSET = { id: 'a1', takenAt: '2026-07-01T10:00:00.000Z', city: 'Rome', country: 'IT', lat: 41.9, lng: 12.5, mediaType: 'image' };
const SYNOLOGY_ASSET = { id: 's1', takenAt: '2026-07-02T10:00:00.000Z', lat: 48.1, lng: 11.6 };

/**
 * photo_providers is seed data, so resetTestDb leaves it alone and a toggle
 * leaks into the next case. Every case states what it needs.
 */
function setProviderEnabled(id: string, enabled: boolean): void {
  testDb.prepare(
    'INSERT INTO photo_providers (id, name, enabled) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled',
  ).run(id, id, enabled ? 1 : 0);
}

function removeProvider(id: string): void {
  testDb.prepare('DELETE FROM photo_providers WHERE id = ?').run(id);
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  setAddonEnabled(testDb, ADDON_IDS.JOURNEY, true);
  setProviderEnabled('immich', true);
  setProviderEnabled('synologyphotos', true);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;

  immichSearch.mockReset().mockResolvedValue({ assets: [IMMICH_ASSET], hasMore: false });
  immichAlbums.mockReset().mockResolvedValue({ albums: [{ id: 'alb-1', albumName: 'Rome', assetCount: 2 }] });
  immichAlbumPhotos.mockReset().mockResolvedValue({ assets: [IMMICH_ASSET] });
  synologySearch.mockReset().mockResolvedValue({ success: true, data: { assets: [SYNOLOGY_ASSET], total: 1, hasMore: false } });
  synologyAlbums.mockReset().mockResolvedValue({ success: true, data: { albums: [{ id: '7', albumName: 'Munich', assetCount: 3, passphrase: 'pp' }] } });
  synologyAlbumPhotos.mockReset().mockResolvedValue({ success: true, data: { assets: [SYNOLOGY_ASSET], total: 1, hasMore: false } });
  backfillSchedule.mockClear();
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>, scopes?: string[] | null) {
  const h = await createMcpHarness({ userId, withResources: false, scopes: scopes ?? null });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// search_provider_photos
// ---------------------------------------------------------------------------

describe('Tool: search_provider_photos', () => {
  it('searches Immich with the page and size coercion the REST route applies', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'immich', from: '2026-07-01', to: '2026-07-31' },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.provider).toBe('immich');
      expect(data.assets).toEqual([IMMICH_ASSET]);
      expect(data.hasMore).toBe(false);
      expect(immichSearch).toHaveBeenCalledWith(user.id, '2026-07-01', '2026-07-31', 1, 50);
    });
  });

  it('turns a 1-based page into the offset Synology paginates by', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'synologyphotos', page: 3, size: 20 },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.assets).toEqual([SYNOLOGY_ASSET]);
      expect(data.total).toBe(1);
      expect(synologySearch).toHaveBeenCalledWith(user.id, undefined, undefined, 40, 20);
    });
  });

  it('defaults Synology to its own page size, not Immich\'s', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'search_provider_photos', arguments: { provider: 'synologyphotos' } });
      expect(synologySearch).toHaveBeenCalledWith(user.id, undefined, undefined, 0, 100);
    });
  });

  it('refuses a provider the admin has switched off, without calling it', async () => {
    const { user } = createUser(testDb);
    setProviderEnabled('synologyphotos', false);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'synologyphotos' },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toContain('is not enabled, contact server administrator');
      expect(synologySearch).not.toHaveBeenCalled();
    });
  });

  it('refuses a provider that is not in the provider table at all', async () => {
    const { user } = createUser(testDb);
    removeProvider('synologyphotos');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'synologyphotos' },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toContain('is not supported');
      expect(synologySearch).not.toHaveBeenCalled();
    });
  });

  it('passes the upstream refusal through verbatim', async () => {
    const { user } = createUser(testDb);
    immichSearch.mockResolvedValue({ error: 'Immich not configured', status: 400 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'search_provider_photos', arguments: { provider: 'immich' } });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toBe('Immich not configured');
    });
  });

  it('rejects a page size past the cap instead of quietly clamping it', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'immich', size: 500 },
      });
      expect(result.isError).toBe(true);
      expect(immichSearch).not.toHaveBeenCalled();
    });
  });

  it('rejects an unknown provider name at the schema', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'google-photos' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('is not registered when every photo provider is switched off', async () => {
    const { user } = createUser(testDb);
    setProviderEnabled('immich', false);
    setProviderEnabled('synologyphotos', false);
    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      expect(names).not.toContain('search_provider_photos');
      expect(names).not.toContain('list_provider_albums');
      expect(names).not.toContain('list_provider_album_photos');
    });
  });

  it('is registered again as soon as one provider is on', async () => {
    const { user } = createUser(testDb);
    setProviderEnabled('immich', true);
    setProviderEnabled('synologyphotos', false);
    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map(t => t.name)).toContain('search_provider_photos');
    });
  });

  it('is not registered for a token without journey read access', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map(t => t.name)).not.toContain('search_provider_photos');
    }, ['trips:read']);
  });
});

// ---------------------------------------------------------------------------
// list_provider_albums
// ---------------------------------------------------------------------------

describe('Tool: list_provider_albums', () => {
  it('lists the Immich albums', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'list_provider_albums', arguments: { provider: 'immich' },
      })) as any;
      expect(data.albums).toEqual([{ id: 'alb-1', albumName: 'Rome', assetCount: 2 }]);
      expect(immichAlbums).toHaveBeenCalledWith(user.id);
    });
  });

  it('keeps the passphrase a shared Synology album needs to be opened again', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'list_provider_albums', arguments: { provider: 'synologyphotos' },
      })) as any;
      expect(data.albums[0].passphrase).toBe('pp');
    });
  });

  it('refuses a disabled provider', async () => {
    const { user } = createUser(testDb);
    setProviderEnabled('immich', false);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_provider_albums', arguments: { provider: 'immich' } });
      expect(result.isError).toBe(true);
      expect(immichAlbums).not.toHaveBeenCalled();
    });
  });

  it('passes the upstream refusal through', async () => {
    const { user } = createUser(testDb);
    synologyAlbums.mockResolvedValue({ success: false, error: { message: 'Synology not configured', status: 400 } });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_provider_albums', arguments: { provider: 'synologyphotos' } });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toBe('Synology not configured');
    });
  });
});

// ---------------------------------------------------------------------------
// list_provider_album_photos
// ---------------------------------------------------------------------------

describe('Tool: list_provider_album_photos', () => {
  it('reads one Immich album', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'list_provider_album_photos', arguments: { provider: 'immich', album_id: 'alb-1' },
      })) as any;
      expect(data.album_id).toBe('alb-1');
      expect(data.assets).toEqual([IMMICH_ASSET]);
      expect(immichAlbumPhotos).toHaveBeenCalledWith(user.id, 'alb-1');
    });
  });

  it('forwards the passphrase to Synology', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'list_provider_album_photos',
        arguments: { provider: 'synologyphotos', album_id: '7', passphrase: 'pp' },
      });
      expect(synologyAlbumPhotos).toHaveBeenCalledWith(user.id, '7', 'pp');
    });
  });

  it('refuses a disabled provider', async () => {
    const { user } = createUser(testDb);
    setProviderEnabled('synologyphotos', false);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_provider_album_photos', arguments: { provider: 'synologyphotos', album_id: '7' },
      });
      expect(result.isError).toBe(true);
      expect(synologyAlbumPhotos).not.toHaveBeenCalled();
    });
  });

  it('passes an album that could not be fetched through as an error', async () => {
    const { user } = createUser(testDb);
    immichAlbumPhotos.mockResolvedValue({ error: 'Failed to fetch album', status: 404 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_provider_album_photos', arguments: { provider: 'immich', album_id: 'nope' },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toBe('Failed to fetch album');
    });
  });
});

// ---------------------------------------------------------------------------
// add_journey_provider_photos
// ---------------------------------------------------------------------------

function entryPhotoRows(entryId: number) {
  return testDb.prepare(`
    SELECT tp.provider, tp.asset_id, tp.owner_id, tp.media_type, gp.journey_id, gp.caption
    FROM journey_entry_photos jep
    JOIN journey_photos gp ON gp.id = jep.journey_photo_id
    JOIN trek_photos tp ON tp.id = gp.photo_id
    WHERE jep.entry_id = ?
    ORDER BY tp.asset_id
  `).all(entryId) as Array<Record<string, unknown>>;
}

describe('Tool: add_journey_provider_photos', () => {
  it('attaches provider assets to an entry and records them against the journey', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: {
          journeyId: journey.id, entryId: entry.id, provider: 'immich',
          asset_ids: ['a1', 'a2'], media_types: ['image', 'video'], caption: 'Rome day one',
        },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.added).toBe(2);
      expect(data.skipped).toBe(0);

      const rows = entryPhotoRows(entry.id);
      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.asset_id)).toEqual(['a1', 'a2']);
      expect(rows.every(r => r.provider === 'immich' && r.owner_id === user.id)).toBe(true);
      expect(rows.map(r => r.media_type)).toEqual(['image', 'video']);
      expect(rows[0].caption).toBe('Rome day one');
      expect(rows[0].journey_id).toBe(journey.id);
    });
  });

  it('adds to the gallery alone when no entry is named', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: journey.id, provider: 'synologyphotos', asset_ids: ['g1'] },
      })) as any;
      expect(data.added).toBe(1);

      const gallery = testDb.prepare(
        'SELECT tp.asset_id, tp.provider FROM journey_photos gp JOIN trek_photos tp ON tp.id = gp.photo_id WHERE gp.journey_id = ?',
      ).all(journey.id) as Array<Record<string, unknown>>;
      expect(gallery).toEqual([{ asset_id: 'g1', provider: 'synologyphotos' }]);
      expect(entryPhotoRows(entry.id)).toHaveLength(0);
    });
  });

  it('skips an asset that is already on the entry rather than duplicating it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      const args = { journeyId: journey.id, entryId: entry.id, provider: 'immich', asset_ids: ['dup-1'] };
      await h.client.callTool({ name: 'add_journey_provider_photos', arguments: args });
      const second = parseToolResult(await h.client.callTool({ name: 'add_journey_provider_photos', arguments: args })) as any;
      expect(second.added).toBe(0);
      expect(second.skipped).toBe(1);
      expect(entryPhotoRows(entry.id)).toHaveLength(1);
    });
  });

  it('queues the capture backfill for what it actually attached', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: journey.id, entryId: entry.id, provider: 'immich', asset_ids: ['bf-1'] },
      });
      const photoId = (testDb.prepare('SELECT id FROM trek_photos WHERE asset_id = ? AND owner_id = ?').get('bf-1', user.id) as { id: number }).id;
      expect(backfillSchedule).toHaveBeenCalledWith([photoId], user.id);
    });
  });

  it('refuses a contributor who may only read the journey', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    const entry = createJourneyEntry(testDb, journey.id, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    await withHarness(viewer.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: journey.id, entryId: entry.id, provider: 'immich', asset_ids: ['x1'] },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toBe('Journey not found or access denied.');
      expect(entryPhotoRows(entry.id)).toHaveLength(0);
    });
  });

  it('refuses a journey that does not exist', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: 999999, provider: 'immich', asset_ids: ['x1'] },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toBe('Journey not found or access denied.');
    });
  });

  it('refuses an entry that belongs to another journey', async () => {
    const { user } = createUser(testDb);
    const mine = createJourney(testDb, user.id);
    const other = createJourney(testDb, user.id);
    const foreignEntry = createJourneyEntry(testDb, other.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: mine.id, entryId: foreignEntry.id, provider: 'immich', asset_ids: ['x1'] },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toBe('Entry not found in this journey.');
      expect(entryPhotoRows(foreignEntry.id)).toHaveLength(0);
    });
  });

  it('blocks the demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: journey.id, entryId: entry.id, provider: 'immich', asset_ids: ['x1'] },
      });
      expect(result.isError).toBe(true);
      expect(entryPhotoRows(entry.id)).toHaveLength(0);
    });
  });

  it('refuses a batch past the per-call cap and writes nothing', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: {
          journeyId: journey.id, entryId: entry.id, provider: 'immich',
          asset_ids: Array.from({ length: 101 }, (_, i) => `cap-${i}`),
        },
      });
      expect(result.isError).toBe(true);
      expect(entryPhotoRows(entry.id)).toHaveLength(0);
    });
  });

  it('rejects a provider the journey could never resolve', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: journey.id, provider: 'local', asset_ids: ['x1'] },
      });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT COUNT(*) c FROM journey_photos').get()).toEqual({ c: 0 });
    });
  });

  it('is not registered while the journey addon is off', async () => {
    const { user } = createUser(testDb);
    setAddonEnabled(testDb, ADDON_IDS.JOURNEY, false);
    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map(t => t.name)).not.toContain('add_journey_provider_photos');
    });
  });

  it('is not registered for a read-only journey token', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      expect(names).not.toContain('add_journey_provider_photos');
      expect(names).toContain('search_provider_photos');
    }, ['journey:read']);
  });
});
