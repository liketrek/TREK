import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';

// --- hoisted mock fns so the vi.mock factories can reference them -----------------
const h = vi.hoisted(() => ({
  verifyJwtAndLoadUser: vi.fn(),
  isAddonEnabled: vi.fn(),
  getMcpSafeUrl: vi.fn(() => 'https://trek.example.test'),
  dbPrepare: vi.fn(),
  existsSync: vi.fn(),
  // SDK middleware spies — each returns a tagged handler so we can identify which
  // app.use call received it.
  metaRouter: vi.fn(),
  authorizeHandler: vi.fn(),
  registerHandler: vi.fn(),
  mcpHandler: vi.fn(),
}));

vi.mock('../../../src/middleware/auth', () => ({ verifyJwtAndLoadUser: h.verifyJwtAndLoadUser }));
vi.mock('../../../src/db/database', () => ({ db: { prepare: h.dbPrepare } }));
vi.mock('../../../src/mcp', () => ({ mcpHandler: h.mcpHandler }));
vi.mock('../../../src/mcp/oauthProvider', () => ({ trekOAuthProvider: {}, trekClientsStore: {} }));
vi.mock('../../../src/services/adminService', () => ({ isAddonEnabled: h.isAddonEnabled }));
vi.mock('../../../src/services/notifications', () => ({ getMcpSafeUrl: h.getMcpSafeUrl }));

// SDK router/handler factories return distinct tagged middleware so we never hit
// real new URL(...) wiring during registration.
vi.mock('@modelcontextprotocol/sdk/server/auth/router', () => ({
  mcpAuthMetadataRouter: vi.fn(() => h.metaRouter),
}));
vi.mock('@modelcontextprotocol/sdk/server/auth/handlers/authorize', () => ({
  authorizationHandler: vi.fn(() => h.authorizeHandler),
}));
vi.mock('@modelcontextprotocol/sdk/server/auth/handlers/register', () => ({
  clientRegistrationHandler: vi.fn(() => h.registerHandler),
}));

vi.mock('node:fs', async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, default: { ...(real.default as object), existsSync: h.existsSync }, existsSync: h.existsSync };
});

import {
  applyPlatformUploads,
  applyPlatformTransport,
  applyPlatformSpa,
  applyPlatformStatic,
} from '../../../src/nest/platform/platform.routes';
import { SpaFallbackFilter } from '../../../src/nest/platform/spa-fallback.filter';

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

beforeEach(() => {
  vi.clearAllMocks();
  h.getMcpSafeUrl.mockReturnValue('https://trek.example.test');
});

describe('applyPlatformUploads', () => {
  it('registers the static avatar/cover/journey mounts + the files block', () => {
    const { app, calls } = fakeApp();
    applyPlatformUploads(app);
    const paths = calls.filter((c) => c.method === 'use').map((c) => c.path);
    expect(paths).toEqual(
      expect.arrayContaining(['/uploads/avatars', '/uploads/covers', '/uploads/journey', '/uploads/files']),
    );
  });

  it('the /uploads/files block always answers 401', () => {
    const { app, calls } = fakeApp();
    applyPlatformUploads(app);
    const filesBlock = calls.find((c) => c.path === '/uploads/files')!.handlers[0];
    const res = makeRes();
    filesBlock({}, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toBe('Authentication required');
  });

  describe('GET /uploads/photos/:filename', () => {
    function photoHandler() {
      const { app, calls } = fakeApp();
      applyPlatformUploads(app);
      return calls.find((c) => c.method === 'get' && c.path === '/uploads/photos/:filename')!.handlers[0];
    }

    it('403 when the resolved path escapes the photos dir', () => {
      // basename() strips the traversal, but feed a name that resolves outside by
      // stubbing path indirectly is hard — instead exercise the existsSync 404 etc.
      // The startsWith guard is defensive; cover it via a filename of '..'.
      const handler = photoHandler();
      const res = makeRes();
      // path.basename('..') === '..' -> join(photos,'..') resolves to uploads -> not under photos
      handler({ params: { filename: '..' }, headers: {}, query: {} }, res);
      expect(res.statusCode).toBe(403);
      expect(res.body).toBe('Forbidden');
    });

    it('404 when the file does not exist', () => {
      h.existsSync.mockReturnValue(false);
      const res = makeRes();
      photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: {} }, res);
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe('Not found');
    });

    it('401 when no token is supplied', () => {
      h.existsSync.mockReturnValue(true);
      const res = makeRes();
      photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: {} }, res);
      expect(res.statusCode).toBe(401);
      expect(res.body).toBe('Authentication required');
    });

    it('serves the file for a valid JWT session (Bearer header)', () => {
      h.existsSync.mockReturnValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      const res = makeRes();
      photoHandler()(
        { params: { filename: 'a.jpg' }, headers: { authorization: 'Bearer jwt123' }, query: {} },
        res,
      );
      expect(h.verifyJwtAndLoadUser).toHaveBeenCalledWith('jwt123');
      expect(String(res.body)).toContain('FILE:');
    });

    it('reads the token from the query string when there is no Bearer header', () => {
      h.existsSync.mockReturnValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue({ id: 1 });
      const res = makeRes();
      photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'qtok' } }, res);
      expect(h.verifyJwtAndLoadUser).toHaveBeenCalledWith('qtok');
      expect(String(res.body)).toContain('FILE:');
    });

    it('401 when the token is not a session and the photo row is missing', () => {
      h.existsSync.mockReturnValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      h.dbPrepare.mockReturnValue({ get: vi.fn().mockReturnValue(undefined) });
      const res = makeRes();
      photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'share1' } }, res);
      expect(res.statusCode).toBe(401);
    });

    it('401 when a share token does not cover the photo trip', () => {
      h.existsSync.mockReturnValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      const photoStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      const shareStmt = { get: vi.fn().mockReturnValue({ trip_id: 8 }) };
      h.dbPrepare.mockImplementationOnce(() => photoStmt).mockImplementationOnce(() => shareStmt);
      const res = makeRes();
      photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'share1' } }, res);
      expect(res.statusCode).toBe(401);
    });

    it('401 when there is no matching share token at all', () => {
      h.existsSync.mockReturnValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      const photoStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      const shareStmt = { get: vi.fn().mockReturnValue(undefined) };
      h.dbPrepare.mockImplementationOnce(() => photoStmt).mockImplementationOnce(() => shareStmt);
      const res = makeRes();
      photoHandler()({ params: { filename: 'a.jpg' }, headers: {}, query: { token: 'share1' } }, res);
      expect(res.statusCode).toBe(401);
    });

    it('serves the file when the share token covers the photo trip', () => {
      h.existsSync.mockReturnValue(true);
      h.verifyJwtAndLoadUser.mockReturnValue(null);
      const photoStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      const shareStmt = { get: vi.fn().mockReturnValue({ trip_id: 7 }) };
      h.dbPrepare.mockImplementationOnce(() => photoStmt).mockImplementationOnce(() => shareStmt);
      const res = makeRes();
      photoHandler()(
        { params: { filename: 'a.jpg' }, headers: { authorization: 'Bearer share1' }, query: {} },
        res,
      );
      expect(String(res.body)).toContain('FILE:');
    });
  });
});

