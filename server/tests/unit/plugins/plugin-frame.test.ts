/**
 * The sandboxed plugin frame server (#plugins, M3): serves a plugin's client/
 * assets with a locked-down per-frame CSP and a strict path guard, only when the
 * plugin is active and the runtime is enabled.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { pluginsEnabledMock } = vi.hoisted(() => ({ pluginsEnabledMock: vi.fn(() => true) }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled: pluginsEnabledMock }));

import { PluginFrameController } from '../../../src/nest/plugins/plugin-frame.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

let codeRoot: string;
beforeAll(() => {
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-frame-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  const dir = path.join(codeRoot, 'widget', 'client');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><body>hi</body>');
});
afterAll(() => {
  delete process.env.TREK_PLUGINS_DIR;
  fs.rmSync(codeRoot, { recursive: true, force: true });
});

function fakeRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    sent: undefined as unknown,
    filePath: undefined as string | undefined,
    fileRoot: undefined as string | undefined,
    status(c: number) { res.statusCode = c; return res; },
    setHeader(k: string, v: string) { res.headers[k] = v; },
    send(b: unknown) { res.sent = b; return res; },
    sendFile(p: string, opts?: { root?: string }) {
      res.filePath = opts?.root ? path.join(opts.root, p) : p;
      res.fileRoot = opts?.root;
      res.statusCode ||= 200;
    },
  };
  return res;
}
const req = (p: string, host?: string) => ({ params: { path: p }, get: (h: string) => (h.toLowerCase() === 'host' ? host : undefined) }) as never;

function runtime(active = true, hosts: string[] = [], operatorHosts: string[] = []): PluginRuntimeService {
  return {
    isActive: vi.fn(() => active),
    outboundHostsOf: vi.fn(() => hosts),
    operatorEgressHosts: vi.fn(() => operatorHosts),
  } as unknown as PluginRuntimeService;
}

describe('PluginFrameController', () => {
  it('serves index.html with the opaque-frame CSP + sandbox', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true, ['api.weather.com'])).serve('widget', req(''), res as never);
    expect(res.filePath).toContain(path.join('widget', 'client', 'index.html'));
    const csp = res.headers['Content-Security-Policy'];
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain('sandbox allow-scripts allow-forms');
    expect(csp).not.toContain('allow-popups');
    expect(csp).not.toContain('allow-same-origin');
    expect(csp).toContain('connect-src \'self\' https://api.weather.com');
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
  });

  // Under the Nest ExpressAdapter, res.sendFile(absolutePath) resolves against the
  // rewritten req.url and 404s spuriously — files must go out root-relative.
  it('serves files with an explicit root, not an absolute path', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true)).serve('widget', req(''), res as never);
    expect(res.fileRoot).toBe(path.join(codeRoot, 'widget', 'client'));
  });

  // The frame document runs at an opaque origin, so its own <script src> loads are
  // cross-origin fetches; helmet's CORP: same-origin makes the browser drop them
  // and a multi-file client dies on boot.
  it('marks responses cross-origin loadable for the opaque frame', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true)).serve('widget', req(''), res as never);
    expect(res.headers['Cross-Origin-Resource-Policy']).toBe('cross-origin');
  });

  // An operatorEgress plugin's hosts are supplied by the ADMIN after install, so they are not
  // in the manifest grants. activate() unions them into the child's egress guard; the frame
  // must match, or a plugin with a UI can call the host from its server but not its iframe.
  it('includes admin-supplied operatorEgress hosts in connect-src', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true, ['api.weather.com'], ['gotify.home.lan'])).serve('widget', req(''), res as never);
    const csp = res.headers['Content-Security-Policy'];
    expect(csp).toContain('https://api.weather.com');
    expect(csp).toContain('https://gotify.home.lan');
  });

  it('does not duplicate a host granted in the manifest AND added by the admin', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true, ['ntfy.sh'], ['ntfy.sh'])).serve('widget', req(''), res as never);
    const csp = res.headers['Content-Security-Policy'];
    expect(csp.match(/https:\/\/ntfy\.sh/g)).toHaveLength(1);
  });

  it('refuses to interpolate a malformed operator host into the CSP', () => {
    const res = fakeRes();
    // The admin writer validates hosts, but connect-src is the last line of defence: a token
    // with a space or a bare * would widen the whole policy.
    new PluginFrameController(runtime(true, [], ['evil.com https://*', '*'])).serve('widget', req(''), res as never);
    const csp = res.headers['Content-Security-Policy'];
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain('evil.com');
    expect(csp).not.toContain('*');
  });

  it('allows the plugin its own static assets when the Host header is clean', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true)).serve('widget', req('', 'trek.example.com:8443'), res as never);
    const csp = res.headers['Content-Security-Policy'];
    // Scheme-less on purpose: matches the frame's own http AND https documents.
    expect(csp).toContain("script-src 'self' 'unsafe-inline' trek.example.com:8443/plugin-frame/widget/");
    expect(csp).toContain("style-src 'self' 'unsafe-inline' trek.example.com:8443/plugin-frame/widget/");
    expect(csp).toContain("connect-src 'self' trek.example.com:8443/plugin-frame/widget/");
  });

  it('drops the own-assets source on a malformed Host header instead of widening the policy', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true)).serve('widget', req('', 'evil.com *'), res as never);
    const csp = res.headers['Content-Security-Policy'];
    expect(csp).toContain("script-src 'self' 'unsafe-inline';");
    expect(csp).not.toContain('evil.com');
  });

  it('404 when the plugin is inactive', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(false)).serve('widget', req(''), res as never);
    expect(res.statusCode).toBe(404);
  });

  it('404 when the runtime is disabled', () => {
    pluginsEnabledMock.mockReturnValueOnce(false);
    const res = fakeRes();
    new PluginFrameController(runtime(true)).serve('widget', req(''), res as never);
    expect(res.statusCode).toBe(404);
  });

  it('403 on a path-traversal attempt', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true)).serve('widget', req('../../../etc/passwd'), res as never);
    expect(res.statusCode).toBe(403);
  });

  it('404 for a missing file', () => {
    const res = fakeRes();
    new PluginFrameController(runtime(true)).serve('widget', req('missing.js'), res as never);
    expect(res.statusCode).toBe(404);
  });
});
