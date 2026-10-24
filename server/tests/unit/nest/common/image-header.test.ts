import { readImageHeader } from '../../../../src/nest/common/image-header';

import { describe, expect, it } from 'vitest';

/** SOI, then the given segments, then a baseline frame header of w x h. */
function jpeg(w: number, h: number, ...before: number[][]): Buffer {
  const sof = Buffer.alloc(19);
  sof.writeUInt16BE(0xffc0, 0);
  sof.writeUInt16BE(17, 2);
  sof.writeUInt8(8, 4);
  sof.writeUInt16BE(h, 5);
  sof.writeUInt16BE(w, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), ...before.map((bytes) => Buffer.from(bytes)), sof]);
}

function webp(chunk: string, length: number): Buffer {
  const out = Buffer.alloc(length);
  out.write('RIFF', 0, 'latin1');
  out.write('WEBP', 8, 'latin1');
  out.write(chunk, 12, 'latin1');
  return out;
}

describe('readImageHeader', () => {
  it('IMGHDR-001: steps over stray bytes, fill bytes and the markers that carry no length', () => {
    // A JPEG opens with SOI and a marker (FF D8 FF); the stray bytes come between segments, after the first one.
    const segments = [
      [0xff, 0xe1, 0x00, 0x04, 0, 0],
      [0x00, 0x12],
      [0xff, 0xff],
      [0xff, 0x01],
      [0xff, 0xd0],
    ];
    expect(readImageHeader(jpeg(800, 600, ...segments))).toEqual({ mimeType: 'image/jpeg', width: 800, height: 600 });
  });

  it('IMGHDR-002: a JPEG whose segment length is broken, or whose frame header is cut, says no size', () => {
    expect(readImageHeader(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01, 0, 0]))).toBeNull();
    expect(readImageHeader(Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 8, 0]))).toBeNull();
    expect(readImageHeader(Buffer.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x08]))).toBeNull();
    expect(readImageHeader(jpeg(0, 600))).toBeNull();
  });

  it('IMGHDR-003: a WebP too short for its chunk, or with a chunk it does not know, says no size', () => {
    expect(readImageHeader(webp('VP8 ', 20))).toBeNull();
    expect(readImageHeader(webp('VP8L', 22))).toBeNull();
    expect(readImageHeader(webp('VP8X', 26))).toBeNull();
    expect(readImageHeader(webp('ALPH', 30))).toBeNull();
  });

  it('IMGHDR-004: a PNG signature without its IHDR chunk is no PNG', () => {
    const data = Buffer.alloc(24);
    data.writeUInt32BE(0x89504e47, 0);
    data.write('IDAT', 12, 'latin1');
    expect(readImageHeader(data)).toBeNull();
    expect(readImageHeader(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});
