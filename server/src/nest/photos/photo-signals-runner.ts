import { colourSignals, type ColourSignals } from './photo-colour-signals';

import { Jimp } from 'jimp';

/**
 * The version of the measurement below. A stored row of another version is
 * measured again, so a better measurement never mixes with an older one.
 * Version 2 measures every photo at the same `SIGNAL_EDGE`, up or down;
 * version 3 adds the colours, the busy grid and the salient point.
 */
export const PHOTO_SIGNALS_ALGO = 3;

/**
 * The long edge every photo is scaled to, up or down, before it is measured. A
 * smaller picture has a higher Laplacian variance per pixel, so sharpness only
 * compares between photos measured at one size; this one is no larger than the
 * thumbnails the providers hand out (Immich about 250 px, Synology about 320).
 */
export const SIGNAL_EDGE = 240;

/** An image declaring more than this many megapixels is not decoded at all (a 48 MP decode takes about 200 MB). */
const MAX_DECODE_MP = 48;

/** Grey levels at or beyond these count as burnt out or crushed black. */
const CLIP_LOW = 5;
const CLIP_HIGH = 250;

/** What a photo's pixels say. `width`/`height` are the decoded image's, before it is scaled to measure. */
export interface PhotoPixels extends ColourSignals {
  /** The perceptual hash, 64 bits as 16 hex digits; null if the hash came out in another shape. */
  phash: string | null;
  /** The variance of the grey Laplacian at `SIGNAL_EDGE`: the higher, the sharper. */
  sharpness: number;
  /** The mean grey level, 0 (black) to 1 (white). */
  luma: number;
  /** The share of pixels burnt out or crushed black, 0 to 1. */
  clipped: number;
  width: number;
  height: number;
}

/**
 * Measures one photo. CPU work on a decoded bitmap, so the server runs it in
 * its worker thread (photo-signals.worker.ts), never on the event loop.
 * Answers null for bytes that are no image TREK decodes (WebP, HEIC, TIFF, a
 * video, anything past `MAX_DECODE_MP`): such a photo has no pixel signals.
 */
export async function measurePhoto(bytes: Uint8Array): Promise<PhotoPixels | null> {
  if (!withinDecodeCap(bytes)) return null;
  try {
    const image = await Jimp.read(Buffer.from(bytes), { 'image/jpeg': { maxResolutionInMP: MAX_DECODE_MP } });
    const { width, height } = image.bitmap;
    if (width < 3 || height < 3) return null;
    image.scaleToFit({ w: SIGNAL_EDGE, h: SIGNAL_EDGE });
    // A strip far longer than it is wide ends up under 3 pixels across, which leaves no inner pixel.
    if (image.bitmap.width < 3 || image.bitmap.height < 3) return null;
    const { data, width: w, height: h } = image.bitmap;
    const grey = greyStats(data, w, h);
    return { phash: bitsToHex(image.pHash()), ...grey, ...colourSignals(data, w, h), width, height };
  } catch {
    return null;
  }
}

/**
 * Whether these bytes may be decoded: a JPEG, which Jimp holds to
 * `MAX_DECODE_MP` itself, or a PNG, GIF or BMP whose header declares at most
 * that many pixels. A small file can declare a canvas of gigabytes, and the
 * decoder allocates all of it before the first pixel, so the size is read
 * first. Anything else (TIFF among the formats Jimp reads) is not decoded.
 */
export function withinDecodeCap(bytes: Uint8Array): boolean {
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return true;
  const size = declaredSize(data);
  return size !== null && size.width * size.height <= MAX_DECODE_MP * 1_000_000;
}

/** The canvas a PNG (IHDR), GIF (logical screen) or BMP (info or core header) declares; null for anything else. */
function declaredSize(data: Buffer): { width: number; height: number } | null {
  if (data.length >= 24 && data.readUInt32BE(0) === 0x89504e47) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (data.length >= 10 && data.toString('latin1', 0, 4) === 'GIF8') {
    return { width: data.readUInt16LE(6), height: data.readUInt16LE(8) };
  }
  if (data.length >= 26 && data.toString('latin1', 0, 2) === 'BM') {
    // The old core header holds two 16-bit sides, every later one two signed 32-bit ones (negative: top-down).
    if (data.readUInt32LE(14) === 12) return { width: data.readUInt16LE(18), height: data.readUInt16LE(20) };
    return { width: Math.abs(data.readInt32LE(18)), height: Math.abs(data.readInt32LE(22)) };
  }
  return null;
}

/**
 * Brightness, clipping and sharpness from one pass over the grey image. The
 * Laplacian is summed by hand rather than through Jimp's `convolute`, which
 * clamps every result to 0..255 and so loses the negative half of each edge.
 * The caller hands in at least 3 x 3 pixels, so there is an inner pixel.
 */
function greyStats(data: Uint8Array, width: number, height: number) {
  const total = width * height;
  const grey = new Float32Array(total);
  let sum = 0;
  let clipped = 0;
  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const y = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    grey[i] = y;
    sum += y;
    if (y <= CLIP_LOW || y >= CLIP_HIGH) clipped++;
  }
  // Welford's running variance over the inner pixels, so no second pass is needed.
  let n = 0;
  let mean = 0;
  let m2 = 0;
  const at = (k: number) => grey[k];
  for (let row = 1; row < height - 1; row++) {
    for (let col = 1; col < width - 1; col++) {
      const i = row * width + col;
      const lap = at(i - 1) + at(i + 1) + at(i - width) + at(i + width) - 4 * at(i);
      n++;
      const delta = lap - mean;
      mean += delta / n;
      m2 += delta * (lap - mean);
    }
  }
  return {
    sharpness: round(m2 / n, 2),
    luma: round(sum / (total * 255), 4),
    clipped: round(clipped / total, 4),
  };
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** Jimp's pHash is 64 characters of 0 and 1; stored as 16 hex digits. */
export function bitsToHex(bits: string): string | null {
  if (!/^[01]{64}$/.test(bits)) return null;
  let out = '';
  for (let i = 0; i < 64; i += 4) out += Number.parseInt(bits.slice(i, i + 4), 2).toString(16);
  return out;
}

/** Measures photos: in a worker thread in production, on the calling thread in tests. */
export interface PhotoSignalsRunner {
  measure(bytes: Uint8Array): Promise<PhotoPixels | null>;
  close(): Promise<void>;
}

export const PHOTO_SIGNALS_RUNNER = Symbol('PHOTO_SIGNALS_RUNNER');

/** The runner on the calling thread, for the tests (the TypeScript sources ship no compiled worker script). */
export class InlinePhotoSignalsRunner implements PhotoSignalsRunner {
  measure(bytes: Uint8Array): Promise<PhotoPixels | null> {
    return measurePhoto(bytes);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
