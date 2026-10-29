import type { ServiceChallenge } from '@trek/shared';

import { scrypt } from 'node:crypto';

const SALT = 'trek-pow-v1';
const HASH_BYTES = 32;

type ScryptCost = Pick<ServiceChallenge, 'N' | 'r' | 'p'>;

/** scrypt(c + "." + nonce, "trek-pow-v1"), off the event loop. */
export function powHash(challenge: string, nonce: string, cost: ScryptCost): Promise<Buffer> {
  const { N, r, p } = cost;
  // Twice what scrypt needs, so Node's 32 MB default never refuses a valid challenge.
  const maxmem = 2 * 128 * N * r + 128 * r * p;
  return new Promise((resolve, reject) => {
    scrypt(`${challenge}.${nonce}`, SALT, HASH_BYTES, { N, r, p, maxmem }, (err, hash) =>
      err ? reject(err) : resolve(hash),
    );
  });
}

export function leadingZeroBits(hash: Uint8Array): number {
  let bits = 0;
  for (const byte of hash) {
    if (byte !== 0) return bits + Math.clz32(byte) - 24;
    bits += 8;
  }
  return bits;
}

/** The first decimal nonce whose hash has at least `bits` leading zero bits, tried until `deadlineMs`. */
export async function solvePow(challenge: ServiceChallenge, deadlineMs: number): Promise<string> {
  for (let nonce = 0; Date.now() < deadlineMs; nonce++) {
    const hash = await powHash(challenge.c, String(nonce), challenge);
    if (leadingZeroBits(hash) >= challenge.bits) return String(nonce);
  }
  throw new Error('the registration challenge expired before it was solved');
}
