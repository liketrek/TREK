import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { applyGlobalMiddleware } from '../../../src/middleware/globalMiddleware';

async function connectSrcSources(): Promise<string[]> {
  const app = express();
  applyGlobalMiddleware(app);
  app.get('/probe', (_req, res) => res.json({ ok: true }));

  const res = await request(app).get('/probe');
  const csp = String(res.headers['content-security-policy'] || '');
  const directive = csp
    .split(';')
    .map(d => d.trim())
    .find(d => d.startsWith('connect-src'));

  return directive ? directive.split(/\s+/).slice(1) : [];
}

describe('global CSP: OpenStreetMap tile hosts (#1733)', () => {
  it('allows the bare tile.openstreetmap.org host', async () => {
    // A CSP wildcard host never matches the apex, so `*.tile.openstreetmap.org`
    // alone would block the tile prefetcher's fetch() against the single host
    // OSM has served from since it retired a/b/c/d sharding.
    expect(await connectSrcSources()).toContain('https://tile.openstreetmap.org');
  });

  it('still allows the sharded hosts for templates saved earlier', async () => {
    expect(await connectSrcSources()).toContain('https://*.tile.openstreetmap.org');
  });
});
