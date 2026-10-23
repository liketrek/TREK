/**
 * suggest_book_photos (JBPHOTO-*): photos of a journey's gallery for its book,
 * through JourneyBookPhotosMcp and JourneyBookPhotosService. Taken from
 * JourneyBookModule over a snapshot test db; the photo bytes come from a
 * stubbed resolver and are measured on the calling thread.
 *
 * What it pins: the tool waits for the Journey addon and only reads; any
 * member may ask and an outsider is told the journey is not there; the picks
 * follow the entries (their day, their place, their id) and the book (a photo
 * on a page says so); a video is never suggested; a photo whose provider does
 * not answer is still suggested and counted under signals_pending; a link to
 * a dismissed entry names nothing; an entry of another journey is refused; the
 * photos an entry narrows to are measured first, the rest is not waited for.
 */
import { JourneyEntryPhotos } from '../../../src/db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { JourneyBookPhotosMcp } from '../../../src/nest/journey/journey-book-photos.mcp';
import { JourneyBookMcp } from '../../../src/nest/journey/journey-book.mcp';
import { JourneyBookModule } from '../../../src/nest/journey/journey-book.module';
import { PhotoResolverService, type PhotoSignalSource } from '../../../src/nest/memories/photo-resolver.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../helpers/factories/journeys';
import { insertRow } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { bookPhotoSuggestionsSchema } from '@trek/shared';

import { Jimp } from 'jimp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const resolver = { readForSignals: vi.fn<(photoId: number, maxBytes: number) => Promise<PhotoSignalSource>>() };
let t: TestModule;
let orm: TestOrm;
let mcp: JourneyBookPhotosMcp;
let jpeg: Buffer;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyBookModule],
    overrides: [{ provide: PhotoResolverService, useValue: resolver }],
  });
  mcp = t.get(JourneyBookPhotosMcp);
  orm = await createTestOrm(db);
  // Large enough to print on a page, so a measured photo is not set aside as low resolution.
  jpeg = Buffer.from(await new Jimp({ width: 1600, height: 1200, color: 0x6699ccff }).getBuffer('image/jpeg'));
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  resolver.readForSignals.mockReset();
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }> }) {
  return bookPhotoSuggestionsSchema.parse(JSON.parse(result.content[0]?.text ?? ''));
}

/** A photo in the journey's gallery; answers its trek_photos id and its gallery row id. */
async function galleryPhoto(journeyId: number, ownerId: number, over: { taken_at?: string; media_type?: string } = {}) {
  const photoId = await insertRow(orm, TrekPhotos, {
    provider: 'local',
    owner: ownerId,
    file_path: 'journey/p.jpg',
    ...over,
  });
  const galleryId = await insertRow(orm, JourneyPhotos, {
    journey: journeyId,
    photo: photoId,
    sort_order: 0,
    created_at: Date.now(),
  });
  return { photoId, galleryId };
}

