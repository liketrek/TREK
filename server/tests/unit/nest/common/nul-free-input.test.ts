/**
 * The HTTP edge of the NUL rule (src/nest/common/nul-free-input.ts): what a
 * request carries loses its NUL characters before any guard or controller
 * reads it. tests/integration/nul-free-input.test.ts drives the same rule
 * through the whole app on SQLite and on Postgres.
 */
import { NulFreeInputPipe, nulFreeRequest, withoutEncodedNul } from '../../../../src/nest/common/nul-free-input';

import type { Request, Response } from 'express';
import nodeHttp from 'node:http';
import net from 'node:net';
import { describe, expect, it, vi } from 'vitest';

function run(req: Partial<Request> & { cookies?: unknown; signedCookies?: unknown }) {
  const next = vi.fn();
  nulFreeRequest(req as Request, {} as Response, next);
  expect(next).toHaveBeenCalledWith();
  return req;
}

describe('withoutEncodedNul', () => {
  it('drops every %00 from the path and the query string', () => {
    expect(withoutEncodedNul('/api/trips/7%00/places?search=a%00b&x=%00')).toBe('/api/trips/7/places?search=ab&x=');
  });

  it('cannot be tricked into leaving one behind', () => {
    expect(withoutEncodedNul('/a?q=%%0000')).toBe('/a?q=');
    expect(withoutEncodedNul('/a?q=%%%000000')).toBe('/a?q=');
  });

  it('keeps an encoded percent sign followed by 00, which decodes to the text %00', () => {
    expect(withoutEncodedNul('/a?q=%2500')).toBe('/a?q=%2500');
  });
});

describe('nulFreeRequest', () => {
  it('cleans the url, the body and both cookie jars', () => {
    const req = run({
      url: '/api/auth/x%00?e=a%00',
      body: { email: 'victim@x.test\u0000', password: 'pa\u0000ss' },
      cookies: { trek_session: 'tok\u0000en' },
      signedCookies: { s: 'v\u0000' },
    });
    expect(req.url).toBe('/api/auth/x?e=a');
    expect(req.body).toEqual({ email: 'victim@x.test', password: 'pa\u0000ss' });
    expect(req.cookies).toEqual({ trek_session: 'token' });
    expect(req.signedCookies).toEqual({ s: 'v' });
  });

  it('leaves a request without a body or cookies as it is', () => {
    const req = run({ url: '/api/health' });
    expect(req).toEqual({ url: '/api/health' });
  });
});

describe('NulFreeInputPipe', () => {
  it('cleans what a route parsed itself, a multipart body and its file name', () => {
    const fields = Object.create(null) as Record<string, unknown>;
    fields.description = 'a\u0000b';
    const pipe = new NulFreeInputPipe();
    expect({ ...(pipe.transform(fields) as object) }).toEqual({ description: 'ab' });
    expect(pipe.transform({ originalname: 'x\u0000.jpg' })).toEqual({ originalname: 'x.jpg' });
    expect(pipe.transform('7\u0000')).toBe('7');
    expect(pipe.transform(7)).toBe(7);
  });
});

describe('headers', () => {
  it('never reach TREK with a NUL: Node answers 400 before any middleware runs', async () => {
    const seen = vi.fn();
    const server = nodeHttp.createServer((_req, res) => {
      seen();
      res.end('ok');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const { port } = server.address() as net.AddressInfo;
      const status = await new Promise<string>((resolve, reject) => {
        const socket = net.connect(port, '127.0.0.1', () => {
          socket.write('GET / HTTP/1.1\r\nHost: x\r\nX-Email: a\u0000b\r\nConnection: close\r\n\r\n');
        });
        let raw = '';
        socket.on('data', (chunk: Buffer) => {
          raw += chunk.toString();
        });
        socket.on('end', () => resolve(raw.split('\r\n')[0]));
        socket.on('error', reject);
      });
      expect(status).toBe('HTTP/1.1 400 Bad Request');
      expect(seen).not.toHaveBeenCalled();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
