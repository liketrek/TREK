/**
 * The plugin HTTP proxy (#plugins, M2): route matching, per-route auth (auth:false
 * routes are public), the whitelisted request view forwarded to the child, and
 * error/404 handling — all without a real fork (the runtime is faked).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabledMock, extractTokenMock, verifyMock } = vi.hoisted(() => ({
  pluginsEnabledMock: vi.fn(() => true),
  extractTokenMock: vi.fn(() => 'tok'),
  verifyMock: vi.fn(() => ({ id: 5, username: 'ada', role: 'user' })),
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
  verifyMock.mockClear().mockReturnValue({ id: 5, username: 'ada', role: 'user' });
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

  it('maps role:admin to isAdmin:true in the forwarded user view', async () => {
    // Regression: the proxy derives isAdmin from the loaded user's `role`, not a
    // non-existent `is_admin` field — otherwise every user (admins included) is false.
    verifyMock.mockReturnValue({ id: 7, username: 'root', role: 'admin' } as never);
    const runtime = makeRuntime();
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status'), res as never);
    expect(runtime.invoke).toHaveBeenCalledWith('p', 'invoke.route', expect.objectContaining({
      req: expect.objectContaining({ user: { id: 7, username: 'root', isAdmin: true } }),
    }), 7);
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

  it('forwards the raw request bytes to a webhook (auth:false) route, but withholds them from an authenticated route', async () => {
    // Webhook route → the plugin gets the raw payload so it can verify an HMAC.
    const wh = makeRuntime({ routesOf: vi.fn(() => [{ i: 1, method: 'POST', path: '/webhook', auth: false }]) } as never);
    await new PluginsProxyController(wh).proxy('p', fakeReq('POST', '/webhook', { rawBody: Buffer.from('{"a":1}') }), fakeRes() as never);
    // forwarded as base64 so a non-UTF-8 signed body survives
    expect(wh.invoke).toHaveBeenCalledWith('p', 'invoke.route', expect.objectContaining({
      req: expect.objectContaining({ rawBodyBase64: Buffer.from('{"a":1}').toString('base64') }),
    }), undefined);

    // Authenticated route → raw bytes are never handed to the plugin.
    const auth = makeRuntime();
    await new PluginsProxyController(auth).proxy('p', fakeReq('GET', '/status', { rawBody: Buffer.from('secret') }), fakeRes() as never);
    const fwd = (auth.invoke as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][2] as { req: { rawBodyBase64?: unknown } };
    expect(fwd.req.rawBodyBase64).toBeUndefined();
  });

  it('a webhook (auth:false) route gets ONLY allowlisted inbound headers — never Cookie/Authorization', async () => {
    const runtime = makeRuntime({ routesOf: vi.fn(() => [{ i: 1, method: 'POST', path: '/webhook', auth: false }]) } as never);
    const res = fakeRes();
    const headers = {
      'content-type': 'application/json',
      'stripe-signature': 't=1,v1=abc',
      'x-hub-signature-256': 'sha256=deadbeef',
      cookie: 'trek_session=secret',              // must be dropped
      authorization: 'Bearer leak',               // must be dropped
      'x-socket-id': 'sock-1',                    // must be dropped
    };
    await new PluginsProxyController(runtime).proxy('p', fakeReq('POST', '/webhook', { headers }), res as never);
    const forwarded = (runtime.invoke as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][2] as { req: { headers: Record<string, string> } };
    expect(forwarded.req.headers).toEqual({ 'content-type': 'application/json', 'stripe-signature': 't=1,v1=abc', 'x-hub-signature-256': 'sha256=deadbeef' });
    expect(forwarded.req.headers.cookie).toBeUndefined();
    expect(forwarded.req.headers.authorization).toBeUndefined();
    expect(forwarded.req.headers['x-socket-id']).toBeUndefined();
  });

  it('an authenticated route gets NO inbound headers (even safe ones)', async () => {
    const runtime = makeRuntime(); // /status, auth:true
    const res = fakeRes();
    await new PluginsProxyController(runtime).proxy('p', fakeReq('GET', '/status', { headers: { 'content-type': 'application/json', 'stripe-signature': 'x' } }), res as never);
    const forwarded = (runtime.invoke as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][2] as { req: { headers: Record<string, string> } };
    expect(forwarded.req.headers).toEqual({});
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
