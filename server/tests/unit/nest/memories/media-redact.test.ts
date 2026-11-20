/**
 * media-redact: the location-free copies a share link gets (PublicMediaService).
 *
 * Every case builds its file byte by byte, so no real person's photo lives in
 * the repo, and asserts the two halves of the contract: the location is gone
 * for the readers that matter (exifr for EXIF/XMP, the raw ISO 6709 string for
 * movies), and nothing else moved (same length, orientation and capture time
 * kept, a PNG whose checksums still hold and still decodes).
 */
import { redactLocationInBuffer, redactLocationInFile } from '../../../../src/nest/memories/media-redact';
import { jpegWithExif } from '../../../helpers/exif-jpeg';

import exifr from 'exifr';
import { Jimp } from 'jimp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const GPS = { lat: 49.274523, lng: -0.703421 };
const ISO6709 = '+48.8577+002.2950+035.000/';

let dir: string;
beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-redact-'));
});
afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function writeTemp(name: string, bytes: Buffer): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, bytes);
  return file;
}

function phonePhoto(): Buffer {
  return jpegWithExif({ DateTimeOriginal: '2026:05:30 15:52:19', gps: GPS, Orientation: 6 });
}

/** The TIFF block of the phone photo, as a PNG eXIf or a WebP EXIF chunk holds it. */
function phoneTiff(): Buffer {
  const jpeg = phonePhoto();
  const start = jpeg.indexOf(Buffer.from('Exif\0\0', 'latin1')) + 6;
  return jpeg.subarray(start, 4 + jpeg.readUInt16BE(4));
}

/** A JPEG with an XMP APP1 after the Exif one, the way Lightroom and phones write both. */
function withXmp(jpeg: Buffer, xmp: string): Buffer {
  const payload = Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), Buffer.from(xmp, 'latin1')]);
  const marker = Buffer.alloc(4);
  marker.writeUInt16BE(0xffe1, 0);
  marker.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpeg.subarray(0, 2), marker, payload, jpeg.subarray(2)]);
}

