import {
  applyPlatformUploads,
  applyPlatformSpa,
  applyPlatformStatic,
  storageStaticHandler,
} from '../../../src/nest/platform/platform.routes';
import { SpaFallbackFilter } from '../../../src/nest/platform/spa-fallback.filter';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import { StorageNotFoundError, StorageInvalidKeyError } from '../../../src/nest/storage/storage.types';
import { NotFoundException } from '@nestjs/common';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- hoisted mock fns so the vi.mock factories can reference them -----------------
const h = vi.hoisted(() => ({
  verifyJwtAndLoadUser: vi.fn(),
  dbPrepare: vi.fn(),
  exists: vi.fn(),
  sendToResponse: vi.fn(),
}));

vi.mock('../../../src/nest/auth/jwt-verify', () => ({ verifyJwtAndLoadUser: h.verifyJwtAndLoadUser }));
vi.mock('../../../src/db/database', () => ({ db: { prepare: h.dbPrepare } }));

// The serving swap addresses files as (category, name) on the injected facade;
// these unit tests only assert routing/auth/error mapping, so a two-method stub
// is the whole storage surface.
const storage = { exists: h.exists, sendToResponse: h.sendToResponse } as unknown as StorageService;

// Tagged sentinel for express.static — we only need to know it was registered on
// the right path, not run it.
vi.mock('express', async () => {
  const staticFn = vi.fn(() => 'STATIC' as unknown);
  const fn: unknown = () => ({});
  Object.assign(fn as object, { static: staticFn });
  return { default: fn, static: staticFn };
});

type Handler = (...args: unknown[]) => unknown;

/**
 * A fake express.Application that records every route/middleware registration so
 * individual handlers can be pulled out and exercised in isolation.
 */
