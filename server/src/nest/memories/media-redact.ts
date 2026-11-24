import exifr from 'exifr';
import type { FileHandle } from 'node:fs/promises';
import fsPromises from 'node:fs/promises';
import zlib from 'node:zlib';

/**
 * Location redaction for media that leaves the host without an account.
 *
 * Every edit is length preserving and happens on a copy: the GPS block of an
 * embedded EXIF/TIFF structure is emptied, location properties of an XMP packet
 * are overwritten with spaces, and the location atoms of a QuickTime/MP4 movie
 * are zeroed. Nothing is decoded or re-encoded, so the picture keeps its quality
 * and its orientation, and every container the format knows how to skip stays
 * valid. A file this cannot vouch for answers false, and the caller serves no
 * original in its place.
 */

/** Images are cleaned in memory; a larger one is refused rather than read whole. */
const MAX_IMAGE_BYTES = 128 * 1024 * 1024;

/** XMP boxes inside a movie are read whole as well. */
const MAX_XMP_BYTES = 16 * 1024 * 1024;

const GPS_IFD_TAG = 0x8825;

/** Bytes per value of each TIFF field type (index = type id 1..13). */
const TIFF_TYPE_SIZES = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8, 4];

const EXIF_MARK = Buffer.from('Exif\0\0', 'latin1');
const RDF_OPEN = Buffer.from('<rdf:RDF', 'latin1');
const RDF_CLOSE = Buffer.from('</rdf:RDF>', 'latin1');
const SPACE = 0x20;

/** The uuid box Adobe's XMP spec gives MP4 files. */
const XMP_UUID = Buffer.from('be7acfcb97a942e89c71999491e3afac', 'hex');

/** The QuickTime user-data atom holding an ISO 6709 location string. */
const LOCATION_ATOM = '\u00a9xyz';

/**
 * ftyp major brands of a still HEIF/AVIF image. Only these may take the
 * in-memory image path; any other ISO BMFF file is a movie and has to be
 * walked as one, or it is refused.
 */
const STILL_IMAGE_BRANDS = new Set(['avif', 'heic', 'heim', 'heis', 'heix', 'miaf', 'mif1', 'mif2']);

/** Top-level atoms an old QuickTime file may start with instead of ftyp. */
const QUICKTIME_LEAD_ATOMS = new Set(['free', 'mdat', 'moov', 'pnot', 'skip', 'wide']);

const MOOV = Buffer.from('moov', 'latin1');

const PHOTOSHOP_MARK = Buffer.from('Photoshop 3.0\0', 'latin1');

/** The Photoshop image resource that carries the IPTC-IIM record. */
const IPTC_RESOURCE_ID = 0x0404;

/**
 * IPTC-IIM application record (2) datasets that name a place: content
 * location code and name, city, sublocation, province/state, country code
 * and country.
 */
const IPTC_LOCATION_DATASETS = new Set([26, 27, 90, 92, 95, 100, 101]);

/** Local names (prefix stripped, lower case) of the XMP properties that name a place. */
const XMP_LOCATION_FIELDS = new Set([
  'altitude',
  'city',
  'country',
  'countrycode',
  'countryname',
  'latitude',
  'location',
  'locationcreated',
  'locationshown',
  'longitude',
  'provincestate',
  'state',
  'sublocation',
  'worldregion',
]);

type MediaFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'tiff' | 'isobmff' | 'quicktime' | 'ebml' | 'unknown';

