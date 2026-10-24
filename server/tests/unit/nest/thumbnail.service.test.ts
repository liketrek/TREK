/**
 * ThumbnailService — the downscaled JPEG for a locally uploaded journey photo.
 *
 * Untested before the fold, because it lived outside the measured tree. The
 * cases below pin the three things that decide whether a gallery shows a
 * picture or a broken tile: the addon gate, the "source is gone" bail-out, and
 * the mtime check that avoids regenerating an up-to-date thumbnail.
 */
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { ThumbnailService, journeyThumbName } from '../../../src/nest/memories/thumbnail.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { deleteRows, insertRow } from '../../helpers/factories/rows';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { Jimp } from 'jimp';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));

// Category-addressed since slice 4: originals + thumbs are ('journey', <name>)
// objects; the fixture's 'journey/' prefix reproduces the real layout, so the
// on-disk paths below look exactly like the old uploads-root ones.
const fx = makeStorageFixture('journey/');
// Full migrated schema now (Plan 3e Task 6): sweepOrphanThumbs reads through
// TrekPhotosRepository (the ORM one), which needs the real trek_photos table,
// not the three-column hand-rolled stand-in this file used before.
const thumbsDb = createSnapshotTestDb();
let t: TestOrm;
let svc: ThumbnailService;
const root = fx.root;

/** A real 1200x900 JPEG — Jimp has to be able to decode it for the happy path. */
async function writeSourceImage(rel: string): Promise<void> {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const img = new Jimp({ width: 1200, height: 900, color: 0xff0000ff });
  await img.write(abs as `${string}.jpg`);
}

beforeAll(async () => {
  t = await createTestOrm(thumbsDb);
  svc = new ThumbnailService({ isAddonEnabled } as unknown as AddonsService, fx.storage, t.repo(TrekPhotos));
});

beforeEach(() => {
  vi.clearAllMocks();
  isAddonEnabled.mockReturnValue(true);
});

afterAll(async () => {
  await t.close();
  thumbsDb.close();
  fx.cleanup();
});

describe('ensureLocalThumbnail', () => {
  it('THUMB-001: returns null when the journey addon is off, without touching the disk', async () => {
    isAddonEnabled.mockReturnValue(false);
    expect(await svc.ensureLocalThumbnail('anything.jpg')).toBeNull();
  });

  it('THUMB-002: returns null when the source object does not exist', async () => {
    expect(await svc.ensureLocalThumbnail('journey/missing.jpg')).toBeNull();
  });

  it('THUMB-002b: returns null for a path outside the journey category', async () => {
    expect(await svc.ensureLocalThumbnail('missing/nope.jpg')).toBeNull();
  });

  it('THUMB-003: downscales an oversized image and reports the resulting size', async () => {
    await writeSourceImage('journey/big.jpg');

    const result = await svc.ensureLocalThumbnail('journey/big.jpg');

    expect(result).not.toBeNull();
    expect(result!.thumbnailRelPath).toMatch(/^journey\/thumbs\/[0-9a-f]{16}\.jpg$/);
    // 1200x900 fits into an 800 box as 800x600.
    expect(Math.max(result!.width, result!.height)).toBeLessThanOrEqual(800);
    expect(fs.existsSync(path.join(root, result!.thumbnailRelPath))).toBe(true);
  });

  it('THUMB-004: the path is deterministic, so concurrent requests cannot race on two names', async () => {
    await writeSourceImage('journey/stable.jpg');

    const first = await svc.ensureLocalThumbnail('journey/stable.jpg');
    const second = await svc.ensureLocalThumbnail('journey/stable.jpg');

    expect(second!.thumbnailRelPath).toBe(first!.thumbnailRelPath);
  });

  it('THUMB-005: reuses an existing thumbnail that is newer than the source', async () => {
    await writeSourceImage('journey/cached.jpg');
    const first = await svc.ensureLocalThumbnail('journey/cached.jpg');
    const thumbAbs = path.join(root, first!.thumbnailRelPath);
    const mtimeBefore = fs.statSync(thumbAbs).mtimeMs;

    const second = await svc.ensureLocalThumbnail('journey/cached.jpg');

    expect(second).toEqual(first);
    expect(fs.statSync(thumbAbs).mtimeMs).toBe(mtimeBefore);
  });

  it('THUMB-006: regenerates when the source is newer than the thumbnail', async () => {
    await writeSourceImage('journey/changed.jpg');
    const first = await svc.ensureLocalThumbnail('journey/changed.jpg');
    const thumbAbs = path.join(root, first!.thumbnailRelPath);
    // Age the thumbnail past the source.
    const old = new Date(Date.now() - 60_000);
    fs.utimesSync(thumbAbs, old, old);

    const second = await svc.ensureLocalThumbnail('journey/changed.jpg');

    expect(second!.thumbnailRelPath).toBe(first!.thumbnailRelPath);
    expect(fs.statSync(thumbAbs).mtimeMs).toBeGreaterThan(old.getTime());
  });

  it('THUMB-007: returns null for a file Jimp cannot decode instead of throwing', async () => {
    const abs = path.join(root, 'journey/corrupt.jpg');
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, 'not an image at all');

    expect(await svc.ensureLocalThumbnail('journey/corrupt.jpg')).toBeNull();
  });
});

