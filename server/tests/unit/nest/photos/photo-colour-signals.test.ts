/**
 * The colour signals of a photo (PHSIG3-*), on pixels drawn here: a picture
 * half flat and half textured has its busy cells and its salient point on
 * the textured side, a two-colour picture has both colours in its palette
 * with their shares (two equal ones always in the same order), a flat one has
 * one colour, no salient point and a calm grid, the smallest picture is busy
 * only around its one inner pixel; the measurement of a whole photo carries
 * them, at version 3.
 */
import { colourSignals, edgeSignals, paletteOf } from '../../../../src/nest/photos/photo-colour-signals';
import { measurePhoto, PHOTO_SIGNALS_ALGO } from '../../../../src/nest/photos/photo-signals-runner';

import { Jimp } from 'jimp';
import { describe, expect, it } from 'vitest';

type Rgb = [number, number, number];

/** RGBA pixels of `width` x `height`, each drawn by `paint`. */
function pixels(width: number, height: number, paint: (x: number, y: number) => Rgb): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y);
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  }
  return data;
}

/** Flat grey on the left half, a two-pixel black and white check on the right. */
const halfBusy = (x: number, y: number): Rgb => {
  if (x < 64) return [128, 128, 128];
  const light = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
  return light ? [255, 255, 255] : [0, 0, 0];
};

describe('colour signals', () => {
  it('PHSIG3-001: the busy cells and the salient point sit on the textured half', () => {
    const { busy, salX, salY } = edgeSignals(pixels(128, 96, halfBusy), 128, 96);
    expect(busy).toMatch(/^[0-9a-f]{64}$/);
    const rows = Array.from({ length: 8 }, (_, r) => busy?.slice(r * 8, r * 8 + 8) ?? '');
    for (const row of rows) {
      expect(row.slice(0, 3)).toBe('000');
      expect(row.slice(5)).toBe('fff');
    }
    expect(salX).toBeGreaterThan(0.6);
    expect(salY).toBeGreaterThan(0.4);
    expect(salY).toBeLessThan(0.6);
  });

  it('PHSIG3-002: a two-colour picture has both colours with their shares, the larger first', () => {
    const palette = paletteOf(
      pixels(100, 100, (x) => (x < 70 ? [200, 30, 30] : [20, 40, 220])),
      100,
      100,
    );
    expect(palette).toEqual(['#c81e1e:0.70', '#1428dc:0.30']);
  });

  it('PHSIG3-003: a flat picture has one colour, a calm grid and no salient point', () => {
    const flat = colourSignals(
      pixels(40, 30, () => [10, 200, 120]),
      40,
      30,
    );
    expect(flat).toEqual({ palette: ['#0ac878:1.00'], busy: '0'.repeat(64), salX: null, salY: null });
    expect(paletteOf(new Uint8Array(0), 0, 0)).toBeNull();
  });

  it('PHSIG3-004: a measured photo carries its colours, its grid and its salient point, at version 3', async () => {
    const image = new Jimp({ width: 256, height: 192, color: 0xffffffff });
    image.bitmap.data.set(pixels(256, 192, (x, y) => halfBusy(Math.floor(x / 2), Math.floor(y / 2))));
    const measured = await measurePhoto(new Uint8Array(await image.getBuffer('image/png')));
    expect(PHOTO_SIGNALS_ALGO).toBe(3);
    expect(measured?.palette?.length).toBeGreaterThan(0);
    expect(measured?.palette?.[0]).toMatch(/^#[0-9a-f]{6}:(0|1)\.\d{2}$/);
    expect(measured?.busy).toMatch(/^[0-9a-f]{64}$/);
    expect(measured?.salX).toBeGreaterThan(0.6);
  });

  it('PHSIG3-005: on the smallest picture only the cell holding the one inner pixel can be busy', () => {
    const dot = edgeSignals(
      pixels(3, 3, (x, y) => (x === 1 && y === 1 ? [255, 255, 255] : [0, 0, 0])),
      3,
      3,
    );
    expect(dot).toEqual({ busy: `${'0'.repeat(18)}f${'0'.repeat(45)}`, salX: 0.5, salY: 0.5 });
  });

  it('PHSIG3-006: two colours of equal share come out in one order every time, the lower histogram bin first', () => {
    const halves = pixels(100, 100, (x) => (x < 50 ? [200, 30, 30] : [20, 40, 220]));
    expect(paletteOf(halves, 100, 100)).toEqual(['#1428dc:0.50', '#c81e1e:0.50']);
  });
});