function sniffFormat(head: Buffer): MediaFormat {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg';
  if (head.length < 8) return 'unknown';
  if (head.readUInt32BE(0) === 0x89504e47) return 'png';
  if (head.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  if (head.toString('latin1', 4, 8) === 'ftyp') return 'isobmff';
  if (QUICKTIME_LEAD_ATOMS.has(head.toString('latin1', 4, 8))) return 'quicktime';
  if (head.readUInt32BE(0) === 0x1a45dfa3) return 'ebml';
  if (readTiffByteOrder(head, 0, head.length) !== null) return 'tiff';
  if (head.length >= 12 && head.toString('latin1', 0, 4) === 'RIFF' && head.toString('latin1', 8, 12) === 'WEBP') {
    return 'webp';
  }
  return 'unknown';
}

// ── EXIF / TIFF ─────────────────────────────────────────────────────────────

/** 'le' or 'be' for a TIFF header at `base`, null when there is none. */
function readTiffByteOrder(buf: Buffer, base: number, limit: number): 'le' | 'be' | null {
  if (base + 8 > limit) return null;
  if (buf[base] === 0x49 && buf[base + 1] === 0x49 && buf.readUInt16LE(base + 2) === 42) return 'le';
  if (buf[base] === 0x4d && buf[base + 1] === 0x4d && buf.readUInt16BE(base + 2) === 42) return 'be';
  return null;
}

/**
 * Empties the GPS IFD of the TIFF structure at `base`: its out-of-line values
 * and its entries are zeroed and its entry count set to 0, which also reads
 * as "no next IFD". IFD0 (orientation included) is left as it was.
 * False when no plausible TIFF starts at `base`.
 */
function blankTiffGps(buf: Buffer, base: number, limit: number): boolean {
  const order = readTiffByteOrder(buf, base, limit);
  if (!order) return false;
  const u16 = (offset: number) => (order === 'le' ? buf.readUInt16LE(base + offset) : buf.readUInt16BE(base + offset));
  const u32 = (offset: number) => (order === 'le' ? buf.readUInt32LE(base + offset) : buf.readUInt32BE(base + offset));
  const entryCount = (offset: number) => {
    if (offset < 8 || base + offset + 2 > limit) return -1;
    const count = u16(offset);
    return base + offset + 2 + count * 12 + 4 <= limit ? count : -1;
  };

  const blankGpsIfd = (offset: number) => {
    const count = entryCount(offset);
    if (count <= 0) return;
    for (let i = 0; i < count; i++) {
      const entry = offset + 2 + i * 12;
      const size = (TIFF_TYPE_SIZES[u16(entry + 2)] ?? 0) * u32(entry + 4);
      const valueAt = u32(entry + 8);
      if (size > 4 && valueAt >= 8 && base + valueAt + size <= limit)
        buf.fill(0, base + valueAt, base + valueAt + size);
    }
    buf.fill(0, base + offset, base + offset + 2 + count * 12);
  };

  // IFD0 and the IFDs chained behind it; the GPS pointer lives in IFD0 in practice.
  const seen = new Set<number>();
  let ifd = u32(4);
  for (let depth = 0; depth < 4 && ifd !== 0 && !seen.has(ifd); depth++) {
    seen.add(ifd);
    const count = entryCount(ifd);
    if (count <= 0 || count > 1024) return depth > 0;
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (u16(entry) === GPS_IFD_TAG) blankGpsIfd(u32(entry + 8));
    }
    ifd = u32(ifd + 2 + count * 12);
  }
  return true;
}

/** Every "Exif\0\0"-prefixed TIFF in the buffer: JPEG APP1 (MPO frames too), HEIC/AVIF Exif items, WebP. */
function blankAllExif(buf: Buffer): void {
  let at = buf.indexOf(EXIF_MARK);
  while (at !== -1) {
    blankTiffGps(buf, at + EXIF_MARK.length, buf.length);
    at = buf.indexOf(EXIF_MARK, at + EXIF_MARK.length);
  }
}

// ── XMP ─────────────────────────────────────────────────────────────────────

function isXmpLocationName(qualifiedName: string): boolean {
  const colon = qualifiedName.indexOf(':');
  if (colon === -1) return false;
  const local = qualifiedName.slice(colon + 1).toLowerCase();
  return local.startsWith('gps') || XMP_LOCATION_FIELDS.has(local);
}

function isXmlSpace(char: string | undefined): boolean {
  return char === ' ' || char === '\n' || char === '\r' || char === '\t';
}

/** Index of the `>` closing the tag that starts before `from`, quotes respected. */
function findTagEnd(text: string, from: number): number {
  let quote: string | null = null;
  for (let i = from; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return i;
    }
  }
  return -1;
}