describe('sweepOrphanThumbs (spec fix #2)', () => {
  const thumbsDir = path.join(root, 'journey', 'thumbs');
  const writeThumb = (name: string): string => {
    fs.mkdirSync(thumbsDir, { recursive: true });
    const fp = path.join(thumbsDir, name);
    fs.writeFileSync(fp, 'jpeg');
    return fp;
  };

  beforeEach(async () => {
    await deleteRows(t, TrekPhotos);
    fs.rmSync(thumbsDir, { recursive: true, force: true });
  });

  it('THUMB-SWEEP-001: deletes strays, spares thumbs derivable from live journey rows', async () => {
    await insertRow(t, TrekPhotos, { provider: 'local', file_path: 'journey/live.jpg' });
    const liveName = journeyThumbName('journey/live.jpg'); // 'thumbs/<hash>.jpg'
    const livePath = writeThumb(path.basename(liveName));
    const strayPath = writeThumb('deadbeefdeadbeef.jpg');

    const removed = await svc.sweepOrphanThumbs();

    expect(fs.existsSync(livePath)).toBe(true);
    expect(fs.existsSync(strayPath)).toBe(false);
    expect(removed).toBe(1);
  });

  it('THUMB-SWEEP-002: spares a recorded thumbnail_path even without a matching file_path hash', async () => {
    await insertRow(t, TrekPhotos, {
      provider: 'local',
      file_path: 'elsewhere/x.jpg',
      thumbnail_path: 'journey/thumbs/recorded00000000.jpg',
    });
    const recorded = writeThumb('recorded00000000.jpg');

    const removed = await svc.sweepOrphanThumbs();

    expect(fs.existsSync(recorded)).toBe(true);
    expect(removed).toBe(0);
  });

  it('THUMB-SWEEP-003: the addon gate answers 0 without listing or deleting', async () => {
    isAddonEnabled.mockReturnValue(false);
    const stray = writeThumb('gatedstray000000.jpg');

    expect(await svc.sweepOrphanThumbs()).toBe(0);
    expect(fs.existsSync(stray)).toBe(true);
  });

  it('THUMB-SWEEP-004: non-jpg entries under thumbs/ are never touched', async () => {
    fs.mkdirSync(thumbsDir, { recursive: true });
    const note = path.join(thumbsDir, 'note.txt');
    fs.writeFileSync(note, 'not a thumb');

    expect(await svc.sweepOrphanThumbs()).toBe(0);
    expect(fs.existsSync(note)).toBe(true);
  });
});
