/**
 * ThumbnailService — the downscaled JPEG for a locally uploaded journey photo.
 *
 * Untested before the fold, because it lived outside the measured tree. The
 * cases below pin the three things that decide whether a gallery shows a
 * picture or a broken tile: the addon gate, the "source is gone" bail-out, and
 * the mtime check that avoids regenerating an up-to-date thumbnail.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Jimp } from 'jimp';
import { ThumbnailService } from '../../../src/nest/memories/thumbnail.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';

const svc = new ThumbnailService({ isAddonEnabled } as unknown as AddonsService);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-thumbs-'));

/** A real 1200x900 JPEG — Jimp has to be able to decode it for the happy path. */
async function writeSourceImage(rel: string): Promise<void> {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const img = new Jimp({ width: 1200, height: 900, color: 0xff0000ff });
  await img.write(abs as `${string}.jpg`);
}

beforeEach(() => {
  vi.clearAllMocks();
  isAddonEnabled.mockReturnValue(true);
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('ensureLocalThumbnail', () => {
  it('THUMB-001: returns null when the journey addon is off, without touching the disk', async () => {
    isAddonEnabled.mockReturnValue(false);
    expect(await svc.ensureLocalThumbnail(root, 'anything.jpg')).toBeNull();
  });

  it('THUMB-002: returns null when the source file does not exist', async () => {
    expect(await svc.ensureLocalThumbnail(root, 'missing/nope.jpg')).toBeNull();
  });

  it('THUMB-003: downscales an oversized image and reports the resulting size', async () => {
    await writeSourceImage('journey/big.jpg');

    const result = await svc.ensureLocalThumbnail(root, 'journey/big.jpg');

    expect(result).not.toBeNull();
    expect(result!.thumbnailRelPath).toMatch(/^journey\/thumbs\/[0-9a-f]{16}\.jpg$/);
    // 1200x900 fits into an 800 box as 800x600.
    expect(Math.max(result!.width, result!.height)).toBeLessThanOrEqual(800);
    expect(fs.existsSync(path.join(root, result!.thumbnailRelPath))).toBe(true);
  });

  it('THUMB-004: the path is deterministic, so concurrent requests cannot race on two names', async () => {
    await writeSourceImage('journey/stable.jpg');

    const first = await svc.ensureLocalThumbnail(root, 'journey/stable.jpg');
    const second = await svc.ensureLocalThumbnail(root, 'journey/stable.jpg');

    expect(second!.thumbnailRelPath).toBe(first!.thumbnailRelPath);
  });

  it('THUMB-005: reuses an existing thumbnail that is newer than the source', async () => {
    await writeSourceImage('journey/cached.jpg');
    const first = await svc.ensureLocalThumbnail(root, 'journey/cached.jpg');
    const thumbAbs = path.join(root, first!.thumbnailRelPath);
    const mtimeBefore = fs.statSync(thumbAbs).mtimeMs;

    const second = await svc.ensureLocalThumbnail(root, 'journey/cached.jpg');

    expect(second).toEqual(first);
    expect(fs.statSync(thumbAbs).mtimeMs).toBe(mtimeBefore);
  });

  it('THUMB-006: regenerates when the source is newer than the thumbnail', async () => {
    await writeSourceImage('journey/changed.jpg');
    const first = await svc.ensureLocalThumbnail(root, 'journey/changed.jpg');
    const thumbAbs = path.join(root, first!.thumbnailRelPath);
    // Age the thumbnail past the source.
    const old = new Date(Date.now() - 60_000);
    fs.utimesSync(thumbAbs, old, old);

    const second = await svc.ensureLocalThumbnail(root, 'journey/changed.jpg');

    expect(second!.thumbnailRelPath).toBe(first!.thumbnailRelPath);
    expect(fs.statSync(thumbAbs).mtimeMs).toBeGreaterThan(old.getTime());
  });

  it('THUMB-007: returns null for a file Jimp cannot decode instead of throwing', async () => {
    const abs = path.join(root, 'journey/corrupt.jpg');
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, 'not an image at all');

    expect(await svc.ensureLocalThumbnail(root, 'journey/corrupt.jpg')).toBeNull();
  });
});
