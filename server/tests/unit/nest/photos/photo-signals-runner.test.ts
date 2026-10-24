/**
 * Measuring a photo's pixels (PHSIG-*): on photos Jimp draws here, a sharp
 * scene against the same scene blurred, a copy shifted by a few pixels against
 * the scene inverted, plain white and black, one scene drawn at a thumbnail's
 * size and at an original's, bytes that are no image, and headers declaring a
 * canvas too large to decode. Then the thread script, the runner that talks to
 * a thread (with small threads the test writes that answer, fail, hang, die or
 * never start) and the factory that picks the thread or the calling thread.
 */
import {
  bitsToHex,
  InlinePhotoSignalsRunner,
  measurePhoto,
  SIGNAL_EDGE,
  withinDecodeCap,
} from '../../../../src/nest/photos/photo-signals-runner';
import { photoSignalsRunner } from '../../../../src/nest/photos/photo-signals.module';
import {
  MAX_WAITING_PHOTOS,
  MEASURE_TIMEOUT_MS,
  WorkerPhotoSignalsRunner,
} from '../../../../src/nest/photos/worker-photo-signals-runner';
import { hashDistance } from '@trek/shared';

import { Jimp } from 'jimp';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/** The thread's port, as its script sees it: messages in, messages out. */
const port = vi.hoisted(() => {
  const listeners: Array<(message: unknown) => void> = [];
  return {
    on: (event: string, listener: (message: unknown) => void) => {
      if (event === 'message') listeners.push(listener);
    },
    emit: (_event: 'message', message: unknown) => listeners.forEach((listener) => listener(message)),
    postMessage: vi.fn(),
  };
});
vi.mock('node:worker_threads', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:worker_threads')>()),
  parentPort: port,
}));

/** A grey photo drawn pixel by pixel, as JPEG bytes. */
async function drawn(shade: (x: number, y: number) => number, width = 256, height = 192, blur = 0): Promise<Buffer> {
  const image = new Jimp({ width, height, color: 0xffffffff });
  const { data } = image.bitmap;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = Math.max(0, Math.min(255, Math.round(shade(x, y))));
      const i = (y * width + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
  }
  if (blur > 0) image.blur(blur);
  return Buffer.from(await image.getBuffer('image/jpeg'));
}

/** Blocks of 32 px, light and dark, over a soft gradient, moved right by `dx`: edges to be sharp or blurred. */
function scene(dx = 0) {
  return (x: number, y: number) => {
    const light = (Math.floor((x + dx) / 32) + Math.floor(y / 32)) % 2 === 0;
    return light ? 200 + x / 16 : 50 + y / 16;
  };
}

/** Scenery without edges on the pixel grid, drawn from 0..1 coordinates so it looks the same at any size. */
function landscape(width: number, height: number) {
  return (x: number, y: number) => {
    const u = x / width;
    const v = y / height;
    const hill = (u - 0.43) ** 2 + (v - 0.51) ** 2 < 0.05 ? 30 : -30;
    return 128 + 50 * Math.sin(u * 23.1 + v * 7.3) + 40 * Math.sin(v * 31.7 - u * 5.9) + hill;
  };
}

