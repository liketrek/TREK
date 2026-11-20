/**
 * PublicMediaService: the location-free copies every public byte path sends.
 *
 * Storage is a small stand-in over a temp folder, so the copy, the reuse, the
 * rebuild after a change and the sweep all run on real files; the journey
 * mount gate reads real journeys and photo rows.
 */
import { Journeys } from '../../../../src/db/entities/Journeys.entity';
import { TrekPhotos } from '../../../../src/db/entities/TrekPhotos.entity';
import { PublicMediaService } from '../../../../src/nest/memories/public-media.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { StorageNotFoundError } from '../../../../src/nest/storage/storage.types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { jpegWithExif } from '../../../helpers/exif-jpeg';
import { makeJourney } from '../../../helpers/factories/journeys';
import { insertRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import exifr from 'exifr';
import { Jimp } from 'jimp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let service: PublicMediaService;
let root: string;

const at = (category: string, name: string) => path.join(root, category, name);

async function existsOnDisk(category: string, name: string): Promise<boolean> {
  return fs.existsSync(at(category, name));
}

/** The slice of StorageService the copies use, over plain files under `root`. */
const storage = {
  stat: vi.fn(async (category: string, name: string) => {
    const stat = await fs.promises.stat(at(category, name)).catch(() => null);
    return stat ? { key: name, size: stat.size, mtimeMs: stat.mtimeMs } : null;
  }),
  exists: vi.fn(existsOnDisk),
  withLocalFile: vi.fn(async (category: string, name: string, fn: (abs: string) => Promise<unknown>) =>
    fn(at(category, name)),
  ),
  spoolDirFor: vi.fn(() => path.join(root, '.spool')),
  put: vi.fn(async (category: string, name: string, source: { tmpPath: string }) => {
    fs.mkdirSync(path.dirname(at(category, name)), { recursive: true });
    fs.renameSync(source.tmpPath, at(category, name));
  }),
  list: vi.fn(async function* (category: string, prefix: string) {
    const dir = at(category, prefix);
    for (const entry of fs.existsSync(dir) ? fs.readdirSync(dir) : [])
      yield { key: prefix + entry, size: 0, mtimeMs: 0 };
  }),
  keepsOnDelete: vi.fn(() => false),
  delete: vi.fn(async (category: string, name: string) => fs.rmSync(at(category, name), { force: true })),
};

function write(category: string, name: string, bytes: Buffer): void {
  fs.mkdirSync(path.dirname(at(category, name)), { recursive: true });
  fs.writeFileSync(at(category, name), bytes);
}

const phonePhoto = () => jpegWithExif({ gps: { lat: 49.274523, lng: -0.703421 }, Orientation: 6 });

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [MikroOrmModule.forFeature([Journeys, TrekPhotos])],
    providers: [PublicMediaService, { provide: StorageService, useValue: storage }],
  });
  service = t.get(PublicMediaService);
});

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'public-media-'));
  fs.mkdirSync(path.join(root, '.spool'));
  vi.clearAllMocks();
});

afterAll(async () => {
  await t.close();
  db.close();
});

describe('renditionFor', () => {
  it('PMEDIA-001: makes the copy without GPS once, reuses it, and remakes it after the source changes', async () => {
    write('journey', 'a.jpg', phonePhoto());

    expect(await service.renditionFor('journey', 'a.jpg')).toBe('public/a.jpg');
    const copy = fs.readFileSync(at('journey', 'public/a.jpg'));
    expect(await exifr.gps(copy)).toBeUndefined();
    expect(await exifr.orientation(copy)).toBe(6);
    // The original stays as it was.
    expect((await exifr.gps(fs.readFileSync(at('journey', 'a.jpg'))))?.latitude).toBeCloseTo(49.274523, 5);

    expect(await service.renditionFor('journey', 'a.jpg')).toBe('public/a.jpg');
    expect(storage.put).toHaveBeenCalledTimes(1);

    const later = new Date(Date.now() + 60_000);
    fs.utimesSync(at('journey', 'a.jpg'), later, later);
    expect(await service.renditionFor('journey', 'a.jpg')).toBe('public/a.jpg');
    expect(storage.put).toHaveBeenCalledTimes(2);
  });

  it('PMEDIA-002: two requests at once share one copy', async () => {
    write('covers', 'b.jpg', phonePhoto());
    const both = await Promise.all([service.renditionFor('covers', 'b.jpg'), service.renditionFor('covers', 'b.jpg')]);
    expect(both).toEqual(['public/b.jpg', 'public/b.jpg']);
    expect(storage.put).toHaveBeenCalledTimes(1);
  });

  it('PMEDIA-003: refuses what it can neither clean nor re-encode, a copy by its own name, and a source that is gone', async () => {
    write('photos', 'c.bmp', Buffer.from(`BM${'x'.repeat(40)}`));
    expect(await service.renditionFor('photos', 'c.bmp')).toBeNull();
    expect(fs.existsSync(at('photos', 'public/c.bmp'))).toBe(false);
    // An old QuickTime file without a movie header TREK could walk: no copy, no re-encode.
    const wide = Buffer.alloc(16);
    wide.writeUInt32BE(16, 0);
    wide.write('wide', 4, 'latin1');
    write('journey', 'clip.mov', Buffer.concat([wide, Buffer.from('trailing', 'latin1')]));
    expect(await service.renditionFor('journey', 'clip.mov')).toBeNull();
    // Nothing is left in the spool either.
    expect(fs.readdirSync(path.join(root, '.spool'))).toEqual([]);

    expect(await service.renditionFor('photos', 'public/c.bmp')).toBeNull();
    await expect(service.renditionFor('photos', 'gone.jpg')).rejects.toBeInstanceOf(StorageNotFoundError);
  });
});