/** Collects the location attributes between a tag's name and its `>`; false on a malformed tag. */
function collectLocationAttributes(text: string, from: number, to: number, ranges: Array<[number, number]>): boolean {
  let i = from;
  while (i < to) {
    while (i < to && (isXmlSpace(text[i]) || text[i] === '/')) i++;
    if (i >= to) break;
    const start = i;
    while (i < to && text[i] !== '=' && !isXmlSpace(text[i])) i++;
    const name = text.slice(start, i);
    while (i < to && isXmlSpace(text[i])) i++;
    if (text[i] !== '=') return false;
    i++;
    while (i < to && isXmlSpace(text[i])) i++;
    const quote = text[i];
    if (quote !== '"' && quote !== "'") return false;
    const close = text.indexOf(quote, i + 1);
    if (close === -1 || close > to) return false;
    if (isXmpLocationName(name)) ranges.push([start, close + 1]);
    i = close + 1;
  }
  return true;
}

/**
 * The character ranges of an XMP packet that hold a location: whole elements
 * (exif:GPSLatitude, photoshop:City, Iptc4xmpExt:LocationShown …) and
 * attributes of the same names. Null when the packet does not parse.
 */
function xmpLocationRanges(text: string): Array<[number, number]> | null {
  const ranges: Array<[number, number]> = [];
  let i = text.indexOf('<');
  while (i !== -1) {
    const next = text[i + 1];
    if (next === '/' || next === '?' || next === '!') {
      i = text.indexOf('<', i + 1);
      continue;
    }
    let nameEnd = i + 1;
    while (nameEnd < text.length && !isXmlSpace(text[nameEnd]) && text[nameEnd] !== '>' && text[nameEnd] !== '/') {
      nameEnd++;
    }
    const name = text.slice(i + 1, nameEnd);
    const tagEnd = findTagEnd(text, nameEnd);
    if (tagEnd === -1) return null;
    if (isXmpLocationName(name)) {
      let end = tagEnd + 1;
      if (text[tagEnd - 1] !== '/') {
        const close = text.indexOf(`</${name}`, tagEnd);
        const closeEnd = close === -1 ? -1 : text.indexOf('>', close);
        if (closeEnd === -1) return null;
        end = closeEnd + 1;
      }
      ranges.push([i, end]);
      i = text.indexOf('<', end);
      continue;
    }
    if (!collectLocationAttributes(text, nameEnd, tagEnd, ranges)) return null;
    i = text.indexOf('<', tagEnd + 1);
  }
  return ranges;
}

/** Blanks the location properties of every XMP packet in [from, to); false when one does not parse. */
function blankAllXmp(buf: Buffer, from = 0, to = buf.length): boolean {
  let at = buf.indexOf(RDF_OPEN, from);
  while (at !== -1 && at < to) {
    const close = buf.indexOf(RDF_CLOSE, at);
    if (close === -1 || close + RDF_CLOSE.length > to) return false;
    const end = close + RDF_CLOSE.length;
    // latin1 maps every byte to one character, so string indexes are byte offsets.
    const ranges = xmpLocationRanges(buf.toString('latin1', at, end));
    if (!ranges) return false;
    for (const [start, stop] of ranges) buf.fill(SPACE, at + start, at + stop);
    at = buf.indexOf(RDF_OPEN, end);
  }
  return true;
}

// ── IPTC-IIM (JPEG APP13) ───────────────────────────────────────────────────

/** Overwrites the place datasets of an IIM block with spaces; false when it does not parse. */
function blankIimLocation(buf: Buffer, from: number, to: number): boolean {
  let pos = from;
  // Writers may pad the block with zeros after the last dataset.
  while (pos + 5 <= to && buf[pos] !== 0) {
    if (buf[pos] !== 0x1c) return false;
    const record = buf[pos + 1];
    const dataset = buf[pos + 2];
    let length = buf.readUInt16BE(pos + 3);
    let value = pos + 5;
    // Extended dataset: the low 15 bits give the byte count of the real length.
    if (length & 0x8000) {
      const lengthBytes = length & 0x7fff;
      if (lengthBytes < 1 || lengthBytes > 4 || value + lengthBytes > to) return false;
      length = buf.readUIntBE(value, lengthBytes);
      value += lengthBytes;
    }
    if (value + length > to) return false;
    if (record === 2 && IPTC_LOCATION_DATASETS.has(dataset)) buf.fill(SPACE, value, value + length);
    pos = value + length;
  }
  return true;
}

