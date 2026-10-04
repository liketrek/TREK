import fs from 'node:fs';
import path from 'node:path';

/**
 * A real JPEG carrying the capture tags a phone writes, built byte by byte so
 * no actual person's photo has to live in the repo.
 *
 * The image data is tests/fixtures/small-image.jpg (a decodable 1x1 JPEG); its
 * JFIF APP0 is swapped for an Exif APP1 the way a camera lays the file out:
 * SOI, APP1 "Exif", then the rest. Every value is written as the raw tag string
 * or rational, so a test can also hand in a malformed one.
 */
export interface ExifJpegTags {
  /** 0x9003, e.g. '2026:05:30 15:52:19'. */
  DateTimeOriginal?: string;
  /** 0x9004 (DateTimeDigitized). */
  CreateDate?: string;
  /** 0x9010, the offset of the IFD0 DateTime. */
  OffsetTime?: string;
  /** 0x9011, the offset of DateTimeOriginal. */
  OffsetTimeOriginal?: string;
  /** 0x9012, the offset of DateTimeDigitized. */
  OffsetTimeDigitized?: string;
  /** Decimal degrees, stored as the usual degree/minute/second rationals plus N/S and E/W. */
  gps?: { lat: number; lng: number };
}

const BASE_JPEG = path.join(__dirname, '../fixtures/small-image.jpg');

const BYTE = 1;
const ASCII = 2;
const LONG = 4;
const RATIONAL = 5;

interface Entry { tag: number; type: number; count: number; data: Buffer }

function ascii(tag: number, value: string): Entry {
  const data = Buffer.from(`${value}\0`, 'latin1');
  return { tag, type: ASCII, count: data.length, data };
}

function long(tag: number, value: number): Entry {
  const data = Buffer.alloc(4);
  data.writeUInt32LE(value);
  return { tag, type: LONG, count: 1, data };
}

function rationals(tag: number, pairs: Array<[number, number]>): Entry {
  const data = Buffer.alloc(pairs.length * 8);
  pairs.forEach(([num, den], i) => {
    data.writeUInt32LE(num, i * 8);
    data.writeUInt32LE(den, i * 8 + 4);
  });
  return { tag, type: RATIONAL, count: pairs.length, data };
}

function dms(deg: number): Array<[number, number]> {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = Math.round(((abs - d) * 60 - m) * 60 * 10000);
  return [[d, 1], [m, 1], [s, 10000]];
}

function ifdSize(entries: Entry[]): number {
  const outOfLine = entries.reduce((sum, e) => sum + (e.data.length > 4 ? e.data.length + (e.data.length % 2) : 0), 0);
  return 2 + entries.length * 12 + 4 + outOfLine;
}

/** One IFD at TIFF offset `at`, entries sorted by tag as the spec wants. */
function writeIfd(entries: Entry[], at: number): Buffer {
  const sorted = [...entries].sort((a, b) => a.tag - b.tag);
  const head = Buffer.alloc(2 + sorted.length * 12 + 4);
  const tail: Buffer[] = [];
  let dataAt = at + head.length;
  head.writeUInt16LE(sorted.length, 0);
  sorted.forEach((e, i) => {
    const o = 2 + i * 12;
    head.writeUInt16LE(e.tag, o);
    head.writeUInt16LE(e.type, o + 2);
    head.writeUInt32LE(e.count, o + 4);
    if (e.data.length <= 4) {
      e.data.copy(head, o + 8);
    } else {
      head.writeUInt32LE(dataAt, o + 8);
      const padded = e.data.length % 2 ? Buffer.concat([e.data, Buffer.alloc(1)]) : e.data;
      tail.push(padded);
      dataAt += padded.length;
    }
  });
  head.writeUInt32LE(0, head.length - 4);
  return Buffer.concat([head, ...tail]);
}

export function jpegWithExif(tags: ExifJpegTags): Buffer {
  const exifEntries: Entry[] = [];
  if (tags.DateTimeOriginal !== undefined) exifEntries.push(ascii(0x9003, tags.DateTimeOriginal));
  if (tags.CreateDate !== undefined) exifEntries.push(ascii(0x9004, tags.CreateDate));
  if (tags.OffsetTime !== undefined) exifEntries.push(ascii(0x9010, tags.OffsetTime));
  if (tags.OffsetTimeOriginal !== undefined) exifEntries.push(ascii(0x9011, tags.OffsetTimeOriginal));
  if (tags.OffsetTimeDigitized !== undefined) exifEntries.push(ascii(0x9012, tags.OffsetTimeDigitized));

  const gpsEntries: Entry[] = [];
  if (tags.gps) {
    gpsEntries.push({ tag: 0x0000, type: BYTE, count: 4, data: Buffer.from([2, 2, 0, 0]) });
    gpsEntries.push(ascii(0x0001, tags.gps.lat < 0 ? 'S' : 'N'));
    gpsEntries.push(rationals(0x0002, dms(tags.gps.lat)));
    gpsEntries.push(ascii(0x0003, tags.gps.lng < 0 ? 'W' : 'E'));
    gpsEntries.push(rationals(0x0004, dms(tags.gps.lng)));
  }

  // IFD0 holds only the two pointers, so its size is known before the offsets are.
  const ifd0Count = (exifEntries.length ? 1 : 0) + (gpsEntries.length ? 1 : 0);
  const ifd0At = 8;
  const exifAt = ifd0At + 2 + ifd0Count * 12 + 4;
  const gpsAt = exifAt + (exifEntries.length ? ifdSize(exifEntries) : 0);
  const ifd0Entries: Entry[] = [];
  if (exifEntries.length) ifd0Entries.push(long(0x8769, exifAt));
  if (gpsEntries.length) ifd0Entries.push(long(0x8825, gpsAt));

  const tiffHeader = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
  const tiff = Buffer.concat([
    tiffHeader,
    writeIfd(ifd0Entries, ifd0At),
    exifEntries.length ? writeIfd(exifEntries, exifAt) : Buffer.alloc(0),
    gpsEntries.length ? writeIfd(gpsEntries, gpsAt) : Buffer.alloc(0),
  ]);
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const app1 = Buffer.alloc(4);
  app1.writeUInt16BE(0xffe1, 0);
  app1.writeUInt16BE(payload.length + 2, 2);

  const base = fs.readFileSync(BASE_JPEG);
  // SOI, then skip the JFIF APP0 (marker + its big-endian length).
  const app0Length = base.readUInt16BE(4);
  const rest = base.subarray(4 + app0Length);
  return Buffer.concat([base.subarray(0, 2), app1, payload, rest]);
}
