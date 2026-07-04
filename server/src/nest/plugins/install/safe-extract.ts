import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Zip/tar-slip-safe extraction (#plugins, M4). Extracts an artifact into a fresh
 * directory, refusing anything that would escape it: absolute paths, ".."
 * segments, symlinks/hardlinks, non-regular entries, and oversized / too-many /
 * high-ratio (zip-bomb) archives. The containment check is the same idiom the
 * platform routes use for uploads.
 *
 * v1 supports gzip'd tar (codeload archives) and stored/deflated ZIP (release
 * assets) via a minimal reader — no third-party unpacker in the trust path.
 */

export interface ExtractLimits {
  maxTotalBytes?: number; // uncompressed
  maxEntries?: number;
  maxFileBytes?: number;
}
const DEFAULTS: Required<ExtractLimits> = {
  maxTotalBytes: 50 * 1024 * 1024,
  maxEntries: 4000,
  maxFileBytes: 25 * 1024 * 1024,
};

export class ExtractError extends Error {}

/** Assert a member path stays within dest; return the safe absolute path. */
export function safeJoin(dest: string, name: string): string {
  const norm = name.replace(/\\/g, '/');
  if (norm.startsWith('/') || /^[a-zA-Z]:/.test(norm)) throw new ExtractError(`absolute path rejected: ${name}`);
  if (norm.split('/').some((seg) => seg === '..')) throw new ExtractError(`path traversal rejected: ${name}`);
  const resolved = path.resolve(dest, norm);
  const root = path.resolve(dest);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) throw new ExtractError(`escapes destination: ${name}`);
  return resolved;
}

interface Member {
  name: string;
  type: 'file' | 'dir' | 'other';
  data?: Buffer;
}

export function extractArchive(buf: Buffer, dest: string, limits: ExtractLimits = {}): number {
  const lim = { ...DEFAULTS, ...limits };
  const isGzip = buf[0] === 0x1f && buf[1] === 0x8b;
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b;
  const members = isGzip ? readTarGz(buf, lim) : isZip ? readZip(buf, lim) : null;
  if (!members) throw new ExtractError('unsupported archive format (expected .tar.gz or .zip)');

  let total = 0;
  let count = 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const m of members) {
    if (++count > lim.maxEntries) throw new ExtractError('too many entries');
    if (m.type === 'other') throw new ExtractError(`non-regular entry rejected: ${m.name}`); // symlink/device/etc
    const target = safeJoin(dest, m.name);
    if (m.type === 'dir') {
      fs.mkdirSync(target, { recursive: true });
      continue;
    }
    const size = m.data?.length ?? 0;
    if (size > lim.maxFileBytes) throw new ExtractError(`file too large: ${m.name}`);
    total += size;
    if (total > lim.maxTotalBytes) throw new ExtractError('archive exceeds size limit');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, m.data ?? Buffer.alloc(0));
  }
  return total;
}

// ── minimal tar.gz reader ────────────────────────────────────────────────────
function readTarGz(buf: Buffer, lim: Required<ExtractLimits>): Member[] {
  const tar = zlib.gunzipSync(buf, { maxOutputLength: lim.maxTotalBytes + 1024 * 1024 });
  const members: Member[] = [];
  let off = 0;
  while (off + 512 <= tar.length) {
    const block = tar.subarray(off, off + 512);
    if (block.every((b) => b === 0)) break;
    let name = block.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const prefix = block.subarray(345, 500).toString('utf8').replace(/\0.*$/, '');
    if (prefix) name = `${prefix}/${name}`;
    const size = parseInt(block.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim() || '0', 8);
    const typeflag = String.fromCharCode(block[156]);
    off += 512;
    const data = tar.subarray(off, off + size);
    off += Math.ceil(size / 512) * 512;
    if (!name || name.endsWith('/PaxHeader/') || typeflag === 'x' || typeflag === 'g') continue;
    if (typeflag === '5') members.push({ name, type: 'dir' });
    else if (typeflag === '0' || typeflag === '\0' || typeflag === '') members.push({ name, type: 'file', data: Buffer.from(data) });
    else members.push({ name, type: 'other' }); // links (1,2), devices, fifo
  }
  return members;
}

// ── minimal ZIP reader (central directory) ───────────────────────────────────
function readZip(buf: Buffer, lim: Required<ExtractLimits>): Member[] {
  // Find End Of Central Directory.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new ExtractError('invalid zip (no EOCD)');
  const count = buf.readUInt16LE(eocd + 10);
  // Bound the entry count from the EOCD (up to 65535) BEFORE inflating anything.
  if (count > lim.maxEntries) throw new ExtractError('too many entries');
  let p = buf.readUInt32LE(eocd + 16); // central dir offset
  const members: Member[] = [];
  // Enforce the cumulative uncompressed budget AS WE GO, so a decompression bomb
  // (many entries each inflating to ~maxFileBytes) can't materialize gigabytes in
  // memory before the caller's write loop ever runs.
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new ExtractError('invalid zip (central header)');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const extAttr = buf.readUInt32LE(p + 38); // unix mode in high 16 bits
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const unixMode = (extAttr >>> 16) & 0xffff;
    const isSymlink = (unixMode & 0xf000) === 0xa000;
    // local header: recompute data start
    const lhNameLen = buf.readUInt16LE(lho + 26);
    const lhExtraLen = buf.readUInt16LE(lho + 28);
    const dataStart = lho + 30 + lhNameLen + lhExtraLen;
    const comp = buf.subarray(dataStart, dataStart + compSize);
    p += 46 + nameLen + extraLen + commentLen;

    if (isSymlink) { members.push({ name, type: 'other' }); continue; }
    if (name.endsWith('/')) { members.push({ name, type: 'dir' }); continue; }
    let data: Buffer;
    if (method === 0) {
      if (compSize > lim.maxFileBytes) throw new ExtractError(`file too large: ${name}`);
      data = Buffer.from(comp);
    } else if (method === 8) {
      data = zlib.inflateRawSync(comp, { maxOutputLength: lim.maxFileBytes + 1024 });
    } else throw new ExtractError(`unsupported zip compression method ${method}`);
    total += data.length;
    if (total > lim.maxTotalBytes) throw new ExtractError('archive exceeds size limit');
    members.push({ name, type: 'file', data });
  }
  return members;
}