/** Walks the 8BIM resources of a Photoshop APP13 block and cleans its IPTC record. */
function blankPhotoshopIptc(buf: Buffer, from: number, to: number): boolean {
  let pos = from;
  while (pos + 12 <= to) {
    if (buf.toString('latin1', pos, pos + 4) !== '8BIM') return false;
    const id = buf.readUInt16BE(pos + 4);
    // A Pascal name, padded so that its length byte and the name together are even.
    const nameLength = buf[pos + 6];
    const sizeAt = pos + 7 + nameLength + ((nameLength + 1) % 2);
    if (sizeAt + 4 > to) return false;
    const size = buf.readUInt32BE(sizeAt);
    const data = sizeAt + 4;
    if (data + size > to) return false;
    if (id === IPTC_RESOURCE_ID && !blankIimLocation(buf, data, data + size)) return false;
    pos = data + size + (size % 2);
  }
  return true;
}

/** Cleans the IPTC place fields of every Photoshop APP13 segment ahead of the image data. */
function blankJpegIptc(buf: Buffer): boolean {
  let pos = 2;
  while (pos + 4 <= buf.length && buf[pos] === 0xff) {
    const marker = buf[pos + 1];
    // A fill byte ahead of the marker.
    if (marker === 0xff) {
      pos++;
      continue;
    }
    // Start of scan or end of image: no metadata segment follows.
    if (marker === 0xda || marker === 0xd9) break;
    const end = pos + 2 + buf.readUInt16BE(pos + 2);
    if (end > buf.length) break;
    const markAt = pos + 4;
    const isPhotoshop = buf.subarray(markAt, markAt + PHOTOSHOP_MARK.length).equals(PHOTOSHOP_MARK);
    if (marker === 0xed && isPhotoshop && !blankPhotoshopIptc(buf, markAt + PHOTOSHOP_MARK.length, end)) return false;
    pos = end;
  }
  return true;
}

// ── Containers held in memory ───────────────────────────────────────────────

/** WebP may carry its EXIF chunk without the "Exif\0\0" prefix the generic scan looks for. */
function blankWebpExifChunk(buf: Buffer): void {
  let pos = 12;
  while (pos + 8 <= buf.length) {
    const size = buf.readUInt32LE(pos + 4);
    const data = pos + 8;
    if (buf.toString('latin1', pos, pos + 4) === 'EXIF') blankTiffGps(buf, data, Math.min(buf.length, data + size));
    pos = data + size + (size % 2);
  }
}

/**
 * PNG checksums every chunk, so it is walked rather than scanned: eXIf loses
 * its GPS block, an uncompressed XMP iTXt its location properties, and a text
 * chunk that carries metadata this cannot read in place (compressed XMP, an
 * ImageMagick "Raw profile") is renamed to a private ancillary type every
 * decoder skips, with its data zeroed. Each changed chunk gets a new CRC.
 */
function redactPng(buf: Buffer): boolean {
  let pos = 8;
  while (pos + 12 <= buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = pos + 8;
    const end = data + length;
    if (end + 4 > buf.length) return false;
    let changed = false;
    if (type === 'eXIf') {
      const tiff = buf.subarray(data, data + EXIF_MARK.length).equals(EXIF_MARK) ? data + EXIF_MARK.length : data;
      if (!blankTiffGps(buf, tiff, end)) return false;
      changed = true;
    } else if (type === 'iTXt' || type === 'tEXt' || type === 'zTXt') {
      const keywordEnd = buf.indexOf(0, data);
      const keyword = buf
        .toString('latin1', data, keywordEnd === -1 || keywordEnd > end ? end : keywordEnd)
        .toLowerCase();
      if (keyword.includes('xmp') || keyword.includes('exif') || keyword.startsWith('raw profile')) {
        const plainXmp = type === 'iTXt' && keyword === 'xml:com.adobe.xmp' && buf[keywordEnd + 1] === 0;
        if (plainXmp) {
          if (!blankAllXmp(buf, keywordEnd, end)) return false;
        } else {
          buf.write('prIv', pos + 4, 'latin1');
          buf.fill(0, data, end);
        }
        changed = true;
      }
    }
    if (changed) buf.writeUInt32BE(zlib.crc32(buf.subarray(pos + 4, end)), end);
    if (type === 'IEND') break;
    pos = end + 4;
  }
  return true;
}

/**
 * Redacts an image held in memory, in place. False for a format this does not
 * know (BMP, a truncated file) or a metadata block it could not parse.
 */
