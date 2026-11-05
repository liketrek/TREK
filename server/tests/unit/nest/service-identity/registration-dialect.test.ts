/**
 * The registration dialect: the module this build carries, and a dialect
 * written by hand in the shape of the issuer's (a tag in a header, helpers).
 * Each must compute what the issuer computed for its fixed inputs (SELF_CHECK),
 * and its requests must be ones the issuer client lets out, so a dialect that
 * reaches main is one TREK can run.
 */
import { IssuerClient } from '../../../../src/nest/service-identity/issuer.client';
import * as committed from '../../../../src/nest/service-identity/registration-dialect';
import type {
  DialectInputs,
  DialectSelfCheck,
  RegistrationDialect,
} from '../../../../src/nest/service-identity/registration-dialect.types';
import { leadingZeroBits, powHash, solvePow } from '../../../../src/nest/service-identity/service-key.pow';
import * as example from '../../../fixtures/service-identity/registration-dialect.example';

import { createHash, scryptSync } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/ssrfGuard')>()),
  safeFetch,
}));

beforeEach(() => safeFetch.mockReset());

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

function inputsOf(check: DialectSelfCheck): DialectInputs {
  return {
    challenge: check.challenge,
    version: check.version,
    random: Buffer.from(check.random, 'hex'),
    nowSeconds: check.nowSeconds,
  };
}

const modules: [string, { registrationDialect: RegistrationDialect; SELF_CHECK: DialectSelfCheck }][] = [
  ['the committed dialect', committed],
  ['a hand-written dialect', example],
];

describe.each(modules)('%s', (_, { registrationDialect: dialect, SELF_CHECK: check }) => {
  it('SIDIA-001: computes the password, salt and proof of work the issuer computed', () => {
    const { password, salt } = dialect.begin(inputsOf(check)).work(check.nonce);
    expect(sha256(password)).toBe(check.inputSha256);
    expect(sha256(salt)).toBe(check.saltSha256);
    const { N, r, p } = check.challenge;
    expect(scryptSync(password, salt, 32, { N, r, p }).toString('hex')).toBe(check.scrypt);
  });

  it('SIDIA-002: sends the request the issuer expects', () => {
    const { body, headers } = dialect.begin(inputsOf(check)).request(check.nonce);
    expect(sha256(JSON.stringify({ body, headers }))).toBe(check.requestSha256);
  });

  it('SIDIA-003: gives the same answer for the same inputs, whenever it is asked', () => {
    const first = dialect.begin(inputsOf(check));
    const second = dialect.begin(inputsOf(check));
    expect(second.work(check.nonce)).toEqual(first.work(check.nonce));
    expect(second.request(check.nonce)).toEqual(first.request(check.nonce));
    expect(first.work(check.nonce + 1).password).not.toEqual(first.work(check.nonce).password);
  });

  it('SIDIA-004: names itself as the issuer and the release job expect', () => {
    expect(dialect.id).toMatch(/^(0|[A-Za-z0-9_-]{12})$/);
    expect(dialect.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(dialect.createdAt))).toBe(false);
    expect(dialect.releasedFor).toMatch(/^(dev|\d+\.\d+\.\d+(-pre\.\d+)?)$/);
  });

  it('SIDIA-005: its challenge and registration go out through the issuer client', async () => {
    const challenge = { ...check.challenge, expires_at: 1_900_000_000 };
    safeFetch.mockResolvedValueOnce(json(challenge));
    const issuer = new IssuerClient();
    await issuer.challenge(dialect.challengePath);
    expect(safeFetch.mock.calls.at(-1)?.[0]).toBe(`https://places.liketrek.com${dialect.challengePath}`);

    const grant = { key: 'tk1.a.b.c', exp: 1_800_776_000, renew_after: 1_798_184_000 };
    safeFetch.mockResolvedValueOnce(json(grant, 201));
    const request = dialect.begin(inputsOf(check)).request(2 ** 40);
    await expect(issuer.register(dialect.registerPath, request)).resolves.toMatchObject({ body: grant });
    const [url, init] = safeFetch.mock.calls.at(-1) ?? [];
    expect(url).toBe(`https://places.liketrek.com${dialect.registerPath}`);
    expect(JSON.parse(String(init.body))).toEqual(request.body);
    for (const [name, value] of Object.entries(request.headers)) expect(init.headers[name]).toBe(value);
  });

  it('SIDIA-006: a proof of work can be found in it', async () => {
    const challenge = { ...check.challenge, bits: 4 };
    const attempt = dialect.begin(inputsOf({ ...check, challenge }));
    const nonce = await solvePow(challenge, attempt, Date.now() + 60_000);
    expect(leadingZeroBits(await powHash(attempt.work(nonce), challenge))).toBeGreaterThanOrEqual(4);
  });
});
