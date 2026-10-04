import { describe, it, expect } from 'vitest';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { applyGlobalMiddleware } from '../../../src/middleware/globalMiddleware';
import { readEnv } from '../../../src/app-config';
import { isSameHostOrigin } from '../../../src/nest/common/same-origin';

/**
 * An app with ALLOWED_ORIGINS set, and the error mapping TrekExceptionFilter
 * applies to a plain error (statusCode, else 500).
 */
function appWithAllowlist(corsOrigins: string[] | null) {
  const app = express();
  applyGlobalMiddleware(app, { http: { ...readEnv().http, corsOrigins } });
  app.post('/api/auth/login', (_req, res) => res.json({ ok: true }));
  app.use((err: { statusCode?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || 500;
    res.status(status).json({ error: status < 500 ? err.message : 'Internal server error' });
  });
  return app;
}

describe('CORS with ALLOWED_ORIGINS set (#2543)', () => {
  const app = appWithAllowlist(['https://trek.example.com']);

  it('lets a request through whose Origin is the host it was sent to', async () => {
    // The instance reached under another name than the one in ALLOWED_ORIGINS
    // (its LAN address, http instead of https): the login POST carries the page's
    // own Origin, and refusing it answered the login form with a 500.
    const res = await request(app)
      .post('/api/auth/login')
      .set('Host', '192.168.1.20:30080')
      .set('Origin', 'http://192.168.1.20:30080')
      .send({});
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://192.168.1.20:30080');
  });

  it('still lets the listed origin through, with credentials', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', 'https://trek.example.com').send({});
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://trek.example.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('still lets a request without Origin through', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(200);
  });

  it('refuses a foreign origin with a 403 that names the cause, not a 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Host', 'trek.example.com')
      .set('Origin', 'https://evil.example')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Not allowed by CORS' });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('refuses Origin: null', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', 'null').send({});
    expect(res.status).toBe(403);
  });
});

describe('CORS without ALLOWED_ORIGINS', () => {
  it('passes everything through as before (the test env is not production)', async () => {
    const res = await request(appWithAllowlist(null))
      .post('/api/auth/login')
      .set('Origin', 'https://anything.example')
      .send({});
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://anything.example');
  });
});

describe('isSameHostOrigin', () => {
  it('matches host and port', () => {
    expect(isSameHostOrigin('http://192.168.1.20:30080', '192.168.1.20:30080')).toBe(true);
    expect(isSameHostOrigin('https://trek.example.com', 'trek.example.com')).toBe(true);
    expect(isSameHostOrigin('https://Trek.Example.com', 'TREK.example.com')).toBe(true);
  });

  it('drops the default port of the Origin\'s scheme from the Host', () => {
    expect(isSameHostOrigin('https://trek.example.com', 'trek.example.com:443')).toBe(true);
    expect(isSameHostOrigin('http://trek.example.com', 'trek.example.com:80')).toBe(true);
  });

  it('does not match another host or another port', () => {
    expect(isSameHostOrigin('https://evil.example', 'trek.example.com')).toBe(false);
    expect(isSameHostOrigin('http://192.168.1.20:3000', '192.168.1.20:30080')).toBe(false);
    expect(isSameHostOrigin('https://trek.example.com.evil.example', 'trek.example.com')).toBe(false);
  });

  it('refuses anything that is not an http(s) origin or a plain host', () => {
    expect(isSameHostOrigin('null', 'trek.example.com')).toBe(false);
    expect(isSameHostOrigin(undefined, 'trek.example.com')).toBe(false);
    expect(isSameHostOrigin('https://trek.example.com', undefined)).toBe(false);
    expect(isSameHostOrigin('file://trek.example.com', 'trek.example.com')).toBe(false);
    expect(isSameHostOrigin('https://evil.example', 'x@evil.example')).toBe(false);
    expect(isSameHostOrigin('https://evil.example', 'evil.example/path')).toBe(false);
  });
});