/** The first bytes of an image file declaring `width` x `height`, with nothing behind them. */
function header(kind: 'png' | 'gif' | 'bmp' | 'bmp-core', width: number, height: number): Buffer {
  const data = Buffer.alloc(40);
  if (kind === 'png') {
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(data, 0);
    data.writeUInt32BE(13, 8);
    data.write('IHDR', 12, 'latin1');
    data.writeUInt32BE(width, 16);
    data.writeUInt32BE(height, 20);
  } else if (kind === 'gif') {
    data.write('GIF89a', 0, 'latin1');
    data.writeUInt16LE(width, 6);
    data.writeUInt16LE(height, 8);
  } else if (kind === 'bmp') {
    data.write('BM', 0, 'latin1');
    data.writeUInt32LE(40, 14);
    data.writeInt32LE(width, 18);
    data.writeInt32LE(-height, 22);
  } else {
    data.write('BM', 0, 'latin1');
    data.writeUInt32LE(12, 14);
    data.writeUInt16LE(width, 18);
    data.writeUInt16LE(height, 20);
  }
  return data;
}

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-photo-signals-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('measurePhoto', () => {
  it('PHSIG-001: a blurred copy measures far less sharp than the sharp scene', async () => {
    const sharp = await measurePhoto(await drawn(scene()));
    const blurred = await measurePhoto(await drawn(scene(), 256, 192, 4));
    expect(sharp?.sharpness).toBeGreaterThan(4 * (blurred?.sharpness ?? Infinity));
    expect(sharp).toMatchObject({ width: 256, height: 192 });
  });

  it('PHSIG-002: a copy shifted by a few pixels hashes alike, the inverted scene does not', async () => {
    const base = await measurePhoto(await drawn(scene()));
    const shifted = await measurePhoto(await drawn(scene(3)));
    const inverted = await measurePhoto(await drawn((x, y) => 255 - scene()(x, y)));
    expect(base?.phash).toMatch(/^[0-9a-f]{16}$/);
    expect(hashDistance(base?.phash ?? '', shifted?.phash ?? '')).toBeLessThanOrEqual(10);
    expect(hashDistance(base?.phash ?? '', inverted?.phash ?? '')).toBeGreaterThan(10);
  });

  it('PHSIG-003: brightness and clipping, and the size of a large photo as it was before it was measured smaller', async () => {
    const white = await measurePhoto(await drawn(() => 255));
    expect(white).toMatchObject({ luma: 1, clipped: 1 });
    const black = await measurePhoto(await drawn(() => 0));
    expect(black).toMatchObject({ luma: 0, clipped: 1, sharpness: 0 });
    const grey = await measurePhoto(await drawn(() => 128));
    expect(grey?.clipped).toBe(0);
    expect(grey?.luma).toBeCloseTo(128 / 255, 2);
    const large = await measurePhoto(await drawn(scene(), 1600, 1200));
    expect(large).toMatchObject({ width: 1600, height: 1200 });
    expect(SIGNAL_EDGE).toBe(240);
  });

  it('PHSIG-004: bytes that are no image, or an image too small or too thin to measure, have no signals', async () => {
    expect(await measurePhoto(Buffer.from('not a photo at all'))).toBeNull();
    expect(await measurePhoto(await drawn(() => 128, 2, 2))).toBeNull();
    // 1000 x 4 scaled to a 240 px long edge is under one pixel high.
    expect(await measurePhoto(await drawn(() => 128, 1000, 4))).toBeNull();
  });

  it('PHSIG-005: the 64 bits of a hash become 16 hex digits; anything else is no hash', () => {
    expect(bitsToHex(`${'0'.repeat(60)}1111`)).toBe('000000000000000f');
    expect(bitsToHex('1'.repeat(64))).toBe('ffffffffffffffff');
    expect(bitsToHex('0101')).toBeNull();
    expect(bitsToHex('2'.repeat(64))).toBeNull();
  });

  it("PHSIG-007: one scene measures about as sharp at a thumbnail's 320 px as at an original's 2000 px", async () => {
    const thumbnail = await measurePhoto(await drawn(landscape(320, 240), 320, 240));
    const original = await measurePhoto(await drawn(landscape(2000, 1500), 2000, 1500));
    const ratio = (original?.sharpness ?? 0) / (thumbnail?.sharpness ?? Infinity);
    expect(ratio).toBeGreaterThan(0.75);
    expect(ratio).toBeLessThan(1.33);
    expect(original).toMatchObject({ width: 2000, height: 1500 });
  });

  it('PHSIG-008: a canvas declared past 48 megapixels is refused before it is decoded; PNG and BMP within it are measured', async () => {
    const read = vi.spyOn(Jimp, 'read');
    try {
      expect(withinDecodeCap(header('png', 30000, 30000))).toBe(false);
      expect(await measurePhoto(header('png', 30000, 30000))).toBeNull();
      expect(withinDecodeCap(header('gif', 65535, 65535))).toBe(false);
      expect(withinDecodeCap(header('bmp', 10000, 10000))).toBe(false);
      expect(withinDecodeCap(header('bmp-core', 60000, 60000))).toBe(false);
      expect(withinDecodeCap(Buffer.from('II*\0 a TIFF Jimp could read'))).toBe(false);
      expect(read).not.toHaveBeenCalled();
      expect(withinDecodeCap(header('gif', 640, 480))).toBe(true);
      expect(withinDecodeCap(header('bmp', 6000, 4000))).toBe(true);
      expect(withinDecodeCap(header('bmp-core', 640, 480))).toBe(true);
    } finally {
      read.mockRestore();
    }
    const grey = new Jimp({ width: 40, height: 30, color: 0x808080ff });
    const png = Buffer.from(await grey.getBuffer('image/png'));
    const bmp = Buffer.from(await grey.getBuffer('image/bmp'));
    expect(await measurePhoto(png)).toMatchObject({ width: 40, height: 30, clipped: 0 });
    expect(await measurePhoto(bmp)).toMatchObject({ width: 40, height: 30, clipped: 0 });
    expect(withinDecodeCap(await drawn(scene()))).toBe(true);
  });

  it('PHSIG-006: the runner on the calling thread measures the same, and closes', async () => {
    const bytes = await drawn(scene());
    const runner = new InlinePhotoSignalsRunner();
    expect(await runner.measure(bytes)).toEqual(await measurePhoto(bytes));
    await expect(runner.close()).resolves.toBeUndefined();
  });
});

