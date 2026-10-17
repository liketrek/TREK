/**
 * Unit tests for the memories (photo provider) MCP tools and the journey
 * provider-photo attach they feed.
 *
 * The provider calls themselves are spied on the service prototypes: the real
 * methods talk HTTP to an Immich or Synology box, and what these cases are about
 * is the layer above that, the provider gate, the argument coercion each REST
 * route performs, and what lands in the DB.
 */
import { ADDON_IDS } from '../../../src/addons';
import { db as testDb } from '../../../src/db/database';
import { JourneyEntryPhotos } from '../../../src/db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { PhotoProviders } from '../../../src/db/entities/PhotoProviders.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { ImmichService } from '../../../src/nest/memories/immich.service';
import { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import { SynologyService } from '../../../src/nest/memories/synology.service';
import { createUser, createJourney, createJourneyEntry, addJourneyContributor } from '../../helpers/factories';
import { countRows, deleteRows, findRow, findRows, upsertRow } from '../../helpers/factories/rows';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;
// The suite asserts both channels on one recorder, as its module mock did.
realtime.broadcastToUserMock.mockImplementation((...args) =>
  broadcastMock(...(args as unknown as Parameters<typeof broadcastMock>)),
);

const immichSearch = vi.spyOn(ImmichService.prototype, 'searchPhotos');
const immichAlbums = vi.spyOn(ImmichService.prototype, 'listAlbums');
const immichAlbumPhotos = vi.spyOn(ImmichService.prototype, 'getAlbumPhotos');
const synologySearch = vi.spyOn(SynologyService.prototype, 'searchSynologyPhotos');
const synologyAlbums = vi.spyOn(SynologyService.prototype, 'listSynologyAlbums');
const synologyAlbumPhotos = vi.spyOn(SynologyService.prototype, 'getSynologyAlbumPhotos');
// Detached in production; held still here so a case can assert what was queued
// without the provider lookup it would otherwise fire. It answers "a row learned
// its capture time", which is what makes the journey refresh go out.
const backfillRun = vi.spyOn(PhotoCaptureBackfillService.prototype, 'run').mockResolvedValue(true);

const IMMICH_ASSET = {
  id: 'a1',
  takenAt: '2026-07-01T10:00:00.000Z',
  city: 'Rome',
  country: 'IT',
  lat: 41.9,
  lng: 12.5,
  mediaType: 'image',
};
const SYNOLOGY_ASSET = { id: 's1', takenAt: '2026-07-02T10:00:00.000Z', lat: 48.1, lng: 11.6 };

/**
 * photo_providers is seed data, so resetTestDb leaves it alone and a toggle
 * leaks into the next case. Every case states what it needs.
 */
async function setProviderEnabled(id: string, enabled: boolean): Promise<void> {
  await upsertRow(orm, PhotoProviders, { id, name: id, enabled: enabled ? 1 : 0 }, ['enabled']);
}

async function removeProvider(id: string): Promise<void> {
  await deleteRows(orm, PhotoProviders, { id });
}

beforeEach(async () => {
  resetTestDb(testDb);
  setAddonEnabled(testDb, ADDON_IDS.JOURNEY, true);
  await setProviderEnabled('immich', true);
  await setProviderEnabled('synologyphotos', true);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;

  immichSearch.mockReset().mockResolvedValue({ assets: [IMMICH_ASSET], hasMore: false });
  immichAlbums.mockReset().mockResolvedValue({ albums: [{ id: 'alb-1', albumName: 'Rome', assetCount: 2 }] });
  immichAlbumPhotos.mockReset().mockResolvedValue({ assets: [IMMICH_ASSET] });
  synologySearch
    .mockReset()
    .mockResolvedValue({ success: true, data: { assets: [SYNOLOGY_ASSET], total: 1, hasMore: false } });
  synologyAlbums.mockReset().mockResolvedValue({
    success: true,
    data: { albums: [{ id: '7', albumName: 'Munich', assetCount: 3, passphrase: 'pp' }] },
  });
  synologyAlbumPhotos
    .mockReset()
    .mockResolvedValue({ success: true, data: { assets: [SYNOLOGY_ASSET], total: 1, hasMore: false } });
  backfillRun.mockClear();
});

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

afterAll(async () => {
  await orm.close();
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>, scopes?: string[] | null) {
  const h = await createMcpHarness({ realtime, userId, withResources: false, scopes: scopes ?? null });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
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
      expect(synologySearch).toHaveBeenCalledWith(user.id, undefined, undefined, 40, 20, 0);
    });
  });

  it("defaults Synology to its own page size, not Immich's", async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'search_provider_photos', arguments: { provider: 'synologyphotos' } });
      expect(synologySearch).toHaveBeenCalledWith(user.id, undefined, undefined, 0, 100, 0);
    });
  });

  it('tells Synology which zone the dates are meant in, so a tool call is fixable too', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'synologyphotos', from: '2026-03-15', to: '2026-03-15', utc_offset_minutes: 600 },
      });
      expect(result.isError).toBeFalsy();
      // The tool takes calendar days and has no browser to ask, so the caller
      // says which 24 hours it means; omitted stays the UTC day (#2336).
      expect(synologySearch).toHaveBeenCalledWith(user.id, '2026-03-15', '2026-03-15', 0, 100, 600);
    });
  });

  it('refuses a provider the admin has switched off, without calling it', async () => {
    const { user } = createUser(testDb);
    await setProviderEnabled('synologyphotos', false);
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
    await removeProvider('synologyphotos');
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
    await setProviderEnabled('immich', false);
    await setProviderEnabled('synologyphotos', false);
    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map((t) => t.name);
      expect(names).not.toContain('search_provider_photos');
      expect(names).not.toContain('list_provider_albums');
      expect(names).not.toContain('list_provider_album_photos');
    });
  });

  it('is not registered while the journey addon is off, however the provider rows read', async () => {
    const { user } = createUser(testDb);
    setAddonEnabled(testDb, ADDON_IDS.JOURNEY, false);
    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map((t) => t.name);
      expect(names).not.toContain('search_provider_photos');
      expect(names).not.toContain('list_provider_albums');
      expect(names).not.toContain('list_provider_album_photos');
    });
  });

  it('refuses mid-session once the journey addon goes off, without calling the provider', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      // Registered while journey was on; the flip lands after session start.
      setAddonEnabled(testDb, ADDON_IDS.JOURNEY, false);
      const result = await h.client.callTool({
        name: 'search_provider_photos',
        arguments: { provider: 'immich' },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toContain('is not enabled, contact server administrator');
      expect(immichSearch).not.toHaveBeenCalled();
    });
  });

  it('is registered again as soon as one provider is on', async () => {
    const { user } = createUser(testDb);
    await setProviderEnabled('immich', true);
    await setProviderEnabled('synologyphotos', false);
    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map((t) => t.name)).toContain('search_provider_photos');
    });
  });

  it('is not registered for a token without journey read access', async () => {
    const { user } = createUser(testDb);
    await withHarness(
      user.id,
      async (h) => {
        expect((await h.client.listTools()).tools.map((t) => t.name)).not.toContain('search_provider_photos');
      },
      ['trips:read'],
    );
  });
});

