import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Capture Agent constructor options so we can test the lookup callback
const { agentCapture } = vi.hoisted(() => ({ agentCapture: { options: null as any } }));

// Mock dns/promises to avoid real DNS lookups in unit tests
vi.mock('dns/promises', () => ({
  default: { lookup: vi.fn() },
  lookup: vi.fn(),
}));

// Mock undici Agent so we can inspect the connect.lookup option
vi.mock('undici', () => ({
  Agent: class MockAgent {
    options: any;
    constructor(opts: any) {
      this.options = opts;
      agentCapture.options = opts;
    }
  },
}));

import dns from 'dns/promises';
import { checkSsrf, SsrfBlockedError, safeFetch, safeFetchLlm, safeFetchFollow, createPinnedDispatcher } from '../../../src/utils/ssrfGuard';

const mockLookup = vi.mocked(dns.lookup);

function mockIp(ip: string) {
  mockLookup.mockResolvedValue({ address: ip, family: ip.includes(':') ? 6 : 4 });
}

/** What the last pinned dispatcher hands a socket that asks for every address. */
function pinnedList(): unknown {
  const lookup = agentCapture.options.connect.lookup as (h: string, o: object, cb: (...a: unknown[]) => void) => void;
  const seen: unknown[] = [];
  lookup('any.example', { all: true }, (...args: unknown[]) => seen.push(...args));
  return seen[1];
}

describe('checkSsrf', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // SEC-001 — Loopback always blocked
  describe('loopback addresses (always blocked)', () => {
    it('SEC-001: blocks 127.0.0.1', async () => {
      mockIp('127.0.0.1');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
      expect(result.isPrivate).toBe(true);
    });

    it('SEC-001: blocks ::1 (IPv6 loopback)', async () => {
      mockIp('::1');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
    });

    it('SEC-001: blocks 127.x.x.x range', async () => {
      mockIp('127.0.0.2');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
    });
  });

  // SEC-002 — Link-local (AWS metadata) always blocked
  describe('link-local addresses (always blocked)', () => {
    it('SEC-002: blocks 169.254.169.254 (AWS metadata)', async () => {
      mockIp('169.254.169.254');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
      expect(result.isPrivate).toBe(true);
    });

    it('SEC-002: blocks any 169.254.x.x address', async () => {
      mockIp('169.254.0.1');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
    });
  });

  // SEC-003 — Private network blocked when ALLOW_INTERNAL_NETWORK is false
  describe('private network addresses (conditionally blocked)', () => {
    beforeEach(() => {
      vi.stubEnv('ALLOW_INTERNAL_NETWORK', 'false');
    });

    it('SEC-003: blocks 10.x.x.x (RFC-1918)', async () => {
      mockIp('10.0.0.1');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
      expect(result.isPrivate).toBe(true);
    });

    it('SEC-003: blocks 192.168.x.x (RFC-1918)', async () => {
      mockIp('192.168.1.100');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
    });

    it('SEC-003: blocks 172.16.x.x through 172.31.x.x (RFC-1918)', async () => {
      mockIp('172.16.0.1');
      const result = await checkSsrf('http://example.com');
      expect(result.allowed).toBe(false);
    });
  });

  // SEC-004 — Private network allowed with ALLOW_INTERNAL_NETWORK=true
  describe('ALLOW_INTERNAL_NETWORK=true', () => {
    it('SEC-004: allows private IP when flag is set', async () => {
      vi.stubEnv('ALLOW_INTERNAL_NETWORK', 'true');
      mockIp('192.168.1.100');
      // Need to reload module since ALLOW_INTERNAL_NETWORK is read at module load time
      vi.resetModules();
      const { checkSsrf: checkSsrfFresh } = await import('../../../src/utils/ssrfGuard');
      const { lookup: freshLookup } = await import('dns/promises');
      vi.mocked(freshLookup).mockResolvedValue({ address: '192.168.1.100', family: 4 });
      const result = await checkSsrfFresh('http://example.com');
      expect(result.allowed).toBe(true);
      expect(result.isPrivate).toBe(true);
    });
  });

  describe('protocol restrictions', () => {
    it('rejects non-HTTP/HTTPS protocols', async () => {
      const result = await checkSsrf('ftp://example.com');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('HTTP');
    });

    it('rejects file:// protocol', async () => {
      const result = await checkSsrf('file:///etc/passwd');
      expect(result.allowed).toBe(false);
    });
  });

  describe('invalid URLs', () => {
    it('rejects malformed URLs', async () => {
      const result = await checkSsrf('not-a-url');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });
  });

  describe('public URLs', () => {
    it('allows a normal public IP', async () => {
      mockIp('8.8.8.8');
      const result = await checkSsrf('https://example.com');
      expect(result.allowed).toBe(true);
      expect(result.isPrivate).toBe(false);
      expect(result.resolvedIp).toBe('8.8.8.8');
    });
  });

  // SEC-005 — IPv6 transition addresses (NAT64/6to4/Teredo) must not tunnel past
  // the guard by embedding a blocked IPv4 target.
  describe('IPv6 transition addresses (NAT64/6to4/Teredo)', () => {
    it.each([
      ['NAT64 → metadata', '64:ff9b::a9fe:a9fe'], // 169.254.169.254
      ['NAT64 → loopback', '64:ff9b::7f00:1'], // 127.0.0.1
      ['6to4 → metadata', '2002:a9fe:a9fe::'],
      ['6to4 → loopback', '2002:7f00:1::'],
      ['Teredo → metadata', '2001::5601:5601'],
    ])('blocks %s (%s)', async (_label, ip) => {
      mockIp(ip);
      const result = await checkSsrf('http://attacker.example');
      expect(result.allowed).toBe(false);
      expect(result.isPrivate).toBe(true);
    });

    it('blocks a NAT64 address embedding an RFC-1918 target (10.0.0.1)', async () => {
      mockIp('64:ff9b::a00:1');
      const result = await checkSsrf('http://attacker.example');
      expect(result.allowed).toBe(false);
      expect(result.isPrivate).toBe(true);
    });

    it.each([
      ['NAT64 → public 8.8.8.8', '64:ff9b::808:808'],
      ['6to4 → public 8.8.8.8', '2002:808:808::'],
    ])('still allows %s — legitimate IPv6→IPv4 egress', async (_label, ip) => {
      mockIp(ip);
      const result = await checkSsrf('http://cdn.example');
      expect(result.allowed).toBe(true);
      expect(result.isPrivate).toBe(false);
    });
  });

  // SEC-013 — the unspecified address and IPv4-mapped spellings
  describe('unspecified address and IPv4-mapped spellings (always blocked)', () => {
    // Connecting to the unspecified address lands on loopback, so `::` reaches a
    // local service without ever naming one. It has several spellings and none of
    // them start with '0.', which is all the IPv4 check ever looked for.
    it.each([
      ['bare', '::'],
      ['single zero', '::0'],
      ['fully written out', '0:0:0:0:0:0:0:0'],
      ['zero-padded', '0000:0000:0000:0000:0000:0000:0000:0000'],
    ])('SEC-013: blocks the unspecified address, %s (%s)', async (_label, ip) => {
      mockIp(ip);
      const result = await checkSsrf('http://attacker.example', true);
      expect(result.allowed).toBe(false);
    });

    // An IPv4-mapped address is the IPv4 it carries. Matching '::ffff:127.' and
    // '::ffff:169.254.' as text missed both the hex spelling of those same
    // addresses and every other blocked range.
    it.each([
      ['mapped loopback, dotted', '::ffff:127.0.0.1'],
      ['mapped loopback, hex', '::ffff:7f00:1'],
      ['mapped metadata, dotted', '::ffff:169.254.169.254'],
      ['mapped metadata, hex', '::ffff:a9fe:a9fe'],
      ['mapped unspecified', '::ffff:0:0'],
      ['mapped 0.0.0.0, dotted', '::ffff:0.0.0.0'],
    ])('SEC-013: blocks %s (%s)', async (_label, ip) => {
      mockIp(ip);
      const result = await checkSsrf('http://attacker.example', true);
      expect(result.allowed).toBe(false);
    });

    it.each([
      ['mapped RFC-1918, hex', '::ffff:c0a8:1'],
      ['mapped CGNAT', '::ffff:100.64.0.1'],
    ])('SEC-013: treats %s (%s) as private', async (_label, ip) => {
      mockIp(ip);
      const result = await checkSsrf('http://attacker.example');
      expect(result.allowed).toBe(false);
      expect(result.isPrivate).toBe(true);
    });

    it('SEC-013: still allows a mapped public address', async () => {
      mockIp('::ffff:8.8.8.8');
      const result = await checkSsrf('http://cdn.example');
      expect(result.allowed).toBe(true);
      expect(result.isPrivate).toBe(false);
    });

    // An IPv4-compatible address (::a.b.c.d) is the IPv4 it carries as well. Node
    // prints an AAAA record of ::a9fe:a9fe as ::169.254.169.254, so that is the
    // spelling that reaches the guard, and it used to pass as a public address.
    it.each([
      ['compatible metadata, the spelling Node prints', '::169.254.169.254'],
      ['compatible metadata, hex', '::a9fe:a9fe'],
      ['compatible Alibaba metadata', '::100.100.100.200'],
      ['compatible loopback', '::127.0.0.1'],
      ['compatible loopback, hex', '::7f00:1'],
      ['loopback written out', '0:0:0:0:0:0:0:1'],
    ])('SEC-013: always blocks %s (%s)', async (_label, ip) => {
      mockIp(ip);
      const result = await checkSsrf('http://attacker.example');
      expect(result).toMatchObject({ allowed: false, error: 'Requests to loopback and link-local addresses are not allowed' });
    });

    it('SEC-013: treats a compatible RFC-1918 address as private and a compatible public one as public', async () => {
      mockIp('::10.0.0.1');
      expect(await checkSsrf('http://attacker.example')).toMatchObject({
        allowed: false, isPrivate: true, error: expect.stringContaining('ALLOW_INTERNAL_NETWORK'),
      });
      mockIp('::8.8.8.8');
      expect(await checkSsrf('http://cdn.example')).toMatchObject({ allowed: true, isPrivate: false });
    });
  });

  // SEC-014 — fe80::/10 is ten bits, not the four characters 'fe80'
  describe('the whole IPv6 link-local range', () => {
    it.each([['fe80::1'], ['fe90::1'], ['fea0::1'], ['febf::1']])(
      'SEC-014: blocks %s',
      async (ip) => {
        mockIp(ip);
        const result = await checkSsrf('http://attacker.example', true);
        expect(result.allowed).toBe(false);
      },
    );

    // The bounds, so widening fe80: to the full /10 cannot creep further: fe7f
    // sits just below the range and fec0 just above it, and neither is link-local.
    it.each([['fe7f::1'], ['fec0::1']])('SEC-014: %s is outside fe80::/10', async (ip) => {
      mockIp(ip);
      const result = await checkSsrf('http://cdn.example', true);
      expect(result.allowed).toBe(true);
    });
  });

  describe('internal hostname suffixes', () => {
    it('blocks .local domains', async () => {
      const result = await checkSsrf('http://myserver.local');
      expect(result.allowed).toBe(false);
    });

    it('blocks .internal domains', async () => {
      const result = await checkSsrf('http://service.internal');
      expect(result.allowed).toBe(false);
    });
  });

  describe('DNS resolution failure', () => {
    it('returns allowed:false when dns.lookup throws', async () => {
      mockLookup.mockRejectedValue(new Error('ENOTFOUND nxdomain.example'));
      const result = await checkSsrf('http://nxdomain.example.com');
      expect(result.allowed).toBe(false);
      expect(result.isPrivate).toBe(false);
      expect(result.error).toContain('Could not resolve hostname');
    });
  });

});

