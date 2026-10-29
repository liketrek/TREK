/**
 * IssuerClient: the four calls to the key issuer, each bounded in time and
 * size, each answer read through its schema, and every refusal turned into
 * an IssuerError that says how long to wait.
 */
import { IssuerClient, IssuerError } from '../../../../src/nest/service-identity/issuer.client';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/ssrfGuard')>()),
  safeFetch,
}));

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

const GRANT = { key: 'tk1.a.b.c', exp: 1_800_776_000, renew_after: 1_798_184_000 };
const issuer = new IssuerClient();

beforeEach(() => safeFetch.mockReset());

function lastCall(): { url: string; init: RequestInit & { headers: Record<string, string> }; options: unknown } {
  const [url, init, options] = safeFetch.mock.calls.at(-1) ?? [];
  return { url, init, options };
}

describe('IssuerClient', () => {
  it('SIISS-001: asks for a challenge, with a deadline and a small size cap', async () => {
    const challenge = { c: 'v1.x', alg: 'scrypt', N: 16_384, r: 8, p: 1, bits: 6, expires_at: 1_793_000_600 };
    safeFetch.mockResolvedValueOnce(json(challenge, 200, { Date: 'Thu, 29 Oct 2026 12:00:00 GMT' }));
    const answer = await issuer.challenge();
    expect(answer).toEqual({ body: challenge, serverMs: Date.parse('2026-10-29T12:00:00Z') });
    const { url, init, options } = lastCall();
    expect(url).toBe('https://places.liketrek.com/v1/register/challenge');
    expect(init.method).toBe('GET');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers['User-Agent']).toMatch(/^TREK\//);
    expect(init.headers).not.toHaveProperty('Authorization');
    expect(options).toEqual({ maxBytes: 4096 });
  });

  it('SIISS-002: registers with the solved challenge and the version as JSON', async () => {
    safeFetch.mockResolvedValueOnce(json(GRANT, 201));
    expect((await issuer.register({ c: 'v1.x', nonce: '17', v: '5.1.0' })).body).toEqual(GRANT);
    const { url, init } = lastCall();
    expect(url).toBe('https://places.liketrek.com/v1/register');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual({ c: 'v1.x', nonce: '17', v: '5.1.0' });
  });

  it('SIISS-003: renews and reads the allowance with the key as bearer, the legacy pool without one', async () => {
    safeFetch.mockResolvedValueOnce(json(GRANT));
    await issuer.renew('tk1.old.key.sig');
    expect(lastCall().url).toBe('https://places.liketrek.com/v1/register/renew');
    expect(lastCall().init.headers.Authorization).toBe('Bearer tk1.old.key.sig');

    const quota = { tier: 'legacy', limit: 3000, used: 3, remaining: 2997, reset_at: 1_793_059_200, per_minute: 60 };
    safeFetch.mockResolvedValueOnce(json(quota));
    expect((await issuer.quota('https://places.liketrek.com', null)).body).toEqual(quota);
    expect(lastCall().url).toBe('https://places.liketrek.com/v1/quota');
    expect(lastCall().init.headers).not.toHaveProperty('Authorization');
  });

  it('SIISS-006: reads the allowance of another liketrek host at its own /v1/quota', async () => {
    const quota = { tier: 'std', limit: 20_000, used: 5, remaining: 19_995, reset_at: 1_793_059_200, per_minute: 120 };
    safeFetch.mockResolvedValueOnce(json(quota));
    expect((await issuer.quota('https://valhalla.liketrek.com', 'tk1.a.b.c')).body).toEqual(quota);
    expect(lastCall().url).toBe('https://valhalla.liketrek.com/v1/quota');
    expect(lastCall().init.headers.Authorization).toBe('Bearer tk1.a.b.c');
  });

  it('SIISS-004: turns a refusal into an IssuerError with the wait it asked for', async () => {
    safeFetch.mockResolvedValueOnce(json({ error: 'slow_down' }, 429, { 'Retry-After': '90' }));
    const err = await issuer.challenge().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(IssuerError);
    expect(err).toMatchObject({ status: 429, retryAfterMs: 90_000 });
  });

  it('SIISS-005: refuses an answer that does not fit its schema', async () => {
    safeFetch.mockResolvedValueOnce(json({ key: 42 }));
    await expect(issuer.renew('tk1.a.b.c')).rejects.toThrow();
  });
});
