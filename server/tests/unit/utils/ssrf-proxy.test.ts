/**
 * Guarded requests and the outbound proxy (#1754). The SSRF guard fetches through
 * its own dispatcher, so it used to skip HTTP_PROXY entirely; these pin when it
 * goes through the proxy and when NO_PROXY keeps it direct.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const built = vi.hoisted(() => ({
  agents: [] as unknown[],
  proxies: [] as Array<Record<string, unknown>>,
  closed: [] as unknown[],
}));

vi.mock('undici', () => ({
  Agent: class {
    constructor(readonly opts: unknown) {
      built.agents.push(opts);
    }
    close() {
      built.closed.push(this.opts);
      return Promise.resolve();
    }
  },
  ProxyAgent: class {
    constructor(opts: Record<string, unknown>) {
      built.proxies.push(opts);
    }
  },
}));

const PROXY_KEYS = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy'] as const;

async function loadGuard(env: Partial<Record<(typeof PROXY_KEYS)[number], string>>) {
  for (const key of PROXY_KEYS) delete process.env[key];
  Object.assign(process.env, env);
  vi.resetModules();
  return import('../../../src/utils/ssrfGuard');
}

afterEach(() => {
  for (const key of PROXY_KEYS) delete process.env[key];
  built.agents.length = 0;
  built.proxies.length = 0;
  built.closed.length = 0;
});

describe('proxyFor', () => {
  it('SSRF-PROXY-001: no proxy configured means a direct connection', async () => {
    const { proxyFor } = await loadGuard({});
    expect(proxyFor('https://example.com/a')).toBeNull();
  });

  it('SSRF-PROXY-002: picks the proxy by scheme, HTTPS falling back to HTTP_PROXY', async () => {
    const { proxyFor } = await loadGuard({ HTTP_PROXY: 'http://plain:3128' });
    expect(proxyFor('http://example.com/')).toBe('http://plain:3128');
    expect(proxyFor('https://example.com/')).toBe('http://plain:3128');
    const both = await loadGuard({ HTTP_PROXY: 'http://plain:3128', https_proxy: 'http://secure:3129' });
    expect(both.proxyFor('https://example.com/')).toBe('http://secure:3129');
  });

  it('SSRF-PROXY-003: NO_PROXY matches the host, its subdomains, a port and the wildcard', async () => {
    const { proxyFor } = await loadGuard({
      HTTPS_PROXY: 'http://proxy:3128',
      NO_PROXY: 'localhost, .internal.lan, photos.example.com:8443',
    });
    expect(proxyFor('https://localhost/health')).toBeNull();
    expect(proxyFor('https://immich.internal.lan/api')).toBeNull();
    expect(proxyFor('https://internal.lan/')).toBeNull();
    expect(proxyFor('https://photos.example.com:8443/x')).toBeNull();
    // Same host on another port, and a lookalike domain, still go through the proxy.
    expect(proxyFor('https://photos.example.com/x')).toBe('http://proxy:3128');
    expect(proxyFor('https://notinternal.lan/')).toBe('http://proxy:3128');

    const all = await loadGuard({ HTTPS_PROXY: 'http://proxy:3128', NO_PROXY: '*' });
    expect(all.proxyFor('https://example.com/')).toBeNull();
  });
});

describe('createOutboundDispatcher', () => {
  it('SSRF-PROXY-004: without a proxy it is the pinned agent', async () => {
    const { createOutboundDispatcher } = await loadGuard({});
    createOutboundDispatcher('https://example.com/', ['93.184.216.34']);
    expect(built.agents).toHaveLength(1);
    expect(built.proxies).toHaveLength(0);
  });

  it('SSRF-PROXY-005: with a proxy it goes through it, keeping TLS checks and the timeout', async () => {
    const { createOutboundDispatcher } = await loadGuard({ HTTPS_PROXY: 'http://proxy:3128' });
    createOutboundDispatcher('https://example.com/', ['93.184.216.34'], false, 30_000);
    expect(built.agents).toHaveLength(0);
    expect(built.proxies[0]).toEqual({
      uri: 'http://proxy:3128',
      requestTls: { rejectUnauthorized: false },
      headersTimeout: 30_000,
      bodyTimeout: 30_000,
    });
  });
});

describe('createOutboundDispatcher, connections kept (the routing relay)', () => {
  it('SSRF-KEEP-001: hands the same dispatcher back for the same vetted addresses, held open ten seconds', async () => {
    const { createOutboundDispatcher } = await loadGuard({});
    const first = createOutboundDispatcher(
      'https://valhalla.liketrek.com/route',
      ['203.0.113.7'],
      true,
      undefined,
      undefined,
      true,
    );
    const again = createOutboundDispatcher(
      'https://valhalla.liketrek.com/height',
      ['203.0.113.7'],
      true,
      undefined,
      undefined,
      true,
    );
    expect(again).toBe(first);
    expect(built.agents).toHaveLength(1);
    expect(built.agents[0]).toMatchObject({ keepAliveTimeout: 10_000 });
  });

  it('SSRF-KEEP-002: a name that resolves elsewhere, or other timeouts, get a dispatcher of their own', async () => {
    const { createOutboundDispatcher } = await loadGuard({});
    const first = createOutboundDispatcher(
      'https://valhalla.liketrek.com/',
      ['203.0.113.7'],
      true,
      undefined,
      undefined,
      true,
    );
    const moved = createOutboundDispatcher(
      'https://valhalla.liketrek.com/',
      ['203.0.113.8'],
      true,
      undefined,
      undefined,
      true,
    );
    const slower = createOutboundDispatcher(
      'https://valhalla.liketrek.com/',
      ['203.0.113.7'],
      true,
      60_000,
      undefined,
      true,
    );
    expect(new Set([first, moved, slower]).size).toBe(3);
    // The new address is the one the socket gets, never the old one.
    const lookup = (
      built.agents[1] as { connect: { lookup: (h: string, o: object, cb: (...a: unknown[]) => void) => void } }
    ).connect.lookup;
    const seen: unknown[] = [];
    lookup('valhalla.liketrek.com', {}, (...args: unknown[]) => seen.push(...args));
    expect(seen).toContain('203.0.113.8');
    expect(seen).not.toContain('203.0.113.7');
  });

  it('SSRF-KEEP-003: keeps at most 32 and closes the oldest; a caller that does not ask keeps none', async () => {
    const { createOutboundDispatcher } = await loadGuard({});
    const at = (n: number) =>
      createOutboundDispatcher('https://h.example/', [`203.0.113.${n}`], true, undefined, undefined, true);
    const oldest = at(0);
    for (let n = 1; n <= 32; n++) at(n);
    expect(built.closed).toEqual([built.agents[0]]);
    expect(at(0)).not.toBe(oldest);

    built.agents.length = 0;
    createOutboundDispatcher('https://h.example/', ['203.0.113.1']);
    createOutboundDispatcher('https://h.example/', ['203.0.113.1']);
    expect(built.agents).toHaveLength(2);
    expect(built.agents[0]).not.toHaveProperty('keepAliveTimeout');
  });
});