export function redactLocationInBuffer(buf: Buffer): boolean {
  const format = sniffFormat(buf);
  switch (format) {
    case 'png':
      return redactPng(buf);
    case 'tiff':
      if (!blankTiffGps(buf, 0, buf.length)) return false;
      break;
    case 'webp':
      blankWebpExifChunk(buf);
      break;
    case 'jpeg':
      if (!blankJpegIptc(buf)) return false;
      break;
    case 'gif':
    case 'isobmff':
      break;
    default:
      return false;
  }
  blankAllExif(buf);
  return blankAllXmp(buf);
}

// ── Movies (QuickTime / MP4), patched on disk ───────────────────────────────

interface Box {
  type: string;
  start: number;
  body: number;
  end: number;
}

async function readAt(handle: FileHandle, position: number, length: number): Promise<Buffer> {
  const buf = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buf, 0, length, position);
  return buf.subarray(0, bytesRead);
}

/** Runs `step` on each item in order, stopping at the first false. */
function everyInOrder<T>(items: readonly T[], step: (item: T) => Promise<boolean>): Promise<boolean> {
  return items.reduce<Promise<boolean>>((done, item) => done.then((ok) => ok && step(item)), Promise.resolve(true));
}

/** The boxes in [from, to), headers only; null when one overruns its parent. */
async function readBoxes(handle: FileHandle, from: number, to: number, found: Box[] = []): Promise<Box[] | null> {
  if (from + 8 > to) return found;
  const head = await readAt(handle, from, 16);
  if (head.length < 8) return null;
  let size = head.readUInt32BE(0);
  let headerLength = 8;
  if (size === 1) {
    if (head.length < 16) return null;
    size = Number(head.readBigUInt64BE(8));
    headerLength = 16;
  } else if (size === 0) {
    size = to - from;
  }
  if (size < headerLength || from + size > to) return null;
  found.push({ type: head.toString('latin1', 4, 8), start: from, body: from + headerLength, end: from + size });
  return readBoxes(handle, from + size, to, found);
}

async function blankXmpRegion(handle: FileHandle, from: number, to: number): Promise<boolean> {
  if (to - from > MAX_XMP_BYTES) return false;
  const buf = await readAt(handle, from, to - from);
  if (!blankAllXmp(buf)) return false;
  await handle.write(buf, 0, buf.length, from);
  return true;
}

/** Zeroes the value of every `data` box inside an ilst item, keeping their headers. */
async function zeroItemValues(handle: FileHandle, item: Box): Promise<boolean> {
  const values = await readBoxes(handle, item.body, item.end);
  if (!values) return false;
  // data box: size, 'data', type indicator (4), locale (4), then the value.
  const data = values.filter((value) => value.type === 'data' && value.end > value.body + 8);
  await Promise.all(
    data.map((value) =>
      handle.write(Buffer.alloc(value.end - value.body - 8), 0, value.end - value.body - 8, value.body + 8),
    ),
  );
  return true;
}

/** 1-based indexes of the `keys` entries that name a location (com.apple.quicktime.location.ISO6709 …). */
async function locationKeyIndexes(handle: FileHandle, keys: Box): Promise<Set<number> | null> {
  if (keys.end - keys.body > MAX_XMP_BYTES) return null;
  const buf = await readAt(handle, keys.body, keys.end - keys.body);
  const found = new Set<number>();
  if (buf.length < 8) return found;
  const count = buf.readUInt32BE(4);
  let pos = 8;
  for (let index = 1; index <= count; index++) {
    if (pos + 8 > buf.length) return null;
    const size = buf.readUInt32BE(pos);
    if (size < 8 || pos + size > buf.length) return null;
    const name = buf.toString('latin1', pos + 8, pos + size).toLowerCase();
    if (name.includes('location')) found.add(index);
    pos += size;
  }
  return found;
}

async function redactItemList(handle: FileHandle, ilst: Box, locationKeys: Set<number>): Promise<boolean> {
  const items = await readBoxes(handle, ilst.body, ilst.end);
  if (!items) return false;
  // An item's type is the 1-based index of its key, or an iTunes atom name.
  const located = items.filter(
    (item) => item.type === LOCATION_ATOM || locationKeys.has(Buffer.from(item.type, 'latin1').readUInt32BE(0)),
  );
  return everyInOrder(located, (item) => zeroItemValues(handle, item));
}

