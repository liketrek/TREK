/**
 * Zip/tar-slip-safe extraction (#plugins, M4). Verifies containment (safeJoin),
 * happy-path extraction for tar.gz + zip, and that symlinks, traversal and
 * oversized archives are refused.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { safeJoin, extractArchive, ExtractError } from '../../../src/nest/plugins/install/safe-extract';

// ── tiny archive builders ────────────────────────────────────────────────────
function tarHeader(name: string, size: number, typeflag = '0', linkname = '', rawSize?: string): Buffer {
  const h = Buffer.alloc(512, 0);
  h.write(name, 0);
  h.write('0000644', 100);
  h.write('0000000', 108);
  h.write('0000000', 116);
  // rawSize writes the 12-byte field verbatim, for headers a real tar would never
  // produce (negative, non-octal) — the reader has to survive those too.
  h.write(rawSize !== undefined ? rawSize.padEnd(11, ' ') : size.toString(8).padStart(11, '0'), 124);
  h.write('00000000000', 136);
  h.write('        ', 148); // checksum placeholder = spaces
  h.write(typeflag, 156);
  if (linkname) h.write(linkname, 157);
  h.write('ustar\0', 257);
  h.write('00', 263);
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += h[i];
  h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return h;
}
function makeTarGz(entries: Array<{ name: string; data?: string; type?: string; link?: string; rawSize?: string }>): Buffer {
  const parts: Buffer[] = [];
  for (const e of entries) {
    const body = Buffer.from(e.data ?? '');
    parts.push(tarHeader(e.name, e.type === '5' || e.type === '2' ? 0 : body.length, e.type ?? '0', e.link ?? '', e.rawSize));
    if (e.rawSize === undefined && e.type !== '5' && e.type !== '2') {
      parts.push(body);
      const pad = (512 - (body.length % 512)) % 512;
      if (pad) parts.push(Buffer.alloc(pad, 0));
    }
  }
  parts.push(Buffer.alloc(1024, 0));
  return zlib.gzipSync(Buffer.concat(parts));
}
function makeZip(name: string, data: string, method = 0): Buffer {
  const nameB = Buffer.from(name);
  const raw = Buffer.from(data);
  const comp = method === 8 ? zlib.deflateRawSync(raw) : raw;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(method, 8);
  local.writeUInt32LE(comp.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(nameB.length, 26);
  const localRec = Buffer.concat([local, nameB, comp]);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(method, 10);
  central.writeUInt32LE(comp.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(nameB.length, 28);
  central.writeUInt32LE(0, 42); // local header offset
  const centralRec = Buffer.concat([central, nameB]);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralRec.length, 12);
  eocd.writeUInt32LE(localRec.length, 16);
  return Buffer.concat([localRec, centralRec, eocd]);
}

let dest: string;
beforeEach(() => { dest = fs.mkdtempSync(path.join(os.tmpdir(), 'xtract-')); });
afterEach(() => { fs.rmSync(dest, { recursive: true, force: true }); });

describe('safeJoin', () => {
  it('allows a normal nested path', () => {
    expect(safeJoin(dest, 'server/index.js')).toBe(path.resolve(dest, 'server/index.js'));
  });
  it.each([['../escape', /traversal/], ['/etc/passwd', /absolute/], ['a/../../b', /traversal/]])(
    'rejects %s',
    (name, re) => {
      expect(() => safeJoin(dest, name)).toThrow(re as RegExp);
    },
  );
});

describe('extractArchive', () => {
  it('extracts a tar.gz (file + nested dir)', () => {
    const gz = makeTarGz([
      { name: 'trek-plugin.json', data: '{"id":"x"}' },
      { name: 'server/', type: '5' },
      { name: 'server/index.js', data: 'module.exports={}' },
    ]);
    extractArchive(gz, dest);
    expect(fs.readFileSync(path.join(dest, 'trek-plugin.json'), 'utf8')).toBe('{"id":"x"}');
    expect(fs.readFileSync(path.join(dest, 'server', 'index.js'), 'utf8')).toBe('module.exports={}');
  });

  it('extracts a stored zip', () => {
    extractArchive(makeZip('a.txt', 'hello'), dest);
    expect(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8')).toBe('hello');
  });

  it('extracts a deflated zip and rejects an unsupported compression method', () => {
    extractArchive(makeZip('b.txt', 'world', 8), dest);
    expect(fs.readFileSync(path.join(dest, 'b.txt'), 'utf8')).toBe('world');
    expect(() => extractArchive(makeZip('c.txt', 'x', 99), dest)).toThrow(/unsupported zip compression/);
  });

  it('refuses a symlink entry', () => {
    const gz = makeTarGz([{ name: 'link', type: '2', link: '/etc/passwd' }]);
    expect(() => extractArchive(gz, dest)).toThrow(/non-regular/);
  });

  it('refuses path traversal', () => {
    const gz = makeTarGz([{ name: '../evil.js', data: 'x' }]);
    expect(() => extractArchive(gz, dest)).toThrow(ExtractError);
  });

  it('enforces the total-size limit', () => {
    const gz = makeTarGz([{ name: 'big.bin', data: 'x'.repeat(2000) }]);
    expect(() => extractArchive(gz, dest, { maxTotalBytes: 1000 })).toThrow(/size limit/);
  });

  it('rejects an unsupported format', () => {
    expect(() => extractArchive(Buffer.from('not an archive'), dest)).toThrow(/unsupported/);
  });

  // A size field is 12 ASCII bytes of octal, and parseInt honours a leading minus.
  // The reader advanced by `512 + Math.ceil(size / 512) * 512`, which is zero at
  // -512 and negative below it: the cursor never leaves the first header, and every
  // pass appends another member until the heap is gone. Synchronous, on the main
  // thread, from a 70-byte upload.
  it('refuses a negative entry size instead of looping on it', () => {
    const gz = makeTarGz([{ name: 'evil.txt', rawSize: '-1000' }]);
    expect(() => extractArchive(gz, dest)).toThrow(ExtractError);
    expect(() => extractArchive(gz, dest)).toThrow(/invalid entry size/);
  });

  it('refuses a size field that is not a number at all', () => {
    const gz = makeTarGz([{ name: 'evil.txt', rawSize: 'not-octal' }]);
    expect(() => extractArchive(gz, dest)).toThrow(/invalid entry size/);
  });
});
