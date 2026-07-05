/**
 * The plugin HTTP proxy (#plugins, M2): route matching, per-route auth (auth:false
 * routes are public), the whitelisted request view forwarded to the child, and
 * error/404 handling — all without a real fork (the runtime is faked).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabledMock, extractTokenMock, verifyMock } = vi.hoisted(() => ({
  pluginsEnabledMock: vi.fn(() => true),
  extractTokenMock: vi.fn(() => 'tok'),
  verifyMock: vi.fn(() => ({ id: 5, username: 'ada', is_admin: false })),
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled: pluginsEnabledMock }));
vi.mock('../../../src/middleware/auth', () => ({ extractToken: extractTokenMock, verifyJwtAndLoadUser: verifyMock }));

import { PluginsProxyController } from '../../../src/nest/plugins/plugins-proxy.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

function fakeRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(c: number) { res.statusCode = c; return res; },
    setHeader(k: string, v: string) { res.headers[k] = v; },
    json(b: unknown) { res.body = b; return res; },
    send(b: unknown) { res.body = b; return res; },
    end() { return res; },
  };
  return res;
}
function fakeReq(method: string, sub: string, extra: Record<string, unknown> = {}) {
  return { method, params: { 0: sub.replace(/^\//, '') }, query: {}, body: null, ...extra } as never;
}

function makeRuntime(over: Partial<PluginRuntimeService> = {}): PluginRuntimeService {
  return {
    isActive: vi.fn(() => true),
    routesOf: vi.fn(() => [{ i: 0, method: 'GET', path: '/status', auth: true }]),
    invoke: vi.fn(async () => ({ status: 200, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' })),
    ...over,
  } as unknown as PluginRuntimeService;
}

beforeEach(() => {
  pluginsEnabledMock.mockClear().mockReturnValue(true);
  verifyMock.mockClear().mockReturnValue({ id: 5, username: 'ada', is_admin: false });
  extractTokenMock.mockClear().mockReturnValue('tok');
});

describe('PluginsProxyController', () => {
  it('404 when the runtime is disabled', async () => {
    pluginsEnabledMock.mockReturnValue(false);
    const res = fakeRes();
    await new PluginsProxyController(makeRuntime()).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(404);
  });

  it('404 when the plugin is not active', async () => {
    const res = fakeRes();
    await new PluginsProxyController(makeRuntime({ isActive: vi.fn(() => false) } as never)).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(404);
  });

  it('404 when no declared route matches', async () => {
    const res = fakeRes();
    await new PluginsProxyController(makeRuntime()).proxy('p', fakeReq('GET', '/nope'), res as never);
    expect(res.statusCode).toBe(404);
  });

  it('401 on an auth route without a valid session', async () => {
    verifyMock.mockReturnValue(null as never);
    const res = fakeRes();
    await new PluginsProxyController(makeRuntime()).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(401);
  });

  it('forwards an authenticated request and returns the child response', async () => {
    const runtime = makeRuntime();
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/json');
    expect(res.body).toBe('{"ok":true}');
    // the child receives only a whitelisted user view, never the token/cookie;
    // the acting user (5) is bound server-side as the 4th invoke arg
    expect(runtime.invoke).toHaveBeenCalledWith('p', 'invoke.route', expect.objectContaining({
      routeId: 0,
      req: expect.objectContaining({ user: { id: 5, username: 'ada', isAdmin: false } }),
    }), 5);
  });

  it('a public (auth:false) route skips the session check', async () => {
    const runtime = makeRuntime({ routesOf: vi.fn(() => [{ i: 1, method: 'POST', path: '/webhook', auth: false }]) } as never);
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('POST', '/webhook'), res as never);
    expect(res.statusCode).toBe(200);
    expect(extractTokenMock).not.toHaveBeenCalled();
    // a public route has no session user → no bound acting user (undefined)
    expect(runtime.invoke).toHaveBeenCalledWith('p', 'invoke.route', expect.objectContaining({
      req: expect.objectContaining({ user: null }),
    }), undefined);
  });

  it('strips unsafe response headers from the child', async () => {
    const runtime = makeRuntime({
      invoke: vi.fn(async () => ({ status: 200, headers: { 'content-type': 'text/plain', 'set-cookie': 'evil=1' }, body: 'ok' })),
    } as never);
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.headers['set-cookie']).toBeUndefined(); // a plugin cannot set cookies
  });

  it('502 when the plugin invoke throws', async () => {
    const runtime = makeRuntime({ invoke: vi.fn(async () => { throw new Error('down'); }) } as never);
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(502);
  });

  it('follows a relative in-app redirect', async () => {
    const runtime = makeRuntime({
      invoke: vi.fn(async () => ({ status: 302, headers: { location: '/trips/5?tab=plan' } })),
    } as never);
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(302);
    // normalised to path+query, still same-origin
    expect(res.headers['Location']).toBe('/trips/5?tab=plan');
  });

  // Every one of these is an open-redirect target a naive `starts with / but not
  // //` check would let through; each must be rejected as 502.
  it.each([
    ['//evil.com', 'protocol-relative'],
    ['/\\evil.com', 'backslash normalised to / by browsers'],
    ['/\t/evil.com', 'tab stripped by browsers'],
    ['https://evil.com', 'absolute url'],
    ['http:/evil.com', 'scheme-relative'],
    ['javascript:alert(1)', 'javascript scheme'],
    ['', 'empty'],
  ])('502 on an unsafe redirect target (%s — %s)', async (loc) => {
    const runtime = makeRuntime({
      invoke: vi.fn(async () => ({ status: 302, headers: { location: loc } })),
    } as never);
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ detail: 'unsafe redirect target' });
    expect(res.headers['Location']).toBeUndefined();
  });

  it('502 on a redirect status with no Location header', async () => {
    const runtime = makeRuntime({
      invoke: vi.fn(async () => ({ status: 301, headers: {} })),
    } as never);
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(res.statusCode).toBe(502);
  });
});
