import { precompressedStatic } from '../../../src/nest/platform/precompressed-static';

import express from 'express';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

const SCRIPT = 'export const answer = 42;\n'.repeat(200);
const STYLE = '.map { inset: 0 }\n'.repeat(200);

describe('precompressedStatic', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trek-public-'));
  const assets = path.join(root, 'assets');
  mkdirSync(path.join(assets, 'nested'), { recursive: true });
  writeFileSync(path.join(assets, 'index-AbCd1234.js'), SCRIPT);
  writeFileSync(path.join(assets, 'index-AbCd1234.js.br'), brotliCompressSync(SCRIPT));
  writeFileSync(path.join(assets, 'nested', 'Map-AbCd1234.css'), STYLE);
  writeFileSync(path.join(assets, 'nested', 'Map-AbCd1234.css.br'), brotliCompressSync(STYLE));
  writeFileSync(path.join(assets, 'plain-AbCd1234.js'), SCRIPT);
  const WASM = Buffer.alloc(4096, 7);
  writeFileSync(path.join(assets, 'engine-AbCd1234.wasm'), WASM);
  writeFileSync(path.join(assets, 'engine-AbCd1234.wasm.br'), brotliCompressSync(WASM));
  writeFileSync(path.join(root, 'secret.js'), SCRIPT);
  writeFileSync(path.join(root, 'secret.js.br'), brotliCompressSync(SCRIPT));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const app = express();
  app.use(precompressedStatic(assets));
  app.use(express.static(root));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  const get = (url: string, acceptEncoding: string) => request(app).get(url).set('Accept-Encoding', acceptEncoding);

  it('PRECOMP-001: hands the Brotli copy to a browser that accepts br, typed as the original file', async () => {
    const res = await get('/assets/index-AbCd1234.js', 'gzip, deflate, br');

    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('br');
    // The very header the static handler sends for the file itself.
    const original = await get('/assets/index-AbCd1234.js', 'identity');
    expect(res.headers['content-type']).toBe(original.headers['content-type']);
    expect(res.headers['content-type']).toMatch(/javascript; charset=utf-8$/i);
    expect(res.headers['vary']).toContain('Accept-Encoding');
    expect(Number(res.headers['content-length'])).toBe(brotliCompressSync(SCRIPT).length);
    // supertest unpacks the body by its Content-Encoding, as a browser does.
    expect(res.text).toBe(SCRIPT);
  });

  it('PRECOMP-002: finds copies in nested folders and keeps the query string', async () => {
    const res = await get('/assets/nested/Map-AbCd1234.css?v=1', 'br');

    expect(res.headers['content-encoding']).toBe('br');
    expect(res.headers['content-type']).toMatch(/^text\/css/);
    expect(res.text).toBe(STYLE);
  });

  it.each(['gzip, deflate', 'identity', 'gzip, br;q=0'])(
    'PRECOMP-003: a client sending "%s" gets the file itself, still marked as varying',
    async (accept) => {
      const res = await get('/assets/index-AbCd1234.js', accept);

      expect(res.status).toBe(200);
      expect(res.headers['content-encoding']).toBeUndefined();
      expect(res.headers['vary']).toContain('Accept-Encoding');
      expect(res.text).toBe(SCRIPT);
    },
  );

  it('PRECOMP-004: a range request is answered from the uncompressed file', async () => {
    const res = await get('/assets/index-AbCd1234.js', 'br').set('Range', 'bytes=0-9');

    expect(res.status).toBe(206);
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.text).toBe(SCRIPT.slice(0, 10));
  });

  it('PRECOMP-005: answers HEAD like GET, and a conditional request with 304', async () => {
    const head = await request(app).head('/assets/index-AbCd1234.js').set('Accept-Encoding', 'br');
    expect(head.status).toBe(200);
    expect(head.headers['content-encoding']).toBe('br');

    const again = await get('/assets/index-AbCd1234.js', 'br').set('If-None-Match', head.headers['etag']);
    expect(again.status).toBe(304);
  });

  it('PRECOMP-006: leaves a file without a copy, another method and a path outside assets/ alone', async () => {
    const plain = await get('/assets/plain-AbCd1234.js', 'br');
    expect(plain.headers['content-encoding']).toBeUndefined();
    expect(plain.headers['vary']).toBeUndefined();
    expect(plain.text).toBe(SCRIPT);

    const post = await request(app).post('/assets/index-AbCd1234.js').set('Accept-Encoding', 'br');
    expect(post.status).toBe(404);
    expect(post.headers['content-encoding']).toBeUndefined();

    // A copy exists on disk, but outside the directory the middleware was given.
    const outside = await get('/secret.js', 'br');
    expect(outside.headers['content-encoding']).toBeUndefined();
    const climbing = await get('/assets/%2e%2e/secret.js', 'br');
    expect(climbing.headers['content-encoding']).toBeUndefined();
  });

  it('PRECOMP-008: a copy of a type without a charset is typed as the original, with no charset', async () => {
    const res = await get('/assets/engine-AbCd1234.wasm', 'br');

    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('br');
    expect(res.headers['content-type']).toBe('application/wasm');
  });

  it('PRECOMP-007: a build without copies is served as before', async () => {
    const bare = express();
    bare.use(precompressedStatic(path.join(root, 'missing')));
    bare.use(express.static(root));

    const res = await request(bare).get('/assets/index-AbCd1234.js').set('Accept-Encoding', 'br');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.text).toBe(SCRIPT);
  });
});
