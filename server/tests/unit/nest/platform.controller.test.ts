import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';

// --- hoisted mock fns so the vi.mock factories can reference them -----------------
const h = vi.hoisted(() => ({
  verifyJwtAndLoadUser: vi.fn(),
  dbPrepare: vi.fn(),
  exists: vi.fn(),
  sendToResponse: vi.fn(),
}));

vi.mock('../../../src/nest/auth/jwt-verify', () => ({ verifyJwtAndLoadUser: h.verifyJwtAndLoadUser }));
vi.mock('../../../src/db/database', () => ({ db: { prepare: h.dbPrepare } }));

import {
  applyPlatformUploads,
  applyPlatformSpa,
  applyPlatformStatic,
  storageStaticHandler,
  isBuildFilePath,
  PUBLIC_DIR,
} from '../../../src/nest/platform/platform.routes';
import { SpaFallbackFilter } from '../../../src/nest/platform/spa-fallback.filter';
import { StorageNotFoundError, StorageInvalidKeyError } from '../../../src/nest/storage/storage.types';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { createUser, createTrip } from '../../helpers/factories';

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
  const record = (method: string) => (...args: unknown[]) => {
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
    status: vi.fn(function (this: typeof res, c: number) { this.statusCode = c; return this; }),
    json: vi.fn(function (this: typeof res, b: unknown) { this.body = b; return this; }),
    send: vi.fn(function (this: typeof res, b: unknown) { this.body = b; return this; }),
    end: vi.fn(function (this: typeof res) { return this; }),
    sendFile: vi.fn(function (this: typeof res, p: string) { this.body = `FILE:${p}`; return this; }),
    setHeader: vi.fn(function (this: typeof res, k: string, v: string) { this.headers[k] = v; return this; }),
  };
  return res;
}

// Task 0 (D6): applyPlatformUploads now wraps servePhoto in withRequestContext,
// so every call site below needs a real `{ em }` to hand it — none of these
// cases touch the ORM (jwt-verify and db/database are both mocked above), but
// RequestContext.create needs a genuine EntityManager to open the ALS scope
// around, not a hand-built stub.
const uploadsTestDb = createSnapshotTestDb();
let uploadsOrm: TestOrm;

beforeAll(async () => {
  uploadsOrm = await createTestOrm(uploadsTestDb);
});