describe('SsrfBlockedError', () => {
  it('is an instance of Error', () => {
    const err = new SsrfBlockedError('blocked');
    expect(err).toBeInstanceOf(Error);
  });

  it('has name SsrfBlockedError', () => {
    const err = new SsrfBlockedError('test message');
    expect(err.name).toBe('SsrfBlockedError');
  });

  it('has the correct message', () => {
    const err = new SsrfBlockedError('my message');
    expect(err.message).toBe('my message');
  });
});

describe('safeFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws SsrfBlockedError for a blocked URL (invalid URL)', async () => {
    await expect(safeFetch('not-a-valid-url')).rejects.toThrow(SsrfBlockedError);
  });

  it('throws SsrfBlockedError for a loopback URL', async () => {
    mockLookup.mockResolvedValue({ address: '127.0.0.1', family: 4 });
    await expect(safeFetch('http://localhost')).rejects.toThrow(SsrfBlockedError);
  });

  it('calls fetch with the resolved URL when allowed', async () => {
    mockLookup.mockResolvedValue({ address: '93.184.216.34', family: 4 });
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', mockFetch);
    const result = await safeFetch('https://example.com');
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result.status).toBe(200);
  });

  it('throws SsrfBlockedError with fallback message when error is undefined', async () => {
    // non-http protocol → error:'Only HTTP and HTTPS URLs are allowed'
    await expect(safeFetch('ftp://example.com')).rejects.toThrow(SsrfBlockedError);
  });
});

