/**
 * Guarded requests and the outbound proxy (#1754). The SSRF guard fetches through
 * its own dispatcher, so it used to skip HTTP_PROXY entirely; these pin when it
 * goes through the proxy and when NO_PROXY keeps it direct.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const built = vi.hoisted(() => ({ agents: [] as unknown[], proxies: [] as Array<Record<string, unknown>> }));

vi.mock('undici', () => ({
  Agent: class { constructor(opts: unknown) { built.agents.push(opts); } },
  ProxyAgent: class { constructor(opts: Record<string, unknown>) { built.proxies.push(opts); } },
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