afterAll(async () => {
  await uploadsOrm.close();
  uploadsTestDb.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('applyPlatformUploads', () => {
  it('registers the four static mounts + the files block', () => {
    const { app, calls } = fakeApp();
    applyPlatformUploads(app, storage, uploadsOrm.orm);
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
    applyPlatformUploads(app, storage, uploadsOrm.orm);
    const filesBlock = calls.find((c) => c.path === '/uploads/files')!.handlers[0];
    const res = makeRes();
    filesBlock({}, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toBe('Authentication required');
  });

  describe('GET /uploads/photos/:filename', () => {
    function photoHandler() {
      const { app, calls } = fakeApp();
      applyPlatformUploads(app, storage, uploadsOrm.orm);
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
      expect(h.verifyJwtAndLoadUser).toHaveBeenCalledWith('jwt123', expect.objectContaining({ findByIdWithPasswordVersion: expect.any(Function) }));
      expect(h.sendToResponse).toHaveBeenCalledWith('photos', 'a.jpg', res);
    });

    it('reads the token from the query string when there is no Bearer header', async () => {
      h.exists.mockResolvedValue(true);
      h.sendToResponse.mockResolvedValue(undefined);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      const res = makeRes();
      await photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'qtok' } }, res, next);
      expect(h.verifyJwtAndLoadUser).toHaveBeenCalledWith('qtok', expect.objectContaining({ findByIdWithPasswordVersion: expect.any(Function) }));
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

    // R1/R5 (Plan 3h Task 6, R1 (Plan 4 Task 1)): both the share-token lookup
    // AND the sibling `photos` read now go through the SAME real ORM
    // (`ShareTokensRepository.findTripIdByToken` / `PhotosRepository
    // .findTripIdByFilename`, `orm.em.getRepository(...)` inside the SAME
    // `withRequestContext` wrap `applyPlatformUploads` already uses) — so
    // every case here seeds REAL rows in `uploadsTestDb` (bound to
    // `uploadsOrm.orm`) rather than mocking `db.prepare`'s return value; the
    // `h.dbPrepare` stub is dead for this whole describe block now.
    function insertShareToken(tripId: number, userId: number, token: string, expiresAt: string | null = null) {
      uploadsTestDb.prepare('INSERT INTO share_tokens (trip_id, token, created_by, expires_at) VALUES (?, ?, ?, ?)')
        .run(tripId, token, userId, expiresAt);
    }

    function insertPhoto(tripId: number, filename: string) {
      uploadsTestDb.prepare('INSERT INTO photos (trip_id, filename, original_name) VALUES (?, ?, ?)')
        .run(tripId, filename, filename);
    }

    it('401 when a share token does not cover the photo trip', async () => {
      const { user } = createUser(uploadsTestDb);
      const photoTrip = createTrip(uploadsTestDb, user.id);
      const otherTrip = createTrip(uploadsTestDb, user.id);
      insertShareToken(otherTrip.id, user.id, 'share-mismatch');
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      insertPhoto(photoTrip.id, 'photo-mismatch.jpg');
      const res = makeRes();
      await photoHandler()({ params: { filename: 'photo-mismatch.jpg' }, headers: {}, query: { token: 'share-mismatch' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('R5: 401 when there is no matching share token at all (unknown)', async () => {
      const { user } = createUser(uploadsTestDb);
      const photoTrip = createTrip(uploadsTestDb, user.id);
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      insertPhoto(photoTrip.id, 'photo-unknown-token.jpg');
      const res = makeRes();
      await photoHandler()({ params: { filename: 'photo-unknown-token.jpg' }, headers: {}, query: { token: 'never-issued' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('R5: 401 when the token is revoked (deleted, not merely unknown)', async () => {
      const { user } = createUser(uploadsTestDb);
      const photoTrip = createTrip(uploadsTestDb, user.id);
      insertShareToken(photoTrip.id, user.id, 'share-revoked');
      uploadsTestDb.prepare('DELETE FROM share_tokens WHERE token = ?').run('share-revoked');
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      insertPhoto(photoTrip.id, 'photo-revoked.jpg');
      const res = makeRes();
      await photoHandler()({ params: { filename: 'photo-revoked.jpg' }, headers: {}, query: { token: 'share-revoked' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('R5: 401 when the token is expired', async () => {
      const { user } = createUser(uploadsTestDb);
      const photoTrip = createTrip(uploadsTestDb, user.id);
      insertShareToken(photoTrip.id, user.id, 'share-expired', '2020-01-01 00:00:00');
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      insertPhoto(photoTrip.id, 'photo-expired.jpg');
      const res = makeRes();
      await photoHandler()({ params: { filename: 'photo-expired.jpg' }, headers: {}, query: { token: 'share-expired' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('R5: 401 for a wrong-case token — no case-folding is introduced', async () => {
      const { user } = createUser(uploadsTestDb);
      const photoTrip = createTrip(uploadsTestDb, user.id);
      insertShareToken(photoTrip.id, user.id, 'share-CaseSensitive');
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      insertPhoto(photoTrip.id, 'photo-case.jpg');
      const res = makeRes();
      await photoHandler()({ params: { filename: 'photo-case.jpg' }, headers: {}, query: { token: 'share-casesensitive' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('R5: 401 for a token with an embedded NUL byte', async () => {
      const { user } = createUser(uploadsTestDb);
      const photoTrip = createTrip(uploadsTestDb, user.id);
      insertShareToken(photoTrip.id, user.id, 'share-nul');
      h.exists.mockResolvedValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      insertPhoto(photoTrip.id, 'photo-nul.jpg');
      const res = makeRes();
      await photoHandler()({ params: { filename: 'photo-nul.jpg' }, headers: {}, query: { token: 'share-nul\0extra' } }, res, next);
      expect(res.statusCode).toBe(401);
    });

    it('serves the file when the share token covers the photo trip (R1 valid-token case)', async () => {
      const { user } = createUser(uploadsTestDb);
      const photoTrip = createTrip(uploadsTestDb, user.id);
      insertShareToken(photoTrip.id, user.id, 'share-valid');
      h.exists.mockResolvedValue(true);
      h.sendToResponse.mockResolvedValue(undefined);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      insertPhoto(photoTrip.id, 'photo-valid.jpg');
      const res = makeRes();
      await photoHandler()(
        { params: { filename: 'photo-valid.jpg' }, headers: { authorization: 'Bearer share-valid' }, query: {} },
        res,
        next,
      );
      expect(h.sendToResponse).toHaveBeenCalledWith('photos', 'photo-valid.jpg', res);
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
  afterEach(() => { process.env.NODE_ENV = original; });

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
  afterEach(() => { process.env.NODE_ENV = original; });

  it('only serves statics (no catch-all) outside production', () => {
    process.env.NODE_ENV = 'development';
    const { app, calls } = fakeApp();
    applyPlatformSpa(app);
    expect(calls.some((c) => c.method === 'get' && c.path === '/.*/' )).toBe(false);
  });

  it('registers the index.html catch-all in production', () => {
    process.env.NODE_ENV = 'production';
    const { app, calls } = fakeApp();
    applyPlatformSpa(app);
    const catchAll = calls.find((c) => c.method === 'get');
    expect(catchAll).toBeDefined();
    const res = makeRes();
    catchAll!.handlers[0]({ path: '/trips/7' }, res);
    expect(res.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(String(res.body)).toContain('FILE:');
    expect(String(res.body)).toContain('index.html');
    expect(res.sendFile).toHaveBeenCalledWith('index.html', { root: PUBLIC_DIR });
  });

  it('answers a missing build file with a 404, not index.html (#2524)', () => {
    process.env.NODE_ENV = 'production';
    const { app, calls } = fakeApp();
    applyPlatformSpa(app);
    const catchAll = calls.find((c) => c.method === 'get');
    const res = makeRes();
    catchAll!.handlers[0]({ path: '/assets/DashboardPage-v4ODOTOr.js' }, res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found' });
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.sendFile).not.toHaveBeenCalled();
  });
});

describe('isBuildFilePath', () => {
  it.each([
    '/assets/DashboardPage-v4ODOTOr.js',
    '/assets/index-cFGeBWen.css',
    '/assets/poppins-latin-400-normal-abc.woff2',
    '/assets/anything-without-a-known-extension',
    '/sw.js',
    '/workbox-2da51cb1.js',
    '/registerSW.js',
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/favicon.ico',
    '/fonts/Inter.TTF',
  ])('treats %s as a build file', (p) => {
    expect(isBuildFilePath(p)).toBe(true);
  });

  it.each([
    '/',
    '/dashboard',
    '/trips/12/files',
    '/journey/3/studio',
    '/plugins/trip-todos',
    '/help/Atlas',
    '/shared/0f3a9c',
    '/public/journey/AbC_-12',
    '/oauth/consent',
  ])('treats the page %s as a page', (p) => {
    expect(isBuildFilePath(p)).toBe(false);
  });
});

describe('SpaFallbackFilter', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => { process.env.NODE_ENV = original; });

  function host(req: { method: string; path?: string }, res: ReturnType<typeof makeRes>) {
    return { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as never;
  }

  it('serves index.html for an unmatched GET in production', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    new SpaFallbackFilter().catch(new NotFoundException('nope'), host({ method: 'GET', path: '/dashboard' }, res));
    expect(res.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(String(res.body)).toContain('index.html');
  });

  it('answers a GET for a chunk that is not on disk with a 404 in production (#2524)', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    new SpaFallbackFilter().catch(
      new NotFoundException('Cannot GET /assets/DashboardPage-v4ODOTOr.js'),
      host({ method: 'GET', path: '/assets/DashboardPage-v4ODOTOr.js' }, res),
    );
    // A 200 with index.html here is what a service worker precached as the chunk.
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Cannot GET /assets/DashboardPage-v4ODOTOr.js' });
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('answers a missing top-level build file with a 404 too', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    new SpaFallbackFilter().catch(new NotFoundException(), host({ method: 'GET', path: '/workbox-0000aaaa.js' }, res));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found' });
  });

  it('answers a missing build file whose exception has no message with Not Found (#2524)', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    const exc = new NotFoundException();
    Object.defineProperty(exc, 'message', { value: '' });
    new SpaFallbackFilter().catch(exc, host({ method: 'GET', path: '/assets/gone-0000aaaa.js' }, res));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found' });
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('keeps the JSON 404 envelope for a non-GET miss in production', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    new SpaFallbackFilter().catch(new NotFoundException('gone'), host({ method: 'POST', path: '/dashboard' }, res));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'gone' });
  });

  it('keeps the JSON 404 envelope outside production even for GET', () => {
    process.env.NODE_ENV = 'development';
    const res = makeRes();
    new SpaFallbackFilter().catch(new NotFoundException('missing'), host({ method: 'GET', path: '/dashboard' }, res));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'missing' });
  });

  it('falls back to Not Found when the exception has no message', () => {
    process.env.NODE_ENV = 'development';
    const res = makeRes();
    const exc = new NotFoundException();
    // force an empty message so the || branch is taken
    Object.defineProperty(exc, 'message', { value: '' });
    new SpaFallbackFilter().catch(exc, host({ method: 'GET', path: '/dashboard' }, res));
    expect(res.body).toEqual({ error: 'Not Found' });
  });
});
