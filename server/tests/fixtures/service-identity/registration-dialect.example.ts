/**
 * A registration dialect written by hand for TREK's tests. It has the shape of
 * the modules the issuer writes for each release (the exports, the paths, a
 * tag in a header, helpers with loops), so the release check and the key
 * service can be tested against a dialect that is not the committed one, but
 * it is none of the issuer's and shows nothing of how they are made.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, createHmac } from 'node:crypto';
import { crc32 } from 'node:zlib';

const DIALECT = 'HandWritten1';
const PEPPER = Buffer.from('7472656b2d746573742d6469616c656374', 'hex');

function withChecksum(input: Buffer): Buffer {
  const out = Buffer.alloc(input.length + 4);
  input.copy(out);
  out.writeUInt32BE(crc32(input), input.length);
  return out;
}

function backwards(input: Buffer): Buffer {
  const out: number[] = [];
  for (let i = input.length - 1; i >= 0; i--) out.push(input.readUInt8(i) ^ (i & 0xff));
  return Buffer.from(out);
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '9.9.9',
  createdAt: '2026-10-29',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random, nowSeconds }) {
    const c = Buffer.from(challenge.c, 'utf8');
    const salt = createHmac('sha256', PEPPER).update(c).digest();
    return {
      work(nonce) {
        const joined = Buffer.concat([c, Buffer.from(`.${nonce}.`), Buffer.from(version, 'utf8'), random]);
        return { password: backwards(withChecksum(createHash('sha512').update(joined).digest())), salt };
      },
      request(nonce) {
        const seal = createHmac('sha256', random).update(`${challenge.c}|${nonce}|${nowSeconds}`).digest();
        return {
          body: {
            ticket: challenge.c,
            count: String(nonce),
            release: version,
            lantern: random.toString('base64url'),
            sentAt: nowSeconds,
          },
          headers: { 'X-TREK-Test-Seal': seal.toString('hex') },
        };
      },
    };
  },
};

/** Fixed inputs and what this module makes of them. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.HandWritten1', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '9.9.9',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: 'cf7d2be18b531a1a1f2427ce744cd1bd7b18ae731e1449ac56c827e7a683da51',
  saltSha256: '005cc836f9d0a082e0c3712401f1d95515b6066855e8f10533353b6eb0e76f3d',
  scrypt: '5fd715b7942b9bc9ccee9b811b5566d31aa7ca6d3a011222fe3101d6178d4396',
  requestSha256: '2b41dc94a997e22cecc7bb946889208fc86c8dff0f5e30075a2fcee28239f0b8',
};