describe('the thread script', () => {
  it('PHSIG-010: says it is ready, answers each photo by its id, an unreadable one with no signals, and ignores a message without bytes', async () => {
    await import('../../../../src/nest/photos/photo-signals.worker');
    expect(port.postMessage).toHaveBeenCalledWith({ ready: true });
    port.emit('message', { id: 1, bytes: new Uint8Array(await drawn(scene())) });
    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({ id: 1, pixels: expect.objectContaining({ width: 256 }) }),
    );
    port.emit('message', { id: 2 });
    port.emit('message', { id: 3, bytes: new Uint8Array([1, 2, 3]) });
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalledWith({ id: 3, pixels: null }));
    expect(port.postMessage).toHaveBeenCalledTimes(3);
  });
});

/**
 * A thread script the runner can start: plain JS, so it runs without the
 * server's loader. Like the real one it says it is ready once loaded, unless
 * the case wants a thread that never gets that far.
 */
async function script(name: string, body: string, ready = true): Promise<string> {
  const path = join(dir, `${name}.cjs`);
  const hello = ready ? `parentPort.postMessage({ ready: true });\n` : '';
  await writeFile(path, `const { parentPort } = require('node:worker_threads');\n${body}\n${hello}`);
  return path;
}

const PIXELS = { phash: null, sharpness: 1, luma: 0.5, clipped: 0, width: 4, height: 3 };

