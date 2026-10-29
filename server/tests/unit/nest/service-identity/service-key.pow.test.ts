/**
 * The registration proof of work, against the vector the issuer checks with:
 * scrypt(c + "." + nonce, "trek-pow-v1", N, r, p, 32 bytes), at least `bits`
 * leading zero bits.
 */
import { leadingZeroBits, powHash, solvePow } from '../../../../src/nest/service-identity/service-key.pow';
import type { ServiceChallenge } from '@trek/shared';

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const { pow } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'fixtures', 'service-identity', 'tk1-vectors.json'), 'utf8'),
) as {
  pow: {
    c: string;
    N: number;
    r: number;
    p: number;
    bits: number;
    valid_nonce: string;
    hash_hex: string;
    invalid_nonce: string;
  };
};

describe('powHash against the shared vector', () => {
  it('SIPOW-001: hashes the valid nonce to the published hash, which meets the target', async () => {
    const hash = await powHash(pow.c, pow.valid_nonce, pow);
    expect(hash.toString('hex')).toBe(pow.hash_hex);
    expect(leadingZeroBits(hash)).toBeGreaterThanOrEqual(pow.bits);
  });

  it('SIPOW-002: the next nonce misses the target', async () => {
    expect(leadingZeroBits(await powHash(pow.c, pow.invalid_nonce, pow))).toBeLessThan(pow.bits);
  });
});

describe('leadingZeroBits', () => {
  it.each([
    [[0x80], 0],
    [[0x01], 7],
    [[0x00, 0x40], 9],
    [[0x00, 0x00], 16],
  ])('SIPOW-010: counts %j as %i', (bytes, bits) => {
    expect(leadingZeroBits(Uint8Array.from(bytes))).toBe(bits);
  });
});

describe('solvePow', () => {
  const cheap: ServiceChallenge = { c: 'v1.cheap', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 4, expires_at: 1 };

  it('SIPOW-020: finds the first nonce that meets the target, at low difficulty', async () => {
    const nonce = await solvePow(cheap, Date.now() + 60_000);
    expect(nonce).toMatch(/^\d+$/);
    expect(leadingZeroBits(await powHash(cheap.c, nonce, cheap))).toBeGreaterThanOrEqual(cheap.bits);
    for (let earlier = 0; earlier < Number(nonce); earlier++) {
      expect(leadingZeroBits(await powHash(cheap.c, String(earlier), cheap))).toBeLessThan(cheap.bits);
    }
  });

  it('SIPOW-021: gives up once the challenge has expired', async () => {
    await expect(solvePow({ ...cheap, bits: 24 }, Date.now() - 1)).rejects.toThrow(/expired/);
  });
});