describe('JourneyBookPhotosMcp', () => {
  it('JBPHOTO-001: the tool waits for the Journey addon and reads in the journey group', async () => {
    const { user } = await makeUser(orm);
    const entry = getEntry(JourneyBookPhotosMcp as unknown as ClassRef, 'suggestBookPhotos');
    if (entry?.kind !== 'tool') throw new Error('suggestBookPhotos is no tool');
    expect(entry.options.name).toBe('suggest_book_photos');
    expect(entry.options.access).toEqual({ group: 'journey', mode: 'read' });
    expect(entry.options.annotations?.readOnlyHint).toBe(true);
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled');
    enabled.mockResolvedValue(false);
    expect(await entry.options.when?.(ctx(user.id), mcp)).toBe(false);
    enabled.mockResolvedValue(true);
    expect(await entry.options.when?.(ctx(user.id), mcp)).toBe(true);
  });

  it('JBPHOTO-002: any member may ask, an outsider is told the journey is not there', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: viewer } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
    resolver.readForSignals.mockResolvedValue({ kind: 'original', bytes: jpeg });
    const { photoId } = await galleryPhoto(journey.id, owner.id, { taken_at: '2026-07-03T10:00:00' });

    const answer = read(await mcp.suggestBookPhotos({ journeyId: journey.id }, ctx(viewer.id)));
    expect(answer.groups.map((g) => [g.day, g.picks.map((p) => p.photoId)])).toEqual([['2026-07-03', [photoId]]]);
    expect(answer.signals_pending).toBe(0);
    await expect(mcp.suggestBookPhotos({ journeyId: journey.id }, ctx(stranger.id))).rejects.toThrow(
      'Journey not found',
    );
    await expect(mcp.suggestBookPhotos({ journeyId: 999999 }, ctx(owner.id))).rejects.toThrow('Journey not found');
  });

  it('JBPHOTO-003: picks follow the entries and the book, leave videos out and count what is still unmeasured', async () => {
    const { user: owner } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    const alfama = await makeJourneyEntry(orm, journey.id, owner.id, {
      entry_date: '2026-07-03',
      location_name: 'Alfama',
      location_lat: 38.7118,
      location_lng: -9.13,
    });
    const linked = await galleryPhoto(journey.id, owner.id);
    await insertRow(orm, JourneyEntryPhotos, {
      entry: alfama.id,
      journeyPhoto: linked.galleryId,
      sort_order: 0,
      created_at: Date.now(),
    });
    const cover = await galleryPhoto(journey.id, owner.id, { taken_at: '2026-07-04T10:00:00' });
    const offline = await galleryPhoto(journey.id, owner.id, { taken_at: '2026-07-04T15:00:00' });
    await galleryPhoto(journey.id, owner.id, { taken_at: '2026-07-04T12:00:00', media_type: 'video' });
    // A dismissed entry is not listed by get_journey, so its link must not name the group either.
    const dismissed = await makeJourneyEntry(orm, journey.id, owner.id, {
      entry_date: '2026-07-04',
      location_name: 'Hidden',
      dismissed: 1,
    });
    await insertRow(orm, JourneyEntryPhotos, {
      entry: dismissed.id,
      journeyPhoto: offline.galleryId,
      sort_order: 0,
      created_at: Date.now(),
    });
    resolver.readForSignals.mockImplementation((photoId) =>
      Promise.resolve<PhotoSignalSource>(
        photoId === offline.photoId ? { kind: 'unavailable' } : { kind: 'original', bytes: jpeg },
      ),
    );
    const books = t.get(JourneyBookMcp);
    await books.createBook({ journeyId: journey.id }, ctx(owner.id));
    await books.setBookCover({ journeyId: journey.id, photoId: cover.photoId }, ctx(owner.id));

    const answer = read(await mcp.suggestBookPhotos({ journeyId: journey.id }, ctx(owner.id)));
    expect(answer.groups.map((g) => [g.day, g.place, g.entryId, g.picks.map((p) => p.photoId)])).toEqual([
      ['2026-07-03', 'Alfama', alfama.id, [linked.photoId]],
      ['2026-07-04', null, null, [cover.photoId, offline.photoId]],
    ]);
    expect(answer.groups[1]?.picks[0]?.why).toEqual(['landscape', 'in the book already']);
    expect(answer.groups[1]?.picks[1]?.why).toEqual(['not in the book yet']);
    expect(answer.signals_pending).toBe(1);

    const one = read(await mcp.suggestBookPhotos({ journeyId: journey.id, entryId: alfama.id }, ctx(owner.id)));
    expect(one.groups.map((g) => g.picks.map((p) => p.photoId))).toEqual([[linked.photoId]]);
    const other = await makeJourney(orm, owner.id);
    const elsewhere = await makeJourneyEntry(orm, other.id, owner.id);
    const refused = mcp.suggestBookPhotos({ journeyId: journey.id, entryId: elsewhere.id }, ctx(owner.id));
    await expect(refused).rejects.toMatchObject({ status: 404, message: `No entry ${elsewhere.id} in this journey` });
  });

  it('JBPHOTO-004: the photos an entry narrows to are measured first, and the rest of the gallery is not waited for', async () => {
    const { user: owner } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    const day = await makeJourneyEntry(orm, journey.id, owner.id, { entry_date: '2026-07-05' });
    const elsewhere = await galleryPhoto(journey.id, owner.id, { taken_at: '2026-07-01T10:00:00' });
    const asked = await galleryPhoto(journey.id, owner.id, { taken_at: '2026-07-05T10:00:00' });
    resolver.readForSignals.mockImplementation((photoId) =>
      Promise.resolve<PhotoSignalSource>(
        photoId === asked.photoId ? { kind: 'original', bytes: jpeg } : { kind: 'unavailable' },
      ),
    );

    const answer = read(await mcp.suggestBookPhotos({ journeyId: journey.id, entryId: day.id }, ctx(owner.id)));
    expect(answer.groups.map((g) => g.picks.map((p) => p.photoId))).toEqual([[asked.photoId]]);
    expect(answer.signals_pending).toBe(0);
    expect(resolver.readForSignals.mock.calls[0]?.[0]).toBe(asked.photoId);
    await vi.waitFor(() => expect(resolver.readForSignals).toHaveBeenCalledWith(elsewhere.photoId, expect.any(Number)));
  });
});