// ---------------------------------------------------------------------------
// list_provider_albums
// ---------------------------------------------------------------------------

describe('Tool: list_provider_albums', () => {
  it('lists the Immich albums', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({
          name: 'list_provider_albums',
          arguments: { provider: 'immich' },
        }),
      ) as any;
      expect(data.albums).toEqual([{ id: 'alb-1', albumName: 'Rome', assetCount: 2 }]);
      expect(immichAlbums).toHaveBeenCalledWith(user.id);
    });
  });

  it('keeps the passphrase a shared Synology album needs to be opened again', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({
          name: 'list_provider_albums',
          arguments: { provider: 'synologyphotos' },
        }),
      ) as any;
      expect(data.albums[0].passphrase).toBe('pp');
    });
  });

  it('refuses a disabled provider', async () => {
    const { user } = createUser(testDb);
    await setProviderEnabled('immich', false);
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
      const result = await h.client.callTool({
        name: 'list_provider_albums',
        arguments: { provider: 'synologyphotos' },
      });
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
      const data = parseToolResult(
        await h.client.callTool({
          name: 'list_provider_album_photos',
          arguments: { provider: 'immich', album_id: 'alb-1' },
        }),
      ) as any;
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
    await setProviderEnabled('synologyphotos', false);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_provider_album_photos',
        arguments: { provider: 'synologyphotos', album_id: '7' },
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
        name: 'list_provider_album_photos',
        arguments: { provider: 'immich', album_id: 'nope' },
      });
      expect(result.isError).toBe(true);
      expect((result as any).content[0].text).toBe('Failed to fetch album');
    });
  });
});

// ---------------------------------------------------------------------------
// add_journey_provider_photos
// ---------------------------------------------------------------------------

/** The provider photo behind each gallery row, the way the journey_photos to trek_photos join reads it. */
async function withTrekPhotos(galleryRows: Array<{ photo_id?: number; journey_id?: number; caption?: string | null }>) {
  const rows = [];
  for (const gp of galleryRows) {
    const tp = await findRow(orm, TrekPhotos, { id: gp.photo_id });
    if (tp) rows.push({ gp, tp });
  }
  return rows;
}

