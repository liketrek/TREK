/**
 * Request correlation in the global middleware: every response says which id
 * its request ran under, a well-formed X-Request-Id from the proxy is kept,
 * and the access log writes a 5xx with that id and the stack the exception
 * filter left behind, as one entry. REQID-001 through REQID-008.
 */
import { applyGlobalMiddleware } from '../../../src/middleware/globalMiddleware';
import { httpConfig } from '../../../src/nest/app-config/tokens';
import { ACCESS_LOG_ATTACHED, UNHANDLED_ERROR, currentCorrelation } from '../../../src/nest/common/request-correlation';

import express, { type Request, type Response } from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const log = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => log);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The correlation each logError call was made in, captured at call time. */
const loggedUnder: Array<string | undefined> = [];

function app() {
  const a = express();
  applyGlobalMiddleware(a, { http: httpConfig() });
  a.get('/api/echo', (_req: Request, res: Response) => {
    res.json({ id: currentCorrelation()?.id ?? null, kind: currentCorrelation()?.kind ?? null });
  });
  a.get('/api/after-await', async (_req: Request, res: Response) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    res.json({ id: currentCorrelation()?.id ?? null });
  });
  // bootstrap.ts registers the body parsers after the global middleware, so a
  // handler with a body is reached from the parser's stream callback.
  a.use(express.json());
  a.use(express.urlencoded({ extended: true }));
  a.post('/api/with-body', (req: Request, res: Response) => {
    res.json({ id: currentCorrelation()?.id ?? null, body: req.body as unknown });
  });
  a.get('/api/boom', (_req: Request, res: Response) => {
    // What TrekExceptionFilter does for a 5xx when the access log watches the response.
    expect(res.locals[ACCESS_LOG_ATTACHED]).toBe(true);
    res.locals[UNHANDLED_ERROR] = new Error('kaput');
    res.status(500).json({ error: 'Internal server error' });
  });
  return a;
}

beforeEach(() => {
  vi.clearAllMocks();
  loggedUnder.length = 0;
  log.logError.mockImplementation(() => {
    loggedUnder.push(currentCorrelation()?.id);
  });
});

describe('X-Request-Id', () => {
  it('REQID-001: a request without one gets a fresh id, on the response and in its context', async () => {
    const res = await request(app()).get('/api/echo');
    expect(res.headers['x-request-id']).toMatch(UUID);
    expect(res.body).toEqual({ id: res.headers['x-request-id'], kind: 'http' });
  });

  it('REQID-002: a well-formed id from the proxy is kept', async () => {
    const res = await request(app()).get('/api/echo').set('X-Request-Id', 'proxy-1234.abc');
    expect(res.headers['x-request-id']).toBe('proxy-1234.abc');
    expect(res.body.id).toBe('proxy-1234.abc');
  });

  it('REQID-003: a malformed one is replaced, never echoed', async () => {
    const res = await request(app()).get('/api/echo').set('X-Request-Id', 'not an id <b>');
    expect(res.headers['x-request-id']).toMatch(UUID);
  });

  it('REQID-004: the id survives an await in the handler', async () => {
    const res = await request(app()).get('/api/after-await');
    expect(res.body.id).toBe(res.headers['x-request-id']);
  });

  it('REQID-005: two requests never share an id', async () => {
    const a = app();
    const [one, two] = await Promise.all([request(a).get('/api/echo'), request(a).get('/api/echo')]);
    expect(one.headers['x-request-id']).not.toBe(two.headers['x-request-id']);
  });
});

describe('requests with a body', () => {
  it('REQID-007: a JSON body parsed by express.json() keeps the id in the handler', async () => {
    const res = await request(app()).post('/api/with-body').send({ a: 1 });
    expect(res.body).toEqual({ id: res.headers['x-request-id'], body: { a: 1 } });
  });

  it('REQID-008: so does a body that arrives in several chunks after the middleware returned', async () => {
    const server = app().listen(0);
    try {
      const { port } = server.address() as AddressInfo;
      const answer = await new Promise<{ header: unknown; payload: { id: string | null; body: unknown } }>(
        (resolve, reject) => {
          const req = http.request(
            {
              port,
              path: '/api/with-body',
              method: 'POST',
              headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' },
            },
            (res) => {
              let raw = '';
              res.setEncoding('utf8');
              res.on('data', (chunk: string) => (raw += chunk));
              res.on('end', () =>
                resolve({
                  header: res.headers['x-request-id'],
                  payload: JSON.parse(raw) as { id: string | null; body: unknown },
                }),
              );
            },
          );
          req.on('error', reject);
          const chunks = ['{"a":', '1,"b"', ':2}'];
          const writeNext = () => {
            const chunk = chunks.shift();
            if (chunk === undefined) {
              req.end();
              return;
            }
            req.write(chunk);
            setTimeout(writeNext, 10);
          };
          writeNext();
        },
      );
      expect(answer.header).toMatch(UUID);
      expect(answer.payload).toEqual({ id: answer.header, body: { a: 1, b: 2 } });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe('the access log', () => {
  it('REQID-006: a 5xx is one entry with the request line, the stack and the request id', async () => {
    const res = await request(app()).get('/api/boom');
    expect(res.status).toBe(500);
    await vi.waitFor(() => expect(log.logError).toHaveBeenCalledTimes(1));
    const line = String(log.logError.mock.calls[0][0]);
    expect(line).toMatch(/^GET \/api\/boom 500 \d+ms ip=/);
    expect(line).toContain('\nError: kaput');
    expect(loggedUnder[0]).toBe(res.headers['x-request-id']);
  });
});
