import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { applyGlobalMiddleware } from '../../../src/middleware/globalMiddleware';

async function directiveSources(name: string): Promise<string[]> {
  const app = express();
  applyGlobalMiddleware(app);
  app.get('/probe', (_req, res) => res.json({ ok: true }));

  const res = await request(app).get('/probe');
  const csp = String(res.headers['content-security-policy'] || '');
  const directive = csp
    .split(';')
    .map(d => d.trim())
    .find(d => d.startsWith(name));

  return directive ? directive.split(/\s+/).slice(1) : [];
}

const connectSrcSources = () => directiveSources('connect-src');

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

describe('global CSP: script-src', () => {
  it("allows 'wasm-unsafe-eval' so the WASM decoders keep running", async () => {
    expect(await directiveSources('script-src')).toContain("'wasm-unsafe-eval'");
  });

  it("still allows 'unsafe-eval', which heic-to needs to decode an iPhone photo", async () => {
    // Pinned so the next tidy-up of this list finds the reason before the
    // consequence: libheif initialises embind with new Function(), and without
    // this every .heic upload fails in the browser. See the comment on the
    // directive for how to actually get rid of it.
    expect(await directiveSources('script-src')).toContain("'unsafe-eval'");
  });
});

describe('forced-HTTPS redirect', () => {
  const saved = { FORCE_HTTPS: process.env.FORCE_HTTPS, APP_URL: process.env.APP_URL };

  afterEach(() => {
    process.env.FORCE_HTTPS = saved.FORCE_HTTPS;
    process.env.APP_URL = saved.APP_URL;
    if (saved.FORCE_HTTPS === undefined) delete process.env.FORCE_HTTPS;
    if (saved.APP_URL === undefined) delete process.env.APP_URL;
  });

  async function redirectLocation(): Promise<string> {
    const app = express();
    applyGlobalMiddleware(app);
    app.get('/trips', (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/trips').set('Host', 'evil.example.com');
    return String(res.headers.location || '');
  }

  it('redirects to the configured APP_URL host, not the Host header the caller sent', async () => {
    process.env.FORCE_HTTPS = 'true';
    process.env.APP_URL = 'https://trip.pakulat.org';
    expect(await redirectLocation()).toBe('https://trip.pakulat.org/trips');
  });

  it('falls back to the request host when APP_URL is unset', async () => {
    process.env.FORCE_HTTPS = 'true';
    delete process.env.APP_URL;
    expect(await redirectLocation()).toBe('https://evil.example.com/trips');
  });

  it('falls back to the request host when APP_URL is not a URL', async () => {
    // A typo in the env should not take the instance down, and it should not
    // produce a redirect to a host built from a half-parsed string either.
    process.env.FORCE_HTTPS = 'true';
    process.env.APP_URL = 'not a url';
    expect(await redirectLocation()).toBe('https://evil.example.com/trips');
  });

  it('leaves an already-secure request alone, and never redirects the health probe', async () => {
    process.env.FORCE_HTTPS = 'true';
    process.env.APP_URL = 'https://trip.pakulat.org';
    const app = express();
    applyGlobalMiddleware(app);
    app.get('/trips', (_req, res) => res.json({ ok: true }));
    app.get('/api/health', (_req, res) => res.json({ ok: true }));

    // The proxy already terminated TLS, so there is nothing to upgrade.
    const forwarded = await request(app).get('/trips').set('X-Forwarded-Proto', 'https');
    expect(forwarded.status).toBe(200);

    // The container probe talks plain HTTP on the loopback and must not be
    // bounced to a hostname it cannot resolve.
    const probe = await request(app).get('/api/health');
    expect(probe.status).toBe(200);
  });
});