const XMP = [
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
  '<rdf:Description rdf:about="" xmlns:exif="http://ns.adobe.com/exif/1.0/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"',
  ' exif:GPSLatitude="49,16.4714N" exif:GPSLongitude="0,42.2053W" photoshop:City="Bayeux">',
  '<photoshop:Country>France</photoshop:Country><exif:GPSAltitude>12/1</exif:GPSAltitude>',
  '</rdf:Description></rdf:RDF></x:xmpmeta>',
].join('');

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** A 1x1 grey PNG with the phone photo's TIFF block as eXIf, an XMP iTXt and a compressed raw profile. */
function pngWithMetadata(): Buffer {
  const jpeg = phonePhoto();
  const tiffStart = jpeg.indexOf(Buffer.from('Exif\0\0', 'latin1')) + 6;
  const tiff = jpeg.subarray(tiffStart, 4 + jpeg.readUInt16BE(4));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  const xmp =
    '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF><rdf:Description exif:GPSLatitude="49,16N"/></rdf:RDF></x:xmpmeta>';
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('eXIf', Buffer.from(tiff)),
    pngChunk('iTXt', Buffer.concat([Buffer.from('XML:com.adobe.xmp\0\0\0\0\0', 'latin1'), Buffer.from(xmp, 'latin1')])),
    pngChunk('zTXt', Buffer.concat([Buffer.from('Raw profile type exif\0\0', 'latin1'), zlib.deflateSync('47 50 53')])),
    pngChunk('IDAT', zlib.deflateSync(Buffer.from([0, 0]))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function box(type: string, ...parts: Buffer[]): Buffer {
  const body = Buffer.concat(parts);
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length + 8);
  head.write(type, 4, 'latin1');
  return Buffer.concat([head, body]);
}

/** A QuickTime movie as an iPhone lays out its location: udta location atom and the mdta keys of moov/meta. */
function iphoneMovie(): Buffer {
  const xyz = Buffer.alloc(4 + ISO6709.length);
  xyz.writeUInt16BE(ISO6709.length, 0);
  xyz.write(ISO6709, 4, 'latin1');
  const key = (name: string) => {
    const entry = Buffer.alloc(8 + name.length);
    entry.writeUInt32BE(8 + name.length, 0);
    entry.write('mdta', 4, 'latin1');
    entry.write(name, 8, 'latin1');
    return entry;
  };
  const keysHead = Buffer.alloc(8);
  keysHead.writeUInt32BE(2, 4);
  const item = (index: number, value: string) => {
    const data = box('data', Buffer.from([0, 0, 0, 1, 0, 0, 0, 0]), Buffer.from(value, 'latin1'));
    const head = Buffer.alloc(8);
    head.writeUInt32BE(8 + data.length, 0);
    head.writeUInt32BE(index, 4);
    return Buffer.concat([head, data]);
  };
  const meta = box(
    'meta',
    box('hdlr', Buffer.alloc(8), Buffer.from('mdta', 'latin1'), Buffer.alloc(13)),
    box('keys', keysHead, key('com.apple.quicktime.make'), key('com.apple.quicktime.location.ISO6709')),
    box('ilst', item(1, 'Apple'), item(2, ISO6709)),
  );
  return Buffer.concat([
    box('ftyp', Buffer.from('qt  \0\0\0\0qt  ', 'latin1')),
    // The frames happen to hold the same text: mdat is never read, so it stays.
    box('mdat', Buffer.from(`${ISO6709}frames`, 'latin1')),
    box('moov', box('mvhd', Buffer.alloc(100)), box('udta', box('\u00a9xyz', xyz)), meta),
  ]);
}

/** The head of a box that claims far more bytes than follow, as a cut-off upload leaves one. */
const PARTIAL_BOX = Buffer.from([0, 0x10, 0, 0, 0x6d, 0x64, 0x61, 0x74, 1, 2, 3, 4]);

/** The phone photo with a Photoshop APP13 block holding the given IPTC-IIM record 2 datasets. */
function withIptc(datasets: Array<[number, string]>): Buffer {
  const iim = Buffer.concat(
    datasets.map(([dataset, value]) => {
      const head = Buffer.from([0x1c, 2, dataset, 0, 0]);
      head.writeUInt16BE(value.length, 3);
      return Buffer.concat([head, Buffer.from(value, 'latin1')]);
    }),
  );
  // 8BIM, resource id 0x0404, an empty Pascal name padded to two bytes, the size.
  const resourceHead = Buffer.alloc(12);
  resourceHead.write('8BIM', 0, 'latin1');
  resourceHead.writeUInt16BE(0x0404, 4);
  resourceHead.writeUInt32BE(iim.length, 8);
  const payload = Buffer.concat([
    Buffer.from('Photoshop 3.0\0', 'latin1'),
    resourceHead,
    iim,
    Buffer.alloc(iim.length % 2),
  ]);
  const marker = Buffer.alloc(4);
  marker.writeUInt16BE(0xffed, 0);
  marker.writeUInt16BE(payload.length + 2, 2);
  const jpeg = phonePhoto();
  return Buffer.concat([jpeg.subarray(0, 2), marker, payload, jpeg.subarray(2)]);
}

describe('redactLocationInBuffer', () => {
  it('MREDACT-006: IPTC place datasets in a Photoshop APP13 block become spaces, the caption stays', () => {
    const original = withIptc([
      [90, 'Bayeux'],
      [92, 'Rue Saint-Jean'],
      [95, 'Normandie'],
      [100, 'FRA'],
      [101, 'France'],
      [120, 'Tapestry museum'],
    ]);
    const copy = Buffer.from(original);

    expect(redactLocationInBuffer(copy)).toBe(true);

    expect(copy.length).toBe(original.length);
    const text = copy.toString('latin1');
    for (const gone of ['Bayeux', 'Rue Saint-Jean', 'Normandie', 'FRA', 'France']) expect(text).not.toContain(gone);
    expect(text).toContain('Tapestry museum');
  });

  it('MREDACT-007: an IPTC record that does not parse is refused', () => {
    const broken = withIptc([[90, 'Bayeux']]);
    // The dataset tag marker of the first (and only) dataset.
    broken[broken.indexOf(Buffer.from([0x1c, 2, 90]))] = 0x1d;
    expect(redactLocationInBuffer(broken)).toBe(false);
  });

  it('MREDACT-001: a phone JPEG loses its GPS block and keeps orientation, capture time and length', async () => {
    const original = phonePhoto();
    expect((await exifr.gps(original))?.latitude).toBeCloseTo(GPS.lat, 5);

    const copy = Buffer.from(original);
    expect(redactLocationInBuffer(copy)).toBe(true);

    expect(copy.length).toBe(original.length);
    expect(await exifr.gps(copy)).toBeUndefined();
    expect(await exifr.orientation(copy)).toBe(6);
    const tags = (await exifr.parse(copy, { reviveValues: false })) as { DateTimeOriginal?: string };
    expect(tags.DateTimeOriginal).toBe('2026:05:30 15:52:19');
  });

  it('MREDACT-002: XMP place properties, as attributes and as elements, become spaces', async () => {
    const copy = withXmp(phonePhoto(), XMP);
    expect(redactLocationInBuffer(copy)).toBe(true);

    const text = copy.toString('latin1');
    for (const gone of ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'Bayeux', 'France']) {
      expect(text).not.toContain(gone);
    }
    // The packet still parses and the image data behind it is untouched.
    const parsed = (await exifr.parse(copy, { xmp: true })) as Record<string, unknown>;
    expect(parsed.City).toBeUndefined();
    expect(parsed.Orientation).toBeDefined();
  });

  it('MREDACT-003: a PNG loses eXIf GPS, XMP and the raw profile, with valid checksums, and still decodes', async () => {
    const copy = pngWithMetadata();
    expect(redactLocationInBuffer(copy)).toBe(true);

    expect(await exifr.gps(copy).catch(() => undefined)).toBeUndefined();
    const text = copy.toString('latin1');
    expect(text).not.toContain('GPSLatitude');
    expect(text).not.toContain('Raw profile');
    let pos = 8;
    while (pos < copy.length) {
      const length = copy.readUInt32BE(pos);
      expect(zlib.crc32(copy.subarray(pos + 4, pos + 8 + length))).toBe(copy.readUInt32BE(pos + 8 + length));
      pos += 12 + length;
    }
    const image = await Jimp.read(copy);
    expect(image.bitmap.width).toBe(1);
  });

  it('MREDACT-005: a WebP EXIF chunk without the Exif prefix loses its GPS block too', async () => {
    const tiff = Buffer.from(phoneTiff());
    const chunk = Buffer.alloc(8);
    chunk.write('EXIF', 0, 'latin1');
    chunk.writeUInt32LE(tiff.length, 4);
    const body = Buffer.concat([Buffer.from('WEBP', 'latin1'), chunk, tiff, Buffer.alloc(tiff.length % 2)]);
    const riff = Buffer.alloc(8);
    riff.write('RIFF', 0, 'latin1');
    riff.writeUInt32LE(body.length, 4);
    const webp = Buffer.concat([riff, body]);

    expect(redactLocationInBuffer(webp)).toBe(true);

    // The chunk's TIFF read on its own, the way exifr reads a TIFF file.
    const cleaned = webp.subarray(20, 20 + tiff.length);
    expect(await exifr.gps(cleaned).catch(() => undefined)).toBeUndefined();
    expect(await exifr.orientation(cleaned)).toBe(6);
  });

  it('MREDACT-004: a format it does not know, or a broken XMP packet, is refused', () => {
    expect(redactLocationInBuffer(Buffer.from(`BM${'x'.repeat(40)}`))).toBe(false);
    const broken = withXmp(phonePhoto(), '<x:xmpmeta><rdf:RDF><rdf:Description exif:GPSLatitude="49');
    expect(redactLocationInBuffer(broken)).toBe(false);
  });
});

