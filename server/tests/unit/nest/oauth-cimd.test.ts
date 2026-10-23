/**
 * Client ID Metadata Documents: the client_id URL rules, the document checks
 * and the resolver's cache, rate limits and fetch options. The fetch itself is
 * stubbed at the SSRF guard; OauthService's use of the resolver is covered in
 * oauth.service.test.ts.
 */
import { DEFAULT_CLIENT_SCOPES } from '../../../src/mcp/scopes';
import type { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import {
  CimdClientResolver,
  isCimdClientId,
  parseCimdClientId,
  toCimdClient,
} from '../../../src/nest/oauth/oauth-cimd';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetchFollow } = vi.hoisted(() => ({ safeFetchFollow: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetchFollow }));

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

const CLIENT_ID = 'https://claude.ai/oauth/mcp-client-metadata';
const CALLBACK = 'https://claude.ai/api/mcp/auth_callback';

function doc(overrides: Record<string, unknown> = {}) {
  return {
    client_id: CLIENT_ID,
    client_name: 'Claude',
    redirect_uris: [CALLBACK],
    token_endpoint_auth_method: 'none',
    scope: 'trips:read trips:write',
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function makeResolver(allowed: (bucket: string) => boolean = () => true) {
  const check = vi.fn((bucket: string) => Promise.resolve(allowed(bucket)));
  return { resolver: new CimdClientResolver({ check } as unknown as RateLimitService), check };
}

beforeEach(() => {
  safeFetchFollow.mockReset();
  logMock.logWarn.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('client_id URL rules', () => {
  it('CIMD-URL-001: only https ids are metadata documents', () => {
    expect(isCimdClientId(CLIENT_ID)).toBe(true);
    expect(isCimdClientId('3f2c7a52-9d1e-4f1b-8c55-0f6f0c1d2e3a')).toBe(false);
    expect(isCimdClientId('http://claude.ai/oauth/meta')).toBe(false);
  });

  it('CIMD-URL-002: accepts a canonical https URL with a path and a query', () => {
    expect(parseCimdClientId(CLIENT_ID)?.host).toBe('claude.ai');
    expect(parseCimdClientId('https://client.example/meta.json?v=2')).not.toBeNull();
  });

  it.each([
    ['no path', 'https://claude.ai/'],
    ['a bare origin', 'https://claude.ai'],
    ['a fragment', 'https://claude.ai/meta#x'],
    ['credentials', 'https://user:pw@claude.ai/meta'],
    ['a dot segment', 'https://claude.ai/a/../meta'],
    ['an encoded dot segment', 'https://claude.ai/a/%2e%2e/meta'],
    ['a non-canonical host', 'https://Claude.AI/meta'],
    ['the default port spelled out', 'https://claude.ai:443/meta'],
    ['not a URL', 'https://'],
  ])('CIMD-URL-003: refuses %s', (_label, id) => {
    expect(parseCimdClientId(id)).toBeNull();
  });
});

describe('toCimdClient', () => {
  const url = new URL(CLIENT_ID);

  it('CIMD-DOC-001: maps a valid document to a public client', () => {
    expect(toCimdClient(url, doc())).toEqual({
      clientId: CLIENT_ID,
      host: 'claude.ai',
      name: 'Claude',
      redirectUris: [CALLBACK],
      scopes: ['trips:read', 'trips:write'],
    });
  });

  it('CIMD-DOC-002: no scope means the safe default set, unknown scopes are dropped, no name means the host', () => {
    const client = toCimdClient(url, doc({ scope: undefined, client_name: undefined }));
    expect(client?.scopes).toEqual(DEFAULT_CLIENT_SCOPES);
    expect(client?.name).toBe('claude.ai');
    expect(toCimdClient(url, doc({ scope: 'trips:read admin:everything' }))?.scopes).toEqual(['trips:read']);
  });

  it.each([
    ['a client_id of another URL', doc({ client_id: 'https://evil.example/meta' })],
    ['a client secret', doc({ client_secret: 's3cret' })],
    ['a confidential auth method', doc({ token_endpoint_auth_method: 'client_secret_post' })],
    ['a script redirect URI', doc({ redirect_uris: ['javascript:alert(1)'] })],
    ['plain http to a remote host', doc({ redirect_uris: ['http://claude.ai/cb'] })],
    ['no redirect URIs', doc({ redirect_uris: [] })],
    ['only unknown scopes', doc({ scope: 'admin:everything' })],
    ['a name past 100 characters', doc({ client_name: 'x'.repeat(101) })],
    ['something that is not an object', 'not json'],
  ])('CIMD-DOC-003: refuses %s and says why in the log', (_label, body) => {
    expect(toCimdClient(url, body)).toBeNull();
    expect(logMock.logWarn).toHaveBeenCalledWith(expect.stringContaining(`${CLIENT_ID} refused`));
  });
});

describe('CimdClientResolver', () => {
  it('CIMD-RES-001: fetches through the SSRF guard without redirects, with a deadline and a size cap', async () => {
    safeFetchFollow.mockResolvedValue(jsonResponse(doc()));
    const { resolver } = makeResolver();
    expect((await resolver.resolve(CLIENT_ID))?.name).toBe('Claude');
    expect(safeFetchFollow).toHaveBeenCalledWith(
      CLIENT_ID,
      { headers: { Accept: 'application/json' } },
      { timeoutMs: 5000, maxBytes: 16 * 1024, maxRedirects: 0, bypassInternalIpAllowed: true },
    );
  });

  it('CIMD-RES-002: a resolved document is cached for a day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-21T08:00:00.000Z'));
    safeFetchFollow.mockImplementation(() => Promise.resolve(jsonResponse(doc())));
    const { resolver } = makeResolver();
    await resolver.resolve(CLIENT_ID);
    vi.setSystemTime(new Date('2026-10-22T07:59:00.000Z'));
    await resolver.resolve(CLIENT_ID);
    expect(safeFetchFollow).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date('2026-10-22T08:00:01.000Z'));
    await resolver.resolve(CLIENT_ID);
    expect(safeFetchFollow).toHaveBeenCalledTimes(2);
  });

  it('CIMD-RES-003: a failed fetch is remembered for a minute only', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-21T08:00:00.000Z'));
    safeFetchFollow.mockImplementation(() => Promise.resolve(jsonResponse({}, 404)));
    const { resolver } = makeResolver();
    expect(await resolver.resolve(CLIENT_ID)).toBeNull();
    expect(await resolver.resolve(CLIENT_ID)).toBeNull();
    expect(safeFetchFollow).toHaveBeenCalledTimes(1);
    expect(logMock.logWarn).toHaveBeenCalledWith(expect.stringContaining('HTTP 404'));
    vi.setSystemTime(new Date('2026-10-21T08:01:01.000Z'));
    await resolver.resolve(CLIENT_ID);
    expect(safeFetchFollow).toHaveBeenCalledTimes(2);
  });

  it('CIMD-RES-004: a blocked or failing fetch is logged and resolves to null', async () => {
    safeFetchFollow.mockRejectedValue(new Error('Requests to loopback and link-local addresses are not allowed'));
    const { resolver } = makeResolver();
    expect(await resolver.resolve(CLIENT_ID)).toBeNull();
    expect(logMock.logWarn).toHaveBeenCalledWith(expect.stringContaining('loopback'));
  });

  it('CIMD-RES-005: concurrent lookups of one id share a single fetch', async () => {
    safeFetchFollow.mockImplementation(() => Promise.resolve(jsonResponse(doc())));
    const { resolver } = makeResolver();
    const [a, b] = await Promise.all([resolver.resolve(CLIENT_ID), resolver.resolve(CLIENT_ID)]);
    expect(a).toEqual(b);
    expect(safeFetchFollow).toHaveBeenCalledTimes(1);
  });

  it('CIMD-RES-006: a malformed id is refused before any fetch or rate-limit hit', async () => {
    const { resolver, check } = makeResolver();
    expect(await resolver.resolve('https://claude.ai/')).toBeNull();
    expect(await resolver.resolve('not-a-url')).toBeNull();
    expect(check).not.toHaveBeenCalled();
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it.each(['oauth_cimd_host', 'oauth_cimd'])(
    'CIMD-RES-007: over the %s budget nothing is fetched, and the refusal is not cached',
    async (bucket) => {
      safeFetchFollow.mockImplementation(() => Promise.resolve(jsonResponse(doc())));
      let limited = true;
      const { resolver, check } = makeResolver((b) => !(limited && b === bucket));
      expect(await resolver.resolve(CLIENT_ID)).toBeNull();
      expect(safeFetchFollow).not.toHaveBeenCalled();
      expect(check).toHaveBeenCalledWith('oauth_cimd_host', 'claude.ai', 10, 60_000, expect.any(Number));
      limited = false;
      expect((await resolver.resolve(CLIENT_ID))?.name).toBe('Claude');
    },
  );
});