async function entryPhotoRows(entryId: number) {
  const links = await findRows(orm, JourneyEntryPhotos, { entry: entryId });
  const gallery = [];
  for (const link of links) {
    const gp = await findRow(orm, JourneyPhotos, { id: link.journey_photo_id });
    if (gp) gallery.push(gp);
  }
  return (await withTrekPhotos(gallery))
    .map(({ gp, tp }) => ({
      provider: tp.provider,
      asset_id: tp.asset_id,
      owner_id: tp.owner_id,
      media_type: tp.media_type,
      journey_id: gp.journey_id,
      caption: gp.caption,
    }))
    .sort((a, b) => ((a.asset_id ?? '') < (b.asset_id ?? '') ? -1 : (a.asset_id ?? '') > (b.asset_id ?? '') ? 1 : 0));
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
          journeyId: journey.id,
          entryId: entry.id,
          provider: 'immich',
          asset_ids: ['a1', 'a2'],
          media_types: ['image', 'video'],
          caption: 'Rome day one',
        },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.added).toBe(2);
      expect(data.skipped).toBe(0);

      const rows = await entryPhotoRows(entry.id);
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.asset_id)).toEqual(['a1', 'a2']);
      expect(rows.every((r) => r.provider === 'immich' && r.owner_id === user.id)).toBe(true);
      expect(rows.map((r) => r.media_type)).toEqual(['image', 'video']);
      expect(rows[0].caption).toBe('Rome day one');
      expect(rows[0].journey_id).toBe(journey.id);
    });
  });

  it('adds to the gallery alone when no entry is named', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({
          name: 'add_journey_provider_photos',
          arguments: { journeyId: journey.id, provider: 'synologyphotos', asset_ids: ['g1'] },
        }),
      ) as any;
      expect(data.added).toBe(1);

      const gallery = (await withTrekPhotos(await findRows(orm, JourneyPhotos, { journey: journey.id }))).map(
        ({ tp }) => ({ asset_id: tp.asset_id, provider: tp.provider }),
      );
      expect(gallery).toEqual([{ asset_id: 'g1', provider: 'synologyphotos' }]);
      expect(await entryPhotoRows(entry.id)).toHaveLength(0);
    });
  });

  it('skips an asset that is already on the entry rather than duplicating it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    await withHarness(user.id, async (h) => {
      const args = { journeyId: journey.id, entryId: entry.id, provider: 'immich', asset_ids: ['dup-1'] };
      await h.client.callTool({ name: 'add_journey_provider_photos', arguments: args });
      const second = parseToolResult(
        await h.client.callTool({ name: 'add_journey_provider_photos', arguments: args }),
      ) as any;
      expect(second.added).toBe(0);
      expect(second.skipped).toBe(1);
      expect(await entryPhotoRows(entry.id)).toHaveLength(1);
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
      const photoId = (await findRow(orm, TrekPhotos, { asset_id: 'bf-1', owner: user.id }))?.id;
      expect(backfillRun).toHaveBeenCalledWith([photoId], user.id);
    });
  });

  it('tells the journey once the capture times have landed, exactly as the REST routes do', async () => {
    // Same shared rule as POST /api/journeys/:id/gallery/provider-photos: the
    // gallery re-sorts on the event instead of waiting for a reload (#1587).
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'add_journey_provider_photos',
        arguments: { journeyId: journey.id, provider: 'immich', asset_ids: ['bf-2'] },
      });
      await vi.waitFor(() =>
        expect(broadcastMock).toHaveBeenCalledWith(
          user.id,
          expect.objectContaining({ type: 'journey:photos:updated', journeyId: journey.id }),
          undefined,
        ),
      );
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
      expect(await entryPhotoRows(entry.id)).toHaveLength(0);
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
      expect(await entryPhotoRows(foreignEntry.id)).toHaveLength(0);
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
      expect(await entryPhotoRows(entry.id)).toHaveLength(0);
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
          journeyId: journey.id,
          entryId: entry.id,
          provider: 'immich',
          asset_ids: Array.from({ length: 101 }, (_, i) => `cap-${i}`),
        },
      });
      expect(result.isError).toBe(true);
      expect(await entryPhotoRows(entry.id)).toHaveLength(0);
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
      expect(await countRows(orm, JourneyPhotos)).toBe(0);
    });
  });

  it('is not registered while the journey addon is off', async () => {
    const { user } = createUser(testDb);
    setAddonEnabled(testDb, ADDON_IDS.JOURNEY, false);
    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map((t) => t.name)).not.toContain('add_journey_provider_photos');
    });
  });

  it('is not registered for a read-only journey token', async () => {
    const { user } = createUser(testDb);
    await withHarness(
      user.id,
      async (h) => {
        const names = (await h.client.listTools()).tools.map((t) => t.name);
        expect(names).not.toContain('add_journey_provider_photos');
        expect(names).toContain('search_provider_photos');
      },
      ['journey:read'],
    );
  });
});
