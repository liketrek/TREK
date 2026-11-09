/**
 * How TREK 5.1.2 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, createHmac, hkdfSync } from 'node:crypto';

const DIALECT = 'MFB4wDFbWlov';
const ZINNIA_LANTERN = Buffer.from('0eb4b15eba99bcd9f2624fead1e5e041a4cffd6485ca8740c26b92cd9ab42910', 'hex');

function plateau6(input: Buffer, size: number): Buffer {
  const out = Buffer.alloc(size);
  input.forEach((byte, i) => out.writeUInt8(out.readUInt8(i % size) ^ byte, i % size));
  return out;
}

function cedar(alg: string, data: Buffer): Buffer {
  return createHash(alg).update(data).digest();
}

function barrel(value: number): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64LE(BigInt(value));
  return out;
}

function vessel(part: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(part.length);
  return Buffer.concat([head, part]);
}

function crater(value: number): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64BE(BigInt(value));
  return out;
}

function jade(alg: string, key: Buffer, data: Buffer): Buffer {
  return createHmac(alg, key).update(data).digest();
}

function nest(input: Buffer, width: number): Buffer {
  const out = Buffer.from(input);
  for (let i = 0; i + width <= out.length; i += width) out.subarray(i, i + width).reverse();
  return out;
}

function ticket(a: Buffer, b: Buffer): Buffer {
  const parts: Buffer[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) parts.push(a.subarray(i, i + 1), b.subarray(i, i + 1));
  return Buffer.concat(parts);
}

function island(alg: string, size: number, data: Buffer): Buffer {
  return createHash(alg, { outputLength: size }).update(data).digest();
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.1.2',
  createdAt: '2026-11-09',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random, nowSeconds }) {
    const fern = Buffer.from(challenge.c, 'utf8');
    const jetty = Buffer.from(version, 'utf8');
    const echo = createHash('sha256').update(fern).digest();
    const petal = Buffer.concat([ZINNIA_LANTERN.subarray(14, 32), fern, jetty, random.subarray(9, 13)]);
    const storm = Buffer.concat([petal.subarray(4 % petal.length), petal.subarray(0, 4 % petal.length)]);
    const plateau = Buffer.from(storm).reverse();
    const mill = Buffer.from(hkdfSync('sha384', plateau, echo, Buffer.from('3a79e850344e169208', 'hex'), 0x18));
    return {
      work(nonce) {
        const bamboo = Buffer.concat([
          vessel(fern), vessel(jetty), vessel(barrel(nonce)), vessel(ZINNIA_LANTERN.subarray(7, 27)),
          vessel(Buffer.from(String(nowSeconds), 'utf8')), vessel(random),
        ]);
        const pasture = nest(bamboo, 4);
        const umber = island('shake128', 35, pasture);
        const reef = plateau6(umber, 32);
        const moss = nest(reef, 4);
        return { password: moss, salt: mill };
      },
      request(nonce) {
        const zinnia5 = Buffer.from([0xa8]);
        const olive = Buffer.concat([
          fern, zinnia5, Buffer.from(`${nowSeconds}`), zinnia5, crater(nonce), zinnia5, ZINNIA_LANTERN.subarray(9, 16),
          zinnia5, random, zinnia5, jetty,
        ]);
        const bale = ticket(olive, echo);
        const olive6 = jade('sha3-256', jetty, bale);
        const brook = cedar('sha3-256', olive6);
        return {
          body: {
            'kelp-petal': version,
            canoe: challenge.c,
            pepper: random.toString('hex'),
            'glacier-ferry': nowSeconds.toString(),
            'linden-ridge': nonce.toString(),
          },
          headers: { 'X-TREK-Mist-Acorn': brook.toString('hex') },
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.MFB4wDFbWlov', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.1.2',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: '2d1a46dce1ca69e981e1784ec1533e2b495eccfaeb399f20418c55c509460938',
  saltSha256: 'f8f01b58c5140199b3b259f2cba1a6eb19d2783c0b519afc39310d2f11c9787e',
  scrypt: '2a0a02e0a17365b24727aea936466a0561eb65bcd4fb21f33aea9b74a6326e68',
  requestSha256: 'd7663256c3593f171e27f899081ae52ff7c95619cd8cd22bd0e8113b724d83cf',
};