describe('applyPlatformTransport', () => {
  function build() {
    const { app, calls } = fakeApp();
    applyPlatformTransport(app);
    return calls;
  }

  it('GET /api/health sets no-store and returns ok', () => {
    const calls = build();
    const health = calls.find((c) => c.method === 'get' && c.path === '/api/health')!.handlers[0];
    const res = makeRes();
    health({}, res);
    expect(res.headers['Cache-Control']).toBe('no-store, must-revalidate');
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('the /.well-known metadata middleware', () => {
    function wellKnownMw(calls: ReturnType<typeof build>) {
      // first app.use with no path, registered right after /api/health
      return calls.find((c) => c.method === 'use' && c.path === undefined)!.handlers[0];
    }

    it('404s a /.well-known path when MCP is disabled', () => {
      h.isAddonEnabled.mockReturnValue(false);
      const mw = wellKnownMw(build());
      const res = makeRes();
      const next = vi.fn();
      mw({ path: '/.well-known/oauth-authorization-server' }, res, next);
      expect(res.statusCode).toBe(404);
      expect(next).not.toHaveBeenCalled();
    });

    it('delegates to the SDK meta router for a non-well-known path', () => {
      h.isAddonEnabled.mockReturnValue(true);
      const mw = wellKnownMw(build());
      const res = makeRes();
      const next = vi.fn();
      mw({ path: '/anything' }, res, next);
      expect(h.metaRouter).toHaveBeenCalled();
    });

    it('delegates to the SDK meta router for a well-known path when MCP is enabled', () => {
      h.isAddonEnabled.mockReturnValue(true);
      const mw = wellKnownMw(build());
      const res = makeRes();
      const next = vi.fn();
      mw({ path: '/.well-known/oauth-authorization-server' }, res, next);
      expect(h.metaRouter).toHaveBeenCalled();
    });
  });

  it('GET /.well-known/openid-configuration returns AS metadata + userinfo_endpoint', () => {
    const calls = build();
    const handler = calls.find((c) => c.path === '/.well-known/openid-configuration')!.handlers[0];
    const res = makeRes();
    handler({}, res);
    const body = res.body as { issuer: string; userinfo_endpoint: string };
    expect(body.issuer).toBe('https://trek.example.test');
    expect(body.userinfo_endpoint).toBe('https://trek.example.test/oauth/userinfo');
  });

  it('trims trailing slashes off the configured base URL', () => {
    h.getMcpSafeUrl.mockReturnValue('https://trek.example.test///');
    const calls = build();
    const handler = calls.find((c) => c.path === '/.well-known/openid-configuration')!.handlers[0];
    const res = makeRes();
    handler({}, res);
    expect((res.body as { issuer: string }).issuer).toBe('https://trek.example.test');
  });

  describe('GET /.well-known/oauth-protected-resource (flat)', () => {
    function handler() {
      return build().find((c) => c.method === 'get' && c.path === '/.well-known/oauth-protected-resource')!.handlers[0];
    }

    it('404 when MCP is disabled', () => {
      h.isAddonEnabled.mockReturnValue(false);
      const res = makeRes();
      handler()({}, res);
      expect(res.statusCode).toBe(404);
    });

    it('returns the PRM document when MCP is enabled', () => {
      h.isAddonEnabled.mockReturnValue(true);
      const res = makeRes();
      handler()({}, res);
      const body = res.body as { resource: string; authorization_servers: string[] };
      expect(body.resource).toBe('https://trek.example.test/mcp');
      expect(body.authorization_servers).toEqual(['https://trek.example.test']);
    });
  });

  describe('mcpAddonGate (used on /oauth/authorize + /oauth/register)', () => {
    function gate() {
      // The gate is the first handler on the /oauth/authorize use registration.
      return build().find((c) => c.method === 'use' && c.path === '/oauth/authorize')!.handlers[0];
    }

    it('404 when MCP is disabled', () => {
      h.isAddonEnabled.mockReturnValue(false);
      const res = makeRes();
      const next = vi.fn();
      gate()({}, res, next);
      expect(res.statusCode).toBe(404);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() when MCP is enabled', () => {
      h.isAddonEnabled.mockReturnValue(true);
      const res = makeRes();
      const next = vi.fn();
      gate()({}, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  it('wires the SDK authorize + register handlers behind the gate', () => {
    const calls = build();
    const authorize = calls.find((c) => c.path === '/oauth/authorize')!;
    const register = calls.find((c) => c.path === '/oauth/register')!;
    expect(authorize.handlers).toContain(h.authorizeHandler);
    expect(register.handlers).toContain(h.registerHandler);
  });

  it('mounts the MCP handler on POST/GET/DELETE /mcp', () => {
    const calls = build();
    expect(calls.find((c) => c.method === 'post' && c.path === '/mcp')!.handlers[0]).toBe(h.mcpHandler);
    expect(calls.find((c) => c.method === 'get' && c.path === '/mcp')!.handlers[0]).toBe(h.mcpHandler);
    expect(calls.find((c) => c.method === 'delete' && c.path === '/mcp')!.handlers[0]).toBe(h.mcpHandler);
  });

  describe('the terminal /.well-known JSON-404 middleware', () => {
    function mw() {
      // The pathless app.use registered after the /mcp routes.
      const calls = build();
      const pathless = calls.filter((c) => c.method === 'use' && c.path === undefined);
      // first pathless = meta router; second = the JSON 404.
      return pathless[1].handlers[0];
    }

    it('404 JSON for an unhandled /.well-known path', () => {
      const res = makeRes();
      const next = vi.fn();
      mw()({ path: '/.well-known/unknown' }, res, next);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'not_found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() for any non-well-known path', () => {
      const res = makeRes();
      const next = vi.fn();
      mw()({ path: '/dashboard' }, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  it('the /oauth/consent middleware relaxes COOP then continues', () => {
    const calls = build();
    const mw = calls.find((c) => c.method === 'use' && c.path === '/oauth/consent')!.handlers[0];
    const res = makeRes();
    const next = vi.fn();
    mw({}, res, next);
    expect(res.headers['Cross-Origin-Opener-Policy']).toBe('unsafe-none');
    expect(next).toHaveBeenCalled();
  });

  it('caches the OAuth metadata + SDK router across requests (lazy init runs once)', async () => {
    const router = await import('@modelcontextprotocol/sdk/server/auth/router');
    const calls = build();
    const openid = calls.find((c) => c.path === '/.well-known/openid-configuration')!.handlers[0];
    h.getMcpSafeUrl.mockClear();
    openid({}, makeRes());
    openid({}, makeRes());
    // getMcpSafeUrl is only consulted on the first lazy build of the metadata.
    expect(h.getMcpSafeUrl).toHaveBeenCalledTimes(1);

    // Trigger the meta router lazy build twice; the SDK factory runs once.
    const metaMw = calls.find((c) => c.method === 'use' && c.path === undefined)!.handlers[0];
    h.isAddonEnabled.mockReturnValue(true);
    metaMw({ path: '/x' }, makeRes(), vi.fn());
    metaMw({ path: '/y' }, makeRes(), vi.fn());
    expect(router.mcpAuthMetadataRouter).toHaveBeenCalledTimes(1);
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
    catchAll!.handlers[0]({}, res);
    expect(res.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(String(res.body)).toContain('FILE:');
    expect(String(res.body)).toContain('index.html');
  });
});

describe('SpaFallbackFilter', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => { process.env.NODE_ENV = original; });

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
