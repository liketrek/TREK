import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { MIN_BYTES, precompress } from '../../../scripts/lib/precompress.mjs';

let dir: string;
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function tree(files: Record<string, string | Buffer>) {
  dir = mkdtempSync(join(tmpdir(), 'trek-precompress-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

const script = 'export const answer = 42;\n'.repeat(200);

describe('precompress', () => {
  it('writes a Brotli copy that unpacks to the file, and counts what it saved', () => {
    const result = precompress(tree({ 'index-AbCd1234.js': script, 'nested/Map-AbCd1234.css': script }));

    expect(brotliDecompressSync(readFileSync(join(dir, 'index-AbCd1234.js.br'))).toString()).toBe(script);
    expect(existsSync(join(dir, 'nested/Map-AbCd1234.css.br'))).toBe(true);
    expect(result.files).toBe(2);
    expect(result.before).toBe(script.length * 2);
    expect(result.after).toBeLessThan(result.before);
  });

  it('leaves compressed formats and files under the size floor alone', () => {
    const result = precompress(
      tree({
        'font-AbCd1234.woff2': script,
        'clip-AbCd1234.mp4': script,
        'tiny-AbCd1234.js': 'x'.repeat(MIN_BYTES - 1),
      })
    );

    expect(result.files).toBe(0);
    expect(existsSync(join(dir, 'font-AbCd1234.woff2.br'))).toBe(false);
    expect(existsSync(join(dir, 'clip-AbCd1234.mp4.br'))).toBe(false);
    expect(existsSync(join(dir, 'tiny-AbCd1234.js.br'))).toBe(false);
  });

  it('writes no copy that would not be smaller than its file', () => {
    // Random bytes have nothing for a compressor to find.
    const result = precompress(tree({ 'noise-AbCd1234.json': randomBytes(4096) }));

    expect(result.files).toBe(0);
    expect(existsSync(join(dir, 'noise-AbCd1234.json.br'))).toBe(false);
  });

  it('does nothing for a build directory that is not there', () => {
    dir = join(tmpdir(), 'trek-precompress-missing');
    expect(precompress(dir)).toEqual({ files: 0, before: 0, after: 0 });
  });
});