describe('WorkerPhotoSignalsRunner', () => {
  it('PHSIG-020: hands each photo to its thread in turn and answers what it says, by its id; a failure it reports rejects', async () => {
    const entry = await script(
      'answers',
      `parentPort.on('message', (m) => {
        if (m.bytes[0] === 1) parentPort.postMessage({ id: m.id, pixels: ${JSON.stringify(PIXELS)} });
        else if (m.bytes[0] === 2) parentPort.postMessage({ id: m.id, pixels: null });
        else if (m.bytes[0] === 3) parentPort.postMessage({ id: m.id, error: 'cannot decode' });
        else {
          parentPort.postMessage({ id: -1, pixels: null });
          parentPort.postMessage({ id: m.id });
        }
      });`,
    );
    const runner = new WorkerPhotoSignalsRunner(entry);
    const answers = await Promise.allSettled([1, 2, 3, 4].map((b) => runner.measure(new Uint8Array([b]))));
    expect(answers.map((a) => (a.status === 'fulfilled' ? a.value : (a.reason as Error).message))).toEqual([
      PIXELS,
      null,
      'cannot decode',
      'measurement failed',
    ]);
    await runner.close();
    await expect(runner.measure(new Uint8Array([1]))).rejects.toThrow('closed');
  });

  it('PHSIG-021: a thread that dies or throws fails the photo it held, and the next photo gets a fresh thread', async () => {
    const entry = await script(
      'fragile',
      `parentPort.on('message', (m) => {
        if (m.bytes[0] === 9) process.exit(3);
        if (m.bytes[0] === 8) setTimeout(() => { throw new Error('boom'); });
        else parentPort.postMessage({ id: m.id, pixels: null });
      });`,
    );
    const runner = new WorkerPhotoSignalsRunner(entry);
    await expect(runner.measure(new Uint8Array([1]))).resolves.toBeNull();
    await expect(runner.measure(new Uint8Array([9]))).rejects.toThrow('signals thread ended');
    await expect(runner.measure(new Uint8Array([1]))).resolves.toBeNull();
    await expect(runner.measure(new Uint8Array([8]))).rejects.toThrow('boom');
    await expect(runner.measure(new Uint8Array([1]))).resolves.toBeNull();
    await runner.close();
  });

  it('PHSIG-022: a full line is busy, and closing fails the photo with the thread and every one in line as closed', async () => {
    const entry = await script('silent', `parentPort.on('message', () => undefined);`);
    const runner = new WorkerPhotoSignalsRunner(entry);
    const waiting = Array.from({ length: MAX_WAITING_PHOTOS }, () =>
      runner.measure(new Uint8Array([1])).catch((err: Error) => err.message),
    );
    await expect(runner.measure(new Uint8Array([1]))).rejects.toThrow('busy');
    await runner.close();
    const outcomes = await Promise.all(waiting);
    expect(outcomes).toEqual(Array.from({ length: MAX_WAITING_PHOTOS }, () => 'closed'));
  });

  it('PHSIG-023: a photo left unanswered times out on its own clock, the thread is started over for the next', async () => {
    const entry = await script(
      'slow',
      `parentPort.on('message', (m) => {
        if (m.bytes[0] !== 7) parentPort.postMessage({ id: m.id, pixels: null });
      });`,
    );
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const runner = new WorkerPhotoSignalsRunner(entry);
      const hung = runner.measure(new Uint8Array([7])).catch((err: Error) => err.message);
      const next = runner.measure(new Uint8Array([1]));
      await vi.advanceTimersByTimeAsync(MEASURE_TIMEOUT_MS);
      expect(await hung).toBe('timeout');
      await expect(next).resolves.toBeNull();
      // Ten idle minutes end the thread; the runner starts another for the next photo.
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
      await expect(runner.measure(new Uint8Array([1]))).resolves.toBeNull();
      await runner.close();
    } finally {
      vi.useRealTimers();
    }
  });

  it('PHSIG-024: a thread that cannot start fails each photo on its own as unavailable', async () => {
    // A bare relative path is one node refuses to start a thread from.
    const runner = new WorkerPhotoSignalsRunner('no-such-signals.js');
    await expect(runner.measure(new Uint8Array([1]))).rejects.toThrow('unavailable');
    await expect(runner.measure(new Uint8Array([1]))).rejects.toThrow('unavailable');
    await runner.close();
  });

  it('PHSIG-026: a thread that fails or ends before it is ready blames no photo: unavailable, with the reason', async () => {
    const broken = await script('broken', `throw new Error('broken build');`, false);
    const runner = new WorkerPhotoSignalsRunner(broken);
    await expect(runner.measure(new Uint8Array([1]))).rejects.toMatchObject({
      message: 'unavailable',
      cause: expect.objectContaining({ message: 'broken build' }),
    });
    await runner.close();
    const quits = await script('quits', `process.exit(2);`, false);
    const other = new WorkerPhotoSignalsRunner(quits);
    await expect(other.measure(new Uint8Array([1]))).rejects.toMatchObject({
      message: 'unavailable',
      cause: expect.objectContaining({ message: 'signals thread ended' }),
    });
    await other.close();
  });

  it('PHSIG-025: the module takes the thread where the build ships its script, else the calling thread', async () => {
    const entry = await script('shipped', `parentPort.on('message', () => undefined);`);
    const shipped = photoSignalsRunner(entry);
    expect(shipped).toBeInstanceOf(WorkerPhotoSignalsRunner);
    await shipped.close();
    expect(photoSignalsRunner(join(dir, 'missing.js'))).toBeInstanceOf(InlinePhotoSignalsRunner);
    expect(photoSignalsRunner()).toBeInstanceOf(InlinePhotoSignalsRunner);
  });
});