describe('safeFetchFollow (manual per-hop redirect SSRF)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    mockLookup.mockReset();
  });

  /** Build a minimal Response-like object for a given hop. */
  function fakeResponse(opts: { status: number; location?: string; url: string; ok?: boolean }) {
    return {
      status: opts.status,
      ok: opts.ok ?? (opts.status >= 200 && opts.status < 300),
      url: opts.url,
      headers: { get: (h: string) => (h.toLowerCase() === 'location' ? opts.location ?? null : null) },
      body: { cancel: () => Promise.resolve() },
    };
  }

  it('follows a legitimate cross-host redirect (goo.gl -> maps.google.com) to the final response', async () => {
    // Both hops resolve to public IPs.
    mockLookup.mockResolvedValue({ address: '142.250.0.0', family: 4 });
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(fakeResponse({ status: 302, location: 'https://maps.google.com/maps/place/Foo', url: 'https://goo.gl/abc' }))
      .mockResolvedValueOnce(fakeResponse({ status: 200, url: 'https://maps.google.com/maps/place/Foo' }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await safeFetchFollow('https://goo.gl/abc');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
    expect(res.url).toBe('https://maps.google.com/maps/place/Foo');
  });

  it('blocks a redirect whose target resolves to an internal IP', async () => {
    vi.stubEnv('ALLOW_INTERNAL_NETWORK', 'false');
    // First hop (public) is allowed; the redirect target resolves to a private IP.
    mockLookup
      .mockResolvedValueOnce({ address: '142.250.0.0', family: 4 }) // goo.gl
      .mockResolvedValue({ address: '169.254.169.254', family: 4 }); // redirect → metadata
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(fakeResponse({ status: 302, location: 'http://169.254.169.254/latest/meta-data/', url: 'https://goo.gl/evil' }));
    vi.stubGlobal('fetch', mockFetch);

    await expect(safeFetchFollow('https://goo.gl/evil')).rejects.toThrow(SsrfBlockedError);
    // Only the first hop should have been fetched; the internal hop is blocked BEFORE fetch.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Following redirects by hand opts out of the platform's own rules, so they
  // have to be restated. undici drops Authorization across origins itself
  // (Fetch, "HTTP-redirect fetch" step 13) — without this, converting a caller
  // that sends a bearer token to safeFetchFollow would have been a regression.
  describe('credentials and body across a hop', () => {
    const authInit = { method: 'POST', headers: { Authorization: 'Bearer secret', 'X-Api-Key': 'k', 'User-Agent': 'TREK' }, body: 'payload' };
    const headerOf = (call: unknown[], name: string) =>
      new Headers((call[1] as { headers?: ConstructorParameters<typeof Headers>[0] }).headers).get(name);

    function twoHops(location: string, status = 307) {
      mockLookup.mockResolvedValue({ address: '142.250.0.0', family: 4 });
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(fakeResponse({ status, location, url: 'https://start.example/a' }))
        .mockResolvedValueOnce(fakeResponse({ status: 200, url: location }));
      vi.stubGlobal('fetch', mockFetch);
      return mockFetch;
    }

    it('drops credential headers when the hop changes origin', async () => {
      const mockFetch = twoHops('https://elsewhere.example/b');
      await safeFetchFollow('https://start.example/a', authInit);

      expect(headerOf(mockFetch.mock.calls[0], 'authorization')).toBe('Bearer secret');
      expect(headerOf(mockFetch.mock.calls[1], 'authorization')).toBeNull();
      expect(headerOf(mockFetch.mock.calls[1], 'x-api-key')).toBeNull();
      // User-Agent is not a credential and must survive: the goo.gl chain needs
      // it on the last hop or Google serves a different page.
      expect(headerOf(mockFetch.mock.calls[1], 'user-agent')).toBe('TREK');
    });

    it('keeps them on a same-origin hop', async () => {
      const mockFetch = twoHops('https://start.example/b');
      await safeFetchFollow('https://start.example/a', authInit);
      expect(headerOf(mockFetch.mock.calls[1], 'authorization')).toBe('Bearer secret');
    });

    it('treats the same host moving http to https as an upgrade, not a host change', async () => {
      const mockFetch = twoHops('https://start.example/b');
      await safeFetchFollow('http://start.example/a', authInit);
      expect(headerOf(mockFetch.mock.calls[1], 'authorization')).toBe('Bearer secret');
    });

    it('keeps method and body on a 307, which is what preserves them', async () => {
      const mockFetch = twoHops('https://start.example/b', 307);
      await safeFetchFollow('https://start.example/a', authInit);
      expect(mockFetch.mock.calls[1][1]).toMatchObject({ method: 'POST', body: 'payload' });
    });

    it('downgrades a 303 to GET without a body', async () => {
      const mockFetch = twoHops('https://start.example/b', 303);
      await safeFetchFollow('https://start.example/a', authInit);
      expect(mockFetch.mock.calls[1][1]).toMatchObject({ method: 'GET', body: undefined });
      expect(headerOf(mockFetch.mock.calls[1], 'content-type')).toBeNull();
    });

    it('downgrades a 302 on a POST too, so a client_secret is not re-posted elsewhere', async () => {
      const mockFetch = twoHops('https://elsewhere.example/b', 302);
      await safeFetchFollow('https://start.example/a', authInit);
      expect(mockFetch.mock.calls[1][1]).toMatchObject({ method: 'GET', body: undefined });
      expect(headerOf(mockFetch.mock.calls[1], 'authorization')).toBeNull();
    });

    it('leaves a GET alone on a 301', async () => {
      const mockFetch = twoHops('https://start.example/b', 301);
      await safeFetchFollow('https://start.example/a', { headers: { 'User-Agent': 'TREK' } });
      // No downgrade to apply: the request was already a GET, so the init keeps
      // its shape and the caller's own header rides along.
      expect((mockFetch.mock.calls[1][1] as RequestInit).method).toBeUndefined();
      expect((mockFetch.mock.calls[1][1] as RequestInit).body).toBeUndefined();
      expect(headerOf(mockFetch.mock.calls[1], 'user-agent')).toBe('TREK');
    });

    it('keeps credentials when the caller opts in', async () => {
      const mockFetch = twoHops('https://elsewhere.example/b');
      await safeFetchFollow('https://start.example/a', authInit, { keepCredentialsOnRedirect: true });
      expect(headerOf(mockFetch.mock.calls[1], 'authorization')).toBe('Bearer secret');
    });

    it('an init without headers survives the strip untouched', async () => {
      const mockFetch = twoHops('https://elsewhere.example/b');
      await safeFetchFollow('https://start.example/a', { signal: AbortSignal.timeout(5000) });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('a relative redirect stays on the origin and keeps them', async () => {
      mockLookup.mockResolvedValue({ address: '142.250.0.0', family: 4 });
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(fakeResponse({ status: 307, location: '/moved', url: 'https://start.example/a' }))
        .mockResolvedValueOnce(fakeResponse({ status: 200, url: 'https://start.example/moved' }));
      vi.stubGlobal('fetch', mockFetch);
      await safeFetchFollow('https://start.example/a', authInit);
      expect(mockFetch.mock.calls[1][0]).toBe('https://start.example/moved');
      expect(headerOf(mockFetch.mock.calls[1], 'authorization')).toBe('Bearer secret');
    });
  });

  it('blocks a redirect to a loopback address even with ALLOW_INTERNAL_NETWORK=true', async () => {
    mockLookup
      .mockResolvedValueOnce({ address: '142.250.0.0', family: 4 })
      .mockResolvedValue({ address: '127.0.0.1', family: 4 });
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(fakeResponse({ status: 301, location: 'http://internal/', url: 'https://goo.gl/x' }));
    vi.stubGlobal('fetch', mockFetch);

    await expect(safeFetchFollow('https://goo.gl/x', undefined, { bypassInternalIpAllowed: true }))
      .rejects.toThrow(SsrfBlockedError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects the initial URL if it is already internal', async () => {
    mockLookup.mockResolvedValue({ address: '10.0.0.5', family: 4 });
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    await expect(safeFetchFollow('http://intranet.example')).rejects.toThrow(SsrfBlockedError);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns the response immediately when not a redirect', async () => {
    mockLookup.mockResolvedValue({ address: '8.8.8.8', family: 4 });
    const mockFetch = vi.fn().mockResolvedValue(fakeResponse({ status: 200, url: 'https://example.com' }));
    vi.stubGlobal('fetch', mockFetch);
    const res = await safeFetchFollow('https://example.com');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('returns a 3xx with no Location header as-is (nothing to follow)', async () => {
    mockLookup.mockResolvedValue({ address: '8.8.8.8', family: 4 });
    const mockFetch = vi.fn().mockResolvedValue(fakeResponse({ status: 304, url: 'https://example.com' }));
    vi.stubGlobal('fetch', mockFetch);
    const res = await safeFetchFollow('https://example.com');
    expect(res.status).toBe(304);
  });

  it('throws after exceeding the max redirect hops', async () => {
    mockLookup.mockResolvedValue({ address: '8.8.8.8', family: 4 });
    // Always 302 to a new public host → loops until the hop cap.
    let n = 0;
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(fakeResponse({ status: 302, location: `https://h${++n}.example.com/`, url: `https://h${n}.example.com/` })),
    );
    vi.stubGlobal('fetch', mockFetch);
    await expect(safeFetchFollow('https://start.example.com', undefined, { maxRedirects: 2 }))
      .rejects.toThrow(SsrfBlockedError);
    // initial + 2 allowed redirects = 3 fetches, then the 4th hop is rejected before fetch
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('resolves relative redirect Location against the current URL', async () => {
    mockLookup.mockResolvedValue({ address: '8.8.8.8', family: 4 });
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(fakeResponse({ status: 302, location: '/resolved/path', url: 'https://example.com/start' }))
      .mockResolvedValueOnce(fakeResponse({ status: 200, url: 'https://example.com/resolved/path' }));
    vi.stubGlobal('fetch', mockFetch);
    await safeFetchFollow('https://example.com/start');
    // Second fetch must target the absolute resolution of the relative Location.
    expect(mockFetch.mock.calls[1][0]).toBe('https://example.com/resolved/path');
  });
});

describe('createPinnedDispatcher', () => {
  it('returns an object (Agent instance)', () => {
    const dispatcher = createPinnedDispatcher('93.184.216.34');
    expect(dispatcher).toBeDefined();
    expect(typeof dispatcher).toBe('object');
  });

  it('pinned lookup callback calls back with the resolved IPv4 address', () => {
    createPinnedDispatcher('93.184.216.34');
    const lookup = agentCapture.options?.connect?.lookup;
    expect(typeof lookup).toBe('function');
    const cb = vi.fn();
    lookup('example.com', {}, cb);
    expect(cb).toHaveBeenCalledWith(null, '93.184.216.34', 4);
  });

  it('pinned lookup callback uses family 6 for IPv6 address', () => {
    createPinnedDispatcher('2001:4860:4860::8888');
    const lookup = agentCapture.options?.connect?.lookup;
    const cb = vi.fn();
    lookup('example.com', {}, cb);
    expect(cb).toHaveBeenCalledWith(null, '2001:4860:4860::8888', 6);
  });

  it('returns array format when opts.all is true', () => {
    createPinnedDispatcher('93.184.216.34');
    const lookup = agentCapture.options?.connect?.lookup;
    const cb = vi.fn();
    lookup('example.com', { all: true }, cb);
    expect(cb).toHaveBeenCalledWith(null, [{ address: '93.184.216.34', family: 4 }]);
  });
});

describe('safeFetchLlm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('blocks the cloud-metadata address (169.254.169.254)', async () => {
    mockIp('169.254.169.254');
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    await expect(safeFetchLlm('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(SsrfBlockedError);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('blocks a hostname that resolves to the metadata range', async () => {
    mockIp('169.254.169.254');
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    await expect(safeFetchLlm('http://ollama.evil.example/chat')).rejects.toThrow(/link-local/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('blocks IPv6 link-local (fe80::)', async () => {
    mockIp('fe80::1');
    vi.stubGlobal('fetch', vi.fn());
    await expect(safeFetchLlm('http://[fe80::1]/chat')).rejects.toThrow(SsrfBlockedError);
  });

  it('blocks the rest of the fe80::/10 range, not just the fe80: prefix', async () => {
    mockIp('febf::1');
    vi.stubGlobal('fetch', vi.fn());
    await expect(safeFetchLlm('http://[febf::1]/chat')).rejects.toThrow(SsrfBlockedError);
  });

  it('blocks IPv4-mapped and IPv4-compatible metadata spellings', async () => {
    vi.stubGlobal('fetch', vi.fn());
    mockIp('::ffff:169.254.169.254');
    await expect(safeFetchLlm('http://host.example/chat')).rejects.toThrow(SsrfBlockedError);
    mockIp('::a9fe:a9fe');
    await expect(safeFetchLlm('http://host.example/chat')).rejects.toThrow(SsrfBlockedError);
    // What Node actually hands back for an AAAA record of ::a9fe:a9fe.
    mockIp('::169.254.169.254');
    await expect(safeFetchLlm('http://host.example/chat')).rejects.toThrow(SsrfBlockedError);
    mockIp('::100.100.100.200');
    await expect(safeFetchLlm('http://host.example/chat')).rejects.toThrow(SsrfBlockedError);
  });

  it('blocks the AWS IMDSv6 ULA endpoint but allows other ULA (a LAN model server)', async () => {
    const okFetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal('fetch', okFetch);
    mockIp('fd00:ec2::254');
    await expect(safeFetchLlm('http://imds.example/chat')).rejects.toThrow(SsrfBlockedError);
    mockIp('fd12:3456::1');
    await safeFetchLlm('http://lan-model.example/chat');
    expect(okFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a non-http(s) protocol', async () => {
    vi.stubGlobal('fetch', vi.fn());
    await expect(safeFetchLlm('file:///etc/passwd')).rejects.toThrow(SsrfBlockedError);
  });

  // The whole point of the LLM-specific guard: a self-hosted Ollama on localhost
  // must still work — unlike safeFetch(), loopback is allowed here.
  it('allows a loopback target (local Ollama)', async () => {
    mockIp('127.0.0.1');
    const mockFetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal('fetch', mockFetch);
    await safeFetchLlm('http://localhost:11434/v1/chat/completions', { method: 'POST' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:11434/v1/chat/completions');
  });

  it('allows a private/LAN target (self-hosted model server)', async () => {
    mockIp('192.168.1.50');
    const mockFetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal('fetch', mockFetch);
    await safeFetchLlm('http://192.168.1.50:8000/v1/chat/completions');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Regression (GHSA-fmq9-ggh3-647p follow-up): the guard must re-validate on EVERY
  // redirect hop, not just the initial URL. A public endpoint that 302s to the
  // metadata IP-literal would otherwise slip through — the DNS pin does not cover an
  // IP-literal redirect hop (Node's net.connect skips the pinned lookup for a literal IP).
  function llmResponse(opts: { status: number; location?: string }) {
    return {
      status: opts.status,
      ok: opts.status >= 200 && opts.status < 300,
      headers: { get: (h: string) => (h.toLowerCase() === 'location' ? (opts.location ?? null) : null) },
      body: { cancel: () => Promise.resolve() },
    };
  }

  it('requests each hop with redirect:manual so the platform never auto-follows', async () => {
    mockIp('203.0.113.10');
    const mockFetch = vi.fn().mockResolvedValue(llmResponse({ status: 200 }));
    vi.stubGlobal('fetch', mockFetch);
    await safeFetchLlm('https://api.provider.example/v1/chat/completions');
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
  });

  it('blocks a redirect from a public endpoint to the metadata IP-literal', async () => {
    mockLookup
      .mockResolvedValueOnce({ address: '203.0.113.10', family: 4 }) // configured endpoint (public)
      .mockResolvedValue({ address: '169.254.169.254', family: 4 }); // redirect target → metadata
    const mockFetch = vi.fn().mockResolvedValueOnce(
      llmResponse({ status: 302, location: 'http://169.254.169.254/latest/meta-data/' }),
    );
    vi.stubGlobal('fetch', mockFetch);
    await expect(
      safeFetchLlm('https://api.provider.example/v1/chat/completions', { method: 'POST' }),
    ).rejects.toThrow(SsrfBlockedError);
    // The metadata hop is refused BEFORE its fetch — only the initial hop ran.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('follows a legitimate redirect between allowed hosts (http→https upgrade) to the final response', async () => {
    mockLookup
      .mockResolvedValueOnce({ address: '127.0.0.1', family: 4 }) // http Ollama
      .mockResolvedValue({ address: '127.0.0.1', family: 4 }); // https upgrade, same host
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(llmResponse({ status: 301, location: 'https://localhost:11434/v1/chat/completions' }))
      .mockResolvedValueOnce(llmResponse({ status: 200 }));
    vi.stubGlobal('fetch', mockFetch);
    const res = await safeFetchLlm('http://localhost:11434/v1/chat/completions', { method: 'POST' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
  });

  it('blocks the Alibaba Cloud metadata IPs directly (CGNAT range is otherwise allowed for LAN)', async () => {
    vi.stubGlobal('fetch', vi.fn());
    mockIp('100.100.100.200');
    await expect(safeFetchLlm('http://model.example/chat')).rejects.toThrow(SsrfBlockedError);
    mockIp('100.100.100.100');
    await expect(safeFetchLlm('http://model.example/chat')).rejects.toThrow(SsrfBlockedError);
  });

  it('blocks the Alibaba metadata IPs in their IPv4-mapped spellings, and only those', async () => {
    const okFetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal('fetch', okFetch);
    for (const ip of ['::ffff:100.100.100.200', '::ffff:6464:64c8', '::ffff:6464:6464']) {
      mockIp(ip);
      await expect(safeFetchLlm('http://model.example/chat')).rejects.toThrow(SsrfBlockedError);
    }
    expect(okFetch).not.toHaveBeenCalled();
    // A mapped LAN or CGNAT model server is still a model server.
    for (const ip of ['::ffff:192.168.1.50', '::ffff:100.100.100.201']) {
      mockIp(ip);
      await safeFetchLlm('http://model.example/chat');
    }
    expect(okFetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['NAT64 → metadata', '64:ff9b::a9fe:a9fe'],
    ['6to4 → metadata', '2002:a9fe:a9fe::'],
    ['Teredo → metadata', '2001::5601:5601'],
  ])('blocks an IPv6 transition address to the metadata IP: %s', async (_label, ip) => {
    mockIp(ip);
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    await expect(safeFetchLlm('http://ollama.evil.example/chat')).rejects.toThrow(SsrfBlockedError);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('still allows a NAT64 address to a LAN model server (192.168.1.50)', async () => {
    // The LLM guard permits private/LAN targets — only link-local/metadata is blocked,
    // so a NAT64 spelling of a LAN model host must keep working.
    mockIp('64:ff9b::c0a8:132'); // 192.168.1.50
    const mockFetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal('fetch', mockFetch);
    await safeFetchLlm('http://lan-model.example/chat');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('stops following after the redirect cap', async () => {
    mockIp('203.0.113.10');
    const mockFetch = vi
      .fn()
      .mockResolvedValue(llmResponse({ status: 302, location: 'https://api.provider.example/next' }));
    vi.stubGlobal('fetch', mockFetch);
    await expect(
      safeFetchLlm('https://api.provider.example/v1/chat/completions', undefined, 2),
    ).rejects.toThrow(/Too many redirects/i);
    // initial + 2 allowed hops = 3 fetches, then the 4th is refused before fetch.
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe('ALLOW_LINK_LOCAL_IPS (#2400)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // The list is read when the module loads, like ALLOW_INTERNAL_NETWORK, so each
  // case loads a fresh copy under its own environment.
  async function guardWith(env: Record<string, string>) {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    vi.resetModules();
    const guard = await import('../../../src/utils/ssrfGuard');
    const lookup = vi.mocked((await import('dns/promises')).default.lookup);
    const resolve = (ip: string) => lookup.mockResolvedValue({ address: ip, family: ip.includes(':') ? 6 : 4 });
    return { guard, resolve };
  }

  it('reaches a rootless Podman host gateway from OIDC once the address is listed', async () => {
    const { guard, resolve } = await guardWith({ ALLOW_LINK_LOCAL_IPS: '169.254.1.2' });
    resolve('169.254.1.2');
    const okFetch = vi.fn().mockResolvedValue({ status: 200, headers: new Headers() });
    vi.stubGlobal('fetch', okFetch);

    await guard.safeFetchAdminConfigured('https://keycloak.example.com/realms/trek/.well-known/openid-configuration');

    expect(okFetch).toHaveBeenCalledTimes(1);

    // The IPv4-mapped spellings of the listed address are the same address, as
    // they already were under the strict guard.
    for (const ip of ['::ffff:169.254.1.2', '::ffff:a9fe:102']) {
      resolve(ip);
      await guard.safeFetchAdminConfigured('https://keycloak.example.com/');
    }
    expect(okFetch).toHaveBeenCalledTimes(3);
  });

  it('refuses the gateway as before while nothing is listed, whatever ALLOW_INTERNAL_NETWORK says', async () => {
    const { guard, resolve } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'true' });
    resolve('169.254.1.2');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(guard.safeFetchAdminConfigured('https://keycloak.example.com/')).rejects.toThrow(
      'Requests to link-local / cloud-metadata addresses are not allowed',
    );
    expect((await guard.checkSsrf('https://keycloak.example.com/')).allowed).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps every address that is not listed blocked, the metadata service included', async () => {
    const { guard, resolve } = await guardWith({ ALLOW_LINK_LOCAL_IPS: '169.254.1.2', ALLOW_INTERNAL_NETWORK: 'true' });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    for (const ip of ['169.254.1.3', '169.254.169.254', '169.254.170.2', '::ffff:169.254.169.254']) {
      resolve(ip);
      await expect(guard.safeFetchAdminConfigured('https://idp.example/')).rejects.toThrow(guard.SsrfBlockedError);
      expect((await guard.checkSsrf('https://idp.example/')).allowed).toBe(false);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('counts as the internal network for a URL a user typed, so it also needs ALLOW_INTERNAL_NETWORK', async () => {
    const closed = await guardWith({ ALLOW_LINK_LOCAL_IPS: '169.254.1.2', ALLOW_INTERNAL_NETWORK: 'false' });
    closed.resolve('169.254.1.2');
    expect(await closed.guard.checkSsrf('https://immich.example/')).toMatchObject({
      allowed: false,
      isPrivate: true,
      error: expect.stringContaining('ALLOW_INTERNAL_NETWORK'),
    });

    const open = await guardWith({ ALLOW_LINK_LOCAL_IPS: '169.254.1.2', ALLOW_INTERNAL_NETWORK: 'true' });
    open.resolve('169.254.1.2');
    expect(await open.guard.checkSsrf('https://immich.example/')).toMatchObject({ allowed: true, isPrivate: true });
    // A caller that refuses the internal network outright still refuses it.
    expect((await open.guard.checkSsrf('https://immich.example/', true)).allowed).toBe(false);
    // The IPv4-mapped spelling of the same address gets the same answer.
    open.resolve('::ffff:169.254.1.2');
    expect(await open.guard.checkSsrf('https://immich.example/')).toMatchObject({ allowed: true, isPrivate: true });
  });
});

describe('dual-stack names: every address is checked and every address is pinned', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mockLookup.mockReset();
    agentCapture.options = null;
  });

  const resolveAll = (entries: { address: string; family: number }[]) =>
    mockLookup.mockResolvedValue(entries as never);

  it('SEC-DUAL-001: asks the resolver for all addresses and lists IPv4 ahead of IPv6', async () => {
    resolveAll([{ address: '2001:db8::10', family: 6 }, { address: '203.0.113.10', family: 4 }]);

    const result = await checkSsrf('https://idp.example');

    expect(mockLookup).toHaveBeenCalledWith('idp.example', { all: true });
    expect(result.allowed).toBe(true);
    expect(result.resolvedIps).toEqual(['203.0.113.10', '2001:db8::10']);
    expect(result.resolvedIp).toBe('203.0.113.10');
  });

  it('SEC-DUAL-002: a name with one private address among public ones stays blocked', async () => {
    resolveAll([{ address: '203.0.113.10', family: 4 }, { address: '10.0.0.5', family: 4 }]);

    const result = await checkSsrf('https://split.example');

    expect(result.allowed).toBe(false);
    expect(result.isPrivate).toBe(true);
    expect(result.resolvedIp).toBe('10.0.0.5');
  });

  it('SEC-DUAL-003: a loopback address behind a public one is never handed to the socket', async () => {
    resolveAll([{ address: '203.0.113.10', family: 4 }, { address: '::1', family: 6 }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true, headers: { get: () => null } }));

    const result = await checkSsrf('https://rebind.example');
    await safeFetchFollow('https://rebind.example/');

    expect(result).toMatchObject({ allowed: true, isPrivate: false, resolvedIp: '203.0.113.10', resolvedIps: ['203.0.113.10'] });
    expect(pinnedList()).toEqual([{ address: '203.0.113.10', family: 4 }]);
  });

  it('SEC-DUAL-004: the pinned dispatcher hands the socket the whole checked list, IPv4 first', async () => {
    resolveAll([{ address: '2001:db8::10', family: 6 }, { address: '203.0.113.10', family: 4 }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true, headers: { get: () => null } }));

    await safeFetchFollow('https://idp.example/');

    const lookup = agentCapture.options.connect.lookup as (h: string, o: object, cb: (...a: unknown[]) => void) => void;
    const seen: unknown[] = [];
    lookup('somebody-else.example', { all: true }, (...args: unknown[]) => seen.push(...args));
    expect(seen).toEqual([null, [
      { address: '203.0.113.10', family: 4 },
      { address: '2001:db8::10', family: 6 },
    ]]);
    // Asked for one address, the socket gets the first of the same list; the
    // name it asks for never matters, that is the whole point of the pin.
    const single: unknown[] = [];
    lookup('somebody-else.example', {}, (...args: unknown[]) => single.push(...args));
    expect(single).toEqual([null, '203.0.113.10', 4]);
  });

  it('SEC-DUAL-005: the admin lane never hands a metadata address in the answer to the socket', async () => {
    resolveAll([{ address: '169.254.169.254', family: 4 }, { address: '203.0.113.10', family: 4 }]);
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200, ok: true, headers: { get: () => null } });
    vi.stubGlobal('fetch', fetchSpy);

    await safeFetchLlm('https://models.example/v1');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(pinnedList()).toEqual([{ address: '203.0.113.10', family: 4 }]);
  });

  it('SEC-DUAL-006: a redirect hop resolves and pins its own full list again', async () => {
    mockLookup
      .mockResolvedValueOnce([{ address: '2001:db8::1', family: 6 }, { address: '203.0.113.1', family: 4 }] as never)
      .mockResolvedValueOnce([{ address: '2001:db8::2', family: 6 }, { address: '203.0.113.2', family: 4 }] as never);
    const pins: unknown[][] = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      const lookup = agentCapture.options.connect.lookup as (h: string, o: object, cb: (...a: unknown[]) => void) => void;
      const seen: unknown[] = [];
      lookup('x', { all: true }, (...args: unknown[]) => seen.push(...args));
      pins.push(seen);
      return pins.length === 1
        ? { status: 302, ok: false, headers: { get: (h: string) => (h.toLowerCase() === 'location' ? 'https://second.example/' : null) } }
        : { status: 200, ok: true, headers: { get: () => null } };
    }));

    const response = await safeFetchLlm('https://first.example/');

    expect(response.status).toBe(200);
    expect(pins[0][1]).toEqual([{ address: '203.0.113.1', family: 4 }, { address: '2001:db8::1', family: 6 }]);
    expect(pins[1][1]).toEqual([{ address: '203.0.113.2', family: 4 }, { address: '2001:db8::2', family: 6 }]);
  });

  it('SEC-DUAL-007: a single record answered the old way is still one pinned address', async () => {
    mockLookup.mockResolvedValue({ address: '203.0.113.10', family: 4 });

    const result = await checkSsrf('https://one.example');

    expect(result).toMatchObject({ allowed: true, resolvedIp: '203.0.113.10', resolvedIps: ['203.0.113.10'] });
  });

  it('SEC-DUAL-008: an empty answer is a name that does not resolve', async () => {
    mockLookup.mockResolvedValue([] as never);

    const result = await checkSsrf('https://empty.example');

    expect(result.allowed).toBe(false);
    expect(result.error).toBe('Could not resolve hostname (ENOTFOUND)');
  });
});

describe('a name with a link-local record next to a usable one (#2506)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    agentCapture.options = null;
  });

  // The flags are read when the module loads, so each case loads a fresh copy of
  // the guard under its own environment and resolver answer.
  async function guardWith(env: Record<string, string>, answer: { address: string; family: number }[]) {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    vi.resetModules();
    const guard = await import('../../../src/utils/ssrfGuard');
    const lookup = vi.mocked((await import('dns/promises')).default.lookup);
    lookup.mockResolvedValue(answer as never);
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200, ok: true, headers: new Headers() });
    vi.stubGlobal('fetch', fetchSpy);
    return { guard, lookup, fetchSpy };
  }

  const v4 = (address: string) => ({ address, family: 4 });
  const v6 = (address: string) => ({ address, family: 6 });
  const redirectTo = (location: string) => ({
    status: 302,
    ok: false,
    headers: new Headers({ location }),
    body: { cancel: () => Promise.resolve() },
  });

  // The second reporter's DNS: the IdP's LAN address with an fe80:: AAAA beside it.
  const REPORTED = [v4('10.0.40.239'), v6('fe80::1')];
  // How Windows answers for its own name: the link-local addresses come first.
  const LINK_LOCAL_FIRST = [v6('fe80::b67e:9b1c:8625:40a7'), v6('fe80::f9f1:353:73:14a0'), v4('192.168.178.36')];
  // Every spelling of link-local and cloud metadata both lanes refuse. The
  // IPv4-compatible ones come as ::169.254.169.254 from a real resolver, which
  // prints ::/96 in dotted form; the hex spelling is what an IP literal keeps.
  const METADATA_AND_LINK_LOCAL = [
    v4('169.254.169.254'), v4('169.254.0.1'), v4('100.100.100.200'), v4('100.100.100.100'),
    v6('fe80::1'), v6('fe80::1%eth0'), v6('febf::1'), v6('fd00:ec2::254'), v6('fd00:0ec2::254'),
    v6('::ffff:169.254.169.254'), v6('::ffff:a9fe:a9fe'), v6('::a9fe:a9fe'), v6('::169.254.169.254'),
    v6('::ffff:100.100.100.200'), v6('::ffff:6464:6464'), v6('::100.100.100.200'),
    v6('64:ff9b::a9fe:a9fe'), v6('2002:a9fe:a9fe::'), v6('2001::5601:5601'), v6('64:ff9b::6464:64c8'),
  ];

  describe('the admin lane (OIDC, plugin OAuth, model endpoints, own routing engine)', () => {
    it('SEC-2506-001: OIDC discovery reaches the IdP over its LAN address and never the fe80:: one', async () => {
      const { guard, fetchSpy } = await guardWith({}, REPORTED);

      await guard.safeFetchAdminConfigured('https://auth.home.example/.well-known/openid-configuration');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(pinnedList()).toEqual([v4('10.0.40.239')]);
      // A socket that asks for one address gets the same vetted one.
      const single: unknown[] = [];
      agentCapture.options.connect.lookup('auth.home.example', {}, (...args: unknown[]) => single.push(...args));
      expect(single).toEqual([null, '10.0.40.239', 4]);
    });

    it('SEC-2506-002: link-local records ahead of the IPv4 change nothing', async () => {
      const { guard, fetchSpy } = await guardWith({}, LINK_LOCAL_FIRST);

      await guard.safeFetchAdminConfigured('http://maurice-pc:3191/.well-known/openid-configuration');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(pinnedList()).toEqual([v4('192.168.178.36')]);
    });

    it('SEC-2506-003: no link-local or metadata spelling reaches the socket, whatever ALLOW_INTERNAL_NETWORK says', async () => {
      for (const flag of ['true', 'false']) {
        const { guard } = await guardWith(
          { ALLOW_INTERNAL_NETWORK: flag },
          [...METADATA_AND_LINK_LOCAL, v4('10.0.40.239'), v6('fd12:3456::1')],
        );

        await guard.safeFetchAdminConfigured('https://auth.home.example/');

        expect(pinnedList()).toEqual([v4('10.0.40.239'), v6('fd12:3456::1')]);
      }
    });

    it('SEC-2506-004: a name with nothing but link-local and metadata records is still refused', async () => {
      const { guard, fetchSpy } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'true' }, METADATA_AND_LINK_LOCAL);

      await expect(guard.safeFetchAdminConfigured('https://auth.home.example/')).rejects.toThrow(
        'Requests to link-local / cloud-metadata addresses are not allowed',
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('SEC-2506-005: an address listed in ALLOW_LINK_LOCAL_IPS stays usable, the rest of 169.254 does not', async () => {
      const { guard } = await guardWith(
        { ALLOW_LINK_LOCAL_IPS: '169.254.1.2' },
        [v4('169.254.169.254'), v4('169.254.1.2'), v4('169.254.1.3'), v6('fe80::1')],
      );

      await guard.safeFetchAdminConfigured('https://keycloak.example.com/');

      expect(pinnedList()).toEqual([v4('169.254.1.2')]);
    });

    it('SEC-2506-006: every redirect hop leaves out its own link-local records and pins what is left', async () => {
      const { guard, lookup, fetchSpy } = await guardWith({}, REPORTED);
      lookup.mockResolvedValueOnce(REPORTED as never).mockResolvedValueOnce(LINK_LOCAL_FIRST as never);
      const pins: unknown[] = [];
      fetchSpy.mockImplementation(async () => {
        pins.push(pinnedList());
        return pins.length === 1
          ? redirectTo('https://second.home.example/')
          : { status: 200, ok: true, headers: new Headers() };
      });

      const res = await guard.safeFetchAdminConfigured('https://auth.home.example/');

      expect(res.status).toBe(200);
      expect(pins).toEqual([[v4('10.0.40.239')], [v4('192.168.178.36')]]);
    });

    it('SEC-2506-007: a redirect to a name with only link-local records is refused before its fetch', async () => {
      const { guard, lookup, fetchSpy } = await guardWith({}, REPORTED);
      lookup.mockResolvedValueOnce(REPORTED as never).mockResolvedValue([v4('169.254.169.254'), v6('fe80::1')] as never);
      fetchSpy.mockResolvedValueOnce(redirectTo('http://metadata.example/latest/meta-data/'));

      await expect(guard.safeFetchAdminConfigured('https://auth.home.example/')).rejects.toThrow(guard.SsrfBlockedError);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('the strict guard (Immich, Synology, AirTrail, Dawarich, document stores, webhooks)', () => {
    it('SEC-2506-010: a LAN name with an fe80:: record works once ALLOW_INTERNAL_NETWORK is on', async () => {
      const { guard, fetchSpy } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'true' }, REPORTED);

      expect(await guard.checkSsrf('https://immich.home.example')).toMatchObject({
        allowed: true, isPrivate: true, resolvedIp: '10.0.40.239', resolvedIps: ['10.0.40.239'],
      });
      await guard.safeFetch('https://immich.home.example/api/users/me');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(pinnedList()).toEqual([v4('10.0.40.239')]);
    });

    it('SEC-2506-011: with the flag off the refusal names ALLOW_INTERNAL_NETWORK, not link-local', async () => {
      const { guard } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'false' }, REPORTED);

      expect(await guard.checkSsrf('https://immich.home.example')).toMatchObject({
        allowed: false, isPrivate: true, resolvedIp: '10.0.40.239', error: expect.stringContaining('ALLOW_INTERNAL_NETWORK'),
      });
    });

    it('SEC-2506-012: loopback, link-local, metadata and the unspecified address never reach the socket', async () => {
      const { guard } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'false' }, [
        v4('127.0.0.1'), v6('::1'), v6('::'), v4('0.0.0.0'), v4('169.254.169.254'), v6('fe80::1'), v6('febf::1'),
        v6('::ffff:127.0.0.1'), v6('::ffff:7f00:1'), v6('::ffff:169.254.169.254'), v6('::ffff:a9fe:a9fe'),
        v6('64:ff9b::a9fe:a9fe'), v4('203.0.113.10'), v6('2001:db8::10'),
      ]);

      expect(await guard.checkSsrf('https://photos.example')).toMatchObject({
        allowed: true, isPrivate: false, resolvedIp: '203.0.113.10', resolvedIps: ['203.0.113.10', '2001:db8::10'],
      });
      await guard.safeFetchFollow('https://photos.example/');

      expect(pinnedList()).toEqual([v4('203.0.113.10'), v6('2001:db8::10')]);
    });

    it('SEC-2506-013: a name whose every record is always blocked is refused as before', async () => {
      const { guard, fetchSpy } = await guardWith(
        { ALLOW_INTERNAL_NETWORK: 'true' },
        [v6('fe80::1'), v4('169.254.169.254'), v4('127.0.0.1'), v6('::1')],
      );

      expect(await guard.checkSsrf('https://photos.example')).toMatchObject({
        allowed: false,
        isPrivate: true,
        resolvedIp: '169.254.169.254',
        error: 'Requests to loopback and link-local addresses are not allowed',
      });
      await expect(guard.safeFetchFollow('https://photos.example/')).rejects.toThrow(guard.SsrfBlockedError);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('SEC-2506-014: a caller that refuses the internal network still refuses the LAN address behind it', async () => {
      const { guard, fetchSpy } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'true' }, REPORTED);

      expect(await guard.checkSsrf('https://x.home.example', true)).toMatchObject({
        allowed: false, isPrivate: true, error: expect.stringContaining('ALLOW_INTERNAL_NETWORK'),
      });
      await expect(guard.safeFetchFollow('https://x.home.example/', undefined, { bypassInternalIpAllowed: true }))
        .rejects.toThrow(guard.SsrfBlockedError);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('SEC-2506-015: a private address beside a public one still decides for the whole name', async () => {
      const { guard } = await guardWith(
        { ALLOW_INTERNAL_NETWORK: 'false' },
        [v6('fe80::1'), v4('203.0.113.10'), v4('10.0.0.5')],
      );

      expect(await guard.checkSsrf('https://split.example')).toMatchObject({
        allowed: false, isPrivate: true, resolvedIp: '10.0.0.5', error: expect.stringContaining('ALLOW_INTERNAL_NETWORK'),
      });
    });

    it('SEC-2506-016: an address listed in ALLOW_LINK_LOCAL_IPS is internal next to an fe80:: record too', async () => {
      const { guard } = await guardWith(
        { ALLOW_LINK_LOCAL_IPS: '169.254.1.2', ALLOW_INTERNAL_NETWORK: 'true' },
        [v6('fe80::1'), v4('169.254.169.254'), v4('169.254.1.2')],
      );

      expect(await guard.checkSsrf('https://immich.example')).toMatchObject({
        allowed: true, isPrivate: true, resolvedIps: ['169.254.1.2'],
      });
      await guard.safeFetch('https://immich.example/');
      expect(pinnedList()).toEqual([v4('169.254.1.2')]);
    });

    // ALLOW_INTERNAL_NETWORK opens ULA and CGNAT space, and the AWS IMDSv6 and
    // Alibaba metadata addresses sit in exactly those ranges. A URL a user typed
    // must not reach what an admin-configured endpoint cannot.
    it('SEC-2506-017: no link-local or metadata spelling reaches the socket, whatever ALLOW_INTERNAL_NETWORK says', async () => {
      const lan = await guardWith(
        { ALLOW_INTERNAL_NETWORK: 'true' },
        [...METADATA_AND_LINK_LOCAL, v4('10.0.40.239'), v6('fd12:3456::1')],
      );
      expect(await lan.guard.checkSsrf('https://immich.home.example')).toMatchObject({
        allowed: true, isPrivate: true, resolvedIp: '10.0.40.239', resolvedIps: ['10.0.40.239', 'fd12:3456::1'],
      });
      await lan.guard.safeFetchFollow('https://immich.home.example/');
      expect(pinnedList()).toEqual([v4('10.0.40.239'), v6('fd12:3456::1')]);

      const pub = await guardWith(
        { ALLOW_INTERNAL_NETWORK: 'false' },
        [...METADATA_AND_LINK_LOCAL, v4('203.0.113.10'), v6('2001:db8::10')],
      );
      expect(await pub.guard.checkSsrf('https://photos.example')).toMatchObject({
        allowed: true, isPrivate: false, resolvedIps: ['203.0.113.10', '2001:db8::10'],
      });
      await pub.guard.safeFetchFollow('https://photos.example/');
      expect(pinnedList()).toEqual([v4('203.0.113.10'), v6('2001:db8::10')]);
    });

    it.each([
      ['AWS IMDSv6', 'fd00:ec2::254'],
      ['Alibaba metadata', '100.100.100.200'],
      ['Alibaba DNS', '100.100.100.100'],
      ['Alibaba metadata, IPv4-mapped', '::ffff:100.100.100.200'],
      ['metadata, IPv4-compatible', '::169.254.169.254'],
    ])('SEC-2506-018: %s (%s) is refused beside an fe80:: record even with ALLOW_INTERNAL_NETWORK on', async (_label, ip) => {
      const record = ip.includes(':') ? v6(ip) : v4(ip);
      for (const answer of [[v6('fe80::1'), record], [record]]) {
        const { guard, fetchSpy } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'true' }, answer);

        expect(await guard.checkSsrf('https://photos.example')).toMatchObject({
          allowed: false, error: 'Requests to loopback and link-local addresses are not allowed',
        });
        await expect(guard.safeFetchFollow('https://photos.example/')).rejects.toThrow(guard.SsrfBlockedError);
        await expect(guard.safeFetchAdminConfigured('https://photos.example/')).rejects.toThrow(guard.SsrfBlockedError);
        expect(fetchSpy).not.toHaveBeenCalled();
      }
    });

    it('SEC-2506-019: a metadata record beside a LAN address is left out and the LAN address pinned', async () => {
      const { guard } = await guardWith({ ALLOW_INTERNAL_NETWORK: 'true' }, [v6('fd00:ec2::254'), v4('10.0.0.5')]);

      expect(await guard.checkSsrf('https://nas.home.example')).toMatchObject({
        allowed: true, isPrivate: true, resolvedIp: '10.0.0.5', resolvedIps: ['10.0.0.5'],
      });
      await guard.safeFetch('https://nas.home.example/');
      expect(pinnedList()).toEqual([v4('10.0.0.5')]);
    });
  });
});
