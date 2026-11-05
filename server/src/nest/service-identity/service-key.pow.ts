import type { DialectAttempt, ProofInput } from './registration-dialect.types';
import type { ServiceChallenge } from '@trek/shared';

import { scrypt } from 'node:crypto';

const HASH_BYTES = 32;

type ScryptCost = Pick<ServiceChallenge, 'N' | 'r' | 'p'>;

/** scrypt over what the dialect made of one nonce, off the event loop. */
export function powHash(input: ProofInput, cost: ScryptCost): Promise<Buffer> {
  const { N, r, p } = cost;
  // Twice what scrypt needs, so Node's 32 MB default never refuses a valid challenge.
  const maxmem = 2 * 128 * N * r + 128 * r * p;
  return new Promise((resolve, reject) => {
    scrypt(input.password, input.salt, HASH_BYTES, { N, r, p, maxmem }, (err, hash) =>
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

/** The first nonce whose hash has at least `bits` leading zero bits, tried until `deadlineMs`. */
export function solvePow(challenge: ServiceChallenge, attempt: DialectAttempt, deadlineMs: number): Promise<number> {
  return firstNonceFrom(0, challenge, attempt, deadlineMs);
}

async function firstNonceFrom(
  nonce: number,
  challenge: ServiceChallenge,
  attempt: DialectAttempt,
  deadlineMs: number,
): Promise<number> {
  if (Date.now() >= deadlineMs) throw new Error('the registration challenge expired before it was solved');
  const hash = await powHash(attempt.work(nonce), challenge);
  if (leadingZeroBits(hash) >= challenge.bits) return nonce;
  return firstNonceFrom(nonce + 1, challenge, attempt, deadlineMs);
}