describe('renditionFor re-encode fallback', () => {
  it('PMEDIA-004: an image whose metadata cannot be cleaned is re-encoded instead of refused', async () => {
    const image = new Jimp({ width: 4, height: 2, color: 0x336699ff });
    const bmp = await image.getBuffer('image/bmp');
    write('avatars', 'old.bmp', bmp);

    expect(await service.renditionFor('avatars', 'old.bmp')).toBe('public/old.bmp');
    const copy = await Jimp.read(fs.readFileSync(at('avatars', 'public/old.bmp')));
    expect(copy.bitmap.width).toBe(4);
    expect(copy.bitmap.height).toBe(2);
  });

  it('PMEDIA-005: a JPEG with a broken XMP packet goes out re-encoded, without its GPS', async () => {
    const broken = Buffer.from('<x:xmpmeta><rdf:RDF><rdf:Description exif:GPSLatitude="49', 'latin1');
    const app1 = Buffer.alloc(4);
    app1.writeUInt16BE(0xffe1, 0);
    const payload = Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), broken]);
    app1.writeUInt16BE(payload.length + 2, 2);
    const plain = await new Jimp({ width: 3, height: 3, color: 0xffffffff }).getBuffer('image/jpeg');
    const photo = Buffer.concat([plain.subarray(0, 2), app1, payload, plain.subarray(2)]);
    write('covers', 'xmp.jpg', photo);

    expect(await service.renditionFor('covers', 'xmp.jpg')).toBe('public/xmp.jpg');
    const copy = fs.readFileSync(at('covers', 'public/xmp.jpg'));
    expect(copy.toString('latin1')).not.toContain('GPSLatitude');
    expect((await Jimp.read(copy)).bitmap.width).toBe(3);
  });
});

describe('servesFromJourneyMount', () => {
  it('PMEDIA-010: serves covers in either spelling and other objects, refuses entry media and thumbs', async () => {
    const orm = t.get(MikroORM);
    const { user } = await makeUser(orm);
    await makeJourney(orm, user.id, { cover_image: 'journey/cover-one.jpg' });
    await makeJourney(orm, user.id, { cover_image: '/uploads/journey/cover-two.jpg' });
    await insertRow(orm, TrekPhotos, {
      provider: 'local',
      file_path: 'journey/entry-clip.mp4',
      thumbnail_path: 'journey/entry-poster.jpg',
    });
    // An entry photo picked as the journey's cover is served as the cover.
    await insertRow(orm, TrekPhotos, { provider: 'local', file_path: 'journey/cover-one.jpg' });

    expect(await service.servesFromJourneyMount('cover-one.jpg')).toBe(true);
    expect(await service.servesFromJourneyMount('cover-two.jpg')).toBe(true);
    // Not a journey's media at all, for example a trip cover pointing here.
    expect(await service.servesFromJourneyMount('trip-cover.jpg')).toBe(true);

    expect(await service.servesFromJourneyMount('entry-clip.mp4')).toBe(false);
    expect(await service.servesFromJourneyMount('entry-poster.jpg')).toBe(false);
    expect(await service.servesFromJourneyMount('thumbs/0123456789abcdef.jpg')).toBe(false);
  });
});

describe('sweepOrphans', () => {
  it('PMEDIA-020: drops the copies whose source is gone and keeps the rest', async () => {
    write('avatars', 'kept.jpg', phonePhoto());
    write('avatars', 'public/kept.jpg', Buffer.from('copy'));
    write('avatars', 'public/orphan.jpg', Buffer.from('copy'));
    write('places', 'public/orphan.png', Buffer.from('copy'));

    expect(await service.sweepOrphans()).toBe(2);

    expect(fs.existsSync(at('avatars', 'public/kept.jpg'))).toBe(true);
    expect(fs.existsSync(at('avatars', 'public/orphan.jpg'))).toBe(false);
    expect(fs.existsSync(at('places', 'public/orphan.png'))).toBe(false);
  });

  it('PMEDIA-022: a large sweep checks its copies in bounded batches', async () => {
    for (let i = 0; i < 70; i++) write('journey', `public/gone-${i}.jpg`, Buffer.from('copy'));
    let running = 0;
    let peak = 0;
    storage.exists.mockImplementation(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setImmediate(resolve));
      running--;
      return false;
    });

    try {
      expect(await service.sweepOrphans()).toBe(70);
    } finally {
      storage.exists.mockImplementation(existsOnDisk);
    }
    expect(peak).toBeLessThanOrEqual(32);
    expect(peak).toBeGreaterThan(1);
  });

  it('PMEDIA-021: a copy a demo instance keeps, or one whose delete fails, is not counted', async () => {
    write('covers', 'public/demo.jpg', Buffer.from('copy'));
    storage.keepsOnDelete.mockReturnValueOnce(true);
    expect(await service.sweepOrphans()).toBe(0);
    expect(fs.existsSync(at('covers', 'public/demo.jpg'))).toBe(true);

    storage.delete.mockRejectedValueOnce(new Error('busy'));
    expect(await service.sweepOrphans()).toBe(0);
  });
});