describe('redactLocationInFile', () => {
  it('MREDACT-010: an iPhone movie loses its udta location atom and the ISO6709 key value, frames and other keys stay', async () => {
    const original = iphoneMovie();
    const file = writeTemp('clip.mov', original);

    expect(await redactLocationInFile(file)).toBe(true);

    const copy = fs.readFileSync(file);
    const text = copy.toString('latin1');
    expect(copy.length).toBe(original.length);
    // One occurrence left: the one inside mdat.
    expect(text.split(ISO6709).length - 1).toBe(1);
    expect(text).not.toContain('\u00a9xyz');
    expect(text).toContain('Apple');
  });

  it('MREDACT-014: XMP in a movie (udta XMP_ and the Adobe uuid box) loses its GPS properties', async () => {
    const xmp = Buffer.from(XMP, 'latin1');
    const movie = Buffer.concat([
      box('ftyp', Buffer.from('mp42\0\0\0\0mp42', 'latin1')),
      box('uuid', Buffer.from('be7acfcb97a942e89c71999491e3afac', 'hex'), xmp),
      box('moov', box('mvhd', Buffer.alloc(100)), box('udta', box('XMP_', xmp))),
    ]);
    const file = writeTemp('xmp.mp4', movie);

    expect(await redactLocationInFile(file)).toBe(true);

    const text = fs.readFileSync(file).toString('latin1');
    expect(text).not.toContain('GPSLatitude');
    expect(text).not.toContain('Bayeux');
    expect(text.split('<rdf:RDF').length - 1).toBe(2);
  });

  it('MREDACT-015: a movie whose box sizes overrun their parent is refused', async () => {
    const broken = Buffer.concat([
      box('ftyp', Buffer.from('qt  ', 'latin1')),
      box('moov', box('udta', Buffer.alloc(4))),
    ]);
    // udta claims more bytes than moov holds.
    broken.writeUInt32BE(400, 20);
    expect(await redactLocationInFile(writeTemp('broken.mov', broken))).toBe(false);
  });

  it('MREDACT-016: a movie whose top level cannot be walked is refused, never cleaned as an image', async () => {
    const trailing = Buffer.concat([iphoneMovie(), PARTIAL_BOX]);
    expect(await redactLocationInFile(writeTemp('trailing.mov', trailing))).toBe(false);

    // An MP4 brand without any movie header.
    const headless = Buffer.concat([
      box('ftyp', Buffer.from('isom\0\0\0\0isommp42', 'latin1')),
      box('mdat', Buffer.from(ISO6709, 'latin1')),
    ]);
    expect(await redactLocationInFile(writeTemp('headless.mp4', headless))).toBe(false);
  });

  it('MREDACT-017: an old QuickTime file without ftyp is walked as a movie, the 3GPP loci box goes too', async () => {
    const loci = Buffer.concat([Buffer.alloc(6), Buffer.from('Bayeux\0', 'latin1'), Buffer.alloc(12)]);
    const movie = Buffer.concat([
      box('wide'),
      box('mdat', Buffer.from('frames', 'latin1')),
      box('moov', box('mvhd', Buffer.alloc(100)), box('udta', box('loci', loci))),
    ]);
    const file = writeTemp('old.mov', movie);

    expect(await redactLocationInFile(file)).toBe(true);

    const text = fs.readFileSync(file).toString('latin1');
    expect(text).not.toContain('Bayeux');
    expect(text).not.toContain('loci');
    expect(text).toContain('frames');
  });

  it('MREDACT-018: a still HEIC is cleaned in memory, one whose boxes do not parse and hides a moov is refused', async () => {
    const exif = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), Buffer.from(phoneTiff())]);
    const heic = Buffer.concat([box('ftyp', Buffer.from('heic\0\0\0\0mif1heic', 'latin1')), box('mdat', exif)]);
    const file = writeTemp('still.heic', heic);

    expect(await redactLocationInFile(file)).toBe(true);
    const cleaned = fs.readFileSync(file);
    const tiffAt = cleaned.indexOf(Buffer.from('Exif\0\0', 'latin1')) + 6;
    expect(await exifr.gps(cleaned.subarray(tiffAt)).catch(() => undefined)).toBeUndefined();

    const disguised = Buffer.concat([
      box('ftyp', Buffer.from('heic\0\0\0\0mif1heic', 'latin1')),
      box('moov', box('udta', box('©xyz', Buffer.from(ISO6709, 'latin1')))),
      PARTIAL_BOX,
    ]);
    expect(await redactLocationInFile(writeTemp('disguised.heic', disguised))).toBe(false);
  });

  it('MREDACT-011: a JPEG file is cleaned in place and passes the exifr check', async () => {
    const file = writeTemp('photo.jpg', phonePhoto());
    expect(await redactLocationInFile(file)).toBe(true);
    expect(await exifr.gps(fs.readFileSync(file))).toBeUndefined();
  });

  it('MREDACT-012: an unknown format fails closed, a bare signature with nothing to clean passes', async () => {
    expect(await redactLocationInFile(writeTemp('a.bmp', Buffer.from(`BM${'x'.repeat(40)}`)))).toBe(false);
    expect(
      await redactLocationInFile(writeTemp('b.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))),
    ).toBe(true);
    expect(await redactLocationInFile(writeTemp('c.webm', Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0])))).toBe(
      true,
    );
  });

  it('MREDACT-013: a bare TIFF (DNG, scanner output) is walked from its first byte and cleaned', async () => {
    const jpeg = phonePhoto();
    const tiffStart = jpeg.indexOf(Buffer.from('Exif\0\0', 'latin1')) + 6;
    const file = writeTemp('raw.tif', Buffer.from(jpeg.subarray(tiffStart, 4 + jpeg.readUInt16BE(4))));
    expect((await exifr.gps(fs.readFileSync(file)))?.latitude).toBeCloseTo(GPS.lat, 5);

    expect(await redactLocationInFile(file)).toBe(true);

    expect(await exifr.gps(fs.readFileSync(file)).catch(() => undefined)).toBeUndefined();
  });
});