function fakeApp() {
  const calls: Array<{ method: string; path?: string; handlers: Handler[] }> = [];
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      if (typeof args[0] === 'string' || args[0] instanceof RegExp) {
        calls.push({ method, path: String(args[0]), handlers: args.slice(1) as Handler[] });
      } else {
        calls.push({ method, handlers: args as Handler[] });
      }
    };
  const app = {
    use: record('use'),
    get: record('get'),
    post: record('post'),
    delete: record('delete'),
  } as never;
  return { app, calls };
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status: vi.fn(function (this: typeof res, c: number) {
      this.statusCode = c;
      return this;
    }),
    json: vi.fn(function (this: typeof res, b: unknown) {
      this.body = b;
      return this;
    }),
    send: vi.fn(function (this: typeof res, b: unknown) {
      this.body = b;
      return this;
    }),
    end: vi.fn(function (this: typeof res) {
      return this;
    }),
    sendFile: vi.fn(function (this: typeof res, p: string) {
      this.body = `FILE:${p}`;
      return this;
    }),
    setHeader: vi.fn(function (this: typeof res, k: string, v: string) {
      this.headers[k] = v;
      return this;
    }),
  };
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('applyPlatformUploads', () => {
  it('registers the four static mounts + the files block', () => {
    const { app, calls } = fakeApp();
    applyPlatformUploads(app, storage);
    const paths = calls.filter((c) => c.method === 'use').map((c) => c.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/uploads/avatars',
        '/uploads/covers',
        '/uploads/journey',
        '/uploads/places',
        '/uploads/files',
      ]),
    );
  });

  it('the /uploads/files block always answers 401', () => {
    const { app, calls } = fakeApp();
    applyPlatformUploads(app, storage);
    const filesBlock = calls.find((c) => c.path === '/uploads/files')!.handlers[0];
    const res = makeRes();
    filesBlock({}, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toBe('Authentication required');
  });

  describe('GET /uploads/photos/:filename', () => {
    function photoHandler() {
      const { app, calls } = fakeApp();
      applyPlatformUploads(app, storage);
      return calls.find((c) => c.method === 'get' && c.path === '/uploads/photos/:filename')!.handlers[0];
    }
    const next = vi.fn();

    it('403 when the basename is a bare traversal segment', async () => {
      // Parity pin: the old resolve()+startsWith guard could only fire after
      // basename() when the remaining segment was '..'.
      const res = makeRes();
      await photoHandler()({ params: { filename: '..' }, headers: {}, query: {} }, res, next);
      expect(res.statusCode).toBe(403);
      expect(res.body).toBe('Forbidden');
      expect(h.exists).not.toHaveBeenCalled();
    });

    it('404 when the object does not exist — checked before auth', async () => {
      h.exists.mockResolvedValue(false);
      const res = makeRes();
      await photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: {} }, res, next);
      expect(h.exists).toHaveBeenCalledWith('photos', 'a.jpg');
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe('Not found');
      expect(h.verifyJwtAndLoadUser).not.toHaveBeenCalled();
    });

    it('404 when the key is invalid (exists rejects) — still before auth', async () => {
      h.exists.mockRejectedValue(new StorageInvalidKeyError('photos/.'));
      const res = makeRes();
      await photoHandler()({ params: { filename: '.' }, headers: {}, query: {} }, res, next);
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe('Not found');
    });

    it('401 when no token is supplied', async () => {
      h.exists.mockResolvedValue(true);
      const res = makeRes();
      await photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: {} }, res, next);
      expect(res.statusCode).toBe(401);
      expect(res.body).toBe('Authentication required');
    });

    it('serves the file for a valid JWT session (Bearer header)', async () => {
      h.exists.mockResolvedValue(true);
      h.sendToResponse.mockResolvedValue(undefined);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      const res = makeRes();
      await photoHandler()(
        { params: { filename: 'a.jpg' }, headers: { authorization: 'Bearer jwt123' }, query: {} },
        res,
        next,
      );
      expect(h.verifyJwtAndLoadUser).toHaveBeenCalledWith('jwt123');
      expect(h.sendToResponse).toHaveBeenCalledWith('photos', 'a.jpg', res);
    });

    it('reads the token from the query string when there is no Bearer header', async () => {
      h.exists.mockResolvedValue(true);
      h.sendToResponse.mockResolvedValue(undefined);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      const res = makeRes();
      await photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'qtok' } }, res, next);
      expect(h.verifyJwtAndLoadUser).toHaveBeenCalledWith('qtok');
      expect(h.sendToResponse).toHaveBeenCalledWith('photos', 'a.jpg', res);
    });

    it('401 when the token is not a session and the photo row is missing', async () => {
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      h.dbPrepare.mockReturnValue({ get: vi.fn().mockReturnValue(undefined) });
      const res = makeRes();
      await photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'share1' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('401 when a share token does not cover the photo trip', async () => {
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      const photoStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      const shareStmt = { get: vi.fn().mockReturnValue({ trip_id: 8 }) };
      h.dbPrepare.mockImplementationOnce(() => photoStmt).mockImplementationOnce(() => shareStmt);
      const res = makeRes();
      await photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'share1' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('401 when there is no matching share token at all', async () => {
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      const photoStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      const shareStmt = { get: vi.fn().mockReturnValue(undefined) };
      h.dbPrepare.mockImplementationOnce(() => photoStmt).mockImplementationOnce(() => shareStmt);
      const res = makeRes();
      await photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'share1' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('serves the file when the share token covers the photo trip', async () => {
      h.exists.mockResolvedValue(true);
      h.sendToResponse.mockResolvedValue(undefined);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      const photoStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      const shareStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      h.dbPrepare.mockImplementationOnce(() => photoStmt).mockImplementationOnce(() => shareStmt);
      const res = makeRes();
      await photoHandler()(
        { params: { filename: 'a.jpg' }, headers: { authorization: 'Bearer share1' }, query: {} },
        res,
        next,
      );
      expect(h.sendToResponse).toHaveBeenCalledWith('photos', 'a.jpg', res);
    });

    it('404 when the object vanishes between the exists check and the send', async () => {
      // Approved deviation D7: the delete race maps to the same 404 text.
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      h.sendToResponse.mockRejectedValue(new StorageNotFoundError('photos/a.jpg'));
      const res = makeRes();
      const resAny = res as unknown as { headersSent?: boolean };
      resAny.headersSent = false;
      await photoHandler()(
        { params: { filename: 'a.jpg' }, headers: { authorization: 'Bearer jwt123' }, query: {} },
        res,
        next,
      );
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe('Not found');
    });

    it('rethrows a non-miss send failure to the route error handler', async () => {
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      const boom = new Error('disk on fire');
      h.sendToResponse.mockRejectedValue(boom);
      const res = makeRes();
      const localNext = vi.fn();
      await photoHandler()(
        { params: { filename: 'a.jpg' }, headers: { authorization: 'Bearer jwt123' }, query: {} },
        res,
        localNext,
      );
      expect(localNext).toHaveBeenCalledWith(boom);
      expect(res.statusCode).toBe(200); // untouched — finalhandler owns it now
    });

    it('does not write a second 404 when the send fails after headers were flushed', async () => {
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      h.sendToResponse.mockRejectedValue(new StorageNotFoundError('photos/a.jpg'));
      const res = makeRes();
      (res as unknown as { headersSent: boolean }).headersSent = true;
      const localNext = vi.fn();
      await photoHandler()(
        { params: { filename: 'a.jpg' }, headers: { authorization: 'Bearer jwt123' }, query: {} },
        res,
        localNext,
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(localNext).toHaveBeenCalledWith(expect.any(StorageNotFoundError));
    });
  });
});

describe('storageStaticHandler', () => {
  const req = (over: Record<string, unknown> = {}) => ({ method: 'GET', path: '/x.png', ...over });

  function run(over: Record<string, unknown> = {}) {
    const handler = storageStaticHandler(storage, 'avatars');
    const res = makeRes();
    const next = vi.fn();
    const out = handler(req(over) as never, res as never, next as never);
    return { res, next, out };
  }

  it('serves a hit through sendToResponse with the decoded name', async () => {
    h.sendToResponse.mockResolvedValue(undefined);
    const { res, next, out } = run({ path: '//caf%C3%A9.png' });
    await out;
    expect(h.sendToResponse).toHaveBeenCalledWith('avatars', 'café.png', res);
    expect(next).not.toHaveBeenCalled();
  });

  it('non-GET/HEAD methods fall through without touching storage', async () => {
    const { next } = run({ method: 'POST' });
    expect(next).toHaveBeenCalledWith();
    expect(h.sendToResponse).not.toHaveBeenCalled();
  });

  it('undecodable percent-encoding falls through', async () => {
    const { next } = run({ path: '/%ZZ' });
    expect(next).toHaveBeenCalledWith();
    expect(h.sendToResponse).not.toHaveBeenCalled();
  });

  it('a miss calls next() with no args', async () => {
    h.sendToResponse.mockRejectedValue(new StorageNotFoundError('avatars/x.png'));
    const { next, out } = run();
    await out;
    expect(next).toHaveBeenCalledWith();
  });

  it('an invalid key calls next() with no args', async () => {
    h.sendToResponse.mockRejectedValue(new StorageInvalidKeyError('avatars/..'));
    const { next, out } = run();
    await out;
    expect(next).toHaveBeenCalledWith();
  });

  it('a send-layer 404 (stat→send race) falls through', async () => {
    h.sendToResponse.mockRejectedValue(Object.assign(new Error('ENOENT'), { status: 404 }));
    const { next, out } = run();
    await out;
    expect(next).toHaveBeenCalledWith();
  });

  it('EISDIR falls through', async () => {
    h.sendToResponse.mockRejectedValue(Object.assign(new Error('dir'), { code: 'EISDIR' }));
    const { next, out } = run();
    await out;
    expect(next).toHaveBeenCalledWith();
  });

  it('a client abort is swallowed', async () => {
    h.sendToResponse.mockRejectedValue(Object.assign(new Error('aborted'), { code: 'ECONNABORTED' }));
    const { next, out } = run();
    await out;
    expect(next).not.toHaveBeenCalled();
  });

  it('a mid-stream write error is swallowed', async () => {
    h.sendToResponse.mockRejectedValue(Object.assign(new Error('write EPIPE'), { syscall: 'write' }));
    const { next, out } = run();
    await out;
    expect(next).not.toHaveBeenCalled();
  });

  it('anything else goes to next(err) for finalhandler', async () => {
    const boom = new Error('boom');
    h.sendToResponse.mockRejectedValue(boom);
    const { next, out } = run();
    await out;
    expect(next).toHaveBeenCalledWith(boom);
  });
});

describe('applyPlatformStatic', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('is a no-op outside production', () => {
    process.env.NODE_ENV = 'development';
    const { app, calls } = fakeApp();
    applyPlatformStatic(app);
    expect(calls).toHaveLength(0);
  });

  it('serves the built client statics in production', () => {
    process.env.NODE_ENV = 'production';
    const { app, calls } = fakeApp();
    applyPlatformStatic(app);
    expect(calls.some((c) => c.method === 'use')).toBe(true);
  });

  it('the static setHeaders callback adds no-cache for index.html only', async () => {
    process.env.NODE_ENV = 'production';
    const expressMod = (await import('express')).default as unknown as { static: ReturnType<typeof vi.fn> };
    expressMod.static.mockClear();
    const { app } = fakeApp();
    applyPlatformStatic(app);
    const opts = expressMod.static.mock.calls[0][1] as { setHeaders: (res: unknown, p: string) => void };
    const indexRes = makeRes();
    opts.setHeaders(indexRes, '/some/index.html');
    expect(indexRes.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    const assetRes = makeRes();
    opts.setHeaders(assetRes, '/some/app.js');
    expect(assetRes.headers['Cache-Control']).toBeUndefined();
  });
});

describe('applyPlatformSpa', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('only serves statics (no catch-all) outside production', () => {
    process.env.NODE_ENV = 'development';
    const { app, calls } = fakeApp();
    applyPlatformSpa(app);
    expect(calls.some((c) => c.method === 'get' && c.path === '/.*/')).toBe(false);
  });

  it('registers the index.html catch-all in production', () => {
    process.env.NODE_ENV = 'production';
    const { app, calls } = fakeApp();
    applyPlatformSpa(app);
    const catchAll = calls.find((c) => c.method === 'get');
    expect(catchAll).toBeDefined();
    const res = makeRes();
    catchAll!.handlers[0]({}, res);
    expect(res.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(String(res.body)).toContain('FILE:');
    expect(String(res.body)).toContain('index.html');
  });
});

describe('SpaFallbackFilter', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  function host(req: { method: string }, res: ReturnType<typeof makeRes>) {
    return { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as never;
  }

  it('serves index.html for an unmatched GET in production', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    new SpaFallbackFilter().catch(new NotFoundException('nope'), host({ method: 'GET' }, res));
    expect(res.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(String(res.body)).toContain('index.html');
  });

  it('keeps the JSON 404 envelope for a non-GET miss in production', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    new SpaFallbackFilter().catch(new NotFoundException('gone'), host({ method: 'POST' }, res));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'gone' });
  });

  it('keeps the JSON 404 envelope outside production even for GET', () => {
    process.env.NODE_ENV = 'development';
    const res = makeRes();
    new SpaFallbackFilter().catch(new NotFoundException('missing'), host({ method: 'GET' }, res));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'missing' });
  });

  it('falls back to Not Found when the exception has no message', () => {
    process.env.NODE_ENV = 'development';
    const res = makeRes();
    const exc = new NotFoundException();
    // force an empty message so the || branch is taken
    Object.defineProperty(exc, 'message', { value: '' });
    new SpaFallbackFilter().catch(exc, host({ method: 'GET' }, res));
    expect(res.body).toEqual({ error: 'Not Found' });
  });
});
