/**
 * The four OIDC provider calls go through the SSRF guard.
 *
 * Three of them are worse than they look: `discover` fetches a URL an admin
 * configured, but the token, userinfo and JWKS URLs come out of the RESPONSE to
 * that first call. They are chosen by the other end, not by anyone here, and
 * until now all four went to a bare `fetch`.
 *
 * Deliberately a separate file. oidc.service.test.ts stubs global fetch and
 * mocks the guard away so it can test OIDC logic; that is the right trade there
 * and it is also exactly why the guard needs pinning somewhere it is not mocked.
 *
 * safeFetchAdminConfigured rather than safeFetch: a self-hoster running Authentik
 * on http://localhost:9000 must keep working, so loopback and LAN stay allowed
 * while link-local and the cloud-metadata range never are.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = readFileSync(
  join(__dirname, '../../../src/nest/oidc/oidc.service.ts'),
  'utf8',
);

describe('OIDC outbound calls', () => {
  it('OIDC-SSRF-001: no bare fetch( is left in the service', () => {
    // A grep, and that is the point: the failure this prevents is somebody adding
    // a fifth provider call next year with the same `await fetch(...)` the other
    // four used to have. A behavioural test would only cover the four that exist.
    const bare = SOURCE.split('\n')
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      .filter(({ line }) => /\bawait fetch\(|[^.\w]fetch\(/.test(line) && !line.startsWith('*'));

    expect(bare.map((b) => `${b.n}: ${b.line.slice(0, 70)}`)).toEqual([]);
  });

  it('OIDC-SSRF-002: all four calls name the guard', () => {
    const guarded = SOURCE.match(/safeFetchAdminConfigured\(/g) ?? [];

    // discover, exchangeCodeForToken, getUserInfo, fetchJwks.
    expect(guarded).toHaveLength(4);
  });

  it('OIDC-SSRF-003: the token exchange follows no redirect at all', () => {
    // A redirect there would hand client_secret to a second host, and the
    // platform default is to follow. The third argument is the hop budget.
    const tokenCall = /safeFetchAdminConfigured\(\s*doc\.token_endpoint[\s\S]*?\}\s*,\s*0\s*\)/.test(SOURCE);

    expect(tokenCall).toBe(true);
  });
});
