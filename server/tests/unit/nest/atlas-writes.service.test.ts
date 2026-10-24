/**
 * AtlasWritesService: every atlas write the REST routes and the MCP tools
 * make goes through AtlasService, then tells the writer's tabs that their
 * atlas changed. The tab that asked over REST is left out; an MCP call, which
 * has no socket, reaches them all, the assistant's own tab included.
 */
import { AtlasWritesService } from '../../../src/nest/atlas/atlas-writes.service';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../helpers/test-module';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const atlas = {
  markCountry: vi.fn(async () => true),
  unmarkCountry: vi.fn(async () => undefined),
  markRegion: vi.fn(async () => undefined),
  unmarkRegion: vi.fn(async () => undefined),
  createBucketItem: vi.fn(async () => ({ id: 4, name: 'Kyoto' })),
  updateBucketItem: vi.fn(async (): Promise<{ id: number } | null> => ({ id: 4 })),
  deleteBucketItem: vi.fn(async () => true),
};

const testDb = createSnapshotTestDb();
let t: TestModule;
let writes: AtlasWritesService;

beforeAll(async () => {
  t = await createTestModule({
    db: testDb,
    imports: [],
    providers: [AtlasWritesService, { provide: AtlasService, useValue: atlas }],
  });
  writes = t.get(AtlasWritesService);
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  t.realtime.broadcastToUserMock.mockClear();
});

const changed = (userId: number, socketId?: string) => [userId, { type: 'atlas:changed' }, socketId];

describe('AtlasWritesService', () => {
  it('ATLAS-WRITES-001: each write lands first, then the user hears atlas:changed without the asking tab', async () => {
    await writes.markCountry(7, 'PT', 'sock-1');
    await writes.unmarkCountry(7, 'PT', 'sock-1');
    await writes.markRegion(7, 'PT-11', 'Lisboa', 'PT', 'sock-1');
    await writes.unmarkRegion(7, 'PT-11', 'sock-1');
    expect(await writes.createBucketItem(7, { name: 'Kyoto' }, 'sock-1')).toEqual({ id: 4, name: 'Kyoto' });
    expect(await writes.updateBucketItem(7, 4, { notes: 'spring' }, 'sock-1')).toEqual({ id: 4 });
    expect(await writes.deleteBucketItem(7, 4, 'sock-1')).toBe(true);

    expect(atlas.markCountry).toHaveBeenCalledWith(7, 'PT');
    expect(atlas.unmarkCountry).toHaveBeenCalledWith(7, 'PT');
    expect(atlas.markRegion).toHaveBeenCalledWith(7, 'PT-11', 'Lisboa', 'PT');
    expect(atlas.unmarkRegion).toHaveBeenCalledWith(7, 'PT-11');
    expect(atlas.createBucketItem).toHaveBeenCalledWith(7, { name: 'Kyoto' });
    expect(atlas.updateBucketItem).toHaveBeenCalledWith(7, 4, { notes: 'spring' });
    expect(atlas.deleteBucketItem).toHaveBeenCalledWith(7, 4);
    expect(t.realtime.broadcastToUserMock.mock.calls).toEqual(Array.from({ length: 7 }, () => changed(7, 'sock-1')));
  });

  it('ATLAS-WRITES-002: an update or delete that found no item says nothing', async () => {
    atlas.updateBucketItem.mockResolvedValueOnce(null);
    atlas.deleteBucketItem.mockResolvedValueOnce(false);

    expect(await writes.updateBucketItem(7, 99, { name: 'Gone' })).toBeNull();
    expect(await writes.deleteBucketItem(7, 99)).toBe(false);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('ATLAS-WRITES-003: without a socket every tab hears it, and a write that throws sends nothing', async () => {
    await writes.markCountry(7, 'FR');
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(...changed(7, undefined));

    t.realtime.broadcastToUserMock.mockClear();
    atlas.createBucketItem.mockRejectedValueOnce(new Error('duplicate'));
    await expect(writes.createBucketItem(7, { name: 'Kyoto' })).rejects.toThrow('duplicate');
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();

    // The Dawarich confirmations announce through the same call after their own commit.
    writes.announce(9, 'sock-2');
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(...changed(9, 'sock-2'));
  });
});