async function redactMeta(handle: FileHandle, meta: Box): Promise<boolean> {
  // ISO meta is a full box (4 bytes of version and flags before its children);
  // QuickTime's moov/meta is not. The handler box always comes first.
  const peek = await readAt(handle, meta.body, 12);
  const childrenFrom = peek.toString('latin1', 4, 8) === 'hdlr' ? meta.body : meta.body + 4;
  const children = await readBoxes(handle, childrenFrom, meta.end);
  if (!children) return false;
  const keys = children.find((child) => child.type === 'keys');
  const locationKeys = keys ? await locationKeyIndexes(handle, keys) : new Set<number>();
  if (!locationKeys) return false;
  return everyInOrder(children, (child) =>
    child.type === 'ilst' ? redactItemList(handle, child, locationKeys) : redactMovieBox(handle, child),
  );
}

const MOVIE_CONTAINERS = new Set(['moov', 'trak', 'udta']);

/** Whether the ftyp box at the start of `head` names a still HEIF/AVIF image. */
function isStillImageBrand(head: Buffer): boolean {
  return head.length >= 12 && STILL_IMAGE_BRANDS.has(head.toString('latin1', 8, 12));
}

async function redactMovieBox(handle: FileHandle, box: Box): Promise<boolean> {
  if (MOVIE_CONTAINERS.has(box.type)) {
    const children = await readBoxes(handle, box.body, box.end);
    return children !== null && everyInOrder(children, (child) => redactMovieBox(handle, child));
  }
  switch (box.type) {
    case 'meta':
      return redactMeta(handle, box);
    case LOCATION_ATOM:
    case 'loci':
      // The place atoms phones and cameras write into udta (ISO 6709 string,
      // 3GPP location). A free box of the same size is skipped by every
      // reader, and its content is zeroed with it.
      await handle.write(Buffer.from('free', 'latin1'), 0, 4, box.start + 4);
      await handle.write(Buffer.alloc(box.end - box.body), 0, box.end - box.body, box.body);
      return true;
    case 'XMP_':
      return blankXmpRegion(handle, box.body, box.end);
    case 'uuid': {
      const id = await readAt(handle, box.body, 16);
      return id.equals(XMP_UUID) ? blankXmpRegion(handle, box.body + 16, box.end) : true;
    }
    default:
      return true;
  }
}

/** exifr as a second opinion on an image: any GPS it still reads fails the file. */
async function exifrFindsGps(buf: Buffer): Promise<boolean> {
  try {
    const gps = (await exifr.gps(buf)) as { latitude?: number } | undefined;
    return gps?.latitude !== undefined && Number.isFinite(gps.latitude);
  } catch {
    // A file exifr cannot read holds nothing it would hand out either.
    return false;
  }
}

/**
 * Redacts the media file at `file` in place (the caller's own copy). True when
 * it now carries no location this knows of; false when the format is unknown
 * or a metadata block could not be cleaned, and the file must not be served.
 */
export async function redactLocationInFile(file: string): Promise<boolean> {
  const handle = await fsPromises.open(file, 'r+');
  try {
    const { size } = await handle.stat();
    const head = await readAt(handle, 0, 16);
    const format = sniffFormat(head);
    // WebM/Matroska has no location field a camera or phone writes.
    if (format === 'ebml') return true;
    let walked = true;
    if (format === 'isobmff' || format === 'quicktime') {
      const top = await readBoxes(handle, 0, size);
      if (top?.some((box) => box.type === 'moov')) return await everyInOrder(top, (box) => redactMovieBox(handle, box));
      // The image path never reaches udta atoms, so a movie this cannot walk
      // (truncated, junk after mdat) is refused. Only a still HEIF/AVIF image
      // goes on to be cleaned in memory.
      if (format === 'quicktime' || !isStillImageBrand(head)) return false;
      walked = top !== null;
    }
    if (format === 'unknown' || size > MAX_IMAGE_BYTES) return false;
    const buf = await readAt(handle, 0, size);
    // An image whose boxes did not parse may still hide a movie header.
    if (!walked && buf.includes(MOOV)) return false;
    if (!redactLocationInBuffer(buf)) return false;
    await handle.write(buf, 0, buf.length, 0);
    return !(await exifrFindsGps(buf));
  } finally {
    await handle.close();
  }
}
