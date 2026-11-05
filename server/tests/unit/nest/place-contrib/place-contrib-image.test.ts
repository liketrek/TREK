/**
 * A place picture as it is sent: at most 2048 px on its long edge, a JPEG
 * without the camera's metadata, at most a megabyte, or nothing.
 */
import { contribJpeg } from '../../../../src/nest/place-contrib/place-contrib-image';
import { IMAGE_MAX_BYTES, IMAGE_MAX_EDGE } from '../../../../src/nest/place-contrib/place-contrib.constants';
import { jpegWithExif } from '../../../helpers/exif-jpeg';

import { Jimp } from 'jimp';
import { describe, expect, it } from 'vitest';

async function picture(
  width: number,
  height: number,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Buffer> {
  return Buffer.from(await new Jimp({ width, height, color: 0x336699ff }).getBuffer(mime));
}

describe('contribJpeg', () => {
  it('PCI-001: shrinks a large picture to the long edge and keeps its proportions', async () => {
    const out = await contribJpeg(await picture(4000, 1000));
    expect(out).not.toBeNull();
    const decoded = await Jimp.read(out ?? Buffer.alloc(0));
    expect(decoded.width).toBe(IMAGE_MAX_EDGE);
    expect(decoded.height).toBe(512);
    expect(out?.length).toBeLessThanOrEqual(IMAGE_MAX_BYTES);
  });

  it('PCI-002: a portrait is held by its height, a small picture keeps its size, a PNG becomes a JPEG', async () => {
    const tall = await Jimp.read((await contribJpeg(await picture(500, 3000))) ?? Buffer.alloc(0));
    expect(tall.height).toBe(IMAGE_MAX_EDGE);
    const small = await contribJpeg(await picture(64, 48, 'image/png'));
    expect(small?.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
    const decoded = await Jimp.read(small ?? Buffer.alloc(0));
    expect([decoded.width, decoded.height]).toEqual([64, 48]);
  });

  it('PCI-003: the camera metadata does not survive', async () => {
    const withExif = jpegWithExif({ DateTimeOriginal: '2026:05:30 15:52:19', gps: { lat: 54.08, lng: 12.13 } });
    expect(withExif.includes(Buffer.from('Exif'))).toBe(true);
    const out = await contribJpeg(withExif);
    expect(out).not.toBeNull();
    expect(out?.includes(Buffer.from('Exif'))).toBe(false);
  });

  it('PCI-004: what cannot be read is not sent', async () => {
    expect(await contribJpeg(Buffer.from('not a picture'))).toBeNull();
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(32)]);
    expect(await contribJpeg(webp)).toBeNull();
  });
});
